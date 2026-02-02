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
        if (type === 'BELOW') {
            await setCache(dedupeKey, '1', 86400);
        }
    }
}

export async function notifyShuttleEvent({
  shuttleId,
  event,
  etaMinutes,
}) {
  const userIds = await getSetMembers(`shuttle:${shuttleId}:users`);
  if (userIds.length === 0) return;

  for (const userId of userIds) {
    if (await cacheExists(`user:${userId}:suppress_notifications`)) {
      console.log(`[SKIP] user:${userId} suppressed`);
      continue;
    }

    const dedupeKey = `user:${userId}:notified:shuttle:${shuttleId}:${event}`;
    if (await cacheExists(dedupeKey)) continue;

    console.log(
      `[SHUTTLE NOTIFY] user:${userId} → shuttle ${shuttleId} ${event} (${etaMinutes} min)`
    );

    // APNs 
    await setCache(dedupeKey, '1', 900);
  }
}