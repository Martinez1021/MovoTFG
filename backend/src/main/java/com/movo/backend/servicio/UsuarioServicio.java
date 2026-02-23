package com.movo.backend.servicio;

import com.movo.backend.entidad.Usuario;
import com.movo.backend.repositorio.RegistroHabitoRepositorio;
import com.movo.backend.repositorio.UsuarioRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UsuarioServicio {

        private final UsuarioRepositorio usuarioRepositorio;
        private final RegistroHabitoRepositorio registroRepositorio;

        public Map<String, Object> obtenerPerfil(String email) {
                Usuario usuario = usuarioRepositorio.findByEmail(email)
                                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

                long totalCompletados = registroRepositorio.contarTotalPorUsuario(usuario.getId());
                int xpParaSiguienteNivel = (usuario.getNivel() * 100) - usuario.getXp();

                int mejorRachaTotal = usuario.getHabitos() != null
                                ? usuario.getHabitos().stream()
                                                .mapToInt(h -> h.getMejorRacha() != null ? h.getMejorRacha() : 0)
                                                .max().orElse(0)
                                : 0;

                return Map.of(
                                "id", usuario.getId(),
                                "nombreUsuario", usuario.getNombreUsuario(),
                                "email", usuario.getEmail(),
                                "nivel", usuario.getNivel(),
                                "xp", usuario.getXp(),
                                "xpParaSiguienteNivel", Math.max(0, xpParaSiguienteNivel),
                                "totalHabitosCompletados", totalCompletados,
                                "mejorRacha", mejorRachaTotal,
                                "creadoEn", usuario.getCreadoEn());
        }
}
