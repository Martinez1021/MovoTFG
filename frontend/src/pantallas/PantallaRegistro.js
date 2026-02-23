import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../contexto/AuthContexto';
import { colores, sombra } from '../estilos/tema';

const PantallaRegistro = ({ navigation }) => {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    const { registro } = useAuth();

    const manejarRegistro = async () => {
        if (!nombreUsuario.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Campo obligatorio', 'Por favor, rellena todos los campos.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setCargando(true);
        try {
            await registro(nombreUsuario.trim(), email.trim(), password);
        } catch (error) {
            const mensaje = error.response?.data || 'El usuario ya existe';
            Alert.alert('Error', mensaje);
        } finally {
            setCargando(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={estilos.contenedor}
        >
            <ScrollView contentContainerStyle={estilos.desplazable} keyboardShouldPersistTaps="handled">
                <View style={estilos.encabezado}>
                    <Text style={estilos.emoji}>⚡</Text>
                    <Text style={estilos.titulo}>Crear cuenta</Text>
                    <Text style={estilos.subtitulo}>Empieza tu aventura de hábitos</Text>
                </View>

                <View style={estilos.tarjeta}>
                    <Text style={estilos.etiqueta}>Nombre de usuario</Text>
                    <TextInput
                        style={estilos.campo}
                        placeholder="@tunombre"
                        placeholderTextColor={colores.textoTenue}
                        value={nombreUsuario}
                        onChangeText={setNombreUsuario}
                        autoCapitalize="none"
                    />

                    <Text style={estilos.etiqueta}>Correo electrónico</Text>
                    <TextInput
                        style={estilos.campo}
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor={colores.textoTenue}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={estilos.etiqueta}>Contraseña</Text>
                    <TextInput
                        style={estilos.campo}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor={colores.textoTenue}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[estilos.boton, cargando && estilos.botonDeshabilitado]}
                        onPress={manejarRegistro}
                        disabled={cargando}
                    >
                        {cargando
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={estilos.textoBoton}>Crear cuenta</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={estilos.enlace}>¿Ya tienes cuenta? <Text style={estilos.enlaceNegrita}>Inicia sesión</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    desplazable: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    encabezado: { alignItems: 'center', marginBottom: 32 },
    emoji: { fontSize: 48, marginBottom: 8 },
    titulo: { fontSize: 32, fontWeight: '800', color: colores.primario },
    subtitulo: { fontSize: 15, color: colores.textoTenue, marginTop: 4 },
    tarjeta: { backgroundColor: '#fff', borderRadius: 24, padding: 28, ...sombra },
    etiqueta: { fontSize: 13, fontWeight: '600', color: colores.textoSecundario, marginBottom: 6 },
    campo: {
        borderWidth: 1.5, borderColor: '#E8E8F0', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
        color: colores.texto, backgroundColor: '#FAFAFA', marginBottom: 16,
    },
    boton: {
        backgroundColor: colores.primario, borderRadius: 14,
        paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 16,
    },
    botonDeshabilitado: { opacity: 0.6 },
    textoBoton: { color: '#fff', fontSize: 16, fontWeight: '700' },
    enlace: { textAlign: 'center', color: colores.textoTenue, fontSize: 14 },
    enlaceNegrita: { color: colores.primario, fontWeight: '700' },
});

export default PantallaRegistro;
