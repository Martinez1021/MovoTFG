import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GoalChip } from '../../components/ui/GoalChip';
import { Colors, Spacing, FontSizes, BorderRadius, Goals, ActivityLevels } from '../../utils/constants';

interface FormData {
    full_name: string;
    weight_kg: string;
    height_cm: string;
    age: string;
    gender: 'male' | 'female' | 'prefer_not_to_say';
    activity_level: string;
}

export const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, profile, setUser, setProfile } = useAuthStore();
    const [saving, setSaving] = useState(false);
    const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url ?? null);
    const [selectedGoals, setSelectedGoals] = useState<string[]>(profile?.goals ?? []);
    const [selectedActivity, setSelectedActivity] = useState<string>(profile?.activity_level ?? '');

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            full_name: user?.full_name ?? '',
            weight_kg: profile?.weight_kg ? String(profile.weight_kg) : '',
            height_cm: profile?.height_cm ? String(profile.height_cm) : '',
            age: profile?.age ? String(profile.age) : '',
            gender: (profile?.gender as FormData['gender']) ?? 'prefer_not_to_say',
            activity_level: profile?.activity_level ?? '',
        },
    });

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería.'); return; }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as any,
            allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
        });
        if (!res.canceled && res.assets?.[0] && user) {
            const asset = res.assets[0];
            if (!asset.base64) { Alert.alert('Error', 'No se pudo leer la imagen.'); return; }
            const avatarUrl = `data:image/jpeg;base64,${asset.base64}`;
            setAvatarUri(avatarUrl);
            const { error } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
            if (error) Alert.alert('Error', 'No se pudo guardar la foto.');
            else setUser({ ...user, avatar_url: avatarUrl });
        }
    };

    const toggleGoal = (id: string) =>
        setSelectedGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);

    const onSubmit = async (data: FormData) => {
        if (!user) return;
        setSaving(true);
        try {
            // 1. Update full_name in Supabase Auth metadata
            const { error: authErr } = await supabase.auth.updateUser({
                data: { full_name: data.full_name },
            });
            if (authErr) throw authErr;

            // 2. Upsert profile data into Supabase user_profiles
            const profileData = {
                user_id: user.id,
                weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
                height_cm: data.height_cm ? parseInt(data.height_cm) : null,
                age: data.age ? parseInt(data.age) : null,
                gender: data.gender,
                activity_level: selectedActivity || null,
                goals: selectedGoals,
                preferred_types: profile?.preferred_types ?? [],
            };
            const { data: savedProfile, error: profileErr } = await supabase
                .from('user_profiles')
                .upsert(profileData, { onConflict: 'user_id' })
                .select()
                .single();
            if (profileErr) throw profileErr;

            // 3. Update store immediately so ProfileScreen reflects changes
            setUser({ ...user, full_name: data.full_name });
            if (savedProfile) setProfile(savedProfile);

            Alert.alert('¡Guardado!', 'Tu perfil se actualizó correctamente.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo guardar el perfil.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

                    {/* Header */}
                    <View style={s.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={s.title}>Editar perfil</Text>
                    </View>

                    {/* Avatar */}
                    <TouchableOpacity onPress={pickAvatar} style={s.avatarContainer}>
                        {avatarUri
                            ? <Image source={{ uri: avatarUri }} style={s.avatar} />
                            : (
                                <LinearGradient colors={Colors.gradientPrimary} style={s.avatar}>
                                    <Text style={s.avatarInitial}>{user?.full_name?.[0] ?? 'M'}</Text>
                                </LinearGradient>
                            )
                        }
                        <View style={s.cameraOverlay}>
                            <Ionicons name="camera" size={16} color="#fff" />
                            <Text style={s.cameraText}>Cambiar foto</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Basic info */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Información personal</Text>

                        <Controller control={control} name="full_name"
                            rules={{ required: 'Nombre requerido' }}
                            render={({ field: { onChange, value } }) => (
                                <Input label="Nombre completo" value={value} onChangeText={onChange}
                                    error={errors.full_name?.message} placeholder="Tu nombre"
                                    leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textSecondary} />}
                                />
                            )}
                        />

                        <View style={s.row}>
                            <View style={{ flex: 1 }}>
                                <Controller control={control} name="weight_kg"
                                    render={({ field: { onChange, value } }) => (
                                        <Input label="Peso (kg)" value={value} onChangeText={onChange}
                                            keyboardType="decimal-pad" placeholder="70"
                                            leftIcon={<Ionicons name="barbell-outline" size={18} color={Colors.textSecondary} />}
                                        />
                                    )}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Controller control={control} name="height_cm"
                                    render={({ field: { onChange, value } }) => (
                                        <Input label="Altura (cm)" value={value} onChangeText={onChange}
                                            keyboardType="numeric" placeholder="170"
                                            leftIcon={<Ionicons name="resize-outline" size={18} color={Colors.textSecondary} />}
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        <Controller control={control} name="age"
                            render={({ field: { onChange, value } }) => (
                                <Input label="Edad" value={value} onChangeText={onChange}
                                    keyboardType="numeric" placeholder="25"
                                    leftIcon={<Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />}
                                />
                            )}
                        />
                    </View>

                    {/* Gender */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Género</Text>
                        <Controller control={control} name="gender"
                            render={({ field: { onChange, value } }) => (
                                <View style={s.chipRow}>
                                    {[
                                        { id: 'male', label: '♂ Hombre' },
                                        { id: 'female', label: '♀ Mujer' },
                                        { id: 'prefer_not_to_say', label: '— Prefiero no decir' },
                                    ].map((opt) => (
                                        <TouchableOpacity key={opt.id} style={[s.chip, value === opt.id && s.chipActive]}
                                            onPress={() => onChange(opt.id)}>
                                            <Text style={[s.chipText, value === opt.id && s.chipTextActive]}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        />
                    </View>

                    {/* Activity level */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Nivel de actividad</Text>
                        <View style={s.chipRow}>
                            {ActivityLevels.map((lvl) => (
                                <TouchableOpacity key={lvl.id} style={[s.chip, selectedActivity === lvl.id && s.chipActive]}
                                    onPress={() => setSelectedActivity(lvl.id)}>
                                    <Text style={[s.chipText, selectedActivity === lvl.id && s.chipTextActive]}>{lvl.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Goals */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Mis objetivos</Text>
                        <View style={s.chipRow}>
                            {Goals.map((g) => (
                                <GoalChip key={g.id} label={`${g.emoji} ${g.label}`}
                                    selected={selectedGoals.includes(g.id)}
                                    onPress={() => toggleGoal(g.id)} />
                            ))}
                        </View>
                    </View>

                    <Button title={saving ? 'Guardando…' : 'Guardar cambios'}
                        onPress={handleSubmit(onSubmit)} loading={saving}
                        fullWidth style={{ margin: Spacing.base, marginBottom: Spacing['3xl'] }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { paddingBottom: Spacing['3xl'] },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, paddingTop: 56, gap: Spacing.md, marginBottom: Spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    title: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.textPrimary },
    avatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
    avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.primary },
    avatarInitial: { fontSize: FontSizes['4xl'], fontWeight: '900', color: '#fff' },
    cameraOverlay: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
    cameraText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
    section: { marginHorizontal: Spacing.base, marginBottom: Spacing.lg },
    sectionTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, letterSpacing: 0.3 },
    row: { flexDirection: 'row', gap: Spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: { backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    chipActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
    chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
    chipTextActive: { color: Colors.primary },
});
