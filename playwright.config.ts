import { defineConfig } from "@playwright/test";

const visualTestPort = 3106;
const visualTestUrl = `http://127.0.0.1:${visualTestPort}`;

export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "test-results/visual",
  fullyParallel: false,
  // ponytail: Windows Next dev server flakes with CPU-level visual concurrency; use 3 workers until the suite moves to a production test server.
  workers: 3,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  reporter: "list",
  use: {
    baseURL: visualTestUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${visualTestPort}`,
    url: visualTestUrl,
    reuseExistingServer: true,
    env: {
      ...process.env,
      AI_PROVIDER: "mock",
      TRANSLATION_PROVIDER: "mock",
      HELP_AI_PROVIDER: "mock",
      ENABLE_PUBLIC_REAL_AI: "false",
      ENABLE_PUBLIC_HELP_AI: "false",
      RATE_LIMIT_MAX_REQUESTS: "100"
    },
    timeout: 120_000
  },
  projects: [
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } }
  ]
});
