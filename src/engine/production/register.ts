/**
 * SLATE — production system boundary.
 *
 * This is the migration seam for the production rebuild.
 *
 * Today it delegates to the existing production modules so behavior is unchanged.
 * During the rebuild, replacement subsystems move behind this boundary one at a
 * time. `src/engine/index.ts` should not need to know which implementation owns
 * casting, making, selling, awards, or actor-facing work.
 *
 * Clean-room rule: replacement modules may implement the same kinds of mechanics
 * and causal relationships as the reference game, but must use original SLATE
 * code, data, formulas, text, and UI.
 */

import type { Simulation } from '../core/simulation';
import { registerMaking } from '../world/making';
import { registerSelling } from '../world/selling';
import { registerCrew } from '../world/crew';
import { registerCasting } from '../world/casting';
import { registerAudition } from '../world/audition';
import { registerAwards } from '../world/awards';
import { registerDevelopment } from './development';
import { registerPackaging } from './package';

/**
 * Registers the complete production/career surface.
 *
 * Keeping one public registrar is deliberate: the new production engine can be
 * swapped in subsystem-by-subsystem without widening the app-level dependency
 * surface or requiring a flag day.
 */
export function registerProduction(sim: Simulation): void {
  registerDevelopment(sim);
  registerPackaging(sim);
  registerMaking(sim);
  registerSelling(sim);
  registerCrew(sim);
  registerCasting(sim);
  registerAudition(sim);
  registerAwards(sim);
}
