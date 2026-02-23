import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import PantallaLogin from '../pantallas/PantallaLogin';
import PantallaRegistro from '../pantallas/PantallaRegistro';
import PantallaInicio from '../pantallas/PantallaInicio';
import PantallaAnadirHabito from '../pantallas/PantallaAnadirHabito';
import PantallaEstadisticas from '../pantallas/PantallaEstadisticas';
import PantallaPerfil from '../pantallas/PantallaPerfil';
import { colores } from '../estilos/tema';

const PilaAuth = createStackNavigator();
const PestanasApp = createBottomTabNavigator();
const PilaInicio = createStackNavigator();

// Pila: Inicio → Añadir Hábito
const PilaInicioNav = () => (
    <PilaInicio.Navigator>
        <PilaInicio.Screen
            name="ListaHabitos"
            component={PantallaInicio}
            options={{ headerShown: false }}
        />
        <PilaInicio.Screen
            name="AñadirHabito"
            component={PantallaAnadirHabito}
            options={({ navigation }) => ({
                title: 'Nuevo hábito',
                headerStyle: { backgroundColor: '#fff' },
                headerTintColor: colores.primario,
                headerTitleStyle: { fontWeight: '700' },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 16 }}>
                        <Ionicons name="arrow-back" size={24} color={colores.primario} />
                    </TouchableOpacity>
                ),
            })}
        />
    </PilaInicio.Navigator>
);

// Pestañas principales
export const NavegacionPrincipales = () => (
    <PestanasApp.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                const iconos = {
                    Inicio: focused ? 'home' : 'home-outline',
                    Estadísticas: focused ? 'bar-chart' : 'bar-chart-outline',
                    Perfil: focused ? 'person' : 'person-outline',
                };
                return <Ionicons name={iconos[route.name] || 'help'} size={size} color={color} />;
            },
            tabBarActiveTintColor: colores.primario,
            tabBarInactiveTintColor: colores.textoTenue,
            tabBarStyle: {
                backgroundColor: '#fff',
                borderTopWidth: 0,
                elevation: 12,
                shadowColor: '#6C63FF',
                shadowOpacity: 0.1,
                shadowRadius: 12,
                height: 60,
                paddingBottom: 8,
            },
            tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
            headerShown: false,
        })}
    >
        <PestanasApp.Screen name="Inicio" component={PilaInicioNav} />
        <PestanasApp.Screen name="Estadísticas" component={PantallaEstadisticas} />
        <PestanasApp.Screen name="Perfil" component={PantallaPerfil} />
    </PestanasApp.Navigator>
);

// Pila de autenticación
export const NavegacionAuth = () => (
    <PilaAuth.Navigator screenOptions={{ headerShown: false }}>
        <PilaAuth.Screen name="Login" component={PantallaLogin} />
        <PilaAuth.Screen name="Registro" component={PantallaRegistro} />
    </PilaAuth.Navigator>
);
