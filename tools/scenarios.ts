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
 *
 *   npx vite-node tools/scenarios.ts -- --scenario leave --seed sc-0 [--watch] [--years 1.5 --save leave.json]
 */
import { writeFileSync } from 'node:fs';
import { loadSave, quickSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '../src/engine/core/time';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { breaches } from '../src/engine/core/invariants';
import { healthOf } from '../src/engine/systems/health';
import { at, termStart } from '../src/engine/systems/school';
import { recordWages } from '../src/engine/systems/earnings';
import { owedAll, returnsOf } from '../src/engine/systems/taxreturn';
import { owedToState } from '../src/engine/systems/statetax';
import { SWITCH_KIND } from '../src/engine/systems/lending';
import { attentiveHour, life } from './policy';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const SCENARIO = arg('scenario', 'leave');
const SEED = arg('seed', 'sc-0');
const NY = 'America/New_York';
const on = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);

interface Hook { years: number; config: Record<string, unknown>; resident?: boolean; daily(sim: Simulation, log: string[]): void }

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
let sim = hook.resident ? quickSave(hook.config as never, SEED) : life(SEED, { pronouns: 'they/them', ...hook.config } as never);
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
    welfares: (s.welfares ?? []).map((w) => w.outcome), formerClasses: (s.formerClasses ?? []).map((c) => ({ classOf: c.classOf, mates: c.classmates.length, playedTo: c.playedTo })),
    classmates: s.classmates.length, terms: (s.history ?? []).map((h) => `${h.term}:${h.standing}`), conferred: titles(/Degree|Conferred|Graduat/),
    credits: (s.credits ?? []).map((c) => `${c.year} ${c.kind} ${c.size ?? ''}`), joinedHistory: (s.joinedHistory ?? []).map((p) => `${p.term} ${p.play ?? p.name}`), firstClassGraduated: (s.formerClasses ?? []).map((c) => c.graduatedAt !== undefined),
    // Anything paid, billed or credited inside a leave's own terms: there should be none.
    duringLeave: (s.leaves ?? []).filter((l) => l.startedAt !== undefined).map((l) => { const to = at(termStart(l.returnTerm).date, 0); return sim.universe.transactions.filter((t) => t.at >= l.startedAt! && t.at < to && /Work-study wages|Living-expense scholarship|Yale Summer Cabaret stipend/.test(t.memo)).length; }),
  } : undefined,
  switches: sim.player.payments?.switches, accounts: Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings')).map((a) => `${a.institution} ${a.kind}${a.closedAt ? ' closed' : ''}${a.switchDebt ? ' in debt' : ''}`),
  taxPlan: sim.player.taxPlan ? { status: sim.player.taxPlan.status, payments: sim.player.taxPlan.history.filter((h) => /payment/i.test(h.what)).length, history: sim.player.taxPlan.history.slice(-6).map((h) => h.what) } : undefined,
  owedIrs: owedAll(sim.player, sim.now),
  // Each state's side (integration pass): what it assessed, owes, took by levy, and its plan.
  states: Object.fromEntries(Object.values(sim.player.returns ?? {}).flatMap((r) => Object.entries(r.stateDue ?? {}).map(([st, sd]) => [`${r.year} ${st}`, { balance: sd.balance, owed: sd.owed ?? 0, payments: (sd.payments ?? []).map((p) => p.how), notices: sd.collection ?? 0 }]))),
  statePlans: Object.fromEntries(Object.entries(sim.player.statePlans ?? {}).map(([st, p]) => [st, { status: p.status, history: p.history.slice(-5).map((h) => h.what) }])),
  breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length, reloads,
}, null, 1));

