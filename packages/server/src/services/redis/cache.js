// General-purpose Redis cache utilities for get, set, delete, and set operations.
// Includes helpers for user/location subscriptions, shuttle tracking, and notification suppression.
// All functions obtain a shared Redis client via getRedisClient to avoid duplicate connections.

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

export async function deleteCache(key) {
  const redis = await getRedisClient();
  await redis.del(key);
}

export async function cacheExists(key) {
  const redis = await getRedisClient();
  return redis.exists(key);
}

export async function getKeysByPattern(pattern) {
  const redis = await getRedisClient();
  return redis.keys(pattern);
}

export async function getLength(key) {
  const redis = await getRedisClient();
  return await redis.lLen(key);
}

export async function getSetSize(key) {
  const redis = await getRedisClient();
  return redis.sCard(key);
}

export async function getSetMembers(key) {
  const redis = await getRedisClient();
  return redis.sMembers(key);
}

export async function addSetMembers(key, members) {
  const redis = await getRedisClient();
  if (Array.isArray(members)) {
    if (members.length > 0) await redis.sAdd(key, members);
  } else {
    await redis.sAdd(key, String(members));
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

export async function subscribeUserToShuttle(userId, shuttleName) {
  const redis = await getRedisClient();
  await redis.sAdd(`shuttle:${shuttleName}:users`, String(userId));
}

export async function unsubscribeUserFromShuttle(userId, shuttleName) {
  const redis = await getRedisClient();
  await redis.sRem(`shuttle:${shuttleName}:users`, String(userId));
}

export async function suppressUserNotifications(userId) {
  const redis = await getRedisClient();
  await redis.set(`user:${userId}:suppress_notifications`, 'true');
}

export async function unsuppressUserNotifications(userId) {
  const redis = await getRedisClient();
  await redis.del(`user:${userId}:suppress_notifications`);
}

