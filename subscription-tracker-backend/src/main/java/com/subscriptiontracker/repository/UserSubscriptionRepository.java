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

    @Query("SELECT us FROM UserSubscription us WHERE us.user.id = :userId AND us.subscription.id = :subscriptionId")
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
}