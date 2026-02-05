import { useState, useEffect } from 'react';
import {
  getAllLocations,
  getAllParkingAvailability,
  getParkingForLocation,
  ParkingRow,
  ParkingLot,
} from '../services/parkings';
import { getStatus } from '../helpers/mapUtils';

interface UseParkingDataProps {
  mode: 'search' | 'quickstart';
  phase: string;
  viewMode: string;
  selectedParkingId: string | null;
}

export function useParkingData({
  mode,
  phase,
  viewMode,
  selectedParkingId,
}: UseParkingDataProps) {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [parkingLoading, setParkingLoading] = useState(false);
  const [parkingError, setParkingError] = useState<string | null>(null);

  const [sublots, setSublots] = useState<ParkingRow[]>([]);
  const [sublotsLoading, setSublotsLoading] = useState(false);

  // Fetch Parking Lots
  useEffect(() => {
    if (mode !== 'quickstart') return;

    let cancelled = false;

    const fetchParking = async () => {
      setParkingLoading(true);
      setParkingError(null);
      try {
        const [locations, availability] = await Promise.all([
          getAllLocations(),
          getAllParkingAvailability(),
        ]);
        if (cancelled) return;

        const merged: ParkingLot[] = locations.map((loc: any) => {
          const lotsForLocation = availability.filter(
            (a: any) => a.loc_name === loc.name
          );

          const totalCapacity = lotsForLocation.reduce(
            (sum: number, lot: any) => sum + (lot.capacity ?? 0),
            0
          );
          const totalAvailable = lotsForLocation.reduce(
            (sum: number, lot: any) => sum + (lot.current_available ?? 0),
            0
          );
          const totalTaken = totalCapacity - totalAvailable;
          const avgFullness =
            totalCapacity > 0
              ? Math.round((totalTaken / totalCapacity) * 100)
              : 0;

          return {
            id: String(loc.id),
            name: loc.name,
            status: getStatus(avgFullness),
            fullness: avgFullness,
            coordinate: {
              latitude: loc.lat ?? 37.4419,
              longitude: loc.lng ?? -122.143,
            },
          };
        });

        setParkingLots(merged);
      } catch (err) {
        if (!cancelled) {
          setParkingError('Failed to load parking lots');
        }
      } finally {
        if (!cancelled) setParkingLoading(false);
      }
    };

    fetchParking();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Fetch Sublots
  useEffect(() => {
    if (mode !== 'quickstart') return;
    if (phase !== 'availability' || viewMode !== 'detail' || !selectedParkingId)
      return;
    const lot = parkingLots.find(p => p.id === selectedParkingId);
    if (!lot) return;

    let cancelled = false;
    const fetchSublots = async () => {
      setSublotsLoading(true);
      try {
        const data = await getParkingForLocation(lot.name);
        if (!cancelled) {
          setSublots(data);
        }
      } catch {
        if (!cancelled) setSublots([]);
      } finally {
        if (!cancelled) setSublotsLoading(false);
      }
    };

    fetchSublots();
    return () => {
      cancelled = true;
    };
  }, [mode, phase, viewMode, selectedParkingId, parkingLots]);

  return {
    parkingLots,
    parkingLoading,
    parkingError,
    sublots,
    sublotsLoading,
    setParkingLots,
    setSublots,
  };
}
