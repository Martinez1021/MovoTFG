package com.movo.repository;

import com.movo.model.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {
    List<WorkoutSession> findByUserIdOrderByStartedAtDesc(UUID userId);

    @Query("SELECT COALESCE(SUM(w.durationMinutes), 0) FROM WorkoutSession w WHERE w.userId = :userId AND w.completedAt IS NOT NULL")
    Integer sumDurationByUserId(UUID userId);

    @Query("SELECT COUNT(w) FROM WorkoutSession w WHERE w.userId = :userId AND w.completedAt IS NOT NULL")
    Long countCompletedByUserId(UUID userId);
}
