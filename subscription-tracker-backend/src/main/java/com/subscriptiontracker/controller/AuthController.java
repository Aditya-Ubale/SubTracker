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
