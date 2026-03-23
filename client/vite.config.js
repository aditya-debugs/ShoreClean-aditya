import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        // Must match server `PORT` (default 5000 in server/src/index.js)
        target: process.env.VITE_PROXY_TARGET || "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      // FastAPI AI server (default port 8001) — avoids cross-origin from the browser
      "/ai": {
        target: process.env.VITE_AI_PROXY_TARGET || "http://localhost:8001",
        changeOrigin: true,
        secure: false,
      },
      "/cleanup": {
        target: process.env.VITE_AI_PROXY_TARGET || "http://localhost:8001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
