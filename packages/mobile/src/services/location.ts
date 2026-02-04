// packages/mobile/src/services/location.ts

import Geolocation from '@react-native-community/geolocation';
import type { LatLng } from './maps';

export function getUserLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    // services/location.ts
        Geolocation.getCurrentPosition(
        (position) => {
            const result = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            };

            console.log('📍 JS LOCATION RESULT:', JSON.stringify(result));
            resolve(result);
        },
        (error) => {
            console.error('📍 JS LOCATION ERROR:', error);
            reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
        );
  });
}