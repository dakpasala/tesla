import { getPool } from '../../services/db/mssqlPool.js';

const LOT = 'SAP Lot';
const AVAILABLE = 15;

async function run() {
  const pool = await getPool();

  await pool.request()
    .input('lot', LOT)
    .input('available', AVAILABLE)
    .query(`
      UPDATE parking_availability
      SET availability = @available
      WHERE lot_name = @lot
    `);

  console.log(`Set ${LOT} availability to ${AVAILABLE}`);
  process.exit(0);
}

run();