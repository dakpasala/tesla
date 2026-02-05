// packages/mobile/src/screens/main/MainHomeScreen.tsx

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
} from 'react';
import { Alert } from 'react-native';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

// Import existing components
import SearchBar from '../../components/SearchBar';
import { useRideContext } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';

// Import route APIs
import {
  getRoutesGoHome,
  getRoutesToOfficeQuickStart,
} from '../../services/maps';

import type { GoHomeResponse } from '../../services/maps';

import { getUserLocation } from '../../services/location';

// Import alert and notification services
import { getUserAlerts, clearUserAlerts } from '../../services/alerts';
import {
  showParkingNotification,
  showShuttleNotification,
  requestNotificationPermission,
} from '../../services/notifications';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function MainHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { userId } = useAuth();

  // Search expanded state only - SearchBar manages its own search text
  const [searchExpanded, setSearchExpanded] = useState(false);
  const { setDestination } = useRideContext();

  const warnedNotNearOfficeRef = useRef(false);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['15%', '45%', '70%', '85%'], []);

  // Request notification permission on mount
  useEffect(() => {
    if (userId) {
      requestNotificationPermission();
    }
  }, [userId]);

  // Poll for alerts every 30 seconds
  useEffect(() => {
    if (!userId) return;

    const checkAlerts = async () => {
      try {
        const alerts = await getUserAlerts(userId);

        for (const alert of alerts) {
          if (alert.type === 'parking') {
            await showParkingNotification({
              locationName: alert.locationName,
              lot: alert.lot,
              available: alert.available,
              type: alert.alertType,
            });
          } else if (alert.type === 'shuttle') {
            await showShuttleNotification({
              shuttleId: alert.shuttleId,
              event: alert.event,
              etaMinutes: alert.etaMinutes,
            });
          }
        }

        // Clear alerts after showing them
        if (alerts.length > 0) {
          await clearUserAlerts(userId);
        }
      } catch (err) {
        console.error('Failed to check alerts:', err);
      }
    };

    // Check immediately on mount
    checkAlerts();

    // Then poll every 30 seconds
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Stable callbacks - selecting any office/favorite goes to Quickstart with routes
  const handleSelectDestination = useCallback(
    async (dest: {
      id: string;
      title: string;
      subtitle: string;
      coordinate?: { latitude: number; longitude: number };
    }) => {
      setDestination(dest);

      try {
        const origin = await getUserLocation();

        // Use the office address (subtitle) to fetch routes
        const routeData = await getRoutesToOfficeQuickStart({
          origin,
          destinationAddress: dest.subtitle, // subtitle contains the address
        });

        navigation.navigate('Quickstart', { routeData });
      } catch (err: any) {
        if (err?.status === 403 || err?.response?.status === 403) {
          Alert.alert(
            'Outside Supported Area',
            'Routing is only available when you are near a Tesla office. Please use a standard navigation app when commuting from other locations.'
          );
          return;
        }

        console.error('Failed to fetch routes for destination', err);
      }
    },
    [navigation, setDestination]
  );

  // Home press — SearchBar passes the address up, we fetch routes here
  const handleHomePress = useCallback(
    async (homeAddress: string | null) => {
      if (!homeAddress) {
        navigation.navigate('Favorites');
        return;
      }

      try {
        const origin = await getUserLocation();

        const routeData = await getRoutesGoHome({
          origin,
          destination: homeAddress,
        });

        navigation.navigate('Quickstart', { routeData });
      } catch (err: any) {
        if (err?.status === 403 || err?.response?.status === 403) {
          Alert.alert(
            'Outside Supported Area',
            'Routing is only available when you are near a Tesla office. Please use a standard navigation app when commuting from other locations.'
          );
          return;
        }

        // fallback: real errors
        console.error('Failed to fetch home routes', err);
      }
    },
    [navigation]
  );

  // Work press — fetch routes to office
  const handleWorkPress = useCallback(
    async (workAddress: string | null) => {
      if (!workAddress) {
        navigation.navigate('Favorites');
        return;
      }

      try {
        const origin = await getUserLocation();

        const routeData = await getRoutesToOfficeQuickStart({
          origin,
          destinationAddress: workAddress,
        });

        navigation.navigate('Quickstart', { routeData });
      } catch (err: any) {
        if (err?.status === 403 || err?.response?.status === 403) {
          Alert.alert('You are at Tesla Office', 'Routing is not needed here');
          return;
        }

        console.error('Failed to fetch work routes', err);
      }
    },
    [navigation]
  );

  const handleHomeLongPress = useCallback(() => {
    navigation.navigate('Favorites');
  }, [navigation]);

  const handleWorkLongPress = useCallback(() => {
    navigation.navigate('Favorites');
  }, [navigation]);

  const handleExpand = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
    setSearchExpanded(true);
  }, []);

  const handleCollapse = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
    setSearchExpanded(false);
  }, []);

  const handleSearchFocus = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(4);
    setSearchExpanded(true);
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    setSearchExpanded(index > 0);
  }, []);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map Background */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 37.3935,
            longitude: -122.15,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        />

        {/* Settings button overlay on map */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet - Landing page content */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* SearchBar - shows search, Home/Work, Favorites, All Offices */}
          <View style={styles.searchContainer}>
            <SearchBar
              expanded={searchExpanded}
              onExpand={handleExpand}
              onCollapse={handleCollapse}
              onFocus={handleSearchFocus}
              onSelectDestination={handleSelectDestination}
              onHomePress={handleHomePress}
              onWorkPress={handleWorkPress}
              onHomeLongPress={handleHomeLongPress}
              onWorkLongPress={handleWorkLongPress}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

export default memo(MainHomeScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundAlt,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 20,
    color: theme.components.icon,
  },
  bottomSheetBackground: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomSheetHandle: {
    backgroundColor: theme.colors.border,
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: theme.spacing.s,
  },
  sheetContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: 20,
  },
});
