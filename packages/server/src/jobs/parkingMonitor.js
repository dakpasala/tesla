import {
  cacheExists,
  deleteCache,
  setCache,
} from '../services/redis/cache.js';
import { fetchParkingAvailability } from '../services/db/mssqlPool.js';
import { routeParkingNotification } from '../services/notifications/notificationRouter.js';

const THRESHOLDS = [50, 25, 10, 5, 0];

function getPollingIntervalMs() {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 24) return 5000;

  // if (hour >= 8 && hour < 10) return 5000;
  // if (hour >= 7 && hour < 8) return 60000;
  // if (hour >= 10 && hour < 12) return 60000;
  return null;
}

function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
}

async function checkParkingAvailability() {
  const rows = await fetchParkingAvailability();

  for (const row of rows) {
    const locationId = row.location_id;
    const locationName = row.location_name;
    const lot = row.lot_name;
    const available = row.availability;

    let highestRecoveredThreshold = null;


    for (const threshold of THRESHOLDS) {
      const key = `parking:below:${locationId}:${lot}:${threshold}`;
      const isCached = await cacheExists(key);

      if (available > threshold && isCached) {
        await deleteCache(key);
        if (
          highestRecoveredThreshold === null ||
          threshold > highestRecoveredThreshold
        ) {
          highestRecoveredThreshold = threshold;
        }
      }
    }

    if (highestRecoveredThreshold !== null) {
      await routeParkingNotification({
        locationId,
        locationName,
        lot,
        threshold: highestRecoveredThreshold,
        available,
        type: 'RECOVERY',
      });
    }

    const crossedThresholds = THRESHOLDS.filter(
      t => available <= t
    );

    if (crossedThresholds.length > 0) {
      const lowestThreshold = Math.min(...crossedThresholds);
      const key = `parking:below:${locationId}:${lot}:${lowestThreshold}`;
      const alreadyCached = await cacheExists(key);

      if (!alreadyCached) {
        await routeParkingNotification({
          locationId,
          locationName,
          lot,
          threshold: lowestThreshold,
          available,
          type: 'BELOW',
        });

        for (const t of THRESHOLDS) {
          if (t >= lowestThreshold) {
            await setCache(
              `parking:below:${locationId}:${lot}:${t}`,
              '1',
              secondsUntilMidnight()
            );
          }
        }
      }
    }
  }
}

export function startParkingMonitor() {
  async function loop() {
    try {
      const interval = getPollingIntervalMs();
      if (interval === null) {
        setTimeout(loop, 60000);
        return;
      }
      await checkParkingAvailability();
      setTimeout(loop, interval);
    } catch (err) {
      console.error('[PARKING MONITOR ERROR]', err);
      setTimeout(loop, 60000);
    }
  }
  loop();
}