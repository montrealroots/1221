/**
 * Saves a build before brief 19 wrote, opened by this one and played on into the career (brief 19,
 * `docs/verification/career-2026-10-20/criteria.md` V16, with L1 and L3; the record is
 * `docs/verification/career-2026-10-20/playthroughs/`).
 *
 * FIXTURES, both written by the journey J01 (`tools/journeys.ts`: as made, attentive, papers kept, seed j13-1) at
 * 8283f80c, a build from before brief 19 began: no professional record, none of brief 19's opening steps, and no
 * union's bill. `journey-j01-degree-8283f80c.json.gz` is its life 75 days after its degree (Saturday 4 August 2029, the
 * degree conferred on 21 May 2029), the save tests/language-dynamic.test.ts already reads;
 * `journey-j01-last-term-8283f80c.json.gz` is the same life mid-way through its last term (Thursday 1 March 2029, the
 * journey's third part stopped there with `--to 2029-03-01`, written for these tests on 2026-10-21).
 *
 * PLAYER JOURNEYS from each opening on, by `tools/career-player.ts`: the attentive player's hours through public
 * commands, every commitment stopped at and answered with Go, and the career business an unsigned actor (the graduate)
 * or a graduating one (the student) does through its commands. Nothing is set by hand.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, formatDate, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { UNIONS, projectById } from '@/engine/content/careerwork';
import { currentOf, profileOf, type Engagement } from '@/engine/systems/pro';
import { SHOWCASE_COURSE, SHOWCASE_KIND } from '@/engine/systems/proshowcase';
import { FOLLOW_UP_KIND, drawOf, referrersOf, relationOf } from '@/engine/systems/proagent';
import { AGENTS, agencyOf } from '@/engine/content/agents';
import { AUDITION_KIND, WORK_DAY_KIND } from '@/engine/systems/projobs';
import { LEGEND_BY_CATEGORY, entriesBetween } from '@/engine/world/calendar';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';
import { graduatingActor, playTo, press, readNotices, titleShape, unsignedActor, type Player, type Transcript } from '../tools/career-player';

// TEST SETUP: the looks' links read the game's context, which a page's provider holds; here it's the life the J6 test
// plays (as tests/evidence2-b08.test.ts does it, without the original, which imports the looks back).
const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop, navigate: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const fixture = (name: string): string => gunzipSync(readFileSync(`tests/fixtures/${name}.json.gz`)).toString('utf8');
const cross = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** A calendar entry opened, as the Calendar opens it: the look's words, as the player reads them. */
const entryWords = (sim: Simulation, id: string): string => {
  h.sim = sim;
  const look = resolveLook(sim, subject('entry', id)) as Looked;
  return renderToStaticMarkup(createElement('div', null, look.body)).replace(/<[^>]+>/g, '').replace(/&#x27;/g, '\'');
};
/** Brief 19's opening steps, in the order `ONCE_ON_OPENING` takes them. */
const BRIEF_19_STEPS = ['nameTheCover', 'pro.begun', 'showcase.begun', 'pro.unions'];

/**
 * Everything of the player's a career's opening must leave as it was, as tests/pro-core.test.ts's `carried` reads it,
 * with the rest of the person besides: all but the professional record.
 */
function carried(u: { people: Record<string, unknown>; playerId: string; accounts: Record<string, { id: string; balance: number }>; transactions: unknown[]; scheduled: { status: string; kind: string; id: string; at: number }[] }): string {
  const { pro: _pro, ...person } = structuredClone(u.people[u.playerId]) as Record<string, unknown> & { school?: { coursework?: { assignments: { course: string }[] } } };
  // The showcase's own pieces of DRAM 793b, which its opening step sets as the faculty choose them, are the career's.
  const cw = person.school?.coursework;
  if (cw) cw.assignments = cw.assignments.filter((a) => a.course !== SHOWCASE_COURSE);
  return JSON.stringify({
    person, accounts: Object.values(u.accounts).map((a) => [a.id, a.balance]), transactions: u.transactions,
    pending: u.scheduled.filter((i) => i.status === 'pending' && !i.kind.startsWith('pro.') && !i.kind.startsWith(SHOWCASE_KIND)).map((i) => [i.id, i.kind, i.at]),
  });
}

describe('V16: an existing graduate’s save from before brief 19 (J01 at 8283f80c, 4 August 2029), opened and played on into the career', () => {
  const G = { raw: '', saves: new Map<string, string>(), lines: [] as string[], notices: [] as string[] };
  beforeAll(() => {
    G.raw = fixture('journey-j01-degree-8283f80c');
    let sim = loadSave(deserialise(G.raw) as never);
    G.saves.set('opened', serialise(sim.universe));
    const raw = deserialise(G.raw) as { notifications: { id: string; at: number }[]; decisions: Record<string, unknown> };
    const t: Transcript = { seen: new Set([...raw.notifications.map((n) => `${n.id}@${n.at}`), ...Object.keys(raw.decisions)]), lines: [] };
    readNotices(sim, t);
    const player: Player = { career: unsignedActor(), transcript: t };
    const keep = (name: string) => { G.saves.set(name, serialise(sim.universe)); sim = cross(sim); };
    const until = (name: string, by: number, reached: (s: Simulation) => boolean) => {
      playTo(sim, by, player, reached);
      expect(reached(sim), `${name} by ${formatDate(by, zone)}`).toBe(true);
      keep(name);
    };
    const paid = (s: Simulation) => s.player.pro!.engagements.find((e) => e.pay.length > 0 && !e.pay.some((p) => p.deferred));
    until('portfolio', at(2029, 8, 6), (s) => currentOf(s.player.pro, 'resume') !== undefined);
    until('submitted', at(2029, 9, 30), (s) => s.player.pro!.opportunities.some((o) => o.status !== 'open' && o.status !== 'lapsed'));
    until('booked', at(2029, 10, 30), (s) => paid(s) !== undefined);
    until('worked', at(2029, 11, 30), (s) => paid(s)!.status === 'finished');
    until('paid', at(2029, 11, 30), (s) => paid(s)!.pay.every((p) => p.received !== undefined));
    // Then the agent's way in for an actor the showcase didn't bring him: on the Representation tab, his office's notice
    // read, her materials checked, a referral asked for from a finished job whose work was judged well enough (the
    // tab lists each with its refusal), and her materials sent through it. His office's answer comes on the clock.
    const AGENT = AGENTS[0]!;
    const job = referrersOf(sim, sim.player, AGENT).find((r) => !r.why)!;
    expect(press(sim, t, 'I’ve Read This', 'pro.agent_notice', { agentId: AGENT.id })).toBe(true);
    expect(press(sim, t, 'Check Your Materials', 'pro.agent_check', { agentId: AGENT.id })).toBe(true);
    expect(press(sim, t, 'Ask For A Referral', 'pro.ask_referral', { agentId: AGENT.id, engagementId: job.engagementId })).toBe(true);
    expect(press(sim, t, 'Send Your Materials', 'pro.send_materials', { agentId: AGENT.id })).toBe(true);
    keep('referred');
    until('november', at(2029, 11, 2), (s) => (s.player.pro!.unionBills ?? []).filter((b) => b.due === at(2029, 11, 1)).every((b) => b.settled));
    until('answered', at(2029, 12, 31), (s) => relationOf(s.player, AGENTS[0]!.id)!.stage !== 'sent');
    readNotices(sim, t);
    G.lines = t.lines;
  }, 600_000);
  const opened = (name: string) => loadSave(deserialise(G.saves.get(name)!) as never);

  it('opens with its record built once, from what the save holds: Equity dated at the degree, every opening step taken once, and nothing else changed', () => {
    const before = deserialise(G.raw) as unknown as Parameters<typeof carried>[0] & { opened?: string[]; people: Record<string, { pro?: unknown }> };
    expect(before.people[before.playerId]!.pro).toBeUndefined();
    expect(BRIEF_19_STEPS.filter((x) => before.opened?.includes(x))).toEqual([]);
    const sim = opened('opened');
    expect(sim.universe.opened!.slice(-4)).toEqual(BRIEF_19_STEPS);
    // The degree on 21 May 2029 (Commencement at ten) made her a member of Equity, as the Bulletin says it does (yale.md, B27 p.24).
    expect(sim.player.school!.standing).toBe('graduated');
    expect(sim.player.pro!.equity).toEqual({ since: sim.player.school!.endedAt, how: 'degree' });
    expect(formatDate(sim.player.pro!.equity!.since, zone)).toBe('May 21, 2029');
    expect(profileOf(sim.player, sim.now).training.words).toBe('You completed the MFA in Acting at the David Geffen School of Drama at Yale University in 2029.');
    // Everything outside the professional record carried as it was, to the byte: the person, every account and
    // transaction, and every commitment.
    expect(carried(sim.universe as never)).toBe(carried(before));
    // A second opening builds nothing again.
    expect(serialise(cross(sim).universe)).toBe(G.saves.get('opened'));
    expect(breaches(sim.universe, sim.now)).toEqual([]);
  });

  it('tells the unions’ debt and charges nothing for a past date: Equity’s $600.00 down and its first dues are billed at the next billing, 1 November 2029, and taken then', () => {
    const sim = opened('opened');
    const told = sim.universe.notifications.filter((n) => n.title === 'What You Owe Actors’ Equity');
    expect(told).toHaveLength(1);
    expect(told[0]!.body).toBe('You joined Actors’ Equity Association with your degree on May 21, 2029. Your save is from before the game charged the union’s fees, so nothing was charged for that day. Its initiation fee is $1,800.00, paid within three years: $600.00 is taken on November 1, 2029, then $600.00 on May 21, 2030 and $600.00 on May 21, 2031. Basic dues are $88.00 each May and November, from November 1, 2029.');
    // Nothing moved on opening: the same transactions as the save held.
    expect(sim.universe.transactions.length).toBe((deserialise(G.raw) as { transactions: unknown[] }).transactions.length);
    // Equity's figures (S27): $1,800 within three years, $600 down; basic dues $176 a year, $88 each May and November.
    expect(UNIONS.equity.down).toBe(600_00);
    const bills = sim.player.pro!.unionBills!.map((b) => [b.key, b.amount, formatDate(b.due, zone), b.settled ?? null]);
    expect(bills).toEqual([
      ['equity:initiation:1', 600_00, 'November 1, 2029', null], ['equity:initiation:2', 600_00, 'May 21, 2030', null], ['equity:initiation:3', 600_00, 'May 21, 2031', null],
      ['equity:dues:2029-11', 88_00, 'November 1, 2029', null],
    ]);
    // Played to the billing: taken on its day, once each, and not before.
    const nov = opened('november');
    // The union's money out of her own accounts, by its category, since the save opened: the $600.00 down and the
    // first half-year's $88.00, both on November 1.
    const own = Object.values(nov.universe.accounts).filter((x) => x.ownerId === nov.player.id).map((x) => x.id);
    const taken = nov.universe.transactions.filter((x) => x.category === 'dues' && x.at > sim.now);
    expect(taken.map((x) => [x.postings.filter((q) => own.includes(q.accountId)).reduce((n, q) => n + q.amount, 0), formatDate(x.at, zone)])).toEqual([
      [-600_00, 'November 1, 2029'],
      [-88_00, 'November 1, 2029'],
    ]);
    expect(breaches(nov.universe, nov.now)).toEqual([]);
  });

  it('PLAYER JOURNEY: unsigned, makes a portfolio, submits to the open calls that take her, auditions, is booked, works the days and is paid straight to her account with no commission, the credit on her résumé', () => {
    const sim = opened('paid');
    const e = sim.player.pro!.engagements.find((x) => x.pay.length > 0 && !x.pay.some((p) => p.deferred)) as Engagement;
    const project = projectById(e.projectId)!;
    // An open call: one she could submit to herself, with nobody representing her.
    const o = sim.player.pro!.opportunities.find((x) => x.id === e.opportunityId)!;
    expect(o.via).toBe('open');
    expect(project.access.open).not.toBe(false);
    expect(e.agreementId).toBeUndefined();
    expect(o.history.map((h) => h.kind)).toEqual(['opportunity', 'submitted', 'audition', 'audition', 'offer', 'booked']);
    expect(o.rounds![0]!.status).toBe('done');
    // The days worked and judged, and the credit.
    expect(e.log!.every((l) => l.status === 'worked' && l.band !== undefined)).toBe(true);
    const credit = sim.player.pro!.credits.find((c) => c.engagementId === e.id)!;
    expect(credit).toMatchObject({ project: project.project, role: project.role.part, status: 'shot' });
    // Paid straight to checking, as wages, with no commission: unrepresented.
    for (const p of e.pay) {
      expect(p.received).toMatchObject({ via: 'direct', commission: 0, gross: p.promised });
      expect(p.received!.net).toBe(p.promised - p.received!.withheld - (p.received!.dues ?? 0));
    }
    for (const p of e.pay) {
      const wage = sim.universe.transactions.find((x) => x.id === p.received!.txnId)!;
      expect(wage.category).toBe('salary');
      expect(wage.postings.some((q) => q.amount === p.received!.net && sim.universe.accounts[q.accountId]?.ownerId === sim.player.id)).toBe(true);
    }
    // The credit on the résumé.
    const resume = opened('november').player.pro!.materials.filter((m) => m.kind === 'resume').at(-1)!;
    expect(resume.contains.some((line) => line.startsWith(`${project.role.part}, ${project.project}, ${project.company}, 2029`))).toBe(true);
    expect(breaches(sim.universe, sim.now)).toEqual([]);
  });

  it('PLAYER JOURNEY: Ask For A Referral, from the director of the student film her work in was judged Strong: his office’s notice read, her materials checked, the referral asked for and her materials sent through it, and his office’s answer, a request for a reel', () => {
    const AGENT = AGENTS[0]!;
    const sim = opened('referred');
    const pro = sim.player.pro!;
    const film = pro.engagements.find((e) => e.projectId === 'paper-moons')!;
    const other = pro.engagements.find((e) => e.projectId !== 'paper-moons' && e.status === 'finished')!;
    // Each finished job is listed with whether it can refer: work judged Strong or better (`REFERRAL_BAND`).
    expect(pro.credits.find((c) => c.engagementId === film.id)!.band).toBe('strong');
    expect(pro.credits.find((c) => c.engagementId === other.id)!.band).toBe('working');
    expect(referrersOf(sim, sim.player, AGENT).find((r) => r.engagementId === other.id)!.why).toBe(`A referral needs work judged Strong or better in the game, and your work as ${other.role} was Working.`);
    // The referral is the route in, from the film's director, and her materials went through it.
    const rel = relationOf(sim.player, AGENT.id)!;
    expect(rel.via).toEqual({ route: 'referral', at: rel.referrals![0]!.at, by: 'the film’s director' });
    expect(rel.referrals!.map((r) => [r.engagementId, r.by, r.job, r.band])).toEqual([[film.id, 'the film’s director', 'Theo in Paper Moons', 'strong']]);
    expect(rel.history.map((e) => e.kind)).toEqual(['discovered', 'checked', 'referred', 'sent']);
    // Said by the director, never by him: no fictional line of his on it.
    const referred = G.lines.find((l) => l.includes('| NOTICE | The Film’s Director Referred You |'))!;
    expect(referred).toContain(`The film’s director has referred you to ${AGENT.name}’s office at Stewart Talent, from your work as Theo in Paper Moons.`);
    expect(referred.endsWith(AGENT.fictional)).toBe(false);
    // His office's answer, two weeks on: seven factors at the bar or beyond, the draw under the chance, and a reel asked
    // for, which she hasn't got.
    const an = opened('answered');
    const answered = relationOf(an.player, AGENT.id)!;
    expect([answered.stage, answered.request!.what]).toEqual(['requested', ['reel']]);
    expect([answered.why!.step, answered.why!.outcome, answered.why!.atOrBeyond]).toEqual(['reply', 'request', 7]);
    expect(drawOf(an, an.player, AGENT, 1, 'interest')).toBeLessThan(answered.why!.chance!);
    // By the title's shape, his office however the build names it (`titleShape`).
    const asked = G.lines.find((l) => { const x = l.split(' | '); return x[1] === 'NOTICE' && titleShape(x[2] ?? '', { name: AGENT.name, agency: agencyOf(AGENT).name }) === 'His Office Asked For More'; })!;
    expect(asked).toContain(`${AGENT.name}’s office at Stewart Talent has asked for a reel by November 8, 2029.`);
    expect(asked.endsWith(AGENT.fictional)).toBe(true);
    expect(breaches(an.universe, an.now)).toEqual([]);
  });
});

describe('J6, the calendar: what the career puts on it, drawn and opened (the graduate of the save from before brief 19, booked)', () => {
  it('draws every commitment the career books in the legend’s Career row, and an audition’s and a shoot day’s entries say the trip is part of them and what missing them costs', () => {
    const sim = loadSave(deserialise(fixture('journey-j01-degree-8283f80c')) as never);
    // Played as the V16 journey above plays it, first to an audition in person on her calendar.
    const audition = (s: Simulation) => s.universe.scheduled.find((i) => i.kind === AUDITION_KIND && i.status === 'pending');
    playTo(sim, at(2029, 10, 30), { career: unsignedActor() }, (s) => audition(s) !== undefined);
    const au = audition(sim)!;
    const said = entryWords(sim, au.id);
    expect(said).toContain('You need to be there, awake, when the clock reaches it. If you aren’t, it’s missed: casting moves on without you, and the role is gone.');
    expect(said).toContain('It’s in New York, two hours each way from New Haven, and the trip is part of it.');
    // On to her first booking.
    playTo(sim, at(2029, 10, 30), { career: unsignedActor() }, (s) => s.player.pro!.engagements.some((e) => e.pay.length > 0 && !e.pay.some((p) => p.deferred)));
    const entries = entriesBetween(sim, sim.now, sim.now + 40 * MS_DAY);
    const career = entries.filter((e) => e.category === 'career' && e.requiresPlayer);
    expect(career.length).toBeGreaterThan(0);
    // Every kind drawn has its row, the career's among them, with a color and what it holds.
    for (const e of entries) expect(LEGEND_BY_CATEGORY[e.category], e.title).toBeDefined();
    // The row kept at the merge of the playthroughs and the built-app walk (2026-10-21), which each gave one; its list
    // begins with the auditions and names a meeting and the work days.
    expect(LEGEND_BY_CATEGORY.career).toMatchObject({ label: 'Career', description: expect.stringMatching(/^Auditions and self-tapes, .+your work days, .+a meeting at an agent’s office/) });
    // A shoot day in New York, opened from the calendar: the trip is part of it, and missing it costs the part.
    const day = career.find((e) => sim.timeline.get(e.id)?.kind === WORK_DAY_KIND && sim.timeline.get(e.id)?.payload.kind === 'shoot')!;
    const words = entryWords(sim, day.id);
    expect(words).toContain('You need to be there, awake, when the clock reaches it. If you aren’t, it’s missed: the production replaces you, and the days you don’t work aren’t paid.');
    expect(words).toContain('It’s in New York, two hours each way from New Haven, and the trip is part of it.');
    expect(words).not.toContain('nothing takes you there');
  }, 300_000);

  it('a showcase call, which leaves from the School, still asks for New Haven, and says what missing a rehearsal or a showcase day costs', () => {
    const sim = loadSave(deserialise(fixture('journey-j01-last-term-8283f80c')) as never);
    const calls = sim.universe.scheduled.filter((i) => i.kind === SHOWCASE_KIND && i.status === 'pending');
    const rehearsal = calls.find((i) => i.payload.call === 'rehearsal')!;
    const day = calls.find((i) => i.payload.call === 'showcase')!;
    expect(entryWords(sim, rehearsal.id)).toContain('You need to be there, awake and in New Haven, when the clock reaches it. If you aren’t, it’s missed: a missed call and a missed class of Actor Showcase, unless you called in sick, or you’re in hospital or laid up with an injury.');
    const words = entryWords(sim, day.id);
    expect(words).toContain('You need to be there, awake and in New Haven, when the clock reaches it. If you aren’t, it’s missed: a missed call and an unexcused absence from Actor Showcase, and your scenes aren’t seen there, unless you called in sick, or you’re in hospital or laid up with an injury.');
    expect(words).toContain('It’s in New Haven, where you already are.');
  });
});

describe('V16: a save from mid-way through the last term, from before brief 19 (J01 at 8283f80c, 1 March 2029), opened onto the showcase and played to the degree', () => {
  const S = { raw: '', saves: new Map<string, string>(), lines: [] as string[] };
  beforeAll(() => {
    S.raw = fixture('journey-j01-last-term-8283f80c');
    let sim = loadSave(deserialise(S.raw) as never);
    S.saves.set('opened', serialise(sim.universe));
    const raw = deserialise(S.raw) as { notifications: { id: string; at: number }[]; decisions: Record<string, unknown> };
    const t: Transcript = { seen: new Set([...raw.notifications.map((n) => `${n.id}@${n.at}`), ...Object.keys(raw.decisions)]), lines: [] };
    readNotices(sim, t);
    const player: Player = { career: graduatingActor(), transcript: t };
    const keep = (name: string) => { S.saves.set(name, serialise(sim.universe)); sim = cross(sim); };
    playTo(sim, at(2029, 5, 9, 12), player);
    keep('showcase');
    playTo(sim, at(2029, 5, 22, 9), player);
    readNotices(sim, t);
    keep('degree');
    S.lines = t.lines;
  }, 600_000);
  const opened = (name: string) => loadSave(deserialise(S.saves.get(name)!) as never);

  it('opens onto the showcase once: past its fourth week, read as the record stands, the faculty’s two scenes, its calls on the calendar, and nothing outside the professional record changed', () => {
    const before = deserialise(S.raw) as unknown as Parameters<typeof carried>[0] & { opened?: string[] };
    expect(BRIEF_19_STEPS.filter((x) => before.opened?.includes(x))).toEqual([]);
    const sim = opened('opened');
    expect(sim.universe.opened!.slice(-4)).toEqual(BRIEF_19_STEPS);
    const sc = sim.player.pro!.showcase!;
    expect(sc.term).toBe(5);
    expect(sc.eligible).toBe(true);
    expect(sc.scenes.map((x) => x.by)).toEqual(['faculty', 'faculty']);
    const calls = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === SHOWCASE_KIND).map((i) => `${i.label}, ${formatDate(i.at, zone)}`);
    expect(calls).toHaveLength(11);
    expect(calls.slice(-3)).toEqual(['The Actor Showcase In New York, April 30, 2029', 'The Actor Showcase In New York, May 1, 2029', 'The Actor Showcase In Los Angeles, May 8, 2029']);
    expect(sim.universe.notifications.filter((n) => !(before as unknown as { notifications: { id: string }[] }).notifications.some((b) => b.id === n.id)).map((n) => n.title)).toEqual(['The Actor Showcase', 'You’re In The Actor Showcase']);
    expect(carried(sim.universe as never)).toBe(carried(before));
    expect(serialise(cross(sim).universe)).toBe(S.saves.get('opened'));
  });

  it('PLAYER JOURNEY: the showcase played in New York and Los Angeles and passed, the School’s follow-up put on the clock and come, the degree conferred with Equity joined and its $600.00 down taken that day', () => {
    const sc = opened('showcase').player.pro!.showcase!;
    expect(sc.performed.map((p) => [p.city, formatDate(p.at, zone)])).toEqual([
      ['us-ny-newyork', 'April 30, 2029'], ['us-ny-newyork', 'April 30, 2029'], ['us-ny-newyork', 'May 1, 2029'], ['us-ny-newyork', 'May 1, 2029'],
      ['us-ca-losangeles', 'May 8, 2029'], ['us-ca-losangeles', 'May 8, 2029'],
    ]);
    const sim = opened('degree');
    expect(Object.values(sim.player.school!.courses!).find((r) => r.code === 'DRAM 793b' && r.term === 5)!.result).toBe('pass');
    expect(sim.player.pro!.showcase!.followUp?.at).toBe(at(2029, 5, 11, 10));
    expect(sim.universe.scheduled.filter((i) => i.kind === FOLLOW_UP_KIND && i.status === 'pending')).toEqual([]);
    expect(sim.player.school!.standing).toBe('graduated');
    expect(sim.player.pro!.equity).toEqual({ since: sim.player.school!.endedAt, how: 'degree' });
    const taken = sim.universe.transactions.filter((x) => x.memo.startsWith('Actors’ Equity Association:'));
    // The down payment named as a part of the fee since the built-app walk's wording (merged 2026-10-21).
    expect(taken.map((x) => [x.memo, formatDate(x.at, zone)])).toEqual([['Actors’ Equity Association: Initiation fee, part 1 of 3, the down payment', formatDate(sim.player.school!.endedAt!, zone)]]);
    const titles = S.lines.filter((l) => / \| NOTICE \| (The Actor Showcase|You’re In|The School’s Follow-Up|Your Equity|Actors’ Equity|Your MFA)/.test(l)).map((l) => l.split(' | ')[2]);
    expect(titles).toEqual(['The Actor Showcase', 'You’re In The Actor Showcase', 'The Actor Showcase In New York', 'The Actor Showcase In New York', 'The Actor Showcase In Los Angeles', 'The School’s Follow-Up After The Showcase', 'Your Equity Initiation Fee', 'Actors’ Equity Association: $600.00 Paid', 'Your MFA Is Conferred']);
    expect(breaches(sim.universe, sim.now)).toEqual([]);
  });
});
void MS_DAY;
