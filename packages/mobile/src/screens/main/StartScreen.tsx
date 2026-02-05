// packages/mobile/src/screens/main/StartScreen.tsx
// Simplified availability screen - direct navigation from home
// Shows route with blue line, tabs, sublot selection, and route button

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';

// Components
import {
  RouteHeader,
  TransportMode,
  ModeTimes,
} from '../../components/RouteHeader';
import { LocationBox } from '../../components/LocationBox';
import OptionsCard from '../../components/OptionsCard';

// API services
import {
  getRoutesGoHome,
  getRoutesToOfficeQuickStart,
  RouteResponse,
} from '../../services/maps';
import { getUserLocation } from '../../services/location';
import { getParkingForLocation, ParkingRow } from '../../services/parkings';
import { useRideContext } from '../../context/RideContext';

// ============ UTILITIES ============
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

function getForecastText(currentFullness: number): string {
  const hour = new Date().getHours();
  const targetTime = hour < 9 ? '9:30 AM' : hour < 12 ? '12:00 PM' : '5:00 PM';
  const forecastFullness = Math.min(currentFullness + 15, 95);
  return `About ${forecastFullness}% full by ${targetTime}`;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type StartRouteProp = RouteProp<RootStackParamList, 'Start'>;

export default function StartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StartRouteProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const { travelMode, setTravelMode } = useRideContext();

  // Route params
  const destinationName = route.params?.destinationName || 'Destination';
  const destinationAddress = route.params?.destinationAddress;
  const locationName = route.params?.locationName; // Office name for parking API
  const isHomeRoute = route.params?.isHomeRoute;

  // ============ ROUTE DATA STATE ============
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState<string | null>(null);

  // ============ SUBLOT DATA STATE ============
  const [sublots, setSublots] = useState<ParkingRow[]>([]);
  const [sublotsLoading, setSublotsLoading] = useState(true);
  const [selectedSublot, setSelectedSublot] = useState<string>('');

  // Get the actual office name from route data (for parking API)
  const officeName = useMemo(() => {
    // First priority: locationName param (when clicking office directly)
    if (locationName) return locationName;
    // Second priority: office field from route response
    if (routeData && 'office' in routeData) {
      return routeData.office;
    }
    // Fallback: destinationName (might not work for "Work"/"Home")
    return destinationName;
  }, [locationName, routeData, destinationName]);

  // ============ MAP STATE ============
  const snapPoints = useMemo(() => ['25%', '50%', '80%'], []);

  // ============ FETCH ROUTES ON MOUNT ============
  useEffect(() => {
    if (!destinationAddress) {
      setRoutesLoading(false);
      setRoutesError('No destination provided');
      return;
    }

    let cancelled = false;

    const fetchRoutes = async () => {
      setRoutesLoading(true);
      setRoutesError(null);
      try {
        const origin = await getUserLocation();
        const data = isHomeRoute
          ? await getRoutesGoHome({ origin, destination: destinationAddress })
          : await getRoutesToOfficeQuickStart({ origin, destinationAddress });
        if (!cancelled) {
          setRouteData(data);
        }
      } catch (err: any) {
        if (cancelled) return;
        if (err?.status === 403 || err?.response?.status === 403) {
          Alert.alert(
            'Routing Unavailable',
            isHomeRoute
              ? 'Routing is only available when you are near a Tesla office.'
              : 'You are at Tesla Office. Routing is not needed here.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
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
  }, [destinationAddress, isHomeRoute, navigation]);

  // ============ FETCH SUBLOTS WHEN OFFICE NAME IS KNOWN ============
  useEffect(() => {
    // Wait until we have a valid office name (either from params or route data)
    // Skip generic names like "Work" or "Home" - wait for route to load with actual office
    if (!officeName || officeName === 'Work' || officeName === 'Home') {
      // If still loading routes, keep sublots loading
      if (routesLoading) return;
      // If routes loaded but no office name, stop loading
      setSublotsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSublots = async () => {
      setSublotsLoading(true);
      try {
        const data = await getParkingForLocation(officeName);
        if (!cancelled) {
          setSublots(data);
          if (data.length > 0) setSelectedSublot(data[0].lot_name);
        }
      } catch (err) {
        console.log('Sublots fetch failed for:', officeName, err);
        if (!cancelled) setSublots([]);
      } finally {
        if (!cancelled) setSublotsLoading(false);
      }
    };

    fetchSublots();
    return () => {
      cancelled = true;
    };
  }, [officeName, routesLoading]);

  // ============ POLYLINE ============
  const polyline = useMemo(() => {
    if (!routeData?.routes?.length) return [];

    // Find route matching current travel mode, or use fastest
    const modeMap: Record<TransportMode, string> = {
      car: 'driving',
      shuttle: 'walking',
      transit: 'transit',
      bike: 'bicycling',
    };
    const targetMode = modeMap[travelMode];
    const matchingRoute = routeData.routes.find(r => r.mode === targetMode);
    const fastestRoute = [...routeData.routes].sort(
      (a, b) => a.duration_sec - b.duration_sec
    )[0];

    const routeToUse = matchingRoute || fastestRoute;

    if (!routeToUse?.polyline) {
      console.log('No polyline found in route:', routeToUse);
      return [];
    }

    try {
      return decodePolyline(routeToUse.polyline);
    } catch (err) {
      console.error('Failed to decode polyline:', err);
      return [];
    }
  }, [routeData, travelMode]);

  // ============ MAP REGION ============
  const mapRegion = useMemo(() => {
    if (!polyline.length) {
      return {
        latitude: 37.3935,
        longitude: -122.15,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    const lats = polyline.map(p => p.latitude);
    const lngs = polyline.map(p => p.longitude);
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
  }, [polyline]);

  // Origin and destination coordinates
  const originCoord = useMemo(() => {
    if (polyline.length > 0) return polyline[0];
    return null;
  }, [polyline]);

  const destCoord = useMemo(() => {
    if (polyline.length > 0) return polyline[polyline.length - 1];
    return { latitude: 37.4419, longitude: -122.143 };
  }, [polyline]);

  // ============ MODE TIMES ============
  const modeTimes: ModeTimes = useMemo(() => {
    if (!routeData?.routes)
      return { car: '--', shuttle: '--', transit: '--', bike: '--' };
    const modeMap: Record<TransportMode, string> = {
      car: 'driving',
      shuttle: 'walking',
      transit: 'transit',
      bike: 'bicycling',
    };
    const times: ModeTimes = {};
    (['car', 'shuttle', 'transit', 'bike'] as TransportMode[]).forEach(mode => {
      const found = routeData.routes?.find(r => r.mode === modeMap[mode]);
      if (found) times[mode] = formatDuration(found.duration_sec);
    });
    return times;
  }, [routeData]);

  // ============ CURRENT ROUTE INFO ============
  const currentRoute = useMemo(() => {
    if (!routeData?.routes?.length) return null;
    const modeMap: Record<TransportMode, string> = {
      car: 'driving',
      shuttle: 'walking',
      transit: 'transit',
      bike: 'bicycling',
    };
    const targetMode = modeMap[travelMode];
    return (
      routeData.routes.find(r => r.mode === targetMode) ||
      [...routeData.routes].sort((a, b) => a.duration_sec - b.duration_sec)[0]
    );
  }, [routeData, travelMode]);

  // Calculate average fullness from sublots
  const averageFullness = useMemo(() => {
    if (sublots.length === 0) return 0;
    const total = sublots.reduce((sum, s) => sum + (s.availability ?? 0), 0);
    return Math.round(total / sublots.length);
  }, [sublots]);

  // ============ HANDLERS ============
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const openInGoogleMaps = useCallback(() => {
    if (!destCoord) return;
    const { latitude, longitude } = destCoord;
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
  }, [destCoord]);

  const handleReport = useCallback(() => {
    Alert.alert(
      'Report Issue',
      'Thank you! Your feedback helps improve our service.'
    );
  }, []);

  // ============ ANIMATE MAP WHEN ROUTE LOADS ============
  useEffect(() => {
    if (polyline.length > 0 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(mapRegion, 600);
      }, 100);
    }
  }, [polyline, mapRegion]);

  // ============ RENDER ============
  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
        >
          {/* Route polyline - only show when loaded */}
          {!routesLoading && polyline.length > 0 && (
            <Polyline
              coordinates={polyline}
              strokeColor="#007AFF"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Origin marker */}
          {originCoord && (
            <Marker coordinate={originCoord} title="You are here">
              <View style={styles.originDot}>
                <View style={styles.originDotInner} />
              </View>
            </Marker>
          )}

          {/* Destination marker */}
          {!routesLoading && destCoord && (
            <Marker coordinate={destCoord} title={destinationName} />
          )}

          {/* Sublot markers - only show when not loading */}
          {!routesLoading &&
            !sublotsLoading &&
            destCoord &&
            sublots.map((sublot, index) => {
              const isSelected = selectedSublot === sublot.lot_name;
              const availability = sublot.availability ?? 0;
              // Offset each sublot marker slightly
              const offsetLat = (index - sublots.length / 2) * 0.0008;
              const offsetLng = (index % 2 === 0 ? 1 : -1) * 0.0005;
              return (
                <Marker
                  key={`sublot-${sublot.lot_name}-${index}`}
                  coordinate={{
                    latitude: destCoord.latitude + offsetLat,
                    longitude: destCoord.longitude + offsetLng,
                  }}
                  title={sublot.lot_name}
                  description={`${availability}% Full`}
                  onPress={() => setSelectedSublot(sublot.lot_name)}
                >
                  <View
                    style={{
                      backgroundColor: isSelected ? '#007AFF' : '#FF3B30',
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}
                  >
                    <Text
                      style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}
                    >
                      {sublot.lot_name}
                    </Text>
                  </View>
                </Marker>
              );
            })}
        </MapView>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        enablePanDownToClose={false}
      >
        <BottomSheetScrollView
          key={travelMode}
          contentContainerStyle={styles.sheetContent}
        >
          {/* Header with back button and location */}
          <RouteHeader
            onBackPress={handleBackPress}
            activeMode={travelMode}
            onModeChange={setTravelMode}
            modeTimes={modeTimes}
          />

          <LocationBox destination={destinationName} />

          {/* Loading State */}
          {routesLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Calculating route...</Text>
            </View>
          )}

          {/* Error State */}
          {routesError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{routesError}</Text>
            </View>
          )}

          {/* Content - show when loaded */}
          {!routesLoading && !routesError && (
            <>
              {/* Route time banner */}
              {currentRoute && (
                <View style={styles.routeTimeBanner}>
                  <Image
                    source={require('../../assets/icons/new/newCar.png')}
                    style={{ width: 20, height: 20, marginRight: 8 }}
                  />
                  <Text style={styles.routeTimeText}>
                    {formatDuration(currentRoute.duration_sec)} drive
                  </Text>
                </View>
              )}

              {/* Destination header */}
              <View style={styles.detailHeaderRow}>
                <Image
                  source={require('../../assets/icons/new/newCar.png')}
                  style={{ width: 28, height: 28, marginRight: 12 }}
                />
                <Text style={styles.detailTitle}>
                  {officeName !== 'Work' && officeName !== 'Home'
                    ? officeName
                    : destinationName}
                </Text>
                <Text style={styles.detailUpdateText}>Updated 2 min ago</Text>
              </View>

              {/* Status section */}
              <View style={styles.statusSection}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>CURRENTLY</Text>
                  <View
                    style={
                      averageFullness >= 80
                        ? styles.dotRed
                        : averageFullness >= 50
                          ? styles.dotYellow
                          : styles.dotGreen
                    }
                  />
                  <Text style={styles.statusValue}>
                    {averageFullness}% full
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>FORECAST</Text>
                  <View style={styles.dotYellow} />
                  <Text style={styles.statusValue}>
                    {getForecastText(averageFullness)}
                  </Text>
                </View>
              </View>

              {/* Sublot selection */}
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
                            isSelected
                              ? styles.sublotRowSelected
                              : styles.sublotRow
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
                    <GHTouchableOpacity style={styles.sublotRowSelected}>
                      <Text style={styles.sublotNameSelected}>Main Lot</Text>
                      <Text style={styles.sublotStatsSelected}>
                        {averageFullness}% full
                      </Text>
                      <View
                        style={
                          averageFullness >= 80
                            ? styles.dotRed
                            : averageFullness >= 50
                              ? styles.dotYellow
                              : styles.dotGreen
                        }
                      />
                    </GHTouchableOpacity>
                  )}
                </View>
              )}

              {/* Also consider shuttle */}
              {travelMode === 'car' && (
                <>
                  <Text style={styles.sectionHeader}>
                    ALSO CONSIDER SHUTTLE
                  </Text>
                  <OptionsCard
                    items={[
                      {
                        id: 'shuttle',
                        title: modeTimes.shuttle || '50m',
                        subtitle: '65% full',
                        icon: require('../../assets/icons/new/newShuttle.png'),
                      },
                    ]}
                    onSelect={() => setTravelMode('shuttle')}
                    style={{ borderWidth: 0, padding: 0 }}
                    itemStyle={{ backgroundColor: '#fff', marginBottom: 12 }}
                  />
                </>
              )}

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <GHTouchableOpacity
                  style={styles.startButton}
                  onPress={openInGoogleMaps}
                >
                  <Text style={styles.startButtonText}>
                    Route to {selectedSublot || destinationName}
                  </Text>
                </GHTouchableOpacity>
              </View>

              {/* Report link */}
              <GHTouchableOpacity
                style={styles.reportLink}
                onPress={handleReport}
              >
                <Text style={styles.reportLinkText}>Report it</Text>
              </GHTouchableOpacity>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  mapContainer: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
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
  bottomSheetBackground: {
    backgroundColor: '#FCFCFC',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomSheetHandle: {
    backgroundColor: '#E0E0E0',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
  },
  sheetContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
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
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    width: 80,
  },
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  sublotList: { marginBottom: 8 },
  sublotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sublotRowSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  sublotName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#000' },
  sublotNameSelected: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  sublotStats: { fontSize: 14, color: '#8E8E93', marginRight: 8 },
  sublotStatsSelected: { fontSize: 14, color: '#007AFF', marginRight: 8 },
  actionRow: { padding: 16, paddingTop: 0 },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  reportLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  reportLinkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
