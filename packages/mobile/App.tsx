import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RideProvider } from './src/context/RideContext';
import { AuthProvider } from './src/context/AuthContext';
import SplashScreen from './src/components/SplashScreen';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization (fonts, assets, etc.)
    setTimeout(() => {
      setIsReady(true);
    }, 2000); // Show splash for 2 seconds
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RideProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </RideProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}