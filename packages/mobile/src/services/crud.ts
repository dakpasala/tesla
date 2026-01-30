// this is a temporary file to show the concept of crud frontend wrappers
// some modifications will be made for thoroughness, error handling, and sufficient abstraction

const API_BASE_URL = 'https://localhost:3000/api';

export async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`);
  if (!response.ok) throw new Error('GET request failed');
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
