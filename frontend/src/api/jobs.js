// src/api/jobs.js
import api from "./axios";

export const jobsAPI = {
  list:              (params = {})  => api.get("/api/jobs/", { params }),
  listSoon:          ()             => api.get("/api/jobs/", { params: { deadline: "soon" } }),
  listBySkill:       (skill)        => api.get("/api/jobs/", { params: { skill } }),

  getApplications:   ()             => api.get("/api/jobs/applications/"),
  apply:             (job_id)       => api.post("/api/jobs/applications/", { job_id }),
  updateApplication: (id, data)     => api.patch(`/api/jobs/applications/${id}/`, data),

  getSaved:          ()             => api.get("/api/jobs/saved/"),
  save:              (job_id)       => api.post("/api/jobs/saved/", { job_id }),
  unsave:            (id)           => api.delete(`/api/jobs/saved/${id}/`),
};

export default jobsAPI;
