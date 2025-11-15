// packages/shared/api/db.js
import { createApiClient } from "./httpClient.js";

const api = createApiClient();

// GET /api/db/users
export async function fetchUsers() {
  return api.request("/api/db/users", { method: "GET" });
}