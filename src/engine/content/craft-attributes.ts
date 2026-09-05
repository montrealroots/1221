/**
 * SLATE — What each job in the industry is actually rated on.
 *
 * The player's 88 attributes are an actor's attributes, because the player
 * starts as one. Everybody else in the industry does a different job, and a
 * director is not a good actor with different numbers: the things a director
 * is good or bad at are a different list. So each craft gets its own sheet,
 * written from what the job consists of.
 *
 * These are ratings out of 100. Every one of them is SLATE's own reading of a
 * body of work — they are not published figures, nobody has scored these
 * people, and the interface says so wherever it shows them.
 */

/** The jobs a person in the industry can be rated at. */
export type CraftRole = 'actor' | 'director' | 'producer' | 'showrunner' | 'cinematographer' | 'composer';

export const CRAFT_ROLES: readonly CraftRole[] = ['actor', 'director', 'producer', 'showrunner', 'cinematographer', 'composer'];

export const CRAFT_ROLE_LABEL: Readonly<Record<CraftRole, string>> = {
  actor: 'Actor', director: 'Director', producer: 'Producer',
  showrunner: 'Showrunner', cinematographer: 'Cinematographer', composer: 'Composer',
};

export const CRAFT_ROLE_PLURAL: Readonly<Record<CraftRole, string>> = {
  actor: 'Actors', director: 'Directors', producer: 'Producers',
  showrunner: 'Showrunners', cinematographer: 'Cinematographers', composer: 'Composers',
};

export interface CraftAttributeDef {
  id: string;
  name: string;
  /** Which sheet it belongs to. */
  role: CraftRole;
  /** A heading inside that sheet. */
  group: string;
  description: string;
}

function a(role: CraftRole, group: string, id: string, name: string, description: string): CraftAttributeDef {
  return { id: `${role}.${id}`, name, role, group, description };
}

// ---------------------------------------------------------------------------
// Director
// ---------------------------------------------------------------------------

const DIRECTOR: CraftAttributeDef[] = [
  a('director', 'Vision', 'visual_authorship', 'Visual Authorship', 'Whether the frames could only have come from this person.'),
  a('director', 'Vision', 'tonal_control', 'Tonal Control', 'Holding one tone across a whole picture, or changing it on purpose.'),
  a('director', 'Vision', 'world_building', 'World Building', 'Making a place feel lived in beyond the edges of the frame.'),
  a('director', 'Vision', 'thematic_spine', 'Thematic Spine', 'Whether the film is about something and stays about it.'),
  a('director', 'Vision', 'risk_appetite', 'Risk Appetite', 'How far they will go from the safe version of the material.'),
  a('director', 'Storytelling', 'script_sense', 'Script Sense', 'Knowing what is wrong with a screenplay and what to do about it.'),
  a('director', 'Storytelling', 'staging', 'Staging And Blocking', 'Where people stand, where the camera is, and why.'),
  a('director', 'Storytelling', 'coverage', 'Coverage Discipline', 'Shooting enough to cut it, and not so much that nothing is chosen.'),
  a('director', 'Storytelling', 'pace', 'Pace', 'How the picture moves: where it lingers and where it gets on with it.'),
  a('director', 'Storytelling', 'editing_instinct', 'Editing Instinct', 'Seeing the finished cut while still shooting it.'),
  a('director', 'Storytelling', 'set_pieces', 'Set Pieces', 'Building a sequence that people leave the cinema talking about.'),
  a('director', 'Storytelling', 'action_staging', 'Action Staging', 'Geography, stakes and legibility when things are moving fast.'),
  a('director', 'Storytelling', 'intimacy', 'Intimacy', 'Handling closeness — physical or emotional — without flinching or leering.'),
  a('director', 'People', 'actor_direction', 'Direction Of Actors', 'Getting a performance out of somebody that they did not know they had.'),
  a('director', 'People', 'casting_eye', 'Casting Eye', 'Seeing who a part belongs to before anybody else does.'),
  a('director', 'People', 'crew_leadership', 'Crew Leadership', 'A set that runs, and a crew that would come back.'),
  a('director', 'People', 'collaboration', 'Collaboration', 'Working with a cinematographer, an editor and a composer rather than at them.'),
  a('director', 'People', 'set_temperament', 'Temperament', 'What happens on the bad day, which is the day everybody remembers.'),
  a('director', 'Production', 'scale_command', 'Command Of Scale', 'Running a unit of four hundred people without losing the film.'),
  a('director', 'Production', 'budget_discipline', 'Budget Discipline', 'Bringing it in for what it was supposed to cost.'),
  a('director', 'Production', 'schedule_discipline', 'Schedule Discipline', 'Making the day, every day, for the whole shoot.'),
  a('director', 'Production', 'resourcefulness', 'Resourcefulness', 'What they can do with a fraction of what they asked for.'),
  a('director', 'Standing', 'studio_trust', 'Studio Trust', 'Whether the money believes the film will exist and be good.'),
  a('director', 'Standing', 'festival_standing', 'Festival Standing', 'How a premiere is received by the people who decide what is serious.'),
  a('director', 'Standing', 'audience_reach', 'Audience Reach', 'Whether the general public turns up for their name.'),
];

// ---------------------------------------------------------------------------
// Producer
// ---------------------------------------------------------------------------

const PRODUCER: CraftAttributeDef[] = [
  a('producer', 'Development', 'material_taste', 'Taste In Material', 'Reading a script and knowing whether it is worth five years.'),
  a('producer', 'Development', 'ip_acquisition', 'Rights And IP', 'Finding the book, the article or the format before the market does.'),
  a('producer', 'Development', 'development_patience', 'Development Patience', 'Letting a thing take the time it needs instead of shooting the third draft.'),
  a('producer', 'Development', 'packaging', 'Packaging', 'Putting a director, a cast and a piece of material together so it becomes real.'),
  a('producer', 'Money', 'financing', 'Financing', 'Where the money comes from and what it costs.'),
  a('producer', 'Money', 'budget_control', 'Budget Control', 'Keeping the number honest from the first estimate to the last invoice.'),
  a('producer', 'Money', 'deal_making', 'Deal-Making', 'The terms, and who has them.'),
  a('producer', 'Money', 'incentives', 'Incentives And Territories', 'Where it shoots, and what that is worth.'),
  a('producer', 'Money', 'risk_management', 'Risk Management', 'Insurance, contingency, and what happens when the lead breaks an ankle.'),
  a('producer', 'Running It', 'physical_production', 'Physical Production', 'Crews, stages, permits, and a schedule that survives contact.'),
  a('producer', 'Running It', 'post_oversight', 'Post Oversight', 'Keeping a cut moving without taking the film off its director.'),
  a('producer', 'Running It', 'crisis_handling', 'Crisis Handling', 'The week everything goes wrong, and whether it stays wrong.'),
  a('producer', 'Running It', 'schedule_command', 'Schedule Command', 'A hundred and ten days planned and a hundred and ten days delivered.'),
  a('producer', 'Relationships', 'talent_relations', 'Talent Relations', 'Whether the people who worked for them once will do it again.'),
  a('producer', 'Relationships', 'studio_relations', 'Studio Relations', 'Getting the meeting, and getting the yes.'),
  a('producer', 'Relationships', 'agency_relations', 'Agency Relations', 'Being sent the material first.'),
  a('producer', 'Relationships', 'political_capital', 'Political Capital', 'What they can spend when they need something impossible.'),
  a('producer', 'Market', 'marketing_sense', 'Marketing Sense', 'Knowing what the picture is and who it is for before the trailer is cut.'),
  a('producer', 'Market', 'release_strategy', 'Release Strategy', 'A date, a footprint and a platform that suit the film they made.'),
  a('producer', 'Market', 'awards_campaigning', 'Awards Campaigning', 'Running a season without the campaign becoming the story.'),
  a('producer', 'Market', 'franchise_stewardship', 'Franchise Stewardship', 'Keeping something alive across a decade without wearing it out.'),
  a('producer', 'Market', 'slate_breadth', 'Slate Breadth', 'How wide a range of things they can credibly make.'),
];

// ---------------------------------------------------------------------------
// Showrunner
// ---------------------------------------------------------------------------

const SHOWRUNNER: CraftAttributeDef[] = [
  a('showrunner', 'The Show', 'premise_engine', 'Premise Engine', 'Whether the idea generates a hundred episodes or runs out in six.'),
  a('showrunner', 'The Show', 'season_architecture', 'Season Architecture', 'The shape of a year: where it turns and where it lands.'),
  a('showrunner', 'The Show', 'episode_structure', 'Episode Structure', 'Forty-two minutes that are satisfying on their own.'),
  a('showrunner', 'The Show', 'serial_momentum', 'Serial Momentum', 'The reason to press play on the next one.'),
  a('showrunner', 'The Show', 'finale_landing', 'Finale Landing', 'Sticking the ending, which is where most shows are finally judged.'),
  a('showrunner', 'The Show', 'tone_consistency', 'Tone Consistency', 'Twelve directors and one show.'),
  a('showrunner', 'Writing', 'character_voice', 'Character Voice', 'Everybody sounding like themselves and nobody sounding like the writer.'),
  a('showrunner', 'Writing', 'dialogue', 'Dialogue', 'Lines that people quote at each other for years.'),
  a('showrunner', 'Writing', 'world_consistency', 'World Consistency', 'Rules that hold up in season four.'),
  a('showrunner', 'Writing', 'ensemble_balance', 'Ensemble Balance', 'Nine regulars and nobody wasted.'),
  a('showrunner', 'Writing', 'rewrite_speed', 'Rewrite Speed', 'Pages by the morning, and good ones.'),
  a('showrunner', 'The Room', 'room_leadership', 'Room Leadership', 'A writers room that argues productively and finishes on time.'),
  a('showrunner', 'The Room', 'staffing', 'Staffing', 'Hiring people who are better than the room needs and keeping them.'),
  a('showrunner', 'The Room', 'delegation', 'Delegation', 'Letting go of an episode without losing the show.'),
  a('showrunner', 'The Room', 'mentorship', 'Mentorship', 'Whether the people who came up in their room went on to run their own.'),
  a('showrunner', 'Running It', 'production_command', 'Production Command', 'Eight units, one schedule, and the network calling.'),
  a('showrunner', 'Running It', 'budget_per_episode', 'Budget Per Episode', 'Spending the money where the audience can see it.'),
  a('showrunner', 'Running It', 'casting', 'Casting', 'Finding the person who becomes the character for a decade.'),
  a('showrunner', 'Running It', 'network_relations', 'Network Relations', 'Keeping a buyer confident without letting them write it.'),
  a('showrunner', 'Standing', 'renewal_record', 'Renewal Record', 'How often the shows come back.'),
  a('showrunner', 'Standing', 'critical_standing', 'Critical Standing', 'What the people who watch everything think of it.'),
  a('showrunner', 'Standing', 'audience_pull', 'Audience Pull', 'How many people actually watch.'),
];

// ---------------------------------------------------------------------------
// Cinematographer
// ---------------------------------------------------------------------------

const CINEMATOGRAPHER: CraftAttributeDef[] = [
  a('cinematographer', 'Light', 'lighting_design', 'Lighting Design', 'Building a scene out of where the light comes from.'),
  a('cinematographer', 'Light', 'natural_light', 'Natural Light', 'Working with the sun and the weather rather than against them.'),
  a('cinematographer', 'Light', 'night_work', 'Night Work', 'Exposure after dark that reads as dark and still reads.'),
  a('cinematographer', 'Light', 'contrast_control', 'Contrast Control', 'How much is allowed to fall away into black.'),
  a('cinematographer', 'Light', 'skin_tone', 'Skin Tone', 'Lighting every face in the cast as well as the best-lit one.'),
  a('cinematographer', 'Frame', 'composition', 'Composition', 'Where the edges are and what that does to the person inside them.'),
  a('cinematographer', 'Frame', 'lens_choice', 'Lens Language', 'What the choice of glass says before anybody speaks.'),
  a('cinematographer', 'Frame', 'camera_movement', 'Camera Movement', 'Motion that means something rather than motion that is available.'),
  a('cinematographer', 'Frame', 'handheld', 'Handheld', 'Operating close in without turning the scene into weather.'),
  a('cinematographer', 'Frame', 'long_take', 'Long Takes', 'Sustaining a shot that has nowhere to hide.'),
  a('cinematographer', 'Frame', 'coverage_speed', 'Coverage Speed', 'How many setups the day actually gets.'),
  a('cinematographer', 'Colour', 'palette', 'Palette', 'The colour the film is, decided rather than arrived at.'),
  a('cinematographer', 'Colour', 'grade_control', 'Grade Control', 'What survives the last week in the suite.'),
  a('cinematographer', 'Colour', 'format_command', 'Format Command', 'Film, digital, large format, anamorphic — and knowing which and why.'),
  a('cinematographer', 'Craft', 'vfx_integration', 'VFX Integration', 'Plates that the effects can actually be built on.'),
  a('cinematographer', 'Craft', 'action_photography', 'Action Photography', 'Legible geography at speed.'),
  a('cinematographer', 'Craft', 'landscape', 'Landscape', 'Making a place the reason to see it on a big screen.'),
  a('cinematographer', 'Craft', 'intimate_photography', 'Intimate Photography', 'A camera close to a face that the actor forgets is there.'),
  a('cinematographer', 'Working', 'director_partnership', 'Partnership', 'Whether directors bring them back.'),
  a('cinematographer', 'Working', 'crew_command', 'Crew Command', 'Running a camera and lighting department that stays ahead of the day.'),
  a('cinematographer', 'Working', 'resourcefulness', 'Resourcefulness', 'What the images look like when there is no money.'),
];

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

const COMPOSER: CraftAttributeDef[] = [
  a('composer', 'Writing', 'thematic_writing', 'Thematic Writing', 'A tune that means the character for the rest of your life.'),
  a('composer', 'Writing', 'harmonic_language', 'Harmonic Language', 'The particular way the chords move that makes it theirs.'),
  a('composer', 'Writing', 'melodic_memory', 'Melodic Memory', 'Whether anybody can hum it afterwards.'),
  a('composer', 'Writing', 'development', 'Development', 'Taking one idea across two hours without repeating it.'),
  a('composer', 'Writing', 'restraint', 'Restraint', 'Knowing which scenes need no music at all.'),
  a('composer', 'Sound', 'orchestration', 'Orchestration', 'What plays what, and how it sits.'),
  a('composer', 'Sound', 'texture', 'Texture', 'The sound of the thing, apart from the notes in it.'),
  a('composer', 'Sound', 'electronic', 'Electronic Writing', 'Synthesis as an instrument rather than as a colour.'),
  a('composer', 'Sound', 'orchestral', 'Orchestral Writing', 'Eighty players in a room and a reason for each of them.'),
  a('composer', 'Sound', 'hybrid', 'Hybrid Scoring', 'Where the orchestra stops and the machine starts, seamlessly.'),
  a('composer', 'Sound', 'vocal_writing', 'Vocal Writing', 'Choir and solo voice, without it becoming a trailer.'),
  a('composer', 'Sound', 'source_music', 'Source And Diegetic', 'Music that is in the room rather than over it.'),
  a('composer', 'Drama', 'tension', 'Tension', 'Making an audience uneasy without telling them to be.'),
  a('composer', 'Drama', 'emotion', 'Emotion', 'Earning the feeling instead of asking for it.'),
  a('composer', 'Drama', 'propulsion', 'Propulsion', 'Momentum: the reason a chase feels fast.'),
  a('composer', 'Drama', 'spotting', 'Spotting', 'Where the music starts and stops, which is most of the job.'),
  a('composer', 'Working', 'speed', 'Speed', 'Ninety minutes of score in six weeks, delivered.'),
  a('composer', 'Working', 'temp_resistance', 'Temp Resistance', 'Writing the score the film needs, not the one already in the cut.'),
  a('composer', 'Working', 'adaptability', 'Adaptability', 'Sounding like the film rather than like themselves every time.'),
  a('composer', 'Working', 'director_partnership', 'Partnership', 'Whether directors keep coming back.'),
  a('composer', 'Standing', 'signature', 'Signature', 'Being recognisable in four bars.'),
  a('composer', 'Standing', 'critical_standing', 'Critical Standing', 'What the score is thought of on its own.'),
];

export const CRAFT_ATTRIBUTES: readonly CraftAttributeDef[] = [
  ...DIRECTOR, ...PRODUCER, ...SHOWRUNNER, ...CINEMATOGRAPHER, ...COMPOSER,
];

export const CRAFT_ATTRIBUTE_BY_ID: Readonly<Record<string, CraftAttributeDef>> =
  Object.fromEntries(CRAFT_ATTRIBUTES.map((def) => [def.id, def]));

/** The sheet for one job, in the order it should be shown. */
export function attributesForRole(role: CraftRole): CraftAttributeDef[] {
  return CRAFT_ATTRIBUTES.filter((def) => def.role === role);
}

/** The headings inside one job's sheet, in order. */
export function groupsForRole(role: CraftRole): string[] {
  const seen: string[] = [];
  for (const def of attributesForRole(role)) if (!seen.includes(def.group)) seen.push(def.group);
  return seen;
}

/** How many attributes each job is rated on. The actor's sheet is the player's 88. */
export function sheetSize(role: CraftRole): number {
  return role === 'actor' ? 88 : attributesForRole(role).length;
}
