/**
 * SLATE — personality: who they are, not what they do.
 *
 * The craft traits are automatic. The player is the best living actor or
 * director, producer, showrunner and actor, so they hold every trait in every
 * one of those disciplines and there was never a choice to make about it.
 *
 * None of that says what kind of person they are. Being the best there has
 * ever been at making things does not tell you whether they sleep, whether
 * they hold a grudge, whether they can be alone in a house, or what they do
 * with money. That is a separate question with a real answer, and it is the
 * one thing about this character that is genuinely chosen.
 *
 * So: pick four. Nothing here is about acting, the industry, fame or the
 * business — those live on the craft sheet. Everything here is read by the
 * life half of the game, which is the half that runs whether or not anything
 * is shooting.
 */

export type PersonalityGroup =
  | 'Temperament' | 'Habits' | 'Body' | 'Money' | 'People' | 'Mind';

export const PERSONALITY_GROUPS: readonly PersonalityGroup[] = [
  'Temperament', 'Habits', 'Body', 'Money', 'People', 'Mind',
];

export interface PersonalityTrait {
  id: string;
  name: string;
  group: PersonalityGroup;
  /** What it is, in the words the game would use. */
  description: string;
  /** What it costs. Every one of these has one, and it is stated. */
  cost: string;
  /** Multipliers on knobs the life systems read. */
  systemMods?: Record<string, number>;
  /** Traits that cannot be held alongside it. Always mutual. */
  conflictsWith?: string[];
}

export const PERSONALITY_TRAITS: readonly PersonalityTrait[] = [
  // --- Temperament: how they take things ----------------------------------
  {
    id: 'even_tempered', name: 'Even Tempered', group: 'Temperament',
    description: 'Very little gets through. Bad news lands on you the same way good news does.',
    cost: 'People read the calm as not caring, and drift away from it.',
    systemMods: { stressGain: 0.78, moraleSwing: 0.8, relationshipDecay: 1.1 },
    conflictsWith: ['quick_tempered', 'highly_strung'],
  },
  {
    id: 'quick_tempered', name: 'Quick Tempered', group: 'Temperament',
    description: 'It comes up fast and it’s gone just as fast, which isn’t much comfort to whoever was standing there.',
    cost: 'Stress arrives quicker and relationships wear.',
    systemMods: { stressGain: 1.25, relationshipDecay: 1.2, stressRecovery: 1.15 },
    conflictsWith: ['even_tempered', 'peacemaker'],
  },
  {
    id: 'highly_strung', name: 'Highly Strung', group: 'Temperament',
    description: 'You feel everything at full volume. It’s exhausting, and it’s where the work comes from.',
    cost: 'Stress builds fast and sleep is the first thing to go.',
    systemMods: { stressGain: 1.35, sleepQuality: 0.88, moraleSwing: 1.25 },
    conflictsWith: ['even_tempered', 'unshakeable'],
  },
  {
    id: 'unshakeable', name: 'Unshakeable', group: 'Temperament',
    description: 'Whatever happens, you’re the one still thinking clearly twenty minutes later.',
    cost: 'You’re slow to notice something is genuinely wrong, including with you.',
    systemMods: { stressGain: 0.7, stressRecovery: 1.2, moraleSwing: 0.72, injuryRisk: 1.15 },
    conflictsWith: ['highly_strung', 'quick_tempered'],
  },
  {
    id: 'sentimental', name: 'Sentimental', group: 'Temperament',
    description: 'Birthdays, first drafts, the people who were there at the start. You keep all of it.',
    cost: 'Endings go badly, and you hold on well past the point of any use.',
    systemMods: { relationshipDecay: 0.72, moraleSwing: 1.15 },
    conflictsWith: ['detached'],
  },
  {
    id: 'detached', name: 'Detached', group: 'Temperament',
    description: 'You can put a thing down and walk away from it, including people.',
    cost: 'Everything you have drifts unless you tend it. None of it keeps itself.',
    systemMods: { relationshipDecay: 1.3, stressGain: 0.85 },
    conflictsWith: ['sentimental', 'loyal'],
  },

  // --- Habits: how they live ----------------------------------------------
  {
    id: 'early_riser', name: 'Early Riser', group: 'Habits',
    description: 'Up before anybody wants you, and the best hours of your day are over by ten.',
    cost: 'No use at all after nine at night, and time zones take you apart.',
    systemMods: { sleepQuality: 1.12, energyRecovery: 1.1, travelFatigue: 1.18 },
    conflictsWith: ['night_owl'],
  },
  {
    id: 'night_owl', name: 'Night Owl', group: 'Habits',
    description: 'The good hours start after midnight, and none of them are before noon.',
    cost: 'Every early call is a fight with yourself, and you sleep badly.',
    systemMods: { sleepQuality: 0.85, energyRecovery: 0.94 },
    conflictsWith: ['early_riser'],
  },
  {
    id: 'orderly', name: 'Orderly', group: 'Habits',
    description: 'Everything has a place and you notice immediately when it isn’t in it.',
    cost: 'Disorder costs you more than it costs other people.',
    systemMods: { hygieneDrift: 0.8, stressGain: 1.08 },
    conflictsWith: ['chaotic'],
  },
  {
    id: 'chaotic', name: 'Chaotic', group: 'Habits',
    description: 'The mess is genuinely invisible to you, and you know where everything is anyway.',
    cost: 'It shows, and it costs you when somebody comes round.',
    systemMods: { hygieneDrift: 1.3, stressGain: 0.92 },
    conflictsWith: ['orderly'],
  },
  {
    id: 'homebody', name: 'Homebody', group: 'Habits',
    description: 'Your own house, your own kitchen, your own bed. That’s where you recover.',
    cost: 'Being away takes more out of you than it takes out of anybody else.',
    systemMods: { energyRecovery: 1.15, travelFatigue: 1.3 },
    conflictsWith: ['restless'],
  },
  {
    id: 'restless', name: 'Restless', group: 'Habits',
    description: 'One place for long is beyond you. Airports don’t bother you in the slightest.',
    cost: 'You don’t rest properly, anywhere, ever.',
    systemMods: { travelFatigue: 0.68, energyRecovery: 0.9 },
    conflictsWith: ['homebody'],
  },

  // --- Body: how they treat themselves -------------------------------------
  {
    id: 'disciplined_body', name: 'Disciplined', group: 'Body',
    description: 'The training, the sleeping, the eating: all of it belongs to a person who means to still be working at sixty.',
    cost: 'The hours it takes are hours you aren’t spending on anybody.',
    systemMods: { trainingGain: 1.25, injuryRisk: 0.78, energyRecovery: 1.08, relationshipDecay: 1.15 },
    conflictsWith: ['indulgent'],
  },
  {
    id: 'indulgent', name: 'Indulgent', group: 'Body',
    description: 'Late food, late nights, and the firm belief you’ll deal with it later.',
    cost: 'You’ll deal with it later, and it will cost more then.',
    systemMods: { injuryRisk: 1.22, sleepQuality: 0.92, moraleSwing: 1.1 },
    conflictsWith: ['disciplined_body'],
  },
  {
    id: 'resilient', name: 'Resilient', group: 'Body',
    description: 'Illness, injury, a bad year: all of it clears faster in you than in the people around you.',
    cost: 'None. This one is simply luck, and there’s one of it.',
    systemMods: { stressRecovery: 1.2, injuryRisk: 0.88, energyRecovery: 1.1 },
    conflictsWith: ['burns_out'],
  },
  {
    id: 'burns_out', name: 'Burns Out', group: 'Body',
    description: 'You can go very hard for a long time and then you can’t go at all.',
    cost: 'The crash is real, and it always arrives at the worst moment.',
    systemMods: { stressGain: 1.2, stressRecovery: 0.78, energyRecovery: 0.9 },
    conflictsWith: ['resilient'],
  },
  {
    id: 'light_sleeper', name: 'Light Sleeper', group: 'Body',
    description: 'A door, a car, a thought. Anything wakes you and then that’s the night gone.',
    cost: 'You’re never quite rested, and it accumulates.',
    systemMods: { sleepQuality: 0.8 },
    conflictsWith: ['sleeps_anywhere'],
  },
  {
    id: 'sleeps_anywhere', name: 'Sleeps Anywhere', group: 'Body',
    description: 'Cars, planes, floors, the twenty minutes between two things. You take it where you find it.',
    cost: 'Things get slept through, and some of them were people.',
    systemMods: { sleepQuality: 1.18, travelFatigue: 0.85, relationshipDecay: 1.12 },
    conflictsWith: ['light_sleeper'],
  },

  // --- Money: what they do with it -----------------------------------------
  {
    id: 'frugal', name: 'Frugal', group: 'Money',
    description: 'You know what everything costs and you have never once been surprised by a bill.',
    cost: 'The coach, the course, the help. None of it ever gets paid for.',
    systemMods: { spendImpulse: 0.72, trainingGain: 0.88 },
    conflictsWith: ['spender'],
  },
  {
    id: 'spender', name: 'Spender', group: 'Money',
    description: 'Money is for turning into things, and you’re good at it.',
    cost: 'It goes out faster than it comes in, and it always has.',
    systemMods: { spendImpulse: 1.4 },
    conflictsWith: ['frugal'],
  },
  {
    id: 'generous', name: 'Generous', group: 'Money',
    description: 'You pick up the check, you lend it and you don’t chase it.',
    cost: 'People remember it fondly and you’re poorer for it.',
    systemMods: { spendImpulse: 1.18, relationshipDecay: 0.82 },
    conflictsWith: ['keeps_accounts'],
  },
  {
    id: 'keeps_accounts', name: 'Keeps Accounts', group: 'Money',
    description: 'What you’re owed and by whom, down to the coffee, stays remembered.',
    cost: 'So does everybody else, about you.',
    systemMods: { spendImpulse: 0.85, relationshipDecay: 1.12 },
    conflictsWith: ['generous'],
  },

  // --- People: how they are with others -------------------------------------
  {
    id: 'loyal', name: 'Loyal', group: 'People',
    description: 'The people who were there at the start are still there, and always will be.',
    cost: 'You stay long after you should have gone, and it wears on you.',
    systemMods: { relationshipDecay: 0.65, stressGain: 1.12 },
    conflictsWith: ['independent', 'detached'],
  },
  {
    id: 'independent', name: 'Independent', group: 'People',
    description: 'You don’t need the room, the company or the reassurance. You’re fine.',
    cost: 'Nobody is quite sure they matter to you, and eventually they stop trying.',
    systemMods: { relationshipDecay: 1.25, stressGain: 0.88 },
    conflictsWith: ['loyal', 'needs_people'],
  },
  {
    id: 'needs_people', name: 'Needs People', group: 'People',
    description: 'You’re better with somebody in the room. You always have been.',
    cost: 'Alone, you come apart quietly and quickly.',
    systemMods: { relationshipDecay: 0.8, moraleSwing: 1.2 },
    conflictsWith: ['independent', 'guarded'],
  },
  {
    id: 'guarded', name: 'Guarded', group: 'People',
    description: 'It takes a long time to get anywhere with you, and almost nobody has.',
    cost: 'The few who did are load-bearing, and there aren’t many of them.',
    systemMods: { relationshipDecay: 1.15, stressGain: 0.9 },
    conflictsWith: ['needs_people', 'open_book'],
  },
  {
    id: 'open_book', name: 'An Open Book', group: 'People',
    description: 'You say the thing. People know where they are with you within about a minute.',
    cost: 'Keeping a thing to yourself has never once happened.',
    systemMods: { relationshipDecay: 0.85, moraleSwing: 1.1 },
    conflictsWith: ['guarded'],
  },
  {
    id: 'peacemaker', name: 'Peacemaker', group: 'People',
    description: 'You can feel a room going wrong before it does and you get in front of it.',
    cost: 'You absorb the trouble and then carry it around all day.',
    systemMods: { relationshipDecay: 0.78, stressGain: 1.15 },
    conflictsWith: ['quick_tempered', 'holds_grudges'],
  },
  {
    id: 'holds_grudges', name: 'Holds Grudges', group: 'People',
    description: 'Exactly what was said, by whom, and in what year: it’s all still there.',
    cost: 'It costs you people, slowly, over a very long time.',
    systemMods: { relationshipDecay: 1.35, stressGain: 1.08 },
    conflictsWith: ['peacemaker', 'forgiving'],
  },
  {
    id: 'forgiving', name: 'Forgiving', group: 'People',
    description: 'It goes, genuinely, and the next conversation starts from nothing.',
    cost: 'You let the same thing happen twice, and carry it both times.',
    systemMods: { relationshipDecay: 0.75, stressRecovery: 1.1, stressGain: 1.1 },
    conflictsWith: ['holds_grudges'],
  },

  // --- Mind: how they think -------------------------------------------------
  {
    id: 'curious', name: 'Curious', group: 'Mind',
    description: 'The thing nobody asked you to read gets read, and it’s always useful eventually.',
    cost: 'It isn’t useful now, and now is when the work is due.',
    systemMods: { trainingGain: 1.22, stressGain: 1.1 },
    conflictsWith: ['single_minded'],
  },
  {
    id: 'single_minded', name: 'Single Minded', group: 'Mind',
    description: 'One thing at a time, all the way to the bottom of it, and nothing else exists.',
    cost: 'Everything else does exist, and it piles up while you’re down there.',
    systemMods: { stressGain: 1.12, trainingGain: 1.1, relationshipDecay: 1.15 },
    conflictsWith: ['curious', 'scattered'],
  },
  {
    id: 'scattered', name: 'Scattered', group: 'Mind',
    description: 'Six things at once, all of them moving, most of them fine.',
    cost: 'Most of them. Something is always the one you dropped.',
    systemMods: { trainingGain: 0.88, stressGain: 1.1 },
    conflictsWith: ['single_minded'],
  },
  {
    id: 'self_critical', name: 'Self Critical', group: 'Mind',
    description: 'You’re the harshest reader you’ll ever have, and the work is better for it.',
    cost: 'It isn’t free. It comes out of you.',
    systemMods: { stressGain: 1.22, moraleSwing: 1.2, trainingGain: 1.12 },
    conflictsWith: ['self_assured'],
  },
  {
    id: 'self_assured', name: 'Self Assured', group: 'Mind',
    description: 'What you can do is settled, and nobody has ever needed to confirm it for you.',
    cost: 'You’re the last to hear that something isn’t working.',
    systemMods: { stressGain: 0.82, moraleSwing: 0.78, trainingGain: 0.92 },
    conflictsWith: ['self_critical'],
  },
];

export const PERSONALITY_TRAIT_BY_ID: Readonly<Record<string, PersonalityTrait>> =
  Object.fromEntries(PERSONALITY_TRAITS.map((t) => [t.id, t]));

export function personalityTraitsIn(group: PersonalityGroup): readonly PersonalityTrait[] {
  return PERSONALITY_TRAITS.filter((t) => t.group === group);
}

/**
 * The traits of one group, ordered so each sits beside the one it rules out.
 *
 * Every one of these is written against another — Early Riser against Night
 * Owl, Frugal against Spender, Resilient against Burns Out — and the choice
 * only reads as a choice when the two are next to each other. Sorting the
 * names would scatter them: Detached would end up six places from Sentimental
 * and the trade-off between them would stop being visible at all.
 *
 * So the order is the opposition. Each trait comes out followed by the first
 * trait in its own group that it cannot be held with, and one whose opposite
 * has already been placed comes out alone rather than being paired twice —
 * which is what the few chains here need: Guarded answers Needs People, and
 * An Open Book, which only rules out Guarded, stands by itself.
 */
export function personalityTraitPairs(
  group: PersonalityGroup,
): readonly (readonly PersonalityTrait[])[] {
  const traits = personalityTraitsIn(group);
  const placed = new Set<string>();
  const rows: PersonalityTrait[][] = [];
  for (const trait of traits) {
    if (placed.has(trait.id)) continue;
    placed.add(trait.id);
    const opposite = traits.find(
      (other) => !placed.has(other.id) && (trait.conflictsWith ?? []).includes(other.id),
    );
    if (opposite) placed.add(opposite.id);
    rows.push(opposite ? [trait, opposite] : [trait]);
  }
  return rows;
}

/** How many a person may hold. Four, so the choice costs something. */
export const MAX_PERSONALITY_TRAITS = 4;

/** Which held traits a candidate cannot sit alongside. Always mutual. */
export function conflictingPersonalityTraits(held: readonly string[], candidate: string): string[] {
  const def = PERSONALITY_TRAIT_BY_ID[candidate];
  if (!def) return [];
  const out = new Set<string>();
  for (const id of held) {
    if (def.conflictsWith?.includes(id)) out.add(id);
    if (PERSONALITY_TRAIT_BY_ID[id]?.conflictsWith?.includes(candidate)) out.add(id);
  }
  return [...out];
}

/**
 * System knobs where a bigger number is the worse outcome.
 *
 * Unlike the craft sheet, nothing here is exempt: the prodigy is the best
 * there has ever been at making things and that has never made anybody a
 * better sleeper. Personality costs what it costs.
 */
export const PERSONALITY_HIGHER_IS_WORSE: ReadonlySet<string> = new Set([
  'stressGain', 'relationshipDecay', 'injuryRisk', 'hygieneDrift',
  'travelFatigue', 'spendImpulse', 'moraleSwing',
]);

/** The product of every held trait's multiplier for one knob. */
export function personalityModifier(held: readonly string[], key: string): number {
  let value = 1;
  for (const id of held) {
    const mod = PERSONALITY_TRAIT_BY_ID[id]?.systemMods?.[key];
    if (typeof mod === 'number') value *= mod;
  }
  return value;
}
