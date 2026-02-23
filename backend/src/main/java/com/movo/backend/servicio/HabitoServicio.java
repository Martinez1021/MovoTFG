package com.movo.backend.servicio;

import com.movo.backend.dto.EstadisticasHabito;
import com.movo.backend.dto.HabitoRequest;
import com.movo.backend.entidad.Habito;
import com.movo.backend.entidad.RegistroHabito;
import com.movo.backend.entidad.Usuario;
import com.movo.backend.repositorio.HabitoRepositorio;
import com.movo.backend.repositorio.RegistroHabitoRepositorio;
import com.movo.backend.repositorio.UsuarioRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitoServicio {

    private final HabitoRepositorio habitoRepositorio;
    private final RegistroHabitoRepositorio registroRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;

    public List<Habito> obtenerHabitos(String email) {
        Usuario usuario = obtenerUsuarioPorEmail(email);
        return habitoRepositorio.findByUsuario(usuario);
    }

    public Habito crearHabito(String email, HabitoRequest request) {
        Usuario usuario = obtenerUsuarioPorEmail(email);
        Habito habito = Habito.builder()
                .usuario(usuario)
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .icono(request.getIcono() != null ? request.getIcono() : "estrella")
                .color(request.getColor() != null ? request.getColor() : "#6C63FF")
                .frecuencia(request.getFrecuencia() != null ? request.getFrecuencia() : "DIARIO")
                .xpRecompensa(request.getXpRecompensa() != null ? request.getXpRecompensa() : 10)
                .build();
        return habitoRepositorio.save(habito);
    }

    public Habito actualizarHabito(String email, Long id, HabitoRequest request) {
        Usuario usuario = obtenerUsuarioPorEmail(email);
        Habito habito = habitoRepositorio.findByIdAndUsuario(id, usuario)
                .orElseThrow(() -> new IllegalArgumentException("Hábito no encontrado"));

        if (request.getNombre() != null)
            habito.setNombre(request.getNombre());
        if (request.getDescripcion() != null)
            habito.setDescripcion(request.getDescripcion());
        if (request.getIcono() != null)
            habito.setIcono(request.getIcono());
        if (request.getColor() != null)
            habito.setColor(request.getColor());
        if (request.getFrecuencia() != null)
            habito.setFrecuencia(request.getFrecuencia());
        if (request.getXpRecompensa() != null)
            habito.setXpRecompensa(request.getXpRecompensa());

        return habitoRepositorio.save(habito);
    }

    public void eliminarHabito(String email, Long id) {
        Usuario usuario = obtenerUsuarioPorEmail(email);
        Habito habito = habitoRepositorio.findByIdAndUsuario(id, usuario)
                .orElseThrow(() -> new IllegalArgumentException("Hábito no encontrado"));
        habitoRepositorio.delete(habito);
    }

    @Transactional
    public Habito completarHabito(String email, Long id) {
        Usuario usuario = obtenerUsuarioPorEmail(email);
        Habito habito = habitoRepositorio.findByIdAndUsuario(id, usuario)
                .orElseThrow(() -> new IllegalArgumentException("Hábito no encontrado"));

        LocalDate hoy = LocalDate.now();
        if (registroRepositorio.existsByHabitoAndCompletadoEn(habito, hoy)) {
            throw new IllegalStateException("El hábito ya fue completado hoy");
        }

        // Crear registro
        RegistroHabito registro = RegistroHabito.builder()
                .habito(habito)
                .completadoEn(hoy)
                .xpGanado(habito.getXpRecompensa())
                .build();
        registroRepositorio.save(registro);

        // Calcular racha
        LocalDate ayer = hoy.minusDays(1);
        boolean completadoAyer = registroRepositorio.existsByHabitoAndCompletadoEn(habito, ayer);
        if (completadoAyer) {
            habito.setRachaActual(habito.getRachaActual() + 1);
        } else {
            habito.setRachaActual(1);
        }
        if (habito.getRachaActual() > habito.getMejorRacha()) {
            habito.setMejorRacha(habito.getRachaActual());
        }
        habitoRepositorio.save(habito);

        // Sumar XP al usuario
        usuario.setXp(usuario.getXp() + habito.getXpRecompensa());
        // Subir nivel cada 100 XP
        int nuevoNivel = (usuario.getXp() / 100) + 1;
        usuario.setNivel(nuevoNivel);
        usuarioRepositorio.save(usuario);

        return habito;
    }

    public EstadisticasHabito obtenerEstadisticas(String email, Long id) {
        Usuario usuario = obtenerUsuarioPorEmail(email);
        Habito habito = habitoRepositorio.findByIdAndUsuario(id, usuario)
                .orElseThrow(() -> new IllegalArgumentException("Hábito no encontrado"));

        LocalDate hace30Dias = LocalDate.now().minusDays(30);
        List<RegistroHabito> registros = registroRepositorio
                .findByHabitoAndCompletadoEnBetween(habito, hace30Dias, LocalDate.now());

        List<LocalDate> fechas = registros.stream()
                .map(RegistroHabito::getCompletadoEn)
                .toList();

        return new EstadisticasHabito(
                habito.getId(),
                habito.getNombre(),
                habito.getRachaActual(),
                habito.getMejorRacha(),
                fechas,
                fechas.size());
    }

    private Usuario obtenerUsuarioPorEmail(String email) {
        return usuarioRepositorio.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }
}
