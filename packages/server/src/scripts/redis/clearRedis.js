import { getRedisClient } from '../../services/redis/redisClient.js';

async function run() {
    try {
        const redis = await getRedisClient();
        console.log('Clearing ALL Redis data...');
        await redis.flushDb();
        console.log('Redis cache cleared successfully');
        await redis.quit();
    } catch (err) {
        console.error('Failed to clear Redis:', err);
    }
}

run();