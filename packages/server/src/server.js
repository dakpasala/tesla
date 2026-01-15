import app from './app.js';
import { startParkingMonitor } from './jobs/parkingMonitor.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

if (
  process.env.NODE_ENV !== 'test' &&
  process.env.ENABLE_PARKING_MONITOR !== 'false'
) {
  startParkingMonitor();
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
