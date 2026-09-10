/**
 * SLATE — Non-performer skill models.
 *
 * Actors and actresses have the 88-attribute sheet. Everyone else gets a skill model suited
 * to their actual job: a line producer is not a bad actor, they are a good
 * line producer, and the simulation should say so.
 */

export type SkillDomain = 'general';

export interface SkillDef {
  id: string;
  name: string;
  domain: SkillDomain;
  description: string;
  trainability: number;
}

function s(id: string, name: string, domain: SkillDomain, description: string, trainability = 1): SkillDef {
  return { id, name, domain, description, trainability };
}

export const SKILLS: readonly SkillDef[] = [

  // Executive / business affairs

  // Business / general life
  // Life, which is a longer list than a career is. Everything here is
  // something a person actually gets better at, and every one of them has a
  // way to build it somewhere in the game: a class, a club, a job, an hour on
  // a Saturday, or simply doing it enough times that it stops being hard.
  s('public_speaking', 'Public Speaking', 'general', 'Holding a room.', 1.2),
  s('cooking', 'Cooking', 'general', 'Food that’s better and cheaper than takeout.', 1.4),
  s('driving', 'Driving', 'general', 'Competence, and the insurance discount that comes with it.', 1.2),
  s('fitness', 'Fitness', 'general', 'Physical capacity that other systems draw on.', 1.4),
  s('languages', 'Languages', 'general', 'Working in more than one.', 1.0),
  s('personal_finance', 'Personal Finance', 'general', 'Not being talked into things.', 1.2),
  s('swimming', 'Swimming', 'general', 'The one physical skill that’s genuinely a safety issue.', 1.3),
  s('first_aid', 'First Aid', 'general', 'Knowing what to do in the four minutes before anybody else arrives.', 1.4),
  s('self_defense', 'Self Defense', 'general', 'Not freezing, which is most of it.', 1.1),
  s('typing', 'Typing', 'general', 'Getting words down as fast as you think them.', 1.5),
  s('computer_literacy', 'Computer Literacy', 'general', 'The machine doing what you meant, not what you clicked.', 1.4),
  s('home_repair', 'Home Repair', 'general', 'Fixing the thing instead of paying somebody to fix the thing.', 1.2),
  s('car_maintenance', 'Car Maintenance', 'general', 'Oil, tires, brakes, and knowing when the noise matters.', 1.2),
  s('gardening', 'Gardening', 'general', 'Growing something on purpose and keeping it alive.', 1.3),
  s('sewing', 'Sewing', 'general', 'A hem, a button, and a jacket that fits because you made it fit.', 1.3),
  s('housekeeping', 'Housekeeping', 'general', 'A place that stays livable without a weekend disappearing into it.', 1.5),
  s('time_management', 'Time Management', 'general', 'Getting the day to hold what you put in it.', 1.1),
  s('study_skills', 'Study Skills', 'general', 'Learning how to learn, which nobody is taught and everybody needs.', 1.3),
  s('mental_arithmetic', 'Mental Arithmetic', 'general', 'Numbers in your head, quickly, without a phone.', 1.2),
  s('memory', 'Memory', 'general', 'Holding lines, names and where you put things.', 1.0),
  s('reading', 'Reading', 'general', 'Getting through it and keeping what was in it.', 1.2),
  s('research', 'Research', 'general', 'Finding out, and knowing when what you found isn’t good enough.', 1.2),
  s('correspondence', 'Correspondence', 'general', 'An email, a letter, a message that gets the answer you wanted.', 1.3),
  s('listening', 'Listening', 'general', 'Actually hearing it, instead of waiting for your turn to talk.', 1.0),
  s('empathy', 'Empathy', 'general', 'Understanding a person who isn’t you, and that happens to be the job too.', 0.9),
  s('conflict_resolution', 'Conflict Resolution', 'general', 'Getting two people out of a room still speaking.', 1.0),
  s('etiquette', 'Etiquette', 'general', 'Knowing which room you’re in and behaving like it.', 1.2),
  s('small_talk', 'Small Talk', 'general', 'The first four minutes, which decide the rest.', 1.2),
  s('networking', 'Networking', 'general', 'Knowing people, and being somebody they’re glad to know.', 1.1),
  s('dancing', 'Dancing', 'general', 'Moving in time, on purpose, in front of people.', 1.2),
  s('musical_instrument', 'A Musical Instrument', 'general', 'One instrument played properly beats four played badly.', 1.0),
  s('drawing', 'Drawing', 'general', 'Seeing what’s in front of you, not what you assume is there.', 1.1),
  s('photography', 'Photography', 'general', 'Light, frame and the moment: three separate problems.', 1.2),
  s('nutrition', 'Nutrition', 'general', 'What food actually does, past what the packet says.', 1.3),
  s('sleep_hygiene', 'Sleep Hygiene', 'general', 'Going to bed on purpose, which changes everything else.', 1.4),
  s('mindfulness', 'Mindfulness', 'general', 'Sitting with it instead of running.', 1.1),
  s('resilience', 'Resilience', 'general', 'Getting up the next morning after the worst version of the day.', 0.9),
  s('navigation', 'Navigation', 'general', 'Knowing where you are without being told.', 1.3),
  s('bargaining', 'Bargaining', 'general', 'Paying what a thing is worth, not what’s on the label.', 1.2),
  s('childcare', 'Childcare', 'general', 'Keeping a small person alive, fed and reasonably happy.', 1.2),
  s('pet_care', 'Pet Care', 'general', 'An animal that’s well, because of things you did.', 1.4),
  s('cycling', 'Cycling', 'general', 'A bike as transport, not a hobby.', 1.4),
  s('chess', 'Chess', 'general', 'Thinking three moves ahead, and it turns out that habit travels.', 1.1),
  s('cards', 'Card Games', 'general', 'Odds, faces, and knowing when somebody is lying.', 1.2),
  s('wine', 'Wine', 'general', 'Ordering for a table without guessing.', 1.2),
  s('bartending', 'Bartending', 'general', 'Twenty drinks made properly and one conversation held at the same time.', 1.3),
  s('handwriting', 'Handwriting', 'general', 'Something legible, signed, that means what it says.', 1.4),

  // Track. A sprinter is not one thing: getting out of the blocks, reaching
  // top speed and holding it to the line are three different problems, and a
  // runner can be brilliant at one and lose the race in another.
] as const;

export const SKILL_BY_ID: Readonly<Record<string, SkillDef>> =
  Object.fromEntries(SKILLS.map((k) => [k.id, k]));

export const SKILL_IDS: readonly string[] = SKILLS.map((k) => k.id);

export type SkillSheet = Record<string, number>;

export function emptySkillSheet(base = 5): SkillSheet {
  const sheet: SkillSheet = {};
  for (const k of SKILLS) sheet[k.id] = base;
  return sheet;
}

export function skillsInDomain(domain: SkillDomain): SkillDef[] {
  return SKILLS.filter((k) => k.domain === domain);
}

export function domainAverage(sheet: SkillSheet, domain: SkillDomain): number {
  const defs = skillsInDomain(domain);
  if (defs.length === 0) return 0;
  return defs.reduce((s_, d) => s_ + (sheet[d.id] ?? 0), 0) / defs.length;
}
