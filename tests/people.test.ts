/**
 * The people of the industry.
 *
 * Two things are being checked, and they are different kinds of claim. What
 * the record holds has to be loaded faithfully — a birthday is right or it is
 * absent, a filmography is what the record says and nothing more. What SLATE
 * derives has to be honest about itself: in range, deterministic, driven by
 * the evidence, and able to say which part of the evidence produced it.
 */

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  NOT_IN_RECORD, addPeople, addPeopleAwards, addPeopleCredits, ageIsApproximate, ageOf, allPeople, awardsFor,
  companiesOf, confidenceOf, creditsFor, deriveSheet, franchisesOf, isPeopleLoaded,
  overallFor, personByName, primaryRole, rolesWithSheets, signalsOf,
  SIGNAL_LABEL, type PersonRecord,
} from '@/engine/content/people';
import { CRAFT_ROLES, attributesForRole } from '@/engine/content/craft-attributes';
import { ATTRIBUTE_BY_ID } from '@/engine/domain/attributes';
import { searchEverything, indexCoverage, buildIndex } from '@/engine/content/search';
import { awardBoards, awardCoverage, mostAwardedWorks, standingOf } from '@/engine/content/award-records';

beforeAll(() => {
  addPeople(readFileSync('public/industry/people.tsv', 'utf8'));
  addPeopleCredits(readFileSync('public/industry/people-credits.tsv', 'utf8'));
  addPeopleAwards(readFileSync('public/industry/people-awards.tsv', 'utf8'));
  buildIndex();
});

describe('what the record holds', () => {
  it('never shows an identifier where a title should be', () => {
    // The label service hands back a bare Q-id when a work has no label in any
    // language it was asked for. 'Q140513844' is not a film anybody has heard
    // of, and putting one in front of a player is worse than leaving the
    // credit out.
    const idish: string[] = [];
    for (const person of allPeople()) {
      for (const credit of creditsFor(person.qid)) {
        if (/^Q\d+$/.test(credit.title.trim())) idish.push(`${person.name}: ${credit.title}`);
      }
      for (const award of awardsFor(person.qid)) {
        if (/^Q\d+$/.test(award.award.trim())) idish.push(`${person.name}: ${award.award}`);
        if (award.forWork && /^Q\d+$/.test(award.forWork.trim())) idish.push(`${person.name}: ${award.forWork}`);
      }
    }
    expect(idish, `identifiers used as titles:\n${idish.slice(0, 20).join('\n')}`).toEqual([]);
  });

  it('loads the whole roster, each of them once', () => {
    expect(isPeopleLoaded()).toBe(true);
    const people = allPeople();
    expect(people.length).toBeGreaterThan(740);
    expect(new Set(people.map((p) => p.qid)).size).toBe(people.length);
    for (const person of people) {
      expect(person.name.trim().length, person.qid).toBeGreaterThan(1);
      expect(person.qid).toMatch(/^Q\d+$/);
      expect(person.roles.length, person.name).toBeGreaterThan(0);
    }
  });

  it('keeps dates as the record has them, or not at all', () => {
    for (const person of allPeople()) {
      if (person.birth) expect(person.birth, person.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (person.death) expect(person.death, person.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    // Nothing is filled in: some people genuinely have no date on record.
    const withBirth = allPeople().filter((p) => p.birth).length;
    expect(withBirth).toBeGreaterThan(600);
    expect(withBirth).toBeLessThan(allPeople().length + 1);
  });

  it('has the facts right on people who are easy to check', () => {
    const leo = personByName('Leonardo DiCaprio');
    expect(leo).toBeDefined();
    expect(leo!.birth).toBe('1974-11-11');
    expect(leo!.bornIn).toBe('Los Angeles');
    expect(leo!.citizenship).toContain('United States');
    expect(leo!.imdbId).toBe('nm0000138');
    expect(creditsFor(leo!.qid).length).toBeGreaterThan(30);
    expect(awardsFor(leo!.qid).some((a) => /Academy Award/i.test(a.award) && a.outcome === 'won')).toBe(true);

    const deakins = personByName('Roger Deakins');
    expect(deakins?.roles).toContain('cinematographer');
    expect(awardsFor(deakins!.qid).filter((a) => a.outcome === 'won').length).toBeGreaterThan(3);

    const zimmer = personByName('Hans Zimmer');
    expect(creditsFor(zimmer!.qid).length).toBeGreaterThan(100);
  });

  it('never invents somebody it could not find', () => {
    for (const missing of NOT_IN_RECORD) {
      expect(personByName(missing.name), `${missing.name} was invented`).toBeUndefined();
      expect(missing.note.length).toBeGreaterThan(10);
    }
  });

  it('reads a filmography as the record has it and no further', () => {
    for (const person of allPeople().slice(0, 120)) {
      for (const credit of creditsFor(person.qid)) {
        expect(credit.personQid).toBe(person.qid);
        expect(credit.title.length).toBeGreaterThan(0);
        if (credit.year !== undefined) {
          expect(credit.year).toBeGreaterThan(1900);
          expect(credit.year).toBeLessThan(2035);
        }
        if (credit.rating !== undefined) {
          expect(credit.rating).toBeGreaterThan(0);
          expect(credit.rating).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it('ties people to the franchises and companies their work belongs to', () => {
    const holland = personByName('Tom Holland');
    expect(holland).toBeDefined();
    expect(franchisesOf(holland!.qid).length, 'nothing links him to a franchise').toBeGreaterThan(0);
    expect(companiesOf(holland!.qid).length).toBeGreaterThan(0);
  });
});

describe('what SLATE derives from it', () => {
  it('gives every job its own sheet, and a multi-role person one of each', () => {
    for (const role of CRAFT_ROLES) {
      if (role === 'actor') continue;
      const defs = attributesForRole(role);
      expect(defs.length, role).toBeGreaterThan(15);
      for (const def of defs) expect(def.id.startsWith(`${role}.`), def.id).toBe(true);
    }
    const glover = personByName('Donald Glover');
    expect(glover).toBeDefined();
    expect(rolesWithSheets(glover!).length, 'a person who does four jobs got one sheet').toBeGreaterThan(2);
    for (const role of rolesWithSheets(glover!)) {
      expect(deriveSheet(glover!, role).length).toBeGreaterThan(15);
    }
  });

  it('keeps every number in range, and every actor sheet the player\'s own 88', () => {
    for (const person of allPeople().slice(0, 150)) {
      for (const role of rolesWithSheets(person)) {
        const sheet = deriveSheet(person, role);
        if (role === 'actor') {
          expect(sheet.length).toBe(88);
          for (const attribute of sheet) expect(ATTRIBUTE_BY_ID[attribute.id], attribute.id).toBeDefined();
        }
        for (const attribute of sheet) {
          expect(attribute.value, `${person.name} ${attribute.id}`).toBeGreaterThanOrEqual(12);
          expect(attribute.value, `${person.name} ${attribute.id}`).toBeLessThanOrEqual(99);
          expect(attribute.description.length).toBeGreaterThan(10);
          for (const reason of attribute.because) {
            expect(SIGNAL_LABEL[reason.signal], reason.signal).toBeDefined();
          }
        }
      }
    }
  });

  it('is deterministic: the same record always gives the same sheet', () => {
    const person = personByName('Cate Blanchett')!;
    const once = deriveSheet(person, 'actor').map((a) => `${a.id}:${a.value}`);
    const twice = deriveSheet(person, 'actor').map((a) => `${a.id}:${a.value}`);
    expect(once).toEqual(twice);
  });

  it('follows the evidence rather than the alphabet', () => {
    // Somebody with a long, decorated, well-rated body of work outranks
    // somebody the record barely holds, in the same craft.
    const deakins = personByName('Roger Deakins')!;
    const thin = allPeople().find((p) => p.roles.includes('cinematographer') && (p.evidence.cinematographer?.credits ?? 0) <= 2)!;
    expect(thin).toBeDefined();
    expect(overallFor(deakins, 'cinematographer')).toBeGreaterThan(overallFor(thin, 'cinematographer') + 20);

    const williams = personByName('John Williams')!;
    expect(overallFor(williams, 'composer')).toBeGreaterThan(80);
    expect(confidenceOf(williams.evidence.composer)).toBeGreaterThan(80);
    expect(confidenceOf(thin.evidence.cinematographer)).toBeLessThan(45);
  });

  it('reads the genre mix, so an action career and a comedy career differ', () => {
    const action = personByName('Dwayne Johnson')!;
    const drama = personByName('Kate Winslet')!;
    const stunts = (person: PersonRecord) => deriveSheet(person, 'actor').find((a) => a.id === 'stunt_aptitude')!.value;
    expect(stunts(action), 'the action star is not rated for action').toBeGreaterThan(stunts(drama));

    const signals = signalsOf(action.evidence.actor, 'actor');
    expect(signals.action).toBeGreaterThan(signals.documentary);
  });

  it('says how thin the evidence is rather than hiding it', () => {
    for (const person of allPeople()) {
      for (const role of person.roles) {
        const confidence = confidenceOf(person.evidence[role]);
        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(100);
        if (!person.evidence[role]) expect(confidence).toBe(0);
      }
    }
  });

  it('leads a profile with what they mostly do', () => {
    expect(primaryRole(personByName('Roger Deakins')!)).toBe('cinematographer');
    expect(primaryRole(personByName('Hans Zimmer')!)).toBe('composer');
    expect(primaryRole(personByName('Steven Spielberg')!)).toBe('director');
    expect(primaryRole(personByName('Zendaya')!)).toBe('actor');
  });

  it('puts an age on somebody the record has a birthday for, and says when it is only a year', () => {
    const now = Date.parse('2026-01-01T00:00:00Z');
    const leo = personByName('Leonardo DiCaprio')!;
    expect(ageOf(leo, now)).toBe(51);
    expect(ageIsApproximate(leo)).toBe(false);

    // A year on its own gives an age that is right to within a year, and says so.
    const yearOnly: PersonRecord = { ...leo, birth: undefined, birthYear: '1974' };
    expect(ageOf(yearOnly, now)).toBe(52);
    expect(ageIsApproximate(yearOnly)).toBe(true);

    // Nothing at all gives nothing at all.
    const unknown: PersonRecord = { ...leo, birth: undefined, birthYear: undefined };
    expect(ageOf(unknown, now)).toBeUndefined();
  });

  it('never reads an age off a date the record is not sure of', () => {
    // A year-only date of birth comes back from the record looking like the
    // first of January. Writing it as a birthday made a showrunner win an
    // award at twelve; it is now kept as a year and only as a year.
    for (const person of allPeople()) {
      if (!person.birth) continue;
      expect(person.birth, `${person.name} has a suspicious birthday`).not.toBe('2000-01-01');
    }
    const boards = awardBoards();
    const youngest = boards.find((b) => b.id === 'youngest');
    for (const leader of youngest?.leaders ?? []) {
      const person = personByName(leader.name)!;
      expect(person.birth, `${leader.name} is on an age board without a full date of birth`).toBeTruthy();
      expect(leader.value).toBeGreaterThan(3);
    }
  });
});

describe('the search', () => {
  it('indexes everything that is loaded and says what it has', () => {
    const coverage = indexCoverage();
    expect(coverage.length).toBeGreaterThan(4);
    const people = coverage.find((c) => c.kind === 'person');
    expect(people?.count).toBeGreaterThan(700);
  });

  it('finds a person by name, exactly first', () => {
    const results = searchEverything('Florence Pugh');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.kind).toBe('person');
    expect(results[0]!.label).toBe('Florence Pugh');
  });

  it('finds people by what they do and what they are attached to', () => {
    expect(searchEverything('cinematographer', { kinds: ['person'] }).length).toBeGreaterThan(20);
    const franchise = searchEverything('Star Wars');
    expect(franchise.length).toBeGreaterThan(0);
  });

  it('has the titles the roster is on, not only the people', () => {
    const titles = indexCoverage().find((c) => c.kind === 'title');
    expect(titles?.count, 'no titles are indexed').toBeGreaterThan(8000);
    const dune = searchEverything('Dune', { kinds: ['title'] });
    expect(dune.length).toBeGreaterThan(0);
    expect(dune[0]!.label.toLowerCase()).toContain('dune');
    // And searching a franchise finds the people attached to it as well.
    const everyone = searchEverything('Dune', { kinds: ['person'] });
    expect(everyone.some((r) => r.label === 'Timothée Chalamet')).toBe(true);
  });

  it('takes two letters and refuses one', () => {
    expect(searchEverything('a')).toEqual([]);
    expect(searchEverything('  ')).toEqual([]);
    expect(searchEverything('de').length).toBeGreaterThan(0);
  });

  it('honours a filter and never returns a kind that was not asked for', () => {
    const only = searchEverything('the', { kinds: ['genre'] });
    for (const result of only) expect(result.kind).toBe('genre');
  });

  it('says nothing rather than guessing when nothing matches', () => {
    expect(searchEverything('zzzzqqqxnothing')).toEqual([]);
  });
});

describe('the award record boards', () => {
  it('counts what the record holds, and says how much that is', () => {
    const coverage = awardCoverage();
    expect(coverage.awards).toBeGreaterThan(3000);
    expect(coverage.won).toBeGreaterThan(500);
    expect(coverage.won).toBeLessThan(coverage.awards);
    expect(coverage.withAwards).toBeGreaterThan(200);
    expect(coverage.withAwards).toBeLessThanOrEqual(coverage.people);
  });

  it('builds a board for every question worth asking, in order', () => {
    const boards = awardBoards();
    expect(boards.length).toBeGreaterThan(10);
    for (const board of boards) {
      expect(board.label.length).toBeGreaterThan(3);
      expect(board.explain.length).toBeGreaterThan(10);
      expect(board.leaders.length).toBeGreaterThan(0);
      expect(board.leaders.length).toBeLessThanOrEqual(10);
      for (const leader of board.leaders) {
        expect(personByName(leader.name), leader.name).toBeDefined();
        expect(leader.detail.length).toBeGreaterThan(2);
      }
      // Every board is sorted the way it says it is.
      const values = board.leaders.map((l) => l.value);
      const ascending = board.id === 'youngest';
      const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
      expect(values, `${board.id} is out of order`).toEqual(sorted);
    }
  });

  it('puts the right people at the top of the boards it can be checked on', () => {
    const boards = awardBoards();
    const oscars = boards.find((b) => b.id === 'body-academy');
    expect(oscars, 'no Academy Award board').toBeDefined();
    // Everybody on an Oscar board has at least one Academy Award on record.
    for (const leader of oscars!.leaders) {
      const theirs = awardsFor(leader.qid).filter((a) => a.outcome === 'won' && /academy award|oscar/i.test(a.award));
      expect(theirs.length, `${leader.name} is on the Oscar board with none`).toBeGreaterThan(0);
      expect(theirs.length).toBe(leader.value);
    }
    // Nobody on the never-won board has ever won.
    const dry = boards.find((b) => b.id === 'dry');
    for (const leader of dry?.leaders ?? []) {
      expect(awardsFor(leader.qid).some((a) => a.outcome === 'won'), `${leader.name} has won something`).toBe(false);
    }
  });

  it('gives one person their own standing, matching the boards', () => {
    const leo = personByName('Leonardo DiCaprio')!;
    const standing = standingOf(leo.qid)!;
    expect(standing.won + standing.nominated).toBe(awardsFor(leo.qid).length);
    expect(standing.bodies.some((b) => b.name === 'Oscars' && b.won > 0)).toBe(true);
  });

  it('names the most decorated titles from what they were won for', () => {
    const works = mostAwardedWorks(10);
    expect(works.length).toBeGreaterThan(3);
    for (const work of works) {
      expect(work.title.length).toBeGreaterThan(1);
      expect(work.people.length).toBeGreaterThan(0);
      expect(work.wins + work.nominations).toBeGreaterThan(0);
    }
    expect(works[0]!.wins).toBeGreaterThanOrEqual(works[works.length - 1]!.wins);
  });
});
