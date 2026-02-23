// packages/server/src/services/notifications/notificationRouter.js

import {
  getCache,
  setCache,
  getSetMembers,
  addSetMembers,
  cacheExists,
  deleteCache,
} from '../redis/cache.js';
import { getUsersFavoritingLocationId } from '../db/mssqlPool.js';

export async function routeParkingNotification({
    locationId,
    locationName,
    lot,
    threshold,
    available,
    type
}) {
    const locationUsersKey = `location:${locationId}:users`;
    const locationReadyKey = `location:${locationId}:users:ready`;

    let userIds;

    // check whether we've pulled from DB, if not then we pull from DB and also the case if people added to favs
    const isReady = await getCache(locationReadyKey);
    if (!isReady) {
      const users = await getUsersFavoritingLocationId(locationId);
      userIds = users.map(u => String(u.id));

      await addSetMembers(locationUsersKey, userIds);
      await setCache(locationReadyKey, '1', 3600);

      console.log('[CACHE BUILD] location users loaded from DB');
    }
    else {
        // just get everything from redis ~ we can have an expiry of like a hour or a day it don't matter
        userIds = await getSetMembers(locationUsersKey);
        console.log('[CACHE HIT] location favorites from Redis');
    }

    // fan-out
    for (const userId of userIds) {
        // if the user is near an office and stuff u know
        const suppressKey = `user:${userId}:suppress_notifications`;
        if (await cacheExists(suppressKey)) continue;

        const dedupeKey = `user:${userId}:notified:${locationId}:${threshold}`;
        if (type === 'BELOW' && await cacheExists(dedupeKey)) continue;
        if (type === 'RECOVERY') await deleteCache(dedupeKey);

        console.log(
            `[USER NOTIFY] user:${userId} → ${locationName} - ${lot} ` +
            (type === 'BELOW'
            ? `below ${threshold} (${available})`
            : `recovered above ${threshold} (${available})`)
        );
        
        // Store alert in Redis for mobile app to poll
        await addSetMembers(`user:${userId}:pending_alerts`, [
          JSON.stringify({
            type: 'parking',
            locationId,
            locationName,
            lot,
            available,
            threshold,
            alertType: type,
            timestamp: Date.now(),
          })
        ]);

        if (type === 'BELOW') {
            await setCache(dedupeKey, '1', 86400);
        }
    }
}

export async function notifyShuttleEvent({
  shuttleName,
  routeName,
  event,
  etaMinutes,
}) {
  const userIds = await getSetMembers(`shuttle:${shuttleName}:users`);
  if (userIds.length === 0) return;

  const displayName = routeName || 'Your shuttle';
  const message = `${displayName} arriving in ${etaMinutes} min`;

  for (const userId of userIds) {
    if (await cacheExists(`user:${userId}:suppress_notifications`)) {
      console.log(`[SKIP] user:${userId} suppressed`);
      continue;
    }

    const dedupeKey = `user:${userId}:notified:shuttle:${shuttleName}:${event}`;
    if (await cacheExists(dedupeKey)) continue;

    console.log(`[SHUTTLE NOTIFY] user:${userId} → ${message}`);

    await addSetMembers(`user:${userId}:pending_alerts`, [
      JSON.stringify({
        type: 'shuttle',
        shuttleName,
        routeName: displayName,
        message,
        event,
        etaMinutes,
        timestamp: Date.now(),
      })
    ]);

    // APNs — dedupe for 15 min
    await setCache(dedupeKey, '1', 900);
  }
}

export async function notifyShuttleAlert({
  shuttleName,
  alert,
}) {
  const userIds = await getSetMembers(`shuttle:${shuttleName}:users`);
  if (userIds.length === 0) return;

  // Dedupe per alert id — only notify each user once
  const dedupeKey = `notified:alert:${alert.id}`;
  if (await cacheExists(dedupeKey)) return;

  const reason = alert.reason?.replace('_', ' ') ?? 'update';
  const delayPart = alert.delay_minutes ? ` — ${alert.delay_minutes} min delay` : '';
  const message = `${shuttleName}: ${reason}${delayPart}`;

  for (const userId of userIds) {
    if (await cacheExists(`user:${userId}:suppress_notifications`)) {
      console.log(`[SKIP] user:${userId} suppressed`);
      continue;
    }

    console.log(`[ALERT NOTIFY] user:${userId} → ${message}`);

    await addSetMembers(`user:${userId}:pending_alerts`, [
      JSON.stringify({
        type: 'shuttle_alert',
        shuttleName,
        alertId: alert.id,
        alertType: alert.type,
        reason: alert.reason,
        delayMinutes: alert.delay_minutes,
        message,
        timestamp: Date.now(),
      })
    ]);
  }

  // Mark alert as notified for 24h (matches alert expiry)
  await setCache(dedupeKey, '1', 86400);
}