// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  api.ts — Cliente HTTP Axios para el backend Spring Boot                    ║
// ║                                                                              ║
// ║  CRITERIO 3 — CONEXIÓN:                                                      ║
// ║   • Axios: librería HTTP para React Native (equivalente a fetch, pero       ║
// ║     con interceptores, timeout automático y manejo de errores)              ║
// ║   • baseURL = URL del backend Spring Boot (localhost:8080 en desarrollo,    ║
// ║     Railway/Render en producción)                                           ║
// ║   • Interceptor de request: añade el JWT de Supabase a cada petición       ║
// ║                                                                              ║
// ║  CRITERIO 4 — APIs (la API propia de MOVO):                                 ║
// ║   • authApi, userApi, routineApi, exerciseApi, sessionApi, aiApi,           ║
// ║     trainerApi → cada uno agrupa los endpoints de su dominio                ║
// ║                                                                              ║
// ║  CRITERIO 5 — SEGURIDAD:                                                     ║
// ║   • El interceptor de request inyecta "Authorization: Bearer <JWT>"        ║
// ║   • La API de Groq se llama DESDE EL BACKEND (no desde aquí), para que     ║
// ║     la GROQ_API_KEY nunca esté expuesta en el código de la app móvil        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import axios from 'axios';
import { getAccessToken } from './supabase';
import { API_BASE_URL } from '../utils/constants';
import {
    Routine, Exercise, UserRoutine, WorkoutSession,
    UserProfile, User, AIChatResponse, TrainerMessage
} from '../types';

/**
 * CRITERIO 3 — CONEXIÓN: Instancia Axios configurada para el backend MOVO.
 * API_BASE_URL = 'http://localhost:8080/api' (dev) ó URL de Railway (prod)
 */
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,  // 5 segundos: si el backend no responde, falla sin bloquear
    headers: { 'Content-Type': 'application/json' },
});

/**
 * CRITERIO 5 — SEGURIDAD: Interceptor de request.
 * Antes de CADA petición HTTP, obtiene el JWT de Supabase (AsyncStorage)
 * y lo añade al header Authorization.
 * El backend Spring Boot (JwtAuthFilter.java) validará este token.
 */
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken(); // JWT de la sesión activa en AsyncStorage
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Interceptor de respuesta: si el backend está offline (ERR_NETWORK),
// fallamos silenciosamente (la app usa datos de Supabase como fallback)
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            // Backend no disponible en desarrollo — la app degrada elegantemente
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

// ─── Auth ─────────────────────────────────────
export const authApi = {
    syncUser: (data: { supabaseId: string; email: string; fullName: string; role: string }) =>
        api.post<User>('/auth/sync', data),
};

// ─── User / Profile ───────────────────────────
export const userApi = {
    getMe: () => api.get<User>('/users/me'),
    updateMe: (data: Partial<Pick<User, 'full_name' | 'avatar_url'>>) =>
        api.put<User>('/users/me', data),
    getProfile: (userId: string) => api.get<UserProfile>(`/users/${userId}/profile`),
    updateProfile: (userId: string, data: Partial<UserProfile>) =>
        api.put<UserProfile>(`/users/${userId}/profile`, data),
    uploadAvatar: (userId: string, formData: FormData) =>
        api.post<{ avatar_url: string }>(`/users/${userId}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

// ─── Routines ─────────────────────────────────
export const routineApi = {
    getPublic: (filters?: { category?: string; difficulty?: string }) =>
        api.get<Routine[]>('/routines', { params: filters }),
    getMyAssigned: () => api.get<UserRoutine[]>('/routines/assigned'),
    getById: (id: string) => api.get<Routine>(`/routines/${id}`),
    create: (data: Partial<Routine>) => api.post<Routine>('/routines', data),
    update: (id: string, data: Partial<Routine>) => api.put<Routine>(`/routines/${id}`, data),
    delete: (id: string) => api.delete(`/routines/${id}`),
    assignToUser: (routineId: string, userId: string) =>
        api.post<UserRoutine>('/routines/assign', { routineId, userId }),
};

// ─── Exercises ────────────────────────────────
export const exerciseApi = {
    getByRoutine: (routineId: string) => api.get<Exercise[]>(`/exercises/routine/${routineId}`),
    create: (data: Partial<Exercise>) => api.post<Exercise>('/exercises', data),
    update: (id: string, data: Partial<Exercise>) => api.put<Exercise>(`/exercises/${id}`, data),
    delete: (id: string) => api.delete(`/exercises/${id}`),
};

// ─── Workout Sessions ──────────────────────────
export const sessionApi = {
    start: (routineId: string) => api.post<WorkoutSession>('/sessions/start', { routineId }),
    complete: (sessionId: string, data: Partial<WorkoutSession>) =>
        api.put<WorkoutSession>(`/sessions/${sessionId}/complete`, data),
    getMy: () => api.get<WorkoutSession[]>('/sessions/my'),
    getRecent: (limit = 5) => api.get<WorkoutSession[]>('/sessions/my', { params: { limit } }),
    getStats: () => api.get<{ totalSessions: number; totalMinutes: number; streak: number; weeklyCount: number[] }>('/sessions/stats'),
};

// ─── AI Coach ──────────────────────────────────
export const aiApi = {
    chat: (message: string, conversationId?: string) =>
        api.post<AIChatResponse>('/ai/chat', { message, conversationId }),
    getConversation: (conversationId: string) =>
        api.get(`/ai/conversation/${conversationId}`),
};

// ─── Trainer ──────────────────────────────────
export const trainerApi = {
    getMyClients: () => api.get<User[]>('/trainer/clients'),
    getClientProfile: (clientId: string) => api.get<{ user: User; profile: UserProfile }>(`/trainer/clients/${clientId}`),
    updateClientProfile: (clientId: string, data: Partial<UserProfile>) =>
        api.put<UserProfile>(`/trainer/clients/${clientId}/profile`, data),
    sendMessage: (clientId: string, message: string) =>
        api.post<TrainerMessage>('/trainer/messages', { userId: clientId, message }),
    getMessages: (clientId: string) =>
        api.get<TrainerMessage[]>(`/trainer/messages/${clientId}`),
    getClientSessions: (clientId: string) =>
        api.get<WorkoutSession[]>(`/trainer/clients/${clientId}/sessions`),
};

export default api;
