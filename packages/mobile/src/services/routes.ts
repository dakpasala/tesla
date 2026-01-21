import { get } from "./crud";

export type LatLng = {
  lat: number;
  lng: number;
};

export type RouteOption = {
  mode: "driving" | "transit" | "walking" | "bicycling";
  duration_sec: number;
  distance_m: number;
  polyline: string;
};

// go to office
export async function getRoutesToOffice(params: {
  origin: LatLng;
  officeName: string;
  parkingLotName: string;
}): Promise<RouteOption[]> {
  const { origin, officeName, parkingLotName } = params;

  const endpoint =
    `maps/to-office` +
    `?lat=${origin.lat}` +
    `&lng=${origin.lng}` +
    `&office_name=${encodeURIComponent(officeName)}` +
    `&parking_lot_name=${encodeURIComponent(parkingLotName)}`;

  return get<RouteOption[]>(endpoint);
}

// go home
export async function getRoutesGoHome(params: {
  origin: LatLng;
  destination: string;
}): Promise<RouteOption[]> {
  const { origin, destination } = params;

  const endpoint =
    `maps/go-home` +
    `?lat=${origin.lat}` +
    `&lng=${origin.lng}` +
    `&destination=${encodeURIComponent(destination)}`;

  return get<RouteOption[]>(endpoint);
}
