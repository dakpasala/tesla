import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Props = {
  size?: number;
  onPress?: () => void;
};

export function FavoriteIcon({ size = 18, onPress }: Props) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="button"
      accessibilityLabel="Favorite"
    >
      <Image
        source={require('../assets/images/fav_star.png')}
        style={{ width: size, height: size, tintColor: c.text.primary }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});