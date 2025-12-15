package com.subscriptiontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSubscriptionDTO {
    private Long id;
    private Long subscriptionId;
    private String subscriptionName;
    private String subscriptionLogo;
    private String category;
    private String subscriptionType;
    private Double customPrice;
    private Double originalPrice;
    private LocalDate startDate;
    private LocalDate renewalDate;
    private Boolean isActive;
    private Boolean autoRenew;
    private Integer reminderDaysBefore;
    private String notes;
    private Integer daysUntilRenewal;
}