import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { exerciseApi, sessionApi } from '../../services/api';
import { Exercise, WorkoutSession } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { Button } from '../../components/ui/Button';

export const ActiveWorkoutScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { routineId } = route.params;
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [restMode, setRestMode] = useState(false);
    const [restLeft, setRestLeft] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        (async () => {
            const [eRes, sRes] = await Promise.all([
                exerciseApi.getByRoutine(routineId),
                sessionApi.start(routineId),
            ]);
            setExercises(eRes.data.sort((a, b) => a.order_index - b.order_index));
            setSession(sRes.data);
        })();
        intervalRef.current = setInterval(() => setElapsedSeconds((e) => e + 1), 1000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const currentExercise = exercises[currentIdx];
    const progress = exercises.length > 0 ? (currentIdx / exercises.length) : 0;

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleNextSet = () => {
        if (!currentExercise) return;
        if (currentSet < (currentExercise.sets ?? 1)) {
            setCurrentSet((s) => s + 1);
            setRestMode(true);
            setRestLeft(currentExercise.rest_seconds);
            const restInterval = setInterval(() => {
                setRestLeft((r) => {
                    if (r <= 1) { clearInterval(restInterval); setRestMode(false); Vibration.vibrate(); return 0; }
                    return r - 1;
                });
            }, 1000);
        } else {
            setCurrentSet(1);
            if (currentIdx < exercises.length - 1) {
                setCurrentIdx((i) => i + 1);
            } else {
                handleFinish();
            }
        }
    };

    const handleFinish = async () => {
        clearInterval(intervalRef.current);
        if (session) {
            await sessionApi.complete(session.id, {
                duration_minutes: Math.round(elapsedSeconds / 60),
            });
        }
        Alert.alert('¡Entrenamiento completado! 🎉', `Tiempo total: ${formatTime(elapsedSeconds)}`, [
            { text: 'Genial', onPress: () => navigation.goBack() },
        ]);
    };

    if (!currentExercise) return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={s.centered}>
            <Text style={{ color: Colors.textSecondary }}>Cargando...</Text>
        </LinearGradient>
    );

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => Alert.alert('Abandonar', '¿Salir del entrenamiento?', [
                    { text: 'Continuar', style: 'cancel' },
                    { text: 'Salir', style: 'destructive', onPress: () => { clearInterval(intervalRef.current); navigation.goBack(); } },
                ])}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.timer}>{formatTime(elapsedSeconds)}</Text>
                <Text style={s.progress}>{currentIdx + 1}/{exercises.length}</Text>
            </View>

            {/* Progress bar */}
            <View style={s.progressBar}>
                <LinearGradient colors={Colors.gradientPrimary} style={[s.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            {restMode ? (
                <View style={s.restView}>
                    <Text style={s.restTitle}>Descansa 😮‍💨</Text>
                    <Text style={s.restTimer}>{restLeft}s</Text>
                    <Text style={s.restNext}>Siguiente: {currentExercise.name}</Text>
                    <Button title="Saltar descanso" variant="outline" onPress={() => setRestMode(false)} />
                </View>
            ) : (
                <View style={s.content}>
                    <Text style={s.exCategory}>{currentExercise.muscle_group}</Text>
                    <Text style={s.exName}>{currentExercise.name}</Text>
                    <Text style={s.exDesc}>{currentExercise.description}</Text>

                    <View style={s.setInfo}>
                        <View style={s.infoCard}>
                            <Text style={s.infoValue}>{currentSet}</Text>
                            <Text style={s.infoLabel}>Serie actual</Text>
                        </View>
                        <View style={[s.infoCard, { borderColor: Colors.primary }]}>
                            <Text style={[s.infoValue, { color: Colors.primary }]}>{currentExercise.sets ?? 1}</Text>
                            <Text style={s.infoLabel}>Total series</Text>
                        </View>
                        <View style={s.infoCard}>
                            <Text style={s.infoValue}>{currentExercise.reps ?? `${currentExercise.duration_seconds}s`}</Text>
                            <Text style={s.infoLabel}>{currentExercise.reps ? 'Reps' : 'Duración'}</Text>
                        </View>
                    </View>

                    <Button
                        title={currentSet < (currentExercise.sets ?? 1)
                            ? `Serie ${currentSet} completada → Descansar`
                            : currentIdx < exercises.length - 1 ? 'Ejercicio completado →' : '¡Finalizar entrenamiento! 🎉'}
                        onPress={handleNextSet}
                        fullWidth
                        size="lg"
                        style={{ marginTop: Spacing['2xl'] }}
                    />
                </View>
            )}
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, paddingTop: 56 },
    timer: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.textPrimary },
    progress: { color: Colors.textSecondary, fontWeight: '600' },
    progressBar: { height: 3, backgroundColor: Colors.border, marginHorizontal: Spacing.base },
    progressFill: { height: '100%', borderRadius: 2 },
    content: { flex: 1, padding: Spacing.base, paddingTop: Spacing['2xl'] },
    exCategory: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '700', letterSpacing: 2, marginBottom: Spacing.sm, textTransform: 'uppercase' },
    exName: { fontSize: FontSizes['4xl'], fontWeight: '900', color: Colors.textPrimary, marginBottom: Spacing.md },
    exDesc: { fontSize: FontSizes.base, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
    setInfo: { flexDirection: 'row', gap: Spacing.sm },
    infoCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    infoValue: { fontSize: FontSizes['2xl'], fontWeight: '900', color: Colors.textPrimary },
    infoLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 4 },
    restView: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
    restTitle: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
    restTimer: { fontSize: 80, fontWeight: '900', color: Colors.primary, marginBottom: Spacing.lg },
    restNext: { color: Colors.textSecondary, fontSize: FontSizes.base, marginBottom: Spacing.xl },
});
