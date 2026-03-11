// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  authStore.ts — Estado global de autenticación (Zustand)                    ║
// ║                                                                              ║
// ║  CRITERIO 3 — CONEXIÓN:                                                      ║
// ║   • Usa el cliente Supabase JS para autenticar (supabase.ts)                ║
// ║   • Persiste la sesión en AsyncStorage (almacenamiento local del móvil)     ║
// ║   • Sincroniza el usuario con el backend Spring Boot tras el login          ║
// ║                                                                              ║
// ║  CRITERIO 4 — APIs:                                                          ║
// ║   • Supabase Auth API: signInWithPassword, signUp, signOut, getSession      ║
// ║   • Backend API propia: POST /api/auth/sync (después del login)             ║
// ║                                                                              ║
// ║  CRITERIO 5 — SEGURIDAD:                                                     ║
// ║   • El JWT de Supabase se almacena en AsyncStorage (equivalente SecureStore)║
// ║   • autoRefreshToken: true → Supabase renueva el token automáticamente      ║
// ║   • withTimeout: protege contra conexiones que no responden (10s máx)       ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { authApi } from '../services/api';
import { User, UserProfile, RegisterData } from '../types';

// Utilidad de seguridad: rechaza la promesa si tarda más de `ms` milisegundos
// Evita que la app quede bloqueada si Supabase o el backend no responden
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('La conexión tardó demasiado. Comprueba tu internet.')), ms)
        ),
    ]);

// Normaliza los campos del usuario del backend (Spring devuelve camelCase y/o snake_case)
// Garantiza que siempre tengamos avatar_url, full_name, etc. con el formato correcto
const normalizeBackendUser = (data: any): any => ({
    ...data,
    avatar_url: data.avatar_url ?? data.avatarUrl ?? undefined,
    full_name:  data.full_name  ?? data.fullName  ?? undefined,
    trainer_id: data.trainer_id ?? data.trainerId  ?? undefined,
    created_at: data.created_at ?? data.createdAt  ?? undefined,
});

// Definición del estado y las acciones de autenticación (tipado TypeScript)
interface AuthState {
    user: User | null;              // usuario autenticado (null = no logueado)
    profile: UserProfile | null;    // perfil físico del usuario (peso, altura, objetivos...)
    isLoading: boolean;             // true sólo durante la inicialización del app
    isAuthenticated: boolean;       // determina qué pantallas muestra AppNavigator
    setUser: (user: User | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
}

// Zustand: store reactivo (similar a Redux pero sin boilerplate)
// Todos los componentes que usen useAuthStore se re-renderizan al cambiar el estado
export const useAuthStore = create<AuthState>((set, get) => ({
    // Estado inicial
    user: null,
    profile: null,
    isLoading: true,         // empieza en true hasta que initialize() termine
    isAuthenticated: false,

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setProfile: (profile) => set({ profile }),

    /**
     * CRITERIO 3 — CONEXIÓN: Inicialización del estado de autenticación.
     * Se llama al arrancar la app en App.tsx.
     *
     * Comprueba si hay una sesión activa guardada en AsyncStorage
     * (el usuario cerró la app pero no cerró sesión → no tiene que volver a loguearse)
     */
    initialize: async () => {
        try {
            // CRITERIO 3: supabase.auth.getSession() lee el JWT de AsyncStorage
            const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000);
            if (session?.user) {
                const supabaseUser = session.user;

                // Construimos el objeto User desde los metadatos de Supabase
                const localUser = {
                    id: supabaseUser.id,
                    email: supabaseUser.email!,
                    full_name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email!,
                    avatar_url: supabaseUser.user_metadata?.avatar_url,
                    role: supabaseUser.user_metadata?.role ?? 'user',
                    created_at: supabaseUser.created_at,
                };
                // Actualizamos el estado inmediatamente para mostrar la app sin esperar al backend
                set({ user: localUser, isAuthenticated: true });

                // Cargamos el perfil físico desde la tabla user_profiles de Supabase
                supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', supabaseUser.id)
                    .maybeSingle()
                    .then(({ data: profileData }) => {
                        if (profileData) set({ profile: profileData });
                    });

                // Sincronizamos con el backend Spring Boot en segundo plano (no bloquea la UI)
                // Si el backend está offline, usamos los datos de Supabase (degradación elegante)
                const metaAvatar = supabaseUser.user_metadata?.avatar_url ?? null;
                authApi.syncUser({
                    supabaseId: supabaseUser.id,
                    email: supabaseUser.email!,
                    fullName: supabaseUser.user_metadata?.full_name ?? '',
                    role: supabaseUser.user_metadata?.role ?? 'user',
                }).then(({ data }) => {
                    if (data) {
                        const synced = { ...normalizeBackendUser(data), id: supabaseUser.id };
                        // Preserve auth metadata avatar if backend row still has null
                        if (!synced.avatar_url && metaAvatar) synced.avatar_url = metaAvatar;
                        set({ user: synced });
                        // Sync avatar to public.users so feed hydration works correctly
                        if (metaAvatar) {
                            supabase.from('users')
                                .update({ avatar_url: metaAvatar })
                                .eq('supabase_id', supabaseUser.id)
                                .then(() => {});
                        }
                    }
                }).catch(() => { /* backend offline — se usa Supabase data */ });
            }
        } catch (e) {
            console.warn('Auth init error:', e);
        } finally {
            // IMPORTANTE: isLoading → false SIEMPRE, incluso si hay error
            // Si no, AppNavigator mostraría SplashScreen indefinidamente
            set({ isLoading: false });
        }
    },

    /**
     * CRITERIO 4 — API (Supabase Auth): Login con email y contraseña.
     *
     * CRITERIO 5 — SEGURIDAD:
     *  • Supabase valida las credenciales y devuelve un JWT firmado con ES256
     *  • El JWT se almacena automáticamente en AsyncStorage por el cliente de Supabase
     *  • Mensajes de error genéricos para no revelar si el email existe o no
     *
     * TRUCO CLAVE: NO usamos isLoading:true al inicio del login.
     * Si lo hiciéramos, AppNavigator devolvería <SplashScreen /> y
     * NavigationContainer se desmonataría → el estado de navegación se pierde.
     * Usamos un estado local isSubmitting en LoginScreen.tsx en su lugar.
     */
    login: async (email, password) => {
        try {
            // CRITERIO 4: llamada a la API de Supabase Auth
            const { data, error } = await withTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                10000  // timeout de 10s
            );
            if (error) {
                // Traducciones de errores de Supabase → mensajes en español
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

            const supabaseUser = data.user;
            const localUser: User = {
                id: supabaseUser.id,
                email: supabaseUser.email!,
                full_name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email!,
                avatar_url: supabaseUser.user_metadata?.avatar_url,
                role: supabaseUser.user_metadata?.role ?? 'user',
                created_at: supabaseUser.created_at,
            };

            // Un ÚNICO set() para que NavigationContainer nunca se desmonte durante el login
            // → isAuthenticated:true + isLoading:false en la misma actualización atómica
            set({ user: localUser, isAuthenticated: true, isLoading: false });

            // Sincronizamos con el backend en segundo plano (no bloquea la navegación)
            const loginMetaAvatar = supabaseUser.user_metadata?.avatar_url ?? null;
            authApi.syncUser({
                supabaseId: supabaseUser.id,
                email: supabaseUser.email!,
                fullName: supabaseUser.user_metadata?.full_name ?? '',
                role: supabaseUser.user_metadata?.role ?? 'user',
            }).then(({ data: syncRes }) => {
                if (syncRes) {
                    const synced = { ...normalizeBackendUser(syncRes), id: supabaseUser.id };
                    if (!synced.avatar_url && loginMetaAvatar) synced.avatar_url = loginMetaAvatar;
                    set({ user: synced });
                    // Sync avatar to public.users so feed hydration works
                    if (loginMetaAvatar) {
                        supabase.from('users')
                            .update({ avatar_url: loginMetaAvatar })
                            .eq('supabase_id', supabaseUser.id)
                            .then(() => {});
                    }
                }
            }).catch(() => { });
        } catch (e) {
            set({ isLoading: false });
            throw e; // re-throw para que LoginScreen muestre el mensaje de error
        }
    },

    /**
     * CRITERIO 4 — API (Supabase Auth): Registro de nuevo usuario.
     * Crea la cuenta en Supabase Auth, luego sincroniza con Spring Boot.
     */
    register: async (data) => {
        set({ isLoading: true });
        try {
            // CRITERIO 4: supabase.auth.signUp() crea el usuario en Supabase Auth
            // Los datos extra (nombre, rol) se guardan en user_metadata del JWT
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
                // Actualizamos el estado con el nuevo usuario (sesión puede estar activa si
                // en Supabase no se requiere confirmación de email)
                set({
                    user: {
                        id: authData.user.id,
                        email: data.email,
                        full_name: data.full_name,
                        role: data.role,
                        avatar_url: avatarUrl,
                        created_at: authData.user.created_at,
                    },
                    isAuthenticated: !!authData.session, // false si requiere confirmación de email
                });
                // Sincronizamos con el backend en segundo plano
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
                    // Subimos el avatar a la tabla users una vez el registro está sincronizado
                    if (avatarUrl) {
                        await supabase
                            .from('users')
                            .update({ avatar_url: avatarUrl })
                            .eq('supabase_id', authData.user!.id);
                    }
                }).catch(() => { /* backend offline — se usa Supabase data */ });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    /**
     * Cierra la sesión: limpia el JWT de AsyncStorage y resetea el estado global.
     * También limpia los stores dependientes para que el próximo usuario no vea
     * datos del usuario anterior.
     */
    logout: async () => {
        // CRITERIO 4: supabase.auth.signOut() invalida la sesión en Supabase
        await supabase.auth.signOut();
        set({ user: null, profile: null, isAuthenticated: false });
        // Limpiamos los stores de rutinas y entrenador para el próximo login
        const { useRoutineStore } = await import('./routineStore');
        useRoutineStore.setState({ stats: null, sessions: [], assignedRoutines: [] });
        const { useTrainerStore } = await import('./trainerStore');
        useTrainerStore.setState({ clients: [], pendingRequests: [], trainerInternalId: null });
    },
}));
