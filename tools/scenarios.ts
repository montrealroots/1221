/**
 * SLATE — the long scenarios beside the 18 lives (from 2026-10-10): a student played by `tools/policy.ts` for years,
 * with one path of the brief taken through its commands, saved and opened every thirty days, and the end checked
 * for breaches and an unbalanced ledger. What's put on by hand is TEST SETUP and named.
 *
 * - `leave`: a personal leave of two terms asked for after the first term, notice given, registered again, played to
 *   the degree with the class a year below.
 * - `mandatory`: TEST SETUP two stays in hospital in the first fall; Yale Health's assessment, the dean's leave, the
 *   way back, and the degree.
 * - `switch-uk`: a London student's partial switch in the first fall, a full switch in the spring, two years on.
 * - `tax-plan`: TEST SETUP a 2026 W-2 and an empty bank at filing; a monthly IRS plan, paid through.
 * - `withdraw`: a withdrawal in the first spring, by the command, then the class left followed to its degree (from the
 *   limitations pass of 2026-10-11).
 * - `nonfiler`: TEST SETUP a 2026 W-2; the return never filed until the IRS and Connecticut have each assessed it, then
 *   filed, each replaced (from the limitations pass of 2026-10-11).
 * - `direction`: the first spring's festival, a craft note waiting and workable (from 2026-10-13). On seed sc-1, run as
 *   three slices (`--years 0.15`, then `--from` it `--years 0.2`, then `--years 0.45`), it stops on 2027-04-24 with
 *   "Still: I don’t know what you want in the second half." and seven ways; sc-0's craft notes all fell under a back
 *   strain, and it never stopped.
 * - `roundups`: a New Haven student at Citi, a few days in, round-ups not yet set up (from 2026-10-13).
 * - `workload`: a student who prepares everything but the scenes' partner part, as the policy did until 2026-10-16,
 *   stopped the day the term's warning comes (A Word On Your Coursework), with a scene still open to answer it.
 * - `specialist`: `brief`'s student and Saturday with TEST SETUP the specialist's abilities on the first morning (from
 *   2026-10-17, brief 13's interface playthroughs, `tools/playthroughs-ui.mjs`).
 * - `health`: `brief`'s student with TEST SETUP a fall that sprains an ankle on Saturday 12 September 2026, stopped right
 *   after it (from 2026-10-17, brief 14's journeys, `tools/playthroughs-ui.mjs`).
 * - `understudy`: on seed us-86, an actress understudying the second-year fall's Rep play, An Enemy Of The People, sent on
 *   once, followed from the casting to its credit, each thing the player reads logged in order (from 2026-10-20, brief 19's
 *   D6; docs/verification/career-2026-10-20/understudy/).
 *
 *   npx vite-node tools/scenarios.ts -- --scenario leave --seed sc-0 [--watch] [--years 1.5 --save leave.json]
 *   npx vite-node tools/scenarios.ts -- --scenario direction --from part.json --years 0.2 --save part2.json   # goes on
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadSave, quickSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '../src/engine/core/time';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { breaches } from '../src/engine/core/invariants';
import { healthOf } from '../src/engine/systems/health';
import { CALL_KIND, at, termStart } from '../src/engine/systems/school';
import { recordWages } from '../src/engine/systems/earnings';
import { owedAll, returnsOf } from '../src/engine/systems/taxreturn';
import { owedToState } from '../src/engine/systems/statetax';
import { SWITCH_KIND } from '../src/engine/systems/lending';
import { POLICY, attentiveHour, life } from './policy';
import { hasProcess, ownWorkRefusal, solutionsOf } from '../src/engine/systems/production';
import { workPiece } from '../src/engine/systems/workpieces';
import { wayRefusal } from '../src/engine/systems/workbook';
import { courseworkOf, partnerPart } from '../src/engine/systems/coursework';
import { ADJUSTMENTS } from '../src/engine/content/workbook';
import { mayHurt } from '../src/engine/systems/injury';
import { INJURY_MIX } from '../src/engine/content/injury';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const SCENARIO = arg('scenario', 'leave');
const SEED = arg('seed', 'sc-0');
const NY = 'America/New_York';
const on = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);

interface Hook { years: number; config: Record<string, unknown>; resident?: boolean; ownWork?: false; workNotes?: false; partnerPart?: false; daily(sim: Simulation, log: string[]): void; stopWhen?(sim: Simulation, log: string[]): boolean }

/** TEST SETUP: a 2026 W-2 of $40,000 with nothing withheld, then the bank emptied and the return filed on 15 February. */
const owingOnFiling = (sim: Simulation, log: string[]) => {
  const r = returnsOf(sim.player)['2026'];
  if (!r && sim.now >= on(2026, 9, 10) && !log.some((l) => l.includes('W-2'))) {
    recordWages(sim.player, on(2026, 9, 1), NY, { gross: 40_000_00 });
    log.push(`${new Date(sim.now).toISOString().slice(0, 10)} TEST SETUP: W-2`);
  }
  if (r && r.filedAt === undefined && sim.now >= on(2027, 2, 15)) {
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] });
    tryOnce(sim, log, 'tax.file', { year: 2026 });
  }
};
/** TEST SETUP: money from family, once. */
const gift = (sim: Simulation, log: string[], amount: number) => {
  if (log.some((l) => l.includes('gift'))) return;
  sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
  log.push(`${new Date(sim.now).toISOString().slice(0, 10)} TEST SETUP: a gift`);
};

/**
 * The injury a fall at this moment would be, read the way `mayHurt` draws it: its stream and key, the first number for
 * whether it happens and the second for which kind, from the fall's mix. Read, not drawn: the stream is keyed on the
 * moment, so reading it changes nothing the game draws after. `health` checks the injury `mayHurt` gave against it, so a
 * change to that draw stops the run rather than setting up another injury unsaid.
 */
const fallWouldBe = (sim: Simulation, at: number) => {
  const rng = sim.rng('health.injury', sim.player.id, `fall-${at}`);
  rng.next();
  const mix = INJURY_MIX.fall;
  let left = rng.next() * mix.reduce((s, [, w]) => s + w, 0);
  return (mix.find(([, w]) => (left -= w) <= 0) ?? mix[mix.length - 1]!)[0];
};

/** Each day at nine: try what the scenario asks, and say what happened when it changed. */
const tryOnce = (sim: Simulation, log: string[], kind: string, payload: Record<string, unknown>, when = true) => {
  if (!when) return false;
  const r = sim.execute({ kind, payload });
  if (r.ok) log.push(`${new Date(sim.now).toISOString().slice(0, 10)} ${kind}`);
  // The first refusal of each command, so a path that never goes through says why.
  else if (!log.some((l) => l.startsWith(`refused ${kind}`))) log.push(`refused ${kind}: ${r.error}`);
  return r.ok;
};

/**
 * An understudy's run at the Rep, as the player meets it (from 2026-10-20, brief 19's D6, brief 18's U1): the casting and
 * the part it names, the Rep's calls on the calendar, the preparation's forecast once the rehearsals are under way, each
 * notice in order, each night judged with the size and difficulty it was judged at, the run's milestone and the credit at
 * the next casting. Nothing is set by hand: it's read, each thing once, the notices by their ids, which a reload keeps.
 */
const seenNotices = new Set<string>();
const seenNights = new Set<string>();
const followUnderstudy = (sim: Simulation, log: string[]) => {
  const s = sim.player.school;
  if (!s) return;
  // The day in New Haven, where every call is.
  const day = (t: number) => { const p = zonedParts(t, NY); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
  const r = s.rep?.kind === 'understudy' ? s.rep : undefined;
  if (r && !log.some((l) => l.includes(`casting: ${r.production}, term ${r.term}`))) {
    log.push(`${day(sim.now)} casting: ${r.production}, term ${r.term}: role ${r.role}, play ${r.play ?? '(none)'}, size ${r.size ?? '(none)'}`);
    const labels = [...new Set(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === CALL_KIND && i.payload.which === 'rep' && i.payload.personId === sim.player.id).map((i) => i.label))];
    log.push(`${day(sim.now)} calendar: ${labels.join(' | ')}`);
  }
  const proc = r && hasProcess(r) ? r.process : undefined;
  if (r && proc && proc.calls >= 3 && !log.some((l) => l.includes(`forecast: ${r.production}, term ${r.term}`))) {
    const f = workPiece(sim, sim.player, 'part:rep')?.forecast();
    if (f) log.push(`${day(sim.now)} forecast: ${r.production}, term ${r.term}: A Night Now ${f.overall}, size ${f.inputs.piece?.night?.size}, difficulty ${f.inputs.difficulty}, lines ${Math.round(proc.lines * 100)}%, blocking ${Math.round(proc.blocking * 100)}%`);
  }
  for (const n of sim.universe.notifications) {
    if (seenNotices.has(n.id)) continue;
    seenNotices.add(n.id);
    if (/^(Cast: |Your Understudy|You’re On |You Went On |The Director’s Note: (?!Carlotta|Directors|Langston|Shakespeare))/.test(n.title)) log.push(`${day(n.at)} notice: ${n.title} | ${n.body}`);
  }
  if (r) for (const w of sim.player.work ?? []) {
    if (w.task !== 'performance' || !w.inputs.key.includes(`:${r.production}-`) || seenNights.has(w.inputs.key)) continue;
    seenNights.add(w.inputs.key);
    log.push(`${day(w.at)} night judged: ${w.what}, ${w.overall} (${w.band}), size ${w.inputs.piece?.night?.size}, difficulty ${w.inputs.difficulty}, on stage ${Math.round((w.inputs.piece?.night?.share ?? 0) * 100)}% of the playing`);
  }
  for (const m of sim.player.journey?.milestones ?? []) if (m.kind === 'run' && /Rep|Enemy|Warren|Seagull|Vanya|Tartuffe|Playboy|Doll/.test(m.what) && !log.some((l) => l.includes(`milestone: ${m.what}`))) log.push(`${day(m.at)} milestone: ${m.what}, ${m.overall} (${m.detail ?? ''})`);
  for (const c of s.credits ?? []) if (c.kind === 'understudy' && !log.some((l) => l.includes(`credit: ${c.production}, ${c.year}`))) log.push(`${day(sim.now)} credit: ${c.production}, ${c.year}: role ${c.role}, went on ${c.wentOn}${c.size ? `, size ${c.size}` : ''}`);
};

/** The way back from a leave: notice once it's allowed, then registration once it's asked. */
const comeBack = (sim: Simulation, log: string[]) => {
  const s = sim.player.school;
  if (!s) return;
  if (s.leave?.status === 'on' && !s.leave.noticeAt) tryOnce(sim, log, 'school.return_notice', {});
  if (s.mustRegister) tryOnce(sim, log, 'school.reregister', {});
};

const SCENARIOS: Record<string, Hook> = {
  workload: {
    years: 1.4, config: { homeRegionId: 'us-ny-newyork' }, partnerPart: false,
    daily() {},
    stopWhen: (sim) => sim.universe.notifications.some((n) => n.title === 'A Word On Your Coursework') && Boolean(courseworkOf(sim, sim.player)?.assignments.some((a) => a.status === 'open' && a.partner !== undefined && partnerPart(a) < 0.5)),
  },
  leave: {
    years: 5.4, config: { homeRegionId: 'us-ny-newyork' },
    daily(sim, log) {
      const s = sim.player.school;
      if (s && !s.leaves?.length && !s.leave && sim.now >= on(2027, 1, 20)) tryOnce(sim, log, 'school.request_leave', { kind: 'personal', reason: 'family', terms: 2 });
      comeBack(sim, log);
    },
  },
  // A second-year leave (acceptance pass, 2026-10-11): asked the summer after year one, away the second year, back with
  // the class of 2030, played on to the degree.
  'leave-year2': {
    years: 4.1, config: { homeRegionId: 'us-ny-newyork' },
    daily(sim, log) {
      const s = sim.player.school;
      if (s && !s.leaves?.length && !s.leave && sim.now >= on(2027, 7, 10)) tryOnce(sim, log, 'school.request_leave', { kind: 'personal', reason: 'family', terms: 2 });
      comeBack(sim, log);
    },
  },
  mandatory: {
    years: 5.4, config: { homeRegionId: 'us-ny-newyork' },
    daily(sim, log) {
      const s = sim.player.school;
      if (s && !log.some((l) => l.includes('two stays')) && sim.now >= on(2026, 10, 20)) {
        // TEST SETUP: two stays in hospital in the last four weeks, and the student in a third for six weeks.
        const h = healthOf(sim.player);
        h.careLog = [...(h.careLog ?? []), { at: sim.now - 12 * MS_DAY, care: 'stay', what: 'A stay', share: 0 }, { at: sim.now - 2 * MS_DAY, care: 'stay', what: 'A stay', share: 0 }] as never;
        h.inHospitalUntil = sim.now + 42 * MS_DAY;
        log.push(`${new Date(sim.now).toISOString().slice(0, 10)} TEST SETUP: two stays`);
      }
      comeBack(sim, log);
    },
  },
  'switch-uk': {
    // A Londoner who lives there, not a student: a student banks where the School is.
    years: 2, config: { startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', bankId: 'gb-barclays' }, resident: true,
    daily(sim, log) {
      const n = sim.player.payments?.switches?.length ?? 0;
      const pending = sim.universe.scheduled.some((i) => i.kind === SWITCH_KIND && i.status === 'pending');
      if (n === 0 && !pending && sim.now >= on(2026, 10, 1)) tryOnce(sim, log, 'bank.switch', { bankId: 'gb-hsbc', partial: true });
      if (n === 1 && !pending && sim.now >= on(2027, 3, 1)) tryOnce(sim, log, 'bank.switch', { bankId: 'gb-natwest' });
    },
  },
  // The same, the IRS's plan left aside: Connecticut's own balance and its own plan (integration pass, 2026-10-10).
  'state-plan': {
    years: 2.5, config: { homeRegionId: 'us-ny-newyork', wealth: 'wealthy' },
    daily(sim, log) {
      SCENARIOS['tax-plan']!.daily(sim, log);
      const ct = owedToState(sim.player, 'us-ct', sim.now);
      if (ct > 0 && !sim.player.statePlans?.['us-ct']) tryOnce(sim, log, 'tax.apply_state_plan', { state: 'us-ct', months: 12 });
      if (sim.player.statePlans?.['us-ct']?.status === 'missed') tryOnce(sim, log, 'tax.catch_up_state_plan', { state: 'us-ct' });
    },
  },
  // Played to the middle of a production's rehearsals with the student's own work on it left undone (from 2026-10-11),
  // so the built app's rehearsal controls can be used on it (`tools/acceptance-ui.mjs`).
  // Connecticut's lien filed on the unpaid balance, and money from family to pay it, the run stopped there (from
  // 2026-10-11): the built app pays it and asks for the release Connecticut gives only on request.
  lien: {
    years: 1.5, config: { homeRegionId: 'us-ny-newyork', wealth: 'wealthy' },
    daily(sim, log) {
      owingOnFiling(sim, log);
      if (returnsOf(sim.player)['2026']?.stateDue?.['us-ct']?.lien?.status === 'filed') gift(sim, log, 5_000_00);
    },
    stopWhen: (_sim, log) => log.some((l) => l.includes('gift')),
  },
  // The IRS's plan in default with nothing in the bank, then money from family, the run stopped there (from 2026-10-11):
  // the built app catches it up. Connecticut's own plan has no catch-up: its rule on a missed payment wasn't found, so
  // a missed payment ends it.
  'missed-plan': {
    years: 1.5, config: { homeRegionId: 'us-ny-newyork', wealth: 'wealthy' },
    daily(sim, log) {
      owingOnFiling(sim, log);
      if (returnsOf(sim.player)['2026']?.filedAt !== undefined && !sim.player.taxPlan && owedAll(sim.player, sim.now) > 0) tryOnce(sim, log, 'tax.apply_plan', { kind: 'long', directDebit: true });
      if (sim.player.taxPlan?.status === 'default') gift(sim, log, 3_000_00);
    },
    stopWhen: (_sim, log) => log.some((l) => l.includes('gift')),
  },
  rehearsal: {
    years: 0.6, config: { homeRegionId: 'us-ny-newyork' }, ownWork: false,
    daily() {},
  },
  // A New Haven student who banks at Citi, a few days into the first fall, round-ups not yet set up: the built app's
  // round-ups journey (from 2026-10-13, `tools/acceptance-ui.mjs`) makes Citi's choices, reads the guide beside them,
  // turns them on and plays a week. No TEST SETUP.
  roundups: {
    years: 0.012, config: { homeRegionId: 'us-ct-newhaven', bankId: 'us-citi' },
    daily() {},
  },
  // A student cast in the first spring's festival who learns the part and catches up the blocking between calls, as a
  // player does, and leaves the director's notes to the player (from 2026-10-13, `POLICY.workNotes`): once the lines are
  // off book and the blocking set, the director turns to the craft. The run stops at the first morning with a craft note
  // given and not yet worked, two ways or more at it, one a change of how it's played (kept or put back) that can be
  // worked then, and a call still ahead, so the built app's director's-note journey has a note to work and a call to
  // play to (`tools/acceptance-ui.mjs`). No TEST SETUP: everything in it is the policy's play through the commands. Its
  // first runs waited for a weekend morning, and on seed sc-0 every one of the festival's craft notes fell while a
  // back strain was mending, which refuses work on the feet: the way that can be worked then is what's asked now.
  direction: {
    years: 1, config: { homeRegionId: 'us-ny-newyork' }, workNotes: false,
    daily() {},
    stopWhen: (sim, log) => {
      const casting = sim.player.school?.casting;
      if (!casting || !hasProcess(casting)) return false;
      const note = casting.process.notes.at(-1);
      if (note && !log.some((l) => l.endsWith(`note ${casting.process.notes.length}`))) log.push(`${new Date(sim.now).toISOString().slice(0, 10)} ${note.focus.kind} note ${casting.process.notes.length}`);
      if (!note || note.focus.kind !== 'craft' || note.worked || note.taken !== undefined) return false;
      const sols = solutionsOf(workPiece(sim, sim.player, 'part:school'), note);
      const ways = sols.length;
      // One of the ways a change of how the part is played, which is kept or put back, so the journey can do either.
      const choice = sols.some((o) => ADJUSTMENTS[o.adjustment].kind === 'choice');
      const ahead = sim.universe.scheduled.some((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.which !== 'rep' && i.at > sim.now);
      // And the way can be worked now: its first run stopped where a back strain refused it, and the journey couldn't play.
      const piece = workPiece(sim, sim.player, 'part:school');
      const workable = !ownWorkRefusal(sim, sim.player, 'school', 'note') && Boolean(piece) && sols.some((o) => ADJUSTMENTS[o.adjustment].kind === 'choice' && !wayRefusal(sim, sim.player, piece!, o.adjustment));
      if (ways < 2 || !choice || !ahead || !workable) return false;
      log.push(`${new Date(sim.now).toISOString().slice(0, 10)} a craft note waits: "${note.text.slice(0, 80)}", ${ways} ways`);
      return true;
    },
  },
  // A student a few weeks into the first term, saved on a free Saturday morning (from 2026-10-12), so the built app's
  // practice-brief journey has hours to spend: choose a genre, read its brief, prepare it, tape it, train, tape again.
  // The partner part left alone (from 2026-10-16): the brief's journey is played through the afternoon the save stops
  // on, and the policy's evening asked of a scene partner, booked at seven, sat across it and grayed every step.
  brief: {
    years: 0.053, config: { homeRegionId: 'us-ny-newyork' }, partnerPart: false,
    daily() {},
  },
  // The same student and the same Saturday as a specialist (from 2026-10-17, brief 13's interface playthroughs,
  // `tools/playthroughs-ui.mjs`): TEST SETUP on the first morning, the specialist's spread `tools/brief-journeys.ts`
  // gives (emotional depth, composure, imagination and presence at 90; memory, voice, movement, listening, focus,
  // adaptability and discipline at 49; the other techniques as made), so the weeks before the save are played with it.
  // Everything after that is the policy's play through the commands. A new life can't be made a specialist through
  // creation: its dispositions set composure and discipline only.
  specialist: {
    years: 0.053, config: { homeRegionId: 'us-ny-newyork' }, partnerPart: false,
    daily(sim, log) {
      if (log.some((l) => l.includes('TEST SETUP: a specialist'))) return;
      const p = sim.player;
      p.craft!.emotion = 90; p.craft!.memorization = 49; p.craft!.voice = 49; p.craft!.movement = 49;
      p.attrs = { ...(p.attrs ?? {}), composure: 90, imagination: 90, presence: 90, listening: 49, focus: 49, adaptability: 49, discipline: 49 } as typeof p.attrs;
      log.push(`${new Date(sim.now).toISOString().slice(0, 10)} TEST SETUP: a specialist`);
    },
  },
  // The same student and days with a sprained ankle (from 2026-10-17, brief 14's journeys, `tools/playthroughs-ui.mjs`):
  // TEST SETUP a fall forced, on the first morning from Saturday 12 September 2026 at nine on which a fall would be a
  // sprain (`fallWouldBe`). It's the game's own `mayHurt` with a chance of one, so the notice, the bill, the toll and what
  // the injury refuses are the game's; only that it happens, and when, is set by hand. A sprain keeps a student from
  // working out and from work on their feet, and mends in days. The run stops right after it, the notice unread. On seed
  // sc-0 that's the first morning, at 9:05 AM, mending in 7 days.
  health: {
    years: 0.06, config: { homeRegionId: 'us-ny-newyork' }, partnerPart: false,
    daily(sim, log) {
      if (log.some((l) => l.includes('TEST SETUP: a fall')) || sim.now < on(2026, 9, 12) || fallWouldBe(sim, sim.now) !== 'sprain') return;
      const hurt = mayHurt(sim, sim.player, 'fall', 1, sim.now);
      if (hurt?.kind !== 'sprain') throw new Error(`the fall forced was ${hurt?.kind ?? 'nothing'}, where its draw read a sprain: \`fallWouldBe\` no longer reads it as \`mayHurt\` draws`);
      log.push(`${new Date(sim.now).toISOString().slice(0, 16)} TEST SETUP: a fall, a sprain mending in ${Math.round((hurt.until - hurt.at) / MS_DAY)} days`);
    },
    stopWhen: (_sim, log) => log.some((l) => l.includes('TEST SETUP: a fall')),
  },
  withdraw: {
    years: 2.9, config: { homeRegionId: 'us-ny-newyork' },
    daily(sim, log) {
      const s = sim.player.school;
      if (s && s.standing !== 'withdrawn' && sim.now >= on(2027, 4, 7)) tryOnce(sim, log, 'school.withdraw', { confirm: true });
    },
  },
  nonfiler: {
    years: 2.6, config: { homeRegionId: 'us-ny-newyork', wealth: 'wealthy' },
    daily(sim, log) {
      const r = returnsOf(sim.player)['2026'];
      if (!r && sim.now >= on(2026, 9, 10) && !log.some((l) => l.includes('W-2'))) {
        // TEST SETUP: a 2026 W-2 of $40,000 with nothing withheld, paid before the year's end.
        recordWages(sim.player, on(2026, 9, 1), NY, { gross: 40_000_00 });
        log.push(`${new Date(sim.now).toISOString().slice(0, 10)} TEST SETUP: W-2`);
      }
      // Never filed until both the IRS and Connecticut have assessed it; then filed, and each replaced.
      if (r && r.filedAt !== undefined && r.substitute && r.stateDue?.['us-ct']?.assessedBy && !r.stateDue['us-ct'].replacedAt) tryOnce(sim, log, 'tax.file', { year: 2026 });
    },
  },
  'tax-plan': {
    years: 2.5, config: { homeRegionId: 'us-ny-newyork', wealth: 'wealthy' },
    daily(sim, log) {
      const r = returnsOf(sim.player)['2026'];
      if (!r && sim.now >= on(2026, 9, 10) && !log.some((l) => l.includes('W-2'))) {
        // TEST SETUP: a 2026 W-2 of $40,000, paid before the year's end.
        recordWages(sim.player, on(2026, 9, 1), NY, { gross: 40_000_00 });
        log.push(`${new Date(sim.now).toISOString().slice(0, 10)} TEST SETUP: W-2`);
      }
      if (r && r.filedAt === undefined && sim.now >= on(2027, 2, 15)) {
        // TEST SETUP: the bank emptied on filing day, so the balance is owed.
        for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] });
        tryOnce(sim, log, 'tax.file', { year: 2026 });
      }
      if (r?.filedAt !== undefined && !sim.player.taxPlan && owedAll(sim.player, sim.now) > 0) tryOnce(sim, log, 'tax.apply_plan', { kind: 'long', directDebit: true });
      if (sim.player.taxPlan?.status === 'active' && !log.some((l) => l.includes('gift'))) {
        // TEST SETUP: $3,000 from family once the plan is approved, so its payments can be met.
        sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount: 3_000_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -3_000_00 }] });
        log.push(`${new Date(sim.now).toISOString().slice(0, 10)} TEST SETUP: a gift`);
      }
      if (sim.player.taxPlan?.status === 'default') tryOnce(sim, log, 'tax.catch_up_plan', {});
    },
  },
  // A Rep understudy whose play has no lead written for them (from 2026-10-20, brief 19's D6, brief 18's U1): on seed us-86
  // an actress is dealt An Enemy Of The People for the second-year fall, and on Saturday 2 October 2027 the night's check
  // sends her on. Followed to the credit the next casting files, in January 2028 (`followUnderstudy`).
  understudy: {
    years: 1.45, config: { homeRegionId: 'us-ny-newyork', pronouns: 'she/her' },
    daily: followUnderstudy,
    stopWhen: (sim) => (sim.player.school?.credits ?? []).some((c) => c.kind === 'understudy' && c.production.startsWith('Yale Rep’s October')),
  },
};

const hook = SCENARIOS[SCENARIO];
if (!hook) throw new Error(`No scenario ${SCENARIO}: ${Object.keys(SCENARIOS).join(', ')}`);
if (hook.ownWork === false) POLICY.ownWork = false;
if (hook.workNotes === false) POLICY.workNotes = false;
if (hook.partnerPart === false) POLICY.partnerPart = false;
// `--from <save>` goes on from a save an earlier run wrote (from 2026-10-13), so a long run can go in slices: `--years` is
// then how much further. The scenario's hook runs as before; its log starts again with each slice.
let sim = process.argv.includes('--from') ? loadSave(deserialise(readFileSync(arg('from', ''), 'utf8')) as never) : hook.resident ? quickSave(hook.config as never, SEED) : life(SEED, { pronouns: 'they/them', ...hook.config } as never);
// `--years` stops it early, and `--save <file>` writes the save there, for the screens to open (from 2026-10-10).
const end = sim.now + Number(arg('years', String(hook.years))) * 365 * MS_DAY;
const log: string[] = [];
let reloads = 0;
let lastReload = sim.now;
let lastDay = '';
let error: string | undefined;
try {
  while (sim.now < end && sim.universe.meta.endedAt === undefined) {
    const p = zonedParts(sim.now, sim.zone);
    const day = `${p.year}-${p.month}-${p.day}`;
    if (p.hour >= 9 && day !== lastDay && (sim.player.awakeSince ?? 0) <= sim.now) {
      lastDay = day;
      hook.daily(sim, log);
      if (hook.stopWhen?.(sim, log)) break;
      // `--watch`: the first day a breach or an unbalanced entry appears, and what it is.
      if (process.argv.includes('--watch')) {
        const b = breaches(sim.universe);
        const u = sim.ledger.audit();
        if (b.length || u.length) { console.log(JSON.stringify({ firstBad: day, breaches: b.slice(0, 3), unbalanced: u.slice(0, 3), log: log.slice(-4) }, null, 1)); process.exit(1); }
      }
    }
    if (hook.resident) sim.advanceTo(sim.now + MS_HOUR, { stopOnPlayerRequired: true }); else attentiveHour(sim);
    if (sim.now - lastReload >= 30 * MS_DAY && zonedParts(sim.now, sim.zone).hour === 12) { sim = loadSave(deserialise(serialise(sim.universe)) as never); reloads += 1; lastReload = sim.now; }
  }
} catch (e) { error = String((e as Error).message ?? e); }

if (process.argv.includes('--save')) writeFileSync(arg('save', ''), serialise(sim.universe));
const s = sim.player.school;
const titles = (re: RegExp) => [...new Set(sim.universe.notifications.filter((n) => re.test(n.title)).map((n) => n.title))];
console.log(JSON.stringify({
  scenario: SCENARIO, seed: SEED, ended: new Date(sim.now).toISOString().slice(0, 10), log, error,
  school: s ? {
    standing: s.standing, classOf: s.classOf, offset: s.offset ?? 0, leaves: (s.leaves ?? []).map((l) => ({ kind: l.kind, status: l.status, terms: l.terms, mandatory: Boolean(l.mandatory) })),
    welfares: (s.welfares ?? []).map((w) => w.outcome), formerClasses: (s.formerClasses ?? []).map((c) => ({ classOf: c.classOf, mates: c.classmates.length, playedTo: c.playedTo, leftBehind: Boolean(c.leftBehind), productions: (c.productions ?? []).length, cabaret: (c.productions ?? []).filter((p) => p.name.startsWith('Yale Cabaret')).length })),
    classmates: s.classmates.length, terms: (s.history ?? []).map((h) => `${h.term}:${h.standing}`), conferred: titles(/Degree|Conferred|Graduat/),
    credits: (s.credits ?? []).map((c) => `${c.year} ${c.kind} ${c.size ?? ''}`), joinedHistory: (s.joinedHistory ?? []).map((p) => `${p.term} ${p.play ?? p.name}`), firstClassGraduated: (s.formerClasses ?? []).map((c) => c.graduatedAt !== undefined),
    // Anything paid, billed or credited inside a leave's own terms: there should be none.
    duringLeave: (s.leaves ?? []).filter((l) => l.startedAt !== undefined).map((l) => { const to = at(termStart(l.returnTerm).date, 0); return sim.universe.transactions.filter((t) => t.at >= l.startedAt! && t.at < to && /Work-study wages|Living-expense scholarship|Yale Summer Cabaret stipend/.test(t.memo)).length; }),
  } : undefined,
  switches: sim.player.payments?.switches, accounts: Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings')).map((a) => `${a.institution} ${a.kind}${a.closedAt ? ' closed' : ''}${a.switchDebt ? ' in debt' : ''}`),
  taxPlan: sim.player.taxPlan ? { status: sim.player.taxPlan.status, payments: sim.player.taxPlan.history.filter((h) => /payment/i.test(h.what)).length, history: sim.player.taxPlan.history.slice(-6).map((h) => h.what) } : undefined,
  owedIrs: owedAll(sim.player, sim.now), irsSubstitute: Object.values(sim.player.returns ?? {}).map((r) => `${r.year}: ${r.substitute ? 'substitute' : r.reconsideredAt !== undefined ? 'replaced' : r.filedAt !== undefined ? 'filed' : 'unfiled'}`),
  // Each state's side (integration pass): what it assessed, owes, took by levy, and its plan.
  states: Object.fromEntries(Object.values(sim.player.returns ?? {}).flatMap((r) => Object.entries(r.stateDue ?? {}).map(([st, sd]) => [`${r.year} ${st}`, { balance: sd.balance, owed: sd.owed ?? 0, payments: (sd.payments ?? []).map((p) => p.how), notices: sd.collection ?? 0, lien: sd.lien?.status, assessed: Boolean(sd.assessedBy), replaced: sd.replacedAt !== undefined }]))),
  statePlans: Object.fromEntries(Object.entries(sim.player.statePlans ?? {}).map(([st, p]) => [st, { status: p.status, history: p.history.slice(-5).map((h) => h.what) }])),
  breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length, reloads,
}, null, 1));

