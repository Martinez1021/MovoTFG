import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Alert, ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFeedStore } from '../../store/feedStore';
import { useRoutineStore } from '../../store/routineStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

const W = Dimensions.get('window').width;

export interface WorkoutSummaryParams {
    routineId: string;
    routineName: string;
    elapsedSeconds: number;
    exerciseNames: string[];
    exerciseMuscles: string[];
    // per-exercise array of set rows
    sets: Array<Array<{ reps: string; weight: string; done: boolean }>>;
}

const EFFORT_LABELS = [
    'Muy suave 😴',
    'Suave 🧘',
    'Ligero 🚶',
    'Moderado 🏃',
    'Activo 💪',
    'Exigente 🔥',
    'Intenso ⚡',
    'Muy intenso 🌋',
    'Extremo 💀',
    'Límite total 🏆',
];

const effortBarColor = (n: number): string => {
    if (n <= 3) return '#4CAF50';
    if (n <= 6) return '#FF9800';
    if (n <= 8) return '#FF5722';
    return '#F44336';
};

export const WorkoutSummaryScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const {
        routineName,
        elapsedSeconds,
        exerciseNames,
        exerciseMuscles,
        sets,
    }: WorkoutSummaryParams = route.params;

    const { createWorkoutPost } = useFeedStore();
    const { recordLocalWorkout } = useRoutineStore();
    const { primary, gradient } = useThemeStore();
    const [effortScore, setEffortScore] = useState(7);
    const [sharing, setSharing] = useState(false);
    const [photoBase64, setPhotoBase64] = useState<string | null>(null);

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 3600)).padStart(2, '0') !== '00'
            ? String(Math.floor(s / 3600)).padStart(2, '0') + ':'
            : ''}${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // Build workout summary data
    const exercises = exerciseNames.map((name, i) => {
        const exSets = (sets[i] ?? [])
            .filter((r) => r.reps || r.weight)
            .map((r) => ({ reps: parseInt(r.reps) || 0, weight: parseFloat(r.weight) || 0 }));
        return { name, muscle_group: exerciseMuscles[i] ?? '', sets: exSets };
    });

    const totalSets  = exercises.reduce((a, e) => a + e.sets.length, 0);
    const totalReps  = exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.reps, 0), 0);
    const totalWeight = Math.round(
        exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0)
    );

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería para adjuntar fotos.');
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true,
        });
        if (!res.canceled && res.assets?.[0]?.base64) setPhotoBase64(res.assets[0].base64);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos necesarios', 'Necesitamos acceso a la cámara.');
            return;
        }
        const res = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true,
        });
        if (!res.canceled && res.assets?.[0]?.base64) setPhotoBase64(res.assets[0].base64);
    };

    const handleShare = async () => {
        setSharing(true);
        // Update home stats immediately
        recordLocalWorkout(elapsedSeconds);
        try {
            await createWorkoutPost({
                routine_name: routineName,
                duration_seconds: elapsedSeconds,
                effort_score: effortScore,
                total_sets: totalSets,
                total_reps: totalReps,
                total_weight: totalWeight,
                exercises,
                photo_base64: photoBase64 ?? undefined,
            });
            Alert.alert('¡Publicado! 🎉', 'Tu entrenamiento ya es visible en el feed.');
            navigation.navigate('MainTabs');
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo publicar');
        } finally {
            setSharing(false);
        }
    };

    const handleFinishWithoutShare = () => {
        recordLocalWorkout(elapsedSeconds);
        navigation.navigate('MainTabs');
    };

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Hero ── */}
                <LinearGradient colors={[primary + '55', primary + '11']} style={ss.hero}>
                    <Text style={ss.heroEmoji}>🏆</Text>
                    <Text style={ss.heroTitle}>¡Entrenamiento{'\n'}Completado!</Text>
                    <Text style={ss.heroSub}>{routineName}</Text>
                    <View style={ss.timerBadge}>
                        <Ionicons name="time-outline" size={16} color={primary} />
                        <Text style={[ss.timerText, { color: primary }]}>{formatTime(elapsedSeconds)}</Text>
                    </View>
                </LinearGradient>

                {/* ── Stats strip ── */}
                <View style={ss.statsRow}>
                    {[
                        { icon: 'layers-outline',  value: String(totalSets),    label: 'Series' },
                        { icon: 'repeat-outline',  value: String(totalReps),    label: 'Reps' },
                        { icon: 'barbell-outline', value: `${totalWeight}`,     label: 'kg total' },
                        { icon: 'fitness-outline', value: String(exercises.length), label: 'Ejercicios' },
                    ].map((st) => (
                        <View key={st.label} style={ss.statCard}>
                            <Ionicons name={st.icon as any} size={18} color={primary} />
                            <Text style={[ss.statVal, { color: primary }]}>{st.value}</Text>
                            <Text style={ss.statLabel}>{st.label}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Effort score ── */}
                <View style={ss.section}>
                    <View style={ss.sectionHeader}>
                        <Ionicons name="flash-outline" size={18} color={primary} />
                        <Text style={ss.sectionTitle}>Rasgo de esfuerzo</Text>
                        <View style={[ss.scoreBadge, { backgroundColor: effortBarColor(effortScore) + '33', borderColor: effortBarColor(effortScore) }]}>
                            <Text style={[ss.scoreNum, { color: effortBarColor(effortScore) }]}>
                                {effortScore}/10
                            </Text>
                        </View>
                    </View>

                    <Text style={ss.effortLabel}>{EFFORT_LABELS[effortScore - 1]}</Text>

                    {/* Interactive bar */}
                    <View style={ss.barRow}>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                            const active = n <= effortScore;
                            const color = effortBarColor(effortScore);
                            return (
                                <TouchableOpacity
                                    key={n}
                                    onPress={() => setEffortScore(n)}
                                    style={[
                                        ss.barSegment,
                                        active && { backgroundColor: color, borderColor: color },
                                    ]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[ss.barNum, active && { color: '#fff' }]}>{n}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Exercise breakdown ── */}
                <View style={ss.section}>
                    <View style={ss.sectionHeader}>
                        <Ionicons name="list-outline" size={18} color={primary} />
                        <Text style={ss.sectionTitle}>Desglose de ejercicios</Text>
                    </View>
                    {exercises.map((ex, i) => (
                        <View key={i} style={[ss.exRow, i < exercises.length - 1 && ss.exRowBorder]}>
                            <View style={{ flex: 1 }}>
                                <Text style={ss.exName}>{ex.name}</Text>
                                {!!ex.muscle_group && (
                                    <Text style={ss.exMuscle}>{ex.muscle_group}</Text>
                                )}
                            </View>
                            <View style={ss.setsWrap}>
                                {ex.sets.length === 0
                                    ? <Text style={ss.noSets}>—</Text>
                                    : ex.sets.map((s, si) => (
                                        <View key={si} style={[ss.setChip, { backgroundColor: primary + '22', borderColor: primary + '44' }]}>
                                            <Text style={[ss.setChipText, { color: primary }]}>
                                                {s.reps}×{s.weight > 0 ? `${s.weight}kg` : 'BW'}
                                            </Text>
                                        </View>
                                    ))
                                }
                            </View>
                        </View>
                    ))}
                </View>

                {/* ── Photo section ── */}
                <View style={ss.section}>
                    <View style={ss.sectionHeader}>
                        <Ionicons name="camera-outline" size={18} color={primary} />
                        <Text style={ss.sectionTitle}>Añadir foto al post</Text>
                        <Text style={ss.optionalTag}>opcional</Text>
                    </View>
                    {photoBase64 ? (
                        <View style={ss.photoWrap}>
                            <Image
                                source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
                                style={ss.photoPreview}
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                onPress={() => setPhotoBase64(null)}
                                style={ss.photoRemoveBtn}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="close-circle" size={28} color="#EF5350" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={ss.photoBtnRow}>
                            <TouchableOpacity onPress={takePhoto} style={[ss.photoBtn, { borderColor: primary + '55' }]} activeOpacity={0.8}>
                                <Ionicons name="camera-outline" size={22} color={primary} />
                                <Text style={[ss.photoBtnText, { color: primary }]}>Cámara</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={pickPhoto} style={[ss.photoBtn, { borderColor: primary + '55' }]} activeOpacity={0.8}>
                                <Ionicons name="images-outline" size={22} color={primary} />
                                <Text style={[ss.photoBtnText, { color: primary }]}>Galería</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ── Share button ── */}
                <TouchableOpacity
                    onPress={handleShare}
                    disabled={sharing}
                    style={ss.shareBtnWrap}
                    activeOpacity={0.85}
                >
                    <LinearGradient colors={gradient} style={ss.shareBtn}>
                        {sharing
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Ionicons name="share-social-outline" size={20} color="#fff" />
                                <Text style={ss.shareBtnText}>Compartir al feed</Text>
                              </>
                        }
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleFinishWithoutShare}
                    style={ss.skipBtn}
                    activeOpacity={0.7}
                >
                    <Text style={ss.skipText}>Terminar sin compartir</Text>
                </TouchableOpacity>

                <View style={{ height: 48 }} />
            </ScrollView>
        </LinearGradient>
    );
};

const ss = StyleSheet.create({
    scroll: { paddingBottom: 40 },

    // Hero
    hero: {
        alignItems: 'center',
        paddingTop: 70, paddingBottom: 36, paddingHorizontal: 24,
    },
    heroEmoji: { fontSize: 54, marginBottom: 10 },
    heroTitle: {
        fontSize: 30, fontWeight: '900', color: Colors.textPrimary,
        textAlign: 'center', lineHeight: 36,
    },
    heroSub: {
        fontSize: FontSizes.base, color: Colors.textSecondary, marginTop: 8,
        fontWeight: '600',
    },
    timerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
        backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
        paddingHorizontal: 18, paddingVertical: 8,
        borderWidth: 1, borderColor: Colors.border,
    },
    timerText: { fontSize: FontSizes.lg, fontWeight: '800' },

    // Stats
    statsRow: {
        flexDirection: 'row', paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.lg, gap: Spacing.sm,
    },
    statCard: {
        flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
        padding: Spacing.md, alignItems: 'center', gap: 4,
        borderWidth: 1, borderColor: Colors.border,
    },
    statVal: { fontSize: FontSizes.lg, fontWeight: '900' },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'center' },

    // Section
    section: {
        marginHorizontal: Spacing.base, marginBottom: Spacing.lg,
        backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
        padding: Spacing.base, borderWidth: 1, borderColor: Colors.border,
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSizes.base, fontWeight: '700',
        color: Colors.textPrimary, flex: 1,
    },
    scoreBadge: {
        borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1.5,
    },
    scoreNum: { fontSize: FontSizes.base, fontWeight: '900' },

    // Effort bar
    effortLabel: {
        fontSize: FontSizes.sm, color: Colors.textSecondary,
        marginBottom: Spacing.md, fontStyle: 'italic',
    },
    barRow: { flexDirection: 'row', gap: 3 },
    barSegment: {
        flex: 1, backgroundColor: Colors.border + '55',
        borderRadius: 6, paddingVertical: 11,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'transparent',
    },
    barNum: { fontSize: 11, fontWeight: '800', color: Colors.textMuted },

    // Exercise breakdown
    exRow: { paddingVertical: Spacing.md },
    exRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    exName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
    exMuscle: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    setsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
    noSets: { color: Colors.textMuted, fontSize: FontSizes.sm },
    setChip: {
        borderRadius: BorderRadius.full, paddingHorizontal: 9,
        paddingVertical: 3, borderWidth: 1,
    },
    setChipText: { fontSize: 11, fontWeight: '700' },

    // CTA buttons
    shareBtnWrap: { marginHorizontal: Spacing.base, marginBottom: Spacing.md },
    shareBtn: {
        borderRadius: BorderRadius.xl, paddingVertical: 17,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10,
    },
    shareBtnText: {
        color: '#fff', fontSize: FontSizes.base,
        fontWeight: '800', letterSpacing: 0.5,
    },
    skipBtn: { alignItems: 'center', paddingVertical: 14 },
    skipText: { color: Colors.textSecondary, fontSize: FontSizes.sm },

    // Photo picker
    optionalTag: { fontSize: FontSizes.xs, color: Colors.textMuted, fontStyle: 'italic' },
    photoBtnRow: { flexDirection: 'row', gap: Spacing.md },
    photoBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderWidth: 1.5, borderRadius: BorderRadius.lg,
        paddingVertical: 14, backgroundColor: Colors.background,
    },
    photoBtnText: { fontSize: FontSizes.sm, fontWeight: '700' },
    photoWrap: { position: 'relative', borderRadius: BorderRadius.lg, overflow: 'hidden' },
    photoPreview: { width: '100%', height: 200, borderRadius: BorderRadius.lg },
    photoRemoveBtn: { position: 'absolute', top: 8, right: 8 },
});
