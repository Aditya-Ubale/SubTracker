package com.subscriptiontracker.repository;

import com.subscriptiontracker.entity.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    List<Watchlist> findByUserId(Long userId);

    boolean existsByUserIdAndSubscriptionId(Long userId, Long subscriptionId);

    void deleteByUserIdAndSubscriptionId(Long userId, Long subscriptionId);

    // Find specific wishlist item for removal after purchase
    java.util.Optional<Watchlist> findByUserIdAndSubscriptionId(Long userId, Long subscriptionId);
}