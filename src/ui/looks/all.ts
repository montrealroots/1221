/**
 * SLATE — every kind the game knows how to open.
 *
 * Nothing but side-effect imports. Adding a kind is adding a file and a line
 * here; the crawl in tests/looks.test.ts picks it up without being told, and
 * so does every tool that enumerates the registry.
 *
 * Kept apart from index.ts so that a test can register the whole graph
 * without pulling in the React layer that renders it. Depth is data first and
 * markup second, and this is the seam.
 */

import './wellbeing';
import './place';
import './weather';
import './money';
import './standing';
import './estate';
import './day';
import './attention';
import './plans';
import './family';
import './business';
