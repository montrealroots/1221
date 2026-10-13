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
import { ADJUSTMENTS } from '../src/engine/content/workbook';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const SCENARIO = arg('scenario', 'leave');
const SEED = arg('seed', 'sc-0');
const NY = 'America/New_York';
const on = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);

interface Hook { years: number; config: Record<string, unknown>; resident?: boolean; ownWork?: false; workNotes?: false; daily(sim: Simulation, log: string[]): void; stopWhen?(sim: Simulation, log: string[]): boolean }

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

/** Each day at nine: try what the scenario asks, and say what happened when it changed. */
const tryOnce = (sim: Simulation, log: string[], kind: string, payload: Record<string, unknown>, when = true) => {
  if (!when) return false;
  const r = sim.execute({ kind, payload });
  if (r.ok) log.push(`${new Date(sim.now).toISOString().slice(0, 10)} ${kind}`);
  // The first refusal of each command, so a path that never goes through says why.
  else if (!log.some((l) => l.startsWith(`refused ${kind}`))) log.push(`refused ${kind}: ${r.error}`);
  return r.ok;
};

/** The way back from a leave: notice once it's allowed, then registration once it's asked. */
const comeBack = (sim: Simulation, log: string[]) => {
  const s = sim.player.school;
  if (!s) return;
  if (s.leave?.status === 'on' && !s.leave.noticeAt) tryOnce(sim, log, 'school.return_notice', {});
  if (s.mustRegister) tryOnce(sim, log, 'school.reregister', {});
};

const SCENARIOS: Record<string, Hook> = {
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
    years: 2, config: { startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, bankId: 'gb-barclays' }, resident: true,
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
  brief: {
    years: 0.053, config: { homeRegionId: 'us-ny-newyork' },
    daily() {},
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
};

const hook = SCENARIOS[SCENARIO];
if (!hook) throw new Error(`No scenario ${SCENARIO}: ${Object.keys(SCENARIOS).join(', ')}`);
if (hook.ownWork === false) POLICY.ownWork = false;
if (hook.workNotes === false) POLICY.workNotes = false;
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

