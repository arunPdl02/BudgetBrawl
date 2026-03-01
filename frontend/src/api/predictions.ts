import { apiClient } from "./client";

export const getPredictions = () =>
  apiClient.get("/predictions/").then((r) => r.data);
export const generatePredictions = () =>
  apiClient.post("/predictions/generate").then((r) => r.data);
