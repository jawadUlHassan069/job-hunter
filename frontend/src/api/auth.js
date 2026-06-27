// src/api/auth.js
import api from "./axios";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "https://job-hunter-du0n.onrender.com";

export const authAPI = {
  // Public — use plain axios so no auth header is added
  register:  (data)          => axios.post(`${BASE_URL}/api/auth/register/`, data),
  login:     (data)          => axios.post(`${BASE_URL}/api/auth/login/`, data),
  verify2FA: (user_id, code) => axios.post(`${BASE_URL}/api/auth/2fa/verify/`, { user_id, code }),
  refresh:   (refresh)       => axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh }),

  // Protected
  getMe:      ()     => api.get("/api/auth/me/"),
  setup2FA:   ()     => api.get("/api/auth/2fa/setup/"),
  confirm2FA: (code) => api.post("/api/auth/2fa/setup/", { code }),
};

export default authAPI;
