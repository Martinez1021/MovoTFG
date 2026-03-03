import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

export const TrainerProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, logout, setUser } = useAuthStore();
    const [notifications, setNotifications] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handleLogout = () => Alert.alert('Cerrar sesión', '¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout },
    ]);

    const pickAvatar = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!res.canceled && user) {
            setUploadingAvatar(true);
            try {
                const uri = res.assets[0].uri;
                const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
                const fileName = `${user.id}/avatar.${ext}`;
                const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

                const response = await fetch(uri);
                const blob = await response.blob();

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, blob, { contentType, upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
                // Propagate to all tables
                await supabase.from('users').update({ avatar_url: publicUrl }).eq('supabase_id', user.id);
                await supabase.from('feed_posts').update({ user_avatar: publicUrl }).eq('supabase_uid', user.id);
                await supabase.from('feed_comments').update({ user_avatar: publicUrl }).eq('supabase_uid', user.id);
                setUser({ ...user, avatar_url: publicUrl });
                Alert.alert('¡Foto actualizada!', '');
            } catch (e: any) {
                Alert.alert('Error', e.message ?? 'No se pudo subir la imagen');
            } finally {
                setUploadingAvatar(false);
            }
        }
    };

    const specialty = user?.specialty ?? 'Sin especialidad definida';
    const bio = user?.bio ?? '';
    const experienceYears = user?.experience_years;
    const certifications = user?.certifications ?? '';

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll}>
                {/* Header con foto */}
                <LinearGradient colors={['#1A0A2E', '#0A0A0A']} style={s.headerBg}>
                    <TouchableOpacity onPress={pickAvatar} style={s.avatarWrap} disabled={uploadingAvatar}>
                        {user?.avatar_url
                            ? <Image source={{ uri: user.avatar_url }} style={s.avatar} />
                            : <LinearGradient colors={Colors.gradientPrimary} style={s.avatarPlaceholder}>
                                <Text style={s.avatarInitial}>{user?.full_name?.[0] ?? 'T'}</Text>
                            </LinearGradient>
                        }
                        <View style={s.cameraBtn}>
                            <Ionicons name={uploadingAvatar ? 'hourglass-outline' : 'camera'} size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={s.name}>{user?.full_name}</Text>
                    <Text style={s.email}>{user?.email}</Text>
                    <View style={s.roleBadge}>
                        <Text style={s.roleText}>🏋️ Entrenador Personal</Text>
                    </View>
                </LinearGradient>

                {/* Stats del entrenador */}
                <View style={s.statsRow}>
                    <View style={s.statCard}>
                        <Text style={s.statValue}>{experienceYears ? `${experienceYears}` : '—'}</Text>
                        <Text style={s.statLabel}>Años exp.</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statValue}>0</Text>
                        <Text style={s.statLabel}>Clientes</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statValue}>0</Text>
                        <Text style={s.statLabel}>Rutinas</Text>
                    </View>
                </View>

                {/* Especialidad */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Ionicons name="trophy-outline" size={18} color={Colors.primary} />
                        <Text style={s.sectionTitle}>Especialidad</Text>
                    </View>
                    <Text style={s.infoText}>{specialty}</Text>
                </View>

                {/* Certificaciones */}
                {certifications ? (
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <Ionicons name="ribbon-outline" size={18} color={Colors.primary} />
                            <Text style={s.sectionTitle}>Certificaciones</Text>
                        </View>
                        <Text style={s.infoText}>{certifications}</Text>
                    </View>
                ) : null}

                {/* Bio */}
                {bio ? (
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <Ionicons name="person-outline" size={18} color={Colors.primary} />
                            <Text style={s.sectionTitle}>Sobre mí</Text>
                        </View>
                        <Text style={s.infoText}>{bio}</Text>
                    </View>
                ) : null}

                {/* Acciones rápidas */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Mi panel</Text>
                    <TouchableOpacity style={s.menuRow} onPress={() => navigation.navigate('EditProfile')}>
                        <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
                        <Text style={s.menuText}>Editar perfil</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.menuRow} onPress={() => navigation.navigate('Clients')}>
                        <Ionicons name="people-outline" size={20} color={Colors.textSecondary} />
                        <Text style={s.menuText}>Gestionar clientes</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.menuRow} onPress={() => navigation.navigate('TrainerRoutines')}>
                        <Ionicons name="barbell-outline" size={20} color={Colors.textSecondary} />
                        <Text style={s.menuText}>Mis rutinas</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <View style={s.menuRow}>
                        <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
                        <Text style={s.menuText}>Notificaciones</Text>
                        <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: Colors.primary }} />
                    </View>
                    <TouchableOpacity style={s.menuRow} onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
                        <Text style={s.menuText}>Ajustes generales</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Button
                    title="Cerrar sesión"
                    variant="outline"
                    onPress={handleLogout}
                    fullWidth
                    style={{ marginHorizontal: Spacing.base, marginBottom: Spacing['2xl'] }}
                />
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { paddingBottom: Spacing['3xl'] },
    headerBg: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing['2xl'], paddingHorizontal: Spacing.base },
    avatarWrap: { position: 'relative', marginBottom: Spacing.md },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: Colors.primary },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
    cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, borderRadius: 12, padding: 5 },
    name: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.textPrimary },
    email: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 4 },
    roleBadge: { backgroundColor: Colors.primary + '22', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.base, paddingVertical: 6, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '44' },
    roleText: { color: Colors.primary, fontWeight: '700', fontSize: FontSizes.sm },
    statsRow: { flexDirection: 'row', margin: Spacing.base, gap: Spacing.sm },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    statValue: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.primary },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginHorizontal: Spacing.base, marginBottom: Spacing.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    sectionTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    infoText: { color: Colors.textSecondary, fontSize: FontSizes.base, lineHeight: 22 },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    menuText: { flex: 1, color: Colors.textPrimary, fontSize: FontSizes.base },
});
