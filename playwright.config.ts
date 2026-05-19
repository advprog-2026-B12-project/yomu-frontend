import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import * as fs from "fs";
import * as path from "path";

const projectDir = __dirname;

const envLocalPath = path.resolve(projectDir, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvConfig(projectDir);

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const shouldStartWebServer =
  !process.env.E2E_SKIP_WEB_SERVER &&
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(baseURL);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: shouldStartWebServer
    ? {
        command: "npm run dev",
        cwd: projectDir,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
          NEXT_PUBLIC_GOOGLE_CLIENT_ID:
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        },
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  outputDir: "test-results",
});
