/**
 * Holds the game to one spelling: American English.
 *
 * SLATE was written in British English by accident rather than decision —
 * color, jewelry, gray, center, theater — and the player reads American.
 * A game that spells the same word two ways looks unfinished, so this makes
 * it one way and keeps it there.
 *
 * Three rules, and the second two are the ones that matter:
 *
 * 1. **Only what a player reads.** String literals and comments. Never an
 *    identifier, never an object key, never an id. `wardrobe.color` is a
 *    field inside every save ever written and it stays `color`; the label it
 *    prints becomes "Color". The same goes for the `jewelry` wardrobe slot,
 *    the `jewelry` dialogue section, and every catalog id.
 * 2. **Never a real name.** Kalyan Jewellers spells itself that way. So do
 *    Chow Tai Fook Jewellery Group, the Theatre Royal, the Centre Pompidou
 *    and the Labour Party. Correcting somebody else's name is not tidying, it
 *    is being wrong, so anything on the allowlist below is left exactly as
 *    its owner writes it.
 * 3. **Only whole words**, and case is carried across: Color to Color,
 *    color to color, COLOR to COLOR.
 *
 * Run `node tools/spelling.mjs` to report, `--write` to fix.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';

/** British spelling on the left, what SLATE says on the right. */
const SPELLINGS = {
  jewellery: 'jewelry', jeweller: 'jeweler', jewellers: 'jewelers', jewelleries: 'jewelries',
  jewelled: 'jeweled', jewellery_: 'jewelry_',
  colour: 'color', colours: 'colors', coloured: 'colored', colouring: 'coloring',
  colourway: 'colorway', colourways: 'colorways', colourless: 'colorless', colourful: 'colorful',
  favourite: 'favorite', favourites: 'favorites', favour: 'favor', favours: 'favors', favoured: 'favored',
  neighbour: 'neighbor', neighbours: 'neighbors', neighbourhood: 'neighborhood', neighbourhoods: 'neighborhoods',
  behaviour: 'behavior', behaviours: 'behaviors',
  honour: 'honor', honours: 'honors', honoured: 'honored',
  flavour: 'flavor', flavours: 'flavors', flavoured: 'flavored',
  humour: 'humor', rumour: 'rumor', rumours: 'rumors', armour: 'armor',
  vapour: 'vapor', odour: 'odor', odours: 'odors', savour: 'savor', savoury: 'savory',
  endeavour: 'endeavor', harbour: 'harbor', harbours: 'harbors',
  labour: 'labor', labours: 'labors', laboured: 'labored',
  grey: 'gray', greys: 'grays', greying: 'graying',
  centre: 'center', centres: 'centers', centred: 'centered',
  theatre: 'theater', theatres: 'theaters',
  metre: 'meter', metres: 'meters', kilometre: 'kilometer', kilometres: 'kilometers',
  litre: 'liter', litres: 'liters', fibre: 'fiber', fibres: 'fibers',
  sombre: 'somber', lustre: 'luster', calibre: 'caliber', manoeuvre: 'maneuver',
  realise: 'realize', realised: 'realized', realising: 'realizing',
  organise: 'organize', organised: 'organized', organising: 'organizing', organisation: 'organization',
  recognise: 'recognize', recognised: 'recognized', recognising: 'recognizing',
  apologise: 'apologize', apologised: 'apologized', apologising: 'apologizing',
  analyse: 'analyze', analysed: 'analyzed', analysing: 'analyzing',
  memorise: 'memorize', memorised: 'memorized', criticise: 'criticize', criticised: 'criticized',
  emphasise: 'emphasize', emphasised: 'emphasized', specialise: 'specialize', specialised: 'specialized',
  summarise: 'summarize', summarised: 'summarized',
  defence: 'defense', offence: 'offense', pretence: 'pretense', licence: 'license', licences: 'licenses', licenced: 'licensed',
  practise: 'practice', practising: 'practicing',
  travelled: 'traveled', travelling: 'traveling', traveller: 'traveler', travellers: 'travelers',
  cancelled: 'canceled', cancelling: 'canceling', modelled: 'modeled', modelling: 'modeling',
  marvellous: 'marvelous', signalled: 'signaled', fuelled: 'fueled', refuelled: 'refueled',
  catalogue: 'catalog', catalogues: 'catalogs', catalogued: 'cataloged',
  programme: 'program', programmes: 'programs',
  cheque: 'check', cheques: 'checks', kerb: 'curb', kerbs: 'curbs',
  tyre: 'tire', tyres: 'tires', aluminium: 'aluminum', moustache: 'mustache',
  pyjamas: 'pajamas', storey: 'story', storeys: 'stories', plough: 'plow',
  draught: 'draft', draughts: 'drafts', speciality: 'specialty', specialities: 'specialties',
  aeroplane: 'airplane', whilst: 'while', amongst: 'among', learnt: 'learned',
  spelt: 'spelled', dreamt: 'dreamed', sceptical: 'skeptical', scepticism: 'skepticism',
  mould: 'mold', moulded: 'molded', smoulder: 'smolder', smouldering: 'smoldering',
  gemmologist: 'gemologist', gemmology: 'gemology',
  jewel_: 'jewel_',
};

/**
 * Names that are spelled the way their owner spells them.
 *
 * Every one is a real company, venue, institution or place. Anything matching
 * one of these is left alone even where it contains a word this file would
 * otherwise change. Adding to this list means finding the name on the
 * owner's own signage, not guessing.
 */
const REAL_NAMES = [
  // Jewelers who spell themselves that way.
  'Kalyan Jewellers', 'Chow Tai Fook Jewellery', 'PC Jeweller', 'Joyalukkas',
  'Silverbend Jewellers', 'Halliwell Goldsmiths',
  // Venues and institutions.
  'Theatre Royal', 'Old Vic', 'National Theatre', 'Barbican Centre', 'Centre Pompidou',
  // Point Grey is the headland the University of British Columbia stands on.
  'Point Grey',
  // The studio behind Total Extreme Wrestling, named in docs/DEPTH.md. It is a
  // company, not a color.
  'Grey Dog Software',
  'Southbank Centre', 'Sydney Theatre', 'Abbey Theatre', 'Lyric Theatre', 'Apollo Theatre',
  'Dolby Theatre', 'Pantages Theatre', 'Chinese Theatre', 'Egyptian Theatre', 'Yale Repertory Theatre',
  // Retail chains that spell themselves that way.
  'Text Book Centre', 'Home Centre', 'Centrepoint', 'Community Care Centre',
  // Cinema chains and classification bodies that spell themselves that way.
  'AMC Theatres', 'Marcus Theatres', 'Landmark Theatres', 'Alamo Drafthouse',
  'Harkins Theatres', 'Shaw Theatres',
  // Venues that spell themselves that way, and the square one of them is on.
  'Bell Centre', 'National Centre For The Performing Arts', 'Bolshoi Theatre', 'Theatre Square',
  'Centre National du Cinéma',
  // Toronto's waterfront center, whose Nautical Centre charters a boat and skipper (`content/boats.ts`).
  'Harbourfront Centre', 'Nautical Centre',
  // The license Britain's CAA, Ireland's IAA and Transport Canada issue a private pilot (`systems/aviation.ts`).
  'Private Pilot Licence',
  'Rockefeller Center', 'Lincoln Center', 'Kennedy Center',
  // Organisations, parties and titles.
  'Labour Party', 'Colour Supplies', 'Grey Goose', 'Earl Grey', 'Greyhound',
  'Harbour Bridge', 'Darling Harbour', 'Circular Quay', 'Pearl Harbor',
  // Product and brand names that carry one of these words.
  'Colorful Standard', 'Grey Label', 'Metre Cube',
  // Houses and sportswear brands that print themselves this way, everywhere.
  'Under Armour', 'Run Favourite', 'Nail Colour',
  // Under Armour spells its own product lines the same way it spells itself.
  'HeatGear Armour', 'ColdGear Armour', 'Armour Fleece', 'Gameday Armour',
  // MAC, Creamsource and Sony print these product names this way worldwide.
  'Micro Colour', 'Face Colour', 'Cream Colour Base', 'Duo Fibre', 'Fibre Gel', 'Bravia Theatre',
  // Offices and insurers that spell themselves that way.
  'National Driver Licence Service', 'Driving Licence Testing Centre', 'Defence Health',
  // Driving documents as the authority that issues them names them, in its own
  // English: the DVLA and DVA, the RSA, Ontario, ICBC, Transport for NSW and
  // NZTA (src/engine/content/licensepaths.ts). A translated name is American.
  'Provisional Driving Licence', 'Full Driving Licence', 'Full Licence', 'Provisional Licence', 'Learner Licence',
  'Restricted Licence', 'Unrestricted Licence', 'Novice Licence', 'Driver’s Licence', 'G1 Licence', 'G2 Licence',
  'G Licence', 'P1 Licence', 'P2 Licence',
  // The managers' body the UK Theatre/Equity agreements are named for.
  'UK Theatre',
  // Watch and jewelry names the maker itself spells this way, on its own American pages.
  'Bulgari Aluminium', 'Aluminium Watch', 'Aluminium Chronograph', 'Calibre 321', 'Grey Side Of The Moon', 'Grey Mother Of Pearl',
  // Christian Louboutin Beaute prints the British spelling on the tube everywhere.
  'Lip Colour', 'Nail Colour', 'Eye Colour',
  // The Loro Piana jacket carries this name on its own label.
  'Traveller Jacket',
  // Banking names and pages spelled by their own banks and governments.
  'Cuenta de Cheques', 'cuentas-cheques', 'cheque-accounts', 'Special Defence Contribution',
  'special-defence-contribution', 'Youth Programme', 'bankers-association/organisation',
  // A town in Alabama spelled the British way, whose id is in the home values' table.
  'al-centre',
];

const EXTENSIONS = /\.(ts|tsx|mjs|md)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage']);

/**
 * Directories holding somebody else's words rather than SLATE's.
 *
 * `docs/research/` is captured source material: published specifications,
 * engineering standards, quantity-surveying figures and trade practice, most
 * of it British or European and most of it quoting operators who spell it
 * their own way. Americanising a quotation is not a house-style fix, it is
 * editing a source, and a research file that has been edited is worth less
 * than one that has not. The house style governs what the game says.
 */
// The airports' table is nothing but real names as OurAirports records them, a seaplane base's and a flight
// school's among them, each spelled its owner's way (src/engine/content/airports.ts, tools/build-airports.mjs).
const NOT_OURS = ['docs/research', 'src/engine/content/airports.ts'];
const oursToFix = (path) => !NOT_OURS.some((dir) => path.startsWith(dir));

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    // Forward slashes, always. Every exemption and allowlist in this file is
    // written with them, and `join` would hand back backslashes on Windows.
    const path = `${dir}/${entry}`;
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (EXTENSIONS.test(path)) out.push(path);
  }
  return out;
}

/** Carries the source word's case onto the replacement. */
function matchCase(source, replacement) {
  if (source === source.toUpperCase() && source.length > 1) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

const WORDS = Object.keys(SPELLINGS).filter((w) => !w.endsWith('_')).sort((a, b) => b.length - a.length);
const PATTERN = new RegExp(`\\b(${WORDS.join('|')})\\b`, 'gi');

/**
 * Spans of a line that must not be touched: identifiers, object keys, ids,
 * imports, and any real name.
 *
 * An identifier is anything not inside a string or a comment. Rather than
 * parse TypeScript, this finds the parts of the line that ARE quoted or
 * commented and only rewrites inside those, which is the same answer with far
 * less that can go wrong.
 */
function editableSpans(line, tsx = false) {
  const spans = [];
  // A comment runs to the end of the line. The third element records that,
  // because a backtick means something different in a comment.
  const comment = line.indexOf('//');
  const star = line.search(/^\s*\*|^\s*\/\*/);
  if (star === 0) spans.push([0, line.length, true]);
  else if (comment >= 0 && !insideString(line, comment)) spans.push([comment, line.length, true]);

  // String literals, of all three kinds.
  const re = /(['"`])(?:\\.|(?!\1)[^\\])*\1/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    // An import path or a lone lowercase token is an id, not a sentence.
    const inner = m[0].slice(1, -1);
    // A lone lowercase token is an id, not a sentence. This was widened once to
    // make an exception for words the map below knows, on the theory that a
    // real English word cannot be an identifier. It can: `'cancelled'` is a
    // `ScheduleStatus` written into every save, `'neighbourhood'` is a record
    // discriminant, and `of('theatre', 'Theater')` is an id whose label is
    // already spelled the house way. The house style governs what the game
    // says, and a discriminant is not something it says.
    if (/^[a-z0-9_./@-]+$/.test(inner)) continue;
    if (/\bfrom\s*$/.test(line.slice(0, m.index))) continue;
    const start = m.index + 1;
    const end = m.index + m[0].length - 1;
    // `${...}` inside a template literal is code, not prose. Every identifier
    // this sweep ever broke was in one, so the holes are cut out here rather
    // than repaired afterwards.
    if (m[0][0] === '`') spans.push(...outsideInterpolations(line, start, end));
    else spans.push([start, end, false]);
  }

  // And the text between tags, which is where a game's sentences actually
  // live. This swept comments and string literals only, so every rendered line
  // in every .tsx in the build was invisible to it — `voice-check.mjs` next
  // door had the JSX rule and this one did not. It was found by a screenshot
  // with a stage size on it spelled the British way, in a sentence the player
  // reads, after this tool had just called the whole repository clean.
  if (tsx) {
    const jsx = />([^<>{}]*[A-Za-z][^<>{}]*)</g;
    let j;
    while ((j = jsx.exec(line)) !== null) spans.push([j.index + 1, j.index + 1 + j[1].length, false]);
    // A bare line of prose inside a JSX block, which is how a long sentence is
    // wrapped and is therefore most of them.
    if (/^\s*[A-Za-z][^{}<>=;()`'"]*$/.test(line) && /\s[a-z]+\s/.test(line)) {
      spans.push([0, line.length, false]);
    }
  }
  return spans;
}

/** The parts of a template literal that are text, with the ${...} cut out. */
function outsideInterpolations(line, start, end) {
  const spans = [];
  let at = start;
  const body = line.slice(start, end);
  let index = 0;
  while (index < body.length) {
    const open = body.indexOf('${', index);
    if (open === -1) break;
    // Find the matching brace, counting nesting so a ternary with an object
    // in it does not end the hole early.
    let depth = 1;
    let close = open + 2;
    while (close < body.length && depth > 0) {
      if (body[close] === '{') depth++;
      else if (body[close] === '}') depth--;
      close++;
    }
    if (start + open > at) spans.push([at, start + open]);
    at = start + close;
    index = close;
  }
  if (at < end) spans.push([at, end]);
  return spans;
}

/**
 * A word in a comment that is really an identifier.
 *
 * Doc comments name real code — `COLOURS`, `wardrobe.colour`, `favourite_colour`
 * — and rewriting those makes the documentation describe something that does
 * not exist. Anything in backticks, anything touching a dot or an underscore,
 * and anything in SHOUTING case is left alone.
 */
function identifierInProse(line, start, end, inComment) {
  const before = line.slice(Math.max(0, start - 1), start);
  const after = line.slice(end, end + 2);
  // A dot only means a property when a letter follows it. A full stop at the
  // end of a sentence is not `wardrobe.colour`, and a backtick before a word
  // is usually a template literal opening rather than inline code — the
  // matched-pair check below is what finds real inline code.
  if (/[_$]/.test(before) || /^[_$(]/.test(after)) return true;
  if (before === '.' && /[A-Za-z]/.test(line.slice(Math.max(0, start - 2), start - 1))) return true;
  if (/^\.[A-Za-z]/.test(after)) return true;
  const word = line.slice(start, end);
  if (word === word.toUpperCase() && word.length > 2) return true;
  // Inside a pair of backticks, which means inline code — but only in a
  // comment. On a line of code the backticks are a template literal's own
  // delimiters and everything between them is prose.
  if (inComment) {
    const ticks = [...line.matchAll(/`/g)].map((t) => t.index);
    for (let i = 0; i + 1 < ticks.length; i += 2) {
      if (start > ticks[i] && end <= ticks[i + 1]) return true;
    }
  }
  return false;
}

function insideString(line, at) {
  const before = line.slice(0, at);
  return ((before.match(/'/g) ?? []).length % 2 === 1)
    || ((before.match(/"/g) ?? []).length % 2 === 1)
    || ((before.match(/`/g) ?? []).length % 2 === 1);
}

/**
 * A web address and the title of a law or a public body are names too, and
 * spelled by their owners. The job research cites a hundred laws and
 * ministries by their English titles, and the pages they sit on;
 * respelling an address breaks it, and respelling a statute's title is
 * inventing one.
 */
const ADDRESS = /https?:\/\/\S+|\bwww\.\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:gov|org|com|net|edu|int|gouv|go|co|ac)(?:\.[a-z]{2})?\/\S*/gi;
const TITLES = /\b(?:[A-Z][\w'’]*\s+){0,4}Labour\s+(?:Code|Act|Law|Laws|Relations|Council|Department|Force Survey|Standards|Protection|Restructuring Fund|and\s+[A-Z]\w+(?:\s+[A-Z]\w+)*)\b|\bSupreme Labour Council\b|\b(?:Social (?:Security|Insurance)|Security) Organisation\b|\bOrganisation of Working Time\b|\bLabour (?:and|&) \w+|\bMinist(?:ry|er) of [\w, ]*Labour\b|\bDepartment of Labour\b|\bLaw on Labour\b|\bLabour \(/g;
function partOfAddressOrTitle(line, start, end) {
  // A generated table's "name" field is an employer's, a bank's or a scheme's own name.
  const named = /^\s*"name": "/.exec(line);
  if (named && start >= named[0].length) return true;
  for (const re of [ADDRESS, TITLES]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      if (start >= m.index && end <= m.index + m[0].length) return true;
    }
  }
  return false;
}

/** Whether this match sits inside a real name that must be left alone. */
function partOfRealName(line, start, end) {
  if (partOfAddressOrTitle(line, start, end)) return true;
  return REAL_NAMES.some((name) => {
    let at = -1;
    while ((at = line.indexOf(name, at + 1)) !== -1) {
      if (start >= at && end <= at + name.length) return true;
    }
    return false;
  });
}

function fixLine(line, tsx = false) {
  const spans = editableSpans(line, tsx);
  if (spans.length === 0) return { line, changes: [] };
  const changes = [];
  let out = '';
  let last = 0;
  const edits = [];
  let m;
  PATTERN.lastIndex = 0;
  while ((m = PATTERN.exec(line)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    const span = spans.find(([a, b]) => start >= a && end <= b);
    if (!span) continue;
    if (partOfRealName(line, start, end)) continue;
    if (identifierInProse(line, start, end, span[2] === true)) continue;
    const replacement = SPELLINGS[m[0].toLowerCase()];
    if (!replacement) continue;
    edits.push({ start, end, from: m[0], to: matchCase(m[0], replacement) });
  }
  for (const edit of edits) {
    out += line.slice(last, edit.start) + edit.to;
    last = edit.end;
    changes.push(`${edit.from} → ${edit.to}`);
  }
  out += line.slice(last);
  return { line: out, changes };
}

const write = process.argv.includes('--write');
let files = 0;
let total = 0;
const seen = new Map();

for (const file of [...walk('src'), ...walk('tools'), ...walk('tests'), ...walk('docs')].filter(oursToFix)) {
  const original = readFileSync(file, 'utf8');
  const lines = original.split('\n');
  const tsx = file.endsWith('.tsx');
  let touched = false;
  const fixed = lines.map((line) => {
    const { line: next, changes } = fixLine(line, tsx);
    if (changes.length > 0) {
      touched = true;
      total += changes.length;
      for (const change of changes) seen.set(change, (seen.get(change) ?? 0) + 1);
    }
    return next;
  });
  if (touched) {
    files++;
    if (write) writeFileSync(file, fixed.join('\n'));
    else console.log(file);
  }
}

for (const [change, count] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${change} (${count})`);
}
console.log(`${total} British spellings in ${files} files.`);
if (total > 0 && !write) {
  console.log('Run: node tools/spelling.mjs --write');
  process.exit(1);
}
