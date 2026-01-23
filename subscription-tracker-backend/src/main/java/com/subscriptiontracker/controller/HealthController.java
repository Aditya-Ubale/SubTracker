package com.subscriptiontracker.controller;

import com.subscriptiontracker.scheduler.PriceScrapingScheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check and status endpoints for the scraping system.
 * Useful for monitoring in production.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private PriceScrapingScheduler scheduler;

    /**
     * Basic health check endpoint.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now().toString());
        health.put("service", "subscription-tracker-backend");
        return ResponseEntity.ok(health);
    }

    /**
     * Detailed scheduler status.
     */
    @GetMapping("/scheduler")
    public ResponseEntity<Map<String, Object>> schedulerStatus() {
        Map<String, Object> status = new HashMap<>();

        PriceScrapingScheduler.SchedulerStatus schedulerStatus = scheduler.getStatus();

        status.put("scrapingInProgress", schedulerStatus.scrapingInProgress);
        status.put("renewalCheckInProgress", schedulerStatus.renewalCheckInProgress);
        status.put("lastScrapingRun", schedulerStatus.lastScrapingRun != null
                ? schedulerStatus.lastScrapingRun.toString()
                : "Never");
        status.put("lastRenewalCheckRun", schedulerStatus.lastRenewalCheckRun != null
                ? schedulerStatus.lastRenewalCheckRun.toString()
                : "Never");
        status.put("lastScrapingSuccess", schedulerStatus.lastScrapingSuccess);
        status.put("lastRenewalCheckSuccess", schedulerStatus.lastRenewalCheckSuccess);
        status.put("timezone", schedulerStatus.timezone);
        status.put("timestamp", LocalDateTime.now().toString());

        // Determine overall health
        boolean healthy = schedulerStatus.lastScrapingSuccess && schedulerStatus.lastRenewalCheckSuccess;
        status.put("healthy", healthy);
        status.put("status", healthy ? "HEALTHY" : "DEGRADED");

        return ResponseEntity.ok(status);
    }

    /**
     * Manually trigger price scraping (for testing/emergency updates).
     * Returns 409 Conflict if scraping is already in progress.
     */
    @PostMapping("/scheduler/trigger")
    public ResponseEntity<Map<String, Object>> triggerScraping() {
        Map<String, Object> result = new HashMap<>();

        boolean triggered = scheduler.triggerPriceScraping();

        if (triggered) {
            result.put("success", true);
            result.put("message", "Price scraping triggered successfully");
            result.put("timestamp", LocalDateTime.now().toString());
            return ResponseEntity.ok(result);
        } else {
            result.put("success", false);
            result.put("message", "Scraping already in progress");
            result.put("timestamp", LocalDateTime.now().toString());
            return ResponseEntity.status(409).body(result);
        }
    }
}
