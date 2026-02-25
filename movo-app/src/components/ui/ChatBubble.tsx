import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ChatMessage } from '../../types';
import { Colors, BorderRadius, Spacing, FontSizes } from '../../utils/constants';

interface ChatBubbleProps {
    message: ChatMessage;
    style?: ViewStyle;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, style }) => {
    const isUser = message.role === 'user';
    return (
        <View style={[styles.wrapper, isUser ? styles.userWrapper : styles.botWrapper, style]}>
            {!isUser && (
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>🤖</Text>
                </View>
            )}
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                <Text style={[styles.text, isUser ? styles.userText : styles.botText]}>
                    {message.content}
                </Text>
                <Text style={styles.time}>
                    {new Date(message.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
        alignItems: 'flex-end',
    },
    userWrapper: { justifyContent: 'flex-end' },
    botWrapper: { justifyContent: 'flex-start' },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarText: { fontSize: 16 },
    bubble: {
        maxWidth: '78%',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
    },
    userBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    text: { fontSize: FontSizes.base, lineHeight: 22 },
    userText: { color: '#fff' },
    botText: { color: Colors.textPrimary },
    time: {
        fontSize: FontSizes.xs,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
});
