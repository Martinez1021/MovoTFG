import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@movo_accent_v2';

export const ACCENT_COLORS = [
    { name: 'Violeta', primary: '#7B2FBE', gradient: ['#7B2FBE', '#A855F7'] as [string, string] },
    { name: 'Azul', primary: '#2563EB', gradient: ['#1D4ED8', '#60A5FA'] as [string, string] },
    { name: 'Verde', primary: '#16A34A', gradient: ['#15803D', '#4ADE80'] as [string, string] },
    { name: 'Naranja', primary: '#EA580C', gradient: ['#C2410C', '#FB923C'] as [string, string] },
    { name: 'Rosa', primary: '#DB2777', gradient: ['#BE185D', '#F472B6'] as [string, string] },
    { name: 'Cian', primary: '#0891B2', gradient: ['#0E7490', '#22D3EE'] as [string, string] },
];

interface ThemeState {
    accentIndex: number;
    primary: string;
    gradient: [string, string];
    load: () => Promise<void>;
    setAccent: (index: number) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
    accentIndex: 0,
    primary: ACCENT_COLORS[0].primary,
    gradient: ACCENT_COLORS[0].gradient,

    load: async () => {
        try {
            const saved = await AsyncStorage.getItem(THEME_KEY);
            if (saved !== null) {
                const idx = parseInt(saved);
                if (ACCENT_COLORS[idx]) {
                    set({
                        accentIndex: idx,
                        primary: ACCENT_COLORS[idx].primary,
                        gradient: ACCENT_COLORS[idx].gradient,
                    });
                }
            }
        } catch { /* ignore */ }
    },

    setAccent: async (index: number) => {
        const color = ACCENT_COLORS[index];
        if (!color) return;
        set({ accentIndex: index, primary: color.primary, gradient: color.gradient });
        try { await AsyncStorage.setItem(THEME_KEY, String(index)); } catch { /* ignore */ }
    },
}));
