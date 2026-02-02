import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import LinearGradient from 'react-native-linear-gradient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [liveActivity, setLiveActivity] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
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
            colors={['#000', '#222']}
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
            trackColor={{ false: '#E5E5E5', true: '#34C759' }}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Engagement Rewards</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#E5E5E5', true: '#34C759' }}
          />
        </View>

        {/* Admin View (Temp Entry) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ADMIN VIEW</Text>
        </View>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('AdminHome' as any)}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    fontSize: 24,
    color: '#000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
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
    marginBottom: 32,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsContent: {
    flex: 1,
  },
  rewardsLabel: {
    color: '#FF3B30', // Red/Orange tint for label
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  rewardsValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  rewardsSub: {
    color: '#8E8E93',
    fontSize: 14,
  },
  rewardsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsIcon: {
    fontSize: 24,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingText: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginLeft: 16, // Indented divider
  },
  arrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
});
