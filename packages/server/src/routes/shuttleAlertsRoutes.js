import express from 'express';
import {
  addShuttleReport,
  getShuttleReports,
  createShuttleAlert,
  getShuttleAlerts,
} from '../services/redis/shuttleNotifications.js';

import { getKeysByPattern, getLength } from '../services/redis/cache.js'

const router = express.Router();

// submit a report
router.post('/:shuttleName/reports', async (req, res) => {
  const { shuttleName } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: 'comment is required' });
  }

  const report = await addShuttleReport(shuttleName, comment);
  res.json(report);
});

// get total count
router.get('/admin/count', async (req, res) => {
  try {    
    // Get all keys matching the pattern
    const keys = await getKeysByPattern('reports:shuttle:*');
    
    // Get the length of each list and sum them
    let totalCount = 0;
    for (const key of keys) totalCount += getLength(key);
    res.json({ count: totalCount });

  } catch (err) {
    console.error('Failed to get reports count:', err);
    res.status(500).json({ error: 'Failed to get reports count' });
  }
});


// fetch alerts
router.get('/:shuttleName/alerts', async (req, res) => {
  const { shuttleName } = req.params;

  const alerts = await getShuttleAlerts(shuttleName);
  res.json(alerts);
});

// admin routes

// fetch reports
router.get('/admin/:shuttleName/reports', async (req, res) => {
  const { shuttleName } = req.params;

  const reports = await getShuttleReports(shuttleName);
  res.json(reports);
});

// create alert
router.post('/admin/:shuttleName/alerts', async (req, res) => {
  const { shuttleName } = req.params;
  const { type, reason, delayMinutes, clearReports } = req.body;

  if (!type || !reason) {
    return res.status(400).json({
      error: 'type and reason are required',
    });
  }

  const alert = await createShuttleAlert({
    shuttleName,
    type,
    reason,
    delayMinutes,
    clearReports,
  });

  res.json(alert);
});

export default router;
