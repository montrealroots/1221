/**
 * Brief 25's Module 6 (from 2026-10-24; `docs/verification/career-world-2026-10-23/criteria.md`, X1 to X15): the
 * reference charts as dated imports, the game's own chart for the player's films, the awards and festivals inventory,
 * and the Emmy Awards and Sundance played through the commands and the clock. Parts are worked from an offer written as
 * casting writes one (TEST SETUP, said where it's made); the seeds a premise needs are named and their premise held.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { projectById } from '@/engine/content/careerwork';
import { CHARTS, SNAPSHOTS, type ChartSnapshot } from '@/engine/content/charts';
import {
  EMMYS_78, EMMY_CATEGORIES, EMMY_RULES, INSTITUTIONS, SUNDANCE_2027, emmyEdition, emmyYearOf, sundanceEdition,
} from '@/engine/content/awards';
import {
  OPENING, REFERENCE, RUN, currentOf, emptyStore, figureWords, importSnapshot, latestOf, movementOf, movementWords, placeIn, rankAmong,
  simulateRun, titleAcross, weeksBy, weeksOf, weeksSoFar,
} from '@/engine/systems/charts';
import {
  FIELD, VISIBILITY, ceremonyLines, deadlineOf, emmyCheck, entryFee, entryRefusal, festivalCheck, festivalCheckWords, nominate, nominationsFor,
  recapWords, recognitionOf, visibilityOf, watchRefusal,
} from '@/engine/systems/awards';
import { CASTING_KIND, castingDraw, payTermsOf } from '@/engine/systems/projobs';
import { ensurePro, resumeBehind, resumeNow, type Engagement, type Opportunity, type ProCredit } from '@/engine/systems/pro';
import { at, graduate, notices, played, reload, skilled } from './fakes/career-world';

/** TEST SETUP: an offer for a part, written as casting writes one, at the rate's scale. */
function offerFor(sim: Simulation, projectId: string, postedAt: number): Opportunity {
  const t = projectById(projectId)!;
  const terms = payTermsOf({ projectId, postedAt });
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId, via: 'open', status: 'offered', postedAt, submitBy: postedAt + 7 * MS_DAY, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units },
  };
  ensurePro(sim, sim.player).opportunities.push(o);
  return o;
}

/** The part prepared by its own steps, each pressed until it can do no more, as tests/career-workflows.test.ts does. */
function prepared(sim: Simulation, e: Engagement, steps: readonly string[]): void {
  for (let n = 0; n < 48; n += 1) {
    let any = false;
    let busy = false;
    for (const step of steps) {
      const r = sim.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step } });
      if (r.ok) any = true;
      else if (/^You’re (at|asleep)|^You’re too tired/.test(String(r.error))) busy = true;
      played(sim, sim.now + 30 * 60_000);
    }
    if (busy && !any) { played(sim, sim.now + 2 * MS_HOUR); continue; }
    if (!any) break;
  }
}

/**
 * A part worked to its wrap from an offer posted on September 7, 2026: a SAG-AFTRA member already (TEST SETUP, so the
 * union's thirty days don't refuse it), skilled where a premise needs strong work (TEST SETUP, as years of work would
 * leave it).
 */
function wrapped(seed: string, projectId: string, opts: { skilled?: boolean; steps?: readonly string[] } = {}): { sim: Simulation; c: ProCredit; e: Engagement } {
  const sim = graduate(seed);
  if (opts.skilled !== false) skilled(sim);
  ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
  const o = offerFor(sim, projectId, at(2026, 9, 7));
  sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
  const e = sim.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
  prepared(sim, e, opts.steps ?? ['read', 'lines', 'rehearse']);
  played(sim, e.days.at(-1)!.to + MS_HOUR);
  return { sim, c: sim.player.pro!.credits.find((x) => x.engagementId === e.id)!, e: sim.player.pro!.engagements.find((x) => x.id === e.id)! };
}

const creditIn = (sim: Simulation, id: string) => sim.player.pro!.credits.find((c) => c.id === id)!;
const entryOf = (sim: Simulation) => sim.player.pro!.awards![0]!;
const ED79 = emmyEdition(2027);
/** The 79th's days, as the game projects them from the 78th's. */
const NOMINATIONS = at(2027, 7, 8, 12);
const FINAL_ENDS = at(2027, 8, 27, 1);
const CREATIVE_ARTS = at(2027, 9, 5, 21);
const sources = JSON.parse(readFileSync('docs/verification/career-world-2026-10-23/sources.json', 'utf8')) as { sources: { id: string; status: string }[] };
const sourceStatus = (id: string) => sources.sources.find((s) => s.id === id)?.status;

// ---------------------------------------------------------------------------------------------------------------------
// The reference charts
// ---------------------------------------------------------------------------------------------------------------------

describe('X1 to X4: the reference charts, dated imports', () => {
  it('CHART-01, CHART-03, CHART-04, CHART-05, CHART-07: every snapshot names its chart’s provider, source, territory, metric and unit, its measured week, when it was first seen and imported and by whom, and each rank’s value or an explicit unknown; nothing is fetched or paid for', () => {
    for (const s of SNAPSHOTS) {
      const spec = CHARTS[s.chart];
      expect(sourceStatus(spec.source), spec.source).toBe('read');
      expect([spec.provider, spec.territory, spec.metric, spec.unit].every(Boolean), s.chart).toBe(true);
      expect(Math.round((Date.parse(s.to) - Date.parse(s.from)) / MS_DAY), `${s.chart} ${s.from}`).toBe(6);
      expect(new Date(`${s.from}T12:00:00Z`).getUTCDay()).toBe(spec.startsOn);
      expect([s.firstSeen, s.imported].every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)) && s.seenBy.length > 0).toBe(true);
      for (const e of s.entries) expect(e.value === null || (Number.isFinite(e.value) && e.value >= 0), `${s.chart} ${e.name}`).toBe(true);
      expect(new Set(s.entries.map((e) => e.rank)).size).toBe(s.entries.length);
    }
    // Box Office Mojo counts dollars, Friday to Thursday; Netflix views, Monday to Sunday; Nielsen minutes, the same days.
    expect(['bom-domestic-weekly', 'netflix-films-english', 'nielsen-streaming-overall'].map((c) => [CHARTS[c as 'bom-domestic-weekly'].unit, CHARTS[c as 'bom-domestic-weekly'].startsOn])).toEqual([['usd', 5], ['views', 1], ['minutes-millions', 1]]);
    // Held: Box Office Mojo's two weeks (the second with two readings), Netflix's four lists for two weeks, Nielsen's one.
    expect([REFERENCE.weeks.size, REFERENCE.refused.length]).toEqual([11, 0]);
    // The game never reaches a provider: the charts' code holds no request of any kind.
    for (const f of ['src/engine/systems/charts.ts', 'src/engine/content/charts.ts', 'src/ui/career/IndustryPane.tsx']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/);
    }
  });

  it('CHART-02, T50, T70: a title in two charts keeps each figure in its own unit, territory and week, and none is added to another', () => {
    const below = titleAcross(REFERENCE, 'below');
    expect(below.map((x) => [x.chart, x.from, figureWords(x.chart, x.entry.value)])).toEqual([
      ['netflix-tv-english', '2026-10-05', '17 million views'],
      ['nielsen-streaming-overall', '2026-10-05', '1,187 million minutes'],
      ['netflix-tv-english', '2026-10-12', '21.2 million views'],
    ]);
    expect(below.map((x) => CHARTS[x.chart].territory)).toEqual(['worldwide', 'the United States', 'worldwide']);
    // East of Eden is one title in both charts, by the id it's given in each.
    expect(new Set(titleAcross(REFERENCE, 'east-of-eden').map((x) => x.chart))).toEqual(new Set(['netflix-tv-english', 'nielsen-streaming-overall']));
    // A film in Netflix's films and in Nielsen's overall list: its views and its minutes, apart.
    expect(titleAcross(REFERENCE, 'animals').map((x) => figureWords(x.chart, x.entry.value))).toEqual(['23.8 million views', '719 million minutes', '30.8 million views']);
    expect(figureWords('bom-domestic-weekly', 38_338_634)).toBe('$38,338,634');
  });

  it('CHART-08, CHART-09, CHART-10, T67, T68, T75: movement only between consecutive weeks of one chart, new to the game’s record never a new release, outside the Top 10 never eleventh, an unpublished figure never zero', () => {
    const [w1, w2] = weeksOf(REFERENCE, 'netflix-films-english');
    const move = (title: string) => movementWords(movementOf(REFERENCE, w2!, currentOf(w2!).entries.find((e) => e.name === title)!.titleId));
    expect(move('Animals')).toBe('Held at No. 1');
    expect(move('Ice Age: Collision Course')).toBe('Up from No. 4');
    expect(move('Ice Age')).toBe('Down from No. 3');
    // Anyone But You has been in Netflix's Top 10 for four weeks: new to the game's record, never called new.
    expect(currentOf(w2!).entries.find((e) => e.name === 'Anyone But You')!.extra!.weeksInTop10).toBe(4);
    expect(move('Anyone But You')).toBe('New to this chart in the game’s record');
    // The first week held has no week before it to compare with.
    expect(movementWords(movementOf(REFERENCE, w1!, 'animals'))).toBe('No earlier week of this chart in the game’s record');
    // A title the first week had and the second hasn't is outside the published Top 10, not eleventh.
    expect(placeIn(currentOf(w2!), 'the-forever-purge')).toBe('outside');
    // Each week's Raw is its own title, so the second isn't the first's fall.
    const tv = weeksOf(REFERENCE, 'netflix-tv-english');
    expect(movementWords(movementOf(REFERENCE, tv[1]!, 'raw-october-12-2026'))).toBe('New to this chart in the game’s record');
    // Unknown isn't zero: a runtime the file gave as 0 is held as not reported, and a missing figure is said so.
    const mask = weeksOf(REFERENCE, 'netflix-tv-other')[1]!;
    expect(currentOf(mask).entries.find((e) => e.titleId === 'where-the-mask-ends')!.extra!.runtime).toBeNull();
    expect(figureWords('nielsen-streaming-overall', null)).toBe('Not Reported');
    // A title back after a week out is back, not new; a week held with a gap before it compares with nothing (TEST SETUP:
    // three weeks of a chart, imported as a provider's would be, the middle one without the title, then the third alone).
    const week = (from: string, to: string, ids: string[]): ChartSnapshot => ({ chart: 'netflix-films-english', from, to, firstSeen: to, imported: to, seenBy: 'a test', partial: true, entries: ids.map((id, i) => ({ rank: i + 1, name: id, titleId: id, value: 1_000_000 - i })) });
    const three = emptyStore();
    for (const w of [week('2026-10-05', '2026-10-11', ['a', 'b']), week('2026-10-12', '2026-10-18', ['b']), week('2026-10-19', '2026-10-25', ['a', 'b'])]) importSnapshot(three, w);
    expect(movementWords(movementOf(three, weeksOf(three, 'netflix-films-english')[2]!, 'a'))).toBe('Back in the Top 10, last in the game’s record the week ending October 11, 2026');
    const gap = emptyStore();
    for (const w of [week('2026-10-05', '2026-10-11', ['a']), week('2026-10-19', '2026-10-25', ['a'])]) importSnapshot(gap, w);
    expect(movementOf(gap, weeksOf(gap, 'netflix-films-english')[1]!, 'a')).toEqual({ kind: 'not-comparable' });
    // Nothing beyond what a provider published is held: no retention, completion or audience of any title.
    const keys = new Set(SNAPSHOTS.flatMap((s) => s.entries.flatMap((e) => Object.keys(e.extra ?? {}))));
    expect([...keys].sort()).toEqual(['episodes', 'hours', 'providers', 'runtime', 'theaters', 'total', 'weeks', 'weeksInTop10']);
  });

  it('CHART-08, T71, T72, T97: the same week twice is one, a changed figure a revision with the first kept, a malformed one refused with the last good week kept, and a chart not updated says how old it is', () => {
    const bom = weeksOf(REFERENCE, 'bom-domestic-weekly')[1]!;
    expect(bom.revisions.map((r) => [r.seenBy, r.entries.length, r.entries[0]!.value])).toEqual([['the dossier (S93)', 2, 37_177_832], ['this build', 10, 38_338_634]]);
    expect(currentOf(bom).entries[0]!.value).toBe(38_338_634);
    const store = emptyStore();
    const good = SNAPSHOTS.find((s) => s.chart === 'nielsen-streaming-overall')!;
    expect(importSnapshot(store, good)).toEqual({ kind: 'added' });
    expect(importSnapshot(store, { ...good, imported: '2026-10-25' })).toEqual({ kind: 'duplicate' });
    const revised: ChartSnapshot = { ...good, firstSeen: '2026-10-30', entries: good.entries.map((e) => (e.rank === 1 ? { ...e, value: 1_270 } : e)) };
    expect(importSnapshot(store, revised)).toEqual({ kind: 'revision' });
    expect(store.weeks.get('nielsen-streaming-overall:2026-10-05')!.revisions.map((r) => r.entries[0]!.value)).toEqual([1_264, 1_270]);
    const bad: [string, ChartSnapshot][] = [
      ['Its week isn’t seven days.', { ...good, to: '2026-10-12' }],
      ['Its week doesn’t start on the day Nielsen Streaming Top 10: Overall’s weeks do.', { ...good, from: '2026-10-06', to: '2026-10-12' }],
      ['A rank is in it twice.', { ...good, entries: good.entries.map((e) => (e.rank === 2 ? { ...e, rank: 1 } : e)) }],
      ['It holds fewer than ten ranks without saying it’s partial.', { ...good, entries: good.entries.slice(0, 9) }],
      ['A figure isn’t a count of millions of minutes.', { ...good, entries: good.entries.map((e) => (e.rank === 3 ? { ...e, value: -5 } : e)) }],
    ];
    for (const [why, s] of bad) expect(importSnapshot(store, s), why).toEqual({ kind: 'refused', why });
    expect(store.refused.length).toBe(bad.length);
    expect(store.weeks.get('nielsen-streaming-overall:2026-10-05')!.revisions.at(-1)!.entries[0]!.value).toBe(1_270);
    // How old: the week that ended October 22 is the latest on November 15, three weeks old; on October 20 it hasn't ended.
    expect(latestOf(REFERENCE, 'bom-domestic-weekly', at(2026, 11, 15))).toMatchObject({ weeksOld: 3 });
    expect(latestOf(REFERENCE, 'bom-domestic-weekly', at(2026, 11, 15))!.week.from).toBe('2026-10-16');
    expect(weeksBy(REFERENCE, 'bom-domestic-weekly', at(2026, 10, 20)).map((w) => w.from)).toEqual(['2026-10-09']);
    expect(latestOf(REFERENCE, 'bom-domestic-weekly', at(2026, 10, 1))).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The game's own chart
// ---------------------------------------------------------------------------------------------------------------------

describe('X5: the game’s own chart for the player’s films', () => {
  it('CHART-06, CHART-11, T73, T74, T84, CON-10, T98: a released film enters a simulated weekly chart apart from the reference charts, ranked among unnamed releases with no outside career behind them; unreleased it isn’t charted; a gross is never pay; how the part went doesn’t move it', () => {
    const { sim, c } = wrapped('awards-boxoffice', 'gull-season', { steps: ['read', 'lines', 'rehearse', 'special'] });
    expect(c.run).toBeUndefined();
    const release = sim.universe.scheduled.find((i) => i.kind === 'pro.release' && i.refId === c.id && i.status === 'pending')!.at;
    // Its twin, its part judged differently (TEST SETUP: every day's takes judged at the lowest, and the band they leave).
    const twin = reload(sim);
    creditIn(twin, c.id).band = 'unready';
    for (const u of twin.player.pro!.engagements.find((x) => x.id === c.engagementId)!.units ?? []) if (u.takes?.length) { u.takes = u.takes.map(() => 30); u.best = 30; }
    const before = sim.universe.transactions.length;
    sim.advanceTo(release + 13 * 7 * MS_DAY);
    twin.advanceTo(release + 13 * 7 * MS_DAY);
    const run = creditIn(sim, c.id).run!;
    expect(run.simulated).toBe(true);
    expect(run).toEqual(creditIn(twin, c.id).run);
    expect([creditIn(sim, c.id).band, creditIn(twin, c.id).band]).toEqual(['exceptional', 'unready']);
    // Its opening within its kind's range, each week a share of the last between the run's bounds, at most twelve weeks.
    const [lo, hi] = OPENING['low-budget']!;
    expect(run.weeks[0]!.gross).toBeGreaterThanOrEqual(lo);
    expect(run.weeks[0]!.gross).toBeLessThanOrEqual(hi);
    for (let k = 1; k < run.weeks.length; k += 1) {
      const share = run.weeks[k]!.gross / run.weeks[k - 1]!.gross;
      expect(share).toBeGreaterThanOrEqual(RUN.keepLeast - 0.001);
      expect(share).toBeLessThanOrEqual(RUN.keepMost + 0.001);
    }
    expect(run.weeks.length).toBeLessThanOrEqual(RUN.weeksMost);
    // Ranked among the game's own unnamed releases: a place or outside, never a name.
    for (const w of run.weeks) expect(w.rank === 'outside' || (Number.isInteger(w.rank) && w.rank >= 1 && w.rank <= 10)).toBe(true);
    expect(rankAmong(sim, run.weeks[0]!.from, 0)).toBe('outside');
    expect(rankAmong(sim, run.weeks[0]!.from, 1e12)).toBe(1);
    // Never pay: the weeks in cinemas post nothing to the player's accounts that names the film's gross.
    const posted = sim.universe.transactions.slice(before).filter((p) => /gross|box office/i.test(JSON.stringify(p)));
    expect(posted).toEqual([]);
    // The weeks the clock hasn't reached aren't shown; a television part has no run.
    expect(weeksSoFar(run, run.weeks[0]!.to - 1)).toEqual([]);
    expect(simulateRun(sim, 'calloway-files', 'network-drama', release)).toBeUndefined();
    // Apart from the reference charts: nothing of the player's is in them.
    expect([...REFERENCE.weeks.values()].some((w) => currentOf(w).entries.some((e) => e.name === c.project))).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The inventory
// ---------------------------------------------------------------------------------------------------------------------

describe('X6: the awards and festivals the brief names, each with what was read of it', () => {
  it('AWD-02, AWD-03, AWD-04, AWD-05: fourteen awards and eight festivals, each with its sources; only those whose rules were read decide; the Emmy organizations are separate competitions', () => {
    expect(INSTITUTIONS.filter((i) => i.kind === 'award').map((i) => i.id)).toEqual(['oscars', 'emmys', 'natas', 'iemmys', 'bafta', 'actor-awards', 'golden-globes', 'spirit', 'critics-choice', 'gotham', 'aacta', 'cesar', 'goya', 'annie']);
    expect(INSTITUTIONS.filter((i) => i.kind === 'festival').map((i) => i.id)).toEqual(['cannes', 'venice', 'berlinale', 'sundance', 'tiff', 'annecy', 'idfa', 'busan']);
    for (const i of INSTITUTIONS) {
      expect(i.sources.length, i.id).toBeGreaterThan(0);
      for (const s of i.sources) expect(sourceStatus(s), `${i.id} ${s}`).toBeDefined();
      // Enforced only on rules this build read; the rest say the game doesn't decide.
      if (i.coverage === 'enforced') expect(i.sources.some((s) => sourceStatus(s) === 'read'), i.id).toBe(true);
      else expect(i.known, i.id).toMatch(/doesn’t (decide|say)|isn’t simulated/);
    }
    expect(INSTITUTIONS.filter((i) => i.coverage === 'enforced').map((i) => i.id)).toEqual(['emmys', 'iemmys', 'sundance']);
    // Three Emmy organizations, three competitions, each with its own source.
    const emmys = INSTITUTIONS.filter((i) => ['emmys', 'natas', 'iemmys'].includes(i.id));
    expect(new Set(emmys.map((i) => i.sources.join())).size).toBe(3);
    expect(new Set(emmys.map((i) => i.organizer)).size).toBe(3);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The Emmy Awards
// ---------------------------------------------------------------------------------------------------------------------

describe('X7: Emmy eligibility by the 78th’s rules', () => {
  it('AWD-06, AWD-10, AWD-11, T94: the eligibility year runs June 1 to May 31; the 78th’s dates are the rules’, a later edition’s projected and said so; the categories follow the program', () => {
    expect([emmyYearOf('2027-05-31'), emmyYearOf('2027-06-01')]).toEqual([2027, 2028]);
    expect(emmyEdition(2026)).toBe(EMMYS_78);
    expect([EMMYS_78.projected, EMMYS_78.entryDeadline, EMMYS_78.nominationsAnnounced, EMMYS_78.creativeArts]).toEqual([false, '2026-05-07', '2026-07-08', '2026-09-05']);
    expect([ED79.number, ED79.projected, ED79.entryDeadline, ED79.eligibility.from]).toEqual([79, true, '2027-05-07', '2026-06-01']);
    expect([sundanceEdition(2027), sundanceEdition(2028).projected]).toEqual([SUNDANCE_2027, true]);
    expect([EMMY_RULES.fees.processing + EMMY_RULES.fees.perEntrant, EMMY_RULES.guestBelow, EMMY_RULES.leastShare]).toEqual([225_00, 0.5, 0.05]);
    expect([EMMY_CATEGORIES['guest-drama'].actor, EMMY_CATEGORIES['guest-drama'].actress, EMMY_CATEGORIES['voice-over'].actor]).toEqual([71, 73, 75]);
  });

  it('AWD-06, AWD-12, T94: each kind of part played to its wrap is checked by its program’s rules: a guest part, a series’ supporting part, a limited series’ supporting part at 5% of the whole, a dub, a narration and a film; the year follows each premiere', () => {
    const guest = wrapped('awards-journey-0', 'calloway-files');
    expect(emmyCheck(guest.sim, guest.sim.player, guest.c)).toEqual({ eligible: true, year: 2027, category: 'guest-drama', scenes: 6, of: 40, episodes: 1, season: 13 });
    const limited = wrapped('awards-limited', 'glass-orchard', { skilled: false });
    const lim = emmyCheck(limited.sim, limited.sim.player, limited.c);
    // Premiering June 13, 2027, a day past the 79th's year: it's the 80th's.
    expect(lim).toMatchObject({ eligible: true, year: 2028, category: 'supporting-limited', of: 240 });
    expect((lim as { scenes: number }).scenes / 240).toBeGreaterThanOrEqual(0.05);
    // The same part with fewer of its scenes kept (TEST SETUP: all but eleven cut, as the edit cuts): under 5% of the whole.
    const kept = limited.e.units!.filter((u) => u.takes?.length);
    for (const u of kept.slice(11)) u.cut = true;
    expect(emmyCheck(limited.sim, limited.sim.player, limited.c)).toEqual({ eligible: false, year: 2028, why: 'A brief appearance: 11 of about 240 scenes, under the 5% of the running time a supporting performer needs.' });
    const comedy = wrapped('awards-comedy', 'half-past-normal', { skilled: false });
    expect(emmyCheck(comedy.sim, comedy.sim.player, comedy.c)).toMatchObject({ eligible: true, year: 2027, category: 'guest-comedy' });
    const dub = wrapped('awards-dub', 'salt-road', { skilled: false });
    expect(emmyCheck(dub.sim, dub.sim.player, dub.c)).toEqual({ eligible: false, why: 'A program produced abroad isn’t eligible unless U.S. and foreign partners co-produced it to be shown on U.S. television, and a new English soundtrack doesn’t make it eligible.' });
    const narration = wrapped('awards-narration', 'tidewater-narrator', { skilled: false });
    expect(emmyCheck(narration.sim, narration.sim.player, narration.c)).toEqual({ eligible: false, why: 'Performers in documentary and nonfiction programs aren’t eligible in any performer category.' });
    // An animated series for children under 13 goes to a competition the game doesn't cover.
    const kids = wrapped('awards-kids', 'lantern-row', { skilled: false, steps: ['read', 'rehearse', 'special'] });
    expect(emmyCheck(kids.sim, kids.sim.player, kids.c)).toMatchObject({ eligible: false, why: 'Animation for children under 13 is eligible only in the Children’s And Family Emmys, which the game doesn’t cover.' });
    const film = wrapped('awards-film', 'gull-season', { skilled: false, steps: ['read', 'lines', 'rehearse', 'special'] });
    expect(emmyCheck(film.sim, film.sim.player, film.c)).toMatchObject({ eligible: false, why: 'The Emmy Awards are for programs first presented on television, and this is a film.' });
  });

  it('AWD-06, T55: a guest part once nominated as a supporting part stays a supporting part, by the 78th’s Guest Performer Eligibility', () => {
    const { sim, c } = wrapped('awards-journey-0', 'calloway-files');
    expect(emmyCheck(sim, sim.player, c)).toMatchObject({ category: 'guest-drama' });
    // TEST SETUP: an earlier year's nomination for the same role in the same series, in its supporting category.
    const earlier: ProCredit = { ...c, id: 'earlier-credit' };
    sim.player.pro!.credits.push(earlier);
    sim.player.pro!.awards = [{ id: 'earlier', institution: 'emmys', year: 2026, category: 'supporting-drama', creditId: earlier.id, engagementId: c.engagementId!, state: 'nominated', ceremonyAt: at(2026, 9, 14, 20) }];
    expect(emmyCheck(sim, sim.player, c)).toMatchObject({ eligible: true, category: 'supporting-drama' });
  });

  it('AWD-06, T55: in half the season’s episodes or more a part is a supporting one; a guest part under 5% of its episode is a brief appearance', () => {
    const { sim, c, e } = wrapped('awards-journey-0', 'calloway-files');
    const units = sim.player.pro!.engagements.find((x) => x.id === e.id)!.units!.filter((u) => u.takes?.length);
    // TEST SETUP: its six scenes, one to an episode, as if the part were in six of the season's thirteen: under half, so
    // a guest part, and a scene an episode is under 5% of one.
    const was = units.map((u) => u.episode);
    units.forEach((u, i) => { u.episode = i + 1; });
    expect(emmyCheck(sim, sim.player, c)).toEqual({ eligible: false, year: 2027, why: 'A brief appearance: 1 of about 40 scenes, under the 5% of the episode’s running time a guest performer needs.' });
    // A seventh scene, in a seventh episode: half the season or more, a supporting part, which has no minimum.
    const engagement = sim.player.pro!.engagements.find((x) => x.id === e.id)!;
    engagement.units!.push({ ...units[0]!, id: 'u-seventh', episode: 7 });
    expect(emmyCheck(sim, sim.player, c)).toMatchObject({ eligible: true, category: 'supporting-drama', episodes: 7, season: 13, scenes: 1 });
    engagement.units!.pop();
    units.forEach((u, i) => { u.episode = was[i]; });
    // TEST SETUP: all but one of its scenes cut, as the edit cuts one: 1 of about 40, under 5%.
    units.slice(1).forEach((u) => { u.cut = true; });
    expect(emmyCheck(sim, sim.player, c)).toEqual({ eligible: false, year: 2027, why: 'A brief appearance: 1 of about 40 scenes, under the 5% of the episode’s running time a guest performer needs.' });
    units.slice(2).forEach((u) => { u.cut = undefined; });
    expect(emmyCheck(sim, sim.player, c)).toMatchObject({ eligible: true, category: 'guest-drama', scenes: 5 });
  });
});

describe('X8 to X12: entry, the field, the nominations, the ceremony', () => {
  it('AWD-06, AWD-09, AWD-12, T53, T54, T81: Enter Yourself pays the $125 processing charge and the $100 entry fee once, by the deadline; a second entry, or one after the deadline, is refused with why', () => {
    const { sim, c } = wrapped('awards-journey-0', 'calloway-files');
    expect(entryFee(sim)).toBe(225_00);
    const late = reload(sim);
    const ledger = sim.universe.transactions.length;
    const r = sim.must<{ entryId: string; fee: number }>({ kind: 'pro.award_enter', payload: { creditId: c.id } });
    expect(r.fee).toBe(225_00);
    const paid = sim.universe.transactions.slice(ledger);
    expect(paid.length).toBeGreaterThan(0);
    expect(JSON.stringify(paid)).toContain('Emmy Awards entry: Desk Clerk, The Calloway Files');
    expect(entryOf(sim)).toMatchObject({ state: 'entered', enteredBy: 'you', category: 'guest-drama', year: 2027, fee: 225_00 });
    expect(entryRefusal(sim, sim.player, c.id)).toBe('It’s already entered for the 79th Emmy Awards.');
    // T54: the deadline is the end of May 7 on the Academy's clock, in Los Angeles: at 11:30 PM in New York that day an
    // entry is still in time, three hours before the deadline (TEST SETUP: a twin with no entry yet, its clock moved there).
    const lateNight = reload(late);
    lateNight.advanceTo(at(2027, 5, 7, 23, 30));
    expect(deadlineOf(ED79)).toBe(at(2027, 5, 8, 2, 59));
    expect(entryRefusal(lateNight, lateNight.player, c.id)).toBeUndefined();
    // Its twin waits past the 79th's deadline, and its production didn't enter it (this seed's premise): too late.
    late.advanceTo(at(2027, 5, 8, 12));
    expect(entryOf(late)).toMatchObject({ state: 'not-entered', year: 2027 });
    expect(entryRefusal(late, late.player, c.id)).toBe('The entry deadline for the 79th Emmy Awards was May 7, 2027, as the game projects it.');
    expect(recapWords(late.player, entryOf(late))).toBe('Not entered for the 79th Emmy Awards: the entry deadline passed.');
    expect(late.player.pro!.awards!.length).toBe(1);
  });

  it('ANON-01, ANON-02, ANON-03, ANON-04, T76, T77, T84: entered and not nominated: the field kept with the competition, its nominations by the 78th’s table, no ceremony of the player’s, and no other entrant named anywhere', () => {
    const { sim, c } = wrapped('awards-journey-1', 'calloway-files');
    sim.must({ kind: 'pro.award_enter', payload: { creditId: c.id } });
    sim.advanceTo(NOMINATIONS);
    const a = entryOf(sim);
    expect(a.state).toBe('not-nominated');
    expect(a.field!.nominations).toBe(nominationsFor(a.field!.submissions));
    expect(a.field!.submissions).toBeGreaterThanOrEqual(FIELD.leastSubmissions);
    expect(a.field!.nominees).not.toContain('you');
    expect(watchRefusal(sim, sim.player, a.id)).toBe('You weren’t nominated, so there’s no ceremony of yours to watch.');
    sim.advanceTo(CREATIVE_ARTS);
    expect(entryOf(sim).state).toBe('not-nominated');
    expect(recognitionOf(sim.player)).toEqual([]);
    expect(recapWords(sim.player, entryOf(sim))).toBe('Entered for Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards, and not nominated.');
    // The field's ids stay with the competition: none is in any notice or word the player reads.
    const said = [...notices(sim), recapWords(sim.player, entryOf(sim))].join(' ');
    expect(said).not.toMatch(/2027:guest-drama:\d+/);
    expect(notices(sim).some((n) => n.startsWith('The Emmy Nominations Are Out | You weren’t nominated for Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards, for Desk Clerk in The Calloway Files'))).toBe(true);
    // The same field for anyone who asks: a reload draws nothing again.
    const again = reload(sim);
    expect(entryOf(again).field).toEqual(entryOf(sim).field);
  });

  it('ANON-05, ANON-09, ANON-10, T78, T80: nominated and not won: the nomination kept, the winner an anonymous id kept with the competition, the recap says only that the player didn’t win, and watching or not changes nothing', () => {
    const { sim, c } = wrapped('awards-journey-2', 'calloway-files');
    sim.must({ kind: 'pro.award_enter', payload: { creditId: c.id } });
    sim.advanceTo(NOMINATIONS);
    expect(entryOf(sim).state).toBe('nominated');
    expect(watchRefusal(sim, sim.player, entryOf(sim).id)).toBe('The award is presented on September 5, 2027.');
    sim.advanceTo(FINAL_ENDS);
    const winner = entryOf(sim).field!.winner!;
    expect(winner).toMatch(/^2027:guest-drama:\d+$/);
    const skipped = reload(sim);
    sim.advanceTo(CREATIVE_ARTS);
    skipped.advanceTo(CREATIVE_ARTS);
    const lines = sim.must<{ lines: string[] }>({ kind: 'pro.watch_ceremony', payload: { entryId: entryOf(sim).id } }).lines;
    expect(lines.at(-1)).toBe('It goes to another nominee. You didn’t win, and your nomination stands.');
    expect(lines.join(' ')).not.toContain(winner);
    expect([entryOf(sim).state, entryOf(skipped).state, entryOf(skipped).field!.winner]).toEqual(['lost', 'lost', winner]);
    expect(recapWords(sim.player, entryOf(sim))).toBe('Nominated for Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards, for Desk Clerk in The Calloway Files. You didn’t win.');
    // A résumé lists the nomination still, never more (from 2026-10-25, brief 27, Part 7).
    expect(resumeNow(sim.player, sim.now).lines.filter((l) => l.startsWith('Emmy'))).toEqual(['Emmy nomination: Outstanding Guest Actress In A Drama Series, for Desk Clerk in The Calloway Files, 2027']);
    expect(recognitionOf(sim.player).map((r) => r.words)).toEqual([recapWords(sim.player, entryOf(sim))]);
  });

  it('ANON-06, ANON-07, ANON-08, ANON-09, ANON-10, T56, T57, T79, T80: a win settled at the final round, given at the ceremony, kept for good on the Portfolio, paying nothing; watched or skipped, and reloaded, it’s one award', () => {
    const { sim, c } = wrapped('awards-journey-0', 'calloway-files');
    sim.must({ kind: 'pro.award_enter', payload: { creditId: c.id } });
    // A résumé made before the nominations (from 2026-10-25, brief 27, Part 7): an entry isn't on it.
    sim.must({ kind: 'pro.update_resume', payload: {} });
    expect(resumeBehind(sim.player, sim.now)).toEqual([]);
    sim.advanceTo(NOMINATIONS);
    expect(entryOf(sim).state).toBe('nominated');
    expect(notices(sim).some((n) => n.startsWith('You’re Nominated For An Emmy | You’re one of'))).toBe(true);
    // Announced, the nomination is on the record and the résumé is behind it, until it's updated.
    expect(resumeBehind(sim.player, sim.now)).toEqual(['your Emmy nomination for Desk Clerk']);
    expect(resumeNow(sim.player, sim.now).lines).toContain('Emmy nomination: Outstanding Guest Actress In A Drama Series, for Desk Clerk in The Calloway Files, 2027');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    sim.advanceTo(FINAL_ENDS);
    expect(entryOf(sim).field!.winner).toBe('you');
    // Settled, and still the player's to learn: until the ceremony it reads as a nomination.
    expect(entryOf(sim).state).toBe('nominated');
    const reloaded = reload(sim);
    const ledger = sim.universe.transactions.length;
    sim.advanceTo(CREATIVE_ARTS);
    reloaded.advanceTo(CREATIVE_ARTS);
    expect(sim.universe.transactions.slice(ledger).filter((p) => /emmy/i.test(JSON.stringify(p)))).toEqual([]);
    const lines = sim.must<{ lines: string[] }>({ kind: 'pro.watch_ceremony', payload: { entryId: entryOf(sim).id } }).lines;
    expect(lines).toEqual(ceremonyLines(sim.player, entryOf(sim)));
    expect(lines.at(-1)).toBe('It’s you: you won Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards.');
    expect([entryOf(sim).state, entryOf(reloaded).state]).toEqual(['won', 'won']);
    // Given, the win replaces the nomination on a résumé made now, and the one made at the nominations is behind it.
    expect(resumeBehind(sim.player, sim.now)).toEqual(['your Emmy win for Desk Clerk']);
    expect(resumeNow(sim.player, sim.now).lines.filter((l) => l.startsWith('Emmy'))).toEqual(['Emmy Award: Outstanding Guest Actress In A Drama Series, for Desk Clerk in The Calloway Files, 2027']);
    // The same result, a different attendance history: the twin that watched keeps when it did, the other nothing.
    expect([entryOf(sim).watchedAt, entryOf(reloaded).watchedAt]).toEqual([sim.now, undefined]);
    expect(sim.player.pro!.awards!.length).toBe(1);
    // Watching it again shows the same, and changes nothing; a year on and reloaded, the win is on the Portfolio still.
    expect(sim.must<{ lines: string[] }>({ kind: 'pro.watch_ceremony', payload: { entryId: entryOf(sim).id } }).lines).toEqual(lines);
    sim.advanceTo(at(2028, 9, 10));
    expect(recognitionOf(reload(sim).player).map((r) => r.words)).toEqual(['You won Outstanding Guest Actress In A Drama Series at the 79th Emmy Awards, for Desk Clerk in The Calloway Files.']);
    // A program's award is never the performer's: every category the game enters is a performer's.
    expect(Object.values(EMMY_CATEGORIES).every((k) => /Actor|Actress|Performance/.test(k.actorName))).toBe(true);
  });

  it('ANON-04, T92: an entry whose scenes were all cut in the edit is disqualified at the nominations, the pay untouched', () => {
    const { sim, c, e } = wrapped('awards-journey-0', 'calloway-files');
    sim.must({ kind: 'pro.award_enter', payload: { creditId: c.id } });
    const pay = e.pay.map((p) => [p.key, p.promised]);
    // TEST SETUP: every scene of the part cut, as the edit cuts one.
    for (const u of sim.player.pro!.engagements.find((x) => x.id === e.id)!.units!) u.cut = true;
    sim.advanceTo(NOMINATIONS);
    expect(entryOf(sim)).toMatchObject({ state: 'disqualified', why: 'None of your scenes is in the program as it aired.' });
    expect(notices(sim).some((n) => n === 'An Emmy Entry Disqualified | Your entry for Desk Clerk in The Calloway Files was disqualified: None of your scenes is in the program as it aired.')).toBe(true);
    expect(sim.player.pro!.engagements.find((x) => x.id === e.id)!.pay.map((p) => [p.key, p.promised])).toEqual(pay);
  });
});

describe('X13: visibility', () => {
  it('ANON-11, T82, T83: a nomination and a win lift casting’s chance for a while, within casting’s ceiling; no contract or account moves; work already judged isn’t judged again as the player grows', () => {
    const { sim, c } = wrapped('awards-journey-0', 'calloway-files');
    sim.must({ kind: 'pro.award_enter', payload: { creditId: c.id } });
    const grown = reload(sim);
    sim.advanceTo(CREATIVE_ARTS);
    const v = visibilityOf(sim.player, sim.now);
    const fade = (since: number, w: number) => w * (1 - (sim.now - since) / (VISIBILITY.fadeDays * MS_DAY));
    expect(v).toBeCloseTo(fade(at(2027, 7, 8, 9), VISIBILITY.nominated) + fade(entryOf(sim).ceremonyAt, VISIBILITY.won), 3);
    expect(visibilityOf(sim.player, sim.now + 3 * 365 * MS_DAY + 2 * MS_DAY)).toBe(0);
    // Casting reads it: the same audition's chance, lifted; at its ceiling, no higher.
    const o = { projectId: 'northern-line', postedAt: at(2027, 9, 6) };
    const plain = castingDraw(sim, o, 'final', 'working', 0.6).chance;
    expect(castingDraw(sim, o, 'final', 'working', 0.6, v).chance).toBeCloseTo(Math.min(0.8, plain * (1 + v)), 3);
    expect(castingDraw(sim, o, 'final', 'exceptional', 1, v).chance).toBeLessThanOrEqual(0.8);
    // On the clock, casting's decision reads it (TEST SETUP: a taped audition judged Working, as a round leaves it, its
    // decision on the clock an hour on), against a twin with the same audition and no recognition.
    const decide = (s: Simulation) => {
      const o: Opportunity = { id: s.nextId('pro'), projectId: 'route-nine', via: 'open', status: 'audition', postedAt: s.now - 7 * MS_DAY, submitBy: s.now, history: [], counts: {}, rounds: [{ round: 'audition', form: 'self-tape', at: s.now, status: 'done', band: 'working', overall: 60 }] };
      ensurePro(s, s.player).opportunities.push(o);
      s.schedule({ at: s.now + MS_HOUR, kind: CASTING_KIND, label: 'Casting Decides', category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: s.player.id, opportunityId: o.id, round: 0 } });
      s.advanceTo(s.now + 2 * MS_HOUR);
      return s.player.pro!.opportunities.find((x) => x.id === o.id)!.rounds![0]!.casting!.chance;
    };
    const unknown = reload(sim);
    unknown.player.pro!.awards = [];
    const lifted = decide(reload(sim));
    const flat = decide(unknown);
    expect(lifted).toBeCloseTo(Math.min(0.8, flat * (1 + visibilityOf(sim.player, sim.now + MS_HOUR))), 2);
    expect(lifted).toBeGreaterThan(flat);
    // However much is recognized, the lift stops at its most (TEST SETUP: four more wins the same night).
    const many = reload(sim);
    for (let k = 0; k < 4; k += 1) many.player.pro!.awards!.push({ ...entryOf(many), id: `more-${k}` });
    expect(visibilityOf(many.player, many.now)).toBe(VISIBILITY.most);
    // The win changed no contract.
    expect(sim.player.pro!.engagements.map((e) => e.contract)).toEqual(grown.player.pro!.engagements.map((e) => e.contract));
    // The twin grows after the wrap (TEST SETUP: abilities raised as years of work would) and its entry stands the same.
    for (const k of Object.keys(grown.player.craft ?? {})) (grown.player.craft as unknown as Record<string, number>)[k] = 100;
    grown.advanceTo(CREATIVE_ARTS);
    expect([creditIn(grown, c.id).band, entryOf(grown).field]).toEqual([creditIn(sim, c.id).band, entryOf(sim).field]);
  });
});

describe('X14: Sundance, by its 2027 rules', () => {
  it('AWD-01, AWD-07, AWD-09, T52, WF-19: a short is submitted by its production at the deadline, the festival answers, and selection and the screening are kept apart; the player has no command to submit it', () => {
    const { sim, c } = wrapped('awards-journey-1', 'eastview', { steps: ['read', 'lines', 'rehearse', 'special'] });
    // Finished in the fall of 2026, after the 2027 festival's short deadline of August 31: the 2028 festival's.
    expect(festivalCheck(sim, sim.player, c)).toEqual({ eligible: true, year: 2028, category: 'us-short' });
    expect(festivalCheckWords(festivalCheck(sim, sim.player, c))).toBe('Eligible for the 2028 Sundance Film Festival, in U.S. Short Films. The production submits it or doesn’t, by August 31, 2027, on the game’s reckoning; you can’t.');
    expect(sim.commandKinds().filter((k) => /festival|sundance|submit_film/.test(k))).toEqual([]);
    sim.advanceTo(at(2027, 9, 1, 12));
    expect(sim.player.pro!.festivals![0]).toMatchObject({ state: 'submitted', year: 2028, category: 'us-short' });
    // Submitted isn't selected: a résumé lists the festival only once it has said so (from 2026-10-25, brief 27, Part 7).
    const SELECTION = 'Sundance Film Festival, official selection: Last Bus To Eastview, U.S. Short Films, 2028';
    expect(resumeNow(sim.player, sim.now).lines).not.toContain(SELECTION);
    const saved = reload(sim);
    sim.advanceTo(at(2027, 12, 2, 12));
    expect(sim.player.pro!.festivals![0]!.state).toBe('selected');
    expect(resumeNow(sim.player, sim.now).lines).toContain(SELECTION);
    expect(recognitionOf(sim.player).map((r) => r.words)).toEqual(['Last Bus To Eastview is an official selection of the 2028 Sundance Film Festival, in U.S. Short Films. It screens in Boulder, Colorado, January 21 to 31, 2028.']);
    sim.advanceTo(at(2028, 1, 21, 12));
    expect(sim.player.pro!.festivals![0]!.state).toBe('selected');
    sim.advanceTo(at(2028, 1, 21, 19));
    expect(sim.player.pro!.festivals![0]).toMatchObject({ state: 'screened', screenedAt: at(2028, 1, 21, 18) });
    saved.advanceTo(at(2028, 1, 21, 19));
    expect(saved.player.pro!.festivals![0]).toEqual(sim.player.pro!.festivals![0]);
    // Another production doesn't submit at all, and nothing more comes of it.
    const none = wrapped('awards-journey-6', 'eastview', { steps: ['read', 'lines', 'rehearse', 'special'] });
    none.sim.advanceTo(at(2028, 2, 1));
    expect(none.sim.player.pro!.festivals![0]!.state).toBe('not-submitted');
  });

  it('AWD-08, T51: a feature released before the festival’s day can’t keep its world premiere, and it’s said before the release', () => {
    const { sim, c } = wrapped('awards-film', 'gull-season', { skilled: false, steps: ['read', 'lines', 'rehearse', 'special'] });
    expect(c.status).not.toBe('released');
    expect(festivalCheck(sim, sim.player, c)).toEqual({ eligible: false, year: 2028, why: 'Its release on October 19, 2027 comes before February 1, 2028, so it can’t keep the world premiere the 2028 festival asks of a feature.' });
  });

  it('T52: the line between a short and a feature is the festival’s, under 50 minutes; a studio’s film isn’t sent by open submission', () => {
    const studio = wrapped('awards-studio', 'breakwater', { skilled: false, steps: ['read', 'lines', 'rehearse', 'special'] });
    expect(festivalCheck(studio.sim, studio.sim.player, studio.c)).toMatchObject({ eligible: false, why: 'A studio’s film isn’t sent to Sundance by open submission, and the production hasn’t.' });
    const student = wrapped('awards-journey-10', 'paper-moons', { steps: ['read', 'lines', 'rehearse', 'special'] });
    expect(festivalCheck(student.sim, student.sim.player, student.c)).toMatchObject({ eligible: true, category: 'us-short' });
  });
});

describe('X15: time moves the cycles', () => {
  it('T48, T94: a part’s award year is its premiere’s: two parts booked the same day, one premiering in May and one in June, fall in the 79th and the 80th', () => {
    const may = wrapped('awards-boundary', 'northern-line', { skilled: false });
    const june = wrapped('awards-limited', 'glass-orchard', { skilled: false });
    const at79 = emmyCheck(may.sim, may.sim.player, may.c);
    const at80 = emmyCheck(june.sim, june.sim.player, june.c);
    expect([at79.year, at80.year]).toEqual([2027, 2028]);
    // The nominations of a ceremony a year apart: each part's own edition's.
    expect([emmyEdition(at79.year!).nominationsAnnounced, emmyEdition(at80.year!).nominationsAnnounced]).toEqual(['2027-07-08', '2028-07-08']);
    // Its entry is refused once its own edition's deadline passes, not the other's.
    may.sim.advanceTo(at(2027, 5, 8, 12));
    expect(entryRefusal(may.sim, may.sim.player, may.c.id)).toMatch(/^(It’s already entered for the 79th Emmy Awards\.|The entry deadline for the 79th Emmy Awards was May 7, 2027, as the game projects it\.)$/);
  });

  it('T76: the nomination table and the 78th’s tie rules', () => {
    expect([19, 20, 80, 81, 160, 161, 240, 241].map(nominationsFor)).toEqual([5, 5, 5, 6, 6, 7, 7, 8]);
    expect([8, 10, 7, 1].map(nominationsFor)).toEqual([2, 3, 2, 1]);
    const v = (...xs: number[]) => xs.map((votes, i) => ({ id: `e${i}`, votes }));
    // A tie across the line a step from the target breaks to the higher; two steps, to the lower.
    expect(nominate(v(90, 80, 70, 60, 50, 50, 40), 5)).toHaveLength(6);
    expect(nominate(v(90, 80, 70, 50, 50, 50, 50, 40), 5)).toHaveLength(3);
    // No tie: exactly the target.
    expect(nominate(v(90, 80, 70, 60, 50, 40), 5)).toEqual(['e0', 'e1', 'e2', 'e3', 'e4']);
  });
});
