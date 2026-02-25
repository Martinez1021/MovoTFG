import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback hardcodeado: Expo Go a veces no inyecta env vars en el primer bundle
const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    'https://uyxysrodgxxduzyekgjo.supabase.co';
const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5eHlzcm9kZ3h4ZHV6eWVrZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDM1MDIsImV4cCI6MjA4NzU3OTUwMn0.ZowFfmlcxgOnk_DFXDmQ3NmIUBTnsUpQFfCG3lrZgTw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
};
