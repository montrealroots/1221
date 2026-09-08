/**
 * SLATE — Non-performer skill models.
 *
 * Actors and actresses have the 88-attribute sheet. Everyone else gets a skill model suited
 * to their actual job: a line producer is not a bad actor, they are a good
 * line producer, and the simulation should say so.
 */

export type SkillDomain =
  | 'writing' | 'directing' | 'producing' | 'executive' | 'crew'
  | 'business' | 'creator' | 'general' | 'athletics';

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
  // Writing
  s('story_structure', 'Story Structure', 'writing', 'Shaping a narrative that holds for two hours or ten episodes.'),
  s('dialogue', 'Dialogue', 'writing', 'Lines actors want to say and audiences want to hear.'),
  s('character_writing', 'Character Writing', 'writing', 'People on the page who behave like people.'),
  s('world_building', 'World Building', 'writing', 'Rules, texture and internal logic.'),
  s('rewriting', 'Rewriting', 'writing', 'Making a draft better under a deadline and a note.', 1.2),
  s('pitching', 'Pitching', 'writing', 'Selling the version of the story in your head.', 1.2),
  s('room_leadership', 'Room Leadership', 'writing', 'Running a writers room that produces usable pages.', 0.9),
  s('episode_breaking', 'Episode Breaking', 'writing', 'Turning a season arc into shootable episodes.'),
  s('adaptation', 'Adaptation', 'writing', 'Turning a book, article or format into a screenplay.'),
  s('page_speed', 'Page Speed', 'writing', 'How fast usable pages appear.', 1.3),

  // Directing
  s('visual_language', 'Visual Language', 'directing', 'Telling story with lens, frame and movement.', 0.9),
  s('actor_direction', 'Actor Direction', 'directing', 'Getting the performance you need without breaking the performer.'),
  s('coverage_planning', 'Coverage Planning', 'directing', 'Shooting what the edit will actually need.', 1.2),
  s('shot_efficiency', 'Shot Efficiency', 'directing', 'Making the day without losing the scene.', 1.2),
  s('tone_control', 'Tone Control', 'directing', 'Holding a consistent register across a whole film.', 0.9),
  s('set_authority', 'Set Authority', 'directing', 'Two hundred people believing you know what happens next.', 1.0),
  s('post_vision', 'Post Vision', 'directing', 'Seeing the finished film while looking at raw assembly.', 0.9),

  // Producing
  s('development_instinct', 'Development Instinct', 'producing', 'Knowing which script is worth three years of your life.', 0.8),
  s('packaging', 'Packaging', 'producing', 'Assembling talent into something a buyer wants.', 1.1),
  s('budgeting', 'Budgeting', 'producing', 'Numbers that survive contact with a schedule.', 1.3),
  s('scheduling', 'Scheduling', 'producing', 'A board that can actually be shot.', 1.3),
  s('crisis_management', 'Crisis Management', 'producing', 'The location fell through at 4 AM. Solve it.', 1.1),
  s('vendor_management', 'Vendor Management', 'producing', 'Getting good work out of suppliers at agreed prices.', 1.2),
  s('post_supervision', 'Post Supervision', 'producing', 'Driving a hundred deliverables to a locked date.', 1.2),
  s('financing', 'Financing', 'producing', 'Assembling money from people who want it back.', 1.0),

  // Executive / business affairs
  s('slate_strategy', 'Slate Strategy', 'executive', 'Building a portfolio rather than betting on one film.', 0.9),
  s('market_reading', 'Market Reading', 'executive', 'Knowing what an audience will want in two years.', 0.8),
  s('negotiation', 'Negotiation', 'executive', 'Getting terms without losing the relationship.', 1.1),
  s('deal_structuring', 'Deal Structuring', 'executive', 'Backend, bonuses, options and who owns what.', 1.0),
  s('rights_management', 'Rights Management', 'executive', 'Chain of title that survives a lawyer reading it.', 1.2),
  s('distribution_strategy', 'Distribution Strategy', 'executive', 'Windows, territories and release dates.', 1.0),
  s('marketing_strategy', 'Marketing Strategy', 'executive', 'Turning a film into a thing people plan to see.', 1.0),
  s('talent_relations', 'Talent Relations', 'executive', 'Being the person talent calls first.', 1.0),
  s('corporate_finance', 'Corporate Finance', 'executive', 'Running a company that does not run out of money.', 1.0),

  // Crew
  s('cinematography', 'Cinematography', 'crew', 'Light, lens and exposure in service of story.', 0.9),
  s('camera_operation', 'Camera Operation', 'crew', 'Executing a move cleanly, every take.', 1.2),
  s('production_design', 'Production Design', 'crew', 'Worlds built to be photographed.', 0.9),
  s('costume_design', 'Costume Design', 'crew', 'Character told through clothing.', 1.0),
  s('hair_makeup', 'Hair & Makeup', 'crew', 'Continuity, transformation and speed at 5 AM.', 1.1),
  s('editing', 'Editing', 'crew', 'Finding the film inside the footage.', 1.0),
  s('sound_craft', 'Sound Craft', 'crew', 'Dialogue, design and a mix that carries the film.', 1.1),
  s('vfx_craft', 'Visual Effects', 'crew', 'Shots that do not exist, made to look inevitable.', 1.0),
  s('scoring', 'Scoring', 'crew', 'Music that tells the audience how to feel without saying so.', 0.9),
  s('grip_electric', 'Grip & Electric', 'crew', 'Rigging, safety and getting light where it must go.', 1.2),
  s('stunt_coordination', 'Stunt Coordination', 'crew', 'Dangerous work that nobody gets hurt doing.', 1.0),
  s('script_supervision', 'Script Supervision', 'crew', 'Continuity, coverage and the notes post will live on.', 1.2),

  // Business / general life
  s('leadership', 'Leadership', 'business', 'People doing good work because of you, not despite you.', 1.0),
  s('operations', 'Operations', 'business', 'The machine running without heroics.', 1.2),
  s('sales', 'Sales', 'business', 'Persuading someone to say yes and sign.', 1.2),
  s('accounting', 'Accounting', 'business', 'Books that reconcile and taxes that are filed.', 1.3),
  s('hiring', 'Hiring', 'business', 'Choosing correctly, which is mostly about listening.', 1.1),
  // Life, which is a longer list than a career is. Everything here is
  // something a person actually gets better at, and every one of them has a
  // way to build it somewhere in the game: a class, a club, a job, an hour on
  // a Saturday, or simply doing it enough times that it stops being hard.
  s('public_speaking', 'Public Speaking', 'general', 'Holding a room.', 1.2),
  s('cooking', 'Cooking', 'general', 'Food that is better and cheaper than takeout.', 1.4),
  s('driving', 'Driving', 'general', 'Competence, and the insurance discount that comes with it.', 1.2),
  s('fitness', 'Fitness', 'general', 'Physical capacity that other systems draw on.', 1.4),
  s('languages', 'Languages', 'general', 'Working in more than one.', 1.0),
  s('personal_finance', 'Personal Finance', 'general', 'Not being talked into things.', 1.2),
  s('swimming', 'Swimming', 'general', 'The one physical skill that is genuinely a safety issue.', 1.3),
  s('first_aid', 'First Aid', 'general', 'Knowing what to do in the four minutes before anybody else arrives.', 1.4),
  s('self_defense', 'Self Defense', 'general', 'Not freezing, which is most of it.', 1.1),
  s('typing', 'Typing', 'general', 'Getting words down as fast as you think them.', 1.5),
  s('computer_literacy', 'Computer Literacy', 'general', 'The machine doing what you meant rather than what you clicked.', 1.4),
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
  s('research', 'Research', 'general', 'Finding out, and knowing when what you found is not good enough.', 1.2),
  s('correspondence', 'Correspondence', 'general', 'An email, a letter, a message that gets the answer you wanted.', 1.3),
  s('listening', 'Listening', 'general', 'Hearing what was said rather than waiting to talk.', 1.0),
  s('empathy', 'Empathy', 'general', 'Understanding somebody who is not you, which is also the job.', 0.9),
  s('conflict_resolution', 'Conflict Resolution', 'general', 'Getting two people out of a room still speaking.', 1.0),
  s('etiquette', 'Etiquette', 'general', 'Knowing which room you are in and behaving like it.', 1.2),
  s('small_talk', 'Small Talk', 'general', 'The first four minutes, which decide the rest.', 1.2),
  s('networking', 'Networking', 'general', 'Knowing people, and being somebody they are glad to know.', 1.1),
  s('dancing', 'Dancing', 'general', 'Moving in time, on purpose, in front of people.', 1.2),
  s('musical_instrument', 'A Musical Instrument', 'general', 'One instrument played properly rather than four played badly.', 1.0),
  s('drawing', 'Drawing', 'general', 'Seeing what is there rather than what you think is there.', 1.1),
  s('photography', 'Photography', 'general', 'Light, frame and the moment, which is three separate problems.', 1.2),
  s('nutrition', 'Nutrition', 'general', 'What food actually does, past what the packet says.', 1.3),
  s('sleep_hygiene', 'Sleep Hygiene', 'general', 'Going to bed on purpose, which changes everything else.', 1.4),
  s('mindfulness', 'Mindfulness', 'general', 'Sitting with it rather than running from it.', 1.1),
  s('resilience', 'Resilience', 'general', 'Getting up the next morning after the worst version of the day.', 0.9),
  s('navigation', 'Navigation', 'general', 'Knowing where you are without being told.', 1.3),
  s('bargaining', 'Bargaining', 'general', 'Paying what a thing is worth rather than what is on the label.', 1.2),
  s('childcare', 'Childcare', 'general', 'Keeping a small person alive, fed and reasonably happy.', 1.2),
  s('pet_care', 'Pet Care', 'general', 'An animal that is well, because of things you did.', 1.4),
  s('cycling', 'Cycling', 'general', 'A bike as transport rather than as a hobby.', 1.4),
  s('chess', 'Chess', 'general', 'Thinking three moves ahead, which turns out to generalise.', 1.1),
  s('cards', 'Card Games', 'general', 'Odds, faces, and knowing when somebody is lying.', 1.2),
  s('wine', 'Wine', 'general', 'Ordering for a table without guessing.', 1.2),
  s('bartending', 'Bartending', 'general', 'Twenty drinks made properly and one conversation held at the same time.', 1.3),
  s('handwriting', 'Handwriting', 'general', 'Something legible, signed, that means what it says.', 1.4),
  s('editing_software', 'Editing Software', 'creator', 'Cutting your own content well and fast.', 1.3),
  s('content_strategy', 'Content Strategy', 'creator', 'Knowing what to make next and why.', 1.2),
  s('on_camera_hosting', 'On-Camera Hosting', 'creator', 'Being watchable talking directly to a lens.', 1.1),
  s('audience_growth', 'Audience Growth', 'creator', 'Turning views into a following that stays.', 1.1),

  // Track. A sprinter is not one thing: getting out of the blocks, reaching
  // top speed and holding it to the line are three different problems, and a
  // runner can be brilliant at one and lose the race in another.
  s('block_start', 'Block Start', 'athletics', 'Set, and the first movement out of the blocks.', 1.1),
  s('reaction_time', 'Reaction Time', 'athletics', 'Gun to first movement, and it is measured in thousandths.', 0.8),
  s('drive_phase', 'Drive Phase', 'athletics', 'The first thirty meters, still low, still building.', 1.1),
  s('acceleration', 'Acceleration', 'athletics', 'How fast you get to your own top speed.', 1.0),
  s('top_speed', 'Top Speed', 'athletics', 'The fastest you can travel, which decides most of a hundred.', 0.7),
  s('speed_endurance', 'Speed Endurance', 'athletics', 'Holding it through the last forty, where the race is lost.', 1.2),
  s('running_relaxation', 'Running Relaxation', 'athletics', 'Staying loose at full speed, because tension is slow.', 1.1),
  s('sprint_mechanics', 'Sprint Mechanics', 'athletics', 'Where the foot lands, what the arms do, and how little is wasted.', 1.2),
  s('curve_running', 'Curve Running', 'athletics', 'The bend, which is most of a two hundred and all of a lane draw.', 1.1),
  s('hurdle_technique', 'Hurdle Technique', 'athletics', 'Three strides, a lead leg, and not losing speed over the barrier.', 1.2),
  s('baton_exchange', 'Baton Exchange', 'athletics', 'The twenty meter zone where relays are won and thrown away.', 1.3),
  s('race_tactics', 'Race Tactics', 'athletics', 'The plan, the lane, the rounds, and reading the race you are in.', 1.2),
  s('finishing', 'Finishing', 'athletics', 'The last ten meters and the dip, which is worth hundredths.', 1.1),
  s('training_discipline', 'Training Discipline', 'athletics', 'The winter work nobody sees, which is where a season is made.', 1.3),
  s('athletic_recovery', 'Recovery', 'athletics', 'Getting back on the track sound, and staying that way.', 1.2),
  s('competitive_nerve', 'Competitive Nerve', 'athletics', 'Running your race in a full stadium, in a final, on the day.', 1.0),
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
