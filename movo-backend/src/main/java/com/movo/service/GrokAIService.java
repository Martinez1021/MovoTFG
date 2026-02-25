package com.movo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.movo.model.User;
import com.movo.model.WorkoutSession;
import com.movo.repository.UserRepository;
import com.movo.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * MOVO AI Coach — powered by Grok (xAI) API via REST.
 * Endpoint: POST https://api.x.ai/v1/chat/completions
 */
@Service
@RequiredArgsConstructor
public class GrokAIService {

    @Value("${app.grok.api-key}")
    private String grokApiKey;

    @Value("${app.grok.base-url}")
    private String grokBaseUrl;

    @Value("${app.grok.model}")
    private String grokModel;

    private final UserRepository userRepository;
    private final WorkoutSessionRepository sessionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-memory conversation store (replace with DB-backed AIConversation entity in
    // production)
    private final Map<String, List<Map<String, String>>> conversations = new HashMap<>();

    public record ChatResult(String reply, String conversationId, int tokensUsed) {
    }

    public ChatResult chat(UUID userId, String userMessage, String conversationId) {

        // Build user context for system prompt
        String userContext = buildUserContext(userId);

        String systemPrompt = """
                Eres MOVO Coach, un entrenador personal virtual experto en fitness, yoga y pilates.
                Hablas siempre en español, eres motivador, cercano y profesional.
                Tienes acceso al perfil completo del usuario: %s
                Personaliza cada respuesta según sus objetivos y nivel.
                Máximo 150 palabras por respuesta para mantener conversación ágil.
                """.formatted(userContext);

        // Get or create conversation
        String convId = (conversationId != null && !conversationId.isBlank())
                ? conversationId
                : UUID.randomUUID().toString();

        List<Map<String, String>> history = conversations.computeIfAbsent(convId, k -> new ArrayList<>());

        // Keep last 20 messages to avoid token overflow
        if (history.size() > 20) {
            history = history.subList(history.size() - 20, history.size());
            conversations.put(convId, history);
        }

        // Add user message to history
        history.add(Map.of("role", "user", "content", userMessage));

        // Build JSON body for Grok API
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", grokModel);
        body.put("temperature", 0.7);
        body.put("max_tokens", 300);
        body.put("stream", false);

        ArrayNode messages = body.putArray("messages");
        ObjectNode sysMsg = objectMapper.createObjectNode();
        sysMsg.put("role", "system");
        sysMsg.put("content", systemPrompt);
        messages.add(sysMsg);

        for (Map<String, String> msg : history) {
            ObjectNode m = objectMapper.createObjectNode();
            m.put("role", msg.get("role"));
            m.put("content", msg.get("content"));
            messages.add(m);
        }

        // Call Grok API
        WebClient client = WebClient.builder()
                .baseUrl(grokBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + grokApiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

        String responseJson = client.post()
                .uri("/chat/completions")
                .bodyValue(body.toString())
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode response = objectMapper.readTree(responseJson);
            String reply = response.at("/choices/0/message/content")
                    .asText("No pude generar una respuesta. Inténtalo de nuevo.");
            int tokensUsed = response.at("/usage/total_tokens").asInt(0);

            // Save assistant reply to history
            history.add(Map.of("role", "assistant", "content", reply));

            return new ChatResult(reply, convId, tokensUsed);
        } catch (Exception e) {
            return new ChatResult("Hubo un error al procesar tu consulta. Por favor inténtalo de nuevo.", convId, 0);
        }
    }

    private String buildUserContext(UUID userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty())
                return "Usuario no encontrado";

            User user = userOpt.get();
            List<WorkoutSession> recentSessions = sessionRepository.findByUserIdOrderByStartedAtDesc(userId)
                    .stream().limit(5).toList();

            // Check days since last workout
            String lastWorkoutInfo = "Sin entrenamientos recientes";
            if (!recentSessions.isEmpty() && recentSessions.get(0).getCompletedAt() != null) {
                long daysSince = ChronoUnit.DAYS.between(
                        recentSessions.get(0).getCompletedAt().toLocalDate(), LocalDate.now());
                lastWorkoutInfo = daysSince == 0 ? "Entrenó hoy"
                        : daysSince == 1 ? "Entrenó ayer"
                                : "Hace " + daysSince + " días";

                if (daysSince > 3) {
                    lastWorkoutInfo += " — ALERTA: más de 3 días sin entrenar, motivar al usuario";
                }
            }

            return "Nombre: %s, Rol: %s, Sesiones recientes: %d, Último entrenamiento: %s"
                    .formatted(user.getFullName(), user.getRole(), recentSessions.size(), lastWorkoutInfo);

        } catch (Exception e) {
            return "Error al obtener contexto del usuario";
        }
    }
}
