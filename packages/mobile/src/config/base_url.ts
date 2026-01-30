import { Platform } from 'react-native';

/**
 * ANDROID EMULATOR NOTE:
 * Android emulators running on machine cannot access "localhost" directly.
 * They access the host machine via the special IP "10.0.2.2".
 * * iOS simulators share the network stack with the Mac, so "localhost" works fine.
 */

// If testing on a PHYSICAL device (not simulator),
// replace 'null' with your computer's LAN IP (e.g., '192.168.1.5')
const LAN_IP = null;

const SERVER_HOST =
  LAN_IP ||
  Platform.select({
    android: '10.0.2.2',
    ios: 'localhost',
  });

const SERVER_PORT = 3000;

export const CONFIG = {
  // We use http for local dev. If Tesla integrates https later, they can change this
  API_BASE_URL: `http://${SERVER_HOST}:${SERVER_PORT}/api`,

  // can be adjusted as needed
  TIMEOUT_MS: 15000,
};

// Log the URL on startup so we know where the app is trying to connect
console.log(`[Config] API Base URL set to: ${CONFIG.API_BASE_URL}`);
