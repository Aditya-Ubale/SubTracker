package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.ApiResponse;
import com.subscriptiontracker.dto.SubscriptionDTO;
import com.subscriptiontracker.dto.SubscriptionPlanDTO;
import com.subscriptiontracker.entity.SubscriptionPlan;
import com.subscriptiontracker.service.PriceScraperService;
import com.subscriptiontracker.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private PriceScraperService priceScraperService;

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

    // Trigger price scraping for all subscriptions
    @GetMapping("/scrape-prices")
    public ResponseEntity<Map<String, Object>> scrapePrices() {
        Map<String, Object> result = new HashMap<>();
        try {
            priceScraperService.scrapeAllPrices();
            result.put("success", true);
            result.put("message", "Price scraping triggered for all subscriptions");
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    // Get plans for a specific subscription by ID
    @GetMapping("/{id}/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDTO>>> getSubscriptionPlans(@PathVariable Long id) {
        try {
            List<SubscriptionPlan> plans = priceScraperService.getPlansForSubscription(id);
            List<SubscriptionPlanDTO> planDTOs = plans.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(planDTOs));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
    }

    // Get plans for a subscription by name
    @GetMapping("/plans/by-name/{name}")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDTO>>> getSubscriptionPlansByName(
            @PathVariable String name) {
        try {
            List<SubscriptionPlan> plans = priceScraperService.getPlansForSubscription(name);
            List<SubscriptionPlanDTO> planDTOs = plans.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(planDTOs));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
    }

    // Convert SubscriptionPlan entity to DTO
    private SubscriptionPlanDTO convertToDTO(SubscriptionPlan plan) {
        List<String> features = null;
        if (plan.getFeatures() != null && !plan.getFeatures().isEmpty()) {
            features = Arrays.asList(plan.getFeatures().split("\\|"));
        }

        return SubscriptionPlanDTO.builder()
                .id(plan.getId())
                .subscriptionId(plan.getSubscription().getId())
                .subscriptionName(plan.getSubscription().getName())
                .planName(plan.getPlanName())
                .priceMonthly(plan.getPriceMonthly())
                .priceYearly(plan.getPriceYearly())
                .currency(plan.getCurrency())
                .videoQuality(plan.getVideoQuality())
                .maxScreens(plan.getMaxScreens())
                .downloadDevices(plan.getDownloadDevices())
                .hasAds(plan.getHasAds())
                .features(features)
                .extraFeatures(plan.getExtraFeatures())
                .deviceTypes(plan.getDeviceTypes())
                .isActive(plan.getIsActive())
                .lastScrapedAt(plan.getLastScrapedAt())
                .build();
    }
}
