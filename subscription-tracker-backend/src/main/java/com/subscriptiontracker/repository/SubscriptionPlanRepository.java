package com.subscriptiontracker.repository;

import com.subscriptiontracker.entity.Subscription;
import com.subscriptiontracker.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository; 

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    // Find all plans for a specific subscription
    List<SubscriptionPlan> findBySubscriptionOrderByPriceMonthlyAsc(Subscription subscription);

    // Find all plans for a subscription by subscription ID with eager loading
    @Query("SELECT sp FROM SubscriptionPlan sp JOIN FETCH sp.subscription WHERE sp.subscription.id = :subscriptionId ORDER BY sp.priceMonthly ASC")
    List<SubscriptionPlan> findBySubscriptionIdOrderByPriceMonthlyAsc(@Param("subscriptionId") Long subscriptionId);

    // Find a specific plan by subscription and plan name
    Optional<SubscriptionPlan> findBySubscriptionAndPlanName(Subscription subscription, String planName);

    // Find a specific plan by subscription ID and plan name
    Optional<SubscriptionPlan> findBySubscriptionIdAndPlanName(Long subscriptionId, String planName);

    // Find all active plans for a subscription
    List<SubscriptionPlan> findBySubscriptionIdAndIsActiveTrueOrderByPriceMonthlyAsc(Long subscriptionId);

    // Find the cheapest plan for a subscription
    @Query("SELECT sp FROM SubscriptionPlan sp WHERE sp.subscription.id = :subscriptionId AND sp.isActive = true ORDER BY sp.priceMonthly ASC LIMIT 1")
    Optional<SubscriptionPlan> findCheapestPlanBySubscriptionId(@Param("subscriptionId") Long subscriptionId);

    // Find all plans by subscription name with eager loading
    @Query("SELECT sp FROM SubscriptionPlan sp JOIN FETCH sp.subscription WHERE sp.subscription.name = :subscriptionName AND sp.isActive = true ORDER BY sp.priceMonthly ASC")
    List<SubscriptionPlan> findBySubscriptionName(@Param("subscriptionName") String subscriptionName);

    // Delete all plans for a subscription (useful before re-scraping)
    void deleteBySubscriptionId(Long subscriptionId);

    // Check if plans exist for a subscription
    boolean existsBySubscriptionId(Long subscriptionId);
}
