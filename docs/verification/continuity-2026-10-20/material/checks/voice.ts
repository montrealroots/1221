// Voice briefs: how each says it's recorded, and where.
import { BRIEFS } from '../../../../../src/engine/content/briefs';
for (const b of BRIEFS.filter((x) => x.medium === 'voice')) {
  const all = [b.circumstances, b.reader, ...Object.values(b.why)].join(' ¦ ');
  const m = all.match(/[^.¦]*\b(record|records|recorded|voice it|microphone)\b[^.¦]*\./gi) ?? [];
  console.log(b.id, '|', m.slice(0, 3).join(' / ').slice(0, 300));
}
