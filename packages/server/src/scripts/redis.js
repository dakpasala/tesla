import { getRedisClient } from '../services/redis/redisClient.js';

async function run() {
  try {
    const client = await getRedisClient();
    console.log('Connected.');

    await client.set('test:script', 'OK', { EX: 30 });
    const val = await client.get('test:script');
    console.log('Value:', val);

    await client.del('test:script');
    await client.quit();
    console.log('Done.');
  } catch (e) {
    console.error('Redis script error:', e.message);
  }
}

run();