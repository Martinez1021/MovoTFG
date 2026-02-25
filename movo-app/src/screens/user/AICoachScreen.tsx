import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAIStore } from '../../store/aiStore';
import { ChatBubble } from '../../components/ui/ChatBubble';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

const SUGGESTIONS = [
    '¿Cómo mejoro mi técnica en sentadillas?',
    '¿Qué debo comer antes de entrenar?',
    'Dame motivación para hoy 💪',
    '¿Cuántos días debo descansar?',
];

export const AICoachScreen: React.FC = () => {
    const { messages, isLoading, sendMessage, clearConversation } = useAIStore();
    const [input, setInput] = useState('');
    const scrollRef = useRef<ScrollView>(null);

    const handleSend = async (text?: string) => {
        const msg = (text ?? input).trim();
        if (!msg) return;
        setInput('');
        try {
            await sendMessage(msg);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        } catch { /* handled in store */ }
    };

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Header */}
                <View style={s.header}>
                    <View style={s.headerInfo}>
                        <LinearGradient colors={Colors.gradientPrimary} style={s.coachAvatar}>
                            <Text style={{ fontSize: 22 }}>🤖</Text>
                        </LinearGradient>
                        <View>
                            <Text style={s.coachName}>MOVO Coach</Text>
                            <Text style={s.coachStatus}>● Disponible</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={clearConversation}>
                        <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <ScrollView ref={scrollRef} contentContainerStyle={s.messages} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
                    {messages.length === 0 && (
                        <View style={s.emptyState}>
                            <Text style={s.emptyTitle}>¡Hola! Soy MOVO Coach 🤖</Text>
                            <Text style={s.emptySubtitle}>Tu entrenador personal virtual. Pregúntame sobre fitness, nutrición, técnica o motivación.</Text>
                            <View style={s.suggestions}>
                                {SUGGESTIONS.map((sug) => (
                                    <TouchableOpacity key={sug} onPress={() => handleSend(sug)} style={s.sugChip}>
                                        <Text style={s.sugText}>{sug}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                    {messages.map((msg, i) => <ChatBubble key={i} message={msg} />)}
                    {isLoading && (
                        <View style={s.loadingBubble}>
                            <View style={s.avatar}><Text>🤖</Text></View>
                            <View style={s.typingDots}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                                <Text style={s.typingText}>MOVO Coach está escribiendo...</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input */}
                <View style={s.inputRow}>
                    <TextInput
                        style={s.textInput}
                        placeholder="Escribe tu pregunta..."
                        placeholderTextColor={Colors.textMuted}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxLength={500}
                        returnKeyType="send"
                        onSubmitEditing={() => handleSend()}
                    />
                    <TouchableOpacity onPress={() => handleSend()} disabled={isLoading || !input.trim()} style={[s.sendBtn, (!input.trim() || isLoading) && { opacity: 0.4 }]}>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    coachAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    coachName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary },
    coachStatus: { fontSize: FontSizes.xs, color: Colors.success },
    messages: { padding: Spacing.base, paddingBottom: Spacing.xl },
    emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
    emptyTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
    emptySubtitle: { fontSize: FontSizes.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
    suggestions: { gap: Spacing.sm, width: '100%' },
    sugChip: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    sugText: { color: Colors.textPrimary, fontSize: FontSizes.sm },
    loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    typingDots: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    typingText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
    textInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, color: Colors.textPrimary, fontSize: FontSizes.base, maxHeight: 120, borderWidth: 1, borderColor: Colors.border },
    sendBtn: { marginBottom: 2 },
    sendGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
