import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
// Tailwind подключён через postcss.config.js, а не через Vite-плагин —
// это позволяет запускать PostCSS-плагины (oklch → rgb фоллбэки) поверх Tailwind-вывода.
export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      port: 5175,
    },
    preview: { port: 5175 },
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "./src") },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("i18next") || id.includes("react-i18next")) return "vendor-i18n";
            if (id.includes("@reduxjs") || id.includes("react-redux") || id.includes("redux")) return "vendor-redux";
            return "vendor";
          },
        },
      },
    },
  };
});
