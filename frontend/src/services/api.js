import axios from "axios";

export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const resolveApiUrl = (resourcePath = "") => {
  if (!resourcePath) return API_BASE_URL;
  if (/^https?:\/\//i.test(resourcePath)) return resourcePath;
  return `${API_BASE_URL}${resourcePath.startsWith("/") ? resourcePath : `/${resourcePath}`}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;