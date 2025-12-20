// src/db/test.js
import { testConnection, getUsers } from '../../services/db/mssqlPool.js';

async function run() {
  try {
    console.log('Testing MSSQL connection...');
    const ping = await testConnection();
    console.log('Ping result:', ping);

    try {
      const users = await getUsers();
      console.log('Users:', users);
    } catch (e) {
      console.log('Users query failed:', e.message);
    }
  } catch (e) {
    console.error('DB script error:', e.message);
  }
}

run();
