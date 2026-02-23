import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, Alert, RefreshControl, ActivityIndicator,
    Animated, Dimensions, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerHabitos, completarHabito } from '../servicios/api';
import { useAuth } from '../contexto/AuthContexto';
import TarjetaHabito from '../componentes/TarjetaHabito';
import { colores, sombra, sombraFuerte, radio } from '../estilos/tema';

const { width } = Dimensions.get('window');

const PantallaInicio = ({ navigation }) => {
    const [habitos, setHabitos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [completandoId, setCompletandoId] = useState(null);
    const { usuario, actualizarUsuario } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const cargarHabitos = async () => {
        try {
            const res = await obtenerHabitos();
            setHabitos(res.data);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar los hábitos');
        } finally { setCargando(false); setRefrescando(false); }
    };

    useFocusEffect(useCallback(() => { setCargando(true); cargarHabitos(); }, []));

    const manejarCompletar = async (id) => {
        setCompletandoId(id);
        try {
            const res = await completarHabito(id);
            const h = res.data;
            setHabitos(prev => prev.map(x => x.id === id ? { ...x, ...h, completadoHoy: true } : x));
            Alert.alert('¡Bien hecho! 🎉', `¡Hábito completado! +${h.xpRecompensa} XP 🏆`);
            if (usuario) actualizarUsuario({ xp: (usuario.xp || 0) + (h.xpRecompensa || 10) });
        } catch (error) {
            Alert.alert('Aviso', error.response?.data || 'Este hábito ya fue completado hoy');
        } finally { setCompletandoId(null); }
    };

    const completadosHoy = habitos.filter(h => h.completadoHoy).length;
    const totalHoy = habitos.length;
    const porcentaje = totalHoy > 0 ? Math.round((completadosHoy / totalHoy) * 100) : 0;

    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
    const saludoEmoji = hora < 12 ? '🌅' : hora < 18 ? '☀️' : '🌙';

    const renderCabecera = () => (
        <View>
            {/* Header con gradiente */}
            <LinearGradient
                colors={colores.gradientePrimario}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={estilos.header}
            >
                <View style={estilos.headerTop}>
                    <View>
                        <Text style={estilos.saludo}>{saludoEmoji} {saludo}</Text>
                        <Text style={estilos.nombreUsuario}>{usuario?.nombreUsuario || 'Héroe'}</Text>
                    </View>
                    <View style={estilos.nivelBadge}>
                        <Text style={estilos.nivelNum}>⚔️ Nv.{usuario?.nivel || 1}</Text>
                        <Text style={estilos.xpNum}>{usuario?.xp || 0} XP</Text>
                    </View>
                </View>

                {/* Progreso del día */}
                <View style={estilos.progresoContainer}>
                    <View style={estilos.progresoInfo}>
                        <Text style={estilos.progresoLabel}>Progreso de hoy</Text>
                        <Text style={estilos.progresoPorcentaje}>{porcentaje}%</Text>
                    </View>
                    <View style={estilos.barraFondo}>
                        <Animated.View style={[estilos.barraRelleno, { width: `${porcentaje}%` }]} />
                    </View>
                    <Text style={estilos.progresoDetalle}>
                        {completadosHoy}/{totalHoy} hábitos completados
                    </Text>
                </View>

                {/* Decoraciones */}
                <View style={estilos.circuloDeco1} />
                <View style={estilos.circuloDeco2} />
            </LinearGradient>

            {/* Título de lista */}
            <View style={estilos.seccionTitulo}>
                <Text style={estilos.listaTitulo}>Mis hábitos de hoy</Text>
                <Text style={estilos.listaContador}>{totalHoy}</Text>
            </View>
        </View>
    );

    if (cargando) {
        return (
            <View style={estilos.centrado}>
                <ActivityIndicator size="large" color={colores.primario} />
                <Text style={estilos.cargandoTexto}>Cargando tus hábitos...</Text>
            </View>
        );
    }

    return (
        <Animated.View style={[estilos.contenedor, { opacity: fadeAnim }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <FlatList
                    data={habitos}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={renderCabecera}
                    contentContainerStyle={estilos.lista}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refrescando}
                            onRefresh={() => { setRefrescando(true); cargarHabitos(); }}
                            colors={[colores.primario]} tintColor={colores.primario} />
                    }
                    renderItem={({ item, index }) => (
                        <TarjetaHabito
                            habito={item}
                            onCompletar={() => manejarCompletar(item.id)}
                            completando={completandoId === item.id}
                            index={index}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={estilos.vacio}>
                            <Text style={estilos.emojiVacio}>🌱</Text>
                            <Text style={estilos.textoVacio}>Aún no tienes hábitos</Text>
                            <Text style={estilos.subVacio}>¡Pulsa el botón + para crear tu primer hábito!</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('AñadirHabito')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={colores.gradientePrimario} style={estilos.botonVacioCta}>
                                    <Text style={estilos.botonVacioTexto}>Crear mi primer hábito</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    }
                />

                {/* FAB flotante */}
                <TouchableOpacity
                    style={estilos.fabSombra}
                    onPress={() => navigation.navigate('AñadirHabito')}
                    activeOpacity={0.85}
                >
                    <LinearGradient colors={colores.gradientePrimario} style={estilos.fab}>
                        <Ionicons name="add" size={30} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        </Animated.View>
    );
};

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo },
    cargandoTexto: { marginTop: 12, fontSize: 14, color: colores.textoTenue },
    lista: { paddingBottom: 100 },

    // Header
    header: {
        paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28,
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
        overflow: 'hidden', position: 'relative',
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    saludo: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
    nombreUsuario: { fontSize: 26, fontWeight: '800', color: '#fff' },
    nivelBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radio.lg,
        paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
    },
    nivelNum: { color: '#fff', fontWeight: '800', fontSize: 14 },
    xpNum: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

    // Progreso
    progresoContainer: {},
    progresoInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progresoLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    progresoPorcentaje: { fontSize: 13, color: '#fff', fontWeight: '800' },
    barraFondo: {
        height: 8, backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4, overflow: 'hidden', marginBottom: 6,
    },
    barraRelleno: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
    progresoDetalle: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

    // Decoraciones
    circuloDeco1: {
        position: 'absolute', width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.06)', top: -30, right: -20,
    },
    circuloDeco2: {
        position: 'absolute', width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.04)', bottom: 10, left: -20,
    },

    // Sección título
    seccionTitulo: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 22, paddingBottom: 14,
    },
    listaTitulo: { fontSize: 20, fontWeight: '800', color: colores.texto },
    listaContador: {
        fontSize: 13, fontWeight: '700', color: colores.primario,
        backgroundColor: colores.primarioSuave, paddingHorizontal: 10,
        paddingVertical: 4, borderRadius: 10,
    },

    // Vacío
    vacio: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
    emojiVacio: { fontSize: 64, marginBottom: 16 },
    textoVacio: { fontSize: 20, fontWeight: '800', color: colores.texto, marginBottom: 6 },
    subVacio: { fontSize: 14, color: colores.textoTenue, textAlign: 'center', marginBottom: 24 },
    botonVacioCta: { borderRadius: radio.lg, paddingHorizontal: 28, paddingVertical: 14 },
    botonVacioTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // FAB
    fabSombra: { position: 'absolute', right: 24, bottom: Platform.OS === 'ios' ? 24 : 20, ...sombraFuerte },
    fab: {
        width: 60, height: 60, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
    },
});

export default PantallaInicio;
