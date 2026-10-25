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

// The containers' own browsers, the newest first: from 2026-10-25 (brief 27's F) the link this environment documents for its
// Chromium, whatever build it points at. Until then only the build the first container kept (1194), so in a container
// with another build every browser lane of brief 27's final runs failed to launch without CHROMIUM_PATH: Playwright
// looked for the headless shell it pins (build 1234), which wasn't there.
const CONTAINER = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];

/** Options for `chromium.launch`. */
export function launchOptions() {
  if (process.env.CHROMIUM_PATH) return { executablePath: process.env.CHROMIUM_PATH };
  const found = CONTAINER.find((p) => existsSync(p));
  return found ? { executablePath: found } : {};
}
