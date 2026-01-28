import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
  ViewStyle,
} from 'react-native';

export type RadioOption = {
  id: string;
  // optional label for if we wanna show text in the future
  label?: string;
};

export interface RadioProps {
  options: RadioOption[];

  selectedId?: string;

  onSelect?: (id: string) => void;

  style?: ViewStyle;

  width?: number;
  height?: number;
}

export default function Radio({
  options,
  selectedId,
  onSelect,
  style,
  width = 60,
  height = 100,
}: RadioProps) {
  const handlePress = (id: string) => (e: GestureResponderEvent) => {
    onSelect?.(id);
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          width,
          height,
          borderRadius: 5,
        },
        style,
      ]}
      accessible
      accessibilityRole="radiogroup"
    >
      <View style={styles.inner}>
        {options.map(opt => {
          const selected = opt.id === selectedId;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={handlePress(opt.id)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={styles.optionTouch}
            >
              <View
                style={[
                  styles.radioOuter,
                  selected && styles.radioOuterSelected,
                ]}
              >
                {selected ? (
                  <View style={styles.radioInnerSelected} />
                ) : (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',

    padding: 6,

    backgroundColor: 'transparent',
  },

  inner: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',
  },

  optionTouch: {
    paddingVertical: 6,
  },

  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D9D9D9',
  },

  radioOuterSelected: {
    borderColor: '#1976F2',
  },

  radioInnerSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1976F2',
  },
});
