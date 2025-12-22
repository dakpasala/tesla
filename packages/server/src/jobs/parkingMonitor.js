import { getRedisClient } from '../services/redis/redisClient.js';
import { getPool } from '../services/db/mssqlPool.js';

const THRESHOLDS = [50, 25, 10, 5, 0];

function getPollingIntervalMs() {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 24) return 5000;

//   if (hour >= 8 && hour < 10) return 5000;
//   if (hour >= 7 && hour < 8) return 60000;
//   if (hour >= 10 && hour < 12) return 60000;
  return null;
}

function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
}

async function fetchParkingAvailability() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT lot_name, availability
    FROM parking_availability
    WHERE lot_name IN ('SAP Lot', 'DC Lot')
  `);
  return result.recordset;
}

async function sendBelowNotification(lot, threshold, available) {
  if (threshold === 0) {
    console.log(`${lot} is FULL`);
  } else {
    console.log(`${lot} has less than ${threshold} spots available (${available})`);
  }
}

async function sendRecoveryNotification(lot, threshold, available) {
  if (threshold === 0) {
    console.log(`${lot} has spots available again (${available})`);
  } else {
    console.log(`${lot} is back above ${threshold} spots (${available})`);
  }
}

async function checkParkingAvailability() {
  const redis = await getRedisClient();
  const rows = await fetchParkingAvailability();

  for (const row of rows) {
    const lot = row.lot_name;
    const available = row.availability;

    let highestRecoveredThreshold = null;

    for (const threshold of THRESHOLDS) {
      const key = `parking:below:${lot}:${threshold}`;
      const isCached = await redis.exists(key);

      if (available > threshold && isCached) {
        await redis.del(key);
        if (
          highestRecoveredThreshold === null ||
          threshold > highestRecoveredThreshold
        ) {
          highestRecoveredThreshold = threshold;
        }
      }
    }

    if (highestRecoveredThreshold !== null) {
      await sendRecoveryNotification(
        lot,
        highestRecoveredThreshold,
        available
      );
    }

    const crossedThresholds = THRESHOLDS.filter(
      t => available <= t
    );

    if (crossedThresholds.length > 0) {
      const lowestThreshold = Math.min(...crossedThresholds);
      const key = `parking:below:${lot}:${lowestThreshold}`;
      const alreadyCached = await redis.exists(key);

      if (!alreadyCached) {
        await sendBelowNotification(lot, lowestThreshold, available);

        for (const t of THRESHOLDS) {
          if (t >= lowestThreshold) {
            await redis.set(
              `parking:below:${lot}:${t}`,
              '1',
              { EX: secondsUntilMidnight() }
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
    } catch {
      setTimeout(loop, 60000);
    }
  }
  loop();
}
