import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StatCard {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  screen: keyof RootStackParamList;
}

const STATS: StatCard[] = [
  {
    id: '1',
    title: 'Active Users',
    value: '2,451',
    change: '+12%',
    isPositive: true,
  },
  {
    id: '2',
    title: 'Trips Today',
    value: '847',
    change: '+5%',
    isPositive: true,
  },
  {
    id: '3',
    title: 'Parking Usage',
    value: '78%',
    change: '-3%',
    isPositive: false,
  },
  {
    id: '4',
    title: 'Avg Commute',
    value: '32 min',
    change: '-8%',
    isPositive: true,
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { id: '1', title: 'Manage Users', icon: '👥', screen: 'AdminUsers' },
  { id: '2', title: 'Parking Control', icon: '🅿️', screen: 'AdminParking' },
  { id: '3', title: 'Send Alerts', icon: '📢', screen: 'AdminAlerts' },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Admin Badge */}
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeIcon}>🔐</Text>
          <View>
            <Text style={styles.adminBadgeTitle}>Administrator Access</Text>
            <Text style={styles.adminBadgeSubtitle}>
              Full system permissions
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {STATS.map(stat => (
            <View key={stat.id} style={styles.statCard}>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text
                style={[
                  styles.statChange,
                  stat.isPositive ? styles.statPositive : styles.statNegative,
                ]}
              >
                {stat.change}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen as any)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <Text style={styles.activityDot}>●</Text>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>
                Parking alert sent to Lot B users
              </Text>
              <Text style={styles.activityTime}>2 minutes ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityDot}>●</Text>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>
                New user registered: jane.smith@tesla.com
              </Text>
              <Text style={styles.activityTime}>15 minutes ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityDot}>●</Text>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>Lot C marked as full</Text>
              <Text style={styles.activityTime}>1 hour ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 24,
    color: '#111',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 24,
  },
  adminBadgeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  adminBadgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  adminBadgeSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  statTitle: {
    fontSize: 13,
    color: '#666',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginTop: 4,
  },
  statChange: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  statPositive: {
    color: '#34A853',
  },
  statNegative: {
    color: '#EA4335',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  actionArrow: {
    fontSize: 18,
    color: '#999',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityDot: {
    fontSize: 8,
    color: '#4285F4',
    marginRight: 12,
    marginTop: 6,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#111',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
