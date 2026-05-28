import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

/**
 * Centralized axios client for all calls to our own backend.
 *
 * Why a dedicated instance instead of mutating `axios.defaults`?
 *  - Mutating the global `axios` defaults leaks the JWT into every other
 *    `axios.create(...)` instance, including the TMDB client. We don't
 *    want our auth token sent to third-party APIs.
 *  - A request interceptor reads the token fresh on every call, so we
 *    never have to remember to set/unset headers across login/logout.
 */
export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

export const API_BASE_URL = API_URL;
