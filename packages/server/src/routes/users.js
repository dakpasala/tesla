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
  addUserFavoriteRow,
  removeUserFavoriteRow,
  getLocationIdByName,
} from '../services/db/mssqlPool.js';
import {
  addUserToLocation,
  removeUserFromLocation,
  subscribeUserToShuttle,
  unsubscribeUserFromShuttle,
  suppressUserNotifications,
  unsuppressUserNotifications,
} from '../services/redis/cache.js';

import { isValidAddress } from '../services/maps/validation.js';

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
      return res
        .status(404)
        .json({ error: 'User not found or no address set' });
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

  // Validate it's a real address (can be anywhere, not just Tesla offices)
  const isValid = await isValidAddress(homeAddress);
  if (!isValid) {
    return res.status(400).json({
      error: 'Invalid address. Please enter a valid address.',
    });
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
      return res
        .status(404)
        .json({ error: 'User not found or no address set' });
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
  const { name, address } = req.body;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!name || !address) {
    return res.status(400).json({
      error: 'name and address are required',
    });
  }

  try {
    const locationId = await getLocationIdByName(name);
    if (!locationId) {
      return res.status(404).json({ error: 'Location not found' });
    }

    await addUserFavoriteRow(userId, locationId, name, address);
    await addUserToLocation(locationId, userId);

    res.status(201).json({
      success: true,
      added: { name, address },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// remove favorite by name
router.delete('/:id/favorites/:name', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { name } = req.params;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Provide name of place' });
  }

  try {
    const locationId = await getLocationIdByName(name);
    if (!locationId) {
      return res.status(404).json({ error: 'Location not found' });
    }

    await removeUserFavoriteRow(userId, locationId);
    await removeUserFromLocation(locationId, userId);

    res.json({
      success: true,
      removed: name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// location-state
// --------------------

router.post('/:id/location-state', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { state } = req.body;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!state) {
    return res.status(404).json({ error: 'Provide state please' });
  }

  try {
    if (state === 'AT_LOCATION') {
      await suppressUserNotifications(userId);
    } else if (state === 'LEFT_LOCATION') {
      await unsuppressUserNotifications(userId);
    } else {
      return res.status(404).json({ error: 'Please provide a correct state' });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// --------------------
// shuttle-subscriptions
// --------------------

router.post('/:id/shuttle', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { shuttleName } = req.body;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!shuttleName) {
    return res.status(400).json({ error: 'shuttleName is required' });
  }

  try {
    await subscribeUserToShuttle(userId, shuttleName);

    res.status(201).json({
      success: true,
      subscribed: { shuttleName },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// remove user from shuttle
router.delete('/:id/shuttle/:shuttleName', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { shuttleName } = req.params;

  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!shuttleName) {
    return res.status(400).json({ error: 'shuttleName is required' });
  }

  try {
    await unsubscribeUserFromShuttle(userId, shuttleName);

    res.json({
      success: true,
      unsubscribed: { shuttleName },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
