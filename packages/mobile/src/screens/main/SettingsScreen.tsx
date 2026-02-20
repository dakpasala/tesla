// packages/mobile/src/screens/main/SettingsScreen.tsx

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
  const { theme, setTheme } = useTheme();
  const [liveActivityEnabled, setLiveActivityEnabled] = useState(true);

  const isDarkMode = theme === 'dark';

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.item}>
          <Text style={styles.itemText}>Location Services</Text>
          <Text style={styles.statusText}>ON</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.item}>
          <Text style={styles.itemText}>Live Activity Notifications</Text>
          <Switch
            value={liveActivityEnabled}
            onValueChange={setLiveActivityEnabled}
            trackColor={{ false: '#E5E5E5', true: '#FF3B30' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E5E5"
          />
        </View>

        <View style={styles.item}>
          <Text style={styles.itemText}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: '#E5E5E5', true: '#FF3B30' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E5E5"
          />
        </View>

        {!isAdmin && (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Rewards')}
          >
            <Text style={styles.itemText}>Rewards</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFCFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { fontSize: 28, color: '#007AFF', fontWeight: '400' },
  title: { fontSize: 20, fontWeight: '600', color: '#1C1C1C' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  itemText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1C1C1C' },
  statusText: { fontSize: 14, color: '#8E8E93', marginRight: 8 },
  chevron: { fontSize: 20, color: '#C7C7CC' },
  logoutSection: { marginTop: 40 },
  logoutButton: { paddingVertical: 12 },
  logoutText: { fontSize: 14, fontWeight: '500', color: '#FF3B30' },
});
