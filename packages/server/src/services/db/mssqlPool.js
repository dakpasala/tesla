// src/services/db/mssqlPool.js
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
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export async function getPool() {
  return sql.connect(config);
}

// --------------------
// health / testing
// --------------------

export async function testConnection() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT 1 AS ok');
  await sql.close();
  return result.recordset;
}

// --------------------
// parking availability
// --------------------

export async function fetchParkingAvailability() {
  const pool = await getPool();
  const result = await pool.request().query(`
  SELECT
    l.id AS location_id,
    l.name AS location_name,
    p.id AS lot_id,
    p.name AS lot_name,
    p.current_available AS availability
    FROM parking_lots p
    JOIN locations l ON l.id = p.location_id
    WHERE p.is_active = 1
    AND l.is_active = 1
  `);
  return result.recordset;
}

export async function getLocationIdByName(name) {
  const pool = await getPool();

  const result = await pool.request()
    .input('name', sql.VarChar, name)
    .query(`
      SELECT id
      FROM locations
      WHERE name = @name
        AND is_active = 1
    `);

  await sql.close();

  return result.recordset[0]?.id ?? null;
}

export async function getParkingAvailabilityByLocationName(locationName) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input('locationName', sql.VarChar, locationName)
    .query(`
      -- Check if location exists
      IF NOT EXISTS (
        SELECT 1 FROM locations WHERE name = @locationName
      )
      BEGIN
        SELECT 'LOCATION_NOT_FOUND' AS error;
        RETURN;
      END

      SELECT
        p.id,
        p.name AS lot_name,
        p.current_available,
        p.capacity
      FROM parking_lots p
      JOIN locations l ON l.id = p.location_id
      WHERE l.name = @locationName
        AND p.is_active = 1
      ORDER BY p.name;
    `);

  await sql.close();
  return result.recordset;
}

export async function updateParkingAvailability(locationName, lotName, availability) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input('locationName', sql.VarChar, locationName)
    .input('lotName', sql.VarChar, lotName)
    .input('availability', sql.Int, availability)
    .query(`
      UPDATE p
      SET p.current_available = @availability
      FROM parking_lots p
      JOIN locations l ON l.id = p.location_id
      WHERE l.name = @locationName
        AND p.name = @lotName;

      SELECT @@ROWCOUNT AS rowsAffected;
    `);

  await sql.close();
  return result.recordset[0].rowsAffected;
}

// --------------------
// admins
// --------------------

export async function getAllAdmins() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT id, username, email
    FROM admins
    ORDER BY username
  `);
  await sql.close();
  return result.recordset;
}

export async function addAdmin(username, email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('username', sql.VarChar, username)
    .input('email', sql.VarChar, email)
    .query(`
      INSERT INTO admins (username, email)
      VALUES (@username, @email);

      SELECT SCOPE_IDENTITY() AS id;
    `);

  await sql.close();
  return result.recordset[0].id;
}

export async function getParkingLotByOfficeAndName(
  officeName,
  parkingLotName
) {
  const pool = await getPool();

  const result = await pool.request()
    .input('officeName', sql.VarChar, officeName)
    .input('parkingLotName', sql.VarChar, parkingLotName)
    .query(`
      SELECT
        p.id,
        p.name AS parking_lot_name,
        p.address,
        p.lat,
        p.lng,
        l.id AS location_id,
        l.name AS location_name
      FROM parking_lots p
      JOIN locations l ON l.id = p.location_id
      WHERE l.name = @officeName
        AND p.name = @parkingLotName
        AND l.is_active = 1
        AND p.is_active = 1
    `);

  return result.recordset[0] || null;
}

export async function findNearbyOffice(lat, lng, radiusMeters = 200) {
  const pool = await getPool();

  const result = await pool.request()
    .input('lat', sql.Float, lat)
    .input('lng', sql.Float, lng)
    .input('radius', sql.Int, radiusMeters)
    .query(`
      SELECT TOP 1 *
      FROM (
        SELECT
          id,
          name,
          address,
          lat,
          lng,
          (
            6371000 * ACOS(
              COS(RADIANS(@lat)) *
              COS(RADIANS(lat)) *
              COS(RADIANS(lng) - RADIANS(@lng)) +
              SIN(RADIANS(@lat)) *
              SIN(RADIANS(lat))
            )
          ) AS distance_meters
        FROM locations
        WHERE
          lat IS NOT NULL
          AND lng IS NOT NULL
          AND is_active = 1
      ) AS distances
      WHERE distance_meters <= @radius
      ORDER BY distance_meters;
    `);

  return result.recordset[0] || null;
}


// --------------------
// users
// --------------------

export async function getUsers() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM users');
  await sql.close();
  return result.recordset;
}

export async function getUserBalance(userId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT id, name, balance
      FROM users
      WHERE id = @userId
    `);

  await sql.close();

  if (result.recordset.length === 0) {
    return null;
  }

  return result.recordset[0];
}

export async function getUserIncentives(userId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        id,
        transit_type,
        amount,
        created_at
      FROM user_incentives
      WHERE user_id = @userId
      ORDER BY created_at DESC
    `);

  await sql.close();
  return result.recordset;
}

export async function awardTransitIncentive(userId, transitType) {
  const pool = await getPool();

  const INCENTIVES = {
    shuttle: 5.00,
    carpool: 3.00,
    walking: 2.00,
    biking: 2.00,
  };

  const amount = INCENTIVES[transitType];

  if (amount === undefined) {
    throw new Error(`Invalid transit type: ${transitType}`);
  }

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const insertResult = await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('transitType', sql.VarChar, transitType)
      .input('amount', sql.Decimal(10, 2), amount)
      .query(`
        INSERT INTO user_incentives (user_id, transit_type, amount)
        VALUES (@userId, @transitType, @amount);

        SELECT SCOPE_IDENTITY() AS incentiveId;
      `);

    if (!insertResult.recordset[0].incentiveId) {
      throw new Error('Failed to insert incentive');
    }

    const updateResult = await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('amount', sql.Decimal(10, 2), amount)
      .query(`
        UPDATE users
        SET balance = balance + @amount
        WHERE id = @userId;

        SELECT @@ROWCOUNT AS rowsAffected;
      `);

    if (updateResult.recordset[0].rowsAffected === 0) {
      throw new Error('User not found');
    }

    await transaction.commit();

    const updated = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT id, name, balance
        FROM users
        WHERE id = @userId
      `);

    await sql.close();

    return {
      userId: updated.recordset[0].id,
      name: updated.recordset[0].name,
      newBalance: updated.recordset[0].balance,
      transitType,
      credited: amount,
    };
  } catch (err) {
    await transaction.rollback();
    await sql.close();
    throw err;
  }
}

// get home address
export async function getUserHomeAddress(userId) {
  const pool = await getPool();

  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT home_address
      FROM users
      WHERE id = @userId
    `);

  await sql.close();
  return result.recordset[0]?.home_address ?? null;
}

// set home adddress
export async function setUserHomeAddress(userId, homeAddress) {
  const pool = await getPool();

  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('homeAddress', sql.VarChar, homeAddress)
    .query(`
      UPDATE users
      SET home_address = @homeAddress
      WHERE id = @userId;

      SELECT @@ROWCOUNT AS rowsAffected;
    `);

  await sql.close();
  return result.recordset[0].rowsAffected === 1;
}

// get work address for quickstart
export async function getUserWorkAddress(userId) {
  const pool = await getPool();

  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT work_address
      FROM users
      WHERE id = @userId
    `);

  await sql.close();
  return result.recordset[0]?.work_address ?? null;
}

export async function setUserWorkAddress(userId, workAddress) {
  const pool = await getPool();

  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('workAddress', sql.VarChar, workAddress)
    .query(`
      UPDATE users
      SET work_address = @workAddress
      WHERE id = @userId;

      SELECT @@ROWCOUNT AS rowsAffected;
    `);

  await sql.close();
  return result.recordset[0].rowsAffected === 1;
}

// get favorites
export async function getUserFavorites(userId) {
  const pool = await getPool();

  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        location_id,
        name,
        address,
        created_at
      FROM user_favorites
      WHERE user_id = @userId
      ORDER BY created_at DESC;
    `);

  return result.recordset;
}

// add to favorites table
export async function addUserFavoriteRow(userId, locationId, name, address) {
  const pool = await getPool();

  await pool.request()
    .input('userId', sql.Int, userId)
    .input('locationId', sql.Int, locationId)
    .input('name', sql.NVarChar, name)
    .input('address', sql.NVarChar, address)
    .query(`
      INSERT INTO user_favorites (user_id, location_id, name, address)
      VALUES (@userId, @locationId, @name, @address);
    `);

  return true;
}

// remove from favorites table
export async function removeUserFavoriteRow(userId, locationId) {
  const pool = await getPool();

  await pool.request()
    .input('userId', sql.Int, userId)
    .input('locationId', sql.Int, locationId)
    .query(`
      DELETE FROM user_favorites
      WHERE user_id = @userId
        AND location_id = @locationId;
    `);

  await sql.close();
  return true;
}

// check favs n stuff
export async function getUsersFavoritingLocationId(locationId) {
  const pool = await getPool();
  const result = await pool.request()
  .input('locationId', sql.Int, locationId)
  .query(`
  SELECT u.id, u.name, u.email
  FROM user_favorites uf
  JOIN users u ON u.id = uf.user_id
  WHERE uf.location_id = @locationId
  `);

  return result.recordset;
}
