package com.subscriptiontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessPaymentRequest {
    private String transactionId;
    private String cardNumber; // Test card: use 4111111111111111 for success, 4000000000000002 for failure
    private String cardExpiry; // MM/YY
    private String cardCvv;
    private String cardHolderName;
    private String upiId; // For UPI payments
    private String bankCode; // For netbanking
    private String walletProvider; // For wallet payments
}
