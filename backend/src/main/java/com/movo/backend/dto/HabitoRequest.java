package com.movo.backend.dto;

import lombok.Data;

@Data
public class HabitoRequest {
    private String nombre;
    private String descripcion;
    private String icono;
    private String color;
    private String frecuencia;
    private Integer xpRecompensa;
}
