// Brief 15, money-data: prints each bank's card numbers (fees, days, freeFor) beside whether it has replaceWords, and each country's law numbers.
//   node dump-sec.mjs src/engine/content/security.ts
import { readFileSync } from 'node:fs';
const src = readFileSync(process.argv[2], 'utf8');
const ex = {};
for (const m of src.matchAll(/export const (\w+)\b[^=]*= JSON\.parse\(("(?:[^"\\]|\\.)*")\);/g)) ex[m[1]] = JSON.parse(JSON.parse(m[2]));
for (const [id, s] of Object.entries(ex.SECURITY)) {
  const nums = Object.fromEntries(Object.entries(s).filter(([k, v]) => typeof v !== 'string'));
  console.log(id, JSON.stringify(nums), s.replaceWords ? 'RW' : '');
}
for (const [id, s] of Object.entries(ex.FRAUD_LAW)) {
  const nums = Object.fromEntries(Object.entries(s).filter(([k, v]) => typeof v !== 'string' || k === 'avgLossCurrency'));
  console.log(id, JSON.stringify(nums));
}
