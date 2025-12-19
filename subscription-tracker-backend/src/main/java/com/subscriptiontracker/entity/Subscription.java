package com.subscriptiontracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "subscriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // Netflix, Spotify, etc.

    @Column(length = 1000)
    private String description;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "website_url")
    private String websiteUrl;

    private String category; // Streaming, Music, Productivity, AI, etc.

    @Column(name = "price_monthly")
    private Double priceMonthly;

    @Column(name = "price_yearly")
    private Double priceYearly;

    private String currency;

    // Features stored as JSON string
    @Column(length = 2000)
    private String features;

    @Column(name = "max_devices")
    private Integer maxDevices;

    @Column(name = "streaming_quality")
    private String streamingQuality;

    @Column(name = "last_scraped_at")
    private LocalDateTime lastScrapedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Price history for tracking price changes
    @Builder.Default
    @OneToMany(mappedBy = "subscription", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("subscription")
    private List<PriceHistory> priceHistory = new ArrayList<>();

    // Multiple pricing plans for this subscription (Mobile, Basic, Standard,
    // Premium, etc.)
    @Builder.Default
    @OneToMany(mappedBy = "subscription", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("subscription")
    private List<SubscriptionPlan> plans = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        currency = "INR";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}