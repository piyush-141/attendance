import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: apiUrl ? `${apiUrl}/api` : '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  (config as any).metadata = { startTime: performance.now() };
  return config;
});

api.interceptors.response.use((response) => {
  const start = (response.config as any).metadata.startTime;
  const duration = performance.now() - start;
  console.log(`[Frontend Fetch] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration.toFixed(2)}ms`);
  return response;
}, (error) => {
  if (error.config && (error.config as any).metadata) {
    const start = (error.config as any).metadata.startTime;
    const duration = performance.now() - start;
    console.log(`[Frontend Fetch Error] ${error.config.method?.toUpperCase()} ${error.config.url} - ${duration.toFixed(2)}ms`);
  }
  return Promise.reject(error);
});

export default api;
