// src/api/match.js
import api from "./axios";

export const matchAPI = {
  getMatches:   ()        => api.get("/api/match/"),
  getSkillGap:  (job_id)  => api.get(`/api/match/gap/${job_id}/`),
};

export default matchAPI;
