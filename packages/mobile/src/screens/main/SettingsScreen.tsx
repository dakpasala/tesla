import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme/theme';
import { BackButton } from '../../components/BackButton';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [liveActivity, setLiveActivity] = useState(true);
  const [notifications, setNotifications] = useState(true);

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
          onPress={() => navigation.navigate('Rewards' as any)} // Temporary cast until types updated
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
    paddingHorizontal: theme.spacing.xl, // 20 -> xl is 24, l is 16. Let's use 20 if we want consistency or stick to theme. User had 20. Closest is xl (24) or l+s (20). Let's use 20 hardcoded for now or define a new spacing?
    // Actually, theme.spacing.xl is 24 on line 52 of theme.ts. theme.spacing.l is 16.
    // Let's just use 20 explicitly or update theme? I'll use 20 for now to match exactly, or use theme.spacing.xl (24) for better alignment.
    // I'll stick to user's 20 for safety, but maybe update theme later.
    paddingVertical: theme.spacing.m, // 12
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
    marginBottom: theme.spacing.xxl, // 32
    borderRadius: 20,
    padding: theme.spacing.xl, // 24
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
    marginBottom: theme.spacing.xs, // 4
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
    fontSize: 14, // Override theme 13
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
    paddingVertical: theme.spacing.l, // 16
  },
  settingText: {
    ...theme.typography.listItem,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.l, // 16
  },
  arrow: {
    fontSize: 20,
    color: theme.components.icon,
  },
});
