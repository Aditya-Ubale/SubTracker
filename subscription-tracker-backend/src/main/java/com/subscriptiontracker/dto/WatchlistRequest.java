package com.subscriptiontracker.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WatchlistRequest {

    @NotNull(message = "Subscription ID is required")
    private Long subscriptionId;

    // Optional plan selection
    private Long planId;
    private String planName;
    private Double planPrice;

    private Double targetPrice;
    private Boolean notifyOnPriceDrop;
    private String notes;
}
