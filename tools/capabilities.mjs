/**
 * The capability matrix held to the code (from 2026-10-08): `docs/capabilities.json`, each row a thing the player can
 * do, its entry point, state, commands, looks, routes, tests and status, kept apart by layer (schema, content,
 * interaction, verified). This fails where a row names a command the engine doesn't register, a look kind nobody
 * declares, a route nothing serves, or a file that isn't there; where a status isn't one of the six; and where a row
 * is called Verified with nothing that verifies it. A row the owner took out of the game is Retired (from the scope
 * reset of 2026-10-09): it stays as the record of what was built, and is held to none of what it named, which went. `--write` prints the readable `docs/CAPABILITIES.md`, totals with
 * their denominator; `--check` fails when it's behind the JSON.
 *
 * From 2026-10-12 it also fails where a player's command is named by no live row. The rule, read from the inventory
 * `tools/inventory.mjs` writes into `docs/COVERAGE-MATRIX.md`: a kind registered with `onCommand` (its Commands table)
 * is the player's. That day every one of them was issued from a screen through `run`: 150 as `run('<kind>')`, five
 * through a helper given the literal (Papers' `apply` and `act`), and `tutorial.read` through its constant. A scheduled
 * kind, a passage reactor and an event are the engine's own, and no player issues one; a kind in both tables
 * (`school.cabaret`, `school.orientation`) is a command. Until that day the JSON's `about` said the rows named all the
 * world's commands, nothing checked it, and 47 of the commands registered were in no live row: 43 of the inventory's,
 * and the four it hadn't caught up with (`brief.reader`, `work.identify`, `work.try`, `work.settle`). A row naming one
 * of the engine's own kinds as a command fails too, where until then any kind in the inventory passed.
 *
 * Until later that day a row could be Verified on `manual` alone, a check in the app or a tool outside the gate, and
 * kept-context was, on tools/rail-check.mjs, which clicked a Career gone since 2026-10-09. From then a Verified row needs
 * a test the gate runs, every test a live row cites must be one (a .test.ts under tests/, as vitest.config.ts
 * includes), and `manual` only supports a row. An Implemented row whose verified layer says Verified fails too, since Implemented
 * means something it claims isn't checked.
 *
 * Until a third review that day a Verified row could cite tests that never issued one of its commands, and the
 * standard's first clause, a test driving the command, was held only by reading. From then a Verified row fails where
 * no test it cites issues each of its commands, by the kind in quotes or by `kind:` and an exported constant that holds
 * it (`READ_KIND` for `tutorial.read`), as `tools/coverage.mjs` holds a verified command row. Whether that test checks
 * the readers the row claims is still held only by reading. The page's title named the brief of 2026-10-08 (Finish
 * The Open Work, Navigation, The Industry) until then, though The Industry went on 2026-10-09.
 *
 * Until a fourth review that day the two registries could disagree with nothing in the gate to say so: the agreement
 * was held by `tools/coverage.mjs`, which the gate didn't run, and only two ways round (a Verified row's commands all
 * verified there, a command unresolved there in a Partial row). Four rows were Verified on a command
 * docs/GAMEPLAY-COVERAGE.md called partial, and four more on commands the same review's reading moved to partial there;
 * a Partial row's verified layer said Verified; and limits said nothing of a command it called partial, or called one
 * checked. From then this holds the agreement on every command both name, read
 * from its rows in `docs/verification/audit/*.json`: a Verified row has each of its commands' rows verified and read by
 * eye; a command unresolved there, reached only by a fixture, sits in a Partial row; a command partial or unresolved
 * there is named in a sentence of the row's limits that gives that word (or out of reach), the sentence split as
 * `tools/coverage.mjs` splits it, so the two hold the same rule; and a verified layer says Verified only on a Verified
 * row, where until then only an Implemented row's was held. Whether the rest of what limits says of a command agrees
 * with its row there (that it doesn't call checked what the row calls partial) is held by reading.
 *
 * Checking that settlement the same day found the agreement reading a command's actions as the command: `names` found
 * life.look_after inside life.look_after:order, so look-after-yourself's sentence naming the order partial passed for
 * the wash, the workout and the hour unwound, which docs/GAMEPLAY-COVERAGE.md called partial too, while the same limits
 * called a shower and an hour unwinding checked. Since then each row there that isn't verified is named in limits by
 * its own id, a row of one of the command's actions (life.look_after:wash) by the action's.
 *
 *   node tools/capabilities.mjs --write
 *   node tools/capabilities.mjs --check
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const STATUSES = ['Missing', 'Partial', 'Implemented', 'Verified', 'Blocked', 'Retired'];
/** A test the gate runs: a .test.ts under tests/, as vitest.config.ts includes. */
const IN_GATE = /^tests\/(?:[\w.-]+\/)*[\w.-]+\.test\.ts$/;
const json = JSON.parse(readFileSync('docs/capabilities.json', 'utf8'));
const matrix = readFileSync('docs/COVERAGE-MATRIX.md', 'utf8');
const inventory = matrix.slice(matrix.indexOf('<!-- inventory:begin -->'), matrix.indexOf('<!-- inventory:end -->'));
const kindsIn = (text) => new Set([...text.matchAll(/`([a-z0-9_]+\.[a-z0-9_]+)`/g)].map((m) => m[1]));
const commandTable = inventory.indexOf('### Commands');
const scheduledTable = inventory.indexOf('### Scheduled kinds');
/** The player's commands: the inventory's Commands table, each registered with `onCommand`. */
const commands = kindsIn(commandTable < 0 || scheduledTable < commandTable ? '' : inventory.slice(commandTable, scheduledTable));
/** The engine's own: every other kind the inventory lists (scheduled, passage reactors, events), none a command. */
const engineOwn = new Set([...kindsIn(inventory)].filter((k) => !commands.has(k)));
const looks = new Set(readdirSync('src/ui/looks').filter((f) => f.endsWith('.tsx')).flatMap((f) => [...readFileSync(`src/ui/looks/${f}`, 'utf8').matchAll(/defineLook(?:<[^>]*>)?\('([a-z-]+)'/g)].map((m) => m[1])));
/** Each command kind an exported constant holds (`export const READ_KIND = 'tutorial.read'`), by the kind. */
const constantsFor = new Map();
for (const f of readdirSync('src/engine', { recursive: true }).filter((p) => String(p).endsWith('.ts'))) {
  for (const m of readFileSync(`src/engine/${String(f).replace(/\\/g, '/')}`, 'utf8').matchAll(/export const ([A-Z][A-Z0-9_]*) = '([a-z0-9_]+\.[a-z0-9_]+)'/g)) {
    constantsFor.set(m[2], [...(constantsFor.get(m[2]) ?? []), m[1]]);
  }
}
/** Whether a test's text issues a command: its kind in quotes, or `kind:` and a constant that holds it. */
const issues = (text, k) => text.includes(`'${k}'`) || (constantsFor.get(k) ?? []).some((name) => new RegExp(`kind:\\s*${name}\\b`).test(text));
const router = readFileSync('src/ui/workspaces/WorkspaceRouter.tsx', 'utf8');
const routes = new Set([...router.matchAll(/'(\/workspace\/[a-z-]+)'\s*:/g)].map((m) => m[1]));
/** docs/GAMEPLAY-COVERAGE.md's command rows, from the audit it's written from (`tools/coverage.mjs`). */
const AUDIT = ['life', 'school', 'money', 'papers', 'ui'];
const audited = AUDIT.flatMap((a) => JSON.parse(readFileSync(`docs/verification/audit/${a}.json`, 'utf8')).items).filter((i) => i.kind === 'command');
/** A command's rows there: its own, and one for each of its actions (`life.look_after:eat`). */
const auditRowsOf = (k) => audited.filter((i) => i.id === k || i.id.startsWith(`${k}:`));
/** Whether a text names a command by its kind, whole: `school.choose` isn't named by `school.choose_playing`. */
const names = (text, k) => new RegExp(`(?<![\\w.])${k.replace(/\./g, '\\.')}(?!\\w)`).test(text ?? '');
/** A text's sentences, split as `tools/coverage.mjs` splits them: at a stop, before a capital, a quote, a bracket or code. */
const sentencesOf = (text) => (text ?? '').split(/(?<=[.!?])\s+(?=[A-Z‘“(`])/);
/** The words a sentence of limits gives a command that isn't verified there: its status there, or out of reach. */
const WORDS = { partial: /\bpartial\b/i, unresolved: /\bunresolved\b|\bout of reach\b/i, deferred: /\bdeferred\b/i };
/** The commands both registries name, for the count the run ends on. */
const bothName = new Set();

const problems = [];
if (!commands.size) problems.push('docs/COVERAGE-MATRIX.md has no inventory Commands table to read. Run: node tools/inventory.mjs --write');
for (const c of json.capabilities) {
  const at = `capability ${c.id}`;
  if (!STATUSES.includes(c.status)) problems.push(`${at}: status "${c.status}" isn't one of ${STATUSES.join(', ')}`);
  for (const [layer, s] of Object.entries(c.layers ?? {})) if (!STATUSES.includes(s)) problems.push(`${at}: layer ${layer} "${s}"`);
  if (c.status === 'Retired') continue;
  for (const k of c.commands) if (!commands.has(k)) problems.push(`${at}: ${engineOwn.has(k) ? `${k} is the engine’s own, not a command a player issues` : `no command ${k}`}`);
  for (const k of c.looks) if (!looks.has(k)) problems.push(`${at}: no look ${k}`);
  for (const r of c.routes) if (!routes.has(r)) problems.push(`${at}: no screen at ${r}`);
  for (const f of [c.state, c.saveLoad, ...c.tests].filter(Boolean)) if (!existsSync(f)) problems.push(`${at}: no file ${f}`);
  for (const t of c.tests) if (!IN_GATE.test(t)) problems.push(`${at}: ${t} isn’t a test the gate runs (tests/**/*.test.ts)`);
  if (c.status === 'Verified' && !c.tests.length) problems.push(`${at}: Verified with no test the gate runs${c.manual ? '; a check in the app supports a row, it doesn’t verify one' : ''}`);
  if (c.status === 'Verified') {
    const text = c.tests.filter((t) => existsSync(t)).map((t) => readFileSync(t, 'utf8')).join('\n');
    for (const k of c.commands) if (!issues(text, k)) problems.push(`${at}: Verified, and no test it cites issues ${k}`);
  }
  if (c.status === 'Verified' && c.layers?.verified !== 'Verified') problems.push(`${at}: Verified, its verified layer ${c.layers?.verified}`);
  if (c.status !== 'Verified' && c.layers?.verified === 'Verified') problems.push(`${at}: ${c.status}, its verified layer Verified`);
  // The agreement with docs/GAMEPLAY-COVERAGE.md on every command both name.
  for (const k of c.commands) {
    const rows = auditRowsOf(k);
    if (rows.length) bothName.add(k);
    const short = rows.filter((i) => i.status !== 'verified');
    const said = (items) => items.map((i) => `${i.id} ${i.status}`).join(', ');
    if (c.status === 'Verified' && short.length) problems.push(`${at}: Verified, and docs/GAMEPLAY-COVERAGE.md calls ${said(short)}`);
    // Read: by the review of 2026-10-13, which read every row; until then a row read by eye carried `read`.
    const unread = rows.filter((i) => i.status === 'verified' && i.review?.on !== '2026-10-13');
    if (c.status === 'Verified' && unread.length) problems.push(`${at}: Verified, and docs/GAMEPLAY-COVERAGE.md calls ${unread.map((i) => i.id).join(', ')} verified without reviewing it`);
    if (rows.some((i) => i.status === 'unresolved') && c.status !== 'Partial') problems.push(`${at}: ${c.status}, and docs/GAMEPLAY-COVERAGE.md calls ${k} unresolved, reached only by a fixture, which is Partial here`);
    // Each row by its own id, as `tools/coverage.mjs` reads it: a row of one of the command's actions
    // (life.look_after:wash) by the action's, which the command's kind alone doesn't name.
    for (const i of short) {
      if (!WORDS[i.status]) continue;
      if (!sentencesOf(c.limits).some((s) => names(s, i.id) && WORDS[i.status].test(s))) problems.push(`${at}: docs/GAMEPLAY-COVERAGE.md calls ${said([i])}, and no sentence of limits names ${i.id} as ${i.status}`);
    }
  }
}

// Every player's command in a live row: the denominator the `about` names.
const named = new Set(json.capabilities.filter((c) => c.status !== 'Retired').flatMap((c) => c.commands));
const unnamed = [...commands].filter((k) => !named.has(k)).sort();
if (unnamed.length) problems.push(`${unnamed.length} of ${commands.size} player commands are in no live row: ${unnamed.join(', ')}`);

const count = (s) => json.capabilities.filter((c) => c.status === s).length;
const n = json.capabilities.length;
const cell = (x) => String(x ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
const md = `# Capabilities: What SLATE Can Do

Generated by \`node tools/capabilities.mjs --write\` from \`docs/capabilities.json\`; \`--check\` holds it to the code. ${cell(json.about)}

**Totals, of ${n} capabilities in this phase’s scope:** ${STATUSES.map((s) => `${s} ${count(s)}`).join(', ')}.

**Commands:** ${commands.size - unnamed.length} of the ${commands.size} commands a player issues (the inventory’s Commands in \`docs/COVERAGE-MATRIX.md\`) are named by a live row. The inventory’s other ${engineOwn.size} kinds (scheduled kinds, passage reactors and events) are the engine’s own and aren’t capabilities.

| Capability | Goal | Entry | State | Commands | Effects | Readers | Looks | Tests | In The App | Status | Schema / Content / Interaction / Verified | Limits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${json.capabilities.map((c) => `| ${c.id} | ${cell(c.goal)} | ${cell(c.entry)} | ${c.status === 'Retired' ? cell(c.state) : `\`${c.state}\``} | ${c.commands.map((k) => `\`${k}\``).join(' ')} | ${cell(c.effects)} | ${cell(c.readers.join('; '))} | ${c.looks.join(', ')} | ${c.tests.map((t) => `\`${t.replace('tests/', '')}\``).join(' ')} | ${cell(c.manual)} | ${c.status} | ${c.layers.schema} / ${c.layers.content} / ${c.layers.interaction} / ${c.layers.verified} | ${cell(c.limits)} |`).join('\n')}

Preconditions, what persists, save and load, and provenance for each row are in the JSON.
`;

if (process.argv.includes('--write')) writeFileSync('docs/CAPABILITIES.md', md);
if (process.argv.includes('--check')) {
  if (!existsSync('docs/CAPABILITIES.md') || readFileSync('docs/CAPABILITIES.md', 'utf8') !== md) problems.push('docs/CAPABILITIES.md is behind docs/capabilities.json. Run: node tools/capabilities.mjs --write');
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`${n} capabilities: ${STATUSES.map((s) => `${s} ${count(s)}`).join(', ')}. ${commands.size} player commands, every one in a live row, and docs/GAMEPLAY-COVERAGE.md agreed with on the ${bothName.size} both name.`);
