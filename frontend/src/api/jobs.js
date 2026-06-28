// src/api/jobs.js
import api from "./axios";

export const jobsAPI = {
  // Get all jobs
  getJobs: () => api.get("/api/jobs/"),
  
  // Get featured jobs for landing page
  getFeaturedJobs: () => api.get("/api/jobs/featured/"),
  
  // Get job stats
  getJobStats: () => api.get("/api/jobs/stats/"),
  
  // Trigger manual job scraping (authenticated users only)
  triggerScraping: () => api.post("/api/jobs/scrape/"),
  
  // Get last scrape information
  getLastScrapeInfo: () => api.get("/api/jobs/last-scrape/"),
  
  // Applications
  getApplications: () => api.get("/api/jobs/applications/"),
  applyToJob: (jobId) => api.post("/api/jobs/applications/", { job_id: jobId }),
  updateApplication: (id, data) => api.patch(`/api/jobs/applications/${id}/`, data),
  
  // Saved jobs
  getSavedJobs: () => api.get("/api/jobs/saved/"),
  saveJob: (jobId) => api.post("/api/jobs/saved/", { job_id: jobId }),
  unsaveJob: (id) => api.delete(`/api/jobs/saved/${id}/`),
};

export default jobsAPI;
