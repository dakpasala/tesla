// packages/shared/crud.js
import { httpRequest } from "./httpClient.js";

export function apiGet(path, query) {
  return httpRequest(path, { method: "GET", query });
}

export function apiPost(path, body) {
  return httpRequest(path, { method: "POST", body });
}

export function apiPut(path, body) {
  return httpRequest(path, { method: "PUT", body });
}

export function apiDelete(path, query) {
  return httpRequest(path, { method: "DELETE", query });
}
