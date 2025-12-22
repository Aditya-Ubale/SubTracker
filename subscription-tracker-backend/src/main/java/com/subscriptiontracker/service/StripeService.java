package com.subscriptiontracker.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.subscriptiontracker.dto.PaymentResponse;
import com.subscriptiontracker.entity.*;
import com.subscriptiontracker.exception.BadRequestException;
import com.subscriptiontracker.exception.ResourceNotFoundException;
import com.subscriptiontracker.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class StripeService {

    @Value("${stripe.secret.key:sk_test_your_secret_key}")
    private String stripeSecretKey;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Autowired
    private AuthService authService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private WatchlistRepository watchlistRepository;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    /**
     * Create a Stripe Checkout Session for payment
     */
    @Transactional
    public Map<String, Object> createCheckoutSession(Long subscriptionId, Long planId, String subscriptionType) {
        User user = authService.getCurrentUser();

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", subscriptionId));

        // Get price from plan or subscription
        Double amount = 0.0;
        String planName = null;

        if (planId != null) {
            SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                    .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", planId));
            amount = plan.getPriceMonthly();
            planName = plan.getPlanName();

            if ("YEARLY".equalsIgnoreCase(subscriptionType)) {
                amount = plan.getPriceYearly() != null ? plan.getPriceYearly() : amount * 12 * 0.8;
            }
        } else {
            amount = subscription.getPriceMonthly() != null ? subscription.getPriceMonthly() : 0.0;
            if ("YEARLY".equalsIgnoreCase(subscriptionType)) {
                amount = subscription.getPriceYearly() != null ? subscription.getPriceYearly() : amount * 12 * 0.8;
            }
        }

        // If amount is 0, throw error (should use add-free endpoint instead)
        if (amount <= 0) {
            throw new BadRequestException("Amount must be greater than 0. Use free subscription endpoint.");
        }

        // Stripe requires minimum amount of ~50 cents USD (approximately ₹42-45)
        // For test mode: automatically adjust small amounts to minimum
        final double MINIMUM_STRIPE_AMOUNT = 50.0;
        Double originalAmount = amount;
        if (amount < MINIMUM_STRIPE_AMOUNT) {
            amount = MINIMUM_STRIPE_AMOUNT;
            System.out.println("Adjusted amount from ₹" + originalAmount + " to ₹" + amount + " (Stripe minimum)");
        }

        try {
            // Stripe expects amount in smallest currency unit (paise for INR, cents for
            // USD)
            long amountInSmallestUnit = Math.round(amount * 100);

            // Create Stripe Checkout Session
            // Stripe automatically enables relevant payment methods (card, UPI, etc.) based
            // on currency
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(frontendUrl + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(frontendUrl + "/payment/cancel")
                    .setCustomerEmail(user.getEmail())
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("inr")
                                                    .setUnitAmount(amountInSmallestUnit)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName(subscription.getName()
                                                                            + (planName != null ? " - " + planName
                                                                                    : ""))
                                                                    .setDescription(subscriptionType + " Subscription")
                                                                    .build())
                                                    .build())
                                    .build())
                    .putMetadata("subscription_id", subscriptionId.toString())
                    .putMetadata("plan_id", planId != null ? planId.toString() : "")
                    .putMetadata("subscription_type", subscriptionType)
                    .putMetadata("user_id", user.getId().toString())
                    .build();

            Session session = Session.create(params);

            // Save payment record with PENDING status
            Payment payment = Payment.builder()
                    .transactionId(session.getId())
                    .user(user)
                    .subscription(subscription)
                    .planId(planId)
                    .amount(amount)
                    .currency("INR")
                    .status(Payment.PaymentStatus.PENDING)
                    .paymentMethod("STRIPE")
                    .subscriptionType(subscriptionType)
                    .build();

            paymentRepository.save(payment);

            // Return session details for frontend
            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", session.getId());
            response.put("url", session.getUrl());
            response.put("subscriptionName", subscription.getName());
            response.put("subscriptionLogo", subscription.getLogoUrl());
            response.put("planName", planName);
            response.put("amount", amount);

            return response;

        } catch (StripeException e) {
            throw new BadRequestException("Failed to create Stripe checkout session: " + e.getMessage());
        }
    }

    /**
     * Verify Stripe payment after successful checkout
     */
    @Transactional
    public PaymentResponse verifyPayment(String sessionId) {
        Long userId = authService.getCurrentUserId();

        Payment payment = paymentRepository.findByTransactionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for session: " + sessionId));

        if (!payment.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to payment");
        }

        // If already processed, return current status
        if (payment.getStatus() == Payment.PaymentStatus.SUCCESS) {
            return buildPaymentResponse(payment, "Payment already completed");
        }

        try {
            // Retrieve the session from Stripe to verify payment
            Session session = Session.retrieve(sessionId);

            if ("complete".equals(session.getStatus()) && "paid".equals(session.getPaymentStatus())) {
                // Payment successful
                payment.setStatus(Payment.PaymentStatus.SUCCESS);
                payment.setCompletedAt(LocalDateTime.now());
                payment.setFailureReason(null);
                paymentRepository.save(payment);

                // Add subscription to user
                addSubscriptionToUser(payment);

                // Remove from wishlist
                removeFromWishlist(payment.getUser().getId(), payment.getSubscription().getId());

                return buildPaymentResponse(payment, "Payment verified successfully");
            } else {
                // Payment not complete
                payment.setStatus(Payment.PaymentStatus.FAILED);
                payment.setFailureReason("Payment not completed. Status: " + session.getPaymentStatus());
                paymentRepository.save(payment);

                return buildPaymentResponse(payment, "Payment verification failed");
            }

        } catch (StripeException e) {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason("Verification error: " + e.getMessage());
            paymentRepository.save(payment);

            return buildPaymentResponse(payment, "Payment verification error");
        }
    }

    /**
     * Handle payment cancellation
     */
    @Transactional
    public PaymentResponse handlePaymentCancel(String sessionId) {
        Long userId = authService.getCurrentUserId();

        Payment payment = paymentRepository.findByTransactionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for session: " + sessionId));

        if (!payment.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to payment");
        }

        if (payment.getStatus() == Payment.PaymentStatus.PENDING) {
            payment.setStatus(Payment.PaymentStatus.CANCELLED);
            payment.setFailureReason("Cancelled by user");
            paymentRepository.save(payment);
        }

        return buildPaymentResponse(payment, "Payment cancelled");
    }

    // ============== Helper Methods ==============

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
                .notes("Purchased via Stripe - Session: " + payment.getTransactionId())
                .build();

        userSubscriptionRepository.save(userSubscription);
    }

    private void removeFromWishlist(Long userId, Long subscriptionId) {
        try {
            watchlistRepository.findByUserIdAndSubscriptionId(userId, subscriptionId)
                    .ifPresent(watchlistRepository::delete);
        } catch (Exception e) {
            System.err.println("Failed to remove from wishlist: " + e.getMessage());
        }
    }

    private PaymentResponse buildPaymentResponse(Payment payment, String message) {
        Subscription subscription = payment.getSubscription();
        String planName = null;
        if (payment.getPlanId() != null) {
            planName = subscriptionPlanRepository.findById(payment.getPlanId())
                    .map(SubscriptionPlan::getPlanName)
                    .orElse(null);
        }

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
