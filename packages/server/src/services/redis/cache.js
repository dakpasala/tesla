import { getRedisClient } from './redisClient.js';

export async function getCache(key) {
  const redis = await getRedisClient();
  const value = await redis.get(key);

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function setCache(key, value, ttlSeconds = null) {
  const redis = await getRedisClient();

  const storedValue =
    typeof value === 'string' ? value : JSON.stringify(value);

  if (ttlSeconds) {
    await redis.set(key, storedValue, { EX: ttlSeconds });
  } else {
    await redis.set(key, storedValue);
  }
}

export async function addUserToLocation(locationId, userId) {
  const redis = await getRedisClient();
  await redis.sAdd(`location:${locationId}:users`, String(userId));
}

export async function removeUserFromLocation(locationId, userId) {
  const redis = await getRedisClient();
  await redis.sRem(`location:${locationId}:users`, String(userId));
}

export async function subscribeUserToShuttle(userId, shuttleId) {
  const redis = await getRedisClient();
  await redis.sAdd(`shuttle:${shuttleId}:users`, String(userId));
}

export async function unsubscribeUserFromShuttle(userId, shuttleId) {
  const redis = await getRedisClient();
  await redis.sRem(`shuttle:${shuttleId}:users`, String(userId));
}

export async function suppressUserNotifications(userId) {
  const redis = await getRedisClient();
  await redis.set(`user:${userId}:suppress_notifications`, 'true');
}

export async function unsuppressUserNotifications(userId) {
  const redis = await getRedisClient();
  await redis.del(`user:${userId}:suppress_notifications`);
}