import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, Vibration,
    ScrollView, TextInput, Image, KeyboardAvoidingView, Platform, Modal, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { exerciseApi, sessionApi } from '../../services/api';
import { Exercise, WorkoutSession } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { LOCAL_EXERCISES, CATALOGUE } from '../../utils/catalogue';

type SetRow = { reps: string; weight: string; done: boolean };
type HistorySession = { date: string; sets: Array<{ reps: number; weight: number }> };

const HISTORY_KEY = (exId: string) => `movo_ex_history_${exId}`;

// Photo per muscle group (Unsplash, ~400px thumbnails)
const MUSCLE_IMG: Record<string, string> = {
    'Cuádriceps, Glúteos':      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=70',
    'Cuádriceps':               'https://images.unsplash.com/photo-1574680178181-b4b675eac1b4?w=400&q=70',
    'Pecho, Tríceps':           'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=70',
    'Pecho':                    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=70',
    'Isquiotibiales, Espalda baja': 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&q=70',
    'Dorsales, Bíceps':         'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=70',
    'Dorsales':                 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=70',
    'Hombros, Tríceps':         'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=70',
    'Hombros':                  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=70',
    'Deltoides posterior':      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=70',
    'Full body':                'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400&q=70',
    'Piernas, Cardio':          'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=70',
    'Core, Cardio':             'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=70',
    'Cardio':                   'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=70',
    'Cardio, Pantorrillas':     'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=70',
    'Glúteos, Espalda baja':    'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&q=70',
    'Glúteos':                  'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&q=70',
    'Glúteos, Core':            'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&q=70',
    'Glúteo medio':             'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&q=70',
    'Glúteos, Suelo pélvico':   'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&q=70',
    'Bíceps':                   'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=70',
    'Bíceps, Braquial':         'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=70',
    'Core':                     'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400&q=70',
    'Core, Abdomen':            'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=70',
    'Core, Oblicuos':           'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=70',
    'Core, Brazos':             'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=70',
    'Core avanzado':            'https://images.unsplash.com/photo-1593810450967-f9c42742e326?w=400&q=70',
    'Core profundo':            'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=70',
    'Core, Cadera':             'https://images.unsplash.com/photo-1593810450967-f9c42742e326?w=400&q=70',
    'Espalda, Glúteos':         'https://images.unsplash.com/photo-1570691079236-4bca6c45d440?w=400&q=70',
    'Espalda baja':             'https://images.unsplash.com/photo-1570691079236-4bca6c45d440?w=400&q=70',
    'Espalda, Cadera':          'https://images.unsplash.com/photo-1570691079236-4bca6c45d440?w=400&q=70',
    'Columna, Core':            'https://images.unsplash.com/photo-1593810450967-f9c42742e326?w=400&q=70',
    'Columna, Oblicuos':        'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=70',
    'TFL, Glúteos':             'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&q=70',
    'Cadera, Glúteos':          'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&q=70',
    'Cadera, Cuádriceps':       'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=70',
    'Flexores de cadera':       'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=70',
    'Piernas, Cadera':          'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=70',
    'Ingles, Cadera':           'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=70',
    'Isquiotibiales':           'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&q=70',
    'Isquiotibiales, Hombros':  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=70',
    'Oblicuos, Espalda':        'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=70',
    'Hombros, Core':            'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=70',
    'Respiratorio':             'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=70',
    'Relajación':               'https://images.unsplash.com/photo-1529693662653-9d480530a697?w=400&q=70',
    'Sistema nervioso':         'https://images.unsplash.com/photo-1529693662653-9d480530a697?w=400&q=70',
    'Suelo pélvico':            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=70',
    'Cuádriceps, Pantorrillas': 'https://images.unsplash.com/photo-1574680178181-b4b675eac1b4?w=400&q=70',
    'Postura':                  'https://images.unsplash.com/photo-1570691079236-4bca6c45d440?w=400&q=70',
    'Cadera':                   'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=70',
};

export const ActiveWorkoutScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { routineId } = route.params;
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const intervalRef = useRef<any>(null);

    const [logs, setLogs] = useState<Record<string, SetRow[]>>({});
    const [history, setHistory] = useState<Record<string, HistorySession[]>>({});
    const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({});
    const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
    const [routineImage, setRoutineImage] = useState<string | undefined>();

    // ── Rest timer ──────────────────────────────────────────────────────────
    const [restSeconds, setRestSeconds] = useState<number | null>(null);
    const [restTotal, setRestTotal] = useState(60);
    const restIntervalRef = useRef<any>(null);
    const restAnim = useRef(new Animated.Value(1)).current;

    const startRest = (seconds: number) => {
        clearInterval(restIntervalRef.current);
        setRestTotal(seconds);
        setRestSeconds(seconds);
        restAnim.setValue(1);
        Animated.timing(restAnim, { toValue: 0, duration: seconds * 1000, useNativeDriver: false }).start();
        restIntervalRef.current = setInterval(() => {
            setRestSeconds((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(restIntervalRef.current);
                    Vibration.vibrate([0, 200, 100, 200]);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const skipRest = () => {
        clearInterval(restIntervalRef.current);
        restAnim.stopAnimation();
        setRestSeconds(null);
    };

    useEffect(() => {
        (async () => {
            const isLocal = routineId.startsWith('local-');
            let exs: Exercise[] = [];
            if (isLocal) {
                exs = (LOCAL_EXERCISES[routineId] ?? []).sort((a, b) => a.order_index - b.order_index);
                setExercises(exs);
                const catRoutine = CATALOGUE.find((r) => r.id === routineId);
                if (catRoutine?.image_url) setRoutineImage(catRoutine.image_url);
            } else {
                try {
                    const [eRes, sRes] = await Promise.all([
                        exerciseApi.getByRoutine(routineId),
                        sessionApi.start(routineId),
                    ]);
                    exs = eRes.data.sort((a, b) => a.order_index - b.order_index);
                    setExercises(exs);
                    setSession(sRes.data);
                } catch (e) {
                    Alert.alert('Error', 'No se pudo iniciar el entrenamiento');
                }
            }
            const initLogs: Record<string, SetRow[]> = {};
            exs.forEach((ex) => {
                initLogs[ex.id] = Array.from({ length: ex.sets ?? 3 }, () => ({ reps: '', weight: '', done: false }));
            });
            setLogs(initLogs);
            const hist: Record<string, HistorySession[]> = {};
            await Promise.all(exs.map(async (ex) => {
                try {
                    const raw = await AsyncStorage.getItem(HISTORY_KEY(ex.id));
                    if (raw) hist[ex.id] = JSON.parse(raw);
                } catch (_) {}
            }));
            setHistory(hist);
        })();
        intervalRef.current = setInterval(() => setElapsedSeconds((e) => e + 1), 1000);
        return () => {
            clearInterval(intervalRef.current);
            clearInterval(restIntervalRef.current);
        };
    }, []);

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const updateSet = (exId: string, idx: number, field: 'reps' | 'weight', value: string) => {
        setLogs((prev) => {
            const rows = [...(prev[exId] ?? [])];
            rows[idx] = { ...rows[idx], [field]: value };
            return { ...prev, [exId]: rows };
        });
    };

    const toggleSetDone = (exId: string, idx: number) => {
        setLogs((prev) => {
            const rows = [...(prev[exId] ?? [])];
            const becomingDone = !rows[idx].done;
            rows[idx] = { ...rows[idx], done: !rows[idx].done };
            if (becomingDone) {
                // Only start rest if there are still incomplete sets
                const remaining = rows.filter((r) => !r.done).length;
                if (remaining > 0) {
                    const ex = exercises.find((e) => e.id === exId);
                    startRest(ex?.rest_seconds ?? 60);
                }
            }
            return { ...prev, [exId]: rows };
        });
    };

    const handleComplete = async (ex: Exercise) => {
        const rows = logs[ex.id] ?? [];
        const allDone = rows.length > 0 && rows.every((r) => r.done);
        if (allDone) {
            // Unmark all sets
            setLogs((prev) => ({
                ...prev,
                [ex.id]: (prev[ex.id] ?? []).map((r) => ({ ...r, done: false })),
            }));
            return;
        }
        const completedSets = rows.map((r) => ({
            reps: parseInt(r.reps) || 0,
            weight: parseFloat(r.weight) || 0,
        }));
        const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        const newEntry: HistorySession = { date: today, sets: completedSets };
        const existing = history[ex.id] ?? [];
        const updated = [newEntry, ...existing].slice(0, 3);
        setHistory((prev) => ({ ...prev, [ex.id]: updated }));
        try { await AsyncStorage.setItem(HISTORY_KEY(ex.id), JSON.stringify(updated)); } catch (_) {}

        // ── Save personal record ───────────────────────────────
        const maxWeightSet = completedSets.reduce((best, s) => s.weight > best.weight ? s : best, { weight: 0, reps: 0 });
        if (maxWeightSet.weight > 0) {
            try {
                const prRaw = await AsyncStorage.getItem('movo_pr_tracking');
                const prMap: Record<string, { maxWeight: number; reps: number; date: string }> = prRaw ? JSON.parse(prRaw) : {};
                const existing = prMap[ex.name];
                if (!existing || maxWeightSet.weight > existing.maxWeight) {
                    prMap[ex.name] = { maxWeight: maxWeightSet.weight, reps: maxWeightSet.reps, date: today };
                    await AsyncStorage.setItem('movo_pr_tracking', JSON.stringify(prMap));
                    if (!existing) {
                        // First ever PR for this exercise — silent
                    } else {
                        Vibration.vibrate([0, 100, 50, 200]);
                    }
                }
            } catch (_) {}
        }
        // ──────────────────────────────────────────────────────

        setLogs((prev) => ({
            ...prev,
            [ex.id]: (prev[ex.id] ?? []).map((r) => ({ ...r, done: true })),
        }));
        Vibration.vibrate(200);
    };

    const handleFinish = async () => {
        clearInterval(intervalRef.current);
        if (session && !routineId.startsWith('local-')) {
            try {
                await sessionApi.complete(session.id, { duration_minutes: Math.round(elapsedSeconds / 60) });
            } catch (_) {}
        }
        // Build summary params
        const catRoutine = CATALOGUE.find((r) => r.id === routineId);
        const routineName = catRoutine?.name ?? 'Entrenamiento';
        navigation.replace('WorkoutSummary', {
            routineId,
            routineName,
            elapsedSeconds,
            exerciseNames: exercises.map((e) => e.name),
            exerciseMuscles: exercises.map((e) => e.muscle_group ?? ''),
            sets: exercises.map((e) => logs[e.id] ?? []),
        });
    };

    const repScheme = (ex: Exercise) => {
        const sets = ex.sets ?? 3;
        if (ex.duration_seconds) return `${sets} series \u00d7 ${ex.duration_seconds}s`;
        if (ex.reps) return `${sets} series \u00d7 ${ex.reps}`;
        return `${sets} series`;
    };

    if (exercises.length === 0) return (
        <View style={[s.centered, { backgroundColor: Colors.background }]}>
            <Text style={{ color: Colors.textSecondary }}>Cargando...</Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            {/* ── Rest Timer Overlay ─────────────────────────────────────── */}
            <Modal visible={restSeconds !== null} transparent animationType="fade" statusBarTranslucent>
                <TouchableOpacity style={s.restBackdrop} activeOpacity={1} onPress={skipRest}>
                    <View style={s.restCard}>
                        <Text style={s.restTitle}>⏱️ Tiempo de descanso</Text>
                        <Text style={s.restTimer}>{restSeconds ?? 0}s</Text>
                        {/* progress bar */}
                        <View style={s.restBarTrack}>
                            <Animated.View style={[s.restBarFill, {
                                width: restAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                            }]} />
                        </View>
                        <TouchableOpacity onPress={skipRest} style={s.restSkipBtn}>
                            <Text style={s.restSkipText}>Saltar  →</Text>
                        </TouchableOpacity>
                        <Text style={s.restHint}>Toca fuera para saltar</Text>
                    </View>
                </TouchableOpacity>
            </Modal>
            <View style={s.header}>
                <TouchableOpacity
                    onPress={() => Alert.alert('Abandonar', '\u00bfSalir del entrenamiento?', [
                        { text: 'Continuar', style: 'cancel' },
                        { text: 'Salir', style: 'destructive', onPress: () => { clearInterval(intervalRef.current); navigation.goBack(); } },
                    ])}
                    style={s.headerBtn}
                >
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={s.timerWrap}>
                    <Ionicons name="time-outline" size={15} color={Colors.textSecondary} />
                    <Text style={s.timerText}>{formatTime(elapsedSeconds)}</Text>
                </View>
                <TouchableOpacity style={s.headerBtn}>
                    <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={100}
            >
                <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
                    {exercises.map((ex, exIdx) => {
                        const rows = logs[ex.id] ?? [];
                        const allDone = rows.length > 0 && rows.every((r) => r.done);
                        const hist = history[ex.id] ?? [];
                        const isHistOpen = !!historyOpen[ex.id];
                        const isNotesOpen = !!notesOpen[ex.id];
                        const thumb = (ex as any).image_url
                            ?? MUSCLE_IMG[ex.muscle_group]
                            ?? routineImage;

                        return (
                            <View key={ex.id}>
                                {exIdx > 0 && <View style={s.divider} />}
                                <View style={[s.exBlock, allDone && s.exBlockDone]}>

                                    <View style={s.exTopRow}>
                                        <View style={s.thumbWrap}>
                                            {thumb ? (
                                                <Image source={{ uri: thumb }} style={s.thumb} resizeMode="cover" />
                                            ) : (
                                                <View style={[s.thumb, s.thumbPlaceholder]}>
                                                    <Ionicons name="barbell-outline" size={28} color={Colors.textMuted} />
                                                </View>
                                            )}
                                        </View>
                                        <View style={s.exTitleWrap}>
                                            <Text style={s.exName}>{ex.name.toUpperCase()}</Text>
                                            {allDone && (
                                                <View style={s.doneBadge}>
                                                    <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                                                    <Text style={s.doneText}>Completado</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <View style={s.toolbar}>
                                        <TouchableOpacity
                                            style={[s.toolBtn, isHistOpen && s.toolBtnActive]}
                                            onPress={() => setHistoryOpen((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                                        >
                                            <Ionicons name="trending-up-outline" size={19} color={isHistOpen ? Colors.primary : Colors.textSecondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[s.toolBtn, isNotesOpen && s.toolBtnActive]}
                                            onPress={() => setNotesOpen((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                                        >
                                            <Ionicons name="chatbubble-ellipses-outline" size={19} color={isNotesOpen ? Colors.primary : Colors.textSecondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={s.toolBtn}>
                                            <Ionicons name="calculator-outline" size={19} color={Colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    {isHistOpen && (
                                        <View style={s.panel}>
                                            <Text style={s.panelTitle}>Ultimas marcas</Text>
                                            {hist.length === 0 ? (
                                                <Text style={s.panelEmpty}>Sin historial previo. Completa el ejercicio para guardarlo.</Text>
                                            ) : hist.map((h, hi) => (
                                                <View key={hi} style={s.histRow}>
                                                    <Text style={s.histDate}>{h.date}</Text>
                                                    <View style={s.histSetsCol}>
                                                        {h.sets.map((st, sti) => (
                                                            <View key={sti} style={s.histSetLine}>
                                                                <Text style={s.histSetNum}>S{sti + 1}</Text>
                                                                <Text style={s.histSets}>
                                                                    {st.reps} reps × {st.weight > 0 ? `${st.weight}kg` : 'BW'}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {isNotesOpen && (
                                        <View style={[s.panel, s.panelNote]}>
                                            <Text style={s.notesText}>{ex.description}</Text>
                                        </View>
                                    )}

                                    <View style={s.schemeRow}>
                                        <View style={s.schemeItem}>
                                            <Ionicons name="flag-outline" size={13} color={Colors.textSecondary} />
                                            <Text style={s.schemeText}>{repScheme(ex)}</Text>
                                        </View>
                                        {(ex.rest_seconds ?? 0) > 0 && (
                                            <View style={s.schemeItem}>
                                                <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                                                <Text style={s.schemeText}>{ex.rest_seconds}{'"'} de descanso</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={s.completeRow}>
                                        <Text style={s.insertMarcas}>- Insertar marcas</Text>
                                        <TouchableOpacity
                                            onPress={() => handleComplete(ex)}
                                            style={[s.completeBtn, allDone && s.completeBtnDone]}
                                            activeOpacity={0.75}
                                        >
                                            <Ionicons name="checkmark" size={14} color={allDone ? Colors.success : Colors.textPrimary} />
                                            <Text style={[s.completeBtnText, allDone && { color: Colors.success }]}>
                                                {allDone ? 'Completado' : 'Completar'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={s.table}>
                                        <View style={s.tableHeader}>
                                            <Text style={[s.colLabel, s.colNum]}>Series</Text>
                                            <Text style={[s.colLabel, s.colReps]}>Repeticiones</Text>
                                            <Text style={[s.colLabel, s.colWeight]}>Peso (kg)</Text>
                                            <View style={s.colCheck} />
                                        </View>
                                        {rows.map((row, ri) => (
                                            <View key={ri} style={[s.tableRow, row.done && s.tableRowDone]}>
                                                <Text style={[s.colNum, s.setNum]}>{ri + 1}</Text>
                                                <TextInput
                                                    style={[s.colReps, s.input]}
                                                    value={row.reps}
                                                    onChangeText={(v) => updateSet(ex.id, ri, 'reps', v)}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor={Colors.textMuted}
                                                    editable={!row.done}
                                                />
                                                <TextInput
                                                    style={[s.colWeight, s.input]}
                                                    value={row.weight}
                                                    onChangeText={(v) => updateSet(ex.id, ri, 'weight', v)}
                                                    keyboardType="decimal-pad"
                                                    placeholder="0"
                                                    placeholderTextColor={Colors.textMuted}
                                                    editable={!row.done}
                                                />
                                                <TouchableOpacity
                                                    onPress={() => toggleSetDone(ex.id, ri)}
                                                    style={[s.colCheck, s.checkBtn, row.done && s.checkBtnDone]}
                                                >
                                                    <Ionicons name="checkmark" size={15} color={row.done ? Colors.success : Colors.textMuted} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={s.footer}>
                <TouchableOpacity onPress={handleFinish} style={s.finishBtn} activeOpacity={0.85}>
                    <Text style={s.finishText}>Terminar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.base, paddingTop: 56, paddingBottom: Spacing.md,
        backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    timerWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    timerText: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    divider: { height: 10, backgroundColor: Colors.surface },
    exBlock: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.lg, backgroundColor: Colors.background },
    exBlockDone: { opacity: 0.7 },
    exTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
    thumbWrap: { width: 110, height: 80, borderRadius: BorderRadius.md, overflow: 'hidden' },
    thumb: { width: '100%', height: '100%' },
    thumbPlaceholder: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
    exTitleWrap: { flex: 1, paddingTop: 2 },
    exName: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 0.4, lineHeight: 24 },
    doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    doneText: { fontSize: FontSizes.xs, color: Colors.success, fontWeight: '600' },
    toolbar: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    toolBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.border,
    },
    toolBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '18' },
    panel: {
        backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
        padding: Spacing.md, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    panelNote: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
    panelTitle: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
    panelEmpty: { fontSize: FontSizes.sm, color: Colors.textMuted, fontStyle: 'italic' },
    histRow: {
        paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border + '55',
    },
    histDate: { fontSize: FontSizes.xs, color: Colors.primary, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    histSetsCol: { gap: 3 },
    histSetLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    histSetNum: { fontSize: FontSizes.xs, fontWeight: '800', color: Colors.textMuted, minWidth: 22 },
    histSets: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },
    notesText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
    schemeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg, marginBottom: Spacing.md },
    schemeItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    schemeText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    completeRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    insertMarcas: { fontSize: FontSizes.sm, color: Colors.textMuted },
    completeBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full,
        paddingHorizontal: 14, paddingVertical: 7,
    },
    completeBtnDone: { borderColor: Colors.success + '80' },
    completeBtnText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
    table: {},
    tableHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    tableRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 7,
        borderBottomWidth: 1, borderBottomColor: Colors.border + '55',
    },
    tableRowDone: { opacity: 0.55 },
    colLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    colNum: { width: 52, textAlign: 'center' },
    colReps: { flex: 1, textAlign: 'center' },
    colWeight: { flex: 1, textAlign: 'center' },
    colCheck: { width: 44, alignItems: 'center' },
    setNum: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.textPrimary },
    input: {
        color: Colors.textPrimary, fontSize: FontSizes.base, fontWeight: '600',
        borderBottomWidth: 1.5, borderBottomColor: Colors.border,
        paddingVertical: 2, textAlign: 'center',
        backgroundColor: 'transparent',
    },
    checkBtn: {
        width: 32, height: 32, borderRadius: 16,
        borderWidth: 1.5, borderColor: Colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    checkBtnDone: { backgroundColor: Colors.success + '20', borderColor: Colors.success },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: Spacing.base, paddingBottom: 28, paddingTop: 12,
        backgroundColor: Colors.background,
        borderTopWidth: 1, borderTopColor: Colors.border,
    },
    finishBtn: {
        backgroundColor: '#1E2030', borderRadius: BorderRadius.xl,
        paddingVertical: 16, alignItems: 'center',
    },
    finishText: { color: Colors.textPrimary, fontSize: FontSizes.base, fontWeight: '700', letterSpacing: 0.5 },
    // ── Rest timer ──────────────────────────────────────────────────────────
    restBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
    restCard: {
        backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'], alignItems: 'center', width: 280,
        borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
    },
    restTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
    restTimer: { fontSize: 72, fontWeight: '900', color: Colors.textPrimary, lineHeight: 80 },
    restBarTrack: { width: '100%', height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
    restBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
    restSkipBtn: {
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
        marginTop: Spacing.sm,
    },
    restSkipText: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    restHint: { fontSize: FontSizes.xs, color: Colors.textMuted },
});
