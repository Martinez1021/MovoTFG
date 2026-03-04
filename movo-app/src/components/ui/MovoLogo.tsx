import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';

// ─── Bold geometric M mark ────────────────────────────────────────────────────
// Clean sans-serif M: two outer pillars + inner V notch
const MovoMark: React.FC<{ size: number; white?: boolean; g0?: string; g1?: string }> = ({
    size, white = false, g0 = '#fff', g1 = '#fff',
}) => {
    const s = size / 100;

    // Solid bold M (100×100 grid, scaled by s)
    // Outer: 8→92 wide, 10→90 tall. Inner V divides at center-top (50,52) down to (50,66)
    const mPath = [
        `M ${8 * s} ${90 * s}`,
        `L ${8 * s} ${10 * s}`,
        `L ${50 * s} ${52 * s}`,
        `L ${92 * s} ${10 * s}`,
        `L ${92 * s} ${90 * s}`,
        `L ${76 * s} ${90 * s}`,
        `L ${76 * s} ${32 * s}`,
        `L ${50 * s} ${66 * s}`,
        `L ${24 * s} ${32 * s}`,
        `L ${24 * s} ${90 * s}`,
        'Z',
    ].join(' ');

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {!white && (
                <Defs>
                    <LinearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor={g1} />
                        <Stop offset="100%" stopColor={g0} />
                    </LinearGradient>
                </Defs>
            )}
            <Path d={mPath} fill={white ? '#FFFFFF' : 'url(#mGrad)'} />
        </Svg>
    );
};

// ── Full centred logo (Splash / Login) ────────────────────────────────────────
interface MovoLogoProps {
    size?: number;
    showText?: boolean;
    color?: string;
}

export const MovoLogo: React.FC<MovoLogoProps> = ({ size = 80, showText = true }) => {
    const { gradient } = useThemeStore();
    const g0 = gradient?.[0] ?? '#7B2FBE';
    const g1 = gradient?.[1] ?? '#A855F7';

    const bgSize = Math.round(size * 1.4);
    const radius = Math.round(bgSize * 0.26);

    return (
        <View style={styles.wrap}>
            {/* Glow ring */}
            <View style={[styles.glowRing, {
                width: bgSize + 10,
                height: bgSize + 10,
                borderRadius: radius + 5,
                borderColor: g1 + '55',
            }]} />

            {/* Gradient background box */}
            <ExpoGradient
                colors={[g0, g1]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={[styles.bgBox, { width: bgSize, height: bgSize, borderRadius: radius }]}
            >
                <MovoMark size={size * 0.68} white />
            </ExpoGradient>

            {showText && (
                <Text style={[styles.brand, { color: g1, fontSize: size * 0.26, marginTop: size * 0.14 }]}>
                    MOVO
                </Text>
            )}
        </View>
    );
};

// ── Inline header version (Home header etc.) ──────────────────────────────────
export const MovoLogoInline: React.FC<{ primary: string }> = ({ primary }) => {
    const { gradient } = useThemeStore();
    const g0 = gradient?.[0] ?? primary;
    const g1 = gradient?.[1] ?? primary;

    return (
        <View style={styles.inline}>
            <ExpoGradient
                colors={[g0, g1]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.inlineBg}
            >
                <MovoMark size={20} white />
            </ExpoGradient>
            <Text style={[styles.inlineBrand, { color: '#FFFFFF' }]}>MOVO</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignItems: 'center' },
    glowRing: {
        position: 'absolute',
        borderWidth: 1.5,
        top: -5,
        left: -5,
    },
    bgBox: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    brand: {
        fontWeight: '900',
        letterSpacing: 10,
    },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inlineBg: {
        width: 28,
        height: 28,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineBrand: { fontWeight: '900', fontSize: 20, letterSpacing: 4 },
});
