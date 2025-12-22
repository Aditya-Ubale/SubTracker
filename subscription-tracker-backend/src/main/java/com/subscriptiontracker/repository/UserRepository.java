package com.subscriptiontracker.repository;

import com.subscriptiontracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    // Admin Analytics queries
    @Query("SELECT COUNT(u) FROM User u WHERE u.lastLogin >= :since")
    Long countActiveUsersSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(u) FROM User u WHERE u.lastLogin < :since OR u.lastLogin IS NULL")
    Long countInactiveUsers(@Param("since") LocalDateTime since);

    @Query(value = "SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count " +
            "FROM users WHERE created_at >= :since GROUP BY TO_CHAR(created_at, 'YYYY-MM') " +
            "ORDER BY month ASC", nativeQuery = true)
    List<Object[]> getUserGrowthByMonth(@Param("since") LocalDateTime since);

    List<User> findAllByOrderByCreatedAtDesc();
}
