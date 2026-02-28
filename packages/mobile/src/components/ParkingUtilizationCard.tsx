// Renders a compact card showing parking lot utilization as a circular progress ring.
// Supports status overrides (e.g. Full, Closed) and color-coded availability indicators.

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface ParkingUtilizationCardProps {
  title: string;
  percentage: number;
  statusLabel: string;
  isStatusOnly?: boolean;
  onEditPress?: () => void;
}

const SIZE = 50; 
const STROKE_WIDTH = 6;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ParkingUtilizationCard({
  title,
  percentage,
  statusLabel,
  isStatusOnly = false,
  onEditPress,
}: ParkingUtilizationCardProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * clampedPercentage) / 100;
  
  // Decide if we show "Full" text inside ring
  const isFull = statusLabel === 'FULL' || percentage >= 100;

  const getStrokeColor = () => {
    if (isStatusOnly) return '#4CAF50'; 
    if (isFull || percentage >= 90) return '#FF3B30'; 
    if (percentage >= 75) return '#FFCC00'; 
    return '#4CAF50'; 
  };

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text.secondary }]} numberOfLines={1}>{title}</Text>
        {onEditPress && (
          <Pressable onPress={onEditPress}>
             <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={c.text.secondary} strokeWidth={2}>
                <Path d="M12 20h9" /><Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
             </Svg>
          </Pressable>
        )}
      </View>

      <View style={styles.progressWrapper}>
        {/* ONLY DRAW RING IF NOT STATUS ONLY */}
        {!isStatusOnly ? (
          <Svg width={SIZE} height={SIZE}>
            <Circle stroke={c.border} fill="none" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE_WIDTH} />
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
        ) : (
          <View style={{ width: SIZE, height: SIZE }} />
        )}

        <View style={styles.percentageContainer}>
          <Text style={[styles.percentageText, { color: getStrokeColor() }]}>
            {isStatusOnly ? '0%' : isFull ? 'Full' : `${clampedPercentage}%`}
          </Text>
        </View>
      </View>

      <View style={[
        styles.statusPill, 
        { backgroundColor: isStatusOnly ? '#E6B8B7' : (isFull || percentage >= 90 ? '#FFEBEB' : c.backgroundAlt) }
      ]}>
        <Text style={[styles.statusText, { color: c.text.primary }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 97, height: 93.67, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 5, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 9, fontWeight: '400', color: '#8E8E93', flex: 1 },
  progressWrapper: { position: 'relative', justifyContent: 'center', alignItems: 'center', height: SIZE },
  percentageContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  percentageText: { fontSize: 10, fontWeight: '600' },
  statusPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, minWidth: '100%', alignItems: 'center' },
  statusText: { fontSize: 8, fontStyle: 'italic', color: '#333333' },
});