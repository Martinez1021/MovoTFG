package com.movo.backend.entidad;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "registros_habitos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroHabito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habito_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Habito habito;

    @Column(name = "completado_en", nullable = false)
    private LocalDate completadoEn;

    @Column(name = "xp_ganado")
    @Builder.Default
    private Integer xpGanado = 10;
}
