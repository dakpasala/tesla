import express from 'express';
import {
  addShuttleReport,
  getShuttleReports,
  createShuttleAlert,
  getShuttleAlerts,
} from '../services/redis/shuttleNotifications.js';

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
