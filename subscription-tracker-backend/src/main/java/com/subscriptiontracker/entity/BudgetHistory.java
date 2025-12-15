package com.subscriptiontracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "budget_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer month; // 1-12
    private Integer year;

    @Column(name = "monthly_income")
    private Double monthlyIncome;

    @Column(name = "monthly_expenses")
    private Double monthlyExpenses;

    @Column(name = "subscription_total")
    private Double subscriptionTotal;

    @Column(name = "remaining_budget")
    private Double remainingBudget;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}