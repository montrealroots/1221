/**
 * SLATE — every feature the connected-journey pass touched, traced from action to later consequence (from 2026-10-12;
 * the owner's brief of that day, section 13).
 *
 * Action → Preconditions → Costs → State → Consumer → Feedback → History → Later consequence, for each guide entry in
 * the areas the pass rebuilt (coursework and partners, productions and direction, craft and briefs, and getting
 * started, which holds the guide itself). Generated from the guide's registry (`content/guide/`), whose figures are the
 * rules' own and whose claims were checked against the engine entry by entry, and from the tests: a row names the test
 * files that drive each command it covers.
 *
 * A row with no consumer (nothing that reads what it changes, now, later, when judged or in the record) is listed under
 * Unconsumed, and the run fails while one is. A row that covers no command, only screens and looks, changes nothing to
 * be read (help runs nothing, by rule), and is listed as Read Only. A command no test drives is listed under Untested.
 *
 *   npx vite-node tools/trace.ts            # writes docs/verification/connected-journey/TRACE.md
 *   npx vite-node tools/trace.ts -- --check # fails on an unconsumed row or an untested command
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { GOALS, GUIDE, GUIDE_BY_ID, connectionsTo, type GuideEntry } from '../src/engine/content/guide';

// The career's entries too, from 2026-10-20 (brief 19): its commands are traced here, as `tools/coverage.mjs` asks of a
// command a live capability names that no audit row holds.
const GOALS_TRACED = ['start', 'coursework', 'productions', 'craft', 'career'] as const;
const check = process.argv.includes('--check');

const tests = readdirSync('tests').filter((f) => f.endsWith('.ts')).map((f) => ({ f: `tests/${f}`, text: readFileSync(`tests/${f}`, 'utf8') }));
/** The test files that drive a command by its kind, as a command or a payload's kind. */
const testsOf = (kind: string): string[] => tests.filter((t) => t.text.includes(`'${kind}'`) || t.text.includes(`"${kind}"`) || t.text.includes(`\`${kind}\``)).map((t) => t.f);
const isCommand = (id: string) => !id.startsWith('ui.') && !id.startsWith('look.');

const CONSUMES = new Set(['immediate', 'scheduled', 'evaluation', 'history']);
const line = (xs: readonly string[]) => (xs.length ? xs.map((x) => `  - ${x}`).join('\n') : '  - (none)');

function row(e: GuideEntry): { md: string; unconsumed: boolean; readOnly: boolean; untested: string[] } {
  const out = e.connections.filter((c) => CONSUMES.has(c.kind));
  const into = connectionsTo(e.id).filter(({ connection }) => connection.kind === 'evaluation' || connection.kind === 'history');
  const commands = e.covers.filter(isCommand);
  const readOnly = !commands.length;
  const unconsumed = !readOnly && !out.length && !into.length && !e.later.length;
  const tested = commands.map((k) => ({ k, files: testsOf(k) }));
  const untested = tested.filter((t) => !t.files.length).map((t) => t.k);
  const title = (id: string) => GUIDE_BY_ID[id]?.title ?? id;
  const md = `### ${e.title} (\`${e.id}\`)

- **Action:** ${e.covers.map((c) => `\`${c}\``).join(', ')}, at ${e.where.label} (\`${e.where.route}${e.where.tab ? `?tab=${e.where.tab}` : ''}\`). Opens: ${e.available}
- **Preconditions:**
${line([...e.needs, ...e.connections.filter((c) => c.kind === 'prerequisite').map((c) => `${title(c.to)} first: ${c.why}`)])}
- **Costs:**
${line(e.costs.map((f) => `${f.label}: ${f.value}${f.estimate ? ' (an estimate)' : ''}`))}
- **State (what changes at once):**
${line(e.now)}
- **Consumer (what reads it):**
${line([...out.map((c) => `${title(c.to)}, ${c.kind}: ${c.why}`), ...into.map(({ from, connection }) => `${from.title} reads it, ${connection.kind}: ${connection.why}`)])}
- **Feedback (how to read what comes back):**
${line(e.interpret)}
- **History (kept in the record):**
${line(e.connections.filter((c) => c.kind === 'history').map((c) => `${title(c.to)}: ${c.why}`))}
- **Later consequence:**
${line(e.later)}
- **Tested by:** ${tested.length ? tested.map((t) => `\`${t.k}\`: ${t.files.length ? t.files.map((f) => `\`${f}\``).join(', ') : '**no test**'}`).join('; ') : 'a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)'}
`;
  return { md, unconsumed, readOnly, untested };
}

const sections: string[] = [];
const unconsumed: string[] = [];
const readOnly: string[] = [];
const untested: string[] = [];
let rows = 0;
for (const g of GOALS_TRACED) {
  const goal = GOALS.find((x) => x.id === g)!;
  const entries = GUIDE.filter((e) => e.goal === g);
  sections.push(`## ${goal.title}\n\n${goal.lead}\n\n${entries.map((e) => { const r = row(e); rows += 1; if (r.unconsumed) unconsumed.push(e.id); if (r.readOnly) readOnly.push(e.id); untested.push(...r.untested); return r.md; }).join('\n')}`);
}

const md = `# Every Touched Feature, Traced

Written by \`tools/trace.ts\` from the guide's registry and the tests; don't edit it by hand. ${rows} entries in the four
areas the connected-journey pass of 2026-10-12 rebuilt, and from 2026-10-20 the career's (brief 19), each traced Action →
Preconditions → Costs → State → Consumer → Feedback → History → Later consequence. The words are the guide's own, which
carry the rules' figures; the four areas' entries' claims were checked against the engine by a second reader when they
were written, and the career's by the tests that drive each of its commands.

**Unconsumed** (a row nothing reads): ${unconsumed.length ? unconsumed.map((x) => `\`${x}\``).join(', ') : 'none'}.
**Read Only** (screens and looks, changing nothing): ${readOnly.length ? readOnly.map((x) => `\`${x}\``).join(', ') : 'none'}.
**Untested** (a command no test drives): ${untested.length ? untested.map((x) => `\`${x}\``).join(', ') : 'none'}.

${sections.join('\n')}`;

if (check) {
  if (unconsumed.length || untested.length) { console.error(`unconsumed: ${unconsumed.join(', ') || 'none'}; untested: ${untested.join(', ') || 'none'}`); process.exit(1); }
  console.log(`trace: ${rows} entries, every one consumed, every command tested`);
} else {
  mkdirSync('docs/verification/connected-journey', { recursive: true });
  writeFileSync('docs/verification/connected-journey/TRACE.md', md);
  console.log(`wrote TRACE.md: ${rows} entries; unconsumed ${unconsumed.length}, untested ${untested.length}${untested.length ? `: ${untested.join(', ')}` : ''}`);
}
