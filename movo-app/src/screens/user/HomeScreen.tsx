import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useRoutineStore } from '../../store/routineStore';
import { GradientCard } from '../../components/ui/GradientCard';
import { WorkoutCard } from '../../components/ui/WorkoutCard';
import { Colors, Spacing, FontSizes, BorderRadius, CategoryColors } from '../../utils/constants';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuthStore();
    const { assignedRoutines, stats, fetchAssigned, fetchStats, isLoading } = useRoutineStore();

    const [refreshing, setRefreshing] = React.useState(false);
    const load = async () => { await Promise.all([fetchAssigned(), fetchStats()]); };

    useEffect(() => { load(); }, []);

    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    const todayRoutine = assignedRoutines.find((ur) => ur.status === 'active');

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.greeting}>{greeting} 👋</Text>
                        <Text style={s.name}>{user?.full_name?.split(' ')[0] ?? 'Atleta'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                        <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Stats strip */}
                <View style={s.statsRow}>
                    {[
                        { label: 'Racha', value: `${stats?.streak ?? 0}🔥`, color: Colors.secondary },
                        { label: 'Esta semana', value: `${(stats?.weeklyCount ?? []).reduce((a, b) => a + b, 0)} sesiones`, color: Colors.primary },
                        { label: 'Total min', value: `${stats?.totalMinutes ?? 0}`, color: Colors.accentYoga },
                    ].map((st) => (
                        <View key={st.label} style={s.statCard}>
                            <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
                            <Text style={s.statLabel}>{st.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Workout of the day */}
                {todayRoutine?.routine && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Rutina de hoy</Text>
                        <WorkoutCard
                            routine={todayRoutine.routine}
                            onPress={() => navigation.navigate('RoutineDetail', { routineId: todayRoutine.routine_id })}
                        />
                    </View>
                )}

                {/* Category cards */}
                <Text style={s.sectionTitle}>Explorar</Text>
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

                {/* All assigned routines */}
                {assignedRoutines.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Mis rutinas asignadas</Text>
                        {assignedRoutines.map((ur) => ur.routine && (
                            <WorkoutCard key={ur.id} routine={ur.routine}
                                onPress={() => navigation.navigate('RoutineDetail', { routineId: ur.routine_id })} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { padding: Spacing.base, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    greeting: { fontSize: FontSizes.base, color: Colors.textSecondary },
    name: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary },
    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    statValue: { fontSize: FontSizes.md, fontWeight: '800' },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
    catRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
});
