import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { iniciarSesion, registrarse } from '../servicios/api';

const AuthContexto = createContext(null);

export const AuthProveedor = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [token, setToken] = useState(null);
    const [cargando, setCargando] = useState(true);

    // Al montar, comprobar si hay sesión guardada
    useEffect(() => {
        const cargarSesion = async () => {
            try {
                const tokenGuardado = await AsyncStorage.getItem('token');
                const usuarioGuardado = await AsyncStorage.getItem('usuario');
                if (tokenGuardado && usuarioGuardado) {
                    setToken(tokenGuardado);
                    setUsuario(JSON.parse(usuarioGuardado));
                }
            } catch (e) {
                console.warn('Error cargando sesión:', e);
            } finally {
                setCargando(false);
            }
        };
        cargarSesion();
    }, []);

    const login = async (email, password) => {
        const respuesta = await iniciarSesion(email, password);
        const datos = respuesta.data;
        await AsyncStorage.setItem('token', datos.token);
        await AsyncStorage.setItem('usuario', JSON.stringify(datos));
        setToken(datos.token);
        setUsuario(datos);
        return datos;
    };

    const registro = async (nombreUsuario, email, password) => {
        const respuesta = await registrarse(nombreUsuario, email, password);
        const datos = respuesta.data;
        await AsyncStorage.setItem('token', datos.token);
        await AsyncStorage.setItem('usuario', JSON.stringify(datos));
        setToken(datos.token);
        setUsuario(datos);
        return datos;
    };

    const cerrarSesion = async () => {
        await AsyncStorage.multiRemove(['token', 'usuario']);
        setToken(null);
        setUsuario(null);
    };

    const actualizarUsuario = (datosNuevos) => {
        const actualizado = { ...usuario, ...datosNuevos };
        setUsuario(actualizado);
        AsyncStorage.setItem('usuario', JSON.stringify(actualizado));
    };

    return (
        <AuthContexto.Provider value={{
            usuario,
            token,
            cargando,
            login,
            registro,
            cerrarSesion,
            actualizarUsuario,
            estaAutenticado: !!token,
        }}>
            {children}
        </AuthContexto.Provider>
    );
};

export const useAuth = () => {
    const contexto = useContext(AuthContexto);
    if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProveedor');
    return contexto;
};

export default AuthContexto;
