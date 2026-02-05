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
import { useRoute, RouteProp } from '@react-navigation/native';
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
import { ParkingDetailView } from '../../components/ParkingDetailView';
import { RouteDetailView } from '../../components/RouteDetailView';

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
  ParkingLot,
} from '../../services/parkings';

import {
  decodePolyline,
  formatDuration,
  getStatus,
  getForecastText,
} from '../../helpers/mapUtils';

// Interface removed, imported from services/parkings

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MapScreenRouteProp = RouteProp<RootStackParamList, 'Map'>;
type ScreenPhase = 'routes' | 'availability';
type ViewMode = 'list' | 'detail';

function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MapScreenRouteProp>();
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

  // ============ HANDLE NAVIGATION PARAMS ============
  useEffect(() => {
    if (route.params?.destinationName && route.params?.destinationAddress) {
      setDestinationName(route.params.destinationName);
      setDestinationAddress(route.params.destinationAddress);
      setMode('quickstart');
      setPhase('availability');
      setViewMode('detail');
      setFetchedRouteData(null);
      setSelectedParkingId(null);
      bottomSheetRef.current?.snapToIndex(1);

      // Clear params to prevent re-triggering?
      // Actually, standard practice is to let them be, or use setParams to clear if needed.
      // But since we use state, it's fine.
    }
  }, [route.params]);

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

  // ============ RENDER: AVAILABILITY CONTENT ============
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
      return (
        <ParkingDetailView
          selectedLot={selectedLot}
          routesLoading={routesLoading}
          routeDuration={routeDuration}
          sublotsLoading={sublotsLoading}
          sublots={sublots}
          selectedSublot={selectedSublot}
          onSelectSublot={setSelectedSublot}
          onSetTravelMode={setTravelMode}
          modeTimes={modeTimes}
          onOpenInGoogleMaps={openInGoogleMaps}
        />
      );
    }

    return (
      <RouteDetailView
        travelMode={travelMode}
        destinationName={destinationName}
        onOpenInGoogleMaps={openInGoogleMaps}
        onSetTravelMode={setTravelMode}
        modeTimes={modeTimes}
        onReportIssue={handleReport}
      />
    );
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

export default memo(MapScreen);

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
});
