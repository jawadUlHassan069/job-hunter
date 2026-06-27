// src/api/cv.js
import api from "./axios";

export const cvAPI = {
  upload: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/api/cv/", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  get: () => api.get("/api/cv/"),
};

export default cvAPI;
