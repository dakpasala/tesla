import { get } from './crud';

export type LatLng = {
  lat: number;
  lng: number;
};

export type RouteOption = {
  mode: 'driving' | 'transit' | 'walking' | 'bicycling';
  duration_sec: number;
  distance_m: number;
  polyline: string;
};

export type ToOfficeResponse = {
  mode: 'TO_OFFICE';
  office: string;
  parking_lot: string;
  routes: RouteOption[];
};

export type GoHomeResponse = {
  mode: 'FROM_OFFICE';
  office: string;
  distance_from_office_m?: number;
  routes: RouteOption[];
};

export type PresenceResponse =
  | { atOffice: false }
  | {
      atOffice: true;
      office: { id: number; name: string; distance_meters: number };
    };

export async function getRoutesToOffice(params: {
  origin: LatLng;
  officeName: string;
  parkingLotName: string;
}): Promise<ToOfficeResponse> {
  const { origin, officeName, parkingLotName } = params;

  const endpoint =
    `maps/to-office` +
    `?lat=${origin.lat}` +
    `&lng=${origin.lng}` +
    `&office_name=${encodeURIComponent(officeName)}` +
    `&parking_lot_name=${encodeURIComponent(parkingLotName)}`;

  return get<ToOfficeResponse>(endpoint);
}

export async function getRoutesGoHome(params: {
  origin: LatLng;
  destination: string;
}): Promise<GoHomeResponse> {
  const { origin, destination } = params;

  const endpoint =
    `maps/go-home` +
    `?lat=${origin.lat}` +
    `&lng=${origin.lng}` +
    `&destination=${encodeURIComponent(destination)}`;

  return get<GoHomeResponse>(endpoint);
}

export async function checkPresence(origin: LatLng): Promise<PresenceResponse> {
  const endpoint = `maps/presence?lat=${origin.lat}&lng=${origin.lng}`;
  return get<PresenceResponse>(endpoint);
}

// The previous compatibility helper `getRoutesToTeslaHQ` was removed to avoid hardcoded
// destinations. Now, build destinations in the UI or use office config instead.

// Was a convenience helper used by the mobile app to get routes to the Tesla HQ
// JUST a placeholder for a hard-coded call in HomeScreen.tsx
// Prefer calling `getRoutesGoHome` or `getRoutesToOffice` directly with a
// destination derived from `OFFICE_LOCATIONS` or user input.
