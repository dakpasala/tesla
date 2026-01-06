import express from 'express';
import {
  testConnection,
  getAllParkingAvailability,
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
    const rows = await getAllParkingAvailability();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/parking', async (req, res) => {
  const { lot_name, availability } = req.body;

  if (!lot_name || availability === undefined) {
    return res.status(400).json({
      error: 'lot_name and availability are required',
    });
  }

  try {
    await updateParkingAvailability(lot_name, availability);
    res.json({ success: true, lot_name, availability });
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
