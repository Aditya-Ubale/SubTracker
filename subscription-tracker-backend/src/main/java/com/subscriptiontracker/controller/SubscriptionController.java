package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.ApiResponse;
import com.subscriptiontracker.dto.SubscriptionDTO;
import com.subscriptiontracker.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    // Get all available subscriptions (Public)
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<SubscriptionDTO>>> getAllSubscriptions() {
        List<SubscriptionDTO> subscriptions = subscriptionService.getAllSubscriptions();
        return ResponseEntity.ok(ApiResponse.success(subscriptions));
    }

    // Get subscription by ID (Public)
    @GetMapping("/all/{id}")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> getSubscriptionById(@PathVariable Long id) {
        SubscriptionDTO subscription = subscriptionService.getSubscriptionById(id);
        return ResponseEntity.ok(ApiResponse.success(subscription));
    }

    // Get subscriptions by category (Public)
    @GetMapping("/all/category/{category}")
    public ResponseEntity<ApiResponse<List<SubscriptionDTO>>> getSubscriptionsByCategory(
            @PathVariable String category) {
        List<SubscriptionDTO> subscriptions = subscriptionService.getSubscriptionsByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(subscriptions));
    }
}