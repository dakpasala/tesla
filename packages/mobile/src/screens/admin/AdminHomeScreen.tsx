// packages/mobile/src/screens/admin/AdminHomeScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';
import { BackButton } from '../../components/BackButton';
import { getShuttleReportsCount } from '../../services/shuttleAlerts';
import { getFullLotsCount } from '../../services/parkings';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AdminHomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [shuttleReportsCount, setShuttleReportsCount] = useState(0);
  const [fullLotsCount, setFullLotsCount] = useState(0);

  // Fetch shuttle reports count
  useEffect(() => {
    async function fetchReportCount() {
      try {
        const count = await getShuttleReportsCount();
        setShuttleReportsCount(count);
      } catch (err) {
        console.error('Failed to fetch shuttle reports count:', err);
      }
    }
    fetchReportCount();

    const interval = setInterval(fetchReportCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch full lots count
  useEffect(() => {
    async function fetchFullLots() {
      try {
        const count = await getFullLotsCount();
        setFullLotsCount(count);
      } catch (err) {
        console.error('Failed to fetch full lots count:', err);
      }
    }
    fetchFullLots();

    const interval = setInterval(fetchFullLots, 30000);
    return () => clearInterval(interval);
  }, []);

  const MENU_ITEMS = [
    {
      id: 'shuttle',
      title: 'Shuttle Dashboard',
      subtitle: `${shuttleReportsCount} NEW REPORTS`,
      icon: '🚌',
      route: 'ShuttleDashboard',
      badge: shuttleReportsCount > 0 ? shuttleReportsCount : undefined,
    },
    {
      id: 'parking',
      title: 'Parking Management',
      subtitle: `${fullLotsCount} SUBLOTS FULL`,
      icon: '🅿️',
      route: 'ParkingManagement',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton style={styles.backButton} />
          <View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.userName}>Amanda</Text>
          </View>
        </View>
        <Image
          source={{ uri: 'https://via.placeholder.com/40' }}
          style={styles.profileImage}
        />
      </View>

      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>+ Create new announcement</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => {
                if (item.route) {
                  // @ts-ignore - dynamic nav
                  navigation.navigate(item.route);
                }
              }}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{item.icon}</Text>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>N</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ddd',
  },
  createButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'column',
    gap: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: '#C7C7CC',
    marginLeft: 8,
  },
});
