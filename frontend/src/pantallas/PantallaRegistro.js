import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexto/AuthContexto';
import { colores, sombraFuerte, radio } from '../estilos/tema';

const PantallaRegistro = ({ navigation }) => {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const { registro } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }, []);

    const manejarRegistro = async () => {
        if (!nombreUsuario.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Campo obligatorio', 'Rellena todos los campos.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Contraseña corta', 'Mínimo 6 caracteres.');
            return;
        }
        setCargando(true);
        try {
            await registro(nombreUsuario.trim(), email.trim().toLowerCase(), password);
        } catch (error) {
            const msg = error.response?.data || 'El usuario ya existe';
            Alert.alert('Error', typeof msg === 'string' ? msg : 'Error de registro');
        } finally {
            setCargando(false);
        }
    };

    const Field = ({ icon, placeholder, value, onChangeText, fieldKey, ...props }) => (
        <View style={[estilos.inputWrapper, focusedField === fieldKey && estilos.inputFocused]}>
            <Ionicons name={icon} size={20} color={focusedField === fieldKey ? colores.primario : colores.textoTenue} />
            <TextInput
                style={estilos.input}
                placeholder={placeholder}
                placeholderTextColor={colores.textoTenue}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setFocusedField(fieldKey)}
                onBlur={() => setFocusedField(null)}
                {...props}
            />
            {fieldKey === 'pass' && (
                <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
                    <Ionicons name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colores.textoTenue} />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <LinearGradient colors={['#F2F0FF', '#E8E5FF', '#F8F7FF']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <Animated.ScrollView
                        contentContainerStyle={estilos.scroll}
                        keyboardShouldPersistTaps="handled"
                        style={{ opacity: fadeAnim }}
                    >
                        {/* Botón Volver */}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonVolver}>
                            <Ionicons name="arrow-back" size={24} color={colores.primario} />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={estilos.headerContainer}>
                            <LinearGradient colors={colores.gradientePrimario} style={estilos.headerIcon}>
                                <Text style={{ fontSize: 28 }}>⚡</Text>
                            </LinearGradient>
                            <Text style={estilos.titulo}>Crear cuenta</Text>
                            <Text style={estilos.subtitulo}>Empieza tu aventura de hábitos RPG</Text>
                        </View>

                        {/* Tarjeta */}
                        <View style={estilos.card}>
                            <Field icon="person-outline" placeholder="Nombre de usuario" value={nombreUsuario}
                                onChangeText={setNombreUsuario} fieldKey="user" autoCapitalize="none" />
                            <Field icon="mail-outline" placeholder="Correo electrónico" value={email}
                                onChangeText={setEmail} fieldKey="email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                            <Field icon="lock-closed-outline" placeholder="Contraseña (mín. 6)" value={password}
                                onChangeText={setPassword} fieldKey="pass" secureTextEntry={!mostrarPassword} />

                            {/* Indicador de fuerza de contraseña */}
                            <View style={estilos.fuerzaRow}>
                                {[1, 2, 3, 4].map((i) => (
                                    <View key={i} style={[estilos.fuerzaBarra,
                                    { backgroundColor: password.length >= i * 3 ? (password.length >= 10 ? colores.exito : colores.advertencia) : colores.bordeClaro }
                                    ]} />
                                ))}
                                <Text style={estilos.fuerzaTexto}>
                                    {password.length === 0 ? '' : password.length < 6 ? 'Débil' : password.length < 10 ? 'Media' : 'Fuerte'}
                                </Text>
                            </View>

                            {/* Botón Registrar */}
                            <TouchableOpacity onPress={manejarRegistro} disabled={cargando} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={colores.gradientePrimario}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={[estilos.boton, cargando && { opacity: 0.7 }]}
                                >
                                    {cargando
                                        ? <ActivityIndicator color="#fff" />
                                        : <>
                                            <Text style={estilos.botonTexto}>Crear cuenta</Text>
                                            <Ionicons name="rocket-outline" size={20} color="#fff" />
                                        </>
                                    }
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Enlace login */}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.enlace}>
                            <Text style={estilos.enlaceTexto}>
                                ¿Ya tienes cuenta?{' '}
                                <Text style={{ color: colores.primario, fontWeight: '700' }}>Inicia sesión</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const estilos = StyleSheet.create({
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
    botonVolver: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
        ...sombraFuerte,
    },
    headerContainer: { alignItems: 'center', marginBottom: 28 },
    headerIcon: {
        width: 64, height: 64, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
        ...sombraFuerte,
    },
    titulo: { fontSize: 30, fontWeight: '900', color: colores.primario },
    subtitulo: { fontSize: 14, color: colores.textoTenue, marginTop: 4, textAlign: 'center' },
    card: { backgroundColor: '#fff', borderRadius: radio.xxl, padding: 24, ...sombraFuerte },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: colores.bordeClaro,
        backgroundColor: colores.fondoInput, borderRadius: radio.lg,
        paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        marginBottom: 12, gap: 12,
    },
    inputFocused: { borderColor: colores.primario, backgroundColor: '#fff' },
    input: { flex: 1, fontSize: 15, color: colores.texto },
    fuerzaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16, paddingHorizontal: 4 },
    fuerzaBarra: { flex: 1, height: 4, borderRadius: 2 },
    fuerzaTexto: { fontSize: 11, color: colores.textoTenue, marginLeft: 8, width: 42 },
    boton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderRadius: radio.lg, paddingVertical: 16,
        ...sombraFuerte,
    },
    botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
    enlace: { alignItems: 'center', marginTop: 24 },
    enlaceTexto: { fontSize: 14, color: colores.textoTenue },
});

export default PantallaRegistro;
