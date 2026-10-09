/**
 * The School's casting (`systems/school.ts`, `content/plays.ts`): a class that
 * competes, plays with their own characters, parts given by what each play
 * asks and the chair's balance, and the class cast beside the player.
 */

import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { NEW_PLAYS_READ, REP_PLAYS, SHAKESPEARE_PLAYS, THESIS_PLAYS, type Part } from '@/engine/content/plays';
import { COURSES } from '@/engine/content/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { CALL_KIND, COMPANY_KIND, ESTIMATE, BONDS, bondWord, castScore, evaluate, repPlayOf, teachersNotes, directorsNote, evenCraft, mateOf, nightEvaluation, nightOf, nightsMean, partsFor, playNight, playOf, schoolProduction, type Craft } from '@/engine/systems/school';

const NY = 'America/New_York';

/**
 * TEST SETUP: a student who does the coursework, its every part prepared before it's shown. From 2026-10-10 the
 * faculty read the term's showings, and a term of work shown unready falls short; these tests are of casting and the
 * calendar, not of a student who never prepares.
 */
const doTheWork = (sim: Simulation) => { for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95); };
/** TEST SETUP: the work done each midnight, through however the test moves the clock. */
const working = (sim: Simulation) => sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => doTheWork(s));
const life = (seed: string, pronouns = 'she/her') => working(createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns }));
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
const on = (y: number, m: number, d: number) => instantFromZoned({ year: y, month: m, day: d, hour: 10 }, NY);
const student = (i: number, level: number, title: 'actor' | 'actress', last?: { size: 'lead' | 'supporting' | 'featured'; delivery?: number }) => ({ i, name: `S${i}`, craft: evenCraft(level), title, ...(last ? { last } : {}) });

describe('the plays', () => {
  it('deals each save its own season: a thesis is a real play with its characters, and a season’s three are three plays', () => {
    const seasons = new Set<string>();
    for (const seed of ['pl-1', 'pl-2', 'pl-3', 'pl-4']) {
      const sim = life(seed);
      const theses = [2, 3, 4].map((term) => playOf(sim, sim.player, schoolProduction(term, 1)!));
      for (const t of theses) expect(THESIS_PLAYS.map((p) => p.title)).toContain(t.title);
      // No student meets the same play twice: the three theses a class plays in are three plays.
      expect(new Set(theses.map((t) => t.title)).size).toBe(3);
      const bard = [1, 6, 11].map((rank) => playOf(sim, sim.player, schoolProduction(5, rank)!).title);
      expect(new Set(bard).size).toBe(3);
      for (const t of bard) expect(SHAKESPEARE_PLAYS.map((p) => p.title)).toContain(t);
      seasons.add(theses.map((t) => t.title).join('/'));
    }
    expect(seasons.size).toBeGreaterThan(1);
  });

  it('leaves a festival’s new plays unnamed, with parts by size, read on the script and cold reading', () => {
    const sim = life('pl-festival');
    const carlotta = playOf(sim, sim.player, schoolProduction(1, 1)!);
    expect(carlotta.title).toBeUndefined();
    expect(carlotta.reads).toBe(NEW_PLAYS_READ);
    expect(carlotta.parts.filter((p) => p.size === 'lead')).toHaveLength(3);
    expect(carlotta.parts).toHaveLength(16);
  });
});

describe('the chair’s casting', () => {
  const parts: Part[] = [
    { name: 'Hedda', size: 'lead', for: 'actress' },
    { name: 'Løvborg', size: 'supporting', for: 'actor' },
    { name: 'The Doctor', size: 'supporting', for: 'either' },
  ];
  const reads: Partial<Craft> = { scene: 1 };

  it('gives the best read the biggest part written for them, and past the parts, the company', () => {
    const given = partsFor([student(0, 60, 'actress'), student(1, 70, 'actor'), student(2, 65, 'actress'), student(3, 50, 'actor')], parts, reads);
    const by = Object.fromEntries(given.map((g) => [g.s.name, g.part]));
    // The actor who reads best can't take Hedda: he takes the first part written for him.
    expect(by).toEqual({ S1: 'Løvborg', S2: 'Hedda', S0: 'The Doctor', S3: 'In The Company' });
    // Only a part written for an actress left, an actor goes into the company rather than take it.
    expect(partsFor([student(0, 90, 'actor')], [{ name: 'Hedda', size: 'lead', for: 'actress' }], reads)[0]!.part).toBe('In The Company');
  });

  it('balances opportunity: a lead last time counts against the next, a featured part for it, and delivery a fifth of the fit', () => {
    const c = ESTIMATE.casting;
    expect(castScore(student(0, 60, 'actress', { size: 'lead' }), reads)).toBe(60 + c.balance.lead);
    expect(castScore(student(0, 60, 'actress', { size: 'featured' }), reads)).toBe(60 + c.balance.featured);
    // Since 2026-10-10 the last run counts by how much of themselves they delivered (`LastWork.delivery`), a fifth of the fit, not the nights' bands.
    expect(castScore(student(0, 60, 'actress', { size: 'supporting' }), reads)).toBe(60);
    expect(castScore(student(0, 60, 'actress', { size: 'supporting', delivery: 0.5 }), reads)).toBeCloseTo(60 * (1 - c.delivery * 0.5), 9);
    // Last time's lead, a point up on the craft, loses Hedda to last time's featured actress.
    const given = partsFor([student(0, 61, 'actress', { size: 'lead' }), student(1, 60, 'actress', { size: 'featured' })], parts, reads);
    expect(given[0]!.s.name).toBe('S1');
    expect(given[0]!.part).toBe('Hedda');
  });

  it('reads each play for what it asks: a verse speaker for Shakespeare, a comedian for Wilde', () => {
    const verse: Craft = { ...evenCraft(55), classical: 90 };
    const wit: Craft = { ...evenCraft(55), comedy: 90, speech: 90 };
    const bard = SHAKESPEARE_PLAYS[0]!.reads;
    const earnest = THESIS_PLAYS.find((p) => p.title === 'The Importance Of Being Earnest')!.reads;
    expect(castScore({ craft: verse }, bard)).toBeGreaterThan(castScore({ craft: wit }, bard));
    expect(castScore({ craft: wit }, earnest)).toBeGreaterThan(castScore({ craft: verse }, earnest));
  });

  it('casts the whole class each term: the player a part in a play, their classmates in it named, and every student listed', () => {
    const sim = life('cast-class');
    play(sim, on(2027, 9, 15));
    const school = sim.player.school!;
    const c = school.casting!;
    expect(['thesis', 'hughes']).toContain(c.kind);
    expect(c.size).toBeDefined();
    if (c.kind === 'thesis') {
      const p = THESIS_PLAYS.find((x) => x.title === c.play)!;
      expect(p.parts.map((x) => x.name)).toContain(c.role);
      expect(c.by).toBe(p.by);
    }
    expect(school.around!.list.filter((a) => a.name === 'You')).toHaveLength(1);
    expect(school.around!.list.length).toBeGreaterThanOrEqual(16);
    for (const mate of c.cast!) expect(school.around!.list).toContainEqual(expect.objectContaining({ name: mate.name, production: c.play ?? c.production, part: mate.part }));
    for (const m of school.classmates) expect(m.last).toBeDefined();
  }, 120_000);

  it('grows the classmates in a production by its rehearsals and nights once the run is over', () => {
    const sim = life('cast-company');
    play(sim, on(2027, 1, 6));
    const run = sim.universe.scheduled.find((i) => i.kind === COMPANY_KIND && i.status === 'pending')!;
    const i = (run.payload.mates as number[])[0]!;
    const mate = sim.player.school!.classmates[i]!;
    play(sim, run.at - 60_000);
    const before = { ...mate.craft };
    play(sim, run.at + MS_HOUR);
    // The rehearsals' lines, and the nights' feeling, which rehearsal doesn't grow.
    expect(mate.craft.memorization).toBeGreaterThan(before.memorization);
    expect(mate.craft.emotion).toBeGreaterThan(before.emotion);
  }, 120_000);

  it('gives a classmate from before the class had titles and drives one by the name’s list, and an ordinary drive', () => {
    const sim = life('cast-old');
    const m = sim.player.school!.classmates[0]!;
    m.name = 'Priya Patel';
    delete m.title;
    delete m.drive;
    expect(mateOf(sim, sim.player, 0)).toMatchObject({ title: 'actress', drive: 1 });
    for (const [name, title] of [['Marcus Chen', 'actor'], ['Grace Kim', 'actress'], ['Noah Walsh', 'actor'], ['Zoe Park', 'actress']] as const) {
      Object.assign(m, { name });
      delete m.title;
      expect(mateOf(sim, sim.player, 0).title).toBe(title);
    }
  });

  it('gives each classmate their own drive, and the driven grow more in the same classes', () => {
    const sim = life('cast-drive');
    const mates = sim.player.school!.classmates;
    expect(new Set(mates.map((m) => m.drive)).size).toBeGreaterThan(10);
    Object.assign(mates[0]!, { craft: evenCraft(50), drive: 1.15 });
    Object.assign(mates[1]!, { craft: evenCraft(50), drive: 0.85 });
    play(sim, on(2026, 9, 12));
    expect(mates[0]!.craft.scene).toBeGreaterThan(mates[1]!.craft.scene);
  });
});

describe('a night’s growth', () => {
  it('grows what the play asks: the classics in Shakespeare, not in a new play', () => {
    const a = evenCraft(50);
    const b = evenCraft(50);
    playNight(a, SHAKESPEARE_PLAYS[0]!.reads, 1);
    playNight(b, NEW_PLAYS_READ, 1);
    expect(a.classical).toBeGreaterThan(b.classical);
    expect(b.script).toBeGreaterThan(a.script);
    expect(a.scene).toBeGreaterThan(50);
  });
});

describe('a night’s reading', () => {
  it('goes better rested and stronger for the part: off when spent and weak for it, remarkable when fresh and strong', () => {
    const sim = life('nights-bands');
    const p = sim.player;
    // One level in every ability and technique, and an energy: what the evaluation reads (`nightEvaluation`).
    const at = (level: number, energy: number) => {
      p.craft = evenCraft(level);
      p.attrs = { presence: level, composure: level, listening: level, imagination: level, focus: level, adaptability: level, discipline: level };
      // Spent is spent all through: no energy, and the stress and the sleep owed that go with it.
      Object.assign(p.wellbeing, energy < 30 ? { energy, stress: 80, sleepDebt: 20, nourishment: 50, morale: 40 } : { energy, stress: 10, sleepDebt: 0, nourishment: 80, morale: 60 });
    };
    const count = (level: number, energy: number) => {
      at(level, energy);
      const out = { off: 0, solid: 0, strong: 0, remarkable: 0 };
      for (let n = 0; n < 200; n += 1) out[nightOf(sim, p, `k${n}`, {}, sim.now)] += 1;
      return out;
    };
    const spent = count(40, 5);
    const fresh = count(92, 100);
    expect(spent.off).toBeGreaterThan(150);
    expect(fresh.remarkable).toBeGreaterThan(150);
    // The same actor, rested or not.
    const rested = count(72, 95);
    const tired = count(72, 10);
    expect(rested.strong + rested.remarkable).toBeGreaterThan(tired.strong + tired.remarkable);
    // A night reads against what the part asks: a lead more than a featured part, and the Rep's professional parts more than the School's.
    const V = { off: 0, solid: 1, strong: 2, remarkable: 3 } as const;
    at(75, 90);
    const sum = (size: 'lead' | 'featured', where: 'school' | 'rep') => Array.from({ length: 200 }, (_, n) => V[nightOf(sim, p, 'p' + n, {}, sim.now, size, where)]).reduce((a: number, b) => a + b, 0);
    // In the bands, across the line at 65 (`NIGHT_DIFFICULTY`), and in the whole the bands are cut from, every night.
    at(66, 90);
    expect(sum('featured', 'school')).toBeGreaterThan(sum('lead', 'school'));
    at(72, 90);
    expect(sum('lead', 'school')).toBeGreaterThan(sum('lead', 'rep'));
    const whole = (size: 'lead' | 'featured', where: 'school' | 'rep', n: number) => nightEvaluation(sim, p, 'w' + n, {}, sim.now, size, where).overall;
    for (let n = 0; n < 20; n += 1) {
      expect(whole('featured', 'school', n)).toBeGreaterThan(whole('lead', 'school', n));
      expect(whole('lead', 'school', n)).toBeGreaterThan(whole('lead', 'rep', n));
    }
    expect(directorsNote(2)).not.toBe(directorsNote(-1));
    expect(nightsMean({ strong: 2, off: 2 })).toBe(0);
  });

  it('keeps each night of a run, gives the director’s note at the last, and the chair reads the run next term', () => {
    const sim = life('nights-run');
    play(sim, on(2027, 1, 6));
    const shows = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.call === 'performance' && i.payload.which !== 'rep');
    expect(shows.at(-1)!.payload.last).toBe(true);
    expect(shows.filter((i) => i.payload.last === true)).toHaveLength(1);
    const c = sim.player.school!.casting!;
    for (const show of shows) {
      play(sim, show.at - 60_000);
      sim.player.currentLocationId = 'us-ct-newhaven';
      sim.player.awakeSince = show.at - 8 * MS_HOUR;
      sim.advanceTo(show.at + 60_000);
    }
    const nights = Object.values(c.nights ?? {}).reduce((a, b) => a + b, 0);
    expect(nights).toBe(shows.length);
    expect(c.note).toContain(directorsNote(nightsMean(c.nights!)));
    // And names what the play asked that was weakest in them.
    expect(c.note).toMatch(/ Work on your [a-z -]+.$/);
    expect(sim.universe.notifications.some((n) => n.title.startsWith('The Director’s Note'))).toBe(true);
    play(sim, on(2027, 9, 15));
    expect(sim.player.school!.lastWork).toMatchObject({ size: c.size });
    // And how much of themselves they delivered across the run's nights (from 2026-10-10), a share.
    const delivery = sim.player.school!.lastWork!.delivery!;
    expect(delivery).toBeGreaterThan(0);
    expect(delivery).toBeLessThanOrEqual(1);
  }, 180_000);
});

describe('what a night does', () => {
  it('lifts the presence of an actor who has remarkable nights, and not one who has off ones', () => {
    const run = (level: number) => {
      const sim = life('nights-presence');
      play(sim, on(2027, 1, 6));
      sim.player.craft = evenCraft(level);
      // The abilities with the craft (`content/abilities.ts`): a night reads both since 2026-10-09. Presence keeps its draw.
      Object.assign(sim.player.attrs!, { composure: level, listening: level, imagination: level, focus: level, adaptability: level, discipline: level });
      const shows = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.call === 'performance' && i.payload.which !== 'rep');
      play(sim, shows[0]!.at - 60_000);
      const start = sim.player.attrs!.presence;
      for (const show of shows) {
        play(sim, show.at - 60_000);
        sim.player.currentLocationId = 'us-ct-newhaven';
        sim.player.awakeSince = show.at - 8 * MS_HOUR;
        // Rested and fed, as a player who looks after themselves comes to a show.
        Object.assign(sim.player.wellbeing, { energy: 95, stress: 5, sleepDebt: 0, nourishment: 90, morale: 80 });
        sim.advanceTo(show.at + 60_000);
      }
      return { gain: sim.player.attrs!.presence - start, nights: sim.player.school!.casting!.nights! };
    };
    const strong = run(95);
    const weak = run(40);
    expect(strong.nights.remarkable ?? 0).toBeGreaterThan(0);
    expect(weak.nights.remarkable ?? 0).toBe(0);
    expect(strong.gain).toBeGreaterThan(weak.gain);
  }, 240_000);
});

describe('the class’s names', () => {
  it('gives no two classmates the same given name or family name', () => {
    for (const seed of ['names-1', 'names-2', 'names-3']) {
      const names = life(seed).player.school!.classmates.map((m) => m.name.split(' '));
      expect(new Set(names.map((n) => n[1])).size).toBe(names.length);
      expect(new Set(names.map((n) => n[0])).size).toBe(names.length);
    }
  });
});

describe('the faculty read the work on stage', () => {
  it('count a run gone mostly off against the term, and note a strong one', () => {
    for (const [nights, standing, words] of [[{ off: 4 }, 'concern', /fell short/], [{ strong: 2, remarkable: 2 }, 'good', /strong work/], [{ off: 1, solid: 3 }, 'good', /^(?!.*(fell short|strong work))/]] as const) {
      const sim = life(`work-${standing}-${Object.keys(nights)[0]}`);
      const school = sim.player.school!;
      school.casting = { production: 'Directors’ Thesis Production I', play: 'Hedda Gabler', by: 'Henrik Ibsen', role: 'Hedda Tesman', kind: 'thesis', term: 0, performed: 4, size: 'lead', nights };
      const review = evaluate(sim, sim.player, 0)!;
      expect(review.standing).toBe(standing);
      expect(review.work).toBe(nightsMean(nights));
      expect(review.reason).toMatch(words);
    }
  });
});

describe('Yale Rep’s seasons not yet announced', () => {
  it('deal each save a play for each, not the same two years running, and an understudy covers a lead written for them', () => {
    const sim = life('rep-plays', 'he/him');
    const [two, four] = [repPlayOf(sim, sim.player, 2), repPlayOf(sim, sim.player, 4)];
    expect(REP_PLAYS).toContain(two);
    expect(two.title).not.toBe(four.title);
    play(sim, on(2027, 9, 15));
    const rep = sim.player.school!.rep!;
    expect(rep).toMatchObject({ kind: 'understudy', play: two.title, by: two.by });
    const part = two.parts.find((x) => x.name === rep.role)!;
    expect(part.size).toBe('lead');
    expect(['actor', 'either']).toContain(part.for);
  }, 120_000);
});

describe('the teachers’ notes', () => {
  it('give one from each course the term ran, by its teacher, on growth in its skills against the room', () => {
    const sim = life('teachers');
    play(sim, on(2026, 12, 20));
    const review = sim.player.school!.history[0]!;
    const fall = COURSES.filter((c) => c.year === 1 && c.terms.includes('fall'));
    expect(review.notes!.map((n) => n.course)).toEqual(fall.map((c) => c.name));
    expect(review.notes!.map((n) => n.teacher)).toEqual(fall.map((c) => c.teachers.split(', ')[0]));
    // The notes follow the growth: a student whose skills stood still is told so.
    const tally = sim.player.school!.tally;
    tally.craftAtStart = { ...sim.player.craft! };
    const still = teachersNotes(sim.player, 0);
    expect(still.every((n) => /hasn’t moved/.test(n.note))).toBe(true);
  }, 120_000);
});

describe('friends and rivals', () => {
  it('draw a cast shared closer, and a lead taken apart', () => {
    const sim = life('bonds');
    play(sim, on(2027, 1, 6));
    const school = sim.player.school!;
    const c = school.casting!;
    // Everybody's in the first spring's festival together.
    for (const mate of c.cast!) {
      const m = school.classmates.find((x) => x.name === mate.name)!;
      const tookLead = /^A Leading Part/.test(mate.part) && c.size !== 'lead';
      const lostLead = c.size === 'lead' && !/^A Leading Part/.test(mate.part);
      expect(m.bond).toBe(BONDS.shared - (tookLead ? BONDS.leadTaken : 0) - (lostLead ? BONDS.leadTaken : 0));
    }
    expect(bondWord(30)).toBe('Friend');
    expect(bondWord(60)).toBe('Close Friend');
    expect(bondWord(-25)).toBe('Rival');
    expect(bondWord(5)).toBeUndefined();
  }, 120_000);

  it('lift a night with friends in the cast', () => {
    const run = (friendly: boolean) => {
      const sim = life('bonds-night');
      play(sim, on(2027, 1, 6));
      const school = sim.player.school!;
      for (const mate of school.casting!.cast!) school.classmates.find((x) => x.name === mate.name)!.bond = friendly ? 60 : 0;
      const show = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.call === 'performance' && i.payload.which !== 'rep')[0]!;
      play(sim, show.at - 60_000);
      sim.player.currentLocationId = 'us-ct-newhaven';
      sim.player.awakeSince = show.at - 8 * MS_HOUR;
      sim.player.wellbeing.morale = 50;
      sim.advanceTo(show.at + 60_000);
      return sim.player.wellbeing.morale;
    };
    expect(run(true)).toBeGreaterThan(run(false));
  }, 120_000);
});
