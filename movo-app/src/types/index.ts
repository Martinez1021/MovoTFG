// ─────────────────────────────────────────────
//  MOVO — TypeScript Types & Interfaces
// ─────────────────────────────────────────────

export type UserRole = 'trainer' | 'user';
export type Gender = 'male' | 'female' | 'prefer_not_to_say';
export type ActivityLevel = 'sedentary' | 'beginner' | 'intermediate' | 'advanced';
export type RoutineCategory = 'gym' | 'yoga' | 'pilates';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutStatus = 'active' | 'completed' | 'paused';
export type SessionDuration = 20 | 30 | 45 | 60;

export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: UserRole;
    trainer_id?: string;
    created_at: string;
}

export interface UserProfile {
    id: string;
    user_id: string;
    weight_kg?: number;
    height_cm?: number;
    age?: number;
    gender?: Gender;
    activity_level?: ActivityLevel;
    goals: string[];
    preferred_types: RoutineCategory[];
    available_days?: number;
    session_duration?: SessionDuration;
    notes_from_trainer?: string;
    updated_at: string;
}

export interface Exercise {
    id: string;
    routine_id: string;
    name: string;
    description: string;
    sets?: number;
    reps?: number;
    duration_seconds?: number;
    rest_seconds: number;
    order_index: number;
    video_url?: string;
    image_url?: string;
    muscle_group: string;
}

export interface Routine {
    id: string;
    title: string;
    description: string;
    category: RoutineCategory;
    difficulty: Difficulty;
    duration_minutes: number;
    created_by: string;
    is_public: boolean;
    thumbnail_url?: string;
    created_at: string;
    exercises?: Exercise[];
}

export interface UserRoutine {
    id: string;
    user_id: string;
    routine_id: string;
    assigned_by: string;
    start_date?: string;
    end_date?: string;
    status: WorkoutStatus;
    routine?: Routine;
}

export interface WorkoutSession {
    id: string;
    user_id: string;
    routine_id: string;
    started_at: string;
    completed_at?: string;
    duration_minutes?: number;
    calories_burned?: number;
    notes?: string;
    rating?: number;
    routine?: Routine;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export interface AIConversation {
    id: string;
    user_id: string;
    messages: ChatMessage[];
    created_at: string;
    updated_at: string;
}

export interface TrainerMessage {
    id: string;
    trainer_id: string;
    user_id: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

// ─── OnBoarding ───────────────────────────────
export interface RegisterStep1 {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    role: UserRole;
    avatar_url?: string;
}

export interface RegisterStep2 {
    weight_kg: number;
    height_cm: number;
    age: number;
    gender: Gender;
    activity_level: ActivityLevel;
}

export interface RegisterStep3 {
    goals: string[];
}

export interface RegisterStep4 {
    preferred_types: RoutineCategory[];
    available_days: number;
    session_duration: SessionDuration;
    trainer_code?: string;
}

export interface RegisterData extends RegisterStep1, Partial<RegisterStep2>, RegisterStep3, RegisterStep4 { }

// ─── API Responses ────────────────────────────
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface AIChatResponse {
    reply: string;
    conversationId: string;
    tokensUsed: number;
}

// ─── Navigation ───────────────────────────────
export type AuthStackParamList = {
    Splash: undefined;
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
};

export type UserTabParamList = {
    Home: undefined;
    Routines: undefined;
    AICoach: undefined;
    Progress: undefined;
    Profile: undefined;
};

export type TrainerTabParamList = {
    Dashboard: undefined;
    Clients: undefined;
    TrainerRoutines: undefined;
    Messages: undefined;
    TrainerProfile: undefined;
};

export type RootStackParamList = {
    RoutineDetail: { routineId: string };
    ActiveWorkout: { routineId: string; userRoutineId?: string };
    ExerciseDetail: { exerciseId: string };
    ClientDetail: { clientId: string };
    EditProfile: undefined;
    Settings: undefined;
};
