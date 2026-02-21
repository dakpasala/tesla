import express from 'express';
import { getAllTransportOptions } from '../services/maps/directionsService.js';
import { getCache, setCache } from '../services/redis/cache.js';
import {
  getParkingLotByOfficeAndName,
  findNearbyOffice,
  findOfficeByAddress
} from '../services/db/mssqlPool.js';

const router = express.Router();

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

router.get('/to-office', async (req, res) => {
  try {
    const { lat, lng, office_name, departure_time } = req.query;

    if (!lat || !lng || !office_name) {
      return res.status(400).json({ error: 'lat, lng, office_name are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    // departure_time is a unix timestamp string — pass as number if present
    const departureTimestamp = departure_time ? parseInt(departure_time) : null;

    const parkingLot = await getParkingLotByOfficeAndName(office_name);
    if (!parkingLot) return res.status(404).json({ error: 'Invalid office' });

    const origin = `${userLat},${userLng}`;
    const destination =
      parkingLot.lat && parkingLot.lng
        ? `${parkingLot.lat},${parkingLot.lng}`
        : parkingLot.address;

    // Include departure_time in cache key so future times are cached separately
    const cacheKey = `maps:to_office:${normalize(office_name)}:${normalize(origin)}:${departureTimestamp ?? 'now'}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('Redis cache hit');
      return res.json(cached);
    }

    console.log('Redis cache miss → calling Google Maps');
    const routes = await getAllTransportOptions(origin, destination, departureTimestamp);
    await setCache(cacheKey, routes, 60);

    res.json({ mode: 'TO_OFFICE', office: office_name, routes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/to-office-quick-start', async (req, res) => {
  try {
    const { lat, lng, address, departure_time } = req.query;

    if (!lat || !lng || !address) {
      return res.status(400).json({ error: 'lat, lng, and address are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const departureTimestamp = departure_time ? parseInt(departure_time) : null;

    const office = await findOfficeByAddress(address);
    if (!office) {
      return res.status(403).json({ error: 'Invalid Office - address not found in locations table' });
    }

    const origin = `${userLat},${userLng}`;
    const destination = address;

    const cacheKey = `maps:to_office_quick_start:${normalize(destination)}:${normalize(origin)}:${departureTimestamp ?? 'now'}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('Redis cache hit');
      return res.json(cached);
    }

    console.log('Redis cache miss → calling Google Maps');
    const routes = await getAllTransportOptions(origin, destination, departureTimestamp);

    const response = {
      mode: 'TO_OFFICE_QUICK_START',
      office: office.name,
      office_address: office.address,
      destination,
      routes,
    };

    await setCache(cacheKey, response, 60);
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/go-home', async (req, res) => {
  try {
    const { lat, lng, destination, departure_time } = req.query;

    if (!lat || !lng || !destination) {
      return res.status(400).json({ error: 'lat, lng, and destination are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const departureTimestamp = departure_time ? parseInt(departure_time) : null;

    const office = await findNearbyOffice(userLat, userLng);
    if (!office) return res.status(403).json({ error: 'User is not near any office' });

    const origin = `${office.lat},${office.lng}`;

    const cacheKey = `maps:from_office:${normalize(office.name)}:${normalize(destination)}:${departureTimestamp ?? 'now'}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('Redis cache hit');
      return res.json(cached);
    }

    console.log('Redis cache miss → calling Google Maps');
    const routes = await getAllTransportOptions(origin, destination, departureTimestamp);
    await setCache(cacheKey, routes, 60);

    res.json({
      mode: 'FROM_OFFICE',
      office: office.name,
      distance_from_office_m: office.distance_meters,
      routes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/presence', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    const office = await findNearbyOffice(parseFloat(lat), parseFloat(lng));
    if (!office) return res.json({ atOffice: false });

    res.json({
      atOffice: true,
      office: { id: office.id, name: office.name, distance_meters: office.distance_meters },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;