import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../utils/constants';

interface StatsBadgeProps {
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
}

export const StatsBadge: React.FC<StatsBadgeProps> = ({ label, value, icon, color = Colors.primary }) => (
    <View style={styles.badge}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    badge: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 2,
    },
    icon: { fontSize: 18 },
    value: { fontSize: FontSizes.xl, fontWeight: '900' },
    label: { fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'center' },
});
