package com.movo.backend.entidad;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "habitos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Usuario usuario;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @Column(length = 50)
    @Builder.Default
    private String icono = "estrella";

    @Column(length = 7)
    @Builder.Default
    private String color = "#6C63FF";

    @Column(length = 20)
    @Builder.Default
    private String frecuencia = "DIARIO";

    @Column(name = "racha_actual")
    @Builder.Default
    private Integer rachaActual = 0;

    @Column(name = "mejor_racha")
    @Builder.Default
    private Integer mejorRacha = 0;

    @Column(name = "xp_recompensa")
    @Builder.Default
    private Integer xpRecompensa = 10;

    @Column(name = "creado_en")
    @Builder.Default
    private LocalDateTime creadoEn = LocalDateTime.now();

    @OneToMany(mappedBy = "habito", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<RegistroHabito> registros;
}
