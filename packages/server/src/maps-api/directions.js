import { GOOGLE_MAPS_API_KEY, BASE_URL } from './config.js';
import fetch from 'node-fetch';

export async function getDirections(origin, destination, mode = 'driving') {
  const url = `${BASE_URL}/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  // Debug: Log the response status
  if (data.status !== 'OK') {
    throw new Error(
      `API Error: ${data.status} - ${data.error_message || 'No error message'}`
    );
  }

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No routes found');
  }

  return data.routes.map(route => ({
    summary: route.summary,
    distance: route.legs[0].distance.text,
    duration: route.legs[0].duration.text,
    polyline: route.overview_polyline.points,
    warnings: route.warnings,
  }));
}

// optional helper to fetch multiple modes at once
export async function getAllTransportOptions(origin, destination) {
  const modes = ['driving', 'bicycling', 'walking', 'transit'];
  const results = {};
  for (const mode of modes) {
    try {
      results[mode] = await getDirections(origin, destination, mode);
    } catch (err) {
      console.error(`failed to fetch ${mode}:`, err.message);
    }
  }
  return results;
}
