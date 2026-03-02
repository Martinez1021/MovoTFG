import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontSizes } from '../../utils/constants';
import { MovoLogo } from '../../components/ui/MovoLogo';

export const SplashScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const scale = React.useRef(new Animated.Value(0.8)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
            Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => {
            navigation?.replace('Login');
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={{ transform: [{ scale }], opacity, alignItems: 'center' }}>
                <MovoLogo size={100} />
                <Text style={styles.tagline}>Tu entrenador definitivo</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
    tagline: {
        marginTop: 8,
        fontSize: FontSizes.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        letterSpacing: 1.5,
    },
});
