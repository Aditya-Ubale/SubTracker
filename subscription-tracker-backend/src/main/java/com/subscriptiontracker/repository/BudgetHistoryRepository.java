package com.subscriptiontracker.repository;

import com.subscriptiontracker.entity.BudgetHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetHistoryRepository extends JpaRepository<BudgetHistory, Long> {

    List<BudgetHistory> findByUserIdOrderByYearDescMonthDesc(Long userId);

    @Query("SELECT bh FROM BudgetHistory bh WHERE bh.user.id = :userId " +
            "ORDER BY bh.year DESC, bh.month DESC LIMIT 12")
    List<BudgetHistory> findLast12MonthsByUserId(@Param("userId") Long userId);

    BudgetHistory findByUserIdAndMonthAndYear(Long userId, Integer month, Integer year);
}