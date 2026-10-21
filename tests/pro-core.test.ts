/**
 * The professional record's core (brief 19, `docs/verification/career-2026-10-20/criteria.md` L1 to L3, F1 to F5, G1,
 * T3): the record a new life begins with, an older save's built once on opening and carried on unchanged, the profile
 * read from the record, the portfolio's materials and their commands, what's missing in practical words, the history
 * helper and the bounds.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, born in New York,
 * starting Monday 24 August 2026 at 7:30 AM, played by the clock and the commands a player sends. TEST SETUP, said
 * where it's done: the body kept fed, rested and awake as the clock moves (`tended`); a graduate made through the
 * School's own Commencement handler with the last term put on the clock, as tests/evidence-g21-school.test.ts does
 * (three years can't be played here), then given back the shape a build before 2026-10-20 wrote (no `pro`, no
 * `pro.begun`); a course record, a School credit and a craft level set as a played run would leave them; money taken
 * out to test a refusal.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { COMMENCEMENT_KIND, EVALUATION_KIND, GIVEN_ACTOR, GIVEN_ACTRESS } from '@/engine/systems/school';
import { BRIEFS } from '@/engine/content/briefs';
import { AGENTS, AGENCIES, agencyOf, agentById } from '@/engine/content/agents';
import { AGREEMENT_TERMS, PROJECTS, RATES, minimumOn, type RateId } from '@/engine/content/careerwork';
import {
  ENGAGEMENTS_KEPT, HEADSHOTS, HISTORY_KEPT, MATERIALS_KEPT, OPPORTUNITIES_KEPT, REEL, RESUME, activeAgreement, addCredit, countOf, currentOf,
  headshotRefusal, keepBounded, materialsCheck, noteEvent, proCreditWords, profileOf, reelSources, releaseScreenCredit, resumeBehind, schoolCreditWords,
  type Agreement, type AgentRelation, type Engagement, type Opportunity,
} from '@/engine/systems/pro';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const student = (seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** What the player holds across their own accounts, cards' debts counted against it. */
const balance = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id).reduce((n, a) => n + a.balance, 0);
/** The save as a build before 2026-10-20 wrote it: no professional record, and no `pro.begun` among its openings. */
const older = (sim: Simulation) => {
  const u = deserialise(serialise(sim.universe)) as typeof sim.universe;
  delete u.people[u.playerId]!.pro;
  u.opened = (u.opened ?? []).filter((x) => x !== 'pro.begun');
  return u;
};

/**
 * TEST SETUP: a graduate of the class of 2029, made by the School's own handlers: the last term's state and its
 * evaluation put on the clock, Commencement brought forward to a morning, and the clock run through it, as
 * tests/evidence-g21-school.test.ts makes one; with a School credit (Viola in Twelfth Night) and stage combat at 82 as
 * three years would leave them.
 */
function graduate(seed: string) {
  const sim = student(seed);
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  school.casting = { production: 'Shakespeare Repertory Project I', play: 'Twelfth Night', by: 'William Shakespeare', role: 'Viola', kind: 'shakespeare', term: 5, performed: 4, size: 'lead' };
  sim.player.craft!.combat = 82;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  const day = at(2026, 9, 3, 10);
  sim.schedule({ at: day, kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(2026, 9, 3, 13));
  expect(sim.player.school!.standing).toBe('graduated');
  return { sim, day };
}

/** Everything of the player's a career beginning must leave as it was, for the comparison below. */
const carried = (sim: Simulation) => {
  const p = sim.player;
  return JSON.stringify({
    identity: [p.firstName, p.lastName, p.displayName, p.pronouns, p.performerTitle, p.background, p.homeRegionId, p.citizenshipId, p.personalityTraits, p.personality],
    attrs: p.attrs, craft: p.craft, engagement: p.engagement, school: p.school, briefs: p.briefs, work: p.work, journey: p.journey,
    documents: p.documents, health: p.health, wellbeing: p.wellbeing, earnings: p.earnings,
    accounts: Object.values(sim.universe.accounts).map((a) => [a.id, a.balance]),
    transactions: sim.universe.transactions.length,
    pending: sim.universe.scheduled.filter((i) => i.status === 'pending').map((i) => [i.id, i.kind, i.at]),
  });
};

describe('the record, begun and built', () => {
  it('PLAYER JOURNEY: a new life begins its professional record with the life, at its enrollment, named among the openings it was made under', () => {
    const sim = student('pro-new');
    const pro = sim.player.pro!;
    expect(pro).toEqual({ since: sim.universe.meta.createdAt === undefined ? pro.since : pro.since, credits: [], materials: [], relations: {}, agreements: [], opportunities: [], engagements: [] });
    expect(pro.since).toBe(sim.now);
    expect(sim.player.school!.termsBegun).toBe(0);
    expect(sim.universe.opened).toContain('pro.begun');
    // A reload builds nothing again: the record is the one it began with.
    expect(reload(sim).player.pro).toEqual(pro);
  });

  it('PLAYER JOURNEY: an existing graduate’s save opens with its record built once from what it holds, Equity dated at the degree, and nothing else changed', () => {
    const { sim, day } = graduate('pro-graduate');
    const before = carried(sim);
    const opened = loadSave(older(sim));
    expect(opened.universe.opened).toContain('pro.begun');
    const pro = opened.player.pro!;
    expect(pro.since).toBe(opened.now);
    expect(pro.equity).toEqual({ since: day, how: 'degree' });
    expect(pro.credits).toEqual([]);
    expect(pro.materials).toEqual([]);
    // Its School credit stays in the School's record, and reads as a school credit, never a professional one.
    expect(opened.player.school!.credits).toEqual([{ production: 'Shakespeare Repertory Project I', role: 'Viola', kind: 'shakespeare', year: 2029, wentOn: 4, size: 'lead' }]);
    const profile = profileOf(opened.player, opened.now);
    expect(profile.schoolCredits.map((c) => [c.role, c.production, c.venue, c.year])).toEqual([['Viola', 'Shakespeare Repertory Project I', 'David Geffen School of Drama at Yale University', 2029]]);
    expect(profile.proCredits).toEqual([]);
    expect(profile.training.words).toBe('You completed the MFA in Acting at the David Geffen School of Drama at Yale University in 2026.');
    expect(profile.unions.words).toBe('You joined Actors’ Equity Association with the degree on September 3, 2026.');
    // Nothing the save held moved: identity, abilities, craft, genres, standing, coursework, the parts played, money,
    // documents, health, wellbeing and the calendar.
    expect(carried(opened)).toBe(before);
    // A second opening changes nothing.
    const once = serialise(opened.universe);
    const twice = loadSave(deserialise(once) as never);
    expect(serialise(twice.universe)).toBe(once);
    // And it plays on: ten days of the clock, a résumé made from the record, the books in balance.
    tended(twice, twice.now + 10 * MS_DAY);
    tended(twice, at(2026, 9, 13, 10));
    expect(twice.execute({ kind: 'pro.update_resume', payload: {} }).ok).toBe(true);
    expect(currentOf(twice.player.pro, 'resume')!.contains).toEqual([
      'Ada Cole', 'Actors’ Equity Association', 'Training: MFA in Acting, David Geffen School of Drama at Yale University, 2026',
      'Viola, Shakespeare Repertory Project I, David Geffen School of Drama at Yale University, 2029', 'Special skill: Stage Combat',
    ]);
    expect(breaches(twice.universe, twice.now)).toEqual([]);
  });

  it('PLAYER JOURNEY: a first-year’s older save is built the same way, with no union and its year said truly', () => {
    const sim = student('pro-first-year');
    tended(sim, at(2026, 9, 2, 18));
    const before = carried(sim);
    const opened = loadSave(older(sim));
    expect(opened.player.pro!.equity).toBeUndefined();
    expect(profileOf(opened.player, opened.now).training.words).toBe('You’re an MFA candidate in Acting at the David Geffen School of Drama at Yale University, in year one of three.');
    expect(carried(opened)).toBe(before);
  });

  it('PLAYER JOURNEY: a new life that graduates through Commencement is given Equity at the degree, dated that morning', () => {
    const { sim, day } = graduate('pro-commencement');
    expect(sim.player.pro!.equity).toEqual({ since: day, how: 'degree' });
  });
});

describe('the profile, read from the record', () => {
  it('says each training truly: a candidate, a graduate, one who withdrew after a term, and a life with no school', () => {
    const sim = student('pro-training');
    tended(sim, at(2026, 9, 1, 18));
    expect(profileOf(sim.player, sim.now).training.status).toBe('candidate');
    // Withdrawn by the player's own command, as the School's Standing tab sends it.
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    const t = profileOf(sim.player, sim.now).training;
    expect(t).toEqual({ status: 'left', words: 'You studied acting in the MFA program at the David Geffen School of Drama at Yale University for one term, 2026, and didn’t complete the degree.', short: 'Acting, David Geffen School of Drama at Yale University, 2026 (one term, no degree)' });
    const elsewhere = createSave(1, 'pro-no-school', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', startLocationId: 'us-ny-newyork', school: undefined as never });
    expect(elsewhere.player.school).toBeUndefined();
    expect(profileOf(elsewhere.player, elsewhere.now).training.words).toBe('No drama school training is on your record.');
  });

  it('keeps a practice brief’s self-tape off every list of credits, and offers it as recorded work for a reel', () => {
    const sim = student('pro-tape');
    tended(sim, at(2026, 8, 30, 13));
    const brief = BRIEFS.find((b) => b.medium === 'camera')!;
    sim.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
    sim.must({ kind: 'practice.self_tape', payload: { genre: brief.kinds[0], brief: brief.id } });
    const p = profileOf(sim.player, sim.now);
    expect(p.proCredits).toEqual([]);
    expect(p.schoolCredits).toEqual([]);
    expect(sim.player.pro!.credits).toEqual([]);
    const sources = reelSources(sim.player, sim.now);
    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({ from: 'tape', title: `${brief.title}, A Self-Tape`, usable: true });
  });

  it('reads permission to work from the papers: a US citizen may, an F-1 student may not', () => {
    const us = student('pro-us');
    expect(profileOf(us.player, us.now).eligibility).toEqual({ authorized: true, words: 'You’re a US citizen, so you can work for any employer in the US.' });
    const uk = student('pro-uk', { homeRegionId: 'uk-eng-london' });
    expect(profileOf(uk.player, uk.now).eligibility).toEqual({ authorized: false, words: 'Your F-1 lets you work only on campus while you’re a student, so you can’t work for an employer outside the School.' });
  });

  it('says availability and where they’re based: at the School until the degree, in New Haven, and the days booked for work', () => {
    const sim = student('pro-where');
    const p = profileOf(sim.player, sim.now);
    expect(p.availability.words).toBe('You’re at the School until the degree, expected in May 2029.');
    expect(p.location.city).toBe('New Haven');
    // TEST SETUP: an engagement booked as the work system books one, its two shoot days in June 2027; and one finished.
    const booked: Engagement = { id: 'e1', opportunityId: 'o1', projectId: 'calloway-files', role: 'Desk Clerk', status: 'booked', days: [{ from: at(2027, 6, 14, 7), to: at(2027, 6, 15, 19), label: 'The Calloway Files' }], pay: [], history: [], counts: {} };
    const done: Engagement = { ...booked, id: 'e0', status: 'finished', days: [{ from: at(2027, 6, 1, 7), to: at(2027, 6, 1, 19), label: 'Paper Moons' }] };
    sim.player.pro!.engagements.push(booked, done);
    expect(profileOf(sim.player, sim.now).availability).toMatchObject({ booked: booked.days, words: 'You’re at the School until the degree, expected in May 2029. You’re booked: The Calloway Files, June 14, 2027 to June 15, 2027.' });
    expect(profileOf(sim.player, at(2027, 6, 16)).availability.booked).toEqual([]);
  });
});

describe('the portfolio’s commands', () => {
  it('PLAYER JOURNEY: a headshot session takes its four hours and its $700.00 from the bank, and leaves headshots with their provenance', () => {
    const sim = student('pro-headshots');
    tended(sim, at(2026, 8, 30, 13));
    const before = balance(sim);
    const start = sim.now;
    expect(headshotRefusal(sim, sim.player)).toBeUndefined();
    const r = sim.must<{ cost: number }>({ kind: 'pro.headshots', payload: {} });
    expect(r.cost).toBe(HEADSHOTS.cost);
    expect(sim.now).toBe(start + HEADSHOTS.minutes * 60_000);
    expect(before - balance(sim)).toBe(HEADSHOTS.cost);
    expect(sim.universe.transactions.at(-1)!.memo).toBe('Headshot session');
    const m = currentOf(sim.player.pro, 'headshot')!;
    expect(m).toMatchObject({ kind: 'headshot', made: start, version: 1, cost: HEADSHOTS.cost, source: 'A session with a photographer, $700.00 and four hours, both estimated.' });
    expect(m.contains).toEqual(['Retouched photographs of you as you looked on August 30, 2026, for submissions and your résumé.']);
    expect(materialsCheck(sim.player, 'stage', sim.now).map((x) => x.kind)).toEqual(['resume']);
    // Two years and a day on, they read as out of date: still headshots, no longer blocking.
    const later = start + (HEADSHOTS.staleDays + 1) * MS_DAY;
    expect(materialsCheck(sim.player, 'stage', later).find((x) => x.kind === 'headshot')).toEqual({ kind: 'headshot', problem: 'out-of-date', blocking: false, words: 'Your headshots are from August 30, 2026, more than two years ago, so they may not look like you now. A new session gives you current ones.' });
    expect(reload(sim).player.pro!.materials).toEqual(sim.player.pro!.materials);
  });

  it('refuses a session out of a photographer’s hours, while busy, and with the bank short, in words, charging nothing', () => {
    const sim = student('pro-headshots-no');
    // At 7:30 on the first morning, registration is under four hours away.
    expect(sim.execute({ kind: 'pro.headshots', payload: {} }).error).toBe('Registration And Your Account starts at 10:00 AM: there isn’t the time before it.');
    tended(sim, at(2026, 8, 30, 18));
    expect(sim.execute({ kind: 'pro.headshots', payload: {} }).error).toBe('Photographers work by day: a session starts between 9 AM and 4 PM.');
    tended(sim, at(2026, 8, 31, 9));
    // TEST SETUP: Sunday at 1 PM, every account of theirs spent down to a dollar and the card given no room.
    tended(sim, at(2026, 9, 6, 13));
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'credit_card') a.creditLimit = 0;
    for (const a of Object.values(sim.universe.accounts)) {
      if (a.ownerId !== sim.player.id || (a.kind !== 'checking' && a.kind !== 'savings') || a.balance <= 100) continue;
      const out = a.balance - 100;
      sim.post({ memo: 'TEST SETUP: spent', category: 'personal', postings: [{ accountId: a.id, amount: -out }, { accountId: sim.nominalAccount('expense', 'Other').id, amount: out }] });
    }
    const before = sim.universe.transactions.length;
    expect(headshotRefusal(sim, sim.player)).toBe('Your bank can’t cover the $700.00 session.');
    const no = sim.execute({ kind: 'pro.headshots', payload: {} });
    expect(no.error).toBe('Your bank can’t cover $700.00, so nothing was charged.');
    expect(sim.universe.transactions.length).toBe(before);
    expect(sim.player.pro!.materials).toEqual([]);
  });

  it('PLAYER JOURNEY: a résumé made from the record takes an hour, reads behind once a part is played and the name changes, and is refused while up to date', () => {
    const sim = student('pro-resume');
    tended(sim, at(2026, 8, 30, 13));
    const start = sim.now;
    sim.must({ kind: 'pro.update_resume', payload: {} });
    expect(sim.now).toBe(start + RESUME.minutes * 60_000);
    const first = currentOf(sim.player.pro, 'resume')!;
    expect(first.contains).toEqual(['Ada Cole', 'Training: MFA in Acting (candidate, year 1 of 3), David Geffen School of Drama at Yale University']);
    expect(first.source).toBe('Made from your record on August 30, 2026, in an hour at your own desk.');
    expect(sim.execute({ kind: 'pro.update_resume', payload: {} }).error).toBe('Your résumé from August 30, 2026 already has everything on your record.');
    // TEST SETUP: a run closed, filed as the term's casting files it.
    sim.player.school!.credits = [{ production: 'Fall Project', role: 'Masha', kind: 'project', year: 2026, wentOn: 3 }];
    sim.must({ kind: 'pro.set_name', payload: { name: 'Ada Lynn Cole' } });
    expect(resumeBehind(sim.player, sim.now)).toEqual(['your name as Ada Lynn Cole', 'Masha in Fall Project (2026)']);
    expect(materialsCheck(sim.player, 'stage', sim.now).find((x) => x.kind === 'resume')!.words).toBe('Your résumé from August 30, 2026 doesn’t have your name as Ada Lynn Cole and Masha in Fall Project (2026). Press Update Your Résumé to bring it up to date.');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    const second = currentOf(sim.player.pro, 'resume')!;
    expect(second.version).toBe(2);
    expect(second.name).toBe('Ada Lynn Cole');
    expect(second.contains).toContain('Masha, Fall Project, David Geffen School of Drama at Yale University, 2026');
    expect(resumeBehind(sim.player, sim.now)).toEqual([]);
  });

  it('sets the professional name, refuses one that isn’t a name, and goes back to the display name', () => {
    const sim = student('pro-name');
    expect(sim.execute({ kind: 'pro.set_name', payload: { name: '' } }).error).toBe('You’re already working under your own name.');
    expect(sim.execute({ kind: 'pro.set_name', payload: { name: 'Ada 2' } }).error).toBe('A professional name is letters, with spaces, hyphens, apostrophes and periods between them.');
    expect(sim.execute({ kind: 'pro.set_name', payload: { name: 'A'.repeat(41) } }).error).toBe('A professional name is 40 characters at most.');
    expect(sim.must({ kind: 'pro.set_name', payload: { name: '  Ada   O’Neill-Cole ' } })).toEqual({ name: 'Ada O’Neill-Cole', set: true });
    expect(profileOf(sim.player, sim.now).name).toBe('Ada O’Neill-Cole');
    expect(sim.execute({ kind: 'pro.set_name', payload: { name: 'Ada O’Neill-Cole' } }).error).toBe('That’s already your professional name.');
    expect(sim.must({ kind: 'pro.set_name', payload: { name: '' } })).toEqual({ name: 'Ada Cole', set: false });
    expect(sim.player.pro!.name).toBeUndefined();
  });

  it('PLAYER JOURNEY: a reel is cut only from recorded work, two hours and $250.00, and says what it holds and what came after it', () => {
    const sim = student('pro-reel');
    tended(sim, at(2026, 8, 30, 10));
    expect(sim.execute({ kind: 'pro.cut_reel', payload: { pieces: [] } }).error).toBe('You have nothing recorded to cut a reel from. Tape a practice brief on the Player Profile first.');
    const camera = BRIEFS.filter((b) => b.medium === 'camera').slice(0, 2);
    const voice = BRIEFS.find((b) => b.medium === 'voice')!;
    for (const b of [...camera, voice]) {
      sim.must({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } });
      sim.must({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } });
    }
    const sources = reelSources(sim.player, sim.now);
    const voiced = sources.find((s) => s.title.startsWith(voice.title))!;
    expect(voiced).toMatchObject({ usable: false, why: 'It’s a voice recording with no picture, so it can’t go on a reel.' });
    expect(sim.execute({ kind: 'pro.cut_reel', payload: { pieces: [voiced.ref] } }).error).toBe('It’s a voice recording with no picture, so it can’t go on a reel.');
    expect(sim.execute({ kind: 'pro.cut_reel', payload: { pieces: ['tape:nothing:1'] } }).error).toBe('That piece isn’t among your recorded material.');
    const tapes = sources.filter((s) => s.usable);
    expect(tapes).toHaveLength(2);
    const before = balance(sim);
    const start = sim.now;
    sim.must({ kind: 'pro.cut_reel', payload: { pieces: [tapes[1]!.ref] } });
    expect(sim.now).toBe(start + REEL.minutes * 60_000);
    expect(before - balance(sim)).toBe(REEL.cost);
    const reel = currentOf(sim.player.pro, 'reel')!;
    expect(reel.pieces!.map((p) => p.ref)).toEqual([tapes[1]!.ref]);
    expect(reel.contains[0]).toMatch(new RegExp(`^${camera.find((b) => tapes[1]!.title.startsWith(b.title))!.title}, A Self-Tape, (Unready|Working|Strong|Exceptional), August 30, 2026$`));
    expect(sim.execute({ kind: 'pro.cut_reel', payload: { pieces: [tapes[1]!.ref] } }).error).toBe('Your reel already holds exactly these pieces.');
    expect(sim.execute({ kind: 'pro.cut_reel', payload: { pieces: [tapes[0]!.ref, tapes[0]!.ref] } }).error).toBe('Each piece goes on a reel once.');
    const reelNotes = materialsCheck(sim.player, 'screen', sim.now).filter((x) => x.kind === 'reel');
    expect(reelNotes.map((x) => x.problem)).toEqual(['tapes-only']);
    // A tape taped after the cut is newer work, said by its title.
    sim.must({ kind: 'practice.self_tape', payload: { genre: camera[0]!.kinds[0], brief: camera[0]!.id } });
    const after = materialsCheck(sim.player, 'screen', sim.now).find((x) => x.problem === 'newer-work')!;
    expect(after.words).toBe(`You’ve recorded more since you cut your reel on August 30, 2026: ${camera[0]!.title}, A Self-Tape.`);
    // The stage never asks for a reel.
    expect(materialsCheck(sim.player, 'stage', sim.now).some((x) => x.kind === 'reel')).toBe(false);
  });

  it('adds the School’s filmed monologues once DRAM 473b is passed and posted, and a screen credit’s footage once released', () => {
    const sim = student('pro-sources');
    // TEST SETUP: the final term's DRAM 473b passed, as its evaluation settles it.
    sim.player.school!.courses = { '5:DRAM 473b': { term: 5, code: 'DRAM 473b', name: 'Taming The Cyclops', meetings: 14, attended: 14, excused: 0, result: 'pass' } } as never;
    expect(reelSources(sim.player, sim.now)).toEqual([]);
    const posted = reelSources(sim.player, at(2029, 5, 1));
    expect(posted).toEqual([{ ref: 'monologues:5', from: 'monologues', title: 'Your Filmed Monologues, Taming The Cyclops (DRAM 473b)', at: posted[0]!.at, usable: true }]);
    expect(posted[0]!.at).toBeLessThan(at(2029, 5, 1));
    const credit = addCredit(sim, sim.player, { kind: 'screen', project: 'The Calloway Files', role: 'Desk Clerk', company: 'Bright Harbor Television', year: 2029, medium: 'television', status: 'shot', at: sim.now });
    expect(credit.id).toMatch(/^pro_/);
    expect(reelSources(sim.player, at(2029, 5, 1)).some((s) => s.from === 'footage')).toBe(false);
    expect(releaseScreenCredit(sim, sim.player, credit.id)!.status).toBe('released');
    expect(reelSources(sim.player, at(2029, 5, 1)).find((s) => s.from === 'footage')).toMatchObject({ ref: `footage:${credit.id}`, title: 'Desk Clerk, The Calloway Files', usable: true });
    // A professional credit is on the profile apart from the School's, said with whether its work is out.
    expect(profileOf(sim.player, sim.now).proCredits.map((c) => c.id)).toEqual([credit.id]);
    expect(proCreditWords(credit)).toBe('Desk Clerk, The Calloway Files, Bright Harbor Television, 2029');
    expect(proCreditWords({ ...credit, status: 'shot' })).toBe('Desk Clerk, The Calloway Files, Bright Harbor Television, 2029 (not yet released)');
    expect(proCreditWords({ ...credit, status: 'unreleased' })).toBe('Desk Clerk, The Calloway Files, Bright Harbor Television, 2029 (unreleased)');
    // A stage credit has no footage, released or not.
    const stage = addCredit(sim, sim.player, { kind: 'stage', project: 'A House On Calder Street', role: 'Nell', company: 'Marrow Lane Theater Company', year: 2029, medium: 'stage', status: 'performed', at: sim.now });
    expect(releaseScreenCredit(sim, sim.player, stage.id)).toBeUndefined();
  });
});

describe('what’s missing, in practical words', () => {
  it('needs headshots and a résumé for every purpose, and asks a reel of screen work and representation, never of the stage', () => {
    const sim = student('pro-check');
    const words = (purpose: 'stage' | 'screen' | 'representation') => materialsCheck(sim.player, purpose, sim.now).map((x) => [x.kind, x.problem, x.blocking]);
    expect(words('stage')).toEqual([['headshot', 'missing', true], ['resume', 'missing', true]]);
    expect(words('screen')).toEqual([['headshot', 'missing', true], ['resume', 'missing', true], ['reel', 'missing', false]]);
    expect(words('representation')).toEqual(words('screen'));
    expect(materialsCheck(sim.player, 'stage', sim.now)[0]!.words).toBe('You have no headshots, and every submission starts with one. Press Book A Headshot Session on the Career screen’s Portfolio tab.');
  });
});

describe('the history and the bounds', () => {
  const relation = (): AgentRelation => ({ agentId: 'thomas-ashgrove', stage: 'discovered', since: 0, stageAt: 0, history: [], counts: {} });

  it('gives each event a stable id, keeps a keyed event once, and keeps the last eighty with every one counted', () => {
    const sim = student('pro-history');
    const r = relation();
    const first = noteEvent(sim, r, { kind: 'requested', words: 'His office asked for a reel.', key: 'request:1' });
    expect(first.id).toMatch(/^pro_/);
    expect(noteEvent(sim, r, { kind: 'requested', words: 'Asked again.', key: 'request:1' })).toBe(first);
    expect(r.history).toHaveLength(1);
    for (let i = 0; i < 100; i += 1) noteEvent(sim, r, { kind: 'sent', words: `Sent ${i}.` });
    expect(r.history).toHaveLength(HISTORY_KEPT);
    expect(countOf(r, 'sent')).toBe(100);
    expect(countOf(r, 'requested')).toBe(1);
    expect(new Set(r.history.map((e) => e.id)).size).toBe(HISTORY_KEPT);
    expect(r.history.at(-1)!.words).toBe('Sent 99.');
  });

  it('keeps resolved opportunities to forty, finished engagements to twenty and each kind of material to six, never what’s live', () => {
    const sim = student('pro-bounds');
    const pro = sim.player.pro!;
    const opp = (i: number, status: Opportunity['status']): Opportunity => ({ id: `o${i}`, projectId: PROJECTS[0]!.id, via: 'open', status, postedAt: i, submitBy: i + 1, resolvedAt: i, history: [], counts: {} });
    pro.opportunities = [...Array.from({ length: 50 }, (_, i) => opp(i, 'passed')), opp(99, 'open')];
    const eng = (i: number, status: Engagement['status']): Engagement => ({ id: `e${i}`, opportunityId: 'o0', projectId: PROJECTS[0]!.id, role: 'Nell', status, days: [], pay: [], finishedAt: i, history: [], counts: {} });
    pro.engagements = [...Array.from({ length: 25 }, (_, i) => eng(i, 'finished')), eng(99, 'booked')];
    pro.materials = Array.from({ length: 9 }, (_, i) => ({ id: `m${i}`, kind: 'resume' as const, made: i, version: i + 1, source: 'x', contains: [] }));
    keepBounded(pro);
    expect(pro.opportunities).toHaveLength(OPPORTUNITIES_KEPT + 1);
    expect(pro.opportunities.some((o) => o.status === 'open')).toBe(true);
    expect(pro.opportunities.some((o) => o.id === 'o0')).toBe(false);
    expect(pro.engagements).toHaveLength(ENGAGEMENTS_KEPT + 1);
    expect(pro.engagements.some((e) => e.status === 'booked')).toBe(true);
    expect(pro.trimmed).toEqual({ opportunities: 10, engagements: 5 });
    expect(pro.materials.map((m) => m.id)).toEqual(['m3', 'm4', 'm5', 'm6', 'm7', 'm8']);
    expect(MATERIALS_KEPT).toBe(6);
  });

  it('holds an agreement in force from its signing to its end or its term’s last day, and never one offered, declined or let lapse', () => {
    const sim = student('pro-agreement');
    const pro = sim.player.pro!;
    const deal = (id: string, status: Agreement['status'], more: Partial<Agreement> = {}): Agreement => ({ id, agentId: AGENTS[0]!.id, offeredAt: at(2027, 1, 1), standsUntil: at(2027, 1, 15), status, terms: [], ...more });
    const signed = at(2027, 1, 10);
    pro.agreements = [deal('offered', 'offered'), deal('declined', 'declined'), deal('lapsed', 'lapsed'), deal('kept', 'accepted', { signedAt: signed, endsAt: at(2028, 1, 10) })];
    expect(activeAgreement(sim.player, signed - 1)).toBeUndefined();
    expect(activeAgreement(sim.player, signed)?.id).toBe('kept');
    expect(activeAgreement(sim.player, at(2028, 1, 9))?.id).toBe('kept');
    expect(activeAgreement(sim.player, at(2028, 1, 10))).toBeUndefined();
    // Ended early by agreement: in force for a date inside what it ran, not after.
    Object.assign(pro.agreements[3]!, { status: 'ended', endedAt: at(2027, 6, 1), endedHow: 'agreement' });
    expect(activeAgreement(sim.player, at(2027, 5, 31))?.id).toBe('kept');
    expect(activeAgreement(sim.player, at(2027, 6, 1))).toBeUndefined();
  });
});

describe('the agent and the work, as data', () => {
  it('holds one fictional agent and agency, the game’s rule on submissions, the routes it allows and the notice that says they’re invented', () => {
    // Until 2026-10-21 the agent was a real person, held only as published and quoted; the owner chose a fictional one.
    expect(AGENTS).toHaveLength(1);
    const agent = agentById('thomas-ashgrove')!;
    const agency = agencyOf(agent);
    expect([agent.name, agency.name, agency.office.city, agency.department.called]).toEqual(['Thomas Ashgrove', 'Halberd Talent', 'New York', 'Legit']);
    expect(agency.department.fields).toEqual(['television', 'film', 'broadway', 'off-broadway', 'national-tour', 'regional']);
    expect(agency.policy.words).toBe('His office takes no submissions it hasn’t asked for.');
    expect(agency.policy.unsolicited).toBe('refused');
    expect(agent.routes).toEqual(['showcase', 'referral']);
    expect(agent.notice).toBe('Thomas Ashgrove and Halberd Talent are invented for the game, as every agency, project and casting office in it is. His office takes no submissions it hasn’t asked for: it sees your materials through the School’s follow-up after the showcase, or a referral from someone you’ve worked with. He never gets in touch first.');
    expect(agent.roster.basis).toBe('assumption');
    // Nothing private: no contact detail of any kind in the agent's or the agency's data.
    const text = JSON.stringify([AGENTS, AGENCIES]);
    expect(text).not.toMatch(/@|\bphone\b|\(\d{3}\) ?\d{3}-\d{4}|\b\d{3}[-.]\d{3}[-.]\d{4}\b|\bStreet\b|\bAvenue\b|\bclients?\b/i);
    // Nor the real agent's or agency's names, nor their pages (the research keeps them, as history).
    expect(text).not.toMatch(/Parente|Stewart Talent|stewarttalent|https?:/);
  });

  it('prices each SAG-AFTRA day rate by its contract year, Low Budget at 65% and Ultra Low Budget at 20% of the day performer’s, and holds the rest at the figure on file', () => {
    // Until 2026-10-21 Low Budget and Ultra Low Budget stayed at their 2026–27 figures in 2029 (brief 19's playthroughs).
    const on = (id: RateId, day: string) => minimumOn(RATES[id], day);
    expect(['2026-08-24', '2027-07-01', '2028-07-01', '2029-07-01'].map((d) => on('sag-tv-day', d))).toEqual([1_283_00, 1_321_00, 1_361_00, 1_402_00]);
    // The 2026–27 shares are the rate sheets' own figures.
    expect(on('low-budget-day', '2026-08-24')).toBe(RATES['low-budget-day'].amount);
    expect(on('ultra-low-budget-day', '2026-08-24')).toBe(RATES['ultra-low-budget-day'].amount);
    expect(on('low-budget-day', '2029-07-01')).toBe(911_00);
    expect(on('ultra-low-budget-day', '2029-07-01')).toBe(280_00);
    // The day before a contract year turns is the old year's.
    expect(on('low-budget-day', '2027-06-30')).toBe(834_00);
    for (const id of ['lort-c', 'off-broadway', 'non-union-day'] as const) expect(on(id, '2029-07-01')).toBe(RATES[id].amount);
  });

  it('says how often an understudy went on in words, as a résumé does: “once”, “twice”, “three times”, never “1 time”', () => {
    // Until 2026-10-21 the line read "went on 1 time" (brief 19's playthroughs, `playthroughs/REPORT.md`).
    const line = (wentOn: number, understudy = true) => schoolCreditWords({ key: 'k', production: 'Hedda Gabler', role: 'Thea Elvsted', venue: 'Yale Repertory Theatre', year: 2028, understudy, wentOn });
    expect(line(1)).toBe('Thea Elvsted (understudy, went on once), Hedda Gabler, Yale Repertory Theatre, 2028');
    expect(line(2)).toBe('Thea Elvsted (understudy, went on twice), Hedda Gabler, Yale Repertory Theatre, 2028');
    expect(line(3)).toBe('Thea Elvsted (understudy, went on three times), Hedda Gabler, Yale Repertory Theatre, 2028');
    expect(line(12)).toBe('Thea Elvsted (understudy, went on 12 times), Hedda Gabler, Yale Repertory Theatre, 2028');
    // A part cast to them says nothing of how often: they played it.
    expect(line(9, false)).toBe('Thea Elvsted, Hedda Gabler, Yale Repertory Theatre, 2028');
  });

  it('names no agent in the engine’s code: a second one is another entry of data, as the fictional one put in the real one’s place on 2026-10-21 was', () => {
    const files = readdirSync('src/engine/systems').map((f) => `src/engine/systems/${f}`).concat(['src/engine/index.ts', 'src/ui/workspaces/CareerWorkspace.tsx']);
    expect(files.filter((f) => /Parente|jordan-parente|Stewart Talent|Ashgrove|thomas-ashgrove|Halberd/.test(readFileSync(f, 'utf8')))).toEqual([]);
  });

  it('writes each part for an actor, an actress or either, three for either and four for each, so an actor and an actress each have a part in all seven projects, of every size and kind as often (the owner’s word, 2026-10-21)', () => {
    const forWhom = (title: 'actor' | 'actress') => PROJECTS.filter((p) => p.role.for === 'either' || p.role.for === title);
    expect(PROJECTS.map((p) => p.role.for).sort()).toEqual([...Array(3).fill('either'), ...Array(4).fill('actor'), ...Array(4).fill('actress')].sort());
    const actor = forWhom('actor');
    const actress = forWhom('actress');
    // Each sees every project once, and the same kinds, sizes, ways in and pay: the counterpart is the same work for the other.
    for (const seen of [actor, actress]) expect(seen.map((p) => p.project).sort()).toEqual([...new Set(PROJECTS.map((p) => p.project))].sort());
    const shape = (p: (typeof PROJECTS)[number]) => JSON.stringify([p.project, p.kind, p.role.size, p.role.task, p.role.stakes, p.access, p.pay, p.stages, p.schedule, p.place]);
    expect(actor.map(shape).sort()).toEqual(actress.map(shape).sort());
    // A part written for one is its own person, not the other renamed: its own name and its own breakdown.
    for (const p of PROJECTS.filter((x) => x.role.for !== 'either')) {
      const twin = PROJECTS.find((x) => x.project === p.project && x.id !== p.id)!;
      expect(twin.role.for).toBe(p.role.for === 'actor' ? 'actress' : 'actor');
      expect(twin.role.part).not.toBe(p.role.part);
      expect(twin.role.about).not.toBe(p.role.about);
    }
    // A part for either says nobody's sex; the four that name it say the one they're written for.
    for (const p of PROJECTS.filter((x) => x.role.for === 'either')) expect(p.role.about).not.toMatch(/\b(he|she|his|her|him|brother|sister|widow|fiancées?)\b/i);
  });

  it('names no part as the School names a classmate, so an audition’s notice can’t read as a classmate’s (Theo, Felix since, and Owen, Callum since, until the app’s walks found them, 2026-10-21)', () => {
    const given = new Set([...GIVEN_ACTOR, ...GIVEN_ACTRESS]);
    expect(PROJECTS.map((p) => p.role.part.split(' ')[0]!).filter((first) => given.has(first))).toEqual([]);
  });

  it('says Equity’s 90 days one way in the agreement’s Ending It term, the button’s refusal, the ending’s record and the guide: no real offer of covered work through him', () => {
    expect(AGREEMENT_TERMS.find((t) => t.id === 'termination')!.words).toContain('if 90 days pass with no real offer of covered work through him,');
    expect(readFileSync('src/engine/systems/proagent.ts', 'utf8').match(/no real offer of covered work[^`’,.]*/g)!.map((x) => x.trim())).toEqual(Array(2).fill('no real offer of covered work through him'));
    expect(readFileSync('src/engine/content/guide/career.ts', 'utf8').match(/no real offer of covered work[^`’,.]*/g)!.map((x) => x.trim())).toEqual(Array(2).fill('no real offer of covered work through him'));
  });

  it('gives every project a fictional company and casting office, the game’s genres, a rate that is verified or assumed, and every agreement term a basis', () => {
    // Seven projects, one of each kind, some with a part for each (from 2026-10-21): the kinds read once a project.
    expect([...new Set(PROJECTS.map((p) => p.kind))]).toEqual(['off-broadway', 'lort', 'network-drama', 'low-budget', 'ultra-low-budget', 'student-film', 'non-union-short']);
    expect(new Set(PROJECTS.map((p) => p.project)).size).toBe(7);
    for (const p of PROJECTS) {
      expect(p.fictional).toBe(true);
      const rate = RATES[p.pay];
      expect(['verified', 'assumption']).toContain(rate.basis);
      if (rate.basis === 'verified') expect(rate.source).toBeDefined();
      else expect(rate.words).toMatch(/estimated/);
    }
    expect([...new Set(PROJECTS.filter((p) => p.access.open).map((p) => p.kind))]).toEqual(['lort', 'ultra-low-budget', 'student-film', 'non-union-short']);
    for (const t of AGREEMENT_TERMS) expect(['verified', 'simulation']).toContain(t.basis);
    expect(AGREEMENT_TERMS.filter((t) => t.basis === 'verified').every((t) => (t.sources ?? []).length > 0)).toBe(true);
  });
});
