package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.*;
import com.subscriptiontracker.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    /**
     * Initiate a new payment
     * POST /api/payments/initiate
     */
    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            @RequestBody InitiatePaymentRequest request) {

        PaymentResponse response = paymentService.initiatePayment(request);
        return ResponseEntity.ok(ApiResponse.success("Payment initiated successfully", response));
    }

    /**
     * Process payment (submit card/UPI details)
     * POST /api/payments/process
     */
    @PostMapping("/process")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(
            @RequestBody ProcessPaymentRequest request) {

        PaymentResponse response = paymentService.processPayment(request);

        if (response.getStatus().name().equals("SUCCESS")) {
            return ResponseEntity.ok(ApiResponse.success("Payment successful! Subscription added.", response));
        } else {
            return ResponseEntity.ok(ApiResponse.success("Payment failed: " + response.getFailureReason(), response));
        }
    }

    /**
     * Get payment status by transaction ID
     * GET /api/payments/status/{transactionId}
     */
    @GetMapping("/status/{transactionId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentStatus(
            @PathVariable String transactionId) {

        PaymentResponse response = paymentService.getPaymentStatus(transactionId);
        return ResponseEntity.ok(ApiResponse.success("Payment status retrieved", response));
    }

    /**
     * Get user's payment history
     * GET /api/payments/history
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentHistory() {

        List<PaymentResponse> history = paymentService.getPaymentHistory();
        return ResponseEntity.ok(ApiResponse.success("Payment history retrieved", history));
    }

    /**
     * Cancel a pending payment
     * POST /api/payments/cancel/{transactionId}
     */
    @PostMapping("/cancel/{transactionId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> cancelPayment(
            @PathVariable String transactionId) {

        PaymentResponse response = paymentService.cancelPayment(transactionId);
        return ResponseEntity.ok(ApiResponse.success("Payment cancelled", response));
    }

    /**
     * Add free subscription directly (no payment needed)
     * POST /api/payments/add-free
     */
    @PostMapping("/add-free")
    public ResponseEntity<ApiResponse<String>> addFreeSubscription(
            @RequestBody Map<String, Object> request) {

        Long subscriptionId = Long.valueOf(request.get("subscriptionId").toString());
        Long planId = request.get("planId") != null ? Long.valueOf(request.get("planId").toString()) : null;
        String subscriptionType = (String) request.getOrDefault("subscriptionType", "MONTHLY");

        paymentService.addFreeSubscription(subscriptionId, planId, subscriptionType);
        return ResponseEntity.ok(ApiResponse.success("Free subscription added successfully", "Subscription added"));
    }
}
