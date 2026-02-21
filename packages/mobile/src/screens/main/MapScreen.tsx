// packages/mobile/src/screens/main/MapScreen.tsx

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
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useRoute, RouteProp } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

// Import existing components
import SearchBar from '../../components/SearchBar';
import ShuttleNotificationBanner from '../../components/ShuttleNotificationBanner';
import { useRideContext, TravelMode } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';
import { useShuttleNotification } from '../../context/ShuttleNotificationContext';
import { theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';

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
import { ReportSheet } from '../../components/ReportSheet';

// Import services
import { getUserLocation } from '../../services/location';
import {
  getRoutesGoHome,
  getRoutesToOfficeQuickStart,
} from '../../services/maps';
import {
  getMinutesUntil,
  isRideDelayed,
  getLiveStatus,
  getOccupancyPercentage,
} from '../../services/tripshot';
import {
  startShuttleTracking,
  stopShuttleTracking,
  pauseShuttleTracking,
  setupShuttleNotificationHandlers,
} from '../../services/notifications';

import { submitShuttleReport } from '../../services/shuttleAlerts';

// Hooks
import { useMapAlerts } from '../../hooks/useMapAlerts';
import { useRoutePlanning } from '../../hooks/useRoutePlanning';
import { useParkingData } from '../../hooks/useParkingData';

import { decodePolyline, formatDuration } from '../../helpers/mapUtils';
import OptionsCard from '../../components/OptionsCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MapScreenRouteProp = RouteProp<RootStackParamList, 'Map'>;
type ScreenPhase = 'routes' | 'availability';
type ViewMode = 'list' | 'detail' | 'options';

function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MapScreenRouteProp>();
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { userId } = useAuth();
  const { setDestination, travelMode, setTravelMode } = useRideContext();
  const { showNotification: showShuttleNotification } =
    useShuttleNotification();
  const { activeTheme } = useTheme();
  const c = activeTheme.colors;
  const components = activeTheme.components;

  const handleOtherLots = useCallback(() => {
    setPendingParkingId(null);
    setViewMode('options');
    bottomSheetRef.current?.snapToIndex(2);
  }, []);

  // ============ MAIN HOME STATE ============
  const [searchExpanded, setSearchExpanded] = useState(false);

  // ============ QUICKSTART STATE ============
  const [mode, setMode] = useState<'search' | 'quickstart'>('search');

  const [destinationName, setDestinationName] = useState<string>('Destination');
  const [destinationAddress, setDestinationAddress] = useState<string | null>(null);
  const [isHomeRoute, setIsHomeRoute] = useState(false);

  const [phase, setPhase] = useState<ScreenPhase>('availability');
  const [viewMode, setViewMode] = useState<ViewMode>('detail');

  const [isNavigating, setIsNavigating] = useState(false);
  const [showingReport, setShowingReport] = useState(false);
  const [preCheckLoading, setPreCheckLoading] = useState(false);
  const [departureTime, setDepartureTime] = useState<{ hour: number; minute: number; period: 'am' | 'pm' } | null>(null);

  const searchSnapPoints = useMemo(() => ['15%', '45%', '70%', '85%'], []);
  const quickstartSnapPoints = useMemo(() => ['20%', '50%', '80%'], []);
  const snapPoints = mode === 'search' ? searchSnapPoints : quickstartSnapPoints;

  const handleBackToSearch = useCallback(() => {
    setMode('search');
    setSearchExpanded(false);
    setIsNavigating(false);
    setDepartureTime(null); // reset to "Now" when leaving quickstart
    pauseShuttleTracking();
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  // ============ CUSTOM HOOKS ============

  useMapAlerts(userId);

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
    travelMode,
    onBackToSearch: handleBackToSearch,
    departureTime,
  });

  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null);
  const [pendingParkingId, setPendingParkingId] = useState<string | null>(null);
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
      const firstStep = tripshotData.options[0].steps.find(
        s => 'OnRouteScheduledStep' in s
      );

      if (firstStep && 'OnRouteScheduledStep' in firstStep) {
        const rideId = firstStep.OnRouteScheduledStep.rideId;
        const stopName =
          tripshotData.stops?.find(
            s => s.stopId === tripshotData.options[0].departureStopId
          )?.name || 'Stevens Creek & Albany Bus Stop';

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
                stopStatus: undefined,
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
              expectedArrivalTime: nextStop?.Awaiting?.expectedArrivalTime,
              stopStatus: ride.stopStatus,
            };
          } catch (error) {
            console.error('Failed to get live status:', error);
            return {
              etaMinutes: 0,
              isDelayed: false,
              delayMinutes: 0,
              occupancy: 0,
              expectedArrivalTime: undefined,
              stopStatus: undefined,
            };
          }
        };

        startShuttleTracking(
          rideId,
          stopName,
          ['Stevens Creek', 'Sunnyvale', 'Mountain View'],
          getLiveStatusForNotification,
          data => {
            showShuttleNotification({
              etaMinutes: data.etaMinutes,
              stopName: data.stopName,
              isDelayed: data.isDelayed,
              stopStatus: data.stopStatus,
              nextStops: data.nextStops,
            });
          }
        );

        const unsubscribe = setupShuttleNotificationHandlers(
          () => { setIsNavigating(true); },
          () => { handleBackFromNavigation(); }
        );

        return () => {
          unsubscribe();
          pauseShuttleTracking();
        };
      }
    }
  }, [isNavigating, travelMode, tripshotData]);

  // ============ ADDITIONAL EFFECTS ============
  useEffect(() => {
    if (mode === 'quickstart' && parkingLots.length > 0 && !selectedParkingId) {
      const targetLot = parkingLots.find(
        l => l.name === destinationName || l.name.includes(destinationName)
      );
      setSelectedParkingId(targetLot ? targetLot.id : parkingLots[0].id);
    }
  }, [mode, parkingLots, selectedParkingId, destinationName]);

  useEffect(() => {
    if (sublots.length > 0) {
      setSelectedSublot(sublots[0].lot_name);
    }
  }, [sublots]);

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

  // ============ COMPUTED VALUES ============
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

  const activePolyline = useMemo(() => originalPolyline, [originalPolyline]);

  const routeMapRegion = useMemo(() => {
    if (!activePolyline.length) {
      return {
        latitude: 37.3935,
        longitude: -122.15,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    const lats = activePolyline.map(p => p.latitude);
    const lngs = activePolyline.map(p => p.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat) * 0.15, padLng = (maxLng - minLng) * 0.15;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: maxLat - minLat + padLat * 2,
      longitudeDelta: maxLng - minLng + padLng * 2,
    };
  }, [activePolyline]);

  useEffect(() => {
    if (mode === 'quickstart' && activePolyline.length > 0) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(routeMapRegion, 800);
      }, 500);
    }
  }, [mode, activePolyline, routeMapRegion]);

  useEffect(() => {
    if (mode === 'quickstart') {
      setTravelMode('car');
    }
  }, [mode, setTravelMode]);

  const destCoord = useMemo(() => {
    if (activePolyline.length > 0)
      return activePolyline[activePolyline.length - 1];
    return { latitude: 37.4419, longitude: -122.143 };
  }, [activePolyline]);

  const modeTimes: ModeTimes = useMemo(() => {
    // Show dashes while loading — never show stale/wrong placeholder values
    if (routesLoading) return { car: '—', shuttle: '—', transit: '—', bike: '—' };
    if (!fetchedRouteData?.routes) return { car: '—', shuttle: '—', transit: '—', bike: '—' };

    const times: ModeTimes = {};

    const carRoute = fetchedRouteData.routes?.find(r => r.mode === 'driving');
    times.car = carRoute ? formatDuration(carRoute.duration_sec) : '—';

    const bikeRoute = fetchedRouteData.routes?.find(r => r.mode === 'bicycling');
    times.bike = bikeRoute ? formatDuration(bikeRoute.duration_sec) : '—';

    const transitRoute = fetchedRouteData.routes?.find(r => r.mode === 'transit');
    times.transit = transitRoute ? formatDuration(transitRoute.duration_sec) : '—';

    if (tripshotData?.options?.[0]) {
      const shuttleDuration = Math.round(
        (new Date(tripshotData.options[0].travelEnd).getTime() -
          new Date(tripshotData.options[0].travelStart).getTime()) /
          60000
      );
      times.shuttle = formatDuration(shuttleDuration * 60);
    } else {
      times.shuttle = '—';
    }

    return times;
  }, [fetchedRouteData, tripshotData, routesLoading]);

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
      setPhase('availability');
      setViewMode('detail');
      setFetchedRouteData(null);
      setTripshotData(null);
      setSelectedParkingId(null);
      setIsNavigating(false);
      bottomSheetRef.current?.snapToIndex(1);
    },
    [setDestination, setFetchedRouteData, setTripshotData]
  );

  const handleHomePress = useCallback(
    async (homeAddress: string | null) => {
      if (!homeAddress) {
        navigation.navigate('Favorites');
        return;
      }
      setPreCheckLoading(true);
      try {
        const origin = await getUserLocation();
        await getRoutesGoHome({ origin, destination: homeAddress });
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
      } catch (err: any) {
        if (err?.status === 403 || err?.response?.status === 403) {
          Alert.alert(
            'Routing Unavailable',
            'Routing is only available when you are near a Tesla office.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Failed to load routes. Please try again.');
        }
      } finally {
        setPreCheckLoading(false);
      }
    },
    [navigation, setFetchedRouteData, setTripshotData]
  );

  const handleWorkPress = useCallback(
    async (workAddress: string | null) => {
      if (!workAddress) {
        navigation.navigate('Favorites');
        return;
      }
      setPreCheckLoading(true);
      try {
        const origin = await getUserLocation();
        await getRoutesToOfficeQuickStart({
          origin,
          destinationAddress: workAddress,
        });
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
      } catch (err: any) {
        if (err?.status === 403 || err?.response?.status === 403) {
          Alert.alert(
            'Routing Unavailable',
            'You are at Tesla Office. Routing is not needed here.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Failed to load routes. Please try again.');
        }
      } finally {
        setPreCheckLoading(false);
      }
    },
    [navigation, setFetchedRouteData, setTripshotData]
  );

  const handleParkingSelect = useCallback((id: string) => {
    setSelectedParkingId(id);
  }, []);

  const openInGoogleMaps = useCallback(() => {
    if (travelMode === 'shuttle') {
      setIsNavigating(true);
    } else {
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
    setShowingReport(true);
  }, []);

  const handleBackFromNavigation = useCallback(() => {
    setIsNavigating(false);
    pauseShuttleTracking();
  }, []);

  const handleBackFromReport = useCallback(() => {
    setShowingReport(false);
  }, []);

  const handleSubmitReport = useCallback(
    async (issue: string, details: string) => {
      try {
        const shuttleName =
          tripshotData?.routes?.[0]?.shortName || 'Tesla Shuttle';
        const comment = details.trim() ? `${issue}: ${details}` : issue;
        await submitShuttleReport(shuttleName, comment);
        Alert.alert(
          'Report Submitted',
          'Thank you! Your feedback helps improve our service.'
        );
        setShowingReport(false);
        setIsNavigating(false);
      } catch (error) {
        console.error('Error submitting report:', error);
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    },
    [tripshotData]
  );

  const handleRefreshStatus = useCallback(() => {
    console.log('Manual refresh triggered');
  }, []);

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
    bottomSheetRef.current?.snapToIndex(3);
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
    if (isNavigating && travelMode === 'shuttle') {
      return null;
    }

    if (viewMode === 'options') {
      const items = parkingLots.map(lot => ({
        id: lot.id,
        title: lot.name,
        subtitle: `${lot.fullness}% full`,
        rightText: '',
        selected: pendingParkingId === lot.id,
      }));

      const selectedLotName =
        parkingLots.find(l => l.id === pendingParkingId)?.name ?? '';

      return (
        <View>
          <OptionsCard
            items={items}
            onSelect={item => {
              setPendingParkingId(item.id);
            }}
          />
          {pendingParkingId && (
            <Pressable
              style={styles.routeButton}
              onPress={() => {
                setSelectedParkingId(pendingParkingId);
                setViewMode('detail');
              }}
            >
              <Text style={styles.routeButtonText}>
                Route to {selectedLotName}
              </Text>
            </Pressable>
          )}
        </View>
      );
    }

    if (parkingLoading || routesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0761E0" />
          <Text style={[styles.loadingText, { color: c.text.secondary }]}>Loading...</Text>
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
          onPressOtherLots={handleOtherLots}
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
        googleMapsRoute={fetchedRouteData?.routes?.find(r => r.mode === 'transit')}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.backgroundAlt }]}>
      <StatusBar barStyle="dark-content" />
      <ShuttleNotificationBanner />

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
          {mode === 'quickstart' && activePolyline.length > 0 && (
            <Polyline
              coordinates={activePolyline}
              strokeColor="#0761E0"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {mode === 'quickstart' && phase === 'routes' && destCoord && (
            <Marker coordinate={destCoord} title={destinationName} />
          )}

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
                      lot.id === selectedParkingId ? '#0761E0' : '#FF3B30',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                    {lot.fullness}%
                  </Text>
                </View>
              </Marker>
            ))}

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

          {mode === 'quickstart' && originCoord && (
            <Marker coordinate={originCoord} title="You are here">
              <View style={styles.originDot}>
                <View style={styles.originDotInner} />
              </View>
            </Marker>
          )}
        </MapView>

        {mode === 'search' && (
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: c.white }]}
            onPress={handleSettingsPress}
          >
            <Text style={[styles.settingsIcon, { color: components.icon }]}>⚙️</Text>
          </TouchableOpacity>
        )}

        {mode === 'quickstart' && !isNavigating && (
          <LocationBox destination={destinationName} />
        )}

        {preCheckLoading && (
          <View style={styles.preCheckLoadingOverlay}>
            <View style={[styles.preCheckLoadingBox, { backgroundColor: c.card }]}>
              <ActivityIndicator size="large" color="#0761E0" />
              <Text style={[styles.preCheckLoadingText, { color: c.text.primary }]}>
                Checking routes...
              </Text>
            </View>
          </View>
        )}
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: c.background }]}
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
          ) : showingReport ? (
            <View style={styles.shuttleNavigationContainer}>
              <ReportSheet
                onBack={handleBackFromReport}
                onSubmit={handleSubmitReport}
              />
            </View>
          ) : isNavigating && travelMode === 'shuttle' ? (
            // ── ShuttleArrivalSheet: now uses commutePlan + liveStatus directly ──
            <View style={styles.quickstartContainer}>
              <ShuttleArrivalSheet
                commutePlan={tripshotData}
                liveStatus={liveStatus}
                onBack={handleBackFromNavigation}
                onReportIssue={handleSubmitReport}
                onRefreshStatus={handleRefreshStatus}
                loading={routesLoading}
              />
            </View>
          ) : (
            <View style={styles.quickstartContainer}>
              <TouchableOpacity
                style={styles.tempBackButton}
                onPress={handleBackToSearch}
              >
                <Text style={[styles.tempBackText, { color: c.primary }]}>← Back</Text>
              </TouchableOpacity>

              <RouteHeader
                onBackPress={handleBackToSearch}
                activeMode={travelMode as TransportMode}
                onModeChange={mode => setTravelMode(mode as TravelMode)}
                modeTimes={modeTimes}
                departureTime={departureTime}
                onDepartureTimeChange={setDepartureTime}
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
  preCheckLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  preCheckLoadingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  preCheckLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1C1C1C',
    fontWeight: '500',
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
    backgroundColor: '#D9D9D9',
    width: 73,
    height: 4,
    borderRadius: 5,
    marginTop: 10,
  },
  sheetContent: {
    paddingTop: 0,
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
    backgroundColor: '#0761E0',
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
  routeButton: {
    marginTop: 18,
    backgroundColor: '#0761E0',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  routeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tempBackButton: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  tempBackText: {
    fontSize: 16,
    color: '#0761E0',
    fontWeight: '500',
  },
  shuttleNavigationContainer: {
    paddingHorizontal: 0,
  },
  errorText: { fontSize: 16, color: '#FF3B30', textAlign: 'center' },
});