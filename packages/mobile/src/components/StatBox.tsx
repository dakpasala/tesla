// packages/mobile/src/components/StatBox.tsx

import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface StatBoxProps {
  value: string | number;
  label: string;
  onPress?: () => void;
  variant?: 'light' | 'dark';
  active?: boolean;
}

export default function StatBox({
  value,
  label,
  onPress,
  variant = 'light',
  active = false,
}: StatBoxProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const isDark = variant === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.box,
        {
          backgroundColor: isDark ? '#1C1C1E' : active ? '#F2F8FF' : c.backgroundAlt,
          borderColor: active ? '#007AFF' : 'transparent',
          borderWidth: active ? 1 : 0,
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text
        style={[
          styles.value,
          { color: isDark ? '#fff' : c.text.primary },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          { color: isDark ? '#A0A0A5' : active ? '#007AFF' : c.text.secondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  // 20 bold
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  // 11 medium
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },
});