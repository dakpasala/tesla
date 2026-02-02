import express from 'express';
import {
  getParkingAvailabilityByLocationName,
  updateParkingAvailability,
  getAllLocations,
} from '../services/db/mssqlPool.js';

const router = express.Router();

// --------------------
// locations
// --------------------

router.get('/locations', async (req, res) => {
  try {
    const locations = await getAllLocations();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --------------------
// parking availability
// --------------------

// get parking for a SINGLE LOCATION so like for Palo Alto, their two parking lots
router.get('/', async (req, res) => {
  try {
    const { loc_name } = req.query;

    if (!loc_name) {
      return res.status(400).json({
        error: 'loc_name is required',
      });
    }

    const rows = await getParkingAvailabilityByLocationName(loc_name);

    if (rows.length === 1 && rows[0].error === 'LOCATION_NOT_FOUND') {
      return res.status(404).json({
        error: 'Location not found',
      });
    }

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update parking for a single location again
router.patch('/', async (req, res) => {
  const { loc_name, lot_name, availability } = req.body;

  if (!loc_name || !lot_name || typeof availability !== 'number') {
    return res.status(400).json({
      error: 'loc_name, lot_name, and numeric availability are required',
    });
  }

  try {
    const rowsAffected = await updateParkingAvailability(
      loc_name,
      lot_name,
      availability
    );

    if (rowsAffected === 0) {
      return res.status(404).json({
        error: 'Location or parking lot not found',
      });
    }

    res.json({
      success: true,
      loc_name,
      lot_name,
      availability,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;