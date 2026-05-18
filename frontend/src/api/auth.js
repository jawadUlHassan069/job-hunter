// src/api/auth.js
import api from './axios';

export const authAPI = {
  // Public routes
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  verify2FA: (user_id, code) => api.post('/auth/2fa/verify/', { user_id, code }),

  // Protected routes
  getMe: () => api.get('/auth/me/'),
  setup2FA: () => api.get('/auth/2fa/setup/'),
  confirm2FA: (code) => api.post('/auth/2fa/setup/', { code }),
};

export default authAPI;