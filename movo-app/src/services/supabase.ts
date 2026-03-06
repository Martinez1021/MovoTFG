// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  supabase.ts — Inicialización del cliente Supabase JS                       ║
// ║                                                                              ║
// ║  CRITERIO 3 — CONEXIÓN:                                                      ║
// ║   • createClient() establece la conexión con Supabase (PostgreSQL cloud)    ║
// ║   • storage: AsyncStorage → el JWT se persiste en el dispositivo móvil      ║
// ║     (equivalente a localStorage en web, pero para React Native)             ║
// ║   • autoRefreshToken: true → Supabase renueva el JWT antes de que expire    ║
// ║     (los JWT de Supabase duran 1 hora por defecto)                          ║
// ║   • persistSession: true → el usuario no tiene que hacer login al reabrir   ║
// ║                                                                              ║
// ║  CRITERIO 4 — APIs:                                                          ║
// ║   • Este cliente da acceso a: Supabase Auth, Database (PostgREST), Storage  ║
// ║   • Se usa en authStore.ts, routineStore.ts, etc.                           ║
// ║                                                                              ║
// ║  CRITERIO 5 — SEGURIDAD:                                                     ║
// ║   • supabaseAnonKey: clave pública anónima (sólo permite operaciones RLS-   ║
// ║     permitidas). NO es la service_role key (que daría acceso total).        ║
// ║   • Se lee de variables de entorno EXPO_PUBLIC_* (fichero .env)             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CRITERIO 5 — SEGURIDAD: Las claves se leen exclusivamente de variables de entorno.
// Define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en movo-app/.env
// (ese archivo está en .gitignore y nunca se sube al repositorio).
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * CRITERIO 3 — CONEXIÓN: Instancia única del cliente Supabase JS.
 * Exportada y reutilizada por todos los stores y servicios de la app.
 *
 * El cliente gestiona internamente:
 *  - El pool de peticiones HTTP al endpoint PostgREST de Supabase
 *  - La renovación automática del JWT cada ~55 minutos
 *  - La persistencia de la sesión en AsyncStorage del dispositivo
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // CRITERIO 3: AsyncStorage = almacenamiento persistente en React Native
        // El JWT se guarda aquí para que el usuario no tenga que volver a loguearse
        storage: AsyncStorage,
        autoRefreshToken: true,   // renueva el JWT automáticamente antes de que expire
        persistSession: true,     // guarda la sesión al cerrar la app
        detectSessionInUrl: false, // false en React Native (no hay URLs del navegador)
    },
});

/**
 * CRITERIO 3 + 5: Obtiene el token de acceso JWT actual de la sesión activa.
 * Usado en api.ts (Axios interceptor) para autenticar todas las peticiones
 * al backend Spring Boot con el header "Authorization: Bearer <token>".
 */
export const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
};
