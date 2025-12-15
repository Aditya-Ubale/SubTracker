package com.subscriptiontracker.repository;

import com.subscriptiontracker.entity.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {

    List<PriceHistory> findBySubscriptionIdOrderByRecordedAtDesc(Long subscriptionId);

    @Query("SELECT ph FROM PriceHistory ph WHERE ph.subscription.id = :subscriptionId " +
            "AND ph.recordedAt >= :startDate ORDER BY ph.recordedAt")
    List<PriceHistory> findPriceHistoryBySubscriptionAndDateRange(
            @Param("subscriptionId") Long subscriptionId,
            @Param("startDate") LocalDateTime startDate);

    @Query("SELECT ph FROM PriceHistory ph WHERE ph.subscription.id = :subscriptionId " +
            "ORDER BY ph.recordedAt DESC LIMIT 1")
    PriceHistory findLatestPriceBySubscription(@Param("subscriptionId") Long subscriptionId);
}