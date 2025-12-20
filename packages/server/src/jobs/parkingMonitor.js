import { getRedisClient } from '../services/redis/redisClient.js';
import { getPool } from '../services/db/mssqlPool.js';

const THRESHOLDS = [50, 25, 10, 5, 0];

function getPollingIntervalMs() {
  const hour = new Date().getHours();

  if (hour >= 8 && hour < 10) return 5000;
  if (hour >= 7 && hour < 8) return 60000;
  if (hour >= 10 && hour < 12) return 60000;
  return null;
}

async function fetchParkingAvailability() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT lot_name, available
    FROM parking_availability
    WHERE lot_name IN ('SAP Lot', 'DC Lot')
  `);
  return result.recordset;
}

async function sendNotification(lot, threshold, available) {
  if (threshold === 0) {
    console.log(`${lot} is FULL`);
  } else {
    console.log(`${lot} has less than ${threshold} spots available (${available})`);
  }
}

async function checkParkingAvailability() {
  const redis = await getRedisClient();
  const rows = await fetchParkingAvailability();

  for (const row of rows) {
    const lot = row.lot_name;
    const available = row.available;

    const key = `parking:last_threshold:${lot}`;
    const last = await redis.get(key);
    const lastThreshold = last ? Number(last) : null;

    const crossed = THRESHOLDS.find(
      t => available <= t && (lastThreshold === null || t < lastThreshold)
    );

    if (crossed !== undefined) {
      await sendNotification(lot, crossed, available);
      await redis.set(key, crossed);
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
