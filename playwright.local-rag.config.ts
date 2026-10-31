import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["local-pdf-rag.e2e.ts", "workspace-beta-local-connection.e2e.ts"],
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8876",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    channel: "chrome",
  },
  webServer: {
    command: "node node_modules/vite/bin/vite.js --mode e2e --host 127.0.0.1 --port 8876 --strictPort",
    url: "http://127.0.0.1:8876",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
