import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./benchmarks/capacity",
  testMatch: "**/*.benchmark.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: "test-results/capacity-playwright",
  timeout: 30 * 60 * 1000,
  use: {
    baseURL: "http://127.0.0.1:4174",
    browserName: "chromium",
    headless: true,
    serviceWorkers: "allow",
    trace: "off",
  },
  webServer: {
    command:
      "npm run build && npm run preview -- --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
