import axios from 'axios';
import { getAccessToken } from './supabase';
import { API_BASE_URL } from '../utils/constants';
import {
    Routine, Exercise, UserRoutine, WorkoutSession,
    UserProfile, User, AIChatResponse, TrainerMessage
} from '../types';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Silence network errors when backend is offline — they are expected in dev
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            // Backend not running — fail silently so Expo console stays clean
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
