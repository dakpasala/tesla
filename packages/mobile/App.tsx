import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RideProvider } from './src/context/RideContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RideProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </RideProvider>
    </GestureHandlerRootView>
  );
}
