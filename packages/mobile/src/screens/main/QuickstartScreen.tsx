// packages/mobile/src/screens/main/QuickstartScreen.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

// Import existing components
import RouteCards, { RouteCardItem } from '../../components/RouteCards';
import {
  RouteHeader,
  TransportMode,
  ModeTimes,
} from '../../components/RouteHeader';
import { LocationBox } from '../../components/LocationBox';

// Import API services
import {
  getRoutesGoHome,
  getRoutesToOfficeQuickStart,
  RouteResponse,
} from '../../services/maps';
import { getUserLocation } from '../../services/location';

// Polyline decoding utility
function decodePolyline(
  encoded: string
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let b: number;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

// Helper: seconds -> readable string
function formatDuration(sec: number): string {
  const mins = Math.round(sec / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

// Helper: meters -> miles string
function formatDistance(m: number): string {
  return (m / 1609.34).toFixed(1) + ' mi';
}

// Icon map for route modes
const MODE_ICONS: Record<string, any> = {
  driving: require('../../assets/icons/new/newCar.png'),
  transit: require('../../assets/icons/new/newBus.png'),
  walking: require('../../assets/icons/new/newShuttle.png'),
  bicycling: require('../../assets/icons/new/newBike.png'),
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type QuickstartRouteProp = RouteProp<RootStackParamList, 'Quickstart'>;

export default function QuickstartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QuickstartRouteProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Route data can come from params (pre-fetched) or be fetched here
  const [fetchedRouteData, setFetchedRouteData] =
    useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeData = route.params?.routeData ?? fetchedRouteData;
  const destinationName =
    route.params?.destinationName ||
    route.params?.destination ||
    routeData?.office ||
    'Destination';
  const destinationAddress = route.params?.destinationAddress;
  const isHomeRoute = route.params?.isHomeRoute;

  // Transport mode state
  const [transportMode, setTransportMode] = useState<TransportMode>('car');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Bottom sheet snap points matching DirectionsScreen
  const snapPoints = useMemo(() => ['20%', '50%', '80%'], []);

  // Fetch routes if not provided via params
  useEffect(() => {
    // If we already have route data from params, skip fetching
    if (route.params?.routeData) {
      return;
    }

    // If no address to fetch for, skip
    if (!destinationAddress) {
      return;
    }

    let cancelled = false;

    const fetchRoutes = async () => {
      setLoading(true);
      setError(null);

      try {
        const origin = await getUserLocation();

        let data: RouteResponse;
        if (isHomeRoute) {
          data = await getRoutesGoHome({
            origin,
            destination: destinationAddress,
          });
        } else {
          data = await getRoutesToOfficeQuickStart({
            origin,
            destinationAddress,
          });
        }

        if (!cancelled) {
          setFetchedRouteData(data);
        }
      } catch (err: any) {
        if (cancelled) return;

        if (err?.status === 403 || err?.response?.status === 403) {
          const message = isHomeRoute
            ? 'Routing is only available when you are near a Tesla office.'
            : 'You are at Tesla Office. Routing is not needed here.';
          Alert.alert('Routing Unavailable', message, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }

        setError('Failed to load routes. Please try again.');
        console.error('Failed to fetch routes:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRoutes();

    return () => {
      cancelled = true;
    };
  }, [destinationAddress, isHomeRoute, navigation, route.params?.routeData]);

  // Build RouteCardItems from the API response
  const { quickStart, otherRoutes } = useMemo(() => {
    if (!routeData?.routes || routeData.routes.length === 0) {
      return { quickStart: [], otherRoutes: [] };
    }

    const sorted = [...routeData.routes].sort(
      (a, b) => a.duration_sec - b.duration_sec
    );
    const best = sorted[0];
    const rest = sorted.slice(1);

    const toCard = (r: typeof best, index: number): RouteCardItem => ({
      id: String(index),
      icon: MODE_ICONS[r.mode] || MODE_ICONS.driving,
      duration: formatDuration(r.duration_sec),
      etaText: formatDistance(r.distance_m),
      subtitle: r.mode.charAt(0).toUpperCase() + r.mode.slice(1),
    });

    return {
      quickStart: [toCard(best, 0)],
      otherRoutes: rest.map((r, i) => toCard(r, i + 1)),
    };
  }, [routeData]);

  // Decode polyline for the selected or best route to draw on map
  const activePolyline = useMemo(() => {
    if (!routeData?.routes || routeData.routes.length === 0) return [];
    const sorted = [...routeData.routes].sort(
      (a, b) => a.duration_sec - b.duration_sec
    );
    const idx = selectedRouteId ? parseInt(selectedRouteId, 10) : 0;
    const active = sorted[idx] || sorted[0];
    return decodePolyline(active.polyline);
  }, [routeData, selectedRouteId]);

  // Compute map region from polyline points
  const mapRegion = useMemo(() => {
    if (activePolyline.length === 0) {
      return {
        latitude: 37.3935,
        longitude: -122.15,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const lats = activePolyline.map(p => p.latitude);
    const lngs = activePolyline.map(p => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padLat = (maxLat - minLat) * 0.15;
    const padLng = (maxLng - minLng) * 0.15;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: maxLat - minLat + padLat * 2,
      longitudeDelta: maxLng - minLng + padLng * 2,
    };
  }, [activePolyline]);

  const handleRoutePress = (item: RouteCardItem) => {
    setSelectedRouteId(item.id);

    if (item.showParkingWarning) {
      navigation.navigate('Parking', { fromRoutes: true });
      return;
    }

    // Determine the travel mode from the route item
    const modeFromSubtitle = item.subtitle?.toLowerCase() || '';
    let travelMode: 'car' | 'shuttle' | 'transit' | 'bike' = 'car';

    if (
      modeFromSubtitle.includes('driving') ||
      modeFromSubtitle.includes('car')
    ) {
      travelMode = 'car';
    } else if (
      modeFromSubtitle.includes('walking') ||
      modeFromSubtitle.includes('shuttle')
    ) {
      travelMode = 'shuttle';
    } else if (
      modeFromSubtitle.includes('transit') ||
      modeFromSubtitle.includes('bus')
    ) {
      travelMode = 'transit';
    } else if (
      modeFromSubtitle.includes('bicycling') ||
      modeFromSubtitle.includes('bike')
    ) {
      travelMode = 'bike';
    }

    // Navigate to Availability with params to start in detail view (sublots)
    navigation.navigate('Availability', {
      routeId: item.id,
      parkingLotName: destinationName,
      travelMode,
      startInDetailView: true,
      destinationName,
    });
  };

  // Origin = first point, destination = last point of polyline
  const origin = activePolyline.length > 0 ? activePolyline[0] : null;
  const dest =
    activePolyline.length > 0
      ? activePolyline[activePolyline.length - 1]
      : null;

  // Compute mode times from route data
  const modeTimes: ModeTimes = useMemo(() => {
    if (!routeData?.routes) {
      return { car: '30m', shuttle: '50m', transit: '1hr5m', bike: '30m' };
    }

    const modeMap: Record<TransportMode, string> = {
      car: 'driving',
      shuttle: 'walking',
      transit: 'transit',
      bike: 'bicycling',
    };

    const times: ModeTimes = {};
    (['car', 'shuttle', 'transit', 'bike'] as TransportMode[]).forEach(mode => {
      const found = routeData.routes?.find(r => r.mode === modeMap[mode]);
      if (found) {
        times[mode] = formatDuration(found.duration_sec);
      }
    });

    return times;
  }, [routeData]);

  return (
    <View style={styles.container}>
      {/* Google Map with polyline */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
        >
          {/* Draw the route polyline */}
          {activePolyline.length > 0 && (
            <Polyline
              coordinates={activePolyline}
              strokeColor="#007AFF"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Origin marker */}
          {origin && (
            <Marker coordinate={origin} title="You are here">
              <View style={styles.originDot}>
                <View style={styles.originDotInner} />
              </View>
            </Marker>
          )}

          {/* Destination marker */}
          {dest && <Marker coordinate={dest} title={destinationName} />}
        </MapView>
      </View>

      {/* Header Overlay - LocationBox */}
      <LocationBox destination={destinationName} />

      {/* Bottom Sheet - using @gorhom/bottom-sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        style={{ zIndex: 100 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Shared RouteHeader: Back Button, Tabs, Time Selector */}
          <RouteHeader
            onBackPress={() => navigation.goBack()}
            activeMode={transportMode}
            onModeChange={setTransportMode}
            modeTimes={modeTimes}
          />

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Finding best routes...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Routes Content - only show when not loading and no error */}
          {!loading && !error && (
            <>
              {/* Quick Start Routes */}
              {quickStart.length > 0 && (
                <View style={styles.section}>
                  <RouteCards
                    title="QUICK START"
                    items={quickStart}
                    onPressItem={handleRoutePress}
                  />
                </View>
              )}

              {/* Other Routes */}
              {otherRoutes.length > 0 && (
                <View style={styles.section}>
                  <RouteCards
                    title="OTHER MODES"
                    items={otherRoutes}
                    onPressItem={handleRoutePress}
                  />
                </View>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
  // Bottom Sheet styles matching DirectionsScreen
  bottomSheetBackground: {
    backgroundColor: '#FCFCFC',
    borderRadius: 24,
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
    backgroundColor: '#E0E0E0',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 12,
  },
  parkingButton: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  parkingButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});
