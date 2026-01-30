import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Modalize } from 'react-native-modalize';
import Geolocation from 'react-native-geolocation-service';
import { getRoutesGoHome } from '../services/routes';
import { OFFICE_LOCATIONS } from '../config/officeLocations';

import BikeScreen from '../screens/Bike';
import BusScreen from '../screens/Bus';
import TrainScreen from '../screens/Train';
import WalkScreen from '../screens/Walk';
import CarScreen from '../screens/Car';
import NavBox from '../components/NavBox';
// import NavBar, { type NavScreen } from '../components/NavBar'; // FIX: NavBar import commented out due to missing module/types.

import { useTheme } from '../../theme/useTheme';
import NavBar from '../components/NavBar';

type NavScreen = 'car' | 'walk' | 'bike' | 'bus' | 'train'; // FIX: Define NavScreen type locally since import fails.

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const modalRef = useRef<Modalize>(null);

  const [screen, setScreen] = useState<NavScreen>('car');

  //using these for NavBox.tsx
  const [currentLocation, setCurrentLocation] = React.useState('');
  const [destination, setDestination] = React.useState('');

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
  } | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);

  const [routes, setRoutes] = useState<any[] | null>(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const { colors } = useTheme();

  useEffect(() => {
    Geolocation.getCurrentPosition(
      pos => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      err => setLocationError(err.message),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }, []);

  useEffect(() => {
    if (!location) return;

    const origin = location;
    let cancelled = false;

    async function loadRoutes() {
      try {
        setLoadingRoutes(true);

        // choose nearest configured office as destination (avoids hardcoded Tesla HQ)
        const nearest = OFFICE_LOCATIONS.reduce(
          (best, office) => {
            const dist =
              (office.lat - origin.lat) ** 2 + (office.lng - origin.lng) ** 2;
            if (!best || dist < best.dist) return { office, dist };
            return best;
          },
          null as null | { office: (typeof OFFICE_LOCATIONS)[0]; dist: number }
        );

        const destination = nearest
          ? `${nearest.office.lat},${nearest.office.lng}`
          : 'Tesla HQ, 3500 Deer Creek Rd, Palo Alto, CA 94304';

        const data = await getRoutesGoHome({ origin, destination });

        if (!cancelled) {
          // server returns an object with `routes` array; keep `routes` state as an array
          setRoutes(data.routes ?? null);
        }
      } catch (err) {
        console.error('Failed to fetch routes', err);
      } finally {
        if (!cancelled) setLoadingRoutes(false);
      }
    }

    loadRoutes();

    return () => {
      cancelled = true;
    };
  }, [location]);

  return (
    // <View style={{ flex: 1}}>
    //   <View style={styles.inputContainer}>
    //     <TextInput
    //       style={styles.input}
    //       onChangeText={setCurrentLocation}
    //       value={currentLocation}
    //       placeholder="Current Location"
    //       keyboardType="default"
    //     />
    //     <View style={styles.divider} />
    //     <TextInput
    //       style={styles.input}
    //       onChangeText={setDestination}
    //       value={destination}
    //       placeholder="Destination"
    //       keyboardType="default"
    //     />
    //   </View>
    <View style={{ flex: 1 }}>
      <NavBox
        currentLocation={currentLocation}
        destination={destination}
        currentLocationIcon={require('../assets/icons/current.png')}
        destinationIcon={require('../assets/icons/destination.png')}
        onCurrentLocationChange={setCurrentLocation}
        onDestinationChange={setDestination}
      />

      <Modalize
        modalStyle={styles.modalScreen}
        alwaysOpen={340}
        modalHeight={700}
        ref={modalRef}
      >
        <NavBar currentScreen={screen} onScreenChange={setScreen} />

        <View style={{ flex: 1 }}>
          {screen === 'car' && <CarScreen />}
          {screen === 'bike' && <BikeScreen />}
          {screen === 'bus' && <BusScreen />}
          {screen === 'train' && <TrainScreen />}
          {/* {screen === 'walk' && <WalkScreen />} */}
        </View>
      </Modalize>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: { fontSize: 20, marginBottom: 20 },
  modalScreen: {
    backgroundColor: '#D9D9D9',
  },

  inputContainer: {
    width: 321,
    height: 90,
    alignSelf: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  input: {
    height: 45,
    padding: 10,
    marginLeft: 30,
    textAlignVertical: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 10,
  },
});
