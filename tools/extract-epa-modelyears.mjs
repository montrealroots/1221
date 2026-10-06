// Extracts, from the EPA's fueleconomy.gov dataset (https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip, the
// "vehicles.csv" inside), every model-year configuration of the American car models SLATE sells, into
// docs/research/catalog/epa-modelyears.json (from 2026-10-05). The full file is 22 MB and isn't kept; this extract
// is, with its read date. Run: node tools/extract-epa-modelyears.mjs <path to vehicles.csv>
//
// A SLATE model is matched to the EPA's by its make and base model (the EPA's "baseModel"), names compared without
// case, spaces or punctuation, through ALIASES where the two name it differently (the F-Series is the EPA's F150,
// F250 and the rest). What doesn't match is listed in the extract's `unmatched`, never guessed.
import { readFileSync, writeFileSync } from 'node:fs';

const CSV = process.argv[2];
if (!CSV) throw new Error('Give the path to the EPA vehicles.csv.');
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
/** SLATE's name for a model → the EPA's base models it covers, where they differ. */
const ALIASES = {
  'ford|fseries': ['F150', 'F150 Pickup', 'F150 Pickup 2WD', 'F150 Pickup 4WD'],
  'ram|ram': ['1500', 'Ram 1500', '1500 Pickup', 'RAM 1500'],
  'ram|1500': ['1500', 'Ram 1500'],
  'chevrolet|silverado': ['Silverado', 'Silverado C15', 'Silverado K15', 'Silverado 1500'],
  'gmc|sierra': ['Sierra', 'Sierra C15', 'Sierra K15', 'Sierra 1500'],
  'bmw|3series': ['3 Series'],
  'bmw|5series': ['5 Series'],
  'ram|pickup1500heavyduty': ['1500'],
  'mazda|mazda3': ['3'],
  'polestar|polestar2': ['2'], 'polestar|polestar3': ['3'], 'polestar|polestar4': ['4'],
};
/** SLATE's word → the EPA's, where they differ. */
const SAME_WORD = { ev: 'electric' };

// A small CSV reader: the EPA's file quotes fields with commas in them.
function rows(text) {
  const out = [];
  let field = '', row = [], quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false; } else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); out.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); out.push(row); }
  return out;
}

const [head, ...body] = rows(readFileSync(CSV, 'utf8'));
const col = Object.fromEntries(head.map((h, i) => [h, i]));
const get = (r, k) => r[col[k]];
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };

// SLATE's American models.
const src = readFileSync('src/engine/content/vehiclecatalog.ts', 'utf8');
const models = [...src.matchAll(/"id":\s*"(us-[^"]+)",[\s\S]*?"make":\s*"([^"]+)",\s*"model":\s*"([^"]+)"/g)].map((m) => ({ id: m[1], make: m[2], model: m[3] }));
const byKey = new Map();
for (const r of body) {
  if (!get(r, 'year')) continue;
  const key = `${norm(get(r, 'make'))}|${norm(get(r, 'baseModel') || get(r, 'model'))}`;
  (byKey.get(key) ?? byKey.set(key, []).get(key)).push(r);
}

const out = {};
const unmatched = [];
for (const m of models) {
  const key = `${norm(m.make)}|${norm(m.model)}`;
  const keys = (ALIASES[key] ?? [m.model, `${m.model}-Class`]).map((b) => `${norm(m.make)}|${norm(b)}`);
  let found = keys.flatMap((k) => byKey.get(k) ?? []);
  // A sub-model under the EPA's base name ("Range Rover Sport" under "Range Rover", "Wrangler 2 Door" under
  // "Wrangler", "Escalade ESV" under "Escalade"): the shorter base name, keeping the rows whose full model name
  // has the remaining words ("Door" as the EPA's "dr").
  const tokens = (s) => String(s).toLowerCase().replace(/(\d)\s*(?:-\s*)?(?:door|dr)\b/g, '$1door').split(/[^a-z0-9]+/).filter(Boolean);
  const literal = tokens(m.model);
  const synonyms = literal.map((w) => SAME_WORD[w] ?? w);
  const hasAll = (r, want) => { const have = new Set(tokens(get(r, 'model'))); return want.every((w) => have.has(w)); };
  for (const words of [literal, synonyms]) for (let k = words.length - 1; !found.length && k >= 1; k -= 1) {
    const base = words.slice(0, k).join(' ');
    const cands = [base, `${base}-Class`].flatMap((b) => byKey.get(`${norm(m.make)}|${norm(b)}`) ?? []);
    found = cands.filter((r) => hasAll(r, words.slice(k)));
  }
  // Last, any of the make's models whose full name has every word of SLATE's (MINI files its Hardtop under "Cooper").
  for (const words of [literal, synonyms]) if (!found.length) found = body.filter((r) => norm(get(r, 'make')) === norm(m.make) && get(r, 'year') && hasAll(r, words));
  // A match that stops before 2024 for a car on sale now has found an old name only (the RS 6 of 2003, the Escalade
  // ESV's to 2015): its later years are under the make's full model names, so those are taken too.
  if (found.length && Math.max(...found.map((r) => Number(get(r, 'year')))) < 2024) {
    const ids = new Set(found.map((r) => get(r, 'id')));
    const later = body.filter((r) => norm(get(r, 'make')) === norm(m.make) && get(r, 'year') && !ids.has(get(r, 'id')) && hasAll(r, literal));
    found = [...found, ...later];
  }
  if (!found.length) { unmatched.push(`${m.id} (${m.make} ${m.model})`); continue; }
  const configs = found.map((r) => {
    const mpg = num(get(r, 'comb08'));
    const kwh100mi = num(get(r, 'combE'));
    const fuel = get(r, 'atvType') === 'EV' ? 'ev' : get(r, 'atvType') === 'Plug-in Hybrid' ? 'phev' : get(r, 'atvType') === 'Hybrid' ? 'hybrid' : /diesel/i.test(get(r, 'fuelType1')) ? 'diesel' : 'petrol';
    return {
      epaId: Number(get(r, 'id')), year: Number(get(r, 'year')), model: get(r, 'model'), vclass: get(r, 'VClass'),
      displ: num(get(r, 'displ')), cylinders: num(get(r, 'cylinders')), transmission: get(r, 'trany') || null, drive: get(r, 'drive') || null,
      fuel, fuelType: get(r, 'fuelType1') || null, turbo: get(r, 'tCharger') === 'T', supercharged: get(r, 'sCharger') === 'S',
      per100km: fuel === 'ev' || !mpg ? null : Math.round((235.215 / mpg) * 10) / 10,
      kwhPer100km: kwh100mi ? Math.round((kwh100mi / 1.609344) * 10) / 10 : null,
      rangeKm: num(get(r, 'range')) ? Math.round(Number(get(r, 'range')) * 1.609344) : null,
    };
  }).sort((a, b) => a.year - b.year || a.epaId - b.epaId);
  out[m.id] = configs;
}
writeFileSync('docs/research/catalog/epa-modelyears.json', JSON.stringify({
  source: 'U.S. EPA and DOE, fueleconomy.gov, vehicles.csv (https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip)', read: '2026-10-05',
  note: 'Each American model SLATE sells, matched to the EPA\'s base model, every model year and configuration the EPA rated: engine, transmission, drive, fuel and its combined rating (mpg as liters a 100 km; an EV\'s kWh a 100 miles as a 100 km). The EPA rates a model year whether or not it\'s still on sale.',
  models: out, unmatched,
}));
const years = Object.values(out).flat();
console.log(`models ${models.length}, matched ${Object.keys(out).length}, unmatched ${unmatched.length}; configurations ${years.length}, years ${Math.min(...years.map((c) => c.year))}–${Math.max(...years.map((c) => c.year))}`);
console.log('unmatched sample:', unmatched.slice(0, 25).join('; '));
