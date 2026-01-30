import { get, patch } from './crud';

export type ParkingRow = {
  id?: number;
  loc_name: string;
  lot_name: string;
  availability: number;
  error?: string;
};

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
