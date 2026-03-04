import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useThemeStore } from '../../store/themeStore';

// M con trazo muy grueso, caps redondeados, forma del logo original
const MovoMark: React.FC<{ size: number; g0: string; g1: string }> = ({ size, g0, g1 }) => {
    const p = (v: number) => v / 100 * size;
    const sw = p(14); // grosor del trazo

    // Pilares exteriores con caps curvos + V profundo al centro
    // Pilar izquierdo: sube desde abajo, curva en la cima, baja al valle
    const left = `M ${p(12)} ${p(88)} L ${p(12)} ${p(20)} Q ${p(12)} ${p(8)} ${p(24)} ${p(8)} Q ${p(36)} ${p(8)} ${p(36)} ${p(20)} L ${p(36)} ${p(50)} L ${p(50)} ${p(68)}`;
    // Pilar derecho: espejo
    const right = `M ${p(88)} ${p(88)} L ${p(88)} ${p(20)} Q ${p(88)} ${p(8)} ${p(76)} ${p(8)} Q ${p(64)} ${p(8)} ${p(64)} ${p(20)} L ${p(64)} ${p(50)} L ${p(50)} ${p(68)}`;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <SvgGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={g0} />
                    <Stop offset="100%" stopColor={g1} />
                </SvgGradient>
            </Defs>
            <Path d={left}  fill="none" stroke="url(#g)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <Path d={right} fill="none" stroke="url(#g)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
};

interface MovoLogoProps { size?: number; showText?: boolean; color?: string; }

export const MovoLogo: React.FC<MovoLogoProps> = ({ size = 80, showText = true }) => {
    const { gradient } = useThemeStore();
    const g0 = gradient?.[0] ?? '#7B2FBE';
    const g1 = gradient?.[1] ?? '#A855F7';
    return (
        <View style={styles.wrap}>
            <MovoMark size={size} g0={g0} g1={g1} />
            {showText && (
                <Text style={[styles.brand, { color: g1, fontSize: size * 0.22, marginTop: size * 0.08 }]}>MOVO</Text>
            )}
        </View>
    );
};

export const MovoLogoInline: React.FC<{ primary: string }> = ({ primary }) => {
    const { gradient } = useThemeStore();
    const g0 = gradient?.[0] ?? primary;
    const g1 = gradient?.[1] ?? primary;
    return (
        <View style={styles.inline}>
            <MovoMark size={30} g0={g0} g1={g1} />
            <Text style={[styles.inlineBrand, { color: '#FFFFFF' }]}>MOVO</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignItems: 'center' },
    brand: { fontWeight: '900', letterSpacing: 10 },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    inlineBrand: { fontWeight: '900', fontSize: 20, letterSpacing: 4 },
});
