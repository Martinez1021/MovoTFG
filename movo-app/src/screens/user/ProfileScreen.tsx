import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, FontSizes, BorderRadius, Goals, ActivityLevels } from '../../utils/constants';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, profile, logout } = useAuthStore();
    const [notifications, setNotifications] = useState(true);

    const handleLogout = () => Alert.alert('Cerrar sesión', '¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout },
    ]);

    const pickAvatar = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!res.canceled && user) {
            const fd = new FormData();
            fd.append('file', { uri: res.assets[0].uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
            try { await userApi.uploadAvatar(user.id, fd); }
            catch (e) { Alert.alert('Error', 'No se pudo subir la imagen'); }
        }
    };

    const userGoals = Goals.filter((g) => (profile?.goals ?? []).includes(g.id));

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll}>
                {/* Avatar header */}
                <LinearGradient colors={['#1A0A2E', '#0A0A0A']} style={s.headerBg}>
                    <TouchableOpacity onPress={pickAvatar} style={s.avatarWrap}>
                        {user?.avatar_url
                            ? <Image source={{ uri: user.avatar_url }} style={s.avatar} />
                            : <LinearGradient colors={Colors.gradientPrimary} style={s.avatarPlaceholder}>
                                <Text style={s.avatarInitial}>{user?.full_name?.[0] ?? 'M'}</Text>
                            </LinearGradient>
                        }
                        <View style={s.cameraBtn}>
                            <Ionicons name="camera" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={s.name}>{user?.full_name}</Text>
                    <Text style={s.email}>{user?.email}</Text>
                    <View style={s.roleBadge}>
                        <Text style={s.roleText}>{user?.role === 'trainer' ? '🏋️ Entrenador' : '🏃 Usuario'}</Text>
                    </View>
                </LinearGradient>

                {/* Physical stats */}
                {profile && (
                    <View style={s.statsRow}>
                        {[
                            { label: 'Peso', value: profile.weight_kg ? `${profile.weight_kg}kg` : '—' },
                            { label: 'Altura', value: profile.height_cm ? `${profile.height_cm}cm` : '—' },
                            { label: 'Edad', value: profile.age ? `${profile.age}a` : '—' },
                        ].map((st) => (
                            <View key={st.label} style={s.statCard}>
                                <Text style={s.statValue}>{st.value}</Text>
                                <Text style={s.statLabel}>{st.label}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Goals */}
                {userGoals.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Mis objetivos</Text>
                        <View style={s.goalsRow}>
                            {userGoals.map((g) => (
                                <View key={g.id} style={s.goalChip}>
                                    <Text>{g.emoji} {g.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Trainer note */}
                {profile?.notes_from_trainer && (
                    <View style={[s.section, s.noteCard]}>
                        <Text style={s.noteTitle}>📝 Nota de tu entrenador</Text>
                        <Text style={s.noteText}>{profile.notes_from_trainer}</Text>
                    </View>
                )}

                {/* Settings */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Configuración</Text>
                    <TouchableOpacity style={s.menuRow} onPress={() => navigation.navigate('EditProfile')}>
                        <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                        <Text style={s.menuText}>Editar perfil</Text>
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

                <Button title="Cerrar sesión" variant="outline" onPress={handleLogout} fullWidth style={{ marginHorizontal: Spacing.base, marginBottom: Spacing['2xl'] }} />
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { paddingBottom: Spacing['3xl'] },
    headerBg: { alignItems: 'center', paddingVertical: Spacing['2xl'], paddingTop: 60 },
    avatarWrap: { position: 'relative', marginBottom: Spacing.base },
    avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: Colors.primary },
    avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: FontSizes['4xl'], fontWeight: '900', color: '#fff' },
    cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
    email: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
    roleBadge: { backgroundColor: Colors.primary + '33', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.base, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary },
    roleText: { color: Colors.primary, fontWeight: '700', fontSize: FontSizes.sm },
    statsRow: { flexDirection: 'row', margin: Spacing.base, gap: Spacing.sm },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    statValue: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.primary },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    section: { marginHorizontal: Spacing.base, marginBottom: Spacing.lg },
    sectionTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
    goalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    goalChip: { backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    noteCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderLeftWidth: 3, borderLeftColor: Colors.accentYoga, borderWidth: 1, borderColor: Colors.border },
    noteTitle: { fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, fontSize: FontSizes.base },
    noteText: { color: Colors.textSecondary, lineHeight: 20 },
    menuRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    menuText: { flex: 1, color: Colors.textPrimary, fontSize: FontSizes.base },
});
