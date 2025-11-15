// packages/shared/api/dummy.js
import { createApiClient } from "./httpClient.js";

const api = createApiClient();

// GET /api/users/
export async function pingDummy() {
  return api.request("/api/users", { method: "GET" });
}

// POST /api/users/echo { message }
export async function echoDummy(message) {
  return api.request("/api/users/echo", {
    method: "POST",
    body: { message },
  });
}
