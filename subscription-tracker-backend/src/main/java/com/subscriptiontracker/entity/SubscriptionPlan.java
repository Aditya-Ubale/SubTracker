package com.subscriptiontracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subscription_id", nullable = false)
    @JsonIgnoreProperties({ "priceHistory", "plans" })
    private Subscription subscription;

    @Column(name = "plan_name", nullable = false)
    private String planName; // Mobile, Basic, Standard, Premium, etc.

    @Column(name = "price_monthly")
    private Double priceMonthly;

    @Column(name = "price_yearly")
    private Double priceYearly;

    private String currency;

    @Column(name = "video_quality")
    private String videoQuality; // 480p, 720p, 1080p, 4K, etc.

    @Column(name = "max_screens")
    private Integer maxScreens; // Number of simultaneous streams

    @Column(name = "download_devices")
    private Integer downloadDevices; // Number of devices for downloads

    @Column(name = "has_ads")
    private Boolean hasAds;

    // Features stored as JSON string or comma-separated
    @Column(length = 2000)
    private String features;

    // Extra features like Spatial Audio, HDR, etc.
    @Column(name = "extra_features", length = 1000)
    private String extraFeatures;

    @Column(name = "device_types")
    private String deviceTypes; // TV, Mobile, Tablet, Computer, etc.

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "last_scraped_at")
    private LocalDateTime lastScrapedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        currency = "INR";
        isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
