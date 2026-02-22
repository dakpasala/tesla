import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RideProvider } from './src/context/RideContext';
import { AuthProvider } from './src/context/AuthContext';
import { ShuttleNotificationProvider } from './src/context/ShuttleNotificationContext';
import SplashScreen from './src/components/SplashScreen';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsReady(true);
    }, 2000);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        {!isReady ? (
          <SplashScreen />
        ) : (
          <AuthProvider>
            <ShuttleNotificationProvider>
              <RideProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </RideProvider>
            </ShuttleNotificationProvider>
          </AuthProvider>
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}