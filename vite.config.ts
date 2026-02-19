import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || "5173", 10),
    host: !!process.env.HOST,
    allowedHosts: process.env.ALLOWED_HOSTS?.split(",") || undefined,
    proxy: {
      "/ws": {
        target: "ws://127.0.0.1:18789",
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, ""),
      },
    },
  },
});
