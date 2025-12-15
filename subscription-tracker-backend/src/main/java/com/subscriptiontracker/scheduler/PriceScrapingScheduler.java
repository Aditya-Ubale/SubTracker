package com.subscriptiontracker.scheduler;

import com.subscriptiontracker.entity.UserSubscription;
import com.subscriptiontracker.repository.UserSubscriptionRepository;
import com.subscriptiontracker.service.AlertService;
import com.subscriptiontracker.service.PriceScraperService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class PriceScrapingScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PriceScrapingScheduler.class);

    @Autowired
    private PriceScraperService priceScraperService;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private AlertService alertService;

    // Run price scraping every day at 6 AM
    @Scheduled(cron = "0 0 6 * * ?")
    public void scheduleDailyPriceScraping() {
        logger.info("Starting scheduled price scraping...");
        priceScraperService.scrapeAllPrices();
        logger.info("Scheduled price scraping completed.");
    }

    // Check for upcoming renewals every day at 8 AM
    @Scheduled(cron = "0 0 8 * * ?")
    public void checkUpcomingRenewals() {
        logger.info("Checking for upcoming renewals...");

        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);

        // Find subscriptions renewing in the next 7 days
        List<UserSubscription> upcomingRenewals = userSubscriptionRepository
                .findUpcomingRenewals(today, nextWeek);

        for (UserSubscription subscription : upcomingRenewals) {
            // Check if we should send reminder based on user preference
            int daysUntilRenewal = (int) java.time.temporal.ChronoUnit.DAYS
                    .between(today, subscription.getRenewalDate());

            if (daysUntilRenewal <= subscription.getReminderDaysBefore()) {
                alertService.createRenewalReminder(subscription);
                logger.info("Created renewal reminder for user {} - {} renewing on {}",
                        subscription.getUser().getEmail(),
                        subscription.getSubscription().getName(),
                        subscription.getRenewalDate());
            }
        }

        logger.info("Renewal check completed.");
    }

    // Manual trigger for testing (can be called via API)
    public void triggerPriceScraping() {
        logger.info("Manually triggering price scraping...");
        priceScraperService.scrapeAllPrices();
    }
}