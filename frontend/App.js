import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProveedor, useAuth } from './src/contexto/AuthContexto';
import { NavegacionAuth, NavegacionPrincipales } from './src/navegacion/Navegacion';
import { colores } from './src/estilos/tema';

// Componente raíz que decide qué navegación mostrar
const RaizApp = () => {
    const { estaAutenticado, cargando } = useAuth();

    if (cargando) {
        return (
            <View style={estilos.cargando}>
                <ActivityIndicator size="large" color={colores.primario} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <StatusBar style="dark" />
            {estaAutenticado ? <NavegacionPrincipales /> : <NavegacionAuth />}
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProveedor>
                <RaizApp />
            </AuthProveedor>
        </GestureHandlerRootView>
    );
}

const estilos = StyleSheet.create({
    cargando: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colores.fondo,
    },
});
