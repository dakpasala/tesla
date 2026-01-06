// src/services/db/mssqlPool.js
import sql from 'mssql';
import {
  MSSQL_USER,
  MSSQL_PASSWORD,
  MSSQL_SERVER,
  MSSQL_PORT,
  MSSQL_DATABASE,
} from '../../config/env.js';

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

export async function getPool() {
  return sql.connect(config);
}

// --------------------
// health / testing
// --------------------

export async function testConnection() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT 1 AS ok');
  await sql.close();
  return result.recordset;
}

// --------------------
// parking availability
// --------------------

export async function getAllParkingAvailability() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT id, lot_name, availability
    FROM parking_availability
    ORDER BY lot_name
  `);
  await sql.close();
  return result.recordset;
}

export async function updateParkingAvailability(lot_name, availability) {
  const pool = await getPool();
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
}

// --------------------
// admins
// --------------------

export async function getAllAdmins() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT id, username, email
    FROM admins
    ORDER BY username
  `);
  await sql.close();
  return result.recordset;
}

export async function addAdmin(username, email) {
  const pool = await getPool();
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
  return result.recordset[0].id;
}
