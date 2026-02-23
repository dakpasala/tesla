import {
  getKeysByPattern,
  getSetSize,
} from '../services/redis/cache.js';
import { getShuttleStatus } from '../services/maps/tripshotService.js';
import { notifyShuttleEvent, notifyShuttleAlert } from '../services/notifications/notificationRouter.js';
import { getShuttleAlerts } from '../services/redis/shuttleNotification.js';

const POLL_INTERVAL_MS = 5_000; // 1 minute

export async function runShuttlePollingJob() {
  setInterval(async () => {
    try {
      const keys = await getKeysByPattern('shuttle:*:users');

      for (const key of keys) {
        const shuttleName = key.slice('shuttle:'.length, -':users'.length);

        const userCount = await getSetSize(key);
        if (userCount === 0) continue;

        // ── ETA check ────────────────────────────────────────────────────
        const status = await getShuttleStatus(shuttleName);
        if (status) {
          const { etaMinutes, routeName } = status;
          if (etaMinutes !== null && etaMinutes <= 5) {
            await notifyShuttleEvent({
              shuttleName,
              routeName,
              event: 'ETA_5',
              etaMinutes,
            });
          }
        }

        // ── Admin alert check ─────────────────────────────────────────────
        const alerts = await getShuttleAlerts(shuttleName);
        for (const alert of alerts) {
          await notifyShuttleAlert({ shuttleName, alert });
        }
      }
    } catch (err) {
      console.error('[ShuttleJob]', err.message);
    }
  }, POLL_INTERVAL_MS);
}