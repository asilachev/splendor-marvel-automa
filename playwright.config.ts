import { defineConfig } from '@playwright/test'

// End-to-end smoke test (#14): the production build on a phone-sized screen with touch.
//
//   npm run e2e      (builds first, then serves dist/ with `vite preview`)
//
// It drives the installed Google Chrome, as scripts/screenshots.mjs does, so nothing is
// downloaded; set CHROME_PATH to use another Chrome or Chromium (CI sets /usr/bin/google-chrome).
const PORT = 4174
const BASE_URL = `http://127.0.0.1:${PORT}`
const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }], ...(CI ? [['github'] as const] : [])],
  use: {
    baseURL: BASE_URL,
    // The app follows the browser's language (#54); the test reads the English texts.
    locale: 'en-GB',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'phone',
      use: {
        // An iPhone 14's screen, in Chrome: WebKit would need a download.
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        ...(process.env.CHROME_PATH
          ? { launchOptions: { executablePath: process.env.CHROME_PATH } }
          : { channel: 'chrome' }),
      },
    },
  ],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    // Always this build: a server already on the port (another checkout's?) is an error.
    reuseExistingServer: false,
  },
})
