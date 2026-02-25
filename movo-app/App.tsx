import 'react-native-gesture-handler';
import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainerRef } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useNotificationListeners } from './src/services/notifications';

function AppWithNotifications() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useNotificationListeners((response) => {
    // Navigate to the screen indicated in the notification data
    const screen = response.notification.request.content.data?.screen as string | undefined;
    if (screen && navigationRef.current) {
      try { navigationRef.current.navigate(screen as never); } catch { /* ignore */ }
    }
  });

  return (
    <>
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      <AppNavigator />
    </>
  );
}

export default AppWithNotifications;
