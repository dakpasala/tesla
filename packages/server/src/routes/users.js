import express from 'express';
import {
  awardTransitIncentive,
  getUserBalance,
  getUserIncentives,
  getUserHomeAddress,
  setUserHomeAddress,
  getUserWorkAddress,
  setUserWorkAddress,
  getUserFavorites,
  addUserFavorite,
  removeUserFavorite
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

// --------------------
// home address
// --------------------

router.get('/:id/home_address', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const homeAddress = await getUserHomeAddress(userId);

    if (!homeAddress) {
      return res.status(404).json({ error: 'User not found or no address set' });
    }

    res.json({
      userId,
      home_address: homeAddress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/home_address', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { homeAddress } = req.body;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!homeAddress) {
    return res.status(400).json({ error: 'homeAddress is required' });
  }

  try {
    const success = await setUserHomeAddress(userId, homeAddress);

    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      userId,
      home_address: homeAddress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --------------------
// work address
// --------------------

router.get('/:id/work_address', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
 
  try {
    const workAddress = await getUserWorkAddress(userId);

    if (!workAddress) {
      return res.status(404).json({ error: 'User not found or no address set' });
    }

    res.json({
      userId,
      work_address: workAddress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/work_address', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { workAddress } = req.body;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!workAddress) {
    return res.status(400).json({ error: 'workAddress is required' });
  }

  try {
    const success = await setUserWorkAddress(userId, workAddress);

    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      userId,
      work_address: workAddress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// favorites
// --------------------

// get favorites
router.get('/:id/favorites', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const favorites = await getUserFavorites(userId);
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// add favorite
router.post('/:id/favorites', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { label, name, address } = req.body;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!label || !name || !address) {
    return res.status(400).json({
      error: 'label, name, and address are required',
    });
  }

  try {
    await addUserFavorite(userId, { label, name, address });

    res.status(201).json({
      success: true,
      added: { label, name, address },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// remove favorite by label
router.delete('/:id/favorites/:label', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { label } = req.params;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    await removeUserFavorite(userId, label);

    res.json({
      success: true,
      removed: label,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;