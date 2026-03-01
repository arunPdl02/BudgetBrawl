import { apiClient } from "./client";

export const getMe = () => apiClient.get("/auth/me").then((r) => r.data);
