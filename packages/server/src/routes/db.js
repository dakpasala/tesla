import express from 'express';
import sql from 'mssql';
import {
  MSSQL_USER,
  MSSQL_PASSWORD,
  MSSQL_SERVER,
  MSSQL_PORT,
  MSSQL_DATABASE,
} from '../config/env.js';

const router = express.Router();

const config = {
  user: MSSQL_USER,
  password: MSSQL_PASSWORD,
  server: MSSQL_SERVER,
  port: parseInt(MSSQL_PORT, 10),
  database: MSSQL_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

router.get('/test', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM users');
    await sql.close();

    res.json({
      success: true,
      message: 'Database connection test passed',
      rowCount: result.recordset.length,
      data: result.recordset,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/users', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM users');
    await sql.close();

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
