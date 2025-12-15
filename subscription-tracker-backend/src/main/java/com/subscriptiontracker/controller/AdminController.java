package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.ApiResponse;
import com.subscriptiontracker.scheduler.PriceScrapingScheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private PriceScrapingScheduler priceScrapingScheduler;

    // Manually trigger price scraping
    @PostMapping("/scrape-prices")
    public ResponseEntity<ApiResponse<String>> triggerPriceScraping() {
        priceScrapingScheduler.triggerPriceScraping();
        return ResponseEntity.ok(ApiResponse.success("Price scraping triggered successfully!"));
    }

    // Manually check renewals
    @PostMapping("/check-renewals")
    public ResponseEntity<ApiResponse<String>> checkRenewals() {
        priceScrapingScheduler.checkUpcomingRenewals();
        return ResponseEntity.ok(ApiResponse.success("Renewal check completed!"));
    }
}