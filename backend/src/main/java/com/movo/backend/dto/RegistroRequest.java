package com.movo.backend.dto;

import lombok.Data;

@Data
public class RegistroRequest {
    private String nombreUsuario;
    private String email;
    private String password;
}
