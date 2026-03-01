import { apiClient } from "./client";

export const syncCalendar = () =>
  apiClient.post("/calendar/sync").then((r) => r.data);
export const getEvents = () =>
  apiClient.get("/calendar/events").then((r) => r.data);
