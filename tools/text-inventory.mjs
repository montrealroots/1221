/**
 * The text inventory: every string the game can show a player, found in the source, grouped into the sources a writer
 * reviews, each with its status (from 2026-10-17, the owner's brief 14, "Complete Player-Facing Language And Tutorial
 * Overhaul").
 *
 *   node tools/text-inventory.mjs                     prints the totals by subsystem
 *   node tools/text-inventory.mjs --write             writes them, and every source, to docs/text/inventory.json and INVENTORY.md
 *   node tools/text-inventory.mjs --check             exits 1 on a source no status names, one claimed twice, a status
 *                                                     for a source that's gone, or engine-speak over its ratchet
 *   node tools/text-inventory.mjs --show <pattern>    prints the strings of the sources whose id matches (a * is any run)
 *   node tools/text-inventory.mjs --mark <pattern> <status> --by <area> [--reason <text>] [--evidence <text>]
 *                                                     records a status for the matching sources, at their text as it is,
 *                                                     in docs/text/statuses/<area>.json
 *   node tools/text-inventory.mjs --speak [<pattern>] prints each engine-speak hit, with its source
 *   node tools/text-inventory.mjs --bless             sets docs/text/engine-speak.json to today's counts (they may fall)
 *   node tools/text-inventory.mjs --prune             removes the statuses of sources that are gone, and lists them
 *
 * A string is a string literal, a template (its ${…} written as {…}) or JSX text, in `src/` but the tests and the
 * gazetteer's data, that reads as words: two or more of them, or one capitalised word a label would be. Ids, keys,
 * class names, comparisons, `case` labels, import paths and console lines are left out. A source is the file, the
 * top-level declaration and, inside it, the nearest entry with an id or the command it registers: what a writer can read
 * as one thing.
 *
 * Statuses live one file per area in docs/text/statuses/, so areas working apart don't edit one file: baseline.json
 * lists every source as it stood when brief 14 began, and an area's file overrides it for the sources it read. Two
 * areas' files may not both claim a source.
 *
 * A status is one of the brief's four. Each is recorded with a hash of its source's strings, so a source whose text has
 * changed since is counted Pending again, "changed since it was reviewed", until it's read again: a status is never a
 * word somebody typed and left. Each source belongs to one of the brief's subsystems, by its file (SUBSYSTEMS below).
 */
import ts from 'typescript';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = 'src';
const OUT = 'docs/text';
const SKIP_DIRS = new Set(['node_modules', 'dist', 'geography', 'world-data', '__snapshots__']);
const STATUSES = ['Rewritten And Verified', 'Reviewed And Retained', 'Pending', 'Blocked'];
const NEEDS = { 'Reviewed And Retained': 'reason', Blocked: 'reason', 'Rewritten And Verified': 'evidence' };

/**
 * The brief's subsystems, section 2, in its order, and the files each holds: the first rule that matches a file wins.
 * In-world material, the scenes, plays and audition sides an actor performs, is its own: it's written in its
 * characters' voices, not the game's.
 */
const SUBSYSTEMS = [
  ['start', 'Startup, Save Selection, Character Creation And Onboarding', [/^src\/ui\/(startup|saves|creation)\//, /^src\/engine\/content\/(entry|personality-traits|personality|names|backgrounds|birthplace|creation)[\w-]*\.ts$/, /^src\/engine\/systems\/(creation|bootstrap)\.ts$/, /^src\/engine\/(index|decided)\.ts$/, /^src\/engine\/persistence\//, /^src\/engine\/content\/(languages|ethnicity|identity)\.ts$/, /^src\/engine\/content\/guide\/start\.ts$/, /^src\/app\//, /^src\/main\.tsx$/]],
  ['tutorial', 'Tutorials, Guides, Help Panels And Connected-System Explanations', [/^src\/engine\/content\/tutorial\.ts$/, /^src\/engine\/content\/guide\/(index|types)\.ts$/, /^src\/ui\/guide\//, /^src\/engine\/world\/tutorial\.ts$/]],
  ['home', 'Home And Its Retained Actions', [/^src\/ui\/screens\//, /^src\/engine\/systems\/(life|meals|food|hygiene|chores)\.ts$/]],
  ['profile', 'Player Profile, Attributes, Genres, Mastery And Progression', [/^src\/ui\/workspaces\/ProfileWorkspace\.tsx$/, /^src\/ui\/components\/AttributesPanel\.tsx$/, /^src\/ui\/looks\/(actor|person|craft|genre)[\w-]*\.tsx?$/, /^src\/engine\/content\/(abilities|attributes-matrix|genres?|genre-[\w-]+|interpretation|approaches|personality-traits|contemporary|practice)\.ts$/, /^src\/engine\/systems\/(attributes|development|advice|experience|interpretation[\w-]*|genre[\w-]*|mastery|personality|practice|next-steps)\.ts$/, /^src\/engine\/content\/guide\/craft\.ts$/, /^src\/engine\/systems\/(register|engagement|artistry|learning)\.ts$/, /^src\/engine\/content\/(film-genres|demands|reference)\.ts$/]],
  ['school', 'School, Classes, Coursework, Rehearsals, Productions, Assessments And Completion', [/^src\/ui\/workspaces\/SchoolWorkspace\.tsx$/, /^src\/ui\/components\/(BriefPane|ClassMoments|CourseworkPane|PlayingChooser|RehearsalProcess|StudyPlanPanels|WorkThrough)\.tsx$/, /^src\/ui\/looks\/classmate\.tsx$/, /^src\/ui\/looks\/school[\w-]*\.tsx?$/, /^src\/ui\/workspaces\/(school|coursework|classes|production|briefs?|practice)[\w-]*\.tsx?$/, /^src\/engine\/systems\/(school|coursework|classmates|production|plays?|briefs|evaluation|piece|material|ensemble|leave|cabaret|orientation|workload|grades?|review)[\w-]*\.ts$/, /^src\/engine\/content\/(school|coursework|tasks|material|piece|concerns|courses?|production|plays|roundups)[\w-]*\.ts$/, /^src\/engine\/content\/guide\/(school|coursework|productions)\.ts$/, /^src\/engine\/systems\/(workbook|workpieces|courserecord)\.ts$/, /^src\/engine\/content\/(workload|workbook|replacements)\.ts$/]],
  ['money', 'Money, Banking, Payments, Fees, Holds, Statements And Transactions', [/^src\/ui\/workspaces\/BankWorkspace\.tsx$/, /^src\/ui\/looks\/bank\.tsx$/, /^src\/ui\/bank\//, /^src\/ui\/looks\/money[\w-]*\.tsx?$/, /^src\/ui\/workspaces\/(money|bank)[\w-]*\.tsx?$/, /^src\/engine\/systems\/(bank\w*|banking|cards?|cardoffers|payments?|statements|lending|money|accounts?|security|savings|overdraft|switching|transfers?|fraud|rewards|credit\w*|bills?|rent|prices?|spend\w*|collections?|homeaccounts|roundups?|ledger)\.ts$/, /^src\/engine\/content\/(bank[\w-]*|cards|payments|accountlife|security|homeaccounts|pending|lending|fees|prices|currenc\w*|credit\w*)\.ts$/, /^src\/engine\/core\/(money|ledger|banknumbers)\.ts$/, /^src\/engine\/content\/guide\/money\.ts$/, /^src\/engine\/systems\/(accountlife|cardlife|cash|homeaccount|routing|obligations|earnings)\.ts$/, /^src\/engine\/content\/(cash|rents)\.ts$/]],
  ['papers', 'Papers, Documents, Applications, Taxes And Status Notices', [/^src\/ui\/workspaces\/PapersWorkspace\.tsx$/, /^src\/ui\/components\/LienPanels\.tsx$/, /^src\/ui\/papers\//, /^src\/ui\/looks\/papers[\w-]*\.tsx?$/, /^src\/ui\/workspaces\/papers[\w-]*\.tsx?$/, /^src\/engine\/systems\/(documents?|passports?|licen[sc]es?|permission|visas?|status|tax\w*|benefits?|pension\w*|citizenship|residence|identity|idcard)\.ts$/, /^src\/engine\/content\/(passports|licenses|licensepaths|tax|statetax|visas?|documents?|benefits?|pensions?|safetynet|idcards?|permits?)[\w-]*\.ts$/, /^src\/engine\/content\/guide\/(papers|documents|taxes)\.ts$/, /^src\/engine\/systems\/(statetax|abroad|unemployment|assistance|homepensions|homebenefits|universalcredit|imss|socialsecurity|statepension|eiself|papervisits)\.ts$/, /^src\/engine\/content\/workrules\.ts$/]],
  ['health', 'Health, Treatment, Coverage, Stamina, Energy And Recovery', [/^src\/ui\/looks\/(wellbeing|health|body)[\w-]*\.tsx?$/, /^src\/ui\/workspaces\/(health|life|body)[\w-]*\.tsx?$/, /^src\/engine\/systems\/(health\w*|body|injury|illness|therapy|appointments?|insurance|coverage|stamina|workload|energy|sleep|mortality|condition|pharmacy|prescriptions?|dental|hospital|care)\.ts$/, /^src\/engine\/content\/(health\w*|illness\w*|conditions?|insurance|clinics?|medic\w*|body)[\w-]*\.ts$/, /^src\/engine\/content\/guide\/body\.ts$/, /^src\/engine\/systems\/clinics\.ts$/, /^src\/engine\/content\/(carevisits|injury|lifespan)\.ts$/]],
  ['calendar', 'Calendar, Schedules, Time Advancement And Reminders', [/^src\/ui\/workspaces\/CalendarWorkspace\.tsx$/, /^src\/ui\/looks\/plans\.tsx$/, /^src\/ui\/looks\/(day|calendar|time|weather|place)[\w-]*\.tsx?$/, /^src\/engine\/systems\/(calendar|plans?|weather|time|day)\.ts$/, /^src\/engine\/world\/plans\.ts$/, /^src\/engine\/core\/(time|scheduler|sun|realclock)\.ts$/, /^src\/engine\/content\/guide\/day\.ts$/, /^src\/engine\/systems\/(seasons|birthdays)\.ts$/, /^src\/engine\/content\/(holidays|holiday-data|climate|thunder)\.ts$/]],
  ['notifications', 'Notifications, Invitations, Feedback And Generated Messages', [/^src\/ui\/looks\/(attention|notice\w*|news)[\w-]*\.tsx?$/, /^src\/engine\/world\//, /^src\/engine\/core\/(events|simulation|text)\.ts$/]],
  ['controls', 'Buttons, Menus, Tabs, Filters, Placeholders, Empty And Loading States, Confirmations', [/^src\/ui\/(components|shell)\//, /^src\/ui\/workspaces\//, /^src\/ui\/looks\//, /^src\/ui\/kept\.ts$/]],
  ['material', 'In-World Material: Scenes, Plays And Audition Sides, In Their Characters’ Voices', [/^src\/engine\/content\/(scenes-[\w-]+|briefs\/[\w-]+|plays|monologues?|sides)\.ts$/]],
  ['world', 'The World: Places, Countries, Weather And Reference Data', [/^src\/engine\/content\//, /^src\/engine\//]],
];
const subsystemOf = (file) => (SUBSYSTEMS.find(([, , rules]) => rules.some((r) => r.test(file))) ?? SUBSYSTEMS.at(-1))[0];

/** Engine-speak: the internal concepts the brief names, and the shapes they take here (section 3). A hit is a question
 * for a writer, not a verdict: some are the right word in their place, and the reviewer says so in the status. */
const ENGINE_SPEAK = [
  [/\b(?:what|which|how) (?:the )?(?:work|it|they|the judge|the school|SLATE|the game|a take|the evaluation) reads?\b/i, 'what something reads'],
  [/\b(?:work|piece|take|scene|night|tape|brief|judge|evaluation|look|school|dimension|bureau) (?:that )?reads? (?:it|them|its|their|the|a|an|as|nothing|no|every|each|one)\b/i, 'work reads it'],
  [/\breads? (?:it|them) as\b/i, 'reads it as'],
  [/\b(?:the )?(?:work|take)[’']s inputs?\b|\binputs? (?:it|the work|a take) reads\b/i, 'the work’s inputs'],
  [/\bmost often short\b/i, 'the part most often short'],
  [/\b(?:standing|it) falls a step\b|\bfalls a step\b/i, 'the standing falls a step'],
  [/\brehearsed in\b/i, 'a choice rehearsed in'],
  [/\bthe engine\b/i, 'the engine'],
  [/\b(?:a|the|its|this|your|each|every) take\b(?! (?:on|of) (?:the|a) (?:part|role|scene|sides))/i, 'a take, for any judged work'],
  [/\bdraws? on\b/i, 'draws on'],
  [/\bworked out (?:from|by|each|every|as)\b/i, 'worked out from'],
  [/\b(?:as|the way) (?:SLATE|the game|the school|a bureau|the bank) (?:reads|counts|works) it\b/i, 'as SLATE reads it'],
  [/\b(?:a|the|this|that) command\b|\bcommands?\b(?= (?:is|are|was|were) refused)/i, 'a command'],
  [/\bwas refused\b|\bis refused\b(?! (?:because|since|until|while|for|by))/i, 'refused, with no reason or next step'],
  [/\b(?:quality )?dimensions?\b/i, 'a dimension'],
  [/\bsegments?\b/i, 'a segment'],
  [/\b(?:the|a|its|each) weights?\b|\bweighted\b/i, 'a weight'],
  [/\bdials?\b/i, 'a dial'],
  [/\bsignals?\b/i, 'a signal'],
  [/\bundefined\b|\bNaN\b|\[object Object\]/, 'a leaked value'],
  [/\{command\.kind\}|\b[a-z]+\.[a-z_]+ failed\b/, 'a raw command id'],
  [/\bSLATE[’']s (?:estimate|reading|design|own|division|rate|calibration|choice|model|figure|assumption|default|guess|rule|scale)\b/, 'SLATE’s estimate, inside a sentence'],
  [/`?\btests?\/[\w-]+\.test\.tsx?`?|\b[\w-]+\.(?:json|tsx?|mjs|md)\b(?!\w)/, 'a file name'],
  [/\b(?:systems|content|core|world)\/[\w-]+(?:\.ts)?\b|`[a-z][\w.]*\(?\)?`/, 'a code name'],
];

// ---------------------------------------------------------------------------------------------------------------------
const slashes = (p) => p.split('\\').join('/');
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return SKIP_DIRS.has(f) ? [] : walk(p);
    return /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$|\.d\.ts$/.test(f) ? [slashes(p)] : [];
  });
}
/** Words, not an id, a key, a class name, a path, a format or a number. */
function isWords(t) {
  const s = t.trim();
  if (s.length < 2 || !/[A-Za-z]/.test(s)) return false;
  if (/^(https?:|mailto:|\/|\.\/|\.\.\/|#|var\(|rgba?\(|calc\()/.test(s)) return false;
  if (/^[a-z0-9_.:/\-#@$%*+=,]+$/.test(s)) return false; // ids, kinds, keys, class lists without spaces
  if (/^[a-z][\w-]*( [a-z][\w-]*)+$/.test(s) && /-/.test(s) && !/[.?!’']/.test(s)) return false; // class lists
  if (/^[\w-]+:\s*[^ ]+;/.test(s) || /^[A-Z0-9_]+$/.test(s)) return false; // css, CONSTANT_IDS, ISO codes
  if (/^[\d\s.,:;%()+\-/x×]+[a-z]{0,3}$/i.test(s)) return false; // numbers, sizes, units
  if (/^(YYYY|HH|MM|DD|yyyy)/.test(s)) return false;
  const words = s.match(/[A-Za-z][A-Za-z’']*/g) ?? [];
  if (words.length >= 2) return true;
  return /^[A-Z][a-z’']+[a-z]*[.?!…]?$/.test(s) || /[.?!]$/.test(s);
}
const NOT_TEXT_ATTRS = new Set(['className', 'key', 'id', 'htmlFor', 'href', 'src', 'role', 'type', 'name', 'style', 'target', 'rel', 'method', 'autoComplete', 'inputMode', 'lang', 'dir', 'data-testid', 'viewBox', 'd', 'fill', 'stroke', 'xmlns', 'path', 'kind', 'variant', 'size', 'tone', 'as', 'to', 'look', 'value', 'defaultValue', 'pattern', 'accept', 'step', 'min', 'max']);
const ARIA_ATTRS = new Set(['aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'alt', 'title', 'placeholder', 'label']);
const NOT_TEXT_CALLS = /^(console\.\w+|require|import|\w+\.(includes|startsWith|endsWith|indexOf|split|join|replace|replaceAll|match|test|has|get|delete|querySelector\w*|getElementById|addEventListener|removeEventListener|setAttribute|getAttribute|localeCompare|toLocaleString|padStart|padEnd)|new (RegExp|Intl\.\w+|Date|URL)|getItem|setItem|removeItem|keyed|byId|require\w*|cityById|countryById|bankById|\w*ById|\w*ByCode)$/;

function textOf(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map((s) => `{…}${s.literal.text}`).join('');
  if (ts.isJsxText(node)) return node.text.replace(/\s+/g, ' ').trim();
  return null;
}
function excluded(node) {
  const p = node.parent;
  if (!p) return true;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isLiteralTypeNode(p) || ts.isImportTypeNode?.(p)) return true;
  if ((ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p) || ts.isEnumMember(p)) && p.name === node) return true;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isCaseClause(p) && p.expression === node) return true;
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(p.operatorToken.kind)) return true;
  if (ts.isJsxAttribute(p)) { const n = p.name.getText(); return NOT_TEXT_ATTRS.has(n) || n.startsWith('data-') || n.startsWith('on'); }
  if (ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent)) { const n = p.parent.name.getText(); if (NOT_TEXT_ATTRS.has(n) || n.startsWith('data-') || n === 'className') return true; }
  if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
    const callee = (ts.isNewExpression(p) ? 'new ' : '') + p.expression.getText().replace(/\s+/g, '');
    if (NOT_TEXT_CALLS.test(callee)) return true;
    if (/^(throw|new )?Error$/.test(callee) || callee === 'new Error' || callee === 'new TypeError' || callee === 'new RangeError') return false;
  }
  // A key in a lookup written as `x === 'a' || ...` is caught above; a string in a type position isn't an expression.
  let a = p;
  for (let i = 0; a && i < 6; i++, a = a.parent) if (ts.isTypeNode(a) && !ts.isTypeLiteralNode(a)) return true;
  return false;
}
function kindOf(node, text) {
  let p = node.parent;
  if (ts.isJsxAttribute(p) || (ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent))) {
    const n = (ts.isJsxAttribute(p) ? p : p.parent).name.getText();
    return ARIA_ATTRS.has(n) ? (n === 'placeholder' ? 'placeholder' : n === 'label' ? 'label' : 'accessible') : 'attribute';
  }
  for (let a = p, i = 0; a && i < 5; a = a.parent, i++) {
    if (ts.isNewExpression(a) && /CommandError/.test(a.expression.getText())) return 'refusal';
    if (ts.isNewExpression(a) && /\bError$/.test(a.expression.getText())) return 'internal';
    if (ts.isPropertyAssignment(a) && /^(title|label|name|heading|tab|button|action|cta|short)$/.test(a.name.getText?.() ?? '')) return 'label';
    if (ts.isPropertyAssignment(a) && /^(body|text|lead|detail|note|why|help|hint|description|summary|message|said|line|says)$/.test(a.name.getText?.() ?? '')) return 'prose';
  }
  if (ts.isJsxText(node)) return /[.?!:]$/.test(text) || text.split(' ').length > 6 ? 'prose' : 'label';
  return /[.?!]$/.test(text.trim()) || text.split(' ').length > 7 ? 'prose' : 'label';
}

/** The top-level name of a statement. */
function topName(st) {
  if (ts.isVariableStatement(st)) return st.declarationList.declarations.map((d) => d.name.getText()).join(',');
  if (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isEnumDeclaration(st)) return st.name?.getText() ?? 'default';
  if (ts.isExportAssignment(st)) return 'default';
  if (ts.isExpressionStatement(st)) { const t = st.expression.getText(); const m = t.match(/^([\w.]+)\(\s*['"`]([\w.:-]+)['"`]/); return m ? `${m[1]}(${m[2]})` : 'top'; }
  return 'top';
}
const ID_PROPS = ['id', 'key', 'code', 'kind', 'slug', 'task', 'tag'];
/** The nearest anchor a writer reads as one thing: an entry with an id, or a command or kind registered by name. */
function anchorOf(node, top) {
  for (let a = node.parent; a && a !== top; a = a.parent) {
    if (ts.isObjectLiteralExpression(a) && a.parent && (ts.isArrayLiteralExpression(a.parent) || ts.isPropertyAssignment(a.parent) || ts.isCallExpression(a.parent))) {
      for (const pr of a.properties) {
        if (ts.isPropertyAssignment(pr) && ID_PROPS.includes(pr.name.getText()) && (ts.isStringLiteral(pr.initializer) || ts.isNoSubstitutionTemplateLiteral(pr.initializer))) return `[${pr.initializer.text}]`;
      }
    }
    if (ts.isCallExpression(a) && a.arguments.length && (ts.isStringLiteral(a.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(a.arguments[0])) && /^[a-z][\w-]*(\.[\w:-]+)+$/.test(a.arguments[0].text) && a.arguments[0] !== node) return `<${a.arguments[0].text}>`;
  }
  return null;
}
/** A second level for a declaration too big to read as one: its own property or inner function. */
function innerOf(node, top) {
  let found = null;
  for (let a = node.parent; a && a !== top; a = a.parent) {
    if ((ts.isFunctionDeclaration(a) || ts.isMethodDeclaration(a)) && a.name) found = `${a.name.getText()}()`;
    else if ((ts.isArrowFunction(a) || ts.isFunctionExpression(a)) && a.parent && (ts.isVariableDeclaration(a.parent) || ts.isPropertyAssignment(a.parent))) found = `${a.parent.name.getText()}()`;
    else if (ts.isPropertyAssignment(a) && a.parent && ts.isObjectLiteralExpression(a.parent) && a.parent.parent && (ts.isVariableDeclaration(a.parent.parent) || ts.isAsExpression(a.parent.parent) || ts.isSatisfiesExpression?.(a.parent.parent))) found = `.${a.name.getText().replace(/['"]/g, '')}`;
  }
  return found;
}

export function inventory() {
  const sources = new Map();
  for (const file of walk(ROOT)) {
    const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    for (const st of sf.statements) {
      const top = topName(st);
      const found = [];
      const visit = (node) => {
        const text = textOf(node);
        if (text !== null && isWords(text) && !excluded(node)) {
          const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          found.push({ node, text, line, kind: kindOf(node, text) });
        }
        if (ts.isTemplateExpression(node)) node.templateSpans.forEach((s) => visit(s.expression));
        else ts.forEachChild(node, visit);
      };
      visit(st);
      if (!found.length) continue;
      const big = found.length > 80;
      for (const f of found) {
        const anchor = anchorOf(f.node, st) ?? (big ? innerOf(f.node, st) : null);
        const id = `${file}#${top}${anchor ? ` ${anchor}` : ''}`;
        if (!sources.has(id)) sources.set(id, { id, file, decl: top, anchor, subsystem: subsystemOf(file), strings: [] });
        sources.get(id).strings.push({ line: f.line, kind: f.kind, text: f.text });
      }
    }
  }
  for (const s of sources.values()) {
    s.hash = createHash('sha1').update(s.strings.map((x) => x.text).join('\u0000')).digest('hex').slice(0, 12);
    s.words = s.strings.reduce((n, x) => n + (x.text.match(/[A-Za-z][A-Za-z’']*/g) ?? []).length, 0);
    s.kinds = [...new Set(s.strings.map((x) => x.kind))].sort();
    s.speak = [];
    for (const x of s.strings) for (const [re, label] of ENGINE_SPEAK) if (re.test(x.text)) s.speak.push({ line: x.line, label, text: x.text });
  }
  return [...sources.values()];
}

const STATUS_DIR = `${OUT}/statuses`;
/** Every area's statuses, the baseline's first and each area's over it; and any source two areas both claim. */
function loadStatuses() {
  const all = {}, owner = {}, twice = [];
  if (!existsSync(STATUS_DIR)) return { all, owner, twice };
  const files = readdirSync(STATUS_DIR).filter((f) => f.endsWith('.json')).sort((a, b) => (a === 'baseline.json' ? -1 : b === 'baseline.json' ? 1 : a.localeCompare(b)));
  for (const f of files) {
    const area = f.slice(0, -5);
    for (const [id, st] of Object.entries(JSON.parse(readFileSync(`${STATUS_DIR}/${f}`, 'utf8')))) {
      if (owner[id] && owner[id] !== 'baseline') twice.push(`${id} (${owner[id]} and ${area})`);
      all[id] = { ...st, area }; owner[id] = area;
    }
  }
  return { all, owner, twice };
}
const RATCHET = `${OUT}/engine-speak.json`;
const load = (p, d) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : d);
const glob = (pat) => new RegExp(`^${pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);

function statusOf(s, statuses) {
  const st = statuses[s.id];
  if (!st) return { status: 'Pending', why: 'not yet reviewed' };
  if (st.hash !== s.hash) return { status: 'Pending', why: `changed since it was ${st.status === 'Pending' ? 'listed' : `marked ${st.status}`} (${st.on ?? ''})`, was: st.status };
  return st;
}

function write(srcs, statuses, toDisk) {
  const rows = srcs.map((s) => ({ ...s, ...statusOf(s, statuses), strings: s.strings }));
  const totals = {};
  for (const [key, name] of SUBSYSTEMS) totals[key] = { name, sources: 0, strings: 0, words: 0, speak: 0, ...Object.fromEntries(STATUSES.map((x) => [x, 0])) };
  for (const r of rows) { const t = totals[r.subsystem]; t.sources++; t.strings += r.strings.length; t.words += r.words; t.speak += r.speak.length; t[r.status]++; }
  const all = { sources: rows.length, strings: rows.reduce((n, r) => n + r.strings.length, 0), words: rows.reduce((n, r) => n + r.words, 0), speak: rows.reduce((n, r) => n + r.speak.length, 0), ...Object.fromEntries(STATUSES.map((x) => [x, rows.filter((r) => r.status === x).length])) };
  if (!toDisk) return { totals, all };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/inventory.json`, `${JSON.stringify({ written: 'by tools/text-inventory.mjs --write, from src/ and docs/text/statuses/', totals, all, sources: rows.map(({ strings, speak, ...r }) => ({ ...r, strings: strings.length, lines: [...new Set(strings.map((x) => x.line))], speak: speak.map((h) => `${h.line} ${h.label}`) })) })}\n`);
  const esc = (t) => String(t).replace(/\|/g, '/').replace(/\n/g, ' ');
  const md = ['# The Text Inventory', '', 'Every string the game can show, by source and subsystem, written by `tools/text-inventory.mjs --write` from `src/` and `statuses/`. Nothing here is typed. A status is recorded with a hash of its source’s strings; a source changed since is Pending again until it’s read again.', '',
    '| Subsystem | Sources | Strings | Words | Engine-Speak Hits | Rewritten And Verified | Reviewed And Retained | Pending | Blocked |', '|---|---|---|---|---|---|---|---|---|',
    ...SUBSYSTEMS.map(([k]) => { const t = totals[k]; return `| ${t.name} | ${t.sources} | ${t.strings} | ${t.words} | ${t.speak} | ${t['Rewritten And Verified']} | ${t['Reviewed And Retained']} | ${t.Pending} | ${t.Blocked} |`; }),
    `| **All** | ${all.sources} | ${all.strings} | ${all.words} | ${all.speak} | ${all['Rewritten And Verified']} | ${all['Reviewed And Retained']} | ${all.Pending} | ${all.Blocked} |`, ''];
  for (const [k] of SUBSYSTEMS) {
    const rs = rows.filter((r) => r.subsystem === k);
    if (!rs.length) continue;
    md.push(`## ${totals[k].name}`, '', '| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |', '|---|---|---|---|---|---|');
    for (const r of rs) md.push(`| \`${esc(r.id)}\` | ${r.strings.length} | ${r.kinds.join(', ')} | ${r.speak.length} | ${r.status} | ${esc(r.reason ?? r.evidence ?? r.why ?? '')} |`);
    md.push('');
  }
  writeFileSync(`${OUT}/INVENTORY.md`, md.join('\n'));
  return { totals, all };
}

const args = process.argv.slice(2);
const flag = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const srcs = inventory();
const { all: statuses, twice } = loadStatuses();

if (args[0] === '--show') {
  const re = glob(args[1] ?? '*');
  for (const s of srcs.filter((x) => re.test(x.id))) {
    const st = statusOf(s, statuses);
    console.log(`\n## ${s.id}  [${s.subsystem}; ${st.status}; ${s.speak.length} engine-speak]`);
    for (const x of s.strings) console.log(`  ${String(x.line).padStart(5)} ${x.kind.padEnd(11)} ${x.text}`);
  }
} else if (args[0] === '--speak') {
  const re = glob(args[1] ?? '*');
  const by = {};
  for (const s of srcs.filter((x) => re.test(x.id))) for (const h of s.speak) { by[h.label] = (by[h.label] ?? 0) + 1; console.log(`${s.id}:${h.line}  [${h.label}]  ${h.text.slice(0, 200)}`); }
  console.error(JSON.stringify(by, null, 1));
} else if (args[0] === '--mark') {
  const re = glob(args[1]);
  const status = args[2];
  if (!STATUSES.includes(status)) { console.error(`a status is one of: ${STATUSES.join('; ')}`); process.exit(2); }
  const reason = flag('--reason'), evidence = flag('--evidence'), by = flag('--by');
  if (!by || !/^[a-z0-9-]+$/.test(by)) { console.error('--by <area> names the file the statuses go in, docs/text/statuses/<area>.json'); process.exit(2); }
  const need = NEEDS[status];
  if (need === 'reason' && !reason) { console.error(`${status} needs --reason`); process.exit(2); }
  if (need === 'evidence' && !evidence) { console.error(`${status} needs --evidence: the test, the step on the built app or the review that verified it`); process.exit(2); }
  const hit = srcs.filter((x) => re.test(x.id));
  if (!hit.length) { console.error(`no source matches ${args[1]}`); process.exit(2); }
  // The day of the commit the text was read at: a tool may not read the wall clock (the lint's rule).
  const on = flag('--on') ?? execFileSync('git', ['log', '-1', '--format=%cs'], { encoding: 'utf8' }).trim();
  const file = `${STATUS_DIR}/${by}.json`;
  const mine = load(file, {});
  for (const s of hit) mine[s.id] = { status, hash: s.hash, on, ...(reason ? { reason } : {}), ...(evidence ? { evidence } : {}) };
  mkdirSync(STATUS_DIR, { recursive: true });
  writeFileSync(file, `${JSON.stringify(Object.fromEntries(Object.entries(mine).sort(([a], [b]) => a.localeCompare(b))), null, 1)}\n`);
  console.log(`${hit.length} sources marked ${status}`);
} else if (args[0] === '--prune') {
  const ids = new Set(srcs.map((s) => s.id));
  let n = 0;
  for (const f of existsSync(STATUS_DIR) ? readdirSync(STATUS_DIR).filter((x) => x.endsWith('.json')) : []) {
    const mine = JSON.parse(readFileSync(`${STATUS_DIR}/${f}`, 'utf8'));
    const gone = Object.keys(mine).filter((id) => !ids.has(id));
    for (const id of gone) { delete mine[id]; console.log(`  ${f}: ${id}`); n++; }
    if (gone.length) writeFileSync(`${STATUS_DIR}/${f}`, `${JSON.stringify(mine, null, 1)}\n`);
  }
  console.log(`${n} statuses removed, their sources gone`);
} else if (args[0] === '--bless') {
  const by = {};
  for (const s of srcs) for (const h of s.speak) by[h.label] = (by[h.label] ?? 0) + 1;
  writeFileSync(RATCHET, `${JSON.stringify({ note: 'Set by tools/text-inventory.mjs --bless. These may fall. They may not rise.', counts: by }, null, 1)}\n`);
  console.log(by);
} else {
  const { totals, all } = write(srcs, statuses, args.includes('--write'));
  for (const [k] of SUBSYSTEMS) { const t = totals[k]; console.log(`${k.padEnd(14)} ${String(t.sources).padStart(5)} sources ${String(t.strings).padStart(6)} strings ${String(t.words).padStart(7)} words ${String(t.speak).padStart(5)} engine-speak; RV ${t['Rewritten And Verified']} RR ${t['Reviewed And Retained']} P ${t.Pending} B ${t.Blocked}`); }
  console.log(`all: ${all.sources} sources, ${all.strings} strings, ${all.words} words, ${all.speak} engine-speak hits; Rewritten And Verified ${all['Rewritten And Verified']}, Reviewed And Retained ${all['Reviewed And Retained']}, Pending ${all.Pending}, Blocked ${all.Blocked}`);
  if (args.includes('--check')) {
    const problems = [];
    const unknown = srcs.filter((s) => !statuses[s.id]);
    if (unknown.length) problems.push(`${unknown.length} sources no status names (a new source of player-facing text: review it and mark it): ${unknown.slice(0, 5).map((s) => s.id).join(', ')}${unknown.length > 5 ? ', …' : ''}`);
    const ratchet = load(RATCHET, null);
    if (ratchet) {
      const by = {};
      for (const s of srcs) for (const h of s.speak) by[h.label] = (by[h.label] ?? 0) + 1;
      for (const [label, n] of Object.entries(by)) if (n > (ratchet.counts[label] ?? 0)) problems.push(`engine-speak "${label}" rose to ${n}, over ${ratchet.counts[label] ?? 0} (docs/text/engine-speak.json): say it the player's way, or, where the word is right, say why in the source's status`);
    }
    const ids = new Set(srcs.map((s) => s.id));
    const gone = Object.keys(statuses).filter((id) => !ids.has(id));
    if (gone.length) problems.push(`${gone.length} statuses name sources that are gone: ${gone.slice(0, 3).join(', ')}${gone.length > 3 ? ', …' : ''} (--prune removes them)`);
    if (twice.length) problems.push(`${twice.length} sources claimed by two areas: ${twice.slice(0, 3).join('; ')}`);
    for (const p of problems) console.error(`  ${p}`);
    if (problems.length) process.exit(1);
    console.log('The text inventory holds.');
  }
}
