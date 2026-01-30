import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';

type Props = {
  size?: number;
  onPress?: () => void;
};

export function FavoriteIcon({ size = 18, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="button"
      accessibilityLabel="Favorite"
    >
      <Image
        source={require('../assets/images/fav_star.png')}
        style={{ width: size, height: size }}
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
