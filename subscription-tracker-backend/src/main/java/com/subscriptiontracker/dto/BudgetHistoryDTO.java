package com.subscriptiontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetHistoryDTO {
    private Integer month;
    private Integer year;
    private String monthName;
    private Double monthlyIncome;
    private Double monthlyExpenses;
    private Double subscriptionTotal;
    private Double remainingBudget;
}