package com.subscriptiontracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class BudgetRequest {

    @NotNull(message = "Monthly income is required")
    @Positive(message = "Monthly income must be positive")
    private Double monthlyIncome;

    @NotNull(message = "Monthly expenses is required")
    @Positive(message = "Monthly expenses must be positive")
    private Double monthlyExpenses;
}