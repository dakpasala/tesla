// packages/mobile/src/helpers/mapUtils.ts

// Utility functions for decoding Google polylines, formatting durations, and computing parking status.
// Also provides a simple heuristic forecast for how full a lot will be at the next peak hour.

export function decodePolyline(
  encoded: string
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let shift = 0,
      result = 0,
      b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export function formatDuration(sec: number): string {
  const mins = Math.round(sec / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

export function getStatus(availability: number): string {
  if (availability >= 80) return 'Almost Full';
  if (availability >= 50) return 'Filling Up';
  return 'Available';
}

export function getForecastText(currentFullness: number): string {
  const hour = new Date().getHours();
  const targetTime = hour < 9 ? '9:30 AM' : hour < 12 ? '12:00 PM' : '5:00 PM';

  // Simple heuristic: parking fills up 10-20% more by peak hours
  const forecastFullness = Math.min(currentFullness + 15, 95);

  return `About ${forecastFullness}% full by ${targetTime}`;
}
