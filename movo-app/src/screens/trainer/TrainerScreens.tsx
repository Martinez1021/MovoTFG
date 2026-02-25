import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { trainerApi } from '../../services/api';
import { User, UserProfile } from '../../types';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { Button } from '../../components/ui/Button';

// ─── Dashboard ────────────────────────────────────────────────────────────
export const TrainerDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [clients, setClients] = useState<User[]>([]);

    useEffect(() => { trainerApi.getMyClients().then((r) => setClients(r.data)); }, []);

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll}>
                <Text style={s.heading}>Mi Panel</Text>
                <View style={s.statsRow}>
                    <View style={s.statCard}><Text style={s.statVal}>{clients.length}</Text><Text style={s.statLbl}>Clientes</Text></View>
                    <View style={s.statCard}><Text style={[s.statVal, { color: Colors.accentYoga }]}>🏃</Text><Text style={s.statLbl}>Activos hoy</Text></View>
                </View>
                <Text style={s.sectionTitle}>Clientes recientes</Text>
                {clients.slice(0, 5).map((c) => (
                    <TouchableOpacity key={c.id} style={s.clientRow} onPress={() => navigation.navigate('ClientDetail', { clientId: c.id })}>
                        <View style={s.clientAvatar}><Text style={s.clientInitial}>{c.full_name?.[0]}</Text></View>
                        <View style={s.clientInfo}><Text style={s.clientName}>{c.full_name}</Text><Text style={s.clientEmail}>{c.email}</Text></View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </LinearGradient>
    );
};

// ─── Clients List ─────────────────────────────────────────────────────────
export const TrainerClientsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [clients, setClients] = useState<User[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => { trainerApi.getMyClients().then((r) => setClients(r.data)); }, []);

    const filtered = clients.filter((c) =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <View style={s.header}>
                <Text style={s.heading}>Mis Clientes</Text>
                <View style={s.searchBar}>
                    <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Buscar cliente..."
                        placeholderTextColor={Colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>
            <FlatList
                data={filtered}
                keyExtractor={(c) => c.id}
                contentContainerStyle={{ padding: Spacing.base }}
                renderItem={({ item: c }) => (
                    <TouchableOpacity style={s.clientCard} onPress={() => navigation.navigate('ClientDetail', { clientId: c.id })}>
                        <View style={[s.clientAvatar, { width: 52, height: 52, borderRadius: 26 }]}>
                            <Text style={[s.clientInitial, { fontSize: FontSizes.lg }]}>{c.full_name?.[0]}</Text>
                        </View>
                        <View style={s.clientInfo}>
                            <Text style={s.clientName}>{c.full_name}</Text>
                            <Text style={s.clientEmail}>{c.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={s.emptyText}>No hay clientes asignados</Text>}
            />
        </LinearGradient>
    );
};

// ─── Client Detail ─────────────────────────────────────────────────────────
export const ClientDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { clientId } = route.params;
    const [client, setClient] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        trainerApi.getClientProfile(clientId).then((r) => {
            setClient(r.data.user);
            setProfile(r.data.profile);
            setNotes(r.data.profile?.notes_from_trainer ?? '');
        });
    }, [clientId]);

    const saveNotes = async () => {
        setSaving(true);
        try {
            await trainerApi.updateClientProfile(clientId, { notes_from_trainer: notes });
            Alert.alert('Guardado', 'Notas actualizadas correctamente');
        } finally { setSaving(false); }
    };

    if (!client) return <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={s.centered}><Text style={{ color: Colors.textSecondary }}>Cargando...</Text></LinearGradient>;

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: Spacing.base }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={s.clientHero}>
                    <View style={[s.clientAvatar, { width: 72, height: 72, borderRadius: 36, marginRight: Spacing.base }]}>
                        <Text style={[s.clientInitial, { fontSize: FontSizes['2xl'] }]}>{client.full_name?.[0]}</Text>
                    </View>
                    <View>
                        <Text style={s.heading}>{client.full_name}</Text>
                        <Text style={s.clientEmail}>{client.email}</Text>
                    </View>
                </View>

                {profile && (
                    <View style={s.statsRow}>
                        {[
                            { label: 'Peso', value: profile.weight_kg ? `${profile.weight_kg}kg` : '—' },
                            { label: 'Altura', value: profile.height_cm ? `${profile.height_cm}cm` : '—' },
                            { label: 'Edad', value: profile.age ? `${profile.age}a` : '—' },
                            { label: 'Nivel', value: profile.activity_level ?? '—' },
                        ].map((st) => (
                            <View key={st.label} style={[s.statCard, { flex: 1 }]}>
                                <Text style={s.statVal}>{st.value}</Text>
                                <Text style={s.statLbl}>{st.label}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={s.noteSection}>
                    <Text style={s.sectionTitle}>Notas para el cliente</Text>
                    <TextInput
                        style={s.noteInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Escribe observaciones, indicaciones nutricionales, ajustes de rutina..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={5}
                    />
                    <Button title="Guardar notas" onPress={saveNotes} loading={saving} fullWidth style={{ marginTop: Spacing.md }} />
                </View>

                <Button title="Asignar rutina" variant="outline" onPress={() => navigation.navigate('TrainerRoutines', { assignToClientId: clientId })} fullWidth style={{ marginBottom: Spacing.sm }} />
                <Button title="Enviar mensaje" variant="ghost" onPress={() => navigation.navigate('Messages', { clientId })} fullWidth />
            </ScrollView>
        </LinearGradient>
    );
};

// ─── Shared styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
    scroll: { padding: Spacing.base, paddingTop: 56 },
    header: { padding: Spacing.base, paddingTop: 56 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    statVal: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.primary },
    statLbl: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
    clientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
    clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
    clientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary },
    clientInitial: { color: Colors.primary, fontWeight: '800', fontSize: FontSizes.base },
    clientInfo: { flex: 1 },
    clientName: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSizes.base },
    clientEmail: { color: Colors.textSecondary, fontSize: FontSizes.sm },
    clientHero: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
    searchInput: { flex: 1, color: Colors.textPrimary, paddingVertical: Spacing.md, fontSize: FontSizes.base },
    noteSection: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
    noteInput: { color: Colors.textPrimary, fontSize: FontSizes.base, minHeight: 100, textAlignVertical: 'top' },
    emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing['2xl'], fontSize: FontSizes.base },
});
