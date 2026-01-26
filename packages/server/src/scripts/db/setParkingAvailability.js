import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

const AVAILABLE = 4;

async function run() {
  const pool = await getPool();

  const result = await pool.request()
    .input('availability', sql.Int, AVAILABLE)
    .query(`
      UPDATE p
      SET p.current_available = @availability
      FROM parking_lots p
      JOIN locations l ON l.id = p.location_id
      WHERE l.name = 'Palo Alto Office'
        AND p.name = 'SAP Lot';

      SELECT @@ROWCOUNT AS rowsAffected;
    `);

  return result.recordset[0].rowsAffected;
}

run();