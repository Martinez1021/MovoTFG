import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Image, Alert, Modal, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../store/routineStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { Routine } from '../../types';
import { CATALOGUE, GOAL_TAGS, GOAL_LABEL } from '../../utils/catalogue';
import { supabase } from '../../services/supabase';

// ─────────────────────────────────────────────────────────────────────────────
//  "HAZ TU RUTINA"  —  grupos musculares + ejercicios
// ─────────────────────────────────────────────────────────────────────────────
type QuickExercise = { name: string; sets: number; reps: string; tip?: string };
type QuickGroup    = { id: string; label: string; emoji: string; gradient: [string, string]; exercises: QuickExercise[] };

const QUICK_GROUPS: QuickGroup[] = [
    {
        id: 'pecho', label: 'Pecho', emoji: '💪', gradient: ['#FF6B6B', '#FF8E53'],
        exercises: [
            { name: 'Press de banca', sets: 4, reps: '10', tip: 'Codos a 45°, no rebotar la barra.' },
            { name: 'Press inclinado con barra', sets: 3, reps: '12', tip: 'Ángulo 30-45°, controla la bajada.' },
            { name: 'Press declinado con barra', sets: 3, reps: '12', tip: 'Agarre algo más cerrado que en press plano.' },
            { name: 'Press con mancuernas', sets: 3, reps: '12', tip: 'Rango completo, palmas al frente.' },
            { name: 'Aperturas con mancuernas', sets: 3, reps: '15', tip: 'Ligera flexión de codo, no bajar demasiado.' },
            { name: 'Press en máquina de pecho', sets: 3, reps: '15', tip: 'Ajusta el asiento a nivel de pecho.' },
            { name: 'Aperturas en polea cruzada', sets: 3, reps: '15', tip: 'Movimiento de abrazo, espeja el pecho.' },
            { name: 'Pullover con mancuerna', sets: 3, reps: '12', tip: 'Mantén los codos ligeramente flexionados.' },
            { name: 'Fondos en paralelas (pecho)', sets: 3, reps: '12', tip: 'Inclínate hacia delante para enfatizar el pecho.' },
            { name: 'Flexiones estándar', sets: 3, reps: '20', tip: 'Cuerpo recto como una tabla.' },
            { name: 'Flexiones diamante', sets: 3, reps: '15', tip: 'Manos juntas en diamante, tríceps activos.' },
            { name: 'Flexiones inclinadas (pies elevados)', sets: 3, reps: '15', tip: 'Enfatiza la parte alta del pecho.' },
        ],
    },
    {
        id: 'core', label: 'Core', emoji: '🔥', gradient: ['#F7971E', '#FFD200'],
        exercises: [
            { name: 'Plancha frontal', sets: 3, reps: '45 seg', tip: 'Glúteos activos, no subas las caderas.' },
            { name: 'Crunch abdominal', sets: 4, reps: '20', tip: 'Sube solo los hombros, no el cuello.' },
            { name: 'Crunch inverso', sets: 3, reps: '15', tip: 'Controla la bajada de las piernas.' },
            { name: 'Mountain climbers', sets: 3, reps: '30', tip: 'Ritmo rápido, cadera paralela al suelo.' },
            { name: 'Bicycle crunches', sets: 3, reps: '20', tip: 'Rota el torso, no el cuello.' },
            { name: 'Russian twists', sets: 3, reps: '20', tip: 'Piernas elevadas para mayor dificultad.' },
            { name: 'Plancha lateral', sets: 3, reps: '30 seg', tip: 'Cadera alta, oblicuos en tensión.' },
            { name: 'Hollow body hold', sets: 3, reps: '30 seg', tip: 'Espalda baja pegada al suelo.' },
            { name: 'Leg raises', sets: 3, reps: '15', tip: 'Piernas rectas, no rebotes al bajar.' },
            { name: 'Dead bug', sets: 3, reps: '12', tip: 'Baja brazo y pierna opuestos al mismo tiempo.' },
            { name: 'Ab rollout (rueda)', sets: 3, reps: '10', tip: 'Core tenso, no hundas la espalda.' },
            { name: 'Dragon flag', sets: 3, reps: '8', tip: 'Ejercicio avanzado, baja lentamente.' },
        ],
    },
    {
        id: 'piernas', label: 'Piernas', emoji: '🦵', gradient: ['#43E97B', '#38F9D7'],
        exercises: [
            { name: 'Sentadilla con barra', sets: 4, reps: '10', tip: 'Rodillas alineadas con los pies.' },
            { name: 'Prensa de piernas', sets: 3, reps: '12', tip: 'No bloquees las rodillas en extensión.' },
            { name: 'Zancadas (lunges)', sets: 3, reps: '12 por pierna', tip: 'Rodilla delantera no pasa la punta del pie.' },
            { name: 'Peso muerto rumano', sets: 3, reps: '10', tip: 'Espalda recta, bisagra de cadera.' },
            { name: 'Hip thrust con barra', sets: 4, reps: '12', tip: 'Squeeze de glúteo arriba del todo.' },
            { name: 'Extensión de cuádriceps', sets: 3, reps: '15', tip: 'Extensión completa, contracción en el tope.' },
            { name: 'Curl de isquiotibiales', sets: 3, reps: '12', tip: 'Controlado en bajada.' },
            { name: 'Sentadilla búlgara', sets: 3, reps: '10 por pierna', tip: 'Pie trasero elevado, tronco erguido.' },
            { name: 'Step-ups con mancuernas', sets: 3, reps: '12 por pierna', tip: 'Empuja con el talón del pie de apoyo.' },
            { name: 'Calf raises de pie', sets: 4, reps: '20', tip: 'Pausa en la parte alta.' },
            { name: 'Goblet squat', sets: 3, reps: '15', tip: 'Mancuerna sujeta en el pecho, talones en el suelo.' },
            { name: 'Box jumps', sets: 3, reps: '10', tip: 'Aterriza suavemente con las rodillas flexionadas.' },
        ],
    },
    {
        id: 'espalda', label: 'Espalda', emoji: '🏋️', gradient: ['#4776E6', '#8E54E9'],
        exercises: [
            { name: 'Dominadas (pull-ups)', sets: 3, reps: '8', tip: 'Agarre prono, activa los dorsales desde abajo.' },
            { name: 'Remo con barra', sets: 4, reps: '10', tip: 'Espalda paralela al suelo, codos pegados.' },
            { name: 'Jalón al pecho en polea', sets: 3, reps: '12', tip: 'Tira hacia el pecho, no hacia atrás.' },
            { name: 'Remo con mancuerna', sets: 3, reps: '12 por lado', tip: 'Apoyo con rodilla, codo junto al cuerpo.' },
            { name: 'Face pulls en polea', sets: 3, reps: '15', tip: 'Codos altos, manos a las orejas.' },
            { name: 'Remo sentado en polea baja', sets: 3, reps: '12', tip: 'Pecho pecho erguido, no balancees el torso.' },
            { name: 'Pull-over en polea', sets: 3, reps: '12', tip: 'Brazos casi rectos, arco amplio.' },
            { name: 'Encogimientos con barra (traps)', sets: 3, reps: '15', tip: 'Sube recto, no hagas círculos.' },
            { name: 'Hiperextensiones', sets: 3, reps: '15', tip: 'No hiperextiendas la zona lumbar.' },
            { name: 'Band pull-aparts', sets: 3, reps: '20', tip: 'Goma a la altura del pecho, brazos extendidos.' },
        ],
    },
    {
        id: 'hombros', label: 'Hombros', emoji: '🎯', gradient: ['#FC5C7D', '#6A3093'],
        exercises: [
            { name: 'Press militar con barra', sets: 4, reps: '10', tip: 'De pie o sentado, core activo.' },
            { name: 'Press Arnold', sets: 3, reps: '12', tip: 'Gira las palmas durante la subida.' },
            { name: 'Elevaciones laterales', sets: 3, reps: '15', tip: 'Codos ligeramente flexionados, no por encima de los hombros.' },
            { name: 'Elevaciones frontales', sets: 3, reps: '15', tip: 'Alterna brazos o hazlas juntas.' },
            { name: 'Face pulls para deltoides posterior', sets: 3, reps: '15', tip: 'Codos altos.' },
            { name: 'Press con mancuernas sentado', sets: 3, reps: '12', tip: 'No bloquees los codos arriba.' },
            { name: 'Encogimientos de hombros (shrugs)', sets: 3, reps: '15', tip: 'Sube directo, sin girar.' },
            { name: 'Vuelos en decúbito prono', sets: 3, reps: '12', tip: 'Trabajo del deltoides posterior.' },
            { name: 'Rotación externa con banda', sets: 3, reps: '15 por lado', tip: 'Codo pegado al costado.' },
        ],
    },
    {
        id: 'biceps', label: 'Bíceps', emoji: '💥', gradient: ['#3CA55C', '#B5AC49'],
        exercises: [
            { name: 'Curl con barra', sets: 4, reps: '12', tip: 'Codos pegados al cuerpo, sin balanceo.' },
            { name: 'Curl con mancuernas alterno', sets: 3, reps: '12 por brazo', tip: 'Supina la muñeca al subir.' },
            { name: 'Curl martillo', sets: 3, reps: '12', tip: 'Agarre neutro, trabaja el braquial.' },
            { name: 'Curl en polea baja', sets: 3, reps: '15', tip: 'Tensión constante en todo el recorrido.' },
            { name: 'Curl concentrado', sets: 3, reps: '12 por brazo', tip: 'Codo apoyado en el muslo.' },
            { name: 'Curl predicador (Scott)', sets: 3, reps: '10', tip: 'No sueltes el peso al bajar.' },
            { name: 'Curl 21s', sets: 3, reps: '7+7+7', tip: 'Parte baja, parte alta y recorrido completo.' },
            { name: 'Curl inclinado con mancuernas', sets: 3, reps: '12', tip: 'Máximo estiramiento del bíceps.' },
        ],
    },
    {
        id: 'triceps', label: 'Tríceps', emoji: '⚡', gradient: ['#f953c6', '#b91d73'],
        exercises: [
            { name: 'Press francés (skullcrusher)', sets: 3, reps: '12', tip: 'Codos apuntando al techo, no se abren.' },
            { name: 'Fondos en banco', sets: 3, reps: '15', tip: 'Cuanto más separado el banco, más difícil.' },
            { name: 'Extensión en polea alta', sets: 3, reps: '15', tip: 'Codos fijos, solo extiende el antebrazo.' },
            { name: 'Kickbacks con mancuerna', sets: 3, reps: '15 por brazo', tip: 'Torso paralelo al suelo.' },
            { name: 'Press cerrado con barra', sets: 3, reps: '10', tip: 'Agarre estrecho, codos en.' },
            { name: 'Extensión sobre la cabeza con mancuerna', sets: 3, reps: '12', tip: 'Codos apuntando al techo.' },
            { name: 'Fondos en paralelas (tríceps)', sets: 3, reps: '10', tip: 'Tronco erguido para más tríceps.' },
            { name: 'Extensión en polea con cuerda', sets: 3, reps: '15', tip: 'Separa la cuerda al bajar.' },
        ],
    },
    {
        id: 'cardio', label: 'Cardio', emoji: '🏃', gradient: ['#11998e', '#38ef7d'],
        exercises: [
            { name: 'Burpees', sets: 3, reps: '15', tip: 'Salto con los brazos arriba al final.' },
            { name: 'Jumping jacks', sets: 3, reps: '30', tip: 'Ritmo constante y controlado.' },
            { name: 'High knees', sets: 3, reps: '30 seg', tip: 'Rodillas al nivel del ombligo.' },
            { name: 'Mountain climbers', sets: 3, reps: '30', tip: 'Core activo, caderas bajas.' },
            { name: 'Jump rope (simulado)', sets: 3, reps: '1 min', tip: 'Aterrizaje suave en punta de pies.' },
            { name: 'Box jumps', sets: 3, reps: '12', tip: 'Aterrizaje amortiguado, aterriza como gatito.' },
            { name: 'Sprints en sitio', sets: 3, reps: '30 seg', tip: 'Máxima velocidad, brazos activos.' },
            { name: 'Escaladores (step-up cardio)', sets: 3, reps: '20 por pierna', tip: 'No apoyes el pie trasero.' },
            { name: 'Saltos de tijera', sets: 3, reps: '20', tip: 'Pies alternos, brazos al contrario.' },
            { name: 'Sentadillas con salto', sets: 3, reps: '15', tip: 'Aterriza con rodillas flexionadas.' },
        ],
    },
];

// ─── Quick Workout Modal ──────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');

const QuickWorkoutModal: React.FC<{
    group: QuickGroup | null;
    onClose: () => void;
}> = ({ group, onClose }) => {
    const { primary } = useThemeStore();
    const [phase, setPhase] = useState<'list' | 'workout'>('list');
    const [currentIdx, setCurrentIdx] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (group) { setPhase('list'); setCurrentIdx(0); }
    }, [group]);

    const goNext = () => {
        if (!group) return;
        if (currentIdx < group.exercises.length - 1) {
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
            ]).start();
            setCurrentIdx(i => i + 1);
        } else {
            Alert.alert('🎉 ¡Entrenamiento completado!', `Has completado todos los ejercicios de ${group.label}. ¡Buen trabajo!`, [
                { text: 'Cerrar', onPress: onClose },
            ]);
        }
    };

    if (!group) return null;
    const ex = group.exercises[currentIdx];
    const isLast = currentIdx === group.exercises.length - 1;
    const progress = (currentIdx + 1) / group.exercises.length;

    return (
        <Modal visible={!!group} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>

                {/* PHASE: LIST */}
                {phase === 'list' && (
                    <>
                        {/* Header */}
                        <LinearGradient colors={group.gradient} style={qw.listHeader}>
                            <TouchableOpacity onPress={onClose} style={qw.closeBtn}>
                                <Ionicons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                            <Text style={qw.listEmoji}>{group.emoji}</Text>
                            <Text style={qw.listGroupName}>{group.label}</Text>
                            <Text style={qw.listSubtitle}>{group.exercises.length} ejercicios</Text>
                        </LinearGradient>

                        {/* Exercise list */}
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.base, paddingBottom: 120 }}>
                            {group.exercises.map((e, i) => (
                                <View key={i} style={qw.exRow}>
                                    <LinearGradient colors={[group.gradient[0] + '33', group.gradient[1] + '22']} style={qw.exNum}>
                                        <Text style={[qw.exNumText, { color: group.gradient[0] }]}>{i + 1}</Text>
                                    </LinearGradient>
                                    <View style={{ flex: 1 }}>
                                        <Text style={qw.exName}>{e.name}</Text>
                                        <Text style={qw.exMeta}>{e.sets} series × {e.reps} reps</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Start button */}
                        <View style={qw.startWrap}>
                            <TouchableOpacity onPress={() => setPhase('workout')} activeOpacity={0.85}>
                                <LinearGradient colors={group.gradient} style={qw.startBtn}>
                                    <Ionicons name="play" size={20} color="#fff" />
                                    <Text style={qw.startBtnText}>Empezar entrenamiento</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* PHASE: WORKOUT (exercise by exercise) */}
                {phase === 'workout' && (
                    <View style={{ flex: 1 }}>
                        {/* Top bar */}
                        <View style={qw.topBar}>
                            <TouchableOpacity onPress={() => setPhase('list')}>
                                <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            <Text style={qw.topBarTitle}>{group.emoji} {group.label}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={22} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Progress bar */}
                        <View style={qw.progressBg}>
                            <Animated.View style={[qw.progressFill, { width: `${progress * 100}%`, backgroundColor: group.gradient[0] }]} />
                        </View>
                        <Text style={qw.progressText}>{currentIdx + 1} de {group.exercises.length}</Text>

                        {/* Exercise card */}
                        <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }, { opacity: fadeAnim }]}>
                            {/* Number */}
                            <LinearGradient colors={group.gradient} style={qw.exCircle}>
                                <Text style={qw.exCircleNum}>{currentIdx + 1}</Text>
                            </LinearGradient>

                            {/* Exercise name */}
                            <Text style={qw.workoutExName}>{ex.name}</Text>

                            {/* Sets × Reps */}
                            <LinearGradient colors={[group.gradient[0] + '33', group.gradient[1] + '22']} style={qw.repsCard}>
                                <View style={qw.repsRow}>
                                    <View style={qw.repsStat}>
                                        <Text style={[qw.repsNumBig, { color: group.gradient[0] }]}>{ex.sets}</Text>
                                        <Text style={qw.repsLabel}>Series</Text>
                                    </View>
                                    <View style={qw.repsDivider} />
                                    <View style={qw.repsStat}>
                                        <Text style={[qw.repsNumBig, { color: group.gradient[0] }]}>{ex.reps}</Text>
                                        <Text style={qw.repsLabel}>Reps</Text>
                                    </View>
                                </View>
                            </LinearGradient>

                            {/* Tip */}
                            {ex.tip && (
                                <View style={qw.tipBox}>
                                    <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
                                    <Text style={qw.tipText}>{ex.tip}</Text>
                                </View>
                            )}
                        </Animated.View>

                        {/* SIGUIENTE / TERMINAR big button */}
                        <View style={qw.nextWrap}>
                            <TouchableOpacity onPress={goNext} activeOpacity={0.88} style={{ width: '100%' }}>
                                <LinearGradient colors={isLast ? ['#22c55e', '#16a34a'] : group.gradient} style={qw.nextBtn}>
                                    <Text style={qw.nextBtnText}>{isLast ? '🏁  TERMINAR' : 'SIGUIENTE  →'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </LinearGradient>
        </Modal>
    );
};

const qw = StyleSheet.create({
    // List phase
    listHeader: { paddingTop: 60, paddingBottom: Spacing.xl, alignItems: 'center', position: 'relative' },
    closeBtn: { position: 'absolute', top: 52, right: Spacing.base, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
    listEmoji: { fontSize: 52, marginBottom: 8 },
    listGroupName: { fontSize: FontSizes['3xl'], fontWeight: '900', color: '#fff' },
    listSubtitle: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    exRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    exNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    exNumText: { fontWeight: '800', fontSize: FontSizes.base },
    exName: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    exMeta: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    startWrap: { padding: Spacing.xl, paddingBottom: 44 },
    startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.xl, paddingVertical: 18 },
    startBtnText: { fontSize: FontSizes.lg, fontWeight: '800', color: '#fff' },
    // Workout phase
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 56, paddingBottom: Spacing.md },
    topBarTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    progressBg: { height: 6, backgroundColor: Colors.surface, marginHorizontal: Spacing.base, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },
    progressText: { textAlign: 'center', color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: 6 },
    exCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
    exCircleNum: { fontSize: FontSizes['3xl'], fontWeight: '900', color: '#fff' },
    workoutExName: { fontSize: FontSizes['3xl'], fontWeight: '900', color: Colors.textPrimary, textAlign: 'center', lineHeight: 40, marginBottom: Spacing.xl },
    repsCard: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.lg },
    repsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    repsStat: { flex: 1, alignItems: 'center' },
    repsNumBig: { fontSize: 52, fontWeight: '900', lineHeight: 60 },
    repsLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
    repsDivider: { width: 1, height: 60, backgroundColor: Colors.border },
    tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    tipText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 18 },
    nextWrap: { padding: Spacing.xl, paddingBottom: 48 },
    nextBtn: { borderRadius: BorderRadius.xl, paddingVertical: 22, alignItems: 'center', justifyContent: 'center' },
    nextBtnText: { fontSize: FontSizes['2xl'], fontWeight: '900', color: '#fff', letterSpacing: 1 },
});

const CAT_LABELS: Record<string, string> = { gym: '🏋️ Gym', yoga: '🧘 Yoga', pilates: '🌀 Pilates' };
const DIFF_LABELS: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
const DIFF_COLORS: Record<string, string> = { beginner: Colors.success, intermediate: Colors.warning, advanced: '#FF6B35' };
const CAT_GRAD: Record<string, [string, string]> = {
    gym: ['#FF6B6B', '#FF8E53'],
    yoga: ['#43E97B', '#38F9D7'],
    pilates: ['#F7971E', '#FFD200'],
};

// ── Routine card ─────────────────────────────────────────────────────────────
const RoutineCard: React.FC<{
    routine: Routine & { tags?: string[]; image_url?: string };
    saved: boolean;
    onPress: () => void;
    onToggleSave: () => void;
    onStart: () => void;
    assignMode?: boolean;
}> = ({ routine, saved, onPress, onToggleSave, onStart, assignMode }) => {
    const grad = CAT_GRAD[routine.category] ?? ['#6C63FF', '#9C6FFF'];
    const hasImage = !!routine.image_url;
    return (
        <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={card.wrap}>
            {hasImage ? (
                <View style={card.imgWrap}>
                    <Image source={{ uri: routine.image_url }} style={card.img} resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={card.imgGrad} />
                    <TouchableOpacity onPress={onToggleSave} style={card.imgHeart} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#FF4D6D' : '#fff'} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={card.bar}>
                    <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                </View>
            )}
            <View style={card.body}>
                <View style={card.topRow}>
                    <View style={[card.badge, { backgroundColor: grad[0] + '22' }]}>
                        <Text style={[card.badgeText, { color: grad[0] }]}>{CAT_LABELS[routine.category]}</Text>
                    </View>
                    <View style={[card.badge, { backgroundColor: DIFF_COLORS[routine.difficulty] + '22' }]}>
                        <Text style={[card.badgeText, { color: DIFF_COLORS[routine.difficulty] }]}>{DIFF_LABELS[routine.difficulty]}</Text>
                    </View>
                    {!hasImage && (
                        <TouchableOpacity onPress={onToggleSave} style={card.heart} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#FF4D6D' : Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={card.title} numberOfLines={1}>{routine.title}</Text>
                <Text style={card.desc} numberOfLines={2}>{routine.description}</Text>
                <View style={card.footer}>
                    <View style={card.stat}>
                        <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                        <Text style={card.statText}>{routine.duration_minutes} min</Text>
                    </View>
                    <TouchableOpacity onPress={onStart} activeOpacity={0.8}>
                        <LinearGradient colors={assignMode ? ['#7C3AED', '#A855F7'] : grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={card.startBtn}>
                            <Text style={card.startText}>{assignMode ? 'Asignar' : 'Empezar'}</Text>
                            <Ionicons name={assignMode ? 'person-add-outline' : 'arrow-forward'} size={13} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// ── Screen ───────────────────────────────────────────────────────────────────
const CATS = [{ id: 'all', label: 'Todos' }, { id: 'gym', label: '🏋️ Gym' }, { id: 'yoga', label: '🧘 Yoga' }, { id: 'pilates', label: '🌀 Pilates' }];
const DIFFS = [{ id: 'all', label: 'Todos' }, { id: 'beginner', label: 'Principiante' }, { id: 'intermediate', label: 'Intermedio' }, { id: 'advanced', label: 'Avanzado' }];

export const RoutinesScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { primary } = useThemeStore();
    const { profile } = useAuthStore();
    const { publicRoutines, fetchPublicRoutines, isLoading } = useRoutineStore();

    const assignToClientId: string | undefined = route.params?.assignToClientId;

    const [catFilter, setCatFilter] = useState<string>(route.params?.category ?? 'all');
    const [diffFilter, setDiffFilter] = useState<string>('all');
    const [tab, setTab] = useState<'library' | 'saved'>('library');
    const [saved, setSaved] = useState<Set<string>>(new Set());
    const [assigning, setAssigning] = useState(false);
    const [quickGroup, setQuickGroup] = useState<QuickGroup | null>(null);

    useEffect(() => { fetchPublicRoutines(); }, []);

    const handleAssign = async (routineId: string, routineTitle: string) => {
        if (!assignToClientId) return;
        setAssigning(true);
        try {
            let finalRoutineId = routineId;

            // Local catalogue routines have non-UUID ids (e.g. "local-g1")
            // Auto-upsert them to Supabase so they can be assigned
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(routineId)) {
                const catItem = CATALOGUE.find((r) => r.id === routineId);
                if (!catItem) throw new Error('Rutina no encontrada en el catálogo');

                // Check if already synced to Supabase
                const { data: existing } = await supabase
                    .from('routines')
                    .select('id')
                    .eq('title', catItem.title)
                    .maybeSingle();

                if (existing?.id) {
                    finalRoutineId = existing.id;
                } else {
                    // Get trainer's internal DB id for created_by (required by RLS)
                    const { data: { session } } = await supabase.auth.getSession();
                    const trainerUid = session?.user?.id;
                    let createdBy: string | null = null;
                    if (trainerUid) {
                        const { data: trainerRow } = await supabase
                            .from('users').select('id').eq('supabase_id', trainerUid).maybeSingle();
                        createdBy = trainerRow?.id ?? null;
                    }

                    // Insert it so it gets a real UUID
                    const { data: inserted, error: insertErr } = await supabase
                        .from('routines')
                        .insert({
                            title: catItem.title,
                            description: catItem.description,
                            category: catItem.category,
                            difficulty: catItem.difficulty,
                            duration_minutes: catItem.duration_minutes,
                            is_public: true,
                            thumbnail_url: catItem.image_url,
                            ...(createdBy ? { created_by: createdBy } : {}),
                        })
                        .select('id')
                        .single();
                    if (insertErr) throw insertErr;
                    finalRoutineId = inserted.id;
                    // Refresh store so newly synced routine gets its real UUID on next render
                    fetchPublicRoutines();
                }
            }

            const { error } = await supabase.from('user_routines').upsert(
                { user_id: assignToClientId, routine_id: finalRoutineId, status: 'active' },
                { onConflict: 'user_id,routine_id' }
            );
            if (error) throw error;
            Alert.alert('✅ Rutina asignada', `"${routineTitle}" asignada al cliente.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo asignar la rutina');
        } finally {
            setAssigning(false);
        }
    };

    const allRoutines = useMemo(() => {
        const backendIds = new Set(publicRoutines.map((r) => r.id));
        return [
            ...publicRoutines.map((r) => ({ ...r, tags: [] as string[], image_url: '' })),
            ...CATALOGUE.filter((r) => !backendIds.has(r.id)),
        ];
    }, [publicRoutines]);

    const filtered = useMemo(() =>
        allRoutines.filter((r) =>
            (catFilter === 'all' || r.category === catFilter) &&
            (diffFilter === 'all' || r.difficulty === diffFilter)
        ), [allRoutines, catFilter, diffFilter]);

    const recommended = useMemo(() => {
        const goals: string[] = profile?.goals ?? [];
        const preferred: string[] = profile?.preferred_types ?? [];
        const relevantTags = new Set<string>();
        goals.forEach((g) => (GOAL_TAGS[g.toLowerCase()] ?? []).forEach((t) => relevantTags.add(t)));
        preferred.forEach((p) => relevantTags.add(p));
        if (relevantTags.size === 0) return allRoutines.slice(0, 5);
        return allRoutines
            .map((r) => ({ r, score: (r.tags ?? []).filter((t) => relevantTags.has(t)).length + (relevantTags.has(r.category) ? 2 : 0) }))
            .sort((a, b) => b.score - a.score).slice(0, 5).map((x) => x.r);
    }, [allRoutines, profile]);

    const savedRoutines = useMemo(() => allRoutines.filter((r) => saved.has(r.id)), [allRoutines, saved]);

    const toggleSave = (id: string) => setSaved((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const goalLabel = useMemo(() => {
        const g = profile?.goals?.[0];
        if (!g) return null;
        return GOAL_LABEL[g] ?? GOAL_LABEL[g.toLowerCase()] ?? g;
    }, [profile]);

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.header}>
                {assignToClientId && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm }}>
                        <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
                        <Text style={{ color: Colors.textSecondary, fontSize: FontSizes.sm }}>Volver</Text>
                    </TouchableOpacity>
                )}
                <Text style={s.heading}>{assignToClientId ? 'Asignar rutina' : 'Rutinas'}</Text>
                {assignToClientId && (
                    <LinearGradient colors={['#7C3AED33', '#7C3AED11']} style={s.assignBanner}>
                        <Ionicons name="person-add-outline" size={18} color="#A855F7" />
                        <Text style={s.assignBannerText}>Selecciona una rutina para asignar al cliente</Text>
                    </LinearGradient>
                )}
                <View style={s.tabRow}>
                    {[
                        { id: 'library', label: '📚 Biblioteca' },
                        { id: 'saved', label: `❤️ Guardadas${saved.size > 0 ? ` (${saved.size})` : ''}` },
                    ].map((t) => (
                        <TouchableOpacity key={t.id} onPress={() => setTab(t.id as any)}
                            style={[s.tab, tab === t.id && { backgroundColor: primary }]}>
                            <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {tab === 'library' ? (
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchPublicRoutines} tintColor={primary} />}>

                    {/* ── HAZ TU RUTINA ─────────────────────────────────── */}
                    <View style={s.quickSection}>
                        <View style={s.quickHeader}>
                            <View>
                                <Text style={s.quickTitle}>⚡ Haz tu rutina</Text>
                                <Text style={s.quickSub}>Elige un grupo muscular y empieza ya</Text>
                            </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.base }}>
                            {QUICK_GROUPS.map((g) => (
                                <TouchableOpacity key={g.id} onPress={() => setQuickGroup(g)} activeOpacity={0.82} style={qg.card}>
                                    <LinearGradient colors={g.gradient} style={StyleSheet.absoluteFill} borderRadius={BorderRadius.lg} />
                                    <Text style={qg.emoji}>{g.emoji}</Text>
                                    <Text style={qg.label}>{g.label}</Text>
                                    <Text style={qg.count}>{g.exercises.length} ejercicios</Text>
                                    <View style={qg.plusBtn}>
                                        <Ionicons name="add" size={20} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Recommendation banner */}
                    <LinearGradient colors={[primary + 'DD', primary + '66']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.recBanner}>
                        <View style={s.recHeader}>
                            <Text style={{ fontSize: 22 }}>🎯</Text>
                            <Text style={s.recTitle}>
                                {goalLabel ? `Según tu objetivo de ${goalLabel}, te recomendamos:` : 'Rutinas recomendadas para ti:'}
                            </Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
                            {recommended.map((r) => {
                                const grad = CAT_GRAD[r.category] ?? ['#6C63FF', '#9C6FFF'];
                                const isSaved = saved.has(r.id);
                                return (
                                    <TouchableOpacity key={r.id} onPress={() => navigation.navigate('RoutineDetail', { routineId: r.id })} style={s.recCard} activeOpacity={0.85}>
                                        {r.image_url ? (
                                            <>
                                                <Image source={{ uri: r.image_url }} style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]} resizeMode="cover" />
                                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]} />
                                            </>
                                        ) : (
                                            <LinearGradient colors={grad} style={StyleSheet.absoluteFill} borderRadius={BorderRadius.md} />
                                        )}
                                        <TouchableOpacity onPress={() => toggleSave(r.id)} style={s.recHeart} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color={isSaved ? '#FF4D6D' : 'rgba(255,255,255,0.8)'} />
                                        </TouchableOpacity>
                                        <Text style={s.recCardTitle} numberOfLines={2}>{r.title}</Text>
                                        <Text style={s.recCardMeta}>{r.duration_minutes} min · {DIFF_LABELS[r.difficulty]}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </LinearGradient>

                    {/* Category filter */}
                    <Text style={s.filterLabel}>Categoría</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: Spacing.sm }}>
                        {CATS.map((c) => (
                            <TouchableOpacity key={c.id} onPress={() => setCatFilter(c.id)}
                                style={[s.chip, catFilter === c.id && { backgroundColor: primary + '22', borderColor: primary }]}>
                                <Text style={[s.chipText, catFilter === c.id && { color: primary }]}>{c.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Difficulty filter */}
                    <Text style={s.filterLabel}>Dificultad</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: Spacing.sm }}>
                        {DIFFS.map((d) => (
                            <TouchableOpacity key={d.id} onPress={() => setDiffFilter(d.id)}
                                style={[s.chip, diffFilter === d.id && { backgroundColor: primary + '22', borderColor: primary }]}>
                                <Text style={[s.chipText, diffFilter === d.id && { color: primary }]}>{d.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Full list */}
                    <Text style={s.sectionTitle}>Todas las rutinas ({filtered.length})</Text>
                    {filtered.map((r) => (
                        <RoutineCard key={r.id} routine={r} saved={saved.has(r.id)}
                            onPress={() => navigation.navigate('RoutineDetail', { routineId: r.id })}
                            onToggleSave={() => toggleSave(r.id)}
                            assignMode={!!assignToClientId}
                            onStart={() => assignToClientId
                                ? handleAssign(r.id, r.title)
                                : navigation.navigate('ActiveWorkout', { routineId: r.id })
                            } />
                    ))}
                </ScrollView>
            ) : (
                /* ── Saved tab ── */
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    {savedRoutines.length === 0 ? (
                        <View style={s.emptyWrap}>
                            <Text style={{ fontSize: 52 }}>🤍</Text>
                            <Text style={s.emptyTitle}>Sin rutinas guardadas</Text>
                            <Text style={s.emptySub}>Toca el ❤️ en cualquier rutina para guardarla aquí</Text>
                            <TouchableOpacity onPress={() => setTab('library')} style={[s.emptyBtn, { backgroundColor: primary }]}>
                                <Text style={s.emptyBtnText}>Ver biblioteca</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Text style={s.sectionTitle}>Mis rutinas guardadas ({savedRoutines.length})</Text>
                            {savedRoutines.map((r) => (
                                <RoutineCard key={r.id} routine={r} saved
                                    onPress={() => navigation.navigate('RoutineDetail', { routineId: r.id })}
                                    onToggleSave={() => toggleSave(r.id)}
                                    assignMode={!!assignToClientId}
                                    onStart={() => assignToClientId
                                        ? handleAssign(r.id, r.title)
                                        : navigation.navigate('ActiveWorkout', { routineId: r.id })
                                    } />
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </LinearGradient>
        <QuickWorkoutModal group={quickGroup} onClose={() => setQuickGroup(null)} />
    );
};

// ── Card styles ───────────────────────────────────────────────────────────────
const card = StyleSheet.create({
    wrap: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    // image variant
    imgWrap: { width: '100%', height: 140, position: 'relative' },
    img: { width: '100%', height: 140 },
    imgGrad: { ...StyleSheet.absoluteFillObject },
    imgHeart: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
    // no-image variant (colored bar)
    bar: { width: 5, overflow: 'hidden' },
    body: { padding: Spacing.base },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
    badgeText: { fontSize: 10, fontWeight: '700' },
    heart: { marginLeft: 'auto' },
    title: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
    desc: { fontSize: FontSizes.xs, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    startBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
    startText: { fontSize: FontSizes.xs, fontWeight: '700', color: '#fff' },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    header: { padding: Spacing.base, paddingTop: 56 },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.base },
    tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 4, gap: 4 },
    tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.md },
    tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSizes.sm },
    tabTextActive: { color: '#fff', fontWeight: '700' },
    scroll: { padding: Spacing.base, paddingBottom: 100 },
    recBanner: { borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.lg },
    recHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
    recTitle: { flex: 1, fontSize: FontSizes.sm, fontWeight: '700', color: '#fff', lineHeight: 20 },
    recCard: { width: 130, height: 110, borderRadius: BorderRadius.md, marginRight: Spacing.sm, padding: Spacing.sm, justifyContent: 'flex-end', overflow: 'hidden' },
    recHeart: { position: 'absolute', top: 8, right: 8 },
    recCardTitle: { fontSize: FontSizes.xs, fontWeight: '800', color: '#fff', lineHeight: 16, marginBottom: 4 },
    recCardMeta: { fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
    filterLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '700', marginBottom: 6, marginTop: 4 },
    filterRow: { maxHeight: 44, marginBottom: Spacing.sm },
    chip: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
    sectionTitle: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.sm, marginBottom: Spacing.md },
    emptyWrap: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
    emptyTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    emptySub: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    emptyBtn: { marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.base },
    assignBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.sm, borderWidth: 1, borderColor: '#7C3AED44' },
    assignBannerText: { flex: 1, fontSize: FontSizes.sm, fontWeight: '600', color: '#A855F7', lineHeight: 18 },
    // Quick section
    quickSection: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
    quickHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    quickTitle: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textPrimary },
    quickSub: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
});

// ── Quick group card styles ───────────────────────────────────────────────────
const qg = StyleSheet.create({
    card: { width: 110, height: 130, borderRadius: BorderRadius.lg, padding: Spacing.sm, justifyContent: 'flex-end', overflow: 'hidden', position: 'relative' },
    emoji: { fontSize: 26, marginBottom: 4 },
    label: { fontSize: FontSizes.sm, fontWeight: '800', color: '#fff' },
    count: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
    plusBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
});
