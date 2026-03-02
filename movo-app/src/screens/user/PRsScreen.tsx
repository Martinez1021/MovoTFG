import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

interface PR {
    id: string;
    exercise_name: string;
    weight_kg: number;
    reps: number;
    recorded_at: string;
    notes?: string;
}

// Group PRs by exercise, keeping only the best per exercise (highest weight)
function groupBest(prs: PR[]): { exercise: string; best: PR; history: PR[] }[] {
    const map: Record<string, PR[]> = {};
    for (const pr of prs) {
        if (!map[pr.exercise_name]) map[pr.exercise_name] = [];
        map[pr.exercise_name].push(pr);
    }
    return Object.entries(map).map(([exercise, history]) => {
        const sorted = [...history].sort((a, b) => b.weight_kg - a.weight_kg);
        return { exercise, best: sorted[0], history: [...history].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()) };
    }).sort((a, b) => a.exercise.localeCompare(b.exercise));
}

const SUGGESTED = ['Sentadilla', 'Press banca', 'Peso muerto', 'Press militar', 'Dominadas', 'Hip thrust', 'Remo barra', 'Curl bíceps', 'Triceps polea'];

export const PRsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuthStore();
    const { primary } = useThemeStore();
    const [prs, setPrs] = useState<PR[]>([]);
    const [loading, setLoading] = useState(true);
    const [internalId, setInternalId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    // Form
    const [exercise, setExercise] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [reps, setReps] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [showSuggested, setShowSuggested] = useState(false);

    const load = async () => {
        if (!user?.id) return;
        setLoading(true);
        const { data: uRow } = await supabase.from('users').select('id').eq('supabase_id', user.id).maybeSingle();
        if (!uRow?.id) { setLoading(false); return; }
        setInternalId(uRow.id);
        const { data } = await supabase
            .from('personal_records')
            .select('id, exercise_name, weight_kg, reps, recorded_at, notes')
            .eq('user_id', uRow.id)
            .order('recorded_at', { ascending: false });
        setPrs(data ?? []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const save = async () => {
        const kg = parseFloat(weightKg.replace(',', '.'));
        const r = parseInt(reps, 10);
        if (!exercise.trim()) { Alert.alert('Falta ejercicio', 'Escribe el nombre del ejercicio.'); return; }
        if (isNaN(kg) || kg <= 0) { Alert.alert('Peso inválido', 'Introduce un peso válido en kg.'); return; }
        if (isNaN(r) || r <= 0) { Alert.alert('Reps inválidas', 'Introduce el número de repeticiones.'); return; }
        if (!internalId) return;
        setSaving(true);
        const { error } = await supabase.from('personal_records').insert({
            user_id: internalId,
            exercise_name: exercise.trim(),
            weight_kg: kg,
            reps: r,
            notes: notes.trim() || null,
            recorded_at: new Date().toISOString(),
        });
        setSaving(false);
        if (error) { Alert.alert('Error', error.message); return; }
        setExercise('');
        setWeightKg('');
        setReps('');
        setNotes('');
        load();
    };

    const remove = (id: string) => {
        Alert.alert('Eliminar', '¿Eliminar este récord?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    await supabase.from('personal_records').delete().eq('id', id);
                    setPrs((p) => p.filter((e) => e.id !== id));
                },
            },
        ]);
    };

    const grouped = groupBest(prs);

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={s.title}>🏆 Récords personales</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* Add PR form */}
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Añadir récord</Text>
                        {/* Exercise input + suggestions */}
                        <TouchableOpacity
                            style={[s.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setShowSuggested((v) => !v)}
                            activeOpacity={0.7}
                        >
                            <TextInput
                                style={{ flex: 1, color: Colors.textPrimary, fontSize: FontSizes.sm }}
                                placeholder="Ejercicio"
                                placeholderTextColor={Colors.textSecondary}
                                value={exercise}
                                onChangeText={setExercise}
                                onFocus={() => setShowSuggested(true)}
                            />
                            <Ionicons name={showSuggested ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textSecondary} />
                        </TouchableOpacity>
                        {showSuggested && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    {SUGGESTED.map((s) => (
                                        <TouchableOpacity key={s} onPress={() => { setExercise(s); setShowSuggested(false); }}
                                            style={[sug.chip, { borderColor: primary + '55' }]}>
                                            <Text style={[sug.chipTxt, { color: primary }]}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        )}
                        <View style={s.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>Peso (kg)</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="Ej. 100"
                                    placeholderTextColor={Colors.textSecondary}
                                    keyboardType="decimal-pad"
                                    value={weightKg}
                                    onChangeText={setWeightKg}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>Repeticiones</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="Ej. 5"
                                    placeholderTextColor={Colors.textSecondary}
                                    keyboardType="number-pad"
                                    value={reps}
                                    onChangeText={setReps}
                                />
                            </View>
                        </View>
                        <TextInput
                            style={s.input}
                            placeholder="Nota (ej. con cinturón, PR nuevo)"
                            placeholderTextColor={Colors.textSecondary}
                            value={notes}
                            onChangeText={setNotes}
                            maxLength={100}
                        />
                        <TouchableOpacity
                            onPress={save}
                            disabled={saving}
                            style={[s.saveBtn, { backgroundColor: primary }]}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={s.saveBtnTxt}>💪 Guardar récord</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Records list */}
                    {loading ? (
                        <ActivityIndicator color={primary} style={{ marginTop: 30 }} />
                    ) : grouped.length === 0 ? (
                        <View style={s.empty}>
                            <Text style={{ fontSize: 40 }}>🏆</Text>
                            <Text style={s.emptyTxt}>Sin récords aún</Text>
                            <Text style={s.emptySub}>Registra tus marcas personales y sigue mejorando.</Text>
                        </View>
                    ) : (
                        grouped.map(({ exercise: ex, best, history }) => (
                            <View key={ex} style={s.prCard}>
                                <TouchableOpacity style={s.prHeader} onPress={() => setExpanded(expanded === ex ? null : ex)}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.exName}>{ex}</Text>
                                        <Text style={s.prBest}>
                                            🥇 {best.weight_kg} kg × {best.reps} reps
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                        <Text style={s.prDate}>{new Date(best.recorded_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
                                        <Ionicons name={expanded === ex ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                                {expanded === ex && (
                                    <View style={s.prHistory}>
                                        {history.map((h) => (
                                            <View key={h.id} style={s.histRow}>
                                                <Text style={s.histVal}>{h.weight_kg} kg × {h.reps} reps</Text>
                                                {h.notes ? <Text style={s.histNote}>{h.notes}</Text> : null}
                                                <Text style={s.histDate}>{new Date(h.recorded_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })}</Text>
                                                <TouchableOpacity onPress={() => remove(h.id)} style={s.delBtn}>
                                                    <Ionicons name="trash-outline" size={14} color={Colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 58, paddingBottom: Spacing.md },
    back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    title: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
    cardTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
    label: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginBottom: 4 },
    row: { flexDirection: 'row', gap: 10 },
    input: { backgroundColor: '#111', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary, fontSize: FontSizes.sm, paddingHorizontal: Spacing.md, paddingVertical: 10 },
    saveBtn: { borderRadius: BorderRadius.lg, paddingVertical: 12, alignItems: 'center' },
    saveBtnTxt: { fontWeight: '700', fontSize: FontSizes.base, color: '#fff' },
    empty: { alignItems: 'center', gap: 8, paddingTop: 40 },
    emptyTxt: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
    emptySub: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },
    prCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: 10, overflow: 'hidden' },
    prHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
    exName: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    prBest: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    prDate: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    prHistory: { borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: Spacing.md, paddingBottom: 8 },
    histRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border + '80' },
    histVal: { flex: 1, fontSize: FontSizes.sm, color: Colors.textPrimary, fontWeight: '600' },
    histNote: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    histDate: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    delBtn: { padding: 4 },
});

const sug = StyleSheet.create({
    chip: { borderRadius: BorderRadius.full, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
    chipTxt: { fontSize: FontSizes.xs, fontWeight: '700' },
});
