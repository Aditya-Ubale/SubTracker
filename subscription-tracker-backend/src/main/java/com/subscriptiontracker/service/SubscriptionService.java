package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.SubscriptionDTO;
import com.subscriptiontracker.entity.Subscription;
import com.subscriptiontracker.exception.ResourceNotFoundException;
import com.subscriptiontracker.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubscriptionService {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    // Get all subscriptions
    public List<SubscriptionDTO> getAllSubscriptions() {
        return subscriptionRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get subscription by ID
    public SubscriptionDTO getSubscriptionById(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", id));
        return convertToDTO(subscription);
    }

    // Get subscriptions by category
    public List<SubscriptionDTO> getSubscriptionsByCategory(String category) {
        return subscriptionRepository.findByCategory(category)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get subscription entity by ID (for internal use)
    public Subscription getSubscriptionEntityById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", id));
    }

    // Create new subscription (admin use or for initial setup)
    @Transactional
    public SubscriptionDTO createSubscription(SubscriptionDTO subscriptionDTO) {
        Subscription subscription = Subscription.builder()
                .name(subscriptionDTO.getName())
                .description(subscriptionDTO.getDescription())
                .logoUrl(subscriptionDTO.getLogoUrl())
                .websiteUrl(subscriptionDTO.getWebsiteUrl())
                .category(subscriptionDTO.getCategory())
                .priceMonthly(subscriptionDTO.getPriceMonthly())
                .priceYearly(subscriptionDTO.getPriceYearly())
                .currency("INR")
                .features(subscriptionDTO.getFeatures())
                .maxDevices(subscriptionDTO.getMaxDevices())
                .streamingQuality(subscriptionDTO.getStreamingQuality())
                .build();

        Subscription savedSubscription = subscriptionRepository.save(subscription);
        return convertToDTO(savedSubscription);
    }

    // Update subscription price (used by scraper)
    @Transactional
    public void updateSubscriptionPrice(Long id, Double priceMonthly, Double priceYearly) {
        Subscription subscription = getSubscriptionEntityById(id);
        subscription.setPriceMonthly(priceMonthly);
        subscription.setPriceYearly(priceYearly);
        subscriptionRepository.save(subscription);
    }

    // Convert Entity to DTO
    private SubscriptionDTO convertToDTO(Subscription subscription) {
        return SubscriptionDTO.builder()
                .id(subscription.getId())
                .name(subscription.getName())
                .description(subscription.getDescription())
                .logoUrl(subscription.getLogoUrl())
                .websiteUrl(subscription.getWebsiteUrl())
                .category(subscription.getCategory())
                .priceMonthly(subscription.getPriceMonthly())
                .priceYearly(subscription.getPriceYearly())
                .currency(subscription.getCurrency())
                .features(subscription.getFeatures())
                .maxDevices(subscription.getMaxDevices())
                .streamingQuality(subscription.getStreamingQuality())
                .lastScrapedAt(subscription.getLastScrapedAt())
                .build();
    }
}