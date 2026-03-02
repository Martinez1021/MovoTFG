import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch, Dimensions, Modal, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useRoutineStore } from '../../store/routineStore';
import { useFeedStore, Comment, WorkoutData } from '../../store/feedStore';
import { supabase } from '../../services/supabase';
import { Colors, Spacing, FontSizes, BorderRadius, Goals, ActivityLevels } from '../../utils/constants';
import { useThemeStore } from '../../store/themeStore';

const W = Dimensions.get('window').width;
const GRID_SIZE = Math.floor((W - 8) / 3);

type Tab = 'posts' | 'entrenos' | 'ajustes';

// ── Helpers ─────────────────────────────────────────────────────
const effortColor = (n: number) => {
    if (n <= 3) return '#4CAF50';
    if (n <= 6) return '#FF9800';
    if (n <= 8) return '#FF5722';
    return '#F44336';
};
const MUSCLE_IMG_P: Record<string, string> = {
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
const FALLBACK_IMG_P = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=70';
const getMuscleImgP = (muscle: string) =>
    MUSCLE_IMG_P[muscle] ??
    Object.entries(MUSCLE_IMG_P).find(([k]) => muscle?.toLowerCase().includes(k.toLowerCase()))?.[1] ??
    FALLBACK_IMG_P;

// ── Workout Detail Modal ─────────────────────────────────────────
const WorkoutDetailModalP: React.FC<{
    post: any | null;
    visible: boolean;
    onClose: () => void;
    primary: string;
}> = ({ post, visible, onClose, primary }) => {
    if (!post?.workout_data) return null;
    const data: WorkoutData = post.workout_data;
    const durationMin = Math.round(data.duration_seconds / 60);
    const color = effortColor(data.effort_score);
    const effortLabels = ['', 'Suave 😌', 'Suave 😌', 'Moderado 💪', 'Moderado 💪',
        'Normal 🏃', 'Normal 🏃', 'Intenso ⚡', 'Intenso ⚡', 'Máximo 🔥', 'Máximo 🔥'];
    const tAgoW = (iso: string) => {
        const d = (Date.now() - new Date(iso).getTime()) / 1000;
        if (d < 60) return 'ahora';
        if (d < 3600) return `${Math.floor(d / 60)}m`;
        if (d < 86400) return `${Math.floor(d / 3600)}h`;
        return `${Math.floor(d / 86400)}d`;
    };
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={wdp.container}>
                <View style={wdp.handle} />
                <View style={wdp.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={wdp.routineTitle} numberOfLines={1}>{data.routine_name}</Text>
                        <View style={wdp.metaRow}>
                            {post?.user_avatar
                                ? <Image source={{ uri: post.user_avatar }} style={wdp.userAva} />
                                : <LinearGradient colors={[primary, primary + 'AA']} style={wdp.userAvaFallback}>
                                    <Text style={wdp.userAvaLetter}>{post?.user_name?.[0]?.toUpperCase()}</Text>
                                  </LinearGradient>
                            }
                            <Text style={wdp.userName}>{post?.user_name}</Text>
                            {post?.created_at && <Text style={wdp.userTime}>{tAgoW(post.created_at)}</Text>}
                            <View style={[wdp.durBadge, { borderColor: primary + '55' }]}>
                                <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
                                <Text style={wdp.durText}>{durationMin}min</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={wdp.closeBtn}>
                        <Ionicons name="close" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    {post.image_url && (
                        <Image source={{ uri: post.image_url }} style={wdp.postPhoto} resizeMode="cover" />
                    )}

                    {/* Stats strip */}
                    <View style={wdp.statsStrip}>
                        {[
                            { icon: 'layers-outline',  val: String(data.total_sets),   lbl: 'Series' },
                            { icon: 'repeat-outline',  val: String(data.total_reps),   lbl: 'Reps' },
                            { icon: 'barbell-outline', val: `${data.total_weight}kg`,  lbl: 'Movido' },
                            { icon: 'flash-outline',   val: `${data.effort_score}/10`, lbl: 'Esfuerzo' },
                        ].map((st) => (
                            <View key={st.lbl} style={wdp.statCell}>
                                <Ionicons name={st.icon as any} size={16} color={primary} />
                                <Text style={[wdp.statVal, st.lbl === 'Esfuerzo' && { color }]}>{st.val}</Text>
                                <Text style={wdp.statLbl}>{st.lbl}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Effort bar */}
                    <View style={wdp.effortSect}>
                        <View style={wdp.effortBarRow}>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                <View key={n} style={[wdp.seg, n <= data.effort_score && { backgroundColor: color }]} />
                            ))}
                        </View>
                        <Text style={[wdp.effortLabelText, { color }]}>{effortLabels[data.effort_score]}</Text>
                    </View>

                    {/* Exercises */}
                    <Text style={wdp.sectionTitle}>Ejercicios</Text>
                    {data.exercises.map((ex, i) => {
                        const img = getMuscleImgP(ex.muscle_group ?? '');
                        return (
                            <View key={i} style={wdp.exCard}>
                                <Image source={{ uri: img }} style={wdp.exImg} resizeMode="cover" />
                                <View style={wdp.exInfo}>
                                    <Text style={wdp.exName} numberOfLines={2}>{ex.name}</Text>
                                    {ex.muscle_group ? <Text style={wdp.exMuscle} numberOfLines={1}>{ex.muscle_group}</Text> : null}
                                    <View style={wdp.setsWrap}>
                                        {ex.sets.map((st, si) => (
                                            <View key={si} style={[wdp.setChip, { borderColor: primary + '55', backgroundColor: primary + '14' }]}>
                                                <Text style={[wdp.setChipNum, { color: primary }]}>S{si + 1}</Text>
                                                <Text style={wdp.setChipVal}>
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

const wdp = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111' },
    handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
    header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.sm },
    routineTitle: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    userAva: { width: 22, height: 22, borderRadius: 11 },
    userAvaFallback: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    userAvaLetter: { color: '#fff', fontWeight: '800', fontSize: 10 },
    userName: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },
    userTime: { fontSize: FontSizes.xs, color: Colors.textSecondary },
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

// ── Post View Modal ──────────────────────────────────────
const PostViewModal: React.FC<{
    post: any | null;
    visible: boolean;
    onClose: () => void;
    primary: string;
}> = ({ post, visible, onClose, primary }) => {
    const { comments, isLoadingComments, isAddingComment, fetchComments, addComment } = useFeedStore();
    const { user } = useAuthStore();
    const [commentText, setCommentText] = useState('');
    const listRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible && post?.id) fetchComments(post.id);
    }, [visible, post?.id]);

    const postComments: Comment[] = post ? (comments[post.id] ?? []) : [];
    const tAgo = (iso: string) => {
        const d = (Date.now() - new Date(iso).getTime()) / 1000;
        if (d < 60) return 'ahora';
        if (d < 3600) return `${Math.floor(d / 60)}m`;
        if (d < 86400) return `${Math.floor(d / 3600)}h`;
        return `${Math.floor(d / 86400)}d`;
    };

    const handleSend = async () => {
        if (!commentText.trim() || !post) return;
        const draft = commentText;
        setCommentText('');
        try {
            await addComment(post.id, draft);
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo enviar');
            setCommentText(draft);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={pv.container}>
                    <View style={pv.handleBar} />
                    <View style={pv.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {post?.user_avatar
                                ? <Image source={{ uri: post.user_avatar }} style={pv.hAvatar} />
                                : <LinearGradient colors={[primary, primary + 'AA']} style={pv.hAvatarFb}>
                                    <Text style={pv.hAvatarLetter}>{post?.user_name?.[0]?.toUpperCase()}</Text>
                                  </LinearGradient>
                            }
                            <View>
                                <Text style={pv.hName}>{post?.user_name}</Text>
                                {post?.created_at && <Text style={pv.hTime}>{tAgo(post.created_at)}</Text>}
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={pv.closeBtn}>
                            <Ionicons name="close" size={22} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        ref={listRef}
                        data={postComments}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={
                            <>
                                {post?.image_url && (
                                    <Image source={{ uri: post.image_url }} style={pv.postImg} resizeMode="cover" />
                                )}
                                {post?.content ? (
                                    <Text style={pv.postContent}>{post.content}</Text>
                                ) : null}
                                <View style={pv.divider} />
                                {isLoadingComments && (
                                    <ActivityIndicator color={primary} style={{ marginVertical: 20 }} />
                                )}
                                {!isLoadingComments && postComments.length === 0 && (
                                    <View style={pv.noComments}>
                                        <Ionicons name="chatbubbles-outline" size={40} color={Colors.textSecondary} />
                                        <Text style={pv.noCommentsText}>Sé el primero en comentar</Text>
                                    </View>
                                )}
                            </>
                        }
                        renderItem={({ item }: { item: Comment }) => (
                            <View style={pv.cRow}>
                                {item.user_avatar
                                    ? <Image source={{ uri: item.user_avatar }} style={pv.cAv} />
                                    : <LinearGradient colors={[primary, primary + 'AA']} style={pv.cAvFb}>
                                        <Text style={pv.cAvLetter}>{item.user_name[0]?.toUpperCase()}</Text>
                                      </LinearGradient>
                                }
                                <View style={pv.cBubble}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={pv.cName}>{item.user_name}</Text>
                                        <Text style={pv.cTime}>{tAgo(item.created_at)}</Text>
                                    </View>
                                    <Text style={pv.cText}>{item.content}</Text>
                                </View>
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                    <View style={[pv.inputRow, { borderTopColor: Colors.border }]}>
                        <LinearGradient colors={[primary, primary + 'AA']} style={pv.myAv}>
                            <Text style={pv.myAvLetter}>{user?.full_name?.[0]?.toUpperCase() ?? 'M'}</Text>
                        </LinearGradient>
                        <TextInput
                            style={pv.input}
                            placeholder="Escribe un comentario…"
                            placeholderTextColor={Colors.textSecondary}
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                            maxLength={300}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!commentText.trim() || isAddingComment}
                            style={[pv.sendBtn, { backgroundColor: commentText.trim() ? primary : Colors.border }]}
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

const pv = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111' },
    handleBar: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
    hAvatar: { width: 36, height: 36, borderRadius: 18 },
    hAvatarFb: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    hAvatarLetter: { color: '#fff', fontWeight: '800', fontSize: 14 },
    hName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
    hTime: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
    postImg: { width: '100%', aspectRatio: 1 },
    postContent: { fontSize: FontSizes.base, color: Colors.textPrimary, lineHeight: 22, padding: Spacing.base },
    divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.base, marginBottom: 4 },
    noComments: { alignItems: 'center', gap: 8, paddingTop: 40 },
    noCommentsText: { color: Colors.textSecondary, fontSize: FontSizes.base },
    cRow: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.base, paddingVertical: 8 },
    cAv: { width: 30, height: 30, borderRadius: 15, marginTop: 2 },
    cAvFb: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    cAvLetter: { color: '#fff', fontWeight: '800', fontSize: 12 },
    cBubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: 10 },
    cName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
    cTime: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    cText: { fontSize: FontSizes.sm, color: Colors.textPrimary, lineHeight: 18, marginTop: 2 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: Spacing.base, borderTopWidth: 1, backgroundColor: '#111' },
    myAv: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    myAvLetter: { color: '#fff', fontWeight: '800', fontSize: 12 },
    input: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary, fontSize: FontSizes.sm, paddingHorizontal: Spacing.md, paddingVertical: 10, maxHeight: 100 },
    sendBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, profile, logout, setUser, setProfile } = useAuthStore();
    const { sessions, fetchSessions } = useRoutineStore();
    const { posts, fetchPosts, fetchComments, addComment, comments, isLoadingComments, isAddingComment } = useFeedStore();
    const { primary } = useThemeStore();

    const [tab, setTab] = useState<Tab>('posts');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [notifications, setNotifications] = useState(true);
    const [savingPrivacy, setSavingPrivacy] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [workoutDetailPost, setWorkoutDetailPost] = useState<any | null>(null);
    // Internal users.id (differs from auth UUID)
    const [myInternalId, setMyInternalId] = useState<string | null>(null);
    // Name editing
    const [editingName, setEditingName] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [savingName, setSavingName] = useState(false);
    // Follow requests
    const [followRequests, setFollowRequests] = useState<{ id: string; requester_id: string; full_name: string; avatar_url?: string }[]>([]);
    const [processingReq, setProcessingReq] = useState<Record<string, boolean>>({});
    // Inline stats editing
    const [editingStats, setEditingStats] = useState(false);
    const [draftWeight, setDraftWeight] = useState('');
    const [draftHeight, setDraftHeight] = useState('');
    const [draftAge, setDraftAge] = useState('');
    const [savingStats, setSavingStats] = useState(false);

    const myPosts = posts.filter((p) => p.supabase_uid === user?.id);
    const myWorkoutPosts = myPosts.filter((p) => (p as any).workout_data);

    const loadSocialData = useCallback(async () => {
        if (!user?.id) return;

        // Resolve internal users.id (different from supabase auth UUID)
        const { data: myRow } = await supabase
            .from('users')
            .select('id')
            .eq('supabase_id', user.id)
            .maybeSingle();
        const internalId = myRow?.id ?? null;
        setMyInternalId(internalId);
        if (!internalId) return;

        // follower count
        const { count: fwrs } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', internalId);
        // following count
        const { count: fwing } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', internalId);
        // privacy setting (user_profiles references users.id)
        const { data: up } = await supabase
            .from('user_profiles')
            .select('is_public')
            .eq('user_id', internalId)
            .maybeSingle();
        setFollowers(fwrs ?? 0);
        setFollowing(fwing ?? 0);
        const pub = up?.is_public !== false;
        if (up?.is_public !== undefined) setIsPublic(pub);

        // Follow requests (only for private account)
        if (!pub) {
            const { data: reqs } = await supabase
                .from('follow_requests')
                .select('id, requester_id')
                .eq('target_id', internalId)
                .eq('status', 'pending')
                .limit(50);
            if (reqs?.length) {
                const requesterIds = reqs.map((r: any) => r.requester_id);
                const { data: reqUsers } = await supabase
                    .from('users')
                    .select('id, supabase_id, full_name, avatar_url')
                    .in('id', requesterIds);
                const userMap = Object.fromEntries((reqUsers ?? []).map((u: any) => [u.id, u]));
                setFollowRequests(reqs.map((r: any) => ({
                    id: r.id,
                    requester_id: r.requester_id,
                    full_name: userMap[r.requester_id]?.full_name ?? 'Usuario',
                    avatar_url: userMap[r.requester_id]?.avatar_url,
                })));
            } else {
                setFollowRequests([]);
            }
        }
    }, [user?.id]);

    const handleFollowRequest = async (reqId: string, requesterId: string, accept: boolean) => {
        if (!myInternalId) {
            Alert.alert('Error', 'No se pudo identificar tu cuenta. Recarga la pantalla.');
            return;
        }
        setProcessingReq((prev) => ({ ...prev, [reqId]: true }));
        try {
            if (accept) {
                // Accept: insert follow using internal UUIDs + update request status
                const { error } = await supabase.from('user_follows').insert({
                    follower_id: requesterId,  // already internal UUID from users table
                    following_id: myInternalId,
                });
                if (error) throw error;
                await supabase.from('follow_requests').update({ status: 'accepted' }).eq('id', reqId);
                setFollowers((f) => f + 1);
            } else {
                // Reject
                await supabase.from('follow_requests').update({ status: 'rejected' }).eq('id', reqId);
            }
            setFollowRequests((prev) => prev.filter((r) => r.id !== reqId));
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo procesar la solicitud');
        } finally {
            setProcessingReq((prev) => ({ ...prev, [reqId]: false }));
        }
    };

    const saveName = async () => {
        if (!draftName.trim() || !user) return;
        setSavingName(true);
        try {
            const newName = draftName.trim();
            // Update auth metadata
            await supabase.auth.updateUser({ data: { full_name: newName } });
            // Update users table
            await supabase.from('users').update({ full_name: newName }).eq('supabase_id', user.id);
            // Update feed_posts so old posts show new name
            await supabase.from('feed_posts').update({ user_name: newName }).eq('supabase_uid', user.id);
            setUser({ ...user, full_name: newName });
            setEditingName(false);
            Alert.alert('✅ Nombre actualizado');
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo guardar');
        } finally {
            setSavingName(false);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchSessions?.();
        loadSocialData();
    }, []);

    const togglePrivacy = async (val: boolean) => {
        setIsPublic(val);
        if (!myInternalId) return;
        setSavingPrivacy(true);
        await supabase
            .from('user_profiles')
            .update({ is_public: val })
            .eq('user_id', myInternalId);
        setSavingPrivacy(false);
    };

    const saveStats = async () => {
        setSavingStats(true);
        try {
            // Use myInternalId (users.id) — user_profiles FK references users(id)
            if (!myInternalId) throw new Error('No se pudo identificar tu cuenta. Recarga la pantalla.');

            const updates: Record<string, any> = {};
            if (draftWeight !== '') updates.weight_kg = parseFloat(draftWeight);
            if (draftHeight !== '') updates.height_cm = parseInt(draftHeight);
            if (draftAge !== '') updates.age = parseInt(draftAge);

            const { error } = await supabase
                .from('user_profiles')
                .upsert({ user_id: myInternalId, ...updates }, { onConflict: 'user_id' });
            if (error) throw error;

            if (setProfile) setProfile({ ...(profile as any), ...updates });
            setEditingStats(false);
        } catch (e: any) {
            Alert.alert('Error al guardar', e?.message ?? 'No se pudo guardar');
        } finally {
            setSavingStats(false);
        }
    };

    const handleLogout = () => Alert.alert('Cerrar sesión', '¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout },
    ]);

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería.');
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (res.canceled || !res.assets?.[0]) return;
        if (!user) return;
        setUploadingAvatar(true);
        try {
            const asset = res.assets[0];
            if (!asset.base64) { Alert.alert('Error', 'No se pudo leer la imagen.'); return; }
            const avatarUrl = `data:image/jpeg;base64,${asset.base64}`;
            await supabase.auth.refreshSession();
            const { error } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
            if (error) { Alert.alert('Error al guardar', error.message); return; }
            // Propagate to users table and feed_posts
            await supabase.from('users').update({ avatar_url: avatarUrl }).eq('supabase_id', user.id);
            await supabase.from('feed_posts').update({ user_avatar: avatarUrl }).eq('supabase_uid', user.id);
            setUser({ ...user, avatar_url: avatarUrl });
            Alert.alert('✅ Foto actualizada');
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Error desconocido');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const userGoals = Goals.filter((g) => (profile?.goals ?? []).includes(g.id));
    const activityLevel = ActivityLevels.find((a) => a.id === profile?.activity_level);
    const totalMinutes = (sessions ?? []).reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
    const avgMinutes = sessions?.length ? Math.round(totalMinutes / sessions.length) : 0;

    const TABS: { key: Tab; icon: string; label: string }[] = [
        { key: 'posts', icon: 'grid-outline', label: 'Publicaciones' },
        { key: 'entrenos', icon: 'barbell-outline', label: 'Entrenos' },
        { key: 'ajustes', icon: 'settings-outline', label: 'Ajustes' },
    ];

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll}>

                {/* ── HEADER ── */}
                <LinearGradient colors={[primary + '33', '#0A0A0A']} style={s.headerBg}>
                    {/* Avatar */}
                    <TouchableOpacity onPress={pickAvatar} style={s.avatarWrap} disabled={uploadingAvatar}>
                        {user?.avatar_url
                            ? <Image source={{ uri: user.avatar_url }} style={[s.avatar, { borderColor: primary }]} />
                            : <LinearGradient colors={[primary, primary + '88']} style={s.avatarPlaceholder}>
                                <Text style={s.avatarInitial}>{user?.full_name?.[0] ?? 'M'}</Text>
                            </LinearGradient>
                        }
                        <View style={[s.cameraBtn, { backgroundColor: primary }]}>
                            <Ionicons name={uploadingAvatar ? 'hourglass-outline' : 'camera'} size={13} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Social counters */}
                    <View style={s.socialRow}>
                        <View style={s.socialStat}>
                            <Text style={[s.socialNum, { color: primary }]}>{myPosts.length}</Text>
                            <Text style={s.socialLabel}>Publicaciones</Text>
                        </View>
                        <View style={s.socialDivider} />
                        <TouchableOpacity
                            style={s.socialStat}
                            onPress={() => myInternalId && navigation.navigate('FollowList', {
                                type: 'followers', userId: myInternalId, title: `${followers} Seguidores`,
                            })}
                            disabled={!myInternalId || followers === 0}
                        >
                            <Text style={[s.socialNum, { color: primary }]}>{followers}</Text>
                            <Text style={s.socialLabel}>Seguidores</Text>
                        </TouchableOpacity>
                        <View style={s.socialDivider} />
                        <TouchableOpacity
                            style={s.socialStat}
                            onPress={() => myInternalId && navigation.navigate('FollowList', {
                                type: 'following', userId: myInternalId, title: `${following} Siguiendo`,
                            })}
                            disabled={!myInternalId || following === 0}
                        >
                            <Text style={[s.socialNum, { color: primary }]}>{following}</Text>
                            <Text style={s.socialLabel}>Siguiendo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Editable name */}
                    {editingName ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <TextInput
                                style={[s.name, { borderBottomWidth: 1, borderBottomColor: primary, minWidth: 140, textAlign: 'center', paddingBottom: 2 }]}
                                value={draftName}
                                onChangeText={setDraftName}
                                autoFocus
                                maxLength={50}
                                returnKeyType="done"
                                onSubmitEditing={saveName}
                            />
                            <TouchableOpacity onPress={saveName} disabled={savingName || !draftName.trim()}>
                                {savingName
                                    ? <ActivityIndicator size="small" color={primary} />
                                    : <Ionicons name="checkmark-circle" size={22} color={primary} />
                                }
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setEditingName(false)}>
                                <Ionicons name="close-circle" size={22} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}
                            onPress={() => { setDraftName(user?.full_name ?? ''); setEditingName(true); }}
                        >
                            <Text style={s.name}>{user?.full_name}</Text>
                            <Ionicons name="pencil" size={14} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                    <Text style={s.email}>{user?.email}</Text>

                    <View style={s.badgeRow}>
                        <View style={[s.badge, { borderColor: primary + '44', backgroundColor: primary + '22' }]}>
                            <Text style={[s.badgeText, { color: primary }]}>🏃 Atleta</Text>
                        </View>
                        <View style={[s.badge, { borderColor: isPublic ? '#4CAF5044' : '#FF980044', backgroundColor: isPublic ? '#4CAF5022' : '#FF980022' }]}>
                            <Ionicons name={isPublic ? 'globe-outline' : 'lock-closed-outline'} size={11} color={isPublic ? '#4CAF50' : '#FF9800'} />
                            <Text style={[s.badgeText, { color: isPublic ? '#4CAF50' : '#FF9800' }]}>{isPublic ? 'Público' : 'Privado'}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* ── TAB BAR ── */}
                <View style={s.tabBar}>
                    {TABS.map((t) => (
                        <TouchableOpacity key={t.key} style={s.tabItem} onPress={() => setTab(t.key)}>
                            <Ionicons name={t.icon as any} size={20} color={tab === t.key ? primary : Colors.textSecondary} />
                            <Text style={[s.tabLabel, tab === t.key && { color: primary }]}>{t.label}</Text>
                            {tab === t.key && <View style={[s.tabIndicator, { backgroundColor: primary }]} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── TAB: POSTS GRID ── */}
                {tab === 'posts' && (
                    <View>
                        {myPosts.length === 0 ? (
                            <View style={s.emptyState}>
                                <Ionicons name="image-outline" size={48} color={Colors.textSecondary} />
                                <Text style={s.emptyText}>Sin publicaciones aún</Text>
                                <Text style={s.emptySubText}>Comparte tu progreso en Comunidad</Text>
                            </View>
                        ) : (
                            <View style={s.grid}>
                                {myPosts.map((p) => (
                                    <TouchableOpacity key={p.id} style={s.gridCell} onPress={() => (p as any).workout_data ? setWorkoutDetailPost(p) : setSelectedPost(p)} activeOpacity={0.85}>
                                        {p.image_url
                                            ? <Image source={{ uri: p.image_url }} style={s.gridImg} />
                                            : <LinearGradient colors={[primary + '55', primary + '22']} style={s.gridPlaceholder}>
                                                <Ionicons name="fitness-outline" size={22} color={primary} />
                                            </LinearGradient>
                                        }
                                        <View style={s.gridOverlay}>
                                            <Ionicons name="heart" size={12} color="#fff" />
                                            <Text style={s.gridLikes}>{p.likes_count ?? 0}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* ── TAB: ENTRENOS ── */}
                {tab === 'entrenos' && (
                    <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.lg }}>
                        {/* Shared workout posts — top */}
                        {myWorkoutPosts.length > 0 && (
                            <View style={[s.section, { borderColor: primary + '33' }]}>
                                <View style={s.sectionHeader}>
                                    <Ionicons name="share-social-outline" size={18} color={primary} />
                                    <Text style={s.sectionTitle}>Entrenamientos compartidos</Text>
                                </View>
                                {myWorkoutPosts.slice(0, 5).map((p, i) => {
                                    const wd: WorkoutData = (p as any).workout_data;
                                    const dmin = Math.round(wd.duration_seconds / 60);
                                    const effortC = wd.effort_score >= 9 ? '#F44336' : wd.effort_score >= 7 ? '#FF5722' : wd.effort_score >= 5 ? '#FF9800' : '#4CAF50';
                                    return (
                                        <TouchableOpacity
                                            key={p.id}
                                            onPress={() => setWorkoutDetailPost(p)}
                                            activeOpacity={0.75}
                                            style={[s.sessionRow, i === myWorkoutPosts.slice(0, 5).length - 1 && { borderBottomWidth: 0 }]}
                                        >
                                            <View style={[s.workoutIcon, { backgroundColor: primary + '22' }]}>
                                                <Ionicons name="barbell-outline" size={14} color={primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={s.sessionName}>{wd.routine_name}</Text>
                                                <Text style={s.sessionSub}>
                                                    {dmin}min · {wd.total_sets} series · {wd.total_weight}kg movidos
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <View style={[s.sessionBadge, { backgroundColor: effortC + '22' }]}>
                                                    <Text style={[s.sessionBadgeText, { color: effortC, fontSize: 10 }]}>⚡{wd.effort_score}</Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {/* Physical stats header + edit */}
                        <View style={s.tabSectionHeader}>
                            <View style={s.sectionHeader}>
                                <Ionicons name="body-outline" size={18} color={primary} />
                                <Text style={s.sectionTitle}>Datos físicos</Text>
                            </View>
                            {editingStats
                                ? <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity onPress={() => setEditingStats(false)} style={[s.editBtn, { borderColor: Colors.border }]}>
                                        <Text style={[s.editBtnText, { color: Colors.textSecondary }]}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={saveStats} disabled={savingStats} style={[s.editBtn, { borderColor: primary + '55', backgroundColor: primary + '15' }]}>
                                        {savingStats
                                            ? <ActivityIndicator size="small" color={primary} />
                                            : <><Ionicons name="checkmark" size={14} color={primary} /><Text style={[s.editBtnText, { color: primary }]}>Guardar</Text></>
                                        }
                                    </TouchableOpacity>
                                  </View>
                                : <TouchableOpacity
                                    onPress={() => {
                                        setDraftWeight(String(profile?.weight_kg ?? ''));
                                        setDraftHeight(String(profile?.height_cm ?? ''));
                                        setDraftAge(String(profile?.age ?? ''));
                                        setEditingStats(true);
                                    }}
                                    style={[s.editBtn, { borderColor: primary + '55', backgroundColor: primary + '15' }]}
                                  >
                                    <Ionicons name="pencil" size={14} color={primary} />
                                    <Text style={[s.editBtnText, { color: primary }]}>Editar</Text>
                                  </TouchableOpacity>
                            }
                        </View>
                        {/* Stats row */}
                        {editingStats
                            ? <View style={s.statsRow}>
                                {[
                                    { label: 'Peso (kg)', value: draftWeight, set: setDraftWeight, kb: 'decimal-pad' as const },
                                    { label: 'Altura (cm)', value: draftHeight, set: setDraftHeight, kb: 'number-pad' as const },
                                    { label: 'Edad', value: draftAge, set: setDraftAge, kb: 'number-pad' as const },
                                ].map((f) => (
                                    <View key={f.label} style={[s.statCard, { borderColor: primary + '55', borderWidth: 1.5 }]}>
                                        <Text style={[s.statLabel, { marginBottom: 4 }]}>{f.label}</Text>
                                        <TextInput
                                            style={[s.statValue, { color: primary, borderBottomWidth: 1, borderBottomColor: primary + '66', minWidth: 48, textAlign: 'center', paddingBottom: 2 }]}
                                            value={f.value}
                                            onChangeText={f.set}
                                            keyboardType={f.kb}
                                            maxLength={6}
                                            placeholder="—"
                                            placeholderTextColor={Colors.textSecondary}
                                        />
                                    </View>
                                ))}
                              </View>
                            : <View style={s.statsRow}>
                                {[
                                    { label: 'Peso', value: profile?.weight_kg ? `${profile.weight_kg}kg` : '—', icon: 'scale-outline' },
                                    { label: 'Altura', value: profile?.height_cm ? `${profile.height_cm}cm` : '—', icon: 'body-outline' },
                                    { label: 'Edad', value: profile?.age ? `${profile.age}a` : '—', icon: 'calendar-outline' },
                                ].map((st) => (
                                    <View key={st.label} style={[s.statCard, { borderColor: primary + '33' }]}>
                                        <Ionicons name={st.icon as any} size={16} color={primary} style={{ marginBottom: 4 }} />
                                        <Text style={[s.statValue, { color: primary }]}>{st.value}</Text>
                                        <Text style={s.statLabel}>{st.label}</Text>
                                    </View>
                                ))}
                              </View>
                        }

                        {/* Session summary */}
                        <View style={[s.section, { borderColor: primary + '33' }]}>
                            <View style={s.sectionHeader}>
                                <Ionicons name="trending-up-outline" size={18} color={primary} />
                                <Text style={s.sectionTitle}>Resumen de entrenamientos</Text>
                            </View>
                            <View style={s.statsRow}>
                                {[
                                    { label: 'Sesiones', value: String(sessions?.length ?? 0) },
                                    { label: 'Min totales', value: String(totalMinutes) },
                                    { label: 'Prom/sesión', value: `${avgMinutes}m` },
                                ].map((st) => (
                                    <View key={st.label} style={[s.statCard, { borderColor: primary + '22' }]}>
                                        <Text style={[s.statValue, { color: primary }]}>{st.value}</Text>
                                        <Text style={s.statLabel}>{st.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Activity level */}
                        {activityLevel && (
                            <View style={[s.section, { borderColor: primary + '33' }]}>
                                <View style={s.sectionHeader}>
                                    <Ionicons name="flash-outline" size={18} color={primary} />
                                    <Text style={s.sectionTitle}>Nivel de actividad</Text>
                                </View>
                                <Text style={s.infoText}>{activityLevel.label}</Text>
                            </View>
                        )}

                        {/* Goals */}
                        {userGoals.length > 0 && (
                            <View style={[s.section, { borderColor: primary + '33' }]}>
                                <View style={s.sectionHeader}>
                                    <Ionicons name="flag-outline" size={18} color={primary} />
                                    <Text style={s.sectionTitle}>Mis objetivos</Text>
                                </View>
                                <View style={s.goalsRow}>
                                    {userGoals.map((g) => (
                                        <View key={g.id} style={[s.goalChip, { borderColor: primary + '44', backgroundColor: primary + '22' }]}>
                                            <Text style={[s.goalChipText, { color: primary }]}>{g.emoji} {g.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Recent sessions */}
                        {(sessions?.length ?? 0) > 0 && (
                            <View style={[s.section, { borderColor: primary + '33' }]}>
                                <View style={s.sectionHeader}>
                                    <Ionicons name="time-outline" size={18} color={primary} />
                                    <Text style={s.sectionTitle}>Sesiones recientes</Text>
                                </View>
                                {sessions!.slice(0, 5).map((sess, i) => (
                                    <View key={i} style={s.sessionRow}>
                                        <View style={[s.sessionDot, { backgroundColor: primary }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.sessionName}>{sess.routineName ?? 'Entrenamiento'}</Text>
                                            <Text style={s.sessionSub}>{sess.durationMinutes ?? 0} min · {new Date(sess.completedAt ?? '').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</Text>
                                        </View>
                                        <View style={[s.sessionBadge, { backgroundColor: primary + '22' }]}>
                                            <Text style={[s.sessionBadgeText, { color: primary }]}>✓</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Trainer note */}
                        {profile?.notes_from_trainer && (
                            <View style={[s.section, { borderColor: '#FFD70044' }]}>
                                <View style={s.sectionHeader}>
                                    <Ionicons name="document-text-outline" size={18} color="#FFD700" />
                                    <Text style={s.sectionTitle}>Nota de tu entrenador</Text>
                                </View>
                                <Text style={s.infoText}>{profile.notes_from_trainer}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ── TAB: AJUSTES ── */}
                {tab === 'ajustes' && (
                    <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.lg }}>
                        {/* Follow requests (private accounts) */}
                        {!isPublic && followRequests.length > 0 && (
                            <View style={[s.section, { borderColor: '#FF980044' }]}>
                                <View style={s.sectionHeader}>
                                    <Ionicons name="person-add-outline" size={18} color="#FF9800" />
                                    <Text style={s.sectionTitle}>Solicitudes de seguimiento</Text>
                                    <View style={{ backgroundColor: '#FF9800', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 'auto' }}>
                                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{followRequests.length}</Text>
                                    </View>
                                </View>
                                {followRequests.map((req) => (
                                    <View key={req.id} style={[s.menuRow, { alignItems: 'center', paddingVertical: 10 }]}>
                                        {req.avatar_url
                                            ? <Image source={{ uri: req.avatar_url }} style={{ width: 38, height: 38, borderRadius: 19 }} />
                                            : <LinearGradient colors={[primary, primary + '88']} style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{req.full_name[0]}</Text>
                                              </LinearGradient>
                                        }
                                        <Text style={[s.menuText, { flex: 1 }]}>{req.full_name}</Text>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity
                                                style={{ backgroundColor: primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                                                onPress={() => handleFollowRequest(req.id, req.requester_id, true)}
                                                disabled={processingReq[req.id]}
                                            >
                                                {processingReq[req.id]
                                                    ? <ActivityIndicator size="small" color="#fff" />
                                                    : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Aceptar</Text>
                                                }
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={{ backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border }}
                                                onPress={() => handleFollowRequest(req.id, req.requester_id, false)}
                                                disabled={processingReq[req.id]}
                                            >
                                                <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Rechazar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Privacy */}
                        <View style={[s.section, { borderColor: primary + '33' }]}>
                            <View style={s.sectionHeader}>
                                <Ionicons name="shield-outline" size={18} color={primary} />
                                <Text style={s.sectionTitle}>Privacidad</Text>
                            </View>
                            <View style={s.menuRow}>
                                <Ionicons name={isPublic ? 'globe-outline' : 'lock-closed-outline'} size={20} color={Colors.textSecondary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.menuText}>Perfil público</Text>
                                    <Text style={s.menuSub}>{isPublic ? 'Todos pueden ver tu perfil' : 'Solo tus seguidores'}</Text>
                                </View>
                                <Switch
                                    value={isPublic}
                                    onValueChange={togglePrivacy}
                                    disabled={savingPrivacy}
                                    trackColor={{ true: primary }}
                                />
                            </View>
                        </View>

                        {/* Notifications */}
                        <View style={[s.section, { borderColor: primary + '33' }]}>
                            <View style={s.sectionHeader}>
                                <Ionicons name="notifications-outline" size={18} color={primary} />
                                <Text style={s.sectionTitle}>Notificaciones</Text>
                            </View>
                            <View style={s.menuRow}>
                                <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
                                <Text style={[s.menuText, { flex: 1 }]}>Notificaciones push</Text>
                                <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: primary }} />
                            </View>
                        </View>

                        {/* Mensajes */}
                        <View style={[s.section, { borderColor: primary + '33' }]}>
                            <View style={s.sectionHeader}>
                                <Ionicons name="chatbubbles-outline" size={18} color={primary} />
                                <Text style={s.sectionTitle}>Mensajes</Text>
                            </View>
                            <TouchableOpacity style={[s.menuRow, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('DirectMessages')}>
                                <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                                <Text style={[s.menuText, { flex: 1 }]}>Mis conversaciones</Text>
                                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Account */}
                        <View style={[s.section, { borderColor: primary + '33' }]}>
                            <View style={s.sectionHeader}>
                                <Ionicons name="person-circle-outline" size={18} color={primary} />
                                <Text style={s.sectionTitle}>Cuenta</Text>
                            </View>
                            <TouchableOpacity style={s.menuRow} onPress={() => navigation.navigate('EditProfile')}>
                                <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                                <Text style={[s.menuText, { flex: 1 }]}>Editar perfil</Text>
                                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.menuRow, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('Settings')}>
                                <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
                                <Text style={[s.menuText, { flex: 1 }]}>Ajustes generales</Text>
                                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Logout */}
                        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={18} color="#EF5350" />
                            <Text style={s.logoutText}>Cerrar sesión</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
            <PostViewModal
                post={selectedPost}
                visible={selectedPost !== null}
                onClose={() => setSelectedPost(null)}
                primary={primary}
            />
            <WorkoutDetailModalP
                post={workoutDetailPost}
                visible={workoutDetailPost !== null}
                onClose={() => setWorkoutDetailPost(null)}
                primary={primary}
            />
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { paddingBottom: Spacing['3xl'] },
    // Header
    headerBg: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing['2xl'], paddingHorizontal: Spacing.base },
    avatarWrap: { position: 'relative', marginBottom: Spacing.md },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3 },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
    cameraBtn: { position: 'absolute', bottom: 0, right: 0, borderRadius: 12, padding: 5 },
    socialRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
    socialStat: { alignItems: 'center', paddingHorizontal: Spacing.lg },
    socialNum: { fontSize: FontSizes.xl, fontWeight: '800' },
    socialLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    socialDivider: { width: 1, height: 30, backgroundColor: Colors.border },
    name: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.textPrimary },
    email: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 4 },
    badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 5, borderWidth: 1 },
    badgeText: { fontWeight: '700', fontSize: FontSizes.xs },
    // Tab bar
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
    tabItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, position: 'relative', gap: 3 },
    tabLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
    tabIndicator: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, borderRadius: 1 },
    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 2 },
    gridCell: { width: GRID_SIZE, height: GRID_SIZE, position: 'relative', overflow: 'hidden' },
    gridImg: { width: '100%', height: '100%' },
    gridPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    gridOverlay: { position: 'absolute', bottom: 4, right: 4, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#00000066', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
    gridLikes: { color: '#fff', fontSize: 10, fontWeight: '700' },
    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
    emptyText: { color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: '700', marginTop: Spacing.md },
    emptySubText: { color: Colors.textSecondary, fontSize: FontSizes.sm, textAlign: 'center', marginTop: 6 },
    // Stats / Sections
    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1 },
    statValue: { fontSize: FontSizes.xl, fontWeight: '800' },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, padding: Spacing.base, borderWidth: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    sectionTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    infoText: { color: Colors.textSecondary, fontSize: FontSizes.base, lineHeight: 22 },
    goalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    goalChip: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1 },
    goalChipText: { fontSize: FontSizes.sm, fontWeight: '600' },
    // Tab section header
    tabSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 5 },
    editBtnText: { fontSize: FontSizes.xs, fontWeight: '700' },
    // Sessions
    sessionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    sessionDot: { width: 8, height: 8, borderRadius: 4 },
    sessionName: { color: Colors.textPrimary, fontWeight: '600', fontSize: FontSizes.sm },
    sessionSub: { color: Colors.textSecondary, fontSize: FontSizes.xs, marginTop: 2 },
    sessionBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    sessionBadgeText: { fontWeight: '800', fontSize: 12 },
    workoutIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    // Menu
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    menuText: { color: Colors.textPrimary, fontSize: FontSizes.base },
    menuSub: { color: Colors.textSecondary, fontSize: FontSizes.xs, marginTop: 2 },
    // Logout
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32, marginTop: 8, paddingVertical: 14, backgroundColor: '#EF535015', borderRadius: 14, borderWidth: 1, borderColor: '#EF535044' },
    logoutText: { color: '#EF5350', fontWeight: '700', fontSize: FontSizes.base },
});
