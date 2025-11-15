// packages/shared/httpClient.js

const DEFAULT_BASE_URL = "http://localhost:3000";

function cleanBase(url) {
  return url.replace(/\/+$/, "");
}

function buildQueryString(query) {
  if (!query) return "";
  const search = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null) search.append(k, String(v));
  });
  return "?" + search.toString();
}

export async function httpRequest(path, options = {}) {
  const {
    method = "GET",
    query,
    body,
    headers = {},
    baseUrl = DEFAULT_BASE_URL,
  } = options;

  const url = cleanBase(baseUrl) + path + buildQueryString(query);

  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch (err) {
    throw new Error(`Network error: ${err.message}`);
  }

  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const error = new Error(data?.error || `Request failed with ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
