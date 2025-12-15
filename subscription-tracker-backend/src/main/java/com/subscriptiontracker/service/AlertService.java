package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.AlertDTO;
import com.subscriptiontracker.entity.Alert;
import com.subscriptiontracker.entity.Subscription;
import com.subscriptiontracker.entity.User;
import com.subscriptiontracker.entity.UserSubscription;
import com.subscriptiontracker.exception.ResourceNotFoundException;
import com.subscriptiontracker.repository.AlertRepository;
import com.subscriptiontracker.repository.UserSubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private AuthService authService;

    // Get all alerts for current user
    public List<AlertDTO> getUserAlerts() {
        Long userId = authService.getCurrentUserId();
        return alertRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get unread alerts
    public List<AlertDTO> getUnreadAlerts() {
        Long userId = authService.getCurrentUserId();
        return alertRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get unread alert count
    public Long getUnreadAlertCount() {
        Long userId = authService.getCurrentUserId();
        return alertRepository.countByUserIdAndIsReadFalse(userId);
    }

    // Mark alert as read
    @Transactional
    public AlertDTO markAsRead(Long alertId) {
        Long userId = authService.getCurrentUserId();
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));

        if (!alert.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Alert", "id", alertId);
        }

        alert.setIsRead(true);
        Alert saved = alertRepository.save(alert);
        return convertToDTO(saved);
    }

    // Mark all alerts as read
    @Transactional
    public void markAllAsRead() {
        Long userId = authService.getCurrentUserId();
        List<Alert> unreadAlerts = alertRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unreadAlerts.forEach(alert -> alert.setIsRead(true));
        alertRepository.saveAll(unreadAlerts);
    }

    // Create renewal reminder alert
    @Transactional
    public Alert createRenewalReminder(UserSubscription userSubscription) {
        User user = userSubscription.getUser();
        Subscription subscription = userSubscription.getSubscription();

        Alert alert = Alert.builder()
                .user(user)
                .subscription(subscription)
                .alertType("RENEWAL_REMINDER")
                .title("Subscription Renewal Reminder")
                .message(String.format("Your %s subscription is renewing on %s. " +
                                "The renewal amount will be ₹%.2f.",
                        subscription.getName(),
                        userSubscription.getRenewalDate(),
                        userSubscription.getCustomPrice() != null
                                ? userSubscription.getCustomPrice()
                                : subscription.getPriceMonthly()))
                .build();

        return alertRepository.save(alert);
    }

    // Create price drop alert
    @Transactional
    public Alert createPriceDropAlert(User user, Subscription subscription,
                                      Double oldPrice, Double newPrice) {
        Double savings = oldPrice - newPrice;
        Double percentageDrop = (savings / oldPrice) * 100;

        Alert alert = Alert.builder()
                .user(user)
                .subscription(subscription)
                .alertType("PRICE_DROP")
                .title("Price Drop Alert!")
                .message(String.format("Great news! %s price dropped from ₹%.2f to ₹%.2f. " +
                                "You can save ₹%.2f (%.1f%% off)!",
                        subscription.getName(), oldPrice, newPrice, savings, percentageDrop))
                .build();

        return alertRepository.save(alert);
    }

    // Delete alert
    @Transactional
    public void deleteAlert(Long alertId) {
        Long userId = authService.getCurrentUserId();
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));

        if (!alert.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Alert", "id", alertId);
        }

        alertRepository.delete(alert);
    }

    // Convert Entity to DTO
    private AlertDTO convertToDTO(Alert alert) {
        return AlertDTO.builder()
                .id(alert.getId())
                .alertType(alert.getAlertType())
                .title(alert.getTitle())
                .message(alert.getMessage())
                .subscriptionName(alert.getSubscription() != null
                        ? alert.getSubscription().getName()
                        : null)
                .isRead(alert.getIsRead())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}