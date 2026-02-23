import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import PantallaLogin from '../pantallas/PantallaLogin';
import PantallaRegistro from '../pantallas/PantallaRegistro';
import PantallaInicio from '../pantallas/PantallaInicio';
import PantallaAnadirHabito from '../pantallas/PantallaAnadirHabito';
import PantallaEstadisticas from '../pantallas/PantallaEstadisticas';
import PantallaPerfil from '../pantallas/PantallaPerfil';
import { colores, sombraFuerte, radio } from '../estilos/tema';

const PilaAuth = createStackNavigator();
const PestanasApp = createBottomTabNavigator();
const PilaInicio = createStackNavigator();

// Pila: Inicio → Añadir Hábito
const PilaInicioNav = () => (
    <PilaInicio.Navigator screenOptions={{ headerShown: false }}>
        <PilaInicio.Screen name="ListaHabitos" component={PantallaInicio} />
        <PilaInicio.Screen
            name="AñadirHabito"
            component={PantallaAnadirHabito}
            options={({ navigation }) => ({
                headerShown: true,
                title: 'Nuevo hábito',
                headerStyle: {
                    backgroundColor: colores.fondo,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 0,
                },
                headerTintColor: colores.primario,
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 16 }}>
                        <Ionicons name="chevron-back" size={26} color={colores.primario} />
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
                    Estadísticas: focused ? 'stats-chart' : 'stats-chart-outline',
                    Perfil: focused ? 'person' : 'person-outline',
                };
                return (
                    <View style={focused ? {
                        backgroundColor: colores.primarioSuave,
                        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
                    } : {}}>
                        <Ionicons name={iconos[route.name] || 'help'} size={22} color={color} />
                    </View>
                );
            },
            tabBarActiveTintColor: colores.primario,
            tabBarInactiveTintColor: colores.textoTenue,
            tabBarStyle: {
                backgroundColor: '#FFFFFF',
                borderTopWidth: 0,
                ...sombraFuerte,
                shadowOpacity: 0.06,
                height: Platform.OS === 'ios' ? 88 : 65,
                paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                paddingTop: 8,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                position: 'absolute',
            },
            tabBarLabelStyle: {
                fontWeight: '600', fontSize: 11, marginTop: 2,
            },
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
