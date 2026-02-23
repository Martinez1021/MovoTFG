package com.movo.backend.servicio;

import com.movo.backend.dto.*;
import com.movo.backend.entidad.Usuario;
import com.movo.backend.repositorio.UsuarioRepositorio;
import com.movo.backend.seguridad.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public JwtRespuesta registrar(RegistroRequest request) {
        if (usuarioRepositorio.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El correo ya está en uso");
        }
        if (usuarioRepositorio.existsByNombreUsuario(request.getNombreUsuario())) {
            throw new IllegalArgumentException("El nombre de usuario ya existe");
        }

        Usuario usuario = Usuario.builder()
                .nombreUsuario(request.getNombreUsuario())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        usuario = usuarioRepositorio.save(usuario);
        String token = jwtUtil.generarToken(usuario.getEmail());

        return new JwtRespuesta(token, usuario.getId(), usuario.getNombreUsuario(),
                usuario.getEmail(), usuario.getNivel(), usuario.getXp());
    }

    public JwtRespuesta login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (AuthenticationException e) {
            throw new IllegalArgumentException("Correo o contraseña incorrectos");
        }

        Usuario usuario = usuarioRepositorio.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String token = jwtUtil.generarToken(usuario.getEmail());

        return new JwtRespuesta(token, usuario.getId(), usuario.getNombreUsuario(),
                usuario.getEmail(), usuario.getNivel(), usuario.getXp());
    }
}
