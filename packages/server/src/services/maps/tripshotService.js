// packages/server/src/services/maps/tripshotService.js

import axios from 'axios';

const TRIPSHOT_BASE_URL =
  process.env.TRIPSHOT_BASE_URL || 'http://localhost:3000/api/tripshot';

export async function getShuttleStatus(shuttleName) {
  try {
    // Use region-wide GET /liveStatus and find the matching route by name
    const res = await axios.get(
      `${TRIPSHOT_BASE_URL}/liveStatus`,
      { timeout: 5000 }
    );

    const rides = res.data?.rides ?? [];

    // Match by shortName or routeName
    const ride = rides.find(
      r => r.shortName === shuttleName || r.routeName === shuttleName
    );

    if (!ride) return null;

    // Find the next stop that hasn't been departed yet
    const nextStop = ride.stopStatus?.find(s => s.Awaiting || s.Arrived);

    let etaMinutes = null;

    if (nextStop?.Awaiting?.expectedArrivalTime) {
      const ms = new Date(nextStop.Awaiting.expectedArrivalTime).getTime() - Date.now();
      etaMinutes = Math.max(0, Math.round(ms / 60000));
    } else if (nextStop?.Arrived) {
      etaMinutes = 0;
    }

    return {
      shuttleId: ride.rideId,
      routeId: ride.routeId,
      routeName: ride.shortName || ride.routeName,
      status: ride.stopStatus,
      etaMinutes,
      isDelayed: (ride.lateBySec ?? 0) > 60,
      delayMinutes: Math.round((ride.lateBySec ?? 0) / 60),
      riderCount: ride.riderCount,
      vehicleCapacity: ride.vehicleCapacity,
      lastUpdate: ride.lastMonitorUpdate,
    };
  } catch (err) {
    console.error('[TripShotService] Failed:', err.message);
    return null;
  }
}