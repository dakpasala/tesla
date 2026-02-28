// Express routes for parking lot availability data.
// Supports fetching all lots, per-location queries, full-lot counts, and admin availability updates.
// PATCH endpoint allows admins to set availability numbers and string status overrides.

import express from 'express';
import {
  getParkingAvailabilityByLocationName,
  updateParkingAvailability,
  getAllLocations,
  fetchParkingAvailability
} from '../services/db/mssqlPool.js';

const router = express.Router();

// --------------------
// locations
// --------------------

router.get('/all', async (req, res) => {
  try {
    const rows = await fetchParkingAvailability();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/locations', async (req, res) => {
  try {
    const locations = await getAllLocations();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/full-count', async (req, res) => {
  try {
    const rows = await fetchParkingAvailability();
    
    // Count lots where availability is 0 (or >= 95% if you want almost full)
    const fullLots = rows.filter(row => row.availability === 0);
    
    res.json({ count: fullLots.length });
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
  const { location_name, lot_name, availability, status_override } = req.body;

  // validate that we have the identifiers and at least one thing to update
  if (!location_name || !lot_name || (typeof availability !== 'number' && !status_override)) {
    return res.status(400).json({
      error: 'location_name, lot_name, and either availability or status_override are required',
    });
  }

  try {
    const rowsAffected = await updateParkingAvailability(
      location_name,
      lot_name,
      availability,
      status_override // this will be "Mark as full", "Lot closed", etc.
    );

    if (rowsAffected === 0) {
      return res.status(404).json({ error: 'Location or parking lot not found' });
    }

    res.json({
      success: true,
      location_name,
      lot_name,
      availability,
      status_override
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;