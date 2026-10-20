/**
 * The health area's illness and injury sequences, written for brief 17 (2026-10-20): each read in the order a player
 * meets it, struck, seen, treated, mending and mended, with the bill that follows and what's refused while it lasts.
 * Printed from the game as it stands, so a before and an after can be set side by side (sequences-before.txt, then
 * sequences-after.txt).
 *
 *   npx vite-node docs/verification/continuity-2026-10-20/health/render-sequences.ts -- OUT.txt
 *
 * Each sequence is a throwaway life: a Yale student, whose care Yale Health pays whole, and a New Yorker outside the
 * School, who pays the uninsured price. The illness and the injury are brought on by the functions the week's draw and
 * a workout call (`careFor`, `mayHurt`, with the chance made certain), so the words are the game's own; the clock is then
 * moved through the days it lasts, as a player's meals and sleep keep the body. Nothing it does is saved.
 */
import { writeFileSync } from 'node:fs';
import { createSave, quickSave, type Simulation } from '../../../../src/engine';
import { newLifeConfig } from '../../../../src/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, formatDate } from '../../../../src/engine/core/time';
import { careFor, coverLabel, healthOf } from '../../../../src/engine/systems/health';
import { mayHurt, type InjurySource } from '../../../../src/engine/systems/injury';
import { book } from '../../../../src/engine/systems/appointments';
import { lookAfterRefusal } from '../../../../src/engine/systems/life';
import { sickRefusal } from '../../../../src/engine/systems/school';
import { INJURY_KIND, type InjuryKind } from '../../../../src/engine/content/injury';
import '../../../../src/ui/looks/all';
import { resolveLook, type Looked } from '../../../../src/ui/looks/registry';
import { at } from '../../../../src/ui/looks/subject';

const [OUT = 'sequences.txt'] = process.argv.slice(2).filter((a) => a !== '--');
const lines: string[] = [];
const say = (s: string) => lines.push(s);

const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' } as never);
const outsider = (seed: string, wealth = 'comfortable') => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth } as never, seed);

/** The clock moved six hours at a time with the body kept fed, rested and awake (TEST SETUP, as render-care.ts does). */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
/** Every notice since a moment, in the order it came. */
const since = (sim: Simulation, from: number) => sim.universe.notifications.filter((n) => n.at >= from && n.category === 'health');
function notices(sim: Simulation, from: number): void {
  for (const n of since(sim, from)) say(`  NOTICE ${formatDate(n.at, sim.zone)} | ${n.title} | ${n.body}`);
}
function refused(sim: Simulation, when: string): void {
  say(`  ${when}: Work Out: ${lookAfterRefusal(sim, 'exercise') ?? '(offered)'}`);
  if (sim.player.school) say(`  ${when}: Call In Sick: ${sickRefusal(sim, sim.player) ?? '(offered)'}`);
}
function look(sim: Simulation, kind: string, id: string, title: string): void {
  const found = resolveLook(sim, at(kind as never, id));
  if (!found) { say(`  LOOK ${title}: (no look)`); return; }
  if ('gone' in found) { say(`  LOOK ${title}: gone: ${(found as { gone: string }).gone}`); return; }
  const l = found as Looked;
  say(`  LOOK ${title}: ${l.name} | ${l.kind} | ${l.summary}`);
  for (const w of l.ways ?? []) say(`    way: ${w.label}: ${w.detail}`);
}
function scene(name: string, body: () => void): void {
  say(`\n===== ${name}`);
  try { body(); } catch (e) { say(`  (failed: ${(e as Error).message})`); }
}

/** The first draw of a kind from a source, the minute moved on until it comes (TEST SETUP: the injury cleared between). */
function hurtAs(sim: Simulation, kind: InjuryKind, sources: InjurySource[], work?: Parameters<typeof mayHurt>[5]) {
  for (const source of sources) {
    for (let k = 0; k < 400; k += 1) {
      const from = sim.universe.notifications.length;
      const drawn = mayHurt(sim, sim.player, source, 1, sim.now, work);
      if (drawn?.kind === kind) return drawn;
      // Not this kind: undone, its notice and any bill taken back (TEST SETUP), and the next minute's draw tried.
      healthOf(sim.player).injury = undefined;
      healthOf(sim.player).bills = healthOf(sim.player).bills.filter((b) => b.at !== sim.now);
      sim.universe.notifications.splice(from);
      sim.advanceTo(sim.now + 60_000);
    }
  }
  return undefined;
}

const SOURCES: Record<InjuryKind, InjurySource[]> = {
  strain: ['swim'], back: ['overexertion'], sprain: ['fall'], fracture: ['fall', 'usher'], concussion: ['struck', 'usher'], cut: ['cutting'], bruise: ['struck'],
};

// Every kind on a student, whose care Yale Health pays; a sprain and a broken bone on a New Yorker, who's billed, and a
// sprain on one with nothing in the bank, whose bill goes unpaid.
const HURTS: [InjuryKind, 'a student' | 'a New Yorker outside the School' | 'a New Yorker with nothing in the bank'][] = [
  ...(Object.keys(INJURY_KIND) as InjuryKind[]).map((k) => [k, 'a student'] as [InjuryKind, 'a student']),
  ['sprain', 'a New Yorker outside the School'], ['fracture', 'a New Yorker outside the School'], ['sprain', 'a New Yorker with nothing in the bank'],
];
for (const [kind, who] of HURTS) {
  {
    scene(`${INJURY_KIND[kind].label}, ${who}`, () => {
      const sim = who === 'a student' ? student(`b17-hurt-${kind}`) : outsider(`b17-hurt-${kind}-ny`, who.includes('nothing') ? 'scraping' : 'comfortable');
      say(`  cover: ${coverLabel(sim.player, sim.now) ?? 'none'}`);
      const from = sim.now;
      const hurt = hurtAs(sim, kind, SOURCES[kind]);
      if (!hurt) { say('  (not drawn)'); return; }
      notices(sim, from);
      look(sim, 'condition', 'injury', 'the injury');
      const person = resolveLook(sim, at('person', sim.universe.playerId)) as Looked;
      say(`  LOOK yourself, its way in: ${(person.ways ?? []).find((w) => w.label === 'An Injury')?.detail ?? '(none)'}`);
      refused(sim, 'struck');
      tended(sim, hurt.until - MS_DAY / 2);
      refused(sim, 'its last day');
      tended(sim, hurt.until + MS_DAY);
      refused(sim, 'mended');
      look(sim, 'condition', 'injury', 'the injury, mended');
      // The bill, where there is one, on its due date: emptied first for the New Yorker with nothing (TEST SETUP).
      const due = healthOf(sim.player).bills.find((b) => !b.paid)?.dueAt;
      if (due) {
        tended(sim, due - MS_HOUR);
        if (who.includes('nothing')) for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id) a.balance = 0; // TEST SETUP
        sim.advanceTo(due + MS_HOUR);
      }
      notices(sim, hurt.until);
      for (const b of healthOf(sim.player).bills) say(`  BILL ${b.what}: ${b.amount}, due ${formatDate(b.dueAt, sim.zone)}, ${b.paid ? 'paid' : b.inDebt ? 'in debt' : 'open'}`);
    });
  }
}

scene('Hurt at work: a work-study shift, a student', () => {
  const sim = student('b17-hurt-work');
  const from = sim.now;
  const hurt = hurtAs(sim, 'fracture', ['usher'], { cityId: 'us-ct-newhaven', weeklyWage: 437_00, noFica: true });
  if (!hurt) { say('  (not drawn)'); return; }
  notices(sim, from);
  look(sim, 'condition', 'injury', 'the injury');
});

const CARE_SEEN = [
  ['The flu, not seen', { care: 'visit', what: 'The flu', flu: true }, 'a student'],
  ['The flu, at urgent care', { care: 'urgent', what: 'The flu, at urgent care', flu: true }, 'a student'],
  ['The flu, at urgent care', { care: 'urgent', what: 'The flu, at urgent care', flu: true }, 'a New Yorker outside the School'],
  ['A doctor’s visit', { care: 'visit', what: 'A doctor’s visit' }, 'a student'],
  ['A doctor’s visit', { care: 'visit', what: 'A doctor’s visit' }, 'a New Yorker outside the School'],
  ['The emergency room', { care: 'emergency', what: 'The emergency room' }, 'a student'],
  ['The emergency room', { care: 'emergency', what: 'The emergency room' }, 'a New Yorker with nothing in the bank'],
  ['A stay in hospital', { care: 'stay', what: 'A stay in hospital' }, 'a student'],
  ['A stay in hospital', { care: 'stay', what: 'A stay in hospital' }, 'a New Yorker with nothing in the bank'],
] as const;
for (const [name, event, who] of CARE_SEEN) {
  {
    scene(`${name}, ${who}`, () => {
      const sim = who === 'a student' ? student(`b17-care-${event.care}`) : outsider(`b17-care-${event.care}-ny`, who.includes('nothing') ? 'scraping' : 'comfortable');
      say(`  cover: ${coverLabel(sim.player, sim.now) ?? 'none'}`);
      const from = sim.now;
      careFor(sim, sim.player, event as never, sim.now);
      notices(sim, from);
      refused(sim, 'that day');
      if (sim.player.health?.fluUntil) look(sim, 'person', sim.universe.playerId, 'yourself, ill');
      const h = healthOf(sim.player);
      const until = Math.max(h.fluUntil ?? 0, h.inHospitalUntil ?? 0);
      if (until > sim.now) { tended(sim, until + MS_DAY); refused(sim, 'after it'); }
      // The bill on its due date, the bank emptied first for the New Yorker with nothing (TEST SETUP).
      const due = h.bills.find((b) => !b.paid)?.dueAt;
      if (due) {
        tended(sim, due - MS_HOUR);
        if (who.includes('nothing')) for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id) a.balance = 0; // TEST SETUP
        sim.advanceTo(due + MS_HOUR);
      }
      notices(sim, from + MS_HOUR);
    });
  }
}

scene('A doctor’s visit booked and kept, a student', () => {
  const sim = student('b17-booked');
  const from = sim.now;
  const a = book(sim, sim.player, 'A doctor’s visit');
  if (!a) { say('  (nothing booked)'); return; }
  tended(sim, a.at + 2 * MS_HOUR);
  notices(sim, from);
});

scene('A doctor’s visit booked and missed (in hospital), a student', () => {
  const sim = student('b17-missed');
  const from = sim.now;
  const a = book(sim, sim.player, 'A doctor’s visit');
  if (!a) { say('  (nothing booked)'); return; }
  healthOf(sim.player).inHospitalUntil = a.at + MS_HOUR; // TEST SETUP
  tended(sim, a.at + 2 * MS_HOUR);
  notices(sim, from);
});

writeFileSync(OUT, `${lines.join('\n')}\n`);
console.log(`${lines.length} lines to ${OUT}`);
