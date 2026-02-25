import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { routineApi, exerciseApi, sessionApi } from '../../services/api';
import { Routine, Exercise } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius, CategoryColors, DifficultyColors } from '../../utils/constants';
import { Button } from '../../components/ui/Button';

export const RoutineDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { routineId } = route.params;
    const [routine, setRoutine] = useState<Routine | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [rRes, eRes] = await Promise.all([
                routineApi.getById(routineId),
                exerciseApi.getByRoutine(routineId),
            ]);
            setRoutine(rRes.data);
            setExercises(eRes.data);
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

    const grad = CategoryColors[routine.category] ?? Colors.gradientPrimary;

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView>
                {/* Hero */}
                <LinearGradient colors={grad as [string, string]} style={s.hero}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.category}>{routine.category.toUpperCase()}</Text>
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

                {/* Description */}
                <View style={s.body}>
                    <Text style={s.desc}>{routine.description}</Text>

                    {/* Exercises list */}
                    <Text style={s.sectionTitle}>Ejercicios ({exercises.length})</Text>
                    {exercises.sort((a, b) => a.order_index - b.order_index).map((ex, i) => (
                        <TouchableOpacity key={ex.id} style={s.exerciseRow} onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}>
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
                        </TouchableOpacity>
                    ))}

                    <Button title="Iniciar entrenamiento 🚀" onPress={handleStart} fullWidth style={{ marginTop: Spacing.xl }} />
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    hero: { paddingTop: 56, paddingBottom: Spacing['2xl'], paddingHorizontal: Spacing.base },
    back: { marginBottom: Spacing.base },
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
