import { BRIEFS } from '../../../../../src/engine/content/briefs';
const ORD: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
for (const b of BRIEFS) {
  const texts: [string, string][] = [...Object.entries(b.why).map(([k, v]) => [`why.${k}`, v!] as [string, string]), ...b.readings.flatMap((r) => [[`${r.id}.reading`, r.reading], [`${r.id}.rests`, r.rests]] as [string, string][]), ['phys', b.circumstances]];
  for (const [k, t] of texts) for (const m of t.matchAll(/\b(first|second|third|fourth|fifth|sixth|last|middle) beat\b/gi)) {
    const w = m[1]!.toLowerCase();
    const i = w === 'last' ? b.beats.length : w === 'middle' ? Math.ceil(b.beats.length / 2) : ORD[w]!;
    console.log(`${b.id} ${k} [${m[0]}] :: ${t.slice(0, 110)}\n    -> beat ${i}/${b.beats.length}: ${b.beats[i - 1]?.what.slice(0, 120)}`);
  }
}
