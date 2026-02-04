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
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme/theme';
import { BackButton } from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAuth();

  const [liveActivity, setLiveActivity] = useState(true);
  const [notifications, setNotifications] = useState(true);

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
        {/* Rewards Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Rewards' as any)}
        >
          <LinearGradient
            colors={theme.gradients.darkCard}
            style={styles.rewardsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.rewardsContent}>
              <Text style={styles.rewardsLabel}>REWARDS</Text>
              <Text style={styles.rewardsValue}>150 Kg CO2e</Text>
              <Text style={styles.rewardsSub}>Total Saved</Text>
            </View>
            <View style={styles.rewardsIconContainer}>
              <Text style={styles.rewardsIcon}>🌿</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Notifications Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Live Activity Notifications</Text>
          <Switch
            value={liveActivity}
            onValueChange={setLiveActivity}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.status.success,
            }}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Engagement Rewards</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.status.success,
            }}
          />
        </View>

        {/* Admin View (Temp Entry) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ADMIN VIEW</Text>
        </View>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('Admin' as any)}
        >
          <Text style={styles.settingText}>Admin Home</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Account Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutRow}
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
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: theme.spacing.m,
  },
  backButton: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontWeight: '300',
  },
  headerTitle: {
    ...theme.typography.display,
    marginTop: theme.spacing.s,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  rewardsCard: {
    marginTop: 20,
    marginBottom: theme.spacing.xxl,
    borderRadius: 20,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsContent: {
    flex: 1,
  },
  rewardsLabel: {
    color: theme.colors.status.error,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    letterSpacing: 1,
  },
  rewardsValue: {
    color: theme.colors.white,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  rewardsSub: {
    ...theme.typography.sub,
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  rewardsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.components.rewards.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsIcon: {
    fontSize: 24,
  },
  sectionHeader: {
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
  },
  sectionTitle: {
    ...theme.typography.sectionHeader,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.l,
  },
  settingText: {
    ...theme.typography.listItem,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.l,
  },
  arrow: {
    fontSize: 20,
    color: theme.components.icon,
  },
  logoutRow: {
    paddingVertical: theme.spacing.l,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});