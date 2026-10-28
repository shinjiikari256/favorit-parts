import { defineConfig, devices } from "@playwright/test";

const PORT = 5175;

const useConfig = devices["Desktop Chrome"];

export default defineConfig({
  fullyParallel: true,
  reporter: [["./tests/e2e/reporter.js"], ["html", { open: "never" }]],
  use: { baseURL: `http://localhost:${PORT}`, locale: "ru-RU" },
  projects: [
    // Сквозные сценарии пользователя
    { name: "scenarios", testDir: "tests/e2e/scenarios", use: useConfig },
    // Вёрстка и доступность: контраст, размеры целей, раскладка, виртуализация
    { name: "visual", testDir: "tests/e2e/visual", use: useConfig },
  ],
  webServer: {
    command: `bunx vite --mode dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { NODE_ENV: "development" },
  },
});
