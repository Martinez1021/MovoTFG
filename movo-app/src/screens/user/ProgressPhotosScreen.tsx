import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    ScrollView, Alert, ActivityIndicator, TextInput, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

interface ProgressPhoto {
    id: string;
    photo_url: string;
    notes?: string;
    recorded_at: string;
    weight_kg?: number;
}

const { width: SCREEN_W } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_W - Spacing.base * 2 - 10) / 2;

export const ProgressPhotosScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuthStore();
    const { primary } = useThemeStore();
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [internalId, setInternalId] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [preview, setPreview] = useState<string | null>(null);

    const load = async () => {
        if (!user?.id) return;
        setLoading(true);
        const { data: uRow } = await supabase.from('users').select('id').eq('supabase_id', user.id).maybeSingle();
        if (!uRow?.id) { setLoading(false); return; }
        setInternalId(uRow.id);
        const { data } = await supabase
            .from('progress_photos')
            .select('id, photo_url, notes, recorded_at, weight_kg')
            .eq('user_id', uRow.id)
            .order('recorded_at', { ascending: false });
        setPhotos(data ?? []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setPreview(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara.'); return; }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setPreview(result.assets[0].uri);
        }
    };

    const upload = async () => {
        if (!preview || !internalId || !user?.id) return;
        setUploading(true);
        try {
            // Convert image to blob
            const resp = await fetch(preview);
            const blob = await resp.blob();
            const ext = preview.split('.').pop()?.split('?')[0] ?? 'jpg';
            const fileName = `progress/${user.id}/${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, blob, { contentType: `image/${ext}`, upsert: false });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            const photoUrl = urlData?.publicUrl;
            if (!photoUrl) throw new Error('No se pudo obtener URL de la foto');

            const kg = parseFloat(weightKg.replace(',', '.'));
            const { error: dbError } = await supabase.from('progress_photos').insert({
                user_id: internalId,
                photo_url: photoUrl,
                notes: notes.trim() || null,
                weight_kg: !isNaN(kg) ? kg : null,
                recorded_at: new Date().toISOString(),
            });
            if (dbError) throw dbError;

            setPreview(null);
            setNotes('');
            setWeightKg('');
            load();
        } catch (e: any) {
            Alert.alert('Error al subir', e.message ?? 'Inténtalo de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    const remove = (id: string, photoUrl: string) => {
        Alert.alert('Eliminar foto', '¿Eliminar esta foto de progreso?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    await supabase.from('progress_photos').delete().eq('id', id);
                    // Optionally delete from storage
                    try {
                        const path = photoUrl.split('/avatars/')[1];
                        if (path) await supabase.storage.from('avatars').remove([path]);
                    } catch { /* ignore storage error */ }
                    setPhotos((p) => p.filter((ph) => ph.id !== id));
                },
            },
        ]);
    };

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.title}>📸 Fotos de progreso</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Add photo card */}
                <View style={s.addCard}>
                    <Text style={s.cardTitle}>Nueva foto</Text>
                    {preview ? (
                        <>
                            <Image source={{ uri: preview }} style={s.preview} resizeMode="cover" />
                            <View style={s.row}>
                                <TextInput
                                    style={[s.input, { flex: 1 }]}
                                    placeholder="Peso actual (kg)"
                                    placeholderTextColor={Colors.textSecondary}
                                    keyboardType="decimal-pad"
                                    value={weightKg}
                                    onChangeText={setWeightKg}
                                />
                            </View>
                            <TextInput
                                style={s.input}
                                placeholder="Nota (ej. semana 4, +2kg músculo)"
                                placeholderTextColor={Colors.textSecondary}
                                value={notes}
                                onChangeText={setNotes}
                                maxLength={120}
                            />
                            <View style={s.row}>
                                <TouchableOpacity onPress={() => setPreview(null)} style={s.cancelBtn}>
                                    <Text style={s.cancelTxt}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={upload}
                                    disabled={uploading}
                                    style={[s.uploadBtn, { backgroundColor: primary }]}
                                >
                                    {uploading
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={s.uploadTxt}>Subir foto</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={s.row}>
                            <TouchableOpacity onPress={pickPhoto} style={[s.pickerBtn, { borderColor: primary + '55' }]}>
                                <Ionicons name="images-outline" size={22} color={primary} />
                                <Text style={[s.pickerTxt, { color: primary }]}>Galería</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={takePhoto} style={[s.pickerBtn, { borderColor: Colors.secondary + '55' }]}>
                                <Ionicons name="camera-outline" size={22} color={Colors.secondary} />
                                <Text style={[s.pickerTxt, { color: Colors.secondary }]}>Cámara</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Photo gallery */}
                {loading ? (
                    <ActivityIndicator color={primary} style={{ marginTop: 30 }} />
                ) : photos.length === 0 ? (
                    <View style={s.empty}>
                        <Text style={{ fontSize: 40 }}>📸</Text>
                        <Text style={s.emptyTxt}>Sin fotos aún</Text>
                        <Text style={s.emptySub}>Sube tu primera foto de progreso para empezar a ver tu evolución.</Text>
                    </View>
                ) : (
                    <>
                        <Text style={s.galTitle}>{photos.length} foto{photos.length !== 1 ? 's' : ''}</Text>
                        <View style={s.grid}>
                            {photos.map((ph) => (
                                <View key={ph.id} style={s.photoWrap}>
                                    <Image source={{ uri: ph.photo_url }} style={s.photo} resizeMode="cover" />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                                        style={s.photoOverlay}
                                    >
                                        <Text style={s.photoDate}>
                                            {new Date(ph.recorded_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </Text>
                                        {ph.weight_kg && <Text style={s.photoWeight}>{ph.weight_kg} kg</Text>}
                                    </LinearGradient>
                                    <TouchableOpacity onPress={() => remove(ph.id, ph.photo_url)} style={s.delBtn}>
                                        <Ionicons name="close-circle" size={20} color="rgba(255,80,80,0.9)" />
                                    </TouchableOpacity>
                                    {ph.notes ? (
                                        <View style={s.notesBadge}>
                                            <Text style={s.notesTxt} numberOfLines={1}>{ph.notes}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 58, paddingBottom: Spacing.md },
    back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    title: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
    addCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
    cardTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
    preview: { width: '100%', height: 240, borderRadius: BorderRadius.lg },
    row: { flexDirection: 'row', gap: 10 },
    input: { backgroundColor: '#111', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary, fontSize: FontSizes.sm, paddingHorizontal: Spacing.md, paddingVertical: 10 },
    cancelBtn: { flex: 1, borderRadius: BorderRadius.lg, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    cancelTxt: { fontWeight: '700', fontSize: FontSizes.sm, color: Colors.textSecondary },
    uploadBtn: { flex: 2, borderRadius: BorderRadius.lg, paddingVertical: 12, alignItems: 'center' },
    uploadTxt: { fontWeight: '700', fontSize: FontSizes.base, color: '#fff' },
    pickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: BorderRadius.lg, borderWidth: 1, paddingVertical: 16 },
    pickerTxt: { fontWeight: '700', fontSize: FontSizes.sm },
    empty: { alignItems: 'center', gap: 8, paddingTop: 40 },
    emptyTxt: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
    emptySub: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },
    galTitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    photoWrap: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.25, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative' },
    photo: { width: '100%', height: '100%' },
    photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 },
    photoDate: { color: '#fff', fontSize: 10, fontWeight: '700' },
    photoWeight: { color: 'rgba(255,255,255,0.8)', fontSize: 9 },
    delBtn: { position: 'absolute', top: 6, right: 6 },
    notesBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, maxWidth: PHOTO_SIZE - 40 },
    notesTxt: { color: '#fff', fontSize: 9 },
});
