// will be used for notifications, redis helps avoid duplicate notis

import express from 'express';
import {
  getAllTransportOptions,
  getDirections,
} from '../services/maps/directionsService.js';
import { getRedisClient } from '../services/redis/redisClient.js';

const router = express.Router();

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

router.get('/routes', async (req, res) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        error: 'Missing required parameters: origin and destination',
      });
    }

    const redis = await getRedisClient();
    const cacheKey = `maps:routes:${normalize(origin)}:${normalize(destination)}`;

    // check Redis first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('Redis cache hit');
      return res.json(JSON.parse(cached));
    }

    console.log('Redis cache miss → calling Google Maps');

    // call Google Maps
    const routes = await getAllTransportOptions(origin, destination);

    // save to Redis with TTL
    await redis.set(cacheKey, JSON.stringify(routes), {
      EX: 60, 
    });

    // much easier than i thought, but working as expected

    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;