// packages/shared/api/tripshot.js
import { createApiClient } from "./httpClient.js";

const api = createApiClient();

export async function fetchCommutePlan(params) {
  // Backend currently reads from req.query, so we send as query string
  return api.request("/tripshot/commutePlan", {
    method: "POST",
    query: params,
  });
}
