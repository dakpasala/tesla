import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    await pool.request().batch(`
      BEGIN TRANSACTION;

      IF OBJECT_ID('dbo.user_favorites', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.user_favorites (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          location_id INT NOT NULL,
          label VARCHAR(50),
          created_at DATETIME2 DEFAULT SYSUTCDATETIME(),

          CONSTRAINT fk_user_favorites_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE,

          CONSTRAINT fk_user_favorites_location
            FOREIGN KEY (location_id) REFERENCES locations(id)
            ON DELETE CASCADE,

          CONSTRAINT uq_user_location UNIQUE (user_id, location_id)
        );
      END;

      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'idx_user_favorites_location'
      )
      BEGIN
        CREATE INDEX idx_user_favorites_location
        ON dbo.user_favorites(location_id);
      END;

      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'idx_user_favorites_user'
      )
      BEGIN
        CREATE INDEX idx_user_favorites_user
        ON dbo.user_favorites(user_id);
      END;

      ;WITH parsed_favorites AS (
        SELECT
          u.id AS user_id,
          JSON_VALUE(f.value, '$.name') AS location_name,
          JSON_VALUE(f.value, '$.label') AS label
        FROM users u
        CROSS APPLY OPENJSON(u.favorites, '$.favorites') f
        WHERE u.favorites IS NOT NULL
      )
      INSERT INTO dbo.user_favorites (user_id, location_id, label)
      SELECT
        pf.user_id,
        l.id AS location_id,
        pf.label
      FROM parsed_favorites pf
      JOIN locations l
        ON l.name = pf.location_name
      WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.user_favorites uf
        WHERE uf.user_id = pf.user_id
          AND uf.location_id = l.id
      );

      COMMIT TRANSACTION;
    `);

    console.log('user_favorites migration complete');

    const result = await pool.request().query(`
      SELECT
        u.name AS user_name,
        l.name AS location_name,
        uf.label
      FROM user_favorites uf
      JOIN users u ON u.id = uf.user_id
      JOIN locations l ON l.id = uf.location_id;
    `);

    console.log('Backfilled favorites:', result.recordset);

    await sql.close();
  } catch (err) {
    console.error('Migration failed:', err);
    try {
      await sql.query('ROLLBACK TRANSACTION');
    } catch (_) {}
  }
}

run();