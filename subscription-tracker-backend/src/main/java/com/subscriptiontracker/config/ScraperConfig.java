package com.subscriptiontracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for web scraping operations.
 * All values are externalized and can be overridden via environment variables.
 */
@Configuration
public class ScraperConfig {

    @Value("${scraper.usd.to.inr:83.0}")
    private double usdToInrRate;

    @Value("${scraper.connection.timeout:15000}")
    private int connectionTimeout;

    @Value("${scraper.retry.max-attempts:3}")
    private int maxRetryAttempts;

    @Value("${scraper.retry.delay-ms:2000}")
    private long retryDelayMs;

    @Value("${scraper.user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36}")
    private String userAgent;

    // Getters

    public double getUsdToInrRate() {
        return usdToInrRate;
    }

    public int getConnectionTimeout() {
        return connectionTimeout;
    }

    public int getMaxRetryAttempts() {
        return maxRetryAttempts;
    }

    public long getRetryDelayMs() {
        return retryDelayMs;
    }

    public String getUserAgent() {
        return userAgent;
    }

    /**
     * Get exponential backoff delay for a given attempt.
     * Attempt 1: delay * 1 = 2s
     * Attempt 2: delay * 2 = 4s
     * Attempt 3: delay * 4 = 8s
     */
    public long getRetryDelay(int attemptNumber) {
        return retryDelayMs * (long) Math.pow(2, attemptNumber - 1);
    }
}
