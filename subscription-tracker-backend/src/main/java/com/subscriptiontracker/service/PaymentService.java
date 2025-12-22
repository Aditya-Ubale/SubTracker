package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.*;
import com.subscriptiontracker.entity.*;
import com.subscriptiontracker.exception.BadRequestException;
import com.subscriptiontracker.exception.ResourceNotFoundException;
import com.subscriptiontracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private WatchlistRepository watchlistRepository;

    // Test card numbers for simulated payments
    private static final String SUCCESS_CARD = "4111111111111111";
    private static final String FAILURE_CARD = "4000000000000002";
    private static final String DECLINE_CARD = "4000000000000069";

    /**
     * Initiate a new payment
     */
    @Transactional
    public PaymentResponse initiatePayment(InitiatePaymentRequest request) {
        User user = authService.getCurrentUser();

        Subscription subscription = subscriptionRepository.findById(request.getSubscriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", request.getSubscriptionId()));

        // Get price from plan or subscription
        Double amount = 0.0;
        String planName = null;

        if (request.getPlanId() != null) {
            SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                    .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", request.getPlanId()));
            amount = plan.getPriceMonthly();
            planName = plan.getPlanName();

            if ("YEARLY".equalsIgnoreCase(request.getSubscriptionType())) {
                amount = plan.getPriceYearly() != null ? plan.getPriceYearly() : amount * 12 * 0.8;
            }
        } else {
            amount = subscription.getPriceMonthly() != null ? subscription.getPriceMonthly() : 0.0;
            if ("YEARLY".equalsIgnoreCase(request.getSubscriptionType())) {
                amount = subscription.getPriceYearly() != null ? subscription.getPriceYearly() : amount * 12 * 0.8; // 20%
                                                                                                                    // discount
                                                                                                                    // for
                                                                                                                    // yearly
            }
        }

        // Generate unique transaction ID
        String transactionId = "TXN_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .transactionId(transactionId)
                .user(user)
                .subscription(subscription)
                .planId(request.getPlanId())
                .amount(amount)
                .currency("INR")
                .status(Payment.PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .subscriptionType(request.getSubscriptionType())
                .build();

        payment = paymentRepository.save(payment);

        return buildPaymentResponse(payment, subscription, planName);
    }

    /**
     * Process payment (simulated test gateway)
     */
    @Transactional
    public PaymentResponse processPayment(ProcessPaymentRequest request) {
        Long userId = authService.getCurrentUserId();

        Payment payment = paymentRepository.findByTransactionId(request.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!payment.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to payment");
        }

        if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
            throw new BadRequestException("Payment already processed");
        }

        // Update status to processing
        payment.setStatus(Payment.PaymentStatus.PROCESSING);
        paymentRepository.save(payment);

        // Simulate payment processing based on card number or method
        boolean isSuccess = simulatePayment(request, payment);

        if (isSuccess) {
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
            payment.setCompletedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Add subscription to user
            addSubscriptionToUser(payment);

            // Remove from wishlist after successful purchase
            removeFromWishlist(payment.getUser().getId(), payment.getSubscription().getId());
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason(getFailureReason(request));
            paymentRepository.save(payment);
        }

        Subscription subscription = payment.getSubscription();
        String planName = null;
        if (payment.getPlanId() != null) {
            planName = subscriptionPlanRepository.findById(payment.getPlanId())
                    .map(SubscriptionPlan::getPlanName)
                    .orElse(null);
        }

        return buildPaymentResponse(payment, subscription, planName);
    }

    /**
     * Get payment status by transaction ID
     */
    public PaymentResponse getPaymentStatus(String transactionId) {
        Long userId = authService.getCurrentUserId();

        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!payment.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to payment");
        }

        Subscription subscription = payment.getSubscription();
        String planName = null;
        if (payment.getPlanId() != null) {
            planName = subscriptionPlanRepository.findById(payment.getPlanId())
                    .map(SubscriptionPlan::getPlanName)
                    .orElse(null);
        }

        return buildPaymentResponse(payment, subscription, planName);
    }

    /**
     * Get user's payment history
     */
    public List<PaymentResponse> getPaymentHistory() {
        Long userId = authService.getCurrentUserId();
        List<Payment> payments = paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return payments.stream()
                .map(payment -> {
                    Subscription subscription = payment.getSubscription();
                    String planName = null;
                    if (payment.getPlanId() != null) {
                        planName = subscriptionPlanRepository.findById(payment.getPlanId())
                                .map(SubscriptionPlan::getPlanName)
                                .orElse(null);
                    }
                    return buildPaymentResponse(payment, subscription, planName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Cancel a pending payment
     */
    @Transactional
    public PaymentResponse cancelPayment(String transactionId) {
        Long userId = authService.getCurrentUserId();

        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (!payment.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to payment");
        }

        if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
            throw new BadRequestException("Only pending payments can be cancelled");
        }

        payment.setStatus(Payment.PaymentStatus.CANCELLED);
        payment.setFailureReason("Cancelled by user");
        paymentRepository.save(payment);

        Subscription subscription = payment.getSubscription();
        return buildPaymentResponse(payment, subscription, null);
    }

    /**
     * Add subscription directly for free items
     */
    @Transactional
    public void addFreeSubscription(Long subscriptionId, Long planId, String subscriptionType) {
        User user = authService.getCurrentUser();
        Long userId = user.getId();

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", subscriptionId));

        // Check if user already has this subscription
        if (userSubscriptionRepository.existsByUserIdAndSubscriptionIdAndIsActiveTrue(userId, subscriptionId)) {
            throw new BadRequestException("You already have this subscription");
        }

        // Create user subscription
        LocalDate startDate = LocalDate.now();
        LocalDate renewalDate = "YEARLY".equalsIgnoreCase(subscriptionType)
                ? startDate.plusYears(1)
                : startDate.plusMonths(1);

        UserSubscription userSubscription = UserSubscription.builder()
                .user(user)
                .subscription(subscription)
                .subscriptionType(subscriptionType)
                .customPrice(0.0)
                .startDate(startDate)
                .renewalDate(renewalDate)
                .isActive(true)
                .autoRenew(true)
                .reminderDaysBefore(7)
                .notes("Free subscription added from wishlist")
                .build();

        userSubscriptionRepository.save(userSubscription);

        // Remove from wishlist after adding free subscription
        removeFromWishlist(userId, subscriptionId);
    }

    // ============== Helper Methods ==============

    private boolean simulatePayment(ProcessPaymentRequest request, Payment payment) {
        // Simulate different payment methods
        String method = payment.getPaymentMethod();

        if ("CARD".equalsIgnoreCase(method)) {
            if (request.getCardNumber() == null) {
                return false;
            }
            String cardNumber = request.getCardNumber().replaceAll("\\s", "");

            // Test card logic
            if (SUCCESS_CARD.equals(cardNumber)) {
                return true;
            } else if (FAILURE_CARD.equals(cardNumber) || DECLINE_CARD.equals(cardNumber)) {
                return false;
            }
            // Any other valid 16-digit card succeeds
            return cardNumber.length() == 16 && cardNumber.matches("\\d+");
        } else if ("UPI".equalsIgnoreCase(method)) {
            // UPI succeeds if valid format
            if (request.getUpiId() != null && request.getUpiId().contains("@")) {
                return !request.getUpiId().contains("fail");
            }
            return false;
        } else if ("NETBANKING".equalsIgnoreCase(method)) {
            // Netbanking succeeds if bank code provided
            return request.getBankCode() != null && !request.getBankCode().isEmpty();
        } else if ("WALLET".equalsIgnoreCase(method)) {
            // Wallet succeeds if provider specified
            return request.getWalletProvider() != null && !request.getWalletProvider().isEmpty();
        }

        // Default: succeed for unknown methods (for testing)
        return true;
    }

    private String getFailureReason(ProcessPaymentRequest request) {
        if (request.getCardNumber() != null) {
            String cardNumber = request.getCardNumber().replaceAll("\\s", "");
            if (FAILURE_CARD.equals(cardNumber)) {
                return "Card declined: Insufficient funds";
            } else if (DECLINE_CARD.equals(cardNumber)) {
                return "Card declined: Card expired";
            }
        }
        return "Payment failed. Please try again.";
    }

    private void addSubscriptionToUser(Payment payment) {
        User user = payment.getUser();
        Subscription subscription = payment.getSubscription();

        // Check if user already has this subscription (active)
        if (userSubscriptionRepository.existsByUserIdAndSubscriptionIdAndIsActiveTrue(
                user.getId(), subscription.getId())) {
            // Deactivate existing subscription
            UserSubscription existing = userSubscriptionRepository
                    .findByUserIdAndSubscriptionId(user.getId(), subscription.getId());
            if (existing != null) {
                existing.setIsActive(false);
                userSubscriptionRepository.save(existing);
            }
        }

        LocalDate startDate = LocalDate.now();
        LocalDate renewalDate = "YEARLY".equalsIgnoreCase(payment.getSubscriptionType())
                ? startDate.plusYears(1)
                : startDate.plusMonths(1);

        UserSubscription userSubscription = UserSubscription.builder()
                .user(user)
                .subscription(subscription)
                .subscriptionType(payment.getSubscriptionType())
                .customPrice(payment.getAmount())
                .startDate(startDate)
                .renewalDate(renewalDate)
                .isActive(true)
                .autoRenew(true)
                .reminderDaysBefore(7)
                .notes("Purchased via payment gateway - Transaction: " + payment.getTransactionId())
                .build();

        userSubscriptionRepository.save(userSubscription);
    }

    /**
     * Remove subscription from wishlist after successful purchase
     */
    private void removeFromWishlist(Long userId, Long subscriptionId) {
        try {
            watchlistRepository.findByUserIdAndSubscriptionId(userId, subscriptionId)
                    .ifPresent(watchlistRepository::delete);
        } catch (Exception e) {
            // Log but don't fail the payment if wishlist removal fails
            System.err.println("Failed to remove from wishlist: " + e.getMessage());
        }
    }

    private PaymentResponse buildPaymentResponse(Payment payment, Subscription subscription, String planName) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .transactionId(payment.getTransactionId())
                .subscriptionId(subscription.getId())
                .subscriptionName(subscription.getName())
                .subscriptionLogo(subscription.getLogoUrl())
                .planId(payment.getPlanId())
                .planName(planName)
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .subscriptionType(payment.getSubscriptionType())
                .failureReason(payment.getFailureReason())
                .createdAt(payment.getCreatedAt())
                .completedAt(payment.getCompletedAt())
                .build();
    }
}
