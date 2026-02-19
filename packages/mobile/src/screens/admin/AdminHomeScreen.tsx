// packages/mobile/src/screens/admin/AdminHomeScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
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
import { Modalize } from 'react-native-modalize';
import { getShuttleReportsCount } from '../../services/shuttleAlerts';
import { getFullLotsCount } from '../../services/parkings';
import AnnouncementDropDown from '../../components/AnnouncementDropdown';
import CreateNewAnnouncement from '../../components/CreateNewAnnouncement';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AdminHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const announcementModalRef = useRef<Modalize>(null);

  const [shuttleReportsCount, setShuttleReportsCount] = useState(0);
  const [fullLotsCount, setFullLotsCount] = useState(0);
  const [announcementType, setAnnouncementType] = useState<'single' | 'all'>('single');

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
      image: require('../../assets/icons/new/newShuttle.png'),
      route: 'ShuttleDashboard',
      badge: shuttleReportsCount > 0 ? shuttleReportsCount : undefined,
    },
    {
      id: 'parking',
      title: 'Parking Management',
      subtitle: `${fullLotsCount} SUBLOTS FULL`,
      image: require('../../assets/icons/new/newCar.png'),
      route: 'ParkingManagement',
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: '',
      image: require('../../assets/icons/new/settings.png'), // Use settings icon
      route: 'Settings',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.userName}>Amanda</Text>
          <Text style={styles.locationText}>Tesla HQ Deer Creek</Text>
        </View>
        <Image
          source={{ uri: 'https://via.placeholder.com/46' }}
          style={styles.profileImage}
        />
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24, zIndex: 100 }}>
        <AnnouncementDropDown
          onSelectOption={option => {
            if (option === 'Single Shuttle Route') {
              setAnnouncementType('single');
              announcementModalRef.current?.open();
            } else if (option === 'All Shuttle Routes') {
              setAnnouncementType('all');
              announcementModalRef.current?.open();
            } else {
              console.log('Selected:', option);
            }
          }}
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
                  style={{ width: 24, height: 24, resizeMode: 'contain' }}
                />
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>N</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                ) : null}
              </View>
              {item.badge && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Create Announcement Modal */}
      <CreateNewAnnouncement
        ref={announcementModalRef}
        announcementType={announcementType}
        onSuccess={() => {
          // Refresh counts after creating announcement (optional)
          console.log('Announcement created successfully');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 16,
    color: '#1C1C1C',
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1C',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#1C1C1C',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D9D9D9',
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
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1C',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  cardSubtitle: {
    fontSize: 10,
    color: '#1C1C1C',
    fontWeight: '400',
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: '#0761E0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginRight: 7,
    minWidth: 19,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#FCFCFC',
    fontSize: 10,
    fontWeight: '400',
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 22,
    color: '#1C1C1C',
    marginLeft: 4,
  },
});