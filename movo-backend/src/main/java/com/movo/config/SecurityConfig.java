package com.movo.config;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SecurityConfig.java — Configuración de Seguridad Spring Boot               ║
// ║                                                                              ║
// ║  CRITERIO 5 — SEGURIDAD:                                                     ║
// ║   • Sesiones STATELESS (sin cookies ni HttpSession, sólo JWT)               ║
// ║   • JWT validado en CADA petición via JwtAuthFilter (ES256 / ECC P-256)     ║
// ║   • CSRF deshabilitado porque usamos tokens Bearer, no cookies de sesión    ║
// ║   • CORS configurado para permitir el cliente React Native / Expo Go        ║
// ║   • Rutas /api/auth/** públicas (login/registro), el resto requieren token  ║
// ║   • @EnableMethodSecurity: permite @PreAuthorize en controllers             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import com.movo.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// @Configuration → Spring registra este bean al arrancar
// @EnableWebSecurity → activa la cadena de filtros de seguridad HTTP
// @EnableMethodSecurity → habilita seguridad a nivel de método con @PreAuthorize
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // Inyectamos nuestro filtro JWT personalizado (ver JwtAuthFilter.java)
    private final JwtAuthFilter jwtAuthFilter;

    /**
     * CRITERIO 5 — SEGURIDAD: Cadena de filtros HTTP
     *
     * Orden de ejecución por cada request:
     *   1. CORS → verifica origin del cliente
     *   2. JwtAuthFilter → valida el token Bearer ES256 de Supabase
     *   3. authorizeHttpRequests → comprueba si la ruta requiere autenticación
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                // CSRF deshabilitado: las apps móviles usan tokens Bearer, no cookies
                .csrf(csrf -> csrf.disable())

                // CORS: la app móvil y el backend pueden estar en hosts distintos
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // STATELESS: el servidor NO guarda sesión en memoria
                // → cada request debe incluir su propio JWT (escalable y sin estado)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // Rutas PÚBLICAS: login, registro, Swagger y health check
                        .requestMatchers(
                                "/api/auth/**",       // sincronización de usuario tras login
                                "/swagger-ui/**",     // documentación de la API
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**",
                                "/actuator/health"    // monitorización del servidor
                        ).permitAll()
                        // TODAS las demás rutas requieren JWT válido
                        .anyRequest().authenticated())

                // Insertamos nuestro filtro ANTES del filtro estándar de usuario/contraseña
                // → así Spring reconoce al usuario con su rol antes de evaluar permisos
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /**
     * CRITERIO 5 — SEGURIDAD: Configuración CORS
     * Permite que la app móvil (cualquier origen) llame a la API.
     * En producción se restringiría a dominios concretos.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*")); // en producción: dominio específico
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*")); // incluye el header Authorization: Bearer ...
        config.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
