import { create } from 'zustand';
import { ChatMessage } from '../types';

// CRITERIO 5 — SEGURIDAD: la clave nunca se hardcodea en el código.
// Se lee de la variable de entorno EXPO_PUBLIC_GROQ_KEY (definida en movo-app/.env)
const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY ?? '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const SYSTEM_PROMPT = `Eres MOVO Coach, un entrenador personal virtual experto en fitness, nutrición y bienestar. 
Responde SIEMPRE en español, de forma motivadora, práctica y concisa. 
Máximo 200 palabras por respuesta. Usa emojis con moderación.
Adapta tu lenguaje para ser cercano y motivador, como un buen entrenador personal.`;

interface AIState {
    messages: ChatMessage[];
    isLoading: boolean;
    sendMessage: (text: string) => Promise<void>;
    clearConversation: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
    messages: [],
    isLoading: false,

    sendMessage: async (text) => {
        const prevMessages = get().messages;
        const userMsg: ChatMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };
        set({ messages: [...prevMessages, userMsg], isLoading: true });

        try {
            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_KEY}`,
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...prevMessages.map((m) => ({ role: m.role, content: m.content })),
                        { role: 'user', content: text },
                    ],
                    max_tokens: 400,
                    temperature: 0.8,
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Error ${response.status}: ${err}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content ?? '🤔 No recibí respuesta. Inténtalo de nuevo.';

            set((s) => ({
                messages: [...s.messages, {
                    role: 'assistant' as const,
                    content: reply,
                    timestamp: new Date().toISOString(),
                }],
                isLoading: false,
            }));
        } catch (e: any) {
            console.error('[AIStore] Groq error:', e?.message ?? e);
            set((s) => ({
                messages: [...s.messages, {
                    role: 'assistant' as const,
                    content: `⚠️ Error: ${e?.message ?? 'desconocido'}`,
                    timestamp: new Date().toISOString(),
                }],
                isLoading: false,
            }));
        }
    },

    clearConversation: () => set({ messages: [] }),
}));
