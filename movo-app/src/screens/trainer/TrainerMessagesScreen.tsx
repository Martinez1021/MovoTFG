import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTrainerStore } from '../../store/trainerStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

interface DirectMessage {
    id: string;
    sender_uid: string;
    receiver_uid: string;
    content: string;
    created_at: string;
    read: boolean;
}

const tTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const tDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

const ClientAvatar: React.FC<{ name: string; url?: string | null; size?: number; primary: string }> = ({ name, url, size = 40, primary }) => {
    if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    return (
        <LinearGradient colors={[primary, primary + '88']} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: Math.round(size * 0.38) }}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
        </LinearGradient>
    );
};

export const TrainerMessagesScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { user } = useAuthStore();
    const { clients, fetchClients } = useTrainerStore();
    const { primary } = useThemeStore();

    const [selectedClientId, setSelectedClientId] = useState<string | null>(route.params?.clientId ?? null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const flatRef = useRef<FlatList>(null);
    const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Always keep client list hydrated
    useFocusEffect(useCallback(() => {
        fetchClients();
        // Auto-select client from navigation params
        if (route.params?.clientId) setSelectedClientId(route.params.clientId);
    }, [route.params?.clientId]));

    const selectedClient = clients.find((c) => c.id === selectedClientId);

    // ── Load messages ───────────────────────────────────────────────────────
    const loadMessages = useCallback(async () => {
        if (!selectedClient) return;
        const { data: { session } } = await supabase.auth.getSession();
        const trainerUid = session?.user?.id;
        if (!trainerUid) return;
        let clientUid = selectedClient.supabase_id;
        if (!clientUid) {
            const { data: row } = await supabase
                .from('users').select('supabase_id').eq('id', selectedClient.id).maybeSingle();
            clientUid = row?.supabase_id ?? null;
        }
        if (!clientUid) return;
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .or(
                `and(sender_uid.eq.${trainerUid},receiver_uid.eq.${clientUid}),` +
                `and(sender_uid.eq.${clientUid},receiver_uid.eq.${trainerUid})`
            )
            .order('created_at', { ascending: true });
        if (data) setMessages(data as DirectMessage[]);
    }, [selectedClient]);

    useEffect(() => {
        if (!selectedClientId) return;
        setLoadingMsgs(true);
        loadMessages().finally(() => setLoadingMsgs(false));
        // Poll every 5 seconds for new messages
        pollerRef.current = setInterval(loadMessages, 5000);
        return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
    }, [selectedClientId, loadMessages]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages.length]);

    // ── Send ────────────────────────────────────────────────────────────────
    const sendMsg = async () => {
        if (!selectedClient || !input.trim() || !user) return;
        const text = input.trim();
        setInput('');
        setSending(true);
        try {
            // trainer uid = Supabase auth UUID (user.id is preserved as auth UUID)
            const { data: { session } } = await supabase.auth.getSession();
            const trainerUid = session?.user?.id;
            if (!trainerUid) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');

            // client supabase_id: comes from users table (supabase_id column)
            let clientUid = selectedClient.supabase_id;
            if (!clientUid) {
                // fallback: look it up directly (happens if backfill SQL not yet run)
                const { data: row } = await supabase
                    .from('users').select('supabase_id').eq('id', selectedClient.id).maybeSingle();
                clientUid = row?.supabase_id ?? null;
            }
            if (!clientUid) throw new Error('No se pudo obtener el identificador del cliente. Ejecuta el SQL de configuración en Supabase.');

            const { error } = await supabase.from('direct_messages').insert({
                sender_uid: trainerUid,
                receiver_uid: clientUid,
                content: text,
                is_read: false,
            });
            if (error) throw error;
            await loadMessages();
        } catch (e: any) {
            setInput(text); // restore on failure
            Alert.alert('Error', e?.message ?? 'No se pudo enviar el mensaje');
        } finally {
            setSending(false);
        }
    };

    // ── Client list view ────────────────────────────────────────────────────
    if (!selectedClientId || !selectedClient) {
        return (
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
                <View style={s.header}>
                    <Text style={s.heading}>Mensajes</Text>
                    <Text style={s.subheading}>Comunícate con tus clientes</Text>
                </View>
                <FlatList
                    data={clients}
                    keyExtractor={(c) => c.id}
                    contentContainerStyle={{ padding: Spacing.base }}
                    renderItem={({ item: c }) => (
                        <TouchableOpacity
                            style={s.clientRow}
                            onPress={() => setSelectedClientId(c.id)}
                            activeOpacity={0.75}
                        >
                            <ClientAvatar name={c.full_name} url={c.avatar_url} size={44} primary={primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={s.clientName}>{c.full_name}</Text>
                                <Text style={s.clientEmail}>{c.email}</Text>
                            </View>
                            <View style={[s.chatBadge, { backgroundColor: primary + '22', borderColor: primary + '44' }]}>
                                <Ionicons name="chatbubble-outline" size={14} color={primary} />
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={s.emptyBox}>
                            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textSecondary} />
                            <Text style={s.empty}>Sin clientes asignados</Text>
                            <Text style={s.emptySub}>Acepta solicitudes en el Dashboard para ver clientes aquí</Text>
                        </View>
                    }
                />
            </LinearGradient>
        );
    }

    // ── Chat view ────────────────────────────────────────────────────────────
    const trainerUid = user?.supabase_id ?? user?.id ?? '';

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
                {/* Chat header */}
                <View style={s.chatHeader}>
                    <TouchableOpacity onPress={() => setSelectedClientId(null)} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <ClientAvatar name={selectedClient.full_name} url={selectedClient.avatar_url} size={38} primary={primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={s.clientName}>{selectedClient.full_name}</Text>
                        <Text style={[s.clientEmail, { fontSize: 11 }]}>{selectedClient.email}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('ClientDetail', { clientId: selectedClientId })} style={{ padding: 6 }}>
                        <Ionicons name="person-circle-outline" size={22} color={primary} />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                {loadingMsgs ? (
                    <ActivityIndicator color={primary} style={{ marginTop: 60 }} />
                ) : (
                    <FlatList
                        ref={flatRef}
                        data={messages}
                        keyExtractor={(m) => m.id}
                        contentContainerStyle={{ padding: Spacing.base, paddingBottom: Spacing.xl }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item: m, index }) => {
                            const isMine = m.sender_uid === trainerUid;
                            const showDate = index === 0 || tDate(messages[index - 1].created_at) !== tDate(m.created_at);
                            return (
                                <View>
                                    {showDate && (
                                        <View style={s.dateSeparator}>
                                            <View style={s.dateLine} />
                                            <Text style={s.dateLabel}>{tDate(m.created_at)}</Text>
                                            <View style={s.dateLine} />
                                        </View>
                                    )}
                                    <View style={[s.bubbleRow, isMine && { justifyContent: 'flex-end' }]}>
                                        {!isMine && (
                                            <ClientAvatar name={selectedClient.full_name} url={selectedClient.avatar_url} size={28} primary={primary} />
                                        )}
                                        <View style={[
                                            s.bubble,
                                            isMine
                                                ? { backgroundColor: primary, borderBottomRightRadius: 4 }
                                                : { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
                                        ]}>
                                            <Text style={[s.bubbleText, isMine && { color: '#fff' }]}>{m.content}</Text>
                                            <Text style={[s.bubbleTime, isMine && { color: 'rgba(255,255,255,0.65)' }]}>{tTime(m.created_at)}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={s.emptyBox}>
                                <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.textSecondary} />
                                <Text style={s.empty}>Sin mensajes aún</Text>
                                <Text style={s.emptySub}>Envía el primer mensaje a {selectedClient.full_name}</Text>
                            </View>
                        }
                    />
                )}

                {/* Input */}
                <View style={s.inputRow}>
                    <TextInput
                        style={s.textInput}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Escribe un mensaje motivacional..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        maxLength={500}
                        onSubmitEditing={sendMsg}
                    />
                    <TouchableOpacity
                        onPress={sendMsg}
                        disabled={sending || !input.trim()}
                        style={[s.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
                    >
                        <LinearGradient colors={[primary, primary + 'BB']} style={s.sendGrad}>
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={18} color="#fff" />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    header: { padding: Spacing.base, paddingTop: 56, paddingBottom: Spacing.md },
    chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: 56, paddingBottom: Spacing.md, gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 4, borderWidth: 1, borderColor: Colors.border },
    heading: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.textPrimary },
    subheading: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    clientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
    chatBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    clientName: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSizes.base },
    clientEmail: { color: Colors.textSecondary, fontSize: FontSizes.sm },
    emptyBox: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm, paddingHorizontal: Spacing['2xl'] },
    empty: { color: Colors.textSecondary, textAlign: 'center', fontSize: FontSizes.base, fontWeight: '600' },
    emptySub: { color: Colors.textMuted, textAlign: 'center', fontSize: FontSizes.sm, lineHeight: 18 },
    dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md, gap: Spacing.sm },
    dateLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    dateLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600' },
    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
    bubble: { maxWidth: '72%', borderRadius: 18, padding: Spacing.md, paddingHorizontal: 14 },
    bubbleText: { color: Colors.textPrimary, fontSize: FontSizes.base, lineHeight: 22 },
    bubbleTime: { fontSize: 10, color: Colors.textSecondary, marginTop: 4, textAlign: 'right' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
    textInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, color: Colors.textPrimary, fontSize: FontSizes.base, maxHeight: 120, borderWidth: 1, borderColor: Colors.border },
    sendBtn: { marginBottom: 2 },
    sendGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
