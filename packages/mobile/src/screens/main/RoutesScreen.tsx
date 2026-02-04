// packages/mobile/src/screens/main/RoutesScreen.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

// Import existing components
import NavBox from '../../components/NavBox';
import NavBar, { NavScreen } from '../../components/NavBar';
import RouteCards, { RouteCardItem } from '../../components/RouteCards';

// Polyline decoding utility
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
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
type RoutesRouteProp = RouteProp<RootStackParamList, 'Routes'>;

export default function RoutesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutesRouteProp>();

  const routeData = route.params?.routeData;
  const destinationName = route.params?.destination || routeData?.office || 'Home';

  // Transport mode state
  const [transportMode, setTransportMode] = useState<NavScreen>('car');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Build RouteCardItems from the API response
  const { quickStart, otherRoutes } = useMemo(() => {
    if (!routeData?.routes || routeData.routes.length === 0) {
      return { quickStart: [], otherRoutes: [] };
    }

    const sorted = [...routeData.routes].sort((a, b) => a.duration_sec - b.duration_sec);
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
    const sorted = [...routeData.routes].sort((a, b) => a.duration_sec - b.duration_sec);
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
    } else {
      navigation.navigate('Directions', { routeId: item.id });
    }
  };

  const handleViewParking = () => {
    navigation.navigate('Parking', { fromRoutes: true });
  };

  // Origin = first point, destination = last point of polyline
  const origin = activePolyline.length > 0 ? activePolyline[0] : null;
  const dest = activePolyline.length > 0 ? activePolyline[activePolyline.length - 1] : null;

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
          {dest && (
            <Marker coordinate={dest} title={destinationName} />
          )}
        </MapView>
      </View>

      {/* NavBox overlay at top */}
      <View style={styles.navBoxOverlay}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.navBoxWrapper}>
          <NavBox
            currentLocation="Current"
            destination={destinationName}
            currentLocationIcon={require('../../assets/icons/current.png')}
            destinationIcon={require('../../assets/icons/destination.png')}
            onCurrentLocationChange={() => {}}
            onDestinationChange={() => {}}
          />
        </View>
      </View>

      {/* Bottom Sheet - simple positioned View instead of Modalize */}
      <View style={styles.bottomSheet}>
        <View style={styles.handleWrapper}>
          <View style={styles.handleStyle} />
        </View>
        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Transport Mode Tabs */}
          <NavBar
            currentScreen={transportMode}
            onScreenChange={setTransportMode}
          />

          {/* Time Selector */}
          <View style={styles.section}>
            <Text>Time Selector placeholder</Text>
          </View>

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

          {/* View Parking Button */}
          <TouchableOpacity
            style={styles.parkingButton}
            onPress={handleViewParking}
          >
            <Text style={styles.parkingButtonText}>
              🅿️ View Parking Availability
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
  navBoxOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 20,
    color: '#111',
  },
  navBoxWrapper: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  handleWrapper: {
    alignItems: 'center',
    paddingTop: 10,
  },
  handleStyle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DEDEDE',
  },
  sheetContent: {
    flex: 1,
    paddingTop: 5,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  parkingButton: {
    marginHorizontal: 16,
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
});