/**
 * Defects, group r7 part 1 (from 2026-10-12): what Connecticut's DMV tells somebody without a Social Security number,
 * and a country's name as a document's page says it.
 *
 * The ID card's refusal told everyone without a number "You can, through work-study: apply for it on the Papers screen
 * first." That held for an F-1 student at school, the only one who reached it until g24 let a graduate on OPT through
 * the lawful-presence check the same day. For the graduate it was false: work-study ended with the program, and
 * `ssnRefusal` turns them away. A student who had applied already was told to apply too. Now only a student at school
 * is sent to Papers, one who applied is told the card is on its way, and anyone else is told SLATE won't issue it.
 *
 * A document's page (`ui/looks/papers.tsx`) named a country bare where a sentence wants its article: "It would let you
 * into United Kingdom", "It lets you work in United States", "United Kingdom issued it", "Issued on this passport, for
 * United Kingdom". It now says each as `theCountry` does, as `mayEnter` says a citizenship.
 *
 * PLAYER JOURNEYS play forward through commands; FIXTURES set a state by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { STARTING, documentsOf, type PersonDocument } from '@/engine/systems/documents';
import { f1Of, programEnd } from '@/engine/systems/permission';
import { idCardRefusal } from '@/engine/systems/identity';
import { ssnRefusal } from '@/engine/systems/taxid';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as lookAt } from '@/ui/looks/subject';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** FIXTURE: money posted in, for OPT's fee with premium processing. */
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });

const ASKED = 'The DMV asks for your Social Security number, or the SSA’s letter that you can’t have one.';
const TO_PAPERS = `${ASKED} You can, through work-study: apply for it on the Papers screen first.`;
const ON_ITS_WAY = `${ASKED} Yours is on its way.`;
const NOT_ISSUED = `${ASKED} SLATE issues the number only to an F-1 student at school, through work-study, and never the letter.`;

/**
 * A British student at Yale with no Social Security number; then, as a FIXTURE, graduated with her program ten days
 * ended (the F-1's end moved so, its grace after), which a played save reaches only after two years; then OPT, applied
 * for and granted through the commands.
 */
function graduateOnOpt(seed: string): Simulation {
  const sim = student(seed);
  tended(sim, at(2026, 9, 8, 19));
  expect(sim.player.ssn).toBeUndefined();
  const school = sim.player.school!;
  school.standing = 'graduated';
  school.endedAt = sim.now;
  f1Of(sim.player)!.expiresAt = sim.now - 10 * MS_DAY + STARTING.graceDays * MS_DAY;
  expect(programEnd(sim.player)).toBe(sim.now - 10 * MS_DAY);
  fund(sim, 5_000_00);
  const asked = sim.must<{ readyAt: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
  tended(sim, asked.readyAt + MS_HOUR);
  expect(sim.player.usOutOfStatus).toBeUndefined();
  return sim;
}

describe('PLAYER JOURNEY: the ID card’s Social Security line, for a student at school', () => {
  it('sends her to Papers while Papers would take her, then says the card is on its way, then lets her through', () => {
    const sim = student('r7-ssn-student');
    tended(sim, at(2026, 9, 8, 19));
    // What it promises, Papers keeps: the Social Security office would take her application now.
    expect(ssnRefusal(sim, sim.player)).toBeUndefined();
    expect(idCardRefusal(sim.player, sim.now)).toBe(TO_PAPERS);
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    // Applied for, it isn't to be applied for again: Papers says so too.
    expect(ssnRefusal(sim, sim.player)).toMatch(/You’ve applied/);
    expect(idCardRefusal(sim.player, sim.now)).toBe(ON_ITS_WAY);
    tended(sim, ssn.arrivesAt + MS_HOUR);
    expect(sim.player.ssn?.status).toBe('issued');
    expect(idCardRefusal(sim.player, sim.now)).toBeUndefined();
  }, 120_000);
});

describe('PLAYER JOURNEY: the ID card’s Social Security line, for a graduate on OPT without a number', () => {
  it('doesn’t send her to Papers, which turns her away, and the counter refuses her with the same words', () => {
    const sim = graduateOnOpt('r7-ssn-graduate');
    // Papers won't take her: work-study ended with the program.
    expect(ssnRefusal(sim, sim.player)).toMatch(/ends with the program/);
    expect(idCardRefusal(sim.player, sim.now)).toBe(NOT_ISSUED);
    expect(() => sim.must({ kind: 'documents.apply_idcard', payload: {} })).toThrow(NOT_ISSUED);
    expect(documentsOf(sim.player).some((d) => d.kind === 'idcard')).toBe(false);
  }, 120_000);

  it('says the same to somebody on a US permit alone, whom Papers turns away too', () => {
    const sim = graduateOnOpt('r7-ssn-permit');
    // FIXTURE: the F-1 taken off the record, so the OPT card in force is the only lawful presence she shows.
    const docs = documentsOf(sim.player);
    docs.splice(docs.indexOf(f1Of(sim.player)!), 1);
    expect(ssnRefusal(sim, sim.player)).toBeDefined();
    expect(idCardRefusal(sim.player, sim.now)).toBe(NOT_ISSUED);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// A country's name on a document's page
// ---------------------------------------------------------------------------

/** A New Yorker with no papers yet, so each test hands it exactly the ones it means. */
const life = (seed: string) => { const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed); sim.player.documents = []; return sim; };
/** The words a node shows. */
function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => text(n as ReactNode)).join('');
  if (!isValidElement(node)) return '';
  return text((node.props as { children?: ReactNode }).children);
}
const look = (sim: Simulation, id: string): Looked => {
  const found = resolveLook(sim, lookAt('document', id));
  if (!found || 'gone' in found) throw new Error(`document:${id} didn’t resolve`);
  return found;
};
const page = (sim: Simulation, id: string) => text(look(sim, id).body);
const YEAR = 365.25 * MS_DAY;

describe('FIXTURE: papers held from before 2026-10-09, and the country each names', () => {
  /** FIXTURE: a US passport in force, and on it an ETA for Britain and one for Australia, as a save from before 2026-10-09 holds. */
  function papers(sim: Simulation): { passport: PersonDocument; gb: PersonDocument; au: PersonDocument } {
    const passport: PersonDocument = { id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1234567', status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 9 * YEAR };
    const gb: PersonDocument = { id: 'eta-gb', kind: 'authorization', issuer: 'GB', name: 'ETA', number: 'E1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 2 * YEAR, destination: 'GB', passportId: passport.id };
    const au: PersonDocument = { id: 'eta-au', kind: 'authorization', issuer: 'AU', name: 'ETA', number: 'E2', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + YEAR, destination: 'AU', passportId: passport.id };
    documentsOf(sim.player).push(passport, gb, au);
    return { passport, gb, au };
  }

  it('says “the United Kingdom” where a sentence names it, and Australia bare', () => {
    const sim = life('r7-country');
    const { passport, gb, au } = papers(sim);
    const britain = page(sim, gb.id);
    expect(britain).toContain('The United Kingdom issued it on ');
    expect(britain).toMatch(/It would let you into the United Kingdom, and nothing else is missing for a week’s visit there\./);
    // Australia takes no article, and gets none.
    expect(page(sim, au.id)).toMatch(/Australia issued it on .*It would let you into Australia, and nothing else/);
    expect(page(sim, passport.id)).toContain('The United States');
    const details = (look(sim, passport.id).ways ?? []).map((w) => w.detail);
    expect(details).toContain('Issued on this passport, for the United Kingdom');
    expect(details).toContain('Issued on this passport, for Australia');
  });

  it('says it with the article in force elsewhere, not yet in force, and on a permit', () => {
    const sim = life('r7-country-more');
    const { gb } = papers(sim);
    // FIXTURE: issued on a passport since replaced, so a visit would still ask more.
    gb.passportId = 'pp-replaced';
    expect(page(sim, gb.id)).toMatch(/It’s in force for the United Kingdom, but a week’s visit there would still ask more: /);
    // FIXTURE: issued from tomorrow, so it isn't in force yet; the sentence opens on the country, capitalized.
    gb.issuedAt = sim.now + MS_DAY;
    expect(page(sim, gb.id)).toContain('The United Kingdom won’t let you in on it now.');
    // FIXTURE: a US permit to work, which an OPT card is.
    documentsOf(sim.player).push({ id: 'permit', kind: 'permit', issuer: 'US', name: 'Employment Authorization', number: 'IOE1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + YEAR, destination: 'US' });
    expect(page(sim, 'permit')).toMatch(/^The United States issued it on .*It lets you work in the United States\./);
  });
});
