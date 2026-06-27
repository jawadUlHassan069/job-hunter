// src/api/axios.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "https://job-hunter-du0n.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access_token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token"); // ← was "token" (wrong key)
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-refresh on 401, then retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Rate limited — surface a clean error message
    if (error.response?.status === 429) {
      return Promise.reject(new Error("Too many requests. Please wait a moment and try again."));
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh });
          const newAccess = res.data.access;
          localStorage.setItem("access_token", newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      } else {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
