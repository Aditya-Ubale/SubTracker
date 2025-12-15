package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.ApiResponse;
import com.subscriptiontracker.dto.UserSubscriptionDTO;
import com.subscriptiontracker.dto.UserSubscriptionRequest;
import com.subscriptiontracker.service.UserSubscriptionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-subscriptions")
public class UserSubscriptionController {

    @Autowired
    private UserSubscriptionService userSubscriptionService;

    // Get user's active subscriptions
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserSubscriptionDTO>>> getUserSubscriptions() {
        List<UserSubscriptionDTO> subscriptions = userSubscriptionService.getUserSubscriptions();
        return ResponseEntity.ok(ApiResponse.success(subscriptions));
    }

    // Get specific user subscription
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserSubscriptionDTO>> getUserSubscriptionById(@PathVariable Long id) {
        UserSubscriptionDTO subscription = userSubscriptionService.getUserSubscriptionById(id);
        return ResponseEntity.ok(ApiResponse.success(subscription));
    }

    // Add subscription to profile
    @PostMapping
    public ResponseEntity<ApiResponse<UserSubscriptionDTO>> addSubscription(
            @Valid @RequestBody UserSubscriptionRequest request) {
        UserSubscriptionDTO subscription = userSubscriptionService.addSubscription(request);
        return ResponseEntity.ok(ApiResponse.success("Subscription added successfully!", subscription));
    }

    // Update subscription
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserSubscriptionDTO>> updateSubscription(
            @PathVariable Long id,
            @Valid @RequestBody UserSubscriptionRequest request) {
        UserSubscriptionDTO subscription = userSubscriptionService.updateSubscription(id, request);
        return ResponseEntity.ok(ApiResponse.success("Subscription updated successfully!", subscription));
    }

    // Delete subscription
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubscription(@PathVariable Long id) {
        userSubscriptionService.deleteSubscription(id);
        return ResponseEntity.ok(ApiResponse.success("Subscription deleted successfully!", null));
    }

    // Get upcoming renewals
    @GetMapping("/renewals")
    public ResponseEntity<ApiResponse<List<UserSubscriptionDTO>>> getUpcomingRenewals(
            @RequestParam(defaultValue = "7") int days) {
        List<UserSubscriptionDTO> renewals = userSubscriptionService.getUpcomingRenewals(days);
        return ResponseEntity.ok(ApiResponse.success(renewals));
    }

    // Get monthly subscription total
    @GetMapping("/total")
    public ResponseEntity<ApiResponse<Double>> getMonthlyTotal() {
        Double total = userSubscriptionService.calculateMonthlyTotal();
        return ResponseEntity.ok(ApiResponse.success(total));
    }
}