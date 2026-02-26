import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { routineApi, exerciseApi } from '../../services/api';
import { Routine, Exercise } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius, CategoryColors, DifficultyColors } from '../../utils/constants';
import { Button } from '../../components/ui/Button';
import { CATALOGUE, LOCAL_EXERCISES } from '../../utils/catalogue';

export const RoutineDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { routineId } = route.params;
    const [routine, setRoutine] = useState<Routine | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            if (routineId.startsWith('local-')) {
                // Local catalogue routine — no API call needed
                const local = CATALOGUE.find((r) => r.id === routineId);
                if (local) {
                    setRoutine(local);
                    setExercises(LOCAL_EXERCISES[routineId] ?? []);
                } else {
                    Alert.alert('Error', 'Rutina no encontrada');
                }
            } else {
                const [rRes, eRes] = await Promise.all([
                    routineApi.getById(routineId),
                    exerciseApi.getByRoutine(routineId),
                ]);
                setRoutine(rRes.data);
                setExercises(eRes.data);
            }
        } catch (e) { Alert.alert('Error', 'No se pudo cargar la rutina'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [routineId]);

    const handleStart = async () => {
        try {
            navigation.navigate('ActiveWorkout', { routineId });
        } catch (e: any) { Alert.alert('Error', e.message); }
    };

    if (!routine) return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={s.centered}>
            <Text style={{ color: Colors.textSecondary }}>Cargando...</Text>
        </LinearGradient>
    );

    const CAT_LABELS: Record<string, string> = { gym: '🏋️ Gym', yoga: '🧘 Yoga', pilates: '🌀 Pilates' };
    const catGradients: Record<string, [string, string]> = {
        gym: ['#FF6B6B', '#FF8E53'],
        yoga: ['#43E97B', '#38F9D7'],
        pilates: ['#F7971E', '#FFD200'],
    };
    const grad = catGradients[routine.category] ?? (CategoryColors[routine.category] as [string, string]) ?? ['#6C63FF', '#9C6FFF'];
    const localRoutine = CATALOGUE.find((r) => r.id === routineId);
    const heroImage = localRoutine?.image_url ?? (routine as any).thumbnail_url;

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView>
                {/* Hero */}
                {heroImage ? (
                    <View style={s.heroImgWrap}>
                        <Image source={{ uri: heroImage }} style={s.heroImg} resizeMode="cover" />
                        <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={s.heroImgContent}>
                            <Text style={s.category}>{CAT_LABELS[routine.category]}</Text>
                            <Text style={s.title}>{routine.title}</Text>
                            <View style={s.metaRow}>
                                <View style={s.metaItem}>
                                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                                    <Text style={s.metaText}>{routine.duration_minutes} min</Text>
                                </View>
                                <View style={[s.diffBadge, { backgroundColor: DifficultyColors[routine.difficulty] }]}>
                                    <Text style={s.diffText}>{{ beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }[routine.difficulty]}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <LinearGradient colors={grad} style={s.hero}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={s.category}>{CAT_LABELS[routine.category]}</Text>
                        <Text style={s.title}>{routine.title}</Text>
                        <View style={s.metaRow}>
                            <View style={s.metaItem}>
                                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={s.metaText}>{routine.duration_minutes} min</Text>
                            </View>
                            <View style={[s.diffBadge, { backgroundColor: DifficultyColors[routine.difficulty] }]}>
                                <Text style={s.diffText}>{{ beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }[routine.difficulty]}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}

                {/* Description */}
                <View style={s.body}>
                    <Text style={s.desc}>{routine.description}</Text>

                    {/* Exercises list */}
                    <Text style={s.sectionTitle}>Ejercicios ({exercises.length})</Text>
                    {exercises.sort((a, b) => a.order_index - b.order_index).map((ex, i) => (
                        <View key={ex.id} style={s.exerciseRow}>
                            <View style={s.orderBadge}>
                                <Text style={s.orderText}>{i + 1}</Text>
                            </View>
                            <View style={s.exInfo}>
                                <Text style={s.exName}>{ex.name}</Text>
                                <Text style={s.exMeta}>
                                    {ex.muscle_group} · {ex.sets ? `${ex.sets} series × ${ex.reps} reps` : `${ex.duration_seconds}s`} · {ex.rest_seconds}s descanso
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                        </View>
                    ))}

                    <Button title="Iniciar entrenamiento 🚀" onPress={handleStart} fullWidth style={{ marginTop: Spacing.xl }} />
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    // gradient hero (no image)
    hero: { paddingTop: 56, paddingBottom: Spacing['2xl'], paddingHorizontal: Spacing.base },
    // image hero
    heroImgWrap: { width: '100%', height: 260, position: 'relative', justifyContent: 'flex-end' },
    heroImg: { ...StyleSheet.absoluteFillObject as any, width: '100%', height: 260 },
    heroImgContent: { padding: Spacing.base, paddingBottom: Spacing.xl },
    back: { position: 'absolute', top: 52, left: Spacing.base, zIndex: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    category: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
    title: { fontSize: FontSizes['3xl'], fontWeight: '900', color: '#fff', marginBottom: Spacing.md },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.sm },
    diffBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
    diffText: { color: '#fff', fontSize: FontSizes.xs, fontWeight: '700' },
    body: { padding: Spacing.base },
    desc: { color: Colors.textSecondary, fontSize: FontSizes.base, lineHeight: 22, marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
    exerciseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
    orderBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary },
    orderText: { color: Colors.primary, fontWeight: '800', fontSize: FontSizes.sm },
    exInfo: { flex: 1 },
    exName: { color: Colors.textPrimary, fontWeight: '600', fontSize: FontSizes.base },
    exMeta: { color: Colors.textSecondary, fontSize: FontSizes.xs, marginTop: 2 },
});
