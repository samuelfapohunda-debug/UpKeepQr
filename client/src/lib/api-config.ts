/**
 * API Configuration
 * 
 * In GitHub Codespaces:
 * - Frontend and backend run on the same origin
 * - Always use relative URLs (no localhost)
 * 
 * In production:
 * - Also uses relative URLs (same origin)
 */

// Always use relative URLs - works in both dev and production
export const API_BASE_URL = '';

// Helper function for API calls
export async function apiRequest(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return response;
}
