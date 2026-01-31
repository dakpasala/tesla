import axios from 'axios';

const TRIPSHOT_BASE_URL =
  process.env.TRIPSHOT_BASE_URL || 'http://localhost:3000/api/tripshot';

export async function getShuttleStatus(shuttleId) {
  try {
    const res = await axios.post(
      `${TRIPSHOT_BASE_URL}/liveStatus`,
      null,
      {
        params: {
          rideIds: shuttleId,
        },
        timeout: 5000,
      }
    );

    const ride = res.data?.rides?.[0];
    if (!ride) return null;

    return {
      shuttleId: ride.rideId,
      routeId: ride.routeId,
      status: ride.stopStatus,
      lastUpdate: ride.lastETAUpdate,
      etaMinutes: mockEtaFromTimestamp(ride.lastETAUpdate),
    };
  } catch (err) {
    console.error('[TripShotService] Failed:', err.message);
    return null;
  }
}


function mockEtaFromTimestamp(ts) {
  const minutesAgo =
    (Date.now() - new Date(ts).getTime()) / 60000;
  return Math.max(0, Math.ceil(10 - minutesAgo));
}
