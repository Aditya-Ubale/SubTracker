package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.ApiResponse;
import com.subscriptiontracker.dto.PaymentResponse;
import com.subscriptiontracker.service.StripeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
public class StripeController {

    @Autowired
    private StripeService stripeService;

    /**
     * Create a Stripe Checkout Session
     * POST /api/stripe/create-checkout-session
     */
    @PostMapping("/create-checkout-session")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCheckoutSession(
            @RequestBody Map<String, Object> request) {

        Long subscriptionId = Long.valueOf(request.get("subscriptionId").toString());
        Long planId = request.get("planId") != null && !request.get("planId").toString().isEmpty()
                ? Long.valueOf(request.get("planId").toString())
                : null;
        String subscriptionType = (String) request.getOrDefault("subscriptionType", "MONTHLY");

        Map<String, Object> sessionDetails = stripeService.createCheckoutSession(subscriptionId, planId,
                subscriptionType);
        return ResponseEntity.ok(ApiResponse.success("Checkout session created successfully", sessionDetails));
    }

    /**
     * Verify payment after successful checkout
     * POST /api/stripe/verify
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @RequestBody Map<String, String> request) {

        String sessionId = request.get("session_id");

        PaymentResponse response = stripeService.verifyPayment(sessionId);

        if (response.getStatus().name().equals("SUCCESS")) {
            return ResponseEntity
                    .ok(ApiResponse.success("Payment verified successfully! Subscription added.", response));
        } else {
            return ResponseEntity
                    .ok(ApiResponse.success("Payment verification failed: " + response.getFailureReason(), response));
        }
    }

    /**
     * Handle payment cancellation
     * POST /api/stripe/cancel
     */
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<PaymentResponse>> handlePaymentCancel(
            @RequestBody Map<String, String> request) {

        String sessionId = request.get("session_id");

        PaymentResponse response = stripeService.handlePaymentCancel(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Payment cancelled", response));
    }
}
