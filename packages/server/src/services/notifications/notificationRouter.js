import { getRedisClient } from '../redis/redisClient.js';
import { getUsersFavoritingLocationId } from '../db/mssqlPool.js';

export async function routeParkingNotification({
    locationId,
    locationName,
    lot,
    threshold,
    available,
    type
}) {
    const redis = await getRedisClient();

    const locationUsersKey = `location:${locationId}:users`;
    const locationReadyKey = `location:${locationId}:users:ready`;

    let userIds;

    // check whether we've pulled from DB, if not then we pull from DB and also the case if people added to favs
    const isReady = await redis.get(locationReadyKey);
    if (!isReady) {
        const users = await getUsersFavoritingLocationId(locationId);
        userIds = users.map(u => String(u.id));

        if (userIds.length > 0) {
            await redis.sAdd(locationUsersKey, userIds);
        }

        await redis.set(locationReadyKey, '1');
        console.log('[CACHE BUILD] location users loaded from DB');
    } else {
        // just get everything from redis ~ we can have an expiry of like a hour or a day it don't matter
        userIds = await redis.sMembers(locationUsersKey);
        console.log('[CACHE HIT] location favorites from Redis');
    }

    // fan-out
    for (const userId of userIds) {
        // if the user is near an office and stuff u know
        const suppressKey = `user:${userId}:suppress_notifications`;
        const isSuppressed = await redis.exists(suppressKey);

        if (isSuppressed) {
            console.log(`[SKIP] user:${userId} at office → suppress notification`);
            continue;
        }

        const redisKey = `user:${userId}:notified:${locationId}:${threshold}`;
        const alreadyNotified = await redis.exists(redisKey);
        if (type === 'BELOW' && alreadyNotified) continue;
        if (type === 'RECOVERY') {
            await redis.del(redisKey);
        }
        console.log(
            `[USER NOTIFY] user:${userId} → ${locationName} - ${lot} ` +
            (type === 'BELOW'
            ? `below ${threshold} (${available})`
            : `recovered above ${threshold} (${available})`)
        );
        if (type === 'BELOW') {
            await redis.set(redisKey, '1', { EX: 86400 });
        }
    }
}

export async function notifyShuttleEvent({
  shuttleId,
  event,
  etaMinutes,
}) {
  const redis = await getRedisClient();

  const usersKey = `shuttle:${shuttleId}:users`;
  const userIds = await redis.sMembers(usersKey);

  if (userIds.length === 0) return;

  for (const userId of userIds) {
    const suppressKey = `user:${userId}:suppress_notifications`;
    const isSuppressed = await redis.exists(suppressKey);
    if (isSuppressed) {
      console.log(`[SKIP] user:${userId} suppressed`);
      continue;
    }

    const dedupeKey = `user:${userId}:notified:shuttle:${shuttleId}:${event}`;
    const alreadyNotified = await redis.exists(dedupeKey);
    if (alreadyNotified) continue;

    console.log(
      `[SHUTTLE NOTIFY] user:${userId} → shuttle ${shuttleId} ${event} (${etaMinutes} min)`
    );

    // APNs 
    await redis.set(dedupeKey, '1', { EX: 900 });
  }
}