import express from 'express';
import {
  awardTransitIncentive,
  getUserBalance,
  getUserIncentives
} from '../services/db/mssqlPool.js';

const router = express.Router();

// --------------------
// users
// --------------------

// get balance for user
router.get('/:id/balance', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const user = await getUserBalance(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.id,
      name: user.name,
      balance: user.balance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get incentives for user (this where many to one comes in)
router.get('/:id/incentives', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  try {
    const incentives = await getUserIncentives(userId);
    res.json(incentives);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update incentives and balance for user
router.post('/:id/incentives', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { transitType } = req.body;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const result = await awardTransitIncentive(userId, transitType);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    if (err.message.startsWith('Invalid transit type')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to award incentive' });
  }
});

export default router;