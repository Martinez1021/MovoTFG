import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

const logoImg = require('../../../assets/icon.png');

// ── Full centred logo (Splash / Login) ────────────────────────────────────────
interface MovoLogoProps {
    size?: number;
    showText?: boolean;
    color?: string;
}

export const MovoLogo: React.FC<MovoLogoProps> = ({ size = 80, showText = true }) => {
    const { gradient } = useThemeStore();
    const g1 = gradient?.[1] ?? '#A855F7';

    return (
        <View style={styles.wrap}>
            <Image source={logoImg} style={{ width: size, height: size, borderRadius: size * 0.22 }} resizeMode="cover" />
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
    const g1 = gradient?.[1] ?? primary;
    return (
        <View style={styles.inline}>
            <Image source={logoImg} style={styles.inlineImg} resizeMode="cover" />
            <Text style={[styles.inlineBrand, { color: '#FFFFFF' }]}>MOVO</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignItems: 'center' },
    brand: {
        fontWeight: '900',
        letterSpacing: 10,
    },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inlineImg: { width: 28, height: 28, borderRadius: 7 },
    inlineBrand: { fontWeight: '900', fontSize: 20, letterSpacing: 4 },
});
