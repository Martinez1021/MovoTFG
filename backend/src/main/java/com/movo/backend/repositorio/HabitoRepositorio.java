package com.movo.backend.repositorio;

import com.movo.backend.entidad.Habito;
import com.movo.backend.entidad.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface HabitoRepositorio extends JpaRepository<Habito, Long> {
    List<Habito> findByUsuario(Usuario usuario);

    Optional<Habito> findByIdAndUsuario(Long id, Usuario usuario);
}
