import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { crearHabito } from '../servicios/api';
import { colores, sombra, sombraFuerte, radio } from '../estilos/tema';

const ICONOS = [
    { clave: 'estrella', emoji: '⭐', label: 'Estrella' },
    { clave: 'fuego', emoji: '🔥', label: 'Fuego' },
    { clave: 'corazon', emoji: '❤️', label: 'Corazón' },
    { clave: 'musculo', emoji: '💪', label: 'Ejercicio' },
    { clave: 'libro', emoji: '📖', label: 'Lectura' },
    { clave: 'agua', emoji: '💧', label: 'Agua' },
    { clave: 'comida', emoji: '🥦', label: 'Comida' },
    { clave: 'sueno', emoji: '🌙', label: 'Sueño' },
    { clave: 'yoga', emoji: '🧘', label: 'Yoga' },
    { clave: 'correr', emoji: '🏃', label: 'Correr' },
    { clave: 'musica', emoji: '🎵', label: 'Música' },
    { clave: 'meditacion', emoji: '🍃', label: 'Meditar' },
];

const COLORES = [
    '#6C63FF', '#FF6B6B', '#43C59E', '#F59E0B',
    '#3B82F6', '#EC4899', '#8B5CF6', '#10B981',
    '#F97316', '#06B6D4', '#EF4444', '#14B8A6',
];

const FRECUENCIAS = [
    { clave: 'DIARIO', label: '📅 Diario' },
    { clave: 'SEMANAL', label: '📆 Semanal' },
    { clave: 'LIBRE', label: '🆓 Libre' },
];

const PantallaAnadirHabito = ({ navigation }) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [icono, setIcono] = useState('estrella');
    const [color, setColor] = useState('#6C63FF');
    const [frecuencia, setFrecuencia] = useState('DIARIO');
    const [xpRecompensa, setXpRecompensa] = useState('10');
    const [cargando, setCargando] = useState(false);
    const [focus, setFocus] = useState(null);

    const crear = async () => {
        if (!nombre.trim()) {
            Alert.alert('Campo obligatorio', 'El nombre del hábito es obligatorio.');
            return;
        }
        setCargando(true);
        try {
            await crearHabito({
                nombre: nombre.trim(), descripcion: descripcion.trim(),
                icono, color, frecuencia,
                xpRecompensa: parseInt(xpRecompensa) || 10,
            });
            Alert.alert('¡Éxito! 🎉', '¡Hábito creado con éxito!', [
                { text: '¡Genial!', onPress: () => navigation.goBack() },
            ]);
        } catch {
            Alert.alert('Error', 'No se pudo crear el hábito.');
        } finally { setCargando(false); }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colores.fondo }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* Preview tarjeta */}
                    <View style={estilos.previewCard}>
                        <LinearGradient
                            colors={[color, color + 'AA']}
                            style={estilos.previewIcono}
                        >
                            <Text style={{ fontSize: 28 }}>{ICONOS.find(i => i.clave === icono)?.emoji || '⭐'}</Text>
                        </LinearGradient>
                        <Text style={estilos.previewNombre}>{nombre || 'Nombre del hábito'}</Text>
                        <Text style={estilos.previewDesc}>{descripcion || 'Descripción opcional'}</Text>
                        <View style={estilos.previewTags}>
                            <View style={[estilos.previewTag, { backgroundColor: color + '20' }]}>
                                <Text style={[estilos.previewTagText, { color }]}>+{xpRecompensa || 10} XP</Text>
                            </View>
                            <View style={estilos.previewTag}>
                                <Text style={estilos.previewTagText}>{FRECUENCIAS.find(f => f.clave === frecuencia)?.label}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Campos de texto */}
                    <View style={estilos.seccion}>
                        <Text style={estilos.seccionTitulo}>📝 Información</Text>

                        <View style={[estilos.inputWrapper, focus === 'nombre' && estilos.inputFocused]}>
                            <TextInput
                                style={estilos.input} placeholder="Nombre del hábito *"
                                placeholderTextColor={colores.textoTenue}
                                value={nombre} onChangeText={setNombre}
                                onFocus={() => setFocus('nombre')} onBlur={() => setFocus(null)}
                                maxLength={100}
                            />
                        </View>

                        <View style={[estilos.inputWrapper, focus === 'desc' && estilos.inputFocused]}>
                            <TextInput
                                style={[estilos.input, { height: 68, textAlignVertical: 'top' }]}
                                placeholder="Descripción (opcional)"
                                placeholderTextColor={colores.textoTenue}
                                value={descripcion} onChangeText={setDescripcion}
                                onFocus={() => setFocus('desc')} onBlur={() => setFocus(null)}
                                multiline maxLength={255}
                            />
                        </View>

                        <View style={[estilos.inputWrapper, { width: 120 }, focus === 'xp' && estilos.inputFocused]}>
                            <Text style={estilos.inputIcon}>⚡</Text>
                            <TextInput
                                style={estilos.input} placeholder="XP"
                                placeholderTextColor={colores.textoTenue}
                                value={xpRecompensa} onChangeText={setXpRecompensa}
                                onFocus={() => setFocus('xp')} onBlur={() => setFocus(null)}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Frecuencia */}
                    <View style={estilos.seccion}>
                        <Text style={estilos.seccionTitulo}>🔄 Frecuencia</Text>
                        <View style={estilos.freqRow}>
                            {FRECUENCIAS.map(f => (
                                <TouchableOpacity key={f.clave}
                                    style={[estilos.freqChip, frecuencia === f.clave && { backgroundColor: color + '20', borderColor: color }]}
                                    onPress={() => setFrecuencia(f.clave)}
                                >
                                    <Text style={[estilos.freqText, frecuencia === f.clave && { color, fontWeight: '700' }]}>{f.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Selector icono */}
                    <View style={estilos.seccion}>
                        <Text style={estilos.seccionTitulo}>🎭 Icono</Text>
                        <View style={estilos.gridIconos}>
                            {ICONOS.map(i => (
                                <TouchableOpacity key={i.clave}
                                    style={[estilos.iconoOpcion, icono === i.clave && { borderColor: color, backgroundColor: color + '15' }]}
                                    onPress={() => setIcono(i.clave)}
                                >
                                    <Text style={{ fontSize: 24 }}>{i.emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Selector color */}
                    <View style={estilos.seccion}>
                        <Text style={estilos.seccionTitulo}>🎨 Color</Text>
                        <View style={estilos.gridColores}>
                            {COLORES.map(c => (
                                <TouchableOpacity key={c}
                                    style={[estilos.colorCirculo, { backgroundColor: c },
                                    color === c && { borderWidth: 3, borderColor: '#fff', ...sombraFuerte }
                                    ]}
                                    onPress={() => setColor(c)}
                                >
                                    {color === c && <Ionicons name="checkmark" size={18} color="#fff" />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Botones */}
                    <View style={estilos.botonRow}>
                        <TouchableOpacity style={estilos.botonCancelar} onPress={() => navigation.goBack()}>
                            <Text style={estilos.cancelarTexto}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={crear} disabled={cargando} activeOpacity={0.8} style={{ flex: 2 }}>
                            <LinearGradient
                                colors={[color, color + 'CC']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={[estilos.botonCrear, cargando && { opacity: 0.6 }]}
                            >
                                {cargando
                                    ? <ActivityIndicator color="#fff" />
                                    : <><Text style={estilos.crearTexto}>Crear hábito</Text><Ionicons name="sparkles" size={18} color="#fff" /></>
                                }
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const estilos = StyleSheet.create({
    scroll: { padding: 20, paddingBottom: 40 },

    // Preview
    previewCard: {
        alignItems: 'center', backgroundColor: '#fff',
        borderRadius: radio.xxl, padding: 28, marginBottom: 16, ...sombraFuerte,
    },
    previewIcono: {
        width: 72, height: 72, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    previewNombre: { fontSize: 20, fontWeight: '800', color: colores.texto, textAlign: 'center' },
    previewDesc: { fontSize: 13, color: colores.textoTenue, marginTop: 4, textAlign: 'center' },
    previewTags: { flexDirection: 'row', gap: 8, marginTop: 12 },
    previewTag: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
    previewTagText: { fontSize: 12, fontWeight: '600', color: colores.textoSecundario },

    // Secciones
    seccion: { backgroundColor: '#fff', borderRadius: radio.xl, padding: 16, marginBottom: 12, ...sombra },
    seccionTitulo: { fontSize: 15, fontWeight: '700', color: colores.texto, marginBottom: 12 },

    // Inputs
    inputWrapper: {
        borderWidth: 1.5, borderColor: colores.bordeClaro, backgroundColor: colores.fondoInput,
        borderRadius: radio.md, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    inputFocused: { borderColor: colores.primario, backgroundColor: '#fff' },
    input: { flex: 1, fontSize: 15, color: colores.texto },
    inputIcon: { fontSize: 18 },

    // Frecuencia
    freqRow: { flexDirection: 'row', gap: 8 },
    freqChip: {
        flex: 1, borderWidth: 1.5, borderColor: colores.bordeClaro,
        borderRadius: radio.md, paddingVertical: 10, alignItems: 'center',
    },
    freqText: { fontSize: 13, color: colores.textoSecundario },

    // Iconos grid
    gridIconos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    iconoOpcion: {
        width: 54, height: 54, borderRadius: radio.lg, borderWidth: 2,
        borderColor: colores.bordeClaro, justifyContent: 'center', alignItems: 'center',
    },

    // Colores grid
    gridColores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    colorCirculo: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: 'center', alignItems: 'center',
    },

    // Botones
    botonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    botonCancelar: {
        flex: 1, borderRadius: radio.lg, borderWidth: 1.5,
        borderColor: colores.borde, paddingVertical: 15, alignItems: 'center',
    },
    cancelarTexto: { fontSize: 15, fontWeight: '700', color: colores.textoSecundario },
    botonCrear: {
        flexDirection: 'row', gap: 8, borderRadius: radio.lg,
        paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
        ...sombraFuerte,
    },
    crearTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default PantallaAnadirHabito;
