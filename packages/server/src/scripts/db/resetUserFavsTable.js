import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Clearing user_favorites table...');

    await pool.request().query(`
      DELETE FROM user_favorites;
    `);

    console.log('user_favorites table emptied');

    console.log('Dropping label column (if exists)...');

    await pool.request().batch(`
      IF COL_LENGTH('user_favorites', 'label') IS NOT NULL
      BEGIN
        ALTER TABLE user_favorites
        DROP COLUMN label;
      END
    `);

    console.log('label column dropped (or already absent)');

    await sql.close();
  } catch (err) {
    console.error('Failed to reset user_favorites:', err);
    try {
      await sql.close();
    } catch (_) {}
  }
}

run();