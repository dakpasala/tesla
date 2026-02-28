// packages/mobile/src/hooks/useRoutePlanning.ts

// Fetches Google Maps and TripShot route data for a given destination and travel mode.
// Polls live shuttle status every 10 seconds when shuttle mode is active.

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  getRoutesGoHome,
  getRoutesToOfficeQuickStart,
  RouteResponse,
} from '../services/maps';
import {
  getCommutePlan,
  getLiveStatus,
  CommutePlanResponse,
  LiveStatusResponse,
} from '../services/tripshot';
import { getUserLocation } from '../services/location';

interface DepartureTime {
  hour: number;
  minute: number;
  period: 'am' | 'pm';
}

interface UseRoutePlanningProps {
  mode: 'search' | 'quickstart';
  destinationAddress: string | null;
  isHomeRoute: boolean;
  travelMode: string;
  onBackToSearch?: () => void;
  departureTime?: DepartureTime | null; // null = leave now
}

function formatTripShotTime(dt: DepartureTime | null | undefined): string {
  if (!dt) {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  const min = dt.minute.toString().padStart(2, '0');
  return `${dt.hour}:${min} ${dt.period.toUpperCase()}`;
}

/** Convert a DepartureTime to a unix timestamp (seconds). Returns null for "now". */
function toUnixTimestamp(dt: DepartureTime | null | undefined): number | null {
  if (!dt) return null;
  const now = new Date();
  let hour24 = dt.hour % 12;
  if (dt.period === 'pm') hour24 += 12;
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour24,
    dt.minute,
    0
  );
  // If the time is in the past today, treat as tomorrow
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return Math.floor(d.getTime() / 1000);
}

export function useRoutePlanning({
  mode,
  destinationAddress,
  isHomeRoute,
  travelMode,
  onBackToSearch,
  departureTime,
}: UseRoutePlanningProps) {
  const [fetchedRouteData, setFetchedRouteData] =
    useState<RouteResponse | null>(null);
  const [tripshotData, setTripshotData] = useState<CommutePlanResponse | null>(
    null
  );
  const [liveStatus, setLiveStatus] = useState<LiveStatusResponse | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);

  // Fetch Google Maps routes (car/bike/transit/walking) — always on load
  useEffect(() => {
    if (mode !== 'quickstart' || !destinationAddress) return;

    let cancelled = false;
    const fetchRoutes = async () => {
      setRoutesLoading(true);
      setRoutesError(null);
      try {
        const origin = await getUserLocation();
        const departureTimestamp = toUnixTimestamp(departureTime);
        const data = isHomeRoute
          ? await getRoutesGoHome({ origin, destination: destinationAddress, departureTime: departureTimestamp })
          : await getRoutesToOfficeQuickStart({ origin, destinationAddress, departureTime: departureTimestamp });
        if (!cancelled) setFetchedRouteData(data);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.status === 403 || err?.response?.status === 403) {
          Alert.alert(
            'Routing Unavailable',
            isHomeRoute
              ? 'Routing is only available when you are near a Tesla office.'
              : 'You are at Tesla Office. Routing is not needed here.',
            [{ text: 'OK', onPress: onBackToSearch }]
          );
          return;
        }
        setRoutesError('Failed to load routes. Please try again.');
      } finally {
        if (!cancelled) setRoutesLoading(false);
      }
    };

    fetchRoutes();
    return () => { cancelled = true; };
  }, [mode, destinationAddress, isHomeRoute, onBackToSearch, departureTime]);

  // Fetch TripShot shuttle plan — always on load so shuttle time is ready immediately
  useEffect(() => {
    if (mode !== 'quickstart' || !destinationAddress) return;

    let cancelled = false;
    const fetchTripshot = async () => {
      try {
        const origin = await getUserLocation();
        const now = new Date();
        const day = now.toISOString().split('T')[0];
        const time = formatTripShotTime(departureTime);

        const data = await getCommutePlan({
          day,
          time,
          timezone: 'Pacific',
          startLat: origin.lat,
          startLng: origin.lng,
          startName: 'Current Location',
          endLat: 37.3945701,
          endLng: -122.1501086,
          endName: destinationAddress,
          travelMode: 'Walking',
        });

        if (!cancelled) setTripshotData(data);
      } catch (err) {
        console.error('Failed to fetch TripShot data:', err);
      }
    };

    fetchTripshot();
    return () => { cancelled = true; };
  }, [mode, destinationAddress, departureTime]);

  // Live status polling
  useEffect(() => {
    if (!tripshotData || travelMode !== 'shuttle') return;

    const rideIds: string[] = [];
    tripshotData.options?.forEach(option => {
      option.steps?.forEach(step => {
        if ('OnRouteScheduledStep' in step) {
          const rideId = step.OnRouteScheduledStep.rideId;
          if (rideId && !rideIds.includes(rideId)) rideIds.push(rideId);
        }
      });
    });

    if (rideIds.length === 0) return;

    let cancelled = false;
    const fetchLiveStatus = async () => {
      try {
        const data = await getLiveStatus(rideIds);
        if (!cancelled) setLiveStatus(data);
      } catch (err) {
        console.error('Failed to fetch live shuttle status:', err);
      }
    };

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tripshotData, travelMode]);

  return {
    fetchedRouteData,
    setFetchedRouteData,
    tripshotData,
    setTripshotData,
    liveStatus,
    routesLoading,
    routesError,
  };
}
