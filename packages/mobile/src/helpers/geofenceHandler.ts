import BackgroundGeolocation from 'react-native-background-geolocation';
import { OFFICE_LOCATIONS } from '../config/officeLocations';
import { setUserLocationState } from '../services/users';

export function setupGeofenceListener(userId: number) {
  BackgroundGeolocation.onGeofence(async event => {
    const { identifier, action } = event;

    const locationId = parseInt(identifier.split('-')[1], 10);

    try {
      if (action === 'ENTER') {
        await setUserLocationState(userId, 'AT_LOCATION', locationId);
        console.log(
          `[Geofence] User ${userId} arrived at location ${locationId}`
        );
      } else if (action === 'EXIT') {
        await setUserLocationState(userId, 'LEFT_LOCATION', locationId);
        console.log(`[Geofence] User ${userId} left location ${locationId}`);
      }
    } catch (error) {
      console.error('[Geofence] Failed to sync location state:', error);
    }
  });
}

export function registerOfficeGeofences() {
  BackgroundGeolocation.ready({});

  OFFICE_LOCATIONS.forEach(office => {
    BackgroundGeolocation.addGeofence({
      identifier: `office-${office.id}`,
      radius: office.radius_m,
      latitude: office.lat,
      longitude: office.lng,
      notifyOnEntry: true,
      notifyOnExit: true,
    });
  });
}
