// packages/mobile/src/services/location.ts

import Geolocation from '@react-native-community/geolocation';
import type { LatLng } from './maps';

// Ensure authorization is requested on iOS
Geolocation.requestAuthorization();

function getCurrentPosition(
  highAccuracy: boolean,
  timeout: number
): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const result = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log('📍 JS LOCATION RESULT:', JSON.stringify(result));
        resolve(result);
      },
      error => {
        console.error('📍 JS LOCATION ERROR:', error);
        reject(error);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge: 60000, // Accept cached position up to 1 minute old
      }
    );
  });
}

export async function getUserLocation(): Promise<LatLng> {
  try {
    // Try high accuracy first
    return await getCurrentPosition(true, 15000);
  } catch (highAccError) {
    console.warn(
      '📍 High accuracy failed, retrying with low accuracy...',
      highAccError
    );
    // Fallback: lower accuracy is faster and more reliable indoors
    return await getCurrentPosition(false, 10000);
  }
}
