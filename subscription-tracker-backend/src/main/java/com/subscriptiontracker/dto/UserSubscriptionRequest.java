package com.subscriptiontracker.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UserSubscriptionRequest {

    @NotNull(message = "Subscription ID is required")
    private Long subscriptionId;

    private Long planId; // Optional: specific plan ID
    private String subscriptionType; // MONTHLY, YEARLY
    private Double customPrice;
    private LocalDate startDate;
    private LocalDate renewalDate;
    private Boolean autoRenew;
    private Integer reminderDaysBefore;
    private String notes;

    // For handling duplicate subscriptions
    private Boolean forceAdd; // If true, allows adding duplicate subscription
    private Boolean continueFromExisting; // If true, uses existing subscription's renewal date as start date
}
