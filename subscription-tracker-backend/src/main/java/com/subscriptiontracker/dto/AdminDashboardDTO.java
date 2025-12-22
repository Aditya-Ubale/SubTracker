package com.subscriptiontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDTO {

    // Overview Stats
    private OverviewStats overview;

    // User Analytics
    private UserAnalytics userAnalytics;

    // Subscription Analytics
    private SubscriptionAnalytics subscriptionAnalytics;

    // Financial Metrics
    private FinancialMetrics financialMetrics;

    // Upcoming Renewals
    private List<UpcomingRenewal> upcomingRenewals;

    // Data Health
    private DataHealth dataHealth;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewStats {
        private Long totalUsers;
        private Long activeUsers; // Last 30 days
        private Long totalSubscriptions;
        private Long activeSubscriptions;
        private Long expiredSubscriptions;
        private Double totalMRR; // Monthly Recurring Revenue
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserAnalytics {
        private List<GrowthDataPoint> userGrowth; // Over time
        private Double churnRate; // Percentage of inactive users
        private Long inactiveUsers; // Users inactive > 30 days
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthDataPoint {
        private String period; // e.g., "Jan 2024", "Feb 2024"
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionAnalytics {
        private List<CategoryBreakdown> byCategory;
        private List<PopularSubscription> topSubscriptions;
        private StatusBreakdown statusBreakdown;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryBreakdown {
        private String category;
        private Long count;
        private Double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PopularSubscription {
        private String name;
        private String logoUrl;
        private String category;
        private Long userCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusBreakdown {
        private Long active;
        private Long expiringSoon; // Next 30 days
        private Long cancelled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialMetrics {
        private Double currentMRR;
        private List<MRRDataPoint> mrrTrend; // Monthly trend
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MRRDataPoint {
        private String month;
        private Double mrr;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpcomingRenewal {
        private Long userId;
        private String userName;
        private String userEmail;
        private String subscriptionName;
        private String subscriptionLogo;
        private LocalDate renewalDate;
        private Double price;
        private Integer daysUntilRenewal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataHealth {
        private String lastScrapeTime;
        private Double scrapeSuccessRate;
        private Long totalScrapedServices;
        private Long failedScrapes;
    }
}
