package com.movo.backend.repositorio;

import com.movo.backend.entidad.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepositorio extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

    boolean existsByEmail(String email);

    boolean existsByNombreUsuario(String nombreUsuario);
}
