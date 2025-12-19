package com.subscriptiontracker.controller;

import com.subscriptiontracker.entity.SubscriptionPlan;
import com.subscriptiontracker.service.PriceScraperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Test controller for verifying scraper functionality.
 * This is for development/testing purposes only.
 */
@RestController
@RequestMapping("/api/test/scraper")
@CrossOrigin(origins = "*")
public class ScraperTestController {

    @Autowired
    private PriceScraperService priceScraperService;

    /**
     * Get current status of all scrapers
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getScraperStatus() {
        Map<String, Object> status = new HashMap<>();

        String[] services = {
                "Netflix", "Amazon Prime", "Spotify", "Hotstar",
                "DeepSeek", "Perplexity", "Gemini",
                "Google Workspace", "Microsoft 365"
        };

        status.put("services", services);
        status.put("totalServices", services.length);
        status.put("message", "All scrapers are implemented. Trigger scraping via /api/subscriptions/scrape-prices");

        return ResponseEntity.ok(status);
    }

    /**
     * Trigger scraping for all subscriptions
     */
    @PostMapping("/scrape-all")
    public ResponseEntity<Map<String, Object>> scrapeAll() {
        Map<String, Object> result = new HashMap<>();

        try {
            priceScraperService.scrapeAllPrices();
            result.put("success", true);
            result.put("message", "Scraping triggered for all subscriptions");
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Get plans for a subscription by name
     */
    @GetMapping("/plans/{subscriptionName}")
    public ResponseEntity<Map<String, Object>> getPlansByName(@PathVariable String subscriptionName) {
        Map<String, Object> result = new HashMap<>();

        try {
            List<SubscriptionPlan> plans = priceScraperService.getPlansForSubscription(subscriptionName);
            result.put("subscriptionName", subscriptionName);
            result.put("planCount", plans.size());
            result.put("plans", plans);
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Info endpoint showing available test endpoints
     */
    @GetMapping("")
    public ResponseEntity<Map<String, Object>> getInfo() {
        Map<String, Object> info = new HashMap<>();

        info.put("endpoints", new String[] {
                "GET /api/test/scraper/status - Get scraper status",
                "POST /api/test/scraper/scrape-all - Trigger scraping for all services",
                "GET /api/test/scraper/plans/{name} - Get plans for a subscription by name"
        });

        info.put("implementedScrapers", new String[] {
                "Netflix - 4 plans (Mobile, Basic, Standard, Premium)",
                "Amazon Prime - 5 plans (Monthly, Quarterly, Annual, Lite, Shopping)",
                "Spotify - 4 plans (Lite, Standard, Platinum, Student)",
                "JioHotstar - 3 plans (Mobile, Super, Premium)",
                "DeepSeek - 3 plans (Chat, Reasoner, Speciale)",
                "Perplexity - 3 plans (Pro, Enterprise, Enterprise Max)",
                "Gemini - 4 plans (Free, AI Plus, AI Pro, AI Ultra)",
                "Google Workspace - 3 plans (Starter, Standard, Plus)",
                "Microsoft 365 - 3 plans (Personal, Family, Premium)"
        });

        info.put("totalPlans", 32);

        return ResponseEntity.ok(info);
    }
}
