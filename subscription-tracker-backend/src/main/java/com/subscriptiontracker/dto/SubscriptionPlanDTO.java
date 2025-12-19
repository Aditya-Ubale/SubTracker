package com.subscriptiontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanDTO {

    private Long id;
    private Long subscriptionId;
    private String subscriptionName;
    private String planName;
    private Double priceMonthly;
    private Double priceYearly;
    private String currency;
    private String videoQuality;
    private Integer maxScreens;
    private Integer downloadDevices;
    private Boolean hasAds;
    private List<String> features;
    private String extraFeatures;
    private String deviceTypes;
    private Boolean isActive;
    private LocalDateTime lastScrapedAt;
}
