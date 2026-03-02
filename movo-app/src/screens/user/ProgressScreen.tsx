import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    Dimensions, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../store/routineStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Slide 1: Actividad semanal ───────────────────────────
const SlideWeek: React.FC<{ data: number[]; primary: string }> = ({ data, primary }) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const max = Math.max(...data, 1);
    const total = data.reduce((a, b) => a + b, 0);
    const todayIdx = (new Date().getDay() + 6) % 7;
    return (
        <View style={sl.wrap}>
            <Text style={sl.title}>📅 Actividad semanal</Text>
            <Text style={sl.sub}>{total === 0 ? 'Sin entrenamientos esta semana' : `${total} sesión${total > 1 ? 'es' : ''} esta semana`}</Text>
            <View style={sl.barsRow}>
                {data.map((v, i) => {
                    const pct = max > 0 ? (v / max) * 100 : 0;
                    const isToday = i === todayIdx;
                    return (
                        <View key={i} style={sl.barCol}>
                            <Text style={sl.barVal}>{v > 0 ? v : ''}</Text>
                            <View style={sl.barTrack}>
                                {v > 0 ? (
                                    <LinearGradient
                                        colors={[primary, primary + 'AA']}
                                        style={[sl.barFill, { height: `${Math.max(pct, 8)}%` }]}
                                    />
                                ) : (
                                    <View style={sl.barEmpty} />
                                )}
                            </View>
                            <Text style={[sl.barDay, isToday && { color: primary, fontWeight: '700' }]}>{days[i]}</Text>
                            {isToday && <View style={[sl.todayDot, { backgroundColor: primary }]} />}
                        </View>
                    );
                })}
            </View>
            {total === 0 && (
                <View style={sl.emptyBox}>
                    <Text style={{ fontSize: 32 }}>😴</Text>
                    <Text style={sl.emptyText}>¡Esta semana aún no has entrenado!</Text>
                    <Text style={sl.emptySub}>Cada sesión cuenta, aunque sea 20 minutos.</Text>
                </View>
            )}
        </View>
    );
};

// ── Slide 2: Estadísticas de tiempo ─────────────────────
const SlideStats: React.FC<{
    stats: any; primary: string;
    onSeed?: () => void; seeding?: boolean;
}> = ({ stats, primary, onSeed, seeding }) => {
    const totalSessions = stats?.totalSessions ?? 0;
    const totalMinutes = stats?.totalMinutes ?? 0;
    const streak = stats?.streak ?? 0;
    const avgMin = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const cards = [
        { emoji: '⏱️', value: hours > 0 ? `${hours}h ${mins}m` : `${mins} min`, label: 'Tiempo total', color: Colors.accentYoga },
        { emoji: '🏋️', value: `${totalSessions}`, label: 'Sesiones totales', color: primary },
        { emoji: '🔥', value: `${streak} días`, label: 'Racha actual', color: Colors.secondary },
        { emoji: '📊', value: `${avgMin} min`, label: 'Media por sesión', color: Colors.accentPilates },
    ];
    return (
        <View style={sl.wrap}>
            <Text style={sl.title}>⚡ Tiempo de actividad</Text>
            <Text style={sl.sub}>Tu rendimiento acumulado</Text>
            <View style={sl.statsGrid}>
                {cards.map((c) => (
                    <View key={c.label} style={sl.statCard}>
                        <Text style={{ fontSize: 28 }}>{c.emoji}</Text>
                        <Text style={[sl.statValue, { color: c.color }]}>{c.value}</Text>
                        <Text style={sl.statLabel}>{c.label}</Text>
                    </View>
                ))}
            </View>
            {totalMinutes === 0 && (
                <View style={sl.emptyBox}>
                    <Text style={{ fontSize: 32 }}>🎯</Text>
                    <Text style={sl.emptyText}>Aún sin datos de actividad</Text>
                    <Text style={sl.emptySub}>Completa entrenamientos para ver tus estadísticas.</Text>
                    {onSeed && (
                        <TouchableOpacity
                            onPress={onSeed}
                            disabled={seeding}
                            style={[sl.seedBtn, { backgroundColor: primary + '22', borderColor: primary + '55' }]}
                        >
                            {seeding
                                ? <ActivityIndicator size="small" color={primary} />
                                : <><Text style={{ fontSize: 16 }}>🗄️</Text><Text style={[sl.seedBtnText, { color: primary }]}>Cargar datos de ejemplo</Text></>
                            }
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};            )}
        </View>
    );
};

// ── Slide 3: Historial de sesiones ──────────────────────
const SlideHistory: React.FC<{ sessions: any[]; primary: string }> = ({ sessions, primary }) => (
    <View style={sl.wrap}>
        <Text style={sl.title}>🗂️ Historial</Text>
        <Text style={sl.sub}>{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} completadas</Text>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {sessions.length === 0 ? (
                <View style={[sl.emptyBox, { marginTop: 40 }]}>
                    <Text style={{ fontSize: 32 }}>📋</Text>
                    <Text style={sl.emptyText}>Sin sesiones registradas</Text>
                    <Text style={sl.emptySub}>Aquí aparecerán tus entrenamientos completados.</Text>
                </View>
            ) : (
                sessions.slice(0, 20).map((s, i) => {
                    const date = new Date(s.startedAt);
                    const label = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    return (
                        <View key={s.id ?? i} style={sl.sessionRow}>
                            <View style={[sl.sessionIcon, { backgroundColor: primary + '22' }]}>
                                <Ionicons name="barbell-outline" size={18} color={primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={sl.sessionTitle}>{s.routineName ?? 'Sesión de entrenamiento'}</Text>
                                <Text style={sl.sessionMeta}>{label} · {s.durationMinutes ?? 0} min</Text>
                            </View>
                            {s.rating ? <Text style={{ fontSize: 13 }}>{'⭐'.repeat(s.rating)}</Text> : null}
                        </View>
                    );
                })
            )}
        </ScrollView>
    </View>
);

// ── Main screen ─────────────────────────────────────────
const SLIDES = ['Semana', 'Actividad', 'Historial'];

export const ProgressScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const { stats, sessions, fetchStats, fetchSessions, isLoading, seedDemoSessions } = useRoutineStore();
    const { primary } = useThemeStore();
    const [refreshing, setRefreshing] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [page, setPage] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const load = async () => { await Promise.all([fetchStats(), fetchSessions()]); };
    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleSeed = async () => {
        Alert.alert(
            'Cargar datos de ejemplo',
            'Se crearán 35 sesiones de entrenamiento de los últimos 60 días para ver cómo queda el progreso.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cargar', onPress: async () => {
                        setSeeding(true);
                        const result = await seedDemoSessions();
                        setSeeding(false);
                        if (result.error) {
                            Alert.alert('Info', result.error);
                        } else {
                            Alert.alert('✅ Listo', `Se insertaron ${result.inserted} sesiones.`);
                        }
                    },
                },
            ]
        );
    };

    const goTo = (idx: number) => {
        setPage(idx);
        scrollRef.current?.scrollTo({ x: idx * SCREEN_W, animated: true });
    };

    const weeklyData = stats?.weeklyCount ?? [0, 0, 0, 0, 0, 0, 0];

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {navigation?.canGoBack?.() && (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    )}
                    <Text style={s.heading}>📈 Progreso</Text>
                </View>
                <TouchableOpacity onPress={() => { setRefreshing(true); load().then(() => setRefreshing(false)); }}>
                    <Ionicons name="refresh-outline" size={22} color={isLoading || refreshing ? primary : Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Tab pills */}
            <View style={s.tabs}>
                {SLIDES.map((label, i) => (
                    <TouchableOpacity key={label} onPress={() => goTo(i)} style={[s.tab, page === i && { backgroundColor: primary }]}>
                        <Text style={[s.tabText, page === i && { color: '#fff', fontWeight: '700' }]}>{label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Slider */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                    setPage(idx);
                }}
                style={{ flex: 1 }}
            >
                {/* Slide 1 */}
                <View style={{ width: SCREEN_W }}>
                    <SlideWeek data={weeklyData} primary={primary} />
                </View>
                {/* Slide 2 */}
                <View style={{ width: SCREEN_W }}>
                    <SlideStats stats={stats} primary={primary} onSeed={handleSeed} seeding={seeding} />
                </View>
                {/* Slide 3 */}
                <View style={{ width: SCREEN_W }}>
                    <SlideHistory sessions={sessions} primary={primary} />
                </View>
            </ScrollView>

            {/* Dot indicators */}
            <View style={s.dots}>
                {SLIDES.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => goTo(i)}>
                        <View style={[s.dot, page === i && { backgroundColor: primary, width: 20 }]} />
                    </TouchableOpacity>
                ))}
            </View>
        </LinearGradient>
    );
};

// ── Slide shared styles ──────────────────────────────────
const sl = StyleSheet.create({
    wrap: { flex: 1, padding: Spacing.base, paddingBottom: Spacing['2xl'] },
    title: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
    sub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
    barsRow: { flexDirection: 'row', gap: 6, height: 160, alignItems: 'flex-end', marginBottom: Spacing.lg },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    barTrack: { flex: 1, width: '75%', backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
    barFill: { width: '100%', borderRadius: 6 },
    barEmpty: { width: '100%', height: 4, backgroundColor: Colors.border, borderRadius: 6 },
    barVal: { fontSize: FontSizes.xs, color: Colors.textSecondary, height: 14 },
    barDay: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
    emptyBox: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl },
    emptyText: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
    emptySub: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    statCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 6 },
    statValue: { fontSize: FontSizes.xl, fontWeight: '800' },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'center' },
    sessionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
    sessionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    sessionTitle: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.textPrimary },
    sessionMeta: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    seedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: 10, marginTop: 4 },
    seedBtnText: { fontSize: FontSizes.sm, fontWeight: '700' },
});

// ── Screen styles ────────────────────────────────────────
const s = StyleSheet.create({
    backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
    heading: { fontSize: FontSizes['2xl'], fontWeight: '900', color: Colors.textPrimary },
    tabs: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, marginBottom: Spacing.base },
    tab: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    tabText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, paddingBottom: 30, paddingTop: Spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
});
