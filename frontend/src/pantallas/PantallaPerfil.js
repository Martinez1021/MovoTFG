import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerMiPerfil } from '../servicios/api';
import { useAuth } from '../contexto/AuthContexto';
import { colores, sombra } from '../estilos/tema';

const PantallaPerfil = () => {
    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const { usuario, cerrarSesion } = useAuth();

    const cargarPerfil = async () => {
        try {
            const respuesta = await obtenerMiPerfil();
            setPerfil(respuesta.data);
        } catch {
            Alert.alert('Error', 'No se pudo cargar el perfil');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    useFocusEffect(useCallback(() => {
        setCargando(true);
        cargarPerfil();
    }, []));

    const confirmarCerrarSesion = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Seguro que quieres salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: cerrarSesion },
            ]
        );
    };

    if (cargando) {
        return (
            <View style={estilos.centrado}>
                <ActivityIndicator size="large" color={colores.primario} />
            </View>
        );
    }

    const nivel = perfil?.nivel || 1;
    const xp = perfil?.xp || 0;
    const inicial = (perfil?.nombreUsuario || 'M')[0].toUpperCase();

    return (
        <ScrollView
            style={estilos.contenedor}
            contentContainerStyle={estilos.desplazable}
            refreshControl={
                <RefreshControl refreshing={refrescando}
                    onRefresh={() => { setRefrescando(true); cargarPerfil(); }}
                    colors={[colores.primario]} />
            }
        >
            <Text style={estilos.titulo}>Mi perfil</Text>

            {/* Avatar y nombre */}
            <View style={estilos.tarjetaAvatar}>
                <View style={estilos.avatar}>
                    <Text style={estilos.inicial}>{inicial}</Text>
                </View>
                <View>
                    <Text style={estilos.nombreUsuario}>{perfil?.nombreUsuario || usuario?.nombreUsuario}</Text>
                    <Text style={estilos.email}>{perfil?.email || usuario?.email}</Text>
                    <Text style={estilos.nivelTexto}>⚔️ Nivel {nivel} · {xp} XP</Text>
                </View>
            </View>

            {/* Estadísticas rápidas */}
            <View style={estilos.filaStats}>
                <View style={estilos.stat}>
                    <Text style={estilos.valorStat}>{perfil?.totalHabitosCompletados || 0}</Text>
                    <Text style={estilos.labelStat}>Completados</Text>
                </View>
                <View style={estilos.divisor} />
                <View style={estilos.stat}>
                    <Text style={estilos.valorStat}>{perfil?.mejorRacha || 0}</Text>
                    <Text style={estilos.labelStat}>Mejor racha</Text>
                </View>
                <View style={estilos.divisor} />
                <View style={estilos.stat}>
                    <Text style={estilos.valorStat}>{nivel}</Text>
                    <Text style={estilos.labelStat}>Nivel</Text>
                </View>
            </View>

            {/* Sección de logros */}
            <View style={estilos.seccionLogros}>
                <Text style={estilos.tituloSeccion}>🏅 Logros</Text>
                {[
                    { icon: '🔥', titulo: 'Racha de 7 días', desbloqueado: (perfil?.mejorRacha || 0) >= 7 },
                    { icon: '⚡', titulo: 'Nivel 5 alcanzado', desbloqueado: nivel >= 5 },
                    { icon: '💎', titulo: '50 hábitos completados', desbloqueado: (perfil?.totalHabitosCompletados || 0) >= 50 },
                    { icon: '🏆', titulo: 'Primera semana', desbloqueado: (perfil?.totalHabitosCompletados || 0) >= 7 },
                ].map((logro, i) => (
                    <View key={i} style={[estilos.fila, !logro.desbloqueado && estilos.filaOpaca]}>
                        <Text style={estilos.iconoLogro}>{logro.icon}</Text>
                        <Text style={[estilos.textoLogro, !logro.desbloqueado && estilos.textoOpaco]}>
                            {logro.titulo}
                        </Text>
                        {logro.desbloqueado
                            ? <Ionicons name="checkmark-circle" size={20} color={colores.exito} />
                            : <Ionicons name="lock-closed" size={16} color={colores.textoTenue} />
                        }
                    </View>
                ))}
            </View>

            {/* Botón cerrar sesión */}
            <TouchableOpacity style={estilos.botonSalir} onPress={confirmarCerrarSesion}>
                <Ionicons name="log-out-outline" size={20} color={colores.peligro} />
                <Text style={estilos.textoSalir}>Cerrar sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    desplazable: { padding: 20, paddingBottom: 40 },
    titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 16 },
    tarjetaAvatar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 22, padding: 20, marginBottom: 14, gap: 16, ...sombra,
    },
    avatar: {
        width: 64, height: 64, borderRadius: 20,
        backgroundColor: colores.primario, justifyContent: 'center', alignItems: 'center',
    },
    inicial: { fontSize: 28, fontWeight: '800', color: '#fff' },
    nombreUsuario: { fontSize: 20, fontWeight: '800', color: colores.texto },
    email: { fontSize: 13, color: colores.textoTenue, marginTop: 2 },
    nivelTexto: { fontSize: 13, color: colores.primario, fontWeight: '700', marginTop: 4 },
    filaStats: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18,
        padding: 20, marginBottom: 14, alignItems: 'center', ...sombra,
    },
    stat: { flex: 1, alignItems: 'center' },
    valorStat: { fontSize: 24, fontWeight: '800', color: colores.texto },
    labelStat: { fontSize: 12, color: colores.textoTenue, marginTop: 2 },
    divisor: { width: 1, height: 36, backgroundColor: colores.borde },
    seccionLogros: {
        backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, ...sombra,
    },
    tituloSeccion: { fontSize: 16, fontWeight: '700', color: colores.texto, marginBottom: 12 },
    fila: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: colores.borde,
    },
    filaOpaca: { opacity: 0.45 },
    iconoLogro: { fontSize: 20, marginRight: 12 },
    textoLogro: { flex: 1, fontSize: 14, fontWeight: '600', color: colores.texto },
    textoOpaco: { color: colores.textoTenue },
    botonSalir: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#FFF1F0', borderRadius: 14,
        paddingVertical: 14, borderWidth: 1, borderColor: '#FECACA',
    },
    textoSalir: { fontSize: 15, fontWeight: '700', color: colores.peligro },
});

export default PantallaPerfil;
