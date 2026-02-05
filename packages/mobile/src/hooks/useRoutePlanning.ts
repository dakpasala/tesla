import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  getRoutesGoHome,
  getRoutesToOffice,
  getRoutesToOfficeQuickStart,
  RouteResponse,
} from '../services/maps';
import { getUserLocation } from '../services/location';

interface UseRoutePlanningProps {
  mode: 'search' | 'quickstart';
  destinationAddress: string | null;
  isHomeRoute: boolean;
  onBackToSearch?: () => void;
}

export function useRoutePlanning({
  mode,
  destinationAddress,
  isHomeRoute,
  onBackToSearch,
}: UseRoutePlanningProps) {
  const [fetchedRouteData, setFetchedRouteData] =
    useState<RouteResponse | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'quickstart' || !destinationAddress) return;

    let cancelled = false;
    const fetchRoutes = async () => {
      setRoutesLoading(true);
      setRoutesError(null);
      try {
        const origin = await getUserLocation();
        const data = isHomeRoute
          ? await getRoutesGoHome({ origin, destination: destinationAddress })
          : await getRoutesToOfficeQuickStart({ origin, destinationAddress });
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
    return () => {
      cancelled = true;
    };
  }, [mode, destinationAddress, isHomeRoute, onBackToSearch]);

  return {
    fetchedRouteData,
    setFetchedRouteData,
    routesLoading,
    routesError,
  };
}
