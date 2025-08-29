import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
   build: {
    target: "esnext", // ✅ allows top-level await
  },
  define: {
    "process.env": {}, // 🩹 Patch to stop "process is not defined" error
  },
});
