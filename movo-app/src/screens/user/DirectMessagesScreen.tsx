import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

interface Conversation {
    uid: string;       // their auth UID
    name: string;
    avatar?: string;
    lastMsg: string;
    lastAt: string;
    unread: number;
}

const timeAgo = (iso: string) => {
    const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 60) return 'ahora';
    if (d < 3600) return `${Math.floor(d / 60)}m`;
    if (d < 86400) return `${Math.floor(d / 3600)}h`;
    if (d < 86400 * 7) return `${Math.floor(d / 86400)}d`;
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export const DirectMessagesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuthStore();
    const { primary } = useThemeStore();
    const [convs, setConvs] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            // Load all messages where I'm involved
            const { data: msgs } = await supabase
                .from('direct_messages')
                .select('id, sender_uid, receiver_uid, content, is_read, created_at')
                .or(`sender_uid.eq.${user.id},receiver_uid.eq.${user.id}`)
                .order('created_at', { ascending: false })
                .limit(300);

            if (!msgs?.length) { setConvs([]); return; }

            // Group by other party
            const map = new Map<string, Conversation>();
            for (const m of msgs) {
                const other = m.sender_uid === user.id ? m.receiver_uid : m.sender_uid;
                if (!map.has(other)) {
                    map.set(other, {
                        uid: other,
                        name: other,
                        lastMsg: m.content,
                        lastAt: m.created_at,
                        unread: (!m.is_read && m.receiver_uid === user.id) ? 1 : 0,
                    });
                } else {
                    const c = map.get(other)!;
                    if (!m.is_read && m.receiver_uid === user.id) c.unread += 1;
                }
            }

            // Resolve names/avatars from users table
            const otherUids = Array.from(map.keys());
            const { data: usersData } = await supabase
                .from('users')
                .select('supabase_id, full_name, avatar_url')
                .in('supabase_id', otherUids);

            for (const u of usersData ?? []) {
                if (map.has(u.supabase_id)) {
                    const c = map.get(u.supabase_id)!;
                    c.name = u.full_name ?? 'Usuario';
                    c.avatar = u.avatar_url ?? undefined;
                }
            }

            setConvs(Array.from(map.values()));
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { load(); }, [load]);

    const renderItem = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={s.row}
            onPress={() => navigation.navigate('Chat', { otherUid: item.uid, otherName: item.name, otherAvatar: item.avatar })}
            activeOpacity={0.75}
        >
            {item.avatar
                ? <Image source={{ uri: item.avatar }} style={s.avatar} />
                : <LinearGradient colors={[primary, primary + '88']} style={s.avatarFb}>
                    <Text style={s.avatarLetter}>{item.name[0]?.toUpperCase() ?? '?'}</Text>
                  </LinearGradient>
            }
            <View style={{ flex: 1 }}>
                <View style={s.rowTop}>
                    <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={s.time}>{timeAgo(item.lastAt)}</Text>
                </View>
                <View style={s.rowBot}>
                    <Text style={[s.preview, item.unread > 0 && { color: Colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
                        {item.lastMsg}
                    </Text>
                    {item.unread > 0 && (
                        <View style={[s.badge, { backgroundColor: primary }]}>
                            <Text style={s.badgeText}>{item.unread > 9 ? '9+' : item.unread}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.heading}>💬 Mensajes</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator color={primary} size="large" style={{ marginTop: 60 }} />
            ) : convs.length === 0 ? (
                <View style={s.empty}>
                    <Ionicons name="chatbubbles-outline" size={56} color={Colors.textSecondary} />
                    <Text style={s.emptyTitle}>Sin mensajes aún</Text>
                    <Text style={s.emptySub}>Busca un amigo y toca "Mensaje" para chatear</Text>
                </View>
            ) : (
                <FlatList
                    data={convs}
                    keyExtractor={(c) => c.uid}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 58, paddingBottom: Spacing.md },
    back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    heading: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textPrimary },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    avatarFb: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '900' },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    name: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
    time: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    rowBot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    preview: { fontSize: FontSizes.sm, color: Colors.textSecondary, flex: 1 },
    badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
    emptyTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.textPrimary },
    emptySub: { fontSize: FontSizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
