package com.movo.security;

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
 * Validates Supabase JWTs (ES256 / ECC P-256) on every incoming request.
 * Public key coordinates come from:
 * https://uyxysrodgxxduzyekgjo.supabase.co/auth/v1/.well-known/jwks.json
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    // ES256 public key from Supabase JWKS (kid: cce250d6-ff31-412a-8aa3-0e895ce3abf2)
    private static final String JWK_X = "qU87OhwUzO0YpKxSn2OBu_f7H976uFlYCTlzpt6xtYA";
    private static final String JWK_Y = "0B7ZiNwBvKL1n7n0D4OGDcfCnX-EJjD1JeX7P6yElpg";

    private final UserRepository userRepository;

    private PublicKey buildEcPublicKey() throws Exception {
        byte[] xBytes = Base64.getUrlDecoder().decode(JWK_X);
        byte[] yBytes = Base64.getUrlDecoder().decode(JWK_Y);
        ECPoint point = new ECPoint(new BigInteger(1, xBytes), new BigInteger(1, yBytes));
        AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
        params.init(new ECGenParameterSpec("secp256r1"));
        ECParameterSpec ecSpec = params.getParameterSpec(ECParameterSpec.class);
        ECPublicKeySpec keySpec = new ECPublicKeySpec(point, ecSpec);
        return KeyFactory.getInstance("EC").generatePublic(keySpec);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            PublicKey publicKey = buildEcPublicKey();

            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String supabaseId = claims.getSubject();
            Optional<User> userOpt = userRepository.findBySupabaseId(supabaseId);

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                var auth = new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name().toUpperCase())));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception e) {
            logger.warn("JWT validation failed: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
