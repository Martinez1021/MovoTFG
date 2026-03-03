import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator, Alert, Dimensions, FlatList, Image,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTrainerStore, ClientSession } from '../../store/trainerStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../services/supabase';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { Button } from '../../components/ui/Button';

const W = Dimensions.get('window').width;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const tAgo = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return 'Hoy';
    if (d === 1) return 'Ayer';
    return `Hace ${d} días`;
};

// ─── ClientAvatar ─────────────────────────────────────────────────────────────
const ClientAvatar: React.FC<{ name: string; url?: string | null; size?: number; primary: string }> = ({ name, url, size = 44, primary }) => {
    if (url) {
        return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: primary + '55' }} />;
    }
    return (
        <LinearGradient colors={[primary, primary + '88']} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: Math.round(size * 0.38) }}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
        </LinearGradient>
    );
};

// ─── Mini bar chart ───────────────────────────────────────────────────────────
const MiniBarChart: React.FC<{ sessions: ClientSession[]; primary: string }> = ({ sessions, primary }) => {
    const bars = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().slice(0, 10);
            const count = sessions.filter((s) => s.started_at?.slice(0, 10) === dateStr).length;
            const label = d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
            return { label, count };
        });
    }, [sessions]);
    const maxCount = Math.max(...bars.map((b) => b.count), 1);
    const chartH = 52;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: chartH + 22 }}>
            {bars.map((b, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <View style={{
                        width: '100%', borderRadius: 4,
                        height: Math.max(4, Math.round((b.count / maxCount) * chartH)),
                        backgroundColor: b.count > 0 ? primary : Colors.surface,
                        borderWidth: b.count > 0 ? 0 : 1, borderColor: Colors.border,
                    }} />
                    <Text style={{ fontSize: 8, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' }}>{b.label}</Text>
                </View>
            ))}
        </View>
    );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const TrainerDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { clients, pendingRequests, isLoading, fetchClients, fetchPendingRequests, acceptRequest, rejectRequest } = useTrainerStore();
    const { user } = useAuthStore();
    const { primary } = useThemeStore();
    const [trainerCode, setTrainerCode] = useState('——');

    useEffect(() => {
        fetchClients();
        fetchPendingRequests();
        // Use Supabase auth UUID for trainer code (user.id may be overwritten with internal DB UUID after backend sync)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) {
                setTrainerCode(session.user.id.slice(0, 8).toUpperCase());
            }
        });
    }, []);

    const handleAccept = (reqId: string, clientId: string) => {
        Alert.alert('Aceptar cliente', '¿Añadir este cliente a tu lista?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Aceptar', onPress: () => acceptRequest(reqId, clientId) },
        ]);
    };

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient colors={[primary + '33', '#0A0A0A']} style={s.dashHeader}>
                    <ClientAvatar name={user?.full_name ?? 'T'} url={user?.avatar_url} size={54} primary={primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={s.dashHello}>Hola, {user?.full_name?.split(' ')[0]} 👋</Text>
                        <Text style={s.dashRole}>Entrenador Personal</Text>
                    </View>
                    <View style={[s.codeBox, { borderColor: primary + '44' }]}>
                        <Text style={s.codeLabel}>TU CÓDIGO</Text>
                        <Text style={[s.codeVal, { color: primary }]}>{trainerCode}</Text>
                    </View>
                </LinearGradient>

                {/* Stats */}
                <View style={s.statsRow}>
                    {[
                        { icon: 'people', val: String(clients.length), label: 'Clientes' },
                        { icon: 'notifications', val: String(pendingRequests.length), label: 'Solicitudes' },
                        { icon: 'barbell', val: String(clients.length * 30), label: 'Sesiones' },
                    ].map((st) => (
                        <View key={st.label} style={s.statCard}>
                            <Ionicons name={st.icon as any} size={18} color={primary} />
                            <Text style={[s.statVal, { color: primary }]}>{st.val}</Text>
                            <Text style={s.statLbl}>{st.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Pending requests */}
                {pendingRequests.length > 0 && (
                    <View style={[s.section, { borderColor: '#FF980044' }]}>
                        <View style={s.sectionHeader}>
                            <Ionicons name="person-add" size={16} color="#FF9800" />
                            <Text style={s.sectionTitle}>Solicitudes pendientes</Text>
                            <View style={[s.badge, { backgroundColor: '#FF9800' }]}>
                                <Text style={s.badgeTxt}>{pendingRequests.length}</Text>
                            </View>
                        </View>
                        {pendingRequests.map((req) => (
                            <View key={req.id} style={s.reqRow}>
                                <ClientAvatar name={(req.client as any)?.full_name ?? '?'} url={(req.client as any)?.avatar_url} size={40} primary={primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.clientName}>{(req.client as any)?.full_name ?? 'Usuario'}</Text>
                                    <Text style={s.clientEmail}>{(req.client as any)?.email}</Text>
                                </View>
                                <TouchableOpacity style={[s.reqBtn, { backgroundColor: '#22c55e22', borderColor: '#22c55e55' }]} onPress={() => handleAccept(req.id, req.client_id)}>
                                    <Ionicons name="checkmark" size={16} color="#22c55e" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.reqBtn, { backgroundColor: '#ef444422', borderColor: '#ef444455' }]} onPress={() => rejectRequest(req.id)}>
                                    <Ionicons name="close" size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Recent clients */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Ionicons name="people-outline" size={16} color={primary} />
                        <Text style={s.sectionTitle}>Clientes recientes</Text>
                        {clients.length > 5 && (
                            <TouchableOpacity onPress={() => navigation.navigate('Clients')}>
                                <Text style={[s.seeAll, { color: primary }]}>Ver todos</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {isLoading ? (
                        <ActivityIndicator color={primary} style={{ paddingVertical: Spacing.lg }} />
                    ) : clients.length === 0 ? (
                        <View style={s.emptyBox}>
                            <Text style={s.emptyTxt}>Sin clientes aún.</Text>
                            <Text style={s.emptySub}>Comparte tu código{' '}
                                <Text style={{ color: primary, fontWeight: '700' }}>{trainerCode}</Text>{' '}
                                para que se unan.</Text>
                        </View>
                    ) : (
                        clients.slice(0, 5).map((c, i) => (
                            <TouchableOpacity key={c.id} style={[s.clientRow, i === Math.min(clients.length, 5) - 1 && { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('ClientDetail', { clientId: c.id })} activeOpacity={0.75}>
                                <ClientAvatar name={c.full_name} url={c.avatar_url} size={44} primary={primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.clientName}>{c.full_name}</Text>
                                    <Text style={s.clientEmail}>{c.email}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Quick actions */}
                <View style={s.quickRow}>
                    {[
                        { icon: 'people-outline', label: 'Clientes', screen: 'Clients' },
                        { icon: 'chatbubbles-outline', label: 'Mensajes', screen: 'Messages' },
                        { icon: 'barbell-outline', label: 'Rutinas', screen: 'TrainerRoutines' },
                    ].map((q) => (
                        <TouchableOpacity key={q.label} style={[s.quickBtn, { borderColor: primary + '44' }]} onPress={() => navigation.navigate(q.screen)}>
                            <Ionicons name={q.icon as any} size={22} color={primary} />
                            <Text style={[s.quickTxt, { color: primary }]}>{q.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

// ─── Clients List ─────────────────────────────────────────────────────────────
export const TrainerClientsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { clients, isLoading, fetchClients, removeClient } = useTrainerStore();
    const { primary } = useThemeStore();
    const [search, setSearch] = useState('');

    useEffect(() => { fetchClients(); }, []);

    const filtered = useMemo(() =>
        clients.filter((c) =>
            c.full_name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase())
        ), [clients, search]);

    const handleRemove = (c: typeof clients[0]) => {
        Alert.alert('Eliminar cliente', `¿Quitar a ${c.full_name} de tu lista?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => removeClient(c.id) },
        ]);
    };

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <View style={s.header}>
                <Text style={s.heading}>Mis Clientes</Text>
                <View style={[s.searchBar, { borderColor: Colors.border }]}>
                    <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={s.searchInput}
                        placeholder="Buscar cliente..."
                        placeholderTextColor={Colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {isLoading ? (
                <ActivityIndicator color={primary} style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(c) => c.id}
                    contentContainerStyle={{ padding: Spacing.base, paddingBottom: 40 }}
                    renderItem={({ item: c }) => (
                        <TouchableOpacity style={s.clientCard} onPress={() => navigation.navigate('ClientDetail', { clientId: c.id })} activeOpacity={0.75}>
                            <ClientAvatar name={c.full_name} url={c.avatar_url} size={52} primary={primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={s.clientName}>{c.full_name}</Text>
                                <Text style={s.clientEmail}>{c.email}</Text>
                                <Text style={[{ fontSize: FontSizes.xs, marginTop: 3, color: primary, fontWeight: '600' }]}>
                                    Desde {new Date(c.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => handleRemove(c)} style={{ padding: 6 }}>
                                <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={s.emptyBox}>
                            <Ionicons name="people-outline" size={48} color={Colors.textSecondary} />
                            <Text style={s.emptyTxt}>{search ? 'Sin resultados' : 'Sin clientes aún'}</Text>
                        </View>
                    }
                />
            )}
        </LinearGradient>
    );
};

// ─── Client Detail ─────────────────────────────────────────────────────────────
export const ClientDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { clientId } = route.params;
    const { clients, fetchClientProfile, updateNotes } = useTrainerStore();
    const { primary } = useThemeStore();

    const client = clients.find((c) => c.id === clientId);
    const [profile, setProfile] = useState<any>(null);
    const [sessions, setSessions] = useState<ClientSession[]>([]);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClientProfile(clientId).then(({ profile: p, sessions: ss }) => {
            setProfile(p);
            setSessions(ss);
            setNotes(p?.notes_from_trainer ?? '');
            setLoading(false);
        });
    }, [clientId]);

    const saveNotes = async () => {
        setSaving(true);
        try {
            await updateNotes(clientId, notes);
            Alert.alert('✅ Guardado', 'Notas actualizadas');
        } catch {
            Alert.alert('Error', 'No se pudieron guardar las notas');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !client) {
        return (
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={s.centered}>
                <ActivityIndicator color={primary} size="large" />
            </LinearGradient>
        );
    }

    const totalMin = sessions.reduce((a, s) => a + (s.duration_minutes ?? 0), 0);
    const ratedSessions = sessions.filter((s) => s.rating);
    const avgRating = ratedSessions.length
        ? (ratedSessions.reduce((a, s) => a + (s.rating ?? 0), 0) / ratedSessions.length).toFixed(1)
        : '—';

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Back */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>

                {/* Hero */}
                <LinearGradient colors={[primary + '22', 'transparent']} style={s.detailHero}>
                    <ClientAvatar name={client.full_name} url={client.avatar_url} size={80} primary={primary} />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <Text style={s.detailName}>{client.full_name}</Text>
                        <Text style={s.detailEmail}>{client.email}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                            {profile?.activity_level && (
                                <View style={[s.pill, { backgroundColor: primary + '22', borderColor: primary + '44' }]}>
                                    <Text style={{ color: primary, fontSize: 10, fontWeight: '700' }}>{profile.activity_level}</Text>
                                </View>
                            )}
                            {profile?.gender && (
                                <View style={[s.pill, { backgroundColor: '#ffffff11', borderColor: '#ffffff22' }]}>
                                    <Text style={{ color: Colors.textSecondary, fontSize: 10, fontWeight: '600' }}>{profile.gender}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </LinearGradient>

                {/* Body stats */}
                <View style={s.statsRow}>
                    {[
                        { lbl: 'Peso', val: profile?.weight_kg ? `${profile.weight_kg}kg` : '—' },
                        { lbl: 'Altura', val: profile?.height_cm ? `${profile.height_cm}cm` : '—' },
                        { lbl: 'Edad', val: profile?.age ? `${profile.age}a` : '—' },
                        { lbl: 'Sesiones', val: String(sessions.length) },
                    ].map((st) => (
                        <View key={st.lbl} style={[s.statCard, { flex: 1 }]}>
                            <Text style={[s.statVal, { color: primary }]}>{st.val}</Text>
                            <Text style={s.statLbl}>{st.lbl}</Text>
                        </View>
                    ))}
                </View>

                {/* Activity chart */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Ionicons name="stats-chart-outline" size={16} color={primary} />
                        <Text style={s.sectionTitle}>Actividad (últimos 7 días)</Text>
                    </View>
                    <MiniBarChart sessions={sessions} primary={primary} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md }}>
                        <Text style={s.summaryTxt}>Total: <Text style={{ color: primary, fontWeight: '700' }}>{totalMin} min</Text></Text>
                        <Text style={s.summaryTxt}>Valoración: <Text style={{ color: primary, fontWeight: '700' }}>⭐ {avgRating}</Text></Text>
                    </View>
                </View>

                {/* Recent sessions */}
                {sessions.length > 0 && (
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <Ionicons name="time-outline" size={16} color={primary} />
                            <Text style={s.sectionTitle}>Últimas sesiones</Text>
                        </View>
                        {sessions.slice(0, 5).map((sess, i) => {
                            const isYoga = sess.routineCategory === 'yoga';
                            const isPilates = sess.routineCategory === 'pilates';
                            const accent = isYoga ? '#A855F7' : isPilates ? '#06B6D4' : primary;
                            const iconN = isYoga ? 'leaf-outline' : isPilates ? 'body-outline' : 'barbell-outline';
                            return (
                                <View key={sess.id} style={[s.sessRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
                                    <View style={[s.sessIcon, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
                                        <Ionicons name={iconN as any} size={16} color={accent} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.sessName} numberOfLines={1}>{sess.routineName}</Text>
                                        <Text style={s.sessMeta}>{tAgo(sess.started_at)} · {sess.duration_minutes} min{sess.rating ? ` · ${'⭐'.repeat(sess.rating)}` : ''}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Goals */}
                {profile?.goals?.length > 0 && (
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <Ionicons name="flag-outline" size={16} color={primary} />
                            <Text style={s.sectionTitle}>Objetivos</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {(profile.goals as string[]).map((g) => (
                                <View key={g} style={[s.pill, { backgroundColor: primary + '22', borderColor: primary + '44' }]}>
                                    <Text style={{ color: primary, fontSize: 12, fontWeight: '600' }}>{g}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Notes */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Ionicons name="create-outline" size={16} color={primary} />
                        <Text style={s.sectionTitle}>Notas para el cliente</Text>
                    </View>
                    <TextInput
                        style={s.noteInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Observaciones, indicaciones nutricionales, ajustes..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={5}
                    />
                    <Button title="Guardar notas" onPress={saveNotes} loading={saving} fullWidth style={{ marginTop: Spacing.md }} />
                </View>

                {/* Actions */}
                <View style={{ paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['2xl'] }}>
                    <Button title="💬 Enviar mensaje" onPress={() => navigation.navigate('Messages', { clientId })} fullWidth />
                    <Button title="Asignar rutina" variant="outline" onPress={() => navigation.navigate('TrainerRoutines', { assignToClientId: clientId })} fullWidth />
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    scroll: { paddingBottom: Spacing['3xl'], paddingTop: 0 },
    header: { paddingHorizontal: Spacing.base, paddingTop: 56, paddingBottom: Spacing.sm },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    dashHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base, paddingTop: 60, paddingBottom: Spacing.xl },
    dashHello: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary },
    dashRole: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    codeBox: { backgroundColor: '#ffffff0a', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1 },
    codeLabel: { fontSize: 7, color: Colors.textSecondary, fontWeight: '700', marginBottom: 2, letterSpacing: 1.5 },
    codeVal: { fontSize: FontSizes.sm, fontWeight: '900', letterSpacing: 2 },
    statsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 3 },
    statVal: { fontSize: FontSizes.xl, fontWeight: '900' },
    statLbl: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    section: { marginHorizontal: Spacing.base, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    sectionTitle: { flex: 1, fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    seeAll: { fontSize: FontSizes.sm, fontWeight: '600' },
    badge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    badgeTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },
    reqRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    reqBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    clientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border + '55' },
    clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
    clientName: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    clientEmail: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    emptyBox: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
    emptyTxt: { fontSize: FontSizes.base, color: Colors.textSecondary, fontWeight: '600' },
    emptySub: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.base },
    quickRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.lg },
    quickBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 6, borderWidth: 1 },
    quickTxt: { fontSize: FontSizes.xs, fontWeight: '700' },
    heading: { fontSize: FontSizes['2xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, borderWidth: 1, gap: Spacing.sm },
    searchInput: { flex: 1, color: Colors.textPrimary, paddingVertical: Spacing.md, fontSize: FontSizes.base },
    backBtn: { marginTop: 56, marginLeft: Spacing.base, marginBottom: Spacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    detailHero: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.md },
    detailName: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.textPrimary },
    detailEmail: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    pill: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
    summaryTxt: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    sessRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10 },
    sessIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    sessName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
    sessMeta: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    noteInput: { color: Colors.textPrimary, fontSize: FontSizes.base, minHeight: 100, textAlignVertical: 'top', paddingTop: 0 },
});
