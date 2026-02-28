// packages/mobile/src/services/crud.ts

// Base HTTP utility layer providing typed get, post, put, patch, and delete methods.
// All requests are routed through the configured API base URL with consistent error handling.
// Used by all other service files as the single source of truth for API communication.

import { CONFIG } from '../config/base_url';
const { API_BASE_URL } = CONFIG;

export async function get<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}`;
  console.log('FETCHING:', url);

  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('GET failed:', response.status, url, errorBody);

    const error: any = new Error(
      `GET failed: ${response.status} ${url} ${errorBody}`
    );

    error.status = response.status;
    error.body = errorBody;
    error.url = url;

    throw error;
  }

  return response.json();
}

export async function post<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = 'POST request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If JSON parse fails, use default message
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.response = { status: response.status, data: { error: errorMessage } };
    throw error;
  }

  return response.json();
}

export async function put<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = 'PUT request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If JSON parse fails, use default message
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.response = { status: response.status, data: { error: errorMessage } };
    throw error;
  }

  return response.json();
}

export async function del<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMessage = 'DELETE request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If JSON parse fails, use default message
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.response = { status: response.status, data: { error: errorMessage } };
    throw error;
  }

  return response.json();
}

export async function patch<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = 'PATCH request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If JSON parse fails, use default message
    }

    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.response = { status: response.status, data: { error: errorMessage } };
    throw error;
  }

  return response.json();
}
