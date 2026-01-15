import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Creating user_incentives table...');

    await pool.request().batch(`
      IF OBJECT_ID('user_incentives', 'U') IS NOT NULL
        DROP TABLE user_incentives;

      CREATE TABLE user_incentives (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        transit_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT fk_user_incentives_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      );
    `);

    console.log('user_incentives table created');

    const result = await pool.request().query(`
      SELECT * FROM user_incentives
    `);

    console.log('user_incentives:', result.recordset);

    await sql.close();
  } catch (err) {
    console.error('Error creating user_incentives table:', err.message);
  }
}

run();
