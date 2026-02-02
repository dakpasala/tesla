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
import RouteCards, { RouteCardItem } from '../../components/RouteCards';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RoutesRouteProp = RouteProp<RootStackParamList, 'Routes'>;

// Mock route data
const QUICK_START_ROUTES: RouteCardItem[] = [
  {
    id: '1',
    icon: require('../../assets/icons/new/newShuttle.png'),
    duration: '50m',
    etaText: '9:30AM ETA',
    subtitle: 'Stevens Creek/Albany · Leaves At 8:45AM',
  },
];

const OTHER_ROUTES: RouteCardItem[] = [
  {
    id: '2',
    icon: require('../../assets/icons/new/newCar.png'),
    duration: '35m',
    etaText: '8:15AM ETA',
    showParkingWarning: true,
    parkingWarningText: 'Parking 90% full on arrival',
  },
  {
    id: '3',
    icon: require('../../assets/icons/new/newBus.png'),
    duration: '1h 10m',
    etaText: '10:20AM ETA',
    subtitle: 'Stevens Creek/Albany · Leaves In 30 Min',
  },
];

export default function RoutesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutesRouteProp>();
  const modalRef = useRef<Modalize>(null);

  // Get destination from params
  const destinationName = route.params?.destinationName || 'Tesla Deer Creek';

  // Transport mode state
  const [transportMode, setTransportMode] = useState<NavScreen>('car');

  // Location state
  const [currentLocation, setCurrentLocation] = useState('Current');
  const [destination, setDestination] = useState(destinationName);

  const handleRoutePress = (item: RouteCardItem) => {
    // If parking warning, show parking first
    if (item.showParkingWarning) {
      navigation.navigate('Parking', { fromRoutes: true });
    } else {
      navigation.navigate('Directions', { routeId: item.id });
    }
  };

  const handleViewParking = () => {
    navigation.navigate('Parking', { fromRoutes: true });
  };

  return (
    <View style={styles.container}>
      {/* Map Background (placeholder) */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Route map will go here */}
        </View>
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
            currentLocation={currentLocation}
            destination={destination}
            currentLocationIcon={require('../../assets/icons/current.png')}
            destinationIcon={require('../../assets/icons/destination.png')}
            onCurrentLocationChange={setCurrentLocation}
            onDestinationChange={setDestination}
          />
        </View>
      </View>

      {/* Bottom Sheet */}
      <Modalize
        ref={modalRef}
        modalStyle={styles.modalStyle}
        handleStyle={styles.handleStyle}
        alwaysOpen={420}
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

          {/* Time Selector */}
          <View style={styles.section}>
            <Text>Time Selector placeholder</Text>
          </View>

          {/* Quick Start Routes */}
          <View style={styles.section}>
            <RouteCards
              title="QUICK START"
              items={QUICK_START_ROUTES}
              onPressItem={handleRoutePress}
            />
          </View>

          {/* Other Routes */}
          <View style={styles.section}>
            <RouteCards
              title="OTHER MODES"
              items={OTHER_ROUTES}
              onPressItem={handleRoutePress}
            />
          </View>

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
