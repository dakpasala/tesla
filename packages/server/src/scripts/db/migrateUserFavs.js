import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    // -----------------------------------------
    // 1. Remove favorites column from users
    // -----------------------------------------
    console.log('Removing favorites column from users table...');

    await pool.request().batch(`
      IF COL_LENGTH('users', 'favorites') IS NOT NULL
        ALTER TABLE users DROP COLUMN favorites;
    `);

    console.log('users table updated successfully');

    // -----------------------------------------
    // 2. Add name + address to user_favorites
    // -----------------------------------------
    console.log('Altering user_favorites table (name, address)...');

    await pool.request().batch(`
      IF COL_LENGTH('user_favorites', 'name') IS NULL
        ALTER TABLE user_favorites ADD name NVARCHAR(255) NULL;

      IF COL_LENGTH('user_favorites', 'address') IS NULL
        ALTER TABLE user_favorites ADD address NVARCHAR(255) NULL;
    `);

    console.log('user_favorites table altered successfully');

    // -----------------------------------------
    // 3. Backfill existing favorites
    // -----------------------------------------
    console.log('Backfilling user_favorites name/address...');

    await pool.request().query(`
      UPDATE user_favorites
      SET
        name = CASE location_id
          WHEN 1 THEN 'Palo Alto Office'
          WHEN 2 THEN 'Fremont Factory'
        END,
        address = CASE location_id
          WHEN 1 THEN '3500 Deer Creek Rd, Palo Alto, CA'
          WHEN 2 THEN '45500 Fremont Blvd, Fremont, CA'
        END
      WHERE name IS NULL OR address IS NULL;
    `);

    console.log('Backfill completed');

    // -----------------------------------------
    // 4. Verify result
    // -----------------------------------------
    const result = await pool.request().query(`
      SELECT
        id,
        user_id,
        location_id,
        name,
        address,
        created_at
      FROM user_favorites
      ORDER BY created_at DESC;
    `);

    console.log('Final user_favorites table:');
    console.table(result.recordset);

    await sql.close();
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
