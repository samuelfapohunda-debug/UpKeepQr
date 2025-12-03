// API Configuration
// In development (Replit), use same-origin (empty string) for API calls
// In production (Firebase), set VITE_API_URL to the Render backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}
