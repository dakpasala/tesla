import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface AnnouncementDropDownProps {
  onSelectOption?: (option: string) => void;
}

export default function AnnouncementDropDown({
  onSelectOption,
}: AnnouncementDropDownProps) {
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;

  const [announcementDropdownOpen, setAnnouncementDropdownOpen] =
    useState(false);

  const handleOptionSelect = (option: string) => {
    setAnnouncementDropdownOpen(false);
    onSelectOption?.(option);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => setAnnouncementDropdownOpen(v => !v)}
      >
        {/* Plus icon (SVG — perfectly centered) */}
        <Svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          stroke="#FFFFFF"
          strokeWidth={2}
          fill="none"
          style={styles.plusIcon}
        >
          <Path d="M12 5v14M5 12h14" />
        </Svg>

        <Text style={styles.buttonText}>Create announcement</Text>

        {/* Chevron */}
        <Svg
          width={15}
          height={15}
          viewBox="0 0 20 20"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1.5}
          style={[
            styles.chevronIcon,
            announcementDropdownOpen && styles.chevronIconRotated,
          ]}
        >
          {/* Down-facing by default */}
          <Path d="M6 9l6 6 6-6" />
        </Svg>
      </Pressable>

      {announcementDropdownOpen && (
        <View style={[styles.dropdownMenu, { backgroundColor: c.card }]}>
          <Pressable
            style={({ pressed }) => [
              styles.dropdownItem,
              { backgroundColor: c.card },
              pressed && { backgroundColor: c.backgroundAlt },
            ]}
            onPress={() => handleOptionSelect('All Shuttle Routes')}
          >
            <Text style={[styles.dropdownItemText, { color: c.text.primary }]}>All Shuttle Routes</Text>
          </Pressable>

          <View style={[styles.dropdownDivider, { backgroundColor: c.border }]} />

          <Pressable
            style={({ pressed }) => [
              styles.dropdownItem,
              { backgroundColor: c.card },
              pressed && { backgroundColor: c.backgroundAlt },
            ]}
            onPress={() => handleOptionSelect('Single Shuttle Route')}
          >
            <Text style={[styles.dropdownItemText, { color: c.text.primary }]}>Single Shuttle Route</Text>
          </Pressable>

          <View style={[styles.dropdownDivider, { backgroundColor: c.border }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },

  button: {
    width: '100%',
    minHeight: 31,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  plusIcon: {
    marginRight: 12,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    fontFamily: 'Inter',
  },

  chevronIcon: {
    marginLeft: 'auto',
    transformOrigin: '50% 50%', // 👈 fixes positional jump
    transform: [{ rotate: '0deg' }],
  },

  chevronIconRotated: {
    transform: [{ rotate: '180deg' }],
  },

  dropdownMenu: {
    width: '100%',
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },

  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },

  dropdownItemPressed: {
    backgroundColor: '#F5F5F5',
  },

  dropdownItemText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'Inter',
  },

  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
  },
});