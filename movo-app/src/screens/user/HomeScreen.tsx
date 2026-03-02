import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useRoutineStore } from '../../store/routineStore';
import { useThemeStore } from '../../store/themeStore';
import { GradientCard } from '../../components/ui/GradientCard';
import { WorkoutCard } from '../../components/ui/WorkoutCard';
import { MovoLogoInline } from '../../components/ui/MovoLogo';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

const SCREEN_W = Dimensions.get('window').width;

const MOTIVATION_QUOTES = [
    { text: 'El dolor de hoy es la fuerza de mañana.', author: 'Arnold Schwarzenegger' },
    { text: 'No pares cuando estés cansado. Para cuando hayas terminado.', author: 'David Goggins' },
    { text: 'Tu único límite eres tú mismo.', author: 'Michael Jordan' },
    { text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' },
    { text: 'Los campeones no se hacen en los gimnasios. Se hacen con lo que llevan dentro.', author: 'Muhammad Ali' },
    { text: 'La disciplina es elegir entre lo que quieres ahora y lo que más quieres.', author: 'Abraham Lincoln' },
    { text: 'No cuentes los días, haz que los días cuenten.', author: 'Muhammad Ali' },
    { text: 'Si puedes soñarlo, puedes hacerlo.', author: 'Walt Disney' },
    { text: 'El único mal entrenamiento es el que no se hace.', author: 'Bruce Lee' },
    { text: 'Entrena como si fuera el último día, compite como si fuera el primero.', author: 'Cristiano Ronaldo' },
    { text: 'Cada vez que dices "no puedo", alguien en algún lugar lo está logrando.', author: 'Serena Williams' },
    { text: 'El cuerpo logra lo que la mente cree.', author: 'Roger Bannister' },
    { text: 'No te detengas cuando estés cansado. Detente cuando hayas terminado.', author: 'Kobe Bryant' },
    { text: 'El éxito usualmente viene a quienes están demasiado ocupados para buscarlo.', author: 'Henry David Thoreau' },
];

const DAILY_TIPS = [
    '💧 Bebe 500ml de agua antes de entrenar para un rendimiento óptimo.',
    '😴 El músculo crece mientras duermes. Apunta a 7-9 horas cada noche.',
    '🥗 Incluye proteína en cada comida para apoyar la recuperación muscular.',
    '🧘 5 minutos de estiramiento post-entrenamiento reducen el DOMS un 30%.',
    '⏰ El mejor momento para entrenar es cuando puedas hacerlo de forma consistente.',
    '💊 La creatina monohidrato es el suplemento más respaldado científicamente.',
    '🔥 El entrenamiento de fuerza quema calorías hasta 48h después del ejercicio.',
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuthStore();
    const { primary, gradient } = useThemeStore();
    const { assignedRoutines, stats, sessions, fetchAssigned, fetchStats, fetchSessions } = useRoutineStore();
    const [refreshing, setRefreshing] = useState(false);
    const [progressPage, setProgressPage] = useState(0);
    const progressScrollRef = useRef<ScrollView>(null);

    const load = async () => { await Promise.all([fetchAssigned(), fetchStats(), fetchSessions?.()]); };
    useEffect(() => { load(); }, []);
    // Refresh stats every time this tab comes into focus (e.g. after a workout)
    useFocusEffect(useCallback(() => { fetchStats(); fetchSessions?.(); }, []));
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días ☀️' : hour < 19 ? 'Buenas tardes 🌤️' : 'Buenas noches 🌙';
    const todayRoutine = assignedRoutines.find((ur) => ur.status === 'active');

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quote = MOTIVATION_QUOTES[dayOfYear % MOTIVATION_QUOTES.length];
    const tip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];

    const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const weeklyData = stats?.weeklyCount ?? [0, 0, 0, 0, 0, 0, 0];
    const todayIdx = (new Date().getDay() + 6) % 7;

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
            >
                {/* Header */}
                <View style={s.header}>
                    <View style={s.headerLogo}>
                        <MovoLogoInline primary={primary} />
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={s.settingsBtn}>
                        <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Greeting below logo */}
                <View style={s.greetingRow}>
                    <Text style={s.greeting}>{greeting}</Text>
                    <Text style={s.name}>{user?.full_name?.split(' ')[0] ?? 'Atleta'} 💪</Text>
                </View>

                {/* Stats strip */}
                <View style={s.statsRow}>
                    {[
                        { label: 'Racha', value: `${stats?.streak ?? 0}`, icon: '🔥', color: '#FF6B35' },
                        { label: 'Esta semana', value: `${weeklyData.reduce((a, b) => a + b, 0)}`, icon: '⚡', color: primary },
                        { label: 'Minutos', value: `${stats?.totalMinutes ?? 0}`, icon: '⏱️', color: Colors.accentYoga },
                    ].map((st) => (
                        <View key={st.label} style={s.statCard}>
                            <Text style={s.statIcon}>{st.icon}</Text>
                            <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
                            <Text style={s.statLabel}>{st.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Motivation quote */}
                <LinearGradient colors={[primary + '33', primary + '11']} style={s.quoteCard}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={primary} style={{ marginBottom: 6 }} />
                    <Text style={s.quoteText}>"{quote.text}"</Text>
                    <Text style={[s.quoteAuthor, { color: primary }]}>— {quote.author}</Text>
                </LinearGradient>

                {/* Today's workout or CTA */}
                {todayRoutine?.routine ? (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>🏋️ Rutina de hoy</Text>
                        <WorkoutCard
                            routine={todayRoutine.routine}
                            onPress={() => navigation.navigate('RoutineDetail', { routineId: todayRoutine.routine_id })}
                        />
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => navigation.navigate('Routines')} activeOpacity={0.85} style={s.ctaWrap}>
                        <LinearGradient colors={gradient} style={s.ctaBanner}>
                            <Ionicons name="barbell-outline" size={28} color="#fff" />
                            <View style={{ flex: 1 }}>
                                <Text style={s.ctaTitle}>¿Listo para entrenar?</Text>
                                <Text style={s.ctaSub}>Elige una rutina y empieza ahora</Text>
                            </View>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Quick actions */}
                <Text style={s.sectionTitle}>Acciones rápidas</Text>
                <View style={s.actionsGrid}>
                    {[
                        { icon: 'barbell-outline', label: 'Rutinas', screen: 'Routines', color: primary },
                        { icon: 'sparkles-outline', label: 'IA Coach', screen: 'AICoach', color: '#A855F7' },
                        { icon: 'nutrition-outline', label: 'Nutrición', screen: 'Nutrition', color: '#4CAF50' },
                        { icon: 'person-outline', label: 'Perfil', screen: 'Profile', color: Colors.secondary },
                    ].map((a) => (
                        <TouchableOpacity key={a.label} onPress={() => navigation.navigate(a.screen)} style={s.actionCard}>
                            <View style={[s.actionIcon, { backgroundColor: a.color + '22' }]}>
                                <Ionicons name={a.icon as any} size={24} color={a.color} />
                            </View>
                            <Text style={s.actionLabel}>{a.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Weekly activity */}
                <Text style={s.sectionTitle}>📊 Actividad semanal</Text>
                <View style={s.weekCard}>
                    {weekDays.map((day, i) => {
                        const done = weeklyData[i] > 0;
                        const isToday = i === todayIdx;
                        return (
                            <View key={day} style={s.weekDay}>
                                <View style={[
                                    s.weekDot,
                                    done && { backgroundColor: primary },
                                    isToday && !done && { borderWidth: 2, borderColor: primary },
                                ]}>
                                    {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                                </View>
                                <Text style={[s.weekLabel, isToday && { color: primary, fontWeight: '700' }]}>{day}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Progress slider */}
                <View style={s.progressHeader}>
                    <Text style={s.sectionTitle}>📈 Mi progreso</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Progress')} style={[s.seeAllBtn, { borderColor: primary + '55' }]}>
                        <Text style={[s.seeAllText, { color: primary }]}>Ver todo</Text>
                        <Ionicons name="chevron-forward" size={13} color={primary} />
                    </TouchableOpacity>
                </View>

                {/* Slider */}
                <ScrollView
                    ref={progressScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={8}
                    onScroll={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - Spacing.base * 2));
                        if (idx !== progressPage) setProgressPage(idx);
                    }}
                    onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - Spacing.base * 2));
                        setProgressPage(idx);
                    }}
                    style={{ marginBottom: Spacing.sm }}
                    decelerationRate="fast"
                >
                    {/* Card 1: barra semanal */}
                    <View style={[s.progressCard, { width: SCREEN_W - Spacing.base * 2, borderColor: primary + '33' }]}>
                        <Text style={s.progressCardTitle}>📅 Esta semana</Text>
                        <View style={s.barsRow}>
                            {weekDays.map((day, i) => {
                                const v = weeklyData[i];
                                const max = Math.max(...weeklyData, 1);
                                const pct = (v / max) * 100;
                                const isToday = i === todayIdx;
                                return (
                                    <View key={day} style={s.barCol}>
                                        <View style={s.barTrack}>
                                            {v > 0
                                                ? <LinearGradient colors={[primary, primary + 'AA']} style={[s.barFill, { height: `${Math.max(pct, 6)}%` as any }]} />
                                                : <View style={s.barEmpty} />
                                            }
                                        </View>
                                        <Text style={[s.barDay, isToday && { color: primary, fontWeight: '700' }]}>{day}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Card 2: stats numéricas */}
                    <View style={[s.progressCard, { width: SCREEN_W - Spacing.base * 2, borderColor: Colors.accentYoga + '33' }]}>
                        <Text style={s.progressCardTitle}>⚡ Actividad total</Text>
                        <View style={s.miniStatsGrid}>
                            {[
                                { emoji: '🔥', value: `${stats?.streak ?? 0}d`, label: 'Racha', color: '#FF6B35' },
                                { emoji: '🏋️', value: `${stats?.totalSessions ?? 0}`, label: 'Sesiones', color: primary },
                                { emoji: '⏱️', value: `${Math.floor((stats?.totalMinutes ?? 0) / 60)}h`, label: 'Tiempo', color: Colors.accentYoga },
                                { emoji: '📊', value: stats?.totalSessions ? `${Math.round((stats.totalMinutes ?? 0) / stats.totalSessions)}m` : '0m', label: 'Media', color: Colors.accentPilates },
                            ].map((c) => (
                                <View key={c.label} style={[s.miniStatCard, { borderColor: c.color + '33' }]}>
                                    <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
                                    <Text style={[s.miniStatVal, { color: c.color }]}>{c.value}</Text>
                                    <Text style={s.miniStatLabel}>{c.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Card 3: últimas sesiones */}
                    <View style={[s.progressCard, { width: SCREEN_W - Spacing.base * 2, borderColor: Colors.secondary + '33' }]}>
                        <Text style={s.progressCardTitle}>🗂️ Últimas sesiones</Text>
                        {(sessions ?? []).length === 0
                            ? <View style={s.progressEmpty}>
                                <Text style={{ fontSize: 28 }}>📋</Text>
                                <Text style={s.progressEmptyText}>Sin sesiones aún</Text>
                              </View>
                            : (sessions ?? []).slice(0, 3).map((sess: any, i: number) => (
                                <View key={i} style={[s.sessRow, i < Math.min((sessions ?? []).length, 3) - 1 && s.sessRowBorder]}>
                                    <View style={[s.sessIcon, { backgroundColor: primary + '22' }]}>
                                        <Ionicons name="barbell-outline" size={14} color={primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.sessName} numberOfLines={1}>{sess.routineName ?? 'Entrenamiento'}</Text>
                                        <Text style={s.sessMeta}>{sess.durationMinutes ?? 0} min · {new Date(sess.startedAt ?? '').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
                                    </View>
                                </View>
                            ))
                        }
                    </View>
                </ScrollView>

                {/* Dot indicators */}
                <View style={s.progressDots}>
                    {[0, 1, 2].map((i) => (
                        <TouchableOpacity key={i} onPress={() => {
                            setProgressPage(i);
                            progressScrollRef.current?.scrollTo({ x: i * (SCREEN_W - Spacing.base * 2), animated: true });
                        }}>
                            <View style={[s.progressDot, progressPage === i && { backgroundColor: primary, width: 18 }]} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Daily tip */}
                <View style={s.tipCard}>
                    <View style={s.tipHeader}>
                        <Ionicons name="bulb-outline" size={16} color={Colors.secondary} />
                        <Text style={s.tipTitle}>Consejo del día</Text>
                    </View>
                    <Text style={s.tipText}>{tip}</Text>
                </View>

                {/* Explore */}
                <Text style={s.sectionTitle}>Explorar categorías</Text>
                <View style={s.catRow}>
                    {[
                        { label: 'Gym', emoji: '🏋️', cat: 'gym', grad: Colors.gradientGym },
                        { label: 'Yoga', emoji: '🧘', cat: 'yoga', grad: Colors.gradientYoga },
                        { label: 'Pilates', emoji: '🌀', cat: 'pilates', grad: Colors.gradientPilates },
                    ].map((c) => (
                        <GradientCard key={c.cat} title={c.label} emoji={c.emoji} gradient={c.grad}
                            onPress={() => navigation.navigate('Routines', { category: c.cat })}
                            style={{ flex: 1 }} />
                    ))}
                </View>

                {/* AI quick access */}
                <TouchableOpacity onPress={() => navigation.navigate('AICoach')} activeOpacity={0.85}>
                    <LinearGradient colors={[primary + '33', primary + '11']} style={[s.aiCard, { borderColor: primary + '44' }]}>
                        <Text style={{ fontSize: 32 }}>🤖</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={s.aiTitle}>MOVO Coach IA</Text>
                            <Text style={s.aiSub}>¿Cómo optimizo mi entrenamiento de hoy?</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={28} color={primary} />
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { padding: Spacing.base, paddingTop: 60, paddingBottom: Spacing['3xl'] },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
    headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerBrand: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
    greetingRow: { marginBottom: Spacing.lg },
    greeting: { fontSize: FontSizes.base, color: Colors.textSecondary },
    name: { fontSize: FontSizes['3xl'], fontWeight: '900', color: Colors.textPrimary },
    settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    statIcon: { fontSize: 18, marginBottom: 4 },
    statValue: { fontSize: FontSizes.xl, fontWeight: '900' },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    quoteCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
    quoteText: { fontSize: FontSizes.base, fontStyle: 'italic', color: Colors.textPrimary, lineHeight: 22, marginBottom: Spacing.sm },
    quoteAuthor: { fontSize: FontSizes.sm, fontWeight: '700' },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
    ctaWrap: { marginBottom: Spacing.lg },
    ctaBanner: { borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    ctaTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: '#fff' },
    ctaSub: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' },
    actionsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    actionCard: { flex: 1, alignItems: 'center', gap: 6 },
    actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
    weekCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
    weekDay: { alignItems: 'center', gap: 6 },
    weekDot: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    weekLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    tipCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, borderLeftColor: Colors.secondary, marginBottom: Spacing.lg },
    tipHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    tipTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.secondary },
    tipText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
    catRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    aiCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.base },
    aiTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
    aiSub: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    // Progress slider
    progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
    seeAllText: { fontSize: FontSizes.xs, fontWeight: '700' },
    progressCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.base },
    progressCardTitle: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
    barsRow: { flexDirection: 'row', gap: 6, height: 80, alignItems: 'flex-end' },
    barCol: { flex: 1, alignItems: 'center', gap: 3 },
    barTrack: { flex: 1, width: '75%', backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
    barFill: { width: '100%', borderRadius: 4 },
    barEmpty: { width: '100%', height: 4, backgroundColor: Colors.border, borderRadius: 4 },
    barDay: { fontSize: 9, color: Colors.textSecondary },
    miniStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    miniStatCard: { width: '47%', borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 2, backgroundColor: Colors.background },
    miniStatVal: { fontSize: FontSizes.lg, fontWeight: '900' },
    miniStatLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: '600' },
    progressEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.lg },
    progressEmptyText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    sessRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8 },
    sessRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    sessIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    sessName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textPrimary },
    sessMeta: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
    progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.lg },
    progressDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.border },
});

