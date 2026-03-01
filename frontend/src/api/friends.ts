import { apiClient } from "./client";

export const getFriends = () => apiClient.get("/friends/").then((r) => r.data);
export const getPending = () =>
  apiClient.get("/friends/pending").then((r) => r.data);
export const sendRequest = (addressee_email: string) =>
  apiClient.post("/friends/request", { addressee_email }).then((r) => r.data);
export const acceptRequest = (id: number) =>
  apiClient.post(`/friends/${id}/accept`).then((r) => r.data);
export const declineRequest = (id: number) =>
  apiClient.post(`/friends/${id}/decline`).then((r) => r.data);
export const searchUser = (email: string) =>
  apiClient.get(`/users/search?email=${encodeURIComponent(email)}`).then((r) => r.data);
