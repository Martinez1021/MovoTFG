import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { trainerApi } from '../../services/api';
import { TrainerMessage, User } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

export const TrainerMessagesScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const [clients, setClients] = useState<User[]>([]);
    const [selectedClient, setSelectedClient] = useState<User | null>(null);
    const [messages, setMessages] = useState<TrainerMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => { trainerApi.getMyClients().then((r) => setClients(r.data)); }, []);
    useEffect(() => {
        if (route.params?.clientId) {
            const c = clients.find((x) => x.id === route.params.clientId);
            if (c) selectClient(c);
        }
    }, [clients]);

    const selectClient = async (c: User) => {
        setSelectedClient(c);
        const res = await trainerApi.getMessages(c.id);
        setMessages(res.data);
    };

    const sendMsg = async () => {
        if (!selectedClient || !input.trim()) return;
        setSending(true);
        try {
            await trainerApi.sendMessage(selectedClient.id, input.trim());
            setInput('');
            const res = await trainerApi.getMessages(selectedClient.id);
            setMessages(res.data);
        } catch { Alert.alert('Error', 'No se pudo enviar el mensaje'); }
        finally { setSending(false); }
    };

    if (!selectedClient) {
        return (
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
                <View style={s.header}><Text style={s.heading}>Mensajes</Text></View>
                <FlatList data={clients} keyExtractor={(c) => c.id} contentContainerStyle={{ padding: Spacing.base }}
                    renderItem={({ item: c }) => (
                        <TouchableOpacity style={s.clientRow} onPress={() => selectClient(c)}>
                            <View style={s.avatar}><Text style={s.initial}>{c.full_name?.[0]}</Text></View>
                            <View><Text style={s.clientName}>{c.full_name}</Text><Text style={s.clientEmail}>{c.email}</Text></View>
                            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={s.empty}>No tienes clientes asignados</Text>}
                />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={s.chatHeader}>
                    <TouchableOpacity onPress={() => setSelectedClient(null)}><Ionicons name="arrow-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
                    <View style={s.avatar}><Text style={s.initial}>{selectedClient.full_name?.[0]}</Text></View>
                    <Text style={s.clientName}>{selectedClient.full_name}</Text>
                </View>
                <FlatList data={messages} keyExtractor={(m) => m.id} contentContainerStyle={{ padding: Spacing.base }}
                    renderItem={({ item: m }) => (
                        <View style={s.msgBubble}>
                            <Text style={s.msgText}>{m.message}</Text>
                            <Text style={s.msgTime}>{new Date(m.created_at).toLocaleDateString('es')}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={s.empty}>Envía el primer mensaje a {selectedClient.full_name}</Text>}
                />
                <View style={s.inputRow}>
                    <TextInput style={s.textInput} value={input} onChangeText={setInput}
                        placeholder="Escribe un mensaje motivacional..." placeholderTextColor={Colors.textMuted} multiline />
                    <TouchableOpacity onPress={sendMsg} disabled={sending || !input.trim()} style={[s.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}>
                        <LinearGradient colors={Colors.gradientPrimary} style={s.sendGrad}>
                            <Ionicons name="send" size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    header: { padding: Spacing.base, paddingTop: 56 },
    chatHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, paddingTop: 56, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary },
    clientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary },
    initial: { color: Colors.primary, fontWeight: '800' },
    clientName: { color: Colors.textPrimary, fontWeight: '700' },
    clientEmail: { color: Colors.textSecondary, fontSize: FontSizes.sm },
    msgBubble: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm, borderTopLeftRadius: 4 },
    msgText: { color: Colors.textPrimary, fontSize: FontSizes.base, lineHeight: 22 },
    msgTime: { color: Colors.textSecondary, fontSize: FontSizes.xs, marginTop: 6 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
    textInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, color: Colors.textPrimary, fontSize: FontSizes.base, maxHeight: 120, borderWidth: 1, borderColor: Colors.border },
    sendBtn: { marginBottom: 2 },
    sendGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing['2xl'], fontSize: FontSizes.base },
});
