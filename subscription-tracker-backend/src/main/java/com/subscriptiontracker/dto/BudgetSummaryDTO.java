package com.subscriptiontracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetSummaryDTO {
    private Double monthlyIncome;
    private Double monthlyExpenses;
    private Double subscriptionTotal;
    private Double remainingBudget;
    private Double budgetPercentageUsed;
    private List<BudgetHistoryDTO> history;
}