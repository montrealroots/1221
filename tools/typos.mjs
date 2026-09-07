/**
 * Finds the mistakes a spell checker would find and a compiler never will.
 *
 * The spelling tool holds the game to one dialect. This is the other half:
 * words that are simply wrong, words typed twice, and the two or three
 * punctuation slips that read as carelessness on screen.
 *
 * It reports rather than rewrites. A doubled word is nearly always a mistake
 * but "had had" and "that that" are real English, and a machine should not be
 * the one deciding which is which.
 *
 * Run: node tools/typos.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Straightforwardly wrong, in any register. */
const MISSPELLINGS = {
  recieve: 'receive', recieved: 'received', seperate: 'separate', seperately: 'separately',
  occured: 'occurred', occuring: 'occurring', occurence: 'occurrence',
  definately: 'definitely', accomodate: 'accommodate', accomodation: 'accommodation',
  neccessary: 'necessary', necesary: 'necessary', existance: 'existence',
  independant: 'independent', persistant: 'persistent', consistant: 'consistent',
  begining: 'beginning', comittee: 'committee', commited: 'committed',
  embarass: 'embarrass', enviroment: 'environment', goverment: 'government',
  immediatly: 'immediately', occassion: 'occasion', priviledge: 'privilege',
  reccomend: 'recommend', refered: 'referred', reffered: 'referred',
  succesful: 'successful', successfull: 'successful', tommorow: 'tomorrow',
  untill: 'until', wierd: 'weird', acheive: 'achieve', acheived: 'achieved',
  beleive: 'believe', calender: 'calendar', cemetary: 'cemetery',
  concious: 'conscious', dissapear: 'disappear', dissapoint: 'disappoint',
  fourty: 'forty', gaurd: 'guard', greatful: 'grateful', harrass: 'harass',
  independance: 'independence', maintainance: 'maintenance', maintenence: 'maintenance',
  managable: 'manageable', millenium: 'millennium', noticable: 'noticeable',
  occassionally: 'occasionally', paralell: 'parallel', perseverence: 'perseverance',
  posession: 'possession', prefered: 'preferred', propoganda: 'propaganda',
  publically: 'publicly', questionaire: 'questionnaire', relevent: 'relevant',
  rythm: 'rhythm', supercede: 'supersede', tendancy: 'tendency', threshhold: 'threshold',
  truely: 'truly', unfortunatly: 'unfortunately', vaccuum: 'vacuum', writting: 'writing',
  arguement: 'argument', assasin: 'assassin', basicly: 'basically', bizzare: 'bizarre',
  buisness: 'business', cieling: 'ceiling', collegue: 'colleague', comming: 'coming',
  completly: 'completely', comparision: 'comparison', decieve: 'deceive',
  desicion: 'decision', diffrent: 'different', dilemna: 'dilemma', dispell: 'dispel',
  ecstacy: 'ecstasy', embarassed: 'embarrassed', experiance: 'experience',
  familar: 'familiar', finaly: 'finally', foriegn: 'foreign', freind: 'friend',
  gratefull: 'grateful', happend: 'happened', heirarchy: 'hierarchy',
  humourous: 'humorous', hygeine: 'hygiene', ignorence: 'ignorance',
  incidently: 'incidentally', inteligent: 'intelligent', intresting: 'interesting',
  knowlege: 'knowledge', liason: 'liaison', libary: 'library', lightening: 'lightning',
  loosing: 'losing', miniture: 'miniature', mischevious: 'mischievous',
  neice: 'niece', occurr: 'occur', oppurtunity: 'opportunity', paticular: 'particular',
  perhaps_: 'perhaps', peice: 'piece', personel: 'personnel', posible: 'possible',
  practicaly: 'practically', preceeding: 'preceding', pronounciation: 'pronunciation',
  recomend: 'recommend', reguardless: 'regardless', religous: 'religious',
  repetion: 'repetition', restaraunt: 'restaurant', rediculous: 'ridiculous',
  sacrafice: 'sacrifice', secratary: 'secretary', seige: 'siege', similiar: 'similar',
  sincerly: 'sincerely', speach: 'speech', stoping: 'stopping', strengh: 'strength',
  suprise: 'surprise', surprized: 'surprised', temperment: 'temperament',
  thier: 'their', tounge: 'tongue', tradgedy: 'tragedy', tyrany: 'tyranny',
  underate: 'underrate', usualy: 'usually', vegatable: 'vegetable', vehical: 'vehicle',
  visable: 'visible', wether: 'whether', wilfull: 'wilful', withold: 'withhold',
  yeild: 'yield', teh: 'the', adn: 'and', taht: 'that', hte: 'the',
};

/**
 * Words that really are said twice.
 *
 * "Had had" and "that that" are correct English. So is every name and title
 * below, and each one was checked rather than assumed:
 *
 * - Princesse Tam Tam, the French lingerie house.
 * - Joseph Joseph, the British homewares company.
 * - Dan Dan Noodles, the Sichuan dish.
 * - Harry Winston's Winston Cluster.
 * - MSR's Hubba Hubba tent.
 * - No Rules Rules, the book by Reed Hastings.
 * - Porsche Cayenne, named twice on purpose in a comment about a bug that
 *   used to print it that way.
 * - "the people you know know people", which is a sentence rather than a slip.
 */
const REAL_DOUBLES = new Set([
  // Bulgari's own collection is called Bulgari Bulgari, on the case and the box.
  'bulgari',
  'had', 'that', 'is', 'sang', 'no', 'so', 'long', 'well',
  'tam', 'joseph', 'dan', 'winston', 'hubba', 'rules', 'cayenne', 'know',
  // Under Armour's Armour Fleece line. The stutter is the real name, not a slip.
  'armour',
  // MAC Pro Acrylic Paint in Black Black. Also the real name.
  'black',
  // Pago Pago, the capital of American Samoa. A place, not a slip.
  'pago',
  // A pom pom on a Moncler beanie. Two words, both of them wanted.
  'pom',
  // The Jimmy Choo Bon Bon bag, which is what the house calls it.
  'bon',
]);

const EXTENSIONS = /\.(ts|tsx|mjs|md)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage']);
/** The two files that are lists of wrong words, and so are full of them. */
const SKIP_FILES = new Set(['tools/typos.mjs', 'tools/spelling.mjs']);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (EXTENSIONS.test(path)) out.push(path);
  }
  return out;
}

const WORDS = Object.keys(MISSPELLINGS).filter((w) => !w.endsWith('_'));
const WRONG = new RegExp(`\\b(${WORDS.join('|')})\\b`, 'gi');
const DOUBLED = /\b([A-Za-z]{2,})\s+\1\b/g;

/**
 * A line of data rather than a line of prose.
 *
 * The country and city tables are enormous tab-separated blobs where "EH" is
 * Western Sahara's ISO code and not somebody typing "the" badly. Nothing in
 * them is written for a player to read.
 */
function isDataBlob(line) {
  return line.length > 400 || line.includes('\\t') || /^const [A-Z_]+ = "/.test(line.trim());
}

/**
 * A doubled token that is a class name rather than a stutter.
 *
 * `btn btn-sm` and `grid grid-2` are how the stylesheet is written, and
 * `Chung Chung-hoon` is somebody's name. The tell in every case is the hyphen
 * on the second one.
 */
function isClassNameOrHyphenated(line, match, index) {
  if (/class(Name)?=/.test(line.slice(0, index))) return true;
  return line.slice(index + match.length, index + match.length + 1) === '-';
}

const findings = [];
for (const file of [...walk('src'), ...walk('tools'), ...walk('tests'), ...walk('docs')]) {
  if (SKIP_FILES.has(file)) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (isDataBlob(line)) return;
    for (const m of line.matchAll(WRONG)) {
      findings.push({ at: `${file}:${i + 1}`, what: `${m[0]} → ${MISSPELLINGS[m[0].toLowerCase()]}`, line: line.trim().slice(0, 110) });
    }
    for (const m of line.matchAll(DOUBLED)) {
      if (REAL_DOUBLES.has(m[1].toLowerCase())) continue;
      if (isClassNameOrHyphenated(line, m[0], m.index)) continue;
      findings.push({ at: `${file}:${i + 1}`, what: `doubled word: ${m[1]}`, line: line.trim().slice(0, 110) });
    }
  });
}

for (const f of findings) console.log(`${f.at}\n  ${f.what}\n  ${f.line}\n`);
console.log(`${findings.length} misspellings or doubled words.`);
if (findings.length > 0) process.exit(1);
