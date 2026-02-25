import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { Colors } from '../utils/constants';

// Auth Screens
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// User Screens
import { HomeScreen } from '../screens/user/HomeScreen';
import { RoutinesScreen } from '../screens/user/RoutinesScreen';
import { AICoachScreen } from '../screens/user/AICoachScreen';
import { ProgressScreen } from '../screens/user/ProgressScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import { EditProfileScreen } from '../screens/user/EditProfileScreen';
import { SettingsScreen } from '../screens/user/SettingsScreen';

// Trainer Screens
import { TrainerDashboardScreen, TrainerClientsScreen, ClientDetailScreen } from '../screens/trainer/TrainerScreens';
import { TrainerMessagesScreen } from '../screens/trainer/TrainerMessagesScreen';

// Shared Screens
import { RoutineDetailScreen } from '../screens/shared/RoutineDetailScreen';
import { ActiveWorkoutScreen } from '../screens/shared/ActiveWorkoutScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const tabBarStyle = {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    height: 85,
    paddingBottom: 24,
    paddingTop: 8,
};

// ─── User Tab Navigator ───────────────────────────────────────────────────────
const UserTabs = () => (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle, tabBarActiveTintColor: Colors.primary, tabBarInactiveTintColor: Colors.textSecondary }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
        <Tab.Screen name="Routines" component={RoutinesScreen} options={{ tabBarLabel: 'Rutinas', tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" color={color} size={size} /> }} />
        <Tab.Screen name="AICoach" component={AICoachScreen} options={{ tabBarLabel: 'Coach IA', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
        <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progreso', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
);

// ─── Trainer Tab Navigator ────────────────────────────────────────────────
const TrainerTabs = () => (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle, tabBarActiveTintColor: Colors.primary, tabBarInactiveTintColor: Colors.textSecondary }}>
        <Tab.Screen name="TrainerDash" component={TrainerDashboardScreen} options={{ tabBarLabel: 'Panel', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />
        <Tab.Screen name="Clients" component={TrainerClientsScreen} options={{ tabBarLabel: 'Clientes', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} /> }} />
        <Tab.Screen name="TrainerRoutines" component={RoutinesScreen} options={{ tabBarLabel: 'Rutinas', tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" color={color} size={size} /> }} />
        <Tab.Screen name="Messages" component={TrainerMessagesScreen} options={{ tabBarLabel: 'Mensajes', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} /> }} />
        <Tab.Screen name="TrainerProfile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
);

// ─── Root Navigator ───────────────────────────────────────────────────────────
export const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading, user, initialize } = useAuthStore();

    useEffect(() => { initialize(); }, []);

    if (isLoading) return (
        <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={Colors.primary} size="large" />
        </View>
    );

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.background } }}>
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Splash" component={SplashScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="MainTabs" component={user?.role === 'trainer' ? TrainerTabs : UserTabs} />
                        <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
                        <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
                        <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
