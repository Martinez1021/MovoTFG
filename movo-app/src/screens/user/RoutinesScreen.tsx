import React, { useEffect, useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../store/routineStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { Routine } from '../../types';
import { CATALOGUE, GOAL_TAGS, GOAL_LABEL } from '../../utils/catalogue';

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
}> = ({ routine, saved, onPress, onToggleSave }) => {
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
                    <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={card.startBtn}>
                        <Text style={card.startText}>Empezar</Text>
                        <Ionicons name="arrow-forward" size={13} color="#fff" />
                    </LinearGradient>
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

    const [catFilter, setCatFilter] = useState<string>(route.params?.category ?? 'all');
    const [diffFilter, setDiffFilter] = useState<string>('all');
    const [tab, setTab] = useState<'library' | 'saved'>('library');
    const [saved, setSaved] = useState<Set<string>>(new Set());

    useEffect(() => { fetchPublicRoutines(); }, []);

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
                <Text style={s.heading}>Rutinas</Text>
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
                                        <LinearGradient colors={grad} style={StyleSheet.absoluteFill} borderRadius={BorderRadius.md} />
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
                            onToggleSave={() => toggleSave(r.id)} />
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
                                    onToggleSave={() => toggleSave(r.id)} />
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </LinearGradient>
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
});
