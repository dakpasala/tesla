import React from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { ParkingLot } from '../services/parkings';
import { ParkingRow } from '../services/parkings';
import { getForecastText } from '../helpers/mapUtils';
import { ModeTimes } from './RouteHeader';
import { TravelMode } from '../context/RideContext';

interface ParkingDetailViewProps {
  selectedLot: ParkingLot | undefined;
  routesLoading: boolean;
  routeDuration: string | null;
  sublotsLoading: boolean;
  sublots: ParkingRow[];
  selectedSublot: string;
  onSelectSublot: (name: string) => void;
  onSetTravelMode: (mode: TravelMode) => void;
  modeTimes: ModeTimes;
  onOpenInGoogleMaps: () => void;
}

export function ParkingDetailView({
  selectedLot,
  routesLoading,
  routeDuration,
  sublotsLoading,
  sublots,
  selectedSublot,
  onSelectSublot,
  onSetTravelMode,
  modeTimes,
  onOpenInGoogleMaps,
}: ParkingDetailViewProps) {
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
            source={require('../assets/icons/new/newCar.png')}
            style={{ width: 20, height: 20, marginRight: 8 }}
          />
          <Text style={styles.routeTimeText}>{routeDuration} drive</Text>
        </View>
      )}

      <View style={styles.detailHeaderRow}>
        <Image
          source={require('../assets/icons/new/newCar.png')}
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

              const capacity = sublot.capacity ?? 0;
              const available = sublot.current_available ?? 0;
              const taken = Math.max(0, capacity - available);
              const fullness =
                capacity > 0 ? Math.round((taken / capacity) * 100) : 0;

              const dotStyle = getDotStyle(fullness);
              return (
                <GHTouchableOpacity
                  key={`${sublot.loc_name}-${sublot.lot_name}-${index}`}
                  style={
                    isSelected ? styles.sublotRowSelected : styles.sublotRow
                  }
                  onPress={() => onSelectSublot(sublot.lot_name)}
                >
                  <Text
                    style={
                      isSelected ? styles.sublotNameSelected : styles.sublotName
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
                    {fullness}% full
                  </Text>
                  <View style={dotStyle} />
                </GHTouchableOpacity>
              );
            })
          ) : (
            <GHTouchableOpacity
              style={styles.sublotRowSelected}
              onPress={() => onSelectSublot('Main Lot')}
            >
              <Text style={styles.sublotNameSelected}>MAIN LOT</Text>
              <Text style={styles.sublotStatsSelected}>
                {lot?.fullness ?? 0}% full
              </Text>
              <View style={getDotStyle(lot?.fullness ?? 0)} />
            </GHTouchableOpacity>
          )}
        </View>
      )}

      <Text style={styles.sectionHeader}>ALSO CONSIDER SHUTTLE</Text>
      <GHTouchableOpacity
        style={styles.shuttleSuggestionCard}
        onPress={() => onSetTravelMode('shuttle')}
      >
        <Image
          source={require('../assets/icons/new/newShuttle.png')}
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
          onPress={onOpenInGoogleMaps}
        >
          <Text style={styles.startButtonText}>
            Route to {selectedSublot || 'Lot'}
          </Text>
        </GHTouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    marginTop: 12,
    textTransform: 'uppercase',
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
});
