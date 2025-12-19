package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.OtpRequest;
import com.subscriptiontracker.dto.OtpVerifyRequest;
import com.subscriptiontracker.entity.Otp;
import com.subscriptiontracker.exception.BadRequestException;
import com.subscriptiontracker.repository.OtpRepository;
import com.subscriptiontracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generate and send OTP to email (for signup - rejects registered emails)
     */
    @Transactional
    public String sendOtp(OtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check if email is already registered (for signup flow)
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("This email is already registered. Please login instead.");
        }

        return sendOtpInternal(email, "verification");
    }

    /**
     * Generate and send OTP for password reset (requires registered email)
     */
    @Transactional
    public String sendPasswordResetOtp(String email) {
        email = email.toLowerCase().trim();

        // For password reset, email MUST be registered
        if (!userRepository.existsByEmail(email)) {
            throw new BadRequestException("No account found with this email address.");
        }

        return sendOtpInternal(email, "password reset");
    }

    /**
     * Internal method to generate and send OTP
     */
    private String sendOtpInternal(String email, String purpose) {
        // Check cooldown period (prevent spam)
        Optional<Otp> existingOtp = otpRepository.findTopByEmailOrderByCreatedAtDesc(email);
        if (existingOtp.isPresent()) {
            LocalDateTime cooldownEnd = existingOtp.get().getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS);
            if (LocalDateTime.now().isBefore(cooldownEnd)) {
                long secondsRemaining = java.time.Duration.between(LocalDateTime.now(), cooldownEnd).getSeconds();
                throw new BadRequestException(
                        "Please wait " + secondsRemaining + " seconds before requesting a new OTP.");
            }
        }

        // Generate 6-digit OTP
        String otpCode = generateOtp();

        // Save OTP to database
        Otp otp = Otp.builder()
                .email(email)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        otpRepository.save(otp);

        // Send OTP via email
        try {
            if (emailService != null) {
                emailService.sendOtpEmail(email, otpCode);
                logger.info("OTP sent successfully to {} for {}", email, purpose);
            } else {
                // Email service not available - log OTP for development
                logger.warn("Email service not available. OTP: {} for email: {} ({})", otpCode, email, purpose);
            }
        } catch (Exception e) {
            logger.error("Failed to send OTP email to {}: {}", email, e.getMessage());
            throw new BadRequestException("Failed to send OTP. Please try again.");
        }

        return "OTP sent successfully to " + maskEmail(email);
    }

    /**
     * Verify OTP (marks OTP as verified/used)
     */
    @Transactional
    public boolean verifyOtp(OtpVerifyRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        String otpCode = request.getOtp().trim();

        // Find valid OTP
        Optional<Otp> otpOptional = otpRepository.findValidOtp(email, otpCode, LocalDateTime.now());

        if (otpOptional.isEmpty()) {
            // Check if OTP exists but is expired
            Optional<Otp> latestOtp = otpRepository.findTopByEmailOrderByCreatedAtDesc(email);
            if (latestOtp.isPresent() && latestOtp.get().getOtpCode().equals(otpCode)) {
                if (latestOtp.get().isExpired()) {
                    throw new BadRequestException("OTP has expired. Please request a new one.");
                }
                if (latestOtp.get().getIsVerified()) {
                    throw new BadRequestException("OTP has already been used.");
                }
            }
            throw new BadRequestException("Invalid OTP. Please check and try again.");
        }

        // Mark OTP as verified
        Otp otp = otpOptional.get();
        otp.setIsVerified(true);
        otpRepository.save(otp);

        logger.info("OTP verified successfully for {}", email);
        return true;
    }

    /**
     * Validate OTP for password reset (checks validity but allows re-use within
     * session)
     * This method checks if the OTP is valid but doesn't mark it as used yet.
     * The OTP will be cleared after successful password reset.
     */
    public boolean validateOtpForPasswordReset(String email, String otpCode) {
        email = email.toLowerCase().trim();
        otpCode = otpCode.trim();

        // First check if there's a valid (not expired, not verified) OTP
        Optional<Otp> validOtp = otpRepository.findValidOtp(email, otpCode, LocalDateTime.now());
        if (validOtp.isPresent()) {
            return true;
        }

        // Check the latest OTP for this email
        Optional<Otp> latestOtp = otpRepository.findTopByEmailOrderByCreatedAtDesc(email);
        if (latestOtp.isEmpty()) {
            throw new BadRequestException("No OTP found. Please request a new one.");
        }

        Otp otp = latestOtp.get();

        // Check if OTP code matches
        if (!otp.getOtpCode().equals(otpCode)) {
            throw new BadRequestException("Invalid OTP. Please check and try again.");
        }

        // Check if expired
        if (otp.isExpired()) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        // If OTP was verified recently (within 10 minutes), still allow password reset
        // This handles the case where user already verified but is now on password step
        if (otp.getIsVerified()) {
            LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
            if (otp.getCreatedAt().isAfter(tenMinutesAgo)) {
                logger.debug("OTP was previously verified but still valid for password reset");
                return true;
            }
            throw new BadRequestException("OTP has already been used. Please request a new one.");
        }

        return true;
    }

    /**
     * Check if email has been verified recently (within 30 minutes)
     */
    public boolean isEmailVerified(String email) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(30);
        return otpRepository.hasVerifiedOtpRecently(email.toLowerCase().trim(), since);
    }

    /**
     * Generate random 6-digit OTP
     */
    private String generateOtp() {
        int otp = 100000 + secureRandom.nextInt(900000); // 100000 to 999999
        return String.valueOf(otp);
    }

    /**
     * Mask email for privacy (e.g., t***@gmail.com)
     */
    private String maskEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 1)
            return email;
        return email.charAt(0) + "***" + email.substring(atIndex);
    }

    /**
     * Cleanup expired OTPs - runs every hour
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepository.deleteExpiredOtps(LocalDateTime.now());
        logger.debug("Cleaned up expired OTPs");
    }

    /**
     * Delete all OTPs for email after successful registration
     */
    @Transactional
    public void clearOtpsForEmail(String email) {
        otpRepository.deleteByEmail(email.toLowerCase().trim());
    }
}
