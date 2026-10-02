/**
 * SLATE — a machine at home that breaks, and the repair visit that mends it
 * (the master plan's §35f, from 2026-10-02;
 * `docs/research/world/research-appliance-faults.json`).
 *
 * **How often.** Each machine a home has may break on any day, at a yearly
 * rate read from the only published figures that put a period on it (decider
 * `home.appliance_fault`):
 * - a washer, Consumer Reports' 13% broken down in its second to fifth years,
 *   so 1 − 0.87^(1/4) a year;
 * - a dishwasher, the middle of Which?'s best and worst brands, 7% and 33%
 *   faulty in six years, so 20% in six;
 * - a fridge, Consumer Reports' 30% of fridges with icemakers needing a
 *   repair by their fifth year.
 * No rate with a period was found for a dryer or air conditioning, so they
 * don't break here; they still wear out at their published lives.
 *
 * **What it does.** A broken washer sends the washing to the laundromat, and
 * a broken dishwasher leaves the dishes to be done by hand (`withFaults` in
 * `systems/dwelling.ts`). A fridge that stops spoils what's in it, as a power
 * cut of more than four hours does, and whatever is put in before it's mended.
 *
 * **The repair.** In a rented home the landlord's machines are the
 * landlord's to mend: a technician comes the next day, nothing to pay. A
 * machine of one's own, at an owned home or a tenant's portable, is booked:
 * Book The Repair, and the technician comes the next day, SLATE's reading
 * of one firm's 57.4% seen the same or the next business day. The bill is the
 * market's published figure: Angi's average in America (washer $220,
 * dishwasher $225, fridge $275); Checkatrade's in Britain, with its £105
 * call-out; in Ireland a Dublin firm's €80 call-out and the middle of €120
 * to €300 for a common repair; HomeStars' middles in Canada; Cronoshare's
 * middles in Mexico, IVA in, the diagnosis waived with the repair. Over half
 * a new one's price, the cost guides' rule is to replace it instead; the
 * screen says so.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { inSaveMoney } from './banking';
import { owe, spend } from './household';
import { homeKeyOf, itemsOf } from './items';
import { workingFixtures } from './dwelling';

export type Machine = 'washer' | 'dishwasher' | 'fridge';
export interface MachineFault { at: Instant; /** When the technician comes and it's mended; unset until a repair of one's own is booked. */ fixAt?: Instant; landlord?: boolean }

export const MACHINE_LABEL: Readonly<Record<Machine, string>> = { washer: 'Washing Machine', dishwasher: 'Dishwasher', fridge: 'Fridge' };

/** The chance a year each breaks. */
export const FAULTS_A_YEAR: Readonly<Record<Machine, number>> = {
  washer: 1 - Math.pow(1 - 0.13, 1 / 4),
  dishwasher: 1 - Math.pow(1 - (0.07 + 0.33) / 2, 1 / 6),
  fridge: 1 - Math.pow(1 - 0.3, 1 / 5),
};

/** A repair's bill by country, in its money: a call-out and the repair. */
export const REPAIRS: Readonly<Record<string, { currency: string; callout: number; items: Record<Machine, number> }>> = {
  us: { currency: 'USD', callout: 0, items: { washer: 220, dishwasher: 225, fridge: 275 } },
  uk: { currency: 'GBP', callout: 105, items: { washer: 125, dishwasher: 200, fridge: 150 } },
  ie: { currency: 'EUR', callout: 80, items: { washer: 210, dishwasher: 210, fridge: 210 } },
  ca: { currency: 'CAD', callout: 0, items: { washer: (155 + 600) / 2, dishwasher: (130 + 260) / 2, fridge: (260 + 520) / 2 } },
  mx: { currency: 'MXN', callout: 0, items: { washer: (800 + 3000) / 2, dishwasher: (800 + 2500) / 2, fridge: (1000 + 3500) / 2 } },
};

export const faultsOf = (person: Person): Partial<Record<Machine, MachineFault>> => person.applianceFaults ?? {};

/** The machines the home they live in has working now: a washer, a dishwasher, and a fridge in any kitchen of one's own. */
export function machinesAt(sim: Simulation, person: Person): Machine[] {
  const f = workingFixtures(sim, person);
  if (!f) return [];
  return [...(f.laundry === 'in-unit' || f.laundry === 'washer-only' ? ['washer' as const] : []), ...(f.dishwasher ? ['dishwasher' as const] : []), 'fridge'];
}

/** Whose machine it is to mend: the landlord's in a rented home, unless it's the tenant's own portable. */
const landlords = (person: Person, m: Machine): boolean => person.home?.kind !== 'owned' && !(m !== 'fridge' && person.portables?.[m] !== undefined);

/** A repair's bill here, in the save's money; nothing where no price is kept. */
export function repairBill(sim: Simulation, person: Person, m: Machine): Money | undefined {
  const r = REPAIRS[CITIES.get(person.home?.cityId ?? '')?.countryId ?? ''];
  return r ? inSaveMoney(sim, Math.round((r.callout + r.items[m]) * 100), r.currency) : undefined;
}

/** The next morning at ten in the home's town: when the technician comes. */
function nextMorning(person: Person, at: Instant): Instant {
  const zone = CITIES.require(person.home!.cityId).timeZone;
  const p = zonedParts(at + MS_DAY, zone);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 10, minute: 0 }, zone);
}

/** What a broken fridge spoils: everything in it. How many. */
function spoilFridge(person: Person, at: Instant): number {
  const home = homeKeyOf(person.home);
  let n = 0;
  for (const i of itemsOf(person)) if (i.food && i.at.kind === 'home' && i.at.home === home && i.at.spot === 'fridge' && (i.food.expiresAt === undefined || i.food.expiresAt > at)) { i.food.expiresAt = at; n += 1; }
  return n;
}

/**
 * The day's turn: a machine mended where its visit has come, a fridge still
 * broken spoiling what's put in it, and each working machine drawn for a
 * fault. `odds` overrides a day's chance, for the decider's sweep.
 */
export function machinesDay(sim: Simulation, person: Person, odds?: number): Machine[] {
  if (!person.home || person.home.kind === 'sofa') return [];
  const faults = (person.applianceFaults ??= {});
  for (const m of Object.keys(faults) as Machine[]) {
    const f = faults[m]!;
    if (f.fixAt !== undefined && f.fixAt <= sim.now) delete faults[m];
    else if (m === 'fridge') spoilFridge(person, sim.now);
  }
  const broke: Machine[] = [];
  for (const m of machinesAt(sim, person)) {
    if (faults[m]) continue;
    const rng = sim.rng('home.appliance_fault', person.id, m, Math.floor(sim.now / MS_DAY));
    if (rng.next() >= (odds ?? 1 - Math.pow(1 - FAULTS_A_YEAR[m], 1 / 365))) continue;
    const landlord = landlords(person, m);
    faults[m] = { at: sim.now, ...(landlord ? { fixAt: nextMorning(person, sim.now), landlord: true } : {}) };
    broke.push(m);
    const spoiled = m === 'fridge' ? spoilFridge(person, sim.now) : 0;
    if (person.id === sim.universe.playerId) {
      const bill = repairBill(sim, person, m);
      sim.notify({ category: 'home', title: `The ${MACHINE_LABEL[m]} Broke`, body: `${landlord ? 'The landlord’s technician comes tomorrow.' : `Book The Repair on Home${bill !== undefined ? `, about ${formatMoney(bill, saveCurrency(sim.universe), { cents: false })}` : ''}.`}${m === 'washer' ? ' Until then the washing goes to the laundromat.' : m === 'dishwasher' ? ' Until then the dishes are done by hand.' : spoiled ? ' What was in it has spoiled.' : ''}`, importance: 55, route: '/home' });
    }
  }
  if (Object.keys(faults).length === 0) delete person.applianceFaults;
  return broke;
}

export function repairRefusal(sim: Simulation, person: Person, m: Machine): string | undefined {
  const f = faultsOf(person)[m];
  if (!f) return `The ${MACHINE_LABEL[m].toLowerCase()} isn’t broken.`;
  if (f.landlord) return 'The landlord is having it mended.';
  if (f.fixAt !== undefined) return 'The technician is booked.';
  if (repairBill(sim, person, m) === undefined) return 'SLATE keeps no repair price where you live.';
  return undefined;
}

export function registerApplianceFaults(sim: Simulation): void {
  sim.onCommand<{ machine: Machine }, { paid: Money; fixAt: Instant }>('home.repair_machine', (p, { sim: s }) => {
    const person = s.player;
    const m = p?.machine;
    if (!m || !(m in MACHINE_LABEL)) throw new CommandError('No such machine.');
    const no = repairRefusal(s, person, m);
    if (no) throw new CommandError(no);
    const bill = repairBill(s, person, m)!;
    // The technician bills on the day; what the bank can't pay is owed.
    if (!spend(s, person, bill, `A technician, the ${MACHINE_LABEL[m].toLowerCase()}`, 'home')) owe(s, person, bill, `A technician, the ${MACHINE_LABEL[m].toLowerCase()}`, 'home');
    const fixAt = nextMorning(person, s.now);
    person.applianceFaults![m]!.fixAt = fixAt;
    return { paid: bill, fixAt };
  });
}
