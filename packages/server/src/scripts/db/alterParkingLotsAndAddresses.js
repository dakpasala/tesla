import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Altering parking_lots table (address, lat, lng)...');

    await pool.request().batch(`
      IF COL_LENGTH('parking_lots', 'address') IS NULL
        ALTER TABLE parking_lots ADD address VARCHAR(255) NULL;

      IF COL_LENGTH('parking_lots', 'lat') IS NULL
        ALTER TABLE parking_lots ADD lat FLOAT NULL;

      IF COL_LENGTH('parking_lots', 'lng') IS NULL
        ALTER TABLE parking_lots ADD lng FLOAT NULL;
    `);

    console.log('parking_lots table altered successfully');

    console.log('Backfilling Palo Alto parking lots...');

    await pool.request().batch(`
      UPDATE parking_lots
      SET address = '3500 Deer Creek Rd, Palo Alto, CA'
      WHERE name IN ('SAP Lot', 'DC Lot');
    `);

    console.log('Backfilling Fremont parking lots...');

    await pool.request().batch(`
      UPDATE parking_lots
      SET address = '45500 Fremont Blvd, Fremont, CA'
      WHERE name IN ('Parking Lot A', 'Parking Lot B');
    `);

    const result = await pool.request().query(`
      SELECT
        p.id,
        p.name AS parking_lot,
        l.name AS location,
        p.address,
        p.lat,
        p.lng
      FROM parking_lots p
      JOIN locations l ON l.id = p.location_id
      ORDER BY l.name, p.name;
    `);

    console.log('Final parking_lots state:');
    console.table(result.recordset);

    await sql.close();
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
