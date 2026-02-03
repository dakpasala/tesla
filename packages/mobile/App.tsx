import React from 'react';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RideProvider } from './src/context/RideContext';
import { runLocationTest } from './scripts/testLocation';


export default function App() {
  // useEffect(() => {
  //   if (__DEV__) {
  //     runLocationTest();
  //   }
  // }, []);
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
