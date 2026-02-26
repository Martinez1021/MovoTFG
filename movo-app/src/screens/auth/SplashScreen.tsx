import React from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { Colors, FontSizes } from '../../utils/constants';

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
                <Image
                    source={require('../../../assets/icon.png')}
                    style={styles.icon}
                    resizeMode="contain"
                />
                <Text style={styles.brandName}>MOVO</Text>
                <Text style={styles.tagline}>Tu entrenador definitivo</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
    icon: {
        width: 100,
        height: 100,
        marginBottom: 16,
    },
    brandName: {
        fontSize: 42,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 10,
        marginBottom: 8,
    },
    tagline: {
        fontSize: FontSizes.base,
        color: Colors.textSecondary,
        textAlign: 'center',
        letterSpacing: 1.5,
    },
});
