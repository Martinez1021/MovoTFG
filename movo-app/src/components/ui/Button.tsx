import React from 'react';
import {
    TouchableOpacity, Text, ActivityIndicator, StyleSheet,
    TouchableOpacityProps, ViewStyle, TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, FontSizes } from '../../utils/constants';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title, variant = 'primary', size = 'md', loading, fullWidth, style, textStyle, disabled, ...props
}) => {
    const sizeStyles = { sm: 36, md: 48, lg: 56 }[size];
    const fontSize = { sm: FontSizes.sm, md: FontSizes.base, lg: FontSizes.md }[size];

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                disabled={disabled || loading}
                style={[{ width: fullWidth ? '100%' : undefined }, style]}
                {...props}
            >
                <LinearGradient
                    colors={Colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.base, { height: sizeStyles, opacity: disabled ? 0.5 : 1 }]}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={[styles.primaryText, { fontSize }, textStyle]}>{title}</Text>
                    }
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    const variantStyle: Record<string, ViewStyle> = {
        secondary: { backgroundColor: Colors.secondary },
        outline: { borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: 'transparent' },
        ghost: { backgroundColor: 'transparent' },
    };

    const variantTextColor: Record<string, string> = {
        secondary: '#fff',
        outline: Colors.primary,
        ghost: Colors.textSecondary,
    };

    return (
        <TouchableOpacity
            disabled={disabled || loading}
            style={[
                styles.base,
                { height: sizeStyles, width: fullWidth ? '100%' : undefined, opacity: disabled ? 0.5 : 1 },
                variantStyle[variant],
                style,
            ]}
            {...props}
        >
            {loading
                ? <ActivityIndicator color={variantTextColor[variant]} size="small" />
                : <Text style={[styles.primaryText, { fontSize, color: variantTextColor[variant] }, textStyle]}>{title}</Text>
            }
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    primaryText: {
        color: Colors.textPrimary,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
