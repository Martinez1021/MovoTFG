import { create } from 'zustand';
import { routineApi, exerciseApi, sessionApi } from '../services/api';
import { Routine, UserRoutine, WorkoutSession } from '../types';

interface RoutineState {
    publicRoutines: Routine[];
    assignedRoutines: UserRoutine[];
    sessions: WorkoutSession[];
    stats: { totalSessions: number; totalMinutes: number; streak: number; weeklyCount: number[] } | null;
    isLoading: boolean;
    filter: { category?: string; difficulty?: string };
    setFilter: (f: { category?: string; difficulty?: string }) => void;
    fetchPublicRoutines: () => Promise<void>;
    fetchAssigned: () => Promise<void>;
    fetchStats: () => Promise<void>;
    fetchSessions: () => Promise<void>;
    startSession: (routineId: string) => Promise<WorkoutSession>;
    completeSession: (sessionId: string, data: Partial<WorkoutSession>) => Promise<void>;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
    publicRoutines: [],
    assignedRoutines: [],
    sessions: [],
    stats: null,
    isLoading: false,
    filter: {},

    setFilter: (filter) => {
        set({ filter });
        get().fetchPublicRoutines();
    },

    fetchPublicRoutines: async () => {
        set({ isLoading: true });
        try {
            const { data } = await routineApi.getPublic(get().filter);
            set({ publicRoutines: data });
        } catch (e) { console.error(e); }
        finally { set({ isLoading: false }); }
    },

    fetchAssigned: async () => {
        try {
            const { data } = await routineApi.getMyAssigned();
            set({ assignedRoutines: data });
        } catch (e) { console.error(e); }
    },

    fetchStats: async () => {
        try {
            const { data } = await sessionApi.getStats();
            set({ stats: data });
        } catch (e) { console.error(e); }
    },

    fetchSessions: async () => {
        try {
            const { data } = await sessionApi.getMy();
            set({ sessions: data });
        } catch (e) { console.error(e); }
    },

    startSession: async (routineId) => {
        const { data } = await sessionApi.start(routineId);
        return data;
    },

    completeSession: async (sessionId, payload) => {
        await sessionApi.complete(sessionId, payload);
        get().fetchStats();
        get().fetchSessions();
    },
}));
