package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.PaymentResponse;
import com.subscriptiontracker.entity.*;
import com.subscriptiontracker.exception.BadRequestException;
import com.subscriptiontracker.exception.ResourceNotFoundException;
import com.subscriptiontracker.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Payment Service - Simulated Payment Gateway
 * 
 * Provides a fully functional simulated payment flow.
 * No external payment provider required.
 * All existing API endpoints (/api/stripe/*) remain unchanged.
 */
@Service
public class StripeService {

    private static final Logger logger = LoggerFactory.getLogger(StripeService.class);

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

    /**
     * Create a simulated checkout session.
     * Returns a session ID that the frontend uses to complete payment.
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

        if (amount <= 0) {
            throw new BadRequestException("Amount must be greater than 0. Use free subscription endpoint.");
        }

        // Generate simulated session ID
        String sessionId = "sim_" + UUID.randomUUID().toString().replace("-", "");

        // Save payment record
        Payment payment = Payment.builder()
                .transactionId(sessionId)
                .user(user)
                .subscription(subscription)
                .planId(planId)
                .amount(amount)
                .currency("INR")
                .status(Payment.PaymentStatus.PENDING)
                .paymentMethod("SIMULATED")
                .subscriptionType(subscriptionType)
                .build();

        paymentRepository.save(payment);

        logger.info("Created simulated payment session: {} for user: {}, subscription: {}, amount: ₹{}",
                sessionId, user.getEmail(), subscription.getName(), amount);

        // Return session details
        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", sessionId);
        response.put("url", null);
        response.put("subscriptionName", subscription.getName());
        response.put("subscriptionLogo", subscription.getLogoUrl());
        response.put("planName", planName);
        response.put("amount", amount);
        response.put("simulated", true);

        return response;
    }

    /**
     * Verify payment — auto-approves simulated payments.
     */
    @Transactional
    public PaymentResponse verifyPayment(String sessionId) {
        Long userId = authService.getCurrentUserId();

        Payment payment = paymentRepository.findByTransactionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for session: " + sessionId));

        if (!payment.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to payment");
        }

        // Already processed
        if (payment.getStatus() == Payment.PaymentStatus.SUCCESS) {
            return buildPaymentResponse(payment, "Payment already completed");
        }

        // Auto-approve
        payment.setStatus(Payment.PaymentStatus.SUCCESS);
        payment.setCompletedAt(LocalDateTime.now());
        payment.setFailureReason(null);
        paymentRepository.save(payment);

        // Add subscription to user
        addSubscriptionToUser(payment);

        // Remove from wishlist
        removeFromWishlist(payment.getUser().getId(), payment.getSubscription().getId());

        logger.info("Payment verified and subscription activated: {} for user: {}",
                sessionId, payment.getUser().getEmail());

        return buildPaymentResponse(payment, "Payment verified successfully");
    }

    /**
     * Handle payment cancellation.
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

        // Deactivate existing subscription if present
        if (userSubscriptionRepository.existsByUserIdAndSubscriptionIdAndIsActiveTrue(
                user.getId(), subscription.getId())) {
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
                .notes("Purchased via Simulated Payment - Session: " + payment.getTransactionId())
                .build();

        userSubscriptionRepository.save(userSubscription);
    }

    private void removeFromWishlist(Long userId, Long subscriptionId) {
        try {
            watchlistRepository.findByUserIdAndSubscriptionId(userId, subscriptionId)
                    .ifPresent(watchlistRepository::delete);
        } catch (Exception e) {
            logger.warn("Failed to remove from wishlist: {}", e.getMessage());
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
