// packages/mobile/src/components/ParkingUtilizationCard.tsx

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface ParkingUtilizationCardProps {
  title: string;
  percentage: number;
  statusLabel: string;
  onEditPress?: () => void;
}

// DIMENSIONS FROM SCREENSHOT
const CARD_WIDTH = 97;
const CARD_HEIGHT = 93.67;
const SIZE = 50; // Scaled down for the new card size
const STROKE_WIDTH = 6;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ParkingUtilizationCard({
  title,
  percentage,
  statusLabel,
  onEditPress,
}: ParkingUtilizationCardProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * clampedPercentage) / 100;

  // Determine color based on fullness
  const getStrokeColor = () => {
    if (percentage >= 90) return '#FF3B30'; // Red
    if (percentage >= 75) return '#FFCC00'; // Yellow/Orange
    return '#4CAF50'; // Green
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {onEditPress && (
          <Pressable onPress={onEditPress}>
             <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={2}>
                <Path d="M12 20h9" /><Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
             </Svg>
          </Pressable>
        )}
      </View>

      <View style={styles.progressWrapper}>
        <Svg width={SIZE} height={SIZE}>
          <Circle stroke="#F0F0F0" fill="none" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE_WIDTH} />
          <Circle
            stroke={getStrokeColor()}
            fill="none"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.percentageContainer}>
          <Text style={[styles.percentageText, { color: getStrokeColor() }]}>
            {percentage >= 100 ? 'FULL' : `${clampedPercentage}%`}
          </Text>
        </View>
      </View>

      <View style={[styles.statusPill, { backgroundColor: percentage >= 90 ? '#FFEBEB' : '#F0F0F0' }]}>
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 9,
    fontWeight: '400',
    color: '#8E8E93',
    flex: 1,
  },
  progressWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontStyle: 'italic',
    color: '#333333',
  },
});