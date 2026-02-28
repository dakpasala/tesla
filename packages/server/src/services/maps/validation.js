// packages/backend/src/services/maps/validation.js

// Validates whether a given address string resolves to a real location via Google Geocoding.
// Used before saving home addresses to ensure users don't store invalid or empty strings.
// Returns true if the address resolves to at least one result, false otherwise.

import axios from 'axios';
import { GOOGLE_MAPS_API_KEY } from '../../config/env.js';

export async function isValidAddress(address) {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return false;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address.trim(),
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error validating address:', error.message);
    return false;
  }
}
