package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.UserSubscriptionDTO;
import com.subscriptiontracker.dto.UserSubscriptionRequest;
import com.subscriptiontracker.entity.Subscription;
import com.subscriptiontracker.entity.User;
import com.subscriptiontracker.entity.UserSubscription;
import com.subscriptiontracker.exception.BadRequestException;
import com.subscriptiontracker.exception.ResourceNotFoundException;
import com.subscriptiontracker.repository.UserSubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserSubscriptionService {

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private SubscriptionService subscriptionService;

    // Get all active subscriptions for current user
    public List<UserSubscriptionDTO> getUserSubscriptions() {
        Long userId = authService.getCurrentUserId();
        return userSubscriptionRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get subscription by ID
    public UserSubscriptionDTO getUserSubscriptionById(Long id) {
        Long userId = authService.getCurrentUserId();
        UserSubscription userSubscription = userSubscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", id));

        // Verify ownership
        if (!userSubscription.getUser().getId().equals(userId)) {
            throw new BadRequestException("You don't have access to this subscription");
        }

        return convertToDTO(userSubscription);
    }

    // Add new subscription to user's profile
    @Transactional
    public UserSubscriptionDTO addSubscription(UserSubscriptionRequest request) {
        User user = authService.getCurrentUser();
        Subscription subscription = subscriptionService.getSubscriptionEntityById(request.getSubscriptionId());

        // Check if user already has this subscription
        UserSubscription existing = userSubscriptionRepository.findByUserIdAndSubscriptionId(
                user.getId(), subscription.getId());
        if (existing != null && existing.getIsActive()) {
            throw new BadRequestException("You already have this subscription active");
        }

        // Calculate renewal date if not provided
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate renewalDate = request.getRenewalDate();
        if (renewalDate == null) {
            String type = request.getSubscriptionType() != null ? request.getSubscriptionType() : "MONTHLY";
            renewalDate = type.equals("YEARLY") ? startDate.plusYears(1) : startDate.plusMonths(1);
        }

        UserSubscription userSubscription = UserSubscription.builder()
                .user(user)
                .subscription(subscription)
                .subscriptionType(request.getSubscriptionType() != null ? request.getSubscriptionType() : "MONTHLY")
                .customPrice(request.getCustomPrice())
                .startDate(startDate)
                .renewalDate(renewalDate)
                .isActive(true)
                .autoRenew(request.getAutoRenew() != null ? request.getAutoRenew() : true)
                .reminderDaysBefore(request.getReminderDaysBefore() != null ? request.getReminderDaysBefore() : 7)
                .notes(request.getNotes())
                .build();

        UserSubscription saved = userSubscriptionRepository.save(userSubscription);
        return convertToDTO(saved);
    }

    // Update existing subscription
    @Transactional
    public UserSubscriptionDTO updateSubscription(Long id, UserSubscriptionRequest request) {
        Long userId = authService.getCurrentUserId();
        UserSubscription userSubscription = userSubscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", id));

        // Verify ownership
        if (!userSubscription.getUser().getId().equals(userId)) {
            throw new BadRequestException("You don't have access to this subscription");
        }

        // Update fields
        if (request.getSubscriptionType() != null) {
            userSubscription.setSubscriptionType(request.getSubscriptionType());
        }
        if (request.getCustomPrice() != null) {
            userSubscription.setCustomPrice(request.getCustomPrice());
        }
        if (request.getStartDate() != null) {
            userSubscription.setStartDate(request.getStartDate());
        }
        if (request.getRenewalDate() != null) {
            userSubscription.setRenewalDate(request.getRenewalDate());
        }
        if (request.getAutoRenew() != null) {
            userSubscription.setAutoRenew(request.getAutoRenew());
        }
        if (request.getReminderDaysBefore() != null) {
            userSubscription.setReminderDaysBefore(request.getReminderDaysBefore());
        }
        if (request.getNotes() != null) {
            userSubscription.setNotes(request.getNotes());
        }

        UserSubscription updated = userSubscriptionRepository.save(userSubscription);
        return convertToDTO(updated);
    }

    // Delete (deactivate) subscription
    @Transactional
    public void deleteSubscription(Long id) {
        Long userId = authService.getCurrentUserId();
        UserSubscription userSubscription = userSubscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", id));

        // Verify ownership
        if (!userSubscription.getUser().getId().equals(userId)) {
            throw new BadRequestException("You don't have access to this subscription");
        }

        // Soft delete - just mark as inactive
        userSubscription.setIsActive(false);
        userSubscriptionRepository.save(userSubscription);
    }

    // Calculate total monthly subscription cost
    public Double calculateMonthlyTotal() {
        Long userId = authService.getCurrentUserId();
        Double total = userSubscriptionRepository.calculateMonthlySubscriptionTotal(userId);
        return total != null ? total : 0.0;
    }

    // Get upcoming renewals
    public List<UserSubscriptionDTO> getUpcomingRenewals(int days) {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(days);

        Long userId = authService.getCurrentUserId();
        return userSubscriptionRepository.findUpcomingRenewals(startDate, endDate)
                .stream()
                .filter(us -> us.getUser().getId().equals(userId))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Convert Entity to DTO
    private UserSubscriptionDTO convertToDTO(UserSubscription userSubscription) {
        Subscription subscription = userSubscription.getSubscription();

        // Calculate days until renewal
        int daysUntilRenewal = 0;
        if (userSubscription.getRenewalDate() != null) {
            daysUntilRenewal = (int) ChronoUnit.DAYS.between(LocalDate.now(), userSubscription.getRenewalDate());
        }

        // Get price based on subscription type
        Double originalPrice = userSubscription.getSubscriptionType().equals("YEARLY")
                ? subscription.getPriceYearly()
                : subscription.getPriceMonthly();

        return UserSubscriptionDTO.builder()
                .id(userSubscription.getId())
                .subscriptionId(subscription.getId())
                .subscriptionName(subscription.getName())
                .subscriptionLogo(subscription.getLogoUrl())
                .category(subscription.getCategory())
                .subscriptionType(userSubscription.getSubscriptionType())
                .customPrice(userSubscription.getCustomPrice())
                .originalPrice(originalPrice)
                .startDate(userSubscription.getStartDate())
                .renewalDate(userSubscription.getRenewalDate())
                .isActive(userSubscription.getIsActive())
                .autoRenew(userSubscription.getAutoRenew())
                .reminderDaysBefore(userSubscription.getReminderDaysBefore())
                .notes(userSubscription.getNotes())
                .daysUntilRenewal(daysUntilRenewal)
                .build();
    }
}