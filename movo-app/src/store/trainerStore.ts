import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';

// ─── Types ─────────────────────────────────────────────────────────────────
export interface TrainerClient {
    id: string;
    supabase_id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    role: string;
    created_at: string;
    trainer_id?: string;
}

export interface ClientProfile {
    id?: string;
    user_id: string;
    weight_kg?: number;
    height_cm?: number;
    age?: number;
    gender?: string;
    activity_level?: string;
    goals?: string[];
    notes_from_trainer?: string;
}

export interface ClientSession {
    id: string;
    user_id: string;
    routine_id?: string;
    started_at: string;
    completed_at?: string;
    duration_minutes?: number;
    rating?: number;
    notes?: string;
    routineName: string;
    routineCategory: string;
}

export interface TrainerRequest {
    id: string;
    client_id: string;
    trainer_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    client?: TrainerClient;
}

interface TrainerState {
    clients: TrainerClient[];
    pendingRequests: TrainerRequest[];
    trainerInternalId: string | null;
    isLoading: boolean;

    fetchTrainerId: () => Promise<string | null>;
    fetchClients: () => Promise<void>;
    fetchPendingRequests: () => Promise<void>;
    fetchClientProfile: (clientId: string) => Promise<{ profile: ClientProfile | null; sessions: ClientSession[] }>;
    updateNotes: (clientId: string, notes: string) => Promise<void>;
    acceptRequest: (requestId: string, clientId: string) => Promise<void>;
    rejectRequest: (requestId: string) => Promise<void>;
    removeClient: (clientId: string) => Promise<void>;
}

// ─── Store ─────────────────────────────────────────────────────────────────
export const useTrainerStore = create<TrainerState>((set, get) => ({
    clients: [],
    pendingRequests: [],
    trainerInternalId: null,
    isLoading: false,

    fetchTrainerId: async () => {
        const cached = get().trainerInternalId;
        if (cached) return cached;
        const authUser = useAuthStore.getState().user;
        if (!authUser) return null;
        const { data } = await supabase
            .from('users')
            .select('id')
            .eq('supabase_id', authUser.id)
            .single();
        const id = data?.id ?? null;
        set({ trainerInternalId: id });
        return id;
    },

    fetchClients: async () => {
        set({ isLoading: true });
        try {
            const trainerId = await get().fetchTrainerId();
            if (!trainerId) return;
            const { data, error } = await supabase
                .from('users')
                .select('id, supabase_id, full_name, email, avatar_url, role, created_at, trainer_id')
                .eq('trainer_id', trainerId)
                .order('full_name');
            if (!error) set({ clients: data ?? [] });
        } catch (e) {
            console.warn('[TrainerStore] fetchClients:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchPendingRequests: async () => {
        try {
            const trainerId = await get().fetchTrainerId();
            if (!trainerId) return;
            const { data, error } = await supabase
                .from('trainer_requests')
                .select('*, client:client_id(id, supabase_id, full_name, email, avatar_url)')
                .eq('trainer_id', trainerId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            if (!error) set({ pendingRequests: data ?? [] });
        } catch (e) {
            console.warn('[TrainerStore] fetchPendingRequests:', e);
        }
    },

    fetchClientProfile: async (clientId: string) => {
        try {
            const [{ data: profileData }, { data: sessionsData }] = await Promise.all([
                supabase.from('user_profiles').select('*').eq('user_id', clientId).single(),
                supabase
                    .from('workout_sessions')
                    .select('*, routine:routine_id(title, category)')
                    .eq('user_id', clientId)
                    .order('started_at', { ascending: false })
                    .limit(10),
            ]);
            const sessions: ClientSession[] = (sessionsData ?? []).map((s: any) => ({
                id: s.id,
                user_id: s.user_id,
                routine_id: s.routine_id,
                started_at: s.started_at,
                completed_at: s.completed_at,
                duration_minutes: s.duration_minutes ?? 0,
                rating: s.rating,
                notes: s.notes,
                routineName: s.routine?.title ?? 'Entrenamiento libre',
                routineCategory: s.routine?.category ?? 'gym',
            }));
            return { profile: profileData ?? null, sessions };
        } catch (e) {
            console.warn('[TrainerStore] fetchClientProfile:', e);
            return { profile: null, sessions: [] };
        }
    },

    updateNotes: async (clientId: string, notes: string) => {
        const { error } = await supabase
            .from('user_profiles')
            .update({ notes_from_trainer: notes })
            .eq('user_id', clientId);
        if (error) throw error;
    },

    acceptRequest: async (requestId: string, clientId: string) => {
        const trainerId = await get().fetchTrainerId();
        if (!trainerId) return;
        await supabase.from('users').update({ trainer_id: trainerId }).eq('id', clientId);
        await supabase.from('trainer_requests').update({ status: 'accepted' }).eq('id', requestId);
        await Promise.all([get().fetchClients(), get().fetchPendingRequests()]);
    },

    rejectRequest: async (requestId: string) => {
        await supabase.from('trainer_requests').update({ status: 'rejected' }).eq('id', requestId);
        set((s) => ({ pendingRequests: s.pendingRequests.filter((r) => r.id !== requestId) }));
    },

    removeClient: async (clientId: string) => {
        await supabase.from('users').update({ trainer_id: null }).eq('id', clientId);
        set((s) => ({ clients: s.clients.filter((c) => c.id !== clientId) }));
    },
}));
