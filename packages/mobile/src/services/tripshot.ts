// packages/mobile/src/services/tripshot.ts

// Service for interacting with the TripShot shuttle API.
// Fetches commute plans, live ride statuses, and stop/route metadata.
// Includes helper utilities for parsing delays, occupancy, ETAs, and trip steps.

import { get, post } from './crud';

// Types

export type Location = {
  lg: number; // longitude
  lt: number; // latitude
};

export type LocationPoint = {
  location: Location;
  name: string;
  stop?: string | null;
};

export type OffRouteStep = {
  OffRouteStep: {
    travelMode: string;
    departureTime: string;
    arrivalTime: string;
    legRef?: string; // added — present in real data
    departFrom: LocationPoint;
    arriveAt: LocationPoint;
  };
};

export type OnRouteScheduledStep = {
  OnRouteScheduledStep: {
    departureStopId: string;
    arrivalStopId: string;
    departureTime: string;
    arrivalTime: string;
    rideId: string;
    routeId: string;
  };
};

export type TripStep = OffRouteStep | OnRouteScheduledStep;

export type TripOption = {
  arrivalStopId: string;
  departureStopId: string;
  travelStart: string;
  travelEnd: string;
  earliestToArrive?: string; // added
  latestToDepart?: string; // added
  optionKey?: number; // added
  toArrivalTimeSec?: number; // added
  toDepartureTimeSec?: number; // added
  steps: TripStep[];
};

export type Route = {
  routeId: string;
  name: string;
  shortName: string;
  color: string;
  announcedAs?: string;
  description?: string;
  headsign?: string;
  publicName?: string;
  routeType?: string;
  tags?: string[];
};

export type Stop = {
  stopId: string;
  name: string;
  location: Location;
  address: {
    address: string;
    tags: string[];
  };
  description: string;
  regionId: string;
  deleted: null | string;
  onDemand: boolean;
  terminal: boolean;
  hasParking: boolean;
  parentId: null | string;
  groupParent: null | string;
  gtfsId: null | string;
  photoIds: string[];
  tags: string[];
  ttsStopName: null | string;
  yard: boolean;
  yardCapacity: null | number;
  yardMiddayParking: null | boolean;
  yardVendorId: null | string;
  geofence: any;
};

export type CommutePlanResponse = {
  directOnly?: boolean; // added
  startPoint: LocationPoint;
  endPoint: LocationPoint;
  options: TripOption[]; // [] when no shuttle route exists
  routes: Route[]; // [] when no shuttle route exists
  stops?: Stop[]; // [] when no shuttle route exists
  legMap?: Record<string, any>; // added
  parkingReservations?: any[]; // added
  reservationStatuses?: any[]; // added
  reservations?: any[]; // added
  retrieved_at?: string; // added
};

// StopStatus covers all real states from TripShot
export type StopStatus = {
  Awaiting?: {
    stopId: string;
    expectedArrivalTime: string;
    scheduledDepartureTime: string;
    riderStatus: string;
  };
  Arrived?: {
    stopId: string;
    actualArrivalTime: string;
  };
  Departed?: {
    stopId: string;
    actualDepartureTime: string;
  };
  Skipped?: {
    stopId: string;
  };
};

export type RideState = {
  Accepted?: [];
  Scheduled?: [];
  InProgress?: [];
};

export type Ride = {
  rideId: string;
  routeId: string;
  routeName: string;
  shortName: string | null;
  vehicleName: string;
  vehicleShortName: string;
  color: string;
  state: RideState;
  lateBySec: number;
  riderCount: number;
  vehicleCapacity: number;
  lastEtaUpdate: string;
  lastMonitorUpdate: string;
  stopStatus: StopStatus[];
};

export type LiveStatusResponse = {
  rides: Ride[];
  timestamp: string;
};

// API Functions

export async function getCommutePlan(params: {
  day: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  timezone?: 'Pacific' | 'UTC';
  startLat: number;
  startLng: number;
  startName?: string;
  endLat: number;
  endLng: number;
  endName?: string;
  travelMode?: 'Walking' | 'Driving' | 'Bicycling';
}): Promise<CommutePlanResponse> {
  const queryParams = new URLSearchParams({
    day: params.day,
    time: params.time,
    timezone: params.timezone || 'Pacific',
    startLat: params.startLat.toString(),
    startLng: params.startLng.toString(),
    endLat: params.endLat.toString(),
    endLng: params.endLng.toString(),
    travelMode: params.travelMode || 'Walking',
  });

  if (params.startName) queryParams.append('startName', params.startName);
  if (params.endName) queryParams.append('endName', params.endName);

  return post<CommutePlanResponse>(
    `tripshot/commutePlan?${queryParams.toString()}`,
    {}
  );
}

export async function getLiveStatus(
  rideIds: string[]
): Promise<LiveStatusResponse> {
  const queryParams = rideIds
    .map(id => `rideIds=${encodeURIComponent(id)}`)
    .join('&');
  return post<LiveStatusResponse>(`tripshot/liveStatus?${queryParams}`, {});
}

/**
 * Get live status for ALL active rides in the region.
 * No rideIds needed — returns everything TripShot knows about.
 * Use this for the dashboard instead of querying by individual rideIds.
 */
export async function getAllLiveStatus(): Promise<LiveStatusResponse> {
  return get<LiveStatusResponse>('tripshot/liveStatus');
}

// Helper Functions

/**
 * Check whether a commute plan response actually has shuttle options.
 * Always check this before rendering route details — server returns
 * options: [] when no shuttle services the requested origin/destination.
 */
export function hasShuttleOptions(
  data: CommutePlanResponse | null | undefined
): boolean {
  return !!(data && data.options.length > 0 && data.routes.length > 0);
}

/**
 * Extract all unique rideIds from a commute plan.
 * Pass the result to getLiveStatus().
 */
export function extractRideIds(data: CommutePlanResponse): string[] {
  const ids: string[] = [];
  for (const option of data.options) {
    for (const step of option.steps) {
      if ('OnRouteScheduledStep' in step) {
        ids.push(step.OnRouteScheduledStep.rideId);
      }
    }
  }
  return [...new Set(ids)];
}

/**
 * Format a trip step for display (without context)
 */
export function formatTripStep(step: TripStep): {
  type: 'walk' | 'shuttle';
  from: string;
  to: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: number;
} {
  if ('OffRouteStep' in step) {
    const offRoute = step.OffRouteStep;
    const durationMs =
      new Date(offRoute.arrivalTime).getTime() -
      new Date(offRoute.departureTime).getTime();
    const durationMin = Math.round(durationMs / 60000);

    return {
      type: 'walk',
      from: offRoute.departFrom.name,
      to: offRoute.arriveAt.name,
      departureTime: offRoute.departureTime,
      arrivalTime: offRoute.arrivalTime,
      duration: durationMin,
    };
  } else {
    const onRoute = step.OnRouteScheduledStep;
    return {
      type: 'shuttle',
      from: 'Shuttle Stop',
      to: 'Destination Stop',
      departureTime: onRoute.departureTime,
      arrivalTime: onRoute.arrivalTime,
    };
  }
}

/**
 * Format a trip step for display with stop name lookup
 */
export function formatTripStepWithContext(
  step: TripStep,
  tripshotData: CommutePlanResponse | null
): {
  type: 'walk' | 'shuttle';
  from: string;
  to: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: number;
} {
  if ('OffRouteStep' in step) {
    const offRoute = step.OffRouteStep;
    const durationMs =
      new Date(offRoute.arrivalTime).getTime() -
      new Date(offRoute.departureTime).getTime();
    const durationMin = Math.round(durationMs / 60000);

    return {
      type: 'walk',
      from: offRoute.departFrom.name,
      to: offRoute.arriveAt.name,
      departureTime: offRoute.departureTime,
      arrivalTime: offRoute.arrivalTime,
      duration: durationMin,
    };
  } else {
    const onRoute = step.OnRouteScheduledStep;

    const departureStop = tripshotData?.stops?.find(
      s => s.stopId === onRoute.departureStopId
    );
    const arrivalStop = tripshotData?.stops?.find(
      s => s.stopId === onRoute.arrivalStopId
    );

    return {
      type: 'shuttle',
      from: departureStop?.name || 'Shuttle Stop',
      to: arrivalStop?.name || 'Destination',
      departureTime: onRoute.departureTime,
      arrivalTime: onRoute.arrivalTime,
    };
  }
}

/**
 * Calculate minutes until a given ISO time
 */
export function getMinutesUntil(isoTime: string): number {
  const now = new Date().getTime();
  const target = new Date(isoTime).getTime();
  return Math.round((target - now) / 60000);
}

/**
 * Format ISO time to human-readable (e.g. "9:30 AM")
 */
export function formatTime(isoTime: string): string {
  return new Date(isoTime).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Check if a ride is delayed (more than 1 minute late)
 */
export function isRideDelayed(ride: Ride): boolean {
  return ride.lateBySec > 60;
}

/**
 * Get occupancy as a percentage
 */
export function getOccupancyPercentage(ride: Ride): number {
  if (!ride.vehicleCapacity) return 0;
  return Math.round((ride.riderCount / ride.vehicleCapacity) * 100);
}

/**
 * Get delay status text
 */
export function getDelayText(ride: Ride): string {
  if (!isRideDelayed(ride)) return 'On Time';
  const delayMinutes = Math.round(ride.lateBySec / 60);
  return `${delayMinutes} Min Delay`;
}
