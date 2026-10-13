/**
 * Defects, group g27, part 1 (from 2026-10-12).
 *
 * documents-tutorial-chapter-stale. Until 2026-10-12 the guide's “Passports And ID” chapter (`content/tutorial.ts`, id
 * `documents`) said two things the papers don't do. It said Report Lost “cancels a passport or anything else you hold”, though only
 * a passport, a license, an international driving permit and an ID card are reported lost (`LOSABLE`,
 * `systems/documents.ts`): a British student's F-1 is refused, a status not being lost with its paper (from
 * 2026-10-10). And it said a lost license “is replaced where it was issued for someone living there”, and nowhere else,
 * though a New Yorker at Yale replaces theirs from New Haven by mail, New York sending one out of state on its MV-44
 * (`licenseReplaceRefusal`, `systems/identity.ts`, from 2026-10-10). A Californian there is still refused.
 *
 * The chapter's words are in `content/tutorial.ts`, which this pass couldn't edit, so the two checks of the chapter
 * failed until they were corrected there on 2026-10-12. Each is held against the game on a played save, not against a sentence: let an
 * F-1 be reported lost, or take New York's mail service away, and the check turns the other way.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { documentsOf, type DocumentKind, type PersonDocument } from '@/engine/systems/documents';
import { CHAPTER_BY_ID } from '@/engine/content/tutorial';

const DOCUMENTS = CHAPTER_BY_ID['documents']!;
const YEAR = 365.25 * MS_DAY;

/** The chapter's sentences, its asides in brackets left out. */
function sentences(text: readonly string[]): string[] {
  return text.join(' ').replace(/\s*\([^)]*\)/g, '').split(/(?<=[.!?])\s+/);
}

/** A new life at Yale, born where `homeRegionId` says. */
const student = (seed: string, homeRegionId: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** The first of a few seeds whose student starts with a license from home (a US-born student holds one at the state's share). */
function withLicense(seedPrefix: string, homeRegionId: string): { sim: Simulation; license: PersonDocument } {
  for (let n = 0; n < 40; n++) {
    const sim = student(`${seedPrefix}-${n}`, homeRegionId);
    const license = documentsOf(sim.player).find((d) => d.kind === 'license' && d.status === 'valid');
    if (license) return { sim, license };
  }
  throw new Error(`No seed gave a student from ${homeRegionId} a license.`);
}

const reportLost = (sim: Simulation, doc: PersonDocument) => sim.execute({ kind: 'documents.report_lost', payload: { documentId: doc.id } }).ok;

/** What the papers a student holds do when they're reported lost: each kind taken, and each kind refused. */
function whatIsLost(): { taken: Set<DocumentKind>; refused: Set<DocumentKind> } {
  const taken = new Set<DocumentKind>();
  const refused = new Set<DocumentKind>();
  const tally = (doc: PersonDocument, ok: boolean) => (ok ? taken : refused).add(doc.kind);

  // JOURNEY: a British student at Yale holds a passport and the F-1 issued on it.
  const briton = student('g27-briton', 'uk-eng-london');
  const f1 = documentsOf(briton.player).find((d) => d.kind === 'visa' && d.name.startsWith('F-1'))!;
  const passport = documentsOf(briton.player).find((d) => d.kind === 'passport')!;
  expect(f1).toBeDefined();
  tally(f1, reportLost(briton, f1));
  tally(passport, reportLost(briton, passport));

  // JOURNEY: a New Yorker at Yale holds New York's license, and gets Connecticut's ID card over the counter.
  const { sim: newYorker, license } = withLicense('g27-lost', 'us-ny-newyork');
  tally(license, reportLost(newYorker, license));
  expect(newYorker.execute({ kind: 'documents.apply_idcard', payload: {} }).ok).toBe(true);
  const card = documentsOf(newYorker.player).find((d) => d.kind === 'idcard' && d.status === 'valid')!;
  tally(card, reportLost(newYorker, card));

  // LEGACY STATE: an international driving permit, which a save from before the scope reset of 2026-10-09 may hold;
  // no new life can apply for one since travel went.
  const legacy = student('g27-idp', 'us-ny-newyork');
  const idp: PersonDocument = { id: 'g27-idp', kind: 'idp', issuer: 'US', name: 'International Driving Permit', number: 'IDP1', status: 'valid', issuedAt: legacy.now - MS_DAY, expiresAt: legacy.now + YEAR };
  documentsOf(legacy.player).push(idp);
  tally(idp, reportLost(legacy, idp));
  return { taken, refused };
}

/** How the chapter has to name each kind it says Report Lost takes. */
const NAMED: Partial<Record<DocumentKind, RegExp>> = {
  passport: /\bpassport\b/i,
  license: /\blicen[cs]e\b/i,
  idp: /\binternational driving permit\b/i,
  idcard: /\bID card\b/i,
};

describe('documents-tutorial-chapter-stale: what Report Lost takes', () => {
  it('takes a passport, a license, an international driving permit and an ID card, and refuses an F-1', () => {
    const { taken, refused } = whatIsLost();
    expect([...taken].sort()).toEqual(['idcard', 'idp', 'license', 'passport']);
    expect([...refused]).toEqual(['visa']);
  });

  it('takes what the chapter says it takes', () => {
    const { taken, refused } = whatIsLost();
    const said = sentences(DOCUMENTS.body).filter((s) => /\bReport Lost\b/.test(s));
    expect(said.length).toBeGreaterThan(0);
    const text = said.join(' ');
    // A paper held that's refused can't be said to be taken with everything else; each kind taken has to be named.
    expect(/\banything\b|\beverything\b|\bany (paper|document)\b/i.test(text)).toBe(refused.size === 0);
    for (const kind of taken) expect(text).toMatch(NAMED[kind]!);
  });
});

describe('documents-tutorial-chapter-stale: where a lost license is replaced', () => {
  /** Whether a New Yorker's license, lost in New Haven, is replaced from there, and a Californian's is refused. */
  function fromNewHaven(): { newYork: boolean; california: boolean } {
    const ny = withLicense('g27-ny', 'us-ny-newyork');
    expect(ny.license.issuer).toBe('us-ny');
    expect(reportLost(ny.sim, ny.license)).toBe(true);
    const newYork = ny.sim.execute({ kind: 'documents.replace_license', payload: { documentId: ny.license.id } }).ok;
    const ca = withLicense('g27-ca', 'us-ca-losangeles');
    expect(ca.license.issuer).toBe('us-ca');
    expect(reportLost(ca.sim, ca.license)).toBe(true);
    const california = ca.sim.execute({ kind: 'documents.replace_license', payload: { documentId: ca.license.id } }).ok;
    return { newYork, california };
  }

  it('is replaced by mail from New York, and not from California', () => {
    expect(fromNewHaven()).toEqual({ newYork: true, california: false });
  });

  it('is replaced where the chapter says it is', () => {
    const { newYork, california } = fromNewHaven();
    const said = sentences(DOCUMENTS.body).filter((s) => /\blost license\b/i.test(s));
    expect(said.length).toBeGreaterThan(0);
    const text = said.join(' ');
    // An issuer that sends one out of state has to be said to, and one that doesn't keeps the condition of living there.
    expect(/\bby mail\b|\bout of state\b/i.test(text)).toBe(newYork);
    if (!california) expect(text).toMatch(/\bliving there\b/i);
  });
});
