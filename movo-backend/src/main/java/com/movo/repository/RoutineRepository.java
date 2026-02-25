package com.movo.repository;

import com.movo.model.Routine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoutineRepository extends JpaRepository<Routine, UUID> {
    List<Routine> findByIsPublicTrue();

    List<Routine> findByIsPublicTrueAndCategory(Routine.Category category);

    List<Routine> findByIsPublicTrueAndDifficulty(Routine.Difficulty difficulty);

    List<Routine> findByIsPublicTrueAndCategoryAndDifficulty(Routine.Category category, Routine.Difficulty difficulty);

    List<Routine> findByCreatedBy(UUID createdBy);
}
