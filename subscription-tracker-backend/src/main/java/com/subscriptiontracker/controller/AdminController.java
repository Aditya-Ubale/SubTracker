package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.AdminDashboardDTO;
import com.subscriptiontracker.dto.AdminUserDTO;
import com.subscriptiontracker.dto.ApiResponse;
import com.subscriptiontracker.scheduler.PriceScrapingScheduler;
import com.subscriptiontracker.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private PriceScrapingScheduler priceScrapingScheduler;

    @Autowired
    private AdminService adminService;

    // Admin Login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> adminLogin(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        Map<String, Object> loginResponse = adminService.adminLogin(email, password);
        return ResponseEntity.ok(ApiResponse.success("Login successful", loginResponse));
    }

    // Get Dashboard Statistics
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardDTO>> getDashboard() {
        AdminDashboardDTO dashboard = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved", dashboard));
    }

    // Get All Users
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserDTO>>> getAllUsers() {
        List<AdminUserDTO> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    // Initialize default admin (call once)
    @PostMapping("/init")
    public ResponseEntity<ApiResponse<String>> initializeAdmin() {
        adminService.createDefaultAdmin();
        return ResponseEntity.ok(ApiResponse.success("Admin initialized", "Default admin created if not exists"));
    }

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
