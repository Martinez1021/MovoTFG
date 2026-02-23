import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerMiPerfil } from '../servicios/api';
import { useAuth } from '../contexto/AuthContexto';
import { colores, sombra, sombraFuerte, radio } from '../estilos/tema';

const LOGROS = [
    { icon: '🔥', titulo: 'Racha legendaria', desc: '7 días seguidos', check: (p) => (p?.mejorRacha || 0) >= 7 },
    { icon: '⚡', titulo: 'Nivel 5', desc: 'Alcanza nivel 5', check: (p) => (p?.nivel || 0) >= 5 },
    { icon: '💎', titulo: 'Veterano', desc: '50 hábitos completados', check: (p) => (p?.totalHabitosCompletados || 0) >= 50 },
    { icon: '🏆', titulo: 'Primera semana', desc: '7 completados', check: (p) => (p?.totalHabitosCompletados || 0) >= 7 },
    { icon: '🌟', titulo: 'Constante', desc: '100 XP acumulados', check: (p) => (p?.xp || 0) >= 100 },
    { icon: '🚀', titulo: 'Imparable', desc: 'Racha de 30 días', check: (p) => (p?.mejorRacha || 0) >= 30 },
];

const PantallaPerfil = () => {
    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const { usuario, cerrarSesion } = useAuth();

    const cargarPerfil = async () => {
        try {
            const res = await obtenerMiPerfil();
            setPerfil(res.data);
        } catch { Alert.alert('Error', 'No se pudo cargar el perfil'); }
        finally { setCargando(false); setRefrescando(false); }
    };

    useFocusEffect(useCallback(() => { setCargando(true); cargarPerfil(); }, []));

    const confirmarSalir = () => {
        Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', style: 'destructive', onPress: cerrarSesion },
        ]);
    };

    if (cargando) return <View style={estilos.centrado}><ActivityIndicator size="large" color={colores.primario} /></View>;

    const nivel = perfil?.nivel || 1;
    const xp = perfil?.xp || 0;
    const inicial = (perfil?.nombreUsuario || 'M')[0].toUpperCase();
    const logrosDesbloqueados = LOGROS.filter(l => l.check(perfil)).length;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colores.fondo }} edges={['top']}>
            <ScrollView
                contentContainerStyle={estilos.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refrescando}
                        onRefresh={() => { setRefrescando(true); cargarPerfil(); }}
                        tintColor={colores.primario} />
                }
            >
                <Text style={estilos.titulo}>Mi perfil</Text>

                {/* === Tarjeta avatar === */}
                <LinearGradient
                    colors={colores.gradientePrimario}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={estilos.avatarCard}
                >
                    <View style={estilos.avatar}>
                        <Text style={estilos.avatarInitial}>{inicial}</Text>
                    </View>
                    <Text style={estilos.userName}>{perfil?.nombreUsuario || usuario?.nombreUsuario}</Text>
                    <Text style={estilos.userEmail}>{perfil?.email || usuario?.email}</Text>
                    <View style={estilos.nivelPill}>
                        <Text style={estilos.nivelPillText}>⚔️ Nivel {nivel} · {xp} XP</Text>
                    </View>
                    <View style={estilos.avatarDeco1} />
                    <View style={estilos.avatarDeco2} />
                </LinearGradient>

                {/* === Stats rápidas === */}
                <View style={estilos.statsRow}>
                    <View style={estilos.statBox}>
                        <Text style={estilos.statVal}>{perfil?.totalHabitosCompletados || 0}</Text>
                        <Text style={estilos.statLbl}>Completados</Text>
                    </View>
                    <View style={estilos.statDivider} />
                    <View style={estilos.statBox}>
                        <Text style={estilos.statVal}>{perfil?.mejorRacha || 0}</Text>
                        <Text style={estilos.statLbl}>Mejor racha</Text>
                    </View>
                    <View style={estilos.statDivider} />
                    <View style={estilos.statBox}>
                        <Text style={estilos.statVal}>{logrosDesbloqueados}</Text>
                        <Text style={estilos.statLbl}>Logros</Text>
                    </View>
                </View>

                {/* === Logros === */}
                <View style={estilos.seccion}>
                    <View style={estilos.seccionHeader}>
                        <Text style={estilos.seccionTitulo}>🏅 Logros</Text>
                        <Text style={estilos.seccionBadge}>{logrosDesbloqueados}/{LOGROS.length}</Text>
                    </View>
                    {LOGROS.map((logro, i) => {
                        const desbloqueado = logro.check(perfil);
                        return (
                            <View key={i} style={[estilos.logroRow, !desbloqueado && estilos.logroOpaco]}>
                                <View style={[estilos.logroIcon, desbloqueado && { backgroundColor: colores.primarioSuave }]}>
                                    <Text style={{ fontSize: 20 }}>{logro.icon}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={estilos.logroTitulo}>{logro.titulo}</Text>
                                    <Text style={estilos.logroDesc}>{logro.desc}</Text>
                                </View>
                                {desbloqueado
                                    ? <View style={estilos.logroCheck}><Ionicons name="checkmark" size={14} color="#fff" /></View>
                                    : <Ionicons name="lock-closed" size={16} color={colores.textoTenue} />
                                }
                            </View>
                        );
                    })}
                </View>

                {/* === Info de la cuenta === */}
                <View style={estilos.seccion}>
                    <Text style={estilos.seccionTitulo}>⚙️ Cuenta</Text>
                    {[
                        { icon: 'person-outline', label: 'Usuario', value: perfil?.nombreUsuario },
                        { icon: 'mail-outline', label: 'Correo', value: perfil?.email },
                        { icon: 'calendar-outline', label: 'Miembro desde', value: perfil?.creadoEn ? new Date(perfil.creadoEn).toLocaleDateString('es-ES') : '—' },
                    ].map((item, i) => (
                        <View key={i} style={estilos.cuentaRow}>
                            <Ionicons name={item.icon} size={18} color={colores.primario} />
                            <Text style={estilos.cuentaLabel}>{item.label}</Text>
                            <Text style={estilos.cuentaValue} numberOfLines={1}>{item.value}</Text>
                        </View>
                    ))}
                </View>

                {/* === Botón cerrar sesión === */}
                <TouchableOpacity style={estilos.botonSalir} onPress={confirmarSalir} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={20} color={colores.peligro} />
                    <Text style={estilos.salirTexto}>Cerrar sesión</Text>
                </TouchableOpacity>

                <Text style={estilos.version}>Movo v1.0.0 · TFG 2DAM</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const estilos = StyleSheet.create({
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo },
    scroll: { padding: 20, paddingBottom: 40 },
    titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 16 },

    // Avatar card
    avatarCard: {
        borderRadius: radio.xxl, paddingVertical: 32, paddingHorizontal: 24,
        alignItems: 'center', marginBottom: 14, overflow: 'hidden',
        position: 'relative', ...sombraFuerte,
    },
    avatar: {
        width: 80, height: 80, borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarInitial: { fontSize: 34, fontWeight: '900', color: '#fff' },
    userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2 },
    userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
    nivelPill: {
        backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 6,
    },
    nivelPillText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    avatarDeco1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)', top: -30, right: -20 },
    avatarDeco2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -20, left: 10 },

    // Stats row
    statsRow: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: radio.xl,
        padding: 20, marginBottom: 14, alignItems: 'center', ...sombra,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 26, fontWeight: '800', color: colores.texto },
    statLbl: { fontSize: 11, color: colores.textoTenue, marginTop: 2 },
    statDivider: { width: 1, height: 36, backgroundColor: colores.bordeClaro },

    // Sección
    seccion: { backgroundColor: '#fff', borderRadius: radio.xl, padding: 16, marginBottom: 14, ...sombra },
    seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    seccionTitulo: { fontSize: 16, fontWeight: '700', color: colores.texto },
    seccionBadge: {
        fontSize: 12, fontWeight: '700', color: colores.primario,
        backgroundColor: colores.primarioSuave, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
    },

    // Logros
    logroRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: colores.bordeClaro, gap: 12,
    },
    logroOpaco: { opacity: 0.4 },
    logroIcon: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6',
        justifyContent: 'center', alignItems: 'center',
    },
    logroTitulo: { fontSize: 14, fontWeight: '700', color: colores.texto },
    logroDesc: { fontSize: 11, color: colores.textoTenue, marginTop: 1 },
    logroCheck: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: colores.exito, justifyContent: 'center', alignItems: 'center',
    },

    // Cuenta
    cuentaRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colores.bordeClaro,
    },
    cuentaLabel: { fontSize: 13, color: colores.textoTenue, width: 90 },
    cuentaValue: { flex: 1, fontSize: 14, fontWeight: '600', color: colores.texto, textAlign: 'right' },

    // Salir
    botonSalir: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colores.peligroSuave, borderRadius: radio.lg,
        paddingVertical: 15, borderWidth: 1, borderColor: '#FECACA', marginBottom: 16,
    },
    salirTexto: { fontSize: 15, fontWeight: '700', color: colores.peligro },
    version: { textAlign: 'center', fontSize: 12, color: colores.textoTenue },
});

export default PantallaPerfil;
