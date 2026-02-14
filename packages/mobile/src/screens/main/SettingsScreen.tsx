// packages/mobile/src/screens/main/SettingsScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { theme } from '../../theme/theme';
import { BackButton } from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();

  const [liveActivity, setLiveActivity] = useState(true);

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
            // AppNavigator will automatically show LoginScreen
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Location Services */}
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>Location Services</Text>
          <View style={styles.rightContent}>
            <Text style={styles.statusText}>ON</Text>
            <Text style={styles.arrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Live Activity Notifications */}
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Live Activity Notifications</Text>
          <Switch
            value={liveActivity}
            onValueChange={setLiveActivity}
            trackColor={{
              false: '#E5E5EA',
              true: '#FF3B30',
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Rewards */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('Rewards' as any)}
        >
          <Text style={styles.settingText}>Rewards</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Admin View */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('Admin' as any)}
        >
          <Text style={styles.settingText}>Admin View</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Log Out */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    paddingTop: 20,
    paddingLeft: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  settingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  arrow: {
    fontSize: 20,
    color: '#C7C7CC',
    fontWeight: '300',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
});