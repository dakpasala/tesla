import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Modalize } from 'react-native-modalize';

// Import existing components
import NavBox from '../../components/NavBox';
import NavBar, { NavScreen } from '../../components/NavBar';
import OptionsCard, { OptionItem } from '../../components/OptionsCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ParkingLot {
  id: string;
  name: string;
  sublot: string;
  status: 'available' | 'limited' | 'full';
  extraTime?: string;
}

const PARKING_LOTS: ParkingLot[] = [
  { id: '1', name: 'Deer Creek', sublot: 'Sublot B', status: 'full' },
  { id: '2', name: 'Page Mill', sublot: '', status: 'available' },
  {
    id: '3',
    name: 'Hanover',
    sublot: '',
    status: 'limited',
    extraTime: '+ 2 min',
  },
];

const SHUTTLE_OPTIONS = [
  {
    id: 's1',
    name: 'Shuttle A',
    status: 'On Time',
    arriveTime: 'Arrives in 5 min',
  },
  {
    id: 's2',
    name: 'Shuttle B',
    status: 'On Time',
    arriveTime: 'Arrives in 10 min',
  },
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
  const modalRef = useRef<Modalize>(null);

  // Transport mode state
  const [transportMode, setTransportMode] = useState<NavScreen>('car');

  // Location state
  const [currentLocation, setCurrentLocation] = useState('Current');
  const [destination, setDestination] = useState('Tesla HQ Deer Creek');

  const [selectedLot, setSelectedLot] = useState<string | null>(null);

  const handleLotSelect = (lot: ParkingLot) => {
    setSelectedLot(lot.id);
  };

  const handleRouteToLot = () => {
    if (selectedLot) {
      navigation.navigate('Directions', { routeId: selectedLot });
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Background (placeholder) */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Parking map will go here */}
        </View>

        {/* Back button overlay */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      {/* NavBox for origin/destination */}
      <View style={styles.navBoxContainer}>
        <NavBox
          currentLocation={currentLocation}
          destination={destination}
          currentLocationIcon={require('../../assets/icons/current.png')}
          destinationIcon={require('../../assets/icons/destination.png')}
          onCurrentLocationChange={setCurrentLocation}
          onDestinationChange={setDestination}
        />
      </View>

      {/* Bottom Sheet */}
      <Modalize
        ref={modalRef}
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        alwaysOpen={450}
        modalHeight={650}
        panGestureEnabled={true}
        withHandle={true}
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

          {/* Parking Lots List */}
          <View style={styles.lotsSection}>
            {PARKING_LOTS.map(lot => (
              <TouchableOpacity
                key={lot.id}
                style={[
                  styles.lotCard,
                  selectedLot === lot.id && styles.lotCardSelected,
                ]}
                onPress={() => handleLotSelect(lot)}
              >
                <View style={styles.lotInfo}>
                  <Text style={styles.lotName}>
                    {lot.name}{' '}
                    {lot.sublot && (
                      <Text style={styles.sublotText}>{lot.sublot}</Text>
                    )}
                  </Text>
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
                {lot.extraTime && (
                  <Text style={styles.extraTime}>{lot.extraTime}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Also Consider Shuttles */}
          <View style={styles.shuttleSection}>
            <Text style={styles.sectionTitle}>ALSO CONSIDER</Text>
            {SHUTTLE_OPTIONS.map(shuttle => (
              <TouchableOpacity key={shuttle.id} style={styles.shuttleCard}>
                <View style={styles.shuttleIcon}>
                  <Text style={styles.shuttleIconText}>🚌</Text>
                </View>
                <View style={styles.shuttleInfo}>
                  <Text style={styles.shuttleName}>{shuttle.name}</Text>
                  <View style={styles.shuttleStatusRow}>
                    <View
                      style={[styles.statusDot, { backgroundColor: '#34A853' }]}
                    />
                    <Text style={styles.shuttleStatus}>{shuttle.status}</Text>
                  </View>
                </View>
                <Text style={styles.shuttleTime}>{shuttle.arriveTime}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.otherLotsButton}>
              <Text style={styles.otherLotsText}>Other Lots</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.routeButton,
                !selectedLot && styles.routeButtonDisabled,
              ]}
              onPress={handleRouteToLot}
              disabled={!selectedLot}
            >
              <Text style={styles.routeButtonText}>
                Route to{' '}
                {selectedLot
                  ? PARKING_LOTS.find(l => l.id === selectedLot)?.name
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
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 24,
    color: '#111',
  },
  navBoxContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
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
  extraTime: {
    fontSize: 13,
    color: '#666',
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
  shuttleIconText: {
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
  shuttleStatus: {
    fontSize: 12,
    color: '#34A853',
  },
  shuttleTime: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  otherLotsButton: {
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
  routeButton: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: '#4285F4',
    borderRadius: 10,
    alignItems: 'center',
  },
  routeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  routeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
