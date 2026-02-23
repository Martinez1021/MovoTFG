import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    ActivityIndicator, Alert, RefreshControl, Dimensions, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerMiPerfil, obtenerHabitos } from '../servicios/api';
import { useAuth } from '../contexto/AuthContexto';
import { colores, sombra, sombraFuerte, radio } from '../estilos/tema';

const { width } = Dimensions.get('window');

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
        } catch { Alert.alert('Error', 'No se pudieron cargar las estadísticas'); }
        finally { setCargando(false); setRefrescando(false); }
    };

    useFocusEffect(useCallback(() => { setCargando(true); cargarDatos(); }, []));

    if (cargando) {
        return <View style={estilos.centrado}><ActivityIndicator size="large" color={colores.primario} /></View>;
    }

    const xp = perfil?.xp || 0;
    const nivel = perfil?.nivel || 1;
    const progXP = Math.min((xp % 100) / 100, 1);
    const totalComp = perfil?.totalHabitosCompletados || 0;
    const mejorRacha = perfil?.mejorRacha || 0;

    // Simular los últimos 7 días para la mini-gráfica
    const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const datosSemana = diasSemana.map((d, i) => ({
        dia: d,
        valor: Math.min(habitos.length, Math.floor(Math.random() * (habitos.length + 1))),
        max: habitos.length || 1,
    }));

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colores.fondo }} edges={['top']}>
            <ScrollView
                contentContainerStyle={estilos.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refrescando}
                        onRefresh={() => { setRefrescando(true); cargarDatos(); }}
                        tintColor={colores.primario} />
                }
            >
                <Text style={estilos.titulo}>Mi progreso</Text>

                {/* === Tarjeta Nivel/XP === */}
                <LinearGradient
                    colors={colores.gradienteOscuro}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={estilos.nivelCard}
                >
                    <View style={estilos.nivelRow}>
                        <View>
                            <Text style={estilos.nivelLabel}>Tu nivel</Text>
                            <Text style={estilos.nivelNum}>⚔️ Nivel {nivel}</Text>
                        </View>
                        <View style={estilos.xpCircle}>
                            <Text style={estilos.xpCircleNum}>{xp}</Text>
                            <Text style={estilos.xpCircleLabel}>XP</Text>
                        </View>
                    </View>

                    <View style={estilos.barContainer}>
                        <View style={estilos.barBg}>
                            <LinearGradient
                                colors={['#A78BFA', '#6C63FF']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={[estilos.barFill, { width: `${progXP * 100}%` }]}
                            />
                        </View>
                        <Text style={estilos.barLabel}>{xp % 100}/100 XP → Nivel {nivel + 1}</Text>
                    </View>

                    {/* Círculos decorativos */}
                    <View style={estilos.deco1} />
                    <View style={estilos.deco2} />
                </LinearGradient>

                {/* === Stats Grid === */}
                <View style={estilos.statsGrid}>
                    {[
                        { emoji: '🏆', valor: totalComp, label: 'Completados' },
                        { emoji: '🔥', valor: mejorRacha, label: 'Mejor racha' },
                        { emoji: '📋', valor: habitos.length, label: 'Hábitos' },
                        { emoji: '⚡', valor: nivel, label: 'Nivel' },
                    ].map((s, i) => (
                        <View key={i} style={estilos.statCard}>
                            <Text style={estilos.statEmoji}>{s.emoji}</Text>
                            <Text style={estilos.statValor}>{s.valor}</Text>
                            <Text style={estilos.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* === Mini gráfica semanal === */}
                <View style={estilos.grafica}>
                    <Text style={estilos.graficaTitulo}>📊 Esta semana</Text>
                    <View style={estilos.graficaRow}>
                        {datosSemana.map((d, i) => {
                            const alto = Math.max(8, (d.valor / d.max) * 80);
                            return (
                                <View key={i} style={estilos.graficaCol}>
                                    <View style={estilos.graficaBarBg}>
                                        <LinearGradient
                                            colors={colores.gradientePrimario}
                                            style={[estilos.graficaBar, { height: alto }]}
                                        />
                                    </View>
                                    <Text style={estilos.graficaDia}>{d.dia}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* === Rachas por hábito === */}
                <View style={estilos.seccion}>
                    <Text style={estilos.seccionTitulo}>🔥 Rachas actuales</Text>
                    {habitos.length === 0 ? (
                        <Text style={estilos.textoVacio}>No tienes hábitos todavía.</Text>
                    ) : (
                        habitos.map((h) => (
                            <View key={h.id} style={estilos.rachaRow}>
                                <View style={[estilos.rachaColor, { backgroundColor: h.color || colores.primario }]} />
                                <Text style={estilos.rachaNombre} numberOfLines={1}>{h.nombre}</Text>
                                <LinearGradient
                                    colors={h.rachaActual > 0 ? colores.gradienteFuego : ['#F3F4F6', '#F3F4F6']}
                                    style={estilos.rachaBadge}
                                >
                                    <Text style={[estilos.rachaTexto, h.rachaActual > 0 && { color: '#fff' }]}>
                                        🔥 {h.rachaActual || 0} días
                                    </Text>
                                </LinearGradient>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const estilos = StyleSheet.create({
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo },
    scroll: { padding: 20, paddingBottom: 32 },
    titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 16 },

    // Nivel card
    nivelCard: {
        borderRadius: radio.xxl, padding: 24, marginBottom: 16,
        overflow: 'hidden', position: 'relative', ...sombraFuerte,
    },
    nivelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    nivelLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
    nivelNum: { fontSize: 24, fontWeight: '800', color: '#fff' },
    xpCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    xpCircleNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
    xpCircleLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
    barContainer: {},
    barBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
    barFill: { height: '100%', borderRadius: 5 },
    barLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    deco1: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)', top: -20, right: -10 },
    deco2: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.03)', bottom: -10, left: 20 },

    // Stats grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    statCard: {
        width: (width - 50) / 2, backgroundColor: '#fff', borderRadius: radio.xl,
        padding: 18, alignItems: 'center', ...sombra,
    },
    statEmoji: { fontSize: 28, marginBottom: 6 },
    statValor: { fontSize: 28, fontWeight: '800', color: colores.texto },
    statLabel: { fontSize: 12, color: colores.textoTenue, marginTop: 4 },

    // Gráfica
    grafica: { backgroundColor: '#fff', borderRadius: radio.xl, padding: 20, marginBottom: 16, ...sombra },
    graficaTitulo: { fontSize: 16, fontWeight: '700', color: colores.texto, marginBottom: 16 },
    graficaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
    graficaCol: { alignItems: 'center', flex: 1 },
    graficaBarBg: { width: 24, height: 90, justifyContent: 'flex-end', alignItems: 'center' },
    graficaBar: { width: 20, borderRadius: 10, minHeight: 8 },
    graficaDia: { fontSize: 12, color: colores.textoTenue, marginTop: 6, fontWeight: '600' },

    // Sección rachas
    seccion: { backgroundColor: '#fff', borderRadius: radio.xl, padding: 16, ...sombra },
    seccionTitulo: { fontSize: 16, fontWeight: '700', color: colores.texto, marginBottom: 12 },
    textoVacio: { fontSize: 14, color: colores.textoTenue, textAlign: 'center', paddingVertical: 20 },
    rachaRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colores.bordeClaro,
    },
    rachaColor: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    rachaNombre: { flex: 1, fontSize: 14, fontWeight: '600', color: colores.texto },
    rachaBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
    rachaTexto: { fontSize: 12, fontWeight: '700', color: colores.textoTenue },
});

export default PantallaEstadisticas;
