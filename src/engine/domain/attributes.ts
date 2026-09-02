/**
 * SLATE — Performer attributes and traits.
 *
 * 88 attributes across seven disciplines and 42 traits. Attributes are 0-100
 * rated capabilities that grow with training and work. Traits are qualitative
 * modifiers that reshape how a career behaves rather than simply adding points.
 *
 * These belong to *performing*. Writers, directors, producers, executives and
 * crew have their own skill models (see `skills.ts`); flattening every
 * profession onto an actor's rating sheet would be lazy and wrong.
 */

export type AttributeGroup =
  | 'Craft' | 'Voice' | 'Physical' | 'Screen' | 'Range' | 'Professionalism' | 'Industry';

export interface AttributeDef {
  id: string;
  name: string;
  group: AttributeGroup;
  description: string;
  /** How quickly training moves this attribute. 1 = normal. */
  trainability: number;
  /** Attributes that decay without use. */
  perishable: boolean;
}

function attr(
  id: string, name: string, group: AttributeGroup, description: string,
  trainability = 1, perishable = false,
): AttributeDef {
  return { id, name, group, description, trainability, perishable };
}

export const ATTRIBUTES: readonly AttributeDef[] = [
  // ---- Craft (14) ----
  attr('emotional_truth', 'Emotional Truth', 'Craft', 'Whether a moment reads as genuinely felt rather than performed.', 0.7),
  attr('subtext', 'Subtext', 'Craft', 'Playing what the character means underneath what the character says.', 0.9),
  attr('active_listening', 'Active Listening', 'Craft', 'Reacting to a scene partner as it happens instead of waiting for a cue.', 1.1),
  attr('script_analysis', 'Script Analysis', 'Craft', 'Finding structure, intent and opportunity in a text.', 1.2),
  attr('character_construction', 'Character Construction', 'Craft', 'Assembling a coherent person from the page up.', 1.0),
  attr('backstory_invention', 'Backstory Invention', 'Craft', 'Filling the gaps the writer left with usable interior history.', 1.1),
  attr('objective_clarity', 'Objective Clarity', 'Craft', 'Knowing precisely what the character wants in every beat.', 1.1),
  attr('improvisation', 'Improvisation', 'Craft', 'Generating usable material live when the scene needs it.', 0.9, true),
  attr('cold_reading', 'Cold Reading', 'Craft', 'Performing well from a script seen minutes ago.', 1.0, true),
  attr('memorization', 'Memorization', 'Craft', 'Getting lines in, reliably and fast.', 1.0, true),
  attr('pressure_lines', 'Line Retention Under Pressure', 'Craft', 'Holding the text when the day is long and the crew is waiting.', 0.8, true),
  attr('take_consistency', 'Take Consistency', 'Craft', 'Repeating a performance precisely enough for the edit to cut.', 0.9),
  attr('direction_absorption', 'Direction Absorption', 'Craft', 'Turning a note into a changed performance on the next take.', 1.0),
  attr('continuity_awareness', 'Continuity Awareness', 'Craft', 'Matching physical action across coverage without being told.', 1.2),

  // ---- Voice (12) ----
  attr('projection', 'Projection', 'Voice', 'Filling a space without shouting.', 1.2, true),
  attr('diction', 'Diction', 'Voice', 'Being understood on the first pass, in the mix.', 1.2),
  attr('resonance', 'Vocal Resonance', 'Voice', 'The weight and colour a voice carries.', 0.7),
  attr('breath_control', 'Breath Control', 'Voice', 'Sustaining long lines and physical scenes without audible strain.', 1.3, true),
  attr('dialect_acquisition', 'Dialect Acquisition', 'Voice', 'How fast a new accent becomes usable.', 1.0),
  attr('accent_retention', 'Accent Retention', 'Voice', 'Holding an accent for months of shooting without drift.', 0.9, true),
  attr('vocal_range', 'Vocal Range', 'Voice', 'Pitch and register available to the performer.', 0.8),
  attr('singing', 'Singing', 'Voice', 'Whether a musical number can be performed live or at all.', 1.0, true),
  attr('adr', 'ADR & Looping', 'Voice', 'Matching a recorded line to picture in a booth, months later.', 1.3),
  attr('voice_over', 'Voice-Over Technique', 'Voice', 'Carrying a character with voice alone.', 1.2),
  attr('whisper_technique', 'Whisper Technique', 'Voice', 'Intimate delivery that still cuts through a mix.', 1.1),
  attr('vocal_stamina', 'Vocal Stamina', 'Voice', 'Surviving a screaming scene on take nineteen.', 1.0, true),

  // ---- Physical (14) ----
  attr('movement_quality', 'Movement Quality', 'Physical', 'How a character walks, sits and occupies space.', 0.9),
  attr('physical_presence', 'Physical Presence', 'Physical', 'Commanding a frame before speaking.', 0.6),
  attr('stamina', 'Stamina', 'Physical', 'Holding up across a fourteen-hour day.', 1.4, true),
  attr('flexibility', 'Flexibility', 'Physical', 'Range of motion for demanding physical work.', 1.4, true),
  attr('coordination', 'Coordination', 'Physical', 'Hitting marks and props cleanly under pressure.', 1.1),
  attr('dance', 'Dance', 'Physical', 'Choreographed movement to tempo.', 1.1, true),
  attr('stage_combat', 'Stage Combat', 'Physical', 'Safe, readable fight work for a live eye.', 1.2, true),
  attr('screen_fighting', 'Screen Fighting', 'Physical', 'Fight work built for a lens and an edit.', 1.2, true),
  attr('stunt_aptitude', 'Stunt Aptitude', 'Physical', 'How much of the dangerous work insurance will let you do.', 0.9, true),
  attr('horsemanship', 'Horsemanship', 'Physical', 'Riding competently on camera.', 1.0, true),
  attr('weapons_handling', 'Weapons Handling', 'Physical', 'Safe, credible handling of prop weapons.', 1.3),
  attr('physical_comedy', 'Physical Comedy', 'Physical', 'Getting a laugh with the body.', 0.8),
  attr('mask_and_mime', 'Mask & Mime Work', 'Physical', 'Performing through prosthetics, suits and silence.', 1.0),
  attr('injury_resilience', 'Injury Resilience', 'Physical', 'Recovering from the wear a physical shoot causes.', 0.8, true),

  // ---- Screen (11) ----
  attr('charisma', 'Charisma', 'Screen', 'The thing that makes an audience choose to watch you.', 0.5),
  attr('camera_awareness', 'Camera Awareness', 'Screen', 'Knowing the lens, the size and what it is seeing.', 1.2),
  attr('eyeline_discipline', 'Eyeline Discipline', 'Screen', 'Holding a precise eyeline against a tennis ball on a stick.', 1.3),
  attr('stillness', 'Stillness', 'Screen', 'Doing almost nothing and remaining compelling.', 0.9),
  attr('close_up_work', 'Close-Up Work', 'Screen', 'Scaling a performance down to a face filling a screen.', 1.0),
  attr('wide_shot_presence', 'Wide Shot Presence', 'Screen', 'Reading clearly when the camera is far away.', 1.0),
  attr('photogenic_quality', 'Photogenic Quality', 'Screen', 'How the specific combination of face and lens behaves.', 0.4),
  attr('magnetism', 'Magnetism', 'Screen', 'Pulling focus in an ensemble without stealing it.', 0.5),
  attr('reaction_shots', 'Reaction Shots', 'Screen', 'Carrying a cut with a response rather than a line.', 1.1),
  attr('silent_storytelling', 'Silent Storytelling', 'Screen', 'Telling the story with no dialogue at all.', 0.9),
  attr('ensemble_blending', 'Ensemble Blending', 'Screen', 'Serving a scene instead of your own coverage.', 1.0),

  // ---- Range (14) ----
  attr('comedy_timing', 'Comedy Timing', 'Range', 'The rhythm that turns a line into a laugh.', 0.7),
  attr('dry_comedy', 'Dry Comedy', 'Range', 'Deadpan and understatement.', 0.9),
  attr('broad_comedy', 'Broad Comedy', 'Range', 'Big, physical, unembarrassed funny.', 0.9),
  attr('drama', 'Drama', 'Range', 'Sustained serious work with real stakes.', 1.0),
  attr('tragedy', 'Tragedy', 'Range', 'Carrying a story that ends badly and earning it.', 0.8),
  attr('romance', 'Romance', 'Range', 'Playing desire and tenderness credibly.', 0.9),
  attr('chemistry', 'Chemistry', 'Range', 'Generating a believable bond with a scene partner.', 0.6),
  attr('fear_terror', 'Fear & Terror', 'Range', 'Genuine dread rather than performed screaming.', 0.9),
  attr('rage', 'Rage', 'Range', 'Anger with a specific engine behind it.', 0.9),
  attr('vulnerability', 'Vulnerability', 'Range', 'Being seen without defending yourself.', 0.7),
  attr('restraint', 'Restraint', 'Range', 'Withholding, and letting the audience lean in.', 0.8),
  attr('joy', 'Joy', 'Range', 'Unforced delight, which is far harder than it looks.', 0.8),
  attr('grief', 'Grief', 'Range', 'Loss played specifically rather than generally.', 0.8),
  attr('menace', 'Menace', 'Range', 'Threat that an audience believes.', 0.8),

  // ---- Professionalism (12) ----
  attr('punctuality', 'Punctuality', 'Professionalism', 'Being on set, ready, at call.', 1.5),
  attr('preparation', 'Preparation', 'Professionalism', 'Arriving with the work already done.', 1.4),
  attr('set_etiquette', 'Set Etiquette', 'Professionalism', 'Knowing how a set runs and not getting in its way.', 1.4),
  attr('collaboration', 'Collaboration', 'Professionalism', 'Making the people around you better.', 1.1),
  attr('note_integration', 'Note Integration', 'Professionalism', 'Taking a note gracefully and acting on it.', 1.2),
  attr('resilience', 'Resilience', 'Professionalism', 'Recovering from a bad day, a bad review or a bad year.', 0.9),
  attr('pressure_tolerance', 'Pressure Tolerance', 'Professionalism', 'Performing while the schedule burns.', 1.0),
  attr('safety_awareness', 'Safety Awareness', 'Professionalism', 'Recognising when a setup is not safe.', 1.4),
  attr('long_day_endurance', 'Long Day Endurance', 'Professionalism', 'Quality that holds at hour thirteen.', 1.2, true),
  attr('adaptability', 'Adaptability', 'Professionalism', 'The location fell through and the scene changed. Now what?', 1.1),
  attr('discretion', 'Discretion', 'Professionalism', 'Keeping confidential material confidential.', 1.3),
  attr('reliability', 'Reliability', 'Professionalism', 'Whether producers believe you will finish the job.', 1.2),

  // ---- Industry (11) ----
  attr('audition_technique', 'Audition Technique', 'Industry', 'Doing your best work in a small room with no context.', 1.3, true),
  attr('self_tape_craft', 'Self-Tape Craft', 'Industry', 'Framing, sound and performance from your own living room.', 1.4),
  attr('chemistry_reads', 'Chemistry Reads', 'Industry', 'Producing a spark with a stranger, on demand.', 1.0),
  attr('screen_test_composure', 'Screen Test Composure', 'Industry', 'Holding up with the studio in the room.', 1.0),
  attr('networking', 'Networking', 'Industry', 'Building relationships that produce opportunities later.', 1.2),
  attr('interview_poise', 'Interview Poise', 'Industry', 'Being interesting and safe in a press interview.', 1.2),
  attr('press_discipline', 'Press Discipline', 'Industry', 'Staying on message when the question is a trap.', 1.3),
  attr('red_carpet_presence', 'Red Carpet Presence', 'Industry', 'Turning an appearance into coverage.', 1.1),
  attr('social_instinct', 'Social Media Instinct', 'Industry', 'Sensing what an audience will actually engage with.', 1.2),
  attr('negotiation_awareness', 'Negotiation Awareness', 'Industry', 'Understanding what your representation is trading away.', 1.1),
  attr('career_strategy', 'Career Strategy', 'Industry', 'Choosing the next job for where it leads, not what it pays.', 1.0),
] as const;

if (ATTRIBUTES.length !== 88) {
  throw new Error(`SLATE expects exactly 88 performer attributes; found ${ATTRIBUTES.length}.`);
}

export const ATTRIBUTE_IDS: readonly string[] = ATTRIBUTES.map((a) => a.id);
export const ATTRIBUTE_BY_ID: Readonly<Record<string, AttributeDef>> =
  Object.fromEntries(ATTRIBUTES.map((a) => [a.id, a]));

export const ATTRIBUTE_GROUPS: readonly AttributeGroup[] =
  ['Craft', 'Voice', 'Physical', 'Screen', 'Range', 'Professionalism', 'Industry'];

export function attributesInGroup(group: AttributeGroup): AttributeDef[] {
  return ATTRIBUTES.filter((a) => a.group === group);
}

/** 0-100 ratings, keyed by attribute id. */
export type AttributeSheet = Record<string, number>;

export function emptyAttributeSheet(base = 10): AttributeSheet {
  const sheet: AttributeSheet = {};
  for (const a of ATTRIBUTES) sheet[a.id] = base;
  return sheet;
}

export function groupAverage(sheet: AttributeSheet, group: AttributeGroup): number {
  const defs = attributesInGroup(group);
  if (defs.length === 0) return 0;
  return defs.reduce((s, d) => s + (sheet[d.id] ?? 0), 0) / defs.length;
}

export function overallRating(sheet: AttributeSheet): number {
  let total = 0;
  for (const a of ATTRIBUTES) total += sheet[a.id] ?? 0;
  return total / ATTRIBUTES.length;
}

// ---------------------------------------------------------------------------
// Traits
// ---------------------------------------------------------------------------

export type TraitCategory = 'Talent' | 'Method' | 'Temperament' | 'Public' | 'Social' | 'Life';

export interface TraitDef {
  id: string;
  name: string;
  category: TraitCategory;
  description: string;
  /** Flat additions applied to attributes when the trait is held. */
  attributeMods?: Record<string, number>;
  /** Named multipliers other systems consult, e.g. `auditionVariance`. */
  systemMods?: Record<string, number>;
  /** Traits that cannot be held at the same time. */
  conflictsWith?: string[];
  /** Traits the world can award later rather than only at creation. */
  earnable?: boolean;
}

export const TRAITS: readonly TraitDef[] = [
  { id: 'natural_talent', name: 'Natural Talent', category: 'Talent', description: 'Things that take others years took you months. Craft starts high but coasting is a real risk.', attributeMods: { emotional_truth: 10, charisma: 6, subtext: 6 }, systemMods: { trainingGain: 0.85 }, conflictsWith: ['late_bloomer'] },
  { id: 'late_bloomer', name: 'Late Bloomer', category: 'Talent', description: 'Slow to start, hard to stop. Growth compounds instead of plateauing.', attributeMods: { emotional_truth: -4, charisma: -3 }, systemMods: { trainingGain: 1.35, ageCurveShift: 8 }, conflictsWith: ['natural_talent', 'prodigy'] },
  { id: 'prodigy', name: 'Prodigy', category: 'Talent', description: 'Extraordinary young ability, and the scrutiny that comes with it.', attributeMods: { emotional_truth: 14, memorization: 10, direction_absorption: 8 }, systemMods: { youthBonus: 1.4, burnoutRisk: 1.35 }, conflictsWith: ['late_bloomer'] },
  { id: 'method_actor', name: 'Method Actor', category: 'Method', description: 'You live inside the part. The results can be extraordinary and the cost is real.', attributeMods: { emotional_truth: 12, vulnerability: 8, grief: 6 }, systemMods: { stressPerShootDay: 1.5, castingPrestige: 1.15, crewFriction: 1.2 }, conflictsWith: ['technical_actor'] },
  { id: 'technical_actor', name: 'Technical Actor', category: 'Method', description: 'Precision, repeatability and a director who never worries about the edit.', attributeMods: { take_consistency: 14, continuity_awareness: 10, direction_absorption: 8, eyeline_discipline: 6 }, systemMods: { stressPerShootDay: 0.8, scheduleEfficiency: 1.12 }, conflictsWith: ['method_actor'] },
  { id: 'chameleon', name: 'Chameleon', category: 'Method', description: 'Audiences forget it is you. Casting directors love it; star vehicles do not.', attributeMods: { character_construction: 12, dialect_acquisition: 10, mask_and_mime: 8 }, systemMods: { rangePenalty: 0.6, fameGrowth: 0.85, castingPrestige: 1.1 } },
  { id: 'star_quality', name: 'Star Quality', category: 'Talent', description: 'The camera simply prefers you. It is not fair and it is not earned.', attributeMods: { charisma: 14, magnetism: 12, photogenic_quality: 10 }, systemMods: { fameGrowth: 1.35, quoteMultiplier: 1.25, castingPrestige: 0.95 } },
  { id: 'character_actor', name: 'Character Actor', category: 'Talent', description: 'Never the lead, never out of work, always the best thing in it.', attributeMods: { character_construction: 10, ensemble_blending: 10 }, systemMods: { leadCastingOdds: 0.55, supportCastingOdds: 1.5, careerLongevity: 1.3 } },
  { id: 'comedic_instinct', name: 'Comedic Instinct', category: 'Talent', description: 'You hear the joke inside the line before anyone points at it.', attributeMods: { comedy_timing: 14, dry_comedy: 8, broad_comedy: 8, improvisation: 6 } },
  { id: 'dramatic_gravitas', name: 'Dramatic Gravitas', category: 'Talent', description: 'When you say something serious, a room believes it.', attributeMods: { drama: 12, tragedy: 10, restraint: 8, resonance: 6 } },
  { id: 'action_ready', name: 'Action Ready', category: 'Talent', description: 'Insurance says yes, stunt coordinators say yes, and you do your own work.', attributeMods: { stunt_aptitude: 14, screen_fighting: 12, stamina: 10, injury_resilience: 8 }, systemMods: { stuntInsuranceCost: 0.7, injuryRisk: 0.85 } },
  { id: 'musical', name: 'Musical', category: 'Talent', description: 'Singing and rhythm are available to you as tools.', attributeMods: { singing: 16, vocal_range: 12, dance: 8 } },
  { id: 'multilingual', name: 'Multilingual', category: 'Talent', description: 'International projects open up in a way they do not for most people.', attributeMods: { dialect_acquisition: 10, accent_retention: 8 }, systemMods: { internationalCastingOdds: 1.4 } },
  { id: 'photographic_memory', name: 'Photographic Memory', category: 'Talent', description: 'The script goes in once and stays.', attributeMods: { memorization: 18, cold_reading: 10, pressure_lines: 12 } },
  { id: 'quick_study', name: 'Quick Study', category: 'Method', description: 'You get useful fast, which matters more than getting perfect slowly.', systemMods: { trainingGain: 1.25, prepTimeRequired: 0.75 }, conflictsWith: ['slow_burn'] },
  { id: 'slow_burn', name: 'Slow Burn', category: 'Method', description: 'Deep preparation, and work that keeps deepening across a shoot.', systemMods: { trainingGain: 0.85, prepTimeRequired: 1.4, lateShootBonus: 1.2 }, conflictsWith: ['quick_study'] },
  { id: 'workaholic', name: 'Workaholic', category: 'Temperament', description: 'You will take the next job. Your family has noticed.', systemMods: { opportunityRate: 1.3, relationshipDecay: 1.4, burnoutRisk: 1.3 } },
  { id: 'perfectionist', name: 'Perfectionist', category: 'Temperament', description: 'Excellent results, expensive days.', attributeMods: { preparation: 10, take_consistency: 6 }, systemMods: { qualityBonus: 1.12, scheduleEfficiency: 0.88, crewFriction: 1.15 } },
  { id: 'collaborative', name: 'Collaborative', category: 'Temperament', description: 'Directors ask for you again, which is worth more than a quote bump.', attributeMods: { collaboration: 14, note_integration: 10, ensemble_blending: 8 }, systemMods: { repeatHireOdds: 1.4, crewFriction: 0.75 }, conflictsWith: ['difficult', 'diva'] },
  { id: 'difficult', name: 'Difficult', category: 'Temperament', description: 'The work may be great. The stories travel faster than the work.', attributeMods: { note_integration: -12, collaboration: -14 }, systemMods: { repeatHireOdds: 0.55, professionalReputation: 0.7, crewFriction: 1.6 }, conflictsWith: ['collaborative', 'humble'], earnable: true },
  { id: 'diva', name: 'Diva', category: 'Temperament', description: 'Your requirements are extensive and widely discussed.', attributeMods: { set_etiquette: -14, punctuality: -10 }, systemMods: { productionCost: 1.08, repeatHireOdds: 0.6, tabloidInterest: 1.5 }, conflictsWith: ['collaborative', 'humble'], earnable: true },
  { id: 'humble', name: 'Humble', category: 'Temperament', description: 'Crews like you, and crews talk.', attributeMods: { set_etiquette: 10, collaboration: 8 }, systemMods: { crewFriction: 0.7, professionalReputation: 1.2, quoteMultiplier: 0.95 }, conflictsWith: ['diva', 'difficult'] },
  { id: 'generous_partner', name: 'Generous Scene Partner', category: 'Temperament', description: 'Your co-stars are better in scenes with you. People notice.', attributeMods: { active_listening: 12, ensemble_blending: 12, chemistry: 8 }, systemMods: { coStarPerformance: 1.15, repeatHireOdds: 1.25 }, conflictsWith: ['scene_stealer'] },
  { id: 'scene_stealer', name: 'Scene Stealer', category: 'Temperament', description: 'The eye goes to you. Whether that helps the film is another question.', attributeMods: { magnetism: 12, reaction_shots: 10 }, systemMods: { coStarPerformance: 0.92, breakoutOdds: 1.3 }, conflictsWith: ['generous_partner'] },
  { id: 'camera_shy', name: 'Camera Shy', category: 'Public', description: 'The work is fine. The publicity is agony.', attributeMods: { interview_poise: -14, red_carpet_presence: -12 }, systemMods: { publicityStress: 1.6, fameGrowth: 0.75 }, conflictsWith: ['press_natural'] },
  { id: 'press_natural', name: 'Press Natural', category: 'Public', description: 'You are good in a room full of journalists, which is rarer than talent.', attributeMods: { interview_poise: 14, press_discipline: 10, red_carpet_presence: 10 }, systemMods: { publicityStress: 0.7, fameGrowth: 1.25 }, conflictsWith: ['camera_shy', 'press_averse'] },
  { id: 'press_averse', name: 'Press Averse', category: 'Public', description: 'You do the minimum contractual publicity and not one appearance more.', systemMods: { publicityStress: 1.35, fameGrowth: 0.8, tabloidInterest: 1.2 }, conflictsWith: ['press_natural'] },
  { id: 'viral_instinct', name: 'Viral Instinct', category: 'Public', description: 'You understand, without being taught, what an audience will share.', attributeMods: { social_instinct: 16 }, systemMods: { socialGrowth: 1.5, viralOdds: 1.6 } },
  { id: 'private', name: 'Private', category: 'Public', description: 'Your life stays yours. Fame grows slower and lasts longer.', systemMods: { tabloidInterest: 0.55, fameGrowth: 0.85, relationshipPrivacy: 1.5 } },
  { id: 'controversial', name: 'Controversial', category: 'Public', description: 'Attention is never a problem. Approval sometimes is.', systemMods: { tabloidInterest: 1.8, audienceAppeal: 0.85, fameGrowth: 1.3, brandDealOdds: 0.6 }, conflictsWith: ['beloved'], earnable: true },
  { id: 'beloved', name: 'Beloved', category: 'Public', description: 'The public is on your side, including when you do not deserve it.', systemMods: { audienceAppeal: 1.3, crisisRecovery: 1.6, brandDealOdds: 1.35 }, conflictsWith: ['controversial', 'polarizing'], earnable: true },
  { id: 'polarizing', name: 'Polarizing', category: 'Public', description: 'Half the audience is devoted. The other half is loud.', systemMods: { audienceVariance: 1.7, fameGrowth: 1.15, brandDealOdds: 0.8 }, conflictsWith: ['beloved'], earnable: true },
  { id: 'well_connected', name: 'Well Connected', category: 'Social', description: 'You know people, and the people you know know people.', attributeMods: { networking: 14 }, systemMods: { opportunityRate: 1.4, meetingAccess: 1.6 }, conflictsWith: ['outsider'] },
  { id: 'outsider', name: 'Outsider', category: 'Social', description: 'No shortcuts. Everything you get, you got yourself.', attributeMods: { networking: -10 }, systemMods: { opportunityRate: 0.7, meetingAccess: 0.55, audienceAppeal: 1.1 }, conflictsWith: ['well_connected', 'nepotism_adjacent'] },
  { id: 'nepotism_adjacent', name: 'Industry Family', category: 'Social', description: 'Doors open early. Then you have to be good, and everyone is watching for whether you are.', systemMods: { earlyOpportunityRate: 2.0, meetingAccess: 1.8, criticalScrutiny: 1.3, audienceAppeal: 0.92 }, conflictsWith: ['outsider', 'self_made'] },
  { id: 'self_made', name: 'Self Made', category: 'Social', description: 'You built it without help, and the press likes that story.', systemMods: { audienceAppeal: 1.15, resilienceBonus: 1.2 }, conflictsWith: ['nepotism_adjacent'] },
  { id: 'financially_savvy', name: 'Financially Savvy', category: 'Life', description: 'You read the deal. You understand backend. You do not get talked into things.', attributeMods: { negotiation_awareness: 14, career_strategy: 8 }, systemMods: { investmentReturn: 1.2, dealTerms: 1.15 }, conflictsWith: ['reckless_spender'] },
  { id: 'reckless_spender', name: 'Reckless Spender', category: 'Life', description: 'Money arrives and immediately leaves.', systemMods: { impulsePurchaseRate: 2.0, savingsRate: 0.5 }, conflictsWith: ['financially_savvy'], earnable: true },
  { id: 'health_conscious', name: 'Health Conscious', category: 'Life', description: 'You sleep, you train, you last.', attributeMods: { stamina: 10, injury_resilience: 8, long_day_endurance: 8 }, systemMods: { recoveryRate: 1.35, injuryRisk: 0.75, careerLongevity: 1.2 }, conflictsWith: ['burnout_prone'] },
  { id: 'burnout_prone', name: 'Burnout Prone', category: 'Life', description: 'You run hot, and then you run out.', systemMods: { stressPerShootDay: 1.4, recoveryRate: 0.7, burnoutRisk: 1.7 }, conflictsWith: ['health_conscious', 'resilient'] },
  { id: 'resilient', name: 'Resilient', category: 'Life', description: 'A flop does not end you. A bad year does not define you.', attributeMods: { resilience: 16, pressure_tolerance: 10 }, systemMods: { crisisRecovery: 1.5, recoveryRate: 1.2 }, conflictsWith: ['burnout_prone'] },
  { id: 'lucky_break', name: 'Lucky Break', category: 'Life', description: 'Once in your career, something goes right that had no business going right.', systemMods: { luckyBreakCharges: 1, opportunityRate: 1.1 } },
] as const;

if (TRAITS.length !== 42) {
  throw new Error(`SLATE expects exactly 42 performer traits; found ${TRAITS.length}.`);
}

export const TRAIT_IDS: readonly string[] = TRAITS.map((t) => t.id);
export const TRAIT_BY_ID: Readonly<Record<string, TraitDef>> =
  Object.fromEntries(TRAITS.map((t) => [t.id, t]));

export function traitsInCategory(category: TraitCategory): TraitDef[] {
  return TRAITS.filter((t) => t.category === category);
}

/** Traits that cannot be added alongside the ones already held. */
export function conflictingTraits(held: readonly string[], candidate: string): string[] {
  const def = TRAIT_BY_ID[candidate];
  if (!def) return [];
  const out = new Set<string>();
  for (const h of held) {
    if (def.conflictsWith?.includes(h)) out.add(h);
    if (TRAIT_BY_ID[h]?.conflictsWith?.includes(candidate)) out.add(h);
  }
  return [...out];
}

/** Attribute sheet with trait modifiers folded in and clamped to 0-100. */
export function effectiveAttributes(sheet: AttributeSheet, traits: readonly string[]): AttributeSheet {
  const out: AttributeSheet = { ...sheet };
  for (const tid of traits) {
    const mods = TRAIT_BY_ID[tid]?.attributeMods;
    if (!mods) continue;
    for (const [aid, delta] of Object.entries(mods)) {
      if (out[aid] === undefined) continue;
      out[aid] = Math.max(0, Math.min(100, (out[aid] ?? 0) + delta));
    }
  }
  return out;
}

/** Product of every trait's multiplier for a named system knob. Default 1. */
export function systemModifier(traits: readonly string[], key: string): number {
  let value = 1;
  for (const tid of traits) {
    const m = TRAIT_BY_ID[tid]?.systemMods?.[key];
    if (typeof m === 'number') value *= m;
  }
  return value;
}

/** Additive version, for knobs like `luckyBreakCharges` that count rather than scale. */
export function systemCount(traits: readonly string[], key: string): number {
  let value = 0;
  for (const tid of traits) {
    const m = TRAIT_BY_ID[tid]?.systemMods?.[key];
    if (typeof m === 'number') value += m;
  }
  return value;
}
