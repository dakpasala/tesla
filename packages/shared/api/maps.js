// packages/shared/api/maps.js
import { createApiClient } from "./httpClient.js";

const api = createApiClient();

// GET /api/maps/routes?origin=...&destination=...
export async function fetchTransportOptions(origin, destination) {
  return api.request("/api/maps/routes", {
    method: "GET",
    query: { origin, destination },
  });
}

// GET /api/maps/directions?origin=...&destination=...&mode=...
export async function fetchDirections(origin, destination, mode = "driving") {
  return api.request("/api/maps/directions", {
    method: "GET",
    query: { origin, destination, mode },
  });
}
