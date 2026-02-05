// packages/mobile/src/screens/main/MainHomeScreen.tsx

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import Svg, { Circle, Line } from 'react-native-svg';

// Import existing components
import SearchBar from '../../components/SearchBar';
import { useRideContext, TravelMode } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';

// Import Quickstart components
import {
  RouteHeader,
  TransportMode,
  ModeTimes,
} from '../../components/RouteHeader';
import { LocationBox } from '../../components/LocationBox';

// Import alert and notification services
import { getUserAlerts, clearUserAlerts } from '../../services/alerts';
import {
  showParkingNotification,
  showShuttleNotification,
  requestNotificationPermission,
} from '../../services/notifications';
import { getUserLocation } from '../../services/location';

// API services
import {
  getRoutesGoHome,
  getRoutesToOffice,
  getRoutesToOfficeQuickStart,
  RouteResponse,
} from '../../services/maps';
import {
  getAllLocations,
  getAllParkingAvailability,
  getParkingForLocation,
  ParkingRow,
} from '../../services/parkings';

// ============ UTILITIES (Copied from QuickstartScreen) ============
function decodePolyline(
  encoded: string
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let shift = 0,
      result = 0,
      b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

function formatDuration(sec: number): string {
  const mins = Math.round(sec / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

function getStatus(availability: number): string {
  if (availability >= 80) return 'Almost Full';
  if (availability >= 50) return 'Filling Up';
  return 'Available';
}

function getForecastText(currentFullness: number): string {
  const hour = new Date().getHours();
  const targetTime = hour < 9 ? '9:30 AM' : hour < 12 ? '12:00 PM' : '5:00 PM';

  // Simple heuristic: parking fills up 10-20% more by peak hours
  const forecastFullness = Math.min(currentFullness + 15, 95);

  return `About ${forecastFullness}% full by ${targetTime}`;
}

interface ParkingLot {
  id: string;
  name: string;
  status: string;
  fullness: number;
  coordinate: { latitude: number; longitude: number };
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenPhase = 'routes' | 'availability';
type ViewMode = 'list' | 'detail';

function MainHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { userId } = useAuth();
  const { setDestination, travelMode, setTravelMode } = useRideContext();

  // ============ MAIN HOME STATE ============
  const [searchExpanded, setSearchExpanded] = useState(false);

  // ============ QUICKSTART STATE ============
  // Mode: 'search' (default) or 'quickstart' (active route)
  const [mode, setMode] = useState<'search' | 'quickstart'>('search');

  // Quickstart Params
  const [destinationName, setDestinationName] = useState<string>('Destination');
  const [destinationAddress, setDestinationAddress] = useState<string | null>(
    null
  );
  const [isHomeRoute, setIsHomeRoute] = useState(false);

  // Phase State
  const [phase, setPhase] = useState<ScreenPhase>('availability');
  const [viewMode, setViewMode] = useState<ViewMode>('detail');

  // Route Data State
  const [fetchedRouteData, setFetchedRouteData] =
    useState<RouteResponse | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);

  // Parking Data State
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [parkingLoading, setParkingLoading] = useState(false);
  const [parkingError, setParkingError] = useState<string | null>(null);
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(
    null
  );
  const [sublots, setSublots] = useState<ParkingRow[]>([]);
  const [sublotsLoading, setSublotsLoading] = useState(false);
  const [selectedSublot, setSelectedSublot] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Snap points
  const searchSnapPoints = useMemo(() => ['15%', '45%', '70%', '85%'], []);
  const quickstartSnapPoints = useMemo(() => ['20%', '50%', '80%'], []);
  const snapPoints =
    mode === 'search' ? searchSnapPoints : quickstartSnapPoints;

  // ============ NOTIFICATIONS & ALERTS ============
  useEffect(() => {
    if (userId) {
      requestNotificationPermission();
    }
  }, [userId]);

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

        if (alerts.length > 0) {
          await clearUserAlerts(userId);
        }
      } catch (err) {
        console.error('Failed to check alerts:', err);
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // ============ MAP CENTERING ============
  useEffect(() => {
    // Only center on user location if we are in search mode and haven't fetched a route yet
    // This prevents re-centering when switching back from quickstart or during quickstart interactions
    if (mode === 'search') {
      const centerMap = async () => {
        try {
          const location = await getUserLocation();
          mapRef.current?.animateToRegion(
            {
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            1000
          );
        } catch (e) {
          console.log('Could not center map on user', e);
        }
      };
      centerMap();
    }
  }, [mode]);

  // ============ QUICKSTART LOGIC ============

  // Fetch Routes
  useEffect(() => {
    if (mode !== 'quickstart' || !destinationAddress) return;

    let cancelled = false;
    const fetchRoutes = async () => {
      setRoutesLoading(true);
      setRoutesError(null);
      try {
        const origin = await getUserLocation();
        const data = isHomeRoute
          ? await getRoutesGoHome({ origin, destination: destinationAddress })
          : await getRoutesToOfficeQuickStart({ origin, destinationAddress });
        if (!cancelled) setFetchedRouteData(data);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.status === 403 || err?.response?.status === 403) {
          Alert.alert(
            'Routing Unavailable',
            isHomeRoute
              ? 'Routing is only available when you are near a Tesla office.'
              : 'You are at Tesla Office. Routing is not needed here.',
            [{ text: 'OK', onPress: handleBackToSearch }]
          );
          return;
        }
        setRoutesError('Failed to load routes. Please try again.');
      } finally {
        if (!cancelled) setRoutesLoading(false);
      }
    };

    fetchRoutes();
    return () => {
      cancelled = true;
    };
  }, [mode, destinationAddress, isHomeRoute]);

  // Fetch Parking Lots
  useEffect(() => {
    if (mode !== 'quickstart') return;
    if (parkingLots.length > 0) return;
    let cancelled = false;

    const fetchParking = async () => {
      setParkingLoading(true);
      setParkingError(null);
      try {
        const [locations, availability] = await Promise.all([
          getAllLocations(),
          getAllParkingAvailability(),
        ]);
        if (cancelled) return;

        const merged: ParkingLot[] = locations.map((loc: any) => {
          const lotsForLocation = availability.filter(
            (a: any) => a.loc_name === loc.name
          );

          const totalFullness = lotsForLocation.reduce(
            (sum: number, lot: any) => sum + (lot.availability ?? 0),
            0
          );
          const avgFullness =
            lotsForLocation.length > 0
              ? Math.round(totalFullness / lotsForLocation.length)
              : 0;

          return {
            id: String(loc.id),
            name: loc.name,
            status: getStatus(avgFullness),
            fullness: avgFullness,
            coordinate: {
              latitude: loc.lat ?? 37.4419,
              longitude: loc.lng ?? -122.143,
            },
          };
        });

        setParkingLots(merged);
        // Selection is now handled by a separate effect
      } catch (err) {
        if (!cancelled) {
          setParkingError('Failed to load parking lots');
        }
      } finally {
        if (!cancelled) setParkingLoading(false);
      }
    };

    fetchParking();
    return () => {
      cancelled = true;
    };
  }, [mode, parkingLots.length]);

  // Select Parking Lot based on Destination
  useEffect(() => {
    if (mode === 'quickstart' && parkingLots.length > 0 && !selectedParkingId) {
      const targetLot = parkingLots.find(
        l => l.name === destinationName || l.name.includes(destinationName)
      );
      setSelectedParkingId(targetLot ? targetLot.id : parkingLots[0].id);
    }
  }, [mode, parkingLots, selectedParkingId, destinationName]);

  // Fetch Sublots
  useEffect(() => {
    if (mode !== 'quickstart') return;
    if (phase !== 'availability' || viewMode !== 'detail' || !selectedParkingId)
      return;
    const lot = parkingLots.find(p => p.id === selectedParkingId);
    if (!lot) return;

    let cancelled = false;
    const fetchSublots = async () => {
      setSublotsLoading(true);
      try {
        const data = await getParkingForLocation(lot.name);
        if (!cancelled) {
          setSublots(data);
          if (data.length > 0) setSelectedSublot(data[0].lot_name);
        }
      } catch {
        if (!cancelled) setSublots([]);
      } finally {
        if (!cancelled) setSublotsLoading(false);
      }
    };

    fetchSublots();
    return () => {
      cancelled = true;
    };
  }, [mode, phase, viewMode, selectedParkingId, parkingLots]);

  // ============ COMPUTED VALUES (Polyline, Region, etc.) ============
  const originalPolyline = useMemo(() => {
    if (!fetchedRouteData?.routes?.length) return [];
    const sorted = [...fetchedRouteData.routes].sort(
      (a, b) => a.duration_sec - b.duration_sec
    );
    const idx = selectedRouteId ? parseInt(selectedRouteId, 10) : 0;
    return decodePolyline((sorted[idx] || sorted[0]).polyline);
  }, [fetchedRouteData, selectedRouteId]);

  const originCoord = useMemo(() => {
    if (originalPolyline.length > 0) return originalPolyline[0];
    return null;
  }, [originalPolyline]);

  const activePolyline = useMemo(() => {
    return originalPolyline;
  }, [originalPolyline]);

  const routeMapRegion = useMemo(() => {
    if (!activePolyline.length) {
      // Default region (Silicon Valley)
      return {
        latitude: 37.3935,
        longitude: -122.15,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    const lats = activePolyline.map(p => p.latitude);
    const lngs = activePolyline.map(p => p.longitude);
    const minLat = Math.min(...lats),
      maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs),
      maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat) * 0.15,
      padLng = (maxLng - minLng) * 0.15;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: maxLat - minLat + padLat * 2,
      longitudeDelta: maxLng - minLng + padLng * 2,
    };
  }, [activePolyline]);

  // Auto-zoom to route when available
  useEffect(() => {
    if (mode === 'quickstart' && activePolyline.length > 0) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(routeMapRegion, 800);
      }, 500);
    }
  }, [mode, activePolyline, routeMapRegion]);

  const destCoord = useMemo(() => {
    if (activePolyline.length > 0)
      return activePolyline[activePolyline.length - 1];
    return { latitude: 37.4419, longitude: -122.143 };
  }, [activePolyline]);

  const modeTimes: ModeTimes = useMemo(() => {
    if (!fetchedRouteData?.routes)
      return { car: '30m', shuttle: '50m', transit: '1hr5m', bike: '30m' };
    const modeMap: Record<TransportMode, string> = {
      car: 'driving',
      shuttle: 'walking',
      transit: 'transit',
      bike: 'bicycling',
    };
    const times: ModeTimes = {};
    (['car', 'shuttle', 'transit', 'bike'] as TransportMode[]).forEach(mode => {
      const found = fetchedRouteData.routes?.find(
        r => r.mode === modeMap[mode]
      );
      if (found) times[mode] = formatDuration(found.duration_sec);
    });
    return times;
  }, [fetchedRouteData]);

  const routeDuration = useMemo(() => {
    if (fetchedRouteData?.routes?.length) {
      const sorted = [...fetchedRouteData.routes].sort(
        (a, b) => a.duration_sec - b.duration_sec
      );
      return formatDuration(sorted[0].duration_sec);
    }
    return null;
  }, [fetchedRouteData]);

  // ============ HANDLERS ============

  // Transition to Quickstart Mode
  const handleSelectDestination = useCallback(
    (dest: {
      id: string;
      title: string;
      subtitle: string;
      coordinate?: { latitude: number; longitude: number };
    }) => {
      setDestination(dest);
      setDestinationName(dest.title);
      setDestinationAddress(dest.subtitle);
      setIsHomeRoute(false);
      setMode('quickstart');
      // Reset Quickstart state
      setPhase('availability');
      setViewMode('detail');
      setFetchedRouteData(null);
      setSelectedParkingId(null);
      bottomSheetRef.current?.snapToIndex(1); // Snap to 50%
    },
    [setDestination]
  );

  const handleHomePress = useCallback(
    (homeAddress: string | null) => {
      if (!homeAddress) {
        navigation.navigate('Favorites');
        return;
      }
      setDestinationName('Home');
      setDestinationAddress(homeAddress);
      setIsHomeRoute(true);
      setMode('quickstart');
      setPhase('availability');
      setViewMode('detail');
      setFetchedRouteData(null);
      setSelectedParkingId(null);
      bottomSheetRef.current?.snapToIndex(1);
    },
    [navigation]
  );

  const handleWorkPress = useCallback(
    (workAddress: string | null) => {
      if (!workAddress) {
        navigation.navigate('Favorites');
        return;
      }
      setDestinationName('Work');
      setDestinationAddress(workAddress);
      setIsHomeRoute(false);
      setMode('quickstart');
      setPhase('availability');
      setViewMode('detail');
      setFetchedRouteData(null);
      setSelectedParkingId(null);
      bottomSheetRef.current?.snapToIndex(1);
    },
    [navigation]
  );

  // Return to Search Mode
  const handleBackToSearch = useCallback(() => {
    setMode('search');
    setFetchedRouteData(null);
    setSearchExpanded(false);
    bottomSheetRef.current?.snapToIndex(0); // Reset to lowest snap point
    // Clear route polyline by clearing data
    setFetchedRouteData(null);
  }, []);

  const handleParkingSelect = useCallback((id: string) => {
    setSelectedParkingId(id);
  }, []);

  const openInGoogleMaps = useCallback(() => {
    const lot = parkingLots.find(p => p.id === selectedParkingId);
    if (!lot) return;
    const { latitude, longitude } = lot.coordinate;
    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    if (url) {
      Linking.canOpenURL(url).then(supported =>
        Linking.openURL(supported ? url : webUrl)
      );
    }
  }, [parkingLots, selectedParkingId]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Report Issue',
      'Thank you! Your feedback helps improve our service.'
    );
  }, []);

  // SearchBar Handlers
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
    bottomSheetRef.current?.snapToIndex(3); // Highest snap
    setSearchExpanded(true);
  }, []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (mode === 'search') {
        setSearchExpanded(index > 0);
      }
    },
    [mode]
  );

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const selectedLot = parkingLots.find(p => p.id === selectedParkingId);

  // ============ RENDER: PARKING DETAIL ============
  const renderParkingDetail = () => {
    const lot = selectedLot;

    // Helper to get dot style
    const getDotStyle = (percent: number) => {
      if (percent >= 80) return styles.dotRed;
      if (percent >= 50) return styles.dotYellow;
      return styles.dotGreen;
    };

    const currentFullness = lot?.fullness ?? 0;
    const forecastFullness = Math.min(currentFullness + 15, 95);

    return (
      <View style={styles.detailContainer}>
        {/* Route calculation loading state */}
        {routesLoading && (
          <View style={styles.routeLoadingBanner}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.routeLoadingText}>Calculating route...</Text>
          </View>
        )}

        {/* Route time display when loaded */}
        {!routesLoading && routeDuration && (
          <View style={styles.routeTimeBanner}>
            <Image
              source={require('../../assets/icons/new/newCar.png')}
              style={{ width: 20, height: 20, marginRight: 8 }}
            />
            <Text style={styles.routeTimeText}>{routeDuration} drive</Text>
          </View>
        )}

        <View style={styles.detailHeaderRow}>
          <Image
            source={require('../../assets/icons/new/newCar.png')}
            style={{ width: 28, height: 28, marginRight: 12 }}
          />
          <Text style={styles.detailTitle}>{lot?.name || 'Loading...'}</Text>
          <Text style={styles.detailUpdateText}>Updated recently</Text>
        </View>

        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>CURRENTLY</Text>
            <View style={getDotStyle(currentFullness)} />
            <Text style={styles.statusValue}>{currentFullness}% full</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>FORECAST</Text>
            <View style={getDotStyle(forecastFullness)} />
            <Text style={styles.statusValue}>
              {getForecastText(currentFullness)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>SELECT SUBLOT</Text>
        {sublotsLoading ? (
          <ActivityIndicator
            size="small"
            color="#007AFF"
            style={{ marginVertical: 20 }}
          />
        ) : (
          <View style={styles.sublotList}>
            {sublots.length > 0 ? (
              sublots.map((sublot, index) => {
                const isSelected = selectedSublot === sublot.lot_name;
                const availability = sublot.availability ?? 0;
                const dotStyle =
                  availability >= 80
                    ? styles.dotRed
                    : availability >= 50
                      ? styles.dotYellow
                      : styles.dotGreen;
                return (
                  <GHTouchableOpacity
                    key={`${sublot.loc_name}-${sublot.lot_name}-${index}`}
                    style={
                      isSelected ? styles.sublotRowSelected : styles.sublotRow
                    }
                    onPress={() => setSelectedSublot(sublot.lot_name)}
                  >
                    <Text
                      style={
                        isSelected
                          ? styles.sublotNameSelected
                          : styles.sublotName
                      }
                    >
                      {sublot.lot_name}
                    </Text>
                    <Text
                      style={
                        isSelected
                          ? styles.sublotStatsSelected
                          : styles.sublotStats
                      }
                    >
                      {availability}% full
                    </Text>
                    <View style={dotStyle} />
                  </GHTouchableOpacity>
                );
              })
            ) : (
              <GHTouchableOpacity
                style={styles.sublotRowSelected}
                onPress={() => setSelectedSublot('Main Lot')}
              >
                <Text style={styles.sublotNameSelected}>MAIN LOT</Text>
                <Text style={styles.sublotStatsSelected}>
                  {lot?.fullness ?? 0}% full
                </Text>
                <View
                  style={
                    (lot?.fullness ?? 0) >= 80
                      ? styles.dotRed
                      : (lot?.fullness ?? 0) >= 50
                        ? styles.dotYellow
                        : styles.dotGreen
                  }
                />
              </GHTouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.sectionHeader}>ALSO CONSIDER SHUTTLE</Text>
        <GHTouchableOpacity
          style={styles.shuttleSuggestionCard}
          onPress={() => setTravelMode('shuttle')}
        >
          <Image
            source={require('../../assets/icons/new/newShuttle.png')}
            style={{ width: 24, height: 24, marginRight: 12 }}
          />
          <Text style={styles.shuttleSuggestionText}>
            {modeTimes.shuttle || '50 min'}
          </Text>
          <View style={{ flex: 1 }} />
          {/* Shuttle availability not available in API yet */}
        </GHTouchableOpacity>

        <View style={styles.detailFooter}>
          <GHTouchableOpacity
            style={styles.startButton}
            onPress={openInGoogleMaps}
          >
            <Text style={styles.startButtonText}>
              Route to {selectedSublot || 'Lot'}
            </Text>
          </GHTouchableOpacity>
        </View>
      </View>
    );
  };

  // ============ RENDER: ROUTE CONTENT (shuttle/transit/bike) ============
  const renderRouteContent = () => (
    <>
      <GHTouchableOpacity
        style={styles.routeCard}
        activeOpacity={0.9}
        onPress={openInGoogleMaps}
      >
        <View style={styles.routeHeader}>
          <View>
            <Text style={styles.routeTitle}>
              {travelMode === 'shuttle'
                ? 'Tesla Shuttle A'
                : travelMode === 'transit'
                  ? 'Public Transit'
                  : 'Bike Route'}
            </Text>
            <Text style={styles.routeSub}>On Time · 10 min away</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>50 Min</Text>
            <Text style={styles.etaSub}>9:30 AM ETA</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.routeDetails}>
          <View style={styles.stepRow}>
            <Svg width={12} height={40}>
              <Circle cx={6} cy={6} r={3} fill="#007AFF" />
              <Line
                x1={6}
                y1={6}
                x2={6}
                y2={40}
                stroke="#E5E5E5"
                strokeWidth={2}
              />
            </Svg>
            <Text style={styles.stepText}>Your Location</Text>
            <Text style={styles.stepTime}>8:40 AM</Text>
          </View>
          <View style={styles.stepRow}>
            <Svg width={12} height={40}>
              <Line
                x1={6}
                y1={0}
                x2={6}
                y2={40}
                stroke="#E5E5E5"
                strokeWidth={2}
              />
              <Circle cx={6} cy={20} r={2} fill="#8E8E93" />
            </Svg>
            <View style={styles.stepContent}>
              <Text style={styles.stepText}>
                {travelMode === 'shuttle'
                  ? '10 min walk to shuttle stop'
                  : travelMode === 'bike'
                    ? '25 min bike ride'
                    : '15 min bus ride'}
              </Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <Svg width={12} height={12}>
              <Circle cx={6} cy={6} r={3} fill="#000" />
            </Svg>
            <Text style={styles.stepText}>{destinationName}</Text>
            <Text style={styles.stepTime}>9:30 AM</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <GHTouchableOpacity
            style={styles.startButton}
            onPress={openInGoogleMaps}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </GHTouchableOpacity>
        </View>
      </GHTouchableOpacity>

      <View style={styles.footerLinks}>
        <Text style={styles.footerTitle}>OTHER OPTIONS</Text>
        <GHTouchableOpacity
          style={styles.altRow}
          onPress={() => setTravelMode('shuttle')}
        >
          <Text style={styles.altText}>Tesla Shuttle B</Text>
          <Text style={styles.altTime}>55 min</Text>
        </GHTouchableOpacity>
        <GHTouchableOpacity
          style={styles.altRow}
          onPress={() => setTravelMode('transit')}
        >
          <Text style={styles.altText}>Public Transit</Text>
          <Text style={styles.altTime}>1h 10m</Text>
        </GHTouchableOpacity>
        <GHTouchableOpacity
          style={styles.altRow}
          onPress={() => setTravelMode('car')}
        >
          <Text style={styles.altText}>Drive (view parking)</Text>
          <Text style={styles.altTime}>{modeTimes.car || '30m'}</Text>
        </GHTouchableOpacity>
      </View>

      <GHTouchableOpacity style={styles.reportLink} onPress={handleReport}>
        <Text style={styles.reportText}>
          See something off?{' '}
          <Text style={styles.reportLinkText}>Report it</Text>
        </Text>
      </GHTouchableOpacity>
    </>
  );

  const renderAvailabilityContent = () => {
    if (parkingLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }
    if (parkingError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{parkingError}</Text>
        </View>
      );
    }

    if (travelMode === 'car') {
      return renderParkingDetail();
    }
    return renderRouteContent();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map Background */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 37.3935,
            longitude: -122.15,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Quickstart Overlays */}
          {mode === 'quickstart' && activePolyline.length > 0 && (
            <Polyline
              coordinates={activePolyline}
              strokeColor="#007AFF"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {mode === 'quickstart' && phase === 'routes' && destCoord && (
            <Marker coordinate={destCoord} title={destinationName} />
          )}

          {/* Parking lot markers in availability phase */}
          {mode === 'quickstart' &&
            phase === 'availability' &&
            viewMode === 'list' &&
            parkingLots.map(lot => (
              <Marker
                key={lot.id}
                coordinate={lot.coordinate}
                title={`Tesla ${lot.name}`}
                description={`${lot.fullness}% Full`}
                onPress={() => handleParkingSelect(lot.id)}
              >
                <View
                  style={{
                    backgroundColor:
                      lot.id === selectedParkingId ? '#007AFF' : '#FF3B30',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                >
                  <Text
                    style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}
                  >
                    {lot.fullness}%
                  </Text>
                </View>
              </Marker>
            ))}

          {/* Parking lot marker in detail view */}
          {mode === 'quickstart' &&
            phase === 'availability' &&
            viewMode === 'detail' &&
            selectedLot && (
              <Marker
                coordinate={destCoord}
                title={selectedLot.name}
                description={`${selectedLot.fullness}% Full`}
              >
                <View
                  style={{
                    backgroundColor: '#FF3B30',
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    borderWidth: 3,
                    borderColor: '#fff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                  }}
                />
              </Marker>
            )}

          {/* Current Location Marker (always show if we have it) */}
          {mode === 'quickstart' && originCoord && (
            <Marker coordinate={originCoord} title="You are here">
              <View style={styles.originDot}>
                <View style={styles.originDotInner} />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Settings button overlay on map (Only in Search mode) */}
        {mode === 'search' && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        )}

        {/* Quickstart specific Overlay */}
        {mode === 'quickstart' && <LocationBox destination={destinationName} />}
      </View>

      {/* Bottom Sheet - Unified */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        enablePanDownToClose={false}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          {mode === 'search' ? (
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
          ) : (
            // Quickstart Content
            <View style={styles.quickstartContainer}>
              <RouteHeader
                onBackPress={handleBackToSearch}
                activeMode={travelMode as TransportMode}
                onModeChange={mode => setTravelMode(mode as TravelMode)}
                modeTimes={modeTimes}
              />
              {renderAvailabilityContent()}
            </View>
          )}
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
    shadowOffset: { width: 0, height: -4 },
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
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: 20,
  },
  quickstartContainer: {
    paddingHorizontal: 20,
  },
  // Quickstart specific styles
  originDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: { fontSize: 16, color: '#FF3B30', textAlign: 'center' },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  actionRow: { padding: 16, paddingTop: 0 },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  // Detail styles
  detailContainer: { paddingBottom: 20 },
  routeLoadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  routeLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  routeTimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  routeTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#000', flex: 1 },
  detailUpdateText: { fontSize: 12, color: '#8E8E93' },
  statusSection: { marginBottom: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusLabel: { fontSize: 11, fontWeight: '600', color: '#8E8E93', width: 80 },
  statusValue: { fontSize: 13, color: '#000' },
  dotYellow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFCC00',
    marginRight: 8,
  },
  dotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginRight: 8,
  },
  sublotList: { marginBottom: 20 },
  sublotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 8,
  },
  sublotRowSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 8,
  },
  sublotName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#000' },
  sublotNameSelected: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  sublotStats: { fontSize: 13, color: '#8E8E93', marginRight: 8 },
  sublotStatsSelected: { fontSize: 13, color: '#007AFF', marginRight: 8 },
  shuttleSuggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 20,
  },
  shuttleSuggestionText: { fontSize: 15, fontWeight: '600', color: '#000' },
  detailFooter: { marginTop: 8 },
  // Route content styles
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  routeTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  routeSub: { fontSize: 13, color: '#34C759', marginTop: 2 },
  etaBadge: { alignItems: 'flex-end' },
  etaText: { fontSize: 20, fontWeight: '700', color: '#000' },
  etaSub: { fontSize: 12, color: '#8E8E93' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 16 },
  routeDetails: { padding: 16, paddingVertical: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  stepContent: { flex: 1, marginLeft: 8, paddingBottom: 4 },
  stepTime: { fontSize: 12, color: '#8E8E93' },
  footerLinks: { marginBottom: 24 },
  footerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  altText: { fontSize: 15, color: '#000' },
  altTime: { fontSize: 15, color: '#8E8E93' },
  reportLink: { alignSelf: 'center', paddingBottom: 20 },
  reportText: { fontSize: 13, color: '#8E8E93' },
  reportLinkText: { color: '#007AFF', fontWeight: '500' },
});
