import {
  getKeysByPattern,
  getSetSize,
} from '../services/redis/cache.js';
import { getShuttleStatus } from '../services/maps/tripshotService.js';
import { notifyShuttleEvent } from '../services/notifications/notificationRouter.js';

const POLL_INTERVAL_MS = 5_000; 

export async function runShuttlePollingJob() {
  setInterval(async () => {
    try {
      const keys = await getKeysByPattern('shuttle:*:users');

      for (const key of keys) {
        // rideId contains colons (e.g. uuid:2026-02-23) so slice instead of split
        const shuttleId = key.slice('shuttle:'.length, -':users'.length);

        const userCount = await getSetSize(key);
        if (userCount === 0) continue;

        const status = await getShuttleStatus(shuttleId);
        if (!status) continue;

        const { etaMinutes, routeName } = status;

        if (etaMinutes !== null && etaMinutes <= 5) {
          await notifyShuttleEvent({
            shuttleId,
            routeName,
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