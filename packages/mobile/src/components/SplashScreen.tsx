// packages/mobile/src/components/SplashScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SplashScreen() {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Tesla Logo */}
      <Image
        source={require('../assets/teslaicon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.title, { color: c.text.primary }]}>Tesla</Text>
      <Text style={[styles.subtitle, { color: c.text.secondary }]}>Trip Planner</Text>
      
      <ActivityIndicator 
        size="large" 
        color="#E82127" 
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});