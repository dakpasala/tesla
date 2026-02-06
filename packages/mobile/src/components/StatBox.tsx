// packages/mobile/src/components/StatBox.tsx

import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

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
  const isDark = variant === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.box,
        {
          backgroundColor: isDark ? '#1C1C1E' : active ? '#000000' : '#F2F2F7',
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text
        style={[
          styles.value,
          { color: isDark ? '#fff' : active ? '#FFFFFF' : '#000' },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          { color: isDark ? '#A0A0A5' : active ? '#D1D1D6' : '#8E8E93' },
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
