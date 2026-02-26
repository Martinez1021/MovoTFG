import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Switch,
    TouchableOpacity, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getNotificationsEnabled, setNotificationsEnabled, scheduleWorkoutReminder,
} from '../../services/notifications';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore, ACCENT_COLORS } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { Button } from '../../components/ui/Button';

const REMINDER_HOUR_KEY = '@movo_reminder_hour';

const HOURS = [6, 7, 8, 9, 10, 18, 19, 20, 21];

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, logout } = useAuthStore();
    const { accentIndex, primary, setAccent } = useThemeStore();

    // Notification settings
    const [notifsEnabled, setNotifsEnabled] = useState(true);
    const [reminderHour, setReminderHour] = useState(9);

    // App settings
    const [language, setLanguage] = useState<'es' | 'en'>('es');

    useEffect(() => {
        (async () => {
            setNotifsEnabled(await getNotificationsEnabled());
            const hour = await AsyncStorage.getItem(REMINDER_HOUR_KEY);
            if (hour) setReminderHour(parseInt(hour));
        })();
    }, []);

    const toggleNotifications = async (val: boolean) => {
        setNotifsEnabled(val);
        await setNotificationsEnabled(val);
        if (val) Alert.alert('✅ Notificaciones activadas', `Recibirás un recordatorio diario a las ${reminderHour}:00`);
        else Alert.alert('🔕 Notificaciones desactivadas', 'Ya no recibirás recordatorios de entrenamiento.');
    };

    const changeReminderHour = async (hour: number) => {
        setReminderHour(hour);
        await AsyncStorage.setItem(REMINDER_HOUR_KEY, String(hour));
        if (notifsEnabled) {
            await scheduleWorkoutReminder(hour, 0);
            Alert.alert('⏰ Recordatorio actualizado', `Entrenamiento programado para las ${hour}:00 cada día.`);
        }
    };

    const handleDeleteAccount = () =>
        Alert.alert(
            'Eliminar cuenta',
            '¿Estás seguro? Esta acción es irreversible y eliminará todos tus datos.\n\nNota: también deberás eliminar tu cuenta en Supabase.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar definitivamente', style: 'destructive',
                    onPress: () => {
                        Alert.alert('Contacta soporte', 'Por ahora, contacta a soporte para eliminar tu cuenta: support@movoapp.com');
                    },
                },
            ]
        );

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll}>

                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={s.title}>Ajustes</Text>
                </View>

                {/* Account info */}
                <View style={s.accountCard}>
                    <View style={s.accountAvatar}>
                        <Text style={s.accountAvatarText}>{user?.full_name?.[0] ?? 'M'}</Text>
                    </View>
                    <View>
                        <Text style={s.accountName}>{user?.full_name}</Text>
                        <Text style={s.accountEmail}>{user?.email}</Text>
                    </View>
                </View>

                {/* Notifications */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>🔔 Notificaciones</Text>

                    <View style={s.settingRow}>
                        <View style={s.settingInfo}>
                            <Text style={s.settingLabel}>Recordatorios de entrenamiento</Text>
                            <Text style={s.settingDesc}>Recibe una notificación diaria para no olvidar tu rutina</Text>
                        </View>
                        <Switch
                            value={notifsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ true: Colors.primary, false: Colors.border }}
                            thumbColor={notifsEnabled ? '#fff' : Colors.textSecondary}
                        />
                    </View>

                    {notifsEnabled && (
                        <View style={s.subsection}>
                            <Text style={s.subsectionTitle}>Hora del recordatorio</Text>
                            <View style={s.hourGrid}>
                                {HOURS.map((h) => (
                                    <TouchableOpacity key={h} style={[s.hourChip, reminderHour === h && s.hourChipActive]}
                                        onPress={() => changeReminderHour(h)}>
                                        <Text style={[s.hourText, reminderHour === h && s.hourTextActive]}>
                                            {String(h).padStart(2, '0')}:00
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Appearance - accent color picker */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>🎨 Color de acento</Text>
                    <Text style={[s.settingDesc, { marginBottom: Spacing.md }]}>Personaliza el color principal de la app</Text>
                    <View style={s.colorGrid}>
                        {ACCENT_COLORS.map((color, idx) => (
                            <TouchableOpacity key={color.name} onPress={() => setAccent(idx)} style={s.colorItem}>
                                <LinearGradient
                                    colors={color.gradient}
                                    style={[
                                        s.colorDot,
                                        accentIndex === idx && { borderWidth: 3, borderColor: '#fff' },
                                    ]}
                                />
                                <Text style={[s.colorName, accentIndex === idx && { color: primary, fontWeight: '700' }]}>
                                    {color.name}
                                </Text>
                                {accentIndex === idx && (
                                    <Ionicons name="checkmark-circle" size={14} color={primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Language */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>🌐 Idioma</Text>
                    <View style={s.chipRow}>
                        {[{ id: 'es', label: '🇪🇸 Español' }, { id: 'en', label: '🇬🇧 English' }].map((opt) => (
                            <TouchableOpacity key={opt.id}
                                style={[s.optChip, language === opt.id && s.optChipActive]}
                                onPress={() => setLanguage(opt.id as 'es' | 'en')}>
                                <Text style={[s.optChipText, language === opt.id && s.optChipTextActive]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* App info */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>ℹ️ Sobre MOVO</Text>
                    {[
                        { label: 'Versión', value: '1.0.0' },
                        { label: 'Plataforma', value: Platform.OS === 'ios' ? 'iOS' : 'Android' },
                        { label: 'Soporte', value: 'support@movoapp.com' },
                    ].map((row) => (
                        <View key={row.label} style={s.infoRow}>
                            <Text style={s.infoLabel}>{row.label}</Text>
                            <Text style={s.infoValue}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Danger zone */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: Colors.error }]}>⚠️ Zona peligrosa</Text>
                    <Button title="Eliminar mi cuenta" variant="outline"
                        onPress={handleDeleteAccount}
                        style={{ borderColor: Colors.error }}
                    />
                </View>

                <View style={{ height: Spacing['3xl'] }} />
            </ScrollView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    scroll: { paddingBottom: Spacing['3xl'] },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, paddingTop: 56, gap: Spacing.md, marginBottom: Spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    title: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.textPrimary },
    accountCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, margin: Spacing.base, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
    accountAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary },
    accountAvatarText: { color: Colors.primary, fontWeight: '800', fontSize: FontSizes.lg },
    accountName: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSizes.base },
    accountEmail: { color: Colors.textSecondary, fontSize: FontSizes.sm },
    section: { marginHorizontal: Spacing.base, marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
    settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
    settingInfo: { flex: 1 },
    settingLabel: { color: Colors.textPrimary, fontWeight: '600', fontSize: FontSizes.base, marginBottom: 2 },
    settingDesc: { color: Colors.textSecondary, fontSize: FontSizes.sm, lineHeight: 18 },
    subsection: { marginTop: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
    subsectionTitle: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600', marginBottom: Spacing.md },
    hourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    hourChip: { backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    hourChipActive: { backgroundColor: Colors.primary + '22', borderColor: Colors.primary },
    hourText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '700' },
    hourTextActive: { color: Colors.primary },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    colorItem: { alignItems: 'center', gap: 4, width: '28%' },
    colorDot: { width: 48, height: 48, borderRadius: 24 },
    colorName: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    infoLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm },
    infoValue: { color: Colors.textPrimary, fontSize: FontSizes.sm, fontWeight: '600' },
});
