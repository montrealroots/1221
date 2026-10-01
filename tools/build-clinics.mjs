// Builds src/engine/content/clinics.ts from docs/research/world/research-health-visits.json
// (Stage 9 of docs/BACKLOG.md, from 2026-10-01): the named doctors, clinics,
// emergency departments and pharmacies of the business's towns, and the
// self-pay prices a provider of them publishes, or the middle of a range two
// sources disagree on, said to be an estimate.
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/engine/content/clinics.ts';
const j = JSON.parse(readFileSync('docs/research/world/research-health-visits.json', 'utf8'));

const clinics = j.providers.map((p) => ({
  id: p.id, name: p.name, cityId: p.cityId, kind: p.kind, address: p.address ?? null, neighborhood: p.neighborhood ?? null,
  url: p.url ?? null, confirmed: p.confirmed === true,
}));
const selfPay = {};
for (const v of j.visitPrices) {
  if (!v.providerId) continue;
  const amount = typeof v.amount === 'number' ? v.amount : Array.isArray(v.range) ? (v.range[0] + v.range[1]) / 2 : null;
  // A members-only price of nothing isn't a price for anybody else.
  if (amount === null || amount <= 0) continue;
  selfPay[v.providerId] = { amount, currency: v.currency, estimate: typeof v.amount !== 'number', service: v.service, source: v.source ?? null };
}

const body = `/**
 * SLATE — named doctors, clinics, emergency departments and pharmacies
 * (Stage 9 of \`docs/BACKLOG.md\`), built by \`tools/build-clinics.mjs\` from
 * \`docs/research/world/research-health-visits.json\`. Don't edit by hand;
 * rebuild it.
 *
 * A provider's self-pay price is the one it publishes, or the middle of
 * the range two sources gave where they disagreed (\`estimate\`).
 */

export type ClinicKind = 'primary-care' | 'urgent-care' | 'walk-in' | 'emergency-department' | 'pharmacy' | 'pharmacy-clinic' | 'public-clinic';

export interface Clinic { id: string; name: string; cityId: string; kind: ClinicKind; address: string | null; neighborhood: string | null; url: string | null; confirmed: boolean }

export const CLINICS: readonly Clinic[] = ${JSON.stringify(clinics, null, 0).replace(/\},\{/g, '},\n  {')};

/** A provider's own self-pay price for a visit, in its money. */
export const SELF_PAY: Readonly<Record<string, { amount: number; currency: string; estimate: boolean; service: string; source: string | null }>> = ${JSON.stringify(selfPay, null, 0)};
`;
writeFileSync(OUT, body);
console.log('clinics', clinics.length, 'self-pay', Object.keys(selfPay).length, JSON.stringify(selfPay).slice(0, 300));
