package com.movo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class EstadisticasHabito {
    private Long habitoId;
    private String nombre;
    private Integer rachaActual;
    private Integer mejorRacha;
    private List<LocalDate> fechasCompletadas;
    private long totalCompletados;
}
