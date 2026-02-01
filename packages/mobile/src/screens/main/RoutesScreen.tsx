import React, { useRef, useState } from 'react';
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
import { Modalize } from 'react-native-modalize';

// Import existing components
import NavBox from '../../components/NavBox';
import NavBar, { NavScreen } from '../../components/NavBar';
import RouteCards, { RouteCardItem } from '../../components/RouteCards';
import TimeSelector from '../../components/SubViews/TimeSelector';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mock route data using RouteCardItem type
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
  const modalRef = useRef<Modalize>(null);

  // Transport mode state
  const [transportMode, setTransportMode] = useState<NavScreen>('car');

  // Location state
  const [currentLocation, setCurrentLocation] = useState('Current');
  const [destination, setDestination] = useState('Tesla Deer Creek');

  const handleRoutePress = (item: RouteCardItem) => {
    navigation.navigate('Directions', { routeId: item.id });
  };

  return (
    <View style={styles.container}>
      {/* Map Background (placeholder) */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Route map will go here */}
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

          {/* Time Selector */}
          <View style={styles.timeSelectorContainer}>
            <TimeSelector />
          </View>

          {/* Quick Start Routes */}
          <View style={styles.routesSection}>
            <RouteCards
              title="QUICK START"
              items={QUICK_START_ROUTES}
              onPressItem={handleRoutePress}
            />
          </View>

          {/* Other Routes */}
          <View style={styles.routesSection}>
            <RouteCards
              title="OTHER MODES"
              items={OTHER_ROUTES}
              onPressItem={handleRoutePress}
            />
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
  timeSelectorContainer: {
    paddingHorizontal: 16,
  },
  routesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
});
