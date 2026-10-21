/**
 * The saves the app part's walk opens (brief 19, V17, 2026-10-21): one life played from its first day at the School
 * through the last term, the Actor Showcase, the School's follow-up, an approach to the agent's office, a meeting, an
 * offer and an agreement, and on into the work: an audition, booked work, its work days and its pay. Each save is the
 * life at a moment a screen is worth reading, the clock paused (`world.set_preferences`).
 *
 *   npx vite-node docs/verification/career-2026-10-20/app/make-saves.ts -- OUTDIR [SEED ...]
 *
 * PLAYED: a new life (`createSave` with `newLifeConfig`, no guide), Ada Cole, born in New York, at Yale from August 24,
 * 2026. To the last term's first day the clock moves six hours at a time, as the showcase journey moves it
 * (`tests/pro-showcase.test.ts`); from then on every commitment is stopped at and gone to with Go, as the top bar's Go
 * carries a jump on (`answerStop`). Every step of the career is the player's own command: a camera brief taped, headshots,
 * a résumé and a reel; the agent's check and Send Your Materials; the meeting kept; the agreement accepted; the sides
 * and the part prepared, a self-tape taped, every open call the player can submit to submitted, and every offer
 * accepted. What the game draws (his office's answers, the postings, casting) is the game's.
 *
 * TEST SETUP, as the showcase journey's and said here: the body kept fed, rested and steady each time the clock moves;
 * every open piece of coursework prepared each midnight, the showcase's scenes among them. And the seed: the first of
 * those given whose life reaches each state, chosen by playing each in turn. Each save is written once, by the first
 * seed that reaches it, so a seed whose life stops partway ahead of one that goes on leaves the nine saves two lives:
 * the seed that reaches all nine goes first.
 *
 * The default list was `app-walk-102`, `app-walk-314`, `app-walk-93` and `app-walk-150` until 2026-10-21: the first
 * four of the prefix whose first approach to the real agent's office drew low enough to go to a meeting and an offer
 * (`draws.ts` in the scratchpad, as `../agent/make-saves.ts` chose its seed), with 102, whose life reached all nine,
 * first. That day the owner had a fictional agent, Thomas Ashgrove of Halberd Talent, take the real one's place
 * (`59da1351`), and his id is in the draws' keys (`rngFor(seed, 'pro.agent', person, agent.id, …)`), so the same seed
 * drew another story: 102's life, played again, was passed on May 25, 2029, with no meeting. `draws.ts`, run on
 * `59da1351`, listed `app-walk-71`, `112`, `156`, `311` and `374`; played one at a time, 71's office passed on May 25
 * and 112's life reached all nine with breaches none, and the defaults were the list's first four with 112 first. Later
 * that day the owner had each part written for an actor, an actress or either, and only one for the player or for
 * either posted to them (`9c3b7ee8`), so the parts each life was posted, and what came of them, changed again.
 * `draws.ts` listed the same five on `9c3b7ee8` (its draw reads only the seed and his id), and each was played by
 * itself: 71 was passed on May 25 again; 112, 156 and 311 reached all nine; 374's first offer came in May 2030 and no
 * work day before June. Run on from `app-walk-400`, it listed `473`, `564`, `611`, `621` and more; 473 was passed, 564
 * reached all nine, and 611's first work day came in May 2030 with no pay before June. The defaults were those four,
 * 112, 156, 311 and 564, until later that day, when two commitments whose trips meet couldn't both be gone to any more
 * and the film's part Theo became Felix (`a43b4f8f`), which changed the lives again. Played one at a time on
 * `a43b4f8f`, 71 was passed on May 25 again, and 112, 156, 311 and 374 each reached all nine with breaches none. The
 * defaults are those four, in that order (`make-saves.log`; the real agent's life is `make-saves-real-agent.log`).
 *
 * Writes, where the life reaches them:
 * - `last-term.json`: the last term's first day (January 8, 2029, noon): the showcase's scenes still to choose.
 * - `after-new-york.json`: the morning after New York's showcase days.
 * - `follow-up.json`: an hour after the School's follow-up.
 * - `meeting.json`: 8 AM on the day of the meeting at his office.
 * - `offered.json`: an hour after his office offered an agreement.
 * - `audition.json`: 7 AM on the day of the first audition in person.
 * - `offer.json`: an hour after the first offer of work.
 * - `work-day.json`: 5 AM on the first day of booked work.
 * - `paid.json`: the morning after the first pay received.
 * and prints every career notice in order, with what was done, to stdout.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createSave } from '../../../../src/engine';
import type { Simulation } from '../../../../src/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDateTime, instantFromZoned, zonedParts } from '../../../../src/engine/core/time';
import { newLifeConfig } from '../../../../src/engine/world/bootstrap';
import { serialise } from '../../../../src/engine/persistence/adapter';
import { answerStop } from '../../../../src/engine/world/clock';
import { breaches } from '../../../../src/engine/core/invariants';
import { courseworkOf } from '../../../../src/engine/systems/coursework';
import { PREP_DIMS } from '../../../../src/engine/content/coursework';
import { BRIEFS } from '../../../../src/engine/content/briefs';
import { AGENTS } from '../../../../src/engine/content/agents';
import { relationOf, meetingOf } from '../../../../src/engine/systems/proagent';
import { roundToCome } from '../../../../src/engine/systems/projobs';

const [OUT = '.', ...SEEDS] = process.argv.slice(2).filter((a) => a !== '--');
mkdirSync(OUT, { recursive: true });
const seeds = SEEDS.length ? SEEDS : ['app-walk-112', 'app-walk-156', 'app-walk-311', 'app-walk-374'];
const zone = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: 0 }, zone);
const AGENT = AGENTS[0]!;
const written = new Set<string>();

/** TEST SETUP: every open piece of coursework prepared each midnight, the showcase's scenes among them. */
function working(sim: Simulation): Simulation {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) {
      if (a.status !== 'open' && a.status !== 'revising') continue;
      for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
    }
  });
  return sim;
}
/** TEST SETUP: rested, fed and steady each time the clock moves. */
const tend = (sim: Simulation) => Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
const play = (sim: Simulation, until: number) => { while (sim.now < until) { tend(sim); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** As a player plays: each jump six hours at most, every commitment stopped at and gone to with Go. */
function jump(sim: Simulation, until: number): void {
  while (sim.now < until) {
    tend(sim);
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) {
      tend(sim);
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
}
const say = (sim: Simulation, s: string) => console.log(`${formatDateTime(sim.now, zone)}  ${s}`);
function act(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): boolean {
  const r = sim.execute({ kind, payload });
  say(sim, `${kind} ${JSON.stringify(payload)}: ${r.ok ? 'done' : `refused: ${r.error}`}`);
  return r.ok;
}
function write(sim: Simulation, name: string, seed: string): void {
  if (written.has(name)) return;
  const copy = JSON.parse(serialise(sim.universe));
  copy.preferences.timeSpeed = 'paused';
  writeFileSync(`${OUT}/${name}`, JSON.stringify(copy));
  written.add(name);
  const b = breaches(sim.universe, sim.now);
  say(sim, `WROTE ${name} (seed ${seed}); breaches ${b.length ? JSON.stringify(b).slice(0, 300) : 'none'}`);
}
// The notices printed already, by id: the game keeps its last 500, so a count of them stops moving once it's full.
const seenNotices = new Set<string>();
function notices(sim: Simulation): void {
  for (const n of sim.universe.notifications) {
    if (seenNotices.has(n.id)) continue;
    seenNotices.add(n.id);
    if (n.category === 'career' || /Showcase|Equity|SAG|Commencement|MFA/.test(n.title)) console.log(`    NOTICE ${formatDateTime(n.at, zone)} [${n.category}] ${n.title}: ${n.body}`);
  }
}
/** The next morning at an hour, a Saturday where `weekend`. */
function next(sim: Simulation, hour: number, weekend = false): number {
  let d = at(zonedParts(sim.now, zone).year, zonedParts(sim.now, zone).month, zonedParts(sim.now, zone).day, hour);
  if (d <= sim.now) d += MS_DAY;
  while (weekend && zonedParts(d, zone).weekday !== 6) d += MS_DAY;
  return d;
}

for (const seed of seeds) {
  if (written.size >= 9) break;
  console.log(`\n=========== ${seed}`);
  const sim = working(createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' }));
  play(sim, at(2029, 1, 8, 12));
  for (const n of sim.universe.notifications) seenNotices.add(n.id);
  write(sim, 'last-term.json', seed);
  // The portfolio, on the first Saturday of the term: a camera brief prepared and taped, headshots, a résumé and a reel.
  jump(sim, next(sim, 10, true));
  const brief = BRIEFS.find((b) => b.medium === 'camera')!;
  act(sim, 'brief.choose', { brief: brief.id, reading: brief.readings[0]!.id });
  for (const step of ['read', 'lines', 'rehearse', 'lines', 'rehearse']) act(sim, 'brief.prepare', { brief: brief.id, step });
  act(sim, 'practice.self_tape', { genre: brief.kinds[0], brief: brief.id });
  // Headshots at ten on the next morning a session can be had: a School call that runs on can take a Saturday.
  for (let n = 0; n < 21 && !act(sim, 'pro.headshots'); n += 1) jump(sim, next(sim, 10));
  act(sim, 'pro.update_resume');
  const take = sim.player.briefs?.[brief.id]?.takes.at(-1);
  if (take) act(sim, 'pro.cut_reel', { pieces: [`tape:${brief.id}:${take.at}`] });
  notices(sim);
  jump(sim, at(2029, 5, 2, 9));
  notices(sim);
  write(sim, 'after-new-york.json', seed);
  // To the School's follow-up and an hour after it.
  for (let d = sim.now; d < at(2029, 6, 1) && !sim.player.pro?.showcase?.followUp; d += 6 * MS_HOUR) jump(sim, d);
  if (!sim.player.pro?.showcase?.followUp) { say(sim, 'no follow-up came'); continue; }
  jump(sim, sim.now + MS_HOUR);
  notices(sim);
  write(sim, 'follow-up.json', seed);
  act(sim, 'pro.agent_check');
  act(sim, 'pro.send_materials');
  // His office's answer, a meeting, the decision and an offer: whatever the game draws.
  let offered = false;
  for (let d = sim.now; d < at(2029, 9, 1) && !offered; d += 6 * MS_HOUR) {
    const rel = relationOf(sim.player, AGENT.id);
    const m = meetingOf(sim, sim.player, AGENT);
    if (m?.item && !written.has('meeting.json')) {
      const morning = at(zonedParts(m.item.at, zone).year, zonedParts(m.item.at, zone).month, zonedParts(m.item.at, zone).day, 8);
      if (sim.now < morning) { jump(sim, morning); notices(sim); write(sim, 'meeting.json', seed); }
    }
    if (rel?.stage === 'offered') { offered = true; break; }
    if (rel && ['passed', 'unanswered', 'declined', 'ended'].includes(rel.stage)) break;
    jump(sim, d);
    notices(sim);
  }
  if (!offered) { say(sim, `no offer: ${relationOf(sim.player, AGENT.id)?.stage}`); continue; }
  jump(sim, sim.now + MS_HOUR);
  notices(sim);
  write(sim, 'offered.json', seed);
  act(sim, 'pro.accept_agreement');
  // The work: every open call submitted, every round prepared and gone to, every offer accepted, until paid.
  for (let d = sim.now; d < at(2030, 6, 1) && !written.has('paid.json'); d += 6 * MS_HOUR) {
    const pro = sim.player.pro!;
    for (const o of pro.opportunities) {
      if (o.status === 'open' && o.via === 'open' && sim.now < o.submitBy) {
        const r = sim.execute({ kind: 'pro.submit', payload: { opportunityId: o.id } });
        if (r.ok) say(sim, `pro.submit ${o.projectId}: done`);
      }
      const round = (o.status === 'audition' || o.status === 'callback') ? roundToCome(o) : undefined;
      if (round) {
        const hour = zonedParts(sim.now, zone).hour;
        if (hour >= 10 && hour < 20) for (const step of ['read', 'lines', 'rehearse']) sim.execute({ kind: 'pro.prepare', payload: { opportunityId: o.id, step } });
        if (round.form === 'self-tape' && round.at - sim.now < 30 * MS_HOUR) act(sim, 'pro.tape_audition', { opportunityId: o.id });
        if (round.form === 'in-person' && !written.has('audition.json')) {
          const morning = at(zonedParts(round.at, zone).year, zonedParts(round.at, zone).month, zonedParts(round.at, zone).day, 7);
          if (sim.now < morning && morning - sim.now <= 8 * MS_HOUR) { jump(sim, morning); notices(sim); write(sim, 'audition.json', seed); }
        }
      }
      if (o.status === 'offered') {
        jump(sim, sim.now + MS_HOUR);
        notices(sim);
        write(sim, 'offer.json', seed);
        act(sim, 'pro.accept_offer', { opportunityId: o.id });
      }
    }
    for (const e of pro.engagements) {
      if (e.status === 'finished' || e.status === 'canceled') continue;
      const hour = zonedParts(sim.now, zone).hour;
      if (hour >= 10 && hour < 20 && e.status !== 'working') for (const step of ['read', 'lines', 'rehearse']) sim.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step } });
      const first = e.days.find((x) => x.from > sim.now);
      if (first && !written.has('work-day.json') && e.status === 'booked') {
        const early = first.from - 2 * MS_HOUR;
        if (sim.now < early && early - sim.now <= 8 * MS_HOUR) { jump(sim, early); notices(sim); write(sim, 'work-day.json', seed); }
      }
    }
    if (pro.engagements.some((e) => e.pay.some((p) => p.received))) {
      jump(sim, next(sim, 9));
      notices(sim);
      write(sim, 'paid.json', seed);
      break;
    }
    jump(sim, d);
    notices(sim);
  }
  say(sim, `ended: ${[...written].join(', ')}`);
}
console.log(`\nWritten: ${[...written].join(', ')}`);
