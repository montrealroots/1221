/**
 * SLATE — Bullet points in, a logline out.
 *
 * A logline is not a summary. It is a specific machine with named parts: a
 * flawed protagonist, an inciting incident that takes their normal life away,
 * an objective they cannot refuse, a force standing in the way, and a cost if
 * they fail. Get those five in one sentence with no names and no subplots and
 * you have one; miss them and you have a paragraph nobody finished.
 *
 * So this reads what you typed, works out which part of that machine each
 * fragment is, and builds the sentence. It is a parser and a grammar, not a
 * language model — it runs offline, it is deterministic, and the same notes
 * always produce the same line. It shows its working, so the parts it could
 * not find are named rather than invented: an empty stakes slot is reported
 * as missing, never filled with something plausible.
 */

import { canonicalGenre, genre } from './genres';

export type Slot = 'protagonist' | 'descriptor' | 'world' | 'incident' | 'goal' | 'antagonist' | 'stakes' | 'twist';

export const SLOT_LABEL: Readonly<Record<Slot, string>> = {
  protagonist: 'Protagonist', descriptor: 'Flaw Or Descriptor', world: 'World',
  incident: 'Inciting Incident', goal: 'Objective', antagonist: 'Opposition',
  stakes: 'Stakes', twist: 'Turn',
};

export const SLOT_EXPLAIN: Readonly<Record<Slot, string>> = {
  protagonist: 'Who it happens to, as a type rather than a name. "A night-shift nurse", not "Dana".',
  descriptor: 'The one adjective that is also the problem. Grieving, disgraced, agoraphobic, newly sober.',
  world: 'Where and when, only if it changes what is possible. A prison, 1974, a generation ship.',
  incident: 'The thing that happens in the first ten minutes and takes the old life away.',
  goal: 'What they are now trying to do. Concrete, visible, and possible to fail at.',
  antagonist: 'Who or what is in the way, and wants something incompatible.',
  stakes: 'What is lost if they fail. The reason the audience cannot leave.',
  twist: 'The complication that makes it hard in an interesting way rather than a tiring one.',
};

/** People a protagonist can be. Enough of them that most notes land. */
const PERSON_WORDS = [
  'man', 'woman', 'boy', 'girl', 'teenager', 'child', 'kid', 'adult', 'person', 'stranger',
  'detective', 'cop', 'officer', 'sheriff', 'agent', 'spy', 'soldier', 'marine', 'sniper', 'veteran',
  'doctor', 'surgeon', 'nurse', 'paramedic', 'therapist', 'psychiatrist', 'coroner', 'scientist', 'researcher',
  'teacher', 'professor', 'student', 'principal', 'coach', 'tutor',
  'lawyer', 'attorney', 'judge', 'prosecutor', 'clerk', 'journalist', 'reporter', 'editor', 'photographer',
  'thief', 'burglar', 'conman', 'hitman', 'assassin', 'smuggler', 'forger', 'gangster', 'bootlegger',
  'priest', 'nun', 'monk', 'rabbi', 'imam', 'preacher', 'pilgrim',
  'mother', 'father', 'son', 'daughter', 'sister', 'brother', 'twin', 'widow', 'widower', 'orphan',
  'wife', 'husband', 'bride', 'groom', 'fiancee', 'lover', 'neighbour', 'neighbor', 'roommate',
  'chef', 'baker', 'waiter', 'bartender', 'barber', 'tailor', 'mechanic', 'plumber', 'electrician',
  'farmer', 'rancher', 'fisherman', 'miner', 'logger', 'trucker', 'driver', 'courier',
  'pilot', 'astronaut', 'sailor', 'captain', 'engineer', 'architect', 'programmer', 'hacker', 'analyst',
  'dancer', 'singer', 'musician', 'composer', 'actor', 'actress', 'director', 'producer', 'writer', 'novelist', 'poet', 'painter', 'sculptor',
  'athlete', 'boxer', 'runner', 'swimmer', 'climber', 'wrestler', 'jockey', 'gymnast',
  'king', 'queen', 'prince', 'princess', 'knight', 'lord', 'duke', 'emperor', 'senator', 'mayor', 'governor', 'president', 'diplomat',
  'nurse', 'janitor', 'guard', 'warden', 'prisoner', 'inmate', 'fugitive', 'refugee', 'immigrant', 'settler',
  'hunter', 'tracker', 'ranger', 'guide', 'scout', 'explorer', 'archaeologist', 'historian', 'librarian',
  'nanny', 'housekeeper', 'butler', 'caretaker', 'undertaker', 'gravedigger',
  'witch', 'wizard', 'sorcerer', 'vampire', 'werewolf', 'ghost', 'android', 'robot', 'alien', 'clone',
  'crew', 'family', 'squad', 'team', 'band', 'gang', 'promoter', 'landlord', 'boss', 'foreman',
  'friend', 'friends', 'colleague', 'partner', 'partners', 'sibling', 'siblings', 'cousin',
  'stranger', 'rookie', 'recruit', 'apprentice', 'heir', 'heiress', 'trainee', 'intern',
  'couple', 'pair', 'trio', 'group', 'class', 'congregation', 'commune', 'household',
];

/** Words that mark a fragment as an objective. */
const GOAL_CUES = [
  'must', 'has to', 'have to', 'needs to', 'need to', 'wants to', 'want to', 'tries to', 'try to',
  'sets out to', 'set out to', 'races to', 'race to', 'fights to', 'struggles to', 'determined to',
  'goal is', 'objective is', 'mission is', 'in order to', 'so that', 'aims to', 'plans to', 'hopes to',
  'wants out', 'wants in', 'wants revenge', 'out to', 'looking to', 'trying to', 'setting out',
];

/** Words that mark a fragment as the thing that starts it. */
const INCIDENT_CUES = [
  'when', 'after', 'once', 'the day', 'the night', 'discovers', 'discover', 'finds', 'find', 'learns', 'learn',
  'wakes', 'wake', 'arrives', 'arrive', 'returns', 'return', 'inherits', 'inherit', 'receives', 'receive',
  'is killed', 'is murdered', 'dies', 'goes missing', 'disappears', 'vanishes', 'is arrested', 'is fired',
  'is diagnosed', 'crashes', 'breaks out', 'escapes', 'washes up', 'shows up', 'turns up', 'is released',
  'stumbles', 'witnesses', 'is offered', 'is chosen', 'is framed', 'loses',
  'starts', 'begins', 'stops', 'refuses', 'appears', 'calls', 'writes', 'sends',
  'confesses', 'admits', 'threatens', 'attacks', 'steals', 'takes', 'kills',
  'goes', 'walks in', 'knocks', 'opens', 'burns', 'floods', 'collapses', 'is born',
  'comes back', 'come back', 'shows up', 'turns on', 'does not', 'stops coming', 'never comes',
];

/** Words that mark a fragment as opposition. */
const ANTAGONIST_CUES = [
  'against', 'versus', ' vs ', 'rival', 'enemy', 'enemies', 'villain', 'nemesis', 'opponent',
  'hunted by', 'pursued by', 'chased by', 'stalked by', 'opposed by', 'blocked by', 'stands in',
  'in the way', 'antagonist', 'the killer', 'the cartel', 'the syndicate', 'the company', 'the state',
];

/** Words that mark a fragment as the cost of failure. */
/**
 * Cues that only mean stakes when the fragment opens with them. "Before" in
 * the middle of "get it filmed before he changes his mind" is part of the
 * objective; at the front of "before her brother hangs" it is the cost.
 */
const LEADING_STAKES_CUES = ['or else', 'or the', 'or she', 'or he', 'or they', 'or everyone', 'or lose', 'or die', 'before', 'otherwise', 'by dawn', 'by morning', 'by midnight'];

const STAKES_CUES = [
  'or else', 'or the', 'or she', 'or he', 'or they', 'before', 'otherwise', 'risks', 'risk of',
  'will lose', 'loses everything', 'at stake', 'stakes are', 'or lose', 'or die', 'or everyone',
  'if she fails', 'if he fails', 'if they fail', 'the world ends', 'never see', 'run out of', 'running out',
  'deadline', 'countdown', 'hours to', 'days to', 'by dawn', 'by morning', 'by midnight',
  'or his', 'or her', 'or their', 'or everything', 'pays for it', 'costs him', 'costs her', 'costs them',
];

/** Words that mark a fragment as setting. */
const WORLD_CUES = [
  'set in', 'set on', 'set during', 'takes place', 'in a world', 'world where', 'near-future', 'near future',
  'far future', 'post-apocalyptic', 'dystopian', 'victorian', 'medieval', 'wartime', 'depression-era',
  'small town', 'small-town', 'suburban', 'rural', 'inner-city', 'on a ship', 'in space', 'underwater',
  'in prison', 'on the road', 'aboard',
];

/** Words that mark a fragment as a complication rather than the main goal. */
const TWIST_CUES = [
  'but ', 'except', 'unfortunately', 'the catch', 'complication', 'problem is', 'only', 'however',
  'twist', 'unless', 'while also', 'at the same time', 'meanwhile',
];

/** The turn is announced at the front of a note, not buried in the middle of one. */
const LEADING_TWIST_CUES = ['but', 'except', 'unfortunately', 'however', 'unless', 'only', 'meanwhile'];

/** Whether a fragment opens with one of these, which is where a connective belongs. */
function startsWithAny(text: string, cues: readonly string[]): boolean {
  const t = text.trim().toLowerCase();
  return cues.some((cue) => t.startsWith(`${cue} `) || t === cue);
}

/** Adjectives that read as a flaw or a state rather than a description of a thing. */
const DESCRIPTOR_WORDS = [
  'grieving', 'disgraced', 'washed-up', 'washed up', 'retired', 'former', 'ex-', 'failing', 'failed',
  'reclusive', 'agoraphobic', 'alcoholic', 'recovering', 'newly sober', 'sober', 'addicted', 'estranged',
  'widowed', 'divorced', 'orphaned', 'exiled', 'blacklisted', 'bankrupt', 'dying', 'terminally ill',
  'amnesiac', 'blind', 'deaf', 'mute', 'paralysed', 'paralyzed', 'wheelchair-bound',
  'ambitious', 'ruthless', 'idealistic', 'naive', 'cynical', 'paranoid', 'obsessive', 'compulsive',
  'lonely', 'desperate', 'reluctant', 'unwilling', 'burnt-out', 'burned-out', 'overworked', 'underpaid',
  'young', 'old', 'elderly', 'ageing', 'aging', 'teenage', 'middle-aged', 'pregnant', 'closeted',
  'undocumented', 'homeless', 'unemployed', 'illiterate', 'gifted', 'brilliant', 'incompetent',
];

const FILLER_PREFIX = /^(?:[-*•‣▪]\s*|\d+[.)]\s*|the story is |it'?s about |about |basically |so |and |plus |also )/i;

function clean(text: string): string {
  return text.replace(FILLER_PREFIX, '').replace(/\s+/g, ' ').trim().replace(/[.;,]+$/, '');
}

function lower(text: string): string {
  return text.length === 0 ? text : text[0]!.toLowerCase() + text.slice(1);
}

function upper(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}

/** "a" or "an", by how the word is said rather than how it is spelled. */
export function article(word: string): string {
  const first = word.trim().toLowerCase();
  if (/^(hour|honest|honou?r|heir)/.test(first)) return 'an';
  if (/^(uni|use|user|euro|one|once|ubiqu)/.test(first)) return 'a';
  return /^[aeiou]/.test(first) ? 'an' : 'a';
}

function hasAny(text: string, cues: readonly string[]): boolean {
  const t = ` ${text.toLowerCase()} `;
  return cues.some((cue) => t.includes(cue.toLowerCase()));
}

function personWordIn(text: string): string | undefined {
  const words = text.toLowerCase().split(/[^a-z-]+/).filter(Boolean);
  const singulars = words.map((w) => (w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w));
  return PERSON_WORDS.find((p) => words.includes(p) || singulars.includes(p));
}

function descriptorIn(text: string): string | undefined {
  const t = text.toLowerCase();
  return DESCRIPTOR_WORDS.find((d) => t.includes(d));
}

/** Strips a leading cue so a fragment can be used inside a sentence. */
/** Bare idioms that mean an objective without stating a verb it can follow "must" with. */
const GOAL_IDIOMS: Readonly<Record<string, string>> = {
  'wants out': 'get out', 'want out': 'get out', 'wants in': 'get in', 'want in': 'get in',
  'wants revenge': 'take revenge', 'want revenge': 'take revenge',
  'wants answers': 'get answers', 'wants the truth': 'find the truth', 'wants her life back': 'get her life back',
  'wants his life back': 'get his life back', 'wants out of it': 'get out of it',
};

function stripGoalCue(text: string): string {
  const idiom = GOAL_IDIOMS[text.trim().toLowerCase()];
  if (idiom) return idiom;
  let out = text;
  for (const cue of [...GOAL_CUES].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`^(?:[a-z' ]{0,24}\\s)?${cue}\\s+`, 'i');
    if (re.test(out)) { out = out.replace(re, ''); break; }
  }
  out = out.replace(/^(?:to|and)\s+/i, '').trim();
  // A cue that stripped to nothing leaves the fragment as it was.
  return out.length > 0 ? out : text;
}

function stripIncidentCue(text: string): string {
  return text.replace(/^(?:when|after|once|the day|the night)\s+/i, '').trim();
}

function stripWorldCue(text: string): string {
  return text.replace(/^(?:set\s+)?(?:in|on|during|at)\s+/i, '').replace(/^takes place (?:in|on|during|at)\s+/i, '').trim();
}

function stripStakesCue(text: string): string {
  return text.replace(/^(?:or else|or|otherwise|before)\s+/i, '').trim();
}

function stripTwistCue(text: string): string {
  return text.replace(/^(?:but|except|however|unless|only)\s+/i, '').trim();
}

function stripAntagonistCue(text: string): string {
  return text.replace(/^(?:against|versus|vs\.?|opposed by|hunted by|pursued by|chased by|stalked by)\s+/i, '').trim();
}

export interface ParsedNote {
  raw: string;
  text: string;
  slot: Slot;
  /** 0-1 how sure the parse is. */
  confidence: number;
  why: string;
}

export interface LoglineResult {
  /** The line itself, or an empty string when there is not enough to build one. */
  logline: string;
  notes: ParsedNote[];
  /** Slots that were filled, in the order the sentence uses them. */
  filled: Slot[];
  /** Slots a logline wants and this one does not have. */
  missing: Slot[];
  /** What to add next, most useful first. Never invented content, only a prompt. */
  advice: string[];
  /** Roughly how strong the line is as a logline, 0-100, and why. */
  score: number;
  reasons: string[];
}

/** Strips whatever connective a fragment opens with, so it can sit inside a sentence. */
function stripFor(slot: Slot, text: string): string {
  switch (slot) {
    case 'goal': return stripGoalCue(text);
    case 'incident': return stripIncidentCue(text);
    case 'world': return stripWorldCue(text);
    case 'stakes': return stripStakesCue(text);
    case 'twist': return stripTwistCue(text);
    case 'antagonist': return stripAntagonistCue(text);
    default: return text;
  }
}

/** Verbs a fragment starts with when it is stating an objective. */
const BARE_GOAL_VERBS = /^(?:find|save|stop|escape|win|prove|kill|protect|return|steal|expose|rescue|survive|reach|recover|clear|beat|catch|hide|deliver|destroy|build|get)\b/i;
/** Verbs that mean something happened rather than something is wanted. */
const EVENT_VERBS = /\b(?:dies|died|is killed|is murdered|vanishes|disappears|arrives|returns|inherits|wakes|crashes|breaks|escapes|turns up|shows up|goes missing|comes back|starts|begins|stops|refuses|discovers|finds out|learns|witnesses|is arrested|is fired|is framed|is offered)\b/i;

/**
 * Any verb doing the work of a main verb. Used to tell a thing from a
 * happening: "a broadcaster getting cold feet" is a thing, "the witness agrees
 * to speak" is a happening, and only the first can be a person in a slot.
 */
const FINITE_VERBS = /\b(?:is|are|was|were|has|have|had|does|do|did|will|would|can|could|agrees?|admits?|announces?|arrives?|asks?|becomes?|calls?|changes?|closes?|comes?|confesses|dies|discovers?|ends?|escapes?|fails?|falls?|finds?|gives?|goes|hires?|kills?|knows?|leaves?|learns?|loses?|makes?|meets?|moves?|offers?|opens?|pays?|quits?|refuses?|returns?|runs?|says?|sees?|sells?|sends?|shuts?|signs?|speaks?|starts?|steals?|stops?|takes?|tells?|threatens?|turns?|vanishes|wakes?|walks?|wants?|wins?)\b/i;

/**
 * How well a fragment fits each part of the machine.
 *
 * Every fragment is scored against every slot before anything is assigned, so
 * a weak early match cannot take a slot that a later fragment fits far better.
 * "his old crew comes back" and "wants out" both look vaguely like an
 * inciting incident on their own; scored together, only one of them is.
 */
/**
 * Whether a fragment is a thing rather than a happening: it opens like a noun
 * phrase and has no verb of its own outside a relative clause.
 */
function isNounPhrase(text: string): boolean {
  const t = text.trim();
  if (!/^(?:a|an|the|his|her|their|its|our|my|your|two|three|four|five|several|some|every|no)\b/i.test(t)) return false;
  if (isClause(t) || EVENT_VERBS.test(t)) return false;
  // A verb outside a relative clause makes it a happening, not a person.
  const head = t.replace(/\b(that|which|who|whom|whose)\b.*$/i, '');
  if (FINITE_VERBS.test(head)) return false;
  return t.split(/\s+/).length <= 10;
}

/** Somebody wanting the opposite of what the protagonist wants: that is opposition. */
const OPPOSING = /\b(wants|want|refuses|refuse|will not|won't|blocks|threatens|hides|buries|covers up|stands in|keeps|holds)\b/i;

/** Words a note can open with that mean it is not an instruction. */
const NOT_IMPERATIVE = /^(?:a|an|the|his|her|their|its|our|my|your|this|that|these|those|he|she|it|they|we|i|you|when|after|once|before|or|but|and|if|while|in|on|at|during|through|over|under|with|without|two|three|four|five|six|seven|eight|nine|ten|several|some|every|no|nobody|everyone|everybody|somebody|someone|there|here)\b/i;

/** Whether a note reads as an instruction: a bare verb with no subject in front of it. */
function isImperative(text: string): boolean {
  const t = text.trim();
  if (t.split(/\s+/).length < 2) return false;
  if (/^[\d"'(]/.test(t)) return false;
  if (NOT_IMPERATIVE.test(t)) return false;
  // "Detective, alcoholic" is a person with a note attached, not an order.
  if (/^[a-z-]+,/i.test(t)) return false;
  return true;
}

function scoreFragment(text: string, index: number, total = index + 1): Partial<Record<Slot, number>> {
  const t = text.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean).length;
  const out: Partial<Record<Slot, number>> = {};
  const person = personWordIn(t);

  if (/^(?:but|except|however|unless|only|the catch|the problem)\b/i.test(t)) out.twist = 1.0;
  else if (startsWithAny(t, LEADING_TWIST_CUES)) out.twist = 0.8;
  else if (hasAny(t, TWIST_CUES.filter((cue) => !LEADING_TWIST_CUES.includes(cue.trim())))) out.twist = 0.55;

  if (hasAny(t, GOAL_CUES)) out.goal = 1.0;
  else if (/^to\s+\w/i.test(t)) out.goal = 0.7;
  else if (BARE_GOAL_VERBS.test(t)) out.goal = 0.6;
  // No list holds every verb. A note that opens with something that is not a
  // determiner, a pronoun, a preposition or a date is an instruction — "smuggle
  // a message across the city" — and an instruction is an objective.
  else if (isImperative(t)) out.goal = 0.55;

  if (/^(?:or|otherwise)\b/i.test(t)) out.stakes = 1.0;
  else if (startsWithAny(t, LEADING_STAKES_CUES)) out.stakes = 0.85;
  // The rest of the stakes vocabulary means what it says wherever it appears,
  // but it never outranks a fragment that also states an objective.
  else if (hasAny(t, STAKES_CUES.filter((cue) => !LEADING_STAKES_CUES.includes(cue)))) out.stakes = out.goal ? 0.4 : 0.7;

  if (/^(?:when|after|once|the day|the night)\b/i.test(t)) out.incident = 1.0;
  else if (EVENT_VERBS.test(t)) out.incident = 0.8;
  else if (hasAny(t, INCIDENT_CUES)) out.incident = 0.65;

  if (/^(?:in\s+)?(?:1[6-9]\d\d|20\d\d|21\d\d)s?\b/i.test(t)) out.world = 1.0;
  else if (hasAny(t, WORLD_CUES)) out.world = 0.9;
  // "A prison" is a setting. "A hospital that needs an answer" is the thing in
  // the way, so a place with a clause hanging off it is not a place any more.
  else if (words <= 4 && /^(?:a|the)\s+(?:small |remote |quiet |dying )?(?:town|city|village|island|prison|ship|station|colony|planet|school|hospital)\b/i.test(t)) out.world = 0.75;

  if (hasAny(t, ANTAGONIST_CUES)) out.antagonist = 0.95;
  // Somebody named, wanting the opposite, is the clearest opposition there is.
  else if (person && OPPOSING.test(t) && index > 0) out.antagonist = 0.7;
  else if (person && index > 0) out.antagonist = 0.45;

  if (person) {
    // The first thing anybody writes down is who it is about, and a short
    // phrase is a description of a person rather than an account of an event.
    out.protagonist = (index === 0 ? 0.95 : 0.6) + (words <= 6 ? 0.15 : 0) - (EVENT_VERBS.test(t) ? 0.35 : 0);
  } else if (isNounPhrase(t)) {
    // No list of jobs holds every job. "A filmmaker with one interview" names
    // somebody just as plainly as "a nurse" does: it is a thing rather than a
    // happening, so it is a candidate for the two slots that hold people.
    out.protagonist = (index === 0 ? 0.8 : 0.4) + (words <= 8 ? 0.1 : 0);
    if (index > 0) out.antagonist = Math.max(out.antagonist ?? 0, 0.42);
  }
  // "Grieving" is a descriptor; "a broadcaster getting cold feet" is a person
  // with a description attached, and the person is the part that matters.
  if (descriptorIn(t) && words <= 5 && !/^(?:a|an|the)\b/i.test(t)) out.descriptor = 0.7;

  // A clause with a verb in it is a candidate for the event whatever else it
  // scored for, because that is what an event is: something happening. It is
  // scored modestly, so a stated objective or a named opposition still wins.
  if (words >= 3 && FINITE_VERBS.test(t)) out.incident = Math.max(out.incident ?? 0, 0.5);
  else if (Object.keys(out).length === 0 && words >= 3) out.incident = 0.35;

  // Where a note sits is evidence, not proof. People write them roughly in the
  // order the sentence uses: who it is, what happened, what they want, who is
  // against them, what it costs. So the last note leans towards the cost and
  // away from the event, and a stated cue still beats the lean.
  const last = total >= 4 && index === total - 1;
  if (last) {
    out.stakes = (out.stakes ?? 0.3) + 0.3;
    if (out.incident !== undefined) out.incident *= 0.7;
  }
  // An early note leans towards being the event — unless it also states an
  // objective, in which case what it says beats where it sits.
  if (total >= 4 && index <= 1 && out.incident !== undefined && out.goal === undefined) out.incident += 0.1;
  return out;
}

/**
 * Assigns fragments to slots by best fit across the whole set: the strongest
 * pairing is taken first, then the next, and so on, so nothing is decided by
 * where it happened to appear in the list.
 */
function assign(fragments: string[]): { notes: ParsedNote[]; bySlot: Map<Slot, ParsedNote> } {
  const scored = fragments.map((raw, index) => ({
    raw, text: clean(raw), index, scores: scoreFragment(clean(raw), index, fragments.length),
  }));
  const pairs: { fragment: typeof scored[number]; slot: Slot; score: number }[] = [];
  for (const fragment of scored) {
    for (const [slot, score] of Object.entries(fragment.scores)) {
      if (score !== undefined && score > 0) pairs.push({ fragment, slot: slot as Slot, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score || a.fragment.index - b.fragment.index);

  const usedSlots = new Set<Slot>();
  const usedFragments = new Set<number>();
  const notes: ParsedNote[] = [];
  const bySlot = new Map<Slot, ParsedNote>();
  const place = (fragment: typeof scored[number], slot: Slot, score: number, why: string) => {
    const note: ParsedNote = { raw: fragment.raw, text: stripFor(slot, fragment.text), slot, confidence: Math.min(1, score), why };
    notes.push(note);
    bySlot.set(slot, note);
    usedSlots.add(slot);
    usedFragments.add(fragment.index);
  };

  for (const { fragment, slot, score } of pairs) {
    if (usedSlots.has(slot) || usedFragments.has(fragment.index)) continue;
    place(fragment, slot, score, WHY[slot]);
  }
  // Anything left over fills the next hole a logline still has. A leftover
  // that says somebody wants something incompatible is opposition first,
  // because that is what opposition is.
  const order: Slot[] = ['incident', 'goal', 'stakes', 'antagonist', 'world', 'twist', 'descriptor'];

  for (const fragment of scored) {
    if (usedFragments.has(fragment.index)) continue;
    // A leftover noun phrase with nobody yet in the sentence is who it is
    // about. A logline with no protagonist is not a logline.
    const preferred: Slot | undefined = !usedSlots.has('protagonist') && isNounPhrase(fragment.text)
      ? 'protagonist'
      : OPPOSING.test(fragment.text) && !usedSlots.has('antagonist') ? 'antagonist' : undefined;
    const slot = preferred ?? order.find((candidate) => !usedSlots.has(candidate));
    if (!slot) break;
    place(fragment, slot, 0.3, preferred === 'protagonist'
      ? 'Nothing said what it was, but it names somebody and nobody else did.'
      : preferred
        ? 'Nothing said what it was, but it names somebody who wants the opposite.'
        : 'Nothing in it said what it was, so it filled the next empty part.');
  }
  notes.sort((a, b) => fragments.indexOf(a.raw) - fragments.indexOf(b.raw));
  return { notes, bySlot };
}

const WHY: Readonly<Record<Slot, string>> = {
  protagonist: 'It names who it happens to.',
  descriptor: 'It describes a state rather than an event.',
  world: 'It places it somewhere or somewhen.',
  incident: 'It is the thing that happens and starts it.',
  goal: 'It says what they are trying to do.',
  antagonist: 'It names what is in the way.',
  stakes: 'It says what failing costs.',
  twist: 'It complicates what came before it.',
};

/** Splits whatever was typed into fragments: lines, bullets, semicolons. */
export function splitNotes(input: string): string[] {
  return input
    .split(/\r?\n|;|(?:\s+[-–—]\s+)/)
    .map((part) => part.trim())
    // However the bullet was typed — a dash, a star, a bullet, "1." — it is
    // punctuation, not part of the note.
    .map((part) => part.replace(/^\s*(?:[-–—*•·]+|\d+[.)])\s*/, '').trim())
    .filter((part) => part.length > 1);
}

/** Whether a phrase still needs "a" or "an" in front of it. */
function needsArticle(phrase: string): boolean {
  const first = phrase.trim().toLowerCase().split(/\s+/)[0] ?? '';
  if (/^(a|an|the|his|her|their|its|our|my|your)$/.test(first)) return false;
  // "the whatever the school was built over" is a word nobody would say.
  if (/^(whatever|whoever|whichever|everybody|everyone|everything|nobody|somebody|someone|something|anybody|anyone|anything|nothing|he|she|it|they|we|you|i)$/.test(first)) return false;
  if (/^(one|two|three|four|five|six|seven|eight|nine|ten|several|some|many|both|all|every|each|no)$/.test(first)) return false;
  if (/^\d/.test(first)) return false;
  // A bare plural takes no article: "friends open a bakery", not "a friends".
  const head = phrase.trim().toLowerCase().split(/\s+/).slice(0, 4).join(' ');
  if (/\b(friends|partners|siblings|twins|brothers|sisters|strangers|neighbours|neighbors|survivors|cousins|children|men|women|people)\b/.test(head)) return false;
  return true;
}

/**
 * Whether a fragment is a whole clause rather than a noun phrase.
 *
 * The verb inside a relative clause belongs to the noun, not to the fragment:
 * "a car that will not do it" is a thing you go up against, while "the cartel
 * will not let him go" is something happening. So the relative clause comes
 * off first, and only a verb in what is left makes it a clause.
 */
function isClause(text: string): boolean {
  const head = text.replace(/\b(that|which|who|whom|whose|whatever|whoever|whichever)\b.*$/i, '');
  return /\b(is|are|was|were|has|have|wants|want|refuses|refuse|threatens|threaten|knows|know|thinks|think|believes|hides|hide|buries|bury|covers|cover|will|would|can|cannot|does|do|did)\b/i.test(head);
}

function buildProtagonist(notes: Map<Slot, ParsedNote>): string {
  const protagonist = notes.get('protagonist')?.text;
  const descriptor = notes.get('descriptor')?.text;
  if (!protagonist) return descriptor ? `${article(descriptor)} ${lower(descriptor)}` : '';
  if (/^(the|his|her|their|its|our|my)\b/i.test(protagonist.trim())) return lower(protagonist);
  // A descriptor already inside the protagonist line is not repeated.
  const merged = descriptor && !protagonist.toLowerCase().includes(descriptor.toLowerCase())
    ? `${lower(descriptor)} ${lower(protagonist.replace(/^(a|an|the)\s+/i, ''))}`
    : lower(protagonist.replace(/^(a|an)\s+/i, ''));
  return needsArticle(merged) ? `${article(merged)} ${merged}` : merged;
}

/**
 * Builds the sentence from whatever parts are present, in the order a logline
 * uses them, with the joins a reader expects. Nothing absent is invented.
 */
function assemble(notes: Map<Slot, ParsedNote>): { line: string; filled: Slot[] } {
  const filled: Slot[] = [];
  const use = (slot: Slot): string | undefined => {
    const value = notes.get(slot)?.text;
    if (!value) return undefined;
    filled.push(slot);
    return value;
  };

  const world = use('world');
  const incident = use('incident');
  const protagonist = buildProtagonist(notes);
  if (notes.get('protagonist')) filled.push('protagonist');
  if (notes.get('descriptor')) filled.push('descriptor');
  const goal = use('goal');
  const antagonist = use('antagonist');
  const twist = use('twist');
  const stakes = use('stakes');

  const parts: string[] = [];
  // "In 1974 Belfast," takes the preposition; "over one long winter" brought
  // its own, so it does not get a second one.
  if (world) {
    const carries = /^(over|across|during|through|throughout|after|before|between|under|within|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(world.trim());
    parts.push(carries ? `${upper(world)},` : `In ${lower(world)},`);
  }
  // An incident written without a subject — "opens a restaurant in her mother's
  // building" — cannot be a "when" clause, because there is nobody in it to do
  // the opening. It belongs to the protagonist, so it joins their clause.
  const subjectless = Boolean(incident && /^(?:[a-z]+(?:s|ed|es))\s/i.test(incident) && !/^(?:the|a|an|his|her|their|its|they|she|he|it|everyone|nobody)\b/i.test(incident));
  const leads = Boolean(protagonist || goal);
  if (incident && leads && !subjectless) parts.push(`${world ? 'when' : 'When'} ${lower(incident)},`);
  // A goal that carries its own deadline — "get it filmed before he changes
  // his mind" — has nowhere to put the opposition after it: "before he changes
  // his mind against a broadcaster" attaches the opposition to the deadline.
  // So in that one case the opposition sits with the protagonist instead.
  const goalHasDeadline = Boolean(goal && /\b(before|until)\b/i.test(goal));
  const antagonistUpFront = Boolean(antagonist && goalHasDeadline && protagonist);
  if (protagonist) {
    const named = antagonist && needsArticle(antagonist) ? `the ${lower(antagonist)}` : lower(antagonist ?? '');
    const withOpposition = antagonistUpFront
      ? `${protagonist}, ${isClause(antagonist!) ? 'with' : 'up against'} ${named},`
      : protagonist;
    parts.push(parts.length === 0 ? upper(withOpposition) : withOpposition);
  }
  if (incident && subjectless && protagonist) parts.push(lower(incident));
  if (goal) {
    const join = incident && subjectless && protagonist ? 'and must' : 'must';
    parts.push(protagonist ? `${join} ${lower(goal)}` : `somebody must ${lower(goal)}`);
  }
  if (incident && !leads) parts.push(upper(lower(incident)));
  if (incident && subjectless && !protagonist && leads) parts.push(lower(incident));
  // "against the cartel" works; "against the promoter wants him to throw it"
  // does not, so a clause is joined as a clause.
  if (antagonist && !antagonistUpFront) {
    // "while promoter wants him to throw it" is missing a word everybody hears.
    const named = needsArticle(antagonist) ? `the ${lower(antagonist)}` : lower(antagonist);
    parts.push(isClause(antagonist) ? `while ${named}` : `against ${named}`);
  }
  // A turn in the middle of the sentence is fenced by dashes; one at the end
  // is just the end of the sentence.
  if (twist) parts.push(stakes ? `— ${lower(twist)} —` : `— ${lower(twist)}`);
  if (stakes) {
    // "must find him before the tide turns" already has its deadline. A second
    // "before" reads as a mistake, so the stakes join with "or" instead.
    const already = /\bbefore\b/i.test(goal ?? '');
    parts.push(`${already ? 'or' : 'before'} ${lower(stakes)}`);
  }

  let line = parts.join(' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\s+—\s+—\s+/g, ' — ')
    .replace(/,\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (line.length > 0) {
    line = upper(line);
    if (!/[.?!]$/.test(line)) line += '.';
  }
  return { line, filled: [...new Set(filled)] };
}

/**
 * Builds the sentence from parts that are already known, skipping the parser.
 *
 * The parser exists to work out which fragment is which; when the caller
 * already knows — the world writing a premise for something it commissioned,
 * for one — this is the same grammar without the guesswork.
 */
export function composeLogline(parts: Partial<Record<Slot, string>>): string {
  const bySlot = new Map<Slot, ParsedNote>();
  for (const [slot, text] of Object.entries(parts) as [Slot, string | undefined][]) {
    const trimmed = text?.trim();
    if (!trimmed) continue;
    bySlot.set(slot, { raw: trimmed, text: stripFor(slot, trimmed), slot, confidence: 1, why: 'Given.' });
  }
  return assemble(bySlot).line;
}

const WANTED: Slot[] = ['protagonist', 'incident', 'goal', 'stakes'];

/**
 * Turns notes into a logline.
 *
 * `genreIds` only affects the advice: a horror note with no stakes is a worse
 * problem than a comedy note with no stakes, and the advice says which.
 */
export function buildLogline(input: string, genreIds: readonly string[] = []): LoglineResult {
  const fragments = splitNotes(input);
  const { notes, bySlot } = assign(fragments);

  const { line, filled } = assemble(bySlot);
  const missing = WANTED.filter((slot) => !bySlot.has(slot));

  const advice: string[] = [];
  for (const slot of missing) advice.push(`${SLOT_LABEL[slot]}: ${SLOT_EXPLAIN[slot]}`);
  const focus = genreIds.map(canonicalGenre).map((id) => genre(id)).filter(Boolean);
  if (focus.some((g) => g && ['horror', 'thriller', 'suspense', 'psychological-thriller'].includes(g.id)) && !bySlot.has('stakes')) {
    advice.unshift('This is a tension genre and the line has no cost of failure in it. Without one there is nothing to be afraid of.');
  }
  if (focus.some((g) => g && ['comedy', 'romantic-comedy'].includes(g.id)) && !bySlot.has('twist')) {
    advice.push('A comedy usually needs the thing that makes it awkward, not just the thing they want.');
  }
  if (line.length > 0 && line.split(/\s+/).length > 45) {
    advice.push('It is running long. A logline lives at about thirty words; anything past forty-five is a paragraph.');
  }
  if (/\b[A-Z][a-z]+\b/.test(line.replace(/^[^ ]+ /, '')) && /\b(named|called)\b/i.test(input)) {
    advice.push('Names do no work in a logline. "A night-shift nurse" tells a reader more than "Dana" does.');
  }

  const reasons: string[] = [];
  let score = 0;
  for (const slot of WANTED) {
    if (bySlot.has(slot)) { score += 20; reasons.push(`${SLOT_LABEL[slot]} is there.`); }
    else reasons.push(`${SLOT_LABEL[slot]} is missing.`);
  }
  if (bySlot.has('descriptor')) { score += 6; reasons.push('The protagonist has a flaw attached, which is what makes them worth watching.'); }
  if (bySlot.has('antagonist')) { score += 6; reasons.push('Something is in the way.'); }
  if (bySlot.has('world')) { score += 4; reasons.push('It is placed somewhere.'); }
  const words = line.split(/\s+/).filter(Boolean).length;
  if (words > 0 && words <= 35) { score += 8; reasons.push(`${words} words, which is the length a reader will actually finish.`); }
  else if (words > 45) reasons.push(`${words} words is too long for a logline.`);

  return { logline: line, notes, filled, missing, advice, score: Math.min(100, score), reasons };
}
