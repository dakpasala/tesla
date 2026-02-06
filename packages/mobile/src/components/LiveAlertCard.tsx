// packages/mobile/src/components/LiveAlertCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface LiveAlertCardProps {
  shuttleName: string;
  delayText: string;
  timeText: string;
  onPress?: () => void;
}

export default function LiveAlertCard({
  shuttleName,
  delayText,
  timeText,
  onPress,
}: LiveAlertCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={styles.card}
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
    >
      {/* 14 medium */}
      <Text style={styles.shuttleName} numberOfLines={1}>{shuttleName}</Text>
      {/* 12 regular */}
      <Text style={styles.delayText}>{delayText}</Text>
      {/* 12 regular */}
      <Text style={styles.timeText}>{timeText}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  // 14 medium
  shuttleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 3,
  },
  // 12 regular
  delayText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
    marginBottom: 2,
  },
  // 12 regular
  timeText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
});