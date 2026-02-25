// ─────────────────────────────────────────────
//  MOVO — Design Tokens & App Constants
// ─────────────────────────────────────────────

export const Colors = {
    background: '#0A0A0A',
    surface: '#1A1A1A',
    surfaceAlt: '#141414',
    primary: '#6C63FF',
    primaryDark: '#5A52E0',
    secondary: '#FF6B6B',
    accentYoga: '#4ECDC4',
    accentPilates: '#FFE66D',
    textPrimary: '#FFFFFF',
    textSecondary: '#9A9A9A',
    textMuted: '#555555',
    border: '#2A2A2A',
    success: '#4CAF50',
    warning: '#FFB74D',
    error: '#EF5350',
    overlay: 'rgba(0,0,0,0.7)',
    // gradients
    gradientGym: ['#FF6B6B', '#FF8E53'] as const,
    gradientYoga: ['#4ECDC4', '#44A08D'] as const,
    gradientPilates: ['#FFE66D', '#F9D423'] as const,
    gradientPrimary: ['#6C63FF', '#9C6FFF'] as const,
    gradientDark: ['#1A1A1A', '#0A0A0A'] as const,
} as const;

export const FontSizes = {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 38,
} as const;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
} as const;

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 999,
} as const;

export const Goals = [
    { id: 'muscle_gain', label: 'Ganar masa muscular', emoji: '💪' },
    { id: 'weight_loss', label: 'Perder peso', emoji: '🔥' },
    { id: 'flexibility', label: 'Mejorar flexibilidad', emoji: '🧘' },
    { id: 'endurance', label: 'Aumentar resistencia', emoji: '🏃' },
    { id: 'stress_reduction', label: 'Reducir estrés', emoji: '😌' },
    { id: 'posture', label: 'Mejorar postura', emoji: '🦴' },
    { id: 'energy', label: 'Aumentar energía diaria', emoji: '⚡' },
] as const;

export const ActivityLevels = [
    { id: 'sedentary', label: 'Sedentario', description: 'Poca o ninguna actividad' },
    { id: 'beginner', label: 'Principiante', description: 'Actividad 1-2 días/semana' },
    { id: 'intermediate', label: 'Intermedio', description: 'Actividad 3-4 días/semana' },
    { id: 'advanced', label: 'Avanzado', description: 'Actividad 5+ días/semana' },
] as const;

export const WorkoutTypes = [
    { id: 'gym', label: 'Gym', emoji: '🏋️', color: Colors.secondary },
    { id: 'yoga', label: 'Yoga', emoji: '🧘', color: Colors.accentYoga },
    { id: 'pilates', label: 'Pilates', emoji: '🌀', color: Colors.accentPilates },
] as const;

export const SessionDurations = [
    { value: 20, label: '20 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '60 min+' },
] as const;

export const DifficultyColors: Record<string, string> = {
    beginner: Colors.success,
    intermediate: Colors.warning,
    advanced: Colors.secondary,
};

export const CategoryColors: Record<string, readonly string[]> = {
    gym: Colors.gradientGym,
    yoga: Colors.gradientYoga,
    pilates: Colors.gradientPilates,
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
