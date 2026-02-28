// packages/mobile/src/services/parkings.ts

// Service for fetching and updating parking lot availability across Tesla locations.
// Supports per-location queries, admin availability updates, and status overrides.
// Also exposes a count of currently full lots for admin dashboard badges.

import { get, patch } from './crud';

export type ParkingRow = {
  location_id: number;
  location_name: string;
  lot_id: number;
  lot_name: string;
  availability: number;     
  capacity: number;        
  status_override: string | null; 
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
  locationName: string
): Promise<ParkingRow[]> {
  // Use location_name to match backend query param
  const endpoint = `parkings?loc_name=${encodeURIComponent(locationName)}`;
  return get<ParkingRow[]>(endpoint);
}

export async function updateParkingAvailability(params: {
  location_name: string;
  lot_name: string;
  availability: number;
  status_override?: string | null; // Accept the new string override
}): Promise<{
  success: boolean;
  location_name: string;
  lot_name: string;
  availability: number;
  status_override?: string | null;
}> {
  return patch<{
    success: boolean;
    location_name: string;
    lot_name: string;
    availability: number;
    status_override?: string | null;
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