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