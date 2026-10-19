/**
 * The health area's rendered examples of care, first written for brief 14's batch 2 (2026-10-17) and kept for brief 15
 * (2026-10-19): the notices and refusals of care, cover, prescriptions and the city list that no test asserts word for
 * word, each reached by playing a throwaway life through the commands the screens send (`execute`) and the clock
 * (`advanceTo`), or, where only the clock reaches it, by the refusal the screen asks. Printed so the words can be read in
 * each variant (care-before.txt, then care-after-2.txt).
 *
 *   npx vite-node docs/verification/editorial-2026-10-19/health/render-care.ts -- OUT.txt
 *
 * Nothing it does is saved.
 */
import { writeFileSync } from 'node:fs';
import { quickSave, type Simulation } from '../../../../src/engine';
import { MS_DAY, MS_HOUR, instantFromZoned } from '../../../../src/engine/core/time';
import { aidRefusal, applyRefusal, hardshipRefusal, healthMonth, healthOf, mayEnroll, prepayRefusal } from '../../../../src/engine/systems/health';
import { earningsOf } from '../../../../src/engine/systems/earnings';
import { CITIES, loadCountryCities } from '../../../../src/engine/content/geography';

const [OUT = 'render2.txt'] = process.argv.slice(2).filter((a) => a !== '--');
const lines: string[] = [];
const say = (s: string) => lines.push(s);
const at = (y: number, m: number, d: number, h = 12, zone = 'America/New_York') => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: 0 }, zone);
const life = (city: string, seed: string, wealth = 'comfortable'): Simulation => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth } as never, seed);
/** The clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => {
  const r = sim.execute({ kind, payload } as never) as { ok: boolean; error?: string };
  return r.ok ? '(done)' : r.error;
};
/** Last month's key, as the earnings record keeps months ('2025-12' in January 2026). */
const lastMonth = (sim: Simulation): string => {
  const d = new Date(sim.now);
  const [y, m] = d.getUTCMonth() === 0 ? [d.getUTCFullYear() - 1, 12] : [d.getUTCFullYear(), d.getUTCMonth()];
  return `${y}-${String(m).padStart(2, '0')}`;
};
const told = (sim: Simulation, title: string, from = 0) => sim.universe.notifications.filter((n) => n.title === title && n.at >= from).map((n) => n.body);
function scene(name: string, body: () => void): void {
  say(`\n===== ${name}`);
  try { body(); } catch (e) { say(`  (failed: ${(e as Error).message})`); }
}

scene('London: enroll and apply for public cover, choose a pharmacy, buy a dental plan', () => {
  const sim = life('uk-eng-london', 'h2-london');
  say(`  Enroll: ${run(sim, 'health.enroll')}`);
  say(`  mayEnroll: ${mayEnroll(sim.player, sim.now).why}`);
  say(`  Apply For HUSKY D: ${applyRefusal(sim, sim.player, sim.now)}`);
  say(`  Choose a pharmacy: ${run(sim, 'health.choose_pharmacy', { chain: 'cvs' })}`);
  say(`  Buy Dental: ${run(sim, 'health.dental', { on: true })}`);
  say(`  Prepay, at the start: ${prepayRefusal(sim, sim.player) ?? '(offered)'}`);
  sim.player.birthInstant = sim.now - 61 * 365.25 * MS_DAY;
  say(`  Prepay, at 61: ${prepayRefusal(sim, sim.player) ?? '(offered)'}`);
  // A twin whose accounts hold nothing (TEST SETUP: their balances set to nothing in this throwaway life).
  const broke = life('uk-eng-london', 'h2-london-broke', 'scraping');
  for (const a of Object.values(broke.universe.accounts)) if (a.ownerId === broke.player.id) a.balance = 0;
  say(`  Prepay A Year, with nothing in the bank: ${run(broke, 'health.prepay', { months: 12 })}`);
});

scene('New York: the prescription prepayment, a hospital bill put in for assistance', () => {
  const sim = life('us-ny-newyork', 'h2-ny');
  say(`  Prepay: ${prepayRefusal(sim, sim.player) ?? '(offered)'}`);
  const bill = { id: 'm1', at: sim.now, what: 'A stay in hospital', amount: 500_00, dueAt: sim.now + 30 * MS_DAY, hospital: true, cityId: 'us-ny-newyork' };
  say(`  Apply For Assistance on a New York hospital's bill: ${aidRefusal(bill as never, sim.now)}`);
  say(`  … on a Connecticut one past its due date: ${aidRefusal({ ...bill, cityId: 'us-ct-newhaven' } as never, sim.now + 31 * MS_DAY)}`);
});

scene('Los Angeles: a dental plan without Covered California, then a marketplace plan dropped', () => {
  const sim = life('us-ca-losangeles', 'h2-la');
  say(`  Buy Dental: ${run(sim, 'health.dental', { on: true })}`);
  tended(sim, at(2026, 11, 3, 12, 'America/Los_Angeles'));
  say(`  Enroll, 3 November: ${run(sim, 'health.enroll')}`);
  tended(sim, at(2027, 1, 5, 12, 'America/Los_Angeles'));
  say(`  Drop, 5 January: ${run(sim, 'health.drop')}`);
  say(`  Drop again: ${run(sim, 'health.drop')}`);
  tended(sim, at(2027, 2, 3, 12, 'America/Los_Angeles'));
  for (const b of told(sim, 'Your Health Cover Ended')) say(`  Your Health Cover Ended: ${b}`);
});

scene('New Haven, outside the school: Apply For HUSKY D when Enroll would do, and when income is over its line', () => {
  const low = life('us-ct-newhaven', 'h2-nh-low', 'scraping');
  say(`  low income, ${new Date(low.now).toISOString().slice(0, 10)}: ${applyRefusal(low, low.player, low.now)}`);
  const high = life('us-ct-newhaven', 'h2-nh-high');
  const last = lastMonth(high);
  earningsOf(high.player).months[last] = 9_000_00;
  say(`  ${last} at $9,000: ${applyRefusal(high, high.player, high.now)}`);
});

scene('New Haven: a notice of noncompliance answered too late', () => {
  const sim = life('us-ct-newhaven', 'h2-nh-late', 'scraping');
  const noticeAt = at(2027, 1, 4, 9);
  healthOf(sim.player).pending = { kind: 'application', state: 'ct', months: ['2026-12'], noticeAt, decideAt: noticeAt + 35 * MS_DAY } as never;
  say(`  Request A Hardship Exception, after its day: ${hardshipRefusal(sim, sim.player, noticeAt + 36 * MS_DAY)}`);
  healthOf(sim.player).pending = { kind: 'application', state: 'ct', months: ['2026-11', '2026-12'], noticeAt, decideAt: noticeAt + 35 * MS_DAY } as never;
  say(`  … in time, with no stay in hospital: ${hardshipRefusal(sim, sim.player, noticeAt + MS_DAY)}`);
});

scene('New Haven: Covered Connecticut, then out of status', () => {
  const sim = life('us-ct-newhaven', 'h2-nh-cc', 'scraping');
  const last = lastMonth(sim);
  earningsOf(sim.player).months[last] = 2_052_00;
  say(`  Enroll on ${last}'s $2,052.00: ${run(sim, 'health.enroll')} (${healthOf(sim.player).program?.kind ?? 'none'})`);
  sim.player.usOutOfStatus = sim.now;
  tended(sim, sim.now + 40 * MS_DAY);
  for (const t of ['Your Public Cover Has Ended', 'Your Public Cover Won’t Begin', 'Your Health Cover Ended']) for (const b of told(sim, t)) say(`  ${t}: ${b}`);
});

scene('Vancouver: a prescription past its date, the renewal booked', () => {
  const sim = life('ca-bc-vancouver', 'g03-van-1');
  const c = healthOf(sim.player).chronic?.depression;
  if (!c) { say('  (no depression drawn)'); return; }
  c.prescribedAt = at(2024, 1, 20, 12, 'America/Vancouver');
  tended(sim, at(2026, 1, 26, 12, 'America/Vancouver'));
  for (const b of told(sim, 'A Prescription Ran Out')) say(`  A Prescription Ran Out: ${b}`);
});

// A HUSKY D renewal whose work rules are met by age or by SNAP, which no test plays to its words: the program set on the
// record and the renewal's month looked at, as tests/defects-g8-4.test.ts does, and for SNAP its June payment put on the
// record as the benefit posts it (TEST SETUP, in this throwaway life only).
scene('New Haven: HUSKY D renewed on 1 July 2027, its work rules met by age, and by SNAP', () => {
  for (const how of ['under 19', 'SNAP']) {
    const sim = life('us-ct-newhaven', `h2-renew-${how}`, 'scraping');
    healthOf(sim.player).program = { kind: 'medicaid', state: 'ct', from: at(2027, 1, 1, 0), band: 'low', renewAt: at(2027, 7, 1, 0) } as never;
    if (how === 'under 19') sim.player.birthInstant = at(2008, 12, 1);
    else {
      const mine = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id)!;
      sim.universe.transactions.push({ id: 'h2-snap', at: at(2027, 6, 3), memo: 'SNAP, the month, onto the EBT card', category: 'benefits', postings: [{ accountId: mine.id, amount: 100_00 }] } as never);
    }
    healthMonth(sim, sim.player, at(2027, 7, 1, 1));
    for (const t of ['Your Public Cover Is Renewed', 'A Notice Of Noncompliance', 'Your Public Cover Ends']) for (const x of told(sim, t)) say(`  ${how}: ${t}: ${x}`);
  }
});

// Only British Columbia's prescriptions run out (`RX.validYears`), and Canada always gives a wait (`waitDays`), so the
// renewal is always booked: the notice's other ending, "Book An Appointment, …", can't be reached today.
scene('Dublin, where no wait is published: Book An Appointment', () => {
  const sim = life('ie-lei-dublin', 'h2-dublin');
  healthOf(sim.player).owedVisit = 'A doctor’s visit';
  say(`  Book An Appointment: ${run(sim, 'health.book')}`);
});

// Brief 15: Call It Off pressed on an appointment that's gone (a stale panel), which no test asserts word for word.
scene('Dublin: Call It Off on an appointment that isn’t booked', () => {
  const sim = life('ie-lei-dublin', 'h2-dublin-off');
  say(`  Call It Off: ${run(sim, 'health.cancel_appointment', { appointmentId: 'a-gone' })}`);
});

// Brief 15: Pay It Off with a medical debt and no checking account to pay from, which no test asserts word for word. The
// debt is put on the record as an unpaid bill posts it, and the primary account unset (TEST SETUP, this throwaway life).
scene('New Haven: Pay It Off with no checking account to pay from', () => {
  const sim = life('us-ct-newhaven', 'h2-nh-nochecking');
  const debt = sim.openAccount({ id: sim.nextId('account'), kind: 'loan', category: 'medical', name: 'Owed For Medical Care', ownerId: sim.player.id, institution: 'Your Providers', openedAt: sim.now } as never);
  sim.post({ memo: 'Medical bill unpaid: A doctor’s visit', category: 'health', postings: [{ accountId: debt.id, amount: -100_00 }, { accountId: sim.nominalAccount('expense', 'Medical Care').id, amount: 100_00 }] } as never);
  delete (sim.player as { primaryAccountId?: string }).primaryAccountId;
  say(`  Pay It Off: ${run(sim, 'health.pay_bill', { amount: 100_00 })}`);
  say(`  Pay It Off, nothing entered: ${run(sim, 'health.pay_bill', { amount: 0 })}`);
});

// Brief 15: a city's note, calibrated and derived, which no screen shows today but a city carries.
scene('A city’s note, calibrated (Los Angeles) and derived (the first derived city)', () => {
  say(`  Los Angeles: ${CITIES.get('us-ca-losangeles')?.note}`);
  const derived = CITIES.all().find((c) => c.confidence === 'low');
  say(`  ${derived?.name}: ${derived?.note}`);
});

scene('The city list for a country that can’t be loaded', () => {
  const real = globalThis.fetch;
  globalThis.fetch = (async () => ({ ok: false, status: 503 })) as never;
  loadCountryCities('is').then(() => say('  (loaded)'), (e: Error) => say(`  ${e.message}`)).finally(() => { globalThis.fetch = real; finish(); });
});

let done = false;
function finish(): void {
  if (done) return;
  done = true;
  writeFileSync(OUT, `${lines.join('\n')}\n`);
  console.log(`${lines.length} lines to ${OUT}`);
}
