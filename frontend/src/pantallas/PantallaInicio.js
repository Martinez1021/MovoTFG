import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, Alert, RefreshControl, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerHabitos, completarHabito } from '../servicios/api';
import { useAuth } from '../contexto/AuthContexto';
import TarjetaHabito from '../componentes/TarjetaHabito';
import { colores, sombra } from '../estilos/tema';

const PantallaInicio = ({ navigation }) => {
    const [habitos, setHabitos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [completandoId, setCompletandoId] = useState(null);
    const { usuario, actualizarUsuario } = useAuth();

    const cargarHabitos = async () => {
        try {
            const respuesta = await obtenerHabitos();
            setHabitos(respuesta.data);
        } catch (e) {
            Alert.alert('Error', 'No se pudieron cargar los hábitos');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    useFocusEffect(useCallback(() => {
        setCargando(true);
        cargarHabitos();
    }, []));

    const manejarCompletar = async (id) => {
        setCompletandoId(id);
        try {
            const respuesta = await completarHabito(id);
            const habitoActualizado = respuesta.data;
            setHabitos(prev => prev.map(h => h.id === id ? { ...h, ...habitoActualizado, completadoHoy: true } : h));
            Alert.alert('¡Bien hecho! 🎉', `¡Hábito completado! +${habitoActualizado.xpRecompensa} XP 🏆`);
            if (usuario) {
                actualizarUsuario({ xp: (usuario.xp || 0) + (habitoActualizado.xpRecompensa || 10) });
            }
        } catch (error) {
            const msg = error.response?.data || 'Este hábito ya fue completado hoy';
            Alert.alert('Aviso', msg);
        } finally {
            setCompletandoId(null);
        }
    };

    const renderCabecera = () => (
        <View style={estilos.cabecera}>
            <View>
                <Text style={estilos.saludo}>¡Hola, {usuario?.nombreUsuario || 'campeón'}! 👋</Text>
                <Text style={estilos.tituloPrincipal}>Mis hábitos de hoy</Text>
            </View>
            <View style={estilos.insigniaXP}>
                <Text style={estilos.textoNivel}>Nv.{usuario?.nivel || 1}</Text>
                <Text style={estilos.textoXP}>⚡ {usuario?.xp || 0} XP</Text>
            </View>
        </View>
    );

    if (cargando) {
        return (
            <View style={estilos.centrado}>
                <ActivityIndicator size="large" color={colores.primario} />
            </View>
        );
    }

    return (
        <View style={estilos.contenedor}>
            <FlatList
                data={habitos}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={renderCabecera}
                contentContainerStyle={estilos.lista}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={() => { setRefrescando(true); cargarHabitos(); }}
                        colors={[colores.primario]}
                    />
                }
                renderItem={({ item }) => (
                    <TarjetaHabito
                        habito={item}
                        onCompletar={() => manejarCompletar(item.id)}
                        completando={completandoId === item.id}
                    />
                )}
                ListEmptyComponent={
                    <View style={estilos.vacio}>
                        <Text style={estilos.emojiVacio}>🌱</Text>
                        <Text style={estilos.textoVacio}>Aún no tienes hábitos</Text>
                        <Text style={estilos.subVacio}>¡Crea tu primer hábito con el botón +!</Text>
                    </View>
                }
            />

            {/* Botón flotante "+" */}
            <TouchableOpacity
                style={estilos.fab}
                onPress={() => navigation.navigate('AñadirHabito')}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo },
    lista: { padding: 20, paddingBottom: 100 },
    cabecera: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 20,
    },
    saludo: { fontSize: 14, color: colores.textoTenue, marginBottom: 2 },
    tituloPrincipal: { fontSize: 26, fontWeight: '800', color: colores.texto },
    insigniaXP: {
        backgroundColor: colores.primario, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
    },
    textoNivel: { color: '#fff', fontWeight: '800', fontSize: 13 },
    textoXP: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 1 },
    vacio: { alignItems: 'center', marginTop: 60 },
    emojiVacio: { fontSize: 56, marginBottom: 12 },
    textoVacio: { fontSize: 18, fontWeight: '700', color: colores.texto, marginBottom: 6 },
    subVacio: { fontSize: 14, color: colores.textoTenue, textAlign: 'center' },
    fab: {
        position: 'absolute', right: 24, bottom: 24,
        width: 58, height: 58, borderRadius: 29,
        backgroundColor: colores.primario,
        justifyContent: 'center', alignItems: 'center',
        ...sombra, shadowOpacity: 0.3,
    },
});

export default PantallaInicio;
