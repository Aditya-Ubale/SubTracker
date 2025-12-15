package com.subscriptiontracker.controller;

import com.subscriptiontracker.dto.ApiResponse;
import com.subscriptiontracker.dto.BudgetHistoryDTO;
import com.subscriptiontracker.dto.BudgetRequest;
import com.subscriptiontracker.dto.BudgetSummaryDTO;
import com.subscriptiontracker.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budget")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    // Get budget summary
    @GetMapping
    public ResponseEntity<ApiResponse<BudgetSummaryDTO>> getBudgetSummary() {
        BudgetSummaryDTO summary = budgetService.getBudgetSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    // Update budget
    @PostMapping
    public ResponseEntity<ApiResponse<BudgetSummaryDTO>> updateBudget(
            @Valid @RequestBody BudgetRequest request) {
        BudgetSummaryDTO summary = budgetService.updateBudget(request);
        return ResponseEntity.ok(ApiResponse.success("Budget updated successfully!", summary));
    }

    // Get budget history
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<BudgetHistoryDTO>>> getBudgetHistory() {
        List<BudgetHistoryDTO> history = budgetService.getBudgetHistory();
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}