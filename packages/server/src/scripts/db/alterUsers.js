import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Updating users table (home_address + favorites)...');

    await pool.request().batch(`
      IF COL_LENGTH('users', 'home_address') IS NULL
      BEGIN
        ALTER TABLE users ADD home_address VARCHAR(255);
      END

      IF COL_LENGTH('users', 'favorites') IS NULL
      BEGIN
        ALTER TABLE users ADD favorites NVARCHAR(MAX);
      END
    `);

    console.log('Columns added (if missing)');

    await pool.request().batch(`
      UPDATE users
      SET
        home_address = '123 Foothill Blvd, San Luis Obispo, CA',
        favorites = '{
          "favorites": [
            {
              "label": "office",
              "name": "Palo Alto Office",
              "address": "3500 Deer Creek Rd"
            }
          ]
        }'
      WHERE name = 'dakshesh';

      UPDATE users
      SET
        home_address = '456 Grand Ave, San Luis Obispo, CA',
        favorites = '{
          "favorites": [
            {
              "label": "office",
              "name": "Palo Alto Office",
              "address": "3500 Deer Creek Rd"
            }
          ]
        }'
      WHERE name = 'kevin';
    `);

    console.log('Users updated with home address and favorites');

    const result = await pool.request().query(`
      SELECT id, name, home_address, favorites
      FROM users;
    `);

    console.log('Users:', result.recordset);

    await sql.close();
  } catch (err) {
    console.error('Error updating users:', err);
  }
}

run();
