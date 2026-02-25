import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, FontSizes } from '../../utils/constants';

interface GradientCardProps {
    title: string;
    subtitle?: string;
    gradient: readonly string[];
    emoji?: string;
    onPress?: () => void;
    style?: ViewStyle;
    children?: React.ReactNode;
    badge?: string;
}

export const GradientCard: React.FC<GradientCardProps> = ({
    title, subtitle, gradient, emoji, onPress, style, children, badge,
}) => {
    const Wrapper: any = onPress ? TouchableOpacity : View;
    return (
        <Wrapper onPress={onPress} activeOpacity={0.85} style={[styles.wrapper, style]}>
            <LinearGradient
                colors={gradient as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
                {emoji && <Text style={styles.emoji}>{emoji}</Text>}
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                {children}
            </LinearGradient>
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: { padding: Spacing.lg, minHeight: 120 },
    badge: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
    },
    badgeText: { color: '#fff', fontSize: FontSizes.xs, fontWeight: '700' },
    emoji: { fontSize: 32, marginBottom: Spacing.xs },
    title: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '800' },
    subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.sm, marginTop: 3 },
});
