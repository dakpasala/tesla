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
import ShuttleReportsScreen from '../screens/admin/ShuttleReportsScreen';
import ParkingManagementScreen from '../screens/admin/ParkingManagementScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { userId, isAdmin } = useAuth();

  // Show login screen if not authenticated
  if (!userId) {
    return <LoginScreen />;
  }

  // Admin users see ONLY admin screens
  if (isAdmin) {
    return (
      <Stack.Navigator
        initialRouteName="Admin"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Admin" component={AdminHomeScreen} />
        <Stack.Screen
          name="ShuttleDashboard"
          component={ShuttleDashboardScreen}
        />
        <Stack.Screen name="ShuttleReports" component={ShuttleReportsScreen} />
        <Stack.Screen
          name="ParkingManagement"
          component={ParkingManagementScreen}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    );
  }

  // Regular users see ONLY user screens (no Admin option)
  return (
    <Stack.Navigator
      initialRouteName="Map"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Rewards" component={RewardsScreen} />
    </Stack.Navigator>
  );
}