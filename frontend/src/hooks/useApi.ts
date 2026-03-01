"use client";

import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

export function useApi() {
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!token) throw new Error("Not authenticated");
    return api<T>(path, { ...options, token });
  }

  return { fetchApi, token, isAuthenticated: !!token, isLoading: status === "loading" };
}
