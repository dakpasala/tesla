// packages/mobile/src/components/LocationBox.tsx

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface LocationBoxProps {
  currentLocation?: string;
  destination: string;
  style?: ViewStyle;
}

/**
 * A reusable component that displays the current location and destination
 * in a card format with appropriate icons.
 */
export function LocationBox({
  currentLocation = 'Current',
  destination,
  style,
}: LocationBoxProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        {/* Row 1: Current Location */}
        <View style={styles.rowItem}>
          <View style={styles.iconCol}>
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Circle cx={8} cy={8} r={6} fill="#007AFF" />
            </Svg>
          </View>
          <Text style={styles.locationText}>{currentLocation}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Row 2: Destination */}
        <View style={styles.rowItem}>
          <View style={styles.iconCol}>
            <Svg width={16} height={24} viewBox="0 0 16 24">
              <G translateY={-28}>
                <Path
                  d="M8 50 C8 50 14 44 14 39 C14 35.6863 11.3137 33 8 33 C4.68629 33 2 35.6863 2 39 C2 44 8 50 8 50 Z"
                  fill="#FF3B30"
                />
                <Circle cx={8} cy={39} r={2} fill="#FFF" />
              </G>
            </Svg>
          </View>
          <Text style={styles.locationText}>{destination}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 35,
    right: 35,
    zIndex: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconCol: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
});

export default LocationBox;
