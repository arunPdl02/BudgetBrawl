import { apiClient } from "./client";

export const getBalance = () =>
  apiClient.get("/wallet/balance").then((r) => r.data);
export const getTransactions = () =>
  apiClient.get("/wallet/transactions").then((r) => r.data);
