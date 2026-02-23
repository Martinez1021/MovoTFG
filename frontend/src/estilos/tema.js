// Tema de diseño global de Movo
export const colores = {
    primario: '#6C63FF',
    primarioOscuro: '#5A52D5',
    exito: '#22C55E',
    peligro: '#EF4444',
    advertencia: '#F59E0B',
    fondo: '#F8F9FA',
    tarjeta: '#FFFFFF',
    texto: '#1A1A2E',
    textoSecundario: '#4A4A6A',
    textoTenue: '#9CA3AF',
    borde: '#E8E8F0',
};

export const tipografia = {
    titulo: { fontSize: 28, fontWeight: '800', color: colores.texto },
    subtitulo: { fontSize: 20, fontWeight: '700', color: colores.texto },
    cuerpo: { fontSize: 15, color: colores.textoSecundario },
    etiqueta: { fontSize: 13, fontWeight: '600', color: colores.textoSecundario },
    pequeno: { fontSize: 12, color: colores.textoTenue },
};

export const sombra = {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
};

export const sombraFuerte = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
};
