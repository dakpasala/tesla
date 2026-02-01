import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TransportMode = 'car' | 'transit' | 'bike' | 'walk';

interface RouteOption {
  id: string;
  mode: TransportMode;
  duration: string;
  distance: string;
  details: string;
}

const MOCK_ROUTES: RouteOption[] = [
  {
    id: '1',
    mode: 'car',
    duration: '25 min',
    distance: '12.5 mi',
    details: 'Via US-101 N',
  },
  {
    id: '2',
    mode: 'transit',
    duration: '45 min',
    distance: '14.2 mi',
    details: 'Bus 22 → Caltrain',
  },
  {
    id: '3',
    mode: 'bike',
    duration: '55 min',
    distance: '11.8 mi',
    details: 'Via bike path',
  },
];

const MODE_ICONS: Record<TransportMode, string> = {
  car: '🚗',
  transit: '🚌',
  bike: '🚲',
  walk: '🚶',
};

export default function RoutesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedMode, setSelectedMode] = useState<TransportMode | 'all'>(
    'all'
  );

  const filteredRoutes =
    selectedMode === 'all'
      ? MOCK_ROUTES
      : MOCK_ROUTES.filter(r => r.mode === selectedMode);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Routes</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Origin/Destination */}
      <View style={styles.locationCard}>
        <View style={styles.locationRow}>
          <View style={styles.originDot} />
          <Text style={styles.locationText}>Current Location</Text>
        </View>
        <View style={styles.locationDivider} />
        <View style={styles.locationRow}>
          <View style={styles.destDot} />
          <Text style={styles.locationText}>Tesla HQ, Palo Alto</Text>
        </View>
      </View>

      {/* Mode Filter */}
      <View style={styles.modeFilter}>
        {(['all', 'car', 'transit', 'bike', 'walk'] as const).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeButton,
              selectedMode === mode && styles.modeButtonActive,
            ]}
            onPress={() => setSelectedMode(mode)}
          >
            <Text style={styles.modeButtonText}>
              {mode === 'all' ? 'All' : MODE_ICONS[mode]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Route List */}
      <ScrollView style={styles.routeList}>
        {filteredRoutes.map(route => (
          <TouchableOpacity
            key={route.id}
            style={styles.routeCard}
            onPress={() =>
              navigation.navigate('Directions', { routeId: route.id })
            }
          >
            <View style={styles.routeIcon}>
              <Text style={styles.routeIconText}>{MODE_ICONS[route.mode]}</Text>
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeDuration}>{route.duration}</Text>
              <Text style={styles.routeDetails}>
                {route.distance} • {route.details}
              </Text>
            </View>
            <Text style={styles.routeArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 24,
    color: '#111',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  headerSpacer: {
    width: 24,
  },
  locationCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4285F4',
    marginRight: 12,
  },
  destDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA4335',
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#111',
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginLeft: 22,
  },
  modeFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  modeButtonActive: {
    backgroundColor: '#111',
  },
  modeButtonText: {
    fontSize: 16,
  },
  routeList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  routeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeIconText: {
    fontSize: 24,
  },
  routeInfo: {
    flex: 1,
  },
  routeDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  routeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  routeArrow: {
    fontSize: 20,
    color: '#999',
  },
});
