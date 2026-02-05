// packages/mobile/src/services/parkings.ts

import { get, patch } from './crud';

export type ParkingRow = {
  id?: number;
  loc_name: string;
  lot_name: string;
  availability: number;
  error?: string;
};

export type Location = {
  id: number;
  name: string;
  address: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
};

export interface ParkingLot {
  id: string;
  name: string;
  status: string;
  fullness: number;
  coordinate: { latitude: number; longitude: number };
}

export async function getParkingForLocation(
  locName: string
): Promise<ParkingRow[]> {
  const endpoint = `parkings?loc_name=${encodeURIComponent(locName)}`;
  return get<ParkingRow[]>(endpoint);
}

export async function updateParkingAvailability(params: {
  loc_name: string;
  lot_name: string;
  availability: number;
}): Promise<{
  success: boolean;
  loc_name: string;
  lot_name: string;
  availability: number;
}> {
  return patch<{
    success: boolean;
    loc_name: string;
    lot_name: string;
    availability: number;
  }>('parkings', params);
}

export async function getAllLocations(): Promise<Location[]> {
  return get<Location[]>('parkings/locations');
}

export async function getAllParkingAvailability(): Promise<ParkingRow[]> {
  return get<ParkingRow[]>('parkings/all');
}
