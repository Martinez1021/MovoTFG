// ======================================================
// 🎨 MOVO — Sistema de diseño premium
// ======================================================

export const colores = {
    // Primarios
    primario: '#6C63FF',
    primarioOscuro: '#5A52D5',
    primarioClaro: '#A8A3FF',
    primarioSuave: '#EDE9FF',

    // Gradientes
    gradientePrimario: ['#6C63FF', '#897AFF', '#A78BFA'],
    gradienteOscuro: ['#1A1A2E', '#2D2B55', '#3B3680'],
    gradienteExito: ['#22C55E', '#34D399', '#6EE7B7'],
    gradienteFuego: ['#F59E0B', '#F97316', '#EF4444'],

    // Estado
    exito: '#22C55E',
    exitoSuave: '#DCFCE7',
    peligro: '#EF4444',
    peligroSuave: '#FEE2E2',
    advertencia: '#F59E0B',
    info: '#3B82F6',

    // Fondos
    fondo: '#F2F0FF',
    fondoTarjeta: '#FFFFFF',
    fondoInput: '#F8F7FF',

    // Texto
    texto: '#1A1A2E',
    textoSecundario: '#4A4A6A',
    textoTenue: '#9CA3AF',
    textoSobrePrimario: '#FFFFFF',

    // Bordes
    borde: '#E8E5FF',
    bordeClaro: '#F0EEFF',
};

export const espaciado = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const radio = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
};

export const sombra = {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
};

export const sombraSuave = {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
};

export const sombraFuerte = {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
};

export const tipografia = {
    heroTitulo: { fontSize: 34, fontWeight: '800', color: colores.texto, letterSpacing: -0.5 },
    titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, letterSpacing: -0.3 },
    subtitulo: { fontSize: 20, fontWeight: '700', color: colores.texto },
    cuerpo: { fontSize: 15, color: colores.textoSecundario, lineHeight: 22 },
    etiqueta: { fontSize: 13, fontWeight: '600', color: colores.textoSecundario, letterSpacing: 0.3 },
    pequeno: { fontSize: 12, color: colores.textoTenue },
    boton: { fontSize: 16, fontWeight: '700', color: '#fff' },
};
