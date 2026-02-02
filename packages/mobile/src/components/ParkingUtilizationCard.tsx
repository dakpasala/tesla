import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface ParkingUtilizationCardProps {
  title: string;
  percentage: number; // 0–100
  statusLabel: string;
  onEditPress?: () => void;
}

const SIZE = 140;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ParkingUtilizationCard({
  title,
  percentage,
  statusLabel,
  onEditPress,
}: ParkingUtilizationCardProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset =
    CIRCUMFERENCE - (CIRCUMFERENCE * clampedPercentage) / 100;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {/* Circular Progress */}
      <View style={styles.progressWrapper}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background ring */}
          <Circle
            stroke="#F0F0F0"
            fill="none"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
          />

          {/* Progress ring */}
          <Circle
            stroke="#4CAF50"
            fill="none"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            // rotation={-90}
            // originX={SIZE / 2}
            // originY={SIZE / 2}
          />
        </Svg>

        {/* Percentage text */}
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{clampedPercentage}%</Text>
        </View>
      </View>

      {/* Status pill */}
      <View style={styles.statusRow}>
        <Pressable
          style={styles.statusPill}
          onPress={onEditPress}
          disabled={!onEditPress}
        >
          <Text style={styles.statusText}>{statusLabel}</Text>

          {onEditPress && (
            <Svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#333333"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={styles.pencilIcon}
            >
              <Path d="M12 20h9" />
              <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </Svg>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },

  progressWrapper: {
    position: 'relative',
    marginVertical: 8,
  },

  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  percentageText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#4CAF50',
    fontFamily: 'Inter',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#E6B8B7',
    gap: 6,
  },

  pencilIcon: {
    marginLeft: 4,
  },

  statusText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#333333',
  },
});
