import React from 'react';
import { View, Text, StyleSheet, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes } from '../../utils/constants';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label, error, containerStyle, leftIcon, rightIcon, style, multiline, numberOfLines, ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputWrapper, error ? styles.errorBorder : null, multiline && styles.multilineWrapper]}>
                {leftIcon && <View style={[styles.iconLeft, multiline && { alignSelf: 'flex-start', paddingTop: Spacing.md }]}>{leftIcon}</View>}
                <TextInput
                    style={[styles.input, leftIcon ? styles.inputWithLeft : null, rightIcon ? styles.inputWithRight : null, multiline && styles.multilineInput, style]}
                    placeholderTextColor={Colors.textMuted}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    {...props}
                />
                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: Spacing.base },
    label: {
        color: Colors.textSecondary,
        fontSize: FontSizes.sm,
        fontWeight: '600',
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    errorBorder: { borderColor: Colors.error },
    input: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: FontSizes.base,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        height: 52,
    },
    multilineWrapper: { alignItems: 'flex-start' },
    multilineInput: { height: undefined, minHeight: 90, paddingTop: Spacing.md },
    inputWithLeft: { paddingLeft: 0 },
    inputWithRight: { paddingRight: 0 },
    iconLeft: { paddingLeft: Spacing.base },
    iconRight: { paddingRight: Spacing.base },
    error: {
        color: Colors.error,
        fontSize: FontSizes.xs,
        marginTop: Spacing.xs,
    },
});
