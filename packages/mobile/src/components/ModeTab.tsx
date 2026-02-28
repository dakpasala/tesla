// Renders a pressable image-based tab that switches between selected and default icon states.
// Used in transport mode selectors where each mode is represented by an asset image.
// no dark mode

import React from 'react';
import { Image, ImageStyle, StyleProp, TouchableOpacity } from 'react-native';

type Props = {
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ImageStyle>;
};

export default function ModeTab({ selected = false, onPress, style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel="Mode tab"
    >
      <Image
        source={
          selected
            ? require('../assets/images/mode_tab_selected.png')
            : require('../assets/images/mode_tab_default.png')
        }
        style={style}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}
