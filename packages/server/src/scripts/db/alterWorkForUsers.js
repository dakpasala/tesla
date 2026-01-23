import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Updating users table (adding work_address)...');

    await pool.request().batch(`
      IF COL_LENGTH('users', 'work_address') IS NULL
      BEGIN
        ALTER TABLE users ADD work_address VARCHAR(255);
      END
    `);

    console.log('work_address column added (if missing)');

    await pool.request().batch(`
      UPDATE users
      SET work_address = '1501 Page Mill Rd, Palo Alto, CA'
      WHERE name = 'dakshesh';

      UPDATE users
      SET work_address = '3500 Deer Creek Rd, Palo Alto, CA'
      WHERE name = 'kevin';
    `);

    console.log('Users updated with work address');

    const result = await pool.request().query(`
      SELECT id, name, home_address, work_address
      FROM users;
    `);

    console.table(result.recordset);

    await sql.close();
  } catch (err) {
    console.error('Error adding work_address:', err);
    await sql.close();
  }
}

run();
