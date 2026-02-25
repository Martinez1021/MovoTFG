import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, FontSizes, BorderRadius, Goals, ActivityLevels, WorkoutTypes, SessionDurations } from '../../utils/constants';
import { RegisterData, UserRole, ActivityLevel, RoutineCategory, SessionDuration } from '../../types';

// ─── Step indicators ──────────────────────────────────────────────────────────
const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <View style={si.row}>
        {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[si.dot, i < current ? si.done : i === current - 1 ? si.active : si.pending]} />
        ))}
    </View>
);
const si = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing['2xl'] },
    dot: { height: 4, borderRadius: 2 },
    done: { width: 24, backgroundColor: Colors.primary },
    active: { width: 32, backgroundColor: Colors.primary },
    pending: { width: 24, backgroundColor: Colors.border },
});

// ─── Main Register Screen ─────────────────────────────────────────────────────
export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { register: registerUser, isLoading } = useAuthStore();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<RegisterData>>({
        role: 'user',
        goals: [],
        preferred_types: [],
        available_days: 3,
        session_duration: 45,
    });
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [showPass, setShowPass] = useState(false);

    const { control, handleSubmit, getValues, formState: { errors } } = useForm<any>({ defaultValues: formData });

    const pickAvatar = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!res.canceled) setAvatarUri(res.assets[0].uri);
    };

    const nextStep = (data: any) => {
        setFormData((prev) => ({ ...prev, ...data }));
        setStep((s) => s + 1);
    };

    const toggleGoal = (id: string) => {
        setFormData((prev) => {
            const goals = prev.goals ?? [];
            return {
                ...prev,
                goals: goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id],
            };
        });
    };

    const toggleType = (id: string) => {
        setFormData((prev) => {
            const types = (prev.preferred_types ?? []) as string[];
            return {
                ...prev,
                preferred_types: types.includes(id)
                    ? (types.filter((t) => t !== id) as RoutineCategory[])
                    : ([...types, id] as RoutineCategory[]),
            };
        });
    };

    const handleRegister = async () => {
        try {
            await registerUser(formData as RegisterData);
            // If we get here without navigating, registration succeeded
            // but email confirmation may be required
            Alert.alert(
                '¡Revisa tu email! 📧',
                'Te hemos enviado un enlace de confirmación. Haz clic en él y luego inicia sesión.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (e: any) {
            // Only show error if it's NOT a network error (backend offline is OK)
            if (!e.message?.includes('Network') && !e.message?.includes('localhost')) {
                Alert.alert('Error al registrarse', e.message);
            }
            // If Supabase succeeded (user navigates or email sent), do nothing
        }
    };

    // ── Step 1: Datos básicos ───────────────────────────────────────────────────
    const Step1 = () => (
        <>
            <TouchableOpacity onPress={pickAvatar} style={s.avatarWrap}>
                {avatarUri
                    ? <Image source={{ uri: avatarUri }} style={s.avatar} />
                    : <LinearGradient colors={Colors.gradientPrimary} style={s.avatarPlaceholder}>
                        <Ionicons name="camera-outline" size={28} color="#fff" />
                    </LinearGradient>
                }
                <Text style={s.avatarHint}>Foto de perfil (opcional)</Text>
            </TouchableOpacity>

            <Controller control={control} name="full_name" rules={{ required: 'Nombre obligatorio' }}
                render={({ field: { onChange, value } }) => (
                    <Input label="Nombre completo" placeholder="Tu nombre" onChangeText={onChange} value={value}
                        error={errors.full_name?.message as string}
                        leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textSecondary} />} />
                )} />
            <Controller control={control} name="email" rules={{ required: 'Email obligatorio', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email no válido' } }}
                render={({ field: { onChange, value } }) => (
                    <Input label="Email" placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none"
                        onChangeText={onChange} value={value} error={errors.email?.message as string}
                        leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />} />
                )} />
            <Controller control={control} name="password" rules={{ required: 'Contraseña obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
                render={({ field: { onChange, value } }) => (
                    <Input label="Contraseña" placeholder="••••••••" secureTextEntry={!showPass}
                        onChangeText={onChange} value={value} error={errors.password?.message as string}
                        leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />}
                        rightIcon={<TouchableOpacity onPress={() => setShowPass(!showPass)}>
                            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>} />
                )} />

            <Text style={s.roleLabel}>¿Quién eres?</Text>
            <View style={s.roleRow}>
                {(['user', 'trainer'] as UserRole[]).map((r) => (
                    <TouchableOpacity key={r} onPress={() => setFormData((p) => ({ ...p, role: r }))}
                        style={[s.roleChip, formData.role === r && s.roleChipActive]}>
                        <Text style={s.roleEmoji}>{r === 'user' ? '🏃' : '🏋️'}</Text>
                        <Text style={[s.roleText, formData.role === r && s.roleTextActive]}>
                            {r === 'user' ? 'Soy Usuario' : 'Soy Entrenador'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </>
    );

    // ── Step 2: Datos físicos ───────────────────────────────────────────────────
    const Step2 = () => (
        <>
            <View style={s.row}>
                <Controller control={control} name="weight_kg" rules={{ required: 'Requerido' }}
                    render={({ field: { onChange, value } }) => (
                        <Input label="Peso (kg)" placeholder="70" keyboardType="numeric" onChangeText={onChange}
                            value={value?.toString()} error={errors.weight_kg?.message as string} containerStyle={{ flex: 1, marginRight: 8 }} />
                    )} />
                <Controller control={control} name="height_cm" rules={{ required: 'Requerido' }}
                    render={({ field: { onChange, value } }) => (
                        <Input label="Altura (cm)" placeholder="175" keyboardType="numeric" onChangeText={onChange}
                            value={value?.toString()} error={errors.height_cm?.message as string} containerStyle={{ flex: 1 }} />
                    )} />
            </View>
            <Controller control={control} name="age" rules={{ required: 'Requerido' }}
                render={({ field: { onChange, value } }) => (
                    <Input label="Edad" placeholder="25" keyboardType="numeric" onChangeText={onChange}
                        value={value?.toString()} error={errors.age?.message as string} />
                )} />

            <Text style={s.sectionLabel}>Género</Text>
            <View style={s.chipRow}>
                {[{ id: 'male', label: '♂ Hombre' }, { id: 'female', label: '♀ Mujer' }, { id: 'prefer_not_to_say', label: '— Prefiero no decirlo' }].map((g) => (
                    <TouchableOpacity key={g.id} onPress={() => setFormData((p) => ({ ...p, gender: g.id as any }))}
                        style={[s.chip, formData.gender === g.id && s.chipActive]}>
                        <Text style={[s.chipText, formData.gender === g.id && s.chipTextActive]}>{g.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={s.sectionLabel}>Nivel de actividad</Text>
            {ActivityLevels.map((lvl) => (
                <TouchableOpacity key={lvl.id} onPress={() => setFormData((p) => ({ ...p, activity_level: lvl.id as ActivityLevel }))}
                    style={[s.levelRow, formData.activity_level === lvl.id && s.levelRowActive]}>
                    <View>
                        <Text style={[s.levelTitle, formData.activity_level === lvl.id && { color: Colors.primary }]}>{lvl.label}</Text>
                        <Text style={s.levelDesc}>{lvl.description}</Text>
                    </View>
                    {formData.activity_level === lvl.id && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                </TouchableOpacity>
            ))}
        </>
    );

    // ── Step 3: Objetivos ───────────────────────────────────────────────────────
    const Step3 = () => (
        <>
            <Text style={s.stepHint}>Selecciona todos los que apliquen</Text>
            <View style={s.goalsGrid}>
                {Goals.map((g) => {
                    const active = (formData.goals ?? []).includes(g.id);
                    return (
                        <TouchableOpacity key={g.id} onPress={() => toggleGoal(g.id)}
                            style={[s.goalCard, active && s.goalCardActive]}>
                            <Text style={s.goalEmoji}>{g.emoji}</Text>
                            <Text style={[s.goalLabel, active && { color: Colors.primary }]}>{g.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </>
    );

    // ── Step 4: Preferencias ────────────────────────────────────────────────────
    const Step4 = () => (
        <>
            <Text style={s.sectionLabel}>Tipos de entrenamiento</Text>
            <View style={s.chipRow}>
                {WorkoutTypes.map((t) => {
                    const active = (formData.preferred_types ?? []).includes(t.id as RoutineCategory);
                    return (
                        <TouchableOpacity key={t.id} onPress={() => toggleType(t.id)}
                            style={[s.chip, active && { ...s.chipActive, borderColor: t.color, backgroundColor: t.color + '22' }]}>
                            <Text style={[s.chipText, active && { color: t.color }]}>{t.emoji} {t.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={s.sectionLabel}>Días disponibles por semana: {formData.available_days}</Text>
            <View style={s.daysRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <TouchableOpacity key={d} onPress={() => setFormData((p) => ({ ...p, available_days: d }))}
                        style={[s.dayDot, formData.available_days === d && s.dayDotActive]}>
                        <Text style={[s.dayText, formData.available_days === d && { color: '#fff' }]}>{d}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={s.sectionLabel}>Duración por sesión</Text>
            <View style={s.chipRow}>
                {SessionDurations.map((d) => (
                    <TouchableOpacity key={d.value} onPress={() => setFormData((p) => ({ ...p, session_duration: d.value as SessionDuration }))}
                        style={[s.chip, formData.session_duration === d.value && s.chipActive]}>
                        <Text style={[s.chipText, formData.session_duration === d.value && s.chipTextActive]}>{d.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Controller control={control} name="trainer_code"
                render={({ field: { onChange, value } }) => (
                    <Input label="Código de entrenador (opcional)" placeholder="TRAINER-XXXX" autoCapitalize="characters"
                        onChangeText={onChange} value={value}
                        leftIcon={<Ionicons name="qr-code-outline" size={18} color={Colors.textSecondary} />} />
                )} />
        </>
    );

    const steps = [Step1, Step2, Step3, Step4];
    const StepComponent = steps[step - 1];
    const isLastStep = step === 4;
    const showStep2 = formData.role === 'user';

    return (
        <LinearGradient colors={['#0A0A0A', '#0F0A1E']} style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity onPress={() => step > 1 ? setStep((s) => s - 1) : navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>

                    <Text style={s.heading}>Paso {step} de 4</Text>
                    <StepIndicator current={step} total={4} />

                    <StepComponent />

                    {isLastStep
                        ? <Button title="Crear cuenta 🚀" onPress={handleRegister} loading={isLoading} fullWidth style={{ marginTop: Spacing.lg }} />
                        : <Button title="Siguiente →" onPress={handleSubmit(nextStep)} fullWidth style={{ marginTop: Spacing.lg }} />
                    }

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.loginRow}>
                        <Text style={s.loginText}>¿Ya tienes cuenta? <Text style={s.loginLink}>Inicia sesión</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { flexGrow: 1, padding: Spacing['2xl'], paddingTop: 60 },
    back: { marginBottom: Spacing.base },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
    avatarWrap: { alignItems: 'center', marginBottom: Spacing.xl },
    avatar: { width: 90, height: 90, borderRadius: 45 },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    avatarHint: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: Spacing.sm },
    roleLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600', marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
    roleRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base },
    roleChip: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
    roleChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
    roleEmoji: { fontSize: 28, marginBottom: 6 },
    roleText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSizes.sm, textAlign: 'center' },
    roleTextActive: { color: Colors.primary },
    row: { flexDirection: 'row' },
    sectionLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.8 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    chip: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
    chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
    chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
    chipTextActive: { color: Colors.primary },
    levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    levelRowActive: { borderColor: Colors.primary },
    levelTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSizes.base },
    levelDesc: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: 2 },
    stepHint: { color: Colors.textSecondary, fontSize: FontSizes.base, marginBottom: Spacing.lg },
    goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    goalCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 1.5, borderColor: Colors.border },
    goalCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
    goalEmoji: { fontSize: 28, marginBottom: 6 },
    goalLabel: { color: Colors.textPrimary, fontSize: FontSizes.sm, fontWeight: '600' },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.base },
    dayDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    dayDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    dayText: { color: Colors.textSecondary, fontWeight: '700' },
    loginRow: { marginTop: Spacing.lg, alignItems: 'center' },
    loginText: { color: Colors.textSecondary, fontSize: FontSizes.base },
    loginLink: { color: Colors.primary, fontWeight: '700' },
});
