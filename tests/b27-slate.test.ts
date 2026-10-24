/**
 * Brief 27, Area B (2026-10-24): the slate, the work the world keeps making (`systems/slate.ts`, `content/slate.ts`). "Build
 * an ongoing project and opportunity lifecycle that produces appropriate new work over simulation time ... Preserve history.
 * A previously completed project must not silently reset and return as a brand-new opportunity. Make opportunity supply
 * responsive to market, location, eligibility, representation access, availability, experience, skills, genres,
 * relationships, and established production circumstances. The player must not be guaranteed work, but the world must not
 * stop generating opportunities because a small catalog is exhausted."
 *
 * Held here: the slate makes work every year it's asked for, the same for a save and different for another; a part posted
 * is kept in the save as it was posted, and a save's copy is what's read; a production is cast once; its fate reaches work
 * booked in it (never made: called off; pushed: released and offered again for the new dates); a series' seasons cast new
 * characters; each factor of the reach moves it. TEST SETUP is said where it's used.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY } from '@/engine/core/time';
import { projectById, PROJECTS, type ProjectTemplate } from '@/engine/content/careerwork';
import { CLASSMATE_NAMES, GIVEN, KIND_PROFILES, MARKETS } from '@/engine/content/slate';
import { GENRE_DEFS } from '@/engine/content/genres';
import { GIVEN_ACTOR, GIVEN_ACTRESS } from '@/engine/systems/school';
import { productionsOf, seriesOfYear, seriesParts, slatePartsAt, slateTag, keepProject } from '@/engine/systems/slate';
import { keepBounded } from '@/engine/systems/pro';
import { SLATE_REACH, datesOf, payTermsOf, postingsAt, slateReach, travels } from '@/engine/systems/projobs';
import { seasonMade } from '@/engine/systems/series';
import type { Opportunity } from '@/engine/systems/pro';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { loadSave } from '@/engine';
import { at, graduate, notices, played, reload, student } from './fakes/career-world';
import { represent } from './fakes/b20-career';

const WEEK = 7 * MS_DAY;

describe('the slate makes work, year on year', () => {
  it('makes productions in every year of a ten-year career, in the US markets, of more kinds than the fixed parts have, never running out', () => {
    const sim = student('b27-slate-years');
    const byYear = new Map<number, { made: number; weeks: number }>();
    const kinds = new Set<string>();
    const markets = new Set<string>();
    for (let w = 0; w < 520; w += 1) {
      const week = sim.now + w * WEEK;
      const y = new Date(week).getUTCFullYear();
      const row = byYear.get(y) ?? { made: 0, weeks: 0 };
      row.weeks += 1;
      for (const p of productionsOf(sim, week)) {
        row.made += 1;
        kinds.add(p.kind);
        markets.add(p.market.id);
      }
      byYear.set(y, row);
    }
    // Every year a career could run, work is made: more than two productions a week, the first and last years partial.
    for (const [y, r] of byYear) expect(r.made / r.weeks, String(y)).toBeGreaterThan(2);
    expect(byYear.size).toBeGreaterThanOrEqual(10);
    for (const m of ['new-york', 'los-angeles', 'atlanta', 'chicago']) expect(markets.has(m), m).toBe(true);
    expect(kinds.size).toBeGreaterThan(12);
    // And new series each year, beside brief 25's one.
    for (let y = 2026; y <= 2035; y += 1) expect(seriesOfYear(sim, y).length, String(y)).toBeGreaterThan(0);
  });

  it('makes the same world for a save on every asking, and another for another save', () => {
    const a = student('b27-slate-same');
    const b = student('b27-slate-same');
    const c = student('b27-slate-other');
    const sig = (s: typeof a) => productionsOf(s, s.now + 10 * WEEK).map((p) => `${p.kind}:${p.title}:${p.parts.map((t) => t.role.part).join('/')}`).join('|');
    expect(sig(a)).toBe(sig(b));
    expect(sig(a)).not.toBe(sig(c));
    expect(slateTag(a)).toBe(slateTag(b));
    expect(slateTag(a)).not.toBe(slateTag(c));
  });

  it('writes its parts from its own lists: genres the game has, names no classmate has, each fictional', () => {
    expect(new Set(CLASSMATE_NAMES)).toEqual(new Set([...GIVEN_ACTRESS, ...GIVEN_ACTOR, 'Sam', 'Theo', 'Max', 'Zoe']));
    for (const list of Object.values(GIVEN)) for (const n of list) expect(CLASSMATE_NAMES).not.toContain(n);
    for (const [kind, p] of Object.entries(KIND_PROFILES)) for (const pair of p!.genreSets) for (const g of pair) expect(GENRE_DEFS[g], `${kind}: ${g}`).toBeDefined();
    const sim = student('b27-slate-words');
    for (let w = 0; w < 20; w += 1) for (const t of productionsOf(sim, sim.now + w * WEEK).flatMap((p) => p.parts)) {
      expect(t.fictional).toBe(true);
      expect(t.role.about).toMatch(/^[A-Z].+\.$/);
      expect(t.slate!.production).toBe(t.id.slice(0, t.id.lastIndexOf('.')));
    }
    // London and Sydney work is an American production's, with its local company as the sponsor.
    expect(MARKETS.find((m) => m.id === 'london')!.kinds).toEqual({ 'overseas-feature': 0.05 });
  });
});

describe('who it reaches', () => {
  it('moves with representation, fit, credits, the companies worked for, where the actor lives, and when they’re booked', () => {
    const sim = graduate('b27-slate-reach');
    const p = sim.player;
    const parts = Array.from({ length: 12 }, (_, w) => slatePartsAt(sim, sim.now + w * WEEK)).flat();
    const age = new Date(sim.now).getUTCFullYear() - new Date(p.birthInstant).getUTCFullYear();
    const inAge = parts.filter((t) => t.requirements.ages[0] <= age && t.requirements.ages[1] >= age);
    expect(inAge.length).toBeGreaterThan(5);
    const t = inAge.find((x) => x.access.agent && x.stages.audition === 'self-tape' && x.role.size !== 'lead')!;
    expect(t).toBeDefined();
    const when = sim.now;
    // Who brings it: an agent's chance is SLATE_REACH.agent scaled by fit, an open posting's SLATE_REACH.open.
    const open = slateReach(sim, p, t, 'open', when);
    const agent = slateReach(sim, p, t, 'agent', when);
    expect(open).toBeCloseTo(SLATE_REACH.open, 5);
    expect(agent).toBeGreaterThan(0);
    // Fit: a craft at its height raises the agent's chance.
    const before = slateReach(sim, p, t, 'agent', when);
    for (const k of Object.keys(p.craft!) as (keyof NonNullable<typeof p.craft>)[]) p.craft![k] = 100;
    expect(slateReach(sim, p, t, 'agent', when)).toBeGreaterThan(before);
    // The playing age: a part for an actor decades older reaches no one this age.
    expect(slateReach(sim, p, { ...t, requirements: { ...t.requirements, ages: [age + 20, age + 30] } }, 'open', when)).toBe(0);
    // Experience: a lead in professional screen work comes a fifth as often to an actor with fewer than three credits.
    const lead: ProjectTemplate = { ...t, kind: 'network-drama', role: { ...t.role, size: 'lead' } };
    const without = slateReach(sim, p, lead, 'open', when);
    p.pro!.credits = Array.from({ length: 3 }, (_, i) => ({ id: `c${i}`, kind: 'screen' as const, project: `Credit ${i}`, role: 'A Part', company: `Company ${i}`, year: 2026, medium: 'film' as const, status: 'released' as const, at: when }));
    expect(slateReach(sim, p, lead, 'open', when)).toBeCloseTo(without / SLATE_REACH.leadWithout, 5);
    // Relationships: a company worked for comes back a half again as often.
    const known = slateReach(sim, p, t, 'open', when);
    p.pro!.credits.push({ id: 'c-known', kind: 'screen', project: 'Known', role: 'A Part', company: t.company, year: 2026, medium: 'film', status: 'released', at: when });
    expect(slateReach(sim, p, t, 'open', when)).toBeCloseTo(Math.min(0.95, known * SLATE_REACH.worked), 5);
    // Where they live: an open in-person audition a trip away reaches no one there.
    expect(slateReach(sim, p, { ...t, stages: { ...t.stages, audition: 'in-person' }, place: { city: 'Los Angeles', cityId: 'us-ca-losangeles', venue: 'a stage' } }, 'open', when)).toBe(0);
  });

  it('PLAYER JOURNEY: a represented graduate is posted the slate’s parts every year for five years, by the clock, alongside what’s left of the fixed parts', () => {
    const sim = graduate('b27-slate-supply');
    represent(sim);
    const seen = new Map<number, number>();
    for (let w = 0; w < 260; w += 1) {
      const t = sim.now + w * WEEK;
      for (const x of postingsAt(sim, sim.player, t)) if (x.project.slate) seen.set(new Date(t).getUTCFullYear(), (seen.get(new Date(t).getUTCFullYear()) ?? 0) + 1);
    }
    for (const y of [2027, 2028, 2029, 2030]) expect(seen.get(y) ?? 0, String(y)).toBeGreaterThan(10);
  });
});

describe('history: a part as it was posted', () => {
  it('keeps a posted slate part in the save, reads the save’s copy over anything a later build makes, and drops it once nothing names it', () => {
    const sim = graduate('b27-slate-kept');
    represent(sim);
    played(sim, sim.now + 3 * WEEK);
    const posted = sim.player.pro!.opportunities.find((o) => projectById(o.projectId)?.slate);
    expect(posted).toBeDefined();
    const kept = sim.player.pro!.projects![posted!.projectId]!;
    expect(kept.id).toBe(posted!.projectId);
    // Across a save and a load, the part reads as the save holds it.
    const back = reload(sim);
    expect(back.player.pro!.projects![posted!.projectId]).toEqual(kept);
    // TEST SETUP: a save holding a part under an id this session never made, its words changed as a later build might: the
    // save's copy is what's read once it's opened.
    const text = serialise(sim.universe);
    const u = deserialise(text) as typeof sim.universe;
    const changed: ProjectTemplate = { ...kept, id: `${kept.id}.later`, role: { ...kept.role, about: 'A part as an older build wrote it.' } };
    u.people[u.playerId]!.pro!.projects![changed.id] = changed;
    u.people[u.playerId]!.pro!.opportunities.push({ ...posted!, id: 'kept-later', projectId: changed.id });
    const opened = loadSave(u as never);
    expect(projectById(changed.id)!.role.about).toBe('A part as an older build wrote it.');
    expect(opened.player.pro!.projects![changed.id]).toBeDefined();
    // Nothing names it any more: it goes at the next bound (`keepBounded`).
    opened.player.pro!.opportunities = opened.player.pro!.opportunities.filter((o) => o.id !== 'kept-later');
    keepBounded(opened.player.pro!);
    expect(opened.player.pro!.projects![changed.id]).toBeUndefined();
    expect(opened.player.pro!.projects![kept.id]).toBeDefined();
  });

  it('casts a production once: no slate part is posted twice over two years', () => {
    const sim = graduate('b27-slate-once');
    represent(sim);
    const ids = new Map<string, number>();
    for (let w = 0; w < 104; w += 1) for (const x of postingsAt(sim, sim.player, sim.now + w * WEEK)) if (x.project.slate && !x.project.series) ids.set(x.project.id, (ids.get(x.project.id) ?? 0) + 1);
    expect(ids.size).toBeGreaterThan(20);
    expect([...ids.values()].every((n) => n === 1)).toBe(true);
  });
});

/** TEST SETUP: an offer for a slate part, put on the record as casting's draws would leave one, then accepted by its command. */
function bookInto(sim: ReturnType<typeof graduate>, t: ProjectTemplate, postedAt: number): string {
  keepProject(sim.player, t);
  const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'offered', postedAt, submitBy: postedAt + WEEK, history: [], counts: {}, offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(payTermsOf({ projectId: t.id, postedAt }).each !== undefined ? { amount: payTermsOf({ projectId: t.id, postedAt }).each! } : {}), per: payTermsOf({ projectId: t.id, postedAt }).per, units: payTermsOf({ projectId: t.id, postedAt }).units } };
  sim.player.pro!.opportunities.push(o);
  const r = sim.execute<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
  expect(r.error).toBeUndefined();
  return r.value!.engagementId;
}

/** A production's part the graduate can take: in the US, union terms they can work under, its fate the one asked. */
function partWith(sim: ReturnType<typeof graduate>, fate: 'dropped' | 'pushed'): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 200; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
        if (t.slate!.fate.kind !== fate || travels(sim.player, t) || t.union === 'sag-aftra' || t.kind === 'student-film') continue;
      return { t, week };
    }
  }
  throw new Error(`no ${fate} part`);
}

describe('what becomes of a production', () => {
  it('PLAYER JOURNEY: never made: work booked in it is called off when that’s known, nothing owed for days never worked, said once', () => {
    const sim = graduate('b27-slate-dropped');
    const { t, week } = partWith(sim, 'dropped');
    played(sim, week - MS_DAY);
    const id = bookInto(sim, t, week);
    const fate = t.slate!.fate as { kind: 'dropped'; at: number };
    played(sim, fate.at + 2 * MS_DAY);
    const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
    expect(e.status).toBe('canceled');
    expect(e.pay.filter((p) => !p.received)).toEqual([]);
    expect(e.history.filter((h) => h.key === 'slate-fate')).toHaveLength(1);
    expect(notices(sim).filter((n) => n.startsWith(`${t.project} Won’t Be Made`))).toHaveLength(1);
    // Across a save and a load, nothing happens twice.
    const back = reload(sim);
    played(back, back.now + 7 * MS_DAY);
    expect(back.player.pro!.engagements.find((x) => x.id === id)!.history.filter((h) => h.key === 'slate-fate')).toHaveLength(1);
  });

  it('PLAYER JOURNEY: pushed back: released from the old dates, and offered the part again for dates the weeks later', () => {
    const sim = graduate('b27-slate-pushed');
    const { t, week } = partWith(sim, 'pushed');
    played(sim, week - MS_DAY);
    const id = bookInto(sim, t, week);
    const fate = t.slate!.fate as { kind: 'pushed'; at: number; weeks: number };
    const oldFirst = datesOf({ projectId: t.id, postedAt: week })[0]!.from;
    played(sim, fate.at + 2 * MS_DAY);
    expect(sim.player.pro!.engagements.find((x) => x.id === id)!.status).toBe('canceled');
    const again = sim.player.pro!.opportunities.find((o) => o.projectId === `${t.id}.p`)!;
    expect(again).toBeDefined();
    expect(['offered', 'lapsed', 'declined']).toContain(again.status);
    expect(datesOf(again)[0]!.from - oldFirst).toBe(fate.weeks * WEEK);
    expect(projectById(again.projectId)!.slate!.pushedFrom).toBe(t.id);
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Is Pushed Back`))).toBe(true);
  });
});

describe('a series’ seasons', () => {
  it('casts new characters each season it makes, and only in a season the network made', () => {
    const sim = student('b27-slate-series');
    const s = seriesOfYear(sim, 2027)[0]!;
    expect(s.firstSeason).toBe(2027);
    const first = seriesParts(sim, s, 2027);
    const second = seriesParts(sim, s, 2028);
    // The first season has a recurring part and its guests; the second its own guests, under new names.
    expect(first.some((t) => t.schedule.kind === 'episodes')).toBe(true);
    expect(second.every((t) => t.schedule.kind !== 'episodes')).toBe(true);
    expect(second.map((t) => t.id).some((id) => first.some((x) => x.id === id))).toBe(false);
    // Its first season is made; whether its second is, the network's draw says (systems/series.ts), the same each asking.
    expect(seasonMade(sim, s, 2027)).toBe(true);
    expect(seasonMade(sim, s, 2028)).toBe(seasonMade(student('b27-slate-series'), seriesOfYear(student('b27-slate-series'), 2027)[0]!, 2028));
    // The fixed catalog is still there, untouched.
    expect(PROJECTS.length).toBe(31);
  });
});

describe('work in the UK, under its own rules', () => {
  it('an American’s three months or less comes under the concession with an ETA; more under the Creative Worker visa; an Irish citizen needs nothing; a visa national the visa', async () => {
    const { routeFor } = await import('@/engine/systems/worktrip');
    const us = graduate('b27-uk-us');
    const short = [{ from: at(2027, 3, 1), to: at(2027, 3, 1, 18) }, { from: at(2027, 4, 20), to: at(2027, 4, 20, 18) }];
    const long = [{ from: at(2027, 3, 1), to: at(2027, 3, 1, 18) }, { from: at(2027, 7, 2), to: at(2027, 7, 2, 18) }];
    expect(routeFor(us.player, 'uk', short)!.id).toBe('uk-creative-concession');
    expect(routeFor(us.player, 'uk', long)!.id).toBe('uk-creative-worker');
    const irish = graduate('b27-uk-ie', { homeRegionId: 'ie-lei-dublin', citizenshipId: 'ie' } as never);
    expect(routeFor(irish.player, 'uk', long)!.id).toBe('uk-common-travel-area');
    const indian = graduate('b27-uk-in', { homeRegionId: 'in-16-mumbai', citizenshipId: 'in' } as never);
    expect(routeFor(indian.player, 'uk', short)!.id).toBe('uk-creative-worker');
  });
});
