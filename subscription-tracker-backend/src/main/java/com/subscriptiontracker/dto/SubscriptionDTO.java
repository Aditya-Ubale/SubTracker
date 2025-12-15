package com.subscriptiontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDTO {
    private Long id;
    private String name;
    private String description;
    private String logoUrl;
    private String websiteUrl;
    private String category;
    private Double priceMonthly;
    private Double priceYearly;
    private String currency;
    private String features;
    private Integer maxDevices;
    private String streamingQuality;
    private LocalDateTime lastScrapedAt;
}