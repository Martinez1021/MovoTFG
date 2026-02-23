import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// iPhone simulator → localhost,  Android emulator → 10.0.2.2
// Dispositivo físico → tu IP local (ej. 192.168.1.X)
const BASE_URL = Platform.select({
    ios: 'http://localhost:8080/api',
    android: 'http://10.0.2.2:8080/api',
    default: 'http://localhost:8080/api',
});

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor: añade JWT automáticamente
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

// Interceptor respuesta: si 401 → limpiar sesión
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.multiRemove(['token', 'usuario']);
        }
        return Promise.reject(error);
    }
);

// ═══════════ AUTH ═══════════
export const iniciarSesion = (email, password) =>
    api.post('/auth/login', { email, password });

export const registrarse = (nombreUsuario, email, password) =>
    api.post('/auth/registro', { nombreUsuario, email, password });

// ═══════════ HÁBITOS ═══════════
export const obtenerHabitos = () => api.get('/habitos');
export const crearHabito = (datos) => api.post('/habitos', datos);
export const actualizarHabito = (id, datos) => api.put(`/habitos/${id}`, datos);
export const eliminarHabito = (id) => api.delete(`/habitos/${id}`);
export const completarHabito = (id) => api.post(`/habitos/${id}/completar`);
export const obtenerEstadisticasHabito = (id) => api.get(`/habitos/${id}/estadisticas`);

// ═══════════ USUARIO ═══════════
export const obtenerMiPerfil = () => api.get('/usuarios/yo');

export default api;
