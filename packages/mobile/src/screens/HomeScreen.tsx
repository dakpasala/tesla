import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Modalize } from 'react-native-modalize';
import Geolocation from "react-native-geolocation-service";
import { getRoutesToTeslaHQ } from "../services/routes";

import BikeScreen from '../screens/Bike';
import BusScreen from '../screens/Bus';
import TrainScreen from '../screens/Train';
import WalkScreen from '../screens/Walk';
import RideShareSubView from '../components/SubViews/RideShareSubView';

import { useTheme } from '../../theme/useTheme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const modalRef = useRef<Modalize>(null);

  const [screen, setScreen] = useState<
    'home' | 'bike' | 'bus' | 'train' | 'walk'
  >('home');

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

        const data = await getRoutesToTeslaHQ({
          lat: origin.lat,
          lng: origin.lng,
        });

        if (!cancelled) {
          setRoutes(data);
        }
      } catch (err) {
        console.error("Failed to fetch routes", err);
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
    <View style={{ flex: 1 }}>
      <Modalize
        modalStyle={styles.modalScreen}
        alwaysOpen={340}
        modalHeight={700}
        ref={modalRef}
      >
        <View style={styles.iconBar}>
          <Pressable onPress={() => setScreen('bike')}>
            <Image
              source={
                screen === 'bike'
                  ? require('../assets/bikeActive.png')
                  : require('../assets/bike.png')
              }
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={() => setScreen('bus')}>
            <Image
              source={
                screen === 'bus'
                  ? require('../assets/busActive.png')
                  : require('../assets/bus.png')
              }
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={() => setScreen('home')}>
            <Image
              source={
                screen === 'home'
                  ? require('../assets/carActive.png')
                  : require('../assets/car.png')
              }
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={() => setScreen('train')}>
            <Image
              source={
                screen === 'train'
                  ? require('../assets/trainActive.png')
                  : require('../assets/train.png')
              }
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={() => setScreen('walk')}>
            <Image
              source={
                screen === 'walk'
                  ? require('../assets/walkActive.png')
                  : require('../assets/walk.png')
              }
              style={styles.icon}
            />
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          {screen === 'home' && (
            <View style={{ alignItems: 'center' }}>
              <Text>CAR</Text>
              <RideShareSubView
                onSelect={item => console.log('Selected rideshare:', item)}
              />
            </View>
          )}

          {screen === 'bike' && <BikeScreen />}
          {screen === 'bus' && <BusScreen />}
          {screen === 'train' && <TrainScreen />}
          {screen === 'walk' && <WalkScreen />}
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
    backgroundColor: '#E0E0E0',
  },
  iconBar: {
    flexDirection: 'row',
    marginTop: 15,
  },
  icon: {
    width: 50,
    height: 50,
    marginLeft: 25,
    borderRadius: 40,
  },
});
