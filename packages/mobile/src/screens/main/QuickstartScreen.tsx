// packages/mobile/src/screens/main/QuickstartScreen.tsx
// Unified screen: route selection -> parking/shuttle/transit views
// Single MapView that never unmounts for seamless transitions

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
import Svg, { Circle, Line } from 'react-native-svg';

// Components

import {
  RouteHeader,
  TransportMode,
  ModeTimes,
} from '../../components/RouteHeader';
import { LocationBox } from '../../components/LocationBox';

// API services
import {
  getRoutesGoHome,
  getRoutesToOffice,
  getRoutesToOfficeQuickStart,
  RouteResponse,
} from '../../services/maps';
import { getUserLocation } from '../../services/location';
import {
  getAllLocations,
  getAllParkingAvailability,
  getParkingForLocation,
  ParkingRow,
} from '../../services/parkings';
import { useRideContext, TravelMode } from '../../context/RideContext';

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

function formatDistance(m: number): string {
  return (m / 1609.34).toFixed(1) + ' mi';
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
type QuickstartRouteProp = RouteProp<RootStackParamList, 'Quickstart'>;
type ScreenPhase = 'routes' | 'availability';
type ViewMode = 'list' | 'detail';

export default function QuickstartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QuickstartRouteProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const { travelMode, setTravelMode } = useRideContext();

  // ============ PHASE STATE ============
  const [phase, setPhase] = useState<ScreenPhase>('availability');
  const [viewMode, setViewMode] = useState<ViewMode>('detail');

  // ============ ROUTE DATA STATE ============
  const [fetchedRouteData, setFetchedRouteData] =
    useState<RouteResponse | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);

  const routeData = route.params?.routeData ?? fetchedRouteData;
  const destinationName =
    route.params?.destinationName ||
    route.params?.destination ||
    routeData?.office ||
    'Destination';
  const destinationAddress = route.params?.destinationAddress;
  const isHomeRoute = route.params?.isHomeRoute;

  // ============ PARKING DATA STATE ============
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [parkingLoading, setParkingLoading] = useState(false);
  const [parkingError, setParkingError] = useState<string | null>(null);
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(
    null
  );
  const [sublots, setSublots] = useState<ParkingRow[]>([]);
  const [sublotsLoading, setSublotsLoading] = useState(false);
  const [selectedSublot, setSelectedSublot] = useState<string>('');

  // ============ MAP STATE ============
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const snapPoints = useMemo(() => ['20%', '50%', '80%'], []);

  // ============ FETCH ROUTES ============
  useEffect(() => {
    if (route.params?.routeData || !destinationAddress) return;
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
  }, [destinationAddress, isHomeRoute, navigation, route.params?.routeData]);

  // ============ FETCH PARKING LOTS ============
  useEffect(() => {
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

        // Match by location name instead of ID
        const merged: ParkingLot[] = locations.map((loc: any) => {
          // Find all parking lots for this location
          const lotsForLocation = availability.filter(
            (a: any) => a.loc_name === loc.name
          );

          // Calculate average fullness across all lots
          const totalFullness = lotsForLocation.reduce(
            (sum, lot) => sum + (lot.availability ?? 0),
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
        if (merged.length > 0 && !selectedParkingId) {
          // Find lot matching destination name, otherwise fallback to first
          const targetLot = merged.find(
            l => l.name === destinationName || l.name.includes(destinationName)
          );
          setSelectedParkingId(targetLot ? targetLot.id : merged[0].id);
        }
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
  }, [phase, parkingLots.length, selectedParkingId]);

  // ============ FETCH SUBLOTS ============
  useEffect(() => {
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
  }, [phase, viewMode, selectedParkingId, parkingLots]);

  // ============ POLYLINE ============
  // Original route polyline from API (initial destination)
  const originalPolyline = useMemo(() => {
    if (!routeData?.routes?.length) return [];
    const sorted = [...routeData.routes].sort(
      (a, b) => a.duration_sec - b.duration_sec
    );
    const idx = selectedRouteId ? parseInt(selectedRouteId, 10) : 0;
    return decodePolyline((sorted[idx] || sorted[0]).polyline);
  }, [routeData, selectedRouteId]);

  // Get origin from original polyline
  const originCoord = useMemo(() => {
    if (originalPolyline.length > 0) return originalPolyline[0];
    return null;
  }, [originalPolyline]);

  // Active polyline - uses office route when in detail view with calculated route
  const activePolyline = useMemo(() => {
    // Always use original route polyline (initial fetch)
    return originalPolyline;
  }, [originalPolyline]);

  // ============ MAP REGIONS ============
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

  // UseEffect to auto-zoom when route appears
  useEffect(() => {
    if (activePolyline.length > 0) {
      setTimeout(() => {
        mapRef.current?.animateToRegion(routeMapRegion, 800);
      }, 500);
    }
  }, [activePolyline, routeMapRegion]);

  const destCoord = useMemo(() => {
    if (activePolyline.length > 0)
      return activePolyline[activePolyline.length - 1];
    return { latitude: 37.4419, longitude: -122.143 };
  }, [activePolyline]);

  // ============ MODE TIMES ============
  const modeTimes: ModeTimes = useMemo(() => {
    if (!routeData?.routes)
      return { car: '30m', shuttle: '50m', transit: '1hr5m', bike: '30m' };
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

  // ============ HANDLERS ============

  const handleParkingSelect = useCallback((id: string) => {
    setSelectedParkingId(id);
    // Don't auto-switch to detail view - user must click "Route to" button
    // Don't zoom the map - keep current view
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

  // ============ BACK BUTTON ============
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const origin = activePolyline.length > 0 ? activePolyline[0] : null;
  const dest =
    activePolyline.length > 0
      ? activePolyline[activePolyline.length - 1]
      : null;
  const selectedLot = parkingLots.find(p => p.id === selectedParkingId);

  const routeDuration = useMemo(() => {
    if (fetchedRouteData?.routes?.length) {
      const sorted = [...fetchedRouteData.routes].sort(
        (a, b) => a.duration_sec - b.duration_sec
      );
      return formatDuration(sorted[0].duration_sec);
    }
    return null;
  }, [fetchedRouteData]);

  // ============ RENDER: PARKING DETAIL ============
  const renderParkingDetail = () => {
    const lot = selectedLot;
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
          <Text style={styles.detailUpdateText}>Updated 2 min ago</Text>
        </View>

        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>CURRENTLY</Text>
            <View style={styles.dotYellow} />
            <Text style={styles.statusValue}>{lot?.fullness ?? 0}% full</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>FORECAST</Text>
            <View style={styles.dotRed} />
            <Text style={styles.statusValue}>
              {getForecastText(lot?.fullness ?? 0)}
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
          <Text style={styles.shuttleSuggestionText}>50 min</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.dotYellow} />
          <Text style={styles.statusValue}>65% full</Text>
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

  // ============ RENDER: AVAILABILITY CONTENT (based on travel mode) ============
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

    // Car mode always shows parking detail
    if (travelMode === 'car') {
      return renderParkingDetail();
    }
    return renderRouteContent();
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={routeMapRegion}
        >
          {activePolyline.length > 0 && (
            <Polyline
              coordinates={activePolyline}
              strokeColor="#007AFF"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {origin && (
            <Marker coordinate={origin} title="You are here">
              <View style={styles.originDot}>
                <View style={styles.originDotInner} />
              </View>
            </Marker>
          )}
          {phase === 'routes' && dest && (
            <Marker coordinate={dest} title={destinationName} />
          )}
          {/* Parking lot markers in availability phase */}
          {phase === 'availability' &&
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
          {phase === 'availability' && viewMode === 'detail' && selectedLot && (
            <Marker
              coordinate={selectedLot.coordinate}
              title={selectedLot.name}
              description={`${selectedLot.fullness}% Full`}
            >
              <View
                style={{
                  backgroundColor: '#007AFF',
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
                  {selectedLot.fullness}%
                </Text>
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      <LocationBox destination={destinationName} />

      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        style={{ zIndex: 100 }}
      >
        <BottomSheetScrollView
          key={`${phase}-${viewMode}-${travelMode}`}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <RouteHeader
            onBackPress={handleBackPress}
            activeMode={travelMode as TransportMode}
            onModeChange={mode => setTravelMode(mode as TravelMode)}
            modeTimes={modeTimes}
          />
          {renderAvailabilityContent()}
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
  section: { marginBottom: 12 },
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#000' },
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
  detailFooter: { flexDirection: 'row', marginTop: 8 },
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
