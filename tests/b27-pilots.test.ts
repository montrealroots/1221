/**
 * Brief 27, the series, releases and market cluster (2026-10-25): Part 8's "Pilots" (`PILOTS`, `systems/slate.ts`; `PILOT`,
 * `systems/continuity.ts`). Held here: the slate's pilots each winter, each for a network the game invents, on their own
 * draws; the offer saying the network's word and the option; accepting one putting the option on the series' first season
 * in its contract and the word on the clock, its airing held past the word; the word a draw that reads the pilot's own
 * quality and the player's part; picked up, a series of the game's with the player's character, the option taken up or
 * let go as any is, kept through a save; and the falsifiability twin, the same pilot with the part judged Unready, passed
 * on, never airing. From the review of 2026-10-25: every pilot the slate makes in ten winters wrapped two weeks before its
 * network's word, so the word reads a part judged whole and a pilot passed on is never still shooting; until then one
 * posted late in March could be, and aired anyway; and a pilot whose word does come inside its shoot (a copy of a slate
 * pilot with its word moved there, TEST SETUP: no pilot the slate posts has it), passed on, is shelved at its wrap and never
 * airs, as the word said.
 *
 * PLAYER JOURNEYS: a graduate played by the clock through a pilot's shoot (tests/fakes/career-world.ts), the offer accepted
 * through the command, then the clock to the network's word. The pilot is one whose own draw sits between the chance
 * Unready work gives it and the chance Exceptional work does, found by reading the draws, never forced. TEST SETUP, said
 * where it's done: the offer on the record as casting's draws would leave one; the days' bands as a judge would have left
 * them, so the twin differs in that alone.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, addDays, zonedParts } from '@/engine/core/time';
import { seriesById } from '@/engine/content/series';
import { PILOTS, keepProject, pilotsOf, slatePartsAt } from '@/engine/systems/slate';
import { PILOT, PILOT_KIND, pilotChance, pilotPart, pilotSeries } from '@/engine/systems/continuity';
import { productionKey, qualityOf, termOf } from '@/engine/systems/market';
import { optionDrawn } from '@/engine/systems/series';
import { clauseOf } from '@/engine/systems/contracts';
import { premiereOf } from '@/engine/systems/awards';
import { creditWords, pageOf, projectKey } from '@/engine/systems/reference';
import { ensurePro, reelSources, type Engagement } from '@/engine/systems/pro';
import { RELEASE_KIND, datesOf, postingTimes, releaseFate, termsWords } from '@/engine/systems/projobs';
import { PROMO_KIND } from '@/engine/systems/workflow';
import { addProjects, type ProjectTemplate } from '@/engine/content/careerwork';
import type { Simulation } from '@/engine/core/simulation';
import { graduate, notices, played, reload } from './fakes/career-world';
import { WEEK, offered, slatePilot, wrapped } from './fakes/b27-series';

const NY = 'America/New_York';

/** A lead in a pilot whose network's draw falls between what Unready work gives it and what Exceptional work does. */
function between(sim: Simulation): { t: ProjectTemplate; week: number } {
  return slatePilot(sim, (t) => {
    if (t.role.size !== 'lead' || t.schedule.kind !== 'shoot') return false;
    const u = sim.rng('pro.pilot', productionKey(t)).next();
    const q = qualityOf(sim, t);
    return u > pilotChance(q, termOf('lead', 'unready')) && u < pilotChance(q, termOf('lead', 'exceptional'));
  });
}

/** TEST SETUP: every judged day of the work at one band, as a judge would have left it. */
const judgedAll = (e: Engagement, band: 'exceptional' | 'unready') => { for (const l of e.log ?? []) if (l.status === 'worked') l.band = band; };

describe('pilots on the slate', () => {
  it('are made each winter for a network the game invents, shot as an episode of their kind, with the network’s word on May 15', () => {
    const sim = graduate('b27-pilots-rule');
    let found = 0;
    for (let w = 1; w <= 60; w += 1) {
      const week = sim.now + w * WEEK;
      const month = zonedParts(week, NY).month;
      const pilots = pilotsOf(sim, week);
      if (!PILOTS.months.includes(month)) { expect(pilots, String(month)).toEqual([]); continue; }
      // Posted with the week's other parts.
      const ids = new Set(slatePartsAt(sim, week).map((t) => t.id));
      for (const p of pilots) for (const t of p.parts) expect(ids.has(t.id)).toBe(true);
      for (const p of pilots) for (const t of p.parts) {
        found += 1;
        expect(PILOTS.kinds).toContain(t.kind);
        expect(t.pilot!.network).toBe(t.company);
        expect(zonedParts(t.pilot!.decideAt, NY)).toMatchObject({ year: zonedParts(week, NY).year, month: PILOTS.word.month, day: PILOTS.word.day, hour: PILOTS.word.hour });
        expect(t.slate!.production.startsWith('pl')).toBe(true);
        expect(t.slate!.fate).toEqual({ kind: 'made' });
        expect(releaseFate(sim, t)).toEqual({ kind: 'on-time' });
        expect(termsWords(t, 100_00)).toContain(`It’s a pilot for ${t.pilot!.network}, a network invented for the game.`);
      }
    }
    expect(found).toBeGreaterThan(10);
    // The word's chance: its own quality and the part move it, within its bounds.
    expect(pilotChance(0, 0)).toBe(PILOT.chance.base);
    expect(pilotChance(0, 1)).toBeGreaterThan(pilotChance(0, 0));
    expect(pilotChance(1, 0)).toBeGreaterThan(pilotChance(0, 0));
    expect(pilotChance(-5, -5)).toBe(PILOT.chance.least);
  });

  it('are shot and wrapped two weeks before their network’s word, every one in ten winters, so the word reads a finished pilot', () => {
    const sim = graduate('b27-pilots-wrap');
    let made = 0;
    let closest = Infinity;
    for (const monday of postingTimes(sim.now, sim.now + 10 * 365 * MS_DAY)) for (const p of pilotsOf(sim, monday)) for (const t of p.parts) {
      addProjects([t]);
      made += 1;
      // Posted on its week's Monday, as the game posts: its last day's end, and the word.
      const last = datesOf({ projectId: t.id, postedAt: monday }).at(-1)!;
      expect(last.to + PILOTS.wrapBy * MS_DAY, t.id).toBeLessThanOrEqual(t.pilot!.decideAt);
      closest = Math.min(closest, t.pilot!.decideAt - last.to);
    }
    expect(made).toBeGreaterThan(100);
    // Some wrap close to the bound: late-March pilots are made, those that couldn't wrap in time aren't.
    expect(closest).toBeLessThan((PILOTS.wrapBy + 7) * MS_DAY);
  });

  it('PLAYER JOURNEY: a pilot whose network’s word comes inside its shoot and passes on it never airs: the word says so, and at the wrap the credit is shelved with nothing on the clock', () => {
    const sim = graduate('b27-pilots-span');
    ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
    // TEST SETUP: a slate pilot's lead whose network's draw passes on it with the part judged Unready, copied with the
    // word moved to the morning of its third shoot day: no pilot the slate posts spans its word (`PILOTS.wrapBy`), so the
    // copy stands for a shoot moved after its posting, and is kept as the save keeps a slate part.
    const { t: base, week } = slatePilot(sim, (x) => x.role.size === 'lead' && x.schedule.kind === 'shoot' && sim.rng('pro.pilot', productionKey(x)).next() >= pilotChance(qualityOf(sim, x), termOf('lead', 'unready')));
    const days = datesOf({ projectId: base.id, postedAt: week });
    const t: ProjectTemplate = { ...base, id: `${base.id}.span`, pilot: { ...base.pilot!, decideAt: days[2]!.from - MS_HOUR } };
    addProjects([t]);
    played(sim, week);
    keepProject(sim.player, t);
    const o = offered(sim, t, week);
    const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
    played(sim, t.pilot!.decideAt - MS_HOUR);
    expect(e.log!.filter((l) => l.status === 'worked').length).toBe(2);
    expect(e.creditId).toBeUndefined();
    judgedAll(e, 'unready');
    // The word, two days into the shoot: passed on, and said of the credit the wrap will make.
    played(sim, t.pilot!.decideAt + MS_HOUR);
    expect(e.pilot).toMatchObject({ picked: false });
    expect(clauseOf(e.contract, 'option')!.status).toBe('expired');
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Isn’t Picked Up | ${t.pilot!.network} passed on ${t.project}: it won’t go to series, and the pilot won’t air. ${t.role.part} goes on your credits as shot when the shoot wraps, and the pay is yours. With no airing, its footage can’t go on a reel.`))).toBe(true);
    // The wrap: the credit shelved, no release and no promotional film on the clock, no premiere.
    for (let n = 0; n < 4 && e.status !== 'finished' && e.status !== 'canceled'; n += 1) played(sim, e.days.at(-1)!.to + 2 * MS_HOUR);
    expect(e.status).toBe('finished');
    const c = sim.player.pro!.credits.find((x) => x.engagementId === e.id)!;
    expect(c.release).toEqual({ kind: 'shelved' });
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && ((i.kind === RELEASE_KIND && i.refId === c.id) || (i.kind === PROMO_KIND && i.refId === e.id)))).toBe(false);
    expect(e.promo).toBeUndefined();
    expect(premiereOf(sim, sim.player, c)).toBeUndefined();
    expect(creditWords(sim, sim.player, c)).toBe('Shot, and its network passed on the pilot: it won’t air');
    // Past the day it would have aired: still shot, never released, never on a reel.
    played(sim, addDays(t.pilot!.decideAt, PILOT.airsDays + 30, NY));
    expect(c.status).toBe('shot');
    expect(notices(sim).some((n) => n.startsWith(`${t.project} Is Released`) || n.startsWith(`${t.project} Is On Tonight`))).toBe(false);
    expect(reelSources(sim.player, sim.now).some((x) => x.ref === `footage:${c.id}`)).toBe(false);
  }, 900_000);

  it('PLAYER JOURNEY: a pilot accepted carries the option on the series’ first season; picked up, it’s a series of the game’s with the player’s character, its option taken up into a first season or let go, kept through a save; the twin with the part judged Unready is passed on and never airs', () => {
    // The first of these saves whose engagement's own draw takes the option up, and on the way any that lets it go.
    let seed = '';
    let sawLapse = false;
    for (let k = 0; k < 8 && !seed; k += 1) {
      const sim = graduate(`b27-pilots-journey-${k}`);
      // TEST SETUP: SAG-AFTRA membership, as tests/b27-revival.test.ts sets it, so a first season months on can be worked.
      ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
      const { t, week } = between(sim);
      const { e, due } = wrapped(sim, t, week);
      // The option on the series' first season, and the network's word on the clock; the airing held past the word.
      const option = clauseOf(e.contract, 'option')!;
      expect(option).toMatchObject({ season: 1, year: zonedParts(t.pilot!.decideAt, NY).year, status: 'open' });
      expect(sim.universe.scheduled.some((i) => i.kind === PILOT_KIND && i.refId === e.id && i.at === t.pilot!.decideAt && i.status === 'pending')).toBe(true);
      expect(due).toBeGreaterThanOrEqual(addDays(t.pilot!.decideAt, PILOT.airsDays, NY));
      expect(pageOf(sim, sim.player, projectKey(t))!.sections.flatMap((x) => x.facts).find((f) => f.label === 'The Pilot')!.words).toContain(`A pilot for ${t.pilot!.network}, a network invented for the game`);
      // TEST SETUP: the days judged Exceptional.
      judgedAll(e, 'exceptional');
      const takenUp = optionDrawn(sim, e);
      sim.advanceTo(t.pilot!.decideAt + MS_HOUR);
      expect(e.pilot).toMatchObject({ picked: true });
      const series = seriesById(pilotSeries(t).id)!;
      expect(series).toMatchObject({ title: t.project, company: t.pilot!.network, firstSeason: option.year, orderedThrough: option.year, fictional: true });
      expect(sim.player.pro!.series![series.id]).toBeDefined();
      expect(notices(sim).some((n) => n.startsWith(`${t.project} Goes To Series`) && n.includes('The network’s word is the game’s simulation'))).toBe(true);
      if (!takenUp) {
        expect(option.status).toBe('expired');
        expect(notices(sim).some((n) => n.startsWith(`${t.project} Goes To Series Without You`))).toBe(true);
        sawLapse = true;
        continue;
      }
      expect(option.status).toBe('exercised');
      const next = sim.player.pro!.engagements.find((x) => x.id === option.settled!.engagementId)!;
      expect(next.projectId).toBe(pilotPart(t, series).id);
      expect(next.contract!.series).toMatchObject({ id: series.id, year: option.year, season: 1 });
      expect(clauseOf(next.contract, 'episodes')!.numbers.length).toBe(PILOT.guaranteed);
      expect(clauseOf(next.contract, 'option')).toMatchObject({ year: option.year + 1, status: 'open' });
      expect(next.days.every((d) => d.from >= addDays(t.pilot!.decideAt, 40, NY))).toBe(true);
      expect(notices(sim).some((n) => n.includes('It’s your contract for the series’ first season, beginning in July'))).toBe(true);
      // Kept through a save: the series and the part read as they were.
      const back = reload(sim);
      expect(seriesById(series.id)).toEqual(series);
      expect(back.player.pro!.engagements.find((x) => x.id === e.id)!.pilot).toEqual(e.pilot);
      expect(back.player.pro!.engagements.find((x) => x.id === next.id)!.days).toEqual(next.days);
      seed = `b27-pilots-journey-${k}`;
    }
    expect(seed).not.toBe('');
    void sawLapse;
    // The falsifiability twin: the same save and pilot, the days judged Unready.
    const twin = graduate(seed);
    ensurePro(twin, twin.player).sag = { eligibleSince: twin.now - 60 * MS_DAY, memberSince: twin.now - 30 * MS_DAY };
    const again = between(twin);
    const w = wrapped(twin, again.t, again.week);
    judgedAll(w.e, 'unready');
    twin.advanceTo(again.t.pilot!.decideAt + MS_HOUR);
    expect(w.e.pilot).toMatchObject({ picked: false });
    expect(clauseOf(w.e.contract, 'option')!.status).toBe('expired');
    expect(w.c!.release).toEqual({ kind: 'shelved' });
    expect(twin.universe.scheduled.some((i) => i.kind === RELEASE_KIND && i.refId === w.c!.id && i.status === 'pending')).toBe(false);
    expect(premiereOf(twin, twin.player, w.c!)).toBeUndefined();
    expect(notices(twin).some((n) => n.startsWith(`${again.t.project} Isn’t Picked Up | ${again.t.pilot!.network} passed on ${again.t.project}: it won’t go to series, and the pilot won’t air.`))).toBe(true);
    expect(creditWords(twin, twin.player, w.c!)).toBe('Shot, and its network passed on the pilot: it won’t air');
    twin.advanceTo(w.due! + 30 * MS_DAY);
    expect(w.c!.status).toBe('shot');
    expect(reelSources(twin.player, twin.now).some((x) => x.ref === `footage:${w.c!.id}`)).toBe(false);
  }, 1_200_000);
});
