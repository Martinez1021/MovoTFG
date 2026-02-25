import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '../../utils/constants';

interface GoalChipProps {
    label: string;
    selected: boolean;
    onPress: () => void;
}

export const GoalChip: React.FC<GoalChipProps> = ({ label, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.chip, selected && styles.chipSelected]}
        onPress={onPress}
        activeOpacity={0.75}
    >
        <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipSelected: {
        backgroundColor: Colors.primary + '22',
        borderColor: Colors.primary,
    },
    text: {
        color: Colors.textSecondary,
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
    textSelected: {
        color: Colors.primary,
    },
});
