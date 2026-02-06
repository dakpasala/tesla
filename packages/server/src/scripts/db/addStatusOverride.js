import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Altering parking_lots table to add status_override...');

    // batch allows us to run multiple DDL statements if needed
    await pool.request().batch(`
      IF COL_LENGTH('parking_lots', 'status_override') IS NULL
      BEGIN
        ALTER TABLE parking_lots 
        ADD status_override VARCHAR(100) NULL;
        PRINT 'Column status_override added successfully.';
      END
      ELSE
      BEGIN
        PRINT 'Column status_override already exists.';
      END
    `);

    console.log('parking_lots table altered successfully');

    // Optional: Backfill a lot to test the "Reserved" status
    console.log('Testing backfill for a lot status...');

    await pool.request()
      .input('status', sql.VarChar, 'Reserved for event')
      .query(`
        UPDATE parking_lots
        SET status_override = @status
        WHERE name = 'Visitor Lot A';
      `);

    const result = await pool.request().query(`
      SELECT 
        id, 
        name, 
        current_available, 
        capacity, 
        status_override 
      FROM parking_lots
      WHERE is_active = 1
      ORDER BY name;
    `);

    console.log('Updated parking_lots table:');
    console.table(result.recordset);

    await sql.close();
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();