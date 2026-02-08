// packages/mobile/src/hooks/useRoutePlanning.ts

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  getRoutesGoHome,
  getRoutesToOffice,
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

interface UseRoutePlanningProps {
  mode: 'search' | 'quickstart';
  destinationAddress: string | null;
  isHomeRoute: boolean;
  travelMode: string; // 'car' | 'shuttle' | 'bike' | 'transit'
  onBackToSearch?: () => void;
}

export function useRoutePlanning({
  mode,
  destinationAddress,
  isHomeRoute,
  travelMode,
  onBackToSearch,
}: UseRoutePlanningProps) {
  const [fetchedRouteData, setFetchedRouteData] =
    useState<RouteResponse | null>(null);
  const [tripshotData, setTripshotData] = useState<CommutePlanResponse | null>(
    null
  );
  const [liveStatus, setLiveStatus] = useState<LiveStatusResponse | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);

  // Fetch routes (commute plan)
  useEffect(() => {
    if (mode !== 'quickstart' || !destinationAddress) return;

    let cancelled = false;
    const fetchRoutes = async () => {
      setRoutesLoading(true);
      setRoutesError(null);
      try {
        const origin = await getUserLocation();

        // Use TripShot API for shuttle mode
        if (travelMode === 'shuttle') {
          // Get current date and time
          const now = new Date();
          const day = now.toISOString().split('T')[0]; // YYYY-MM-DD
          const time = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }); // e.g., "10:56 AM"

          // TODO: Parse actual destination coordinates from destinationAddress
          // For now using hardcoded Tesla locations
          const data = await getCommutePlan({
            day,
            time,
            timezone: 'Pacific',
            startLat: origin.lat,
            startLng: origin.lng,
            startName: 'Current Location',
            endLat: 37.3945701, // Deer Creek - TODO: parse from destinationAddress
            endLng: -122.1501086,
            endName: destinationAddress,
            travelMode: 'Walking',
          });

          if (!cancelled) setTripshotData(data);
        } else {
          // Use existing routing API for other modes
          const data = isHomeRoute
            ? await getRoutesGoHome({ origin, destination: destinationAddress })
            : await getRoutesToOfficeQuickStart({
                origin,
                destinationAddress,
              });
          if (!cancelled) setFetchedRouteData(data);
        }
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
    return () => {
      cancelled = true;
    };
  }, [mode, destinationAddress, isHomeRoute, travelMode, onBackToSearch]);

  // Fetch live status when we have TripShot data
  useEffect(() => {
    if (!tripshotData || travelMode !== 'shuttle') return;

    // Extract rideIds from the trip options
    const rideIds: string[] = [];
    tripshotData.options?.forEach(option => {
      option.steps?.forEach(step => {
        if ('OnRouteScheduledStep' in step) {
          const rideId = step.OnRouteScheduledStep.rideId;
          if (rideId && !rideIds.includes(rideId)) {
            rideIds.push(rideId);
          }
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

    // Poll for updates every 10 seconds
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