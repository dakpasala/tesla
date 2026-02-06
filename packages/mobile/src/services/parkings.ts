// packages/mobile/src/services/parkings.ts

import { get, patch } from './crud';

export type ParkingRow = {
  location_id: number;     // from curl
  location_name: string;   // changed from loc_name
  lot_id: number;          // from curl
  lot_name: string;        
  availability: number;    // this is your "current available"
  
  // Keep these as optional if you still use them elsewhere, 
  // but they aren't in your current /all response
  capacity?: number;
  current_available?: number; 
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
  // Note: If you changed the DB column name, 
  // you might need to change 'loc_name' to 'location_name' here too
  const endpoint = `parkings?loc_name=${encodeURIComponent(locName)}`;
  return get<ParkingRow[]>(endpoint);
}

export async function updateParkingAvailability(params: {
  location_name: string; // Updated key
  lot_name: string;
  availability: number;
}): Promise<{
  success: boolean;
  location_name: string; // Updated key
  lot_name: string;
  availability: number;
}> {
  return patch<{
    success: boolean;
    location_name: string;
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

export async function getFullLotsCount(): Promise<number> {
  const response = await get<{ count: number }>('parkings/full-count');
  return response.count;
}