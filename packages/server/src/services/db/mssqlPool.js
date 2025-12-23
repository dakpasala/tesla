// src/db/mssql.js
import sql from 'mssql';
import {
  MSSQL_USER,
  MSSQL_PASSWORD,
  MSSQL_SERVER,
  MSSQL_PORT,
  MSSQL_DATABASE,
} from '../../config/env.js';

const config = {
  user: MSSQL_USER,
  password: MSSQL_PASSWORD,
  server: MSSQL_SERVER,
  port: parseInt(MSSQL_PORT, 10),
  database: MSSQL_DATABASE,
  options: { encrypt: false, trustServerCertificate: true },
};

export async function addUser(name) {
  const pool = await sql.connect(config);
  await pool
    .request()
    .input('name', sql.VarChar, name)
    .query('INSERT INTO users (name) VALUES (@name)');
  await sql.close();
}

export async function getPool() {
  return sql.connect(config);
}

export async function testConnection() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT TOP 1 1 AS ok');
  await sql.close();
  return result.recordset;
}

export async function getUsers() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM users');
  await sql.close();
  return result.recordset;
}

export async function getParkingAvailability() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM parking_availability');
  await sql.close();
  return result.recordset;
}

export async function getAdminsTable() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM admins');
  await sql.close();
  return result.recordset;
}
