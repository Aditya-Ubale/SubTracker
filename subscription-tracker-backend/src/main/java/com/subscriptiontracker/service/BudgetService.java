package com.subscriptiontracker.service;

import com.subscriptiontracker.dto.BudgetHistoryDTO;
import com.subscriptiontracker.dto.BudgetRequest;
import com.subscriptiontracker.dto.BudgetSummaryDTO;
import com.subscriptiontracker.entity.BudgetHistory;
import com.subscriptiontracker.entity.User;
import com.subscriptiontracker.repository.BudgetHistoryRepository;
import com.subscriptiontracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Month;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BudgetService {

    @Autowired
    private BudgetHistoryRepository budgetHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserSubscriptionService userSubscriptionService;

    // Get budget summary for current user
    public BudgetSummaryDTO getBudgetSummary() {
        User user = authService.getCurrentUser();
        Double subscriptionTotal = userSubscriptionService.calculateMonthlyTotal();

        Double monthlyIncome = user.getMonthlyIncome() != null ? user.getMonthlyIncome() : 0.0;
        Double monthlyExpenses = user.getMonthlyExpenses() != null ? user.getMonthlyExpenses() : 0.0;
        Double remainingBudget = monthlyIncome - monthlyExpenses - subscriptionTotal;
        Double budgetPercentageUsed = monthlyIncome > 0
                ? ((monthlyExpenses + subscriptionTotal) / monthlyIncome) * 100
                : 0.0;

        // Get budget history
        List<BudgetHistoryDTO> history = getBudgetHistory();

        return BudgetSummaryDTO.builder()
                .monthlyIncome(monthlyIncome)
                .monthlyExpenses(monthlyExpenses)
                .subscriptionTotal(subscriptionTotal)
                .remainingBudget(remainingBudget)
                .budgetPercentageUsed(Math.round(budgetPercentageUsed * 100.0) / 100.0)
                .history(history)
                .build();
    }

    // Update user's budget
    @Transactional
    public BudgetSummaryDTO updateBudget(BudgetRequest request) {
        User user = authService.getCurrentUser();

        // Update user's budget info
        user.setMonthlyIncome(request.getMonthlyIncome());
        user.setMonthlyExpenses(request.getMonthlyExpenses());
        userRepository.save(user);

        // Save to history
        saveBudgetHistory(user);

        return getBudgetSummary();
    }

    // Save current budget to history
    @Transactional
    public void saveBudgetHistory(User user) {
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        Double subscriptionTotal = userSubscriptionService.calculateMonthlyTotal();
        Double remainingBudget = user.getMonthlyIncome() - user.getMonthlyExpenses() - subscriptionTotal;

        // Check if entry for this month already exists
        BudgetHistory existing = budgetHistoryRepository.findByUserIdAndMonthAndYear(
                user.getId(), month, year);

        if (existing != null) {
            // Update existing entry
            existing.setMonthlyIncome(user.getMonthlyIncome());
            existing.setMonthlyExpenses(user.getMonthlyExpenses());
            existing.setSubscriptionTotal(subscriptionTotal);
            existing.setRemainingBudget(remainingBudget);
            budgetHistoryRepository.save(existing);
        } else {
            // Create new entry
            BudgetHistory budgetHistory = BudgetHistory.builder()
                    .user(user)
                    .month(month)
                    .year(year)
                    .monthlyIncome(user.getMonthlyIncome())
                    .monthlyExpenses(user.getMonthlyExpenses())
                    .subscriptionTotal(subscriptionTotal)
                    .remainingBudget(remainingBudget)
                    .build();
            budgetHistoryRepository.save(budgetHistory);
        }
    }

    // Get budget history (last 12 months)
    public List<BudgetHistoryDTO> getBudgetHistory() {
        Long userId = authService.getCurrentUserId();
        return budgetHistoryRepository.findLast12MonthsByUserId(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Convert Entity to DTO
    private BudgetHistoryDTO convertToDTO(BudgetHistory budgetHistory) {
        String monthName = Month.of(budgetHistory.getMonth()).name();

        return BudgetHistoryDTO.builder()
                .month(budgetHistory.getMonth())
                .year(budgetHistory.getYear())
                .monthName(monthName)
                .monthlyIncome(budgetHistory.getMonthlyIncome())
                .monthlyExpenses(budgetHistory.getMonthlyExpenses())
                .subscriptionTotal(budgetHistory.getSubscriptionTotal())
                .remainingBudget(budgetHistory.getRemainingBudget())
                .build();
    }
}