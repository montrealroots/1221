/**
 * SLATE — the permit or planning a home's works need (docs/WORLD.md, stage
 * 5c), from 2026-09-29, researched in
 * docs/research/world/research-construction.json.
 *
 * Only work that changes the building asks for one here: a room finished or
 * added, a bathroom added, a suite, a backyard cottage. The permit's fees are
 * paid when the work is started, and the work waits for any decision a law
 * sets a time for.
 *
 * New York City's alteration permit for a one- to three-family house: $130
 * for the first $5,000 of the work and $2.60 for each $1,000 more (Admin
 * Code Table 28-112.2). Los Angeles's: LAMC Table 1-A on the work's value,
 * plan check at 90%, and the state's strong-motion and building standards
 * fees. New Haven's: the city's permit by the $1,000 and the state's
 * education fee, both read secondhand. London: a loft or a room inside is
 * permitted development; a primary suite takes the larger home extension's
 * prior approval (£249, the neighbors' 42 days); a bigger suite or a
 * backyard cottage takes a householder application (£548, eight weeks).
 * Dublin: a rear extension to 40 m² is exempt; a bigger one or a cottage
 * takes the €34 application, eight weeks and four for an appeal. A garage
 * is exempt in both, within England's Class E outbuilding limits and
 * Ireland's Class 3 25 m² (from 2026-09-29). Where a
 * suite falls in London's permitted depths turns on the house's plan, which
 * SLATE doesn't draw: SLATE's reading. From 2026-09-30 London's building
 * control charge on an extension and Ireland's commencement notice are kept
 * (below). Elsewhere the permit isn't kept, said so.
 */

import type { Simulation } from '../core/simulation';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import type { Project } from '../content/homes';
import { LA_FEES, NEW_HAVEN_FEES, SQFT_PER_M2 } from '../content/construction';

/** The works that change the building, and so ask for a permit. */
export const STRUCTURAL = new Set(['garage-build', 'basement', 'attic', 'garage-room', 'bath-add', 'bath-add-upscale', 'suite', 'suite-upscale', 'adu']);

export const WORKS_PERMITS = {
  nyc: { least: 130, first: 5_000, perThousand: 2.6 },
  london: { priorApproval: 249, priorApprovalDays: 42, householder: 548, householderDays: 8 * 7 },
  dublin: { fee: 34, exemptM2: 40, days: 8 * 7 + 4 * 7, commencement: 30 },
} as const;

export interface WorksPermit { lines: { label: string; amount: Money }[]; waitDays: number; basis: string }

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };
const c = (units: number) => Math.round(units * 100);

/**
 * Building control's charge on an extension in London, from 2026-09-30
 * (`docs/research/world/research-land-construction.json`): Camden's 2026
 * schedule for a single-story extension on full plans, its plan charge and
 * its inspection charge with VAT for one of 10 to 60 m², £1,875.55, read from
 * an excerpt, where both of SLATE's suites fall (35.7 m² and 59.5 m²); each
 * borough sets its own, and Camden's is taken for London's. A loft, a
 * basement or a garage converted had its own schedule, not read, and wasn't
 * charged until 2026-10-01.
 */
const BUILDING_CONTROL_10_TO_60 = 750.22 + 1_125.33;

/**
 * Building control on a conversion in London, from 2026-10-01
 * (`docs/research/world/research-land-construction-2.json`): Havering's
 * 2026-27 schedule, read in full and with its VAT, where Camden's showed no
 * garage row. A loft is charged by the floor it adds, and SLATE's attic adds
 * 27.9 m², in the band to 30 m², £859 (£1,183 to 60 m² and £1,406 to 100 m²
 * are never reached, and aren't kept); a garage made a room, £673. A basement has no row of its
 * own and is charged as an extension by its floor, so at Camden's band for
 * one, as the suites are. A garage built new of SLATE's 18 m², detached and
 * not lived in, is exempt from the building regulations under 30 m²
 * (Schedule 2, Class VI) and pays nothing.
 */
const LOFT_TO_30_M2 = 859;
const GARAGE_CONVERSION = 673;
function londonControl(id: string): number | undefined {
  if (id === 'suite' || id === 'suite-upscale' || id === 'basement') return BUILDING_CONTROL_10_TO_60;
  if (id === 'attic') return LOFT_TO_30_M2;
  if (id === 'garage-room') return GARAGE_CONVERSION;
  return undefined;
}

/** Los Angeles's Table 1-A fee on a value, dollars. */
function la1A(value: number): number {
  const [, base, rate] = LA_FEES.table1A.find(([upTo]) => value <= upTo) ?? LA_FEES.table1A[LA_FEES.table1A.length - 1]!;
  return base + rate * value;
}

/**
 * What a job on a home in a town asks, fees in the save's money, cents, or
 * nothing where it asks nothing or SLATE keeps no permit there. The cost is
 * the job's, in the save's money.
 */
export function worksPermit(sim: Simulation, cityId: string, project: Project, cost: Money): WorksPermit | undefined {
  if (!STRUCTURAL.has(project.id)) return undefined;
  const cur = saveCurrency(sim.universe);
  // The job's cost in dollars, for an American fee table.
  const usd = (cents: Money) => (cur === 'USD' ? cents : exchange(cents, cur, 'USD') ?? cents) / 100;
  const addedM2 = (project.adds?.size ?? 0) / SQFT_PER_M2;
  if (cityId === 'us-ny-newyork') {
    const v = usd(cost);
    const f = WORKS_PERMITS.nyc;
    return { lines: [{ label: 'Alteration Permit', amount: inSave(sim, c(f.least + f.perThousand * Math.ceil(Math.max(0, v - f.first) / 1_000)), 'USD') }], waitDays: 0, basis: 'the Department of Buildings’ alteration permit' };
  }
  if (cityId === 'us-ca-losangeles') {
    const v = usd(cost);
    const permit = la1A(v);
    return { lines: [
      { label: 'Building Permit', amount: inSave(sim, c(permit), 'USD') },
      { label: 'Plan Check', amount: inSave(sim, c(permit * LA_FEES.planCheck), 'USD') },
      { label: 'State Fees', amount: inSave(sim, c(Math.max(0.5, v * LA_FEES.smip) + Math.max(1, v * LA_FEES.bsa)), 'USD') },
    ], waitDays: 0, basis: 'LADBS’s permit on the work’s value' };
  }
  if (cityId === 'us-ct-newhaven') {
    const v = usd(cost);
    const f = NEW_HAVEN_FEES;
    return { lines: [
      { label: 'Building Permit', amount: inSave(sim, c(f.first + f.perThousand * Math.ceil(Math.max(0, v - 1_000) / 1_000) + f.processing), 'USD') },
      { label: 'State Education Fee', amount: inSave(sim, c(f.education * v / 1_000), 'USD') },
    ], waitDays: 0, basis: 'New Haven’s permit and the state’s education fee, read secondhand' };
  }
  if (cityId === 'uk-eng-london') {
    const f = WORKS_PERMITS.london;
    // Building control on what's added (from 2026-09-30), and on what's converted (from 2026-10-01).
    const control = londonControl(project.id);
    const bc = control !== undefined ? [{ label: 'Building Control', amount: inSave(sim, c(control), 'GBP') }] : [];
    if (project.id === 'suite') return { lines: [{ label: 'Prior Approval, A Larger Home Extension', amount: inSave(sim, c(f.priorApproval), 'GBP') }, ...bc], waitDays: f.priorApprovalDays, basis: 'permitted development, the neighbors asked first' };
    if (project.id === 'suite-upscale' || project.id === 'adu') return { lines: [{ label: 'Householder Planning Application', amount: inSave(sim, c(f.householder), 'GBP') }, ...bc], waitDays: f.householderDays, basis: 'a householder application, decided in eight weeks' };
    // A conversion inside the house is permitted development and asks building control alone.
    if (bc.length) return { lines: bc, waitDays: 0, basis: 'building control on the conversion, permitted development asking no planning' };
    return undefined;
  }
  if (cityId === 'ie-lei-dublin') {
    const f = WORKS_PERMITS.dublin;
    if (project.id !== 'adu' && addedM2 <= f.exemptM2) return undefined;
    return { lines: [{ label: 'Planning Application', amount: inSave(sim, c(f.fee), 'EUR') }, { label: 'Commencement Notice', amount: inSave(sim, c(WORKS_PERMITS.dublin.commencement), 'EUR') }], waitDays: f.days, basis: 'planning, eight weeks and four for an appeal, and the commencement notice' };
  }
  return undefined;
}
