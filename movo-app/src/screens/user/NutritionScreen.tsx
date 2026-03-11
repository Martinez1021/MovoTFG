import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, KeyboardAvoidingView,
    Platform, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../services/supabase';
import { Colors, Spacing, FontSizes, BorderRadius, Goals } from '../../utils/constants';

// ── Groq config — clave leída de variable de entorno (nunca hardcodeada) ──
const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY ?? '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── Types ───────────────────────────────────────────────
interface FoodItem {
    nombre: string;
    cantidad: string;
    proteina_g?: number;
    carbos_g?: number;
    grasa_g?: number;
    kcal?: number;
}
interface Meal {
    nombre: string;
    hora: string;
    emoji: string;
    alimentos: FoodItem[];
    kcal?: number;
}
interface DietPlan {
    kcal_total: number;
    proteina_g: number;
    carbos_g: number;
    grasa_g: number;
    descripcion: string;
    comidas: Meal[];
}

// ── AI call ─────────────────────────────────────────────
async function generateDietPlan(
    weight: number,
    height: number,
    age: number,
    gender: string,
    goals: string[],
    activity: string,
): Promise<DietPlan> {
    const goalLabels = goals.map((g) => {
        const found = Goals.find((x) => x.id === g);
        return found ? found.label : g;
    }).join(', ');

    const prompt = `Eres un nutricionista deportivo experto. Crea un plan de dieta diario COMPLETO y EQUILIBRADO para esta persona:
- Peso: ${weight} kg
- Altura: ${height} cm
- Edad: ${age} años
- Género: ${gender === 'male' ? 'hombre' : gender === 'female' ? 'mujer' : 'persona'}
- Nivel actividad: ${activity}
- Objetivos: ${goalLabels}

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin texto antes ni después):
{
  "kcal_total": número,
  "proteina_g": número,
  "carbos_g": número,
  "grasa_g": número,
  "descripcion": "Una frase corta describiendo el plan",
  "comidas": [
    {
      "nombre": "Desayuno",
      "hora": "8:00",
      "emoji": "🌅",
      "kcal": número,
      "alimentos": [
        { "nombre": "nombre alimento", "cantidad": "Xg o Xml", "proteina_g": número, "carbos_g": número, "grasa_g": número, "kcal": número }
      ]
    }
  ]
}
Incluye 4-5 comidas: Desayuno, Almuerzo, Merienda, Cena (y Pre-entreno si aplica).
Usa alimentos reales, comunes en España. Cantidades precisas. Macros reales.`;

    const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.6,
        }),
    });

    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No se pudo parsear la respuesta');
    return JSON.parse(jsonMatch[0]) as DietPlan;
}

// ── Goal picker used in setup ────────────────────────────
const GOAL_LIST = Goals.slice(0, 6);

// ── Setup wizard ─────────────────────────────────────────
const SetupWizard: React.FC<{
    primary: string;
    onComplete: () => void;
}> = ({ primary, onComplete }) => {
    const { user, profile, setProfile } = useAuthStore();
    const [step, setStep] = useState(0);
    const [weight, setWeight] = useState(String(profile?.weight_kg ?? ''));
    const [height, setHeight] = useState(String(profile?.height_cm ?? ''));
    const [age, setAge] = useState(String(profile?.age ?? ''));
    const [selectedGoals, setSelectedGoals] = useState<string[]>(profile?.goals ?? []);
    const [saving, setSaving] = useState(false);

    const toggleGoal = (id: string) =>
        setSelectedGoals((p) => p.includes(id) ? p.filter((g) => g !== id) : [...p, id]);

    const save = async () => {
        if (!weight || !height || !age || selectedGoals.length === 0) {
            Alert.alert('Faltan datos', 'Completa todos los campos antes de continuar.');
            return;
        }
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            if (!uid) throw new Error('No hay sesión');

            const updates = {
                user_id: uid,
                weight_kg: parseFloat(weight),
                height_cm: parseInt(height),
                age: parseInt(age),
                goals: selectedGoals,
            };
            const { error } = await supabase.from('user_profiles').upsert(updates, { onConflict: 'user_id' });
            if (error) throw error;
            if (setProfile) setProfile({ ...(profile as any), ...updates });
            onComplete();
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    const steps = [
        // Step 0: physical data
        <View key="physical">
            <Text style={sw.title}>🍽️ Tu plan personalizado</Text>
            <Text style={sw.sub}>Necesitamos conocerte para crear una dieta adaptada a ti</Text>

            <View style={sw.fieldGroup}>
                <Text style={[sw.fieldLabel, { color: primary }]}>Peso actual (kg)</Text>
                <View style={[sw.inputWrap, { borderColor: primary + '55' }]}>
                    <Ionicons name="scale-outline" size={20} color={primary} />
                    <TextInput
                        style={sw.input}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="decimal-pad"
                        placeholder="Ej: 75"
                        placeholderTextColor={Colors.textSecondary}
                        maxLength={6}
                    />
                    <Text style={sw.unit}>kg</Text>
                </View>
            </View>

            <View style={sw.fieldGroup}>
                <Text style={[sw.fieldLabel, { color: primary }]}>Altura (cm)</Text>
                <View style={[sw.inputWrap, { borderColor: primary + '55' }]}>
                    <Ionicons name="body-outline" size={20} color={primary} />
                    <TextInput
                        style={sw.input}
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="number-pad"
                        placeholder="Ej: 175"
                        placeholderTextColor={Colors.textSecondary}
                        maxLength={4}
                    />
                    <Text style={sw.unit}>cm</Text>
                </View>
            </View>

            <View style={sw.fieldGroup}>
                <Text style={[sw.fieldLabel, { color: primary }]}>Edad</Text>
                <View style={[sw.inputWrap, { borderColor: primary + '55' }]}>
                    <Ionicons name="calendar-outline" size={20} color={primary} />
                    <TextInput
                        style={sw.input}
                        value={age}
                        onChangeText={setAge}
                        keyboardType="number-pad"
                        placeholder="Ej: 25"
                        placeholderTextColor={Colors.textSecondary}
                        maxLength={3}
                    />
                    <Text style={sw.unit}>años</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => {
                    if (!weight || !height || !age) { Alert.alert('Faltan datos', 'Rellena peso, altura y edad'); return; }
                    setStep(1);
                }}
                style={[sw.nextBtn, { backgroundColor: primary }]}
            >
                <Text style={sw.nextBtnText}>Siguiente →</Text>
            </TouchableOpacity>
        </View>,

        // Step 1: goals
        <View key="goals">
            <TouchableOpacity onPress={() => setStep(0)} style={{ marginBottom: Spacing.md }}>
                <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={sw.title}>🎯 Tus objetivos</Text>
            <Text style={sw.sub}>Selecciona uno o varios que se ajusten a lo que buscas</Text>

            <View style={sw.goalsGrid}>
                {GOAL_LIST.map((g) => {
                    const sel = selectedGoals.includes(g.id);
                    return (
                        <TouchableOpacity
                            key={g.id}
                            onPress={() => toggleGoal(g.id)}
                            style={[sw.goalChip, { borderColor: sel ? primary : Colors.border, backgroundColor: sel ? primary + '22' : Colors.surface }]}
                        >
                            <Text style={sw.goalEmoji}>{g.emoji}</Text>
                            <Text style={[sw.goalLabel, { color: sel ? primary : Colors.textSecondary }]}>{g.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
                onPress={save}
                disabled={saving || selectedGoals.length === 0}
                style={[sw.nextBtn, { backgroundColor: selectedGoals.length > 0 ? primary : Colors.border }]}
            >
                {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={sw.nextBtnText}>Crear mi plan 🍽️</Text>
                }
            </TouchableOpacity>
        </View>,
    ];

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={sw.container} keyboardShouldPersistTaps="handled">
                <View style={sw.card}>
                    {/* Progress dots */}
                    <View style={sw.dots}>
                        {[0, 1].map((i) => (
                            <View key={i} style={[sw.dot, { backgroundColor: step === i ? primary : Colors.border, width: step === i ? 20 : 8 }]} />
                        ))}
                    </View>
                    {steps[step]}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const sw = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.base, paddingTop: 80 },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'], padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.xl },
    dot: { height: 8, borderRadius: 4 },
    title: { fontSize: FontSizes['2xl'], fontWeight: '900', color: Colors.textPrimary, marginBottom: Spacing.sm },
    sub: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.xl },
    fieldGroup: { marginBottom: Spacing.md },
    fieldLabel: { fontSize: FontSizes.sm, fontWeight: '700', marginBottom: 6 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.background, borderRadius: BorderRadius.md, borderWidth: 1.5, paddingHorizontal: Spacing.md, paddingVertical: 12 },
    input: { flex: 1, color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: '600' },
    unit: { color: Colors.textSecondary, fontSize: FontSizes.sm },
    nextBtn: { borderRadius: BorderRadius.full, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.lg },
    nextBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSizes.base },
    goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    goalChip: { borderWidth: 1.5, borderRadius: BorderRadius.lg, padding: Spacing.md, width: '47%', alignItems: 'center', gap: 6 },
    goalEmoji: { fontSize: 26 },
    goalLabel: { fontSize: FontSizes.xs, fontWeight: '600', textAlign: 'center' },
});

// ── Macro badge ──────────────────────────────────────────
const MacroBadge: React.FC<{ label: string; value: string; color: string; emoji: string }> = ({ label, value, color, emoji }) => (
    <View style={[mb.wrap, { borderColor: color + '44', backgroundColor: color + '15' }]}>
        <Text style={mb.emoji}>{emoji}</Text>
        <Text style={[mb.value, { color }]}>{value}</Text>
        <Text style={mb.label}>{label}</Text>
    </View>
);
const mb = StyleSheet.create({
    wrap: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 2 },
    emoji: { fontSize: 18 },
    value: { fontSize: FontSizes.base, fontWeight: '800' },
    label: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
});

// ── Meal card ───────────────────────────────────────────
const MealCard: React.FC<{ meal: Meal; primary: string; index: number }> = ({ meal, primary, index }) => {
    const [expanded, setExpanded] = useState(index === 0);
    return (
        <View style={mc.card}>
            <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={mc.header} activeOpacity={0.8}>
                <View style={[mc.emojiWrap, { backgroundColor: primary + '22' }]}>
                    <Text style={mc.emoji}>{meal.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={mc.name}>{meal.nombre}</Text>
                    <Text style={mc.hora}>{meal.hora} · {meal.kcal} kcal</Text>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {expanded && (
                <View style={mc.body}>
                    {meal.alimentos.map((a, i) => (
                        <View key={i} style={[mc.foodRow, i < meal.alimentos.length - 1 && mc.foodRowBorder]}>
                            <View style={{ flex: 1 }}>
                                <Text style={mc.foodName}>{a.nombre}</Text>
                                {(a.proteina_g || a.carbos_g || a.grasa_g) && (
                                    <Text style={mc.foodMacros}>
                                        {a.proteina_g ? `P: ${a.proteina_g}g  ` : ''}
                                        {a.carbos_g ? `C: ${a.carbos_g}g  ` : ''}
                                        {a.grasa_g ? `G: ${a.grasa_g}g` : ''}
                                    </Text>
                                )}
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                <Text style={[mc.amount, { color: primary }]}>{a.cantidad}</Text>
                                {a.kcal !== undefined && (
                                    <Text style={mc.kcal}>{a.kcal} kcal</Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};
const mc = StyleSheet.create({
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
    emojiWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 22 },
    name: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.textPrimary },
    hora: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    body: { borderTopWidth: 1, borderTopColor: Colors.border },
    foodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: 12 },
    foodRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    foodName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textPrimary },
    foodMacros: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
    amount: { fontSize: FontSizes.sm, fontWeight: '700' },
    kcal: { fontSize: 10, color: Colors.textSecondary },
});

// ── Main screen ─────────────────────────────────────────
export const NutritionScreen: React.FC = () => {
    const { user, profile } = useAuthStore();
    const { primary } = useThemeStore();
    const [plan, setPlan] = useState<DietPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const planKey = user?.id ? `movo_diet_plan_${user.id}` : null;

    const profileComplete =
        !!(profile?.weight_kg && profile?.height_cm && profile?.age && profile?.goals?.length);

    const generate = useCallback(async (force = false) => {
        if (!profileComplete || !profile) return;
        // If we already have a plan in state and not forced, skip
        if (plan && !force) return;
        setLoading(true);
        try {
            const result = await generateDietPlan(
                profile.weight_kg!,
                profile.height_cm!,
                profile.age!,
                profile.gender ?? 'prefer_not_to_say',
                profile.goals ?? [],
                profile.activity_level ?? 'beginner',
            );
            setPlan(result);
            // Persist
            if (planKey) await AsyncStorage.setItem(planKey, JSON.stringify(result));
        } catch (e: any) {
            Alert.alert('Error al generar', e?.message ?? 'Inténtalo de nuevo');
        } finally {
            setLoading(false);
        }
    }, [profile, profileComplete, planKey, plan]);

    // On mount: try to load persisted plan, only generate if none exists
    useEffect(() => {
        if (!profileComplete) return;
        if (plan) return; // already have plan in memory
        (async () => {
            if (planKey) {
                try {
                    const saved = await AsyncStorage.getItem(planKey);
                    if (saved) { setPlan(JSON.parse(saved)); return; }
                } catch { /* ignore */ }
            }
            // No saved plan → generate for the first time
            generate();
        })();
    }, [profileComplete, planKey, plan, generate]);

    const onRefresh = async () => {
        setRefreshing(true);
        await generate(true); // force regenerate
        setRefreshing(false);
    };

    // ── Profile not complete → show wizard
    if (!profileComplete) {
        return (
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
                <SetupWizard primary={primary} onComplete={() => generate(true)} />
            </LinearGradient>
        );
    }

    // ── Loading spinner
    if (loading && !plan) {
        return (
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={s.center}>
                <LinearGradient colors={[primary + '33', primary + '11']} style={s.loadCard}>
                    <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>🥗</Text>
                    <Text style={[s.loadTitle, { color: primary }]}>Creando tu dieta</Text>
                    <Text style={s.loadSub}>La IA está calculando tu plan personalizado</Text>
                    <ActivityIndicator color={primary} size="large" style={{ marginTop: Spacing.lg }} />
                </LinearGradient>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.heading}>🍽️ Nutrición</Text>
                        <Text style={s.sub}>Plan personalizado para ti</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => generate(true)}
                        disabled={loading}
                        style={[s.regenBtn, { borderColor: primary + '55', backgroundColor: primary + '15' }]}
                    >
                        {loading
                            ? <ActivityIndicator size="small" color={primary} />
                            : <><Ionicons name="refresh-outline" size={16} color={primary} /><Text style={[s.regenText, { color: primary }]}>Regenerar</Text></>
                        }
                    </TouchableOpacity>
                </View>

                {plan ? (
                    <>
                        {/* Summary card */}
                        <LinearGradient colors={[primary + '33', primary + '11']} style={s.summaryCard}>
                            <View style={s.summaryTop}>
                                <View>
                                    <Text style={[s.kcalNum, { color: primary }]}>{plan.kcal_total}</Text>
                                    <Text style={s.kcalLabel}>kcal / día</Text>
                                </View>
                                <View style={[s.badge, { backgroundColor: primary + '22', borderColor: primary + '44' }]}>
                                    <Ionicons name="sparkles-outline" size={13} color={primary} />
                                    <Text style={[s.badgeText, { color: primary }]}>Generado por IA</Text>
                                </View>
                            </View>
                            <Text style={s.planDesc}>{plan.descripcion}</Text>
                            <View style={s.macroRow}>
                                <MacroBadge label="Proteína" value={`${plan.proteina_g}g`} color="#4CAF50" emoji="🥩" />
                                <MacroBadge label="Carbos" value={`${plan.carbos_g}g`} color="#2196F3" emoji="🍚" />
                                <MacroBadge label="Grasa" value={`${plan.grasa_g}g`} color="#FF9800" emoji="🥑" />
                            </View>

                            {/* User info pill */}
                            <View style={s.profilePill}>
                                <Ionicons name="person-outline" size={12} color={Colors.textSecondary} />
                                <Text style={s.profilePillText}>
                                    {profile?.weight_kg}kg · {profile?.height_cm}cm · {profile?.age}a
                                </Text>
                            </View>
                        </LinearGradient>

                        {/* Meals */}
                        <View style={{ paddingHorizontal: Spacing.base }}>
                            <Text style={s.sectionTitle}>📋 Plan del día</Text>
                            {plan.comidas.map((meal, i) => (
                                <MealCard key={i} meal={meal} primary={primary} index={i} />
                            ))}
                        </View>

                        {/* Tips */}
                        <View style={[s.tipsCard, { borderColor: primary + '33' }]}>
                            <View style={s.tipsHeader}>
                                <Ionicons name="bulb-outline" size={18} color={primary} />
                                <Text style={[s.tipTitle, { color: primary }]}>Consejos</Text>
                            </View>
                            {[
                                '💧 Bebe al menos 2.5L de agua al día',
                                '⏰ Intenta comer cada 3-4 horas',
                                '🍽️ Pesa los alimentos para mayor precisión',
                                '🔄 Puedes intercambiar alimentos del mismo grupo',
                            ].map((tip) => (
                                <Text key={tip} style={s.tipText}>{tip}</Text>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => generate(true)}
                            disabled={loading}
                            style={[s.regenBig, { backgroundColor: primary }]}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <><Ionicons name="refresh-outline" size={18} color="#fff" /><Text style={s.regenBigText}>Generar nueva dieta</Text></>
                            }
                        </TouchableOpacity>
                    </>
                ) : null}
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadCard: { borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], alignItems: 'center', margin: Spacing.xl },
    loadTitle: { fontSize: FontSizes.xl, fontWeight: '900' },
    loadSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
    heading: { fontSize: FontSizes['2xl'], fontWeight: '900', color: Colors.textPrimary },
    sub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    regenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 8 },
    regenText: { fontSize: FontSizes.sm, fontWeight: '700' },
    summaryCard: { marginHorizontal: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
    summaryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.sm },
    kcalNum: { fontSize: 44, fontWeight: '900', lineHeight: 48 },
    kcalLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
    badgeText: { fontSize: FontSizes.xs, fontWeight: '700' },
    planDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
    macroRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    profilePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    profilePillText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
    tipsCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 1, marginBottom: Spacing.lg },
    tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    tipTitle: { fontSize: FontSizes.base, fontWeight: '800' },
    tipText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 24 },
    regenBig: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: Spacing.base, borderRadius: BorderRadius.full, paddingVertical: 16, marginBottom: Spacing.xl },
    regenBigText: { color: '#fff', fontWeight: '800', fontSize: FontSizes.base },
});
