import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Modalize } from 'react-native-modalize';

// Import existing components
import NavBox from '../../components/NavBox';
import NavBar, { NavScreen } from '../../components/NavBar';
import SearchBar from '../../components/SearchBar';

// Import transport mode screens (legacy)
import CarScreen from '../Car';
import BikeScreen from '../Bike';
import BusScreen from '../Bus';
import TrainScreen from '../Train';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MainHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const modalRef = useRef<Modalize>(null);

  // Transport mode state
  const [transportMode, setTransportMode] = useState<NavScreen>('car');

  // Location state for NavBox
  const [currentLocation, setCurrentLocation] = useState('');
  const [destination, setDestination] = useState('');

  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with NavBox and Settings - matching original HomeScreen structure */}
      <View style={styles.headerContainer}>
        <NavBox
          currentLocation={currentLocation}
          destination={destination}
          currentLocationIcon={require('../../assets/icons/current.png')}
          destinationIcon={require('../../assets/icons/destination.png')}
          onCurrentLocationChange={setCurrentLocation}
          onDestinationChange={setDestination}
        />
        {/* #region agent log */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            fetch(
              'http://127.0.0.1:7242/ingest/8cc27a84-2cd7-49c1-9a78-77fcf9fc4234',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  location: 'MainHomeScreen.tsx:settings',
                  message: 'Settings button pressed',
                  data: {},
                  timestamp: Date.now(),
                  sessionId: 'debug-session',
                  hypothesisId: 'A',
                }),
              }
            ).catch(() => {});
            navigation.navigate('Profile');
          }}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
        {/* #endregion */}
      </View>

      {/* Bottom Sheet with Modalize - matching original HomeScreen */}
      <Modalize
        ref={modalRef}
        modalStyle={styles.modalStyle}
        alwaysOpen={340}
        modalHeight={700}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchValue}
            onChangeText={setSearchValue}
            expanded={searchExpanded}
            onExpand={() => setSearchExpanded(true)}
            onCollapse={() => setSearchExpanded(false)}
          />
        </View>

        {/* Transport Mode Tabs and Content */}
        {!searchExpanded && (
          <>
            <NavBar
              currentScreen={transportMode}
              onScreenChange={setTransportMode}
            />

            <View style={styles.contentContainer}>
              {transportMode === 'car' && <CarScreen />}
              {transportMode === 'bike' && <BikeScreen />}
              {transportMode === 'bus' && <BusScreen />}
              {transportMode === 'train' && <TrainScreen />}
            </View>
          </>
        )}
      </Modalize>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 10,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 20,
  },
  modalStyle: {
    backgroundColor: '#D9D9D9',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 10,
  },
  contentContainer: {
    flex: 1,
  },
});
