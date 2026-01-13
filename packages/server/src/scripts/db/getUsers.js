import { getUsers } from '../../services/db/mssqlPool.js';

async function run() {
  try {
    const users = await getUsers();
    console.log('Users:', users);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
