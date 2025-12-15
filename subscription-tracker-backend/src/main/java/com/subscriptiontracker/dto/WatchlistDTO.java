package com.subscriptiontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistDTO {
    private Long id;
    private Long subscriptionId;
    private String subscriptionName;
    private String subscriptionLogo;
    private String category;
    private String websiteUrl; // For "Buy Now" button
    private Double currentPriceMonthly;
    private Double currentPriceYearly;
    private Double targetPrice;
    private Boolean notifyOnPriceDrop;
    private String notes;
    private LocalDateTime createdAt;
}