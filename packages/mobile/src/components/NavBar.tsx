// Horizontal icon bar for switching between transport mode screens (car, bus, shuttle, bike).
// Highlights the active mode and emits the selected screen via a callback.

import React from 'react';
import { View, StyleSheet, Image, Pressable, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Horizontal icon bar for switching between transport mode screens (car, bus, shuttle, bike).
// Highlights the active mode and emits the selected screen via a callback.

export type NavScreen = 'car' | 'bike' | 'bus' | 'train' | 'walk';

interface NavBarProps {
  currentScreen: NavScreen;
  onScreenChange: (screen: NavScreen) => void;
}

export default function NavBar({ currentScreen, onScreenChange }: NavBarProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const navItems: { screen: NavScreen; activeIcon: any; inactiveIcon: any, placeholder: number}[] = [
    {
        screen: 'car',
        activeIcon: require('../assets/icons/new/newCar.png'),
        inactiveIcon: require('../assets/icons/new/newCar.png'),
        placeholder: 1,
      },

    {
        screen: 'bus',
        activeIcon: require('../assets/icons/new/newBus.png'),
        inactiveIcon: require('../assets/icons/new/newBus.png'),
        placeholder: 2,
    },

    {
        screen: 'train',
        activeIcon: require('../assets/icons/new/newShuttle.png'),
        inactiveIcon: require('../assets/icons/new/newShuttle.png'),
        placeholder: 3,
    },

    {
      screen: 'bike',
      activeIcon: require('../assets/icons/new/newBike.png'),
      inactiveIcon: require('../assets/icons/new/newBike.png'),
      placeholder: 4,
    },

    // {
    //   screen: 'walk',
    //   activeIcon: require('../assets/walkActive.png'),
    //   inactiveIcon: require('../assets/walk.png'),
    // },
  ];

  return (
    <View>
    <View style={styles.iconBar}>
      {navItems.map((item) => {
        const isActive = currentScreen === item.screen && item.screen !== 'car';
        return (
            <Pressable
            key={item.screen}
            onPress={() => onScreenChange(item.screen)}
            style={styles.navItem}
          >
            <Image
              source={isActive ? item.activeIcon : item.inactiveIcon}
              style={[styles.icon, { tintColor: c.text.primary }]}
            />
            <Text style={[styles.placeholder, { color: c.text.primary }]}>{item.placeholder}</Text>
          </Pressable>
        );
      })}
      
    </View>

      <View style={[styles.divider, { backgroundColor: c.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBar: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
    paddingHorizontal: 30,

    // borderBottomWidth: 1,
    // borderBottomColor: '#555',
    // paddingBottom: 2,
  },
  icon: {
    width: 30,
    height: 30,
    // borderRadius: 40,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 40,
  },

  placeholder: {
    marginTop: 5,
    marginLeft: 10,
    fontSize: 15,
    color: '#00000',
  },
  divider: {
    height: 1,
    backgroundColor: '#555',
    marginHorizontal: 20,
    margin: 10,
  },
});
