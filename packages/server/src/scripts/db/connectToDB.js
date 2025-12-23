import { testConnection, getUsers, getParkingAvailability, getAdminsTable } from '../../services/db/mssqlPool.js';

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

    try {
      const parking_availability = await getParkingAvailability();
      console.log('Parking Avaialbility', parking_availability);
    } catch (e) {
      console.log('Parking Avaialbility query failed');
    }

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
