import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, FontSizes, BorderRadius, Goals, ActivityLevels, WorkoutTypes, SessionDurations } from '../../utils/constants';
import { RegisterData, UserRole, ActivityLevel, RoutineCategory, SessionDuration } from '../../types';

// ─── Step bar ─────────────────────────────────────────────────────────────────
const StepBar: React.FC<{ step: number; total: number; primary: string }> = ({ step, total, primary }) => (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: Spacing['2xl'] }}>
        {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={{
                height: 4, borderRadius: 2, flex: 1,
                backgroundColor: i < step ? primary : Colors.border,
            }} />
        ))}
    </View>
);

// ─── Specialties trainers can offer ───────────────────────────────────────────
const TRAINER_SPECIALTIES = [
    { id: 'strength', emoji: '🏋️', label: 'Fuerza' },
    { id: 'cardio', emoji: '🏃', label: 'Cardio' },
    { id: 'yoga', emoji: '🧘', label: 'Yoga' },
    { id: 'pilates', emoji: '🤸', label: 'Pilates' },
    { id: 'crossfit', emoji: '🔥', label: 'CrossFit' },
    { id: 'hiit', emoji: '⚡', label: 'HIIT' },
    { id: 'nutrition', emoji: '🥗', label: 'Nutrición' },
    { id: 'rehab', emoji: '🏥', label: 'Rehabilitación' },
    { id: 'sport', emoji: '⚽', label: 'Deporte específico' },
    { id: 'online', emoji: '💻', label: 'Online' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { register: registerUser, isLoading } = useAuthStore();
    const primary = Colors.primary;

    // ── shared state ──────────────────────────────────────────────────────────
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<UserRole>('user');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [showPass, setShowPass] = useState(false);

    // ── user-only state ───────────────────────────────────────────────────────
    const [goals, setGoals] = useState<string[]>([]);
    const [preferredTypes, setPreferredTypes] = useState<string[]>([]);
    const [gender, setGender] = useState('prefer_not_to_say');
    const [activityLevel, setActivityLevel] = useState('');
    const [availableDays, setAvailableDays] = useState(3);
    const [sessionDuration, setSessionDuration] = useState<number>(45);

    // ── trainer-only state ────────────────────────────────────────────────────
    const [trainerSpecialties, setTrainerSpecialties] = useState<string[]>([]);

    const isTrainer = role === 'trainer';
    // Trainer: 2 steps | User: 4 steps
    const totalSteps = isTrainer ? 2 : 4;
    const isLastStep = step === totalSteps;

    const { control, handleSubmit, trigger, formState: { errors } } = useForm<any>({
        defaultValues: {
            full_name: '', email: '', password: '',
            specialty: '', experience_years: '', certifications: '', bio: '',
            weight_kg: '', height_cm: '', age: '',
        },
    });

    // ── avatar ────────────────────────────────────────────────────────────────
    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permisos', 'Necesitamos acceso a tu galería.'); return; }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
        });
        if (!res.canceled && res.assets?.[0]) {
            const b64 = res.assets[0].base64;
            setAvatarUri(b64 ? `data:image/jpeg;base64,${b64}` : res.assets[0].uri);
        }
    };

    // ── step navigation ───────────────────────────────────────────────────────
    const goNext = async () => {
        if (step === 1) {
            const ok = await trigger(['full_name', 'email', 'password']);
            if (!ok) return;
        }
        if (step === 2 && !isTrainer) {
            const ok = await trigger(['weight_kg', 'height_cm', 'age']);
            if (!ok) return;
        }
        setStep((s) => s + 1);
    };

    const toggleGoal = (id: string) =>
        setGoals((p) => p.includes(id) ? p.filter((g) => g !== id) : [...p, id]);

    const toggleType = (id: string) =>
        setPreferredTypes((p) => p.includes(id) ? p.filter((t) => t !== id) : [...p, id]);

    const toggleTrainerSpecialty = (id: string) =>
        setTrainerSpecialties((p) => p.includes(id) ? p.filter((t) => t !== id) : [...p, id]);

    // ── submit ────────────────────────────────────────────────────────────────
    const handleRegister = async (formValues: any) => {
        try {
            const payload: Partial<RegisterData> & { avatarUri?: string | null } = {
                full_name: formValues.full_name,
                email: formValues.email,
                password: formValues.password,
                role,
                avatarUri: avatarUri ?? undefined,
            };

            if (isTrainer) {
                Object.assign(payload, {
                    specialty: formValues.specialty || undefined,
                    experience_years: formValues.experience_years ? parseInt(formValues.experience_years) : undefined,
                    certifications: formValues.certifications || undefined,
                    bio: formValues.bio || undefined,
                    preferred_types: trainerSpecialties as RoutineCategory[],
                });
            } else {
                Object.assign(payload, {
                    weight_kg: formValues.weight_kg ? parseFloat(formValues.weight_kg) : undefined,
                    height_cm: formValues.height_cm ? parseFloat(formValues.height_cm) : undefined,
                    age: formValues.age ? parseInt(formValues.age) : undefined,
                    gender,
                    activity_level: activityLevel as ActivityLevel,
                    goals,
                    preferred_types: preferredTypes as RoutineCategory[],
                    available_days: availableDays,
                    session_duration: sessionDuration as SessionDuration,
                });
            }

            await registerUser(payload as RegisterData);
            Alert.alert(
                '¡Revisa tu email! 📧',
                'Te hemos enviado un enlace de confirmación. Haz clic en él para activar tu cuenta.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
            );
        } catch (e: any) {
            Alert.alert('Error al registrarse', e.message ?? 'Inténtalo de nuevo');
        }
    };

    const getTitle = () => {
        if (step === 1) return 'Crea tu cuenta';
        if (isTrainer) return 'Perfil profesional';
        if (step === 2) return 'Datos físicos';
        if (step === 3) return 'Tus objetivos';
        return 'Preferencias';
    };

    return (
        <LinearGradient colors={['#0A0A0A', '#0F0A1E']} style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

                    {/* Back */}
                    <TouchableOpacity
                        onPress={() => step > 1 ? setStep((s) => s - 1) : navigation.goBack()}
                        style={s.back}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>

                    <Text style={s.heading}>{getTitle()}</Text>
                    <Text style={s.subheading}>Paso {step} de {totalSteps}</Text>
                    <StepBar step={step} total={totalSteps} primary={primary} />

                    {/* ══════════════════════════════════════════════════════
                        STEP 1 — Datos básicos + selección de rol (ambos)
                    ══════════════════════════════════════════════════════ */}
                    {step === 1 && (
                        <View>
                            {/* Avatar */}
                            <TouchableOpacity onPress={pickAvatar} style={s.avatarWrap}>
                                {avatarUri
                                    ? <Image source={{ uri: avatarUri }} style={s.avatar} />
                                    : <LinearGradient colors={Colors.gradientPrimary} style={s.avatarPlaceholder}>
                                        <Ionicons name="camera-outline" size={28} color="#fff" />
                                      </LinearGradient>
                                }
                                <Text style={s.avatarHint}>Foto de perfil (opcional)</Text>
                            </TouchableOpacity>

                            <Controller control={control} name="full_name"
                                rules={{ required: 'Nombre obligatorio' }}
                                render={({ field: { onChange, value } }) => (
                                    <Input label="Nombre completo" placeholder="Tu nombre"
                                        onChangeText={onChange} value={value}
                                        error={errors.full_name?.message as string}
                                        leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textSecondary} />} />
                                )} />

                            <Controller control={control} name="email"
                                rules={{ required: 'Email obligatorio', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email no válido' } }}
                                render={({ field: { onChange, value } }) => (
                                    <Input label="Email" placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none"
                                        onChangeText={onChange} value={value}
                                        error={errors.email?.message as string}
                                        leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />} />
                                )} />

                            <Controller control={control} name="password"
                                rules={{ required: 'Contraseña obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
                                render={({ field: { onChange, value } }) => (
                                    <Input label="Contraseña" placeholder="••••••••" secureTextEntry={!showPass}
                                        onChangeText={onChange} value={value}
                                        error={errors.password?.message as string}
                                        leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
                                        rightIcon={
                                            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textSecondary} />
                                            </TouchableOpacity>
                                        } />
                                )} />

                            {/* Role picker */}
                            <Text style={s.sectionLabel}>¿Cuál es tu perfil?</Text>
                            <View style={s.roleRow}>
                                <TouchableOpacity
                                    onPress={() => setRole('user')}
                                    style={[s.roleCard, role === 'user' && { borderColor: primary, backgroundColor: primary + '15' }]}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={role === 'user' ? [primary + '33', primary + '11'] : ['#1a1a2e', '#0f0f1a']}
                                        style={s.roleCardGrad}
                                    >
                                        <Text style={{ fontSize: 38, marginBottom: 8 }}>🏃‍♂️</Text>
                                        <Text style={[s.roleTitle, role === 'user' && { color: primary }]}>Atleta</Text>
                                        <Text style={s.roleDesc}>Quiero entrenar, seguir mis progresos y mejorar mi condición física</Text>
                                        {role === 'user' && (
                                            <View style={[s.selectedBadge, { backgroundColor: primary }]}>
                                                <Ionicons name="checkmark" size={12} color="#fff" />
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setRole('trainer')}
                                    style={[s.roleCard, role === 'trainer' && { borderColor: '#A855F7', backgroundColor: '#A855F715' }]}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={role === 'trainer' ? ['#A855F733', '#A855F711'] : ['#1a1a2e', '#0f0f1a']}
                                        style={s.roleCardGrad}
                                    >
                                        <Text style={{ fontSize: 38, marginBottom: 8 }}>🏋️‍♀️</Text>
                                        <Text style={[s.roleTitle, role === 'trainer' && { color: '#A855F7' }]}>Entrenador</Text>
                                        <Text style={s.roleDesc}>Gestiono clientes, diseño rutinas y hago seguimiento de su evolución</Text>
                                        {role === 'trainer' && (
                                            <View style={[s.selectedBadge, { backgroundColor: '#A855F7' }]}>
                                                <Ionicons name="checkmark" size={12} color="#fff" />
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        STEP 2 ENTRENADOR — Perfil profesional
                    ══════════════════════════════════════════════════════ */}
                    {step === 2 && isTrainer && (
                        <View>
                            <Text style={s.stepHint}>Cuéntanos sobre tu experiencia. Todo es opcional — puedes completarlo desde tu perfil más tarde.</Text>

                            <Controller control={control} name="specialty"
                                render={({ field: { onChange, value } }) => (
                                    <Input label="Especialidad principal" placeholder="Ej: Pérdida de peso, Fuerza, Atletismo..."
                                        onChangeText={onChange} value={value}
                                        leftIcon={<Ionicons name="trophy-outline" size={18} color={Colors.textSecondary} />} />
                                )} />

                            <Controller control={control} name="experience_years"
                                render={({ field: { onChange, value } }) => (
                                    <Input label="Años de experiencia" placeholder="Ej: 5" keyboardType="numeric"
                                        onChangeText={onChange} value={value}
                                        leftIcon={<Ionicons name="time-outline" size={18} color={Colors.textSecondary} />} />
                                )} />

                            <Controller control={control} name="certifications"
                                render={({ field: { onChange, value } }) => (
                                    <Input label="Certificaciones" placeholder="Ej: NSCA-CPT, CrossFit L2, ISSA..."
                                        onChangeText={onChange} value={value}
                                        leftIcon={<Ionicons name="ribbon-outline" size={18} color={Colors.textSecondary} />} />
                                )} />

                            <Controller control={control} name="bio"
                                render={({ field: { onChange, value } }) => (
                                    <Input label="Bio / Presentación" placeholder="Cuéntale a tus clientes quién eres y cuál es tu método..."
                                        onChangeText={onChange} value={value}
                                        multiline numberOfLines={4}
                                        leftIcon={<Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} />} />
                                )} />

                            <Text style={s.sectionLabel}>¿En qué áreas entrenas?</Text>
                            <View style={s.chipRow}>
                                {TRAINER_SPECIALTIES.map((t) => {
                                    const active = trainerSpecialties.includes(t.id);
                                    return (
                                        <TouchableOpacity key={t.id} onPress={() => toggleTrainerSpecialty(t.id)}
                                            style={[s.chip, active && { borderColor: '#A855F7', backgroundColor: '#A855F722' }]}>
                                            <Text style={[s.chipText, active && { color: '#A855F7' }]}>{t.emoji} {t.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        STEP 2 ATLETA — Datos físicos + nivel de actividad
                    ══════════════════════════════════════════════════════ */}
                    {step === 2 && !isTrainer && (
                        <View>
                            <Text style={s.stepHint}>Usaremos estos datos para personalizar tu experiencia y recomendaciones.</Text>
                            <View style={s.row}>
                                <Controller control={control} name="weight_kg"
                                    rules={{ required: 'Requerido' }}
                                    render={({ field: { onChange, value } }) => (
                                        <Input label="Peso (kg)" placeholder="70" keyboardType="numeric"
                                            onChangeText={onChange} value={value}
                                            error={errors.weight_kg?.message as string}
                                            containerStyle={{ flex: 1, marginRight: 8 }} />
                                    )} />
                                <Controller control={control} name="height_cm"
                                    rules={{ required: 'Requerido' }}
                                    render={({ field: { onChange, value } }) => (
                                        <Input label="Altura (cm)" placeholder="175" keyboardType="numeric"
                                            onChangeText={onChange} value={value}
                                            error={errors.height_cm?.message as string}
                                            containerStyle={{ flex: 1 }} />
                                    )} />
                            </View>

                            <Controller control={control} name="age"
                                rules={{ required: 'Requerido' }}
                                render={({ field: { onChange, value } }) => (
                                    <Input label="Edad" placeholder="25" keyboardType="numeric"
                                        onChangeText={onChange} value={value}
                                        error={errors.age?.message as string} />
                                )} />

                            <Text style={s.sectionLabel}>Género</Text>
                            <View style={s.chipRow}>
                                {[
                                    { id: 'male', label: '♂ Hombre' },
                                    { id: 'female', label: '♀ Mujer' },
                                    { id: 'prefer_not_to_say', label: '— Prefiero no decirlo' },
                                ].map((g) => (
                                    <TouchableOpacity key={g.id} onPress={() => setGender(g.id)}
                                        style={[s.chip, gender === g.id && { borderColor: primary, backgroundColor: primary + '22' }]}>
                                        <Text style={[s.chipText, gender === g.id && { color: primary }]}>{g.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={s.sectionLabel}>Nivel de actividad actual</Text>
                            {ActivityLevels.map((lvl) => (
                                <TouchableOpacity key={lvl.id} onPress={() => setActivityLevel(lvl.id)}
                                    style={[s.levelRow, activityLevel === lvl.id && { borderColor: primary }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.levelTitle, activityLevel === lvl.id && { color: primary }]}>{lvl.label}</Text>
                                        <Text style={s.levelDesc}>{lvl.description}</Text>
                                    </View>
                                    {activityLevel === lvl.id && <Ionicons name="checkmark-circle" size={22} color={primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        STEP 3 ATLETA — Objetivos
                    ══════════════════════════════════════════════════════ */}
                    {step === 3 && !isTrainer && (
                        <View>
                            <Text style={s.stepHint}>¿Para qué te estás apuntando? Selecciona todos los que apliquen.</Text>
                            <View style={s.goalsGrid}>
                                {Goals.map((g) => {
                                    const active = goals.includes(g.id);
                                    return (
                                        <TouchableOpacity key={g.id} onPress={() => toggleGoal(g.id)}
                                            style={[s.goalCard, active && { borderColor: primary, backgroundColor: primary + '15' }]}>
                                            <Text style={s.goalEmoji}>{g.emoji}</Text>
                                            <Text style={[s.goalLabel, active && { color: primary }]}>{g.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        STEP 4 ATLETA — Preferencias de entrenamiento
                    ══════════════════════════════════════════════════════ */}
                    {step === 4 && !isTrainer && (
                        <View>
                            <Text style={s.stepHint}>Últimos detalles para ajustar tu plan perfectamente.</Text>

                            <Text style={s.sectionLabel}>Tipos de entrenamiento que te gustan</Text>
                            <View style={s.chipRow}>
                                {WorkoutTypes.map((t) => {
                                    const active = preferredTypes.includes(t.id);
                                    return (
                                        <TouchableOpacity key={t.id} onPress={() => toggleType(t.id)}
                                            style={[s.chip, active && { borderColor: t.color, backgroundColor: t.color + '22' }]}>
                                            <Text style={[s.chipText, active && { color: t.color }]}>{t.emoji} {t.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={s.sectionLabel}>
                                Días disponibles por semana: <Text style={{ color: primary }}>{availableDays}</Text>
                            </Text>
                            <View style={s.daysRow}>
                                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                    <TouchableOpacity key={d} onPress={() => setAvailableDays(d)}
                                        style={[s.dayDot, availableDays === d && { backgroundColor: primary, borderColor: primary }]}>
                                        <Text style={[s.dayText, availableDays === d && { color: '#fff' }]}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={s.sectionLabel}>Duración por sesión</Text>
                            <View style={s.chipRow}>
                                {SessionDurations.map((d) => (
                                    <TouchableOpacity key={d.value} onPress={() => setSessionDuration(d.value)}
                                        style={[s.chip, sessionDuration === d.value && { borderColor: primary, backgroundColor: primary + '22' }]}>
                                        <Text style={[s.chipText, sessionDuration === d.value && { color: primary }]}>{d.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── Buttons ────────────────────────────────────────── */}
                    {isLastStep
                        ? <Button
                            title="Crear cuenta 🚀"
                            onPress={handleSubmit(handleRegister)}
                            loading={isLoading}
                            fullWidth
                            style={{ marginTop: Spacing.lg }}
                          />
                        : <Button
                            title="Siguiente →"
                            onPress={goNext}
                            fullWidth
                            style={{ marginTop: Spacing.lg }}
                          />
                    }

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.loginRow}>
                        <Text style={s.loginText}>
                            ¿Ya tienes cuenta?{' '}
                            <Text style={[s.loginText, { color: primary, fontWeight: '700' }]}>Inicia sesión</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { flexGrow: 1, padding: Spacing['2xl'], paddingTop: 60 },
    back: { marginBottom: Spacing.base },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
    subheading: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
    stepHint: { color: Colors.textSecondary, fontSize: FontSizes.base, marginBottom: Spacing.lg, lineHeight: 22 },
    // Avatar
    avatarWrap: { alignItems: 'center', marginBottom: Spacing.xl },
    avatar: { width: 90, height: 90, borderRadius: 45 },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    avatarHint: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: Spacing.sm },
    // Section
    sectionLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '700', marginBottom: Spacing.md, marginTop: Spacing.lg, textTransform: 'uppercase', letterSpacing: 0.8 },
    // Role cards
    roleRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
    roleCard: { flex: 1, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden' },
    roleCardGrad: { padding: Spacing.base, alignItems: 'center', minHeight: 160, justifyContent: 'center', position: 'relative' },
    roleTitle: { color: Colors.textPrimary, fontWeight: '800', fontSize: FontSizes.base, marginBottom: 6, textAlign: 'center' },
    roleDesc: { color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'center', lineHeight: 16 },
    selectedBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    // Chips
    row: { flexDirection: 'row' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    chip: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
    chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
    // Activity level
    levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    levelTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSizes.base },
    levelDesc: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: 2 },
    // Goals
    goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    goalCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 1.5, borderColor: Colors.border },
    goalEmoji: { fontSize: 28, marginBottom: 6 },
    goalLabel: { color: Colors.textPrimary, fontSize: FontSizes.sm, fontWeight: '600' },
    // Days
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
    dayDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    dayText: { color: Colors.textSecondary, fontWeight: '700', fontSize: FontSizes.sm },
    // Footer
    loginRow: { marginTop: Spacing.xl, alignItems: 'center' },
    loginText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
});
