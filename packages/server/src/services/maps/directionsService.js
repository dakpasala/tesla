// Service for fetching route directions from the Google Maps Directions API.
// Supports driving, walking, bicycling, and transit modes with optional departure times.
// getAllTransportOptions fetches all four modes in sequence and returns normalized results.

import fetch from 'node-fetch';
import { GOOGLE_MAPS_API_KEY } from '../../config/env.js';
import { normalizeGoogleRoute } from "./normalizeRoute.js";

const BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json';

export async function getDirections(origin, destination, mode = 'driving', departureTime = null) {
  const url = new URL(BASE_URL);
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  url.searchParams.set('mode', mode);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

  // departure_time is a unix timestamp (seconds), only valid for future times
  // Google Maps supports it for driving and transit modes
  if (departureTime && (mode === 'driving' || mode === 'transit')) {
    url.searchParams.set('departure_time', departureTime.toString());
  }

  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.status !== 'OK') {
    throw new Error(
      `API Error: ${json.status} - ${json.error_message || 'no message'}`
    );
  }
  return json;
}

export async function getAllTransportOptions(origin, destination, departureTime = null) {
  const modes = ["driving", "bicycling", "walking", "transit"];
  const results = [];

  for (const mode of modes) {
    try {
      const googleJson = await getDirections(origin, destination, mode, departureTime);
      const normalized = normalizeGoogleRoute(mode, googleJson);

      if (normalized) {
        results.push(normalized);
      }
    } catch (err) {
      console.error(`Failed to fetch ${mode}:`, err.message);
    }
  }

  return results;
}