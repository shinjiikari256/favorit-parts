import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    // Без этого в оболочке с NODE_ENV=production React не экспортирует act, и тесты падают
    env: { NODE_ENV: "test" },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js", "./tests/mockApi.js"],
    mockReset: true,
    include: ["tests/unit/**/*.test.{js,jsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/api/rest/endpoints/**",
        "src/main.jsx",
        "src/App.jsx",
        "src/i18n.js",
        "src/locales/**",
        "src/**/index.js",
      ],
    },
  },
});
