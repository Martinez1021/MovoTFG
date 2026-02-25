package com.movo.controller;

import com.movo.model.*;
import com.movo.repository.*;
import com.movo.service.GrokAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

// ═══════════════════════════════════════════════════════════════════
//   AUTH CONTROLLER
// ═══════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
class AuthController {
    private final UserRepository userRepo;

    record SyncRequest(String supabaseId, String email, String fullName, String role) {
    }

    @PostMapping("/sync")
    public ResponseEntity<User> sync(@RequestBody SyncRequest req) {
        User user = userRepo.findBySupabaseId(req.supabaseId()).orElseGet(() -> {
            User.Role role = User.Role.valueOf(req.role().toLowerCase());
            return User.builder()
                    .supabaseId(req.supabaseId())
                    .email(req.email())
                    .fullName(req.fullName())
                    .role(role)
                    .build();
        });
        user.setEmail(req.email());
        user.setFullName(req.fullName());
        return ResponseEntity.ok(userRepo.save(user));
    }
}

// ═══════════════════════════════════════════════════════════════════
// USER CONTROLLER
// ═══════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
class UserController {
    private final UserRepository userRepo;

    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(user);
    }

    record UpdateUserRequest(String fullName, String avatarUrl) {
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateMe(@RequestBody UpdateUserRequest req,
            @AuthenticationPrincipal User user) {
        if (req.fullName() != null)
            user.setFullName(req.fullName());
        if (req.avatarUrl() != null)
            user.setAvatarUrl(req.avatarUrl());
        return ResponseEntity.ok(userRepo.save(user));
    }
}

// ═══════════════════════════════════════════════════════════════════
// ROUTINE CONTROLLER
// ═══════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
class RoutineController {
    private final RoutineRepository routineRepo;

    @GetMapping
    public ResponseEntity<List<Routine>> getPublic(
            @RequestParam Optional<String> category,
            @RequestParam Optional<String> difficulty) {

        Routine.Category cat = category.flatMap(c -> {
            try {
                return Optional.of(Routine.Category.valueOf(c));
            } catch (Exception e) {
                return Optional.empty();
            }
        }).orElse(null);

        Routine.Difficulty diff = difficulty.flatMap(d -> {
            try {
                return Optional.of(Routine.Difficulty.valueOf(d));
            } catch (Exception e) {
                return Optional.empty();
            }
        }).orElse(null);

        List<Routine> result;
        if (cat != null && diff != null)
            result = routineRepo.findByIsPublicTrueAndCategoryAndDifficulty(cat, diff);
        else if (cat != null)
            result = routineRepo.findByIsPublicTrueAndCategory(cat);
        else if (diff != null)
            result = routineRepo.findByIsPublicTrueAndDifficulty(diff);
        else
            result = routineRepo.findByIsPublicTrue();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Routine> getById(@PathVariable UUID id) {
        return routineRepo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Routine> create(@RequestBody Routine routine, @AuthenticationPrincipal User user) {
        routine.setCreatedBy(user.getId());
        return ResponseEntity.ok(routineRepo.save(routine));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Routine> update(@PathVariable UUID id, @RequestBody Routine updates) {
        return routineRepo.findById(id).map(r -> {
            if (updates.getTitle() != null)
                r.setTitle(updates.getTitle());
            if (updates.getDescription() != null)
                r.setDescription(updates.getDescription());
            if (updates.getDurationMinutes() != null)
                r.setDurationMinutes(updates.getDurationMinutes());
            return ResponseEntity.ok(routineRepo.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<Routine>> getAssigned(@AuthenticationPrincipal User user) {
        // In full version: query user_routines table – returning public for now
        return ResponseEntity.ok(routineRepo.findByIsPublicTrue());
    }
}

// ═══════════════════════════════════════════════════════════════════
// EXERCISE CONTROLLER
// ═══════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
class ExerciseController {
    private final ExerciseRepository exerciseRepo;

    @GetMapping("/routine/{routineId}")
    public ResponseEntity<List<Exercise>> byRoutine(@PathVariable UUID routineId) {
        return ResponseEntity.ok(exerciseRepo.findByRoutineIdOrderByOrderIndex(routineId));
    }

    @PostMapping
    public ResponseEntity<Exercise> create(@RequestBody Exercise exercise) {
        return ResponseEntity.ok(exerciseRepo.save(exercise));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Exercise> update(@PathVariable UUID id, @RequestBody Exercise updates) {
        return exerciseRepo.findById(id).map(e -> {
            if (updates.getName() != null)
                e.setName(updates.getName());
            if (updates.getDescription() != null)
                e.setDescription(updates.getDescription());
            return ResponseEntity.ok(exerciseRepo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }
}

// ═══════════════════════════════════════════════════════════════════
// SESSION CONTROLLER
// ═══════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
class SessionController {
    private final WorkoutSessionRepository sessionRepo;

    record StartRequest(UUID routineId) {
    }

    record CompleteRequest(Integer durationMinutes, Integer caloriesBurned, String notes, Integer rating) {
    }

    record StatsResponse(long totalSessions, int totalMinutes, int streak, int[] weeklyCount) {
    }

    @PostMapping("/start")
    public ResponseEntity<WorkoutSession> start(@RequestBody StartRequest req, @AuthenticationPrincipal User user) {
        var s = WorkoutSession.builder().userId(user.getId()).routineId(req.routineId()).build();
        return ResponseEntity.ok(sessionRepo.save(s));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<WorkoutSession> complete(@PathVariable UUID id, @RequestBody CompleteRequest req) {
        return sessionRepo.findById(id).map(s -> {
            s.setCompletedAt(java.time.LocalDateTime.now());
            if (req.durationMinutes() != null)
                s.setDurationMinutes(req.durationMinutes());
            if (req.caloriesBurned() != null)
                s.setCaloriesBurned(req.caloriesBurned());
            if (req.notes() != null)
                s.setNotes(req.notes());
            if (req.rating() != null)
                s.setRating(req.rating());
            return ResponseEntity.ok(sessionRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my")
    public ResponseEntity<List<WorkoutSession>> my(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(sessionRepo.findByUserIdOrderByStartedAtDesc(user.getId()));
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> stats(@AuthenticationPrincipal User user) {
        long total = sessionRepo.countCompletedByUserId(user.getId());
        int minutes = sessionRepo.sumDurationByUserId(user.getId());
        int[] weekly = new int[7]; // simplified — full streak calc would need date logic
        return ResponseEntity.ok(new StatsResponse(total, minutes, 0, weekly));
    }
}

// ═══════════════════════════════════════════════════════════════════
// AI CONTROLLER
// ═══════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
class AIController {
    private final GrokAIService grokAIService;

    record ChatRequest(String message, String conversationId) {
    }

    record ChatResponse(String reply, String conversationId, int tokensUsed) {
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest req, @AuthenticationPrincipal User user) {
        var result = grokAIService.chat(user.getId(), req.message(), req.conversationId());
        return ResponseEntity.ok(new ChatResponse(result.reply(), result.conversationId(), result.tokensUsed()));
    }
}

// ═══════════════════════════════════════════════════════════════════
// TRAINER CONTROLLER
// ═══════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/trainer")
@RequiredArgsConstructor
class TrainerController {
    private final UserRepository userRepo;
    private final WorkoutSessionRepository sessionRepo;

    @GetMapping("/clients")
    public ResponseEntity<List<User>> clients(@AuthenticationPrincipal User trainer) {
        return ResponseEntity.ok(userRepo.findByTrainerId(trainer.getId()));
    }

    @GetMapping("/clients/{clientId}")
    public ResponseEntity<Map<String, Object>> clientDetail(@PathVariable UUID clientId,
            @AuthenticationPrincipal User trainer) {
        return userRepo.findById(clientId).map(client -> {
            Map<String, Object> result = new HashMap<>();
            result.put("user", client);
            result.put("profile", Map.of()); // profile from user_profiles table
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/clients/{clientId}/sessions")
    public ResponseEntity<List<WorkoutSession>> clientSessions(@PathVariable UUID clientId) {
        return ResponseEntity.ok(sessionRepo.findByUserIdOrderByStartedAtDesc(clientId));
    }

    record MessageRequest(UUID userId, String message) {
    }

    @PostMapping("/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(@RequestBody MessageRequest req,
            @AuthenticationPrincipal User trainer) {
        // In full version: save to trainer_messages table
        return ResponseEntity.ok(Map.of("sent", true, "to", req.userId(), "message", req.message()));
    }

    @GetMapping("/messages/{clientId}")
    public ResponseEntity<List<Object>> getMessages(@PathVariable UUID clientId) {
        return ResponseEntity.ok(List.of()); // return from trainer_messages table
    }
}
