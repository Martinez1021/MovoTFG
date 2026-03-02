import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    ScrollView, Alert, ActivityIndicator, TextInput,
    Dimensions, Modal, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

// Decode base64 string to Uint8Array without external deps
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    return bytes;
}

interface ProgressPhoto {
    id: string;
    photo_url: string;
    notes?: string;
    recorded_at: string;
    weight_kg?: number;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COL = 2;
const GAP = 10;
const PHOTO_W = (SCREEN_W - Spacing.base * 2 - GAP) / COL;
const PHOTO_H = PHOTO_W * 1.35;

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
    const [uploadProgress, setUploadProgress] = useState('');
    const [viewPhoto, setViewPhoto] = useState<ProgressPhoto | null>(null);

    const load = useCallback(async () => {
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
    }, [user?.id]);

    useEffect(() => { load(); }, [load]);

    const pickPhoto = async (fromCamera = false) => {
        if (fromCamera) {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara.'); return; }
            const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.75 });
            if (!result.canceled && result.assets[0]) setPreview(result.assets[0].uri);
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos.'); return; }
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.75 });
            if (!result.canceled && result.assets[0]) setPreview(result.assets[0].uri);
        }
    };

    const upload = async () => {
        if (!preview || !internalId || !user?.id) return;
        setUploading(true);
        setUploadProgress('Leyendo imagen…');
        try {
            // Read file as base64 using expo-file-system (reliable in React Native / Hermes)
            const base64 = await FileSystem.readAsStringAsync(preview, {
                encoding: 'base64' as const,
            });
            const ext = preview.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
            const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
            const fileName = `progress/${user.id}/${Date.now()}.${ext}`;

            setUploadProgress('Subiendo foto…');
            const bytes = base64ToUint8Array(base64);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, bytes, { contentType: mimeType, upsert: false });
            if (uploadError) throw new Error(`Storage: ${uploadError.message}`);

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            if (!urlData?.publicUrl) throw new Error('No se pudo obtener la URL pública');

            setUploadProgress('Guardando…');
            const kg = parseFloat(weightKg.replace(',', '.'));
            const { error: dbError } = await supabase.from('progress_photos').insert({
                user_id: internalId,
                photo_url: urlData.publicUrl,
                notes: notes.trim() || null,
                weight_kg: !isNaN(kg) && kg > 0 ? kg : null,
                recorded_at: new Date().toISOString(),
            });
            if (dbError) throw new Error(`DB: ${dbError.message}`);

            setPreview(null);
            setNotes('');
            setWeightKg('');
            setUploadProgress('');
            load();
        } catch (e: any) {
            Alert.alert('Error al subir', e.message ?? 'Inténtalo de nuevo.');
        } finally {
            setUploading(false);
            setUploadProgress('');
        }
    };

    const remove = (id: string, photoUrl: string) => {
        Alert.alert('Eliminar foto', '¿Eliminar esta foto de progreso? Esta acción no se puede deshacer.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    await supabase.from('progress_photos').delete().eq('id', id);
                    try {
                        const path = photoUrl.split('/avatars/')[1];
                        if (path) await supabase.storage.from('avatars').remove([path]);
                    } catch { /* ignore */ }
                    setPhotos((p) => p.filter((ph) => ph.id !== id));
                    setViewPhoto(null);
                },
            },
        ]);
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    const formatShort = (iso: string) =>
        new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    return (
        <View style={{ flex: 1, backgroundColor: '#080810' }}>
            <StatusBar barStyle="light-content" />

            {/* ── Header ─────────────────────────────────── */}
            <LinearGradient colors={['#0D0A20', '#080810']} style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={s.headerTitle}>Fotos de progreso</Text>
                    <Text style={s.headerSub}>{photos.length} foto{photos.length !== 1 ? 's' : ''} guardadas</Text>
                </View>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Add photo / Preview ────────────────── */}
                {!preview ? (
                    <View style={s.addCard}>
                        <View style={s.addCardInner}>
                            <LinearGradient colors={[primary + '33', primary + '11']} style={s.addIconCircle}>
                                <Ionicons name="camera" size={28} color={primary} />
                            </LinearGradient>
                            <Text style={s.addTitle}>Añadir foto</Text>
                            <Text style={s.addSub}>Documenta tu transformación física</Text>
                            <View style={s.addBtns}>
                                <TouchableOpacity onPress={() => pickPhoto(false)} style={[s.addPickerBtn, { borderColor: primary + '66' }]}>
                                    <LinearGradient colors={[primary + '22', primary + '08']} style={s.addPickerGrad}>
                                        <Ionicons name="images" size={20} color={primary} />
                                        <Text style={[s.addPickerTxt, { color: primary }]}>Galería</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => pickPhoto(true)} style={[s.addPickerBtn, { borderColor: Colors.secondary + '66' }]}>
                                    <LinearGradient colors={[Colors.secondary + '22', Colors.secondary + '08']} style={s.addPickerGrad}>
                                        <Ionicons name="camera" size={20} color={Colors.secondary} />
                                        <Text style={[s.addPickerTxt, { color: Colors.secondary }]}>Cámara</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={s.previewCard}>
                        <Image source={{ uri: preview }} style={s.previewImg} resizeMode="cover" />
                        <LinearGradient colors={['transparent', 'rgba(8,8,16,0.95)']} style={s.previewOverlay}>
                            <Text style={s.previewLabel}>Vista previa</Text>
                            <View style={s.previewInputRow}>
                                <View style={[s.previewInputWrap, { flex: 1 }]}>
                                    <Ionicons name="scale-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                                    <TextInput
                                        style={s.previewInput}
                                        placeholder="Peso (kg)"
                                        placeholderTextColor={Colors.textSecondary}
                                        keyboardType="decimal-pad"
                                        value={weightKg}
                                        onChangeText={setWeightKg}
                                    />
                                </View>
                                <View style={[s.previewInputWrap, { flex: 2 }]}>
                                    <Ionicons name="pencil-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                                    <TextInput
                                        style={s.previewInput}
                                        placeholder="Nota (semana 4, déficit…)"
                                        placeholderTextColor={Colors.textSecondary}
                                        value={notes}
                                        onChangeText={setNotes}
                                        maxLength={80}
                                    />
                                </View>
                            </View>
                            <View style={s.previewActions}>
                                <TouchableOpacity onPress={() => { setPreview(null); setNotes(''); setWeightKg(''); }} style={s.previewCancel}>
                                    <Ionicons name="close" size={16} color={Colors.textSecondary} />
                                    <Text style={s.previewCancelTxt}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={upload} disabled={uploading} style={[s.previewUpload, { backgroundColor: primary }]}>
                                    {uploading ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <ActivityIndicator color="#fff" size="small" />
                                            <Text style={s.previewUploadTxt}>{uploadProgress || 'Subiendo…'}</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <Ionicons name="cloud-upload" size={16} color="#fff" />
                                            <Text style={s.previewUploadTxt}>Guardar foto</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* ── Gallery ──────────────────────────── */}
                {loading ? (
                    <View style={s.loadingWrap}>
                        <ActivityIndicator color={primary} size="large" />
                        <Text style={s.loadingTxt}>Cargando fotos…</Text>
                    </View>
                ) : photos.length === 0 ? (
                    <View style={s.empty}>
                        <LinearGradient colors={['#1a1a2e', '#16213e']} style={s.emptyCircle}>
                            <Text style={{ fontSize: 40 }}>📸</Text>
                        </LinearGradient>
                        <Text style={s.emptyTitle}>Sin fotos aún</Text>
                        <Text style={s.emptySub}>Sube tu primera foto y empieza a documentar tu transformación</Text>
                    </View>
                ) : (
                    <>
                        <View style={s.galHeader}>
                            <Text style={s.galTitle}>Tu evolución</Text>
                            <Text style={s.galSub}>Toca para ampliar</Text>
                        </View>
                        <View style={s.grid}>
                            {photos.map((ph, idx) => (
                                <TouchableOpacity key={ph.id} onPress={() => setViewPhoto(ph)} activeOpacity={0.85} style={s.photoWrap}>
                                    <Image source={{ uri: ph.photo_url }} style={s.photoImg} resizeMode="cover" />
                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={s.photoGrad}>
                                        {ph.weight_kg ? (
                                            <View style={s.weightBubble}>
                                                <Text style={s.weightBubbleTxt}>{ph.weight_kg} kg</Text>
                                            </View>
                                        ) : null}
                                        <Text style={s.photoDate}>{formatShort(ph.recorded_at)}</Text>
                                        {ph.notes ? <Text style={s.photoNote} numberOfLines={1}>{ph.notes}</Text> : null}
                                    </LinearGradient>
                                    {idx === 0 && (
                                        <View style={[s.latestBadge, { backgroundColor: primary }]}>
                                            <Text style={s.latestTxt}>reciente</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* ── Full photo modal ───────────────────── */}
            <Modal visible={!!viewPhoto} transparent animationType="fade" statusBarTranslucent>
                {viewPhoto && (
                    <View style={s.modal}>
                        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setViewPhoto(null)} />
                        <View style={s.modalContent}>
                            <Image source={{ uri: viewPhoto.photo_url }} style={s.modalImg} resizeMode="contain" />
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={s.modalInfo}>
                                <View style={s.modalMeta}>
                                    {viewPhoto.weight_kg ? (
                                        <View style={[s.modalChip, { backgroundColor: primary + '33', borderColor: primary + '55' }]}>
                                            <Ionicons name="scale-outline" size={12} color={primary} />
                                            <Text style={[s.modalChipTxt, { color: primary }]}>{viewPhoto.weight_kg} kg</Text>
                                        </View>
                                    ) : null}
                                    <View style={[s.modalChip, { backgroundColor: '#ffffff11', borderColor: '#ffffff22' }]}>
                                        <Ionicons name="calendar-outline" size={12} color="#aaa" />
                                        <Text style={[s.modalChipTxt, { color: '#aaa' }]}>{formatDate(viewPhoto.recorded_at)}</Text>
                                    </View>
                                </View>
                                {viewPhoto.notes ? <Text style={s.modalNotes}>{viewPhoto.notes}</Text> : null}
                                <View style={s.modalActions}>
                                    <TouchableOpacity onPress={() => setViewPhoto(null)} style={s.modalClose}>
                                        <Ionicons name="close" size={18} color="#fff" />
                                        <Text style={s.modalCloseTxt}>Cerrar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => remove(viewPhoto.id, viewPhoto.photo_url)} style={s.modalDelete}>
                                        <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                                        <Text style={s.modalDeleteTxt}>Eliminar</Text>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>
                )}
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 58, paddingBottom: Spacing.lg },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    headerTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: '#fff', textAlign: 'center' },
    headerSub: { fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 40, gap: Spacing.lg },
    // Add card
    addCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    addCardInner: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.md, backgroundColor: 'rgba(255,255,255,0.03)' },
    addIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    addTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.textPrimary },
    addSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },
    addBtns: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 },
    addPickerBtn: { flex: 1, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    addPickerGrad: { paddingVertical: 16, alignItems: 'center', gap: 6 },
    addPickerTxt: { fontSize: FontSizes.sm, fontWeight: '700' },
    // Preview
    previewCard: { borderRadius: 24, overflow: 'hidden', height: SCREEN_H * 0.55 },
    previewImg: { width: '100%', height: '100%', position: 'absolute' },
    previewOverlay: { flex: 1, justifyContent: 'flex-end', padding: Spacing.md, gap: 10 },
    previewLabel: { color: 'rgba(255,255,255,0.5)', fontSize: FontSizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    previewInputRow: { flexDirection: 'row', gap: 8 },
    previewInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10 },
    previewInput: { flex: 1, color: '#fff', fontSize: FontSizes.sm, paddingVertical: 10 },
    previewActions: { flexDirection: 'row', gap: 10 },
    previewCancel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    previewCancelTxt: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSizes.sm },
    previewUpload: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 13 },
    previewUploadTxt: { color: '#fff', fontWeight: '700', fontSize: FontSizes.sm },
    // Loading / empty
    loadingWrap: { alignItems: 'center', paddingTop: 40, gap: 12 },
    loadingTxt: { color: Colors.textSecondary, fontSize: FontSizes.sm },
    empty: { alignItems: 'center', paddingTop: 20, gap: Spacing.md },
    emptyCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.textPrimary },
    emptySub: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    // Gallery
    galHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    galTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary },
    galSub: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    photoWrap: { width: PHOTO_W, height: PHOTO_H, borderRadius: 18, overflow: 'hidden', position: 'relative' },
    photoImg: { width: '100%', height: '100%' },
    photoGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 10, paddingBottom: 10, paddingTop: 30 },
    weightBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, marginBottom: 4 },
    weightBubbleTxt: { color: '#fff', fontWeight: '700', fontSize: 11 },
    photoDate: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700' },
    photoNote: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1 },
    latestBadge: { position: 'absolute', top: 10, right: 10, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
    latestTxt: { color: '#fff', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    // Modal
    modal: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.92)' },
    modalContent: { width: SCREEN_W, maxHeight: SCREEN_H * 0.88, borderRadius: 24, overflow: 'hidden' },
    modalImg: { width: SCREEN_W, height: SCREEN_H * 0.72 },
    modalInfo: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: 50 },
    modalMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    modalChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
    modalChipTxt: { fontSize: FontSizes.xs, fontWeight: '700' },
    modalNotes: { color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.sm, marginBottom: 16, lineHeight: 20 },
    modalActions: { flexDirection: 'row', gap: 10 },
    modalClose: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 13 },
    modalCloseTxt: { color: '#fff', fontWeight: '600', fontSize: FontSizes.sm },
    modalDelete: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,100,100,0.15)', borderRadius: 14, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(255,100,100,0.3)' },
    modalDeleteTxt: { color: '#ff6b6b', fontWeight: '600', fontSize: FontSizes.sm },
});
