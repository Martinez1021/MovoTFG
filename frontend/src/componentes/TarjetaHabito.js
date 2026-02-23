import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colores, sombra, radio } from '../estilos/tema';

const ICONOS = {
    estrella: 'star',
    fuego: 'flame',
    corazon: 'heart',
    musculo: 'barbell',
    libro: 'book',
    agua: 'water',
    comida: 'nutrition',
    sueno: 'moon',
    yoga: 'body',
    correr: 'walk',
    musica: 'musical-notes',
    meditacion: 'leaf',
};

const TarjetaHabito = ({ habito, onCompletar, completando, index = 0 }) => {
    const nombreIcono = ICONOS[habito.icono] || 'star';
    const estaCompletado = habito.completadoHoy || false;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1, friction: 6, tension: 80, useNativeDriver: true,
                delay: index * 80,
            }),
            Animated.timing(slideAnim, {
                toValue: 0, duration: 400, useNativeDriver: true,
                delay: index * 80,
            }),
        ]).start();
    }, []);

    const manejarPress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();
        onCompletar();
    };

    return (
        <Animated.View style={[
            estilos.contenedor,
            {
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                opacity: scaleAnim,
            },
            estaCompletado && estilos.contenedorCompletado,
        ]}>
            {/* Franja de color izquierda */}
            <View style={[estilos.franja, { backgroundColor: habito.color || colores.primario }]} />

            {/* Icono */}
            <LinearGradient
                colors={[habito.color || colores.primario, (habito.color || colores.primario) + 'CC']}
                style={estilos.iconoCirculo}
            >
                <Ionicons name={nombreIcono} size={22} color="#fff" />
            </LinearGradient>

            {/* Info */}
            <View style={estilos.info}>
                <Text style={[estilos.nombre, estaCompletado && estilos.nombreCompletado]} numberOfLines={1}>
                    {habito.nombre}
                </Text>
                {habito.descripcion ? (
                    <Text style={estilos.descripcion} numberOfLines={1}>{habito.descripcion}</Text>
                ) : null}
                <View style={estilos.metaRow}>
                    <View style={estilos.rachaBadge}>
                        <Text style={estilos.rachaTexto}>🔥 {habito.rachaActual || 0}</Text>
                    </View>
                    <View style={estilos.xpBadge}>
                        <Text style={estilos.xpTexto}>+{habito.xpRecompensa || 10} XP</Text>
                    </View>
                    {habito.frecuencia && (
                        <Text style={estilos.frecuencia}>
                            {habito.frecuencia === 'DIARIO' ? '📅 Diario' : habito.frecuencia}
                        </Text>
                    )}
                </View>
            </View>

            {/* Botón completar */}
            <TouchableOpacity
                onPress={manejarPress}
                disabled={estaCompletado || completando}
                activeOpacity={0.7}
            >
                {estaCompletado ? (
                    <View style={estilos.botonCompletado}>
                        <Ionicons name="checkmark" size={22} color="#fff" />
                    </View>
                ) : completando ? (
                    <View style={estilos.botonCargando}>
                        <Text style={{ fontSize: 16 }}>⏳</Text>
                    </View>
                ) : (
                    <LinearGradient colors={colores.gradientePrimario} style={estilos.botonCompletar}>
                        <Ionicons name="checkmark" size={22} color="#fff" />
                    </LinearGradient>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const estilos = StyleSheet.create({
    contenedor: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: radio.xl,
        padding: 14, paddingLeft: 0, marginBottom: 12,
        overflow: 'hidden',
        ...sombra,
    },
    contenedorCompletado: {
        backgroundColor: '#F0FFF4',
        borderWidth: 1, borderColor: '#86EFAC50',
    },
    franja: {
        width: 4, height: '120%', borderRadius: 2,
        marginRight: 12,
    },
    iconoCirculo: {
        width: 48, height: 48, borderRadius: radio.lg,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    info: { flex: 1, marginRight: 8 },
    nombre: { fontSize: 16, fontWeight: '700', color: colores.texto, marginBottom: 3 },
    nombreCompletado: { textDecorationLine: 'line-through', color: colores.textoTenue },
    descripcion: { fontSize: 12, color: colores.textoTenue, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rachaBadge: {
        backgroundColor: '#FFF7ED', borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    rachaTexto: { fontSize: 11, fontWeight: '700', color: '#EA580C' },
    xpBadge: {
        backgroundColor: colores.primarioSuave, borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    xpTexto: { fontSize: 11, fontWeight: '700', color: colores.primario },
    frecuencia: { fontSize: 10, color: colores.textoTenue },
    botonCompletar: {
        width: 44, height: 44, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
    },
    botonCompletado: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: colores.exito,
        justifyContent: 'center', alignItems: 'center',
    },
    botonCargando: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center', alignItems: 'center',
    },
});

export default TarjetaHabito;
