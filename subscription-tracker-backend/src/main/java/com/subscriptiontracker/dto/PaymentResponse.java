package com.subscriptiontracker.dto;

import com.subscriptiontracker.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private String transactionId;
    private Long subscriptionId;
    private String subscriptionName;
    private String subscriptionLogo;
    private Long planId;
    private String planName;
    private Double amount;
    private String currency;
    private Payment.PaymentStatus status;
    private String paymentMethod;
    private String subscriptionType;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
