import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, TextInput, KeyboardAvoidingView, Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

interface Message {
    id: string;
    sender_uid: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

export const ChatScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
    const { otherUid, otherName, otherAvatar } = route.params as {
        otherUid: string; otherName: string; otherAvatar?: string;
    };
    const { user } = useAuthStore();
    const { primary } = useThemeStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const listRef = useRef<FlatList>(null);

    const load = useCallback(async () => {
        if (!user?.id) return;
        const { data } = await supabase
            .from('direct_messages')
            .select('id, sender_uid, content, is_read, created_at')
            .or(
                `and(sender_uid.eq.${user.id},receiver_uid.eq.${otherUid}),and(sender_uid.eq.${otherUid},receiver_uid.eq.${user.id})`
            )
            .order('created_at', { ascending: true })
            .limit(100);
        setMessages(data ?? []);
        setLoading(false);

        // Mark all their messages as read
        await supabase
            .from('direct_messages')
            .update({ is_read: true })
            .eq('sender_uid', otherUid)
            .eq('receiver_uid', user.id)
            .eq('is_read', false);
    }, [user?.id, otherUid]);

    useEffect(() => { load(); }, [load]);

    // Subscribe to realtime new messages
    useEffect(() => {
        if (!user?.id) return;
        const channel = supabase
            .channel(`chat:${[user.id, otherUid].sort().join(':')}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `receiver_uid=eq.${user.id}`,
            }, (payload) => {
                const m = payload.new as Message;
                if (m.sender_uid === otherUid) {
                    setMessages((prev) => [...prev, m]);
                    // mark as read immediately
                    supabase.from('direct_messages').update({ is_read: true }).eq('id', m.id);
                    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user?.id, otherUid]);

    const send = async () => {
        if (!text.trim() || !user?.id || sending) return;
        const content = text.trim();
        setText('');
        setSending(true);
        const optimistic: Message = {
            id: `tmp-${Date.now()}`,
            sender_uid: user.id,
            content,
            is_read: false,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .insert({ sender_uid: user.id, receiver_uid: otherUid, content })
                .select('id, sender_uid, content, is_read, created_at')
                .single();
            if (error) {
                console.error('[chat] insert error:', error.message, error.code);
                // Remove optimistic and restore text so the user can retry
                setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
                setText(content);
            } else if (data) {
                setMessages((prev) => prev.map((m) => m.id === optimistic.id ? data : m));
            }
        } catch (e) {
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            setText(content);
        } finally {
            setSending(false);
        }
    };

    const renderItem = ({ item, index }: { item: Message; index: number }) => {
        const mine = item.sender_uid === user?.id;
        const prev = messages[index - 1];
        const showDate = !prev || new Date(item.created_at).toDateString() !== new Date(prev.created_at).toDateString();
        return (
            <>
                {showDate && (
                    <View style={s.dateSep}>
                        <Text style={s.dateText}>
                            {new Date(item.created_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Text>
                    </View>
                )}
                <View style={[s.msgRow, mine ? s.msgRowMine : s.msgRowTheirs]}>
                    {!mine && (
                        otherAvatar
                            ? <Image source={{ uri: otherAvatar }} style={s.msgAvatar} />
                            : <LinearGradient colors={[primary, primary + '88']} style={s.msgAvatarFb}>
                                <Text style={s.msgAvatarLetter}>{otherName[0]?.toUpperCase()}</Text>
                              </LinearGradient>
                    )}
                    <View style={[s.bubble, mine ? [s.bubbleMine, { backgroundColor: primary }] : s.bubbleTheirs]}>
                        <Text style={[s.bubbleText, mine && { color: '#fff' }]}>{item.content}</Text>
                        <Text style={[s.bubbleTime, mine && { color: 'rgba(255,255,255,0.65)' }]}>
                            {timeLabel(item.created_at)}{mine && (item.is_read ? ' ✓✓' : ' ✓')}
                        </Text>
                    </View>
                </View>
            </>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={s.headerInfo}>
                        {otherAvatar
                            ? <Image source={{ uri: otherAvatar }} style={s.headerAvatar} />
                            : <LinearGradient colors={[primary, primary + '88']} style={s.headerAvatarFb}>
                                <Text style={s.headerAvatarLetter}>{otherName[0]?.toUpperCase()}</Text>
                              </LinearGradient>
                        }
                        <View>
                            <Text style={s.headerName}>{otherName}</Text>
                            <Text style={s.headerSub}>Amigo/a</Text>
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Messages */}
                {loading ? (
                    <ActivityIndicator color={primary} size="large" style={{ marginTop: 60 }} />
                ) : (
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={(m) => m.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, paddingBottom: 20 }}
                        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                        ListEmptyComponent={
                            <View style={s.empty}>
                                <Ionicons name="chatbubble-outline" size={48} color={Colors.textSecondary} />
                                <Text style={s.emptyText}>Empieza la conversación</Text>
                            </View>
                        }
                    />
                )}

                {/* Input */}
                <View style={s.inputRow}>
                    <TextInput
                        style={s.input}
                        placeholder="Escribe un mensaje…"
                        placeholderTextColor={Colors.textSecondary}
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={500}
                        returnKeyType="send"
                        onSubmitEditing={send}
                    />
                    <TouchableOpacity
                        onPress={send}
                        disabled={!text.trim() || sending}
                        style={[s.sendBtn, { backgroundColor: text.trim() ? primary : Colors.surface }]}
                    >
                        {sending
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="send" size={18} color={text.trim() ? '#fff' : Colors.textSecondary} />
                        }
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 58, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    headerInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerAvatar: { width: 38, height: 38, borderRadius: 19 },
    headerAvatarFb: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    headerAvatarLetter: { color: '#fff', fontWeight: '800', fontSize: FontSizes.base },
    headerName: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    headerSub: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    dateSep: { alignItems: 'center', marginVertical: Spacing.md },
    dateText: { fontSize: FontSizes.xs, color: Colors.textSecondary, backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
    msgRowMine: { justifyContent: 'flex-end' },
    msgRowTheirs: { justifyContent: 'flex-start' },
    msgAvatar: { width: 28, height: 28, borderRadius: 14, marginBottom: 4 },
    msgAvatarFb: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    msgAvatarLetter: { color: '#fff', fontSize: 11, fontWeight: '800' },
    bubble: { maxWidth: '72%', borderRadius: 16, padding: 10, paddingBottom: 6 },
    bubbleMine: { borderBottomRightRadius: 4 },
    bubbleTheirs: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: FontSizes.sm, color: Colors.textPrimary, lineHeight: 20 },
    bubbleTime: { fontSize: 10, color: Colors.textSecondary, textAlign: 'right', marginTop: 2 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: '#0A0A0A' },
    input: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary, fontSize: FontSizes.sm, paddingHorizontal: Spacing.md, paddingVertical: 10, maxHeight: 120 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    empty: { flex: 1, alignItems: 'center', gap: Spacing.md, paddingTop: 80 },
    emptyText: { color: Colors.textSecondary, fontSize: FontSizes.base },
});
