import { getRedisClient } from '../../services/redis/redisClient.js';

async function run() {
  try {
    const redis = await getRedisClient();
    const pong = await redis.ping();
    console.log('PING ->', pong);
  } catch (e) {
    console.error('Redis script error:', e.message);
  }
}

run();
