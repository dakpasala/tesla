// Reusable chevron back button that calls navigation.goBack() or a custom onPress handler.
// Stroke color adapts to the active theme or can be overridden via a prop.

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}

export const BackButton = ({ onPress, color, style }: BackButtonProps) => {
  const navigation = useNavigation();
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        console.warn('No screen to go back to');
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M15 19L8 12L15 5"
          stroke={color || c.text.secondary} // Uses theme secondary color, falls back to prop if provided
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30, // consistent touch target
    height: 30,
  },
});
