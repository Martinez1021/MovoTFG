import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontSizes } from '../../utils/constants';

interface ProgressRingProps {
    progress: number; // 0–1
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    sublabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress, size = 80, strokeWidth = 8, color = Colors.primary, label, sublabel,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

    return (
        <View style={styles.container}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                {/* Track */}
                <Circle cx={size / 2} cy={size / 2} r={radius}
                    stroke={Colors.border} strokeWidth={strokeWidth} fill="none" />
                {/* Progress */}
                <Circle cx={size / 2} cy={size / 2} r={radius}
                    stroke={color} strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </Svg>
            {label && (
                <View style={[styles.labelContainer, { width: size, height: size }]}>
                    <Text style={[styles.label, { color }]}>{label}</Text>
                    {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    labelContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: FontSizes.base, fontWeight: '800' },
    sublabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 1 },
});
