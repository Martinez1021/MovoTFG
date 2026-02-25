import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSizes } from '../../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

export const SplashScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const scale = React.useRef(new Animated.Value(0.7)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
            Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();

        // Auto-navigate to Login after 2.5s
        const timer = setTimeout(() => {
            navigation?.replace('Login');
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient colors={['#0A0A0A', '#1A0A2E', '#0A0A0A']} style={styles.container}>
            <Animated.View style={{ transform: [{ scale }], opacity }}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.logoBox}>
                    <Text style={styles.logoLetter}>M</Text>
                </LinearGradient>
                <Text style={styles.brandName}>MOVO</Text>
                <Text style={styles.tagline}>Tu entrenador definitivo</Text>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logoBox: {
        width: 90,
        height: 90,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    logoLetter: { fontSize: 52, fontWeight: '900', color: '#fff' },
    brandName: {
        fontSize: 38,
        fontWeight: '900',
        color: Colors.textPrimary,
        textAlign: 'center',
        letterSpacing: 8,
    },
    tagline: {
        fontSize: FontSizes.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 6,
        letterSpacing: 1.5,
    },
});
