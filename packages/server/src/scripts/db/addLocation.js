import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Seeding Bay Area location and parking lots...');

    await pool.request().batch(`
      -- Insert Bay Area office
      INSERT INTO locations (name, address, city, region)
      VALUES (
        'Fremont Factory',
        '45500 Fremont Blvd, Fremont, CA',
        'Fremont',
        'Bay Area'
      );

      DECLARE @fremontLocationId INT = SCOPE_IDENTITY();

      -- Insert parking lots for Fremont
      INSERT INTO parking_lots (
        location_id,
        name,
        lot_type,
        capacity,
        current_available
      )
      VALUES
        (@fremontLocationId, 'Parking Lot A', 'surface', 400, 215),
        (@fremontLocationId, 'Parking Lot B', 'garage', 650, 389);
    `);

    console.log('Fremont location and parking lots inserted');

    const locations = await pool.request().query(`
      SELECT * FROM locations WHERE name = 'Fremont Factory'
    `);

    const parking = await pool.request().query(`
      SELECT p.*
      FROM parking_lots p
      JOIN locations l ON l.id = p.location_id
      WHERE l.name = 'Fremont Factory'
    `);

    console.log('Inserted Location:', locations.recordset);
    console.log('Inserted Parking Lots:', parking.recordset);

    await sql.close();
  } catch (err) {
    console.error('Error seeding Bay Area location:', err.message);
  }
}

run();
