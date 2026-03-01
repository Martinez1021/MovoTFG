import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { routineApi, exerciseApi, sessionApi } from '../services/api';
import { Routine, UserRoutine, WorkoutSession } from '../types';
import { supabase } from '../services/supabase';

// Key is per-user: 'movo_workout_dates_<supabase_uid>'
const workoutDatesKey = (uid: string) => `movo_workout_dates_${uid}`;

// Helper to get the current authenticated user's UID
async function getCurrentUid(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
}

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

async function loadStoredDates(uid: string): Promise<string[]> {
    try {
        const raw = await AsyncStorage.getItem(workoutDatesKey(uid));
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch { return []; }
}

async function saveDate(dateStr: string, uid: string): Promise<void> {
    try {
        const existing = await loadStoredDates(uid);
        // keep last 365 days, de-duplicate
        const updated = Array.from(new Set([...existing, dateStr])).slice(-365);
        await AsyncStorage.setItem(workoutDatesKey(uid), JSON.stringify(updated));
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
        const uid = await getCurrentUid();
        const localDates = uid ? await loadStoredDates(uid) : [];
        const localWeekly = buildWeeklyCount(localDates);

        // ── 1. Query workout_sessions from Supabase directly ──────────────────
        if (uid) {
            try {
                // Get the user's public users.id from their supabase_id
                const { data: userData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('supabase_id', uid)
                    .maybeSingle();

                if (userData) {
                    const { data: sessions } = await supabase
                        .from('workout_sessions')
                        .select('started_at, duration_minutes, completed_at')
                        .eq('user_id', userData.id)
                        .not('completed_at', 'is', null);

                    if (sessions && sessions.length > 0) {
                        const totalSessions = sessions.length;
                        const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0);

                        // Build weeklyCount from session dates
                        const sessionDates = sessions.map((s) =>
                            new Date(s.started_at).toISOString().split('T')[0]
                        );
                        // Merge with local AsyncStorage dates (for today's fresh workouts)
                        const allDates = Array.from(new Set([...sessionDates, ...localDates]));
                        const weeklyCount = buildWeeklyCount(allDates);

                        // Compute streak: how many consecutive days back from today have sessions
                        const dateSet = new Set(allDates);
                        let streak = 0;
                        const check = new Date();
                        // If today has no session yet, start from yesterday for streak
                        const todayStr2 = check.toISOString().split('T')[0];
                        if (!dateSet.has(todayStr2)) check.setDate(check.getDate() - 1);
                        while (true) {
                            const ds = check.toISOString().split('T')[0];
                            if (!dateSet.has(ds)) break;
                            streak++;
                            check.setDate(check.getDate() - 1);
                            if (streak > 365) break;
                        }

                        // Merge weeklyCount with local today tick
                        const todayI = (new Date().getDay() + 6) % 7;
                        if (localWeekly[todayI] > 0 && weeklyCount[todayI] === 0) {
                            weeklyCount[todayI] = localWeekly[todayI];
                        }

                        set({ stats: { totalSessions, totalMinutes, streak, weeklyCount } });
                        return; // done — no need to hit backend
                    }
                }
            } catch (e) {
                // Supabase error — fall through to backend / local
            }
        }

        // ── 2. Fallback: local dates only ─────────────────────────────────────
        set((state) => ({
            stats: {
                totalSessions: state.stats?.totalSessions ?? localDates.length,
                totalMinutes: state.stats?.totalMinutes ?? 0,
                streak: state.stats?.streak ?? (localWeekly[(new Date().getDay() + 6) % 7] > 0 ? 1 : 0),
                weeklyCount: localWeekly,
            },
        }));

        // ── 3. Try backend as bonus (optional) ────────────────────────────────
        try {
            const { data } = await sessionApi.getStats();
            const merged = [...data.weeklyCount];
            const todayI = (new Date().getDay() + 6) % 7;
            if (localWeekly[todayI] > 0 && merged[todayI] === 0) merged[todayI] = localWeekly[todayI];
            set({ stats: { ...data, weeklyCount: merged } });
        } catch { /* backend offline — keep local data */ }
    },

    fetchSessions: async () => {
        // Try Supabase directly first
        try {
            const uid = await getCurrentUid();
            if (uid) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('supabase_id', uid)
                    .maybeSingle();
                if (userData) {
                    const { data: rows } = await supabase
                        .from('workout_sessions')
                        .select('*, routines(title, category)')
                        .eq('user_id', userData.id)
                        .order('started_at', { ascending: false })
                        .limit(50);
                    if (rows) {
                        // Map to WorkoutSession shape
                        const mapped = rows.map((r: any) => ({
                            id: r.id,
                            userId: r.user_id,
                            routineId: r.routine_id,
                            routineName: r.routines?.title ?? '',
                            routineCategory: r.routines?.category ?? '',
                            startedAt: r.started_at,
                            completedAt: r.completed_at,
                            durationMinutes: r.duration_minutes,
                            caloriesBurned: r.calories_burned,
                            rating: r.rating,
                            notes: r.notes,
                        }));
                        set({ sessions: mapped });
                        return;
                    }
                }
            }
        } catch { /* fall through */ }
        // Fallback: backend
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

        // Persist the date per-user
        getCurrentUid().then((uid) => {
            if (uid) saveDate(today, uid);
        });

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
