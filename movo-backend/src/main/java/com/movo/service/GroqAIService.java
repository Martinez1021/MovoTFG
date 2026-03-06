package com.movo.service;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  GroqAIService.java — Integración con la API de Groq (IA Generativa)        ║
// ║                                                                              ║
// ║  CRITERIO 4 — APIS EXTERNAS:                                                 ║
// ║   • Conecta con la API de Groq: https://api.groq.com/openai/v1              ║
// ║   • Modelo: Meta Llama 3.3-70B-Versatile (LLM de 70.000M de parámetros)    ║
// ║   • La API es compatible con el formato OpenAI (messages, role, content)    ║
// ║   • Autenticación: "Authorization: Bearer <GROQ_API_KEY>"                  ║
// ║   • Cliente HTTP reactivo: Spring WebClient (non-blocking async)            ║
// ║                                                                              ║
// ║  CRITERIO 5 — SEGURIDAD:                                                     ║
// ║   • La API key se inyecta con @Value desde application.yml / env var        ║
// ║   • NUNCA se hardcodea directamente en el código fuente de producción        ║
// ║                                                                              ║
// ║  CRITERIO 3 — CONEXIÓN:                                                      ║
// ║   • Consulta UserRepository y WorkoutSessionRepository (JPA) para           ║
// ║     construir el contexto personalizado del system prompt                   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

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
 * CRITERIO 4 — API EXTERNA: Groq API (Llama 3.3)
 * Endpoint base: POST https://api.groq.com/openai/v1/chat/completions
 * Documentación: https://console.groq.com/docs/openai
 */
@Service
@RequiredArgsConstructor
public class GroqAIService {

    // CRITERIO 4 + 5: Claves inyectadas desde variables de entorno (application.yml)
    @Value("${app.groq.api-key}")     // GROQ_API_KEY del entorno del servidor
    private String groqApiKey;

    @Value("${app.groq.base-url}")    // https://api.groq.com/openai/v1
    private String groqBaseUrl;

    @Value("${app.groq.model}")       // llama-3.3-70b-versatile
    private String groqModel;

    // CRITERIO 3 — CONEXIÓN: Repositorios JPA para consultar la BD PostgreSQL
    private final UserRepository userRepository;
    private final WorkoutSessionRepository sessionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Historial en memoria por conversationId (en producción usar la tabla ai_conversations)
    // Esto permite que el AI recuerde mensajes anteriores dentro de la misma sesión
    private final Map<String, List<Map<String, String>>> conversations = new HashMap<>();

    /**
     * Resultado del chat: respuesta del AI + ID de conversación + tokens consumidos.
     * Los tokens se usan para monitorizar el coste de la API.
     */
    public record ChatResult(String reply, String conversationId, int tokensUsed) {
    }

    /**
     * CRITERIO 4 — API EXTERNA: Envía un mensaje al AI Coach y devuelve la respuesta.
     *
     * Flujo:
     *  1. Construye el system prompt con el contexto del usuario (desde la BD)
     *  2. Recupera o crea el historial de conversación (memoria contextual)
     *  3. Construye el cuerpo JSON con el formato de la API de Groq/OpenAI
     *  4. Llama a POST /chat/completions con WebClient
     *  5. Parsea la respuesta y guarda el mensaje en el historial
     *
     * @param userId         UUID del usuario autenticado (para personalizar el prompt)
     * @param userMessage    Mensaje del usuario al AI Coach
     * @param conversationId null = nueva conversación; existente = continúa el hilo
     */
    public ChatResult chat(UUID userId, String userMessage, String conversationId) {

        // Paso 1: Obtener contexto del usuario desde la BD para personalizar la IA
        String userContext = buildUserContext(userId);

        // System prompt: define la personalidad y restricciones del AI Coach
        // Se incluye el contexto del usuario para respuestas personalizadas
        String systemPrompt = """
                Eres MOVO Coach, un entrenador personal virtual experto en fitness, yoga y pilates.
                Hablas siempre en español, eres motivador, cercano y profesional.
                Tienes acceso al perfil completo del usuario: %s
                Personaliza cada respuesta según sus objetivos y nivel.
                Máximo 150 palabras por respuesta para mantener conversación ágil.
                """.formatted(userContext);

        // Paso 2: Gestión del historial de conversación (memoria contextual)
        // Si no se proporciona conversationId, creamos uno nuevo (UUID v4)
        String convId = (conversationId != null && !conversationId.isBlank())
                ? conversationId
                : UUID.randomUUID().toString();

        List<Map<String, String>> history = conversations.computeIfAbsent(convId, k -> new ArrayList<>());

        // Limitamos el historial a los últimos 20 mensajes para no superar el límite de tokens
        // Llama 3.3-70B tiene 128K tokens de context window, pero tampoco queremos desperdiciar
        if (history.size() > 20) {
            history = history.subList(history.size() - 20, history.size());
            conversations.put(convId, history);
        }

        // Añadimos el mensaje del usuario al historial antes de enviar a Groq
        history.add(Map.of("role", "user", "content", userMessage));

        // Paso 3: Construir el cuerpo JSON para la API de Groq
        // Formato idéntico al de OpenAI Chat Completions API
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", groqModel);        // llama-3.3-70b-versatile
        body.put("temperature", 0.7);        // creatividad: 0=determinista, 1=muy creativo
        body.put("max_tokens", 300);         // ~150 palabras de respuesta
        body.put("stream", false);           // respuesta completa (no streaming)

        // Construimos el array "messages": [system, user, assistant, user, ...]
        ArrayNode messages = body.putArray("messages");

        // System message: instrucciones del AI Coach
        ObjectNode sysMsg = objectMapper.createObjectNode();
        sysMsg.put("role", "system");
        sysMsg.put("content", systemPrompt);
        messages.add(sysMsg);

        // Historial previo de la conversación (contexto)
        for (Map<String, String> msg : history) {
            ObjectNode m = objectMapper.createObjectNode();
            m.put("role", msg.get("role"));        // "user" o "assistant"
            m.put("content", msg.get("content"));
            messages.add(m);
        }

        // Paso 4: Llamada HTTP a la API de Groq con Spring WebClient
        // WebClient es el cliente HTTP reactivo de Spring (reemplaza a RestTemplate)
        WebClient client = WebClient.builder()
                .baseUrl(groqBaseUrl)   // https://api.groq.com/openai/v1
                // CRITERIO 5 — SEGURIDAD: API key en el header Authorization
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + groqApiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

        // POST /chat/completions → llamada síncrona con .block()
        String responseJson = client.post()
                .uri("/chat/completions")
                .bodyValue(body.toString())
                .retrieve()
                .bodyToMono(String.class)
                .block(); // bloqueamos aquí porque el controller no es reactivo

        // Paso 5: Parsear la respuesta JSON de Groq
        try {
            JsonNode response = objectMapper.readTree(responseJson);

            // Extraemos el texto de respuesta del AI: choices[0].message.content
            String reply = response.at("/choices/0/message/content")
                    .asText("No pude generar una respuesta. Inténtalo de nuevo.");

            // Tokens totales consumidos (entrada + salida) para monitorizar costes
            int tokensUsed = response.at("/usage/total_tokens").asInt(0);

            // Guardamos la respuesta del AI en el historial para mantener contexto
            history.add(Map.of("role", "assistant", "content", reply));

            return new ChatResult(reply, convId, tokensUsed);
        } catch (Exception e) {
            return new ChatResult("Hubo un error al procesar tu consulta. Por favor inténtalo de nuevo.", convId, 0);
        }
    }

    /**
     * CRITERIO 3 — CONEXIÓN: Construye el contexto del usuario consultando la BD.
     *
     * El contexto se incluye en el system prompt para que el AI pueda personalizar
     * sus respuestas según:
     *   - Nombre y rol del usuario
     *   - Número de sesiones de entrenamiento recientes
     *   - Días desde el último entrenamiento (activa alerta motivacional si > 3 días)
     */
    private String buildUserContext(UUID userId) {
        try {
            // Buscamos el usuario por su UUID en la tabla users (JPA)
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty())
                return "Usuario no encontrado";

            User user = userOpt.get();

            // Obtenemos las últimas 5 sesiones de entrenamiento del usuario
            // Ordenadas por fecha descendente (la más reciente primero)
            List<WorkoutSession> recentSessions = sessionRepository.findByUserIdOrderByStartedAtDesc(userId)
                    .stream().limit(5).toList();

            // Calculamos los días desde el último entrenamiento completado
            String lastWorkoutInfo = "Sin entrenamientos recientes";
            if (!recentSessions.isEmpty() && recentSessions.get(0).getCompletedAt() != null) {
                long daysSince = ChronoUnit.DAYS.between(
                        recentSessions.get(0).getCompletedAt().toLocalDate(), LocalDate.now());
                lastWorkoutInfo = daysSince == 0 ? "Entrenó hoy"
                        : daysSince == 1 ? "Entrenó ayer"
                                : "Hace " + daysSince + " días";

                // Si lleva más de 3 días sin entrenar, añadimos alerta para que el AI
                // le motive especialmente en su respuesta
                if (daysSince > 3) {
                    lastWorkoutInfo += " — ALERTA: más de 3 días sin entrenar, motivar al usuario";
                }
            }

            // Devolvemos el contexto como texto plano que se insertará en el system prompt
            return "Nombre: %s, Rol: %s, Sesiones recientes: %d, Último entrenamiento: %s"
                    .formatted(user.getFullName(), user.getRole(), recentSessions.size(), lastWorkoutInfo);

        } catch (Exception e) {
            return "Error al obtener contexto del usuario";
        }
    }
}
