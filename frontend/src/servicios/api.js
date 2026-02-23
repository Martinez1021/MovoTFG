import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cambiar a tu IP local para dispositivo físico: 'http://192.168.X.X:8080/api'
// Usar 10.0.2.2 para emulador Android
const BASE_URL = 'http://10.0.2.2:8080/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de petición: añade el token JWT automáticamente
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de respuesta: manejo global de errores
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.multiRemove(['token', 'usuario']);
        }
        return Promise.reject(error);
    }
);

// ===== AUTH =====
export const iniciarSesion = (email, password) =>
    api.post('/auth/login', { email, password });

export const registrarse = (nombreUsuario, email, password) =>
    api.post('/auth/registro', { nombreUsuario, email, password });

// ===== HÁBITOS =====
export const obtenerHabitos = () =>
    api.get('/habitos');

export const crearHabito = (datos) =>
    api.post('/habitos', datos);

export const actualizarHabito = (id, datos) =>
    api.put(`/habitos/${id}`, datos);

export const eliminarHabito = (id) =>
    api.delete(`/habitos/${id}`);

export const completarHabito = (id) =>
    api.post(`/habitos/${id}/completar`);

export const obtenerEstadisticasHabito = (id) =>
    api.get(`/habitos/${id}/estadisticas`);

// ===== USUARIO =====
export const obtenerMiPerfil = () =>
    api.get('/usuarios/yo');

export default api;
