/**
 * The pay's played sequences and the saves its walk opens (brief 19, D7 and D8, 2026-10-21). A new life is played by the
 * clock; TEST SETUP, said here as in the tests, writes what the work system and the agent's system write, which were built
 * apart (the coordinator wires their acceptance to `schedulePay`): an engagement with its promised pay, and an agreement
 * signed and later ended. A graduate is made through the School's own Commencement handler, as tests/pro-core.test.ts
 * makes one.
 *
 *   npx vite-node docs/verification/career-2026-10-20/pay/make-saves.ts -- OUTDIR
 *
 * Writes `OUTDIR/work-none.json` (a graduate on September 4, 2026, nothing booked), `OUTDIR/work-paid.json` (the same
 * graduate on October 8, 2026: represented SAG-AFTRA work paid and passed on, an Off-Broadway run contracted while
 * represented and still owed after the agreement ended, and an unsigned short paid straight to checking) and prints,
 * in order, every notice the player reads and every line the checking account's statement gains but the day's food, and
 * what the trust account holds at each step.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createSave } from '../../../../src/engine';
import type { Simulation } from '../../../../src/engine/core/simulation';
import { MS_DAY, MS_HOUR, addDays, formatDateTime, instantFromZoned } from '../../../../src/engine/core/time';
import { formatMoney } from '../../../../src/engine/core/money';
import { newLifeConfig } from '../../../../src/engine/world/bootstrap';
import { serialise } from '../../../../src/engine/persistence/adapter';
import { COMMENCEMENT_KIND, EVALUATION_KIND } from '../../../../src/engine/systems/school';
import { AGREEMENT, AGREEMENT_TERMS, RATES, projectById } from '../../../../src/engine/content/careerwork';
import { ensurePro, type Agreement, type Engagement, type Opportunity } from '../../../../src/engine/systems/pro';
import { negotiatedAmount, paydayAfter, schedulePay } from '../../../../src/engine/systems/propay';
import { activity } from '../../../../src/engine/systems/statements';
import { breaches } from '../../../../src/engine/core/invariants';

const OUT = process.argv.at(-1) ?? '.';
mkdirSync(OUT, { recursive: true });
const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const money = (c: number) => formatMoney(c, 'USD');
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
function graduate(): Simulation {
  const sim = createSave(1, 'b19-pay', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(2026, 9, 4, 10));
  return sim;
}
function signed(sim: Simulation, signedAt: number): Agreement {
  const a: Agreement = { id: sim.nextId('pro'), agentId: 'jordan-parente', offeredAt: signedAt - 3 * MS_DAY, standsUntil: signedAt + 11 * MS_DAY, status: 'accepted', terms: [...AGREEMENT_TERMS], signedAt, endsAt: signedAt + AGREEMENT.termDays * MS_DAY };
  ensurePro(sim, sim.player).agreements.push(a);
  return a;
}
function booked(sim: Simulation, o: { project: string; days: number[]; amount: number; per: 'day' | 'week'; via?: 'agent' | 'open'; agreementId?: string }): Engagement {
  const pro = ensurePro(sim, sim.player);
  const template = projectById(o.project)!;
  const oppId = sim.nextId('pro');
  const eId = sim.nextId('pro');
  const days = o.days.map((d) => ({ from: d + MS_HOUR, to: d + 9 * MS_HOUR, label: template.schedule.kind === 'run' ? 'Rehearsal' : 'Shoot' }));
  const weeks = new Map<number, number[]>();
  for (const d of days) { const due = paydayAfter(d.from); weeks.set(due, [...(weeks.get(due) ?? []), d.from]); }
  const deferred = RATES[template.pay].deferred === true;
  const pay = [...weeks.entries()].map(([due, list], n) => ({ id: sim.nextId('pro'), key: `${eId}:${n + 1}`, promised: deferred ? 0 : o.per === 'week' ? o.amount : o.amount * list.length, currency: 'USD', promisedAt: sim.now, due, ...(deferred ? { deferred: true as const } : {}) }));
  const opp: Opportunity = { id: oppId, projectId: o.project, via: o.via ?? 'open', ...(o.via === 'agent' ? { agentId: 'jordan-parente' } : {}), status: 'booked', postedAt: sim.now - 10 * MS_DAY, submitBy: sim.now - 5 * MS_DAY, offer: { at: sim.now - MS_DAY, until: sim.now + 6 * MS_DAY, rate: template.pay, amount: o.amount, per: o.per, units: o.per === 'week' ? pay.length : days.length }, resolvedAt: sim.now, engagementId: eId, history: [], counts: {} };
  const e: Engagement = { id: eId, opportunityId: oppId, projectId: o.project, role: template.role.part, status: 'booked', days, ...(o.agreementId ? { agreementId: o.agreementId } : {}), pay, history: [], counts: {} };
  pro.opportunities.push(opp);
  pro.engagements.push(e);
  return e;
}
const runDays = (monday: number, weeks: number) => Array.from({ length: weeks * 6 }, (_, i) => addDays(monday, Math.floor(i / 6) * 7 + (i % 6), NY));

const sim = graduate();
writeFileSync(`${OUT}/work-none.json`, serialise(sim.universe));
let seenNotices = sim.universe.notifications.length;
const checking = () => sim.universe.accounts[sim.player.primaryAccountId!]!;
let seenLines = activity(sim, checking(), sim.now, sim.now + 1).lines.length;
let from = sim.now;
const trust = () => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'escrow' && a.category === 'trust');
const report = (title: string) => {
  console.log(`\n=== ${title} (${formatDateTime(sim.now, NY)})`);
  for (const n of sim.universe.notifications.slice(seenNotices)) console.log(`NOTICE ${n.title}: ${n.body}`);
  seenNotices = sim.universe.notifications.length;
  const lines = activity(sim, checking(), from, sim.now).lines;
  // The day's food, bought each midnight, is left out: it's every day's, and the pay isn't among it.
  for (const l of lines.slice(seenLines).filter((x) => x.category !== 'food')) console.log(`STATEMENT ${formatDateTime(l.at, NY)}  ${l.amount >= 0 ? '+' : ''}${money(l.amount)}  ${l.memo}  (balance ${money(l.balance)})`);
  seenLines = lines.length;
  console.log(`TRUST ACCOUNT ${trust() ? money(trust()!.balance) : 'none'}`);
};
for (const n of sim.universe.notifications.filter((x) => x.title.includes('Equity'))) console.log(`NOTICE ${n.title}: ${n.body}`);
seenNotices = sim.universe.notifications.length;
from = sim.now;
seenLines = 0;

// TEST SETUP: signed with the agent on September 8; three engagements booked as the work system books them.
tended(sim, at(2026, 9, 8, 10));
const a = signed(sim, sim.now);
const sag = booked(sim, { project: 'calloway-files', days: [at(2026, 9, 21), at(2026, 9, 22)], amount: negotiatedAmount(RATES['sag-tv-day'].amount!, 'sag-aftra', true), per: 'day', via: 'agent', agreementId: a.id });
const run = booked(sim, { project: 'calder-street', days: runDays(at(2026, 9, 28), 2), amount: 1_051_00, per: 'week', via: 'agent', agreementId: a.id });
for (const e of [sag, run]) schedulePay(sim, sim.player, e);
report('Booked: The Calloway Files at scale plus ten, and two weeks of A House On Calder Street, both through the agent');
tended(sim, at(2026, 10, 1, 13));
report('The Calloway Files’ payday');
// TEST SETUP: the agreement ended by agreement on October 2, as the agent's system ends one.
Object.assign(a, { status: 'ended', endedAt: at(2026, 10, 2, 12), endedHow: 'agreement' });
tended(sim, at(2026, 10, 6, 13));
report('Passed on from the trust account, three business days on');
tended(sim, at(2026, 10, 8, 13));
report('A House On Calder Street’s first week, after the agreement ended: still commissioned');
writeFileSync(`${OUT}/work-paid.json`, serialise(sim.universe));
tended(sim, at(2026, 10, 16, 13));
report('Its second week, and its pass-on');
console.log(`\nbreaches: ${JSON.stringify(breaches(sim.universe, sim.now))}`);
