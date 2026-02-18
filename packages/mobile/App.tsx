import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RideProvider } from './src/context/RideContext';
import { AuthProvider } from './src/context/AuthContext';
import SplashScreen from './src/components/SplashScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { Button } from 'react-native';
import { View } from 'react-native';

function DevThemeToggle() {
  const { theme, preference, toggleTheme } = useTheme();

  useEffect(() => {
    console.log('Current theme:', theme, 'Preference:', preference);
  }, [theme, preference]);

  return (
    <Button
      title="Toggle Theme (Dev)"
      onPress={() => {
        console.log('DEV BUTTON PRESSED');
        toggleTheme();
      }}
    />
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsReady(true);
    }, 2000);
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <View style={{ position: 'absolute', top: 60, right: 20, zIndex: 999 }}>
          <DevThemeToggle />
        </View>
        <AuthProvider>
          <RideProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </RideProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
