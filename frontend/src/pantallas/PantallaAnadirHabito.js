import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { crearHabito } from '../servicios/api';
import { colores, sombra } from '../estilos/tema';

const ICONOS = [
    { clave: 'estrella', ion: 'star', etiqueta: '⭐' },
    { clave: 'fuego', ion: 'flame', etiqueta: '🔥' },
    { clave: 'corazon', ion: 'heart', etiqueta: '❤️' },
    { clave: 'musculo', ion: 'barbell', etiqueta: '💪' },
    { clave: 'libro', ion: 'book', etiqueta: '📖' },
    { clave: 'agua', ion: 'water', etiqueta: '💧' },
    { clave: 'comida', ion: 'nutrition', etiqueta: '🥦' },
    { clave: 'sueno', ion: 'moon', etiqueta: '🌙' },
    { clave: 'yoga', ion: 'body', etiqueta: '🧘' },
    { clave: 'correr', ion: 'walk', etiqueta: '🏃' },
    { clave: 'musica', ion: 'musical-notes', etiqueta: '🎵' },
    { clave: 'meditacion', ion: 'leaf', etiqueta: '🍃' },
];

const COLORES = [
    '#6C63FF', '#FF6584', '#43C59E', '#F59E0B',
    '#3B82F6', '#EF4444', '#8B5CF6', '#10B981',
];

const PantallaAnadirHabito = ({ navigation }) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [iconoSeleccionado, setIconoSeleccionado] = useState('estrella');
    const [colorSeleccionado, setColorSeleccionado] = useState('#6C63FF');
    const [xpRecompensa, setXpRecompensa] = useState('10');
    const [cargando, setCargando] = useState(false);

    const manejarCrear = async () => {
        if (!nombre.trim()) {
            Alert.alert('Campo obligatorio', 'El nombre del hábito es obligatorio.');
            return;
        }
        setCargando(true);
        try {
            await crearHabito({
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                icono: iconoSeleccionado,
                color: colorSeleccionado,
                frecuencia: 'DIARIO',
                xpRecompensa: parseInt(xpRecompensa) || 10,
            });
            Alert.alert('¡Éxito! 🎉', '¡Hábito creado con éxito!', [
                { text: 'Genial', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo crear el hábito. Inténtalo de nuevo.');
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
                <Text style={estilos.titulo}>Nuevo hábito</Text>

                <View style={estilos.seccion}>
                    <Text style={estilos.etiqueta}>Nombre *</Text>
                    <TextInput
                        style={estilos.campo}
                        placeholder="ej. Meditar 10 minutos"
                        placeholderTextColor={colores.textoTenue}
                        value={nombre}
                        onChangeText={setNombre}
                        maxLength={100}
                    />

                    <Text style={estilos.etiqueta}>Descripción</Text>
                    <TextInput
                        style={[estilos.campo, estilos.campoMultilinea]}
                        placeholder="Describe tu hábito (opcional)"
                        placeholderTextColor={colores.textoTenue}
                        value={descripcion}
                        onChangeText={setDescripcion}
                        multiline
                        numberOfLines={3}
                        maxLength={255}
                    />

                    <Text style={estilos.etiqueta}>XP de recompensa</Text>
                    <TextInput
                        style={estilos.campo}
                        placeholder="10"
                        placeholderTextColor={colores.textoTenue}
                        value={xpRecompensa}
                        onChangeText={setXpRecompensa}
                        keyboardType="numeric"
                    />
                </View>

                {/* Selector de icono */}
                <View style={estilos.seccion}>
                    <Text style={estilos.etiqueta}>Icono</Text>
                    <View style={estilos.cuadricula}>
                        {ICONOS.map((icono) => (
                            <TouchableOpacity
                                key={icono.clave}
                                style={[
                                    estilos.opcionIcono,
                                    iconoSeleccionado === icono.clave && {
                                        borderColor: colorSeleccionado,
                                        backgroundColor: colorSeleccionado + '20',
                                    }
                                ]}
                                onPress={() => setIconoSeleccionado(icono.clave)}
                            >
                                <Text style={estilos.emojiIcono}>{icono.etiqueta}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Selector de color */}
                <View style={estilos.seccion}>
                    <Text style={estilos.etiqueta}>Color</Text>
                    <View style={estilos.filaColores}>
                        {COLORES.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[estilos.circuloColor, { backgroundColor: color },
                                colorSeleccionado === color && estilos.circuloSeleccionado]}
                                onPress={() => setColorSeleccionado(color)}
                            >
                                {colorSeleccionado === color && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={estilos.botones}>
                    <TouchableOpacity
                        style={estilos.botonCancelar}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={estilos.textoCancelar}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[estilos.botonCrear, { backgroundColor: colorSeleccionado }, cargando && estilos.deshabilitado]}
                        onPress={manejarCrear}
                        disabled={cargando}
                    >
                        {cargando
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={estilos.textoCrear}>Crear hábito</Text>
                        }
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    desplazable: { padding: 20, paddingBottom: 40 },
    titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 20 },
    seccion: {
        backgroundColor: '#fff', borderRadius: 18, padding: 16,
        marginBottom: 14, ...sombra,
    },
    etiqueta: { fontSize: 13, fontWeight: '600', color: colores.textoSecundario, marginBottom: 8 },
    campo: {
        borderWidth: 1.5, borderColor: '#E8E8F0', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
        color: colores.texto, backgroundColor: '#FAFAFA', marginBottom: 14,
    },
    campoMultilinea: { height: 80, textAlignVertical: 'top' },
    cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    opcionIcono: {
        width: 50, height: 50, borderRadius: 14, borderWidth: 2,
        borderColor: '#E8E8F0', justifyContent: 'center', alignItems: 'center',
    },
    emojiIcono: { fontSize: 22 },
    filaColores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    circuloColor: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },
    circuloSeleccionado: { borderWidth: 3, borderColor: '#fff', ...sombra },
    botones: { flexDirection: 'row', gap: 12, marginTop: 8 },
    botonCancelar: {
        flex: 1, borderRadius: 14, paddingVertical: 14,
        borderWidth: 1.5, borderColor: colores.borde, alignItems: 'center',
    },
    textoCancelar: { fontSize: 15, fontWeight: '700', color: colores.textoSecundario },
    botonCrear: { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    textoCrear: { color: '#fff', fontSize: 15, fontWeight: '700' },
    deshabilitado: { opacity: 0.6 },
});

export default PantallaAnadirHabito;
