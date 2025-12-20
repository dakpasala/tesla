import { addUser, getUsers } from '../../services/db/mssqlPool.js';

async function run() {
  try {
    await addUser('kevin');
    console.log('✅ Inserted user: kevin');

    const users = await getUsers();
    console.log('Users:', users);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

run();
