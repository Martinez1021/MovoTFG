package com.movo.backend.controlador;

import com.movo.backend.dto.EstadisticasHabito;
import com.movo.backend.dto.HabitoRequest;
import com.movo.backend.entidad.Habito;
import com.movo.backend.servicio.HabitoServicio;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/habitos")
@RequiredArgsConstructor
public class HabitoControlador {

    private final HabitoServicio habitoServicio;

    @GetMapping
    public ResponseEntity<List<Habito>> obtenerHabitos(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(habitoServicio.obtenerHabitos(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<?> crearHabito(@AuthenticationPrincipal UserDetails userDetails,
            @RequestBody HabitoRequest request) {
        try {
            Habito habito = habitoServicio.crearHabito(userDetails.getUsername(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(habito);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarHabito(@AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody HabitoRequest request) {
        try {
            return ResponseEntity.ok(habitoServicio.actualizarHabito(userDetails.getUsername(), id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarHabito(@AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            habitoServicio.eliminarHabito(userDetails.getUsername(), id);
            return ResponseEntity.ok("Hábito eliminado correctamente");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/completar")
    public ResponseEntity<?> completarHabito(@AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            Habito habito = habitoServicio.completarHabito(userDetails.getUsername(), id);
            return ResponseEntity.ok(habito);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/estadisticas")
    public ResponseEntity<?> obtenerEstadisticas(@AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            EstadisticasHabito stats = habitoServicio.obtenerEstadisticas(userDetails.getUsername(), id);
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
