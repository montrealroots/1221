/**
 * The text inventory: every string the game can show a player, found in the source, grouped into the sources a writer
 * reviews, each with its status (from 2026-10-17, the owner's brief 14, "Complete Player-Facing Language And Tutorial
 * Overhaul").
 *
 *   node tools/text-inventory.mjs                     prints the totals by subsystem
 *   node tools/text-inventory.mjs --write             writes them, and every source, to docs/text/inventory.json and INVENTORY.md
 *   node tools/text-inventory.mjs --check             exits 1 on a source no status names, one Pending (its words changed
 *                                                     since it was read), one claimed twice, a status for a source that's
 *                                                     gone, or engine-speak over its ratchet
 *   node tools/text-inventory.mjs --show <pattern>    prints the strings of the sources whose id matches (a * is any run)
 *   node tools/text-inventory.mjs --mark <pattern> <status> --by <area> [--reason <text>] [--evidence <text>]
 *                                                     records a status for the matching sources, at their text as it is,
 *                                                     in docs/text/statuses/<area>.json
 *   node tools/text-inventory.mjs --speak [<pattern>] prints each engine-speak hit, with its source
 *   node tools/text-inventory.mjs --bless             sets docs/text/engine-speak.json to today's counts (they may fall)
 *   node tools/text-inventory.mjs --prune             removes the statuses of sources that are gone, and lists them
 *   node tools/text-inventory.mjs --mark2 <pattern> <status> --by <area> [--reason <text>] [--evidence <text>]
 *                                                     records a second-pass status (brief 15) for the matching sources, in
 *                                                     docs/text/second-pass/<area>.json; only the area that owns a source
 *                                                     (AREAS2) may mark it
 *   node tools/text-inventory.mjs --todo2 [<area>]    lists the sources still Pending in the second pass, by area and file
 *
 * A string is a string literal, a template (its ${…} written as {…}) or JSX text, in `src/` but the tests and the
 * gazetteer's data, or a string in a JSON file under `src/` the game imports, that reads as words: two or more of them, or one capitalised word a label would be. Ids, keys,
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
 *
 * The second pass (from 2026-10-19, the owner's brief 15, "Complete Natural-Language Editorial Pass, Including All
 * Retained Text"): every source is read again, whatever its first status, and given a second-pass status of its own in
 * docs/text/second-pass/<area>.json. The first pass's statuses stay as they were, the history the brief keeps. A source
 * counts as read when either pass's status matches its text. A rewrite in the second pass leaves the first's stale, and
 * that's expected, not a failure. Each source belongs to one second-pass area, by its file (AREAS2), and only that area
 * marks it. A Retained source gives a reason specific to it: "already reviewed", "grammatically correct" or "no flagged
 * words" isn't one (the brief, section 10). Once docs/text/second-pass-closed.json exists, --check also fails a source
 * the second pass hasn't read.
 */
import ts from 'typescript';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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
  ['profile', 'Player Profile, Attributes, Genres, Mastery And Progression', [/^src\/ui\/workspaces\/ProfileWorkspace\.tsx$/, /^src\/ui\/components\/(AttributesPanel|AdviceCard)\.tsx$/, /^src\/ui\/looks\/(actor|person|craft|genre)[\w-]*\.tsx?$/, /^src\/engine\/content\/(abilities|attributes-matrix|genres?|genre-[\w-]+|interpretation|approaches|personality-traits|contemporary|practice)\.ts$/, /^src\/engine\/systems\/(attributes|development|advice|experience|interpretation[\w-]*|genre[\w-]*|mastery|personality|practice|next-steps)\.ts$/, /^src\/engine\/content\/guide\/craft\.ts$/, /^src\/engine\/systems\/(register|engagement|artistry|learning)\.ts$/, /^src\/engine\/content\/(film-genres|demands|reference)\.ts$/, /^src\/engine\/content\/genre-demands\.json$/]],
  ['school', 'School, Classes, Coursework, Rehearsals, Productions, Assessments And Completion', [/^src\/ui\/workspaces\/SchoolWorkspace\.tsx$/, /^src\/ui\/components\/(BriefPane|ClassMoments|CourseworkPane|PlayingChooser|RehearsalProcess|StudyPlanPanels|WorkThrough)\.tsx$/, /^src\/ui\/looks\/classmate\.tsx$/, /^src\/ui\/looks\/school[\w-]*\.tsx?$/, /^src\/ui\/workspaces\/(school|coursework|classes|production|briefs?|practice)[\w-]*\.tsx?$/, /^src\/engine\/systems\/(school|coursework|feedback|classmates|production|plays?|briefs|evaluation|piece|material|ensemble|leave|cabaret|orientation|workload|grades?|review)[\w-]*\.ts$/, /^src\/engine\/content\/(school|coursework|tasks|material|piece|concerns|courses?|production|plays|roundups)[\w-]*\.ts$/, /^src\/engine\/content\/guide\/(school|coursework|productions)\.ts$/, /^src\/engine\/systems\/(workbook|workpieces|courserecord)\.ts$/, /^src\/engine\/content\/(workload|workbook|replacements)\.ts$/]],
  ['money', 'Money, Banking, Payments, Fees, Holds, Statements And Transactions', [/^src\/ui\/workspaces\/BankWorkspace\.tsx$/, /^src\/ui\/looks\/bank\.tsx$/, /^src\/ui\/bank\//, /^src\/ui\/looks\/money[\w-]*\.tsx?$/, /^src\/ui\/workspaces\/(money|bank)[\w-]*\.tsx?$/, /^src\/engine\/systems\/(bank\w*|banking|cards?|cardoffers|payments?|statements|lending|money|accounts?|security|savings|overdraft|switching|transfers?|fraud|rewards|credit\w*|bills?|rent|prices?|spend\w*|collections?|homeaccounts|roundups?|ledger)\.ts$/, /^src\/engine\/content\/(bank[\w-]*|cards|payments|accountlife|security|homeaccounts|pending|lending|fees|prices|currenc\w*|credit\w*)\.ts$/, /^src\/engine\/core\/(money|ledger|banknumbers)\.ts$/, /^src\/engine\/content\/guide\/money\.ts$/, /^src\/engine\/systems\/(accountlife|cardlife|cash|homeaccount|routing|obligations|earnings)\.ts$/, /^src\/engine\/content\/(cash|rents)\.ts$/, /^src\/engine\/content\/home-accounts\.json$/]],
  ['papers', 'Papers, Documents, Applications, Taxes And Status Notices', [/^src\/ui\/workspaces\/PapersWorkspace\.tsx$/, /^src\/ui\/components\/LienPanels\.tsx$/, /^src\/ui\/papers\//, /^src\/ui\/looks\/papers[\w-]*\.tsx?$/, /^src\/ui\/workspaces\/papers[\w-]*\.tsx?$/, /^src\/engine\/systems\/(documents?|passports?|licen[sc]es?|permission|visas?|status|tax\w*|benefits?|pension\w*|citizenship|residence|identity|idcard)\.ts$/, /^src\/engine\/content\/(passports|licenses|licensepaths|tax|statetax|visas?|documents?|benefits?|pensions?|safetynet|idcards?|permits?)[\w-]*\.ts$/, /^src\/engine\/content\/guide\/(papers|documents|taxes)\.ts$/, /^src\/engine\/systems\/(statetax|abroad|unemployment|assistance|homepensions|homebenefits|universalcredit|imss|socialsecurity|statepension|eiself|papervisits)\.ts$/, /^src\/engine\/content\/workrules\.ts$/]],
  // From 2026-10-20 (the owner's brief 19): the professional record, the agent and the work, and their screen and help,
  // ahead of the controls' rule so the Career screen is the career's.
  // The Actor Showcase's help joins them from 2026-10-21 (brief 19's showcase): its system and its panel already match.
  // Work abroad joins them from 2026-10-23 (brief 25, Module 1): the work trip and the countries' rules for screen work.
  // The ways of working join them from 2026-10-24 (brief 25, Module 5); until then the catch-all filed both under health.
  // The slate and the industry's organizations join them from 2026-10-24 (brief 27): the work the world makes, and who it names.
  ['career', 'The Professional Career: Profile, Portfolio, Representation And Work', [/^src\/engine\/systems\/(pro\w*|worktrip|contracts|series|workflow|awards|charts|slate)\.ts$/, /^src\/engine\/content\/(slate|industry)\.ts$/, /^src\/engine\/content\/workflows\.ts$/, /^src\/engine\/content\/(jurisdictions|catalog|series|awards|charts)\.ts$/, /^src\/engine\/content\/(agents|agencies|careerwork)\.ts$/, /^src\/engine\/content\/guide\/(career|showcase)\.ts$/, /^src\/ui\/workspaces\/Career\w*\.tsx$/, /^src\/ui\/career\//]],
  ['health', 'Health, Treatment, Coverage, Stamina, Energy And Recovery', [/^src\/ui\/looks\/(wellbeing|health|body)[\w-]*\.tsx?$/, /^src\/ui\/workspaces\/(health|life|body)[\w-]*\.tsx?$/, /^src\/engine\/systems\/(health\w*|body|injury|illness|therapy|appointments?|insurance|coverage|stamina|workload|energy|sleep|mortality|condition|pharmacy|prescriptions?|dental|hospital|care)\.ts$/, /^src\/engine\/content\/(health\w*|illness\w*|conditions?|insurance|clinics?|medic\w*|body)[\w-]*\.ts$/, /^src\/engine\/content\/guide\/body\.ts$/, /^src\/engine\/systems\/clinics\.ts$/, /^src\/engine\/content\/(carevisits|injury|lifespan)\.ts$/]],
  ['calendar', 'Calendar, Schedules, Time Advancement And Reminders', [/^src\/ui\/workspaces\/CalendarWorkspace\.tsx$/, /^src\/ui\/looks\/plans\.tsx$/, /^src\/ui\/looks\/(day|calendar|time|weather|place)[\w-]*\.tsx?$/, /^src\/engine\/systems\/(calendar|plans?|weather|time|day)\.ts$/, /^src\/engine\/world\/plans\.ts$/, /^src\/engine\/core\/(time|scheduler|sun|realclock)\.ts$/, /^src\/engine\/content\/guide\/day\.ts$/, /^src\/engine\/systems\/(seasons|birthdays)\.ts$/, /^src\/engine\/content\/(holidays|holiday-data|climate|thunder)\.ts$/]],
  ['notifications', 'Notifications, Invitations, Feedback And Generated Messages', [/^src\/ui\/looks\/(attention|notice\w*|news)[\w-]*\.tsx?$/, /^src\/engine\/world\//, /^src\/engine\/core\/(events|simulation|text)\.ts$/]],
  ['controls', 'Buttons, Menus, Tabs, Filters, Placeholders, Empty And Loading States, Confirmations', [/^src\/ui\/(components|shell)\//, /^src\/ui\/workspaces\//, /^src\/ui\/looks\//, /^src\/ui\/kept\.ts$/]],
  ['material', 'In-World Material: Scenes, Plays And Audition Sides, In Their Characters’ Voices', [/^src\/engine\/content\/(scenes-[\w-]+|briefs\/[\w-]+|plays|monologues?|sides)\.ts$/]],
  ['world', 'The World: Places, Countries, Weather And Reference Data', [/^src\/engine\/content\//, /^src\/engine\//]],
];
const subsystemOf = (file) => (SUBSYSTEMS.find(([, , rules]) => rules.some((r) => r.test(file))) ?? SUBSYSTEMS.at(-1))[0];

/**
 * The second pass's areas (brief 15), by file, the first rule that matches winning; a file no rule names goes by its
 * subsystem (BY_SUBSYSTEM). The guide's topic entries stay with the area whose screens they teach, as in brief 14.
 */
const AREAS2 = [
  ['tutorial', [/^src\/engine\/content\/tutorial\.ts$/, /^src\/engine\/content\/guide\/(index|types)\.ts$/, /^src\/ui\/guide\//, /^src\/engine\/world\/tutorial\.ts$/]],
  ['material-a', [/^src\/engine\/content\/briefs\/(briefs-[a-z]|index)\.ts$/, /^src\/engine\/content\/(scenes-[\w-]+|plays|monologues?|sides)\.ts$/]],
  ['material-b', [/^src\/engine\/content\/briefs\/second-[a-z]\.ts$/]],
  ['money-data', [/^src\/engine\/content\/(banks?-[\w-]+|bankopening|homeaccounts|security|accountlife|pending|cash|rents|roundups)\.ts$/, /^src\/engine\/content\/home-accounts\.json$/]],
  ['frame', [/^index\.html$/, /^public\//]],
  // Brief 19's builders each read their own new career sources in both passes (from 2026-10-21): the showcase's.
  ['career-showcase', [/^src\/engine\/systems\/proshowcase\.ts$/, /^src\/engine\/content\/guide\/showcase\.ts$/, /^src\/ui\/career\/SchoolShowcase\.tsx$/]],
  // From 2026-10-21 (brief 19's second wave): each career builder reads its own sources, so the agent's system and its
  // tab are the career area's part `career-agent`, marked and claimed apart from the core's `career`.
  // From 2026-10-24 (brief 25, Module 3) the agencies' own records too, read by the module that wrote them.
  ['career-agent', [/^src\/engine\/systems\/proagent\.ts$/, /^src\/ui\/career\/RepresentationPane\.tsx$/, /^src\/engine\/content\/agencies\.ts$/]],
  // From 2026-10-21 (brief 19's pay): its files, the pay system and the Career screen's Work tab, are its own builder's to
  // mark, apart from the core's career files, so the wave's builders working apart write their own second-pass files.
  // From 2026-10-24 (brief 25, Module 4) a contract's own sources too, and a series' seasons, read by the module that wrote them.
  ['career-pay', [/^src\/engine\/systems\/(propay|contracts|series)\.ts$/, /^src\/engine\/content\/series\.ts$/, /^src\/ui\/career\/WorkPane\.tsx$/]],
  // From 2026-10-21 (brief 19's work loop): the work loop's own sources, read by the area that built them, apart from the
  // career core's, so the builders working at once each keep their own status files.
  // From 2026-10-24 (brief 25, Module 5) the ways of working too, the work loop's own, read by the module that wrote them.
  // From 2026-10-24 (brief 27, Area B) the slate too, the work loop's supply, read by the area that built it.
  ['career-work', [/^src\/engine\/systems\/(projobs|workflow|slate)\.ts$/, /^src\/engine\/content\/(workflows|slate)\.ts$/, /^src\/ui\/career\/OpportunitiesPane\.tsx$/]],
  // From 2026-10-23 (brief 25, Module 1): work abroad's own sources, the trip and the countries' rules, read by the module
  // that wrote them.
  // From 2026-10-24 (brief 25, Module 6) the charts, the awards and festivals and their tab too: the industry's world,
  // read by the module that wrote them. Until they were named here they fell to the health area, the fallback's.
  // From 2026-10-24 (brief 27) the industry's organizations, FIA's unions and FIAPF's festivals, the industry's world.
  ['career-world', [/^src\/engine\/systems\/(worktrip|awards|charts)\.ts$/, /^src\/engine\/content\/(jurisdictions|catalog|awards|charts|industry)\.ts$/, /^src\/ui\/career\/IndustryPane\.tsx$/]],
];
const BY_SUBSYSTEM = { start: 'frame', home: 'frame', calendar: 'frame', notifications: 'frame', controls: 'frame', tutorial: 'tutorial', profile: 'profile', school: 'school', money: 'money', papers: 'papers', career: 'career', health: 'health', world: 'health', material: 'material-a' };
const areaOf2 = (file) => AREAS2.find(([, rules]) => rules.some((r) => r.test(file)))?.[0] ?? BY_SUBSYSTEM[subsystemOf(file)] ?? 'frame';
const SECOND_STATUSES = ['Rewritten', 'Retained', 'Pending', 'Blocked'];
const NEEDS2 = { Retained: 'reason', Blocked: 'reason', Rewritten: 'evidence' };
/** Reasons the brief rules out for keeping a sentence (section 10), and a floor on how much a reason says. */
const GENERIC_REASON = /\b(already (been )?(reviewed|rewritten|read|checked)|grammatical(ly)? (correct|fine)|no flagged|reads (fine|well|ok)|(is|was) fine|fine as (it is|is)|ok as is|no change(s)? needed|unchanged|good as is|nothing to change|looks good|kept as is|as before)\b/i;
const reasonProblem = (r) => (!r ? 'a reason is needed' : r.trim().split(/\s+/).length < 8 ? 'a reason says why this source stays, in at least eight words' : GENERIC_REASON.test(r) ? 'that reason is one the brief rules out (section 10): say what this text does well for its player' : null);
const evidenceProblem = (e) => (!e ? 'evidence is needed' : e.trim().split(/\s+/).length < 4 || !/test|tools\/|\.mjs|\.ts\b|walk|screen|built app|played|render|journey|harness|examples|save/i.test(e) ? 'evidence names the test, the tool output, or the screen of the built app where the new words were read' : null);

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
/** The JSON files under src/ that the game imports. */
function walkJson(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return SKIP_DIRS.has(f) ? [] : walkJson(p);
    return f.endsWith('.json') ? [slashes(p)] : [];
  });
}
/** Words, not an id, a key, a class name, a path, a format or a number. */
function isWords(t) {
  const s = t.trim();
  if (s.length < 2 || !/[A-Za-z]/.test(s)) return false;
  // A web address alone isn't words, but one followed by words is a citation a screen shows: until 2026-10-19 (brief 15's
  // coordinator) any string that began with an address was set aside, and with it every genre's "Source for its
  // definition" line and 22 other citations.
  if (/^(https?:\S*$|mailto:|\/|\.\/|\.\.\/|#|var\(|rgba?\(|calc\()/.test(s)) return false;
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
  // JSON a screen reads (from 2026-10-17: the profile area found the genres' research text in `genre-demands.json`
  // shown on the genre look and in no source). Each top-level key is a declaration; its entries, by key or by id, are
  // the sources; every string in them that reads as words is a string, at the line it's written on.
  for (const file of walkJson(ROOT)) {
    const raw = readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    const lines = raw.split('\n');
    const lineOf = (text) => { const needle = JSON.stringify(text).slice(1, 41); const i = lines.findIndex((l) => l.includes(needle)); return i + 1; };
    const add = (id, decl, anchor, text) => {
      if (!sources.has(id)) sources.set(id, { id, file, decl, anchor, subsystem: subsystemOf(file), strings: [] });
      sources.get(id).strings.push({ line: lineOf(text), kind: /[.?!]$/.test(text.trim()) || text.split(' ').length > 7 ? 'prose' : 'label', text });
    };
    const leaves = (v, cb) => { if (typeof v === 'string') { if (isWords(v)) cb(v); } else if (Array.isArray(v)) v.forEach((x) => leaves(x, cb)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => leaves(x, cb)); };
    for (const [top, v] of Object.entries(data)) {
      const entries = v && typeof v === 'object' ? (Array.isArray(v) ? v.map((x, i) => [x && typeof x === 'object' && typeof x.id === 'string' ? x.id : String(i), x]) : Object.entries(v)) : null;
      if (entries && entries.length > 1 && entries.every(([, x]) => x && typeof x === 'object')) for (const [k, x] of entries) leaves(x, (t) => add(`${file}#${top} [${k}]`, top, `[${k}]`, t));
      else leaves(v, (t) => add(`${file}#${top}`, top, null, t));
    }
  }
  // Outside src/ (from 2026-10-19, brief 15's check of the inventory against the built app, `tools/text-omissions.mjs`):
  // the page's own title and description in index.html, and the holiday names the calendar shows from
  // public/holidays/, one source of every distinct English name. The gazetteer's place names in public/geo/ are proper
  // names, shown as the data spells them, and are recorded as an omission with that reason, not read here.
  if (existsSync('index.html')) {
    const html = readFileSync('index.html', 'utf8');
    const head = [...html.matchAll(/<title>([^<]+)<\/title>|<meta name="description" content="([^"]+)"/g)].map((m) => m[1] ?? m[2]);
    if (head.length) sources.set('index.html#head', { id: 'index.html#head', file: 'index.html', decl: 'head', anchor: null, subsystem: 'start', strings: head.map((text) => ({ line: html.split('\n').findIndex((l) => l.includes(text)) + 1, kind: 'label', text })) });
  }
  if (existsSync('public/holidays')) {
    const names = new Set();
    for (const f of readdirSync('public/holidays').filter((x) => x.endsWith('.tsv')).sort()) for (const l of readFileSync(`public/holidays/${f}`, 'utf8').split('\n')) { const c = l.split('\t'); if (!l.startsWith('#') && c.length >= 3 && c[2].trim()) names.add(c[2].trim()); }
    if (names.size) sources.set('public/holidays#names', { id: 'public/holidays#names', file: 'public/holidays', decl: 'names', anchor: null, subsystem: 'calendar', strings: [...names].sort().map((text) => ({ line: 0, kind: 'label', text })) });
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

const SECOND_DIR = `${OUT}/second-pass`;
const SECOND_CLOSED = `${OUT}/second-pass-closed.json`;
/** The second pass's statuses, one file per area; a record in a file other than its source's area is a problem. */
function loadSecond() {
  const all = {}, misfiled = [];
  if (!existsSync(SECOND_DIR)) return { all, misfiled };
  for (const f of readdirSync(SECOND_DIR).filter((x) => x.endsWith('.json')).sort()) {
    const area = f.slice(0, -5);
    for (const [id, st] of Object.entries(JSON.parse(readFileSync(`${SECOND_DIR}/${f}`, 'utf8')))) {
      if (all[id]) misfiled.push(`${id} (${all[id].area} and ${area})`);
      all[id] = { ...st, area };
    }
  }
  return { all, misfiled };
}
function secondOf(s, second) {
  const st = second[s.id];
  if (!st) return { status: 'Pending', why: 'not yet read in the second pass' };
  if (st.hash !== s.hash) return { status: 'Pending', why: `changed since the second pass marked it ${st.status} (${st.on ?? ''})`, was: st.status };
  return st;
}
/** Read by either pass: its first status or its second matches its words, and neither of those is Pending. */
const isRead = (s, statuses, second) => (statuses[s.id] && statusOf(s, statuses).status !== 'Pending') || (second[s.id] && secondOf(s, second).status !== 'Pending');

function write(srcs, statuses, toDisk, second = {}) {
  const rows = srcs.map((s) => { const two = secondOf(s, second); return { ...s, ...statusOf(s, statuses), strings: s.strings, area2: areaOf2(s.file), second: two.status, secondWhy: two.reason ?? two.evidence ?? two.why ?? '' }; });
  const totals = {};
  const zero2 = () => Object.fromEntries(SECOND_STATUSES.map((x) => [`second ${x}`, 0]));
  for (const [key, name] of SUBSYSTEMS) totals[key] = { name, sources: 0, strings: 0, words: 0, speak: 0, ...Object.fromEntries(STATUSES.map((x) => [x, 0])), ...zero2() };
  for (const r of rows) { const t = totals[r.subsystem]; t.sources++; t.strings += r.strings.length; t.words += r.words; t.speak += r.speak.length; t[r.status]++; t[`second ${r.second}`]++; }
  const areas2 = {};
  for (const r of rows) { const a = (areas2[r.area2] ??= { sources: 0, words: 0, ...zero2() }); a.sources++; a.words += r.words; a[`second ${r.second}`]++; }
  const all = { sources: rows.length, strings: rows.reduce((n, r) => n + r.strings.length, 0), words: rows.reduce((n, r) => n + r.words, 0), speak: rows.reduce((n, r) => n + r.speak.length, 0), ...Object.fromEntries(STATUSES.map((x) => [x, rows.filter((r) => r.status === x).length])), ...Object.fromEntries(SECOND_STATUSES.map((x) => [`second ${x}`, rows.filter((r) => r.second === x).length])) };
  if (!toDisk) return { totals, all, areas2 };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/inventory.json`, `${JSON.stringify({ written: 'by tools/text-inventory.mjs --write, from src/ and docs/text/statuses/', totals, all, areas2, sources: rows.map(({ strings, speak, ...r }) => ({ ...r, strings: strings.length, lines: [...new Set(strings.map((x) => x.line))], speak: speak.map((h) => `${h.line} ${h.label}`) })) })}\n`);
  const esc = (t) => String(t).replace(/\|/g, '/').replace(/\n/g, ' ');
  const md = ['# The Text Inventory', '', 'Every string the game can show, by source and subsystem, written by `tools/text-inventory.mjs --write` from `src/` and `statuses/`. Nothing here is typed. A status is recorded with a hash of its source’s strings; a source changed since is Pending again until it’s read again.', '',
    'Two passes. The first, brief 14’s, is kept as its history: Rewritten And Verified, Reviewed And Retained, Pending, Blocked (`statuses/`). The second, brief 15’s, read every source again: Rewritten, Retained, Pending, Blocked (`second-pass/`). A source rewritten in the second pass shows its first status as changed since; that’s the history, not a gap.', '',
    '## The Second Pass, By Subsystem', '',
    '| Subsystem | Sources | Strings | Words | Engine-Speak Hits | Rewritten | Retained | Pending | Blocked |', '|---|---|---|---|---|---|---|---|---|',
    ...SUBSYSTEMS.map(([k]) => { const t = totals[k]; return `| ${t.name} | ${t.sources} | ${t.strings} | ${t.words} | ${t.speak} | ${t['second Rewritten']} | ${t['second Retained']} | ${t['second Pending']} | ${t['second Blocked']} |`; }),
    `| **All** | ${all.sources} | ${all.strings} | ${all.words} | ${all.speak} | ${all['second Rewritten']} | ${all['second Retained']} | ${all['second Pending']} | ${all['second Blocked']} |`, '',
    '## The Second Pass, By Area', '', '| Area | Sources | Words | Rewritten | Retained | Pending | Blocked |', '|---|---|---|---|---|---|---|',
    ...Object.entries(areas2).sort().map(([a, x]) => `| ${a} | ${x.sources} | ${x.words} | ${x['second Rewritten']} | ${x['second Retained']} | ${x['second Pending']} | ${x['second Blocked']} |`), '',
    '## The First Pass, By Subsystem', '',
    '| Subsystem | Sources | Rewritten And Verified | Reviewed And Retained | Pending | Blocked |', '|---|---|---|---|---|---|',
    ...SUBSYSTEMS.map(([k]) => { const t = totals[k]; return `| ${t.name} | ${t.sources} | ${t['Rewritten And Verified']} | ${t['Reviewed And Retained']} | ${t.Pending} | ${t.Blocked} |`; }),
    `| **All** | ${all.sources} | ${all['Rewritten And Verified']} | ${all['Reviewed And Retained']} | ${all.Pending} | ${all.Blocked} |`, ''];
  for (const [k] of SUBSYSTEMS) {
    const rs = rows.filter((r) => r.subsystem === k);
    if (!rs.length) continue;
    md.push(`## ${totals[k].name}`, '', '| Source | Strings | Engine-Speak | Second Pass | Area | Reason Or Evidence | First Pass |', '|---|---|---|---|---|---|---|');
    for (const r of rs) md.push(`| \`${esc(r.id)}\` | ${r.strings.length} | ${r.speak.length} | ${r.second} | ${r.area2} | ${esc(r.secondWhy)} | ${r.status} |`);
    md.push('');
  }
  writeFileSync(`${OUT}/INVENTORY.md`, md.join('\n'));
  return { totals, all, areas2 };
}

// Run as a command, not when another tool imports `inventory` (from 2026-10-19: `tools/text-omissions.mjs` reads it).
const MAIN = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
const args = MAIN ? process.argv.slice(2) : ['--quiet'];
const flag = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const srcs = MAIN ? inventory() : [];
const { all: statuses, twice } = loadStatuses();
const { all: second, misfiled } = loadSecond();

if (args[0] === '--show') {
  const re = glob(args[1] ?? '*');
  for (const s of srcs.filter((x) => re.test(x.id))) {
    const st = statusOf(s, statuses);
    const two = secondOf(s, second);
    console.log(`\n## ${s.id}  [${s.subsystem}; area ${areaOf2(s.file)}; second pass ${two.status}; first pass ${st.status}; ${s.speak.length} engine-speak]`);
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
} else if (args[0] === '--mark2') {
  const re = glob(args[1]);
  const status = args[2];
  if (!SECOND_STATUSES.includes(status)) { console.error(`a second-pass status is one of: ${SECOND_STATUSES.join('; ')}`); process.exit(2); }
  const reason = flag('--reason'), evidence = flag('--evidence'), by = flag('--by');
  if (!by || !/^[a-z0-9-]+$/.test(by)) { console.error('--by <area> names the second-pass area: docs/text/second-pass/<area>.json'); process.exit(2); }
  const need = NEEDS2[status];
  const bad = need === 'reason' ? reasonProblem(reason) : need === 'evidence' ? evidenceProblem(evidence) : null;
  if (bad) { console.error(`${status}: ${bad}`); process.exit(2); }
  const hit = srcs.filter((x) => re.test(x.id));
  if (!hit.length) { console.error(`no source matches ${args[1]}`); process.exit(2); }
  const others = hit.filter((x) => areaOf2(x.file) !== by);
  if (others.length) { console.error(`${others.length} of these sources aren't ${by}'s to mark (AREAS2): ${others.slice(0, 5).map((x) => `${x.id} (${areaOf2(x.file)})`).join(', ')}`); process.exit(2); }
  const on = flag('--on') ?? execFileSync('git', ['log', '-1', '--format=%cs'], { encoding: 'utf8' }).trim();
  const file = `${SECOND_DIR}/${by}.json`;
  const mine = load(file, {});
  for (const s of hit) mine[s.id] = { status, hash: s.hash, on, ...(reason ? { reason } : {}), ...(evidence ? { evidence } : {}), first: statusOf(s, statuses).status };
  mkdirSync(SECOND_DIR, { recursive: true });
  writeFileSync(file, `${JSON.stringify(Object.fromEntries(Object.entries(mine).sort(([a], [b]) => a.localeCompare(b))), null, 1)}\n`);
  console.log(`${hit.length} sources marked ${status} in the second pass`);
} else if (args[0] === '--todo2') {
  const want = args[1];
  const left = srcs.filter((s) => (!want || areaOf2(s.file) === want) && secondOf(s, second).status === 'Pending');
  const byFile = {};
  for (const s of left) { const k = `${areaOf2(s.file)}  ${s.file}`; (byFile[k] ??= { n: 0, words: 0 }); byFile[k].n++; byFile[k].words += s.words; }
  for (const [k, v] of Object.entries(byFile).sort()) console.log(`${k}: ${v.n} sources, ${v.words} words`);
  console.log(`${left.length} sources Pending in the second pass${want ? ` for ${want}` : ''}`);
} else if (args[0] === '--prune') {
  const ids = new Set(srcs.map((s) => s.id));
  let n = 0;
  for (const dir of [STATUS_DIR, SECOND_DIR]) for (const f of existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith('.json')) : []) {
    const mine = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    const gone = Object.keys(mine).filter((id) => !ids.has(id));
    for (const id of gone) { delete mine[id]; console.log(`  ${dir}/${f}: ${id}`); n++; }
    if (gone.length) writeFileSync(`${dir}/${f}`, `${JSON.stringify(mine, null, 1)}\n`);
  }
  console.log(`${n} statuses removed, their sources gone`);
} else if (args[0] === '--bless') {
  const by = {};
  for (const s of srcs) for (const h of s.speak) by[h.label] = (by[h.label] ?? 0) + 1;
  writeFileSync(RATCHET, `${JSON.stringify({ note: 'Set by tools/text-inventory.mjs --bless. These may fall. They may not rise.', counts: by }, null, 1)}\n`);
  console.log(by);
} else if (MAIN) {
  const { totals, all, areas2 } = write(srcs, statuses, args.includes('--write'), second);
  for (const [k] of SUBSYSTEMS) { const t = totals[k]; console.log(`${k.padEnd(14)} ${String(t.sources).padStart(5)} sources ${String(t.strings).padStart(6)} strings ${String(t.words).padStart(7)} words ${String(t.speak).padStart(5)} engine-speak; second pass: Rewritten ${t['second Rewritten']} Retained ${t['second Retained']} Pending ${t['second Pending']} Blocked ${t['second Blocked']}; first: RV ${t['Rewritten And Verified']} RR ${t['Reviewed And Retained']} P ${t.Pending} B ${t.Blocked}`); }
  for (const [a, x] of Object.entries(areas2).sort()) console.log(`area ${a.padEnd(11)} ${String(x.sources).padStart(5)} sources ${String(x.words).padStart(7)} words; Rewritten ${x['second Rewritten']} Retained ${x['second Retained']} Pending ${x['second Pending']} Blocked ${x['second Blocked']}`);
  console.log(`all: ${all.sources} sources, ${all.strings} strings, ${all.words} words, ${all.speak} engine-speak hits; second pass: Rewritten ${all['second Rewritten']}, Retained ${all['second Retained']}, Pending ${all['second Pending']}, Blocked ${all['second Blocked']}; first pass: Rewritten And Verified ${all['Rewritten And Verified']}, Reviewed And Retained ${all['Reviewed And Retained']}, Pending ${all.Pending}, Blocked ${all.Blocked}`);
  if (args.includes('--check')) {
    const problems = [];
    // A source either pass names (from brief 15, 2026-10-19: a source new in the second pass has no first status).
    const unknown = srcs.filter((s) => !statuses[s.id] && !second[s.id]);
    if (unknown.length) problems.push(`${unknown.length} sources no status names (a new source of player-facing text: review it and mark it): ${unknown.slice(0, 5).map((s) => s.id).join(', ')}${unknown.length > 5 ? ', …' : ''}`);
    // Nothing a player reads is left unread (from the end of brief 14, 2026-10-17, once every source had been read): a
    // source whose words changed since its status, or one marked Pending, fails until it's read again and marked. Until
    // then Pending was counted and allowed, while the areas worked through 4,147 sources. From brief 15 (2026-10-19) a
    // source is read when either pass's status matches its words: a second-pass rewrite leaves the first stale.
    const pending = srcs.filter((s) => (statuses[s.id] || second[s.id]) && !isRead(s, statuses, second));
    if (pending.length) problems.push(`${pending.length} sources Pending, their words changed since they were read (read each against docs/STYLE.md, then --mark2 it): ${pending.slice(0, 5).map((s) => s.id).join(', ')}${pending.length > 5 ? ', …' : ''}`);
    // The second pass closed (brief 15): every source read in it.
    if (existsSync(SECOND_CLOSED)) {
      const unread = srcs.filter((s) => secondOf(s, second).status === 'Pending');
      if (unread.length) problems.push(`${unread.length} sources the second pass hasn't read, or whose words changed since (--todo2 lists them): ${unread.slice(0, 5).map((s) => s.id).join(', ')}${unread.length > 5 ? ', …' : ''}`);
    }
    const wrongArea = Object.entries(second).filter(([id, st]) => { const s = srcs.find((x) => x.id === id); return s && areaOf2(s.file) !== st.area; });
    if (wrongArea.length) problems.push(`${wrongArea.length} second-pass statuses in another area's file: ${wrongArea.slice(0, 3).map(([id, st]) => `${id} in ${st.area}`).join('; ')}`);
    if (misfiled.length) problems.push(`${misfiled.length} sources with two second-pass statuses: ${misfiled.slice(0, 3).join('; ')}`);
    const weak = Object.entries(second).filter(([, st]) => st.status === 'Retained' && reasonProblem(st.reason));
    if (weak.length) problems.push(`${weak.length} Retained sources whose reason the brief rules out: ${weak.slice(0, 3).map(([id]) => id).join(', ')}`);
    const ratchet = load(RATCHET, null);
    if (ratchet) {
      const by = {};
      for (const s of srcs) for (const h of s.speak) by[h.label] = (by[h.label] ?? 0) + 1;
      for (const [label, n] of Object.entries(by)) if (n > (ratchet.counts[label] ?? 0)) problems.push(`engine-speak "${label}" rose to ${n}, over ${ratchet.counts[label] ?? 0} (docs/text/engine-speak.json): say it the player's way, or, where the word is right, say why in the source's status`);
    }
    const ids = new Set(srcs.map((s) => s.id));
    const gone = [...Object.keys(statuses), ...Object.keys(second)].filter((id) => !ids.has(id));
    if (gone.length) problems.push(`${gone.length} statuses name sources that are gone: ${gone.slice(0, 3).join(', ')}${gone.length > 3 ? ', …' : ''} (--prune removes them)`);
    if (twice.length) problems.push(`${twice.length} sources claimed by two areas: ${twice.slice(0, 3).join('; ')}`);
    for (const p of problems) console.error(`  ${p}`);
    if (problems.length) process.exit(1);
    console.log('The text inventory holds.');
  }
}
