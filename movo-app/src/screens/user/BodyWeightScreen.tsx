import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';

interface WeightEntry {
    id: string;
    weight_kg: number;
    recorded_at: string;
    notes?: string;
}

const CHART_W = 320;
const CHART_H = 180;
const PAD = { top: 16, right: 12, bottom: 32, left: 36 };

function buildPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) =>
        i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`, '');
}

function buildArea(points: { x: number; y: number }[], bottom: number): string {
    if (points.length === 0) return '';
    const line = buildPath(points);
    return `${line} L${points[points.length - 1].x},${bottom} L${points[0].x},${bottom} Z`;
}

export const BodyWeightScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuthStore();
    const { primary } = useThemeStore();
    const [entries, setEntries] = useState<WeightEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [internalId, setInternalId] = useState<string | null>(null);

    const load = async () => {
        if (!user?.id) return;
        setLoading(true);
        const { data: uRow } = await supabase.from('users').select('id').eq('supabase_id', user.id).maybeSingle();
        if (!uRow?.id) { setLoading(false); return; }
        setInternalId(uRow.id);
        const { data } = await supabase
            .from('body_weight')
            .select('id, weight_kg, recorded_at, notes')
            .eq('user_id', uRow.id)
            .order('recorded_at', { ascending: true })
            .limit(90);
        setEntries(data ?? []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const save = async () => {
        const kg = parseFloat(weight.replace(',', '.'));
        if (isNaN(kg) || kg < 20 || kg > 300) {
            Alert.alert('Peso inválido', 'Introduce un peso entre 20 y 300 kg.');
            return;
        }
        if (!internalId) return;
        setSaving(true);
        const { error } = await supabase.from('body_weight').insert({
            user_id: internalId,
            weight_kg: kg,
            notes: notes.trim() || null,
            recorded_at: new Date().toISOString(),
        });
        setSaving(false);
        if (error) { Alert.alert('Error', error.message); return; }
        setWeight('');
        setNotes('');
        load();
    };

    const remove = (id: string) => {
        Alert.alert('Eliminar', '¿Eliminar esta entrada?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    await supabase.from('body_weight').delete().eq('id', id);
                    setEntries((p) => p.filter((e) => e.id !== id));
                },
            },
        ]);
    };

    // ── Chart computation ────────────────────────────────────
    const chartData = entries.slice(-30); // last 30 points
    const innerW = CHART_W - PAD.left - PAD.right;
    const innerH = CHART_H - PAD.top - PAD.bottom;
    let svgPoints: { x: number; y: number }[] = [];

    let minW = 0, maxW = 0, diff = 0;
    if (chartData.length >= 1) {
        minW = Math.min(...chartData.map((e) => e.weight_kg));
        maxW = Math.max(...chartData.map((e) => e.weight_kg));
        diff = maxW - minW;
        const range = diff < 2 ? 2 : diff * 1.2;
        const adjustedMin = minW - range * 0.1;
        svgPoints = chartData.map((e, i) => ({
            x: PAD.left + (chartData.length === 1 ? innerW / 2 : (i / (chartData.length - 1)) * innerW),
            y: PAD.top + innerH - ((e.weight_kg - adjustedMin) / range) * innerH,
        }));
    }

    const latest = entries[entries.length - 1];
    const prev = entries[entries.length - 2];
    const delta = latest && prev ? (latest.weight_kg - prev.weight_kg) : null;

    const yLabels = svgPoints.length >= 1
        ? [minW - (diff < 2 ? 0.5 : diff * 0.1), (minW + maxW) / 2, maxW + (diff < 2 ? 0.5 : diff * 0.1)]
        : [60, 70, 80];

    return (
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={s.title}>⚖️ Peso corporal</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* Summary chips */}
                    {latest && (
                        <View style={s.chips}>
                            <View style={[s.chip, { borderColor: primary + '55' }]}>
                                <Text style={[s.chipVal, { color: primary }]}>{latest.weight_kg} kg</Text>
                                <Text style={s.chipLbl}>Actual</Text>
                            </View>
                            {delta !== null && (
                                <View style={[s.chip, { borderColor: (delta <= 0 ? Colors.secondary : '#f87171') + '55' }]}>
                                    <Text style={[s.chipVal, { color: delta <= 0 ? Colors.secondary : '#f87171' }]}>
                                        {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
                                    </Text>
                                    <Text style={s.chipLbl}>Vs anterior</Text>
                                </View>
                            )}
                            <View style={[s.chip, { borderColor: Colors.accentYoga + '55' }]}>
                                <Text style={[s.chipVal, { color: Colors.accentYoga }]}>{entries.length}</Text>
                                <Text style={s.chipLbl}>Registros</Text>
                            </View>
                        </View>
                    )}

                    {/* Chart */}
                    <View style={s.chartCard}>
                        <Text style={s.chartTitle}>Últimos 30 registros</Text>
                        {loading ? (
                            <ActivityIndicator color={primary} style={{ marginTop: 20 }} />
                        ) : svgPoints.length < 2 ? (
                            <View style={s.chartEmpty}>
                                <Text style={{ fontSize: 32 }}>📊</Text>
                                <Text style={s.chartEmptyTxt}>Añade al menos 2 registros para ver la gráfica</Text>
                            </View>
                        ) : (
                            <Svg width={CHART_W} height={CHART_H} style={{ marginTop: 8 }}>
                                {/* Grid lines */}
                                {[0.25, 0.5, 0.75, 1].map((frac) => (
                                    <Line
                                        key={frac}
                                        x1={PAD.left} y1={PAD.top + innerH * frac}
                                        x2={PAD.left + innerW} y2={PAD.top + innerH * frac}
                                        stroke={Colors.border} strokeWidth={1} strokeDasharray="4,4"
                                    />
                                ))}
                                {/* Y labels */}
                                {yLabels.map((v, i) => (
                                    <SvgText
                                        key={i}
                                        x={PAD.left - 4}
                                        y={PAD.top + innerH - (i / 2) * innerH + 4}
                                        fontSize="9" fill={Colors.textSecondary} textAnchor="end"
                                    >
                                        {v.toFixed(0)}
                                    </SvgText>
                                ))}
                                {/* Area fill */}
                                <Path
                                    d={buildArea(svgPoints, PAD.top + innerH)}
                                    fill={primary + '22'}
                                />
                                {/* Line */}
                                <Path
                                    d={buildPath(svgPoints)}
                                    stroke={primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
                                />
                                {/* Dots */}
                                {svgPoints.map((p, i) => (
                                    <Circle key={i} cx={p.x} cy={p.y} r={3} fill={primary} />
                                ))}
                                {/* Latest dot highlighted */}
                                {svgPoints.length > 0 && (
                                    <Circle cx={svgPoints[svgPoints.length - 1].x} cy={svgPoints[svgPoints.length - 1].y} r={5} fill={primary} stroke="#fff" strokeWidth={1.5} />
                                )}
                                {/* X axis dates */}
                                {[0, Math.floor((chartData.length - 1) / 2), chartData.length - 1]
                                    .filter((i) => i >= 0 && i < chartData.length)
                                    .map((i) => (
                                        <SvgText
                                            key={i}
                                            x={svgPoints[i]?.x ?? 0}
                                            y={CHART_H - 4}
                                            fontSize="8" fill={Colors.textSecondary} textAnchor="middle"
                                        >
                                            {new Date(chartData[i].recorded_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </SvgText>
                                    ))
                                }
                            </Svg>
                        )}
                    </View>

                    {/* Add entry */}
                    <View style={s.addCard}>
                        <Text style={s.addTitle}>Registrar peso</Text>
                        <View style={s.row}>
                            <TextInput
                                style={[s.inputWt, { borderColor: primary + '55' }]}
                                placeholder="Ej. 75.5"
                                placeholderTextColor={Colors.textSecondary}
                                keyboardType="decimal-pad"
                                value={weight}
                                onChangeText={setWeight}
                            />
                            <Text style={s.unit}>kg</Text>
                        </View>
                        <TextInput
                            style={s.inputNotes}
                            placeholder="Nota opcional (ej. en ayunas)"
                            placeholderTextColor={Colors.textSecondary}
                            value={notes}
                            onChangeText={setNotes}
                            maxLength={100}
                        />
                        <TouchableOpacity
                            onPress={save}
                            disabled={!weight.trim() || saving}
                            style={[s.saveBtn, { backgroundColor: weight.trim() ? primary : Colors.surface }]}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={[s.saveBtnTxt, { color: weight.trim() ? '#fff' : Colors.textSecondary }]}>Guardar registro</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* History */}
                    {entries.length > 0 && (
                        <View style={s.histCard}>
                            <Text style={s.addTitle}>Historial</Text>
                            {[...entries].reverse().slice(0, 20).map((e) => (
                                <View key={e.id} style={s.histRow}>
                                    <View style={[s.histDot, { backgroundColor: primary }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.histKg}>{e.weight_kg} kg</Text>
                                        {e.notes ? <Text style={s.histNote}>{e.notes}</Text> : null}
                                    </View>
                                    <Text style={s.histDate}>
                                        {new Date(e.recorded_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </Text>
                                    <TouchableOpacity onPress={() => remove(e.id)} style={s.delBtn}>
                                        <Ionicons name="trash-outline" size={14} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
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
    chips: { flexDirection: 'row', gap: 10, marginVertical: Spacing.md },
    chip: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center', padding: Spacing.sm },
    chipVal: { fontSize: FontSizes.lg, fontWeight: '800' },
    chipLbl: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    chartCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md, alignItems: 'center' },
    chartTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary, alignSelf: 'flex-start' },
    chartEmpty: { alignItems: 'center', gap: 8, paddingVertical: 30 },
    chartEmptyTxt: { color: Colors.textSecondary, fontSize: FontSizes.sm, textAlign: 'center' },
    addCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
    addTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inputWt: { flex: 1, backgroundColor: '#111', borderRadius: BorderRadius.md, borderWidth: 1, color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: '700', paddingHorizontal: Spacing.md, paddingVertical: 10, textAlign: 'center' },
    unit: { fontSize: FontSizes.lg, color: Colors.textSecondary, fontWeight: '700' },
    inputNotes: { backgroundColor: '#111', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary, fontSize: FontSizes.sm, paddingHorizontal: Spacing.md, paddingVertical: 10 },
    saveBtn: { borderRadius: BorderRadius.lg, paddingVertical: 12, alignItems: 'center' },
    saveBtnTxt: { fontWeight: '700', fontSize: FontSizes.base },
    histCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: 2 },
    histRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
    histDot: { width: 8, height: 8, borderRadius: 4 },
    histKg: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    histNote: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    histDate: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    delBtn: { padding: 4 },
});
