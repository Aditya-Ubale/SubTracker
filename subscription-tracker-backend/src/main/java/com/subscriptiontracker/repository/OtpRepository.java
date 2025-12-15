package com.subscriptiontracker.repository;

import com.subscriptiontracker.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {

    // Find the latest OTP for an email
    Optional<Otp> findTopByEmailOrderByCreatedAtDesc(String email);

    // Find valid (not expired, not verified) OTP
    @Query("SELECT o FROM Otp o WHERE o.email = :email AND o.otpCode = :otpCode " +
            "AND o.expiresAt > :now AND o.isVerified = false")
    Optional<Otp> findValidOtp(String email, String otpCode, LocalDateTime now);

    // Check if email has verified OTP recently (within last 30 minutes)
    @Query("SELECT COUNT(o) > 0 FROM Otp o WHERE o.email = :email " +
            "AND o.isVerified = true AND o.createdAt > :since")
    boolean hasVerifiedOtpRecently(String email, LocalDateTime since);

    // Delete expired OTPs (cleanup)
    @Modifying
    @Transactional
    @Query("DELETE FROM Otp o WHERE o.expiresAt < :now")
    void deleteExpiredOtps(LocalDateTime now);

    // Delete all OTPs for an email (after successful registration)
    @Modifying
    @Transactional
    void deleteByEmail(String email);
}
