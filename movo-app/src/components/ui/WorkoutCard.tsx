import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Routine } from '../../types';
import { Colors, BorderRadius, Spacing, FontSizes, CategoryColors, DifficultyColors } from '../../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

interface WorkoutCardProps {
    routine: Routine;
    onPress?: () => void;
    style?: ViewStyle;
    showAssignButton?: boolean;
    onAssign?: () => void;
}

const diffLabels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
};

const categoryEmoji: Record<string, string> = {
    gym: '🏋️',
    yoga: '🧘',
    pilates: '🌀',
};

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ routine, onPress, style, showAssignButton, onAssign }) => {
    const grad = CategoryColors[routine.category] ?? Colors.gradientPrimary;
    return (
        <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.container, style]}>
            <LinearGradient
                colors={grad as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.colorBar}
            />
            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.emoji}>{categoryEmoji[routine.category]}</Text>
                    <View style={styles.meta}>
                        <View style={[styles.diffBadge, { backgroundColor: DifficultyColors[routine.difficulty] + '22' }]}>
                            <Text style={[styles.diffText, { color: DifficultyColors[routine.difficulty] }]}>
                                {diffLabels[routine.difficulty]}
                            </Text>
                        </View>
                    </View>
                </View>
                <Text style={styles.title} numberOfLines={1}>{routine.title}</Text>
                <Text style={styles.description} numberOfLines={2}>{routine.description}</Text>
                <View style={styles.footer}>
                    <View style={styles.stat}>
                        <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.statText}>{routine.duration_minutes} min</Text>
                    </View>
                    {showAssignButton && (
                        <TouchableOpacity style={styles.assignBtn} onPress={onAssign}>
                            <Text style={styles.assignText}>Asignar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        flexDirection: 'row',
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    colorBar: { width: 4 },
    content: { flex: 1, padding: Spacing.base },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
    emoji: { fontSize: 22, marginRight: Spacing.sm },
    meta: { flex: 1, alignItems: 'flex-end' },
    diffBadge: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
    },
    diffText: { fontSize: FontSizes.xs, fontWeight: '700' },
    title: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: '700', marginBottom: 2 },
    description: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginBottom: Spacing.sm },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { color: Colors.textSecondary, fontSize: FontSizes.xs },
    assignBtn: {
        backgroundColor: Colors.primary + '22',
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
    },
    assignText: { color: Colors.primary, fontSize: FontSizes.xs, fontWeight: '700' },
});
