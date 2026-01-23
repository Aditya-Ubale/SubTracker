package com.subscriptiontracker.scheduler;

import com.subscriptiontracker.entity.UserSubscription;
import com.subscriptiontracker.repository.UserSubscriptionRepository;
import com.subscriptiontracker.service.AlertService;
import com.subscriptiontracker.service.PriceScraperService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Centralized scheduler for all periodic tasks.
 * 
 * IMPORTANT: All scheduled jobs are defined here to:
 * 1. Prevent duplicate execution
 * 2. Centralize schedule management
 * 3. Enable easy monitoring and modification
 * 
 * Schedule (IST - Asia/Kolkata):
 * - 6:00 AM: Daily price scraping (once per day)
 * - 8:00 AM: Check upcoming renewals and send notifications
 */
@Component
public class PriceScrapingScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PriceScrapingScheduler.class);

    @Autowired
    private PriceScraperService priceScraperService;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private AlertService alertService;

    @Value("${app.scheduling.timezone:Asia/Kolkata}")
    private String schedulingTimezone;

    // Prevents concurrent execution of the same job
    private final AtomicBoolean scrapingInProgress = new AtomicBoolean(false);
    private final AtomicBoolean renewalCheckInProgress = new AtomicBoolean(false);

    // Track last execution for monitoring
    private volatile LocalDateTime lastScrapingRun = null;
    private volatile LocalDateTime lastRenewalCheckRun = null;
    private volatile boolean lastScrapingSuccess = true;
    private volatile boolean lastRenewalCheckSuccess = true;

    /**
     * Daily price scraping - runs every day at 6 AM IST
     * This is the only scheduled scraping job (once per day).
     */
    @Scheduled(cron = "0 0 6 * * ?", zone = "Asia/Kolkata")
    public void scheduleDailyPriceScraping() {
        executePriceScraping("DAILY");
    }

    /**
     * Core scraping execution with concurrency protection.
     */
    private void executePriceScraping(String scheduleType) {
        // Prevent concurrent execution
        if (!scrapingInProgress.compareAndSet(false, true)) {
            logger.warn("[SCHEDULER] Price scraping already in progress, skipping {} run", scheduleType);
            return;
        }

        LocalDateTime startTime = LocalDateTime.now(ZoneId.of(schedulingTimezone));
        logger.info("[SCHEDULER] ========================================");
        logger.info("[SCHEDULER] Starting {} price scraping at {}", scheduleType, startTime);
        logger.info("[SCHEDULER] ========================================");

        try {
            priceScraperService.scrapeAllPricesScheduled();

            lastScrapingSuccess = true;
            LocalDateTime endTime = LocalDateTime.now(ZoneId.of(schedulingTimezone));
            long durationSeconds = java.time.Duration.between(startTime, endTime).getSeconds();

            logger.info("[SCHEDULER] {} price scraping COMPLETED successfully in {} seconds",
                    scheduleType, durationSeconds);

        } catch (Exception e) {
            lastScrapingSuccess = false;
            logger.error("[SCHEDULER] {} price scraping FAILED: {}", scheduleType, e.getMessage(), e);

            // Future: Send alert notification on failure
            // alertService.notifyAdminOfScrapingFailure(scheduleType, e);

        } finally {
            lastScrapingRun = LocalDateTime.now(ZoneId.of(schedulingTimezone));
            scrapingInProgress.set(false);
        }
    }

    /**
     * Check for upcoming renewals every day at 8 AM IST.
     * Sends renewal reminders to users based on their preferences.
     */
    @Scheduled(cron = "0 0 8 * * ?", zone = "Asia/Kolkata")
    public void checkUpcomingRenewals() {
        // Prevent concurrent execution
        if (!renewalCheckInProgress.compareAndSet(false, true)) {
            logger.warn("[SCHEDULER] Renewal check already in progress, skipping");
            return;
        }

        LocalDateTime startTime = LocalDateTime.now(ZoneId.of(schedulingTimezone));
        logger.info("[SCHEDULER] Starting renewal check at {}", startTime);

        try {
            LocalDate today = LocalDate.now(ZoneId.of(schedulingTimezone));
            LocalDate nextWeek = today.plusDays(7);

            // Find subscriptions renewing in the next 7 days
            List<UserSubscription> upcomingRenewals = userSubscriptionRepository
                    .findUpcomingRenewals(today, nextWeek);

            int remindersCreated = 0;
            for (UserSubscription subscription : upcomingRenewals) {
                try {
                    // Check if we should send reminder based on user preference
                    int daysUntilRenewal = (int) java.time.temporal.ChronoUnit.DAYS
                            .between(today, subscription.getRenewalDate());

                    if (daysUntilRenewal <= subscription.getReminderDaysBefore()) {
                        alertService.createRenewalReminder(subscription);
                        remindersCreated++;
                        logger.debug("[SCHEDULER] Created reminder for user {} - {} renewing on {}",
                                subscription.getUser().getEmail(),
                                subscription.getSubscription().getName(),
                                subscription.getRenewalDate());
                    }
                } catch (Exception e) {
                    logger.error("[SCHEDULER] Failed to create reminder for subscription {}: {}",
                            subscription.getId(), e.getMessage());
                }
            }

            lastRenewalCheckSuccess = true;
            logger.info("[SCHEDULER] Renewal check COMPLETED. Found {} upcoming, created {} reminders",
                    upcomingRenewals.size(), remindersCreated);

        } catch (Exception e) {
            lastRenewalCheckSuccess = false;
            logger.error("[SCHEDULER] Renewal check FAILED: {}", e.getMessage(), e);

        } finally {
            lastRenewalCheckRun = LocalDateTime.now(ZoneId.of(schedulingTimezone));
            renewalCheckInProgress.set(false);
        }
    }

    /**
     * Manual trigger for price scraping (for testing/API calls).
     * Returns false if scraping is already in progress.
     */
    public boolean triggerPriceScraping() {
        if (scrapingInProgress.get()) {
            logger.warn("[SCHEDULER] Cannot trigger scraping - already in progress");
            return false;
        }

        logger.info("[SCHEDULER] Manual price scraping triggered");
        executePriceScraping("MANUAL");
        return true;
    }

    /**
     * Get scheduler status for monitoring/health checks.
     */
    public SchedulerStatus getStatus() {
        return new SchedulerStatus(
                scrapingInProgress.get(),
                renewalCheckInProgress.get(),
                lastScrapingRun,
                lastRenewalCheckRun,
                lastScrapingSuccess,
                lastRenewalCheckSuccess,
                schedulingTimezone);
    }

    /**
     * Status DTO for scheduler monitoring.
     */
    public static class SchedulerStatus {
        public final boolean scrapingInProgress;
        public final boolean renewalCheckInProgress;
        public final LocalDateTime lastScrapingRun;
        public final LocalDateTime lastRenewalCheckRun;
        public final boolean lastScrapingSuccess;
        public final boolean lastRenewalCheckSuccess;
        public final String timezone;

        public SchedulerStatus(boolean scrapingInProgress, boolean renewalCheckInProgress,
                LocalDateTime lastScrapingRun, LocalDateTime lastRenewalCheckRun,
                boolean lastScrapingSuccess, boolean lastRenewalCheckSuccess,
                String timezone) {
            this.scrapingInProgress = scrapingInProgress;
            this.renewalCheckInProgress = renewalCheckInProgress;
            this.lastScrapingRun = lastScrapingRun;
            this.lastRenewalCheckRun = lastRenewalCheckRun;
            this.lastScrapingSuccess = lastScrapingSuccess;
            this.lastRenewalCheckSuccess = lastRenewalCheckSuccess;
            this.timezone = timezone;
        }
    }
}