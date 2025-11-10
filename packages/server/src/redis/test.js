import { getRedisClient } from './client.js';

(async () => {
  const redis = await getRedisClient();

  // write
  await redis.set('tesla:status', 'charging');
  await redis.set('tesla:battery', '82', { EX: 3600 }); // expire after 1 hour

  // read
  const status = await redis.get('tesla:status');
  const battery = await redis.get('tesla:battery');

  console.log(`Tesla status: ${status}, battery: ${battery}%`);

  await redis.quit();
})();
