import express from 'express';
import { getRedisClient } from '../services/redis/redisClient.js';

const router = express.Router();

// Express routes for direct Redis key management (dev/debug use only).
// Supports setting, getting, and deleting arbitrary keys, plus a connectivity test.
// Not intended for production use — provides low-level cache inspection during development.

router.post('/set', async (req, res) => {
  try {
    const { key, value, ttl } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Missing key or value' });
    }

    const redis = await getRedisClient();

    if (ttl) {
      await redis.set(key, value, { EX: ttl });
    } else {
      await redis.set(key, value);
    }

    res.json({ success: true, message: 'Value set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/get/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const redis = await getRedisClient();
    const value = await redis.get(key);

    if (value === null) {
      return res.status(404).json({ error: 'Key not found' });
    }

    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/delete/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const redis = await getRedisClient();
    const deleted = await redis.del(key);

    res.json({
      success: deleted > 0,
      message: deleted > 0 ? 'Key deleted' : 'Key not found',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test', async (req, res) => {
  try {
    const redis = await getRedisClient();

    // Test write
    await redis.set('tesla:status', 'charging');
    await redis.set('tesla:battery', '82', { EX: 3600 });

    // Test read
    const status = await redis.get('tesla:status');
    const battery = await redis.get('tesla:battery');

    res.json({
      success: true,
      message: 'Redis test passed',
      data: { status, battery: `${battery}%` },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
