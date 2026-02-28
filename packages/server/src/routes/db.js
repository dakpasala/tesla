import express from 'express';
import {
  testConnection,
} from '../services/db/mssqlPool.js';

const router = express.Router();

// --------------------
// testing
// --------------------

/**
 * Express route for testing the MSSQL database connection.
 * GET /test verifies connectivity to the database and returns success or an error message.
 * Used during server startup checks and infrastructure debugging.
 */

router.get('/test', async (req, res) => {
  try {
    await testConnection();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;