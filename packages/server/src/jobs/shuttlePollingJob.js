import {
  getKeysByPattern,
  getSetSize,
} from '../services/redis/cache.js';
import { getShuttleStatus } from '../services/maps/tripshotService.js';
import { notifyShuttleEvent } from '../services/notifications/notificationRouter.js';

const POLL_INTERVAL_MS = 60_000;

export async function runShuttlePollingJob() {
  setInterval(async () => {
    try {
      const keys = await getKeysByPattern('shuttle:*:users');

      for (const key of keys) {
        const shuttleId = key.split(':')[1];
        const userCount = await getSetSize(key);
        if (userCount === 0) continue;

        const status = await getShuttleStatus(shuttleId);
        if (!status) continue;

        const { etaMinutes } = status;

        if (etaMinutes <= 5) {
          await notifyShuttleEvent({
            shuttleId,
            event: 'ETA_5',
            etaMinutes,
          });
        }
      }
    } catch (err) {
      console.error('[ShuttleJob]', err.message);
    }
  }, POLL_INTERVAL_MS);
}
