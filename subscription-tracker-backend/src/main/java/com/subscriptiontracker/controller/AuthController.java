package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.*;
import com.subscriptiontracker.entity.User;
import com.subscriptiontracker.service.AuthService;
import com.subscriptiontracker.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OtpService otpService;

    // Send OTP for email verification
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody OtpRequest request) {
        String message = otpService.sendOtp(request);
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    // Verify OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        boolean verified = otpService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully!", verified));
    }

    // User Registration (requires verified email)
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> registerUser(
            @Valid @RequestBody SignupRequest signupRequest) {
        AuthResponse authResponse = authService.signup(signupRequest);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully!", authResponse));
    }

    // User Login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(
            @Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful!", authResponse));
    }

    // Get current user profile
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDTO>> getCurrentUser() {
        User user = authService.getCurrentUser();

        UserProfileDTO profileDTO = UserProfileDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .monthlyIncome(user.getMonthlyIncome())
                .monthlyExpenses(user.getMonthlyExpenses())
                .createdAt(user.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.success(profileDTO));
    }

    // Update current user profile (name)
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDTO>> updateProfile(
            @RequestBody java.util.Map<String, String> updates) {
        User user = authService.getCurrentUser();

        if (updates.containsKey("name")) {
            String newName = updates.get("name").trim();
            if (newName.length() < 2) {
                throw new com.subscriptiontracker.exception.BadRequestException("Name must be at least 2 characters");
            }
            user.setName(newName);
        }

        User savedUser = authService.saveUser(user);

        UserProfileDTO profileDTO = UserProfileDTO.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .monthlyIncome(savedUser.getMonthlyIncome())
                .monthlyExpenses(savedUser.getMonthlyExpenses())
                .createdAt(savedUser.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully!", profileDTO));
    }

    // Change password (from settings - requires current password)
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@RequestBody java.util.Map<String, String> passwords) {
        String currentPassword = passwords.get("currentPassword");
        String newPassword = passwords.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            throw new com.subscriptiontracker.exception.BadRequestException(
                    "Current password and new password are required");
        }

        String message = authService.changePassword(currentPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    // Forgot Password - Send OTP to registered email
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.sendPasswordResetOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    // Reset Password - Verify OTP and update password
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        String message = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }
}
