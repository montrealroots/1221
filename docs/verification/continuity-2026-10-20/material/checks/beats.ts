// Checks a brief's own references to its beats, counts and positions, against its beats array.
import { BRIEFS } from '../../../../../src/engine/content/briefs';
const ORD: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7 };
const NUM: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
const out: string[] = [];
for (const b of BRIEFS) {
  const n = b.beats.length;
  const texts: [string, string][] = [
    ['logline', b.logline], ['circumstances', b.circumstances], ['relationship', b.relationship], ['you', b.you], ['reader', b.reader], ['objective', b.objective], ['obstacle', b.obstacle],
    ...b.beats.map((x, i) => [`beat${i + 1}`, x.what] as [string, string]),
    ...Object.entries(b.why).map(([k, v]) => [`why.${k}`, v!] as [string, string]),
    ...b.readings.flatMap((r) => [[`${r.id}.reading`, r.reading], [`${r.id}.rests`, r.rests]] as [string, string][]),
  ];
  for (const [k, t] of texts) {
    for (const m of t.matchAll(/\b(first|second|third|fourth|fifth|sixth|seventh) beat\b/gi)) { const i = ORD[m[1]!.toLowerCase()]!; if (i > n) out.push(`${b.id} ${k}: "${m[0]}" but ${n} beats: ${t}`); }
    for (const m of t.matchAll(/\b(two|three|four|five|six|seven) beats\b/gi)) { const i = NUM[m[1]!.toLowerCase()]!; if (i !== n) out.push(`${b.id} ${k}: "${m[0]}" but ${n} beats: ${t}`); }
    if (/\blast beat\b|\bfinal beat\b/i.test(t) && n < 2) out.push(`${b.id} ${k}: last beat with ${n}`);
  }
  // A size claim against beats: short/medium at most four, long six.
  if ((b.size !== 'long' && n > 4) || n > 6 || n < 2) out.push(`${b.id}: size ${b.size}, ${n} beats`);
}
console.log(out.join('\n') || 'no beat references out of range');
console.log(BRIEFS.length, 'briefs');
