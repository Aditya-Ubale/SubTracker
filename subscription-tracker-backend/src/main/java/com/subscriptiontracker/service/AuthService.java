package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.AuthResponse;
import com.subscriptiontracker.dto.LoginRequest;
import com.subscriptiontracker.dto.ResetPasswordRequest;
import com.subscriptiontracker.dto.SignupRequest;
import com.subscriptiontracker.entity.User;
import com.subscriptiontracker.exception.BadRequestException;
import com.subscriptiontracker.repository.UserRepository;
import com.subscriptiontracker.security.JwtUtils;
import com.subscriptiontracker.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired(required = false) // Make email service optional
    private EmailService emailService;

    @Autowired
    private OtpService otpService;

    /**
     * Register a new user (requires verified email via OTP)
     */
    @Transactional
    public AuthResponse signup(SignupRequest signupRequest) {
        String email = signupRequest.getEmail().toLowerCase().trim();

        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered! Please login instead.");
        }

        // Verify that email has been verified via OTP
        if (!otpService.isEmailVerified(email)) {
            throw new BadRequestException(
                    "Please verify your email address first. Request an OTP and verify it before signing up.");
        }

        // Validate password doesn't contain spaces
        if (signupRequest.getPassword().contains(" ")) {
            throw new BadRequestException("Password cannot contain spaces");
        }

        // Create new user
        User user = User.builder()
                .name(signupRequest.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(signupRequest.getPassword()))
                .monthlyIncome(0.0)
                .monthlyExpenses(0.0)
                .build();

        // Save user to database
        User savedUser = userRepository.save(user);

        // Clear OTPs for this email after successful registration
        otpService.clearOtpsForEmail(email);

        // Send welcome email (don't fail if email service is unavailable)
        try {
            if (emailService != null) {
                emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName());
            }
        } catch (Exception e) {
            logger.warn("Failed to send welcome email to {}: {}", savedUser.getEmail(), e.getMessage());
            // Don't throw exception - user registration should still succeed
        }

        // Generate JWT token
        UserDetailsImpl userDetails = UserDetailsImpl.build(savedUser);
        String jwt = jwtUtils.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .message("User registered successfully!")
                .build();
    }

    /**
     * Authenticate user and return JWT
     */
    public AuthResponse login(LoginRequest loginRequest) {
        String email = loginRequest.getEmail().toLowerCase().trim();

        // First check if user exists
        if (!userRepository.existsByEmail(email)) {
            throw new BadRequestException("No account found with this email. Please create an account first.");
        }

        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            loginRequest.getPassword()));

            // Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get user details
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            // Generate JWT token
            String jwt = jwtUtils.generateToken(userDetails);

            return AuthResponse.builder()
                    .token(jwt)
                    .type("Bearer")
                    .id(userDetails.getId())
                    .name(userDetails.getName())
                    .email(userDetails.getEmail())
                    .message("Login successful!")
                    .build();

        } catch (BadCredentialsException e) {
            throw new BadRequestException("Invalid password. Please try again.");
        }
    }

    /**
     * Get current authenticated user
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    /**
     * Get current user ID
     */
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }

    /**
     * Send password reset OTP to user's email
     */
    public String sendPasswordResetOtp(String email) {
        email = email.toLowerCase().trim();

        try {
            // Use the dedicated password reset OTP method
            otpService.sendPasswordResetOtp(email);
            logger.info("Password reset OTP sent to: {}", email);
            return "Password reset OTP sent to your email. Please check your inbox.";
        } catch (BadRequestException e) {
            // Re-throw BadRequestException as-is (e.g., "No account found")
            throw e;
        } catch (Exception e) {
            logger.error("Failed to send password reset OTP to {}: {}", email, e.getMessage());
            throw new BadRequestException("Failed to send OTP. Please try again later.");
        }
    }

    /**
     * Reset password using OTP verification
     */
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check if user exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with this email address."));

        // Validate OTP for password reset (doesn't mark as used yet)
        boolean isValid = otpService.validateOtpForPasswordReset(email, request.getOtp());
        if (!isValid) {
            throw new BadRequestException("Invalid or expired OTP. Please request a new one.");
        }

        // Validate new password
        String newPassword = request.getNewPassword();
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }
        if (newPassword.contains(" ")) {
            throw new BadRequestException("Password cannot contain spaces.");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Clear OTPs for this email
        otpService.clearOtpsForEmail(email);

        logger.info("Password reset successful for: {}", email);
        return "Password reset successful! You can now login with your new password.";
    }
}
