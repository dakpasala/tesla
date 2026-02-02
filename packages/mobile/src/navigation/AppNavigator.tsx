import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

// Main App Screens
import {
  MainHomeScreen,
  RoutesScreen,
  DirectionsScreen,
  FavoritesScreen,
  ProfileScreen,
  SettingsScreen,
  ParkingScreen,
} from '../screens/main';

// Note: Legacy screens are preserved in src/screens/ but not included in navigation
// - HomeScreen.tsx (original home with Modalize)
// - MapScreen.tsx
// - Car.tsx, Bike.tsx, Bus.tsx, Train.tsx, Walk.tsx (transport mode screens)
// - ProfileScreen.tsx, SettingsScreen.tsx (original versions)
// - TimeSelectorScreen.tsx (time picker modal)

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainHome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main App Screens */}
      <Stack.Screen name="MainHome" component={MainHomeScreen} />
      <Stack.Screen name="Routes" component={RoutesScreen} />
      <Stack.Screen name="Directions" component={DirectionsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Parking" component={ParkingScreen} />
    </Stack.Navigator>
  );
}
