import express from 'express';
import {
  getAllTransportOptions,
  getDirections,
} from '../maps-api/directions.js';

const router = express.Router();

router.get('/routes', async (req, res) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        error: 'Missing required parameters: origin and destination',
      });
    }

    const routes = await getAllTransportOptions(origin, destination);
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/directions', async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        error: 'Missing required parameters: origin and destination',
      });
    }

    const directions = await getDirections(origin, destination, mode);
    res.json(directions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
