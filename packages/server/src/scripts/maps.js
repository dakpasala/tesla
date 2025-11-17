import { getDirections } from '../services/maps/directionsService.js';
import { GOOGLE_MAPS_API_KEY } from '../config/env.js';

async function run() {
  try {
    console.log('Key loaded:', !!GOOGLE_MAPS_API_KEY);
    const origin = 'San Jose,CA';
    const destination = 'Palo Alto,CA';
    const modes = ['driving', 'bicycling', 'walking', 'transit'];

    for (const mode of modes) {
      try {
        const data = await getDirections(origin, destination, mode);
        console.log(`=== ${mode.toUpperCase()} ===`);
        if (data?.routes?.length) {
          const r = data.routes[0];
          console.log('Summary:', r.summary);
          console.log('Distance:', r.legs?.[0]?.distance?.text);
          console.log('Duration:', r.legs?.[0]?.duration?.text);
        } else {
          console.log('No routes');
        }
      } catch (e) {
        console.log(`Mode ${mode} error:`, e.message);
      }
    }
  } catch (e) {
    console.error('Maps script error:', e.message);
  }
}

run();
