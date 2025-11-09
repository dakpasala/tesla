// src/db/mssql.js
import sql from "mssql";
import dotenv from "dotenv";

dotenv.config(); // load .env

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  port: parseInt(process.env.MSSQL_PORT, 10),
  database: process.env.MSSQL_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export async function testConnection() {
  try {
    console.log("🔌 Connecting to MSSQL...");
    const pool = await sql.connect(config);
    console.log("✅ Connected!");

    const result = await pool.request().query("SELECT * FROM users");
    console.log("📊 Query result:");
    console.table(result.recordset);

    await sql.close();
  } catch (err) {
    console.error("❌ SQL Connection Error:", err);
  }
}
