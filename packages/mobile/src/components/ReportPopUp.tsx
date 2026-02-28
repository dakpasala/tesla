// packages/mobile/src/components/ReportPopUp.tsx

// Pill-style option selector used inside report flows to let users pick a report category.
// Supports both column and wrapping flex layouts with a controlled or uncontrolled selection state.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export type ReportPopupOption = {
  id: string;
  label: string;
};

export interface ReportPopupInputsProps {
  options: ReportPopupOption[];

  selectedId?: string;

  onSelect?: (option: ReportPopupOption) => void;

  style?: ViewStyle;

  layout?: 'column' | 'wrap';

  disabled?: boolean;
}

export default function ReportPopupInputs({
  options,
  selectedId,
  onSelect,
  style,
  layout = 'column',
  disabled = false,
}: ReportPopupInputsProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  return (
    <View
      style={[
        styles.container,
        layout === 'wrap' ? styles.wrap : styles.column,
        style,
      ]}
    >
      {options.map(opt => {
        const isSelected = opt.id === selectedId;

        return (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.75}
            onPress={() => !disabled && onSelect?.(opt)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled }}
            accessibilityLabel={opt.label}
            style={[
              styles.pill,
              isSelected
                ? [
                    styles.pillSelected,
                    { backgroundColor: c.backgroundAlt, borderColor: c.border },
                  ]
                : [
                    styles.pillUnselected,
                    { backgroundColor: c.card, borderColor: c.border },
                  ],
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: c.text.primary },
                isSelected ? styles.pillTextSelected : null,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const PILL_BASE: ViewStyle = {
  borderRadius: 14,
  paddingHorizontal: 18,
  paddingVertical: 10,
  alignSelf: 'flex-start',
};

const TEXT_BASE: TextStyle = {
  color: '#111',
  fontSize: 21,
  lineHeight: 24,
  fontWeight: '500',
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  column: {
    flexDirection: 'column',
    gap: 18,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  pill: {
    ...PILL_BASE,
  },
  pillUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADADA',
  },
  pillSelected: {
    backgroundColor: '#EDEDED',
    borderWidth: 0,
  },

  pillText: {
    ...TEXT_BASE,
  },
  pillTextSelected: {
    color: '#111',
  },
});
