import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiPort = Number(process.env.API_PORT || 3001);
const frontendPort = Number(process.env.PORT || 4173);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: frontendPort,
    strictPort: false,
    allowedHosts: [".monkeycode-ai.live"],
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: frontendPort,
    strictPort: false,
    allowedHosts: [".monkeycode-ai.live"],
  },
});
