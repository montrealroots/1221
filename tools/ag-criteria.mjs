/**
 * SLATE — the attributes' criteria judged from a baseline's measurements (from 2026-10-16, the integration pass: phase 2c's
 * close-out). `tools/ag-baseline.ts` measures; this applies each threshold as
 * docs/verification/attributes-genres-2026-10-16/acceptance-criteria.md wrote it, before any tuning, so a baseline taken
 * before a change and one taken after are judged by the same code. Until 2026-10-16 the verdicts were worked out by hand
 * from the baseline's figures (phase-2b.md §9). The criteria that are judged by reading the code (A4, A5, T1, O3, F1, F3),
 * or measured by a played tool (H3 `tools/brief-strategies.ts`, L1 to L3 `tools/brief-journeys.ts`, M2
 * `tools/mastery.ts --mode plan`, G2 `tools/genre-identity.ts`), are named with where they're measured, and not judged
 * here.
 *
 *   node tools/ag-criteria.mjs <ag-baseline.json> [--json]
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('node tools/ag-criteria.mjs <ag-baseline.json> [--json]'); process.exit(2); }
const a = JSON.parse(readFileSync(file, 'utf8'));
const out = [];
const put = (id, met, figure, threshold) => out.push({ id, met, figure, threshold });
const kinds = ['brief', 'scene', 'night', 'casting', 'coursework'];

// A1: each ability has a kind of work where +10 moves the whole 0.5 or more on average.
{
  const short = Object.entries(a.abilityEffects).filter(([, e]) => !kinds.some((k) => (e.byKind[k]?.mean ?? 0) >= 0.5)).map(([id]) => id);
  put('A1', short.length === 0, short.length ? `none at 0.5 for ${short.join(', ')}` : 'every ability at 0.5 or more on a kind of work', 'each of the 12 has a kind of work with a mean effect of 0.5 or more');
}
// A2: no two abilities' effects correlate at 0.9 or more.
put('A2', a.abilityCorrelation.over090 === 0, `highest ${a.abilityCorrelation.top[0].r} (${a.abilityCorrelation.top[0].a}, ${a.abilityCorrelation.top[0].b})`, 'no pair at 0.9 or more');
// A3: no ability moves 95% or more of the pieces with a cv under 0.30.
{
  const universal = Object.entries(a.abilityEffects).filter(([, e]) => e.all.movedShare >= 0.95 && (e.all.cvMoved ?? 1) < 0.3).map(([id]) => id);
  put('A3', universal.length === 0, universal.length ? `universal: ${universal.join(', ')}` : `the least spread among the widest: ${Object.entries(a.abilityEffects).filter(([, e]) => e.all.movedShare >= 0.95).map(([id, e]) => `${id} cv ${e.all.cvMoved}`).join(', ')}`, 'none moves 95% of pieces with cv under 0.30');
}
// T2(a): four hours of one exercise in a day at most half four different ones, in sessions' worth.
put('T2(a)', a.growth.sameExerciseFourHoursAsSessions <= a.growth.fourExercisesAsSessions / 2, `${a.growth.sameExerciseFourHoursAsSessions} sessions' worth against ${a.growth.fourExercisesAsSessions}`, 'at most half');
// T3(a) / H6: the deliberate gain an hour at 90 at least 25% of that at 30.
{ const g = a.growth.perHourDeliberate; put('T3(a)', g['90'] >= 0.25 * g['30'], `${g['90']} at 90 against ${g['30']} at 30 (${Math.round((100 * g['90']) / g['30'])}%)`, 'at least 25%'); }
// Techniques past mastery move nothing (the guarantee's form, `craft / MASTERED` capped).
put('T past 90', a.techniquePast90.moved === 0, `${a.techniquePast90.moved} of ${a.techniquePast90.pieces} moved`, '0');
// G4: at least 2 briefs and 4 readings for every genre; at least 3 reader behaviors in use.
{
  const g = a.genres;
  const behaviors = Object.keys(g.readerPlays ?? {}).filter((k) => !/none/.test(k)).length;
  put('G4', g.briefsPerGenre.min >= 2 && g.readingsPerGenre.min >= 4 && behaviors >= 3, `${g.briefsPerGenre.min} briefs, ${g.readingsPerGenre.min} readings at least; ${behaviors} reader behaviors`, '2 briefs and 4 readings a genre; 3 behaviors');
}
// G3: no actor best on more than half the genres; at least 4 actors best on 10 or more.
if (a.genres.winners) {
  const counts = Object.values(a.genres.winners);
  const max = Math.max(...counts);
  put('G3', max <= a.genres.genres / 2 && counts.filter((x) => x >= 10).length >= 4, `the most any actor is best on: ${max} of ${a.genres.genres}; ${counts.filter((x) => x >= 10).length} actors best on 10 or more`, 'at most half; at least 4 on 10 or more');
}
// G5: knowing a genre from 30 to 100 still changes a developing actor's take on its own briefs.
{
  const k = a.preparation.developingBriefsByGenreKnown;
  const at30 = k['0.3'] ?? k['0.25'], at100 = k['1'];
  if (at30 && at100) put('G5', at100.mean - at30.mean >= 0.1, `${at30.mean} at 30 known, ${at100.mean} at 100`, 'a change the screen shows (a tenth or more)');
}
// M1: every judged piece 100 at mastery, and no drawn case off it.
{
  const m = a.mastery;
  const all = m.briefs.at100 === m.briefs.cases && ['scene', 'night', 'casting', 'coursework'].every((k) => m[k].at100 === m[k].n) && m.drawnAtMasteryNot100 === 0;
  put('M1', all, `briefs ${m.briefs.at100} of ${m.briefs.cases}; scenes ${m.scene.at100} of ${m.scene.n}; nights ${m.night.at100} of ${m.night.n}; casting ${m.casting.at100} of ${m.casting.n}; coursework ${m.coursework.at100} of ${m.coursework.n}; drawn off 100: ${m.drawnAtMasteryNot100}`, 'every case 100');
  // M3: the mastered actor's own result with the partner never there, by the reader route the player controls.
  const r = m.classSceneMasteredPartnerNeverCameReaderRoute;
  if (r) put('M3', r.own.min === 100, `own ${r.own.min} to ${r.own.max} on ${r.n} scenes, the partner never coming`, '100, or a route the player controls');
  // O1 and O2: the own result doesn't move with the reader; the take together does, by 5 points on average.
  const rs = m.readerAgainstOwn ?? [];
  if (rs.length) {
    put('O1', rs.every((x) => x.own.sd === 0), rs.map((x) => `${x.reader}: own sd ${x.own.sd}`).join('; '), 'sd 0 across readers');
    const t = rs.map((x) => x.together.mean);
    put('O2', Math.max(...t) - Math.min(...t) >= 5, `together ${t.join(', ')}`, 'readers 5 points apart on average');
  }
}
// F2 as written (H1's figures): the named limit at least 2× the mean read ability, unread 0, and the largest gain in 80%.
{
  const f = a.feedback;
  const share = f.namedWasTheLargestGain / f.cases;
  const met = f.namedTrainedPlus20.mean >= 2 * f.meanReadAbilityPlus20.mean && f.unreadPlus20.max === 0 && share >= 0.8;
  put('F2 as written', met, `named ${f.namedTrainedPlus20.mean} against ${f.meanReadAbilityPlus20.mean} (${(f.namedTrainedPlus20.mean / f.meanReadAbilityPlus20.mean).toFixed(2)}×); unread ${f.unreadPlus20.max}; the largest gain in ${f.namedWasTheLargestGain} of ${f.cases} (${(100 * share).toFixed(1)}%)`, '2×; 0; 80%');
}
// H2: no actor best on more than half the pieces of any kind with 30 or more.
{
  const over = kinds.filter((k) => a.bestAllocation[k] && Object.values(a.bestAllocation[k]).reduce((s, x) => s + x, 0) >= 30).map((k) => { const n = Object.values(a.bestAllocation[k]).reduce((s, x) => s + x, 0); const top = Object.entries(a.bestAllocation[k]).sort((x, y) => y[1] - x[1])[0]; return { k, n, top }; });
  const fails = over.filter((x) => x.top[1] > x.n / 2);
  put('H2', fails.length === 0, over.map((x) => `${x.k}: ${x.top[0]} ${x.top[1]} of ${x.n}`).join('; '), 'at most half of any kind with 30 or more');
}
// H4: each specialist ahead on 60% of the pieces where its ability reads most, for 10 of 12.
{
  const s = Object.entries(a.specialists).map(([id, x]) => ({ id, share: x.aheadOnSuitable / x.suitable }));
  const met = s.filter((x) => x.share >= 0.6);
  put('H4', met.length >= 10, `${met.length} of 12: ${s.map((x) => `${x.id} ${(100 * x.share).toFixed(1)}%`).join(', ')}`, '60% for 10 of 12');
}
// H5: the even actor ahead of half the specialists on 50% of pieces; within a point of the best on 10%.
{
  const g = a.generalist;
  const n = kinds.reduce((s, k) => s + (g[k]?.n ?? 0), 0);
  const ahead = kinds.reduce((s, k) => s + (g[k]?.aheadOfHalfTheSpecialists ?? 0), 0);
  const within = kinds.reduce((s, k) => s + (g[k]?.withinOnePoint ?? 0), 0);
  put('H5', ahead >= 0.5 * n && within >= 0.1 * n, `ahead of half on ${ahead} of ${n}; within a point of the best on ${within} (${((100 * within) / n).toFixed(1)}%)`, '50%; 10%');
}
// H7: the better actor loses under 10% at every level; a developing actor's takes range at least a point.
{
  const levels = Object.entries(a.draws).filter(([, x]) => x.betterLosesShare !== undefined);
  const developing = levels.find(([k]) => /developing/.test(k));
  put('H7', levels.every(([, x]) => x.betterLosesShare < 0.1) && (developing?.[1].rangeOfTake.mean ?? 0) >= 1, `${levels.map(([k, x]) => `${k}: ${(100 * x.betterLosesShare).toFixed(1)}%`).join('; ')}; a developing actor's range ${developing?.[1].rangeOfTake.mean}`, 'under 10%; 1 point');
}
out.push({ id: 'Elsewhere', met: null, figure: 'A4, A5, T1, O3, F1 and F3 are judged by reading the code; H3 by tools/brief-strategies.ts; L1 to L3 by tools/brief-journeys.ts; M2 by tools/mastery.ts --mode plan; G2 by tools/genre-identity.ts; G1 stands replaced by the genre signature (S1 to S4)', threshold: '' });

if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
else for (const x of out) console.log(`${x.id.padEnd(14)} ${x.met === null ? '—' : x.met ? 'Meets' : 'FAILS'}  ${x.figure}${x.threshold ? `  [${x.threshold}]` : ''}`);
