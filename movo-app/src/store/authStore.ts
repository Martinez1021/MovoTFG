import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { authApi } from '../services/api';
import { User, UserProfile, RegisterData } from '../types';

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
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Set user immediately from Supabase session (no backend needed)
                const supabaseUser = session.user;
                set({
                    user: {
                        id: supabaseUser.id,
                        email: supabaseUser.email!,
                        full_name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email!,
                        avatar_url: supabaseUser.user_metadata?.avatar_url,
                        role: supabaseUser.user_metadata?.role ?? 'user',
                        created_at: supabaseUser.created_at,
                    },
                    isAuthenticated: true,
                });
                // Sync with backend in background (non-blocking)
                authApi.syncUser({
                    supabaseId: supabaseUser.id,
                    email: supabaseUser.email!,
                    fullName: supabaseUser.user_metadata?.full_name ?? '',
                    role: supabaseUser.user_metadata?.role ?? 'user',
                }).then(({ data }) => {
                    if (data) set({ user: data });
                }).catch(() => { /* backend offline — use Supabase data */ });
            }
        } catch (e) {
            console.error('Auth init error:', e);
        } finally {
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw new Error(error.message);
            if (data.user) {
                const { data: syncRes } = await authApi.syncUser({
                    supabaseId: data.user.id,
                    email: data.user.email!,
                    fullName: data.user.user_metadata?.full_name ?? '',
                    role: data.user.user_metadata?.role ?? 'user',
                });
                set({ user: syncRes, isAuthenticated: true });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    register: async (data) => {
        set({ isLoading: true });
        try {
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: { full_name: data.full_name, role: data.role },
                },
            });
            if (error) throw new Error(error.message);
            if (authData.user) {
                // Set user immediately from Supabase (no backend blocking)
                set({
                    user: {
                        id: authData.user.id,
                        email: data.email,
                        full_name: data.full_name,
                        role: data.role,
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
                }).then(({ data: syncRes }) => {
                    if (syncRes) set({ user: syncRes });
                }).catch(() => { /* backend offline — use Supabase data */ });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, isAuthenticated: false });
    },
}));
