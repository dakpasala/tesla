import { getRedisClient } from '../redis/redisClient.js';
import { getUsersFavoritingLocation } from '../db/mssqlPool.js';

export async function routeParkingNotification({
  location,
  lot,
  threshold,
  available,
  type 
}) {
  const redis = await getRedisClient();

  const users = await getUsersFavoritingLocation(location);

  for (const user of users) {
    const redisKey = `user:${user.id}:notified:${location}:${threshold}`;

    const alreadyNotified = await redis.exists(redisKey);

    if (type === 'BELOW' && alreadyNotified) {
      continue;
    }

    if (type === 'RECOVERY') {
      await redis.del(redisKey);
    }

    console.log(
      `[USER NOTIFY] ${user.name} → ${location} - ${lot} ` +
      (type === 'BELOW'
        ? `below ${threshold} (${available})`
        : `recovered above ${threshold} (${available})`)
    );

    if (type === 'BELOW') {
      await redis.set(redisKey, '1', {
        EX: 86400, 
      });
    }
  }
}