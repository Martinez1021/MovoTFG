import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores, sombra } from '../estilos/tema';

// Iconos disponibles para hábitos
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

const TarjetaHabito = ({ habito, onCompletar, completando }) => {
    const nombreIcono = ICONOS[habito.icono] || 'star';
    const estaCompletado = habito.completadoHoy || false;

    return (
        <View style={[estilos.tarjeta, estaCompletado && estilos.tarjetaCompletada]}>
            <View style={[estilos.iconoCirculo, { backgroundColor: habito.color || colores.primario }]}>
                <Ionicons name={nombreIcono} size={22} color="#fff" />
            </View>

            <View style={estilos.info}>
                <Text style={estilos.nombre} numberOfLines={1}>{habito.nombre}</Text>
                {habito.descripcion ? (
                    <Text style={estilos.descripcion} numberOfLines={1}>{habito.descripcion}</Text>
                ) : null}
                <View style={estilos.filaRacha}>
                    <Text style={estilos.racha}>🔥 {habito.rachaActual || 0} días seguidos</Text>
                    <Text style={estilos.xpTag}>+{habito.xpRecompensa || 10} XP</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[estilos.botonCompletar, estaCompletado && estilos.botonCompletado]}
                onPress={onCompletar}
                disabled={estaCompletado || completando}
            >
                {completando
                    ? <Text style={estilos.textoBoton}>⏳</Text>
                    : estaCompletado
                        ? <Ionicons name="checkmark-circle" size={26} color="#fff" />
                        : <Text style={estilos.textoBotonPendiente}>✓</Text>
                }
            </TouchableOpacity>
        </View>
    );
};

const estilos = StyleSheet.create({
    tarjeta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        ...sombra,
    },
    tarjetaCompletada: {
        backgroundColor: '#F0FFF4',
        borderWidth: 1.5,
        borderColor: '#86EFAC',
    },
    iconoCirculo: {
        width: 46, height: 46, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },
    info: { flex: 1, marginRight: 8 },
    nombre: { fontSize: 16, fontWeight: '700', color: colores.texto, marginBottom: 2 },
    descripcion: { fontSize: 12, color: colores.textoTenue, marginBottom: 4 },
    filaRacha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    racha: { fontSize: 12, color: colores.textoSecundario, fontWeight: '500' },
    xpTag: {
        fontSize: 11, color: colores.primario, fontWeight: '700',
        backgroundColor: '#EDE9FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    },
    botonCompletar: {
        width: 42, height: 42, borderRadius: 13,
        backgroundColor: colores.primario,
        justifyContent: 'center', alignItems: 'center',
    },
    botonCompletado: { backgroundColor: colores.exito },
    textoBoton: { fontSize: 18 },
    textoBotonPendiente: { fontSize: 20, color: '#fff', fontWeight: '800' },
});

export default TarjetaHabito;
