import {
  getKeysByPattern,
  getSetSize,
} from '../services/redis/cache.js';
import { getShuttleStatus } from '../services/maps/tripshotService.js';
import { notifyShuttleEvent, notifyShuttleAlert } from '../services/notifications/notificationRouter.js';
import { getShuttleAlerts } from '../services/redis/shuttleNotifications.js';

const POLL_INTERVAL_MS = 60_000; // 1 minute

export async function runShuttlePollingJob() {
  setInterval(async () => {
    try {
      const keys = await getKeysByPattern('shuttle:*:users');

      // Check for any global all-routes alerts first
      const allRouteAlerts = await getShuttleAlerts('__all__');

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

        // ── Per-shuttle admin alerts ──────────────────────────────────────
        const alerts = await getShuttleAlerts(shuttleName);
        for (const alert of alerts) {
          await notifyShuttleAlert({ shuttleName, alert });
        }

        // ── All-routes admin alerts ───────────────────────────────────────
        for (const alert of allRouteAlerts) {
          await notifyShuttleAlert({ shuttleName, alert });
        }
      }
    } catch (err) {
      console.error('[ShuttleJob]', err.message);
    }
  }, POLL_INTERVAL_MS);
}