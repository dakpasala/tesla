import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Updating users table (email + balance)...');

    await pool.request().batch(`
      IF COL_LENGTH('users', 'email') IS NULL
      BEGIN
        ALTER TABLE users ADD email VARCHAR(255);
      END

      IF COL_LENGTH('users', 'balance') IS NULL
      BEGIN
        ALTER TABLE users ADD balance DECIMAL(10, 2) DEFAULT 0.00;
      END
    `);

    console.log('Columns added (if missing)');

    await pool.request().batch(`
      UPDATE users
      SET email = 'dpasala@calpoly.edu',
          balance = 20.00
      WHERE name = 'dakshesh';

      UPDATE users
      SET email = 'kbeltr03@calpoly.edu',
          balance = 20.00
      WHERE name = 'kevin';
    `);

    console.log('Users updated with emails and balances');

    const result = await pool.request().query(`
      SELECT id, name, email, balance FROM users
    `);

    console.log('Users:', result.recordset);

    await sql.close();
  } catch (err) {
    console.error('Error updating users:', err.message);
  }
}

run();
