/**
 * Three students lived through school, the degree and the profession (from
 * 2026-10-08), each by public commands only, to measure the class as people
 * over years: who's close, who's a rival, what's remembered, how many
 * notices it takes. Living is the lifetime probe's: an hour at a time, sleep
 * and meals and washing through `life.look_after`, each decision taken its
 * first way. The setup (the save, the shortcuts the probe also turns on) is
 * the only thing not a command.
 *
 *   npx vite-node tools/social-lives.mjs <engaged|selective|unreliable> <seed> <until YYYY-MM-DD> [out.json]
 *
 * A long life goes in pieces: each writes `<out>.save.json` beside its report,
 * and a piece run again with the same `out` carries on from there.
 *
 * - engaged: prepares, answers every classmate and friend yes, asks someone
 *   out every second evening (the one least seen), takes another time offered;
 * - selective: prepares more and goes to bed at nine, says yes to its three closest only,
 *   politely no to the rest, asks one of them out a week;
 * All three look for work and keep their money as the lifetime probe does,
 * and seek other representation by `AGENCY` (stay, climb or churn);
 * the engaged and the selective learn each part booked before it's played.
 * - unreliable: says yes to everything, then calls off a fifth at short
 *   notice and spends a Sunday in New York over a tenth of Sunday's (missing them), and from
 *   the second spring makes amends with whoever it let down, and moves plans
 *   rather than dropping them.
 * After the degree each moves to New York, where the class lives.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createSave, loadSave } from '../src/engine/index.ts';
import { newLifeConfig } from '../src/engine/world/bootstrap.ts';
import { deserialise, serialise } from '../src/engine/persistence/adapter.ts';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '../src/engine/core/time.ts';
import { breaches } from '../src/engine/core/invariants.ts';
import { suggestedSleep } from '../src/engine/systems/life.ts';
import { queryRefusal } from '../src/engine/systems/career.ts';
import { AGENCIES } from '../src/engine/content/career.ts';
import { agencyOutlook } from '../src/engine/systems/representation.ts';
import { learnPartRefusal, productionOf, productionsOf } from '../src/engine/systems/companies.ts';
import { attributesOf } from '../src/engine/systems/attributes.ts';
import { bankAccountsOf } from '../src/engine/systems/banking.ts';
import { cardsOf, stateOf } from '../src/engine/systems/credit.ts';
import { courseworkOf, notesOf, prepareRefusal, questionsFor, activitiesOf } from '../src/engine/systems/coursework.ts';
import { CHOICES, amendsRefusal, momentsOf, personOf } from '../src/engine/systems/classmates.ts';
import { MEET_KIND, contactsOf, levelOf } from '../src/engine/systems/people.ts';
import { restaurantsIn, diningQuote } from '../src/engine/systems/dining.ts';
import { freshnessOf } from '../src/engine/systems/learning.ts';
import { planBy } from '../src/engine/systems/journey.ts';

const [kind = 'engaged', seed = 'social-1', untilKey = '2031-06-01', out] = process.argv.slice(2);
const AGENCY = process.env.AGENCY ?? 'stay';
const until = Date.parse(`${untilKey}T12:00:00Z`);
let sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', wealth: 'modest', family: 'modest', firstName: 'Sam', lastName: 'Reyes', pronouns: 'they/them', tutorial: false });
sim.player.automation = { unloadShopping: true, packForMe: true, laundry: true, washUp: true, tidy: true, restock: true, replaceClothes: true, feedPets: true };
const before = out && existsSync(`${out}.save.json`) ? JSON.parse(readFileSync(out, 'utf8')) : undefined;
if (before) sim = loadSave(deserialise(readFileSync(`${out}.save.json`, 'utf8')));

const tally = {};
const carried = () => before?.commands ?? {};
const count = (k) => { tally[k] = (tally[k] ?? 0) + 1; };
const run = (k, payload = {}) => { const r = sim.execute({ kind: k, payload }); count(`${k}:${r.ok ? "ok" : "refused"}`); if (!r.ok) count(`  ${k}: ${String(r.error).slice(0, 70)}`); return r; };
let at = (x) => zonedParts(x, sim.zone);
let snapshot = before?.graduation;
// The notices as they come (the save keeps its last 500), and the class each first of January.
const seen = new Set(sim.universe.notifications.map((n) => n.id));
const notices = before?.notices ?? {};
const yearly = before?.yearly ?? [];
const noticed = () => { for (const n of sim.universe.notifications) if (!seen.has(n.id)) { seen.add(n.id); const y = new Date(n.at).getUTCFullYear(); notices[y] ??= {}; notices[y][n.category] = (notices[y][n.category] ?? 0) + 1; notices[y][n.title] = (notices[y][n.title] ?? 0) + 1; } };

function care() {
  const p = sim.player; const w = p.wellbeing; const h = at(sim.now).hour;
  if (h >= (kind === 'selective' ? 21 : 22) || h < 5) { if ((p.awakeSince ?? 0) <= sim.now) { const s = suggestedSleep(sim); if (s.hours > 0) run('life.sleep', { hours: s.hours }); } return; }
  if ((w.nourishment ?? 100) < 60) { const r = tend('eat'); if (!r.ok && /sink/.test(r.error ?? '') && tend('washup').ok) { delete wait.eat; tend('eat'); } }
  if ((w.hygiene ?? 100) < 50) tend('wash');
  if (w.stress > 55 || w.morale < 35) tend('unwind');
}

/** Looking after yourself as somebody would: a thing refused (no money, no time) isn't tried again for three hours. Every command copies the save to undo a refusal, so an hourly retry of a meal there's no money for was most of the time a broke life took. */
const wait = {};
function tend(action) {
  if ((wait[action] ?? 0) > sim.now) return { ok: false };
  const r = run('life.look_after', { action });
  if (!r.ok) wait[action] = sim.now + 3 * MS_HOUR;
  return r;
}

function decisions() {
  for (const d of Object.values(sim.universe.decisions)) {
    if (d.resolvedAt || d.dismissedAt || !d.actions.length) continue;
    if (!run('world.take_decision_action', { decisionId: d.id, actionIndex: 0 }).ok && d.actions.length > 1) run('world.take_decision_action', { decisionId: d.id, actionIndex: 1 });
  }
}

/**
 * Work, as the lifetime probe looks for it (`probe/play-to-death.ts`): put up
 * for parts three times a season, every offer taken, the agencies written to
 * when unrepresented; and after the degree, a move to the agency's town. Until
 * 2026-10-08 these lives never looked for work, and an engaged graduate's two
 * years in New York (ten jobs offered unasked) were read as the acting life
 * not paying.
 */
function career() {
  const p = sim.player; const c = p.career; const school = p.school;
  if (c && (c.since !== undefined || (school && !inSchool()) || (inSchool() && [5, 6, 7, 8].includes(at(sim.now).month)))) {
    if ((c.submitted ?? 0) < 3) run('career.self_submit');
    for (const b of c.bookings) if (b.status === 'offered') run('career.accept', { bookingId: b.id });
  }
  // A part booked, learned before it's played: an hour an evening (the selective two), till it's known; the unreliable student comes in on book.
  if (c && kind !== 'unreliable') for (const b of c.bookings.filter((x) => x.status === 'accepted')) for (let n = 0; n < (kind === 'selective' ? 2 : 1); n += 1) { if (learnPartRefusal(sim, p, b.id) || (productionOf(p, b.id)?.lines ?? 0) >= 0.85) break; run('career.learn_part', { bookingId: b.id }); }
  if (!inSchool() && !queryRefusal(sim, p)) run('career.query_agencies');
  // Representation, by the policy (`AGENCY` in the environment, from 2026-10-08): 'stay' never approaches another agency;
  // 'climb' approaches those within reach or a stretch that reach further than its own; 'churn' approaches every one it may.
  if (AGENCY !== 'stay' && c?.since !== undefined && !inSchool()) {
    const mine = c.agencyId ? AGENCIES.find((a) => a.id === c.agencyId) : undefined;
    for (const o of agencyOutlook(sim, p)) {
      if (o.refusal) continue;
      if (AGENCY === 'climb' && (o.chance === 'Out Of Reach' || (mine && o.agency.tier >= mine.tier))) continue;
      run('career.approach_agency', { agencyId: o.agency.id, ...(o.referrer ? { via: 'referral' } : {}) });
    }
  }
}

/** Money, as the lifetime probe keeps it: a floor in the current account from savings, the cards paid, debts paid when there's money. */
function money() {
  const p = sim.player;
  const accounts = bankAccountsOf(sim, p);
  const current = accounts.find((a) => a.id === p.primaryAccountId);
  const savings = accounts.find((a) => a.kind === 'savings');
  const floor = 4_000_00;
  if (current && savings) {
    if (current.balance < floor && savings.balance > 0) run('bank.transfer', { fromId: savings.id, toId: current.id, amount: Math.min(savings.balance, floor * 2 - current.balance) });
    else if (current.balance > floor * 4) run('bank.transfer', { fromId: current.id, toId: savings.id, amount: current.balance - floor * 2 });
  }
  for (const card of cardsOf(sim, p)) { const st = stateOf(p, card); if (st.statementBalance > 0 && (current?.balance ?? 0) > st.statementBalance) run('finance.pay_card', { amount: 'full', accountId: card.id }); }
  for (const a of Object.values(sim.universe.accounts).filter((x) => x.ownerId === p.id)) {
    if (a.balance >= 0 || (current?.balance ?? 0) < -a.balance + floor / 2) continue;
    if (a.category === 'arrears') run('home.pay_landlord', { amount: -a.balance });
    if (a.category === 'medical') run('health.pay_bill', { amount: -a.balance });
    if (a.category === 'collections') run('bank.pay_collections', { accountId: a.id, amount: -a.balance });
  }
}

const rng = (key) => sim.rng('probe.social', sim.player.id, key).next();
const inSchool = () => sim.player.school && sim.player.school.standing !== 'graduated' && sim.player.school.standing !== 'dismissed';
const classmates = () => contactsOf(sim.player).filter((c) => c.classmate !== undefined);
const closest = (n) => [...classmates()].filter((c) => !c.rival).sort((a, b) => b.hours - a.hours).slice(0, n).map((c) => c.id);

function coursework(steps) {
  const cw = courseworkOf(sim, sim.player);
  if (!cw) return;
  for (const a of cw.assignments.filter((x) => x.status === 'open' || x.status === 'revising')) {
    if (a.feedback && !a.feedback.seen) run('school.read_feedback', { assignmentId: a.id });
    for (const k of a.asks ?? []) if (k.status === 'open') run('school.answer_partner', { assignmentId: a.id, askId: k.id, yes: kind !== 'selective' || closest(3).includes(contactsOf(sim.player).find((c) => c.classmate === a.partner)?.id) });
    for (let n = 0; n < steps; n += 1) {
      const act = activitiesOf(a).find((x) => x.dim !== 'partner' && !prepareRefusal(sim, sim.player, a, x.id));
      if (!act || !run('school.prepare', { assignmentId: a.id, activity: act.id }).ok) break;
    }
    for (const { q, options } of questionsFor(a)) if (!a.answers[q.id]) run('school.choose', { assignmentId: a.id, question: q.id, option: (options.find((o) => o.supported) ?? options[0]).id });
  }
  for (const m of momentsOf(cw).filter((x) => x.status === 'open')) {
    const warm = { disagreement: 'both', study: 'yes', help: 'help', apology: 'accept', boundary: 'respect', encouragement: '' };
    const cool = { disagreement: 'hold', study: 'no', help: 'no', apology: 'accept', boundary: 'respect', encouragement: '' };
    const close = closest(3).includes(contactsOf(sim.player).find((c) => c.classmate === m.mate)?.id);
    run('school.respond', { momentId: m.id, choice: (kind === 'selective' && !close ? cool : warm)[m.kind] || CHOICES[m.kind][0].id });
  }
}

function invitation(c, when) {
  const school = inSchool();
  const kinds = school ? ['coffee', 'study', 'show', 'meal'] : ['meal', 'walk', 'film', 'meal'];
  const what = kinds[Math.floor(rng(`kind-${c.id}-${when}`) * kinds.length)];
  if (what === 'meal') {
    const r = restaurantsIn(c.cityId).find((x) => x.menu.some((m) => m.price !== null && diningQuote(sim, x, [m.item], 'in')));
    const item = r?.menu.find((m) => m.price !== null && diningQuote(sim, r, [m.item], 'in'))?.item;
    return r && item ? { contactId: c.id, at: when, what, restaurantId: r.id, item } : { contactId: c.id, at: when, what: 'walk' };
  }
  if (what === 'show' && [5, 6, 7, 8].includes(zonedParts(when, sim.zone).month)) return { contactId: c.id, at: when, what: 'coffee' };
  if (what === 'show') {
    // The next Cabaret night at eight.
    for (let n = 0; n < 7; n += 1) { const t = when + n * MS_DAY; const p = zonedParts(t, sim.zone); if (p.weekday >= 4 && p.weekday <= 6) return { contactId: c.id, at: instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 20, minute: 0 }, sim.zone), what }; }
  }
  return { contactId: c.id, at: when, what };
}

function social(dayIndex) {
  const p = sim.player;
  // Their asks.
  for (const c of contactsOf(p).filter((x) => x.ask)) {
    const yes = kind !== 'selective' || closest(3).includes(c.id);
    const r = run('social.answer', { contactId: c.id, yes });
    if (!r.ok && yes) run('social.answer', { contactId: c.id, yes: false, at: c.ask ? c.ask.at + MS_DAY : undefined });
  }
  // Asking someone out: the one least seen of the class (engaged, unreliable), or one of the closest three (selective).
  const every = kind === 'selective' ? 7 : 2;
  if (dayIndex % every === 0) {
    const pool = kind === 'selective' && closest(3).length ? classmates().filter((c) => closest(3).includes(c.id)) : classmates().filter((c) => !c.rival);
    const c = [...pool].sort((a, b) => (a.lastSeen ?? 0) - (b.lastSeen ?? 0))[0];
    if (c) {
      const z = at(sim.now);
      const when = instantFromZoned({ year: z.year, month: z.month, day: z.day, hour: 19, minute: 0 }, sim.zone) + 2 * MS_DAY;
      const inv = invitation(c, when);
      const r = run('social.invite', inv);
      if (r.ok && !r.value.accepted && r.value.counter) { count('counter offered'); run('social.invite', { ...inv, at: r.value.counter }); }
    }
  }
  // A plan they'll be away for, called off when they're told (the engaged and the selective; the unreliable student lets it go).
  if (kind !== 'unreliable') for (const m of sim.universe.scheduled.filter((x) => x.kind === MEET_KIND && x.status === 'pending' && x.payload.personId === p.id && x.payload.awayTold)) run('social.cancel', { itemId: m.id });
  // The unreliable student's plans: a fifth called off late, a tenth missed for a day in New York; from the second spring, moved instead, and amends made.
  if (kind === 'unreliable') {
    const reformed = sim.now > Date.parse('2028-02-01');
    for (const m of sim.universe.scheduled.filter((x) => x.kind === MEET_KIND && x.status === 'pending' && x.payload.personId === p.id && x.at - sim.now < 2 * MS_DAY && x.at > sim.now)) {
      const r = rng(`plan-${m.id}`);
      if (reformed) { if (r < 0.2) run('social.reschedule', { itemId: m.id, at: m.at + MS_DAY }); continue; }
      if (r < 0.2) { if (m.at - sim.now < MS_DAY) run('social.cancel', { itemId: m.id }); }
      // A Sunday's plans missed for a day in New York, the noon train out and the first back after the plan's hour: in another town then, and home for Monday.
      else if (r < 0.3 && inSchool() && zonedParts(m.at, sim.zone).weekday === 0) { const z = zonedParts(m.at, sim.zone); const day = instantFromZoned({ year: z.year, month: z.month, day: z.day, hour: 0, minute: 0 }, sim.zone); const back = [...Array(45).keys()].find((i) => { const legs = planBy(sim, 'mnr-nhv-gct', 'us-ny-newyork', 'us-ct-newhaven', day, i, 0); return typeof legs !== 'string' && legs[0].departAt > m.at + (m.durationMinutes ?? 60) * 60_000; }); if (back !== undefined) run('travel.book', { toCity: 'us-ny-newyork', day, by: 'mnr-nhv-gct', slot: 20, returnDay: day, returnSlot: back }); }
    }
    if (reformed) for (const [i] of (p.school?.classmates ?? []).entries()) if (!amendsRefusal(sim, p, i)) run('school.make_amends', { mate: i });
  }
}

let dayIndex = 0;
let lastDay = '';
const started = Date.now();
while (sim.universe.meta.endedAt === undefined && sim.now < until) {
  sim.advanceTo(sim.now + MS_HOUR, { stopOnPlayerRequired: true });
  care();
  const z = at(sim.now);
  const key = `${z.year}-${z.month}-${z.day}`;
  if (z.hour >= 17 && z.hour < 21 && key !== lastDay) {
    lastDay = key;
    dayIndex += 1;
    decisions();
    if (inSchool()) coursework(kind === 'selective' ? 3 : kind === 'engaged' ? 2 : 1);
    social(dayIndex);
    career();
    money();
    // After the degree, to the agency's town, else New York, where the class lives.
    const to = sim.player.career?.agencyCity ?? 'us-ny-newyork';
    if (!inSchool() && sim.player.home?.cityId !== to && sim.player.currentLocationId === sim.player.home?.cityId) run('career.relocate', { cityId: to, kind: 'shared' });
    // A save and a reload each first of the month.
    noticed();
    if (z.day === 1 && z.month === 1) yearly.push(measure(String(z.year)));
    if (z.day === 1) sim = loadSave(deserialise(serialise(sim.universe)));
  }
  if (!snapshot && sim.player.school?.standing === 'graduated') snapshot = measure('graduation');
}

function measure(label) {
  const p = sim.player;
  const cs = classmates();
  const levels = cs.reduce((m, c) => { const l = levelOf(c); m[l] = (m[l] ?? 0) + 1; return m; }, {});
  const mem = cs.map((c) => c.memory.length);
  const yale = cs.map((c) => c.memory.filter((m) => m.what.startsWith('At Yale') || m.what.startsWith('In your class')).length);
  const all = cs.flatMap((c) => c.memory.map((m) => m.what));
  const notes = sim.universe.notifications.reduce((m, n) => { m[n.category] = (m[n.category] ?? 0) + 1; return m; }, {});
  const cw = courseworkOf(sim, p);
  return {
    label, date: new Date(sim.now).toISOString().slice(0, 10), standing: p.school?.standing,
    classmates: cs.length, levels, rivals: cs.filter((c) => c.rival).length, bonds: (p.school?.classmates ?? []).map((m) => Math.round(m.bond ?? 0)),
    hours: { max: Math.round(Math.max(...cs.map((c) => c.hours))), median: Math.round([...cs.map((c) => c.hours)].sort((a, b) => a - b)[Math.floor(cs.length / 2)] ?? 0) },
    memory: { max: Math.max(...mem), mean: Math.round(mem.reduce((a, b) => a + b, 0) / Math.max(1, mem.length)), yaleKeptMin: Math.min(...yale) },
    remembered: { coffee: all.filter((m) => m === 'A coffee at Atticus Market').length, studied: all.filter((m) => m.startsWith('Studied together')).length, show: all.filter((m) => m.startsWith('Saw a show')).length, meal: all.filter((m) => m.startsWith('A meal at')).length, late: all.filter((m) => m.startsWith('Late by')).length, missed: all.filter((m) => m === 'You didn’t come' || m.startsWith('Not there')).length, calledOff: all.filter((m) => m.startsWith('Called off')).length, moved: all.filter((m) => m.startsWith('Moved ')).length, amends: all.filter((m) => m === 'You made it right with them').length, worked: all.filter((m) => m.startsWith('Worked together on')).length },
    notifications: { total: sim.universe.notifications.length, ...notes },
    freshness: cw ? freshnessOf(cw.assignments) : undefined,
    notesLedger: cw ? { subjects: notesOf(cw).length, mostGiven: Math.max(0, ...notesOf(cw).map((n) => n.given)) } : undefined,
    incidentsOpen: (p.school?.classmates ?? []).reduce((n, m) => n + (personOf(m).incidents ?? []).filter((x) => !x.repaired).length, 0),
    breaches: breaches(sim.universe).length,
    worth: Math.round(Object.values(sim.universe.accounts).filter((a) => a.ownerId === p.id).reduce((n, a) => n + a.balance, 0) / 100),
    city: p.home?.cityId, agency: p.career?.agencyId ?? null, credits: p.career?.credits.length ?? 0,
    reputation: Math.round(attributesOf(sim, p).reputation * 10) / 10,
    approaches: (p.career?.approaches ?? []).reduce((m, a) => { m[a.status] = (m[a.status] ?? 0) + 1; return m; }, {}),
    moves: (p.career?.approaches ?? []).filter((a) => a.status === 'signed').length,
    proposals: productionsOf(p).flatMap((x) => x.proposals ?? []).reduce((m, x) => { const k = `${x.kind}:${x.status}`; m[k] = (m[k] ?? 0) + 1; return m; }, {}),
    released: (p.career?.bookings ?? []).filter((b) => b.status === 'released').length,
    productions: productionsOf(p).length,
    offBook: productionsOf(p).filter((x) => x.history.some((h) => h.what === 'You came in off book')).length,
    declined: productionsOf(p).reduce((n, x) => n + x.history.filter((h) => / turned it down$/.test(h.what)).length, 0),
    withdrew: productionsOf(p).reduce((n, x) => n + x.history.filter((h) => / withdrew from /.test(h.what)).length, 0),
    tableReads: productionsOf(p).filter((x) => x.history.some((h) => h.what === 'The table read')).length,
    withClassmates: productionsOf(p).filter((x) => x.slots.some((y) => y.performer.kind === 'classmate')).length,
    sharedDays: productionsOf(p).reduce((n, x) => n + x.slots.reduce((m, y) => m + y.shared, 0), 0),
    classCredits: (p.school?.classmates ?? []).reduce((n, m) => n + (m.career?.credits.length ?? 0), 0),
  };
}

const end = measure('end');
noticed();
const report = { notices, yearly, kind, seed, until: untilKey, wallSeconds: Math.round((Date.now() - started) / 1000), ended: sim.universe.meta.endedAt !== undefined, commands: tally, graduation: snapshot, end };
for (const [k, v] of Object.entries(carried())) tally[k] = (tally[k] ?? 0) + v;
if (before) report.wallSeconds += before.wallSeconds;
if (out) { writeFileSync(out, JSON.stringify(report, null, 1)); writeFileSync(`${out}.save.json`, serialise(sim.universe)); }
console.log(JSON.stringify({ kind, seed, wall: report.wallSeconds, grad: snapshot && { levels: snapshot.levels, rivals: snapshot.rivals, remembered: snapshot.remembered }, end: { levels: end.levels, rivals: end.rivals, memory: end.memory, remembered: end.remembered, notifications: end.notifications.total, breaches: end.breaches } }));
