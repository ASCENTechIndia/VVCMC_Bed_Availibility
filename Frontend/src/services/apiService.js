/**
 * API Service
 * Base URL is configured via environment variable VITE_API_BASE_URL
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://bedavailibilityapi.nagarkaryavalinewuat.com/api';

/**
 * Generic request wrapper with JSON and error handling
 */
export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let authHeader = {};
  try {
    const token =
      localStorage.getItem('vvcmc-bed-dashboard:token') ||
      sessionStorage.getItem('vvcmc-bed-dashboard:token');
    if (token) {
      authHeader = { Authorization: `Bearer ${token}` };
    }
  } catch (err) {
    console.error('Error reading token for request:', err);
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  const response = await fetch(url, config);
  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    console.error('Error parsing response JSON:', err);
  }

  if (!response.ok || (data && data.success === false)) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const get = (endpoint, options = {}) =>
  request(endpoint, { method: 'GET', ...options });

export const post = (endpoint, body, options = {}) =>
  request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options });

export const put = (endpoint, body, options = {}) =>
  request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options });

export const del = (endpoint, options = {}) =>
  request(endpoint, { method: 'DELETE', ...options });

const apiService = {
  API_BASE_URL,
  request,
  get,
  post,
  put,
  del,
};

export default apiService;
