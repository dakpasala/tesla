import { getRedisClient } from '../../services/redis/redisClient.js';

async function run() {
  const redis = await getRedisClient();

  const keys = await redis.keys('parking:last_threshold:*');

  if (keys.length === 0) {
    console.log('No parking threshold keys found');
  } else {
    await redis.del(keys);
    console.log('Cleared keys:', keys);
  }

  process.exit(0);
}

run();
