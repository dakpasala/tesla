import BackgroundGeolocation from 'react-native-background-geolocation';
import { OFFICE_LOCATIONS } from '../../config/officeLocations';

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
