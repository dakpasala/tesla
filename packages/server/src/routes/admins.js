// Express routes for managing admin accounts.
// GET returns all admins; POST adds a new admin by username and email.
// Used by the admin management interface to control system access.

import express from 'express';
import {
  getAllAdmins,
  addAdmin,
} from '../services/db/mssqlPool.js';

const router = express.Router();

// --------------------
// admins
// --------------------

// get the admins
router.get('/', async (req, res) => {
  try {
    const admins = await getAllAdmins();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// add to the admins
router.post('/', async (req, res) => {
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
