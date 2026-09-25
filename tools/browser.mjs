/**
 * Where the browser tools find a Chromium.
 *
 * CHROMIUM_PATH when it is set. Otherwise the fixed path the Linux container
 * these tools were written in kept its browser at, when that path is there,
 * and anywhere else the browser Playwright installed itself
 * (`npx playwright install chromium`). Five of the tools named the container's
 * path outright, so on Windows they failed to launch unless CHROMIUM_PATH was
 * set; text-caps alone fell back, and its rule is the one kept here.
 */

import { existsSync } from 'node:fs';

const CONTAINER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/** Options for `chromium.launch`. */
export function launchOptions() {
  if (process.env.CHROMIUM_PATH) return { executablePath: process.env.CHROMIUM_PATH };
  return existsSync(CONTAINER) ? { executablePath: CONTAINER } : {};
}
