import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('🅿️ Creating parking_availability table...');

    await pool.request().batch(`
      IF OBJECT_ID('parking_availability', 'U') IS NOT NULL
        DROP TABLE parking_availability;

      CREATE TABLE parking_availability (
        id INT IDENTITY(1,1) PRIMARY KEY,
        lot_name VARCHAR(100) NOT NULL,
        availability INT NOT NULL
      );

      INSERT INTO parking_availability (lot_name, availability) VALUES
        ('SAP Lot', 100),
        ('DC Lot', 100);
    `);

    console.log('parking_availability table created and seeded');

    const result = await pool
      .request()
      .query('SELECT * FROM parking_availability');

    console.log('Parking Availability:', result.recordset);

    await sql.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
