import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Altering locations table (lat, lng)...');

    await pool.request().batch(`
      IF COL_LENGTH('locations', 'lat') IS NULL
        ALTER TABLE locations ADD lat FLOAT NULL;

      IF COL_LENGTH('locations', 'lng') IS NULL
        ALTER TABLE locations ADD lng FLOAT NULL;
    `);

    console.log('locations table altered successfully');

    console.log('Backfilling Palo Alto Office coordinates...');

    await pool.request()
      .input('lat', sql.Float, 37.3947)
      .input('lng', sql.Float, -122.1503)
      .query(`
        UPDATE locations
        SET lat = @lat,
            lng = @lng
        WHERE name = 'Palo Alto Office';
      `);

    console.log('Backfilling Fremont Factory coordinates...');

    await pool.request()
      .input('lat', sql.Float, 37.4923)
      .input('lng', sql.Float, -121.9440)
      .query(`
        UPDATE locations
        SET lat = @lat,
            lng = @lng
        WHERE name = 'Fremont Factory';
      `);

    const result = await pool.request().query(`
      SELECT
        id,
        name,
        address,
        lat,
        lng
      FROM locations
      ORDER BY name;
    `);

    console.log('Final locations table:');
    console.table(result.recordset);

    await sql.close();
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
