package com.movo.model;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  Routine.java — Entidad JPA que mapea la tabla "routines" de PostgreSQL     ║
// ║                                                                              ║
// ║  CRITERIO 2 — DISEÑO DE LA BD:                                              ║
// ║   • @Entity + @Table: Hibernate mapea esta clase ↔ tabla routines           ║
// ║   • @Id + @UuidGenerator: clave primaria UUID (no INT autoincremenal)       ║
// ║   • @Enumerated(STRING): los enums se guardan como texto ('gym', 'yoga'...) ║
// ║     → legible en la BD, y no depende del orden de declaración del enum      ║
// ║   • @PrePersist: hook automático que rellena createdAt al insertar          ║
// ║                                                                              ║
// ║  CRITERIO 3 — CONEXIÓN:                                                      ║
// ║   • Lombok @Data: genera getters/setters automáticamente (menos código)     ║
// ║   • Lombok @Builder: permite crear objetos con el patrón builder            ║
// ║     Ejemplo: Routine.builder().title("Full Body").category(gym).build()     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

// @Entity → esta clase es una entidad gestionada por JPA/Hibernate
// @Table(name = "routines") → mapea a la tabla "routines" en el esquema "public" de PostgreSQL
@Entity
@Table(name = "routines")
@Data               // Lombok: genera toString, equals, hashCode, getters y setters
@NoArgsConstructor  // Lombok: constructor sin argumentos (requerido por JPA)
@AllArgsConstructor // Lombok: constructor con todos los campos
@Builder            // Lombok: patrón builder (Routine.builder().title("...").build())
public class Routine {

    // CRITERIO 1 + 2: UUID como clave primaria (no INT)
    // updatable=false → el ID nunca cambia una vez creado
    @Id
    @UuidGenerator  // Hibernate genera el UUID v4 automáticamente al persistir
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)  // NOT NULL a nivel de Java (también en el DDL del schema)
    private String title;

    // TEXT en PostgreSQL → columnDefinition para que Hibernate no use VARCHAR(255)
    @Column(columnDefinition = "TEXT")
    private String description;

    // CRITERIO 2: Category es un enum Java mapeable a CHECK constraint en PostgreSQL
    // @Enumerated(STRING) → guarda 'gym', 'yoga', o 'pilates' (no 0, 1, 2)
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Category category;

    // CRITERIO 2: Difficulty enum → 'beginner', 'intermediate', 'advanced' en BD
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    // nombre de columna con snake_case en la BD, camelCase en Java
    // Jackson convierte automáticamente (SNAKE_CASE config en application.yml)
    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    // FK nullable: UUID del usuario/entrenador que creó esta rutina
    // NULL = rutina del sistema (seed data)
    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "is_public")
    private Boolean isPublic;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // CRITERIO 2: Hook JPA que se ejecuta antes del INSERT en la BD
    // Garantiza que createdAt siempre tenga valor sin depender del DEFAULT de SQL
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // CRITERIO 2: Enums que se mapean a los CHECK constraints del schema SQL
    // Category → CHECK (category IN ('gym', 'yoga', 'pilates'))
    public enum Category {
        gym, yoga, pilates
    }

    // Difficulty → CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))
    public enum Difficulty {
        beginner, intermediate, advanced
    }
}
