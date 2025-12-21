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

// --------------------
// testing
// --------------------

router.get('/test', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT 1');
    await sql.close();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --------------------
// parking availbility
// --------------------

// all parking availability
router.get('/parking', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT id, lot_name, availability
      FROM parking_availability
      ORDER BY lot_name
    `);
    await sql.close();

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update parking availability
router.post('/parking', async (req, res) => {
  const { lot_name, availability } = req.body;

  if (!lot_name || availability === undefined) {
    return res.status(400).json({
      error: 'lot_name and availability are required',
    });
  }

  try {
    const pool = await sql.connect(config);
    await pool
      .request()
      .input('lot_name', sql.VarChar, lot_name)
      .input('availability', sql.Int, availability)
      .query(`
        UPDATE parking_availability
        SET availability = @availability
        WHERE lot_name = @lot_name
      `);

    await sql.close();

    res.json({
      success: true,
      lot_name,
      availability,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --------------------
// admins
// --------------------

// all admins
router.get('/admins', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT id, username, email
      FROM admins
      ORDER BY username
    `);
    await sql.close();

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// add admin
router.post('/admins', async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({
      error: 'username and email are required',
    });
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .query(`
        INSERT INTO admins (username, email)
        VALUES (@username, @email);

        SELECT SCOPE_IDENTITY() AS id;
      `);

    await sql.close();

    res.json({
      success: true,
      id: result.recordset[0].id,
      username,
      email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
