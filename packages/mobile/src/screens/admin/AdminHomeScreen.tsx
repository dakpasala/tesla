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
import AnnouncementDropDown from '../../components/AnnouncementDropdown';

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

  // ... (existing imports)

  // ... (inside component)
  const MENU_ITEMS = [
    {
      id: 'shuttle',
      title: 'Shuttle Dashboard',
      subtitle: `${shuttleReportsCount} NEW REPORTS`,
      // icon: '🚌', // OLD
      image: require('../../assets/icons/new/newShuttle.png'),
      route: 'ShuttleDashboard',
      badge: shuttleReportsCount > 0 ? shuttleReportsCount : undefined,
    },
    {
      id: 'parking',
      title: 'Parking Management',
      subtitle: `${fullLotsCount} SUBLOTS FULL`,
      // icon: '🅿️', // OLD
      // Using newCar as proxy for parking or if we have a parking icon.
      // checked assets: new/newCar.png exists.
      image: require('../../assets/icons/new/newCar.png'),
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

      <View style={{ paddingHorizontal: 20, marginBottom: 24, zIndex: 100 }}>
        <AnnouncementDropDown
          onSelectOption={opt => console.log('Selected', opt)}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              activeOpacity={0.7}
              onPress={() => {
                if (item.route) {
                  // @ts-ignore - dynamic nav
                  navigation.navigate(item.route);
                }
              }}
            >
              <View style={styles.iconContainer}>
                <Image
                  source={item.image}
                  style={{ width: 28, height: 28, resizeMode: 'contain' }}
                />
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
              {/* Chevron SVG or text */}
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
    backgroundColor: '#F9F9F9', // Matches dashboard
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
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
    color: '#8E8E93',
    fontWeight: '400',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'column',
    gap: 12,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',

    // Polished shadow matches Dashboard cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15, // slightly more refined
    fontWeight: '600',
    color: '#000',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 12, // match dashboard text size
    color: '#8E8E93',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    color: '#C7C7CC',
    marginLeft: 8,
    marginTop: -2, // visual alignment
  },
});
