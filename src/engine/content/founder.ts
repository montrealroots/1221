/**
 * SLATE — what a producer is made of.
 *
 * The acting instrument (88 attributes, 42 traits) is still in the game and
 * still governs everyone in front of a camera. It is the wrong instrument for
 * the person paying for the camera. An actor is judged on emotional truth and
 * cold reading; a producer is judged on whether they can tell a good script
 * from a fashionable one, whether they can hold a number in a room full of
 * people who want them to move it, and whether the money is still there in
 * March.
 *
 * So this is a second instrument, for the player and for the executives they
 * hire. Nothing here is a substitute for the acting set and nothing here is
 * derived from it: they measure different people doing different jobs.
 *
 * Every one of these is exercised by something in the game. An attribute with
 * no system reading it is a number on a screen, which is worse than not having
 * it, so nothing goes in here until there is work for it to decide.
 */

import type { Money } from '../core/money';

export type FounderGroup =
  | 'Judgement' | 'The Room' | 'The Money' | 'The Company' | 'Standing';

export interface FounderAttribute {
  id: string;
  name: string;
  group: FounderGroup;
  /** What it is, in the words the game would use to a player. */
  description: string;
  /** What reads it. Kept honest: if this is empty the attribute does not ship. */
  readBy: string;
}

/**
 * The instrument, in five groups.
 *
 * Judgement is what you can see in material and people before anybody agrees
 * with you. The Room is what happens when you have to say it out loud. The
 * Money is whether the company is still solvent when you are wrong. The
 * Company is whether other people can work for you. Standing is what the
 * industry thinks, which is not the same as what is true.
 */
export const FOUNDER_ATTRIBUTES: readonly FounderAttribute[] = [
  // --- Judgement ----------------------------------------------------------
  {
    id: 'script_judgement', name: 'Script Judgement', group: 'Judgement',
    description: 'Whether you can tell a good script from a well-typed one, on a first read, at midnight.',
    readBy: 'Coverage you write yourself, and what a draft is really worth when you option it.',
  },
  {
    id: 'talent_eye', name: 'Eye For Talent', group: 'Judgement',
    description: 'Seeing what somebody will be in three years rather than what they are on the tape.',
    readBy: 'Casting sessions, and what an unknown costs before anybody else wants them.',
  },
  {
    id: 'market_read', name: 'Reading The Market', group: 'Judgement',
    description: 'What an audience will want by the time a thing is finished, which is not what they want now.',
    readBy: 'Greenlight decisions, release timing and what a buyer will pay.',
  },
  {
    id: 'taste', name: 'Taste', group: 'Judgement',
    description: 'The thing nobody can teach you and everybody can tell you do not have.',
    readBy: 'Notes you give, final cut decisions, and how the work is reviewed.',
  },
  {
    id: 'risk_appetite', name: 'Appetite For Risk', group: 'Judgement',
    description: 'How much you are willing to be wrong about, and how publicly.',
    readBy: 'What you will greenlight without a buyer attached.',
  },

  // --- The Room -----------------------------------------------------------
  {
    id: 'negotiation', name: 'Negotiation', group: 'The Room',
    description: 'Holding a number while somebody explains at length why it should be a different number.',
    readBy: 'Every deal: options, quotes, distribution terms, back end.',
  },
  {
    id: 'nerve', name: 'Nerve', group: 'The Room',
    description: 'Whether you blink. Everyone across the table is watching for it.',
    readBy: 'Walking away from a deal, and whether the other side believes you will.',
  },
  {
    id: 'pitching', name: 'Pitching', group: 'The Room',
    description: 'Making somebody who has read four hundred loglines this year sit forward on the fifth.',
    readBy: 'Taking a project out to buyers.',
  },
  {
    id: 'note_giving', name: 'Giving Notes', group: 'The Room',
    description: 'Saying what is wrong with something in a way that makes it better rather than smaller.',
    readBy: 'Development passes, cuts, and whether a writer takes another job with you.',
  },
  {
    id: 'reading_people', name: 'Reading The Room', group: 'The Room',
    description: 'Knowing who in the meeting actually decides, and what they have not said.',
    readBy: 'Buyer meetings, agency calls and what an offer really means.',
  },

  // --- The Money ----------------------------------------------------------
  {
    id: 'cashflow', name: 'Cashflow Discipline', group: 'The Money',
    description: 'Knowing what is in the account in March while spending it in October.',
    readBy: 'Whether production runs out of money, and what the overhead costs you.',
  },
  {
    id: 'budgeting', name: 'Budgeting', group: 'The Money',
    description: 'What a thing will actually cost, as opposed to what the line producer first said.',
    readBy: 'Budget accuracy, contingency, and how often a picture goes over.',
  },
  {
    id: 'financing', name: 'Raising Money', group: 'The Money',
    description: 'Finding people who will put money into something that does not exist yet.',
    readBy: 'Equity, gap, presales, tax credits and what they cost you.',
  },
  {
    id: 'deal_structure', name: 'Structuring A Deal', group: 'The Money',
    description: 'Where the money sits, who recoups first, and what you quietly keep.',
    readBy: 'Back end, ownership, rights reversion and what a hit is worth to you.',
  },

  // --- The Company --------------------------------------------------------
  {
    id: 'hiring', name: 'Hiring', group: 'The Company',
    description: 'Who you put in a job, and whether you can tell before they start.',
    readBy: 'Executives and crew you hire, and how they perform once you have them.',
  },
  {
    id: 'delegation', name: 'Delegation', group: 'The Company',
    description: 'Letting somebody else do it badly enough to learn, without losing the picture.',
    readBy: 'How many projects the company can carry at once.',
  },
  {
    id: 'operations', name: 'Running The Place', group: 'The Company',
    description: 'Payroll, premises, insurance, the things nobody thanks you for.',
    readBy: 'Overhead, and whether the company keeps working while you are on set.',
  },
  {
    id: 'stamina', name: 'Stamina', group: 'The Company',
    description: 'Fourteen-hour days for a year, and the one at the end where you still have to decide something.',
    readBy: 'How much you can personally do in a week before it costs you.',
  },

  // --- Standing -----------------------------------------------------------
  {
    id: 'reputation_craft', name: 'Standing With Talent', group: 'Standing',
    description: 'Whether writers and actors/actresses want to work with you specifically, and take less to do it.',
    readBy: 'Who says yes, and what they charge you.',
  },
  {
    id: 'reputation_money', name: 'Standing With Money', group: 'Standing',
    description: 'Whether people who have capital believe you will give it back.',
    readBy: 'What terms you are offered, and whether a second picture gets funded.',
  },
  {
    id: 'discretion', name: 'Discretion', group: 'Standing',
    description: 'What you do not repeat. In a town this size it is a currency.',
    readBy: 'What you get told early, and by whom.',
  },
];

export const FOUNDER_ATTRIBUTE_BY_ID: Readonly<Record<string, FounderAttribute>> =
  Object.fromEntries(FOUNDER_ATTRIBUTES.map((a) => [a.id, a]));

export const FOUNDER_GROUPS: readonly FounderGroup[] =
  ['Judgement', 'The Room', 'The Money', 'The Company', 'Standing'];

/** Every attribute in one group, in the order they are written above. */
export function founderAttributesIn(group: FounderGroup): readonly FounderAttribute[] {
  return FOUNDER_ATTRIBUTES.filter((a) => a.group === group);
}

// ---------------------------------------------------------------------------
// Traits
// ---------------------------------------------------------------------------

/**
 * What kind of producer you are.
 *
 * These reshape how systems behave rather than adding points, the same way the
 * acting traits do. Every one of them costs something: a trait that is good in
 * every situation is not a character, it is a bonus.
 */
export interface FounderTrait {
  id: string;
  name: string;
  category: 'Instinct' | 'Method' | 'Temperament' | 'Reputation';
  description: string;
  /** What it does to the instrument. */
  attributeMods?: Readonly<Record<string, number>>;
  /** What it does to systems, as a multiplier. */
  systemMods?: Readonly<Record<string, number>>;
  /** Traits that cannot be held with it. */
  conflictsWith?: readonly string[];
}

export const FOUNDER_TRAITS: readonly FounderTrait[] = [
  // --- Instinct -----------------------------------------------------------
  {
    id: 'reader', name: 'A Reader', category: 'Instinct',
    description: 'You actually read them. All of them, to the end, including the bad ones — which is why you are always three weeks behind on saying no.',
    attributeMods: { script_judgement: 12, taste: 5, delegation: -8 },
    systemMods: { coverageDays: 0.8, decisionDays: 1.3 },
  },
  {
    id: 'star_maker', name: 'Star Maker', category: 'Instinct',
    description: 'You have put three people on the map and you can feel a fourth. Buyers would still rather you cast somebody they have heard of.',
    attributeMods: { talent_eye: 14, reputation_craft: 6 },
    systemMods: { unknownCost: 0.85, buyerConfidence: 0.88 },
    conflictsWith: ['name_only'],
  },
  {
    id: 'name_only', name: 'Names Only', category: 'Instinct',
    description: 'You do not gamble on unknowns. It costs more and it closes faster.',
    attributeMods: { market_read: 8, talent_eye: -10 },
    systemMods: { castCost: 1.2, buyerConfidence: 1.15 },
    conflictsWith: ['star_maker'],
  },
  {
    id: 'contrarian', name: 'Contrarian', category: 'Instinct',
    description: 'When everybody wants one thing you are already making the other. Sometimes early, sometimes just wrong.',
    attributeMods: { risk_appetite: 12, market_read: -6 },
    systemMods: { zeitgeistBonus: 0.7, breakoutOdds: 1.4 },
    conflictsWith: ['weathervane'],
  },
  {
    id: 'weathervane', name: 'Weathervane', category: 'Instinct',
    description: 'You make what is selling. It is not brave and it is frequently correct.',
    attributeMods: { market_read: 12, taste: -6 },
    systemMods: { zeitgeistBonus: 1.35, breakoutOdds: 0.75 },
    conflictsWith: ['contrarian'],
  },

  // --- Method -------------------------------------------------------------
  {
    id: 'hands_on', name: 'Hands On', category: 'Method',
    description: 'You are on set. Every day, on everything, which is a problem at four projects.',
    attributeMods: { note_giving: 10, delegation: -12 },
    systemMods: { qualityPerProject: 1.12, projectCapacity: 0.7 },
    conflictsWith: ['delegator'],
  },
  {
    id: 'delegator', name: 'Delegator', category: 'Method',
    description: 'You hire well and then get out of the way. More gets made; less of it is yours.',
    attributeMods: { delegation: 14, hiring: 6, note_giving: -6 },
    systemMods: { projectCapacity: 1.5, qualityPerProject: 0.93 },
    conflictsWith: ['hands_on'],
  },
  {
    id: 'development_hell', name: 'Never Quite Ready', category: 'Method',
    description: 'One more pass. It is always better after one more pass, and it is never finished.',
    attributeMods: { script_judgement: 8, taste: 6 },
    systemMods: { draftQuality: 1.15, developmentTime: 1.5 },
    conflictsWith: ['shooter'],
  },
  {
    id: 'shooter', name: 'Shoot It', category: 'Method',
    description: 'Scripts get better when a crew is booked. You have never lost a project to indecision.',
    attributeMods: { nerve: 8, cashflow: 5, script_judgement: -6 },
    systemMods: { developmentTime: 0.6, draftQuality: 0.9 },
    conflictsWith: ['development_hell'],
  },
  {
    id: 'penny_wise', name: 'Watches Every Line', category: 'Method',
    description: 'Nobody spends a hundred pounds of your money without you seeing it.',
    attributeMods: { budgeting: 12, cashflow: 8, reputation_craft: -6 },
    systemMods: { overrunOdds: 0.6, crewMorale: 0.88 },
  },

  // --- Temperament --------------------------------------------------------
  {
    id: 'unflappable', name: 'Unflappable', category: 'Temperament',
    description: 'The stage burned down and you asked what was still standing. You are also the last person in the building to call something an emergency.',
    attributeMods: { nerve: 14, stamina: 6 },
    systemMods: { crisisPenalty: 0.7, overrunOdds: 1.15 },
  },
  {
    id: 'shouter', name: 'A Shouter', category: 'Temperament',
    description: 'Things get done. People also leave, and they talk about you afterwards.',
    attributeMods: { nerve: 8, reputation_craft: -12 },
    systemMods: { scheduleRecovery: 1.25, talentRetention: 0.7 },
    conflictsWith: ['the_calm_one'],
  },
  {
    id: 'the_calm_one', name: 'The Calm One', category: 'Temperament',
    description: 'Nobody has ever heard you raise your voice, and nobody wants to be the first to make you.',
    attributeMods: { reputation_craft: 10, reading_people: 6 },
    systemMods: { talentRetention: 1.25, scheduleRecovery: 0.9 },
    conflictsWith: ['shouter'],
  },
  {
    id: 'workhorse', name: 'Workhorse', category: 'Temperament',
    description: 'Fourteen hours, six days, for as long as it takes. It is costing you something.',
    attributeMods: { stamina: 16, operations: 6 },
    systemMods: { weeklyCapacity: 1.3, healthDrain: 1.35 },
  },

  // --- Reputation ---------------------------------------------------------
  {
    id: 'straight_dealer', name: 'A Straight Dealer', category: 'Reputation',
    description: 'Your word closes deals that other people need lawyers for.',
    attributeMods: { reputation_craft: 10, reputation_money: 10, negotiation: -6 },
    systemMods: { dealDays: 0.7, dealTerms: 0.95 },
    conflictsWith: ['sharp'],
  },
  {
    id: 'sharp', name: 'Sharp', category: 'Reputation',
    description: 'You win the deal. People check the paperwork twice and come back anyway, for now.',
    attributeMods: { negotiation: 14, deal_structure: 8, reputation_craft: -10 },
    systemMods: { dealTerms: 1.18, talentRetention: 0.85 },
    conflictsWith: ['straight_dealer'],
  },
  {
    id: 'connected', name: 'Connected', category: 'Reputation',
    description: 'You know everybody, and more usefully everybody knows you. Things travel through you in both directions.',
    attributeMods: { reading_people: 8, reputation_money: 6, discretion: -10 },
    systemMods: { inboundOpportunities: 1.4 },
  },
  {
    id: 'outsider', name: 'From Outside', category: 'Reputation',
    description: 'You are not from here and it shows. Nobody owes you a favor and nobody has a file on you either.',
    attributeMods: { reputation_craft: -8, reputation_money: -8, risk_appetite: 8 },
    systemMods: { inboundOpportunities: 0.7, freshEyes: 1.2 },
    conflictsWith: ['connected'],
  },
];

/**
 * Which system multipliers are worse when they go up.
 *
 * Most read as "more is better" — a higher dealTerms is a better deal. These
 * are the other kind: more development time, more health drain, more cost per
 * cast member. Anything reading a trait's systemMods has to know which way
 * round it is, and so does any check that a trait costs something.
 */
export const HIGHER_IS_WORSE: ReadonlySet<string> = new Set([
  // Time taken. A day is a cost, so more of them is worse.
  'developmentTime', 'coverageDays', 'decisionDays', 'dealDays',
  // Money out, and the odds of something going wrong.
  'castCost', 'unknownCost', 'overrunOdds', 'crisisPenalty', 'healthDrain',
]);

/** Whether a trait costs its holder anything at all. */
export function traitHasCost(trait: FounderTrait): boolean {
  if (Object.values(trait.attributeMods ?? {}).some((v) => v < 0)) return true;
  return Object.entries(trait.systemMods ?? {}).some(([key, value]) =>
    HIGHER_IS_WORSE.has(key) ? value > 1 : value < 1);
}

export const FOUNDER_TRAIT_BY_ID: Readonly<Record<string, FounderTrait>> =
  Object.fromEntries(FOUNDER_TRAITS.map((t) => [t.id, t]));

/** Traits already held that this one cannot be held with. */
export function conflictingFounderTraits(held: readonly string[], candidate: string): string[] {
  const trait = FOUNDER_TRAIT_BY_ID[candidate];
  if (!trait) return [];
  const clashes = new Set(trait.conflictsWith ?? []);
  const out = held.filter((id) => clashes.has(id));
  for (const id of held) {
    if (FOUNDER_TRAIT_BY_ID[id]?.conflictsWith?.includes(candidate)) out.push(id);
  }
  return [...new Set(out)];
}

// ---------------------------------------------------------------------------
// Where you came from
// ---------------------------------------------------------------------------

/**
 * What you did before you founded this.
 *
 * The strike ended the companies, not the people. Everybody starting a shop in
 * the year after it came from somewhere, and where they came from is most of
 * what they are good at and all of who returns their calls.
 *
 * Each of these is a real route into producing. None of them is better than
 * the others; they are good at different halves of the job, and the half you
 * are bad at is the game.
 */
export interface FounderBackground {
  id: string;
  name: string;
  /** What you were doing when the strike started. */
  what: string;
  /** What the job left you with besides the ability, which is total anyway. */
  gives: string;
  /** What it could not give you, none of which is skill. */
  costs: string;
  /** Starting capital in cents, before whatever the player brings themselves. */
  capital: number;
  /** Who already takes your call, as a fraction of the industry. 0-1. */
  standing: number;
  /** A trait the background all but guarantees. Offered, never forced. */
  suggestsTrait?: string;
}

export const FOUNDER_BACKGROUNDS: readonly FounderBackground[] = [
  {
    id: 'development_exec', name: 'Development Executive',
    what: 'You read for somebody else\'s company for nine years and watched them make the wrong three.',
    gives: 'You know material, you know every agent, and you have a drawer of things nobody bought.',
    costs: 'You have never made a payroll or been shouted at by a completion bond.',
    capital: 180_000_00,
    standing: 0.42,
    suggestsTrait: 'reader',
  },
  {
    id: 'line_producer', name: 'Line Producer',
    what: 'Eleven pictures, on budget, in weather nobody should shoot in.',
    gives: 'You know exactly what a day costs and every crew in three cities will come when you call.',
    costs: 'Nobody has ever asked you what a script should be about.',
    capital: 220_000_00,
    standing: 0.36,
    suggestsTrait: 'penny_wise',
  },
  {
    id: 'agent', name: 'Agent',
    what: 'You represented forty people and packaged whatever the town would take.',
    gives: 'You can read a room, close a deal, and you know what everybody actually earns.',
    costs: 'You have sold pictures. You have never made one.',
    capital: 340_000_00,
    standing: 0.55,
    suggestsTrait: 'connected',
  },
  {
    id: 'showrunner', name: 'Showrunner',
    what: 'Five seasons of your own show, and you were on the picket line for the whole strike.',
    gives: 'Writers trust you completely, and you know what a season actually takes.',
    costs: 'You have always had somebody else worrying about the money.',
    capital: 260_000_00,
    standing: 0.48,
    suggestsTrait: 'hands_on',
  },
  {
    id: 'financier', name: 'Financier',
    what: 'You put money into pictures for other people and watched most of it come back.',
    gives: 'You can raise it, structure it, and you are not frightened of a bad quarter.',
    costs: 'The creative side is a language you can order dinner in and not much else.',
    capital: 900_000_00,
    standing: 0.34,
    suggestsTrait: 'sharp',
  },
  {
    id: 'outsider', name: 'From Another Business',
    what: 'You built and sold something that had nothing to do with any of this.',
    gives: 'Capital, and no assumptions at all about how it has to be done.',
    costs: 'Nobody knows you and everybody can tell within about a minute.',
    capital: 1_400_000_00,
    standing: 0.08,
    suggestsTrait: 'outsider',
  },
  {
    id: 'assistant', name: 'Somebody\'s Assistant',
    what: 'Three years on a desk outside a door, reading everything that went through it.',
    gives: 'You saw exactly how it is done, from close enough to see the mistakes.',
    costs: 'Everything else. You are starting with nothing, which is the hardest and best version.',
    capital: 12_000_00,
    standing: 0.05,
  },
];

export const FOUNDER_BACKGROUND_BY_ID: Readonly<Record<string, FounderBackground>> =
  Object.fromEntries(FOUNDER_BACKGROUNDS.map((b) => [b.id, b]));

/**
 * What a background actually decides.
 *
 * Not ability. The founder is the best living writer, director, producer,
 * showrunner and actor at once, and no previous job makes them better or worse
 * at any of it. What the old job decides is what they have in the bank and who
 * picks up the phone — which, in a business where everybody is available and
 * nobody is buying, is the only thing that varies.
 */
export function startingPositionFor(backgroundId: string): { capital: Money; standing: number } {
  const background = FOUNDER_BACKGROUND_BY_ID[backgroundId];
  return { capital: background?.capital ?? 0, standing: background?.standing ?? 0 };
}
