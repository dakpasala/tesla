// packages/server/src/routes/alerts.js

// Express routes for retrieving and clearing user-specific alert queues from Redis.
// GET returns all pending alerts for a user; DELETE clears them after delivery.
// Alerts include parking threshold events and shuttle delay notifications.

import express from 'express';
import { getSetMembers, deleteCache } from '../services/redis/cache.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const alertKey = `user:${userId}:pending_alerts`;
    const alerts = await getSetMembers(alertKey);

    if (alerts.length === 0) {
      return res.json({ alerts: [] });
    }

    const parsedAlerts = alerts.map(a => JSON.parse(a));

    res.json({ alerts: parsedAlerts });
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const alertKey = `user:${userId}:pending_alerts`;
    await deleteCache(alertKey);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to clear alerts:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
