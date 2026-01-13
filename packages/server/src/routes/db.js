import express from 'express';
import {
  testConnection,
  getParkingAvailabilityByLocationName,
  updateParkingAvailability,
  getAllAdmins,
  addAdmin,
} from '../services/db/mssqlPool.js';

const router = express.Router();

// --------------------
// testing
// --------------------

router.get('/test', async (req, res) => {
  try {
    await testConnection();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --------------------
// parking availability
// --------------------

router.get('/parking', async (req, res) => {
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

router.patch('/parking', async (req, res) => {
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

// --------------------
// admins
// --------------------

router.get('/admins', async (req, res) => {
  try {
    const admins = await getAllAdmins();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admins', async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({
      error: 'username and email are required',
    });
  }

  try {
    const id = await addAdmin(username, email);
    res.json({ success: true, id, username, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
