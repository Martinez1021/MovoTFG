import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

interface UserRow {
    id: string;           // users.id (internal)
    supabase_id: string;
    full_name: string;
    avatar_url?: string;
    email?: string;
}

export const FollowListScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
    const { type, userId, title } = route.params as {
        type: 'followers' | 'following';
        userId: string;   // internal users.id of the profile being viewed
        title: string;
    };
    const { primary } = useThemeStore();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            let ids: string[] = [];
            if (type === 'followers') {
                // who follows this user → follower_id list
                const { data } = await supabase
                    .from('user_follows')
                    .select('follower_id')
                    .eq('following_id', userId);
                ids = (data ?? []).map((r: any) => r.follower_id);
            } else {
                // who this user follows → following_id list
                const { data } = await supabase
                    .from('user_follows')
                    .select('following_id')
                    .eq('follower_id', userId);
                ids = (data ?? []).map((r: any) => r.following_id);
            }

            if (ids.length === 0) { setUsers([]); return; }

            const { data: rows } = await supabase
                .from('users')
                .select('id, supabase_id, full_name, avatar_url, email')
                .in('id', ids);
            setUsers(rows ?? []);
        } finally {
            setLoading(false);
        }
    }, [type, userId]);

    useEffect(() => { load(); }, [load]);

    const goToProfile = (u: UserRow) => {
        navigation.navigate('UserProfile', { userId: u.id, supabaseUid: u.supabase_id });
    };

    const renderItem = ({ item }: { item: UserRow }) => (
        <TouchableOpacity style={s.row} onPress={() => goToProfile(item)} activeOpacity={0.75}>
            {item.avatar_url
                ? <Image source={{ uri: item.avatar_url }} style={s.avatar} />
                : <LinearGradient colors={[primary, primary + '88']} style={s.avatarFb}>
                    <Text style={s.avatarLetter}>{item.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
                  </LinearGradient>
            }
            <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{item.full_name}</Text>
                {item.email ? <Text style={s.email} numberOfLines={1}>{item.email}</Text> : null}
            </View>
            <View style={[s.visitBtn, { borderColor: primary + '55' }]}>
                <Text style={[s.visitText, { color: primary }]}>Ver perfil</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.heading}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator color={primary} size="large" style={{ marginTop: 60 }} />
            ) : users.length === 0 ? (
                <View style={s.empty}>
                    <Ionicons name="people-outline" size={52} color={Colors.textSecondary} />
                    <Text style={s.emptyTitle}>Sin {type === 'followers' ? 'seguidores' : 'seguidos'} aún</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(u) => u.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ItemSeparatorComponent={() => <View style={s.sep} />}
                />
            )}
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.base, paddingTop: 58, paddingBottom: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    back: {
        width: 40, height: 40, borderRadius: 20, alignItems: 'center',
        justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    },
    heading: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarFb: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '900' },
    name: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    email: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    visitBtn: {
        borderWidth: 1, borderRadius: BorderRadius.full,
        paddingHorizontal: 14, paddingVertical: 6,
    },
    visitText: { fontSize: FontSizes.sm, fontWeight: '700' },
    sep: { height: 1, backgroundColor: Colors.border, marginLeft: 76 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    emptyTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textSecondary },
});
