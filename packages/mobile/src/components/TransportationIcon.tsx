// Reusable icon component that renders a tinted transportation image (car, van, bus, bike).
// Adapts tint color to the active theme and accepts a configurable size and style prop.

import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export type TransportationType = 'car' | 'van' | 'bus' | 'bike';

type Props = {
  type: TransportationType;
  size?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

const ICONS: Record<TransportationType, any> = {
  car: require('../assets/images/transport_car.png'),
  van: require('../assets/images/transport_van.png'),
  bus: require('../assets/images/transport_bus.png'),
  bike: require('../assets/images/transport_bike.png'),
};

export default function TransportationIcon({
  type,
  size = 24,
  style,
  accessibilityLabel,
}: Props) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  return (
    <Image
      source={ICONS[type]}
      style={[{ width: size, height: size, tintColor: c.text.primary }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `${type} icon`}
    />
  );
}
