// packages/mobile/src/services/maps.ts

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
  routes: RouteOption[];
};

export type ToOfficeQuickStartResponse = {
  mode: 'TO_OFFICE_QUICK_START';
  office: string;
  office_address: string;
  destination: string;
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
  departureTime?: number | null; // unix timestamp
}): Promise<ToOfficeResponse> {
  const { origin, officeName, departureTime } = params;

  let endpoint =
    `maps/to-office` +
    `?lat=${origin.lat}` +
    `&lng=${origin.lng}` +
    `&office_name=${encodeURIComponent(officeName)}`;

  if (departureTime) endpoint += `&departure_time=${departureTime}`;

  return get<ToOfficeResponse>(endpoint);
}

export async function getRoutesToOfficeQuickStart(params: {
  origin: LatLng;
  destinationAddress: string;
  departureTime?: number | null; // unix timestamp
}): Promise<ToOfficeQuickStartResponse> {
  const { origin, destinationAddress, departureTime } = params;

  let endpoint =
    `maps/to-office-quick-start` +
    `?lat=${origin.lat}` +
    `&lng=${origin.lng}` +
    `&address=${encodeURIComponent(destinationAddress)}`;

  if (departureTime) endpoint += `&departure_time=${departureTime}`;

  return get<ToOfficeQuickStartResponse>(endpoint);
}

export async function getRoutesGoHome(params: {
  origin: LatLng;
  destination: string;
  departureTime?: number | null; // unix timestamp
}): Promise<GoHomeResponse> {
  const { origin, destination, departureTime } = params;

  let endpoint =
    `maps/go-home` +
    `?lat=${origin.lat}` +
    `&lng=${origin.lng}` +
    `&destination=${encodeURIComponent(destination)}`;

  if (departureTime) endpoint += `&departure_time=${departureTime}`;

  return get<GoHomeResponse>(endpoint);
}

export async function checkPresence(origin: LatLng): Promise<PresenceResponse> {
  const endpoint = `maps/presence?lat=${origin.lat}&lng=${origin.lng}`;
  return get<PresenceResponse>(endpoint);
}

export type RouteResponse = GoHomeResponse | ToOfficeResponse | ToOfficeQuickStartResponse;