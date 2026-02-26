import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Notification handler (runs while app is foregrounded) ───────────────────
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const PUSH_TOKEN_KEY = '@movo_push_token';
const NOTIF_ENABLED_KEY = '@movo_notifications_enabled';

// ─── Request permission + get Expo push token ────────────────────────────────
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    // Push notifications only work on real devices (not simulators/web)
    if (Platform.OS === 'web') {
        console.warn('[MOVO Notifications] Push notifications not supported on web.');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('[MOVO Notifications] Permission not granted.');
        return null;
    }

    // Android channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('movo-default', {
            name: 'MOVO — General',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
        });
        await Notifications.setNotificationChannelAsync('movo-workout', {
            name: 'MOVO — Recordatorios de entrenamiento',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
        });
    }

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'movo-app' });
        const token = tokenData.data;
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        return token;
    } catch {
        // Expected in Expo Go without a real EAS projectId — safe to ignore
        return null;
    }
}

// ─── Schedule a daily workout reminder ───────────────────────────────────────
export async function scheduleWorkoutReminder(hour = 9, minute = 0): Promise<void> {
    // Cancel any existing reminders first
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: '💪 ¡Hora de entrenar!',
            body: 'Mantén tu racha — tu rutina de hoy te espera en MOVO.',
            sound: 'default',
            data: { screen: 'Routines' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
        },
    });
    console.log(`[MOVO Notifications] Workout reminder set for ${hour}:${String(minute).padStart(2, '0')} daily`);
}

// ─── Cancel all scheduled reminders ─────────────────────────────────────────
export async function cancelWorkoutReminder(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[MOVO Notifications] All scheduled notifications cancelled');
}

// ─── Send an immediate local notification ────────────────────────────────────
export async function sendLocalNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default', data },
        trigger: null, // immediate
    });
}

// ─── Get / save notification preference ──────────────────────────────────────
export async function getNotificationsEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
    return val !== 'false'; // enabled by default
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
    if (enabled) {
        await scheduleWorkoutReminder();
    } else {
        await cancelWorkoutReminder();
    }
}

// ─── React hook for notification listeners ────────────────────────────────────
/**
 * Use in App.tsx or a root component to handle notification taps.
 * onNotificationResponse receives the notification when user taps it.
 */
export function useNotificationListeners(
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void,
) {
    const responseListener = useRef<Notifications.EventSubscription>();

    useEffect(() => {
        registerForPushNotificationsAsync();

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            onNotificationResponse?.(response);
        });

        return () => {
            responseListener.current?.remove();
        };
    }, []);
}
