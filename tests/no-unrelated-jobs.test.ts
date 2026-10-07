/**
 * No unrelated jobs (the master plan's §54.13, a guard from 2026-10-06): a
 * life in SLATE earns by performing, or by the drama school's own work, and
 * nothing else. Until then nothing pinned it, and a job of another trade
 * would have passed the gate.
 *
 * Two halves. Every part in `ROLES` is screen, stage or voice work under a
 * performers' union. And every income the engine posts is read from its
 * source: the money earned by work (`Acting`, `Residuals`, `Per Diem`,
 * `Wardrobe Allowance` from `systems/career.ts`; `Wages` from the drama
 * school's work-study and Summer Cabaret in `systems/school.ts`) comes from
 * those files only, a pay statement's `salary` category the same with the SAG
 * pension, and every other income is named here as not a job's: interest,
 * benefits, pensions, sales, insurance, rent and refunds. A new trade's pay
 * posts a new income, or posts wages from another file, and fails here.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROLES } from '@/engine/content/career';

const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : []; });
const SOURCES = files('src/engine').map((path) => ({ path: path.replace(/\\/g, '/'), text: readFileSync(path, 'utf8') }));

/** Money earned by work, and the only files that post it. */
const WORK: Readonly<Record<string, readonly string[]>> = {
  Acting: ['src/engine/systems/career.ts'],
  Residuals: ['src/engine/systems/career.ts'],
  'Per Diem': ['src/engine/systems/career.ts'],
  'Wardrobe Allowance': ['src/engine/systems/career.ts'],
  Wages: ['src/engine/systems/school.ts'],
};
/** Income that isn't a job's. */
const NOT_WORK = new Set([
  'Interest', 'Insurance Paid', 'Insurance Claims', 'Things Sold', 'Car Repossessed', 'Car Sold', 'Plane Repossessed', 'Plane Sold', 'Boat Repossessed', 'Boat Sold', 'Caravan Sold', 'Land Sold',
  'Tax Refund', 'Rent Received', 'Lodgers’ Rent', 'Farm Rent', 'Airline Compensation', 'Workers’ Compensation', 'Universal Credit', 'Unemployment Insurance', 'EI Benefits', 'SNAP',
  'Ontario Works', 'Income Assistance', 'Housing Assistance Payment', 'State Pension', 'State Pension (Ireland)', 'Social Security', 'Canada’s Pensions', 'Pensión para el Bienestar', 'IMSS Pension', 'Pension',
  'Scholarship', 'Parental Leave Pay', 'Child Support', 'Child Benefit', 'Charging Rewards', 'Card Rewards', 'Damage Kept From A Deposit',
]);
/** Where an income's name is worked out, not written: a housing benefit's own line (`systems/homebenefits.ts`). */
const COMPUTED = ['src/engine/systems/homebenefits.ts'];

describe('no unrelated jobs', () => {
  it('every part is screen, stage or voice work under a performers’ union', () => {
    const UNIONS = new Set(['sag', 'equity', 'equity-uk', 'irish-equity', 'anda', 'actra', 'caea']);
    expect(ROLES.length).toBeGreaterThan(40);
    for (const r of ROLES) {
      expect(['screen', 'stage', 'voice'], r.id).toContain(r.medium);
      expect(UNIONS.has(r.union), r.id).toBe(true);
    }
  });

  it('every income posted is a performer’s or the drama school’s pay, or not a job’s at all', () => {
    const seen = new Set<string>();
    for (const { path, text } of SOURCES) {
      for (const m of text.matchAll(/nominalAccount\('income', (.*?)\)\.id/g)) {
        const arg = m[1]!.trim();
        const named = /^'([^']*)'$/.exec(arg)?.[1];
        if (named === undefined) {
          // A name chosen between written ones, each checked as written; or worked out in a file named for it.
          const choices = [...arg.matchAll(/'([A-Z][^']*)'/g)].map((x) => x[1]!);
          if (choices.length === 0) { expect(COMPUTED, `${path}: ${arg}`).toContain(path); continue; }
          for (const c of choices) { seen.add(c); expect(NOT_WORK.has(c) || WORK[c]?.includes(path), `${path}: ${c}`).toBe(true); }
          continue;
        }
        seen.add(named);
        if (WORK[named]) expect(WORK[named], `${path} posts ${named}`).toContain(path);
        else expect(NOT_WORK.has(named), `${path} posts an income nobody has said isn’t a job’s: ${named}`).toBe(true);
      }
    }
    // The guard reads what it guards: each work income is posted somewhere.
    for (const name of Object.keys(WORK)) expect(seen.has(name), name).toBe(true);
  });

  it('a pay statement’s salary is acting’s, the drama school’s, or the actors’ pension', () => {
    const PAYS = ['src/engine/systems/career.ts', 'src/engine/systems/school.ts', 'src/engine/systems/pension.ts'];
    const posting = SOURCES.filter((f) => /category: 'salary'/.test(f.text) && f.path !== 'src/engine/core/ledger.ts').map((f) => f.path);
    expect(posting.sort()).toEqual([...PAYS].sort());
  });
});
