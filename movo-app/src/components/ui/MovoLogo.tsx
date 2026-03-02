import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useThemeStore } from '../../store/themeStore';

// ─── The MOVO "M" mark — faithful recreation of the brand logo ────────────────
// Each half is a tall rounded slab with an inward arch on the inner side,
// the two together read as the letter M.
const MovoMark: React.FC<{ size: number; color: string }> = ({ size, color }) => {
    const s = size / 100; // scale factor

    // Left slab: outer rounded rect with a concave notch on its right edge (inner side)
    const left = `
        M ${13 * s} ${77 * s}
        C ${13 * s} ${86 * s} ${19 * s} ${92 * s} ${28 * s} ${92 * s}
        L ${34 * s} ${92 * s}
        C ${43 * s} ${92 * s} ${47 * s} ${86 * s} ${47 * s} ${77 * s}
        L ${47 * s} ${62 * s}
        C ${47 * s} ${53 * s} ${40 * s} ${47 * s} ${34 * s} ${47 * s}
        C ${40 * s} ${47 * s} ${47 * s} ${41 * s} ${47 * s} ${32 * s}
        L ${47 * s} ${23 * s}
        C ${47 * s} ${14 * s} ${43 * s} ${8 * s} ${34 * s} ${8 * s}
        L ${28 * s} ${8 * s}
        C ${19 * s} ${8 * s} ${13 * s} ${14 * s} ${13 * s} ${23 * s}
        Z
    `;

    // Right slab: mirror image
    const right = `
        M ${87 * s} ${77 * s}
        C ${87 * s} ${86 * s} ${81 * s} ${92 * s} ${72 * s} ${92 * s}
        L ${66 * s} ${92 * s}
        C ${57 * s} ${92 * s} ${53 * s} ${86 * s} ${53 * s} ${77 * s}
        L ${53 * s} ${62 * s}
        C ${53 * s} ${53 * s} ${60 * s} ${47 * s} ${66 * s} ${47 * s}
        C ${60 * s} ${47 * s} ${53 * s} ${41 * s} ${53 * s} ${32 * s}
        L ${53 * s} ${23 * s}
        C ${53 * s} ${14 * s} ${57 * s} ${8 * s} ${66 * s} ${8 * s}
        L ${72 * s} ${8 * s}
        C ${81 * s} ${8 * s} ${87 * s} ${14 * s} ${87 * s} ${23 * s}
        Z
    `;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <G>
                <Path d={left} fill={color} />
                <Path d={right} fill={color} />
            </G>
        </Svg>
    );
};

// ── Full centred logo (Splash / Login) ────────────────────────────────────────
interface MovoLogoProps {
    size?: number;
    showText?: boolean;
    /** force icon color; defaults to theme primary */
    color?: string;
}

export const MovoLogo: React.FC<MovoLogoProps> = ({ size = 80, showText = true, color }) => {
    const { primary } = useThemeStore();
    const iconColor = color ?? primary;

    return (
        <View style={styles.wrap}>
            <MovoMark size={size} color={iconColor} />
            {showText && (
                <Text style={[styles.brand, { color: iconColor, fontSize: size * 0.28, marginTop: size * 0.1 }]}>
                    MOVO
                </Text>
            )}
        </View>
    );
};

// ── Inline header version (Home header etc.) ──────────────────────────────────
export const MovoLogoInline: React.FC<{ primary: string }> = ({ primary }) => (
    <View style={styles.inline}>
        <MovoMark size={30} color={primary} />
        <Text style={[styles.inlineBrand, { color: primary }]}>MOVO</Text>
    </View>
);

const styles = StyleSheet.create({
    wrap: { alignItems: 'center' },
    brand: {
        fontWeight: '900',
        letterSpacing: 8,
    },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    inlineBrand: { fontWeight: '900', fontSize: 20, letterSpacing: 3 },
});
