import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserData {
    id: string;
    supabase_id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    role: string;
}

type FollowState = 'none' | 'following' | 'pending';

// ─── Component ────────────────────────────────────────────────────────────────
export const UserProfileScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
    const { userId: userIdParam, supabaseUid } = route.params as { userId?: string; supabaseUid?: string };
    const { user: me } = useAuthStore();
    const { primary } = useThemeStore();

    const [profileUser, setProfileUser] = useState<UserData | null>(null);
    const [userId, setUserId] = useState<string | null>(userIdParam ?? null);
    const [isPublic, setIsPublic] = useState(true);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [followState, setFollowState] = useState<FollowState>('none');
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            // Resolve userId from supabaseUid if needed
            let resolvedId = userId;
            if (!resolvedId && supabaseUid) {
                const { data: u } = await supabase.from('users').select('id').eq('supabase_id', supabaseUid).maybeSingle();
                if (!u) return;
                resolvedId = u.id;
                setUserId(resolvedId);
            }
            if (!resolvedId) return;

            // Load user data
            const { data: u } = await supabase
                .from('users')
                .select('id, supabase_id, full_name, email, avatar_url, role')
                .eq('id', resolvedId)
                .single();
            if (!u) return;
            setProfileUser(u);

            // Privacy
            const { data: up } = await supabase
                .from('user_profiles')
                .select('is_public')
                .eq('user_id', resolvedId)
                .maybeSingle();
            const pub = up?.is_public !== false;
            setIsPublic(pub);

            // Follower / following counts
            const [{ count: fwrs }, { count: fwing }] = await Promise.all([
                supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', resolvedId),
                supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', resolvedId),
            ]);
            setFollowers(fwrs ?? 0);
            setFollowing(fwing ?? 0);

            // My follow state
            if (me?.id) {
                const { data: follows } = await supabase
                    .from('user_follows')
                    .select('follower_id')
                    .eq('follower_id', me.id)
                    .eq('following_id', resolvedId)
                    .maybeSingle();
                if (follows) {
                    setFollowState('following');
                } else {
                    // Check for pending request
                    const { data: req } = await supabase
                        .from('follow_requests')
                        .select('id')
                        .eq('requester_id', me.id)
                        .eq('target_id', resolvedId)
                        .eq('status', 'pending')
                        .maybeSingle();
                    setFollowState(req ? 'pending' : 'none');
                }
            }

            // Posts (only if public or we're following)
            const canSeePosts = pub || followState === 'following';
            if (canSeePosts && u.supabase_id) {
                const { data: fp } = await supabase
                    .from('feed_posts')
                    .select('*')
                    .eq('supabase_uid', u.supabase_id)
                    .order('created_at', { ascending: false })
                    .limit(30);
                setPosts(fp ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, [userId, supabaseUid, me?.id]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const handleFollow = async () => {
        if (!me?.id || followLoading || !userId) return;
        setFollowLoading(true);
        try {
            if (followState === 'following') {
                // Unfollow
                await supabase.from('user_follows').delete().eq('follower_id', me.id).eq('following_id', userId);
                setFollowers((f) => Math.max(0, f - 1));
                setFollowState('none');
            } else if (followState === 'pending') {
                // Cancel request
                await supabase.from('follow_requests').delete().eq('requester_id', me.id).eq('target_id', userId);
                setFollowState('none');
            } else {
                if (isPublic) {
                    // Direct follow
                    await supabase.from('user_follows').insert({ follower_id: me.id, following_id: userId });
                    setFollowers((f) => f + 1);
                    setFollowState('following');
                    // Load posts now
                    if (profileUser?.supabase_id) {
                        const { data: fp } = await supabase
                            .from('feed_posts')
                            .select('*')
                            .eq('supabase_uid', profileUser.supabase_id)
                            .order('created_at', { ascending: false })
                            .limit(30);
                        setPosts(fp ?? []);
                    }
                } else {
                    // Send follow request
                    await supabase.from('follow_requests').insert({ requester_id: me.id, target_id: userId, status: 'pending' });
                    setFollowState('pending');
                    Alert.alert('Solicitud enviada', `Se le ha notificado a ${profileUser?.full_name}. Cuando acepte podrás ver su contenido.`);
                }
            }
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Algo salió mal');
        } finally {
            setFollowLoading(false);
        }
    };

    const canSeePosts = isPublic || followState === 'following';
    const isMe = me?.id === userId;

    // ── Follow button appearance ──────────────────────────────────────────────
    const followBtnLabel = followState === 'following' ? 'Siguiendo' : followState === 'pending' ? 'Solicitado' : isPublic ? 'Seguir' : 'Solicitar';
    const followBtnIcon: any = followState === 'following' ? 'checkmark' : followState === 'pending' ? 'time-outline' : 'person-add-outline';
    const followBtnBg = followState === 'following' ? Colors.surface : followState === 'pending' ? Colors.surface : primary;
    const followBtnBorder = followState === 'none' && !isPublic ? primary : Colors.border;
    const followBtnTextColor = followState === 'following' || followState === 'pending' ? Colors.textSecondary : '#fff';

    if (loading) {
        return (
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={primary} size="large" />
            </LinearGradient>
        );
    }

    if (!profileUser) {
        return (
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: Colors.textSecondary }}>Usuario no encontrado</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            {/* Header nav */}
            <View style={s.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.navTitle}>{profileUser.full_name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Profile header */}
                <LinearGradient colors={[primary + '33', '#0A0A0A']} style={s.headerBg}>
                    {/* Avatar */}
                    <View style={s.avatarWrap}>
                        {profileUser.avatar_url
                            ? <Image source={{ uri: profileUser.avatar_url }} style={[s.avatar, { borderColor: primary }]} />
                            : <LinearGradient colors={[primary, primary + '88']} style={s.avatarPlaceholder}>
                                <Text style={s.avatarInitial}>{profileUser.full_name?.[0] ?? '?'}</Text>
                            </LinearGradient>
                        }
                        {!isPublic && (
                            <View style={[s.lockBadge, { backgroundColor: '#FF9800' }]}>
                                <Ionicons name="lock-closed" size={10} color="#fff" />
                            </View>
                        )}
                    </View>

                    <Text style={s.name}>{profileUser.full_name}</Text>
                    <Text style={s.email}>{profileUser.email}</Text>

                    {/* Social counters */}
                    <View style={s.socialRow}>
                        <View style={s.socialStat}>
                            <Text style={[s.socialNum, { color: primary }]}>{posts.length}</Text>
                            <Text style={s.socialLabel}>Posts</Text>
                        </View>
                        <View style={s.socialDivider} />
                        <View style={s.socialStat}>
                            <Text style={[s.socialNum, { color: primary }]}>{followers}</Text>
                            <Text style={s.socialLabel}>Seguidores</Text>
                        </View>
                        <View style={s.socialDivider} />
                        <View style={s.socialStat}>
                            <Text style={[s.socialNum, { color: primary }]}>{following}</Text>
                            <Text style={s.socialLabel}>Siguiendo</Text>
                        </View>
                    </View>

                    {/* Follow button (not shown for own profile) */}
                    {!isMe && (
                        <TouchableOpacity
                            style={[s.followBtn, { backgroundColor: followBtnBg, borderColor: followBtnBorder }]}
                            onPress={handleFollow}
                            disabled={followLoading}
                        >
                            {followLoading
                                ? <ActivityIndicator size="small" color={followBtnTextColor} />
                                : <>
                                    <Ionicons name={followBtnIcon} size={16} color={followBtnTextColor} />
                                    <Text style={[s.followBtnText, { color: followBtnTextColor }]}>{followBtnLabel}</Text>
                                </>
                            }
                        </TouchableOpacity>
                    )}

                    {/* Privacy badge */}
                    <View style={s.privacyBadge}>
                        <Ionicons name={isPublic ? 'globe-outline' : 'lock-closed-outline'} size={12} color={isPublic ? '#4CAF50' : '#FF9800'} />
                        <Text style={[s.privacyText, { color: isPublic ? '#4CAF50' : '#FF9800' }]}>
                            {isPublic ? 'Cuenta pública' : 'Cuenta privada'}
                        </Text>
                    </View>
                </LinearGradient>

                {/* Posts grid or locked message */}
                {canSeePosts ? (
                    posts.length === 0 ? (
                        <View style={s.empty}>
                            <Ionicons name="image-outline" size={48} color={Colors.textSecondary} />
                            <Text style={s.emptyText}>Sin publicaciones aún</Text>
                        </View>
                    ) : (
                        <View style={s.grid}>
                            {posts.map((p) => (
                                <View key={p.id} style={s.gridCell}>
                                    {p.image_url
                                        ? <Image source={{ uri: p.image_url }} style={s.gridImg} />
                                        : <LinearGradient colors={[primary + '55', primary + '22']} style={s.gridPlaceholder}>
                                            <Ionicons name={p.workout_data ? 'barbell-outline' : 'chatbubble-outline'} size={22} color={primary} />
                                        </LinearGradient>
                                    }
                                    <View style={s.gridOverlay}>
                                        <Ionicons name="heart" size={12} color="#fff" />
                                        <Text style={s.gridLikes}>{p.likes_count ?? 0}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )
                ) : (
                    <View style={s.locked}>
                        <Ionicons name="lock-closed-outline" size={48} color={Colors.textSecondary} />
                        <Text style={s.lockedTitle}>Esta cuenta es privada</Text>
                        <Text style={s.lockedSub}>
                            {followState === 'pending'
                                ? 'Tu solicitud está pendiente de aprobación.'
                                : 'Sigue a esta persona para ver sus publicaciones.'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 56, paddingBottom: Spacing.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    navTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary },
    headerBg: { paddingTop: Spacing.lg, paddingBottom: Spacing.xl, alignItems: 'center', paddingHorizontal: Spacing.base },
    avatarWrap: { position: 'relative', marginBottom: Spacing.md },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3 },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 36, fontWeight: '900', color: '#fff' },
    lockBadge: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background },
    name: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
    email: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
    socialRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.lg },
    socialStat: { alignItems: 'center' },
    socialNum: { fontSize: FontSizes.xl, fontWeight: '900' },
    socialLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    socialDivider: { width: 1, height: 30, backgroundColor: Colors.border },
    followBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 28, paddingVertical: 11, borderRadius: BorderRadius.full, borderWidth: 1, marginBottom: Spacing.md },
    followBtnText: { fontWeight: '700', fontSize: FontSizes.base },
    privacyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    privacyText: { fontSize: FontSizes.xs, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 1 },
    gridCell: { width: '33.33%', aspectRatio: 1, padding: 1, position: 'relative' },
    gridImg: { width: '100%', height: '100%' },
    gridPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    gridOverlay: { position: 'absolute', bottom: 5, left: 5, flexDirection: 'row', alignItems: 'center', gap: 3 },
    gridLikes: { color: '#fff', fontSize: FontSizes.xs, fontWeight: '700', textShadowColor: '#000', textShadowRadius: 4 },
    empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
    emptyText: { color: Colors.textSecondary, fontSize: FontSizes.base },
    locked: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl, gap: Spacing.md },
    lockedTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
    lockedSub: { fontSize: FontSizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
