import { create } from 'zustand';
import { aiApi } from '../services/api';
import { ChatMessage } from '../types';

interface AIState {
    messages: ChatMessage[];
    conversationId: string | null;
    isLoading: boolean;
    sendMessage: (text: string) => Promise<void>;
    clearConversation: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
    messages: [],
    conversationId: null,
    isLoading: false,

    sendMessage: async (text) => {
        const userMsg: ChatMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };
        set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));
        try {
            const { data } = await aiApi.chat(text, get().conversationId ?? undefined);
            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: data.reply,
                timestamp: new Date().toISOString(),
            };
            set((s) => ({
                messages: [...s.messages, assistantMsg],
                conversationId: data.conversationId,
                isLoading: false,
            }));
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    clearConversation: () => set({ messages: [], conversationId: null }),
}));
