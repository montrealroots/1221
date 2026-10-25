/**
 * Brief 27, K6 (2026-10-25): a slate production's way out after the wrap, loop 33's "Possible alternatives: Delayed
 * release. Different distributor. Limited release. Direct-to-streaming release. Shelving. No public release. Do not force
 * every completed project to succeed or release immediately" (`RELEASE_FATE`). Held here: the fixed parts keep their
 * releases as written; the slate's fates come at about their chances; a film shelved, said, never out, its footage off the
 * reel and its premiere gone; one held back, said at its date and out at the later one, its premiere the later; one sent to
 * streaming instead of cinemas, with no weekly chart of its own; and one out on time in cinemas, charted.
 *
 * PLAYER JOURNEYS: a graduate played by the clock to the wrap (tests/fakes/career-world.ts), the offer accepted through the
 * command, then the clock to the release. TEST SETUP, said where it's done: the offer on the record as casting's draws would
 * leave one. Each part is found where its production's own draw gives the case, never forced.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, addDays } from '@/engine/core/time';
import { PROJECTS, type ProjectTemplate } from '@/engine/content/careerwork';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import { premiereOf } from '@/engine/systems/awards';
import { reelSources, type Engagement, type Opportunity, type ProCredit } from '@/engine/systems/pro';
import { OFFER_KIND, RELEASE_FATE, RELEASE_KIND, payTermsOf, releaseFate, travels, writtenFor } from '@/engine/systems/projobs';
import { formatOf } from '@/engine/systems/workflow';
import { graduate, notices, played } from './fakes/career-world';

const WEEK = 7 * MS_DAY;
type Sim = ReturnType<typeof graduate>;
type Fate = NonNullable<ProCredit['release']>['kind'];

/** A slate film for cinemas near New Haven, made, whose production's way out is the one wanted. */
function film(sim: Sim, want: Fate): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 400; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (formatOf(t).after !== 'theatrical' || travels(sim.player, t) || !writtenFor(t, sim.player) || t.slate!.fate.kind !== 'made') continue;
      if (releaseFate(sim, t).kind !== want) continue;
      keepProject(sim.player, t);
      if (payTermsOf({ projectId: t.id, postedAt: week }).each !== undefined) return { t, week };
    }
  }
  throw new Error(`no film ${want}`);
}

/** TEST SETUP: an offer for a part on the record as casting's draws would leave one, standing three days. */
function offered(sim: Sim, t: ProjectTemplate, postedAt: number): Opportunity {
  const terms = payTermsOf({ projectId: t.id, postedAt });
  const o: Opportunity = {
    id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'offered', postedAt, submitBy: postedAt + WEEK, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units, version: 1 },
  };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at: o.offer!.until, kind: OFFER_KIND, label: `The Offer For ${t.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id } });
  return o;
}

/** Booked, played to the wrap, and its credit with when its release is due. */
function wrapped(sim: Sim, t: ProjectTemplate, week: number): { e: Engagement; c: ProCredit; due: number } {
  played(sim, week);
  const o = offered(sim, t, week);
  const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
  for (let n = 0; n < 4 && e.status !== 'finished' && e.status !== 'canceled'; n += 1) played(sim, e.days.at(-1)!.to + 2 * MS_HOUR);
  const c = sim.player.pro!.credits.find((x) => x.engagementId === e.id)!;
  const due = sim.universe.scheduled.find((i) => i.kind === RELEASE_KIND && i.refId === c.id && i.status === 'pending')!.at;
  return { e, c, due };
}

describe('a slate production’s way out', () => {
  it('is on time for every fixed part, and the slate’s fates come at about their chances', () => {
    const sim = graduate('b27-release-rule');
    for (const t of PROJECTS) expect(releaseFate(sim, t), t.id).toEqual({ kind: 'on-time' });
    const counts: Record<string, number> = {};
    let n = 0;
    for (let w = 1; w <= 260; w += 1) for (const p of productionsOf(sim, sim.now + w * WEEK)) {
      const t = p.parts[0]!;
      if (formatOf(t).after !== 'theatrical') continue;
      n += 1;
      const k = releaseFate(sim, t).kind;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    expect(n).toBeGreaterThan(300);
    const odds = RELEASE_FATE.theatrical!;
    for (const [k, p] of [['shelved', odds.shelved], ['streaming', odds.streaming!], ['late', odds.late]] as const) expect(Math.abs((counts[k] ?? 0) / n - p), k).toBeLessThan(0.05);
  });

  it('PLAYER JOURNEY: a film shelved is said at its release date and never out: shot on the credits, off the reel, no premiere, no chart', () => {
    const sim = graduate('b27-release-shelved');
    const { t, week } = film(sim, 'shelved');
    const { c, due } = wrapped(sim, t, week);
    expect(premiereOf(sim, sim.player, c)).toBeUndefined();
    sim.advanceTo(due + MS_HOUR);
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Is Shelved | `) && n.includes('it won’t be released'))).toBe(true);
    expect([c.status, c.releasedAt, c.run]).toEqual(['shot', undefined, undefined]);
    expect(reelSources(sim.player, sim.now).some((s) => s.ref === `footage:${c.id}`)).toBe(false);
    sim.advanceTo(due + 400 * MS_DAY);
    expect(c.status).toBe('shot');
  }, 300_000);

  it('PLAYER JOURNEY: a film held back is said at its date and out at the later one, the premiere the later day from the start', () => {
    const sim = graduate('b27-release-late');
    const { t, week } = film(sim, 'late');
    const { c, due } = wrapped(sim, t, week);
    const later = addDays(due, c.release!.days!, 'America/New_York');
    expect(premiereOf(sim, sim.player, c)).toBe(later);
    sim.advanceTo(due + MS_HOUR);
    expect(notices(sim).some((n) => n.startsWith(`${t.project}’s Release Is Held Back | `))).toBe(true);
    expect(c.status).toBe('shot');
    sim.advanceTo(later + MS_HOUR);
    expect([c.status, c.releasedAt]).toEqual(['released', later]);
    expect(c.run).toBeDefined();
  }, 300_000);

  it('PLAYER JOURNEY: a film sent to streaming instead of cinemas is out on time, said so, with no weekly chart; the falsifiability twin out in cinemas is charted', () => {
    const sim = graduate('b27-release-streaming');
    const { t, week } = film(sim, 'streaming');
    const { c, due } = wrapped(sim, t, week);
    sim.advanceTo(due + MS_HOUR);
    expect(c.status).toBe('released');
    expect(c.run).toBeUndefined();
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Is Released | ${t.project} is streaming, its distributor having sent it to streaming instead of cinemas`))).toBe(true);
    const twin = graduate('b27-release-on-time');
    const on = film(twin, 'on-time');
    const w = wrapped(twin, on.t, on.week);
    twin.advanceTo(w.due + MS_HOUR);
    expect([w.c.status, w.c.run !== undefined]).toEqual(['released', true]);
  }, 300_000);
});
