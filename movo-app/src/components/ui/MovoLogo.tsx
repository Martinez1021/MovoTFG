import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useThemeStore } from '../../store/themeStore';

// ─── M con trazo redondeado y gradiente (fiel al logo) ───────────────────────
const MovoMark: React.FC<{ size: number; g0: string; g1: string }> = ({ size, g0, g1 }) => {
    const sw = size * 0.135; // stroke width
    // Puntos del M sobre rejilla size×size
    const lx = size * 0.20;  // pilar izquierdo x
    const rx = size * 0.80;  // pilar derecho x
    const cx = size * 0.50;  // centro x
    const ty = size * 0.18;  // top y
    const by = size * 0.82;  // bottom y
    const vy = size * 0.62;  // valle V

    const d = `M ${lx} ${by} L ${lx} ${ty} L ${cx} ${vy} L ${rx} ${ty} L ${rx} ${by}`;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <LinearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={g0} />
                    <Stop offset="100%" stopColor={g1} />
                </LinearGradient>
            </Defs>
            <Path
                d={d}
                fill="none"
                stroke="url(#mGrad)"
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
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
            <View style={[styles.bgBox, { width: bgSize, height: bgSize, borderRadius: radius }]}>
                <MovoMark size={bgSize * 0.78} g0={g0} g1={g1} />
            </View>
            {showText && (
                <Text style={[styles.brand, { color: g1, fontSize: size * 0.26, marginTop: size * 0.14 }]}>
                    MOVO
                </Text>
            )}
        </View>
    );
};

// ── Inline header version ─────────────────────────────────────────────────────
export const MovoLogoInline: React.FC<{ primary: string }> = ({ primary }) => {
    const { gradient } = useThemeStore();
    const g0 = gradient?.[0] ?? primary;
    const g1 = gradient?.[1] ?? primary;
    return (
        <View style={styles.inline}>
            <View style={styles.inlineBg}>
                <MovoMark size={20} g0={g0} g1={g1} />
            </View>
            <Text style={[styles.inlineBrand, { color: '#FFFFFF' }]}>MOVO</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignItems: 'center' },
    bgBox: {
        backgroundColor: '#0A0A0A',
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
        borderRadius: 8,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineBrand: { fontWeight: '900', fontSize: 20, letterSpacing: 4 },
});
