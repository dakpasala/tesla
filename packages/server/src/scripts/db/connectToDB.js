import { testConnection, getAdminsTable } from '../../services/db/mssqlPool.js';

async function run() {
  try {
    console.log('Testing MSSQL connection...');
    const ping = await testConnection();
    console.log('Ping result:', ping);

    try {
      const admins = await getAdminsTable();
      console.log('Admins', admins);
    } catch (e) {
      console.log('Admins query failed');
    }
  } catch (e) {
    console.error('DB script error:', e.message);
  }
}

run();
