import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoutineStore } from '../../store/routineStore';
import { WorkoutCard } from '../../components/ui/WorkoutCard';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { RoutineCategory, Difficulty } from '../../types';

const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'gym', label: '🏋️ Gym' },
    { id: 'yoga', label: '🧘 Yoga' },
    { id: 'pilates', label: '🌀 Pilates' },
];

const difficulties = [
    { id: 'all', label: 'Todos' },
    { id: 'beginner', label: 'Principiante' },
    { id: 'intermediate', label: 'Intermedio' },
    { id: 'advanced', label: 'Avanzado' },
];

export const RoutinesScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { publicRoutines, fetchPublicRoutines, isLoading, setFilter, filter } = useRoutineStore();
    const [catFilter, setCatFilter] = useState<string>(route.params?.category ?? 'all');
    const [diffFilter, setDiffFilter] = useState<string>('all');
    const [tab, setTab] = useState<'library' | 'assigned'>('library');

    useEffect(() => {
        const category = catFilter !== 'all' ? catFilter as RoutineCategory : undefined;
        const difficulty = diffFilter !== 'all' ? diffFilter as Difficulty : undefined;
        setFilter({ category, difficulty });
    }, [catFilter, diffFilter]);

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <View style={s.header}>
                <Text style={s.heading}>Rutinas</Text>
                <View style={s.tabRow}>
                    {[{ id: 'library', label: 'Biblioteca' }, { id: 'assigned', label: 'Mis rutinas' }].map((t) => (
                        <TouchableOpacity key={t.id} onPress={() => setTab(t.id as any)}
                            style={[s.tab, tab === t.id && s.tabActive]}>
                            <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {tab === 'library' && (
                <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
                        {categories.map((c) => (
                            <TouchableOpacity key={c.id} onPress={() => setCatFilter(c.id)}
                                style={[s.chip, catFilter === c.id && s.chipActive]}>
                                <Text style={[s.chipText, catFilter === c.id && s.chipTextActive]}>{c.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
                        {difficulties.map((d) => (
                            <TouchableOpacity key={d.id} onPress={() => setDiffFilter(d.id)}
                                style={[s.chip, diffFilter === d.id && s.chipActive]}>
                                <Text style={[s.chipText, diffFilter === d.id && s.chipTextActive]}>{d.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </>
            )}

            <ScrollView contentContainerStyle={s.scroll} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchPublicRoutines} tintColor={Colors.primary} />}>
                {publicRoutines.map((r) => (
                    <WorkoutCard key={r.id} routine={r} onPress={() => navigation.navigate('RoutineDetail', { routineId: r.id })} />
                ))}
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    header: { padding: Spacing.base, paddingTop: 56 },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.base },
    tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 4 },
    tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.md },
    tabActive: { backgroundColor: Colors.primary },
    tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSizes.sm },
    tabTextActive: { color: '#fff' },
    filterRow: { maxHeight: 48 },
    chip: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
    chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
    chipTextActive: { color: Colors.primary },
    scroll: { padding: Spacing.base },
});
