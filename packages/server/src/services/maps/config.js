// Exports shared Google Maps configuration constants loaded from environment variables.
// Provides the API key and base URL used by directions and geocoding service calls.
// Import from here instead of reading process.env directly in individual service files.

import dotenv from 'dotenv';
dotenv.config();

export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
export const BASE_URL = 'https://maps.googleapis.com/maps/api';
