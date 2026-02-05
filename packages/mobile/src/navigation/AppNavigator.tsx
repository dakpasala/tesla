import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';

// Auth Screen
import LoginScreen from '../screens/auth/LoginScreen';

// Main App Screens
import {
  MapScreen,
  FavoritesScreen,
  RewardsScreen,
  SettingsScreen,
} from '../screens/main';

// Admin Screens
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import ShuttleDashboardScreen from '../screens/admin/ShuttleDashboardScreen';
import LiveAlertsScreen from '../screens/admin/LiveAlertsScreen';
import ParkingManagementScreen from '../screens/admin/ParkingManagementScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { userId } = useAuth();

  // Show login screen if not authenticated
  if (!userId) {
    return <LoginScreen />;
  }

  // Show main app if authenticated
  return (
    <Stack.Navigator
      initialRouteName="Map"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main App Screens */}
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Rewards" component={RewardsScreen} />

      {/* Admin Screens (Unprotected for now) */}
      <Stack.Screen name="Admin" component={AdminHomeScreen} />
      <Stack.Screen
        name="ShuttleDashboard"
        component={ShuttleDashboardScreen}
      />
      <Stack.Screen name="LiveAlerts" component={LiveAlertsScreen} />
      <Stack.Screen
        name="ParkingManagement"
        component={ParkingManagementScreen}
      />
    </Stack.Navigator>
  );
}
