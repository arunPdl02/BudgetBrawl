import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": {
        target: "http://localhost:8000",
        bypass(req) {
          // Don't proxy /auth/callback - serve SPA so AuthCallbackPage handles token
          if (req.url?.startsWith("/auth/callback")) return "/index.html";
        },
      },
    },
  },
});
