// packages/shared/api.js
import { httpRequest } from "./httpClient.js";

/* ================================
   MAPS API
================================ */
export function getTransportOptions(origin, destination) {
  return httpRequest("/api/maps/routes", {
    query: { origin, destination },
  });
}

export function getDirections(origin, destination, mode = "driving") {
  return httpRequest("/api/maps/directions", {
    query: { origin, destination, mode },
  });
}

/* ================================
   TRIPSHOT
================================ */
export function getCommutePlan(params) {
  return httpRequest("/tripshot/commutePlan", {
    method: "POST",
    query: params, // your backend uses req.query
  });
}

/* ================================
   DUMMY
================================ */
export function dummyPing() {
  return httpRequest("/api/users");
}

export function dummyEcho(message) {
  return httpRequest("/api/users/echo", {
    method: "POST",
    body: { message },
  });
}

/* ================================
   DB (MSSQL)
================================ */
export function fetchUsers() {
  return httpRequest("/api/db/users");
}

/* ================================
   REDIS
================================ */
export function fetchRedisValue(key) {
  return httpRequest("/api/redis/get", {
    query: { key },
  });
}

export function setRedisValue(key, value) {
  return httpRequest("/api/redis/set", {
    method: "POST",
    body: { key, value },
  });
}
