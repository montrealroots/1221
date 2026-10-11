/**
 * Where a return can be computed, nothing is left untaxed by omission (remaining-gaps pass, 2026-10-11). Until then
 * Indiana, the District and Oklahoma each had a city and no rule, four of New York City's boroughs paid no city tax, and
 * Philadelphia's, Columbus's, Portland's and Denver's local taxes were missing. Each US city in SLATE's tables is now
 * accounted for: its state taxed by a rule or with none, its local tax researched or confirmed absent, and every authority
 * that taxes it with researched collection rules. A new city or a new rule that isn't fails here.
 *
 * In play every life is a student in New Haven: a player's residence never changes and no command puts their work
 * abroad. The countries with cities and no income-tax rule are listed here as unreachable for residence or work in
 * play, and the source is read for anything that would change that.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CITIES } from '@/engine/content/geography';
import { INCOME_TAX_RULES, LOCAL_TAX, NO_LOCAL_TAX, DENVER_OPT, applyBrackets, resolveIncomeTaxLayers } from '@/engine/content/tax';
import { STATE_TAX } from '@/engine/content/statetax';
import { YALE_DRAMA } from '@/engine/content/school';
import { atSchool, defaultConfig } from '@/engine/world/bootstrap';

const all = (CITIES.all() as { id: string; parentId: string; countryId: string }[]);
const us = all.filter((c) => c.countryId === 'us');
const at2026 = Date.UTC(2026, 6, 1);

describe('every US city SLATE keeps', () => {
  it('has its state taxed by a researched rule, or explicitly by none', () => {
    for (const c of us) {
      const state = c.parentId;
      // Connecticut's is computed by its own schedule (`connecticutTax`), not from the table.
      if (state === 'us-ct') { expect(STATE_TAX['us-ct']).toBeDefined(); continue; }
      const rule = INCOME_TAX_RULES.filter((r) => r.jurisdictionCode === state.toUpperCase() && r.effectiveFrom <= at2026 && (r.effectiveTo === undefined || r.effectiveTo > at2026));
      expect(rule.length, `${c.id}: no rule for ${state}`).toBeGreaterThan(0);
      const taxes = rule.some((r) => r.kind !== 'none' && applyBrackets(50_000_00, r) > 0);
      if (taxes) expect(STATE_TAX[state as keyof typeof STATE_TAX], `${c.id}: ${state} taxes and has no collection rules`).toBeDefined();
      else expect(rule.every((r) => r.kind === 'none'), `${c.id}: ${state} takes nothing and isn't marked as no tax`).toBe(true);
    }
  });

  it('has its local tax researched, or confirmed absent', () => {
    for (const c of us) {
      const known = Boolean(LOCAL_TAX[c.id]) || NO_LOCAL_TAX.includes(c.id) || c.id === DENVER_OPT.cityId;
      expect(known, `${c.id}: its local tax is neither researched nor confirmed absent`).toBe(true);
      if (LOCAL_TAX[c.id]) {
        // A local tax has its rule at the city, and one the city collects has its own collection rules.
        expect(resolveIncomeTaxLayers(c.id, at2026).some((r) => r.jurisdictionCode.toLowerCase() === c.id), `${c.id}: no city rule`).toBe(true);
        if (LOCAL_TAX[c.id]!.collector === 'city') expect(STATE_TAX[c.id as keyof typeof STATE_TAX], `${c.id}: collects its own and has no rules`).toBeDefined();
      }
      if (NO_LOCAL_TAX.includes(c.id)) expect(resolveIncomeTaxLayers(c.id, at2026).length, `${c.id}: confirmed absent but taxed`).toBeLessThanOrEqual(2);
    }
  });

  it('every authority with collection rules has a lien, a non-filer’s letters, a plan, and its sources', () => {
    for (const [code, rules] of Object.entries(STATE_TAX)) {
      expect(rules.nonFiler.letters.length, code).toBeGreaterThan(0);
      expect(rules.plan.maxMonths, code).toBeGreaterThan(0);
      expect(rules.source.length, code).toBeGreaterThan(20);
      // Portland's collection steps name no lien; every other researched authority files one.
      if (code !== 'us-or-portland') expect(rules.lien, `${code}: no lien`).toBeDefined();
    }
  });
});

describe('where a player can live or work in play', () => {
  it('is New Haven: every new life begins at the School, wherever its birthplace', () => {
    for (const birth of ['us-in-indianapolis', 'cn-11-beijing', 'uk-eng-london', 'ng-25-lagos']) {
      expect(atSchool({ ...defaultConfig(), homeRegionId: birth, startLocationId: birth }).startLocationId).toBe(YALE_DRAMA.cityId);
    }
  });

  it('never moves: no engine code sets a person’s location after creation, and no paycheck in play is earned elsewhere', () => {
    const files: string[] = [];
    const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.ts$/.test(f)) files.push(p); } };
    walk('src/engine');
    const sets = files.filter((f) => /currentLocationId\s*=[^=]/.test(readFileSync(f, 'utf8')));
    expect(sets).toEqual([]);
    const paidElsewhere = files.filter((f) => /recordWages\([^)]*where:/.test(readFileSync(f, 'utf8')));
    expect(paidElsewhere).toEqual([]);
  });

  it('lists the countries with cities and no income-tax rule, which play can’t reach', () => {
    const countries = new Set(all.map((c) => c.countryId));
    const covered = new Set(INCOME_TAX_RULES.map((r) => r.jurisdictionCode.split('-')[0]!.toLowerCase().replace('gb', 'uk')));
    const uncovered = [...countries].filter((c) => !covered.has(c));
    // 231 of 246 when this was written; it only shrinks as countries are researched.
    expect(uncovered.length).toBeLessThanOrEqual(231);
    expect(uncovered).not.toContain('us');
  });
});
