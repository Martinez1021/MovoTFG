import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { authApi } from '../services/api';
import { User, UserProfile, RegisterData } from '../types';

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('La conexión tardó demasiado. Comprueba tu internet.')), ms)
        ),
    ]);

// Normalize backend response: Java serializes as camelCase by default.
// Even with SNAKE_CASE config, run this as safety net so avatar_url always exists.
const normalizeBackendUser = (data: any): any => ({
    ...data,
    avatar_url: data.avatar_url ?? data.avatarUrl ?? undefined,
    full_name:  data.full_name  ?? data.fullName  ?? undefined,
    trainer_id: data.trainer_id ?? data.trainerId  ?? undefined,
    created_at: data.created_at ?? data.createdAt  ?? undefined,
});

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setProfile: (profile) => set({ profile }),

    initialize: async () => {
        try {
            const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000);
            if (session?.user) {
                // Set user immediately from Supabase session (no backend needed)
                const supabaseUser = session.user;
                const localUser = {
                    id: supabaseUser.id,
                    email: supabaseUser.email!,
                    full_name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email!,
                    avatar_url: supabaseUser.user_metadata?.avatar_url,
                    role: supabaseUser.user_metadata?.role ?? 'user',
                    created_at: supabaseUser.created_at,
                };
                set({ user: localUser, isAuthenticated: true });

                // Load profile from Supabase user_profiles
                supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', supabaseUser.id)
                    .maybeSingle()
                    .then(({ data: profileData }) => {
                        if (profileData) set({ profile: profileData });
                    });

                // Sync with backend in background (non-blocking)
                authApi.syncUser({
                    supabaseId: supabaseUser.id,
                    email: supabaseUser.email!,
                    fullName: supabaseUser.user_metadata?.full_name ?? '',
                    role: supabaseUser.user_metadata?.role ?? 'user',
                }).then(({ data }) => {
                    if (data) set({ user: { ...normalizeBackendUser(data), id: supabaseUser.id } });
                }).catch(() => { /* backend offline — use Supabase data */ });
            }
        } catch (e) {
            console.warn('Auth init error:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const { data, error } = await withTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                10000
            );
            if (error) {
                // Translate common Supabase error messages to Spanish
                const msg = error.message;
                if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
                    throw new Error('Email o contraseña incorrectos');
                if (msg.includes('Email not confirmed'))
                    throw new Error('Debes confirmar tu email antes de acceder. Revisa tu bandeja de entrada.');
                if (msg.includes('Too many requests'))
                    throw new Error('Demasiados intentos. Espera unos minutos.');
                throw new Error(msg);
            }
            if (!data.user) throw new Error('No se pudo obtener el usuario');

            // Set user from Supabase immediately — backend is optional
            const supabaseUser = data.user;
            const localUser: User = {
                id: supabaseUser.id,
                email: supabaseUser.email!,
                full_name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email!,
                avatar_url: supabaseUser.user_metadata?.avatar_url,
                role: supabaseUser.user_metadata?.role ?? 'user',
                created_at: supabaseUser.created_at,
            };
            set({ user: localUser, isAuthenticated: true });

            // Sync with backend in background (best-effort)
            authApi.syncUser({
                supabaseId: supabaseUser.id,
                email: supabaseUser.email!,
                fullName: supabaseUser.user_metadata?.full_name ?? '',
                role: supabaseUser.user_metadata?.role ?? 'user',
            }).then(({ data: syncRes }) => {
                if (syncRes) set({ user: { ...normalizeBackendUser(syncRes), id: supabaseUser.id } });
            }).catch(() => { /* backend offline — use Supabase data */ });
        } finally {
            set({ isLoading: false });
        }
    },

    register: async (data) => {
        set({ isLoading: true });
        try {
            const { data: authData, error } = await withTimeout(supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: { full_name: data.full_name, role: data.role },
                },
            }), 10000);
            if (error) {
                if (error.message.includes('already registered') || error.message.includes('already been registered'))
                    throw new Error('Este email ya está registrado. Inicia sesión.');
                throw new Error(error.message);
            }
            if (authData.user) {
                const avatarUrl = (data as any).avatarUri ?? null;
                // Set user immediately from Supabase (no backend blocking)
                set({
                    user: {
                        id: authData.user.id,
                        email: data.email,
                        full_name: data.full_name,
                        role: data.role,
                        avatar_url: avatarUrl,
                        created_at: authData.user.created_at,
                    },
                    isAuthenticated: !!authData.session, // false if email confirmation required
                });
                // Sync with backend in background
                authApi.syncUser({
                    supabaseId: authData.user.id,
                    email: data.email,
                    fullName: data.full_name,
                    role: data.role,
                }).then(async ({ data: syncRes }) => {
                    if (syncRes) {
                        const norm = normalizeBackendUser(syncRes);
                        set({ user: { ...norm, id: authData.user!.id, avatar_url: avatarUrl ?? norm.avatar_url } });
                    }
                    // Upload avatar to users table once the row is synced
                    if (avatarUrl) {
                        await supabase
                            .from('users')
                            .update({ avatar_url: avatarUrl })
                            .eq('supabase_id', authData.user!.id);
                    }
                }).catch(() => { /* backend offline — use Supabase data */ });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, isAuthenticated: false });
        // Reset per-user in-memory stats so next login loads fresh data
        const { useRoutineStore } = await import('./routineStore');
        useRoutineStore.setState({ stats: null, sessions: [], assignedRoutines: [] });
        const { useTrainerStore } = await import('./trainerStore');
        useTrainerStore.setState({ clients: [], pendingRequests: [], trainerInternalId: null });
    },
}));
