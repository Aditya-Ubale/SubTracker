package com.subscriptiontracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "watchlist")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Watchlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Column(name = "plan_id")
    private Long planId; // Optional: specific plan selected

    @Column(name = "plan_name")
    private String planName;

    @Column(name = "plan_price")
    private Double planPrice; // Price of the selected plan

    @Column(name = "target_price")
    private Double targetPrice; // Alert when price drops below this

    @Column(name = "notify_on_price_drop")
    private Boolean notifyOnPriceDrop;

    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        notifyOnPriceDrop = true;
    }
}
