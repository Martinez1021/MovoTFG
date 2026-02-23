package com.movo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtRespuesta {
    private String token;
    private String tipo = "Bearer";
    private Long id;
    private String nombreUsuario;
    private String email;
    private Integer nivel;
    private Integer xp;

    public JwtRespuesta(String token, Long id, String nombreUsuario, String email, Integer nivel, Integer xp) {
        this.token = token;
        this.id = id;
        this.nombreUsuario = nombreUsuario;
        this.email = email;
        this.nivel = nivel;
        this.xp = xp;
    }
}
