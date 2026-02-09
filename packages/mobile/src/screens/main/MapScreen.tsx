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
  Linking,
  Platform,
  Alert,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useRoute, RouteProp } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

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
import { ShuttleArrivalSheet } from '../../components/ShuttleArrivalSheet';

// Import services
import { getUserLocation } from '../../services/location';
import {
  getMinutesUntil,
  isRideDelayed,
  getLiveStatus,
  getOccupancyPercentage,
} from '../../services/tripshot';
import {
  startShuttleTracking,
  stopShuttleTracking,
  setupShuttleNotificationHandlers,
} from '../../services/notifications';

// Hooks
import { useMapAlerts } from '../../hooks/useMapAlerts';
import { useRoutePlanning } from '../../hooks/useRoutePlanning';
import { useParkingData } from '../../hooks/useParkingData';

import { decodePolyline, formatDuration } from '../../helpers/mapUtils';

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

  // Navigation State
  const [isNavigating, setIsNavigating] = useState(false);

  // Snap points
  const searchSnapPoints = useMemo(() => ['15%', '45%', '70%', '85%'], []);
  const quickstartSnapPoints = useMemo(() => ['20%', '50%', '80%'], []);
  const snapPoints =
    mode === 'search' ? searchSnapPoints : quickstartSnapPoints;

  // ============ HANDLERS (Defined early for hooks) ============
  // Return to Search Mode
  const handleBackToSearch = useCallback(() => {
    setMode('search');
    setSearchExpanded(false);
    setIsNavigating(false);
    stopShuttleTracking(); // Stop background notifications
    bottomSheetRef.current?.snapToIndex(0); // Reset to lowest snap point
  }, []);

  // ============ CUSTOM HOOKS ============

  // 1. Alerts & Notifications
  useMapAlerts(userId);

  // 2. Route Planning (with TripShot integration)
  const {
    fetchedRouteData,
    setFetchedRouteData,
    tripshotData,
    setTripshotData,
    liveStatus,
    routesLoading,
    routesError,
  } = useRoutePlanning({
    mode,
    destinationAddress,
    isHomeRoute,
    travelMode, // Pass travel mode to hook
    onBackToSearch: handleBackToSearch,
  });

  // 3. Parking Data
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(
    null
  );
  const [selectedSublot, setSelectedSublot] = useState<string>('');
  const [selectedRouteId] = useState<string | null>(null);

  const { parkingLots, parkingLoading, parkingError, sublots, sublotsLoading } =
    useParkingData({
      mode,
      phase,
      viewMode,
      selectedParkingId,
    });

  // ============ SHUTTLE TRACKING & NOTIFICATIONS ============
  useEffect(() => {
    if (isNavigating && travelMode === 'shuttle' && tripshotData?.options?.[0]) {
      // Get the ride ID from first option
      const firstStep = tripshotData.options[0].steps.find(
        s => 'OnRouteScheduledStep' in s
      );

      if (firstStep && 'OnRouteScheduledStep' in firstStep) {
        const rideId = firstStep.OnRouteScheduledStep.rideId;
        const stopName =
          tripshotData.stops?.find(
            s => s.stopId === tripshotData.options[0].departureStopId
          )?.name || 'Shuttle Stop';

        // Function to get live status for notifications
        const getLiveStatusForNotification = async (id: string) => {
          try {
            const status = await getLiveStatus([id]);
            const ride = status.rides[0];

            if (!ride) {
              return {
                etaMinutes: 0,
                isDelayed: false,
                delayMinutes: 0,
                occupancy: 0,
              };
            }

            const nextStop = ride.stopStatus[0];
            const etaMinutes = nextStop?.Awaiting?.expectedArrivalTime
              ? getMinutesUntil(nextStop.Awaiting.expectedArrivalTime)
              : 0;

            return {
              etaMinutes,
              isDelayed: isRideDelayed(ride),
              delayMinutes: Math.round(ride.lateBySec / 60),
              occupancy: getOccupancyPercentage(ride),
            };
          } catch (error) {
            console.error('Failed to get live status:', error);
            return {
              etaMinutes: 0,
              isDelayed: false,
              delayMinutes: 0,
              occupancy: 0,
            };
          }
        };

        // Start background tracking
        startShuttleTracking(rideId, stopName, getLiveStatusForNotification);

        // Setup notification handlers
        const unsubscribe = setupShuttleNotificationHandlers(
          () => {
            // User tapped notification - ensure we're showing the tracking screen
            setIsNavigating(true);
          },
          () => {
            // User stopped tracking
            handleBackFromNavigation();
          }
        );

        return () => {
          unsubscribe();
          stopShuttleTracking();
        };
      }
    }
  }, [isNavigating, travelMode, tripshotData]);

  // ============ ADDITIONAL EFFECT: Parking Selection ============
  useEffect(() => {
    if (mode === 'quickstart' && parkingLots.length > 0 && !selectedParkingId) {
      const targetLot = parkingLots.find(
        l => l.name === destinationName || l.name.includes(destinationName)
      );
      setSelectedParkingId(targetLot ? targetLot.id : parkingLots[0].id);
    }
  }, [mode, parkingLots, selectedParkingId, destinationName]);

  // ============ ADDITIONAL EFFECT: Default Sublot Selection ============
  useEffect(() => {
    if (sublots.length > 0) {
      setSelectedSublot(sublots[0].lot_name);
    }
  }, [sublots]);

  // ============ MAP CENTERING ============
  useEffect(() => {
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
      setTripshotData(null);
      setSelectedParkingId(null);
      setIsNavigating(false);
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [route.params, setFetchedRouteData, setTripshotData]);

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
      return { car: '30m', shuttle: '50m', transit: '1h 5m', bike: '30m' };
    
    const times: ModeTimes = {};
    
    // Map each transport mode to the corresponding route mode from API
    const carRoute = fetchedRouteData.routes?.find(r => r.mode === 'driving');
    if (carRoute) times.car = formatDuration(carRoute.duration_sec);
    
    const bikeRoute = fetchedRouteData.routes?.find(r => r.mode === 'bicycling');
    if (bikeRoute) times.bike = formatDuration(bikeRoute.duration_sec);
    
    const transitRoute = fetchedRouteData.routes?.find(r => r.mode === 'transit');
    if (transitRoute) times.transit = formatDuration(transitRoute.duration_sec);
    
    // For shuttle, use TripShot data if available, otherwise use walking route as fallback
    if (tripshotData?.options?.[0]) {
      const shuttleDuration = Math.round(
        (new Date(tripshotData.options[0].travelEnd).getTime() -
          new Date(tripshotData.options[0].travelStart).getTime()) /
          60000
      );
      times.shuttle = formatDuration(shuttleDuration * 60);
    } else {
      const walkRoute = fetchedRouteData.routes?.find(r => r.mode === 'walking');
      if (walkRoute) times.shuttle = formatDuration(walkRoute.duration_sec);
    }
    
    return times;
  }, [fetchedRouteData, tripshotData]);

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
      setTripshotData(null);
      setSelectedParkingId(null);
      setIsNavigating(false);
      bottomSheetRef.current?.snapToIndex(1); // Snap to 50%
    },
    [setDestination, setFetchedRouteData, setTripshotData]
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
      setTripshotData(null);
      setSelectedParkingId(null);
      setIsNavigating(false);
      bottomSheetRef.current?.snapToIndex(1);
    },
    [navigation, setFetchedRouteData, setTripshotData]
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
      setTripshotData(null);
      setSelectedParkingId(null);
      setIsNavigating(false);
      bottomSheetRef.current?.snapToIndex(1);
    },
    [navigation, setFetchedRouteData, setTripshotData]
  );

  const handleParkingSelect = useCallback((id: string) => {
    setSelectedParkingId(id);
  }, []);

  const openInGoogleMaps = useCallback(() => {
    if (travelMode === 'shuttle') {
      // For shuttle mode, start in-app navigation
      setIsNavigating(true);
    } else {
      // For car mode, open Google Maps
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
    }
  }, [parkingLots, selectedParkingId, travelMode]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Report Issue',
      'Thank you! Your feedback helps improve our service.'
    );
  }, []);

  const handleBackFromNavigation = useCallback(() => {
    setIsNavigating(false);
    stopShuttleTracking(); // Stop background notifications
  }, []);

  // Callback to refresh shuttle status (for polling)
  const handleRefreshStatus = useCallback(() => {
    // The useRoutePlanning hook already handles polling via its effect
    // This is just a placeholder if we need manual refresh
    console.log('Manual refresh triggered');
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

  // ============ GET NEXT STOPS FOR ARRIVAL SHEET ============
  const nextStops = useMemo(() => {
    if (!tripshotData?.stops || !liveStatus?.rides?.[0])
      return ['Stevens Creek', 'Sunnyvale', 'Mountain View'];

    const stops = liveStatus.rides[0].stopStatus
      .slice(0, 3)
      .map(status => {
        const stop = tripshotData.stops?.find(
          s => s.stopId === status.Awaiting.stopId
        );
        return stop?.name || 'Stop';
      });

    return stops.length > 0
      ? stops
      : ['Stevens Creek', 'Sunnyvale', 'Mountain View'];
  }, [tripshotData, liveStatus]);

  // ============ RENDER: AVAILABILITY CONTENT ============
  const renderAvailabilityContent = () => {
    // If navigating with shuttle, don't show RouteDetailView
    if (isNavigating && travelMode === 'shuttle') {
      return null;
    }

    if (parkingLoading || routesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }
    if (parkingError || routesError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{parkingError || routesError}</Text>
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
        tripshotData={tripshotData}
        liveStatus={liveStatus}
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
        {mode === 'quickstart' && !isNavigating && (
          <LocationBox destination={destinationName} />
        )}
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
          ) : isNavigating && travelMode === 'shuttle' ? (
            // Show ShuttleArrivalSheet inside bottom sheet when navigating
            <View style={styles.quickstartContainer}>
              <ShuttleArrivalSheet
                stopName={
                  tripshotData?.stops?.find(
                    s =>
                      s.stopId === tripshotData?.options?.[0]?.departureStopId
                  )?.name || 'Stevens Creek & Albany Bus Stop'
                }
                etaMinutes={
                  liveStatus?.rides?.[0]?.stopStatus?.[0]?.Awaiting
                    ?.expectedArrivalTime
                    ? getMinutesUntil(
                        liveStatus.rides[0].stopStatus[0].Awaiting
                          .expectedArrivalTime
                      )
                    : 6
                }
                status={
                  liveStatus?.rides?.[0] && isRideDelayed(liveStatus.rides[0])
                    ? 'Delayed'
                    : 'On Time'
                }
                nextStops={nextStops}
                onBack={handleBackFromNavigation}
                onReportIssue={handleReport}
                liveStatus={liveStatus}
                onRefreshStatus={handleRefreshStatus}
              />
            </View>
          ) : (
            // Quickstart Content (RouteDetailView)
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