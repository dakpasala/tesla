import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('🔧 Fixing users table (adding IDENTITY)...');

    await pool.request().batch(`
      IF OBJECT_ID('users_new', 'U') IS NOT NULL
        DROP TABLE users_new;

      CREATE TABLE users_new (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      INSERT INTO users_new (name)
      SELECT name FROM users;

      DROP TABLE users;

      EXEC sp_rename 'users_new', 'users';
    `);

    console.log('✅ users table fixed');
    await sql.close();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
}

run();
