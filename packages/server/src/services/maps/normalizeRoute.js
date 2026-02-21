export function normalizeGoogleRoute(mode, googleJson) {
  const route = googleJson.routes?.[0];
  if (!route) return null;

  const leg = route.legs?.[0];
  if (!leg) return null;

  return {
    mode,
    duration_sec: leg.duration.value,
    distance_m: leg.distance.value,
    summary: route.summary || "",
    polyline: route.overview_polyline?.points || "",
    fare_usd: googleJson.fare?.value ?? undefined,
    steps: leg.steps || [],
    departure_time: leg.departure_time?.text ?? null,
    arrival_time: leg.arrival_time?.text ?? null,
  };
}