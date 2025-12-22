package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.WatchlistDTO;
import com.subscriptiontracker.dto.WatchlistRequest;
import com.subscriptiontracker.entity.Subscription;
import com.subscriptiontracker.entity.User;
import com.subscriptiontracker.entity.Watchlist;
import com.subscriptiontracker.exception.BadRequestException;
import com.subscriptiontracker.exception.ResourceNotFoundException;
import com.subscriptiontracker.repository.WatchlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WatchlistService {

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private SubscriptionService subscriptionService;

    // Get user's watchlist
    public List<WatchlistDTO> getWatchlist() {
        Long userId = authService.getCurrentUserId();
        return watchlistRepository.findByUserId(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Add subscription to watchlist
    @Transactional
    public WatchlistDTO addToWatchlist(WatchlistRequest request) {
        User user = authService.getCurrentUser();
        Subscription subscription = subscriptionService.getSubscriptionEntityById(request.getSubscriptionId());

        // Check if already in watchlist
        if (watchlistRepository.existsByUserIdAndSubscriptionId(user.getId(), subscription.getId())) {
            throw new BadRequestException("Subscription is already in your watchlist");
        }

        Watchlist watchlist = Watchlist.builder()
                .user(user)
                .subscription(subscription)
                .planId(request.getPlanId())
                .planName(request.getPlanName())
                .planPrice(request.getPlanPrice())
                .targetPrice(request.getTargetPrice())
                .notifyOnPriceDrop(request.getNotifyOnPriceDrop() != null ? request.getNotifyOnPriceDrop() : true)
                .notes(request.getNotes())
                .build();

        Watchlist saved = watchlistRepository.save(watchlist);
        return convertToDTO(saved);
    }

    // Update watchlist item
    @Transactional
    public WatchlistDTO updateWatchlistItem(Long id, WatchlistRequest request) {
        Long userId = authService.getCurrentUserId();
        Watchlist watchlist = watchlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Watchlist item", "id", id));

        // Verify ownership
        if (!watchlist.getUser().getId().equals(userId)) {
            throw new BadRequestException("You don't have access to this watchlist item");
        }

        if (request.getTargetPrice() != null) {
            watchlist.setTargetPrice(request.getTargetPrice());
        }
        if (request.getNotifyOnPriceDrop() != null) {
            watchlist.setNotifyOnPriceDrop(request.getNotifyOnPriceDrop());
        }
        if (request.getNotes() != null) {
            watchlist.setNotes(request.getNotes());
        }

        Watchlist updated = watchlistRepository.save(watchlist);
        return convertToDTO(updated);
    }

    // Remove from watchlist
    @Transactional
    public void removeFromWatchlist(Long id) {
        Long userId = authService.getCurrentUserId();
        Watchlist watchlist = watchlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Watchlist item", "id", id));

        // Verify ownership
        if (!watchlist.getUser().getId().equals(userId)) {
            throw new BadRequestException("You don't have access to this watchlist item");
        }

        watchlistRepository.delete(watchlist);
    }

    // Convert Entity to DTO
    private WatchlistDTO convertToDTO(Watchlist watchlist) {
        Subscription subscription = watchlist.getSubscription();

        // Use plan price if available, otherwise subscription base price
        Double effectivePrice = watchlist.getPlanPrice() != null
                ? watchlist.getPlanPrice()
                : subscription.getPriceMonthly();

        return WatchlistDTO.builder()
                .id(watchlist.getId())
                .subscriptionId(subscription.getId())
                .subscriptionName(subscription.getName())
                .subscriptionLogo(subscription.getLogoUrl())
                .category(subscription.getCategory())
                .websiteUrl(subscription.getWebsiteUrl())
                .planId(watchlist.getPlanId())
                .planName(watchlist.getPlanName())
                .planPrice(watchlist.getPlanPrice())
                .currentPriceMonthly(effectivePrice)
                .currentPriceYearly(subscription.getPriceYearly())
                .targetPrice(watchlist.getTargetPrice())
                .notifyOnPriceDrop(watchlist.getNotifyOnPriceDrop())
                .notes(watchlist.getNotes())
                .createdAt(watchlist.getCreatedAt())
                .build();
    }
}