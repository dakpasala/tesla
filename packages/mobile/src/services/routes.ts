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

const TESLA_HQ_DESTINATION = "3500 Deer Creek Rd, Palo Alto, CA";

export async function getRoutesToTeslaHQ(
  origin: LatLng
): Promise<RouteOption[]> {
  const originStr = `${origin.lat},${origin.lng}`;

  const endpoint =
    `maps/routes?origin=${encodeURIComponent(originStr)}` +
    `&destination=${encodeURIComponent(TESLA_HQ_DESTINATION)}`;

  return get<RouteOption[]>(endpoint);
}
