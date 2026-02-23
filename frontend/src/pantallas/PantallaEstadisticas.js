import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerMiPerfil, obtenerHabitos } from '../servicios/api';
import { useAuth } from '../contexto/AuthContexto';
import { colores, sombra } from '../estilos/tema';

const PantallaEstadisticas = () => {
    const [perfil, setPerfil] = useState(null);
    const [habitos, setHabitos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const { usuario } = useAuth();

    const cargarDatos = async () => {
        try {
            const [resP, resH] = await Promise.all([obtenerMiPerfil(), obtenerHabitos()]);
            setPerfil(resP.data);
            setHabitos(resH.data);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar las estadísticas');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    useFocusEffect(useCallback(() => {
        setCargando(true);
        cargarDatos();
    }, []));

    if (cargando) {
        return (
            <View style={estilos.centrado}>
                <ActivityIndicator size="large" color={colores.primario} />
            </View>
        );
    }

    const xpActual = perfil?.xp || 0;
    const nivel = perfil?.nivel || 1;
    const xpParaSiguiente = nivel * 100;
    const progresoXP = Math.min((xpActual % 100) / 100, 1);

    return (
        <ScrollView
            style={estilos.contenedor}
            contentContainerStyle={estilos.desplazable}
            refreshControl={
                <RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargarDatos(); }}
                    colors={[colores.primario]} />
            }
        >
            <Text style={estilos.titulo}>Mi progreso</Text>

            {/* Tarjeta de Nivel y XP */}
            <View style={[estilos.tarjetaNivel, { backgroundColor: colores.primario }]}>
                <Text style={estilos.textoNivelGrande}>⚔️ Nivel {nivel}</Text>
                <Text style={estilos.textoXP}>{xpActual} XP total</Text>

                {/* Barra de XP */}
                <View style={estilos.contenedorBarra}>
                    <View style={[estilos.barraXP, { width: `${progresoXP * 100}%` }]} />
                </View>
                <Text style={estilos.textoProgreso}>
                    {xpActual % 100} / 100 XP para nivel {nivel + 1}
                </Text>
            </View>

            {/* Estadísticas globales */}
            <View style={estilos.filaStats}>
                <View style={estilos.tarjetaStat}>
                    <Text style={estilos.emojiStat}>🏆</Text>
                    <Text style={estilos.valorStat}>{perfil?.totalHabitosCompletados || 0}</Text>
                    <Text style={estilos.etiquetaStat}>Completados</Text>
                </View>
                <View style={estilos.tarjetaStat}>
                    <Text style={estilos.emojiStat}>🔥</Text>
                    <Text style={estilos.valorStat}>{perfil?.mejorRacha || 0}</Text>
                    <Text style={estilos.etiquetaStat}>Mejor racha</Text>
                </View>
                <View style={estilos.tarjetaStat}>
                    <Text style={estilos.emojiStat}>📋</Text>
                    <Text style={estilos.valorStat}>{habitos.length}</Text>
                    <Text style={estilos.etiquetaStat}>Hábitos</Text>
                </View>
            </View>

            {/* Lista de rachas por hábito */}
            <Text style={estilos.subtitulo}>Rachas actuales</Text>
            {habitos.length === 0 ? (
                <Text style={estilos.textoVacio}>No tienes hábitos todavía.</Text>
            ) : (
                habitos.map((habito) => (
                    <View key={habito.id} style={estilos.filaHabito}>
                        <View style={[estilos.puntoColor, { backgroundColor: habito.color || colores.primario }]} />
                        <Text style={estilos.nombreHabito} numberOfLines={1}>{habito.nombre}</Text>
                        <View style={estilos.badgeRacha}>
                            <Text style={estilos.textoRacha}>🔥 {habito.rachaActual || 0} días</Text>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );
};

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    desplazable: { padding: 20, paddingBottom: 40 },
    titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 16 },
    tarjetaNivel: {
        borderRadius: 22, padding: 24, marginBottom: 16,
        ...sombra, shadowOpacity: 0.2,
    },
    textoNivelGrande: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
    textoXP: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
    contenedorBarra: {
        height: 10, backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 5, overflow: 'hidden', marginBottom: 6,
    },
    barraXP: { height: '100%', backgroundColor: '#fff', borderRadius: 5 },
    textoProgreso: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
    filaStats: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    tarjetaStat: {
        flex: 1, backgroundColor: '#fff', borderRadius: 18,
        padding: 16, alignItems: 'center', ...sombra,
    },
    emojiStat: { fontSize: 24, marginBottom: 4 },
    valorStat: { fontSize: 22, fontWeight: '800', color: colores.texto },
    etiquetaStat: { fontSize: 11, color: colores.textoTenue, marginTop: 2, textAlign: 'center' },
    subtitulo: { fontSize: 18, fontWeight: '700', color: colores.texto, marginBottom: 12 },
    filaHabito: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 14, padding: 14, marginBottom: 8, ...sombra,
    },
    puntoColor: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    nombreHabito: { flex: 1, fontSize: 14, fontWeight: '600', color: colores.texto },
    badgeRacha: {
        backgroundColor: '#FFF7ED', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    textoRacha: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
    textoVacio: { fontSize: 14, color: colores.textoTenue, textAlign: 'center', marginTop: 20 },
});

export default PantallaEstadisticas;
