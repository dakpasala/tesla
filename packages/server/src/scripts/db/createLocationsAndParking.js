import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Creating locations and parking_lots tables...');

    await pool.request().batch(`
      -- Drop in correct order (FK dependency)
      IF OBJECT_ID('parking_lots', 'U') IS NOT NULL
        DROP TABLE parking_lots;

      IF OBJECT_ID('locations', 'U') IS NOT NULL
        DROP TABLE locations;

      -- Create locations table
      CREATE TABLE locations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        region VARCHAR(100),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      );

      -- Create parking_lots table
      CREATE TABLE parking_lots (
        id INT IDENTITY(1,1) PRIMARY KEY,
        location_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        lot_type VARCHAR(50),
        capacity INT,
        current_available INT,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT fk_parking_lots_location
          FOREIGN KEY (location_id)
          REFERENCES locations(id)
          ON DELETE CASCADE
      );

      -- Seed Palo Alto / Deer Creek
      INSERT INTO locations (name, address, city, region)
      VALUES ('Palo Alto Office', '3500 Deer Creek Rd, Palo Alto, CA', 'Palo Alto', 'Bay Area');

      DECLARE @paloAltoId INT = SCOPE_IDENTITY();

      INSERT INTO parking_lots (location_id, name, lot_type, capacity, current_available)
      VALUES
        (@paloAltoId, 'SAP Lot', 'surface', 300, 120),
        (@paloAltoId, 'DC Lot', 'garage', 500, 340);
    `);

    console.log('locations and parking_lots tables created and seeded');

    const locations = await pool.request().query('SELECT * FROM locations');
    const parking = await pool.request().query('SELECT * FROM parking_lots');

    console.log('Locations:', locations.recordset);
    console.log('Parking Lots:', parking.recordset);

    await sql.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();