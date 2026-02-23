import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
    Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexto/AuthContexto';
import { colores, sombra, sombraFuerte, radio, espaciado } from '../estilos/tema';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PantallaLogin = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const { login } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1, duration: 800, useNativeDriver: true,
        }).start();
    }, []);

    const manejarLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campo obligatorio', 'Por favor, rellena todos los campos.');
            return;
        }
        setCargando(true);
        try {
            await login(email.trim().toLowerCase(), password);
        } catch (error) {
            const msg = error.response?.data || 'Correo o contraseña incorrectos';
            Alert.alert('Error de inicio de sesión', typeof msg === 'string' ? msg : 'Credenciales incorrectas');
        } finally {
            setCargando(false);
        }
    };

    return (
        <LinearGradient colors={['#F2F0FF', '#E8E5FF', '#F8F7FF']} style={estilos.fondo}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <Animated.ScrollView
                        contentContainerStyle={estilos.scroll}
                        keyboardShouldPersistTaps="handled"
                        style={{ opacity: fadeAnim }}
                    >
                        {/* Logo */}
                        <View style={estilos.logoContainer}>
                            <LinearGradient colors={colores.gradientePrimario} style={estilos.logoCircle}>
                                <Text style={estilos.logoEmoji}>🏋️</Text>
                            </LinearGradient>
                            <Text style={estilos.logoText}>Movo</Text>
                            <Text style={estilos.logoSub}>Transforma tus hábitos en aventuras</Text>
                        </View>

                        {/* Tarjeta formulario */}
                        <View style={estilos.card}>
                            <Text style={estilos.cardTitle}>Bienvenido de nuevo</Text>
                            <Text style={estilos.cardSub}>Inicia sesión para continuar tu progreso</Text>

                            {/* Email */}
                            <View style={[estilos.inputWrapper, focusedField === 'email' && estilos.inputFocused]}>
                                <Ionicons name="mail-outline" size={20} color={focusedField === 'email' ? colores.primario : colores.textoTenue} />
                                <TextInput
                                    style={estilos.input}
                                    placeholder="Correo electrónico"
                                    placeholderTextColor={colores.textoTenue}
                                    value={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Password */}
                            <View style={[estilos.inputWrapper, focusedField === 'pass' && estilos.inputFocused]}>
                                <Ionicons name="lock-closed-outline" size={20} color={focusedField === 'pass' ? colores.primario : colores.textoTenue} />
                                <TextInput
                                    style={estilos.input}
                                    placeholder="Contraseña"
                                    placeholderTextColor={colores.textoTenue}
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocusedField('pass')}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry={!mostrarPassword}
                                />
                                <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>
                                    <Ionicons name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colores.textoTenue} />
                                </TouchableOpacity>
                            </View>

                            {/* Botón Login */}
                            <TouchableOpacity onPress={manejarLogin} disabled={cargando} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={colores.gradientePrimario}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={[estilos.boton, cargando && { opacity: 0.7 }]}
                                >
                                    {cargando
                                        ? <ActivityIndicator color="#fff" />
                                        : <>
                                            <Text style={estilos.botonTexto}>Iniciar sesión</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        </>
                                    }
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Enlace registro */}
                        <TouchableOpacity onPress={() => navigation.navigate('Registro')} style={estilos.enlace}>
                            <Text style={estilos.enlaceTexto}>
                                ¿No tienes cuenta?{' '}
                                <Text style={estilos.enlaceNegrita}>Regístrate gratis</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const estilos = StyleSheet.create({
    fondo: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },
    logoContainer: { alignItems: 'center', marginBottom: 36 },
    logoCircle: {
        width: 80, height: 80, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
        ...sombraFuerte, marginBottom: 16,
    },
    logoEmoji: { fontSize: 36 },
    logoText: { fontSize: 42, fontWeight: '900', color: colores.primario, letterSpacing: -1 },
    logoSub: { fontSize: 14, color: colores.textoTenue, marginTop: 4, textAlign: 'center' },
    card: {
        backgroundColor: '#fff', borderRadius: radio.xxl,
        padding: 28, ...sombraFuerte,
    },
    cardTitle: { fontSize: 24, fontWeight: '800', color: colores.texto, marginBottom: 4 },
    cardSub: { fontSize: 14, color: colores.textoTenue, marginBottom: 24 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: colores.bordeClaro,
        backgroundColor: colores.fondoInput, borderRadius: radio.lg,
        paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        marginBottom: 14, gap: 12,
    },
    inputFocused: { borderColor: colores.primario, backgroundColor: '#fff' },
    input: { flex: 1, fontSize: 15, color: colores.texto },
    boton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderRadius: radio.lg, paddingVertical: 16, marginTop: 8,
        ...sombraFuerte,
    },
    botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
    enlace: { alignItems: 'center', marginTop: 24 },
    enlaceTexto: { fontSize: 14, color: colores.textoTenue },
    enlaceNegrita: { color: colores.primario, fontWeight: '700' },
});

export default PantallaLogin;
