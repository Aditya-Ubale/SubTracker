package com.subscriptiontracker.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UserSubscriptionRequest {

    @NotNull(message = "Subscription ID is required")
    private Long subscriptionId;

    private String subscriptionType; // MONTHLY, YEARLY
    private Double customPrice;
    private LocalDate startDate;
    private LocalDate renewalDate;
    private Boolean autoRenew;
    private Integer reminderDaysBefore;
    private String notes;
}