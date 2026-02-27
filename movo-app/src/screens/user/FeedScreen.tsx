import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
    Image, TextInput, Modal, KeyboardAvoidingView, Platform,
    ActivityIndicator, Alert, Animated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFeedStore, Post, Comment, WorkoutData } from '../../store/feedStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

// ── Time ago helper ──────────────────────────────────────
const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
};

// ── Effort bar color helper ──────────────────────────────
const effortColor = (n: number) => {
    if (n <= 3) return '#4CAF50';
    if (n <= 6) return '#FF9800';
    if (n <= 8) return '#FF5722';
    return '#F44336';
};

// ── Workout summary embedded in post card ────────────────
const WorkoutCard: React.FC<{ data: WorkoutData; primary: string }> = ({ data, primary }) => {
    const durationMin = Math.round(data.duration_seconds / 60);
    const color = effortColor(data.effort_score);
    return (
        <View style={wc.wrap}>
            {/* Header strip */}
            <View style={[wc.strip, { backgroundColor: primary + '18', borderColor: primary + '33' }]}>
                <Ionicons name="barbell-outline" size={16} color={primary} />
                <Text style={[wc.routineName, { color: primary }]}>{data.routine_name}</Text>
                <View style={[wc.durationBadge, { borderColor: primary + '44' }]}>
                    <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                    <Text style={wc.durationText}>{durationMin}min</Text>
                </View>
            </View>

            {/* Stats row */}
            <View style={wc.statsRow}>
                {[
                    { icon: 'layers-outline',  value: String(data.total_sets),    label: 'Series' },
                    { icon: 'repeat-outline',  value: String(data.total_reps),    label: 'Reps' },
                    { icon: 'barbell-outline', value: `${data.total_weight}kg`,   label: 'Movido' },
                ].map((s) => (
                    <View key={s.label} style={wc.statCell}>
                        <Ionicons name={s.icon as any} size={14} color={Colors.textSecondary} />
                        <Text style={wc.statVal}>{s.value}</Text>
                        <Text style={wc.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Effort bar */}
            <View style={wc.effortRow}>
                <Text style={wc.effortLabel}>Esfuerzo</Text>
                <View style={wc.barRow}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <View
                            key={n}
                            style={[
                                wc.barSeg,
                                n <= data.effort_score && { backgroundColor: color, opacity: 0.85 },
                            ]}
                        />
                    ))}
                </View>
                <Text style={[wc.effortScore, { color }]}>{data.effort_score}/10</Text>
            </View>

            {/* Top 3 exercises */}
            {data.exercises.slice(0, 3).map((ex, i) => (
                <View key={i} style={wc.exRow}>
                    <View style={[wc.exDot, { backgroundColor: primary }]} />
                    <Text style={wc.exName} numberOfLines={1}>{ex.name}</Text>
                    <Text style={wc.exSets} numberOfLines={1}>
                        {ex.sets.slice(0, 4).map((s) => `${s.reps}×${s.weight > 0 ? `${s.weight}kg` : 'BW'}`).join('  ')}
                    </Text>
                </View>
            ))}
            {data.exercises.length > 3 && (
                <Text style={wc.moreEx}>+{data.exercises.length - 3} ejercicio{data.exercises.length - 3 > 1 ? 's' : ''} más</Text>
            )}
        </View>
    );
};

const wc = StyleSheet.create({
    wrap: { marginHorizontal: Spacing.base, borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface + 'AA' },
    strip: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.sm, borderBottomWidth: 1 },
    routineName: { fontWeight: '800', fontSize: FontSizes.sm, flex: 1 },
    durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    durationText: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600' },
    statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm },
    statCell: { flex: 1, alignItems: 'center', gap: 2 },
    statVal: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.textPrimary },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    effortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm },
    effortLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, minWidth: 52 },
    barRow: { flex: 1, flexDirection: 'row', gap: 2 },
    barSeg: { flex: 1, height: 8, borderRadius: 3, backgroundColor: Colors.border },
    effortScore: { fontSize: FontSizes.sm, fontWeight: '800', minWidth: 32, textAlign: 'right' },
    exRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderTopWidth: 1, borderTopColor: Colors.border + '55' },
    exDot: { width: 6, height: 6, borderRadius: 3 },
    exName: { fontSize: FontSizes.xs, color: Colors.textPrimary, fontWeight: '600', flex: 1 },
    exSets: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    moreEx: { fontSize: FontSizes.xs, color: Colors.textSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border + '55', fontStyle: 'italic' },
});

// ── Muscle photo map ─────────────────────────────────────
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
    'Full body':                'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400&q=70',
    'Cardio':                   'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=70',
    'Glúteos':                  'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&q=70',
    'Bíceps':                   'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=70',
    'Core':                     'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400&q=70',
    'Espalda baja':             'https://images.unsplash.com/photo-1570691079236-4bca6c45d440?w=400&q=70',
};
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=70';
const getMuscleImg = (muscle: string) =>
    MUSCLE_IMG[muscle] ??
    Object.entries(MUSCLE_IMG).find(([k]) => muscle?.toLowerCase().includes(k.toLowerCase()))?.[1] ??
    FALLBACK_IMG;

// ── Workout detail modal ─────────────────────────────────
const WorkoutDetailModal: React.FC<{
    post: Post | null;
    visible: boolean;
    onClose: () => void;
    primary: string;
}> = ({ post, visible, onClose, primary }) => {
    if (!post?.workout_data) return null;
    const data = post.workout_data;
    const durationMin = Math.round(data.duration_seconds / 60);
    const color = effortColor(data.effort_score);
    const effortLabels = ['', 'Suave 😌', 'Suave 😌', 'Moderado 💪', 'Moderado 💪',
        'Normal 🏃', 'Normal 🏃', 'Intenso ⚡', 'Intenso ⚡', 'Máximo 🔥', 'Máximo 🔥'];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={wd.container}>
                {/* Handle */}
                <View style={wd.handle} />

                {/* Header */}
                <View style={wd.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={wd.routineTitle} numberOfLines={1}>{data.routine_name}</Text>
                        <View style={wd.metaRow}>
                            {post.user_avatar
                                ? <Image source={{ uri: post.user_avatar }} style={wd.userAva} />
                                : <LinearGradient colors={[primary, primary + 'AA']} style={wd.userAvaFallback}>
                                    <Text style={wd.userAvaLetter}>{post.user_name[0]?.toUpperCase()}</Text>
                                  </LinearGradient>
                            }
                            <Text style={wd.userName}>{post.user_name}</Text>
                            <View style={[wd.durBadge, { borderColor: primary + '55' }]}>
                                <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
                                <Text style={wd.durText}>{durationMin}min</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={wd.closeBtn}>
                        <Ionicons name="close" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    {/* Post photo */}
                    {post.image_url && (
                        <Image source={{ uri: post.image_url }} style={wd.postPhoto} resizeMode="cover" />
                    )}

                    {/* Stats strip */}
                    <View style={wd.statsStrip}>
                        {[
                            { icon: 'layers-outline',  val: String(data.total_sets),   lbl: 'Series' },
                            { icon: 'repeat-outline',  val: String(data.total_reps),   lbl: 'Reps' },
                            { icon: 'barbell-outline', val: `${data.total_weight}kg`,  lbl: 'Movido' },
                            { icon: 'flash-outline',   val: `${data.effort_score}/10`, lbl: 'Esfuerzo' },
                        ].map((s) => (
                            <View key={s.lbl} style={wd.statCell}>
                                <Ionicons name={s.icon as any} size={16} color={primary} />
                                <Text style={[wd.statVal, s.lbl === 'Esfuerzo' && { color }]}>{s.val}</Text>
                                <Text style={wd.statLbl}>{s.lbl}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Effort bar */}
                    <View style={wd.effortSect}>
                        <View style={wd.effortBarRow}>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                <View
                                    key={n}
                                    style={[
                                        wd.seg,
                                        n <= data.effort_score && { backgroundColor: color },
                                    ]}
                                />
                            ))}
                        </View>
                        <Text style={[wd.effortLabelText, { color }]}>{effortLabels[data.effort_score]}</Text>
                    </View>

                    {/* Exercises */}
                    <Text style={wd.sectionTitle}>Ejercicios</Text>
                    {data.exercises.map((ex, i) => {
                        const img = getMuscleImg(ex.muscle_group ?? '');
                        return (
                            <View key={i} style={wd.exCard}>
                                <Image source={{ uri: img }} style={wd.exImg} resizeMode="cover" />
                                <View style={wd.exInfo}>
                                    <Text style={wd.exName} numberOfLines={2}>{ex.name}</Text>
                                    {ex.muscle_group ? (
                                        <Text style={wd.exMuscle} numberOfLines={1}>{ex.muscle_group}</Text>
                                    ) : null}
                                    <View style={wd.setsWrap}>
                                        {ex.sets.map((st, si) => (
                                            <View key={si} style={[wd.setChip, { borderColor: primary + '55', backgroundColor: primary + '14' }]}>
                                                <Text style={[wd.setChipNum, { color: primary }]}>S{si + 1}</Text>
                                                <Text style={wd.setChipVal}>
                                                    {st.reps} reps{st.weight > 0 ? ` × ${st.weight}kg` : ''}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </Modal>
    );
};

const wd = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111' },
    handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
    header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
    routineTitle: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    userAva: { width: 22, height: 22, borderRadius: 11 },
    userAvaFallback: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    userAvaLetter: { color: '#fff', fontWeight: '800', fontSize: 10 },
    userName: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },
    durBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    durText: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    postPhoto: { width: '100%', height: 260, marginBottom: Spacing.md },
    statsStrip: { flexDirection: 'row', marginHorizontal: Spacing.base, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.md, marginBottom: Spacing.md },
    statCell: { flex: 1, alignItems: 'center', gap: 3 },
    statVal: { fontSize: FontSizes.md, fontWeight: '900', color: Colors.textPrimary },
    statLbl: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    effortSect: { marginHorizontal: Spacing.base, marginBottom: Spacing.md },
    effortBarRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
    seg: { flex: 1, height: 10, borderRadius: 4, backgroundColor: Colors.border },
    effortLabelText: { fontSize: FontSizes.sm, fontWeight: '700', textAlign: 'center' },
    sectionTitle: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.textPrimary, marginHorizontal: Spacing.base, marginBottom: Spacing.sm, marginTop: Spacing.sm },
    exCard: { flexDirection: 'row', marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    exImg: { width: 80, height: 80 },
    exInfo: { flex: 1, padding: Spacing.sm, gap: 4 },
    exName: { fontSize: FontSizes.sm, fontWeight: '800', color: Colors.textPrimary, lineHeight: 18 },
    exMuscle: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontStyle: 'italic' },
    setsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
    setChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
    setChipNum: { fontSize: 10, fontWeight: '800' },
    setChipVal: { fontSize: 10, color: Colors.textPrimary, fontWeight: '600' },
});

// ── Post card ────────────────────────────────────────────
const PostCard: React.FC<{ post: Post; primary: string; onLike: () => void; onOpenComments: () => void; onOpenWorkout: () => void }> = ({ post, primary, onLike, onOpenComments, onOpenWorkout }) => (
    <View style={pc.card}>
        {/* User header */}
        <View style={pc.header}>
            {post.user_avatar
                ? <Image source={{ uri: post.user_avatar }} style={pc.avatar} />
                : <LinearGradient colors={[primary, primary + 'AA']} style={pc.avatarFallback}>
                    <Text style={pc.avatarLetter}>{post.user_name[0]?.toUpperCase()}</Text>
                </LinearGradient>
            }
            <View style={{ flex: 1 }}>
                <Text style={pc.userName}>{post.user_name}</Text>
                <Text style={pc.time}>{timeAgo(post.created_at)}</Text>
            </View>
            {post.workout_data && (
                <View style={[pc.workoutBadge, { backgroundColor: primary + '22', borderColor: primary + '44' }]}>
                    <Ionicons name="barbell-outline" size={12} color={primary} />
                    <Text style={[pc.workoutBadgeText, { color: primary }]}>Entreno</Text>
                </View>
            )}
        </View>

        {/* Content — tappable para abrir comentarios */}
        {post.content
            ? <TouchableOpacity onPress={onOpenComments} activeOpacity={0.85}>
                <Text style={pc.content}>{post.content}</Text>
              </TouchableOpacity>
            : null
        }

        {/* Workout summary card — tappable to open workout detail */}
        {post.workout_data && (
            <TouchableOpacity onPress={onOpenWorkout} activeOpacity={0.88}>
                <WorkoutCard data={post.workout_data} primary={primary} />
            </TouchableOpacity>
        )}

        {/* Image — tappable to open workout detail (if workout) or comments */}
        {post.image_url
            ? <TouchableOpacity onPress={post.workout_data ? onOpenWorkout : onOpenComments} activeOpacity={0.9}>
                <Image source={{ uri: post.image_url }} style={pc.postImage} resizeMode="cover" />
              </TouchableOpacity>
            : null
        }

        {/* Actions */}
        <View style={pc.actions}>
            <TouchableOpacity onPress={onLike} style={pc.actionBtn}>
                <Ionicons
                    name={post.liked_by_me ? 'heart' : 'heart-outline'}
                    size={22}
                    color={post.liked_by_me ? '#EF5350' : Colors.textSecondary}
                />
                <Text style={[pc.actionCount, post.liked_by_me && { color: '#EF5350' }]}>
                    {post.likes_count}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onOpenComments} style={pc.actionBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
                <Text style={pc.actionCount}>{post.comments_count ?? 0}</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const pc = StyleSheet.create({
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginHorizontal: Spacing.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base },
    avatar: { width: 38, height: 38, borderRadius: 19 },
    avatarFallback: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 16 },
    userName: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    time: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    content: { fontSize: FontSizes.base, color: Colors.textPrimary, lineHeight: 22, paddingHorizontal: Spacing.base, paddingBottom: Spacing.md },
    postImage: { width: '100%', height: 260 },
    actions: { flexDirection: 'row', gap: Spacing.lg, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionCount: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },
    workoutBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
    workoutBadgeText: { fontSize: FontSizes.xs, fontWeight: '700' },
});

// ── Comments Modal ───────────────────────────────────────
const CommentsModal: React.FC<{
    post: Post | null;
    visible: boolean;
    onClose: () => void;
    primary: string;
}> = ({ post, visible, onClose, primary }) => {
    const { comments, isLoadingComments, isAddingComment, fetchComments, addComment } = useFeedStore();
    const { user } = useAuthStore();
    const [text, setText] = useState('');
    const listRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible && post?.id) fetchComments(post.id);
    }, [visible, post?.id]);

    const postComments: Comment[] = post ? (comments[post.id] ?? []) : [];

    const handleSend = async () => {
        if (!text.trim() || !post) return;
        const draft = text;
        setText('');
        try {
            await addComment(post.id, draft);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo enviar el comentario');
            setText(draft);
        }
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={co.row}>
            {item.user_avatar
                ? <Image source={{ uri: item.user_avatar }} style={co.avatar} />
                : <LinearGradient colors={[primary, primary + 'AA']} style={co.avatarFallback}>
                    <Text style={co.avatarLetter}>{item.user_name[0]?.toUpperCase()}</Text>
                  </LinearGradient>
            }
            <View style={co.bubble}>
                <View style={co.bubbleHeader}>
                    <Text style={co.bubbleName}>{item.user_name}</Text>
                    <Text style={co.bubbleTime}>{timeAgo(item.created_at)}</Text>
                </View>
                <Text style={co.bubbleText}>{item.content}</Text>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={co.container}>
                    {/* Handle bar */}
                    <View style={co.handleBar} />

                    {/* Header */}
                    <View style={co.header}>
                        <Text style={co.headerTitle}>Comentarios</Text>
                        <TouchableOpacity onPress={onClose} style={co.closeBtn}>
                            <Ionicons name="close" size={22} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Post preview */}
                    {post && (
                        <View style={co.postPreview}>
                            {post.user_avatar
                                ? <Image source={{ uri: post.user_avatar }} style={co.previewAvatar} />
                                : <LinearGradient colors={[primary, primary + 'AA']} style={co.previewAvatarFallback}>
                                    <Text style={co.previewAvatarLetter}>{post.user_name[0]?.toUpperCase()}</Text>
                                  </LinearGradient>
                            }
                            <View style={{ flex: 1 }}>
                                <Text style={co.previewName}>{post.user_name}</Text>
                                {post.content ? <Text style={co.previewContent} numberOfLines={2}>{post.content}</Text> : null}
                            </View>
                        </View>
                    )}

                    <View style={co.divider} />

                    {/* Comments list */}
                    {isLoadingComments
                        ? <View style={co.center}><ActivityIndicator color={primary} /></View>
                        : (
                            <FlatList
                                ref={listRef}
                                data={postComments}
                                keyExtractor={(item) => item.id}
                                renderItem={renderComment}
                                contentContainerStyle={{ padding: Spacing.base, paddingBottom: Spacing.lg, flexGrow: 1 }}
                                ListEmptyComponent={
                                    <View style={co.empty}>
                                        <Ionicons name="chatbubbles-outline" size={44} color={Colors.textSecondary} />
                                        <Text style={co.emptyText}>Sé el primero en comentar</Text>
                                    </View>
                                }
                            />
                        )
                    }

                    {/* Input */}
                    <View style={[co.inputRow, { borderTopColor: Colors.border }]}>
                        <LinearGradient colors={[primary, primary + 'AA']} style={co.myAvatar}>
                            <Text style={co.myAvatarLetter}>{user?.full_name?.[0]?.toUpperCase() ?? 'M'}</Text>
                        </LinearGradient>
                        <TextInput
                            style={co.input}
                            placeholder="Escribe un comentario…"
                            placeholderTextColor={Colors.textSecondary}
                            value={text}
                            onChangeText={setText}
                            multiline
                            maxLength={300}
                            returnKeyType="send"
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!text.trim() || isAddingComment}
                            style={[co.sendBtn, { backgroundColor: text.trim() ? primary : Colors.border }]}
                        >
                            {isAddingComment
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Ionicons name="send" size={16} color="#fff" />
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const co = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111' },
    handleBar: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
    headerTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
    postPreview: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingBottom: Spacing.md },
    previewAvatar: { width: 36, height: 36, borderRadius: 18 },
    previewAvatarFallback: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    previewAvatarLetter: { color: '#fff', fontWeight: '800', fontSize: 15 },
    previewName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
    previewContent: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 18 },
    divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.base },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    empty: { alignItems: 'center', gap: Spacing.sm, paddingTop: 60 },
    emptyText: { fontSize: FontSizes.base, color: Colors.textSecondary },
    row: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignItems: 'flex-start' },
    avatar: { width: 32, height: 32, borderRadius: 16, marginTop: 2 },
    avatarFallback: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 13 },
    bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm },
    bubbleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    bubbleName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
    bubbleTime: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    bubbleText: { fontSize: FontSizes.sm, color: Colors.textPrimary, lineHeight: 19 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.base, borderTopWidth: 1, backgroundColor: '#111' },
    myAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    myAvatarLetter: { color: '#fff', fontWeight: '800', fontSize: 13 },
    input: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary, fontSize: FontSizes.sm, paddingHorizontal: Spacing.md, paddingVertical: 10, maxHeight: 100 },
    sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});

// ── Create Post Modal ────────────────────────────────────
const CreatePostModal: React.FC<{ visible: boolean; onClose: () => void; primary: string }> = ({ visible, onClose, primary }) => {
    const { createPost, isPosting } = useFeedStore();
    const { user } = useAuthStore();
    const [text, setText] = useState('');
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [imageUri, setImageUri] = useState<string | null>(null);

    const pickImage = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            allowsEditing: true,
            quality: 0.5,
            base64: true,
        });
        if (!res.canceled && res.assets[0]) {
            setImageUri(res.assets[0].uri);
            setImageBase64(res.assets[0].base64 ?? null);
        }
    };

    const handlePost = async () => {
        if (!text.trim() && !imageBase64) return;
        try {
            await createPost(text, imageBase64 ?? undefined);
            setText('');
            setImageBase64(null);
            setImageUri(null);
            onClose();
        } catch (e: any) {
            Alert.alert('Error al publicar', e?.message ?? 'Error desconocido');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={cm.container}>
                    {/* Header */}
                    <View style={cm.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={cm.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={cm.title}>Nueva publicación</Text>
                        <TouchableOpacity onPress={handlePost} disabled={isPosting || (!text.trim() && !imageBase64)} style={[cm.postBtn, { backgroundColor: primary }]}>
                            {isPosting
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={cm.postBtnText}>Publicar</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* User */}
                    <View style={cm.userRow}>
                        <LinearGradient colors={[primary, primary + 'AA']} style={cm.avatar}>
                            <Text style={cm.avatarLetter}>{user?.full_name?.[0]?.toUpperCase() ?? 'M'}</Text>
                        </LinearGradient>
                        <Text style={cm.userName}>{user?.full_name}</Text>
                    </View>

                    {/* Text input */}
                    <TextInput
                        style={cm.input}
                        placeholder="¿Qué quieres compartir? 💪"
                        placeholderTextColor={Colors.textSecondary}
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={500}
                        autoFocus
                    />

                    {/* Preview image */}
                    {imageUri && (
                        <View style={cm.previewWrap}>
                            <Image source={{ uri: imageUri }} style={cm.preview} resizeMode="cover" />
                            <TouchableOpacity style={cm.removeImg} onPress={() => { setImageUri(null); setImageBase64(null); }}>
                                <Ionicons name="close-circle" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Photo button */}
                    <TouchableOpacity onPress={pickImage} style={[cm.photoBtn, { borderColor: primary + '66' }]}>
                        <Ionicons name="image-outline" size={22} color={primary} />
                        <Text style={[cm.photoBtnText, { color: primary }]}>
                            {imageUri ? 'Cambiar foto' : 'Añadir foto'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const cm = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111', padding: Spacing.base },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
    cancel: { color: Colors.textSecondary, fontSize: FontSizes.base },
    title: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    postBtn: { paddingHorizontal: Spacing.base, paddingVertical: 8, borderRadius: BorderRadius.full },
    postBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.sm },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 16 },
    userName: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.textPrimary },
    input: { fontSize: FontSizes.md, color: Colors.textPrimary, minHeight: 100, textAlignVertical: 'top', marginBottom: Spacing.lg },
    previewWrap: { marginBottom: Spacing.md, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative' },
    preview: { width: '100%', height: 200 },
    removeImg: { position: 'absolute', top: 8, right: 8 },
    photoBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md },
    photoBtnText: { fontWeight: '600', fontSize: FontSizes.base },
});

// ── Main screen ──────────────────────────────────────────
export const FeedScreen: React.FC = () => {
    const { posts, isLoading, fetchPosts, toggleLike } = useFeedStore();
    const { primary } = useThemeStore();
    const [refreshing, setRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [workoutDetailPost, setWorkoutDetailPost] = useState<Post | null>(null);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchAnim = useRef(new Animated.Value(0)).current;
    const searchInputRef = useRef<TextInput>(null);

    useEffect(() => { fetchPosts(); }, []);
    const onRefresh = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };

    const toggleSearch = () => {
        if (searchVisible) {
            // close
            Animated.timing(searchAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
                setSearchVisible(false);
                setSearchQuery('');
            });
        } else {
            setSearchVisible(true);
            Animated.timing(searchAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start(() => {
                searchInputRef.current?.focus();
            });
        }
    };

    const filteredPosts = searchQuery.trim()
        ? posts.filter((p) =>
            p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : posts;

    const searchBarHeight = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });
    const searchBarOpacity = searchAnim;

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.header}>
                <Text style={s.heading}>🌍 Comunidad</Text>
                <View style={s.headerActions}>
                    <TouchableOpacity onPress={toggleSearch} style={[s.iconBtn, searchVisible && { backgroundColor: primary + '33', borderColor: primary + '66' }]}>
                        <Ionicons name={searchVisible ? 'close' : 'search'} size={20} color={searchVisible ? primary : Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowCreate(true)} style={[s.newPostBtn, { backgroundColor: primary }]}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={s.newPostText}>Publicar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search bar (animated) */}
            <Animated.View style={[s.searchBar, { height: searchBarHeight, opacity: searchBarOpacity }]}>
                <View style={[s.searchInner, { borderColor: primary + '55' }]}>
                    <Ionicons name="search" size={16} color={primary} />
                    <TextInput
                        ref={searchInputRef}
                        style={s.searchInput}
                        placeholder="Buscar personas o palabras clave…"
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
                {searchQuery.trim().length > 0 && (
                    <Text style={[s.searchResults, { color: primary }]}>
                        {filteredPosts.length} resultado{filteredPosts.length !== 1 ? 's' : ''}
                    </Text>
                )}
            </Animated.View>

            {isLoading && posts.length === 0
                ? <View style={s.center}><ActivityIndicator color={primary} size="large" /></View>
                : (
                    <FlatList
                        data={filteredPosts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <PostCard
                                post={item}
                                primary={primary}
                                onLike={() => toggleLike(item.id)}
                                onOpenComments={() => setSelectedPost(item)}
                                onOpenWorkout={() => setWorkoutDetailPost(item)}
                            />
                        )}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
                        contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 100 }}
                        ListEmptyComponent={
                            searchQuery.trim()
                            ? (
                                <View style={s.empty}>
                                    <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
                                    <Text style={s.emptyTitle}>Sin resultados</Text>
                                    <Text style={s.emptySub}>No hay publicaciones ni personas que coincidan con "{searchQuery}"</Text>
                                </View>
                            ) : (
                                <View style={s.empty}>
                                    <Text style={{ fontSize: 48 }}>🏋️</Text>
                                    <Text style={s.emptyTitle}>¡Sé el primero en publicar!</Text>
                                    <Text style={s.emptySub}>Comparte tu entrenamiento, progreso o motivación con la comunidad.</Text>
                                    <TouchableOpacity onPress={() => setShowCreate(true)} style={[s.emptyBtn, { backgroundColor: primary }]}>
                                        <Text style={s.emptyBtnText}>Crear publicación</Text>
                                    </TouchableOpacity>
                                </View>
                            )
                        }
                    />
                )
            }

            <CreatePostModal visible={showCreate} onClose={() => setShowCreate(false)} primary={primary} />
            <CommentsModal
                post={selectedPost}
                visible={selectedPost !== null}
                onClose={() => setSelectedPost(null)}
                primary={primary}
            />
            <WorkoutDetailModal
                post={workoutDetailPost}
                visible={workoutDetailPost !== null}
                onClose={() => setWorkoutDetailPost(null)}
                primary={primary}
            />
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 60, paddingBottom: Spacing.md },
    heading: { fontSize: FontSizes['2xl'], fontWeight: '900', color: Colors.textPrimary },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
    newPostBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full },
    newPostText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.sm },
    searchBar: { overflow: 'hidden', paddingHorizontal: Spacing.base },
    searchInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.full, borderWidth: 1, paddingHorizontal: Spacing.md, height: 40 },
    searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSizes.sm, paddingVertical: 0 },
    searchResults: { fontSize: FontSizes.xs, fontWeight: '600', marginTop: 4, marginLeft: Spacing.md },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', gap: Spacing.md, paddingTop: 80, paddingHorizontal: 40 },
    emptyTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    emptySub: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    emptyBtn: { paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.base },
});
