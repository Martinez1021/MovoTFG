package com.movo.security;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  JwtAuthFilter.java — Filtro de Validación JWT (ES256)                      ║
// ║                                                                              ║
// ║  CRITERIO 5 — SEGURIDAD:                                                     ║
// ║   • Valida el JWT emitido por Supabase Auth en CADA petición HTTP           ║
// ║   • Algoritmo: ES256 (ECDSA con curva P-256) → clave asimétrica            ║
// ║     Ventaja: el servidor sólo necesita la clave PÚBLICA para verificar.     ║
// ║     La clave privada nunca sale de Supabase → imposible falsificar tokens.  ║
// ║   • Extiende OncePerRequestFilter → se ejecuta exactamente una vez/request  ║
// ║   • Si el token es inválido/expirado: la petición continúa SIN usuario      ║
// ║     (Spring la rechazará en SecurityConfig.anyRequest().authenticated())    ║
// ║                                                                              ║
// ║  FLUJO DE AUTENTICACIÓN:                                                     ║
// ║   App → "Authorization: Bearer <JWT>" → JwtAuthFilter verifica firma        ║
// ║      → extrae sub (supabase_id) → busca usuario en BD → asigna rol         ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import com.movo.model.User;
import com.movo.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.math.BigInteger;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * CRITERIO 5 — SEGURIDAD: Validación de JWT Supabase (ES256 / ECC P-256)
 *
 * La clave pública se obtiene del endpoint JWKS de Supabase:
 * https://uyxysrodgxxduzyekgjo.supabase.co/auth/v1/.well-known/jwks.json
 *
 * Formato JWKS → coordenadas X e Y del punto en la curva elíptica P-256
 * (secp256r1), codificadas en Base64 URL-safe.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    // CRITERIO 5 — SEGURIDAD: Coordenadas de la clave pública EC (P-256)
    // Identificador del par de claves: kid = cce250d6-ff31-412a-8aa3-0e895ce3abf2
    // Estas coordenadas provienen del endpoint JWKS de Supabase (clave pública, no secreta)
    private static final String JWK_X = "qU87OhwUzO0YpKxSn2OBu_f7H976uFlYCTlzpt6xtYA";
    private static final String JWK_Y = "0B7ZiNwBvKL1n7n0D4OGDcfCnX-EJjD1JeX7P6yElpg";

    // CRITERIO 3 — CONEXIÓN: acceso a la BD para resolver supabase_id → User
    private final UserRepository userRepository;

    /**
     * Reconstruye la PublicKey EC desde las coordenadas X/Y del JWKS de Supabase.
     * Se usa para verificar la firma ES256 del JWT sin necesidad de la clave privada.
     */
    private PublicKey buildEcPublicKey() throws Exception {
        // Decodificamos Base64 URL-safe → bytes de las coordenadas del punto EC
        byte[] xBytes = Base64.getUrlDecoder().decode(JWK_X);
        byte[] yBytes = Base64.getUrlDecoder().decode(JWK_Y);

        // Construimos el punto en la curva elíptica P-256 (secp256r1)
        ECPoint point = new ECPoint(new BigInteger(1, xBytes), new BigInteger(1, yBytes));
        AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
        params.init(new ECGenParameterSpec("secp256r1")); // curva estándar NIST P-256
        ECParameterSpec ecSpec = params.getParameterSpec(ECParameterSpec.class);

        // Generamos la PublicKey usando los parámetros de la curva + el punto
        ECPublicKeySpec keySpec = new ECPublicKeySpec(point, ecSpec);
        return KeyFactory.getInstance("EC").generatePublic(keySpec);
    }

    /**
     * Este método se ejecuta UNA VEZ por cada petición HTTP recibida.
     *
     * CRITERIO 5 — SEGURIDAD: Proceso de validación:
     *  1. Lee el header "Authorization: Bearer <token>"
     *  2. Verifica la firma ES256 del JWT con la clave pública EC de Supabase
     *  3. Extrae el claim "sub" = supabase_id del usuario
     *  4. Carga el usuario desde la BD y asigna su rol (ROLE_USER / ROLE_TRAINER)
     *  5. Registra la autenticación en el SecurityContext de Spring
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Paso 1: Extraer el token del header Authorization
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Sin token → continúa sin autenticar (será rechazado si la ruta lo requiere)
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Paso 2: Extraer el JWT (descartamos "Bearer ")
            String token = authHeader.substring(7);

            // Paso 3: Reconstruir la clave pública EC de Supabase
            PublicKey publicKey = buildEcPublicKey();

            // Paso 4: Verificar la firma ES256 y parsear los claims
            // Si el token está expirado o la firma no coincide → lanza excepción
            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)      // verifica con la clave pública de Supabase
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // Paso 5: El "sub" del JWT de Supabase es el supabase_id del usuario
            String supabaseId = claims.getSubject();

            // CRITERIO 3 — CONEXIÓN: consulta JPA para obtener el usuario de la BD
            Optional<User> userOpt = userRepository.findBySupabaseId(supabaseId);

            if (userOpt.isPresent()) {
                User user = userOpt.get();

                // Asignamos el usuario autenticado con su rol (ROLE_USER o ROLE_TRAINER)
                // Este objeto queda disponible en los controllers via @AuthenticationPrincipal
                var auth = new UsernamePasswordAuthenticationToken(
                        user,       // principal: el objeto User completo
                        null,       // credentials: null porque ya verificamos el JWT
                        // Ejemplo: User.Role.trainer → "ROLE_TRAINER"
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name().toUpperCase())));

                // Guardamos la autenticación en el contexto de Spring Security
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception e) {
            // Token inválido, expirado o mal formado → logueamos warning y continuamos
            // Spring rechazará la petición en la capa de autorización
            logger.warn("JWT validation failed: " + e.getMessage());
        }

        // Pasamos la petición al siguiente filtro en la cadena
        filterChain.doFilter(request, response);
    }
}
