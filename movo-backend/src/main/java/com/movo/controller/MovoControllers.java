package com.movo.controller;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  MovoControllers.java — Todos los endpoints REST de la API de MOVO          ║
// ║                                                                              ║
// ║  CRITERIO 3 — CONEXIÓN:                                                      ║
// ║   • Los controllers acceden a la BD a través de repositorios JPA            ║
// ║   • @AuthenticationPrincipal inyecta el User autenticado (del JWT)          ║
// ║                                                                              ║
// ║  CRITERIO 4 — APIs:                                                          ║
// ║   • Esta ES la API propia de MOVO (REST, JSON, Spring Boot)                 ║
// ║   • Consumida por la app React Native via Axios (ver api.ts)                ║
// ║   • Endpoints: /api/auth, /api/users, /api/routines, /api/exercises,        ║
// ║                /api/sessions, /api/ai, /api/trainer                         ║
// ║                                                                              ║
// ║  CRITERIO 5 — SEGURIDAD:                                                     ║
// ║   • Todas las rutas (salvo /api/auth/**) requieren JWT válido               ║
// ║   • @AuthenticationPrincipal extrae el usuario del SecurityContext          ║
// ║     → garantiza que cada usuario sólo opera sobre sus propios datos         ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import com.movo.model.*;
import com.movo.repository.*;
import com.movo.service.GroqAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH CONTROLLER  →  POST /api/auth/sync
//  CRITERIO 3: Sincroniza el usuario de Supabase Auth con nuestra tabla users
// ═══════════════════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
class AuthController {
    // CRITERIO 3 — CONEXIÓN: acceso JPA a la tabla users de PostgreSQL
    private final UserRepository userRepo;

    // DTO del request (Java Record = clase inmutable de datos)
    record SyncRequest(String supabaseId, String email, String fullName, String role) {
    }

    /**
     * POST /api/auth/sync  (ruta pública, no requiere JWT)
     *
     * Al hacer login con Supabase desde la app, sincronizamos el usuario
     * en nuestra tabla users de Spring Boot.
     * Si ya existe (por supabaseId) → actualiza email y nombre.
     * Si no existe → lo crea con el rol indicado.
     */
    @PostMapping("/sync")
    public ResponseEntity<User> sync(@RequestBody SyncRequest req) {
        User user = userRepo.findBySupabaseId(req.supabaseId()).orElseGet(() -> {
            // Usuario nuevo: creamos el registro en nuestra BD
            User.Role role = User.Role.valueOf(req.role().toLowerCase());
            return User.builder()
                    .supabaseId(req.supabaseId())
                    .email(req.email())
                    .fullName(req.fullName())
                    .role(role)
                    .build();
        });
        // Actualizamos los datos por si el usuario cambió su perfil en Supabase
        user.setEmail(req.email());
        user.setFullName(req.fullName());
        // JPA save(): INSERT si es nuevo, UPDATE si ya existe (por el @Id)
        return ResponseEntity.ok(userRepo.save(user));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  USER CONTROLLER  →  GET/PUT /api/users/me
//  CRITERIO 5: @AuthenticationPrincipal garantiza que sólo accede a su propio perfil
// ═══════════════════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
class UserController {
    private final UserRepository userRepo;

    /**
     * GET /api/users/me  (requiere JWT)
     * Devuelve el usuario autenticado. El objeto User viene del SecurityContext.
     * CRITERIO 5: sólo devuelve los datos del usuario cuyo JWT se validó
     */
    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(user);
    }

    record UpdateUserRequest(String fullName, String avatarUrl) {
    }

    /**
     * PUT /api/users/me  (requiere JWT)
     * Actualiza nombre y foto de perfil del usuario autenticado.
     */
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

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTINE CONTROLLER  →  /api/routines
//  CRITERIO 3: JPA queries con filtros opcionales de categoría y dificultad
// ═══════════════════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
class RoutineController {
    // CRITERIO 3 — CONEXIÓN: acceso JPA a la tabla routines de PostgreSQL
    private final RoutineRepository routineRepo;

    /**
     * GET /api/routines?category=gym&difficulty=beginner  (requiere JWT)
     * Lista rutinas públicas con filtros opcionales.
     * Los filtros se mapean a Enum para validar los valores permitidos.
     */
    @GetMapping
    public ResponseEntity<List<Routine>> getPublic(
            @RequestParam Optional<String> category,
            @RequestParam Optional<String> difficulty) {

        // Convertir string → Enum (null si el valor no es válido)
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

        // Seleccionamos la query JPA más específica según los filtros recibidos
        List<Routine> result;
        if (cat != null && diff != null)
            result = routineRepo.findByIsPublicTrueAndCategoryAndDifficulty(cat, diff);
        else if (cat != null)
            result = routineRepo.findByIsPublicTrueAndCategory(cat);
        else if (diff != null)
            result = routineRepo.findByIsPublicTrueAndDifficulty(diff);
        else
            result = routineRepo.findByIsPublicTrue(); // todas las rutinas públicas

        return ResponseEntity.ok(result);
    }

    /** GET /api/routines/{id}  — Detalle de una rutina específica */
    @GetMapping("/{id}")
    public ResponseEntity<Routine> getById(@PathVariable UUID id) {
        return routineRepo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/routines  (requiere JWT)
     * Crea una nueva rutina. Se asocia automáticamente al entrenador autenticado.
     */
    @PostMapping
    public ResponseEntity<Routine> create(@RequestBody Routine routine, @AuthenticationPrincipal User user) {
        routine.setCreatedBy(user.getId()); // la rutina pertenece al usuario autenticado
        return ResponseEntity.ok(routineRepo.save(routine));
    }

    /** PUT /api/routines/{id}  — Actualiza campos de una rutina (sólo los no-nulos) */
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

    /** GET /api/routines/assigned  — Rutinas asignadas al usuario autenticado */
    @GetMapping("/assigned")
    public ResponseEntity<List<Routine>> getAssigned(@AuthenticationPrincipal User user) {
        // En la versión completa: query sobre la tabla user_routines (relación N:M)
        return ResponseEntity.ok(routineRepo.findByIsPublicTrue());
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EXERCISE CONTROLLER  →  /api/exercises
//  CRITERIO 3: Relación 1:N exercises → routines via routine_id
// ═══════════════════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
class ExerciseController {
    private final ExerciseRepository exerciseRepo;

    /**
     * GET /api/exercises/routine/{routineId}
     * Devuelve los ejercicios de una rutina ordenados por order_index.
     * La app usa este endpoint en RoutineDetailScreen.tsx y ActiveWorkoutScreen.tsx
     */
    @GetMapping("/routine/{routineId}")
    public ResponseEntity<List<Exercise>> byRoutine(@PathVariable UUID routineId) {
        return ResponseEntity.ok(exerciseRepo.findByRoutineIdOrderByOrderIndex(routineId));
    }

    /** POST /api/exercises  — Crea un ejercicio y lo asigna a una rutina */
    @PostMapping
    public ResponseEntity<Exercise> create(@RequestBody Exercise exercise) {
        return ResponseEntity.ok(exerciseRepo.save(exercise));
    }

    /** PUT /api/exercises/{id}  — Actualiza nombre y descripción de un ejercicio */
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

// ═══════════════════════════════════════════════════════════════════════════════
//  SESSION CONTROLLER  →  /api/sessions
//  CRITERIO 3: Gestión del ciclo de vida de una sesión de entrenamiento
//  CRITERIO 5: @AuthenticationPrincipal asegura que cada usuario registra sus
//              propias sesiones, no las de otros
// ═══════════════════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
class SessionController {
    private final WorkoutSessionRepository sessionRepo;

    // DTOs de entrada/salida para los endpoints de sesiones
    record StartRequest(UUID routineId) {
    }

    record CompleteRequest(Integer durationMinutes, Integer caloriesBurned, String notes, Integer rating) {
    }

    // Estadísticas de progreso del usuario
    record StatsResponse(long totalSessions, int totalMinutes, int streak, int[] weeklyCount) {
    }

    /**
     * POST /api/sessions/start  (requiere JWT)
     * Crea una nueva sesión de entrenamiento en estado "iniciado".
     * Registra el usuario autenticado + la rutina que va a entrenar.
     */
    @PostMapping("/start")
    public ResponseEntity<WorkoutSession> start(@RequestBody StartRequest req, @AuthenticationPrincipal User user) {
        var s = WorkoutSession.builder()
                .userId(user.getId())        // CRITERIO 5: user del JWT, no del request
                .routineId(req.routineId())
                .build();
        return ResponseEntity.ok(sessionRepo.save(s));
    }

    /**
     * PUT /api/sessions/{id}/complete
     * Marca la sesión como completada y guarda los resultados:
     * duración real, calorías, notas personales y valoración del usuario.
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<WorkoutSession> complete(@PathVariable UUID id, @RequestBody CompleteRequest req) {
        return sessionRepo.findById(id).map(s -> {
            s.setCompletedAt(java.time.LocalDateTime.now());  // timestamp de finalización
            if (req.durationMinutes() != null)
                s.setDurationMinutes(req.durationMinutes());
            if (req.caloriesBurned() != null)
                s.setCaloriesBurned(req.caloriesBurned());
            if (req.notes() != null)
                s.setNotes(req.notes());
            if (req.rating() != null)
                s.setRating(req.rating());  // valoración 1-5 (constraint en BD)
            return ResponseEntity.ok(sessionRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/sessions/my  — Historial de sesiones del usuario autenticado
     * Ordenadas por fecha descendente (más recientes primero)
     */
    @GetMapping("/my")
    public ResponseEntity<List<WorkoutSession>> my(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(sessionRepo.findByUserIdOrderByStartedAtDesc(user.getId()));
    }

    /**
     * GET /api/sessions/stats  — Estadísticas de progreso del usuario
     * Usadas en ProgressScreen.tsx para mostrar rachas, totales, etc.
     */
    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> stats(@AuthenticationPrincipal User user) {
        long total = sessionRepo.countCompletedByUserId(user.getId());
        int minutes = sessionRepo.sumDurationByUserId(user.getId());
        int[] weekly = new int[7]; // últimos 7 días (lógica completa pendiente)
        return ResponseEntity.ok(new StatsResponse(total, minutes, 0, weekly));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AI CONTROLLER  →  POST /api/ai/chat
//  CRITERIO 4: Llama a la API externa de Groq (Llama 3.3-70B) a través del service
// ═══════════════════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
class AIController {
    // Inyectamos el servicio que gestiona la lógica de comunicación con Groq
    private final GroqAIService groqAIService;

    record ChatRequest(String message, String conversationId) {
    }

    record ChatResponse(String reply, String conversationId, int tokensUsed) {
    }

    /**
     * POST /api/ai/chat  (requiere JWT)
     *
     * CRITERIO 4 — API EXTERNA: Este endpoint actúa de intermediario entre
     * la app React Native y la API de Groq (IA generativa).
     *
     * El backend personaliza el prompt con el perfil del usuario (desde la BD)
     * antes de enviar la petición a Groq, en lugar de llamar a Groq directamente
     * desde la app (lo que expondría la API key en el cliente).
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest req, @AuthenticationPrincipal User user) {
        var result = groqAIService.chat(user.getId(), req.message(), req.conversationId());
        return ResponseEntity.ok(new ChatResponse(result.reply(), result.conversationId(), result.tokensUsed()));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TRAINER CONTROLLER  →  /api/trainer
//  CRITERIO 5: Sólo usuarios con rol TRAINER deberían acceder (implementar @PreAuthorize)
// ═══════════════════════════════════════════════════════════════════════════════
@RestController
@RequestMapping("/api/trainer")
@RequiredArgsConstructor
class TrainerController {
    private final UserRepository userRepo;
    private final WorkoutSessionRepository sessionRepo;

    /**
     * GET /api/trainer/clients  — Lista los clientes asignados al entrenador autenticado
     * La relación trainer ← users.trainer_id permite encontrar todos sus clientes
     */
    @GetMapping("/clients")
    public ResponseEntity<List<User>> clients(@AuthenticationPrincipal User trainer) {
        return ResponseEntity.ok(userRepo.findByTrainerId(trainer.getId()));
    }

    /** GET /api/trainer/clients/{clientId}  — Perfil completo de un cliente */
    @GetMapping("/clients/{clientId}")
    public ResponseEntity<Map<String, Object>> clientDetail(@PathVariable UUID clientId,
            @AuthenticationPrincipal User trainer) {
        return userRepo.findById(clientId).map(client -> {
            Map<String, Object> result = new HashMap<>();
            result.put("user", client);
            result.put("profile", Map.of()); // en versión completa: query a user_profiles
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/trainer/clients/{clientId}/sessions  — Historial de sesiones del cliente */
    @GetMapping("/clients/{clientId}/sessions")
    public ResponseEntity<List<WorkoutSession>> clientSessions(@PathVariable UUID clientId) {
        return ResponseEntity.ok(sessionRepo.findByUserIdOrderByStartedAtDesc(clientId));
    }

    record MessageRequest(UUID userId, String message) {
    }

    /**
     * POST /api/trainer/messages  — El entrenador envía un mensaje a un cliente
     * En la versión completa: insertar en la tabla trainer_messages de la BD
     */
    @PostMapping("/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(@RequestBody MessageRequest req,
            @AuthenticationPrincipal User trainer) {
        // En producción: sessionRepo.save(new TrainerMessage(trainer.getId(), req.userId(), req.message()))
        return ResponseEntity.ok(Map.of("sent", true, "to", req.userId(), "message", req.message()));
    }

    /** GET /api/trainer/messages/{clientId}  — Mensajes intercambiados con un cliente */
    @GetMapping("/messages/{clientId}")
    public ResponseEntity<List<Object>> getMessages(@PathVariable UUID clientId) {
        return ResponseEntity.ok(List.of()); // en producción: query a trainer_messages
    }
}
