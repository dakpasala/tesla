// packages/mobile/src/components/ShuttleListItem.tsx

// Reusable list row displaying a shuttle or report entry with title, subtitle, status dot, and optional right text.
// Supports an optional press handler and a hairline separator between items.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type StatusColor = 'green' | 'red' | 'orange' | 'blue' | 'grey';

interface ShuttleListItemProps {
  title: string;
  subtitle: string;
  statusColor?: StatusColor;
  rightText?: string;
  onPress?: () => void;
  showSeparator?: boolean;
}

const STATUS_COLORS: Record<StatusColor, string> = {
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  blue: '#007AFF',
  grey: '#8E8E93',
};

export default function ShuttleListItem({
  title,
  subtitle,
  statusColor = 'green',
  rightText,
  onPress,
  showSeparator = true,
}: ShuttleListItemProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <>
      <Wrapper
        style={styles.container}
        {...(onPress ? { onPress, activeOpacity: 0.6 } : {})}
      >
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: c.text.primary }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.subtitle, { color: c.text.secondary }]} numberOfLines={1}>{subtitle}</Text>
        </View>
        <View style={styles.rightContainer}>
          {rightText ? <Text style={[styles.rightText, { color: c.text.secondary }]}>{rightText}</Text> : null}
          <View
            style={[styles.statusDot, { backgroundColor: STATUS_COLORS[statusColor] }]}
          />
        </View>
      </Wrapper>
      {showSeparator && <View style={[styles.separator, { backgroundColor: c.border }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  // 14 medium
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  // 12 regular
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 3,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D1D1D6',
    marginLeft: 4,
  },
});
