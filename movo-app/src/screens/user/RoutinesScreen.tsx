import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Image, Alert, Modal, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../store/routineStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../utils/constants';
import { Routine } from '../../types';
import { CATALOGUE, GOAL_TAGS, GOAL_LABEL } from '../../utils/catalogue';
import { supabase } from '../../services/supabase';

// ─────────────────────────────────────────────────────────────────────────────
//  "HAZ TU RUTINA"  —  grupos musculares + ejercicios
// ─────────────────────────────────────────────────────────────────────────────
const eImg = (id: string) => `https://images.unsplash.com/photo-${id}?w=200&q=70`;
// Photo pool
const P = {
    bench:    eImg('1534438327276-14e5300c3a48'),
    pushup:   eImg('1598971639058-fab3c3109a00'),
    fly:      eImg('1571019613454-1cb2f99b2d8b'),
    dips:     eImg('1598971639058-fab3c3109a00'),
    plank:    eImg('1566241440091-ec10de8db2e1'),
    crunch:   eImg('1518611012118-696072aa579a'),
    climbers: eImg('1593810450967-f9c42742e326'),
    squat:    eImg('1574680096145-d05b474e2155'),
    deadlift: eImg('1517963879433-6ad2b056d712'),
    glute:    eImg('1518310383802-640c2de311b2'),
    lunge:    eImg('1574680178181-b4b675eac1b4'),
    pullup:   eImg('1583454110551-21f2fa2afe61'),
    row:      eImg('1583454110551-21f2fa2afe61'),
    shoulder: eImg('1571019614242-c5c5dee9f50b'),
    bicep:    eImg('1581009137042-c552e485697a'),
    tricep:   eImg('1530822847156-5df684ec5933'),
    cardio:   eImg('1552674605-db6ffd4facb5'),
    jump:     eImg('1552674605-db6ffd4facb5'),
    cable:    eImg('1534438327276-14e5300c3a48'),
    legpress: eImg('1574680178181-b4b675eac1b4'),
};

type QuickExercise = { name: string; sets: number; reps: string; tip?: string; image: string };
type QuickGroup    = { id: string; label: string; image: string; gradient: [string, string]; exercises: QuickExercise[] };

const QUICK_GROUPS: QuickGroup[] = [
    {
        id: 'pecho', label: 'Pecho',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=75',
        gradient: ['#FF6B6B', '#FF8E53'],
        exercises: [
            { name: 'Press de banca', sets: 4, reps: '10', tip: 'Codos a 45°, no rebotar la barra.', image: P.bench },
            { name: 'Press inclinado con barra', sets: 3, reps: '12', tip: 'Ángulo 30-45°, controla la bajada.', image: P.bench },
            { name: 'Press declinado con barra', sets: 3, reps: '12', tip: 'Agarre algo más cerrado que en press plano.', image: P.bench },
            { name: 'Press con mancuernas', sets: 3, reps: '12', tip: 'Rango completo, palmas al frente.', image: P.bench },
            { name: 'Aperturas con mancuernas', sets: 3, reps: '15', tip: 'Ligera flexión de codo, no bajar demasiado.', image: P.fly },
            { name: 'Press en máquina de pecho', sets: 3, reps: '15', tip: 'Ajusta el asiento a nivel de pecho.', image: P.cable },
            { name: 'Aperturas en polea cruzada', sets: 3, reps: '15', tip: 'Movimiento de abrazo, espeja el pecho.', image: P.cable },
            { name: 'Pullover con mancuerna', sets: 3, reps: '12', tip: 'Mantén los codos ligeramente flexionados.', image: P.fly },
            { name: 'Fondos en paralelas (pecho)', sets: 3, reps: '12', tip: 'Inclínate hacia delante para enfatizar el pecho.', image: P.dips },
            { name: 'Flexiones estándar', sets: 3, reps: '20', tip: 'Cuerpo recto como una tabla.', image: P.pushup },
            { name: 'Flexiones diamante', sets: 3, reps: '15', tip: 'Manos juntas en diamante, tríceps activos.', image: P.pushup },
            { name: 'Flexiones inclinadas (pies elevados)', sets: 3, reps: '15', tip: 'Enfatiza la parte alta del pecho.', image: P.pushup },
        ],
    },
    {
        id: 'core', label: 'Core',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=75',
        gradient: ['#F7971E', '#FFD200'],
        exercises: [
            { name: 'Plancha frontal', sets: 3, reps: '45 seg', tip: 'Glúteos activos, no subas las caderas.', image: P.plank },
            { name: 'Crunch abdominal', sets: 4, reps: '20', tip: 'Sube solo los hombros, no el cuello.', image: P.crunch },
            { name: 'Crunch inverso', sets: 3, reps: '15', tip: 'Controla la bajada de las piernas.', image: P.crunch },
            { name: 'Mountain climbers', sets: 3, reps: '30', tip: 'Ritmo rápido, cadera paralela al suelo.', image: P.climbers },
            { name: 'Bicycle crunches', sets: 3, reps: '20', tip: 'Rota el torso, no el cuello.', image: P.crunch },
            { name: 'Russian twists', sets: 3, reps: '20', tip: 'Piernas elevadas para mayor dificultad.', image: P.crunch },
            { name: 'Plancha lateral', sets: 3, reps: '30 seg', tip: 'Cadera alta, oblicuos en tensión.', image: P.plank },
            { name: 'Hollow body hold', sets: 3, reps: '30 seg', tip: 'Espalda baja pegada al suelo.', image: P.crunch },
            { name: 'Leg raises', sets: 3, reps: '15', tip: 'Piernas rectas, no rebotes al bajar.', image: P.crunch },
            { name: 'Dead bug', sets: 3, reps: '12', tip: 'Baja brazo y pierna opuestos al mismo tiempo.', image: P.plank },
            { name: 'Ab rollout (rueda)', sets: 3, reps: '10', tip: 'Core tenso, no hundas la espalda.', image: P.climbers },
            { name: 'Dragon flag', sets: 3, reps: '8', tip: 'Ejercicio avanzado, baja lentamente.', image: P.crunch },
        ],
    },
    {
        id: 'piernas', label: 'Piernas',
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=75',
        gradient: ['#43E97B', '#38F9D7'],
        exercises: [
            { name: 'Sentadilla con barra', sets: 4, reps: '10', tip: 'Rodillas alineadas con los pies.', image: P.squat },
            { name: 'Prensa de piernas', sets: 3, reps: '12', tip: 'No bloquees las rodillas en extensión.', image: P.legpress },
            { name: 'Zancadas (lunges)', sets: 3, reps: '12 por pierna', tip: 'Rodilla delantera no pasa la punta del pie.', image: P.lunge },
            { name: 'Peso muerto rumano', sets: 3, reps: '10', tip: 'Espalda recta, bisagra de cadera.', image: P.deadlift },
            { name: 'Hip thrust con barra', sets: 4, reps: '12', tip: 'Squeeze de glúteo arriba del todo.', image: P.glute },
            { name: 'Extensión de cuádriceps', sets: 3, reps: '15', tip: 'Extensión completa, contracción en el tope.', image: P.legpress },
            { name: 'Curl de isquiotibiales', sets: 3, reps: '12', tip: 'Controlado en bajada.', image: P.deadlift },
            { name: 'Sentadilla búlgara', sets: 3, reps: '10 por pierna', tip: 'Pie trasero elevado, tronco erguido.', image: P.squat },
            { name: 'Step-ups con mancuernas', sets: 3, reps: '12 por pierna', tip: 'Empuja con el talón del pie de apoyo.', image: P.lunge },
            { name: 'Calf raises de pie', sets: 4, reps: '20', tip: 'Pausa en la parte alta.', image: P.squat },
            { name: 'Goblet squat', sets: 3, reps: '15', tip: 'Mancuerna sujeta en el pecho, talones en el suelo.', image: P.squat },
            { name: 'Box jumps', sets: 3, reps: '10', tip: 'Aterriza suavemente con las rodillas flexionadas.', image: P.jump },
        ],
    },
    {
        id: 'espalda', label: 'Espalda',
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=75',
        gradient: ['#4776E6', '#8E54E9'],
        exercises: [
            { name: 'Dominadas (pull-ups)', sets: 3, reps: '8', tip: 'Agarre prono, activa los dorsales desde abajo.', image: P.pullup },
            { name: 'Remo con barra', sets: 4, reps: '10', tip: 'Espalda paralela al suelo, codos pegados.', image: P.row },
            { name: 'Jalón al pecho en polea', sets: 3, reps: '12', tip: 'Tira hacia el pecho, no hacia atrás.', image: P.pullup },
            { name: 'Remo con mancuerna', sets: 3, reps: '12 por lado', tip: 'Apoyo con rodilla, codo junto al cuerpo.', image: P.row },
            { name: 'Face pulls en polea', sets: 3, reps: '15', tip: 'Codos altos, manos a las orejas.', image: P.cable },
            { name: 'Remo sentado en polea baja', sets: 3, reps: '12', tip: 'Pecho erguido, no balancees el torso.', image: P.cable },
            { name: 'Pull-over en polea', sets: 3, reps: '12', tip: 'Brazos casi rectos, arco amplio.', image: P.pullup },
            { name: 'Encogimientos con barra (traps)', sets: 3, reps: '15', tip: 'Sube recto, no hagas círculos.', image: P.row },
            { name: 'Hiperextensiones', sets: 3, reps: '15', tip: 'No hiperextiendas la zona lumbar.', image: P.deadlift },
            { name: 'Band pull-aparts', sets: 3, reps: '20', tip: 'Goma a la altura del pecho, brazos extendidos.', image: P.row },
        ],
    },
    {
        id: 'hombros', label: 'Hombros',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=75',
        gradient: ['#FC5C7D', '#6A3093'],
        exercises: [
            { name: 'Press militar con barra', sets: 4, reps: '10', tip: 'De pie o sentado, core activo.', image: P.shoulder },
            { name: 'Press Arnold', sets: 3, reps: '12', tip: 'Gira las palmas durante la subida.', image: P.shoulder },
            { name: 'Elevaciones laterales', sets: 3, reps: '15', tip: 'Codos ligeramente flexionados, no por encima de los hombros.', image: P.shoulder },
            { name: 'Elevaciones frontales', sets: 3, reps: '15', tip: 'Alterna brazos o hazlas juntas.', image: P.shoulder },
            { name: 'Face pulls deltoides posterior', sets: 3, reps: '15', tip: 'Codos altos.', image: P.cable },
            { name: 'Press con mancuernas sentado', sets: 3, reps: '12', tip: 'No bloquees los codos arriba.', image: P.shoulder },
            { name: 'Encogimientos de hombros (shrugs)', sets: 3, reps: '15', tip: 'Sube directo, sin girar.', image: P.shoulder },
            { name: 'Vuelos en decúbito prono', sets: 3, reps: '12', tip: 'Trabajo del deltoides posterior.', image: P.shoulder },
            { name: 'Rotación externa con banda', sets: 3, reps: '15 por lado', tip: 'Codo pegado al costado.', image: P.cable },
        ],
    },
    {
        id: 'biceps', label: 'Bíceps',
        image: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&q=75',
        gradient: ['#3CA55C', '#B5AC49'],
        exercises: [
            { name: 'Curl con barra', sets: 4, reps: '12', tip: 'Codos pegados al cuerpo, sin balanceo.', image: P.bicep },
            { name: 'Curl con mancuernas alterno', sets: 3, reps: '12 por brazo', tip: 'Supina la muñeca al subir.', image: P.bicep },
            { name: 'Curl martillo', sets: 3, reps: '12', tip: 'Agarre neutro, trabaja el braquial.', image: P.bicep },
            { name: 'Curl en polea baja', sets: 3, reps: '15', tip: 'Tensión constante en todo el recorrido.', image: P.cable },
            { name: 'Curl concentrado', sets: 3, reps: '12 por brazo', tip: 'Codo apoyado en el muslo.', image: P.bicep },
            { name: 'Curl predicador (Scott)', sets: 3, reps: '10', tip: 'No sueltes el peso al bajar.', image: P.bicep },
            { name: 'Curl 21s', sets: 3, reps: '7+7+7', tip: 'Parte baja, parte alta y recorrido completo.', image: P.bicep },
            { name: 'Curl inclinado con mancuernas', sets: 3, reps: '12', tip: 'Máximo estiramiento del bíceps.', image: P.bicep },
        ],
    },
    {
        id: 'triceps', label: 'Tríceps',
        image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&q=75',
        gradient: ['#f953c6', '#b91d73'],
        exercises: [
            { name: 'Press francés (skullcrusher)', sets: 3, reps: '12', tip: 'Codos apuntando al techo, no se abren.', image: P.tricep },
            { name: 'Fondos en banco', sets: 3, reps: '15', tip: 'Cuanto más separado el banco, más difícil.', image: P.dips },
            { name: 'Extensión en polea alta', sets: 3, reps: '15', tip: 'Codos fijos, solo extiende el antebrazo.', image: P.cable },
            { name: 'Kickbacks con mancuerna', sets: 3, reps: '15 por brazo', tip: 'Torso paralelo al suelo.', image: P.tricep },
            { name: 'Press cerrado con barra', sets: 3, reps: '10', tip: 'Agarre estrecho, codos en.', image: P.bench },
            { name: 'Extensión sobre la cabeza con mancuerna', sets: 3, reps: '12', tip: 'Codos apuntando al techo.', image: P.tricep },
            { name: 'Fondos en paralelas (tríceps)', sets: 3, reps: '10', tip: 'Tronco erguido para más tríceps.', image: P.dips },
            { name: 'Extensión en polea con cuerda', sets: 3, reps: '15', tip: 'Separa la cuerda al bajar.', image: P.cable },
        ],
    },
    {
        id: 'cardio', label: 'Cardio',
        image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=75',
        gradient: ['#11998e', '#38ef7d'],
        exercises: [
            { name: 'Burpees', sets: 3, reps: '15', tip: 'Salto con los brazos arriba al final.', image: P.cardio },
            { name: 'Jumping jacks', sets: 3, reps: '30', tip: 'Ritmo constante y controlado.', image: P.jump },
            { name: 'High knees', sets: 3, reps: '30 seg', tip: 'Rodillas al nivel del ombligo.', image: P.cardio },
            { name: 'Mountain climbers', sets: 3, reps: '30', tip: 'Core activo, caderas bajas.', image: P.climbers },
            { name: 'Jump rope (simulado)', sets: 3, reps: '1 min', tip: 'Aterrizaje suave en punta de pies.', image: P.jump },
            { name: 'Box jumps', sets: 3, reps: '12', tip: 'Aterrizaje amortiguado, aterriza como gatito.', image: P.jump },
            { name: 'Sprints en sitio', sets: 3, reps: '30 seg', tip: 'Máxima velocidad, brazos activos.', image: P.cardio },
            { name: 'Escaladores (step-up cardio)', sets: 3, reps: '20 por pierna', tip: 'No apoyes el pie trasero.', image: P.lunge },
            { name: 'Saltos de tijera', sets: 3, reps: '20', tip: 'Pies alternos, brazos al contrario.', image: P.jump },
            { name: 'Sentadillas con salto', sets: 3, reps: '15', tip: 'Aterriza con rodillas flexionadas.', image: P.squat },
        ],
    },
];

// ─── Quick Workout Modal ──────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');

const QuickWorkoutModal: React.FC<{

const QUICK_GROUPS: QuickGroup[] = [
    {
        id: 'pecho', label: 'Pecho', emoji: '💪',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=75',
        gradient: ['#FF6B6B', '#FF8E53'],
        exercises: [
            { name: 'Press de banca', sets: 4, reps: '10', tip: 'Codos a 45°, no rebotar la barra.' },
            { name: 'Press inclinado con barra', sets: 3, reps: '12', tip: 'Ángulo 30-45°, controla la bajada.' },
            { name: 'Press declinado con barra', sets: 3, reps: '12', tip: 'Agarre algo más cerrado que en press plano.' },
            { name: 'Press con mancuernas', sets: 3, reps: '12', tip: 'Rango completo, palmas al frente.' },
            { name: 'Aperturas con mancuernas', sets: 3, reps: '15', tip: 'Ligera flexión de codo, no bajar demasiado.' },
            { name: 'Press en máquina de pecho', sets: 3, reps: '15', tip: 'Ajusta el asiento a nivel de pecho.' },
            { name: 'Aperturas en polea cruzada', sets: 3, reps: '15', tip: 'Movimiento de abrazo, espeja el pecho.' },
            { name: 'Pullover con mancuerna', sets: 3, reps: '12', tip: 'Mantén los codos ligeramente flexionados.' },
            { name: 'Fondos en paralelas (pecho)', sets: 3, reps: '12', tip: 'Inclínate hacia delante para enfatizar el pecho.' },
            { name: 'Flexiones estándar', sets: 3, reps: '20', tip: 'Cuerpo recto como una tabla.' },
            { name: 'Flexiones diamante', sets: 3, reps: '15', tip: 'Manos juntas en diamante, tríceps activos.' },
            { name: 'Flexiones inclinadas (pies elevados)', sets: 3, reps: '15', tip: 'Enfatiza la parte alta del pecho.' },
        ],
    },
    {
        id: 'core', label: 'Core', emoji: '🔥',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=75',
        gradient: ['#F7971E', '#FFD200'],
        exercises: [
            { name: 'Plancha frontal', sets: 3, reps: '45 seg', tip: 'Glúteos activos, no subas las caderas.' },
            { name: 'Crunch abdominal', sets: 4, reps: '20', tip: 'Sube solo los hombros, no el cuello.' },
            { name: 'Crunch inverso', sets: 3, reps: '15', tip: 'Controla la bajada de las piernas.' },
            { name: 'Mountain climbers', sets: 3, reps: '30', tip: 'Ritmo rápido, cadera paralela al suelo.' },
            { name: 'Bicycle crunches', sets: 3, reps: '20', tip: 'Rota el torso, no el cuello.' },
            { name: 'Russian twists', sets: 3, reps: '20', tip: 'Piernas elevadas para mayor dificultad.' },
            { name: 'Plancha lateral', sets: 3, reps: '30 seg', tip: 'Cadera alta, oblicuos en tensión.' },
            { name: 'Hollow body hold', sets: 3, reps: '30 seg', tip: 'Espalda baja pegada al suelo.' },
            { name: 'Leg raises', sets: 3, reps: '15', tip: 'Piernas rectas, no rebotes al bajar.' },
            { name: 'Dead bug', sets: 3, reps: '12', tip: 'Baja brazo y pierna opuestos al mismo tiempo.' },
            { name: 'Ab rollout (rueda)', sets: 3, reps: '10', tip: 'Core tenso, no hundas la espalda.' },
            { name: 'Dragon flag', sets: 3, reps: '8', tip: 'Ejercicio avanzado, baja lentamente.' },
        ],
    },
    {
        id: 'piernas', label: 'Piernas', emoji: '🦵',
        image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=75',
        gradient: ['#43E97B', '#38F9D7'],
        exercises: [
            { name: 'Sentadilla con barra', sets: 4, reps: '10', tip: 'Rodillas alineadas con los pies.' },
            { name: 'Prensa de piernas', sets: 3, reps: '12', tip: 'No bloquees las rodillas en extensión.' },
            { name: 'Zancadas (lunges)', sets: 3, reps: '12 por pierna', tip: 'Rodilla delantera no pasa la punta del pie.' },
            { name: 'Peso muerto rumano', sets: 3, reps: '10', tip: 'Espalda recta, bisagra de cadera.' },
            { name: 'Hip thrust con barra', sets: 4, reps: '12', tip: 'Squeeze de glúteo arriba del todo.' },
            { name: 'Extensión de cuádriceps', sets: 3, reps: '15', tip: 'Extensión completa, contracción en el tope.' },
            { name: 'Curl de isquiotibiales', sets: 3, reps: '12', tip: 'Controlado en bajada.' },
            { name: 'Sentadilla búlgara', sets: 3, reps: '10 por pierna', tip: 'Pie trasero elevado, tronco erguido.' },
            { name: 'Step-ups con mancuernas', sets: 3, reps: '12 por pierna', tip: 'Empuja con el talón del pie de apoyo.' },
            { name: 'Calf raises de pie', sets: 4, reps: '20', tip: 'Pausa en la parte alta.' },
            { name: 'Goblet squat', sets: 3, reps: '15', tip: 'Mancuerna sujeta en el pecho, talones en el suelo.' },
            { name: 'Box jumps', sets: 3, reps: '10', tip: 'Aterriza suavemente con las rodillas flexionadas.' },
        ],
    },
    {
        id: 'espalda', label: 'Espalda', emoji: '🏋️',
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=75',
        gradient: ['#4776E6', '#8E54E9'],
        exercises: [
            { name: 'Dominadas (pull-ups)', sets: 3, reps: '8', tip: 'Agarre prono, activa los dorsales desde abajo.' },
            { name: 'Remo con barra', sets: 4, reps: '10', tip: 'Espalda paralela al suelo, codos pegados.' },
            { name: 'Jalón al pecho en polea', sets: 3, reps: '12', tip: 'Tira hacia el pecho, no hacia atrás.' },
            { name: 'Remo con mancuerna', sets: 3, reps: '12 por lado', tip: 'Apoyo con rodilla, codo junto al cuerpo.' },
            { name: 'Face pulls en polea', sets: 3, reps: '15', tip: 'Codos altos, manos a las orejas.' },
            { name: 'Remo sentado en polea baja', sets: 3, reps: '12', tip: 'Pecho pecho erguido, no balancees el torso.' },
            { name: 'Pull-over en polea', sets: 3, reps: '12', tip: 'Brazos casi rectos, arco amplio.' },
            { name: 'Encogimientos con barra (traps)', sets: 3, reps: '15', tip: 'Sube recto, no hagas círculos.' },
            { name: 'Hiperextensiones', sets: 3, reps: '15', tip: 'No hiperextiendas la zona lumbar.' },
            { name: 'Band pull-aparts', sets: 3, reps: '20', tip: 'Goma a la altura del pecho, brazos extendidos.' },
        ],
    },
    {
        id: 'hombros', label: 'Hombros', emoji: '🎯',
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=75',
        gradient: ['#FC5C7D', '#6A3093'],
        exercises: [
            { name: 'Press militar con barra', sets: 4, reps: '10', tip: 'De pie o sentado, core activo.' },
            { name: 'Press Arnold', sets: 3, reps: '12', tip: 'Gira las palmas durante la subida.' },
            { name: 'Elevaciones laterales', sets: 3, reps: '15', tip: 'Codos ligeramente flexionados, no por encima de los hombros.' },
            { name: 'Elevaciones frontales', sets: 3, reps: '15', tip: 'Alterna brazos o hazlas juntas.' },
            { name: 'Face pulls para deltoides posterior', sets: 3, reps: '15', tip: 'Codos altos.' },
            { name: 'Press con mancuernas sentado', sets: 3, reps: '12', tip: 'No bloquees los codos arriba.' },
            { name: 'Encogimientos de hombros (shrugs)', sets: 3, reps: '15', tip: 'Sube directo, sin girar.' },
            { name: 'Vuelos en decúbito prono', sets: 3, reps: '12', tip: 'Trabajo del deltoides posterior.' },
            { name: 'Rotación externa con banda', sets: 3, reps: '15 por lado', tip: 'Codo pegado al costado.' },
        ],
    },
    {
        id: 'biceps', label: 'Bíceps', emoji: '💥',
        image: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&q=75',
        gradient: ['#3CA55C', '#B5AC49'],
        exercises: [
            { name: 'Curl con barra', sets: 4, reps: '12', tip: 'Codos pegados al cuerpo, sin balanceo.' },
            { name: 'Curl con mancuernas alterno', sets: 3, reps: '12 por brazo', tip: 'Supina la muñeca al subir.' },
            { name: 'Curl martillo', sets: 3, reps: '12', tip: 'Agarre neutro, trabaja el braquial.' },
            { name: 'Curl en polea baja', sets: 3, reps: '15', tip: 'Tensión constante en todo el recorrido.' },
            { name: 'Curl concentrado', sets: 3, reps: '12 por brazo', tip: 'Codo apoyado en el muslo.' },
            { name: 'Curl predicador (Scott)', sets: 3, reps: '10', tip: 'No sueltes el peso al bajar.' },
            { name: 'Curl 21s', sets: 3, reps: '7+7+7', tip: 'Parte baja, parte alta y recorrido completo.' },
            { name: 'Curl inclinado con mancuernas', sets: 3, reps: '12', tip: 'Máximo estiramiento del bíceps.' },
        ],
    },
    {
        id: 'triceps', label: 'Tríceps', emoji: '⚡',
        image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&q=75',
        gradient: ['#f953c6', '#b91d73'],
        exercises: [
            { name: 'Press francés (skullcrusher)', sets: 3, reps: '12', tip: 'Codos apuntando al techo, no se abren.' },
            { name: 'Fondos en banco', sets: 3, reps: '15', tip: 'Cuanto más separado el banco, más difícil.' },
            { name: 'Extensión en polea alta', sets: 3, reps: '15', tip: 'Codos fijos, solo extiende el antebrazo.' },
            { name: 'Kickbacks con mancuerna', sets: 3, reps: '15 por brazo', tip: 'Torso paralelo al suelo.' },
            { name: 'Press cerrado con barra', sets: 3, reps: '10', tip: 'Agarre estrecho, codos en.' },
            { name: 'Extensión sobre la cabeza con mancuerna', sets: 3, reps: '12', tip: 'Codos apuntando al techo.' },
            { name: 'Fondos en paralelas (tríceps)', sets: 3, reps: '10', tip: 'Tronco erguido para más tríceps.' },
            { name: 'Extensión en polea con cuerda', sets: 3, reps: '15', tip: 'Separa la cuerda al bajar.' },
        ],
    },
    {
        id: 'cardio', label: 'Cardio', emoji: '🏃',
        image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=75',
        gradient: ['#11998e', '#38ef7d'],
        exercises: [
            { name: 'Burpees', sets: 3, reps: '15', tip: 'Salto con los brazos arriba al final.' },
            { name: 'Jumping jacks', sets: 3, reps: '30', tip: 'Ritmo constante y controlado.' },
            { name: 'High knees', sets: 3, reps: '30 seg', tip: 'Rodillas al nivel del ombligo.' },
            { name: 'Mountain climbers', sets: 3, reps: '30', tip: 'Core activo, caderas bajas.' },
            { name: 'Jump rope (simulado)', sets: 3, reps: '1 min', tip: 'Aterrizaje suave en punta de pies.' },
            { name: 'Box jumps', sets: 3, reps: '12', tip: 'Aterrizaje amortiguado, aterriza como gatito.' },
            { name: 'Sprints en sitio', sets: 3, reps: '30 seg', tip: 'Máxima velocidad, brazos activos.' },
            { name: 'Escaladores (step-up cardio)', sets: 3, reps: '20 por pierna', tip: 'No apoyes el pie trasero.' },
            { name: 'Saltos de tijera', sets: 3, reps: '20', tip: 'Pies alternos, brazos al contrario.' },
            { name: 'Sentadillas con salto', sets: 3, reps: '15', tip: 'Aterriza con rodillas flexionadas.' },
        ],
    },
];

// ─── Quick Workout Modal ──────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');

const QuickWorkoutModal: React.FC<{
    group: QuickGroup | null;
    onClose: () => void;
}> = ({ group, onClose }) => {
    const [phase, setPhase] = useState<'list' | 'workout'>('list');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [currentIdx, setCurrentIdx] = useState(0);  // index in selectedList
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (group) { setPhase('list'); setSelected(new Set()); setCurrentIdx(0); }
    }, [group]);

    const toggleSelect = (i: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const selectedList = group ? group.exercises.filter((_, i) => selected.has(i)) : [];

    const startWorkout = () => {
        if (selectedList.length === 0) {
            Alert.alert('Selecciona ejercicios', 'Pulsa + en al menos un ejercicio para añadirlo a tu entrenamiento.');
            return;
        }
        setCurrentIdx(0);
        setPhase('workout');
    };

    const goNext = () => {
        if (currentIdx < selectedList.length - 1) {
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
            ]).start();
            setCurrentIdx(i => i + 1);
        } else {
            Alert.alert('🎉 ¡Entrenamiento completado!', `Has completado ${selectedList.length} ejercicio${selectedList.length > 1 ? 's' : ''}. ¡Buen trabajo!`, [
                { text: 'Cerrar', onPress: onClose },
            ]);
        }
    };

    if (!group) return null;
    const ex = selectedList[currentIdx];
    const isLast = currentIdx === selectedList.length - 1;
    const progress = selectedList.length > 0 ? (currentIdx + 1) / selectedList.length : 0;

    return (
        <Modal visible={!!group} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>

                {/* ── PHASE: LIST (selección) ── */}
                {phase === 'list' && (
                    <>
                        {/* Compact photo header */}
                        <View style={qw.photoHeader}>
                            <Image source={{ uri: group.image }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                            <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill as any} />
                            <TouchableOpacity onPress={onClose} style={qw.closeBtn}>
                                <Ionicons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                            <View style={qw.photoHeaderBottom}>
                                <Text style={qw.listGroupName}>{group.label}</Text>
                                <Text style={qw.listSubtitle}>
                                    {selected.size === 0
                                        ? 'Pulsa + para añadir ejercicios'
                                        : `${selected.size} ejercicio${selected.size > 1 ? 's' : ''} seleccionado${selected.size > 1 ? 's' : ''}`}
                                </Text>
                            </View>
                        </View>

                        {/* Exercise list */}
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.base, paddingBottom: 140 }}>
                            {group.exercises.map((e, i) => {
                                const isSel = selected.has(i);
                                return (
                                    <View key={i} style={[qw.exRow, isSel && { borderColor: group.gradient[0], borderWidth: 1.5 }]}>
                                        {/* Foto propia del ejercicio */}
                                        <View style={qw.exThumbWrap}>
                                            <Image source={{ uri: e.image }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                                            {isSel && (
                                                <LinearGradient colors={[group.gradient[0] + 'CC', group.gradient[1] + 'AA']} style={StyleSheet.absoluteFill as any} />
                                            )}
                                            {isSel && <Ionicons name="checkmark" size={22} color="#fff" />}
                                        </View>
                                        {/* Info */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={[qw.exName, isSel && { color: group.gradient[0] }]}>{e.name}</Text>
                                            <Text style={qw.exMeta}>{e.sets} series · {e.reps} reps</Text>
                                        </View>
                                        {/* Botón + / ✓ */}
                                        <TouchableOpacity
                                            onPress={() => toggleSelect(i)}
                                            style={[qw.exPlusBtn, { backgroundColor: isSel ? group.gradient[0] : Colors.surface, borderWidth: 1.5, borderColor: isSel ? group.gradient[0] : Colors.border }]}
                                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                            <Ionicons name={isSel ? 'checkmark' : 'add'} size={18} color={isSel ? '#fff' : Colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        {/* Start button */}
                        <View style={qw.startWrap}>
                            <TouchableOpacity onPress={startWorkout} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={selected.size > 0 ? group.gradient : ['#333', '#222']}
                                    style={qw.startBtn}>
                                    <Ionicons name="play" size={20} color="#fff" />
                                    <Text style={qw.startBtnText}>
                                        {selected.size > 0
                                            ? `Empezar con ${selected.size} ejercicio${selected.size > 1 ? 's' : ''}`
                                            : 'Selecciona ejercicios'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* ── PHASE: WORKOUT ── */}
                {phase === 'workout' && ex && (
                    <View style={{ flex: 1 }}>
                        <View style={qw.topBar}>
                            <TouchableOpacity onPress={() => setPhase('list')}>
                                <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            <Text style={qw.topBarTitle}>{group.label}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={22} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Progress */}
                        <View style={qw.progressBg}>
                            <View style={[qw.progressFill, { width: `${progress * 100}%` as any, backgroundColor: group.gradient[0] }]} />
                        </View>
                        <Text style={qw.progressText}>{currentIdx + 1} de {selectedList.length}</Text>

                        {/* Exercise */}
                        <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, opacity: fadeAnim }}>
                            {/* Foto grande del ejercicio */}
                            <View style={qw.workoutImgWrap}>
                                <Image source={{ uri: ex.image }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                                <LinearGradient colors={[group.gradient[0] + '55', group.gradient[1] + '44']} style={StyleSheet.absoluteFill as any} />
                            </View>

                            <Text style={qw.workoutExName}>{ex.name}</Text>

                            <LinearGradient colors={[group.gradient[0] + '33', group.gradient[1] + '22']} style={qw.repsCard}>
                                <View style={qw.repsRow}>
                                    <View style={qw.repsStat}>
                                        <Text style={[qw.repsNumBig, { color: group.gradient[0] }]}>{ex.sets}</Text>
                                        <Text style={qw.repsLabel}>Series</Text>
                                    </View>
                                    <View style={qw.repsDivider} />
                                    <View style={qw.repsStat}>
                                        <Text style={[qw.repsNumBig, { color: group.gradient[0] }]}>{ex.reps}</Text>
                                        <Text style={qw.repsLabel}>Reps</Text>
                                    </View>
                                </View>
                            </LinearGradient>

                            {ex.tip && (
                                <View style={qw.tipBox}>
                                    <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
                                    <Text style={qw.tipText}>{ex.tip}</Text>
                                </View>
                            )}
                        </Animated.View>

                        <View style={qw.nextWrap}>
                            <TouchableOpacity onPress={goNext} activeOpacity={0.88} style={{ width: '100%' }}>
                                <LinearGradient colors={isLast ? ['#22c55e', '#16a34a'] : group.gradient} style={qw.nextBtn}>
                                    <Text style={qw.nextBtnText}>{isLast ? '🏁  TERMINAR' : 'SIGUIENTE  →'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </LinearGradient>
        </Modal>
    );
};

const qw = StyleSheet.create({
    photoHeader: { height: 155, position: 'relative', justifyContent: 'flex-end', overflow: 'hidden' },
    photoHeaderBottom: { padding: Spacing.base, paddingBottom: Spacing.md },
    closeBtn: { position: 'absolute', top: 52, right: Spacing.base, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    listGroupName: { fontSize: FontSizes['2xl'], fontWeight: '900', color: '#fff' },
    listSubtitle: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
    exRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    exThumbWrap: { width: 56, height: 56, borderRadius: BorderRadius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    exName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textPrimary },
    exMeta: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
    exPlusBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    startWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.base, paddingBottom: 36, backgroundColor: '#0A0A0Aee' },
    startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.xl, paddingVertical: 17 },
    startBtnText: { fontSize: FontSizes.base, fontWeight: '800', color: '#fff' },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: 56, paddingBottom: Spacing.md },
    topBarTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.textPrimary },
    progressBg: { height: 6, backgroundColor: Colors.surface, marginHorizontal: Spacing.base, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },
    progressText: { textAlign: 'center', color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: 6 },
    workoutImgWrap: { width: '100%', height: 180, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.lg },
    workoutExName: { fontSize: FontSizes['2xl'], fontWeight: '900', color: Colors.textPrimary, textAlign: 'center', lineHeight: 34, marginBottom: Spacing.lg },
    repsCard: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.md },
    repsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    repsStat: { flex: 1, alignItems: 'center' },
    repsNumBig: { fontSize: 48, fontWeight: '900', lineHeight: 56 },
    repsLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
    repsDivider: { width: 1, height: 56, backgroundColor: Colors.border },
    tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    tipText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 18 },
    nextWrap: { padding: Spacing.base, paddingBottom: 44 },
    nextBtn: { borderRadius: BorderRadius.xl, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
    nextBtnText: { fontSize: FontSizes['2xl'], fontWeight: '900', color: '#fff', letterSpacing: 1 },
});

const CAT_LABELS: Record<string, string> = { gym: '🏋️ Gym', yoga: '🧘 Yoga', pilates: '🌀 Pilates' };
const DIFF_LABELS: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
const DIFF_COLORS: Record<string, string> = { beginner: Colors.success, intermediate: Colors.warning, advanced: '#FF6B35' };
const CAT_GRAD: Record<string, [string, string]> = {
    gym: ['#FF6B6B', '#FF8E53'],
    yoga: ['#43E97B', '#38F9D7'],
    pilates: ['#F7971E', '#FFD200'],
};

// ── Routine card ─────────────────────────────────────────────────────────────
const RoutineCard: React.FC<{
    routine: Routine & { tags?: string[]; image_url?: string };
    saved: boolean;
    onPress: () => void;
    onToggleSave: () => void;
    onStart: () => void;
    assignMode?: boolean;
}> = ({ routine, saved, onPress, onToggleSave, onStart, assignMode }) => {
    const grad = CAT_GRAD[routine.category] ?? ['#6C63FF', '#9C6FFF'];
    const hasImage = !!routine.image_url;
    return (
        <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={card.wrap}>
            {hasImage ? (
                <View style={card.imgWrap}>
                    <Image source={{ uri: routine.image_url }} style={card.img} resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={card.imgGrad} />
                    <TouchableOpacity onPress={onToggleSave} style={card.imgHeart} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#FF4D6D' : '#fff'} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={card.bar}>
                    <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                </View>
            )}
            <View style={card.body}>
                <View style={card.topRow}>
                    <View style={[card.badge, { backgroundColor: grad[0] + '22' }]}>
                        <Text style={[card.badgeText, { color: grad[0] }]}>{CAT_LABELS[routine.category]}</Text>
                    </View>
                    <View style={[card.badge, { backgroundColor: DIFF_COLORS[routine.difficulty] + '22' }]}>
                        <Text style={[card.badgeText, { color: DIFF_COLORS[routine.difficulty] }]}>{DIFF_LABELS[routine.difficulty]}</Text>
                    </View>
                    {!hasImage && (
                        <TouchableOpacity onPress={onToggleSave} style={card.heart} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#FF4D6D' : Colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={card.title} numberOfLines={1}>{routine.title}</Text>
                <Text style={card.desc} numberOfLines={2}>{routine.description}</Text>
                <View style={card.footer}>
                    <View style={card.stat}>
                        <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                        <Text style={card.statText}>{routine.duration_minutes} min</Text>
                    </View>
                    <TouchableOpacity onPress={onStart} activeOpacity={0.8}>
                        <LinearGradient colors={assignMode ? ['#7C3AED', '#A855F7'] : grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={card.startBtn}>
                            <Text style={card.startText}>{assignMode ? 'Asignar' : 'Empezar'}</Text>
                            <Ionicons name={assignMode ? 'person-add-outline' : 'arrow-forward'} size={13} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// ── Screen ───────────────────────────────────────────────────────────────────
const CATS = [{ id: 'all', label: 'Todos' }, { id: 'gym', label: '🏋️ Gym' }, { id: 'yoga', label: '🧘 Yoga' }, { id: 'pilates', label: '🌀 Pilates' }];
const DIFFS = [{ id: 'all', label: 'Todos' }, { id: 'beginner', label: 'Principiante' }, { id: 'intermediate', label: 'Intermedio' }, { id: 'advanced', label: 'Avanzado' }];

export const RoutinesScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const { primary } = useThemeStore();
    const { profile } = useAuthStore();
    const { publicRoutines, fetchPublicRoutines, isLoading } = useRoutineStore();

    const assignToClientId: string | undefined = route.params?.assignToClientId;

    const [catFilter, setCatFilter] = useState<string>(route.params?.category ?? 'all');
    const [diffFilter, setDiffFilter] = useState<string>('all');
    const [tab, setTab] = useState<'library' | 'quick' | 'saved'>('library');
    const [saved, setSaved] = useState<Set<string>>(new Set());
    const [assigning, setAssigning] = useState(false);
    const [quickGroup, setQuickGroup] = useState<QuickGroup | null>(null);

    useEffect(() => { fetchPublicRoutines(); }, []);

    const handleAssign = async (routineId: string, routineTitle: string) => {
        if (!assignToClientId) return;
        setAssigning(true);
        try {
            let finalRoutineId = routineId;

            // Local catalogue routines have non-UUID ids (e.g. "local-g1")
            // Auto-upsert them to Supabase so they can be assigned
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(routineId)) {
                const catItem = CATALOGUE.find((r) => r.id === routineId);
                if (!catItem) throw new Error('Rutina no encontrada en el catálogo');

                // Check if already synced to Supabase
                const { data: existing } = await supabase
                    .from('routines')
                    .select('id')
                    .eq('title', catItem.title)
                    .maybeSingle();

                if (existing?.id) {
                    finalRoutineId = existing.id;
                } else {
                    // Get trainer's internal DB id for created_by (required by RLS)
                    const { data: { session } } = await supabase.auth.getSession();
                    const trainerUid = session?.user?.id;
                    let createdBy: string | null = null;
                    if (trainerUid) {
                        const { data: trainerRow } = await supabase
                            .from('users').select('id').eq('supabase_id', trainerUid).maybeSingle();
                        createdBy = trainerRow?.id ?? null;
                    }

                    // Insert it so it gets a real UUID
                    const { data: inserted, error: insertErr } = await supabase
                        .from('routines')
                        .insert({
                            title: catItem.title,
                            description: catItem.description,
                            category: catItem.category,
                            difficulty: catItem.difficulty,
                            duration_minutes: catItem.duration_minutes,
                            is_public: true,
                            thumbnail_url: catItem.image_url,
                            ...(createdBy ? { created_by: createdBy } : {}),
                        })
                        .select('id')
                        .single();
                    if (insertErr) throw insertErr;
                    finalRoutineId = inserted.id;
                    // Refresh store so newly synced routine gets its real UUID on next render
                    fetchPublicRoutines();
                }
            }

            const { error } = await supabase.from('user_routines').upsert(
                { user_id: assignToClientId, routine_id: finalRoutineId, status: 'active' },
                { onConflict: 'user_id,routine_id' }
            );
            if (error) throw error;
            Alert.alert('✅ Rutina asignada', `"${routineTitle}" asignada al cliente.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'No se pudo asignar la rutina');
        } finally {
            setAssigning(false);
        }
    };

    const allRoutines = useMemo(() => {
        const backendIds = new Set(publicRoutines.map((r) => r.id));
        return [
            ...publicRoutines.map((r) => ({ ...r, tags: [] as string[], image_url: '' })),
            ...CATALOGUE.filter((r) => !backendIds.has(r.id)),
        ];
    }, [publicRoutines]);

    const filtered = useMemo(() =>
        allRoutines.filter((r) =>
            (catFilter === 'all' || r.category === catFilter) &&
            (diffFilter === 'all' || r.difficulty === diffFilter)
        ), [allRoutines, catFilter, diffFilter]);

    const recommended = useMemo(() => {
        const goals: string[] = profile?.goals ?? [];
        const preferred: string[] = profile?.preferred_types ?? [];
        const relevantTags = new Set<string>();
        goals.forEach((g) => (GOAL_TAGS[g.toLowerCase()] ?? []).forEach((t) => relevantTags.add(t)));
        preferred.forEach((p) => relevantTags.add(p));
        if (relevantTags.size === 0) return allRoutines.slice(0, 5);
        return allRoutines
            .map((r) => ({ r, score: (r.tags ?? []).filter((t) => relevantTags.has(t)).length + (relevantTags.has(r.category) ? 2 : 0) }))
            .sort((a, b) => b.score - a.score).slice(0, 5).map((x) => x.r);
    }, [allRoutines, profile]);

    const savedRoutines = useMemo(() => allRoutines.filter((r) => saved.has(r.id)), [allRoutines, saved]);

    const toggleSave = (id: string) => setSaved((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const goalLabel = useMemo(() => {
        const g = profile?.goals?.[0];
        if (!g) return null;
        return GOAL_LABEL[g] ?? GOAL_LABEL[g.toLowerCase()] ?? g;
    }, [profile]);

    return (
        <>
        <LinearGradient colors={['#0A0A0A', '#0D0A18']} style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.header}>
                {assignToClientId && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm }}>
                        <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
                        <Text style={{ color: Colors.textSecondary, fontSize: FontSizes.sm }}>Volver</Text>
                    </TouchableOpacity>
                )}
                <Text style={s.heading}>{assignToClientId ? 'Asignar rutina' : 'Rutinas'}</Text>
                {assignToClientId && (
                    <LinearGradient colors={['#7C3AED33', '#7C3AED11']} style={s.assignBanner}>
                        <Ionicons name="person-add-outline" size={18} color="#A855F7" />
                        <Text style={s.assignBannerText}>Selecciona una rutina para asignar al cliente</Text>
                    </LinearGradient>
                )}
                <View style={s.tabRow}>
                    {[
                        { id: 'library', label: '📚 Biblioteca' },
                        { id: 'quick', label: '⚡ Tu rutina' },
                        { id: 'saved', label: `❤️ Guardadas${saved.size > 0 ? ` (${saved.size})` : ''}` },
                    ].map((t) => (
                        <TouchableOpacity key={t.id} onPress={() => setTab(t.id as any)}
                            style={[s.tab, tab === t.id && { backgroundColor: primary }]}>
                            <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {tab === 'library' ? (
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchPublicRoutines} tintColor={primary} />}>

                    {/* Recommendation banner */}
                    <LinearGradient colors={[primary + 'DD', primary + '66']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.recBanner}>
                        <View style={s.recHeader}>
                            <Text style={{ fontSize: 22 }}>🎯</Text>
                            <Text style={s.recTitle}>
                                {goalLabel ? `Según tu objetivo de ${goalLabel}, te recomendamos:` : 'Rutinas recomendadas para ti:'}
                            </Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
                            {recommended.map((r) => {
                                const grad = CAT_GRAD[r.category] ?? ['#6C63FF', '#9C6FFF'];
                                const isSaved = saved.has(r.id);
                                return (
                                    <TouchableOpacity key={r.id} onPress={() => navigation.navigate('RoutineDetail', { routineId: r.id })} style={s.recCard} activeOpacity={0.85}>
                                        {r.image_url ? (
                                            <>
                                                <Image source={{ uri: r.image_url }} style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]} resizeMode="cover" />
                                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]} />
                                            </>
                                        ) : (
                                            <LinearGradient colors={grad} style={StyleSheet.absoluteFill} borderRadius={BorderRadius.md} />
                                        )}
                                        <TouchableOpacity onPress={() => toggleSave(r.id)} style={s.recHeart} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color={isSaved ? '#FF4D6D' : 'rgba(255,255,255,0.8)'} />
                                        </TouchableOpacity>
                                        <Text style={s.recCardTitle} numberOfLines={2}>{r.title}</Text>
                                        <Text style={s.recCardMeta}>{r.duration_minutes} min · {DIFF_LABELS[r.difficulty]}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </LinearGradient>

                    {/* Category filter */}
                    <Text style={s.filterLabel}>Categoría</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: Spacing.sm }}>
                        {CATS.map((c) => (
                            <TouchableOpacity key={c.id} onPress={() => setCatFilter(c.id)}
                                style={[s.chip, catFilter === c.id && { backgroundColor: primary + '22', borderColor: primary }]}>
                                <Text style={[s.chipText, catFilter === c.id && { color: primary }]}>{c.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Difficulty filter */}
                    <Text style={s.filterLabel}>Dificultad</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: Spacing.sm }}>
                        {DIFFS.map((d) => (
                            <TouchableOpacity key={d.id} onPress={() => setDiffFilter(d.id)}
                                style={[s.chip, diffFilter === d.id && { backgroundColor: primary + '22', borderColor: primary }]}>
                                <Text style={[s.chipText, diffFilter === d.id && { color: primary }]}>{d.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Full list */}
                    <Text style={s.sectionTitle}>Todas las rutinas ({filtered.length})</Text>
                    {filtered.map((r) => (
                        <RoutineCard key={r.id} routine={r} saved={saved.has(r.id)}
                            onPress={() => navigation.navigate('RoutineDetail', { routineId: r.id })}
                            onToggleSave={() => toggleSave(r.id)}
                            assignMode={!!assignToClientId}
                            onStart={() => assignToClientId
                                ? handleAssign(r.id, r.title)
                                : navigation.navigate('ActiveWorkout', { routineId: r.id })
                            } />
                    ))}
                </ScrollView>
            ) : tab === 'quick' ? (
                /* ── Quick tab ── */
                <ScrollView contentContainerStyle={[s.scroll, { paddingTop: Spacing.lg }]} showsVerticalScrollIndicator={false}>
                    <Text style={s.quickTitle}>⚡ Haz tu rutina</Text>
                    <Text style={[s.quickSub, { marginBottom: Spacing.lg }]}>Elige un grupo muscular y empieza ya</Text>
                    <View style={qg.grid}>
                        {QUICK_GROUPS.map((g) => (
                            <TouchableOpacity key={g.id} onPress={() => setQuickGroup(g)} activeOpacity={0.82} style={qg.gridCard}>
                                <Image source={{ uri: g.image }} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFill as any} />
                                <View style={qg.bottom}>
                                    <Text style={qg.label}>{g.label}</Text>
                                    <Text style={qg.count}>{g.exercises.length} ejercicios</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                /* ── Saved tab ── */
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    {savedRoutines.length === 0 ? (
                        <View style={s.emptyWrap}>
                            <Text style={{ fontSize: 52 }}>🤍</Text>
                            <Text style={s.emptyTitle}>Sin rutinas guardadas</Text>
                            <Text style={s.emptySub}>Toca el ❤️ en cualquier rutina para guardarla aquí</Text>
                            <TouchableOpacity onPress={() => setTab('library')} style={[s.emptyBtn, { backgroundColor: primary }]}>
                                <Text style={s.emptyBtnText}>Ver biblioteca</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Text style={s.sectionTitle}>Mis rutinas guardadas ({savedRoutines.length})</Text>
                            {savedRoutines.map((r) => (
                                <RoutineCard key={r.id} routine={r} saved
                                    onPress={() => navigation.navigate('RoutineDetail', { routineId: r.id })}
                                    onToggleSave={() => toggleSave(r.id)}
                                    assignMode={!!assignToClientId}
                                    onStart={() => assignToClientId
                                        ? handleAssign(r.id, r.title)
                                        : navigation.navigate('ActiveWorkout', { routineId: r.id })
                                    } />
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </LinearGradient>
        <QuickWorkoutModal group={quickGroup} onClose={() => setQuickGroup(null)} />
        </>
    );
};

// ── Card styles ───────────────────────────────────────────────────────────────
const card = StyleSheet.create({
    wrap: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    // image variant
    imgWrap: { width: '100%', height: 140, position: 'relative' },
    img: { width: '100%', height: 140 },
    imgGrad: { ...StyleSheet.absoluteFillObject },
    imgHeart: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
    // no-image variant (colored bar)
    bar: { width: 5, overflow: 'hidden' },
    body: { padding: Spacing.base },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
    badgeText: { fontSize: 10, fontWeight: '700' },
    heart: { marginLeft: 'auto' },
    title: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
    desc: { fontSize: FontSizes.xs, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
    startBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
    startText: { fontSize: FontSizes.xs, fontWeight: '700', color: '#fff' },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    header: { padding: Spacing.base, paddingTop: 56 },
    heading: { fontSize: FontSizes['3xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.base },
    tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 4, gap: 4 },
    tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.md },
    tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSizes.sm },
    tabTextActive: { color: '#fff', fontWeight: '700' },
    scroll: { padding: Spacing.base, paddingBottom: 100 },
    recBanner: { borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.lg },
    recHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
    recTitle: { flex: 1, fontSize: FontSizes.sm, fontWeight: '700', color: '#fff', lineHeight: 20 },
    recCard: { width: 130, height: 110, borderRadius: BorderRadius.md, marginRight: Spacing.sm, padding: Spacing.sm, justifyContent: 'flex-end', overflow: 'hidden' },
    recHeart: { position: 'absolute', top: 8, right: 8 },
    recCardTitle: { fontSize: FontSizes.xs, fontWeight: '800', color: '#fff', lineHeight: 16, marginBottom: 4 },
    recCardMeta: { fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
    filterLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '700', marginBottom: 6, marginTop: 4 },
    filterRow: { maxHeight: 44, marginBottom: Spacing.sm },
    chip: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: '600' },
    sectionTitle: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.sm, marginBottom: Spacing.md },
    emptyWrap: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
    emptyTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
    emptySub: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    emptyBtn: { marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.base },
    assignBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.sm, borderWidth: 1, borderColor: '#7C3AED44' },
    assignBannerText: { flex: 1, fontSize: FontSizes.sm, fontWeight: '600', color: '#A855F7', lineHeight: 18 },
    // Quick section
    quickTitle: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textPrimary, marginBottom: 2 },
    quickSub: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginBottom: 4 },
});

// ── Quick group card styles ───────────────────────────────────────────────────
const qg = StyleSheet.create({
    // slider card (still used in list header if needed)
    card: { width: 130, height: 160, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative', justifyContent: 'flex-end' },
    // grid card for the tab
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    gridCard: { width: '47%', height: 160, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative', justifyContent: 'flex-end' },
    bottom: { padding: Spacing.sm },
    label: { fontSize: FontSizes.base, fontWeight: '900', color: '#fff' },
    count: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
    plusBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
});
