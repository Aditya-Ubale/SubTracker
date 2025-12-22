package com.subscriptiontracker.repository;

import com.subscriptiontracker.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

        List<UserSubscription> findByUserIdAndIsActiveTrue(Long userId);

        List<UserSubscription> findByUserId(Long userId);

        @Query("SELECT us FROM UserSubscription us WHERE us.user.id = :userId AND us.subscription.id = :subscriptionId AND us.isActive = true")
        UserSubscription findByUserIdAndSubscriptionId(@Param("userId") Long userId,
                        @Param("subscriptionId") Long subscriptionId);

        @Query("SELECT us FROM UserSubscription us WHERE us.renewalDate BETWEEN :startDate AND :endDate AND us.isActive = true")
        List<UserSubscription> findUpcomingRenewals(@Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        @Query("SELECT SUM(CASE WHEN us.customPrice IS NOT NULL THEN us.customPrice " +
                        "ELSE CASE WHEN us.subscriptionType = 'MONTHLY' THEN us.subscription.priceMonthly " +
                        "ELSE us.subscription.priceYearly / 12 END END) " +
                        "FROM UserSubscription us WHERE us.user.id = :userId AND us.isActive = true")
        Double calculateMonthlySubscriptionTotal(@Param("userId") Long userId);

        // Admin Analytics queries
        @Query("SELECT COUNT(us) FROM UserSubscription us WHERE us.isActive = true")
        Long countActiveSubscriptions();

        @Query("SELECT COUNT(us) FROM UserSubscription us WHERE us.isActive = false")
        Long countInactiveSubscriptions();

        @Query("SELECT COUNT(us) FROM UserSubscription us WHERE us.isActive = true AND us.renewalDate BETWEEN :startDate AND :endDate")
        Long countExpiringSoon(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

        @Query("SELECT us.subscription.category, COUNT(us) FROM UserSubscription us WHERE us.isActive = true " +
                        "GROUP BY us.subscription.category ORDER BY COUNT(us) DESC")
        List<Object[]> countByCategory();

        @Query("SELECT us.subscription.name, us.subscription.logoUrl, us.subscription.category, COUNT(us) " +
                        "FROM UserSubscription us WHERE us.isActive = true " +
                        "GROUP BY us.subscription.id, us.subscription.name, us.subscription.logoUrl, us.subscription.category "
                        +
                        "ORDER BY COUNT(us) DESC")
        List<Object[]> findMostPopularSubscriptions();

        @Query("SELECT SUM(CASE WHEN us.customPrice IS NOT NULL THEN us.customPrice " +
                        "ELSE CASE WHEN us.subscriptionType = 'MONTHLY' THEN us.subscription.priceMonthly " +
                        "ELSE us.subscription.priceYearly / 12 END END) " +
                        "FROM UserSubscription us WHERE us.isActive = true")
        Double calculateTotalMRR();

        @Query("SELECT COUNT(us) FROM UserSubscription us WHERE us.user.id = :userId AND us.isActive = true")
        Long countActiveSubscriptionsByUserId(@Param("userId") Long userId);

        @Query("SELECT us FROM UserSubscription us WHERE us.isActive = true AND us.renewalDate BETWEEN :startDate AND :endDate "
                        +
                        "ORDER BY us.renewalDate ASC")
        List<UserSubscription> findAllUpcomingRenewals(@Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        // Check if user has active subscription for a specific service
        @Query("SELECT CASE WHEN COUNT(us) > 0 THEN true ELSE false END FROM UserSubscription us " +
                        "WHERE us.user.id = :userId AND us.subscription.id = :subscriptionId AND us.isActive = true")
        boolean existsByUserIdAndSubscriptionIdAndIsActiveTrue(@Param("userId") Long userId,
                        @Param("subscriptionId") Long subscriptionId);
}
