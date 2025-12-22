package com.subscriptiontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InitiatePaymentRequest {
    private Long subscriptionId;
    private Long planId;
    private String subscriptionType; // MONTHLY, YEARLY
    private String paymentMethod; // CARD, UPI, NETBANKING, WALLET
}
