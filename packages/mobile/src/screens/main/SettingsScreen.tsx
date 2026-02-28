// packages/mobile/src/screens/main/SettingsScreen.tsx

// Screen for managing user preferences including location, notifications, and appearance.
// Allows users to toggle dark mode, live activity notifications, and access rewards.
// Admins see a reduced menu without the Rewards option.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { logout, isAdmin } = useAuth();
  const { theme, activeTheme, setTheme } = useTheme();
  const [liveActivityEnabled, setLiveActivityEnabled] = useState(true);

  const isDark = theme === 'dark';

  const c = activeTheme.colors;
  const components = activeTheme.components;

  const handleDarkModeToggle = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: c.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: c.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text.primary }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.item, { borderBottomColor: c.border }]}
        >
          <Text style={[styles.itemText, { color: c.text.primary }]}>
            Location Services
          </Text>
          <Text style={[styles.statusText, { color: c.text.secondary }]}>
            ON
          </Text>
          <Text style={[styles.chevron, { color: components.icon }]}>›</Text>
        </TouchableOpacity>

        <View style={[styles.item, { borderBottomColor: c.border }]}>
          <Text style={[styles.itemText, { color: c.text.primary }]}>
            Live Activity Notifications
          </Text>
          <Switch
            value={liveActivityEnabled}
            onValueChange={setLiveActivityEnabled}
            trackColor={{ false: c.border, true: c.status.error }}
            thumbColor={c.white}
            ios_backgroundColor={c.border}
          />
        </View>

        <View style={[styles.item, { borderBottomColor: c.border }]}>
          <Text style={[styles.itemText, { color: c.text.primary }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: c.border, true: c.status.error }}
            thumbColor={c.white}
            ios_backgroundColor={c.border}
          />
        </View>

        {!isAdmin && (
          <TouchableOpacity
            style={[styles.item, { borderBottomColor: c.border }]}
            onPress={() => navigation.navigate('Rewards')}
          >
            <Text style={[styles.itemText, { color: c.text.primary }]}>
              Rewards
            </Text>
            <Text style={[styles.chevron, { color: components.icon }]}>›</Text>
          </TouchableOpacity>
        )}

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={[styles.logoutText, { color: c.status.error }]}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { fontSize: 28, fontWeight: '400' },
  title: { fontSize: 20, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: { flex: 1, fontSize: 14, fontWeight: '500' },
  statusText: { fontSize: 14, marginRight: 8 },
  chevron: { fontSize: 20 },
  logoutSection: { marginTop: 40 },
  logoutButton: { paddingVertical: 12 },
  logoutText: { fontSize: 14, fontWeight: '500' },
});
