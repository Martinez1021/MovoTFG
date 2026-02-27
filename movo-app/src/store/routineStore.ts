import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { routineApi, exerciseApi, sessionApi } from '../services/api';
import { Routine, UserRoutine, WorkoutSession } from '../types';

const WORKOUT_DATES_KEY = 'movo_workout_dates'; // string[] of 'YYYY-MM-DD'

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

/** Returns the Mon=0…Sun=6 index for a 'YYYY-MM-DD' string */
function dayIdx(dateStr: string): number {
    const d = new Date(dateStr + 'T12:00:00');
    return (d.getDay() + 6) % 7;
}

/** Compute weeklyCount[0..6] from stored dates for the CURRENT Mon–Sun week */
function buildWeeklyCount(dates: string[]): number[] {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    // current week boundaries (Mon to Sun)
    const now = new Date();
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    thisMonday.setHours(0, 0, 0, 0);
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    thisSunday.setHours(23, 59, 59, 999);

    for (const d of dates) {
        const t = new Date(d + 'T12:00:00').getTime();
        if (t >= thisMonday.getTime() && t <= thisSunday.getTime()) {
            counts[dayIdx(d)] += 1;
        }
    }
    return counts;
}

async function loadStoredDates(): Promise<string[]> {
    try {
        const raw = await AsyncStorage.getItem(WORKOUT_DATES_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch { return []; }
}

async function saveDate(dateStr: string): Promise<void> {
    try {
        const existing = await loadStoredDates();
        // keep last 365 days, de-duplicate
        const updated = Array.from(new Set([...existing, dateStr])).slice(-365);
        await AsyncStorage.setItem(WORKOUT_DATES_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
}

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
    /** Optimistically updates home stats immediately after a workout finishes */
    recordLocalWorkout: (durationSeconds: number) => void;
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
        } catch { /* backend offline — no-op */ }
        finally { set({ isLoading: false }); }
    },

    fetchAssigned: async () => {
        try {
            const { data } = await routineApi.getMyAssigned();
            set({ assignedRoutines: data });
        } catch { /* backend offline — no-op */ }
    },

    fetchStats: async () => {
        // Always load local dates first so weeklyCount is available even offline
        const localDates = await loadStoredDates();
        const localWeekly = buildWeeklyCount(localDates);
        set((state) => ({
            stats: {
                totalSessions: state.stats?.totalSessions ?? localDates.length,
                totalMinutes: state.stats?.totalMinutes ?? 0,
                streak: state.stats?.streak ?? (localWeekly[(new Date().getDay() + 6) % 7] > 0 ? 1 : 0),
                weeklyCount: localWeekly,
            },
        }));
        try {
            const { data } = await sessionApi.getStats();
            // Merge: prefer backend totals but use local weeklyCount for today's tick
            const merged = [...data.weeklyCount];
            const todayI = (new Date().getDay() + 6) % 7;
            if (localWeekly[todayI] > 0 && merged[todayI] === 0) merged[todayI] = localWeekly[todayI];
            set({ stats: { ...data, weeklyCount: merged } });
        } catch { /* backend offline — keep local data */ }
    },

    fetchSessions: async () => {
        try {
            const { data } = await sessionApi.getMy();
            set({ sessions: data });
        } catch { /* backend offline — no-op */ }
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

    recordLocalWorkout: (durationSeconds: number) => {
        const todayIdx = (new Date().getDay() + 6) % 7;
        const durationMin = Math.round(durationSeconds / 60);
        const today = todayStr();

        // Persist the date immediately
        saveDate(today);

        set((state) => {
            const prev = state.stats ?? {
                totalSessions: 0, totalMinutes: 0, streak: 0,
                weeklyCount: [0, 0, 0, 0, 0, 0, 0],
            };
            const newWeekly = [...prev.weeklyCount] as number[];
            newWeekly[todayIdx] = Math.max((newWeekly[todayIdx] ?? 0) + 1, 1);
            const yesterdayIdx = (todayIdx + 6) % 7;
            const newStreak = newWeekly[yesterdayIdx] > 0 || prev.streak > 0
                ? prev.streak + 1
                : 1;
            return {
                stats: {
                    totalSessions: prev.totalSessions + 1,
                    totalMinutes: prev.totalMinutes + durationMin,
                    streak: newStreak,
                    weeklyCount: newWeekly,
                },
            };
        });
        // Re-fetch from backend in background
        setTimeout(() => { get().fetchStats(); get().fetchSessions(); }, 1500);
    },
}));
