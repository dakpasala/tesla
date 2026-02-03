// packages/mobile/src/services/crud.ts

import { CONFIG } from '../config/base_url';
const { API_BASE_URL } = CONFIG;

export async function get<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}`;
  console.log('FETCHING:', url);
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('GET failed:', response.status, url, errorBody);
    throw new Error(`GET failed: ${response.status} ${url} ${errorBody}`);
  }
  return response.json();
}


export async function post<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('POST request failed');
  return response.json();
}

export async function put<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('PUT request failed');
  return response.json();
}

export async function del<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('DELETE request failed');
  return response.json();
}

export async function patch<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('PATCH request failed');
  return response.json();
}
