package com.movo.backend.repositorio;

import com.movo.backend.entidad.Habito;
import com.movo.backend.entidad.RegistroHabito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RegistroHabitoRepositorio extends JpaRepository<RegistroHabito, Long> {
    List<RegistroHabito> findByHabitoAndCompletadoEnBetween(Habito habito, LocalDate inicio, LocalDate fin);

    Optional<RegistroHabito> findByHabitoAndCompletadoEn(Habito habito, LocalDate fecha);

    boolean existsByHabitoAndCompletadoEn(Habito habito, LocalDate fecha);

    @Query("SELECT COUNT(r) FROM RegistroHabito r WHERE r.habito.usuario.id = :usuarioId")
    long contarTotalPorUsuario(@Param("usuarioId") Long usuarioId);
}
