import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('🔧 Creating admins table...');

    await pool.request().batch(`
      IF OBJECT_ID('admins', 'U') IS NOT NULL
        DROP TABLE admins;

      CREATE TABLE admins (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL
      );

      INSERT INTO admins (username, email) VALUES
        ('dpasala', 'dpasala@calpoly.edu'),
        ('kbeltran', 'kbeltr03@calpoly.edu');
    `);

    console.log('admins table created and seeded');

    const result = await pool.request().query('SELECT * FROM admins');
    console.log('Admins:', result.recordset);

    await sql.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
