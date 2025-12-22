package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.AdminDashboardDTO;
import com.subscriptiontracker.dto.AdminDashboardDTO.*;
import com.subscriptiontracker.dto.AdminUserDTO;
import com.subscriptiontracker.entity.Admin;
import com.subscriptiontracker.entity.User;
import com.subscriptiontracker.entity.UserSubscription;
import com.subscriptiontracker.exception.BadRequestException;
import com.subscriptiontracker.repository.AdminRepository;
import com.subscriptiontracker.repository.SubscriptionRepository;
import com.subscriptiontracker.repository.UserRepository;
import com.subscriptiontracker.repository.UserSubscriptionRepository;
import com.subscriptiontracker.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

        @Autowired
        private AdminRepository adminRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private UserSubscriptionRepository userSubscriptionRepository;

        @Autowired
        private SubscriptionRepository subscriptionRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Autowired
        private JwtUtils jwtUtils;

        // Admin Login
        public Map<String, Object> adminLogin(String email, String password) {
                Admin admin = adminRepository.findByEmail(email)
                                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

                if (!passwordEncoder.matches(password, admin.getPassword())) {
                        throw new BadRequestException("Invalid credentials");
                }

                if (!admin.getIsActive()) {
                        throw new BadRequestException("Admin account is deactivated");
                }

                // Update last login
                admin.setLastLogin(LocalDateTime.now());
                adminRepository.save(admin);

                // Generate token with admin role
                String token = jwtUtils.generateTokenWithRole(admin.getEmail(), "ADMIN");

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("name", admin.getName());
                response.put("email", admin.getEmail());
                response.put("role", "ADMIN");

                return response;
        }

        // Create default admin (call once during setup)
        public void createDefaultAdmin() {
                if (!adminRepository.existsByEmail("admin@subtracker.com")) {
                        Admin admin = Admin.builder()
                                        .email("admin@subtracker.com")
                                        .password(passwordEncoder.encode("Admin@123"))
                                        .name("Admin")
                                        .isActive(true)
                                        .build();
                        adminRepository.save(admin);
                }
        }

        // Get Dashboard Stats
        public AdminDashboardDTO getDashboardStats() {
                return AdminDashboardDTO.builder()
                                .overview(getOverviewStats())
                                .userAnalytics(getUserAnalytics())
                                .subscriptionAnalytics(getSubscriptionAnalytics())
                                .financialMetrics(getFinancialMetrics())
                                .upcomingRenewals(getUpcomingRenewals())
                                .dataHealth(getDataHealth())
                                .build();
        }

        // Overview Stats
        private OverviewStats getOverviewStats() {
                Long totalUsers = userRepository.count();
                Long activeUsers = userRepository.countActiveUsersSince(LocalDateTime.now().minusDays(30));
                Long totalSubscriptions = userSubscriptionRepository.count();
                Long activeSubscriptions = userSubscriptionRepository.countActiveSubscriptions();
                Long expiredSubscriptions = userSubscriptionRepository.countInactiveSubscriptions();
                Double totalMRR = userSubscriptionRepository.calculateTotalMRR();

                return OverviewStats.builder()
                                .totalUsers(totalUsers)
                                .activeUsers(activeUsers != null ? activeUsers : 0L)
                                .totalSubscriptions(totalSubscriptions)
                                .activeSubscriptions(activeSubscriptions != null ? activeSubscriptions : 0L)
                                .expiredSubscriptions(expiredSubscriptions != null ? expiredSubscriptions : 0L)
                                .totalMRR(totalMRR != null ? totalMRR : 0.0)
                                .build();
        }

        // User Analytics
        private UserAnalytics getUserAnalytics() {
                Long totalUsers = userRepository.count();
                Long inactiveUsers = userRepository.countInactiveUsers(LocalDateTime.now().minusDays(30));

                // Calculate churn rate
                Double churnRate = totalUsers > 0 ? (inactiveUsers.doubleValue() / totalUsers.doubleValue()) * 100
                                : 0.0;

                // Get user growth over last 6 months
                List<Object[]> growthData = userRepository.getUserGrowthByMonth(LocalDateTime.now().minusMonths(6));
                List<GrowthDataPoint> userGrowth = new ArrayList<>();

                for (Object[] data : growthData) {
                        userGrowth.add(GrowthDataPoint.builder()
                                        .period((String) data[0])
                                        .count(((Number) data[1]).longValue())
                                        .build());
                }

                return UserAnalytics.builder()
                                .userGrowth(userGrowth)
                                .churnRate(Math.round(churnRate * 100.0) / 100.0)
                                .inactiveUsers(inactiveUsers != null ? inactiveUsers : 0L)
                                .build();
        }

        // Subscription Analytics
        private SubscriptionAnalytics getSubscriptionAnalytics() {
                // By Category
                List<Object[]> categoryData = userSubscriptionRepository.countByCategory();
                Long totalActive = userSubscriptionRepository.countActiveSubscriptions();

                List<CategoryBreakdown> byCategory = new ArrayList<>();
                for (Object[] data : categoryData) {
                        String category = (String) data[0];
                        Long count = ((Number) data[1]).longValue();
                        Double percentage = totalActive > 0 ? (count.doubleValue() / totalActive.doubleValue()) * 100
                                        : 0.0;

                        byCategory.add(CategoryBreakdown.builder()
                                        .category(category != null ? category : "Other")
                                        .count(count)
                                        .percentage(Math.round(percentage * 100.0) / 100.0)
                                        .build());
                }

                // Top Subscriptions (limit to 10)
                List<Object[]> popularData = userSubscriptionRepository.findMostPopularSubscriptions();
                List<PopularSubscription> topSubscriptions = new ArrayList<>();

                int limit = Math.min(10, popularData.size());
                for (int i = 0; i < limit; i++) {
                        Object[] data = popularData.get(i);
                        topSubscriptions.add(PopularSubscription.builder()
                                        .name((String) data[0])
                                        .logoUrl((String) data[1])
                                        .category((String) data[2])
                                        .userCount(((Number) data[3]).longValue())
                                        .build());
                }

                // Status Breakdown
                Long active = userSubscriptionRepository.countActiveSubscriptions();
                Long expiringSoon = userSubscriptionRepository.countExpiringSoon(
                                LocalDate.now(), LocalDate.now().plusDays(30));
                Long cancelled = userSubscriptionRepository.countInactiveSubscriptions();

                StatusBreakdown statusBreakdown = StatusBreakdown.builder()
                                .active(active != null ? active : 0L)
                                .expiringSoon(expiringSoon != null ? expiringSoon : 0L)
                                .cancelled(cancelled != null ? cancelled : 0L)
                                .build();

                return SubscriptionAnalytics.builder()
                                .byCategory(byCategory)
                                .topSubscriptions(topSubscriptions)
                                .statusBreakdown(statusBreakdown)
                                .build();
        }

        // Financial Metrics
        private FinancialMetrics getFinancialMetrics() {
                Double currentMRR = userSubscriptionRepository.calculateTotalMRR();

                // For MRR trend, we'll generate sample data based on current MRR
                // In production, you'd store historical MRR data
                List<MRRDataPoint> mrrTrend = new ArrayList<>();
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

                for (int i = 5; i >= 0; i--) {
                        LocalDate month = LocalDate.now().minusMonths(i);
                        // Simulate growth (in production, query historical data)
                        Double historicalMRR = currentMRR != null ? currentMRR * (0.7 + (0.05 * (5 - i))) : 0.0;

                        mrrTrend.add(MRRDataPoint.builder()
                                        .month(month.format(formatter))
                                        .mrr(Math.round(historicalMRR * 100.0) / 100.0)
                                        .build());
                }

                return FinancialMetrics.builder()
                                .currentMRR(currentMRR != null ? currentMRR : 0.0)
                                .mrrTrend(mrrTrend)
                                .build();
        }

        // Upcoming Renewals
        private List<UpcomingRenewal> getUpcomingRenewals() {
                List<UserSubscription> renewals = userSubscriptionRepository.findAllUpcomingRenewals(
                                LocalDate.now(), LocalDate.now().plusDays(30));

                return renewals.stream()
                                .limit(20) // Limit to 20 upcoming renewals
                                .map(us -> {
                                        int daysUntil = (int) ChronoUnit.DAYS.between(LocalDate.now(),
                                                        us.getRenewalDate());
                                        Double price = us.getCustomPrice() != null ? us.getCustomPrice()
                                                        : (us.getSubscriptionType().equals("YEARLY")
                                                                        ? us.getSubscription().getPriceYearly()
                                                                        : us.getSubscription().getPriceMonthly());

                                        return UpcomingRenewal.builder()
                                                        .userId(us.getUser().getId())
                                                        .userName(us.getUser().getName())
                                                        .userEmail(us.getUser().getEmail())
                                                        .subscriptionName(us.getSubscription().getName())
                                                        .subscriptionLogo(us.getSubscription().getLogoUrl())
                                                        .renewalDate(us.getRenewalDate())
                                                        .price(price)
                                                        .daysUntilRenewal(daysUntil)
                                                        .build();
                                })
                                .collect(Collectors.toList());
        }

        // Data Health (Scraping status)
        private DataHealth getDataHealth() {
                // Get total services
                Long totalServices = subscriptionRepository.count();

                // For now, we'll return simulated data
                // In production, you'd track scraping results
                return DataHealth.builder()
                                .lastScrapeTime(
                                                LocalDateTime.now().minusHours(2).format(
                                                                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")))
                                .scrapeSuccessRate(95.5)
                                .totalScrapedServices(totalServices)
                                .failedScrapes(0L)
                                .build();
        }

        // Get All Users
        public List<AdminUserDTO> getAllUsers() {
                List<User> users = userRepository.findAllByOrderByCreatedAtDesc();

                return users.stream()
                                .map(user -> {
                                        Long totalSubs = userSubscriptionRepository
                                                        .countActiveSubscriptionsByUserId(user.getId());
                                        Double monthlySpend = userSubscriptionRepository
                                                        .calculateMonthlySubscriptionTotal(user.getId());

                                        return AdminUserDTO.builder()
                                                        .id(user.getId())
                                                        .name(user.getName())
                                                        .email(user.getEmail())
                                                        .joinedDate(user.getCreatedAt())
                                                        .lastLogin(user.getLastLogin())
                                                        .totalSubscriptions(totalSubs != null ? totalSubs : 0L)
                                                        .totalMonthlySpend(monthlySpend != null ? monthlySpend : 0.0)
                                                        .isActive(user.getLastLogin() != null &&
                                                                        user.getLastLogin()
                                                                                        .isAfter(LocalDateTime.now()
                                                                                                        .minusDays(30)))
                                                        .build();
                                })
                                .collect(Collectors.toList());
        }
}
