import { getPool } from '../../services/db/mssqlPool.js';
import sql from 'mssql';

async function run() {
  try {
    const pool = await getPool();

    console.log('Adding Tesla Bay Area offices...');

    // Clear existing locations first
    await pool.request().query(`DELETE FROM locations`);

    // Add Tesla Bay Area offices with real addresses and coordinates
    await pool.request().query(`
      INSERT INTO locations (name, address, city, region, lat, lng, is_active)
      VALUES
        ('Palo Alto Office', '3500 Deer Creek Rd, Palo Alto, CA', 'Palo Alto', 'Bay Area', 37.3947, -122.1503, 1),
        ('Fremont Factory', '45500 Fremont Blvd, Fremont, CA', 'Fremont', 'Bay Area', 37.4923, -121.944, 1),
        ('Tesla Megapack Factory', '1501 Page Ave, Fremont, CA', 'Fremont', 'Bay Area', 37.5394, -121.9899, 1),
        ('Stanford Research Park', '3172 Porter Dr, Palo Alto, CA', 'Palo Alto', 'Bay Area', 37.4231, -122.1484, 1),
        ('San Mateo Office', '2400 Fashion Island Blvd, San Mateo, CA', 'San Mateo', 'Bay Area', 37.5591, -122.2849, 1),
        ('Sunnyvale Office', '1350 Crossman Ave, Sunnyvale, CA', 'Sunnyvale', 'Bay Area', 37.3688, -122.0363, 1),
        ('Mountain View Office', '1501 Page Mill Rd, Palo Alto, CA', 'Palo Alto', 'Bay Area', 37.4419, -122.1430, 1),
        ('Redwood City Office', '620 Broadway, Redwood City, CA', 'Redwood City', 'Bay Area', 37.4863, -122.2277, 1)
    `);

    console.log('Added 8 Tesla Bay Area offices');

    console.log('Deleting parking_availability table...');

    await pool.request().query(`
      IF OBJECT_ID('parking_availability', 'U') IS NOT NULL
        DROP TABLE parking_availability;
    `);

    console.log('Deleted parking_availability table');

    console.log('Updating parking_lots table...');

    // Get the actual location IDs that were created
    const locResult = await pool.request().query(`
      SELECT id, name FROM locations ORDER BY id
    `);
    const locations = locResult.recordset;
    
    const getLocId = (name) => locations.find(l => l.name === name)?.id;

    // Clear existing parking lots
    await pool.request().query(`DELETE FROM parking_lots`);

    // Add parking lots using actual location IDs
    const paloAltoId = getLocId('Palo Alto Office');
    const fremontId = getLocId('Fremont Factory');
    const megapackId = getLocId('Tesla Megapack Factory');
    const stanfordId = getLocId('Stanford Research Park');
    const sanMateoId = getLocId('San Mateo Office');
    const sunnyvaleId = getLocId('Sunnyvale Office');
    const mountainViewId = getLocId('Mountain View Office');
    const redwoodId = getLocId('Redwood City Office');

    await pool.request().query(`
      INSERT INTO parking_lots (location_id, name, lot_type, capacity, current_available, is_active, address, lat, lng)
      VALUES
        -- Palo Alto Office
        (${paloAltoId}, 'Main Parking Structure', 'garage', 300, 75, 1, '3500 Deer Creek Rd, Palo Alto, CA', 37.3947, -122.1503),
        (${paloAltoId}, 'Visitor Lot A', 'surface', 50, 20, 1, '3500 Deer Creek Rd, Palo Alto, CA', 37.3945, -122.1505),
        
        -- Fremont Factory
        (${fremontId}, 'North Lot', 'surface', 500, 340, 1, '45500 Fremont Blvd, Fremont, CA', 37.4930, -121.9450),
        (${fremontId}, 'South Garage', 'garage', 400, 180, 1, '45500 Fremont Blvd, Fremont, CA', 37.4915, -121.9440),
        (${fremontId}, 'Employee Lot B', 'surface', 350, 200, 1, '45500 Fremont Blvd, Fremont, CA', 37.4925, -121.9435),
        
        -- Tesla Megapack Factory
        (${megapackId}, 'East Parking', 'surface', 200, 120, 1, '1501 Page Ave, Fremont, CA', 37.5394, -121.9899),
        
        -- Stanford Research Park
        (${stanfordId}, 'Parking Lot A', 'surface', 150, 80, 1, '3172 Porter Dr, Palo Alto, CA', 37.4231, -122.1484),
        
        -- San Mateo Office
        (${sanMateoId}, 'Underground Garage', 'garage', 250, 100, 1, '2400 Fashion Island Blvd, San Mateo, CA', 37.5591, -122.2849),
        
        -- Sunnyvale Office
        (${sunnyvaleId}, 'Parking Lot B', 'surface', 180, 90, 1, '1350 Crossman Ave, Sunnyvale, CA', 37.3688, -122.0363),
        
        -- Mountain View Office
        (${mountainViewId}, 'West Parking', 'surface', 120, 60, 1, '1501 Page Mill Rd, Palo Alto, CA', 37.4419, -122.1430),
        
        -- Redwood City Office
        (${redwoodId}, 'Central Lot', 'surface', 100, 45, 1, '620 Broadway, Redwood City, CA', 37.4863, -122.2277)
    `);

    console.log('Added parking lots for all offices');

    console.log('\nMigration complete!');
    console.log('Summary:');
    console.log('   - Added 8 Tesla Bay Area offices');
    console.log('   - Deleted parking_availability table');
    console.log('   - Added 11 parking lots with capacity info');

    await sql.close();
  } catch (err) {
    console.error('Migration failed:', err.message);
    console.error(err);
  }
}

run();