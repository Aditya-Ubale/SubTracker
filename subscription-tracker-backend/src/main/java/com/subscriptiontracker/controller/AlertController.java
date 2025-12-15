package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.AlertDTO;
import com.subscriptiontracker.dto.ApiResponse;
import com.subscriptiontracker.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;

    // Get all alerts
    @GetMapping
    public ResponseEntity<ApiResponse<List<AlertDTO>>> getAllAlerts() {
        List<AlertDTO> alerts = alertService.getUserAlerts();
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    // Get unread alerts
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<AlertDTO>>> getUnreadAlerts() {
        List<AlertDTO> alerts = alertService.getUnreadAlerts();
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    // Get unread alert count
    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadAlertCount() {
        Long count = alertService.getUnreadAlertCount();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    // Mark alert as read
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<AlertDTO>> markAsRead(@PathVariable Long id) {
        AlertDTO alert = alertService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Alert marked as read", alert));
    }

    // Mark all alerts as read
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        alertService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success("All alerts marked as read", null));
    }

    // Delete alert
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAlert(@PathVariable Long id) {
        alertService.deleteAlert(id);
        return ResponseEntity.ok(ApiResponse.success("Alert deleted", null));
    }
}