import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Props = {
  text?: string;
  style?: ViewStyle;
};

export function LotWarnings({ text = 'Closed', style }: Props) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  return (
    <View style={[styles.row, style]}>
      <Image
        source={require('../assets/images/lot_warning_close.png')}
        style={[styles.icon, { tintColor: c.text.primary }]}
        resizeMode="contain"
      />
      <Text style={[styles.text, { color: c.text.primary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 6,
    height: 6,
    marginRight: 6,
  },
  text: {
    fontSize: 6,
    lineHeight: 6,
    color: '#333333',
    fontWeight: '400',
  },
});