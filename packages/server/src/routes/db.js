import express from 'express';
import {
  testConnection,
} from '../services/db/mssqlPool.js';

const router = express.Router();

// --------------------
// testing
// --------------------

router.get('/test', async (req, res) => {
  try {
    await testConnection();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});