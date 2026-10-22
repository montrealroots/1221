/**
 * The productions guide's worked examples, played (from 2026-10-12; `src/engine/content/guide/productions.ts`).
 *
 * The connected-journey map (docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md §5) promised that every worked
 * example runs on a throwaway save that's never handed to an adapter, and that its figures are checked. Each example
 * here is played on a save made for it (`createSave`), through the commands its steps name (`sim.execute`), and its
 * figures are read back from the entry's own rendered text (`GUIDE_BY_ID`): what the engine then holds is written the way
 * the example writes it, and the example has to say it. So a figure that drifts between the text and the engine fails
 * here, whichever side moved. Anything set by hand that the engine doesn't reach by a command is marked TEST SETUP.
 *
 * Played:
 * - Casting: the chair's own order (`partsFor`, `castScore`) on the example's two reads, each read worked again from its
 *   step's own words; and a real first casting's Why This Cast rows. Nobody has a last part at a first casting (every
 *   row's Delivered was 100% and its Balance 0, measured on 2026-10-12), so those rows check the order and the fit, and
 *   the delivery and the balance are checked by the steps' words alone.
 * - Learning A Part: the Carlotta's calls as booked, three kept, the fourth missed away in New York, then Catch Up The
 *   Blocking and Learn The Part that afternoon; on to the sixth call, where the first note comes. And the off-book call
 *   as the engine's own note reads it (`noteFor`).
 * - The Director's Notes: a craft note on tiring, worked by Find Places To Breathe and kept, Taken at the next call, and
 *   that call's growth against a twin whose note isn't taken; and a twin that leaves the note unworked, Not Taken at the
 *   same call. Measured on 2026-10-12, the note on tiring comes at the second work-through: the first is "It sags in the
 *   second half", the second half's own gap being the larger, and the next call counts it Taken unworked. The note's own
 *   share of preparation, not yet taken when the call reads the forecast (`addressed`, `systems/production.ts`), holds
 *   the forecast at 55.6 against 97.4, and the gap it named falls under `WORKBOOK.segmentGap` and leaves the problems.
 *   The note on tiring isn't Taken that way: by its next call the first note counts as taken and the stamina problem is
 *   still in the forecast (at 97.4, measured by the verifier's pass of 2026-10-12 with the craft left full), so unworked
 *   it settles Not Taken. Until that pass this said Taken alone would be Taken without the work too, which held only for
 *   the first note.
 * - How You'll Play A Part: Driven chosen after the read-through, Measured after the eighth call, the opening's figure,
 *   and every night of the run reading what Measured leans on short of preparation; and a twin kept on Driven, which
 *   comes to every call and does nothing more.
 * - The Nights: a night of Woyzeck at the Carlotta's first curtain, its movements, its tiring, the company and the morale
 *   the night together leaves; a twin whose own night is Strong and whose night together isn't, which leaves morale
 *   where it was; a slip of the example's size found among the evening's draws, and the shake it carries at the
 *   engine's own precision.
 * - Cabaret And Summer Cabaret: Join The Summer Company in the spring of 2027, its calendar and its stipends, and the
 *   first performance missed; and the date it's asked by, joined on it and refused the day after.
 * - Plays To Read: Read It, Research It, and Read It Again a week later.
 *
 * Not run, and why:
 * - Casting's "next term the chair reads the part you play now": it needs a run played and the next term's casting,
 *   months of play. The ordering it would read is the one played here.
 * - The Nights' thesis that deals Woyzeck: a directors' thesis casts from the second year, a year of play away, so the
 *   play is set on the first spring's part instead (TEST SETUP). The slip is the evening's own draw, so it's found among
 *   the draws, not caused.
 *
 * And one test that every entry's example has a play here (from the verifier's pass of 2026-10-12: until then an eighth
 * entry would have failed nothing), and one that the examples leave a live save as it was (the map's isolation), byte
 * for byte.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts, type Instant } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { formatMoney } from '@/engine/core/money';
import { serialise } from '@/engine/persistence/adapter';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { PRODUCTIONS } from '@/engine/content/guide/productions';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { APPROACH_EFFECT, PLAYING } from '@/engine/content/approaches';
import { ADJUSTMENTS } from '@/engine/content/workbook';
import { SUMMER_CABARET } from '@/engine/content/school';
import {
  BONDS, CALL_KIND, ESTIMATE, STIPEND_KIND, SUMMER_KIND, castCompany, castScore, companyRead, evenCraft, focusAt, mateAbilities, nightBand, nightEvaluation,
  nightTogether, partsFor, playPiece,
} from '@/engine/systems/school';
import { completeFor, noteFor, processOf, type Process } from '@/engine/systems/production';
import { workPiece } from '@/engine/systems/workpieces';
import { abilityFull, attributesOf } from '@/engine/systems/attributes';
import { readiness } from '@/engine/systems/life';
import { replay, type Evaluation } from '@/engine/systems/evaluation';
import { drainOf, eveningCost, segmentShares } from '@/engine/systems/workload';
import { PLAYREADING } from '@/engine/systems/playreading';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { genresOfPlay } from '@/engine/content/plays';
import { genreState } from '@/engine/systems/engagement';
import { ENGAGEMENT } from '@/engine/content/engagement';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);

// How the examples write a figure: the same as `content/guide/productions.ts` writes it.
const pct = (x: number) => `${Math.round(x * 100)}%`;
const one = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const ORDINAL = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const word = (n: number) => WORDS[n] ?? String(n);
const dated = (t: Instant, year = true) => { const z = zonedParts(t, zone); return `${MONTHS[z.month - 1]} ${z.day}${year ? `, ${z.year}` : ''}`; };
const example = (id: string) => GUIDE_BY_ID[id]!.example;
/** A number the example states, by the words around it. */
const stated = (text: string, re: RegExp): number => { const m = re.exec(text); expect(m, `${re} in “${text}”`).not.toBeNull(); return Number(m![1]); };

/** A first-year's life, made here and never saved. */
const firstYear = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** Time passing with the day looked after, as the journeys play it (TEST SETUP: the dials a life keeps by its own commands). */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};

/** TEST SETUP: the day's dials at a readiness of exactly `target`, the energy found for it. */
function readyAt(sim: Simulation, target: number): void {
  const w = sim.player.wellbeing;
  Object.assign(w, { stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
  let lo = 0, hi = 100;
  for (let k = 0; k < 60; k += 1) { w.energy = (lo + hi) / 2; if (readiness(sim.player) < target) lo = w.energy; else hi = w.energy; }
  expect(readiness(sim.player)).toBeCloseTo(target, 6);
}

/** TEST SETUP: every ability and technique full, the body's stamina at a share of full. */
function mastered(sim: Simulation, stamina = 1): void {
  const p = sim.player;
  for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 100;
  const a = attributesOf(sim, p) as unknown as Record<string, number>;
  for (const k of Object.keys(a)) a[k] = 100;
  p.wellbeing.fitness = abilityFull(sim, p, 'stamina') * stamina;
}

/** The first spring's Carlotta, as the calendar books it: a first-year's save on the day the cast list goes up. */
function carlotta(seed: string) {
  const sim = firstYear(seed);
  sim.advanceTo(at(2027, 1, 4) + 60_000);
  const ours = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
  const casting = () => sim.player.school!.casting!;
  return { sim, casting, proc: () => processOf(casting()), calls: ours.filter((c) => c.payload.call === 'rehearsal'), nights: ours.filter((c) => c.payload.call === 'performance') };
}

/** A copy of a save to play a road not taken (TEST SETUP: the engine's own load, never the persistence adapter). */
const twin = (sim: Simulation) => loadSave(structuredClone(sim.universe));

// ---------------------------------------------------------------------------------------------------------------------

const PLAY: Record<string, () => void> = {
  'productions.casting': () => {
    const ex = example('productions.casting');
    const C = ESTIMATE.casting;
    const size = { lead: 'lead', 'featured part': 'featured', 'supporting part': 'supporting' } as const;
    const mine = /You read with a fit of (\d+), after a (lead|featured part|supporting part) last time, (\d+)% delivered/.exec(ex.setup);
    const theirs = /a classmate reads (\d+), after a (lead|featured part|supporting part), keeping (\d+)% of their calls/.exec(ex.setup);
    expect(mine && theirs).toBeTruthy();
    // TEST SETUP: the two reads the example gives, a fit each and the last part's size and delivery.
    const you = { i: -1, name: 'You', craft: evenCraft(50), title: 'actress' as const, last: { size: size[mine![2] as keyof typeof size], delivery: Number(mine![3]) / 100 } };
    const mate = { i: 0, name: 'A Classmate', craft: evenCraft(50), title: 'actor' as const, last: { size: size[theirs![2] as keyof typeof size], delivery: Number(theirs![3]) / 100 } };
    const fit = (s: { i: number }) => (s.i < 0 ? Number(mine![1]) : Number(theirs![1]));
    const yourRead = castScore({ ...you, fit: fit(you) }, {});
    const mateRead = castScore({ ...mate, fit: fit(mate) }, {});
    expect(ex.steps[0]).toContain(`${pct(C.delivery)} of it scaled by ${mine![3]}%, then ${C.balance[you.last.size]} for the lead: ${one(yourRead)}.`);
    expect(ex.steps[1]).toContain(`then +${C.balance[mate.last.size]} for the featured part: ${one(mateRead)}.`);
    // Each read worked again from its step's own words: the fit, the share of it scaled by the delivery, the balance. The
    // step's figure is the engine's read above, and has to be the arithmetic its words give too, so a read the engine
    // works another way (the delivery squared: 57.6 under the same words) fails here. Until the verifier's pass of
    // 2026-10-12 the figure was checked against `castScore` alone, which the text is built from.
    for (const [step, read] of [[ex.steps[0]!, mine!], [ex.steps[1]!, theirs!]] as const) {
      const w = /(\d+) with (\d+)% of it scaled by (\d+)%, then ([+-]?\d+) for the [a-z ]+: (\d+\.\d)\./.exec(step);
      expect(w, step).not.toBeNull();
      const [f, share, delivered, balance] = w!.slice(1, 5).map(Number) as [number, number, number, number];
      expect([f, delivered]).toEqual([Number(read[1]), Number(read[3])]);
      expect(one(f * (1 - share / 100 + (share / 100) * (delivered / 100)) + balance)).toBe(w![5]);
    }
    // The chair's own order: the best read takes the biggest part still open that's written for them.
    const parts = [{ name: 'The Lead', size: 'lead' as const, for: 'either' as const }, { name: 'The Second Part', size: 'supporting' as const, for: 'either' as const }];
    const given = partsFor([you, mate], parts, {}, fit);
    expect(given[0]!.s.name).toBe(mateRead > yourRead ? 'A Classmate' : 'You');
    expect(given.find((g) => g.part === 'The Lead')!.s.name).toBe(mateRead > yourRead ? 'A Classmate' : 'You');
    expect(ex.result).toContain(mateRead > yourRead ? `The classmate is read first, ${one(mateRead)} to your ${one(yourRead)}, and takes the lead` : `You’re read first, ${one(yourRead)} to their ${one(mateRead)}, and take the lead`);
    expect(given.find((g) => g.s.i < 0)!.part).toBe(mateRead > yourRead ? 'The Second Part' : 'The Lead');

    // A real casting's Why This Cast: both of you among its rows, best read first, each read the example's way. At a
    // first casting nobody has a last part (measured on 2026-10-12, every row Delivered 100% and Balance 0), so the rows
    // check the order and the fit; the delivery and the balance are the steps' words above.
    const { sim } = carlotta('guide-productions-casting');
    const rows = sim.player.school!.castRead!.rows;
    expect(rows.some((r) => r.you) && rows.some((r) => !r.you)).toBe(true);
    for (let k = 1; k < rows.length; k += 1) expect(rows[k - 1]!.score).toBeGreaterThanOrEqual(rows[k]!.score);
    for (const r of rows) expect(Math.abs(r.score - (r.fit * (1 - C.delivery + C.delivery * r.delivery) + r.balance))).toBeLessThanOrEqual(0.15);
  },

  'productions.part': () => {
    const ex = example('productions.part');
    const { sim, proc, calls } = carlotta('guide-productions-part');
    const stages = calls.map((c) => String(c.payload.stage));
    const count = (s: string) => stages.filter((x) => x === s).length;
    expect(ex.setup).toContain(`${calls.length} calls from ${dated(calls[0]!.at, false)} to ${dated(calls.at(-1)!.at)}, the read-through, ${word(count('blocking'))} blocking calls, ${word(count('work'))} rehearsals, and the technical and dress rehearsals`);
    expect([stages[0], stages.at(-2), stages.at(-1)]).toEqual(['read', 'tech', 'dress']);

    // The read-through and the first two blocking calls.
    tended(sim, calls[2]!.at + 7 * MS_HOUR);
    expect(proc().calls).toBe(3);
    expect(ex.steps[0]).toContain(`the lines stand at ${pct(proc().lines)}, the blocking at ${pct(proc().blocking)}`);

    // The third blocking call missed, unexcused: TEST SETUP, a day in New York over it.
    tended(sim, calls[3]!.at - MS_HOUR);
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(calls[3]!.at + 60_000);
    expect(calls[3]!.payload.stage).toBe('blocking');
    expect(calls[3]!.status).toBe('missed');
    expect(sim.player.school!.sickDay).toBeUndefined();
    expect(ex.steps[1]).toContain(`Blocking shows ${proc().blockingMissed} Missed To Catch Up`);

    // That afternoon, back in New Haven (TEST SETUP), before five and at the readiness the example gives.
    sim.player.currentLocationId = 'us-ct-newhaven';
    const ready = stated(ex.steps[2]!, /at a readiness of (\d+)/);
    readyAt(sim, ready);
    expect(sim.execute({ kind: 'school.review_blocking', payload: {} }).ok).toBe(true);
    readyAt(sim, ready);
    expect(zonedParts(sim.now, zone).hour).toBeLessThan(17);
    expect(focusAt(sim, sim.player, sim.now)).toBeCloseTo(1, 6);
    // TEST SETUP (from 2026-10-16): memory at the example's 50, where it speeds learning lines by exactly 1 (`stepSpeed`).
    expect(ex.steps[2]).toContain('your memory at 50');
    sim.player.craft!.memorization = 50;
    expect(sim.execute({ kind: 'school.learn_part', payload: {} }).ok).toBe(true);
    expect(proc().blockingMissed).toBe(0);
    expect(ex.result).toContain(`The blocking goes to ${pct(proc().blocking)} and the gap is closed; the lines go to ${pct(proc().lines)}`);
    const par = completeFor(sim.player.school!.casting)!;
    expect(ex.result).toContain(`Coming to every call and no more would have the lines at ${pct(par.lines)} and the blocking at ${pct(par.blocking)} by the opening`);

    // On to the first note: none at the fifth call, the off-book note at the sixth.
    const firstNote = ORDINAL.indexOf(/first note comes at the (\w+)\./.exec(ex.setup)![1]!);
    const offBook = ORDINAL.indexOf(/off book from the (\w+) call/.exec(ex.setup)![1]!);
    // The off-book call as the engine's own note reads it (`noteFor`): the first call whose note, with the lines short
    // and the blocking set, is on the lines. Each call carries its place in the run, the place the note reads. Until the
    // verifier's pass of 2026-10-12 the call was only bounded, no later than the first note's, below.
    expect(calls.map((c) => [c.payload.n, c.payload.of])).toEqual(calls.map((_, i) => [i + 1, calls.length]));
    const short: Process = { lines: 0, blocking: 1, calls: 0, blockingMissed: 0, notes: [], trained: 0, of: calls.length };
    expect(calls.findIndex((_, i) => noteFor(sim.player, short, {}, i + 1, calls.length).kind === 'lines') + 1).toBe(offBook);
    let given = 0;
    for (let k = 4; k < calls.length && !given; k += 1) { tended(sim, calls[k]!.at + 7 * MS_HOUR); if (proc().notes.length) given = k + 1; }
    expect(given).toBe(firstNote);
    // The lines short of off book at that call, past the call they're asked from: the note is theirs.
    expect(given).toBeGreaterThanOrEqual(offBook);
    expect(proc().notes[0]!.focus.kind).toBe('lines');
    // The guide's quote, in the Carlotta's director's own voice (from 2026-10-20, brief 17: until then every director's words were the same).
    expect(proc().notes[0]!.text).toMatch(/^(?:Be off book|The lines aren’t there yet|Get off book)/);
    expect(GUIDE_BY_ID['productions.part']!.interpret.join(' ')).toContain(`“${proc().notes[0]!.text}”`);
  },

  'productions.notes': () => {
    const ex = example('productions.notes');
    const { sim, proc, calls, casting } = carlotta('guide-productions-notes');
    // TEST SETUP: an actor at full abilities but for stamina, at the half the example gives, so tiring is what the
    // part's forecast shows.
    expect(ex.setup).toContain('at stamina half of full');
    // As a lead, rested at readiness 100, as the example gives it (from 2026-10-16, brief 10: a night's drain reads its
    // part's share of the evening and the day at the curtain since). TEST SETUP: the part's size set to a lead.
    expect(ex.setup).toContain('as a lead');
    expect(ex.setup).toContain('at readiness 100');
    casting().size = 'lead';
    const setUp = () => mastered(sim, 0.5);
    setUp();
    tended(sim, calls[4]!.at + 7 * MS_HOUR);
    // TEST SETUP: off book and with the blocking set, as the example begins.
    Object.assign(proc(), { lines: 1, blocking: 1, blockingMissed: 0 });
    const said = /says “([^”]+)”/.exec(ex.setup)![1]!;
    let k = 5;
    for (; k < calls.length - 2; k += 1) {
      setUp();
      tended(sim, calls[k]!.at + 7 * MS_HOUR);
      const last = proc().notes.at(-1);
      if (last?.focus.kind === 'craft' && last.focus.problem === 'stamina') break;
    }
    const note = proc().notes.at(-1)!;
    expect(calls[k]!.payload.stage).toBe('work');
    expect(note.text).toContain(said);
    const piece = workPiece(sim, sim.player, 'part:school')!;
    // A new play judged in its two halves.
    const labels = piece.forecast().piece!.segments.map((s) => s.label);
    expect(labels).toEqual(['The First Half', 'The Second Half']);
    expect(said).toContain(labels[1]!.toLowerCase());
    const before = { drain: piece.forecast().piece!.segments.at(-1)!.drain, load: piece.spec().load, share: segmentShares(piece.spec().night!, piece.spec().segments).at(-1)!, readiness: piece.forecast().inputs.condition.readiness };
    // The road not taken: the note left unworked, played to the same call below (TEST SETUP: the engine's own load).
    const unworked = twin(sim);
    const leftAlone = processOf(unworked.player.school!.casting!).notes.at(-1)!;

    // The way the step names, by its label.
    const label = /choose ([A-Z][\w ]+)\./.exec(ex.steps[0]!)![1]!;
    const way = Object.values(ADJUSTMENTS).find((a) => a.label === label)!.id;
    expect(ex.steps[1]).toContain(`Press Work On The Note: ${label}.`);
    const t0 = sim.now;
    const worked = sim.execute<{ before: number; after: number; pending: boolean }>({ kind: 'school.work_note', payload: { solution: way } });
    expect(worked.ok, worked.error).toBe(true);
    expect(ex.steps[1]).toContain(`It takes ${(sim.now - t0) / 60_000} minutes`);
    // The toast's figures: the second half's, before and after.
    expect(worked.value!.after).toBeGreaterThan(worked.value!.before);
    expect(worked.value!.pending).toBe(true);
    expect(sim.execute({ kind: 'work.settle', payload: { piece: 'part:school', keep: true } }).ok).toBe(true);
    const after = { drain: piece.forecast().piece!.segments.at(-1)!.drain, load: piece.spec().load };
    // The example's figures at readiness 100, from the part's own workload, before and after; and the forecast's own drain
    // the same rule at the readiness it read (from 2026-10-16, brief 10: until then the forecast's figure was the example's,
    // since a night's drain read no condition).
    const half = (spec: ReturnType<typeof piece.spec>) => segmentShares(spec.night!, spec.segments).at(-1)!;
    const forecastAt = (f: Evaluation) => f.inputs.condition.readiness;
    const shares = { before: before.share, after: half(piece.spec()) };
    expect(before.drain).toBeCloseTo(1 - drainOf(shares.before, 0.5, before.readiness), 3);
    expect(after.drain).toBeCloseTo(1 - drainOf(shares.after, 0.5, forecastAt(piece.forecast())), 3);
    expect(ex.result).toContain(`Tiring took ${pct(drainOf(shares.before, 0.5, 100))} off what it reaches in the second half; now it takes ${pct(drainOf(shares.after, 0.5, 100))}, as places to breathe leave ${pct(after.load / before.load)} of the evening’s load on stamina`);

    // The next call: Taken, its figure beside it. And its growth against a twin whose note isn't taken (TEST SETUP: the
    // craft set where a call grows it, the same in both, and the twin's note marked not taken).
    const next = calls[k + 1]!;
    tended(sim, next.at - MS_HOUR);
    sim.player.craft!.scene = 50;
    const other = twin(sim);
    processOf(other.player.school!.casting!).notes.at(-1)!.taken = false;
    const grown = (s: Simulation) => { const from = s.player.craft!.scene; s.advanceTo(next.at + 60_000); return s.player.craft!.scene - from; };
    const taken = grown(sim);
    const untaken = grown(other);
    expect(note.taken).toBe(true);
    // Left unworked, the same call settles it Not Taken: the stamina problem is still in the forecast, so Taken here is
    // the work's.
    tended(unworked, next.at - MS_HOUR);
    unworked.player.craft!.scene = 50;
    unworked.advanceTo(next.at + 60_000);
    expect(leftAlone.focus).toMatchObject({ kind: 'craft', problem: 'stamina' });
    expect(leftAlone.taken).toBe(false);
    expect(note.answer).toMatchObject({ solution: way, before: worked.value!.before, after: worked.value!.after });
    expect(note.answer?.now).toBeDefined();
    expect(proc().book!.tries.at(-1)).toMatchObject({ adjustment: way, verdict: 'kept' });
    expect(ex.result).toContain('At the next call the note shows Taken, its figure kept beside it');
    expect(ex.result).toContain(`that call grows you ${pct(taken / untaken - 1)} more`);
  },

  'productions.playing': () => {
    const ex = example('productions.playing');
    const { sim, proc, calls, nights } = carlotta('guide-productions-playing');
    expect(ex.setup).toContain(`${calls.length} calls in all, the director asking for nothing`);
    // TEST SETUP: the director asks for nothing (the engine draws a request for half of productions).
    proc().direction = {};
    tended(sim, calls[0]!.at + 7 * MS_HOUR);
    const prep = () => proc().playing?.prep ?? 0;
    expect(ex.steps[0]).toContain('choose Driven');
    expect(sim.execute({ kind: 'school.choose_part_playing', payload: { pace: 'driven' } }).ok).toBe(true);
    const switchAt = ORDINAL.indexOf(/After the (\w+) call, change to Measured/.exec(ex.steps[1]!)![1]!);
    tended(sim, calls[switchAt - 1]!.at + 7 * MS_HOUR);
    expect(proc().calls).toBe(switchAt);
    const was = prep();
    // The road not taken: kept on Driven, and nothing more done than coming to every call.
    const kept = twin(sim);
    expect(sim.execute({ kind: 'school.choose_part_playing', payload: { pace: 'measured' } }).ok).toBe(true);
    expect(ex.steps[1]).toContain(`the ${pct(was)} already rehearsed keeps ${pct(PLAYING.keptOnChange)}, ${pct(prep())}`);
    expect(ex.steps[2]).toContain(`The ${word(calls.length - switchAt)} calls left rehearse it`);
    tended(sim, calls.at(-1)!.at + 7 * MS_HOUR);
    expect(proc().calls).toBe(calls.length);
    expect(proc().playing?.pace).toBe('measured');
    expect(ex.result).toContain(`By the opening Measured stands at ${pct(prep())}, ${prep() < PLAYING.complete ? `short of the ${pct(PLAYING.complete)} that completes it` : 'complete'}`);
    const keptCalls = kept.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.call === 'rehearsal' && i.payload.which !== 'rep');
    tended(kept, Math.max(...keptCalls.map((c) => c.at)) + 7 * MS_HOUR);
    const keptProc = processOf(kept.player.school!.casting!);
    expect(keptProc.playing?.pace).toBe('driven');
    expect(ex.result).toContain(`Kept on Driven, the ${calls.length - 1} calls after the read-through would have taken it to ${pct(keptProc.playing!.prep)}`);
    // And what coming to every call and no more makes of the part, as Learning A Part's example says it.
    expect(example('productions.part').result).toContain(`the lines at ${pct(keptProc.lines)} and the blocking at ${pct(keptProc.blocking)} by the opening`);

    // So every night of the run reads what Measured leans on short of preparation: the choice short of complete, read
    // as a part of preparation in each dimension it leans on (`materialContext`), and a limit on each. Until the
    // verifier's pass of 2026-10-12 no night was played here, and the sentence was neither checked nor listed as not run.
    expect(ex.result).toContain('so every night counts what it favors as short of preparation');
    tended(sim, nights.at(-1)!.at + 7 * MS_HOUR);
    const played = (sim.player.work ?? []).filter((w) => nights.some((n) => n.at === w.at));
    expect(played).toHaveLength(nights.length);
    for (const w of played) {
      expect(w.inputs.required.approach).toBe(PLAYING.complete);
      expect(w.inputs.prep.approach).toBeLessThan(PLAYING.complete);
      const limits = replay(w, TASK_PROFILES.performance!)!.limits;
      for (const d of Object.keys(APPROACH_EFFECT.measured.lean)) expect(limits.some((l) => l.kind === 'preparation' && l.what === 'approach' && l.dimension === d), d).toBe(true);
    }
  },

  'productions.nights': () => {
    const ex = example('productions.nights');
    const title = /A part in ([^,]+), if a thesis deals it to you/.exec(ex.setup)![1]!;
    const stamina = /Your stamina is at half of full/.test(ex.setup) ? 0.5 : NaN;
    const recover = stated(ex.setup, /composure and adaptability at (\d+)%/) / 100;
    const keeps = stated(ex.steps[2]!, /keep (\d+)% of their calls/) / 100;
    const timing = stated(ex.steps[2]!, /with a timing of (\d+)%/) / 100;

    // A night of it, played at the first spring's first curtain. TEST SETUP: the part set to the play a thesis would
    // deal, an actor full but for the stamina, composure and adaptability the example gives, the part complete, and the
    // classmates in the cast keeping the calls and with the timing it gives (timing is half and half their listening and
    // focus, `companyRead`).
    const { sim, casting, proc, nights } = carlotta('guide-productions-nights');
    tended(sim, nights[0]!.at - MS_HOUR);
    const run = casting();
    run.play = title;
    // A lead, as the example gives it (from 2026-10-16, brief 10: a night's workload reads the part). TEST SETUP.
    expect(ex.setup).toContain(', a lead:');
    run.size = 'lead';
    mastered(sim, stamina);
    const a = attributesOf(sim, sim.player);
    a.composure = recover * 100;
    a.adaptability = recover * 100;
    Object.assign(proc(), { lines: 1, blocking: 1, blockingMissed: 0 });
    for (const n of proc().notes) n.taken = true;
    // And the play's genres known to what completes them, the rest of a complete part from brief 21 (2026-10-22), when a
    // night came to read them (`genrePart`). TEST SETUP.
    for (const g of genresOfPlay(title) ?? []) genreState(sim.player, g).familiarity = 100 * ENGAGEMENT.genreComplete;
    const mates = sim.player.school!.classmates;
    for (const c of run.cast ?? []) {
      const i = mates.findIndex((m) => m.name === c.name);
      Object.assign(mateAbilities(sim, sim.player, i), { listening: (2 * timing - 1) * 100, focus: (2 * timing - 1) * 100 });
      (mates[i] as { reliability?: number }).reliability = keeps;
    }
    expect(run.cast?.length).toBeGreaterThan(0);
    sim.advanceTo(nights[0]!.at - 1);
    const friends = (run.cast ?? []).filter((c) => (mates.find((m) => m.name === c.name)?.bond ?? 0) >= BONDS.friend).length;
    const morale = sim.player.wellbeing.morale;
    // A twin whose own night is Strong and whose night together isn't (TEST SETUP: the lines and the blocking at half,
    // and the company keeping none of its calls, with no listening or focus).
    const apart = twin(sim);
    const apartRun = apart.player.school!.casting!;
    Object.assign(processOf(apartRun), { lines: 0.5, blocking: 0.5 });
    for (const c of apartRun.cast ?? []) {
      const i = apart.player.school!.classmates.findIndex((m) => m.name === c.name);
      Object.assign(mateAbilities(apart, apart.player, i), { listening: 0, focus: 0 });
      (apart.player.school!.classmates[i] as { reliability?: number }).reliability = 0;
    }
    sim.advanceTo(nights[0]!.at + 60_000);
    expect(run.performed).toBe(1);
    const record = sim.player.work!.at(-1)!;
    expect(record.what).toBe(title);
    // Moment By Moment, as the screen works it out again from the night kept.
    const night = replay(record, TASK_PROFILES.performance!)!;
    const segs = night.piece!.segments;
    // Listed as English lists them, commas and a last "and": from evaluation-10 Woyzeck plays in four, its two tones each
    // cut at its turn, where it played in its two tones and the list was one "and".
    const movements = segs.map((s) => `${s.label.toLowerCase()}${s.tones.length ? ` (${s.tones.join(' and ')})` : ''}`);
    expect(segs.map((s) => s.tones.join(' and '))).toEqual(['grotesque', 'grotesque', 'grave', 'grave']);
    expect(ex.setup).toContain(`it plays in ${word(segs.length)} movements, ${movements.slice(0, -1).join(', ')} and ${movements.at(-1)}`);
    // Each movement's drain from the night's own workload: the example's at readiness 100, as it says, and the night's
    // played the same rule at the readiness its curtain found (from 2026-10-16, brief 10). Until then the first read
    // Holding and the last the load's figure, and the example's figures were the night's, since no drain read the day.
    expect(ex.setup).toContain('at readiness 100');
    const shares = segmentShares(night.inputs.piece!.night!, night.inputs.piece!.segments);
    const r = record.inputs.condition.readiness;
    segs.forEach((x, i) => expect(x.drain, x.label).toBeCloseTo(1 - drainOf(shares[i]!, stamina, r), 3));
    expect(ex.steps[0]).toContain(`${segs.at(-1)!.label} falls last: its Stamina reads “Tiring: ${pct(drainOf(shares.at(-1)!, stamina, 100))} off”, and the first “Tiring: ${pct(drainOf(shares[0]!, stamina, 100))} off”`);
    expect(ex.steps[0]).toContain(`The night’s workload line says ${night.inputs.piece!.night!.workload.toFixed(1)}, and the evening costs ${Math.round(eveningCost(night.inputs.piece!.night!, stamina, 100).energy)} energy.`);
    // A hard evening on stamina: its load against a new play's, which stages no body's or voice's work.
    expect(ex.setup).toContain('a hard evening on stamina');
    expect(night.inputs.piece!.load).toBeGreaterThan(playPiece({}).load);

    // The company in it, as one partner.
    const read = companyRead(sim, sim.player, run)!;
    expect(read.prep).toBeCloseTo(keeps, 9);
    expect(read.reliability).toBeCloseTo(keeps, 9);
    expect(read.timing).toBeCloseTo(timing, 9);
    const draws = Array.from({ length: 4000 }, (_, k) => nightTogether(sim, sim.player, run, { ...night, inputs: { ...night.inputs, key: `draw-${k}` } })!);
    const clean = draws.find((t) => !t.slip)!;
    const likely = stated(ex.steps[2]!, /a slip of theirs is (\d+)% likely/) / 100;
    expect(ex.steps[2]).toContain(`they bring ${pct(clean.contribution)}`);
    expect(Math.abs(draws.filter((t) => t.slip).length / draws.length - likely)).toBeLessThan(0.015);
    // Played off a partner at the play's level: the share of connection theirs, and your 70 together (TEST SETUP: your
    // own connection at the example's 70, and at nothing to read the share alone). Its exact value too, from the
    // integration pass of 2026-10-16 (evaluation-9), which the night together reads before the rounded one.
    const connection = (q: number) => nightTogether(sim, sim.player, run, { ...night, inputs: { ...night.inputs, key: `draw-${draws.indexOf(clean)}` }, dimensions: night.dimensions.map((d) => (d.dimension === 'connection' ? { ...d, quality: q, exact: q } : d)) })!.dims.connection!;
    const yours = stated(ex.result, /at your own (\d+) it comes to/);
    expect(ex.result).toContain(`played off a partner at ${read.level} of 3, so ${pct(connection(0) / (100 * clean.contribution))} of the connection is theirs: at your own ${yours} it comes to ${one(connection(yours))} together`);

    // The night's own band kept on the run, and the night together's mood.
    const together = proc().together!;
    expect(together.n).toBe(1);
    expect(run.nights?.[nightBand(record.overall)]).toBe(1);
    expect(ex.result).toContain('Your own night keeps its band on the run');
    const strong = stated(ex.result, /if the night together reaches (\d+), Strong/);
    expect(nightBand(strong)).toBe('strong');
    expect(nightBand(strong - 0.1)).toBe('solid');
    expect(together.sum).toBeGreaterThanOrEqual(strong);
    expect(ex.result).toContain(`it leaves you ${sim.player.wellbeing.morale - morale - castCompany(sim.player, friends)} morale up`);
    // The mood is the night together's, not your own: the twin's own night is Strong and kept on the run, its night
    // together Solid, and it's left with no morale up. Until the verifier's pass of 2026-10-12 only the night above was
    // played, where your own night and the night together were both Remarkable, so a mood set by your own night passed.
    apart.advanceTo(nights[0]!.at + 60_000);
    expect(nightBand(apart.player.work!.at(-1)!.overall)).toBe('strong');
    expect(apartRun.nights?.strong).toBe(1);
    expect(nightBand(processOf(apartRun).together!.sum)).toBe('solid');
    expect(apart.player.wellbeing.morale - morale - castCompany(apart.player, friends)).toBeCloseTo(0, 9);

    // A slip of the example's size, among the evening's draws. TEST SETUP: an actor at a tenth of full, whose draws reach
    // that far often enough to find one (a slip of 6 is at the top of what an evening draws at a quarter of full), with the
    // stamina, composure and adaptability as before.
    const slip = stated(ex.steps[1]!, /, (\d+(?:\.\d)?) under what was expected/);
    const other = firstYear('guide-productions-slip');
    const p = other.player;
    for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 10;
    const b = attributesOf(other, p) as unknown as Record<string, number>;
    for (const k of Object.keys(b)) b[k] = 10;
    Object.assign(b, { composure: recover * 100, adaptability: recover * 100 });
    p.wellbeing.fitness = abilityFull(other, p, 'stamina') * stamina;
    const holder = { play: title, process: { lines: 1, blocking: 1, calls: 12, blockingMissed: 0, notes: [], trained: 0, of: 12 } };
    let found: Evaluation | undefined;
    for (let k = 0; k < 5000 && !found; k += 1) {
      const e = nightEvaluation(other, p, `slip-${k}`, holder, other.now, 'supporting', 'school');
      if (e.piece!.segments[0]!.slip === slip) found = e;
    }
    expect(found, `a first half ${slip} under what was expected`).toBeDefined();
    const [first, second] = found!.piece!.segments;
    expect(ex.steps[1]).toContain(`A slip in ${first!.label.toLowerCase()}, ${first!.slip} under what was expected, carries into the next: “Shaken by the slip before: ${pct(1 - second!.shaken!)} off”`);
    // And the shake at the engine's own precision, worked from the guide's words: the share of a slip it carries (A Slip,
    // in the entry's reads), the slip's size, and the composure and adaptability that recover it. The step's whole
    // percent, 1% for a shake of 1.2%, would pass a carry worked another way that rounds the same. Until the verifier's
    // pass of 2026-10-12 the whole percent was all that was checked.
    const carries = stated(GUIDE_BY_ID['productions.nights']!.reads.find((r) => r.label === 'A Slip')!.value, /carries (\d+)% of it/) / 100;
    expect(second!.shaken).toBeCloseTo(1 - carries * (slip / 100) * (1 - recover), 3);
  },

  'productions.cabaret': () => {
    const ex = example('productions.cabaret');
    const year = stated(ex.setup, /in the spring of (\d{4})/);
    const sim = firstYear('guide-productions-summer');
    sim.advanceTo(at(year, 2, 1, 18));
    // TEST SETUP: in good standing, as a fall played well leaves a student; this save lives the fall unattended, and the
    // term's evaluation finds an idle student of concern.
    sim.player.school!.standing = 'good';
    // Before the date the company is asked by, as the setup says; a twin of this save goes on to that date, below.
    const [, byMonth, byDay] = /before (\w+) (\d+)\./.exec(ex.setup)!;
    const by = at(year, MONTHS.indexOf(byMonth!) + 1, Number(byDay), 12);
    expect(sim.now).toBeLessThan(by);
    const later = twin(sim);
    expect(ex.steps[0]).toBe('Press Join The Summer Company.');
    expect(sim.execute({ kind: 'school.summer_cabaret', payload: {} }).ok).toBe(true);
    const id = sim.player.id;
    const mine = (kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.payload.personId === id && i.status === 'pending').sort((a, b) => a.at - b.at);
    const calls = mine(SUMMER_KIND);
    const show = (n: number, call: string) => calls.filter((i) => Number(i.payload.run) === n && i.payload.call === call);
    const shows = sim.player.school!.summer!.shows!;
    expect(ex.steps[1]).toContain(`The first show rehearses from ${dated(show(0, 'rehearsal')[0]!.at, false)} and opens ${dated(show(0, 'performance')[0]!.at, false)}; the third closes ${dated(show(shows.length - 1, 'performance').at(-1)!.at)}`);
    expect(show(shows.length - 1, 'performance').at(-1)!.payload.last).toBe(true);
    expect(WORDS.indexOf(/^(\w+) shows, each with a part cast within the company/.exec(ex.result)![1]!.toLowerCase())).toBe(shows.length);
    for (const s of shows) expect(s.role && s.size).toBeTruthy();
    const fridays = mine(STIPEND_KIND);
    for (const f of fridays) expect(zonedParts(f.at, zone)).toMatchObject({ weekday: 5, hour: 17 });
    expect(ex.result).toContain(`${fridays.length} Fridays of stipend, ${formatMoney(fridays.length * SUMMER_CABARET.stipendWeekly, 'USD', { cents: false })} before tax`);

    // The first performance missed, unexcused (TEST SETUP: in New York for it): the rest stops that week.
    const opening = show(0, 'performance')[0]!;
    sim.advanceTo(opening.at - MS_HOUR);
    expect(sim.player.school!.summer!.out).toBeUndefined();
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(opening.at + 60_000);
    expect(opening.status).toBe('missed');
    expect(sim.player.school!.summer!.out).toBe(true);
    expect(mine(SUMMER_KIND)).toEqual([]);
    const left = mine(STIPEND_KIND);
    expect(left).toHaveLength(1);
    expect(left[0]!.at - opening.at).toBeLessThan(7 * MS_DAY);
    expect(Number(left[0]!.payload.share)).toBeLessThan(1);
    expect(ex.result).toContain('Miss a performance unexcused and the rest stops that week');

    // The date it's asked by (TEST SETUP: the twin made before joining, its days looked after and kept in good
    // standing): joined on it at noon, and refused the next day, as the entry's reasons give it. Until the verifier's
    // pass of 2026-10-12 the date was in the setup and checked by nothing.
    tended(later, by);
    const dayAfter = twin(later);
    later.player.school!.standing = 'good';
    expect(later.execute({ kind: 'school.summer_cabaret', payload: {} }).ok).toBe(true);
    tended(dayAfter, by + MS_DAY);
    dayAfter.player.school!.standing = 'good';
    const refused = dayAfter.execute({ kind: 'school.summer_cabaret', payload: {} });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/has already formed/);
    expect(GUIDE_BY_ID['productions.cabaret']!.unavailable).toContain(`“${refused.error}”`);
  },

  'productions.plays': () => {
    const ex = example('productions.plays');
    const sim = firstYear('guide-productions-plays');
    // A free evening once orientation's tour is done.
    sim.advanceTo(at(2026, 9, 14, 18));
    expect(ex.setup).toContain('the tour done');
    const [, playTitle, by] = /Press Read It on (.+), by (.+)\.$/.exec(ex.steps[0]!)!;
    const play = CONTEMPORARY_PLAYS.find((x) => x.title === playTitle)!;
    expect(play.by).toBe(by);
    const p = sim.player;
    const trained = () => ({ script: p.craft!.script, imagination: attributesOf(sim, p).imagination });
    const fresh = trained();
    const read = sim.execute<{ minutes: number; note: string }>({ kind: 'plays.read', payload: { playId: play.id } });
    expect(read.ok, read.error).toBe(true);
    expect(ex.steps[1]).toContain(`${read.value!.minutes} minutes later, read the note`);
    for (const quoted of ex.result.match(/“[^”]+”/g)!.map((q) => q.slice(1, -1))) expect(read.value!.note).toContain(quoted);
    // Then its form, the cast, whether there's a part for you, and its setting.
    expect(read.value!.note).toMatch(/It reads as an? /);
    expect(read.value!.note).toContain(` ${play.form}.`);
    expect(read.value!.note).toContain('There’s a part in it for you.');
    expect(read.value!.note).toContain(`It’s set: ${play.setting}.`);
    expect(trained().script).toBeGreaterThan(fresh.script);
    expect(trained().imagination).toBeGreaterThan(fresh.imagination);

    const research = sim.execute<{ minutes: number; note: string }>({ kind: 'plays.research', payload: { playId: play.id } });
    expect(research.ok, research.error).toBe(true);
    const staged = /First staged in (\d{4}) at ([^.]+(?:\.[^ ][^.]*)*)\./.exec(research.value!.note)!;
    const published = /First published (\d{4}), by ([^.,]+)/.exec(research.value!.note)!;
    expect(ex.result).toContain(`Research, ${research.value!.minutes} minutes more, finds it first staged in ${staged[1]} at ${staged[2]}, first published in ${published[1]} by ${published[2]}, and who licenses it`);
    expect(research.value!.note).toMatch(/Licensed for performance/);

    // The next week, read again: three-quarters of the time, and nothing trained.
    sim.advanceTo(at(2026, 9, 21, 18));
    const before = trained();
    const again = sim.execute<{ minutes: number; note: string }>({ kind: 'plays.read', payload: { playId: play.id } });
    expect(again.ok, again.error).toBe(true);
    expect(again.value!.minutes).toBe(Math.round(PLAYREADING.minutes.full * PLAYREADING.again));
    expect(again.value!.note).toContain('It’s too soon after that one to see it fresh.');
    expect(trained()).toEqual(before);
    expect(ex.result).toContain(`Read again the next week, it takes ${again.value!.minutes} minutes and trains nothing`);
  },
};

describe('the productions guide’s worked examples, played', () => {
  it('has a play for every productions entry, and no other', () => {
    expect(Object.keys(PLAY).sort()).toEqual(PRODUCTIONS.map((e) => e.id).sort());
  });
  for (const [id, play] of Object.entries(PLAY)) it(id, () => play(), 300_000);
});

/**
 * The map's isolation: a live save, lived a few days, is the same byte for byte after every example has run. The examples
 * make saves of their own and hand none of them to the adapter; the live one is read through `serialise`, before and after.
 */
describe('the examples beside a live save', () => {
  it('leave the live save as it was', () => {
    const live = quickSave(undefined, 'guide-productions-live');
    live.advanceTo(live.now + 3 * MS_DAY);
    const before = serialise(live.universe);
    for (const play of Object.values(PLAY)) play();
    expect(serialise(live.universe)).toBe(before);
  }, 600_000);
});
