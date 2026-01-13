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

export async function getParkingAvailabilityByLocationName(locationName) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input('locationName', sql.VarChar, locationName)
    .query(`
      -- Check if location exists
      IF NOT EXISTS (
        SELECT 1 FROM locations WHERE name = @locationName
      )
      BEGIN
        SELECT 'LOCATION_NOT_FOUND' AS error;
        RETURN;
      END

      SELECT
        p.id,
        p.name AS lot_name,
        p.current_available,
        p.capacity
      FROM parking_lots p
      JOIN locations l ON l.id = p.location_id
      WHERE l.name = @locationName
        AND p.is_active = 1
      ORDER BY p.name;
    `);

  await sql.close();
  return result.recordset;
}

export async function updateParkingAvailability(locationName, lotName, availability) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input('locationName', sql.VarChar, locationName)
    .input('lotName', sql.VarChar, lotName)
    .input('availability', sql.Int, availability)
    .query(`
      UPDATE p
      SET p.current_available = @availability
      FROM parking_lots p
      JOIN locations l ON l.id = p.location_id
      WHERE l.name = @locationName
        AND p.name = @lotName;

      SELECT @@ROWCOUNT AS rowsAffected;
    `);

  await sql.close();
  return result.recordset[0].rowsAffected;
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
