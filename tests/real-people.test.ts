/**
 * Going to somebody real.
 *
 * What is being checked here is the seam between two things that must never be
 * confused. On one side is the public record: a name, a date of birth, a body
 * of work. On the other is the save: a quote, an answer, a contract. The record
 * crosses into the save once, is never edited by it, and nothing that happens
 * inside the save is a claim about the person.
 *
 * The other half is the promise the whole engine is built on: a retry must
 * never produce a second contract, a second booking, a second credit, or turn
 * a no into a yes by asking the same question again.
 */

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { commissionProject } from '@/engine/systems/zeitgeist';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, Project, Role } from '@/engine/domain/model';
import {
  addPeople, addPeopleAwards, addPeopleCredits, allPeople, ageOf, creditsFor, overallFor,
  peopleInRole, primaryRole, rolesWithSheets,
} from '@/engine/content/people';
import {
  approachSummary, candidatesFor, considerApproach, countryIdForRecord, demandOf,
  ensureRealPerson, personForRecord, quoteFor, recordForPerson,
} from '@/engine/systems/real-people';
import { CRAFT_ROLES, type CraftRole } from '@/engine/content/craft-attributes';
import { suggestedBudget } from '@/engine/systems/film';

beforeAll(() => {
  addPeople(readFileSync('public/industry/people.tsv', 'utf8'));
  addPeopleCredits(readFileSync('public/industry/people-credits.tsv', 'utf8'));
  addPeopleAwards(readFileSync('public/industry/people-awards.tsv', 'utf8'));
});

interface Picture {
  sim: Simulation;
  projectId: Id;
  companyId: Id;
  run: <R>(kind: string, payload: Record<string, unknown>) => R;
  try: <R>(kind: string, payload: Record<string, unknown>) => { ok: boolean; error?: string; value?: R };
}

/** A funded picture of the player's, with a part written and open. */
function aPicture(seed: string, options: { format?: string; genres?: string[] } = {}): Picture {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown>): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  const attempt = <R>(kind: string, payload: Record<string, unknown>) => sim.execute<R>({ kind, payload });

  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  run('sandbox.add_funds', { amount: 900_000_000_00 });
  run('sandbox.max_attributes', {});

  const { companyId } = run<{ companyId: Id }>('co.found', {
    structure: 'c_corp', kind: 'production', name: 'Halyard Pictures',
    initialCapital: 400_000_000_00,
  });

  const format = options.format ?? 'feature';
  const genres = options.genres ?? ['drama', 'thriller'];
  const { projectId } = run<{ projectId: Id }>('film.create_project', {
    title: 'Slack Water', format, genres,
    logline: 'A harbour pilot has one night to keep a ship off the rocks.',
    companyId,
  });
  run('film.acquire_rights', {
    projectId, title: 'Slack Water', sourceKind: 'original',
    acquisitionKind: 'original', cost: 0, holderId: companyId, holderKind: 'company',
  });
  run('film.write_draft', { projectId, daysSpent: 40 });
  run('film.write_draft', { projectId, daysSpent: 30 });

  const project = sim.universe.projects[projectId] as Project;
  const draft = project.currentDraftId ? sim.universe.scriptDrafts[project.currentDraftId] : undefined;
  const budget = suggestedBudget(format as never, genres, draft?.quality ?? 70);

  // The greenlight is a decision and can come back no; this test is not about
  // that decision, so it is asked until the company says yes.
  let decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget, companyId });
  let attempts = 1;
  while (!decision.greenlit && attempts < 10) {
    run('film.write_draft', { projectId, daysSpent: 30 });
    decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget, companyId });
    attempts++;
  }
  if (!decision.greenlit) throw new Error('the picture never got a greenlight');

  run('film.arrange_financing', {
    projectId, sources: [{ kind: 'company', amount: budget, name: 'Halyard Pictures' }],
  });

  return { sim, projectId, companyId, run, try: attempt };
}

/** A part written for the age somebody actually is. */
function aPartFor(picture: Picture, qid: string, billing = 'lead'): Id {
  const record = allPeople().find((person) => person.qid === qid);
  if (!record) throw new Error(`${qid} is not on the record`);
  const age = ageOf(record, picture.sim.now) ?? 40;
  return picture.run<{ roleId: Id }>('cast.create_role', {
    projectId: picture.projectId,
    characterName: 'The Pilot',
    billing,
    description: 'The one who has to bring her in.',
    ageRange: [Math.max(18, age - 5), age + 5],
  }).roleId;
}

/** The best-known actor on the record, so the test is not about an obscurity. */
function aBigActor(): string {
  const ranked = peopleInRole('actor').sort((a, b) => overallFor(b, 'actor') - overallFor(a, 'actor'));
  const first = ranked[0];
  if (!first) throw new Error('the roster has no actors');
  return first.qid;
}

describe('what somebody is worth', () => {
  it('prices every trade inside its own floor and ceiling, never outside it', () => {
    const ceiling: Record<CraftRole, number> = {
      actor: 20_000_000_00, director: 15_000_000_00, producer: 8_000_000_00,
      showrunner: 6_000_000_00, cinematographer: 1_800_000_00, composer: 2_000_000_00,
    };
    for (const role of CRAFT_ROLES) {
      const people = peopleInRole(role);
      expect(people.length, role).toBeGreaterThan(0);
      for (const person of people) {
        const quote = quoteFor(person, role);
        expect(quote, `${person.name} as ${role}`).toBeGreaterThan(0);
        expect(quote, `${person.name} as ${role}`).toBeLessThanOrEqual(ceiling[role]);
        expect(Number.isInteger(quote), `${person.name} quotes in fractions of a cent`).toBe(true);
      }
    }
  });

  it('asks more for the people whose work is bigger', () => {
    const actors = peopleInRole('actor');
    const ranked = [...actors].sort((a, b) => overallFor(b, 'actor') - overallFor(a, 'actor'));
    const top = ranked.slice(0, 40);
    const bottom = ranked.slice(-40);
    const mean = (rows: typeof actors) => rows.reduce((sum, p) => sum + quoteFor(p, 'actor'), 0) / rows.length;
    expect(mean(top)).toBeGreaterThan(mean(bottom) * 3);
  });

  it('gives the same answer every time it is asked', () => {
    for (const person of peopleInRole('actor').slice(0, 60)) {
      expect(quoteFor(person, 'actor')).toBe(quoteFor(person, 'actor'));
      expect(demandOf(person, 'actor')).toBe(demandOf(person, 'actor'));
    }
  });
});

describe('bringing somebody into a save', () => {
  it('brings them in once, however many times it is asked', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'bring-in-once');
    const qid = aBigActor();
    const first = ensureRealPerson(sim, qid);
    expect(first).toBeDefined();
    const before = Object.keys(sim.universe.people).length;
    for (let i = 0; i < 5; i++) expect(ensureRealPerson(sim, qid)?.id).toBe(first?.id);
    expect(Object.keys(sim.universe.people).length).toBe(before);
    expect(personForRecord(sim, qid)?.id).toBe(first?.id);
    expect(recordForPerson(first!)?.qid).toBe(qid);
  });

  it('carries the record across without editing it', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'carry-record');
    for (const record of peopleInRole('actor').slice(0, 25)) {
      const person = ensureRealPerson(sim, record.qid);
      expect(person, record.name).toBeDefined();
      expect(person!.displayName).toBe(record.name);
      expect(person!.recordQid).toBe(record.qid);
      expect(person!.isPlayer).toBe(false);
      // The record says nothing about how anybody wishes to be addressed, so
      // the game does not guess.
      expect(person!.pronouns).toBe('they/them');
      const age = ageOf(record, sim.now);
      if (age !== undefined) {
        const inSave = Math.floor((sim.now - person!.birthInstant) / (365.25 * 86_400_000));
        expect(Math.abs(inSave - age), record.name).toBeLessThanOrEqual(1);
      }
    }
  });

  it('scores everybody inside the range the rest of the game uses', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'ranges');
    for (const record of allPeople().slice(0, 120)) {
      const person = ensureRealPerson(sim, record.qid);
      if (!person) continue;
      for (const [key, value] of Object.entries(person.attributes)) {
        expect(value, `${record.name} ${key}`).toBeGreaterThanOrEqual(0);
        expect(value, `${record.name} ${key}`).toBeLessThanOrEqual(100);
      }
      for (const [key, value] of Object.entries(person.reputation)) {
        expect(value, `${record.name} ${key}`).toBeGreaterThanOrEqual(0);
        expect(value, `${record.name} ${key}`).toBeLessThanOrEqual(100);
      }
      expect(person.quote).toBeGreaterThan(0);
    }
  });

  it('refuses a name that is not on the record', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'no-such');
    expect(ensureRealPerson(sim, 'Q000000000')).toBeUndefined();
  });
});

describe('offering a part to somebody real', () => {
  it('makes exactly one contract, one credit and one booking on a yes', () => {
    const picture = aPicture('offer-once');

    // Nobody can be bought at any price — that is the point of the model, and
    // three refusals ends the conversation. So the test goes down the list
    // until somebody says yes, which is what a producer actually does.
    const shortlist = peopleInRole('actor')
      .sort((a, b) => overallFor(b, 'actor') - overallFor(a, 'actor'))
      .slice(0, 12);
    let qid = '';
    let roleId = '';
    let result: { ok: boolean; error?: string; value?: { accepted: boolean; contractId?: Id } } | undefined;
    for (const candidate of shortlist) {
      qid = candidate.qid;
      roleId = aPartFor(picture, qid);
      let raise = 3;
      result = picture.try<{ accepted: boolean; contractId?: Id }>(
        'cast.offer_real', { roleId, qid, amount: quoteFor(candidate, 'actor') * raise },
      );
      while (result.ok && result.value && !result.value.accepted && raise < 12) {
        raise *= 2;
        result = picture.try('cast.offer_real', { roleId, qid, amount: quoteFor(candidate, 'actor') * raise });
      }
      if (result.ok && result.value?.accepted) break;
    }
    expect(result?.ok, result?.error).toBe(true);
    expect(result?.value?.accepted, 'not one of twelve leading actors would take a funded picture').toBe(true);

    const role = picture.sim.universe.roles[roleId] as Role;
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const personId = personForRecord(picture.sim, qid)!.id;

    expect(role.status).toBe('cast');
    expect(role.castPersonId).toBe(personId);
    expect(role.contractId).toBeDefined();
    expect(project.castIds.filter((id) => id === personId).length).toBe(1);
    const contracts = Object.values(picture.sim.universe.contracts)
      .filter((c) => c.projectId === project.id && c.partyBId === personId);
    expect(contracts.length).toBe(1);
    const credits = project.credits.filter((c) => c.personId === personId);
    expect(credits.length).toBe(1);
    const attachments = project.attachments.filter((a) => a.personId === personId);
    expect(attachments.length).toBe(1);
  });

  it('reads back the answer rather than rolling a new one, however many times it is retried', () => {
    const picture = aPicture('offer-retry');
    const qid = aBigActor();
    const roleId = aPartFor(picture, qid);
    const record = allPeople().find((p) => p.qid === qid)!;
    const amount = quoteFor(record, 'actor') * 6;

    const first = picture.try<{ accepted: boolean; contractId?: Id }>('cast.offer_real', { roleId, qid, amount });
    expect(first.ok, first.error).toBe(true);
    const accepted = first.value!.accepted;

    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const personId = personForRecord(picture.sim, qid)!.id;
    const contractsAfterFirst = Object.values(picture.sim.universe.contracts).filter((c) => c.partyBId === personId).length;
    const creditsAfterFirst = project.credits.filter((c) => c.personId === personId).length;

    for (let i = 0; i < 6; i++) {
      const again = picture.try<{ accepted: boolean }>('cast.offer_real', { roleId, qid, amount });
      if (accepted) {
        // A yes is read back, never re-run.
        expect(again.ok).toBe(true);
        expect(again.value?.accepted).toBe(true);
      } else {
        // A no at the same money is not an offer at all.
        expect(again.ok).toBe(false);
        expect(again.error).toMatch(/passed|at least/i);
      }
    }

    expect(Object.values(picture.sim.universe.contracts).filter((c) => c.partyBId === personId).length)
      .toBe(contractsAfterFirst);
    expect(project.credits.filter((c) => c.personId === personId).length).toBe(creditsAfterFirst);
    expect(project.castIds.filter((id) => id === personId).length).toBeLessThanOrEqual(1);
  });

  it('will not take the same money twice, and gives up after three asks', () => {
    // Somebody who will almost certainly pass on a nothing picture, so the
    // test exercises the refusal path rather than the booking path.
    const picture = aPicture('offer-nag');
    const qid = aBigActor();
    const roleId = aPartFor(picture, qid);
    const record = allPeople().find((p) => p.qid === qid)!;

    let amount = Math.round(quoteFor(record, 'actor') * 0.15);
    let asks = 0;
    let refusedForNagging = false;
    for (let i = 0; i < 6; i++) {
      const result = picture.try<{ accepted: boolean }>('cast.offer_real', { roleId, qid, amount });
      if (result.ok && result.value?.accepted) break;
      if (!result.ok && /nuisance/i.test(result.error ?? '')) { refusedForNagging = true; break; }
      if (!result.ok) {
        // A repeat at the same money is refused before anything is recorded.
        expect(result.error).toMatch(/at least/i);
        amount = Math.round(amount * 1.2);
        continue;
      }
      asks++;
      amount = Math.round(amount * 1.2);
    }
    const role = picture.sim.universe.roles[roleId] as Role;
    expect(role.offers?.length ?? 0).toBeLessThanOrEqual(3);
    expect(asks + (refusedForNagging ? 1 : 0)).toBeGreaterThan(0);

    // Every offer is on the record with what was said and what was wanted.
    for (const offer of role.offers ?? []) {
      expect(offer.name).toBe(record.name);
      expect(offer.recordQid).toBe(qid);
      expect(offer.amount).toBeGreaterThan(0);
      expect(offer.wanted).toBeGreaterThan(0);
      expect(offer.reason.length).toBeGreaterThan(3);
      expect(['accepted', 'declined']).toContain(offer.answer);
    }
  });

  it('refuses a part somebody is the wrong age for, off their real date of birth', () => {
    const picture = aPicture('offer-age');
    const qid = aBigActor();
    const record = allPeople().find((p) => p.qid === qid)!;
    const age = ageOf(record, picture.sim.now);
    if (age === undefined) return;

    const roleId = picture.run<{ roleId: Id }>('cast.create_role', {
      projectId: picture.projectId, characterName: 'The Child', billing: 'supporting',
      description: 'Nine years old.', ageRange: [7, 11],
    }).roleId;
    const result = picture.try('cast.offer_real', { roleId, qid, amount: 5_000_000_00 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/written for 7 to 11/);
  });

  it('will not cast one person in two parts in the same picture', () => {
    const picture = aPicture('offer-twice');
    const qid = aBigActor();
    const record = allPeople().find((p) => p.qid === qid)!;
    const amount = quoteFor(record, 'actor') * 12;

    const firstRole = aPartFor(picture, qid);
    const first = picture.try<{ accepted: boolean }>('cast.offer_real', { roleId: firstRole, qid, amount });
    if (!first.ok || !first.value?.accepted) return; // The refusal path is covered above.

    const secondRole = aPartFor(picture, qid, 'supporting');
    const second = picture.try('cast.offer_real', { roleId: secondRole, qid, amount });
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/already in this picture/i);
  });

  it('refuses a picture that is not yours', () => {
    const picture = aPicture('offer-not-yours');
    const qid = aBigActor();
    const roleId = aPartFor(picture, qid);
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    project.createdById = 'someone-else';
    project.ownerCompanyId = undefined;
    const result = picture.try('cast.offer_real', { roleId, qid, amount: 1_000_000_00 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not your picture/i);
  });

  it('will not offer an acting part to somebody with no acting on the record', () => {
    const picture = aPicture('offer-not-an-actor');
    const notAnActor = allPeople().find((person) => !rolesWithSheets(person).includes('actor')
      && rolesWithSheets(person).length > 0);
    if (!notAnActor) return;
    const roleId = aPartFor(picture, aBigActor());
    const result = picture.try('cast.offer_real', { roleId, qid: notAnActor.qid, amount: 1_000_000_00 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not an actor on the record/i);
  });
});

describe('attaching a real craft', () => {
  it('attaches once, with a contract, and says so when asked again', () => {
    const picture = aPicture('attach-once');
    // A director can pass three times and then the conversation is over, so
    // the test works down a shortlist rather than assuming the first one says
    // yes at any price.
    const shortlist = peopleInRole('director')
      .sort((a, b) => overallFor(b, 'director') - overallFor(a, 'director'))
      .slice(0, 14);
    let director = shortlist[0]!;
    let amount = 0;
    let result: { ok: boolean; error?: string; value?: { attached: boolean; contractId?: Id } } | undefined;
    for (const candidate of shortlist) {
      director = candidate;
      let raise = 3;
      amount = quoteFor(candidate, 'director') * raise;
      result = picture.try<{ attached: boolean; contractId?: Id }>(
        'film.approach_real', { projectId: picture.projectId, qid: candidate.qid, role: 'director', amount },
      );
      while (result.ok && result.value && !result.value.attached && raise < 12) {
        raise *= 2;
        amount = quoteFor(candidate, 'director') * raise;
        result = picture.try('film.approach_real', { projectId: picture.projectId, qid: candidate.qid, role: 'director', amount });
      }
      if (result.ok && result.value?.attached) break;
    }
    expect(result?.ok, result?.error).toBe(true);
    expect(result?.value?.attached, 'not one of fourteen leading directors would take a funded picture').toBe(true);
    expect(result?.value?.contractId, 'a funded picture papers the deal').toBeDefined();

    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const personId = personForRecord(picture.sim, director.qid)!.id;
    expect(project.directorId).toBe(personId);
    expect(project.attachments.filter((a) => a.personId === personId && a.role === 'director').length).toBe(1);

    // Asking again says it is already done rather than doing it twice.
    for (let i = 0; i < 4; i++) {
      const again = picture.try<{ attached: boolean }>('film.approach_real', {
        projectId: picture.projectId, qid: director.qid, role: 'director', amount,
      });
      expect(again.ok).toBe(true);
      expect(again.value?.attached).toBe(true);
    }
    expect(project.attachments.filter((a) => a.personId === personId).length).toBe(1);
    expect(Object.values(picture.sim.universe.contracts).filter((c) => c.partyBId === personId).length).toBe(1);
  });

  it('keeps one person in each chair', () => {
    const picture = aPicture('attach-chair');
    const directors = peopleInRole('director').sort((a, b) => overallFor(b, 'director') - overallFor(a, 'director'));
    const first = directors[0]!;
    const second = directors[1]!;

    let amount = quoteFor(first, 'director') * 6;
    let result = picture.try<{ attached: boolean }>('film.approach_real', {
      projectId: picture.projectId, qid: first.qid, role: 'director', amount,
    });
    let raise = 6;
    while (result.ok && result.value && !result.value.attached && raise < 48) {
      raise *= 2;
      amount = quoteFor(first, 'director') * raise;
      result = picture.try('film.approach_real', { projectId: picture.projectId, qid: first.qid, role: 'director', amount });
    }
    if (!result.value?.attached) return;

    const taken = picture.try('film.approach_real', {
      projectId: picture.projectId, qid: second.qid, role: 'director', amount: quoteFor(second, 'director') * 6,
    });
    expect(taken.ok).toBe(false);
    expect(taken.error).toMatch(/already has that chair/i);
  });

  it('will not put a showrunner on a film', () => {
    const picture = aPicture('attach-showrunner');
    const showrunner = peopleInRole('showrunner')[0];
    if (!showrunner) return;
    const result = picture.try('film.approach_real', {
      projectId: picture.projectId, qid: showrunner.qid, role: 'showrunner', amount: 3_000_000_00,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/only a series has a showrunner/i);
  });

  it('will not attach somebody to a craft they have never worked in', () => {
    const picture = aPicture('attach-wrong-craft');
    const actorOnly = peopleInRole('actor').find((person) => rolesWithSheets(person).length === 1);
    if (!actorOnly) return;
    const result = picture.try('film.approach_real', {
      projectId: picture.projectId, qid: actorOnly.qid, role: 'cinematographer', amount: 500_000_00,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no cinematographer work on the record/i);
  });
});

describe('the reasons behind an answer', () => {
  it('shows the player everything they could know and hides what they could not', () => {
    const picture = aPicture('reasons');
    const record = peopleInRole('actor')[0]!;
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const answer = considerApproach(picture.sim, record, project, 'actor', quoteFor(record, 'actor'));

    expect(answer.reasons.length).toBeGreaterThan(4);
    expect(answer.probability).toBeGreaterThan(0);
    expect(answer.probability).toBeLessThanOrEqual(0.95);
    expect(answer.roll).toBeGreaterThanOrEqual(0);
    expect(answer.roll).toBeLessThan(1);
    // Exactly one thing is hidden: what else is on their desk. Everything else
    // is something the player is entitled to see.
    const hidden = answer.reasons.filter((factor) => !factor.knowable);
    expect(hidden.length).toBe(1);
    expect(hidden[0]?.label).toBe('What Else Is On Their Desk');
    for (const factor of answer.reasons) {
      expect(factor.label[0], factor.label).toBe(factor.label[0]?.toUpperCase());
      expect(factor.detail.length).toBeGreaterThan(4);
    }
  });

  it('gives the same answer for the same ask and a fresh one for a better offer', () => {
    const picture = aPicture('reasons-stable');
    const record = peopleInRole('actor')[0]!;
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    const quote = quoteFor(record, 'actor');

    const a = considerApproach(picture.sim, record, project, 'actor', quote);
    const b = considerApproach(picture.sim, record, project, 'actor', quote);
    expect(b.roll).toBe(a.roll);
    expect(b.interested).toBe(a.interested);

    // Coming back with real money is a different question, and is allowed to
    // get a different answer.
    const raised = considerApproach(picture.sim, record, project, 'actor', quote * 4, 1);
    expect(raised.probability).not.toBe(a.probability);
    expect(raised.seed).not.toBe(a.seed);
  });

  it('is likelier to get a yes with more money on the table', () => {
    const picture = aPicture('reasons-money');
    const project = picture.sim.universe.projects[picture.projectId] as Project;
    for (const record of peopleInRole('actor').slice(0, 30)) {
      const quote = quoteFor(record, 'actor');
      const low = considerApproach(picture.sim, record, project, 'actor', Math.round(quote * 0.3));
      const high = considerApproach(picture.sim, record, project, 'actor', quote * 2);
      expect(high.probability, record.name).toBeGreaterThan(low.probability);
    }
  });
});

describe('the search behind the room', () => {
  it('finds people by name, by a title they are in, and by a franchise', () => {
    const byName = candidatesFor('actor', { query: 'zendaya' });
    expect(byName.length).toBeGreaterThan(0);
    expect(byName[0]?.name.toLowerCase()).toContain('zendaya');

    const byFranchise = candidatesFor('actor', { query: 'star wars', limit: 200 });
    expect(byFranchise.length).toBeGreaterThan(0);

    const byTitle = candidatesFor('director', { query: 'inception', limit: 200 });
    expect(byTitle.length).toBeGreaterThan(0);
  });

  it('only offers people who have actually worked in that trade', () => {
    for (const role of CRAFT_ROLES) {
      const rows = candidatesFor(role, { limit: 200 });
      expect(rows.length, role).toBeGreaterThan(0);
      for (const person of rows) expect(rolesWithSheets(person), person.name).toContain(role);
    }
  });

  it('puts the strongest first, and prices and demand come back with them', () => {
    const rows = candidatesFor('actor', { limit: 50 });
    for (let i = 1; i < rows.length; i++) {
      expect(overallFor(rows[i - 1]!, 'actor')).toBeGreaterThanOrEqual(overallFor(rows[i]!, 'actor'));
    }
    for (const person of rows) {
      const summary = approachSummary(person, 'actor');
      expect(summary.quote).toBeGreaterThan(0);
      expect(summary.demand).toBeGreaterThanOrEqual(5);
      expect(summary.demand).toBeLessThanOrEqual(99);
      expect(summary.standing).toBeGreaterThanOrEqual(0);
      expect(summary.confidence).toBeGreaterThanOrEqual(0);
      expect(summary.confidence).toBeLessThanOrEqual(100);
    }
  });

  it('reads a primary role for everybody it will offer', () => {
    for (const person of allPeople()) {
      const role = primaryRole(person);
      expect(CRAFT_ROLES, person.name).toContain(role);
    }
  });
});

describe('the world hires them too', () => {
  it('puts real names on some of what the world makes, and invents the rest', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'world-hires');
    for (let i = 0; i < 90; i++) commissionProject(sim, 'us', `w-${i}`);

    const madeHere = Object.values(sim.universe.projects).filter((p) => p.createdById !== sim.universe.playerId);
    expect(madeHere.length).toBeGreaterThan(40);

    const people = Object.values(sim.universe.people).filter((p) => !p.isPlayer);
    const real = people.filter((p) => p.recordQid);
    const invented = people.filter((p) => !p.recordQid);

    // Some of both, and neither one takes over. A world where every name is
    // real is a fantasy; a world where none is has no names in it at all.
    expect(real.length, 'the world hired nobody real').toBeGreaterThan(0);
    expect(invented.length, 'the world invented nobody').toBeGreaterThan(0);
    expect(real.length / people.length, 'the roster took over the world').toBeLessThan(0.7);

    // Everybody real came from the record and kept their name.
    for (const person of real) {
      const record = recordForPerson(person);
      expect(record, person.displayName).toBeDefined();
      expect(person.displayName).toBe(record!.name);
    }
  });

  it('hires people into their own country', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'world-country');
    for (const country of ['us', 'uk', 'fr', 'jp']) {
      for (let i = 0; i < 25; i++) commissionProject(sim, country, `${country}-${i}`);
    }
    for (const person of Object.values(sim.universe.people)) {
      if (!person.recordQid) continue;
      const record = recordForPerson(person);
      if (!record) continue;
      // Where they are from is the record's; the country they are placed in
      // has to agree with it.
      const theirs = countryIdForRecord(record);
      if (theirs) expect(person.citizenshipId, record.name).toBe(theirs);
    }
  });

  it('does not book one person onto everything at once', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'world-busy');
    for (let i = 0; i < 120; i++) commissionProject(sim, 'us', `busy-${i}`);

    // The cap is per capacity, because that is how the constraint is real: a
    // director shoots one thing at a time, and a producer who also directs is
    // carrying both loads rather than one shared one.
    const caps: [string, number, (p: Project) => (string | undefined)[]][] = [
      ['directing', 2, (p) => [p.directorId]],
      ['showrunning', 2, (p) => [p.showrunnerId]],
      ['producing', 4, (p) => p.producerIds],
      ['acting', 3, (p) => p.castIds],
    ];

    for (const [capacity, cap, of] of caps) {
      const live = new Map<string, number>();
      for (const project of Object.values(sim.universe.projects)) {
        if (project.phase === 'released' || project.phase === 'library' || project.phase === 'shelved') continue;
        for (const id of of(project)) if (id) live.set(id, (live.get(id) ?? 0) + 1);
      }
      for (const [id, count] of live) {
        const person = sim.universe.people[id];
        if (!person) continue;
        expect(count, `${person.displayName} is ${capacity} ${count} unreleased pictures at once`)
          .toBeLessThanOrEqual(cap);
      }
    }
  });

  it('keeps the record and the save as two separate things', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'two-layers');
    for (let i = 0; i < 40; i++) commissionProject(sim, 'us', `sep-${i}`);

    for (const person of Object.values(sim.universe.people)) {
      if (!person.recordQid) continue;
      const record = recordForPerson(person)!;
      // Nothing in the save writes back to the record.
      const credits = creditsFor(record.qid);
      for (const credit of credits) {
        expect(Object.values(sim.universe.projects).some((p) => p.title === credit.title && p.createdById !== undefined
          && p.catalogueQid === undefined && p.createdById === sim.universe.playerId), credit.title).toBe(false);
      }
      // And what the save gives them is the save's, kept on the person.
      expect(person.saveId).toBe(sim.universe.meta.id);
    }
  });
});
