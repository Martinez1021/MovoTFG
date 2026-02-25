import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoutineStore } from '../../store/routineStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

const WeekBar: React.FC<{ data: number[] }> = ({ data }) => {
    const max = Math.max(...data, 1);
    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return (
        <View style={wb.row}>
            {data.map((v, i) => (
                <View key={i} style={wb.col}>
                    <View style={wb.barWrap}>
                        <LinearGradient colors={Colors.gradientPrimary} style={[wb.bar, { height: `${(v / max) * 100}%` }]} />
                    </View>
                    <Text style={wb.dayLabel}>{days[i]}</Text>
                </View>
            ))}
        </View>
    );
};
const wb = StyleSheet.create({
    row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 90, marginTop: Spacing.md },
    col: { flex: 1, alignItems: 'center', gap: 4 },
    barWrap: { flex: 1, width: '80%', backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
    bar: { width: '100%', borderRadius: 4, minHeight: 4 },
    dayLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
});

export const ProgressScreen: React.FC = () => {
    const { stats, sessions, fetchStats, fetchSessions, isLoading } = useRoutineStore();
    const [refreshing, setRefreshing] = React.useState(false);
    const load = async () => { await Promise.all([fetchStats(), fetchSessions()]); };

    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const statCards = [
        { label: 'Sesiones totales', value: stats?.totalSessions ?? 0, emoji: '🏋️', color: Colors.primary },
        { label: 'Minutos totales', value: stats?.totalMinutes ?? 0, emoji: '⏱️', color: Colors.accentYoga },
        { label: 'Racha actual', value: `${stats?.streak ?? 0} días`, emoji: '🔥', color: Colors.secondary },
    ];

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />}>
                <Text style={s.heading}>Tu Progreso</Text>

                {/* Stat cards */}
                <View style={s.statsGrid}>
                    {statCards.map((c) => (
                        <View key={c.label} style={s.statCard}>
                            <Text style={s.statEmoji}>{c.emoji}</Text>
                            <Text style={[s.statValue, { color: c.color }]}>{c.value}</Text>
                            <Text style={s.statLabel}>{c.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Weekly activity */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Actividad semanal</Text>
                    <WeekBar data={stats?.weeklyCount ?? [0, 0, 0, 0, 0, 0, 0]} />
                </View>

                {/* Recent sessions */}
                <Text style={s.sectionTitle}>Sesiones recientes</Text>
                {sessions.slice(0, 10).map((session) => (
                    <View key={session.id} style={s.sessionRow}>
                        <View style={s.sessionDot} />
                        <View style={s.sessionInfo}>
                            <Text style={s.sessionTitle}>{session.routine?.title ?? 'Sesión'}</Text>
                            <Text style={s.sessionMeta}>
                                {new Date(session.started_at).toLocaleDateString('es')} · {session.duration_minutes ?? 0} min
                            </Text>
                        </View>
                        {session.rating && (
                            <View style={s.ratingBadge}>
                                <Text style={s.ratingText}>{'⭐'.repeat(session.rating)}</Text>
                            </View>
                        )}
                    </View>
                ))}

                {sessions.length === 0 && (
                    <Text style={s.emptyText}>Aún no tienes sesiones completadas. ¡Empieza a entrenar! 💪</Text>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { padding: Spacing.base, paddingTop: 60 },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
    statsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    statEmoji: { fontSize: 24, marginBottom: 4 },
    statValue: { fontSize: FontSizes.xl, fontWeight: '800' },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
    cardTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
    sessionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    sessionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginRight: Spacing.md },
    sessionInfo: { flex: 1 },
    sessionTitle: { color: Colors.textPrimary, fontWeight: '600', fontSize: FontSizes.base },
    sessionMeta: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: 2 },
    ratingBadge: { marginLeft: Spacing.sm },
    ratingText: { fontSize: FontSizes.sm },
    emptyText: { color: Colors.textSecondary, textAlign: 'center', fontSize: FontSizes.base, marginTop: Spacing['2xl'] },
});
