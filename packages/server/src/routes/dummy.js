import express from 'express';

// Placeholder Express routes used for development and API health checks.
// Includes a status endpoint, a data echo route, and a test error handler.
// Safe to remove or ignore in production.

const router = express.Router();

// Simple dummy data
const dummyData = {
  message: 'Hello from dummy API!',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
};

// GET - Health check / status
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Dummy API is working',
  });
});

// GET - Return dummy data
router.get('/data', (req, res) => {
  res.json(dummyData);
});

// POST - Echo back what was sent
router.post('/echo', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  res.json({
    echo: message,
    receivedAt: new Date().toISOString(),
  });
});

// GET - Test error handling
router.get('/error', (req, res) => {
  throw new Error('This is a test error');
});

export default router;
