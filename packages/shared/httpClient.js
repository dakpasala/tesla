// packages/shared/api/httpClient.js

const DEFAULT_BASE_URL = process.env.TESLA_API_URL || "http://localhost:3000";

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, ""); // remove trailing slash
}

export function createApiClient(baseUrl = DEFAULT_BASE_URL) {
  const base = normalizeBaseUrl(baseUrl);

  async function request(path, options = {}) {
    const {
      method = "GET",
      query,
      body,
      headers = {},
    } = options;

    const url = new URL(base + path);

    if (query) {
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null)
        .forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }

    const init = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body !== undefined && body !== null) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url.toString(), init);
    const text = await res.text();
    let data;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const err = new Error(data?.error || `Request failed with ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  return { request };
}
