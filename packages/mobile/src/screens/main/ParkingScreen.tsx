import React, { useRef, useState } from 'react';
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
import { Modalize } from 'react-native-modalize';

// Import existing components
import NavBox from '../../components/NavBox';
import NavBar, { NavScreen } from '../../components/NavBar';

import { getAllParkingAvailability } from '../../services/parkings';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ParkingRouteProp = RouteProp<RootStackParamList, 'Parking'>;

interface ParkingLot {
  id: string;
  name: string;
  sublot?: string;
  status: 'available' | 'limited' | 'full';
  currentPercent?: string;
  forecast?: string;
  sublots?: { name: string; range: string; color: string }[];
}


const SHUTTLE_OPTIONS = [
  { id: 's1', name: 'Shuttle A', status: 'On Time', time: 'Arrives in 5 min' },
  { id: 's2', name: 'Shuttle B', status: 'On Time', time: 'Arrives in 10 min' },
];

const STATUS_COLORS = {
  available: '#34A853',
  limited: '#FBBC04',
  full: '#EA4335',
};

const STATUS_LABELS = {
  available: 'Available',
  limited: 'Limited',
  full: 'Almost Full',
};

export default function ParkingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ParkingRouteProp>();
  const modalRef = useRef<Modalize>(null);

  const fromRoutes = route.params?.fromRoutes ?? false;

  // Transport mode state
  const [transportMode, setTransportMode] = useState<NavScreen>('car');
  const [selectedLot, setSelectedLot] = useState<string | null>(null);

  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);

  function availabilityToStatus(availability: number): ParkingLot['status'] {
    if (availability > 30) return 'available';
    if (availability > 10) return 'limited';
    return 'full';
  }

  React.useEffect(() => {
    async function loadParking() {
      try {
        const rows = await getAllParkingAvailability();

        const mapped: ParkingLot[] = rows.map((row, idx) => ({
          id: `${row.loc_name}-${row.lot_name}`,
          name: row.lot_name,
          status: availabilityToStatus(row.availability),
        }));

        setParkingLots(mapped);
      } catch (e) {
        console.error('Failed to load parking data', e);
      } finally {
        setLoading(false);
      }
    }

    loadParking();
  }, []);

  const handleSelectLot = (lot: ParkingLot) => {
    setSelectedLot(lot.id);
  };

  const handleRouteToLot = () => {
    if (selectedLot) {
      navigation.navigate('Directions', { routeId: selectedLot });
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder} />
      </View>

      {/* NavBox overlay */}
      <View style={styles.navBoxOverlay}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.navBoxWrapper}>
          <NavBox
            currentLocation="Current"
            destination="Tesla HQ Deer Creek"
            currentLocationIcon={require('../../assets/icons/current.png')}
            destinationIcon={require('../../assets/icons/destination.png')}
            onCurrentLocationChange={() => {}}
            onDestinationChange={() => {}}
          />
        </View>
      </View>

      {/* Bottom Sheet */}
      <Modalize
        ref={modalRef}
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        alwaysOpen={450}
        modalHeight={600}
      >
        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Transport Mode Tabs */}
          <NavBar
            currentScreen={transportMode}
            onScreenChange={setTransportMode}
          />

          {/* Parking Lots */}
          <View style={styles.lotsSection}>
            {parkingLots.map(lot => {
              const isSelected = selectedLot === lot.id;

              return (
                <TouchableOpacity
                  key={lot.id}
                  style={[styles.lotCard, isSelected && styles.lotCardSelected]}
                  onPress={() => handleSelectLot(lot)}
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.lotHeaderRow,
                      isSelected && { marginBottom: 12 },
                    ]}
                  >
                    <View style={styles.lotInfo}>
                      <Text style={styles.lotName}>{lot.name}</Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: STATUS_COLORS[lot.status] },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: STATUS_COLORS[lot.status] },
                          ]}
                        >
                          {STATUS_LABELS[lot.status]}
                        </Text>
                      </View>
                    </View>
                    {/* Chevron or Selection Indicator */}
                    <View style={styles.chevronContainer}>
                      {isSelected ? (
                        <Text style={{ color: '#4285F4', fontWeight: 'bold' }}>
                          ✓
                        </Text>
                      ) : (
                        <Text style={{ color: '#ccc' }}>›</Text>
                      )}
                    </View>
                  </View>

                  {/* Expanded/Selected View with Sublots details or Metrics */}
                  {isSelected &&
                    lot.id === '1' && ( // Hardcoded for demo: Deer Creek only showing extra details
                      <View style={styles.lotDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>SUBLOT A</Text>
                          <Text style={styles.detailValue}>
                            95% Full · Limited
                          </Text>
                        </View>
                        <View style={styles.detailRowSelected}>
                          <Text style={styles.detailLabelSelected}>
                            SUBLOT B
                          </Text>
                          <Text style={styles.detailValueSelected}>
                            60% Full · Available
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>SUBLOT C</Text>
                          <Text style={styles.detailValue}>
                            80% Full · Limited
                          </Text>
                        </View>
                        <Text style={styles.forecastText}>
                          Also consider Shuttle: 5 mins wait
                        </Text>
                      </View>
                    )}

                  {isSelected && lot.id !== '1' && (
                    <View style={styles.lotDetails}>
                      <Text style={styles.forecastText}>
                        Typically fills up by 9:00 AM
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Also Consider Shuttles */}
          <View style={styles.shuttleSection}>
            <Text style={styles.sectionTitle}>ALSO CONSIDER</Text>
            {SHUTTLE_OPTIONS.map(shuttle => (
              <TouchableOpacity key={shuttle.id} style={styles.shuttleCard}>
                <View style={styles.shuttleIcon}>
                  <Text style={styles.shuttleEmoji}>🚌</Text>
                </View>
                <View style={styles.shuttleInfo}>
                  <Text style={styles.shuttleName}>{shuttle.name}</Text>
                  <View style={styles.shuttleStatusRow}>
                    <View
                      style={[styles.statusDot, { backgroundColor: '#34A853' }]}
                    />
                    <Text style={styles.shuttleStatusText}>
                      {shuttle.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.shuttleTime}>{shuttle.time}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.otherLotsBtn}>
              <Text style={styles.otherLotsText}>Other Lots</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.routeBtn, !selectedLot && styles.routeBtnDisabled]}
              onPress={handleRouteToLot}
              disabled={!selectedLot}
            >
              <Text style={styles.routeBtnText}>
                Route to{' '}
                {selectedLot
                  ? parkingLots.find(l => l.id === selectedLot)?.name
                  : 'Lot'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modalize>
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8e8e8',
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
  modalStyle: {
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleStyle: {
    backgroundColor: '#DEDEDE',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 10,
  },
  sheetContent: {
    flex: 1,
    paddingTop: 5,
  },
  lotsSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  lotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    marginBottom: 10,
  },
  lotCardSelected: {
    borderColor: '#4285F4',
    borderWidth: 2,
  },
  lotInfo: {
    flex: 1,
  },
  lotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  sublotText: {
    fontWeight: '400',
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
  },
  shuttleSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  shuttleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    marginBottom: 8,
  },
  shuttleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shuttleEmoji: {
    fontSize: 20,
  },
  shuttleInfo: {
    flex: 1,
  },
  shuttleName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  shuttleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  shuttleStatusText: {
    fontSize: 12,
    color: '#34A853',
  },
  shuttleTime: {
    fontSize: 12,
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  otherLotsBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    alignItems: 'center',
  },
  otherLotsText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  routeBtn: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: '#4285F4',
    borderRadius: 10,
    alignItems: 'center',
  },
  routeBtnDisabled: {
    backgroundColor: '#ccc',
  },
  routeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  lotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  lotDetails: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 12,
    color: '#000',
  },
  detailRowSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#E8F2FF',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  detailLabelSelected: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4285F4',
  },
  detailValueSelected: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4285F4',
  },
  forecastText: {
    fontSize: 12,
    color: '#F57C00',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
