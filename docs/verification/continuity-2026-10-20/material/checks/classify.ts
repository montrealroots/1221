// Sorts every brief into the surface a player meets it as: voice, staged contact, improvised, or plain camera.
import { writeFileSync } from 'node:fs';
import { BRIEFS } from '../../../../../src/engine/content/briefs';
const STAGED = ['combat', 'intimacy'];
const out: Record<string, string[]> = { voice: [], staged: [], improvised: [], camera: [] };
for (const b of BRIEFS) {
  const t = Object.keys(b.techniques ?? {});
  const k = b.medium === 'voice' ? 'voice' : t.some((x) => STAGED.includes(x)) ? 'staged' : (b.improvisation >= 2 || (b.allows && Object.values(b.allows).flat().includes('open' as never))) ? 'improvised' : 'camera';
  out[k]!.push(b.id);
}
for (const [k, v] of Object.entries(out)) console.log(k, v.length);
writeFileSync(process.argv[2]!, JSON.stringify(out, null, 1));
