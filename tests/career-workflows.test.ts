/**
 * Brief 25's Module 5 (from 2026-10-24; `docs/verification/career-world-2026-10-23/criteria.md`, W1 to W13): how each
 * kind of work is done. Each workflow's days, units, preparation, choices, reports and what it leaves, played through the
 * commands and the clock from an offer written as casting writes one (TEST SETUP, said where it's made), with the seeds a
 * premise needs named and their premise held, and twins played from the same moment where a choice is the one difference.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { PROJECTS, projectById } from '@/engine/content/careerwork';
import { FORMATS, STUNT, VOICE, WORKFLOWS, type FormatId, type WorkflowId } from '@/engine/content/workflows';
import { demoSources, ensurePro, reelSources, type Engagement, type Opportunity } from '@/engine/systems/pro';
import { bookedClash, datesOf, payTermsOf, castingDraw, termsWords } from '@/engine/systems/projobs';
import { clauseOf, overtimeOf } from '@/engine/systems/contracts';
import {
  AHEAD, INVITE_KIND, LOOP_KIND, choiceRefusal, decisionsFor, dubDaysOf, formatOf, keptBand, loopPay, reportWords, shotAhead, stepOf, strainOf,
  stuntChance, unitContext, workKey, loopDrawn, cutDrawn,
} from '@/engine/systems/workflow';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { replay } from '@/engine/systems/evaluation';
import { at, graduate, notices, played, reload, skilled, tended, zone } from './fakes/career-world';
import { booked, signed } from './fakes/career-work';
import { commissionOn } from '@/engine/systems/propay';

/** TEST SETUP: an offer for a part, written as casting writes one, for work worked out from `postedAt`, at the rate's scale. */
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

/** Accepted by the Opportunities tab's command, and the engagement it made. */
function accept(sim: Simulation, o: Opportunity): Engagement {
  sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
  return sim.player.pro!.engagements.find((e) => e.opportunityId === o.id)!;
}

/** TEST SETUP: a member of SAG-AFTRA already, so the union's thirty days don't refuse the work a test books. */
function member(sim: Simulation): void {
  ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
}

/**
 * The part prepared by its own steps, each pressed until it can do no more, the time between tended; where the player is
 * busy or asleep, the clock on two hours and tried again, as a player waits for a free hour.
 */
function prepared(sim: Simulation, e: Engagement, steps: readonly string[] = ['read', 'lines', 'rehearse', 'special']): void {
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

/** A choice made through the Work tab's command. */
const choose = (sim: Simulation, e: Engagement, decision: string, option: string) => sim.must({ kind: 'pro.work_choice', payload: { engagementId: e.id, decision, option } });

/** A booked part, by its project, and the clock on to its last day's end. */
function worked(sim: Simulation, e: Engagement): Engagement {
  played(sim, e.days.at(-1)!.to + MS_HOUR);
  return sim.player.pro!.engagements.find((x) => x.id === e.id)!;
}

const engagementIn = (sim: Simulation, id: string): Engagement => sim.player.pro!.engagements.find((x) => x.id === id)!;

describe('W1: each workflow and format is data, every project names one, and none is a label over another', () => {
  it('WF-22: holds no script: every unit of work is named by its kind and its number, every project is invented or a part the game imagines in a real production, and no line of any script is in the game', () => {
    const units = Object.values(WORKFLOWS).flatMap((w) => Object.values(w.judged).map((j) => j!.unit.one));
    expect([...new Set(units)].sort()).toEqual(['chapter', 'loop', 'night', 'scene', 'sequence']);
    for (const t of PROJECTS) expect(t.fictional || t.drawn !== undefined, t.id).toBe(true);
    for (const t of PROJECTS.filter((x) => !x.fictional)) expect(t.drawn!.season, t.id).toMatch(/the game imagines/);
    // A unit carries its number, its place and its day; nothing of it is a line to say.
    const sim = graduate('workflows-no-script');
    member(sim);
    const e = accept(sim, offerFor(sim, 'gull-season', at(2026, 9, 7)));
    for (const u of e.units!) expect(Object.keys(u).sort()).toEqual(expect.arrayContaining(['day', 'id', 'order', 'scene', 'version']));
    for (const u of e.units!) expect(Object.values(u).every((v) => typeof v !== 'string' || /^u\d+$/.test(v))).toBe(true);
  });

  it('WF-21: no two workflows share every part of a day, the preparation, the choices and what the work leaves, and no two formats share every term', () => {
    const flows = Object.values(WORKFLOWS);
    const shape = (w: (typeof flows)[number]) => JSON.stringify([
      Object.entries(w.judged).map(([k, j]) => [k, j!.task, j!.unit.one, j!.perDay, j!.takes, j!.strain ?? 0]).sort(),
      Object.keys(w.builds ?? {}).sort(), w.prep.steps, w.prep.special?.label ?? '', w.decisions.map((d) => d.id).sort(), w.leaves.reel,
    ]);
    const shapes = flows.map(shape);
    expect(new Set(shapes).size).toBe(flows.length);
    const formats = Object.values(FORMATS);
    const terms = (f: (typeof formats)[number]) => JSON.stringify([f.workflow, f.takes ?? null, f.revisions, f.board, f.scenesPerDay ?? 0, f.after, f.returns ?? false, f.daysOnly ?? false, f.looping ?? 0, (f.decisions ?? []).map((d) => d.id)]);
    expect(new Set(formats.map(terms)).size).toBe(formats.length);
    // Every format and so every workflow has a project to enter it by, and every project names a format that exists.
    for (const t of PROJECTS) expect(FORMATS[t.format], t.id).toBeDefined();
    const used = new Set(PROJECTS.map((t) => t.format));
    for (const f of Object.keys(FORMATS) as FormatId[]) expect(used.has(f), f).toBe(true);
    for (const w of Object.keys(WORKFLOWS) as WorkflowId[]) expect(PROJECTS.some((t) => formatOf(t).workflow === w), w).toBe(true);
    // Each judged step is judged as its own task profile, and the voice's work alone reads the voice.
    for (const w of flows) for (const j of Object.values(w.judged)) expect(TASK_PROFILES[j!.task], `${w.id} ${j!.task}`).toBeDefined();
    const readsVoice = Object.values(TASK_PROFILES).filter((p) => Object.values(p.dims).some((d) => d!.conditions?.includes('voice'))).map((p) => p.id).sort();
    expect(readsVoice).toEqual(['booth', 'dub', 'musicalNight', 'narration']);
  });
});

describe('W2: single camera, its scenes out of order, in takes, with revised pages', () => {
  it('WF-01, WF-25: shoots an independent feature’s scenes out of the script’s order, a scene shot before what leads into it asking more of the breakdown, and reports each day', () => {
    const sim = graduate('workflows-feature');
    member(sim);
    const e = accept(sim, offerFor(sim, 'gull-season', at(2026, 9, 7)));
    expect(e.units!.length).toBe(e.days.length * 3);
    // The story's order is the scenes' numbers; the days don't keep it.
    const shot = [...e.units!].sort((a, b) => a.day - b.day || a.order - b.order).map((u) => u.scene);
    expect(shot).not.toEqual([...shot].sort((a, b) => a - b));
    const ahead = e.units!.find((u) => shotAhead(e, u))!;
    const inOrder = e.units!.find((u) => !shotAhead(e, u))!;
    const task = TASK_PROFILES.camera!;
    const need = (u: typeof ahead) => unitContext(sim, sim.player, e, projectById('gull-season')!, u, 1, task, {}, 0).required.interpretation!;
    expect(need(ahead)).toBeCloseTo(Math.min(1, need(inOrder) * AHEAD), 5);
    // A quarter more of the breakdown, the game's figure, and so more than in order.
    expect([AHEAD, need(ahead) > need(inOrder)]).toEqual([1.25, true]);
    prepared(sim, e);
    const done = worked(sim, e);
    expect(done.status).toBe('finished');
    expect(done.reports!.map((r) => r.day)).toEqual(done.days.map((_, i) => i));
    // Each day kept as one piece of work replays from what it keeps, its three scenes' best takes and their mean, and so
    // after a save and a load (brief 27's F: until then a day kept one scene's inputs beside the mean, and didn't).
    const days = (s: Simulation) => s.player.work!.filter((w) => w.inputs.key.startsWith(`pro:${s.player.id}:${e.id}:`));
    expect(days(sim)).toHaveLength(done.days.length);
    for (const w of [...days(sim), ...days(reload(sim))]) {
      expect(w.inputs.parts).toHaveLength(3);
      expect(replay(w, TASK_PROFILES[w.task]!)!.overall).toBe(w.overall);
    }
    for (const r of done.reports!) {
      expect(r.units).toHaveLength(3);
      expect(r.band).toBeDefined();
      const words = reportWords(done, projectById('gull-season')!, r);
      expect(words).toMatch(/^(The pages were revised .* )?Shot in this order: Scene \d+, Scene \d+ and Scene \d+, (in|out of) the script’s order\./);
      expect(words).toContain('two takes');
    }
    // Kept with the save.
    expect(engagementIn(reload(sim), e.id).reports).toEqual(done.reports);
  });

  it('WF-02, WF-19, WF-23: Ask For Another Take adds a take to a scene not yet strong, as many a day as the format allows, an independent feature one and a studio’s three, and costs energy', () => {
    const sim = graduate('workflows-takes');
    member(sim);
    const e = accept(sim, offerFor(sim, 'gull-season', at(2026, 9, 7)));
    // Unprepared, so no scene's best is strong and the extra takes are asked for.
    played(sim, e.days[0]!.from - MS_HOUR);
    const asked = reload(sim);
    choose(asked, engagementIn(asked, e.id), 'takes', 'ask');
    for (const s of [sim, asked]) played(s, e.days[0]!.to + MS_HOUR);
    const plain = engagementIn(sim, e.id).units!.filter((u) => u.day === 0);
    const more = engagementIn(asked, e.id).units!.filter((u) => u.day === 0);
    expect(plain.map((u) => u.takes!.length)).toEqual([2, 2, 2]);
    // One more in the day, on the first scene not yet strong (FORMATS['independent-feature'].takes.extra).
    expect(more.reduce((n, u) => n + u.takes!.length, 0)).toBe(6 + FORMATS['independent-feature'].takes!.extra);
    expect(more.reduce((n, u) => n + (u.extra ?? 0), 0)).toBe(1);
    // The take asked for is the same take the plain twin never shot: its first takes match, and the best is no worse.
    expect(more.map((u) => u.takes!.slice(0, 2))).toEqual(plain.map((u) => u.takes));
    for (const [k, u] of more.entries()) expect(u.best!).toBeGreaterThanOrEqual(plain[k]!.best!);
    expect(engagementIn(asked, e.id).reports![0]!.energy!.after).toBeLessThan(engagementIn(sim, e.id).reports![0]!.energy!.after);
    // A studio feature allows three a day, a short none (FORMATS).
    expect([FORMATS['studio-feature'].takes, FORMATS['independent-feature'].takes, FORMATS.short.takes]).toEqual([{ base: 3, extra: 3 }, { base: 2, extra: 1 }, { base: 2, extra: 0 }]);
    // A choice the work doesn't offer is refused, with why.
    expect(choiceRefusal(e, projectById('gull-season')!, 'stunts', 'yourself')).toBe('Gull Season doesn’t ask that of you.');
  });

  it('WF-24: revised pages the night before take a share of the lines learned and raise the script’s version, said on the Work tab and in a notice, and Learn The Lines that evening puts them back', () => {
    // The seed's premise: Northern Line's pages are revised before one of its days (`pagesDrawn`, by the work).
    const sim = graduate('workflows-pages');
    member(sim);
    const e = accept(sim, offerFor(sim, 'northern-line', at(2026, 9, 7)));
    prepared(sim, e, ['read', 'lines', 'rehearse']);
    const learned = e.prep!.memorization;
    played(sim, e.days.at(-1)!.from - 2 * MS_HOUR);
    const revised = e.script!.revised;
    expect(revised.length).toBeGreaterThan(0);
    const first = revised[0]!;
    expect(first.share).toBeGreaterThanOrEqual(0.1);
    expect(e.script!.version).toBe(1 + revised.length);
    expect(notices(sim).some((n) => n.startsWith('Revised Pages For Northern Line | Revised pages for '))).toBe(true);
    // What the revisions took, once each: the lines learned less each one's share, nothing on a shoot day learning them again.
    expect(e.history.filter((h) => h.key === `pages:${first.day}`)).toHaveLength(1);
    expect(learned).toBeGreaterThan(0.5);
    const left = revised.reduce((m, r) => Math.round(m * (1 - r.share) * 1000) / 1000, learned);
    expect(e.prep!.memorization).toBeCloseTo(left, 2);
    // Learn The Lines that evening puts some back.
    const before = e.prep!.memorization;
    for (let n = 0; n < 8 && !sim.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step: 'lines' } }).ok; n += 1) played(sim, sim.now + MS_HOUR);
    expect(e.prep!.memorization).toBeGreaterThan(before);
    // Cross-boarded across Episodes 3 and 4: a day's scenes come from both.
    expect(new Set(e.units!.map((u) => u.episode))).toEqual(new Set([3, 4]));
  });
});

describe('W2: the screen formats, each shot its own way', () => {
  it('WF-03, WF-04, WF-05, WF-08, WF-09, WF-20: a procedural’s scenes kept to each episode’s days; a serialized drama’s two episodes mixed in a day; a comedy’s alternate lines; a television movie’s four scenes a day in two takes; a student film’s four takes and its pay deferred', () => {
    const sim = graduate('workflows-formats');
    member(sim);
    // A recurring procedural part: each episode's scenes on its own days, its scene numbers a block of the script's that
    // no other episode's days shoot, and out of order within it.
    const proc = accept(sim, offerFor(sim, 'calloway-files-whitlock', at(2026, 9, 7)));
    const episodes = [...new Set(proc.units!.map((u) => u.episode))].sort((a, b) => a! - b!);
    expect(episodes.length).toBeGreaterThan(1);
    for (const u of proc.units!) expect(u.episode).toBe(Number(/Episode (\d+),/.exec(proc.days[u.day]!.label)![1]));
    const scenesOf = (ep: number | undefined) => proc.units!.filter((u) => u.episode === ep).map((u) => u.scene);
    for (let k = 1; k < episodes.length; k += 1) expect(Math.max(...scenesOf(episodes[k - 1]))).toBeLessThan(Math.min(...scenesOf(episodes[k])));
    // A serialized drama shoots its two episodes as one block: a day holds scenes of both.
    const drama = accept(sim, offerFor(sim, 'northern-line', at(2026, 10, 26)));
    expect([...new Set(drama.units!.map((u) => u.episode))].sort()).toEqual([3, 4]);
    expect(drama.days.some((_, i) => new Set(drama.units!.filter((u) => u.day === i).map((u) => u.episode)).size === 2)).toBe(true);
    // The comedies offer an alternate line in the later takes; a procedural and a drama don't.
    const offers = (id: string) => decisionsFor(projectById(id)!).map((d) => d.id);
    expect([offers('second-shift'), offers('abbott-guest'), offers('calloway-files'), offers('northern-line')].map((ds) => ds.includes('alts'))).toEqual([true, true, false, false]);
    // A television movie: four scenes a day, two takes each, no more asked.
    const movie = worked(sim, accept(sim, offerFor(sim, 'pell-street', at(2027, 1, 4))));
    for (const i of movie.days.keys()) expect(movie.units!.filter((u) => u.day === i).map((u) => u.takes!.length)).toEqual([2, 2, 2, 2]);
    // A student film: more takes than any paid set spares, and its pay deferred, said in the contract.
    // Posted the first Monday from March whose days are clear of the work booked already: from 2026-10-25 (brief 27's K5)
    // the television movie's recall to loop holds its day, and the student film posted on March 1 fell on it.
    let posted = at(2027, 3, 1);
    while (bookedClash(sim.player, datesOf({ projectId: 'paper-moons', postedAt: posted }))) posted += 7 * MS_DAY;
    const student = worked(sim, accept(sim, offerFor(sim, 'paper-moons', posted)));
    expect(new Set(student.units!.map((u) => u.takes!.length))).toEqual(new Set([FORMATS['student-film'].takes!.base]));
    expect(FORMATS['student-film'].takes!.base).toBeGreaterThan(Math.max(...Object.values(FORMATS).filter((f) => f.id !== 'student-film').map((f) => f.takes?.base ?? 0)));
    expect(student.contract!.clauses.map((c) => c.kind)).toContain('deferred');
    expect(student.pay.every((p) => p.deferred)).toBe(true);
  });
});

describe('W3: a multicamera comedy’s week before a studio audience', () => {
  it('WF-10: a table read, three days of rehearsal and camera blocking and a tape night, every day paid from the first rehearsal; the tape night in the story’s order, a scene that plays badly picked up without its laughs; the studio audience a choice', () => {
    const sim = graduate('workflows-multicam');
    member(sim);
    const t = projectById('half-past-normal')!;
    const e = accept(sim, offerFor(sim, t.id, at(2026, 9, 7)));
    expect(e.days.map((d) => d.label.replace(/^[^:]*: /, ''))).toEqual(['Table Read', 'Rehearsal And Camera Blocking', 'Rehearsal And Camera Blocking', 'Rehearsal And Camera Blocking', 'Tape Night']);
    expect(e.days.map((_, i) => stepOf(t, i))).toEqual(['table-read', 'blocking', 'blocking', 'blocking', 'tape-night']);
    // Five days paid at the day rate (N13 Schedule A §21.E), none of them long enough for overtime.
    expect(e.pay.reduce((n, p) => n + p.promised, 0)).toBe(5 * e.contract!.rate!);
    expect(clauseOf(e.contract, 'overtime')).toBeUndefined();
    expect(e.contract!.clauses.some((x) => x.kind === 'rule' && x.id === 'rehearsal-paid')).toBe(true);
    // The week builds the part: nothing prepared before it, the table read and blocking bring it on.
    played(sim, e.days[4]!.from - 2 * MS_HOUR);
    expect(e.reports!.map((r) => r.step)).toEqual(['table-read', 'blocking', 'blocking', 'blocking']);
    expect(e.prep!.interpretation).toBeGreaterThan(0.3);
    expect(e.prep!.rehearsal).toBeGreaterThan(0.6);
    const cameras = reload(sim);
    choose(cameras, engagementIn(cameras, e.id), 'audience', 'cameras');
    for (const s of [sim, cameras]) played(s, e.days[4]!.to + MS_HOUR);
    const night = engagementIn(sim, e.id);
    const tape = night.units!.filter((u) => u.day === 4);
    // In the story's order, each scene one take before the audience, and a pickup after it where it played under Working.
    expect(tape.map((u) => u.scene)).toEqual([...tape.map((u) => u.scene)].sort((a, b) => a - b));
    // And on every week's, whatever the draw: six more weeks' tape nights planned in a second life, each in the story's order.
    const weeks = graduate('workflows-multicam-weeks');
    member(weeks);
    for (let w = 1; w <= 6; w += 1) {
      const other = accept(weeks, offerFor(weeks, t.id, at(2026, 9, 7) + w * 7 * MS_DAY));
      const scenes = other.units!.filter((u) => stepOf(t, u.day) === 'tape-night').sort((a, b) => a.order - b.order).map((u) => u.scene);
      expect(scenes, `week ${w}`).toEqual([...scenes].sort((a, b) => a - b));
    }
    for (const u of tape) {
      if (u.takes![0]! < 50) expect([u.pickup, u.takes!.length]).toEqual([true, 2]);
      else expect([u.pickup, u.takes!.length]).toEqual([undefined, 1]);
    }
    // Played to the cameras, the same scenes come out otherwise.
    expect(engagementIn(cameras, e.id).reports![4]!.overall).not.toBe(night.reports![4]!.overall);
    expect(night.status).toBe('finished');
  });
});

describe('W4: voice in the booth', () => {
  it('WF-12, WF-26: an animated series’ sessions: no lines to learn by heart, Find The Voice its own preparation, the voice strained by each session and eased by rest, and a strained voice heard in the work; no reel', () => {
    const sim = graduate('workflows-voice');
    member(sim);
    const t = projectById('lantern-row')!;
    const e = accept(sim, offerFor(sim, t.id, at(2026, 9, 7)));
    expect(e.days.map((d) => (d.to - d.from) / MS_HOUR)).toEqual([4, 4, 4]);
    expect(sim.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step: 'lines' } }).error).toBe('There are no lines to learn by heart: the script is on the stand in the booth.');
    prepared(sim, e, ['read', 'rehearse', 'special']);
    expect(e.prep!.special!).toBeGreaterThan(0.5);
    played(sim, e.days[0]!.to + 10 * 60_000);
    const first = e.reports![0]!;
    const stressful = e.units!.filter((u) => u.day === 0 && u.stressful && u.by !== 'refused').length;
    // Six points an hour of the session's four, and fifteen for each scene of screamed lines (`VOICE`).
    expect(first.strain!.after - first.strain!.before).toBeCloseTo(6 * 4 + stressful * VOICE.stressfulExtra, 1);
    // Rest eases it, two points an hour.
    const after = first.strain!.after;
    expect(strainOf(sim.player, e.days[0]!.to + 5 * MS_HOUR)).toBeCloseTo(Math.max(0, after - 2 * 5), 1);
    // A strained voice heard in the next session: the twin's voice strained to 90 just before it (TEST SETUP).
    played(sim, e.days[1]!.from - 10 * 60_000);
    const hoarse = reload(sim);
    hoarse.player.health!.voice = { strain: 90, at: hoarse.now };
    for (const s of [sim, hoarse]) played(s, e.days[1]!.to + 10 * 60_000);
    expect(engagementIn(hoarse, e.id).reports![1]!.overall!).toBeLessThan(engagementIn(sim, e.id).reports![1]!.overall!);
    // Its credit is a voice part's, which a reel can't use once it's out.
    played(sim, e.days.at(-1)!.to + MS_HOUR);
    const credit = sim.player.pro!.credits.find((c) => c.engagementId === e.id)!;
    expect(credit.voice).toBe(true);
    credit.status = 'released';
    credit.releasedAt = sim.now;
    const source = reelSources(sim.player, sim.now).find((x) => x.ref === `footage:${credit.id}`)!;
    expect([source.usable, source.why]).toEqual([false, 'It’s your voice with no picture of you, so it can’t go on a reel. It can go on a voice demo.']);
    // From 2026-10-24 (brief 27) it can go on a voice demo.
    expect(demoSources(sim.player, sim.now).some((x) => x.ref === `footage:${credit.id}`)).toBe(true);
  });

  it('WF-11: an animated feature’s sessions months apart, each paid as a day and the days between not, as the agreement leaves voice-over out of consecutive employment', () => {
    const sim = graduate('workflows-feature-voice');
    member(sim);
    const e = accept(sim, offerFor(sim, 'kite-and-crow', at(2026, 9, 7)));
    expect(e.days).toHaveLength(4);
    for (let k = 1; k < 4; k += 1) expect(Math.round((e.days[k]!.from - e.days[k - 1]!.from) / MS_DAY)).toBeGreaterThanOrEqual(35);
    expect(e.pay.reduce((n, p) => n + p.promised, 0)).toBe(4 * e.contract!.rate!);
    expect(e.contract!.clauses.find((x) => x.kind === 'rule' && x.id === 'days-only')).toMatchObject({ words: 'Each session is paid as a day, and the days between aren’t: voice work on an animated feature is outside the rule that pays the days between, as the agreement sets.' });
  });

  it('WF-26: a session’s screamed lines, announced beforehand or sprung on it; sprung ones refused where the player chose to, the voice spared them', () => {
    // The premise: a posting whose session holds screamed lines sprung on it (`stressDrawn`, by the work).
    const sim = graduate('workflows-screams');
    member(sim);
    let posted = at(2026, 9, 7);
    for (let w = 0; w < 60; w += 1, posted += 7 * MS_DAY) {
      const days = datesOf({ projectId: 'lantern-row', postedAt: posted });
      const e = { projectId: 'lantern-row', days } as unknown as Engagement;
      if ([0, 1, 2].some((i) => { const x = sim.rng('pro.stress', workKey(e), i); return x.next() < 0.35 && (x.next(), x.next() >= 0.75); })) break;
    }
    const e = accept(sim, offerFor(sim, 'lantern-row', posted));
    const sprung = e.units!.find((u) => u.stressful === 'unannounced')!;
    expect(sprung).toBeDefined();
    played(sim, e.days[sprung.day]!.from - MS_HOUR);
    const refusing = reload(sim);
    choose(refusing, engagementIn(refusing, e.id), 'stressful', 'refuse');
    for (const s of [sim, refusing]) played(s, e.days[sprung.day]!.to + 5 * 60_000);
    const done = engagementIn(sim, e.id).units!.find((u) => u.id === sprung.id)!;
    const refused = engagementIn(refusing, e.id).units!.find((u) => u.id === sprung.id)!;
    expect([done.takes!.length > 0, refused.by, refused.takes]).toEqual([true, 'refused', undefined]);
    const strained = (s: Simulation) => { const r = engagementIn(s, e.id).reports!.find((x) => x.day === sprung.day)!; return r.strain!.after - r.strain!.before; };
    expect(strained(sim) - strained(refusing)).toBeCloseTo(VOICE.stressfulExtra, 1);
    expect(reportWords(engagementIn(refusing, e.id), projectById('lantern-row')!, engagementIn(refusing, e.id).reports!.find((x) => x.day === sprung.day)!)).toContain('its screamed lines weren’t announced before the session, and you refused them');
  });
});

describe('W5: dubbing', () => {
  it('WF-13: a dub day’s pay by its characters and lines, as the agreement sets; judged on timing; Match The Original or Make It Your Own', () => {
    // N13 Schedule A §37: one character, any lines, a day; up to three of five lines or fewer each, a day; a day more for
    // each part over five and each further set of three.
    expect([dubDaysOf([{ lines: 60 }]), dubDaysOf([{ lines: 45 }, { lines: 4 }, { lines: 3 }, { lines: 2 }]), dubDaysOf([{ lines: 3 }, { lines: 4 }]), dubDaysOf([{ lines: 45 }, { lines: 4 }, { lines: 3 }, { lines: 2 }, { lines: 1 }]), dubDaysOf([{ lines: 10 }, { lines: 10 }])]).toEqual([1, 2, 1, 3, 3]);
    const sim = graduate('workflows-dub');
    member(sim);
    const t = projectById('salt-road')!;
    const e = accept(sim, offerFor(sim, t.id, at(2026, 9, 7)));
    expect(e.pay.reduce((n, p) => n + p.promised, 0)).toBe((1 + 2 + 1) * e.contract!.rate!);
    expect(clauseOf(e.contract, 'overtime')).toBeUndefined();
    expect(e.contract!.clauses.find((x) => x.kind === 'rule' && x.id === 'dubbing')!.kind).toBe('rule');
    // The second session's other characters are units of their own.
    expect(e.units!.filter((u) => u.day === 1 && u.character).map((u) => u.character)).toEqual(['a ferry captain', 'a radio announcer', 'a fisherman']);
    prepared(sim, e, ['read', 'special']);
    played(sim, e.days[0]!.from - MS_HOUR);
    const own = reload(sim);
    choose(own, engagementIn(own, e.id), 'sync', 'own');
    for (const s of [sim, own]) played(s, e.days[0]!.to + 5 * 60_000);
    expect(engagementIn(own, e.id).reports![0]!.overall).not.toBe(engagementIn(sim, e.id).reports![0]!.overall);
  });
});

describe('W6: performance capture', () => {
  it('WF-14: days called in apart, each paid and the days between not, an hour of overtime on a ten-hour day, other characters at no more pay; Watch The Playback a take fewer', () => {
    const sim = graduate('workflows-capture');
    member(sim);
    const t = projectById('iron-meridian')!;
    const e = accept(sim, offerFor(sim, t.id, at(2026, 9, 7)));
    const rate = e.contract!.rate!;
    expect(e.days.map((d) => (d.to - d.from) / MS_HOUR)).toEqual([10, 10, 10, 10]);
    expect(e.pay.reduce((n, p) => n + p.promised, 0)).toBe(4 * (rate + overtimeOf(rate, 1)));
    expect(clauseOf(e.contract, 'overtime')).toMatchObject({ hours: 1, perDay: overtimeOf(rate, 1) });
    expect(e.units!.filter((u) => u.character).map((u) => [u.day, u.character])).toEqual([[1, 'a creature in the crowd'], [3, 'a falling statue'], [3, 'a second sentinel']]);
    prepared(sim, e);
    played(sim, e.days[0]!.from - MS_HOUR);
    const watching = reload(sim);
    choose(watching, engagementIn(watching, e.id), 'playback', 'playback');
    for (const s of [sim, watching]) played(s, e.days[0]!.to + 5 * 60_000);
    expect(engagementIn(sim, e.id).units!.filter((u) => u.day === 0).map((u) => u.takes!.length)).toEqual([3, 3, 3]);
    expect(engagementIn(watching, e.id).units!.filter((u) => u.day === 0).map((u) => u.takes!.length)).toEqual([2, 2, 2]);
  });
});

describe('W7: documentary narration and reenactment', () => {
  it('WF-15: a narration’s chapters, Check The Pronunciations its preparation, Rest Your Voice Each Hour halving the strain for energy', () => {
    const sim = graduate('workflows-narration');
    member(sim);
    const e = accept(sim, offerFor(sim, 'tidewater-narrator', at(2026, 9, 7)));
    expect(sim.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step: 'rehearse' } }).error).toBe('This work doesn’t ask for that step.');
    prepared(sim, e, ['read', 'special']);
    played(sim, e.days[0]!.from - MS_HOUR);
    const resting = reload(sim);
    choose(resting, engagementIn(resting, e.id), 'pace', 'breaks');
    for (const s of [sim, resting]) played(s, e.days[0]!.to + 5 * 60_000);
    const r = (s: Simulation) => engagementIn(s, e.id).reports![0]!;
    expect(r(resting).strain!.after - r(resting).strain!.before).toBeCloseTo((r(sim).strain!.after - r(sim).strain!.before) / 2, 1);
    expect(r(resting).energy!.after).toBeLessThan(r(sim).energy!.after);
    expect(engagementIn(sim, e.id).units!.filter((u) => u.day === 0).every((u) => (u.takes![0]! < 50) === (u.pickup === true))).toBe(true);
  });

  it('WF-16: a reenactment with no lines to learn, Study The Period’s Movement its preparation, the historian’s notes followed closely or freely', () => {
    const sim = graduate('workflows-reenactment');
    const e = accept(sim, offerFor(sim, 'tidewater-reenactment', at(2026, 9, 7)));
    expect(sim.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step: 'lines' } }).error).toBe('This part has no lines to learn.');
    prepared(sim, e, ['read', 'rehearse', 'special']);
    expect(e.prep!.special!).toBeGreaterThan(0.5);
    played(sim, e.days[0]!.from - MS_HOUR);
    const free = reload(sim);
    choose(free, engagementIn(free, e.id), 'period', 'free');
    const close = reload(sim);
    choose(close, engagementIn(close, e.id), 'period', 'historian');
    for (const s of [sim, free, close]) played(s, e.days[0]!.to + 5 * 60_000);
    const overall = (s: Simulation) => engagementIn(s, e.id).reports![0]!.overall;
    // Each way of using the notes comes out otherwise: the period's exactness or the player's own choices count for more.
    expect(new Set([overall(sim), overall(free), overall(close)]).size).toBe(3);
  });
});

describe('W8: a musical', () => {
  it('WF-17: music rehearsals and choreography build the songs and the steps; Mark It learns more slowly and spares the voice; each night reads the voice', () => {
    const sim = graduate('workflows-musical');
    const t = projectById('lamplighters')!;
    const e = accept(sim, offerFor(sim, t.id, at(2026, 9, 7)));
    expect(e.days.slice(0, 5).map((d) => d.label.replace(/^[^:]*: /, ''))).toEqual(['Music Rehearsal', 'Music Rehearsal', 'Choreography', 'Music Rehearsal', 'Choreography']);
    played(sim, e.days[0]!.from - MS_HOUR);
    const marking = reload(sim);
    choose(marking, engagementIn(marking, e.id), 'marking', 'mark');
    for (const s of [sim, marking]) played(s, e.days[4]!.to + MS_HOUR);
    const full = engagementIn(sim, e.id);
    const marked = engagementIn(marking, e.id);
    expect(marked.prep!.memorization).toBeLessThan(full.prep!.memorization);
    expect(marked.prep!.special!).toBeLessThan(full.prep!.special!);
    // A music rehearsal's strain, marked, a third of full voice's.
    const sung = (x: Engagement) => { const r = x.reports!.find((y) => y.day === 3)!; return r.strain!.after - r.strain!.before; };
    expect(sung(full)).toBeGreaterThan(0);
    expect(sung(marked)).toBeCloseTo(sung(full) * 0.33, 1);
    // The nights: each one strains the voice, and the first makes the stage credit.
    played(sim, e.days[15]!.to + 30 * 60_000);
    const opening = engagementIn(sim, e.id).reports!.find((r) => r.day === 15)!;
    expect(opening.step).toBe('performance');
    expect(opening.strain!.after).toBeGreaterThan(opening.strain!.before);
    expect(sim.player.pro!.credits.find((c) => c.engagementId === e.id)).toMatchObject({ kind: 'stage', status: 'performed' });
  });
});

describe('W9: action, with the stunt coordinator', () => {
  it('WF-18, WF-27: fight rehearsal only with the coordinator, on its days; a stunt done by the double or by the player who consents, the shot less their own with the double, the risk theirs without', () => {
    const sim = graduate('workflows-action');
    member(sim);
    const t = projectById('breakwater')!;
    const e = accept(sim, offerFor(sim, t.id, at(2026, 9, 7)));
    expect(e.days.map((_, i) => stepOf(t, i))).toEqual(['stunt-rehearsal', 'stunt-rehearsal', 'shoot', 'stunt-day', 'shoot', 'stunt-day', 'shoot', 'shoot']);
    expect(sim.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step: 'special' } }).error).toBe('Fight Rehearsal happens only on the work’s own rehearsal days, with the stunt coordinator, never alone.');
    expect(e.contract!.clauses.some((x) => x.kind === 'rule' && x.id === 'stunts')).toBe(true);
    prepared(sim, e, ['read', 'lines', 'rehearse']);
    played(sim, e.days[2]!.from - MS_HOUR);
    expect(e.prep!.special!).toBeGreaterThan(0.5);
    const self = reload(sim);
    choose(self, engagementIn(self, e.id), 'stunts', 'yourself');
    for (const s of [sim, self]) played(s, e.days[3]!.to + 5 * 60_000);
    const doubled = engagementIn(sim, e.id).units!.find((u) => u.day === 3 && u.stunt)!;
    const own = engagementIn(self, e.id).units!.find((u) => u.day === 3 && u.stunt)!;
    // The same takes; the double's printed at the insert's share of the player's own.
    expect(doubled.takes).toEqual(own.takes);
    expect([doubled.by, own.by]).toEqual(['double', 'you']);
    expect(doubled.best!).toBeCloseTo(Math.round(Math.max(...own.takes!) * STUNT.insert * 10) / 10, 1);
    // The doubled day replays from what it keeps, the double's part at the insert's share (brief 27's F).
    const day3 = sim.player.work!.find((w) => w.inputs.key === `pro:${sim.player.id}:${e.id}:3`)!;
    expect(day3.inputs.parts!.some((p) => p.f === STUNT.insert)).toBe(true);
    expect(replay(day3, TASK_PROFILES[day3.task]!)!.overall).toBe(day3.overall);
    // The risk: less with the fight rehearsed and a strong body (the game's figures).
    expect(stuntChance(0, 0)).toBeCloseTo(STUNT.cold, 5);
    expect(stuntChance(1, 0)).toBeCloseTo(STUNT.rehearsed, 5);
    expect(stuntChance(1, 100)).toBeCloseTo(STUNT.rehearsed * (1 - STUNT.physicalShare), 5);
    expect(stuntChance(0.25, 50)).toBeLessThan(stuntChance(0.1, 50));
  });
});

describe('W10: agreed boundaries', () => {
  it('WF-27: an intimate scene said before the audition and in the offer; without consent a body double does it and it isn’t judged as the player’s; consent given, it’s shot on a closed set; once shot, consent can’t be withdrawn; declining costs nothing', () => {
    const t = projectById('northern-line')!;
    expect(termsWords(t, 1_283_00)).toContain('The part has a love scene below decks in Episode 4, with kissing, simulated sex and nudity from behind, shot on a closed set with an intimacy coordinator and only with your written consent. A body double can do it instead, and declining it costs you nothing in the casting.');
    // Casting's draw reads the band, the fit and the field, never the scene: the same for every player.
    const sim = graduate('workflows-intimacy');
    member(sim);
    const posted = at(2026, 9, 7);
    expect(castingDraw(sim, { projectId: t.id, postedAt: posted }, 'final', 'strong', 0.7)).toEqual(castingDraw(reload(sim), { projectId: t.id, postedAt: posted }, 'final', 'strong', 0.7));
    const e = accept(sim, offerFor(sim, t.id, posted));
    const scene = e.units!.find((u) => u.intimate)!;
    expect(scene.day).toBe(t.intimacy!.day);
    prepared(sim, e, ['read', 'lines', 'rehearse']);
    played(sim, e.days[scene.day]!.from - MS_HOUR);
    const consenting = reload(sim);
    choose(consenting, engagementIn(consenting, e.id), 'consent', 'given');
    for (const s of [sim, consenting]) played(s, e.days.at(-1)!.to + MS_HOUR);
    const declined = engagementIn(sim, e.id);
    const given = engagementIn(consenting, e.id);
    expect([declined.units!.find((u) => u.id === scene.id)!.by, declined.units!.find((u) => u.id === scene.id)!.takes]).toEqual(['double', undefined]);
    expect(given.units!.find((u) => u.id === scene.id)!.takes!.length).toBeGreaterThan(0);
    // The part, the pay and the credit the same either way.
    expect([declined.status, declined.pay.map((p) => p.promised)]).toEqual([given.status, given.pay.map((p) => p.promised)]);
    expect(sim.player.pro!.credits.find((c) => c.engagementId === e.id)!.role).toBe(consenting.player.pro!.credits.find((c) => c.engagementId === e.id)!.role);
    expect(choiceRefusal(given, t, 'consent', 'declined')).toBe('That work is over.');
    // Mid-shoot, once the scene is on film: refused, in words.
    const mid = { ...given, status: 'working' as const };
    expect(choiceRefusal(mid, t, 'consent', 'declined')).toBe('The scene is already shot. Consent given for what’s on film can’t be taken back, and nothing is shot of it again.');
  });
});

describe('W11: after the wrap, a recall to loop and a scene cut', () => {
  /** The first posting from a Monday on whose work draws what the premise needs (`loopDrawn`, `cutDrawn`, by the work). */
  function postingWhere(projectId: string, from: number, ok: (key: string) => boolean): number {
    let posted = from;
    for (let w = 0; w < 80; w += 1, posted += 7 * MS_DAY) {
      const days = datesOf({ projectId, postedAt: posted });
      if (ok(workKey({ projectId, days }))) return posted;
    }
    throw new Error('no posting holds the premise');
  }

  it('T47: a recall to loop after a screen wrap, on a weekday clear of the player’s booked work within the agreement’s months, four hours paid half a day; missed, another actor does it and it isn’t paid', () => {
    const sim = graduate('workflows-loop');
    member(sim);
    const posted = postingWhere('calloway-files', at(2026, 9, 7), (k) => loopDrawn(sim, k) !== undefined);
    const e = accept(sim, offerFor(sim, 'calloway-files', posted));
    prepared(sim, e, ['read', 'lines', 'rehearse']);
    const wrap = worked(sim, e);
    expect(wrap.status).toBe('finished');
    expect(wrap.loop!.status).toBe('set');
    const at10 = zonedParts(wrap.loop!.at, zone);
    expect([at10.hour, at10.minute, at10.weekday >= 1 && at10.weekday <= 5]).toEqual([10, 0, true]);
    expect(wrap.loop!.at - wrap.finishedAt!).toBeLessThanOrEqual(4 * 31 * MS_DAY);
    expect(sim.universe.scheduled.some((i) => i.kind === LOOP_KIND && i.status === 'pending' && i.payload.engagementId === e.id)).toBe(true);
    const missing = reload(sim);
    played(sim, wrap.loop!.at + 5 * MS_HOUR);
    const looped = engagementIn(sim, e.id);
    expect(looped.loop!.status).toBe('done');
    expect(looped.loop!.units!.length).toBeGreaterThan(0);
    expect(looped.pay.find((p) => p.key === `${e.id}:loop`)!.promised).toBe(loopPay(looped));
    expect(loopPay(looped)).toBe(Math.round(looped.contract!.rate! / 2));
    // The twin asleep through it (TEST SETUP: the clock on without the player there).
    missing.player.awakeSince = wrap.loop!.at + 2 * MS_HOUR;
    missing.advanceTo(wrap.loop!.at + 5 * MS_HOUR);
    const missed = engagementIn(missing, e.id);
    expect(missed.loop!.status).toBe('missed');
    expect(missed.pay.some((p) => p.key === `${e.id}:loop`)).toBe(false);
  });

  it('T46: a scene of the player’s cut in the edit at the release: the credit, the pay and the history kept, the credit’s band the best of the days on the scenes kept, and the notice says so', () => {
    const sim = graduate('workflows-cut');
    member(sim);
    const posted = postingWhere('calloway-files', at(2026, 9, 7), (k) => cutDrawn(sim, k));
    const e = accept(sim, offerFor(sim, 'calloway-files', posted));
    prepared(sim, e, ['read', 'lines', 'rehearse']);
    const wrap = worked(sim, e);
    const pay = wrap.pay.map((p) => [p.key, p.promised]);
    const history = wrap.history.length;
    tended(sim, wrap.finishedAt! + 125 * MS_DAY);
    const credit = sim.player.pro!.credits.find((c) => c.engagementId === e.id)!;
    const after = engagementIn(sim, e.id);
    expect(credit.status).toBe('released');
    expect(credit.cut).toBe(1);
    const cut = after.units!.find((u) => u.cut)!;
    expect(cut).toBeDefined();
    expect(credit.band).toBe(keptBand(after));
    // Worked out here: the best of the days' means over the scenes kept, the cut one left out.
    const days = [...new Set(after.units!.filter((u) => u.takes?.length).map((u) => u.day))];
    const mean = (d: number) => { const xs = after.units!.filter((u) => u.day === d && u.takes?.length && u !== cut).map((u) => u.best!); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : -1; };
    const best = Math.max(...days.map(mean));
    expect(credit.band).toBe(best >= 80 ? 'exceptional' : best >= 65 ? 'strong' : best >= 50 ? 'working' : 'unready');
    // On this work the cut scene doesn't move the band either way; the rule where it does (TEST SETUP: one day's three
    // printed takes, the weakest cut): 81 over the two kept, Exceptional, where all three's 67.3 would be Strong.
    const day = (id: string, best: number, cut?: true) => ({ id, day: 0, scene: best, order: 1, version: 1, takes: [best], best, ...(cut ? { cut } : {}) });
    expect(keptBand({ units: [day('a', 80), day('b', 82), day('c', 40, true)] } as unknown as Engagement)).toBe('exceptional');
    expect(after.pay.filter((p) => p.key !== `${e.id}:loop`).map((p) => [p.key, p.promised])).toEqual(pay.filter(([k]) => k !== `${e.id}:loop`));
    expect(after.history.length).toBeGreaterThan(history);
    // The release says how the work came out, by its format: a procedural's on the air (RELEASED).
    expect(notices(sim).some((n) => n.startsWith('The Calloway Files Is Released | The Calloway Files is on the air, so Desk Clerk shows as released') && n.includes(`The edit cut one of your scenes, scene ${cut.scene}: the part stays on your credits with the pay, and the reel can use only the scenes kept.`))).toBe(true);
  });
});

describe('W12: the formats apart', () => {
  it('WF-06, WF-07, WF-21: a limited series carries no option; an anthology invites strong work back into its next story without an audition; voice-over is posted for the actor’s own submission and owes no commission', () => {
    const sim = graduate('workflows-formats');
    member(sim);
    skilled(sim);
    const limited = accept(sim, offerFor(sim, 'glass-orchard', at(2026, 9, 7)));
    expect(clauseOf(limited.contract, 'option')).toBeUndefined();
    // No option because it's no series' season; its six months to loop are long-form television's (N13 Schedule A §28.A).
    expect([projectById('glass-orchard')!.series, formatOf(projectById('glass-orchard')!).looping]).toEqual([undefined, 6]);
    const room = accept(sim, offerFor(sim, 'six-rooms', at(2026, 10, 12)));
    // A twin who works it unprepared, its work not strong: no invitation.
    const cold = reload(sim);
    const coldDone = worked(cold, engagementIn(cold, room.id));
    expect(['unready', 'working']).toContain(cold.player.pro!.credits.find((c) => c.engagementId === coldDone.id)!.band);
    expect(cold.universe.scheduled.some((i) => i.kind === INVITE_KIND)).toBe(false);
    prepared(sim, room, ['read', 'lines', 'rehearse']);
    const done = worked(sim, room);
    expect(['strong', 'exceptional']).toContain(sim.player.pro!.credits.find((c) => c.engagementId === room.id)!.band);
    const invite = sim.universe.scheduled.find((i) => i.kind === INVITE_KIND && i.status === 'pending')!;
    expect(invite.payload.projectId).toBe('six-rooms-return');
    tended(sim, invite.at + MS_HOUR);
    const o = sim.player.pro!.opportunities.find((x) => x.projectId === 'six-rooms-return')!;
    expect([o.status, o.rounds ?? []]).toEqual(['offered', []]);
    expect(o.history.some((h) => h.words === `Brass Key Pictures invited you back into Six Rooms’s next story for your work as The Night Auditor, without an audition.`)).toBe(true);
    expect(done.status).toBe('finished');
    // Voice-over: open to the actor's own submission, and outside a legit agent's agreement. From 2026-10-25 (brief 27) an
    // agent whose agreement covers voice-over can put the actor up for it too (tests/b27-representation.test.ts); until then
    // no agent could.
    for (const id of ['lantern-row', 'kite-and-crow', 'salt-road', 'tidewater-narrator']) expect(projectById(id)!.access, id).toEqual({ agent: true, open: 'anyone' });
    const voice = accept(sim, offerFor(sim, 'salt-road', at(2027, 6, 7)));
    expect(voice.contract!.clauses.some((x) => x.kind === 'rule' && x.id === 'voice-over')).toBe(true);
    expect(decisionsFor(projectById('salt-road')!).map((d) => d.id)).toEqual(['sync', 'stressful']);
    // Represented, the agent's agreement still leaves voice-over out: no commission on a dub paid over scale, and the
    // agreement's on a feature paid the same (TEST SETUP: the agreement and both bookings written as the systems write them).
    const a = signed(sim, sim.now);
    const dub = booked(sim, { project: 'salt-road', days: [at(2027, 9, 6)], amount: 3_000_00, per: 'day', via: 'agent', agreementId: a.id });
    expect(commissionOn(sim, sim.player, dub, dub.pay[0]!, 3_000_00)).toMatchObject({ amount: 0, how: 'uncovered' });
    const film = booked(sim, { project: 'gull-season', days: [at(2027, 9, 13)], amount: 3_000_00, per: 'day', via: 'agent', agreementId: a.id });
    expect(commissionOn(sim, sim.player, film, film.pay[0]!, 3_000_00).amount).toBeGreaterThan(0);
  });
});
