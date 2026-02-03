// packages/mobile/src/services/location.ts

import Geolocation from '@react-native-community/geolocation';
import type { LatLng } from './maps';

export function getUserLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}