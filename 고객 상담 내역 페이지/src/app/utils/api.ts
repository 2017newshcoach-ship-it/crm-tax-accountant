import { projectId, publicAnonKey } from '/utils/supabase/info';

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9e65d886`;

/**
 * Get authentication headers including user ID
 */
export function getAuthHeaders(): Record<string, string> {
  const username = localStorage.getItem('username');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  };
  
  if (username) {
    headers['X-User-ID'] = username;
  }
  
  return headers;
}

/**
 * Get authentication headers for file uploads (without Content-Type)
 */
export function getAuthHeadersForUpload(): Record<string, string> {
  const username = localStorage.getItem('username');
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${publicAnonKey}`,
  };
  
  if (username) {
    headers['X-User-ID'] = username;
  }
  
  return headers;
}

/**
 * Fetch wrapper with authentication headers
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
}