/**
 * SLATE — Performer attributes and traits.
 *
 * Every acting skill there is, and every acting trait, both in alphabetical
 * order. Skills are 0-100 rated capabilities; traits are qualitative and are
 * either held or not.
 *
 * Alphabetical rather than grouped, because the list is long enough that
 * finding a name matters more than reading it as a syllabus. Each skill still
 * carries the group it belongs to — Craft, Voice, Physical, Screen, Stage,
 * Range, Comedy, Musical, Specialty, Professionalism, Industry, Tradition —
 * for anything that wants to average or filter by one.
 *
 * These belong to *performing*, and to nothing else. There was a second sheet
 * for ordinary life skills once; it held the prodigy at a hundred and everybody
 * else at five, moved for nobody, and was read by nothing, so it went.
 *
 * The player holds all of it at once, and a mastery of every genre on top —
 * see `ALL_TRAITS` and `content/genre-mastery.ts`.
 */

import { GENRE_MASTERIES } from '../content/genre-mastery';

export type AttributeGroup =
  | 'Craft' | 'Voice' | 'Physical' | 'Screen' | 'Stage' | 'Range'
  | 'Comedy' | 'Musical' | 'Specialty' | 'Professionalism' | 'Industry' | 'Tradition';

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
  attr('abhinaya_storytelling', 'Abhinaya Storytelling', 'Tradition', 'A story told through face, hands and eyes, while the music carries the words.', 0.9),
  attr('absorbing_notes', 'Absorbing Notes', 'Stage', 'A director’s note after a show, and it’s in the performance the next night.', 1.1),
  attr('accent_acquisition', 'Accent Acquisition', 'Voice', 'A new accent, off a recording or a coach, holding all the way through a full scene.'),
  attr('accent_neutralization', 'Accent Neutralization', 'Range', 'Your own accent set aside, so it stops surfacing in unguarded moments.', 1.2, true),
  attr('accent_retention', 'Accent Retention', 'Voice', 'An accent that survives months of shooting without drifting.', 0.9, true),
  attr('accent_under_improvisation', 'Accent Under Improvisation', 'Voice', 'Staying in the accent while improvising, laughing, crying or being thrown a new line.'),
  attr('accent_under_pressure', 'Accent Under Pressure', 'Range', 'An accent that holds through shouting, crying, laughing and improvised lines.', 1.1, true),
  attr('acceptance_speech', 'Acceptance Speech', 'Industry', 'The thanks, the joke and the point, all of it out before the music starts.', 0.9),
  attr('acrobatics_and_tumbling', 'Acrobatics And Tumbling', 'Physical', 'Rolls, cartwheels, handstands and flips landed safely on a stage floor.', 1, true),
  attr('act_outs', 'Act Outs', 'Comedy', 'Straight into the voice and body of other people, right in the middle of a standup bit.', 1.2, true),
  attr('acting_through_prosthetics', 'Acting Through Prosthetics', 'Specialty', 'Expression pushed out through silicone and latex, so the face still reads under the piece.', 1.1),
  attr('actioning', 'Actioning', 'Craft', 'Every line gets an active verb: what you’re doing to the other person by saying it.', 1.4),
  attr('active_analysis', 'Active Analysis', 'Tradition', 'You read a scene, improvise it on your feet to find its events, then go back to the text.', 1.3),
  attr('active_listening', 'Active Listening', 'Craft', 'You react to a scene partner as it happens, and you never wait for a cue.', 1.1),
  attr('adaptability', 'Adaptability', 'Professionalism', 'The location fell through and the scene changed. Now what?', 1.1),
  attr('adaptation', 'Adaptation', 'Craft', 'You switch tactics mid-scene, the moment the one you had stops working on your partner.', 1, true),
  attr('adr', 'ADR & Looping', 'Voice', 'A recorded line matched to picture in a booth, months after the day.', 1.3),
  attr('adr_and_looping', 'ADR And Looping', 'Voice', 'Matching a recorded line to your own lip movements on screen, take after take.', 1.2),
  attr('adr_to_picture', 'ADR To Picture', 'Voice', 'A filmed line replaced so it drops back into the picture with no seam.', 1.3, true),
  attr('aerial_work', 'Aerial Work', 'Specialty', 'Silks, rope, trapeze or a harness, performed at height with your own weight held.', 1, true),
  attr('affective_memory', 'Affective Memory', 'Tradition', 'You work back through the sensory detail of a remembered event until the feeling comes with it.', 0.8, true),
  attr('age_range_playing', 'Age Range Playing', 'Range', 'You know the band of ages you can be cast in, and you read true anywhere inside it.'),
  attr('agent_relationship', 'Agent Relationship', 'Industry', 'Briefing your agent on the work you want and keeping them moving without pestering them.', 1.1),
  attr('aging_across_a_role', 'Aging Across A Role', 'Range', 'One character through decades of a single story, each stage following from the last.', 0.9),
  attr('alexander_technique', 'Alexander Technique', 'Physical', 'You notice habitual tension in the neck and back, and let it go before it shapes the work.', 1, true),
  attr('alienation_effect_playing', 'Alienation Effect Playing', 'Tradition', 'You show the character instead of merging with them, so the audience sees the choice being made.'),
  attr('alt_line_generation', 'Alt Line Generation', 'Comedy', 'Different versions of a joke on the later takes, so the edit has choices.', 1.1),
  attr('alt_takes', 'Alt Takes', 'Voice', 'Three genuinely different readings of the same line without being asked twice.', 1.1),
  attr('animal_handling_on_set', 'Animal Handling On Set', 'Specialty', 'You lead, hold and cue a trained animal in frame, and the shot never breaks.', 1.1, true),
  attr('animal_study', 'Animal Study', 'Physical', 'You watch an animal, then pull its rhythm and its spine into a human character.', 1.2),
  attr('animal_work', 'Animal Work', 'Craft', 'You study an animal, then carry its rhythm, focus and physicality into a human being.', 1.1, true),
  attr('animation_energy', 'Animation Energy', 'Voice', 'The size of a drawn face, without tipping over into shouting.', 1.1),
  attr('animatronic_head_operation', 'Animatronic Head Operation', 'Specialty', 'Driving the cable or radio controls of a creature head while performing inside the suit.', 1.2, true),
  attr('antithesis', 'Antithesis', 'Craft', 'The opposed words in a line, set against each other as you speak them.', 1.3),
  attr('archery', 'Archery', 'Specialty', 'A bow drawn, held and released so it looks pulled, not posed.', 1.2, true),
  attr('archive_research', 'Archive Research', 'Range', 'Tape, letters and photographs, worked through until you know how a real person moved and spoke.', 1.3),
  attr('armor_and_heavy_costume', 'Armor And Heavy Costume', 'Physical', 'Free movement in mail, plate, a fur coat or full prosthetics, across a twelve-hour day.', 1.3),
  attr('articulation', 'Articulation', 'Voice', 'Lips, tongue and teeth, so every consonant lands clean at speed.', 1.3),
  attr('as_if', 'As If', 'Craft', 'You swap the scripted situation for a private one of your own with the same urgency in it.', 1.1),
  attr('asking_to_start_again', 'Asking To Start Again', 'Professionalism', 'You stop a fluffed take, reset and go again, and the room stays with you.', 1.2),
  attr('atmosphere_work', 'Atmosphere Work', 'Tradition', 'The air of a place, a hospital ward or a held breath, imagined until it acts on you.'),
  attr('atmospheric_smoke_tolerance', 'Atmospheric Smoke Tolerance', 'Specialty', 'Long days in haze and smoke, with no coughing or streaming eyes to ruin a take.', 1, true),
  attr('audience_interaction', 'Audience Interaction', 'Stage', 'Real people talked to from the stage, and then the play gets moving again.'),
  attr('audience_suggestion_handling', 'Audience Suggestion Handling', 'Comedy', 'A shouted suggestion becomes a first line the scene can actually use.', 1.2, true),
  attr('audio_description', 'Audio Description', 'Specialty', 'What’s on screen, said in the gaps, plainly and exactly on time.', 1.3),
  attr('audiobook_narration', 'Audiobook Narration', 'Voice', 'Hours of reading aloud at one level, one pace, one character.', 1.2),
  attr('audition_improvisation', 'Audition Improvisation', 'Craft', 'Improvising off the script when the room asks you to play, then getting back to the text.', 1, true),
  attr('audition_technique', 'Audition Technique', 'Industry', 'Your best work, in a small room, with nothing around it to help.', 1.3, true),
  attr('audition_wardrobe', 'Audition Wardrobe', 'Industry', 'Suggesting the character with clothes you already own, without turning up in costume.', 1.3),
  attr('auditioning_in_a_theater', 'Auditioning In A Theater', 'Stage', 'A read sized for an empty auditorium, with the panel sitting ten rows back.', 1.1),
  attr('awards_campaigning', 'Awards Campaigning', 'Industry', 'Running a season of screenings, lunches and voter events without looking like you want it.', 0.9),
  attr('backstory_invention', 'Backstory Invention', 'Craft', 'The gaps the writer left, filled in with interior history you can actually use.', 1.1),
  attr('ballet', 'Ballet', 'Musical', 'Turnout, line, port de bras and the vocabulary sitting under most stage dance.', 0.9, true),
  attr('ballet_technique', 'Ballet Technique', 'Physical', 'Turnout, placement and vocabulary of classical ballet from barre through center work.', 0.9, true),
  attr('ballroom_dance', 'Ballroom Dance', 'Musical', 'Waltz, foxtrot and tango, led or followed closely enough for a camera to sit on.', 1.2, true),
  attr('beat_breakdown', 'Beat Breakdown', 'Craft', 'Cutting a scene into units where the want changes, and marking exactly where each one turns.', 1.4),
  attr('beat_division', 'Beat Division', 'Craft', 'Finding the points where a scene changes direction and dividing the text there.', 1.2),
  attr('beijing_opera_singing', 'Beijing Opera Singing', 'Musical', 'Jingju in the high forward voice of your role type, on the percussion cues.', 0.8, true),
  attr('belting', 'Belting', 'Musical', 'Chest voice carried up into the high range, loud and ringing and sustained.', 1, true),
  attr('bharatanatyam_adavus', 'Bharatanatyam Adavus', 'Physical', 'The basic adavu steps in the half sit, with stamped rhythm and clean lines.', 1, true),
  attr('bit_building', 'Bit Building', 'Comedy', 'You start a riff with a partner and stack on it until the bit has a shape and an out.', 1, true),
  attr('blackout_navigation', 'Blackout Navigation', 'Stage', 'The right spot in a full blackout, with no sound and no collision.', 1.3),
  attr('blocking_retention', 'Blocking Retention', 'Stage', 'A fixed pattern of moves, positions and marks, repeated accurately every night.', 1.3),
  attr('blood_rig_performance', 'Blood Rig Performance', 'Specialty', 'Timing a bladder, tube or squib hit so the reaction lands exactly with the effect.', 1.2),
  attr('body_mic_discipline', 'Body Mic Discipline', 'Stage', 'A live radio mic taped to your head, and you know what it won’t forgive.', 1.4),
  attr('body_paint_endurance', 'Body Paint Endurance', 'Specialty', 'A whole day in full body paint, and you never pick at it or break the finish.', 1, true),
  attr('booth_ad_libs', 'Booth Ad Libs', 'Voice', 'You fill a gap with lines nobody wrote, and they sound written.'),
  attr('bouffon_playing', 'Bouffon Playing', 'Physical', 'The bouffon: you mock the audience from a padded grotesque body, and you enjoy it.', 0.8),
  attr('brand_endorsement_work', 'Brand Endorsement Work', 'Industry', 'You front the campaign to the brief, from the shoot days to the posts they expect afterward.', 1.2),
  attr('breath_control', 'Breath Control', 'Voice', 'Long lines and physical scenes, with no audible strain in them.', 1.3, true),
  attr('breath_hold_performance', 'Breath Hold Performance', 'Specialty', 'A long breath held underwater, and you stay relaxed enough to keep performing.', 0.9, true),
  attr('breath_support', 'Breath Support', 'Voice', 'Powering a line from the lower ribs and diaphragm so the sound rides on air and the throat stays out of it.', 1.1),
  attr('brechtian_song_delivery', 'Brechtian Song Delivery', 'Musical', 'You step out of the scene and deliver the song hard and plain, against the sense and not into it.'),
  attr('broad_comedy', 'Broad Comedy', 'Range', 'Big, physical, unembarrassed funny.', 0.9),
  attr('broadsword_work', 'Broadsword Work', 'Stage', 'Fighting with a heavy single or two-handed blade, controlled through every cut and parry.', 1.2, true),
  attr('bunraku_puppet_operation', 'Bunraku Puppet Operation', 'Specialty', 'Working a bunraku puppet with two other operators, breathing together so the figure moves as one.', 0.9, true),
  attr('butoh_fu_imagery', 'Butoh Fu Imagery', 'Tradition', 'Working from butoh fu word images until the body changes shape instead of miming what the words describe.', 0.8),
  attr('call_and_response_handling', 'Call And Response Handling', 'Stage', 'You set up a shout-back from the house, hold it, and cut it off to get on.', 1.1),
  attr('call_sheet_literacy', 'Call Sheet Literacy', 'Professionalism', 'A call sheet read for your call time, your scenes, the location and who else is working.', 1.5),
  attr('call_time_punctuality', 'Call Time Punctuality', 'Professionalism', 'At call time, prepared, on the right pages, and nobody had to ring you about it.', 1.2),
  attr('callbacks', 'Callbacks', 'Comedy', 'An earlier joke comes back later in the show and pays off a second time.', 1.2),
  attr('camera_awareness', 'Camera Awareness', 'Screen', 'You know the lens, the size, and exactly what it’s seeing.', 1.2),
  attr('canovaccio_improvisation', 'Canovaccio Improvisation', 'Tradition', 'A full scene improvised off an outline that gives only entrances, plot beats and exits.'),
  attr('career_strategy', 'Career Strategy', 'Industry', 'You take the next job for where it leads, not for what it pays.'),
  attr('carrying_a_lead', 'Carrying A Lead', 'Range', 'Almost every scene of a long shoot, and you’re as good in the last week as the first.', 0.9, true),
  attr('cartoon_takes', 'Cartoon Takes', 'Comedy', 'The gasp, the yelp, the double take and the spit take landing in a quarter of a second.'),
  attr('casting_director_relations', 'Casting Director Relations', 'Industry', 'Building a working history with casting offices so they bring you in for the next one.', 1.1, true),
  attr('casting_profile_upkeep', 'Casting Profile Upkeep', 'Industry', 'Photos, clips, credits and contact details, current on every casting site.', 1.5),
  attr('changing_representation', 'Changing Representation', 'Industry', 'Leaving an agent or manager cleanly, without a burned bridge or a stalled year.', 0.9),
  attr('character_actor_work', 'Character Actor Work', 'Range', 'You turn up a different person job after job, and never repeat a persona.', 0.9),
  attr('character_arc_mapping', 'Character Arc Mapping', 'Craft', 'Where a character starts, what changes them, and where the script leaves them.', 1.2),
  attr('character_construction', 'Character Construction', 'Craft', 'A coherent person, built from the page up.'),
  attr('character_mask_work', 'Character Mask Work', 'Physical', 'The walk, tempo and appetite a half or full mask asks for, taken on whole.', 1.1),
  attr('character_singing', 'Character Singing', 'Musical', 'A character voice, in tune, to a click or a guide track.', 0.9),
  attr('character_speech_impediments', 'Character Speech Impediments', 'Specialty', 'A stammer, lisp or slur, played consistently and never once mocked.', 1.1),
  attr('character_tracking_in_narration', 'Character Tracking In Narration', 'Voice', 'Thirty voices kept straight across a book recorded over two weeks.'),
  attr('character_voice_creation', 'Character Voice Creation', 'Range', 'A voice built from a character description, and found again weeks later.', 0.9),
  attr('character_voices', 'Character Voices', 'Specialty', 'You build a voice that isn’t your own, hold it, and find it again cold on day two.', 0.9),
  attr('character_walk', 'Character Walk', 'Physical', 'A walk that belongs to another person, and it holds for two hours.', 1.1),
  attr('charisma', 'Charisma', 'Screen', 'The thing that makes an audience choose to watch you.', 0.5),
  attr('cheating_out', 'Cheating Out', 'Stage', 'The body opens toward the house while the scene goes to whoever is beside you.', 1.4),
  attr('cheating_to_camera', 'Cheating To Camera', 'Screen', 'Your body opens to the lens on a note, so a position that feels wrong reads right.', 1.2),
  attr('chemistry', 'Chemistry', 'Range', 'A believable bond with a scene partner, out of nothing at all.', 0.6),
  attr('chemistry_read', 'Chemistry Read', 'Craft', 'You and a stranger from the hallway, looking like you go back years.', 0.9),
  attr('chemistry_read_boundaries', 'Chemistry Read Boundaries', 'Professionalism', 'What touch is on the table, agreed with a stranger before a romantic or violent read.', 1.1),
  attr('chemistry_reads', 'Chemistry Reads', 'Industry', 'A spark with a stranger, on demand.'),
  attr('child_welfare_protocol', 'Child Welfare Protocol', 'Professionalism', 'The hours, the chaperone and the content rules, kept to whenever a minor is on set.', 1.4),
  attr('chinese_opera_acrobatics', 'Chinese Opera Acrobatics', 'Physical', 'Tumbling, flag work and stylized combat as Chinese opera stages it, landed on the drum beat.', 0.9, true),
  attr('choosing_a_take', 'Choosing A Take', 'Screen', 'A dozen takes watched back, and you pick the one to send.', 1.1),
  attr('chorus_speaking', 'Chorus Speaking', 'Voice', 'Speaking text in unison with a group, matched on rhythm, pitch and breath.', 1.2),
  attr('class_register', 'Class Register', 'Range', 'You place a character by how they speak, eat, sit and handle money.', 1.1),
  attr('classical_audition_speech', 'Classical Audition Speech', 'Craft', 'Keeping a verse speech clean and specific in a bare room with a panel three feet away.', 0.9, true),
  attr('close_up_work', 'Close-Up Work', 'Screen', 'Scaling a performance down to a face filling a screen.'),
  attr('clowning', 'Clowning', 'Comedy', 'You go out with nothing, fail in front of the audience, and stay open while it happens.', 0.7),
  attr('cockney_and_estuary', 'Cockney And Estuary', 'Voice', 'London working speech, from broad Cockney through to modern Estuary.', 1.3),
  attr('cold_endurance', 'Cold Endurance', 'Specialty', 'Playing a scene in snow, wind or cold water without the cold taking the performance over.', 0.8, true),
  attr('cold_entrance', 'Cold Entrance', 'Stage', 'Full temperature on entrance, after forty minutes sitting in a dressing room.'),
  attr('cold_reading', 'Cold Reading', 'Craft', 'You’re good from a script you first saw four minutes ago.', 1, true),
  attr('cold_start_emotion', 'Cold Start Emotion', 'Voice', 'Grief or rage from standing still, ten seconds after somebody asks.', 0.7),
  attr('collaboration', 'Collaboration', 'Professionalism', 'Making the people around you better.', 1.1),
  attr('combat_vocalizations', 'Combat Vocalizations', 'Voice', 'Swings, hits, falls and dying, recorded hundreds at a time off a numbered list.', 1.1, true),
  attr('comedy_timing', 'Comedy Timing', 'Range', 'The rhythm that turns a line into a laugh.', 0.7),
  attr('comic_business', 'Comic Business', 'Comedy', 'Small repeated physical action around a scene: a hat fussed with, a drink never quite drunk.', 1.2),
  attr('comic_escalation', 'Comic Escalation', 'Comedy', 'The stakes of a bit go up step by step, so every beat is worse than the last.'),
  attr('comic_misdirection', 'Comic Misdirection', 'Comedy', 'An audience steered toward one expectation, and the punch arrives from somewhere else.', 1.1),
  attr('comic_reactions', 'Comic Reactions', 'Comedy', 'The laugh taken with a face or a shift of posture, and never a line.'),
  attr('comic_rhythm', 'Comic Rhythm', 'Comedy', 'The beat pattern of a scene held, so setups and punches land in a steady groove.', 0.7),
  attr('comic_song_delivery', 'Comic Song Delivery', 'Musical', 'The jokes inside a lyric land, and every musical mark still gets hit.', 0.8),
  attr('comic_status_play', 'Comic Status Play', 'Comedy', 'Your status goes up or down against another character, and that’s where the funny is.', 1.1),
  attr('comic_timing', 'Comic Timing', 'Comedy', 'A line or a move placed at the exact moment that gets the laugh.', 0.6),
  attr('commedia_dell_arte', 'Commedia Dell’Arte', 'Tradition', 'The stock masks — Arlecchino, Pantalone, the lovers — in their fixed stances and rhythms.', 1.1),
  attr('commedia_half_mask', 'Commedia Half Mask Work', 'Tradition', 'A leather half mask: you lead with the body and keep the mask turned toward the audience.', 1.1),
  attr('commedia_lazzi', 'Commedia Lazzi', 'Comedy', 'The set comic routines of commedia dell’arte: the fly bit, the hunger bit, and the rest.', 1.3, true),
  attr('commedia_stock_characters', 'Commedia Stock Character Work', 'Tradition', 'The fixed commedia types, with their set walks, appetites and standing in the pecking order.', 1.2),
  attr('commercial_copy_read', 'Commercial Copy Read', 'Screen', 'Product copy and a smile, straight down the lens, in fifteen seconds.', 1.3),
  attr('commercial_reads', 'Commercial Reads', 'Voice', 'Thirty seconds of copy that sounds like a person and still sells the thing.', 1.2),
  attr('communion', 'Communion', 'Craft', 'Live two-way contact with your partner, instead of two performances side by side.', 0.9, true),
  attr('concentration_of_attention', 'Concentration Of Attention', 'Craft', 'Holding focus inside a chosen circle, and widening or narrowing that circle at will.', 1.1, true),
  attr('concert_film_performance', 'Concert Film Performance', 'Screen', 'Sustaining a full-size stage act take after take for cameras with no crowd feeding it.', 0.9),
  attr('conducting_for_camera', 'Conducting For Camera', 'Specialty', 'Beating clear patterns and cues that read as a real conductor to players and to the lens.', 1.1),
  attr('confined_space_composure', 'Confined Space Composure', 'Specialty', 'Staying workable while buried, boxed or wedged into a tight practical set.', 0.7),
  attr('consent_and_boundary_negotiation', 'Consent And Boundary Negotiation', 'Professionalism', 'You say what you’ll and won’t do before a scene is blocked, and then you hold that line.', 1.2),
  attr('constructed_language_work', 'Constructed Language Work', 'Range', 'Invented languages learned well enough to argue, joke and threaten in them.', 1.2, true),
  attr('contact_improvisation', 'Contact Improvisation', 'Physical', 'You improvise with a partner through shared weight, rolling points of contact and catches.', 1.2, true),
  attr('contemporary_dance', 'Contemporary Dance', 'Physical', 'Floorwork, release and weighted movement of modern concert dance.', 1, true),
  attr('contemporary_monologue', 'Contemporary Monologue', 'Craft', 'A modern speech carried alone, without the scene partner it was written against.', 1.1, true),
  attr('continuity_awareness', 'Continuity Awareness', 'Craft', 'Your physical action matches across coverage, and nobody has to tell you.', 1.2),
  attr('contract_literacy', 'Contract Literacy', 'Industry', 'Reading a deal memo for options, exclusivity, credit and what you actually agreed to.', 1.4),
  attr('convention_panel_work', 'Convention Panel Work', 'Industry', 'Handling a fan panel, autograph line and photo session across a long convention day.', 1.1),
  attr('conversational_read', 'Conversational Read', 'Voice', 'Sounding like talking with the copy right in front of you.'),
  attr('coordination', 'Coordination', 'Physical', 'Hitting marks and props cleanly under pressure.', 1.1),
  attr('copy_timing', 'Copy Timing', 'Voice', 'A read that lands on twenty nine seconds and never sounds sped up.', 1.3, true),
  attr('corporate_narration', 'Corporate And E-Learning Narration', 'Voice', 'Long instructional scripts kept even and warm across dozens of modules.', 1.3),
  attr('corporeal_mime', 'Corporeal Mime', 'Physical', 'The trunk isolated and articulated, so the torso carries the action and the face doesn’t.', 1.1),
  attr('corpsing_control', 'Corpsing Control', 'Comedy', 'You stay in character and don’t laugh, while a partner or a mishap tries to break you.'),
  attr('corpsing_recovery', 'Corpsing Recovery', 'Stage', 'Back inside the scene, after a person near you has started laughing.', 0.9),
  attr('corsetry_and_skirtwork', 'Corsetry And Skirtwork', 'Physical', 'You breathe, sit and turn in a corset, and steer a hooped skirt through a door.', 1.3),
  attr('covering_a_dry', 'Covering A Dry', 'Stage', 'You feed a line, fill the gap or rewrite on your feet when the scene goes blank.'),
  attr('covering_a_technical_failure', 'Covering A Technical Failure', 'Stage', 'You play on through a dead mic, a stuck door, or a scene change that hasn’t happened.'),
  attr('creature_and_non_human_playing', 'Creature And Non-Human Playing', 'Range', 'Building an animal, creature or machine out of movement, breath and sound. No costume does it.'),
  attr('creature_movement', 'Creature Movement', 'Specialty', 'Something non-human: four legs, the wrong joints, and a spine that bends the other way.', 1.1),
  attr('creature_suit_performance', 'Creature Suit Performance', 'Specialty', 'A character built out of shape, weight and movement, from inside a sealed creature suit.', 0.9, true),
  attr('creature_vocalization', 'Creature Vocalization', 'Specialty', 'Growls, shrieks and non-human sound made without tearing the voice.'),
  attr('creature_vocals', 'Creature Vocals', 'Specialty', 'Growls, shrieks and inhuman noises made with a throat that has to work again tomorrow.'),
  attr('crew_respect', 'Crew Respect', 'Professionalism', 'Crew names learned, their way kept out of, every department treated as colleagues.'),
  attr('cringe_comedy', 'Cringe Comedy', 'Comedy', 'Social discomfort played straight, and the awkward silence sat in past bearing.', 0.9),
  attr('crisis_response', 'Crisis Response', 'Industry', 'A scandal, a bad quote or a leak, answered with a statement, an apology or nothing at all.', 0.9),
  attr('cross_cultural_casting', 'Cross-Cultural Casting', 'Range', 'Playing across a culture that isn’t yours, with the research and judgment that demands.', 0.9),
  attr('crowd_work', 'Crowd Work', 'Comedy', 'Talk with people in the audience, and what they say turns into jokes.', 0.9, true),
  attr('crying_on_cue', 'Crying On Cue', 'Craft', 'Real tears, on a chosen line or mark, take after take.', 0.8, true),
  attr('cue_lines', 'Cue Lines', 'Craft', 'Knowing the line before yours as well as your own so pickups land clean.', 1.3, true),
  attr('cue_pickup', 'Cue Pickup', 'Stage', 'A line taken off the end of the one before it, with the pace intact.', 1.3),
  attr('cue_script_playing', 'Cue Script Playing', 'Tradition', 'A part with only your own lines on it, and the few words that cue them.', 1.2),
  attr('curtain_call', 'Curtain Call', 'Stage', 'A bow in the right order and at the right size, in character or out of it.', 1.4),
  attr('dance', 'Dance', 'Physical', 'Choreographed movement to tempo.', 1.1, true),
  attr('dance_for_actors', 'Dance For Actors', 'Physical', 'Through the number cleanly and in character, and you were never a trained dancer.', 1.2, true),
  attr('dance_lifts', 'Dance Lifts', 'Physical', 'You lift, or you go up, on the count, and it lands safely.', 1.1, true),
  attr('dance_stamina', 'Dance Stamina', 'Physical', 'A full number, then the same one again, and the dancing never goes ragged.', 1.2, true),
  attr('de_roling', 'De-Roling', 'Craft', 'Coming out of a role deliberately at the end of the day so it doesn’t follow you home.', 1.1),
  attr('deadpan', 'Deadpan', 'Comedy', 'Absurd material, a flat face and a flat voice, and the audience gets nothing to hold.', 0.8),
  attr('deal_negotiation', 'Deal Negotiation', 'Industry', 'Trading fee, credit, billing and perks toward a deal both sides will sign.'),
  attr('devising', 'Devising', 'Craft', 'Making a show with a company out of exercises, images and fragments, with no script to start from.'),
  attr('dialect_acquisition', 'Dialect Acquisition', 'Voice', 'How fast a new accent becomes usable.'),
  attr('dialect_coaching', 'Dialect Coaching', 'Voice', 'Teaching another performer an accent and hearing what is wrong in theirs.', 1.1),
  attr('dialect_work', 'Dialect Work', 'Range', 'Getting the words, grammar and music of one specific place, not just the sound of it.', 1.3, true),
  attr('diction', 'Diction', 'Voice', 'Being understood on the first pass, in the mix.', 1.2),
  attr('direct_lens_address', 'Direct Lens Address', 'Screen', 'You speak straight down the barrel and hold it, as a real address to one person.'),
  attr('directing_your_own_tape', 'Directing Your Own Tape', 'Screen', 'What to change between takes, with nobody there to tell you.'),
  attr('directing_your_reader', 'Directing Your Reader', 'Craft', 'You get a friend to feed the lines at the pace, volume and pitch the scene actually needs.', 1.3),
  attr('direction_absorption', 'Direction Absorption', 'Craft', 'A note becomes a changed performance on the very next take.'),
  attr('director_collaboration', 'Director Collaboration', 'Professionalism', 'You find out how a director works, and give them what they want without losing your own take.'),
  attr('disclaimer_speed_reads', 'Disclaimer Speed Reads', 'Specialty', 'Legal copy at speed with every word still intact.', 1.3, true),
  attr('discretion', 'Discretion', 'Professionalism', 'Keeping confidential material confidential.', 1.3),
  attr('divided_consciousness', 'Divided Consciousness', 'Craft', 'Inside the character and watching your own work at once, and neither one collapses.', 0.6),
  attr('documentary_narration', 'Documentary Narration', 'Voice', 'Carrying picture and music without competing with either.', 1.2),
  attr('double_take', 'Double Take', 'Comedy', 'You look away, register what you just saw, and snap back for the laugh.', 1.3),
  attr('doubling_roles', 'Doubling Roles', 'Stage', 'Several parts in one show, and each reads as a different person.', 1.1),
  attr('drama', 'Drama', 'Range', 'Sustained serious work with real stakes.'),
  attr('dramatic_structure', 'Dramatic Structure', 'Craft', 'You read the act breaks, turning points and climax, and see where your scene sits among them.', 1.3),
  attr('dramaturgy', 'Dramaturgy', 'Craft', 'Researching the world, references and history of a script until nothing in it is a blank.', 1.3),
  attr('dressing_room_courtesy', 'Dressing Room Courtesy', 'Professionalism', 'A shared dressing room, quietly: space, noise, guests and the half hour before curtain.', 1.3),
  attr('driving_process_work', 'Driving Process Work', 'Screen', 'Playing a scene in a car on a low loader or a process screen while pretending to drive.', 1.1),
  attr('drum_kit_proficiency', 'Drum Kit Proficiency', 'Specialty', 'You keep time on a kit with the sticks, limbs and posture a real drummer uses.', 1.2, true),
  attr('dry_comedy', 'Dry Comedy', 'Range', 'Deadpan and understatement.', 0.9),
  attr('dubbing_to_lip_flap', 'Dubbing To Lip Flap', 'Voice', 'A translated line fitted inside mouth movements made for another language.', 1.3, true),
  attr('eating_on_camera', 'Eating On Camera', 'Specialty', 'Bites and talk together, so the mouthful, the plate and the chewing match across every take.', 1.3),
  attr('eight_show_week_stamina', 'Eight Show Week Stamina', 'Stage', 'Body, voice and attention holding up across six evenings and two matinees.', 0.9, true),
  attr('emotional_access', 'Emotional Access', 'Craft', 'Grief, rage or joy, reached fast and without forcing, whenever the take asks for it.', 0.6, true),
  attr('emotional_preparation', 'Emotional Preparation', 'Craft', 'Working yourself into the state the first line needs during the minutes before you start.', 1, true),
  attr('emotional_recall', 'Emotional Recall', 'Craft', 'You call up a feeling from your own past and let it run in the scene, on cue.', 0.7, true),
  attr('emotional_truth', 'Emotional Truth', 'Craft', 'Whether a moment reads as genuinely felt or as performed.', 0.7),
  attr('endowment', 'Endowment', 'Craft', 'A prop, a place or a person gets qualities it hasn’t got, and you behave as though it has.', 1.1),
  attr('ensemble_blend', 'Ensemble Blend', 'Musical', 'Vowel, volume and vibrato matched to the voices around you, so the chorus sounds like one.', 1.2),
  attr('ensemble_blending', 'Ensemble Blending', 'Screen', 'You serve the scene, not your own coverage.'),
  attr('ensemble_movement', 'Ensemble Movement', 'Stage', 'Part of a group, in unison or counterpoint, and never once watching the person next to you.', 1.2),
  attr('ensemble_playing', 'Ensemble Playing', 'Range', 'Taking your share of a scene and no more, so the group plays better than the parts.'),
  attr('ensemble_timing', 'Ensemble Timing', 'Stage', 'You move, breathe and speak with a group, and the crowd scene reads as one thing.', 1.1),
  attr('entrances_and_exits', 'Entrances And Exits', 'Stage', 'On and off on the right beat, already in the scene or still in it.', 1.2),
  attr('epic_theater_narration', 'Epic Theater Narration', 'Tradition', 'Stage directions, titles and your own lines, spoken in the third person to frame the scene.', 1.2),
  attr('essential_action', 'Essential Action', 'Tradition', 'A scene’s want boiled down to one plain human action you could take with anybody.', 1.4),
  attr('event_analysis', 'Event Analysis', 'Craft', 'The one event that changes the situation in a scene, named and placed.', 1.2),
  attr('eyeline_discipline', 'Eyeline Discipline', 'Screen', 'A precise eyeline, held against a tennis ball on a stick.', 1.3),
  attr('eyeline_placement', 'Eyeline Placement', 'Screen', 'Your look goes on the exact spot the shot needs, past the lens or on a mark beside it.', 1.3),
  attr('facial_capture', 'Facial Capture', 'Screen', 'Working with a head rig and dot marks, keeping the face free while a camera sits inches from it.', 1, true),
  attr('facts_and_questions', 'Facts And Questions', 'Craft', 'What the script states outright, what it leaves open, and a list of each.', 1.3),
  attr('falls_and_rolls', 'Falls And Rolls', 'Physical', 'You go down hard and look hurt without being hurt, on stairs, furniture or flat ground.', 1.2, true),
  attr('falsetto_control', 'Falsetto Control', 'Musical', 'A steady, unbreathy falsetto, and clean movement in and out of it.'),
  attr('fan_and_cane_work', 'Fan And Cane Work', 'Tradition', 'Fans, gloves, canes, hats and snuff, handled until they look like habit and not props.', 1.3),
  attr('fan_and_handkerchief_work', 'Fan And Handkerchief Work', 'Craft', 'Handling a fan, cane, snuffbox or handkerchief as part of the scene, so it never reads as clutter.', 1.4),
  attr('fan_encounter_management', 'Fan Encounter Management', 'Industry', 'You meet fans in public, warmly and briefly, and then you get on with your day.'),
  attr('farce_door_work', 'Farce Door Work', 'Comedy', 'Entrances and exits timed through several doors, so characters just miss each other.', 1.4, true),
  attr('farce_tempo', 'Farce Tempo', 'Comedy', 'A farce driven faster and faster, with every plot point still clear.', 1.1, true),
  attr('fear_terror', 'Fear & Terror', 'Range', 'Genuine dread, not performed screaming.', 0.9),
  attr('feeding_lines', 'Feeding Lines', 'Comedy', 'A partner’s punchline set up so the laugh lands on them and not on you.'),
  attr('feeding_off_camera_lines', 'Feeding Off-Camera Lines', 'Screen', 'Giving a full performance off camera for someone else’s coverage, on their eyeline and in their rhythm.', 1.2),
  attr('feldenkrais_method', 'Feldenkrais Method', 'Physical', 'Slow guided movement that retrains how the body organizes itself to sit, stand and reach.'),
  attr('finding_your_light', 'Finding Your Light', 'Screen', 'A few inches, and the key light lands on your face instead of leaving you in shadow.', 1.3),
  attr('firearms_handling', 'Firearms Handling', 'Specialty', 'Drawing, carrying, loading and firing like a person trained on it, safely, on a live set.', 1.3, true),
  attr('first_ad_rapport', 'First AD Rapport', 'Professionalism', 'The first AD calls, and you’re findable and on set the moment they do.', 1.2),
  attr('first_folio_technique', 'First Folio Technique', 'Tradition', 'Acting clues taken off the original printed text: its capitals, spellings and odd punctuation.', 1.4),
  attr('flexibility', 'Flexibility', 'Physical', 'Range of motion for demanding physical work.', 1.4, true),
  attr('folio_text', 'Folio Text', 'Tradition', 'Folio spelling, capitals and punctuation, and never a modern edited text.', 1.1),
  attr('following_a_conductor', 'Following A Conductor', 'Musical', 'Tempo, entrances and cutoffs off a baton, and you never leave the scene to get them.', 1.3),
  attr('foreign_language_singing', 'Foreign Language Singing', 'Musical', 'Text in a language you don’t speak, sung with the right vowels and the right stresses.', 1.2),
  attr('forum_theater_playing', 'Forum Theater Playing', 'Tradition', 'A scene of oppression replayed, and you hold the line while spectators step in to change it.', 1.1),
  attr('four_step_analysis', 'Four Step Analysis', 'Tradition', 'Practical Aesthetics’ breakdown of literal action, want, essential action and as-if before each scene.', 1.5),
  attr('fourth_wall_work', 'Fourth Wall Work', 'Tradition', 'A real room from your own life, placed out where the audience or the camera is.', 1.1),
  attr('frame_awareness', 'Frame Awareness', 'Screen', 'You know where the edges of the shot are, and your head and hands stay inside them.', 1.2),
  attr('gait_transformation', 'Gait Transformation', 'Range', 'A walk that belongs to the character, and holds under every other demand.', 1.2),
  attr('game_barks', 'Game Barks', 'Voice', 'Short combat and idle lines delivered out of order with no scene around them.', 1.2),
  attr('game_of_the_scene', 'Game Of The Scene', 'Comedy', 'The first unusual thing in an improv scene, spotted and played as the pattern.', 1, true),
  attr('gender_crossed_casting', 'Gender-Crossed Casting', 'Range', 'Playing a gender other than your own as the text asks, not as a joke about the difference.'),
  attr('general_american', 'General American', 'Voice', 'Speaking unmarked General American, with the regional traces sanded off.', 1.3),
  attr('general_meeting', 'General Meeting', 'Industry', 'Twenty minutes about yourself, with no script and no scene to hide behind.'),
  attr('gesture_economy', 'Gesture Economy', 'Physical', 'Every hand movement that isn’t doing work gets cut, so the ones left land.', 0.9),
  attr('gestus', 'Gestus', 'Tradition', 'The single physical attitude that shows the social relation inside a scene.'),
  attr('gidayu_narration', 'Gidayu Narration', 'Voice', 'Narrating a puppet play in the gidayu style, voicing every character and the scene around them.', 0.8, true),
  attr('given_circumstances', 'Given Circumstances', 'Craft', 'Who, where, when and what already happened, pulled out of the text and played on top of.', 1.4),
  attr('giving_and_taking_focus', 'Giving And Taking Focus', 'Stage', 'The audience eye pulled onto you, or handed to whoever the scene needs it on.'),
  attr('glossing_archaic_language', 'Glossing Archaic Language', 'Craft', 'You look up every word in an old text you don’t know, until no line is left vague.', 1.4),
  attr('going_on_cold', 'Going On Cold', 'Stage', 'A role taken over at the half hour call, no rehearsal, script in hand if it comes to it.', 0.8),
  attr('greek_chorus_work', 'Greek Chorus Work', 'Tradition', 'You move and speak as one body with a chorus, sharing lines, breath and timing.', 1.2),
  attr('greek_mask_playing', 'Greek Mask Playing', 'Tradition', 'A full tragic mask, with the character carried through neck, spine and voice.'),
  attr('green_screen_and_blue_screen', 'Green Screen And Blue Screen', 'Screen', 'Playing a scene against a blank colored wall with the world put in behind you afterward.', 1.1),
  attr('grief', 'Grief', 'Range', 'Loss played specifically. Grief in general plays as nothing.', 0.8),
  attr('guitar_proficiency', 'Guitar Proficiency', 'Specialty', 'Guitar, well enough to be shot from any angle, chord shapes included.', 1.2, true),
  attr('hand_and_rod_puppetry', 'Hand And Rod Puppetry', 'Specialty', 'Working a hand or rod puppet so its head, gaze and hands move like something alive.', 1.2, true),
  attr('hand_mudra_vocabulary', 'Hand Mudra Vocabulary', 'Physical', 'The hasta mudras, formed cleanly and strung into readable sentences.', 1.3, true),
  attr('handling_hecklers', 'Handling Hecklers', 'Stage', 'You shut down a shout, a phone or a drunk in row C, and the room stays yours.', 0.9),
  attr('harmony_singing', 'Harmony Singing', 'Musical', 'An inner or lower part held against other voices, and it never slides onto the melody.', 1.1),
  attr('headshot_selection', 'Headshot Selection', 'Industry', 'The one shot that gets you seen for the parts you can actually play.', 1.2),
  attr('headshot_session', 'Headshot Session', 'Screen', 'An hour in front of a stills camera, and something different in every frame.', 1, true),
  attr('heat_endurance', 'Heat Endurance', 'Specialty', 'Desert heat, hot lights and heavy costume, and the work never thins out.', 0.9, true),
  attr('heavy_costume_work', 'Heavy Costume Work', 'Stage', 'Corsets, armor, wigs and masks that restrict breath, sight and movement, performed in anyway.', 1.2),
  attr('heckler_handling', 'Heckler Handling', 'Comedy', 'An interruption shut down fast, and the room comes back on your side.', 1, true),
  attr('heightened_text', 'Heightened Text', 'Craft', 'Playing language bigger than everyday speech without losing the thought inside it.'),
  attr('high_altitude_performance', 'High Altitude Performance', 'Specialty', 'Long takes at altitude, where breath, energy and thinking all get harder.', 0.8, true),
  attr('hitting_marks', 'Hitting Marks', 'Screen', 'You land on the taped mark at the right moment, and never break the scene to look for it.', 1.4, true),
  attr('holding_a_key_unaccompanied', 'Holding A Key Unaccompanied', 'Musical', 'You stay in the starting key through a long unaccompanied passage, with nothing to tune to.', 0.8),
  attr('holding_a_pause', 'Holding A Pause', 'Stage', 'A silence that runs its full length while a full house waits it out.', 0.9),
  attr('holding_a_take', 'Holding A Take', 'Screen', 'Staying in the scene through a fluff, a passing plane or a boom in shot until cut is called.', 0.9),
  attr('holding_energy_across_the_interval', 'Holding Energy Across The Interval', 'Stage', 'Back after twenty minutes offstage, at the pitch the second act starts on.', 1.1),
  attr('holding_for_laughs', 'Holding For Laughs', 'Stage', 'You wait out a laugh and come in on its way down, so the next line still lands.'),
  attr('holding_screen_direction', 'Holding Screen Direction', 'Screen', 'Keeping exits, entrances and looks on the correct side so the geography of the scene holds.', 1.3),
  attr('holding_the_final_beat', 'Holding The Final Beat', 'Craft', 'Staying in it after the last line until the room or the camera lets you out.', 1.3),
  attr('holding_the_focus_plane', 'Holding The Focus Plane', 'Screen', 'Staying at the distance the focus puller set, so a lean or a sway doesn’t go soft.', 1.3, true),
  attr('holding_through_the_cut', 'Holding Through The Cut', 'Screen', 'In it before action, still in it after cut, so the editor has clean handles.'),
  attr('home_studio_operation', 'Home Studio Operation', 'Specialty', 'Recording, punching in and delivering clean files from your own booth.', 1.4),
  attr('horse_riding', 'Horse Riding', 'Specialty', 'Good enough on a horse to be shot doing it: mounting, cantering, and acting while you’re up there.', 1, true),
  attr('horseback_scene_work', 'Horseback Scene Work', 'Specialty', 'Riding, halting and speaking lines on a horse while keeping it calm between takes.', 0.9, true),
  attr('horsemanship', 'Horsemanship', 'Physical', 'Riding competently on camera.', 1, true),
  attr('hostile_interview_handling', 'Hostile Interview Handling', 'Industry', 'You stay calm and unbaited when the questions turn to gossip, politics or an old scandal.', 0.9, true),
  attr('iambic_pentameter_speaking', 'Iambic Pentameter Speaking', 'Tradition', 'Verse on the five beat line, with the meter used for sense and breath and never sung.', 1.3),
  attr('idiolect_construction', 'Idiolect Construction', 'Range', 'One person’s own speech habits: the fillers, the favorite words, where they break off.'),
  attr('illusion_of_the_first_time', 'Illusion Of The First Time', 'Craft', 'Lines and events rehearsed a hundred times, met as though they’ve only just happened.', 0.9, true),
  attr('image_theater', 'Image Theater', 'Tradition', 'Frozen images built out of bodies to state a problem, then reshaped toward a solution.', 1.2),
  attr('imagery_work', 'Imagery Work', 'Craft', 'Building a picture behind every image in the text so the words have something under them.'),
  attr('imaginary_body', 'Imaginary Body', 'Tradition', 'You picture a body unlike your own, then step into it until it changes how you move.', 1.1),
  attr('imaginary_center', 'Imaginary Center', 'Tradition', 'The character’s driving point sits somewhere in or outside the body, and you move from it.', 1.1),
  attr('imagination_work', 'Imagination Work', 'Craft', 'Building the world, history and objects of the play out of invention, with your own memory left out of it.'),
  attr('immersive_performance', 'Immersive Performance', 'Stage', 'Playing at arm’s length to a moving audience who can follow you, touch things and interrupt.'),
  attr('impression_work', 'Impression Work', 'Range', 'You catch the few signatures that make an audience say the name, and then you stop.', 0.9, true),
  attr('improv_object_work', 'Improv Object Work', 'Comedy', 'Objects and space mimed consistently enough that the audience sees them.', 1.4, true),
  attr('improvisation', 'Improvisation', 'Craft', 'Usable material, made up live, the moment the scene needs it.', 0.9, true),
  attr('improvised_song', 'Improvised Song', 'Musical', 'A song with rhyme, melody and structure, made up on the spot.', 0.8, true),
  attr('impulse_work', 'Impulse Work', 'Craft', 'You go with the first live urge, before you can edit it into something safer.', 0.7, true),
  attr('independent_activity', 'Independent Activity', 'Tradition', 'A difficult, urgent task of your own, while the scene keeps interrupting you.', 1.2, true),
  attr('industry_networking', 'Industry Networking', 'Industry', 'Meeting directors, writers and executives at parties and dinners, and following up after.', 1, true),
  attr('injury_acting', 'Injury Acting', 'Specialty', 'A break, cut or burn, where the hurt limb never takes weight and the pain stays specific.'),
  attr('injury_resilience', 'Injury Resilience', 'Physical', 'You recover from the wear a physical shoot leaves on you.', 0.8, true),
  attr('inner_monologue', 'Inner Monologue', 'Craft', 'Running the character’s unspoken thought under the lines and in the gaps between them.'),
  attr('inner_tempo_rhythm', 'Inner Tempo Rhythm', 'Craft', 'The pulse of a character’s inner life, which needn’t match the speed of the speech at all.'),
  attr('insert_and_hands_only_shots', 'Insert And Hands-Only Shots', 'Screen', 'A whole beat played with just your hands, on a watch, a letter or a gun, in tight frame.', 1.2),
  attr('instrument_faking', 'Instrument Faking', 'Specialty', 'You mime fingering, bowing and body language closely enough to match the track playing.', 1.3),
  attr('instrument_miming', 'Instrument Miming', 'Range', 'Fingering, bowing or sticking matched to playback, so the shot can hold on your hands.', 1.4, true),
  attr('instrument_playing_on_camera', 'Instrument Playing On Camera', 'Specialty', 'Actually playing an instrument in the take at performance standard with a lens on your hands.', 0.9, true),
  attr('interview_poise', 'Interview Poise', 'Industry', 'Interesting and safe at once, for the whole length of a press interview.', 1.2),
  attr('interview_technique', 'Interview Technique', 'Industry', 'You give a journalist something quotable that’s still what you meant to say.', 1, true),
  attr('intimacy_choreography', 'Intimacy Choreography', 'Physical', 'A kiss or a love scene repeated to set choreography, take after take, boundaries held.', 1.2),
  attr('intimacy_coordinator_collaboration', 'Intimacy Coordinator Collaboration', 'Professionalism', 'Working to the plan an intimacy coordinator sets and flagging anything that changes on the day.', 1.3),
  attr('intimacy_protocol', 'Intimacy Protocol', 'Professionalism', 'Working an intimacy coordinator’s choreography and holding the agreed boundaries on the day.', 1.2),
  attr('intonation', 'Intonation', 'Voice', 'The rise and fall of a line, shaped so the meaning sits where you want it.', 1.1),
  attr('invisible_theater', 'Invisible Theater', 'Specialty', 'A staged scene in a public place, among people who have no idea it’s a play.', 0.9),
  attr('italian_run', 'Italian Run', 'Craft', 'Racing the lines with the company at speed, no acting, to test that the text is solid.', 1.3),
  attr('jaw_and_tongue_release', 'Jaw And Tongue Release', 'Voice', 'The jaw, tongue root and lips come unlocked, so the sound isn’t chewed on the way out.', 1.2),
  attr('jazz_dance', 'Jazz Dance', 'Physical', 'Isolations, kicks, layouts and turns of theater jazz style.', 1.1, true),
  attr('joke_writing', 'Joke Writing', 'Comedy', 'Setups and punchlines that work in your own mouth, on stage, out loud.', 1.1),
  attr('joker_facilitation', 'Joker Facilitation', 'Specialty', 'Running the room between stage and audience, questioning, rewinding and keeping the forum moving.'),
  attr('joy', 'Joy', 'Range', 'Unforced delight. Far harder than it looks.', 0.8),
  attr('justification', 'Justification', 'Craft', 'A reason the character would truthfully do what the script or the director is asking for.', 1.3),
  attr('kabuki_dance', 'Kabuki Dance', 'Physical', 'The buyo passages of a kabuki play, fan and sleeve included, in time with the shamisen.', 0.9, true),
  attr('kathakali_eye_technique', 'Kathakali Eye Technique', 'Physical', 'Eyes, brows and cheeks moved in isolation, so the face carries the story from a distance.', 0.7, true),
  attr('keeping_continuity_notes', 'Keeping Continuity Notes', 'Screen', 'You track your own props, buttons and hand positions across takes and days of shooting.', 1.4),
  attr('keeping_overlaps_clean', 'Keeping Overlaps Clean', 'Screen', 'Leaving air around your scene partner’s lines so the two performances can be cut apart in the edit.', 1.3),
  attr('kyogen_playing', 'Kyogen Playing', 'Tradition', 'Kyogen comedy in its fixed vocal patterns and wide stance: broad, and never once loose.'),
  attr('laban_effort_work', 'Laban Effort Work', 'Physical', 'Movement read as weight, time, space and flow, so one character punches where another glides.', 1.2),
  attr('language_patterns', 'Language Patterns', 'Craft', 'You notice how a character’s words, rhythm and sentence length differ from everyone else’s.', 1.2),
  attr('laryngeal_release', 'Laryngeal Release', 'Voice', 'The larynx stays loose and low under pressure, and never squeezes up into the sound.'),
  attr('lazzi_playing', 'Lazzi Playing', 'Tradition', 'Set comic bits dropped in — the flea catching, the fall — and then back to the plot.', 1.1),
  attr('leading_role_presence', 'Leading Role Presence', 'Range', 'You’re the one the camera and the audience stay with, and you hold the middle of a story.', 0.7),
  attr('learning_music_by_ear', 'Learning Music By Ear', 'Musical', 'A melody, harmony part or riff, picked up after a few hearings.', 0.8),
  attr('lecoq_movement_analysis', 'Lecoq Movement Analysis', 'Physical', 'Lecoq’s elements and materials: fire, water or wood, played in the body.', 1.1),
  attr('legit_soprano', 'Legit Soprano', 'Musical', 'The light, lifted classical head tone that golden age scores were written for.', 0.8, true),
  attr('letting_go_of_an_audition', 'Letting Go Of An Audition', 'Professionalism', 'The room is behind you by the end of the day, whatever happened in it.', 0.7),
  attr('level_control', 'Level Control', 'Voice', 'You shout without pinning the meter and whisper without vanishing under the noise floor.', 1.3),
  attr('lifting_off_the_page', 'Lifting Off The Page', 'Craft', 'Taking the line in with a glance down, then delivering it with the eyes up.', 1.3, true),
  attr('line_endings', 'Line Endings', 'Craft', 'Handling the end of a verse line so its shape is heard without the thought stopping.', 1.2),
  attr('line_learning', 'Line Learning', 'Craft', 'The words go in exactly as written, and then they come without being reached for.', 1.2, true),
  attr('line_notes', 'Line Notes', 'Professionalism', 'Where you paraphrased, you hear it, and the writer’s words go back the way they were.', 1.3),
  attr('pressure_lines', 'Line Retention Under Pressure', 'Craft', 'You hold the text when the day is long and the crew is waiting.', 0.8, true),
  attr('line_set_consistency', 'Line Set Consistency', 'Voice', 'Holding one level, one energy and one voice across a thousand lines and three sessions.', 1.1),
  attr('lip_sync_to_playback', 'Lip Sync To Playback', 'Screen', 'You mouth a prerecorded track on camera and the words land exactly on the recording.', 1.2, true),
  attr('listening_and_responding', 'Listening And Responding', 'Craft', 'You take in what your scene partner actually did, and it changes what you do next.', 0.8, true),
  attr('live_virtual_audition', 'Live Virtual Audition', 'Screen', 'A read over a video call, with lag, a laptop eyeline and a panel you can barely see.', 1.3),
  attr('live_vocals_on_camera', 'Live Vocals On Camera', 'Screen', 'Singing live in the take on an earwig and a hidden mic instead of miming to playback.'),
  attr('living_newspaper_staging', 'Living Newspaper Staging', 'Tradition', 'News reports, statistics and documents turned into short staged scenes with a narrator.', 1.2),
  attr('long_day_endurance', 'Long Day Endurance', 'Professionalism', 'Quality that holds at hour thirteen.', 1.2, true),
  attr('long_form_improv', 'Long Form Improv', 'Comedy', 'Half an hour or more of improvised piece, with scenes and characters carried across it.', 1.1, true),
  attr('long_run_freshness', 'Long Run Freshness', 'Stage', 'A performance still specific and alive on the two hundredth night.', 0.9),
  attr('loop_group_work', 'Loop Group Work', 'Specialty', 'Improvised crowd and background dialogue recorded to picture with five people on one mic.', 1.2, true),
  attr('lyric_interpretation', 'Lyric Interpretation', 'Musical', 'A lyric phrased so the thought lands as speech and never as recitation.', 0.9),
  attr('magnetism', 'Magnetism', 'Screen', 'Pulling focus in an ensemble without stealing it.', 0.5),
  attr('makeup_chair_patience', 'Makeup Chair Patience', 'Professionalism', 'Still and pleasant through hours of hair, makeup and prosthetics work.', 1.2),
  attr('making_a_choice', 'Making A Choice', 'Craft', 'One specific reading of the scene, committed to, where a safe neutral one was on offer.', 0.9),
  attr('manager_relationship', 'Manager Relationship', 'Industry', 'A manager is for the shape of a career. They aren’t a second agent.', 1.1),
  attr('marking_rehearsal_for_camera', 'Marking Rehearsal For Camera', 'Screen', 'You walk the scene at half power for lighting and focus, and the timing stays exact.', 1.3),
  attr('marking_up_sides', 'Marking Up Sides', 'Craft', 'Penciling beats, breaths, cuts and stresses onto the pages before you read them.', 1.4),
  attr('mask_and_mime', 'Mask & Mime Work', 'Physical', 'Performing through prosthetics, suits and silence.'),
  attr('matching_for_second_unit', 'Matching For Second Unit', 'Screen', 'The same performance days later, for another unit and another crew, and it cuts with the first.', 1.1),
  attr('matching_physical_business', 'Matching Physical Business', 'Screen', 'The cigarette, the drink and the door, on the same line, every single take.', 1.3),
  attr('matinee_adjustment', 'Matinee Adjustment', 'Stage', 'Full energy for a two o’clock house, on the second show of the day.', 1.1),
  attr('medical_procedure_fluency', 'Medical Procedure Fluency', 'Range', 'Instruments, lines and a body on a table, handled with the ease of clinical routine.', 1.5, true),
  attr('medical_rig_tolerance', 'Medical Rig Tolerance', 'Specialty', 'A full day with drips, casts, wound prosthetics and hospital kit attached to you.', 1.2, true),
  attr('melodrama_playing', 'Melodrama Playing', 'Tradition', 'Melodrama played full out and honestly: big attitudes, held pauses, music under the speech.', 1.2),
  attr('memorization', 'Memorization', 'Craft', 'Lines in, reliably and fast.', 1, true),
  attr('menace', 'Menace', 'Range', 'Threat that an audience believes.', 0.8),
  attr('method_of_physical_actions', 'Method Of Physical Actions', 'Tradition', 'The role built out of the concrete physical tasks it needs, and the feeling follows the doing.', 1.2),
  attr('mic_proximity_acting', 'Mic Proximity Acting', 'Voice', 'Distance and angle put a character across the room, or right at the ear.', 1.2),
  attr('microphone_technique', 'Microphone Technique', 'Voice', 'Adjusting distance and angle to a boom, lavalier or booth mic so the level stays clean.', 1.4),
  attr('mie_posing', 'Mie Posing', 'Tradition', 'The kabuki freeze on the wooden clacks, one eye crossed, and the pose held.'),
  attr('miming_audition_props', 'Miming Audition Props', 'Craft', 'Handling doors, guns and cigarettes that aren’t there, in a room with one chair.', 1.3),
  attr('minor_work_rules', 'Minor Work Rules', 'Professionalism', 'Working within the tutoring hours, chaperone rules and daily limits that apply to minors.', 1.5),
  attr('misconduct_reporting', 'Misconduct Reporting', 'Professionalism', 'Harassment or unsafe behavior, documented and reported through the channels that exist.', 0.9),
  attr('mixed_voice', 'Mixed Voice', 'Musical', 'Chest and head registers blended, until the break between them stops being audible.', 1.1, true),
  attr('mobility_aid_handling', 'Mobility Aid Handling', 'Specialty', 'Crutches, canes, braces or a prosthetic limb, second nature in frame.', 1.2, true),
  attr('modesty_garment_handling', 'Modesty Garment Handling', 'Specialty', 'Fitting and working around modesty garments, barriers and covers without them showing.', 1.4),
  attr('moment_to_moment_work', 'Moment To Moment Work', 'Craft', 'Each beat comes off what just happened, not off what you planned at home.', 0.9, true),
  attr('monitor_fed_puppeteering', 'Monitor-Fed Puppeteering', 'Specialty', 'Performing a puppet off a monitor instead of looking at the puppet itself.', 1.2, true),
  attr('monologue_selection', 'Monologue Selection', 'Craft', 'Picking speeches that sit in your casting and hold a panel for two minutes.', 1.2),
  attr('motion_capture_movement', 'Motion Capture Movement', 'Screen', 'Performing in a suit on a bare volume, full size and full commitment, with no set to play against.', 1.2),
  attr('motion_capture_performance', 'Motion Capture Performance', 'Screen', 'A suit and markers on a bare volume, and the body does all of the storytelling.', 1, true),
  attr('motion_control_twinning', 'Motion Control Twinning', 'Screen', 'Playing both sides of a twin scene on repeated camera passes, matching your own timing each time.', 0.9),
  attr('mouth_noise_control', 'Mouth Noise Control', 'Voice', 'Clicks, dry lips and swallows, kept off a close mic all day long.', 1.3),
  attr('movement_quality', 'Movement Quality', 'Physical', 'How a character walks, sits and occupies space.', 0.9),
  attr('multicam_audience_playing', 'Multicam Audience Playing', 'Comedy', 'A sitcom scene played to a live studio audience and to four cameras at once.', 1.2, true),
  attr('music_video_performance', 'Music Video Performance', 'Screen', 'You sell a song to camera in fragments, across a dozen setups, angles and speeds.', 1.1),
  attr('musical_improv', 'Musical Improv', 'Comedy', 'Sung verses and choruses made up inside an improv scene, in key and on rhyme.', 1, true),
  attr('nautanki_singing', 'Nautanki Singing', 'Musical', 'Nautanki verse forms, loud and open, to an outdoor crowd over the nagara drum.', 0.9, true),
  attr('nda_discipline', 'NDA Discipline', 'Industry', 'Keeping plot, casting and set gossip off the record, in press and in private.', 1.3),
  attr('negotiation_awareness', 'Negotiation Awareness', 'Industry', 'You know what your representation is trading away.', 1.1),
  attr('nerve_management', 'Nerve Management', 'Professionalism', 'Breath, hands and voice all steady, with the job sitting there in the room.', 0.7, true),
  attr('networking', 'Networking', 'Industry', 'Relationships now that turn into work later.', 1.2),
  attr('neutral_mask_work', 'Neutral Mask Work', 'Physical', 'The neutral mask goes on, and you find out which of your habits the audience can still see.'),
  attr('new_play_development', 'New Play Development', 'Craft', 'Working a script in the room with a living writer while it’s still changing under you.', 1.1),
  attr('noh_chanting', 'Noh Chanting', 'Voice', 'Delivering utai in the low pressured noh voice, holding pitch and pace against the drums.', 0.8, true),
  attr('noh_mask_work', 'Noh Mask Work', 'Tradition', 'The noh mask, worn with almost no sight, tilted to shift the expression from grief to light.', 0.8),
  attr('note_integration', 'Note Integration', 'Professionalism', 'You take a note gracefully, and then you act on it.', 1.2),
  attr('notes_to_the_writer', 'Notes To The Writer', 'Craft', 'You tell a writer what isn’t playing, and you stop short of telling them how to fix it.'),
  attr('nudity_rider_negotiation', 'Nudity Rider Negotiation', 'Industry', 'In writing, before anything: what will be shown, how it’s shot, and who may be in the room.', 1.1),
  attr('object_exercise', 'Object Exercise', 'Tradition', 'A real object handled with full attention, until the behavior around it turns specific.', 1.3, true),
  attr('object_mime', 'Object Mime', 'Physical', 'A wall, a rope or a suitcase made real through fixed points and consistent weight.', 1.3),
  attr('objective_clarity', 'Objective Clarity', 'Craft', 'You know precisely what the character wants in every beat.', 1.1),
  attr('objectives', 'Objectives', 'Craft', 'What a character wants in a scene, phrased as something you can actually play.', 1.2),
  attr('obstacle_work', 'Obstacle Work', 'Craft', 'Naming what stands between the character and the want, and letting it actually cost something.', 1.3),
  attr('obstacles', 'Obstacles', 'Craft', 'What stands between the character and what they want, scene by scene.', 1.2),
  attr('on_camera_kissing', 'On Camera Kissing', 'Specialty', 'A kiss that reads on camera and lands the same way in every take.', 1.3),
  attr('on_set_advocacy', 'On Set Advocacy', 'Professionalism', 'A problem with hours, safety or treatment gets raised on the day, and the day doesn’t stop.', 0.9),
  attr('one_take_blocking', 'One-Take Blocking', 'Screen', 'A whole scene in one unbroken shot, every mark and cue in order.', 0.9),
  attr('onnagata_playing', 'Onnagata Playing', 'Tradition', 'Women in the kabuki manner: knees in, shoulders dropped, and the voice line raised.', 0.8),
  attr('open_air_performance', 'Open Air Performance', 'Stage', 'You hold a crowd outdoors against wind, planes, rain, and light that never goes down.', 1.1),
  attr('operatic_singing', 'Operatic Singing', 'Musical', 'Unamplified classical tone that carries over an orchestra to the back wall.', 0.7, true),
  attr('operative_words', 'Operative Words', 'Craft', 'The words in a line that carry the sense. The rest can go by.', 1.1),
  attr('original_pronunciation', 'Original Pronunciation', 'Voice', 'Speaking Shakespeare in the reconstructed accent of his own day, recovering rhymes and puns.', 1.3, true),
  attr('overall_sensations', 'Overall Sensations', 'Tradition', 'A whole-body condition — sunburn, drunkenness, fever — built out of separate sensory pieces.', 1, true),
  attr('overlapping_dialogue', 'Overlapping Dialogue', 'Voice', 'You cut in on the line before yours cleanly, both lines stay audible, and the scene sounds real.', 1.2),
  attr('overnight_turnaround', 'Overnight Turnaround', 'Professionalism', 'A full tape prepped, shot and sent between a late brief and a morning deadline.', 1.1, true),
  attr('pace_control', 'Pace Control', 'Voice', 'The speed of speech, set and changed on purpose and never at the mercy of nerves.', 1.2),
  attr('panic_and_hyperventilation_acting', 'Panic And Hyperventilation Acting', 'Specialty', 'Breath and heart rate driven into panic on cue, and brought back down after the cut.', 0.9),
  attr('paparazzi_management', 'Paparazzi Management', 'Industry', 'Moving past photographers outside a house or restaurant without giving them the shot.'),
  attr('paraphrase_work', 'Paraphrase Work', 'Craft', 'You say the speech in your own words, to check you know what you’re actually saying.', 1.3),
  attr('particularization', 'Particularization', 'Tradition', 'Every given circumstance filled with a specific detail of your own, until none of it stays general.', 1.2),
  attr('partner_dancing', 'Partner Dancing', 'Physical', 'You lead or follow another dancer through holds, turns and weight changes, in time.', 1.2),
  attr('partner_friction_management', 'Partner Friction Management', 'Professionalism', 'Love, trust or grief, played opposite a person you can’t stand, and none of it shows.', 0.8),
  attr('partnering_and_lifts', 'Partnering And Lifts', 'Physical', 'Weight taken and given in a lift or a catch, so both people land safely and on the beat.', 1.2, true),
  attr('patter_singing', 'Patter Singing', 'Musical', 'Dense, rapid lyrics fired at tempo, with never a pitch or a consonant dropped.', 1.2, true),
  attr('pausing', 'Pausing', 'Voice', 'A silence held long enough to do the work, and let go before it dies.'),
  attr('performance_matching', 'Performance Matching', 'Voice', 'Another performer’s rhythm, pitch and breath, close enough to sit right on top of it.'),
  attr('performing_for_processing', 'Performing For Processing', 'Specialty', 'Reading knowing a radio filter or a pitch shift is going on top of it.', 1.2),
  attr('period_deportment', 'Period Deportment', 'Range', 'Bows, gloves, fans, corsets and how a body sits in clothes that aren’t modern.', 1.3),
  attr('period_movement', 'Period Movement', 'Tradition', 'Bows, curtsies, entrances and how a body sat, walked and greeted in a given century.', 1.2),
  attr('period_register', 'Period Register', 'Range', 'Speaking and behaving as the period did, with no modern casualness underneath.', 1.2),
  attr('period_research', 'Period Research', 'Craft', 'How people in the script’s time and place actually lived, spoke and behaved.', 1.3),
  attr('period_social_dance', 'Period Social Dance', 'Tradition', 'Pavanes, minuets, country dances and waltzes, danced in the manner of their period.', 1.2, true),
  attr('personalization', 'Personalization', 'Craft', 'Attaching private meaning to a line, a name or an object so it lands on you instead of being said.'),
  attr('phone_prompts', 'Phone Prompts', 'Specialty', 'Menu lines and number sets recorded to be spliced together without seams.', 1.4),
  attr('phonetic_language_learning', 'Phonetic Language Learning', 'Voice', 'Lines in a language you don’t speak, learned sound by sound, until a native speaker believes them.', 1.1),
  attr('phonetic_transcription', 'Phonetic Transcription', 'Range', 'Reading and writing IPA so an accent can be worked out on the page before it is spoken.', 1.5),
  attr('phonetics_and_ipa', 'Phonetics And IPA', 'Voice', 'Reading and writing speech sounds in the International Phonetic Alphabet.', 1.5),
  attr('photogenic_quality', 'Photogenic Quality', 'Screen', 'How the specific combination of face and lens behaves.', 0.5),
  attr('phrasing', 'Phrasing', 'Voice', 'You find where the thought breaks and breathe there, so a long sentence still makes sense.', 0.9),
  attr('physical_bulking', 'Physical Bulking', 'Range', 'Visible muscle put on for a role, and held across months of shooting.', 1.3, true),
  attr('physical_characterization', 'Physical Characterization', 'Physical', 'Where a character leads from, holds tension and takes up space, and then you live in it.'),
  attr('physical_comedy', 'Physical Comedy', 'Physical', 'Getting a laugh with the body.', 0.8),
  attr('physical_neutrality', 'Physical Neutrality', 'Physical', 'Your own habits stripped out of standing and moving, so a character can be built on top.', 0.8),
  attr('physical_presence', 'Physical Presence', 'Physical', 'You command the frame before you say a word.', 0.6),
  attr('physical_score_building', 'Physical Score Building', 'Craft', 'Fixing a run of physical actions in rehearsal and repeating it exactly, night after night.', 0.9),
  attr('physical_stamina', 'Physical Stamina', 'Physical', 'A two-show day, or a fifth take of the fight, and the work never drops.', 1.4, true),
  attr('piano_proficiency', 'Piano Proficiency', 'Specialty', 'Piano, well enough to be shot from any angle, hands included.', 1.2, true),
  attr('picking_up_choreography', 'Picking Up Choreography', 'Musical', 'Eight counts off a choreographer on the first showing, and you still have them at night.'),
  attr('pickup_matching', 'Pickup Matching', 'Voice', 'A corrected line dropped into a page recorded days ago, with no audible join.', 1.2, true),
  attr('pitch_range', 'Pitch Range', 'Voice', 'The usable spread from your lowest speaking note to your highest, and moving freely across it.', 0.7, true),
  attr('plastiques', 'Plastiques', 'Physical', 'The Grotowski plastiques: impulses isolated and looped through each part of the body.', 1, true),
  attr('playback_watching', 'Playback Watching', 'Professionalism', 'You look at your own take on the monitor and use it, instead of spiraling about it.'),
  attr('playing_a_character_in_disguise', 'Playing A Character In Disguise', 'Range', 'Playing a character who is pretending to be someone else, with the seams showing on purpose.'),
  attr('playing_a_historical_figure', 'Playing A Historical Figure', 'Range', 'Playing someone from history where the record is thin and the audience still has a picture.', 0.9),
  attr('playing_a_musician', 'Playing A Musician', 'Range', 'The instrument looks like yours in how it’s carried, tuned, blamed and put down.', 1.1),
  attr('playing_a_non_native_speaker', 'Playing A Non-Native Speaker', 'Range', 'Playing a character working in a second language: the pauses, the hunt for a word, the confidence.'),
  attr('playing_a_real_person', 'Playing A Real Person', 'Range', 'Building a part out of a person who actually existed, past the two or three things everyone knows.', 0.9),
  attr('playing_a_speech_impediment', 'Playing A Speech Impediment', 'Range', 'A stammer, lisp or damaged voice played accurately and kept consistent across takes.', 1.1),
  attr('playing_action_in_reverse', 'Playing Action In Reverse', 'Screen', 'Performing a move backwards so it plays forwards when the footage is flipped.', 0.9),
  attr('playing_against_type', 'Playing Against Type', 'Range', 'Working in parts nobody would cast you in, and giving them a reason to.', 0.9),
  attr('playing_age_in_the_body', 'Playing Age In The Body', 'Physical', 'Eighty or eight, carried in the joints and the timing, with the makeup left out of it.', 1.1),
  attr('playing_an_athlete', 'Playing An Athlete', 'Range', 'Moving like a player who has done the sport since childhood, in the walk as much as the play.', 1.2, true),
  attr('playing_an_objective', 'Playing An Objective', 'Craft', 'You decide what the character wants, then chase it through every line in the scene.', 1.3),
  attr('playing_and_singing_at_once', 'Playing And Singing At Once', 'Specialty', 'Accompanying yourself while singing lead, keeping both hands and the vocal line steady.', 1, true),
  attr('playing_another_nationality', 'Playing Another Nationality', 'Range', 'Passing as being from somewhere else in speech, manner and small daily habits.'),
  attr('playing_blindness', 'Playing Blindness', 'Specialty', 'An unfocused gaze held, movement by touch and sound, and never a cheated look.'),
  attr('playing_cognitive_decline', 'Playing Cognitive Decline', 'Specialty', 'Playing memory loss and confusion from the inside, with the person still there.', 0.8),
  attr('playing_contact_with_a_cg_character', 'Playing Contact With A CG Character', 'Screen', 'Weight, resistance and eye contact, given to a creature that isn’t there yet.', 0.9),
  attr('playing_dead', 'Playing Dead', 'Specialty', 'Stillness, breath hidden, eyes fixed, for the whole length of a shot.', 1.1),
  attr('playing_disability_responsibly', 'Playing Disability Responsibly', 'Specialty', 'Building a disabled character from research and consultation instead of borrowed mannerisms.', 0.9),
  attr('playing_drunk', 'Playing Drunk', 'Specialty', 'Playing a character fighting the drink, not performing drunkenness from the outside.', 0.8),
  attr('playing_for_slow_motion', 'Playing For Slow Motion', 'Screen', 'Slowing and simplifying movement for an overcranked camera so it reads at speed.'),
  attr('playing_for_the_cut', 'Playing For The Cut', 'Screen', 'You shape takes so the editor has clean starts, clean ends and options to cut into.'),
  attr('playing_forced_perspective', 'Playing Forced Perspective', 'Screen', 'Working at a distance from your scene partner that makes one of you read as giant or tiny.'),
  attr('playing_illness', 'Playing Illness', 'Specialty', 'One specific illness, in the skin, the breath and the effort, and never a general weakness.', 0.9),
  attr('playing_in_a_language_you_do_not_speak', 'Playing In A Language You Do Not Speak', 'Range', 'Lines learned phonetically, and real intention played through sounds you don’t understand.', 1, true),
  attr('playing_in_the_round', 'Playing In The Round', 'Stage', 'A full circle of audience fed by turning through a scene, and never visibly spinning.', 1.1),
  attr('playing_older', 'Playing Older', 'Range', 'Years added through weight, breath and pace, where a gray wig and a stoop would do nothing.'),
  attr('playing_opposite_yourself', 'Playing Opposite Yourself', 'Range', 'Both halves of a scene, shot against a double or a tennis ball, timing matched.', 1.1),
  attr('playing_out_of_sequence', 'Playing Out Of Sequence', 'Screen', 'You know where the character is emotionally, though the scene before it shoots three weeks from now.', 0.8),
  attr('playing_physical_impairment', 'Playing Physical Impairment', 'Range', 'Playing injury, disability or restricted movement accurately and without caricature.'),
  attr('playing_previews', 'Playing Previews', 'Stage', 'Tonight’s show, carrying this afternoon’s rewrites and new blocking.'),
  attr('playing_psychiatric_distress', 'Playing Psychiatric Distress', 'Specialty', 'Playing mania, psychosis or depression from researched detail, past the handful of tics people expect.', 0.8),
  attr('playing_the_clean_single', 'Playing The Clean Single', 'Screen', 'Holding a shot with nobody else in frame, playing the scene to an off-camera eyeline.', 0.9),
  attr('playing_the_comic', 'Playing The Comic', 'Comedy', 'The ridiculous half of a double act, bouncing the jokes off a straight partner.', 0.8),
  attr('playing_the_lens_size', 'Playing The Lens Size', 'Screen', 'Sizing the performance to the shot, from full-body work in a wide to a flicker in a big close-up.', 0.9),
  attr('playing_the_straight_man', 'Playing The Straight Man', 'Comedy', 'The sane half of a double act: you feed and react, and the partner scores.', 0.9),
  attr('playing_the_wide_shot', 'Playing The Wide Shot', 'Screen', 'Carrying a scene in full figure, where posture, walk and gesture do the work the face would.', 0.9),
  attr('playing_thought_on_camera', 'Playing Thought On Camera', 'Screen', 'A decision happens behind the eyes in close-up, and you never once indicate it.', 0.6),
  attr('playing_through_disruption', 'Playing Through Disruption', 'Stage', 'On through coughing, latecomers, and an alarm nobody can switch off.'),
  attr('playing_through_effects', 'Playing Through Effects', 'Screen', 'Keeping the scene steady through rain towers, wind machines, smoke and squibs.', 1.1),
  attr('playing_to_a_boom', 'Playing To A Boom', 'Screen', 'Keeping the voice consistent for a mic overhead, and not turning away from it on the quiet lines.', 1.2),
  attr('playing_to_an_absent_partner', 'Playing To An Absent Partner', 'Voice', 'Reacting to a scene partner who is a line on the page read flat by an engineer.', 0.8),
  attr('playing_to_blank_screens', 'Playing To Blank Screens', 'Screen', 'You react to a phone or a monitor that’s blank on set and gets its picture added later.', 1.2),
  attr('playing_to_the_audition_camera', 'Playing To The Audition Camera', 'Screen', 'The read, sized for the small camera in the corner of the casting room.', 1.2),
  attr('playing_without_context', 'Playing Without Context', 'Voice', 'You make a line work when nobody will say who’s listening or what just happened.', 0.9),
  attr('playing_younger', 'Playing Younger', 'Range', 'Losing years through posture, energy and unguarded reaction. Lighting and makeup do the rest.'),
  attr('podcast_drama', 'Podcast Drama', 'Voice', 'Cast scene work around one mic with the geography of the room done by voice.', 1.1),
  attr('post_audition_follow_up', 'Post-Audition Follow Up', 'Industry', 'The note that keeps you in mind without asking the office for anything.', 1.3),
  attr('postural_transformation', 'Postural Transformation', 'Range', 'Changing the shape you hold — spine, shoulders, head — until the body reads as another person.', 1.1),
  attr('posture_and_carriage', 'Posture And Carriage', 'Physical', 'How the spine, shoulders and head are held standing still, and what it says about the character.', 1.1, true),
  attr('pratfalls', 'Pratfalls', 'Comedy', 'You fall over safely and loudly, and it reads as funny and never as alarming.', 1.3, true),
  attr('preparation', 'Preparation', 'Professionalism', 'Arriving with the work already done.', 1.4),
  attr('preshow_routine', 'Preshow Routine', 'Stage', 'A warm-up, a call and a settled half hour that puts you on stage ready every time.', 1.4, true),
  attr('press_discipline', 'Press Discipline', 'Industry', 'You stay on message when the question is a trap.', 1.3),
  attr('press_junket_work', 'Press Junket Work', 'Industry', 'Giving forty roundtable interviews in a day and making the fortieth sound like the first.', 1.1, true),
  attr('pressure_tolerance', 'Pressure Tolerance', 'Professionalism', 'Performing while the schedule burns.'),
  attr('private_moment', 'Private Moment', 'Tradition', 'Something you’d only ever do alone, done in front of a class or a camera.', 0.9, true),
  attr('producer_relations', 'Producer Relations', 'Industry', 'Dealing with producers over money, schedule and script changes without becoming their problem.'),
  attr('professional_credibility', 'Professional Credibility', 'Range', 'You handle a job’s tools and routines so the people who do it for a living don’t wince.', 1.2),
  attr('projection', 'Projection', 'Voice', 'Filling a space without shouting.', 1.2, true),
  attr('promenade_staging', 'Promenade Staging', 'Stage', 'A standing audience moved to the next playing area and settled before you start.'),
  attr('promo_reads', 'Promo Reads', 'Voice', 'Network and trailer copy carrying urgency over music and cut picture.', 1.2),
  attr('pronunciation_research', 'Pronunciation Research', 'Voice', 'You chase down how a name, a foreign word or a piece of jargon is actually said, before the take.', 1.4),
  attr('prop_comedy', 'Prop Comedy', 'Comedy', 'Laughs out of objects that break, stick, spill, or refuse to work on cue.', 1.3, true),
  attr('prop_discipline', 'Prop Discipline', 'Stage', 'Props preset, handled and returned, so the next scene and the next night still work.', 1.4),
  attr('proscenium_staging', 'Proscenium Staging', 'Stage', 'One framed front, where every picture is seen from a single side.', 1.2),
  attr('prose_sight_reading', 'Prose Sight Reading', 'Voice', 'Reading a sentence cleanly first time with the eye already down on the next one.', 1.2, true),
  attr('prosthetic_makeup_endurance', 'Prosthetic Makeup Endurance', 'Specialty', 'Hours in the chair, then a full day’s work glued into appliances.', 0.9, true),
  attr('prosthetic_performance', 'Prosthetic Performance', 'Range', 'Playing through appliances, contacts and heavy makeup that fight every expression.', 1.2),
  attr('psychological_gesture', 'Psychological Gesture', 'Tradition', 'One big archetypal movement that holds the character’s want, then hidden in normal behavior.', 1.1, true),
  attr('public_solitude', 'Public Solitude', 'Craft', 'Staying private in your behavior with an audience or a crew standing a few feet away.', 0.8, true),
  attr('publicist_collaboration', 'Publicist Collaboration', 'Industry', 'Working with a publicist on what to say, what to skip and which outlets to take.', 1.2),
  attr('punchline_delivery', 'Punchline Delivery', 'Comedy', 'The last words of a joke landed cleanly, with the stress and the speed the punch needs.'),
  attr('punctuality', 'Punctuality', 'Professionalism', 'Being on set, ready, at call.', 1.5),
  attr('punctuation_reading', 'Punctuation Reading', 'Craft', 'The writer’s commas, dashes and periods, read as instructions for how a line moves.', 1.3),
  attr('puppet_lip_sync', 'Puppet Lip Sync', 'Specialty', 'A puppet mouth matched to live or recorded dialogue, syllable by syllable.', 1.3, true),
  attr('puppet_scene_partnering', 'Puppet Scene Partnering', 'Specialty', 'Playing a scene opposite a puppet or animatronic as if it were a live partner.', 1.2),
  attr('puppeteer_concealment', 'Puppeteer Concealment', 'Specialty', 'Staying low, still and out of frame in a hide, trench or blue suit while operating.', 1.3),
  attr('puppetry', 'Puppetry', 'Specialty', 'Operating a puppet with others so the audience watches it breathe instead of watching you.', 1.2),
  attr('put_in_rehearsal', 'Put In Rehearsal', 'Stage', 'One afternoon to slot into a running production, with a company you’ve never played with.', 1.1),
  attr('quarterstaff_work', 'Quarterstaff Work', 'Stage', 'Staff fighting at distance, with both ends live and the choreography kept clean.', 1.3, true),
  attr('quick_changes', 'Quick Changes', 'Stage', 'Out of one costume and into the next in ninety seconds with two dressers working on you.', 1.3, true),
  attr('quiet_script_handling', 'Quiet Script Handling', 'Professionalism', 'Turning pages and shifting your weight without the mic hearing any of it.', 1.5),
  attr('radiating_and_receiving', 'Radiating And Receiving', 'Tradition', 'You send energy out to your partner and take theirs in, without a word or a move.'),
  attr('radio_play_performance', 'Radio Play Performance', 'Tradition', 'A whole scene by voice alone, for a listener with no picture at all.'),
  attr('rage', 'Rage', 'Range', 'Anger with a specific engine behind it.', 0.9),
  attr('rain_and_immersion_endurance', 'Rain And Immersion Endurance', 'Specialty', 'Take after take under rain towers and dumps, and the shivering never shows.', 1, true),
  attr('raising_the_stakes', 'Raising The Stakes', 'Craft', 'What’s lost if the character fails, decided first, then played at that price.', 1.2),
  attr('raked_stage_work', 'Raked Stage Work', 'Stage', 'You stand, walk and dance on a sloped deck, and the body never fights the floor.', 1.2, true),
  attr('rap_delivery', 'Rap Delivery', 'Musical', 'You ride a beat with rhymed text, and the flow, breath and clarity all stay intact.', 1.1, true),
  attr('rapid_character_switching', 'Rapid Character Switching', 'Range', 'Snapping between many characters in a solo show with only voice, posture and focus to mark the change.', 0.9),
  attr('rapid_dialogue', 'Rapid Dialogue', 'Voice', 'Dialogue at high speed, and every single word still intelligible.', 1.2),
  attr('rapid_memorization', 'Rapid Memorization', 'Craft', 'Audition pages, off book, in an afternoon.', 1.2, true),
  attr('rapier_and_dagger', 'Rapier And Dagger', 'Stage', 'Fighting a set routine with a sword in one hand and a dagger in the other, at speed.', 1.2, true),
  attr('reaction_shots', 'Reaction Shots', 'Screen', 'You carry a cut with a response where somebody else would need a line.', 1.1),
  attr('reading_a_breakdown', 'Reading A Breakdown', 'Industry', 'Working out from the casting brief what the office is actually looking for.', 1.3),
  attr('reading_for_other_actors', 'Reading For Other Actors', 'Craft', 'Feeding lines through a long casting session and giving every auditionee the same read.', 1.3),
  attr('reading_sheet_music', 'Reading Sheet Music', 'Musical', 'A score followed for pitch, rhythm, cues and repeats, all the way through a rehearsal.', 1.4),
  attr('reading_the_house', 'Reading The House', 'Stage', 'What kind of audience is in tonight, heard, with size and pace moved to meet them.', 0.9),
  attr('reading_the_room', 'Reading The Room', 'Professionalism', 'Clocking which person in the room is deciding and what they are responding to.', 0.8),
  attr('reading_to_time', 'Reading To Time', 'Voice', 'Landing a piece of copy inside twenty-eight seconds without sounding rushed.', 1.4),
  attr('reading_with_a_reader', 'Reading With A Reader', 'Craft', 'Playing a full scene against a reader who gives flat lines and no eye contact.', 1.2, true),
  attr('received_pronunciation', 'Received Pronunciation', 'Voice', 'Speaking standard British RP, modern or period, without it turning into caricature.', 1.3),
  attr('recorded_delivery_technique', 'Recorded Delivery Technique', 'Craft', 'Performing from audio fed live to an earpiece, copying the speaker a beat behind.', 1.2, true),
  attr('recording_wild_lines', 'Recording Wild Lines', 'Screen', 'Delivering lines to a mic on set with no camera running, matching the level and energy of the scene.', 1.3),
  attr('red_carpet_presence', 'Red Carpet Presence', 'Industry', 'An appearance that turns into coverage.', 1.1),
  attr('red_carpet_work', 'Red Carpet Work', 'Industry', 'Working a step and repeat: photographers, carpet reporters and a moving line, on schedule.', 1, true),
  attr('refusing_work', 'Refusing Work', 'Professionalism', 'A role, a scene or a job turned down, and the offer side still calls again.', 0.8),
  attr('rehearsal_discipline', 'Rehearsal Discipline', 'Professionalism', 'You show up prepared, try what’s asked, and keep the work repeatable day to day.', 1.1),
  attr('rehearsal_improvisation', 'Rehearsal Improvisation', 'Craft', 'Working a scene off the text in exercises and bringing what you find back to the words.', 1.1),
  attr('rehearsal_room_discipline', 'Rehearsal Room Discipline', 'Professionalism', 'Arriving off book on schedule, marking when asked and keeping the room working.', 1.2),
  attr('relationship_mapping', 'Relationship Mapping', 'Craft', 'Who each character is to every other one, and what has already passed between them.', 1.3),
  attr('relaxation_technique', 'Relaxation Technique', 'Tradition', 'Held tension found and dropped, part by part through the body, before and during the work.', 1.3, true),
  attr('relaxed_performance_adjustment', 'Relaxed Performance Adjustment', 'Stage', 'A softened version of the show, for an audience free to move, talk and leave.', 1.2),
  attr('reliability', 'Reliability', 'Professionalism', 'Whether producers believe you’ll finish the job.', 1.2),
  attr('repeatable_emotional_beats', 'Repeatable Emotional Beats', 'Screen', 'The same tears, the same break, on take one and on take twelve, on the same word.', 0.7),
  attr('repeating_a_callback', 'Repeating A Callback', 'Craft', 'The take that got you the callback, reproduced beat for beat, two weeks later.'),
  attr('repetition_work', 'Repetition Work', 'Tradition', 'Meisner’s exercise: an observation repeated back and forth until behavior takes over from words.', 1.2, true),
  attr('reptile_and_insect_tolerance', 'Reptile And Insect Tolerance', 'Specialty', 'Snakes, spiders or insects crawl on you and you don’t flinch out of the take.', 0.7),
  attr('requesting_another_take', 'Requesting Another Take', 'Professionalism', 'One more go, asked for so it’s granted and not resented.'),
  attr('resetting_to_one', 'Resetting To One', 'Screen', 'Back to first positions, props and state, fast, so the next take starts clean.', 1.4),
  attr('residual_tracking', 'Residual And Payment Tracking', 'Industry', 'You read the residual statements, per diems and payments, and chase what hasn’t arrived.', 1.5),
  attr('resilience', 'Resilience', 'Professionalism', 'Recovering from a bad day, a bad review or a bad year.', 0.9),
  attr('restarting_a_stopped_show', 'Restarting A Stopped Show', 'Stage', 'A performance picked back up in front of the audience after it’s been halted.', 0.9),
  attr('restoration_comedy_style', 'Restoration Comedy Style', 'Tradition', 'Restoration comedy: long witty sentences, formal manners, and everybody sizing up everybody’s rank.', 1.1),
  attr('restraint', 'Restraint', 'Range', 'You withhold, and the audience leans in.', 0.8),
  attr('restricted_vision_performance', 'Restricted Vision Performance', 'Specialty', 'Finding marks and eyelines when a mask, helmet or suit leaves you nearly blind.', 1.1, true),
  attr('resume_building', 'Resume Building', 'Industry', 'Credits, training and skills on one page that reads at a glance.', 1.4),
  attr('revision_page_tracking', 'Revision Page Tracking', 'Professionalism', 'Colored revision pages kept up with, so you’re playing the current version of the scene.', 1.5),
  attr('rewrite_handling', 'Rewrite Handling', 'Professionalism', 'New pages the night before, and they’re in your mouth the next morning.', 1.2),
  attr('rhetorical_figures', 'Rhetorical Figures', 'Craft', 'You spot the lists, repetitions and builds a speech is made of, and you ride them.', 1.2),
  attr('rhyme_handling', 'Rhyme Handling', 'Craft', 'Landing a rhymed couplet so the rhyme is heard and doesn’t sound like a joke.', 1.2),
  attr('rhythmic_accuracy', 'Rhythmic Accuracy', 'Musical', 'Notes and steps placed exactly on the beat, or ahead of it, or behind it, on request.'),
  attr('riffing', 'Riffing', 'Comedy', 'Jokes on the spot, about whatever just happened in the room.', 0.8, true),
  attr('riffing_and_runs', 'Riffing And Runs', 'Musical', 'Fast melismatic decoration, improvised over a written melody.'),
  attr('roasting', 'Roasting', 'Comedy', 'Insult jokes about a person in the room, written and landed warm enough to work.'),
  attr('role_selection_judgment', 'Role Selection Judgment', 'Industry', 'Which offer on the table to take, and what taking it does to the next year.', 0.7),
  attr('role_shedding', 'Role Shedding', 'Range', 'You put a character down when the job ends, and your own habits come back.', 0.9),
  attr('romance', 'Romance', 'Range', 'Playing desire and tenderness credibly.', 0.9),
  attr('rule_of_three', 'Rule Of Three', 'Comedy', 'A run of gags where the third one snaps the pattern the first two set.', 1.5),
  attr('running_gags', 'Running Gags', 'Comedy', 'A gag repeated across a script with enough variation that it grows each time.', 1.2),
  attr('rythmo_band_reading', 'Rythmo Band Reading', 'Specialty', 'Reading a scrolling dub band and speaking it in sync at the same time.', 1.3, true),
  attr('safe_screaming', 'Safe Screaming', 'Voice', 'Producing a full-out scream on false folds and breath so the voice is intact for the next take.'),
  attr('safety_awareness', 'Safety Awareness', 'Professionalism', 'Recognizing when a setup isn’t safe.', 1.4),
  attr('safety_protocol_compliance', 'Safety Protocol Compliance', 'Professionalism', 'The safety meeting, the stunt plan and the weapons protocol, followed exactly as briefed.', 1.4),
  attr('same_day_rewrite_handling', 'Same Day Rewrite Handling', 'Professionalism', 'New pages that arrive an hour before the scene shoots, learned and played.', 1.2, true),
  attr('scaling_to_the_house', 'Scaling To The House', 'Stage', 'Voice and gesture sized to a 90-seat studio or a 2,000-seat house, on the same tour.', 1.1),
  attr('scansion', 'Scansion', 'Craft', 'Marking the stresses, feet and irregular lines in verse to hear what the meter is doing.', 1.3),
  attr('scene_editing_and_sweeps', 'Scene Editing And Sweeps', 'Comedy', 'An improv scene cut at its peak, by a sweep across or a call from the back line.', 1.4, true),
  attr('scene_function', 'Scene Function', 'Craft', 'What a scene does for the story, and what would be missing without it.', 1.3),
  attr('scene_work_with_child_actors', 'Scene Work With Child Actors', 'Specialty', 'You play to a child at their pace, and keep the scene alive around their few good takes.'),
  attr('schedule_discipline', 'Schedule Discipline', 'Professionalism', 'A pace that gets the day’s scheduled pages shot before the day runs out.', 1.1),
  attr('scleral_lens_tolerance', 'Scleral Lens Tolerance', 'Specialty', 'Blackout or scleral lenses in, and you still hit marks and hold a steady gaze.', 1, true),
  attr('scoring_a_scene', 'Scoring A Scene', 'Craft', 'Marking a scene up on the page with beats, actions and shifts before you rehearse it.', 1.3),
  attr('screaming_technique', 'Screaming Technique', 'Voice', 'Screaming flat out and still having a voice for the afternoon session.', 0.9, true),
  attr('screen_drinking_technique', 'Screen Drinking Technique', 'Specialty', 'Prop spirits, pints and shots downed on camera, with no choking and no lost line.', 1.3),
  attr('screen_fighting', 'Screen Fighting', 'Physical', 'Fight work built for a lens and an edit.', 1.2, true),
  attr('screen_martial_arts', 'Screen Martial Arts', 'Specialty', 'Kicks, forms and exchanges shot big and clean, learned as choreography and never as sparring.', 1, true),
  attr('screen_nudity_composure', 'Screen Nudity Composure', 'Specialty', 'Staying loose and in character while working undressed in front of a crew.', 0.9),
  attr('screen_test', 'Screen Test', 'Screen', 'The scene on a lit set, in wardrobe and makeup, with a full crew watching.', 0.9),
  attr('screen_test_composure', 'Screen Test Composure', 'Industry', 'You hold up with the studio in the room.'),
  attr('screenplay_fluency', 'Screenplay Fluency', 'Screen', 'You read a shooting script, slug lines, revision marks and colored pages, without once stumbling.', 1.4),
  attr('script_analysis', 'Script Analysis', 'Craft', 'Structure, intent and opportunity, all of it in the text if you look.', 1.2),
  attr('script_marking', 'Script Marking', 'Professionalism', 'Marking a script for stress, breath and sync so the page tells you what to do.', 1.4),
  attr('script_supervisor_collaboration', 'Script Supervisor Collaboration', 'Professionalism', 'Your moves and lines match take to take, and the continuity notes get taken without fuss.', 1.3),
  attr('second_language_performance', 'Second Language Performance', 'Range', 'Acting in a language you speak, at something near the level you reach in your first.', 1, true),
  attr('seizure_portrayal', 'Seizure Portrayal', 'Specialty', 'Playing a seizure to a researched pattern without hurting yourself on the floor.'),
  attr('self_direction', 'Self Direction', 'Professionalism', 'You hear the take you just gave, and you know what the next one needs.', 0.9),
  attr('self_submission', 'Self Submission', 'Industry', 'Trawling breakdowns daily and submitting only for the roles that are genuinely yours.', 1.4),
  attr('self_tape_craft', 'Self-Tape Craft', 'Industry', 'Frame, sound and performance, out of your own living room.', 1.4),
  attr('self_tape_editing', 'Self-Tape Editing', 'Screen', 'Trimming, joining and topping and tailing takes into one clean file.', 1.5),
  attr('self_tape_eyeline', 'Self-Tape Eyeline', 'Screen', 'The reader goes just off lens, so the eyeline sits where casting expects it.', 1.4),
  attr('self_tape_framing', 'Self-Tape Framing', 'Screen', 'Shot size, headroom and background, set so the tape matches what was asked for.', 1.5),
  attr('self_tape_lighting', 'Self-Tape Lighting', 'Screen', 'You light your own face with lamps, a window and a bounce, and the tape reads clean.', 1.5),
  attr('self_tape_sound', 'Self-Tape Sound', 'Screen', 'Clean audio at home, around mic placement, room echo, traffic and the refrigerator.', 1.5),
  attr('sense_memory', 'Sense Memory', 'Craft', 'Heat, cold, taste, weight or texture, with nothing actually there.', 1, true),
  attr('set_etiquette', 'Set Etiquette', 'Professionalism', 'Knowing how a set runs and not getting in its way.', 1.4),
  attr('set_list_construction', 'Set List Construction', 'Comedy', 'Standup material ordered so the set builds and closes on the strongest bit.', 1.4),
  attr('shared_lines', 'Shared Lines', 'Craft', 'Picking up a split verse line on the beat so the meter completes across two actors.', 1.3),
  attr('shooting_isolated_reactions', 'Shooting Isolated Reactions', 'Screen', 'Giving a reaction on its own at the end of the day, to a line nobody is saying.', 0.9),
  attr('shooting_reel_material', 'Shooting Reel Material', 'Industry', 'Writing, casting and shooting your own scenes when there’s no footage to cut.', 1.2),
  attr('short_form_improv', 'Short Form Improv', 'Comedy', 'Improv games with rules, buzzers and quick switches, in front of an audience.', 1.3, true),
  attr('showreel_editing', 'Showreel Editing', 'Industry', 'Cutting the reel for order, length and a first ten seconds that hold.', 1.3),
  attr('showreel_material_selection', 'Showreel Material Selection', 'Industry', 'Which clips go in the reel, and which good work gets left out.', 1.2),
  attr('sides_breakdown', 'Sides Breakdown', 'Craft', 'Who wants what, and from whom, in the two pages the casting office sent.', 1.2),
  attr('sight_gags', 'Sight Gags', 'Comedy', 'Building a laugh out of something the audience sees. Nobody has to say a word.', 1.2),
  attr('sight_reading_aloud', 'Sight Reading Aloud', 'Voice', 'Reading unseen text out loud with your eyes far enough ahead to act it.', 1.2),
  attr('sight_singing', 'Sight Singing', 'Musical', 'A vocal line read off the page and sung correctly the first time through.', 1.3),
  attr('sightline_awareness', 'Sightline Awareness', 'Stage', 'You stand where the whole house can see you, and the thing in your hand, from every seat.', 1.3),
  attr('sign_language_performance', 'Sign Language Performance', 'Range', 'Signing with correct grammar and facial grammar, not just approximate hand shapes.', 1.1, true),
  attr('silent_breathing', 'Silent Breathing', 'Voice', 'A full breath mid-scene, and neither the microphone nor the front row hears you take it.', 1.3),
  attr('silent_storytelling', 'Silent Storytelling', 'Screen', 'The whole story, with no dialogue at all.', 0.9),
  attr('simulated_sex_scene_work', 'Simulated Sex Scene Work', 'Specialty', 'Playing the rhythm and escalation of sex while keeping contact inside the agreed choreography.'),
  attr('singing', 'Singing', 'Voice', 'Whether a musical number can be performed live or at all.', 1, true),
  attr('singing_in_character', 'Singing In Character', 'Musical', 'The role’s voice, accent and intention all intact, with the notes hit as written.', 0.9),
  attr('singing_in_dialect', 'Singing In Dialect', 'Musical', 'A dialect’s vowels kept through sung lines, with the tone left intact.', 1.1),
  attr('singing_while_dancing', 'Singing While Dancing', 'Musical', 'Tone and breath held through full-out choreography, both at once.', 1.1, true),
  attr('sketch_character_playing', 'Sketch Character Playing', 'Comedy', 'You commit hard to a broad sketch character for three minutes, and then drop it.', 1.1),
  attr('sketch_writing', 'Sketch Writing', 'Comedy', 'A short comic scene with a premise, a heightening pattern, and a blackout.', 1.1),
  attr('slapstick', 'Slapstick', 'Comedy', 'Fake slaps, kicks and knocks traded with a partner at speed, and nobody gets hurt.', 1.2, true),
  attr('slate_and_take_discipline', 'Slate And Take Discipline', 'Professionalism', 'Clean slates, numbered takes and files an editor can cut without calling you.', 1.5),
  attr('slating', 'Slating', 'Screen', 'Name, height, agent and profile turns to camera, before the take.', 1.5),
  attr('slow_burn', 'Slow Burn', 'Comedy', 'A reaction builds over several seconds, calm to boiling, while the audience watches.', 0.9),
  attr('smoking_on_camera', 'Smoking On Camera', 'Specialty', 'A herbal cigarette lit, held and drawn on so it reads as habit and matches take to take.', 1.3),
  attr('social_instinct', 'Social Media Instinct', 'Industry', 'You can feel what an audience will actually engage with.', 1.2),
  attr('social_media_management', 'Social Media Management', 'Industry', 'Posting, promoting and staying quiet on your own accounts without creating a story.', 1.2, true),
  attr('soliloquy_and_direct_address', 'Soliloquy And Direct Address', 'Tradition', 'You talk straight to the house in soliloquy, thinking the thought out loud in front of them.'),
  attr('soliloquy_work', 'Soliloquy Work', 'Stage', 'A speech alone on stage as live thought, with the audience as the other party.'),
  attr('solo_show_building', 'Solo Show Building', 'Craft', 'Shaping your own material into a one person show that runs an hour with nobody else on it.', 0.9),
  attr('song_and_dance_exercise', 'Song And Dance Exercise', 'Tradition', 'Strasberg’s exercise of holding one sustained note then breaking into movement to expose habits.', 1.2, true),
  attr('source_material_study', 'Source Material Study', 'Craft', 'You read the novel, case file or history a script came from, and you use what’s in it.', 1.3),
  attr('southern_american_speech', 'Southern American Speech', 'Voice', 'The American South, kept specific to a state. One general drawl fools nobody.', 1.3),
  attr('speaking_in_prosthetics', 'Speaking In Prosthetics', 'Specialty', 'Staying intelligible through fangs, dentures, a mask or a full face appliance.', 1.2),
  attr('speaking_over_underscore', 'Speaking Over Underscore', 'Musical', 'Spoken lines timed to land on the right bars of the music running underneath.', 1.3),
  attr('speech_ear_training', 'Speech Ear Training', 'Voice', 'Hearing the small differences between two vowels or two speakers and naming what changed.', 0.8),
  attr('spine_of_the_character', 'Spine Of The Character', 'Craft', 'The single idea that organizes everything the character does.', 1.2),
  attr('spit_take', 'Spit Take', 'Comedy', 'A mouthful of drink sprayed on cue, timed to the line that causes it.', 1.4, true),
  attr('stage_business', 'Stage Business', 'Stage', 'Pouring, cooking, sewing or loading a gun, with the scene played on top of it.', 1.2),
  attr('stage_combat', 'Stage Combat', 'Physical', 'Safe, readable fight work for a live eye.', 1.2, true),
  attr('stage_directions', 'Stage Directions', 'Craft', 'You can tell the writer’s intended directions from a stage manager’s record of an old production.', 1.3),
  attr('stage_door_greeting', 'Stage Door Greeting', 'Professionalism', 'The crowd at the stage door after a show: you sign, and you keep the line moving.', 1.2),
  attr('stage_geography', 'Stage Geography', 'Stage', 'Upstage, downstage, prompt side and OP land as instructions, with nothing to translate.', 1.5),
  attr('stage_management_compliance', 'Stage Management Compliance', 'Professionalism', 'Signed in, on your calls, blocking and timings held exactly as stage management set them.', 1.4),
  attr('stage_projection', 'Stage Projection', 'Stage', 'You fill a room to the back row without shouting, and the sense of the line survives.', 1.2, true),
  attr('stage_whisper', 'Stage Whisper', 'Voice', 'A whisper that carries to the back row and still sounds like a whisper.', 1.2),
  attr('staged_reading', 'Staged Reading', 'Stage', 'A script off the page at a music stand, after a single day of rehearsal.', 1.2),
  attr('stamina', 'Stamina', 'Physical', 'Holding up across a fourteen-hour day.', 1.4, true),
  attr('standby_readiness', 'Standby Readiness', 'Professionalism', 'Warm, dressed and still in the scene, through hours of waiting between setups.', 1.1),
  attr('standup_delivery', 'Standup Delivery', 'Comedy', 'You work a microphone alone on stage, and a room of strangers keeps laughing.', 1, true),
  attr('staying_in_frame', 'Staying In Frame', 'Screen', 'Keeping the performance inside a locked-off frame while still moving and turning.', 1.3),
  attr('stillness', 'Stillness', 'Screen', 'You do almost nothing, and you’re still the one being watched.', 0.9),
  attr('stillness_on_camera', 'Stillness On Camera', 'Screen', 'Doing almost nothing in front of the lens and staying alive while you do it.', 0.7),
  attr('studio_vocal_session', 'Studio Vocal Session', 'Musical', 'Repeatable booth takes, and earlier ones matched for punch-ins.', 1.3),
  attr('stunt_aptitude', 'Stunt Aptitude', 'Physical', 'How much of the dangerous work insurance will let you do.', 0.9, true),
  attr('stunt_coordination', 'Stunt Coordination', 'Specialty', 'You design the sequence, break it into beats, and run it so nobody gets hurt.'),
  attr('substitution', 'Substitution', 'Craft', 'The person or thing in the script becomes someone real to you who gets the same response out of you.', 0.9),
  attr('subtext', 'Subtext', 'Craft', 'Playing what the character means underneath what the character says.', 0.9),
  attr('sung_diction', 'Sung Diction', 'Musical', 'Consonants and vowels shaped so the lyric stays clear over a band or an orchestra.', 1.3),
  attr('super_objective', 'Super Objective', 'Craft', 'The one want that drives the character across the whole script.', 1.3),
  attr('supporting_role_economy', 'Supporting Role Economy', 'Range', 'Making a handful of scenes land without pulling the story toward you.'),
  attr('suriashi_sliding_walk', 'Suriashi Sliding Walk', 'Physical', 'Across the noh stage in the sliding walk: feet never leave the boards, torso stays still.', 0.9, true),
  attr('sustained_character_immersion', 'Sustained Character Immersion', 'Range', 'Staying inside a role between takes or across a run without losing the ability to take a note.', 0.9),
  attr('suzuki_movement_training', 'Suzuki Movement Training', 'Physical', 'Stamps, a low center and held positions, all kept clean while the legs are shaking.', 1, true),
  attr('swimming_for_camera', 'Swimming For Camera', 'Specialty', 'Swimming, floating and going under repeatedly on a cold day while still playing the scene.', 1.2, true),
  attr('swing_track_retention', 'Swing Track Retention', 'Stage', 'Several ensemble tracks carried at once, and switched between on a day’s notice.', 1, true),
  attr('voice_switching', 'Switching Between Characters', 'Range', 'Moving between several characters in one session without either of them drifting.'),
  attr('table_read', 'Table Read', 'Professionalism', 'Reading a script aloud around a table with the whole cast and hearing what the thing is.', 1.2),
  attr('table_read_conduct', 'Table Read Conduct', 'Professionalism', 'A read at the table for a room of executives: full level, and not a performance.', 1.2),
  attr('table_work', 'Table Work', 'Craft', 'Sitting round the script with the director and company and arguing out meaning line by line.', 1.2),
  attr('tableau_vivant', 'Tableau Vivant', 'Tradition', 'The company freezes into a clear picture at the act end, and holds it still.', 1.3),
  attr('tactics', 'Tactics', 'Craft', 'What a character does to get their way, and the switch when it stops working.', 1.1),
  attr('tag_outs', 'Tag Outs', 'Comedy', 'A player tapped out, and the same joke restarts in a new setting.', 1.3, true),
  attr('take_consistency', 'Take Consistency', 'Craft', 'You repeat a performance precisely enough for the edit to cut.', 0.9),
  attr('taking_a_note', 'Taking A Note', 'Professionalism', 'You hear an adjustment, understand it, and it’s in the next take without argument.', 1.1),
  attr('taking_a_redirect', 'Taking A Redirect', 'Craft', 'Changing the read on the spot when the room gives a note, and actually changing it.'),
  attr('taking_adjustments_between_takes', 'Taking Adjustments Between Takes', 'Screen', 'Absorbing a note between takes and putting it in on the next one without losing what worked.'),
  attr('taking_booth_direction', 'Taking Booth Direction', 'Professionalism', 'A note through the talkback becomes a different take on the very next pass.', 1.1),
  attr('taking_direction', 'Taking Direction', 'Professionalism', 'Turning a note into a change in the next run without arguing it first.', 1.1),
  attr('talk_show_guesting', 'Talk Show Guesting', 'Industry', 'Landing a rehearsed anecdote on a couch, playing the game and getting off on time.', 1, true),
  attr('talk_singing', 'Talk Singing', 'Musical', 'Half-speaking a melody on pitch, the way songs written for non-singers ask for.', 1.2),
  attr('tap_dance', 'Tap Dance', 'Musical', 'Clean sounds from the feet, in time, loud enough to carry to the back of the house.', 1.1, true),
  attr('tape_delivery', 'Tape Delivery', 'Industry', 'The file named, compressed and uploaded exactly as the brief asked, before the deadline.', 1.5),
  attr('tear_stick_technique', 'Tear Stick Technique', 'Specialty', 'Tear sticks, menthol and glycerin, used to set an eye running without redness or sting.', 1.5),
  attr('technical_dialogue_fluency', 'Technical Dialogue Fluency', 'Range', 'Jargon at the speed of a person who says it daily and is thoroughly bored of it.', 1.4),
  attr('technical_rehearsal_stamina', 'Technical Rehearsal Stamina', 'Stage', 'Hours of cue to cue under the lights, and you’re still usable at the end.', 1.2),
  attr('text_cutting', 'Text Cutting', 'Craft', 'Trimming a speech or a script for length without losing the sense or the shape.', 1.2),
  attr('the_harold', 'The Harold', 'Comedy', 'The three-beat Harold structure, with group games between the rounds of scenes.', 1.4, true),
  attr('the_magic_if', 'The Magic If', 'Craft', 'What would you do if the circumstances were real? Then you go and do that.', 1.2),
  attr('the_moment_before', 'The Moment Before', 'Craft', 'What happened to the character in the minute before the scene starts.', 1.2),
  attr('the_pause', 'The Pause', 'Comedy', 'A silence before or after a line, stretched as long as the room will take it.', 0.8),
  attr('thought_structure', 'Thought Structure', 'Craft', 'Following a long sentence through to its end so a complicated thought arrives in one piece.'),
  attr('through_line_of_action', 'Through Line Of Action', 'Craft', 'Each scene’s objective linked into one unbroken line, first page to last.', 1.2),
  attr('thrust_stage_work', 'Thrust Stage Work', 'Stage', 'Three sides played to, so no part of the house spends the scene looking at your back.', 1.2),
  attr('timecode_and_cue_reading', 'Timecode And Cue Reading', 'Specialty', 'Working off streamers, beeps and numbers on a monitor while acting.', 1.4, true),
  attr('timing_to_the_camera_move', 'Timing To The Camera Move', 'Screen', 'A line or a turn paced so it lands exactly as the dolly, crane or push arrives.', 1.2),
  attr('topping_and_capping', 'Topping And Capping', 'Comedy', 'You answer a partner’s joke with a bigger one, and that closes the exchange.', 1.1),
  attr('touring_adaptation', 'Touring Adaptation', 'Stage', 'A fixed production refitted into a different stage, rake and set of sightlines every week.', 1.2),
  attr('tragedy', 'Tragedy', 'Range', 'Carrying a story that ends badly and earning it.', 0.8),
  attr('transatlantic_speech', 'Transatlantic Speech', 'Voice', 'The clipped mid-Atlantic stage and screen speech of the nineteen thirties and forties.', 1.3),
  attr('transference', 'Transference', 'Tradition', 'Hagen’s form of substitution, carrying a real relationship of your own into the fictional one.', 0.9),
  attr('traverse_staging', 'Traverse Staging', 'Stage', 'Working a long narrow strip with the audience banked on two facing sides.', 1.2),
  attr('turnaround_tracking', 'Turnaround And Hours Tracking', 'Professionalism', 'You track your own hours, meal breaks and turnaround, and speak up when they’re broken.', 1.4),
  attr('turns_and_spotting', 'Turns And Spotting', 'Physical', 'Several revolutions on one leg, with the head spotting to keep it clean and upright.', 1, true),
  attr('twin_and_dual_roles', 'Twin And Dual Roles', 'Range', 'Playing two characters in one story and keeping them separate enough to tell apart at a glance.'),
  attr('unarmed_stage_combat', 'Unarmed Stage Combat', 'Stage', 'Punches, slaps, chokes and throws sold to the house with the knap on time and nobody touched.', 1.3, true),
  attr('understudying', 'Understudying', 'Stage', 'A part you may never play, learned and kept ready on almost no rehearsal.', 1.1, true),
  attr('underwater_scene_work', 'Underwater Scene Work', 'Specialty', 'You act, hit marks and hold an expression, fully submerged.', 0.9, true),
  attr('uniformed_role_credibility', 'Uniformed Role Credibility', 'Range', 'Drill, weapon handling, radio discipline and how a uniform sits on a body used to it.', 1.3, true),
  attr('union_rule_knowledge', 'Union Rule Knowledge', 'Professionalism', 'You know what your union contract covers, from meal penalties to what counts as a stunt.', 1.5, true),
  attr('unison_dancing', 'Unison Dancing', 'Physical', 'Timing, arm lines and spacing matched to the dancers beside you, so the group reads as one.', 1.1),
  attr('verbatim_transcript_fidelity', 'Verbatim Transcript Fidelity', 'Craft', 'An interview transcript delivered exactly as spoken, stumbles, repeats and dead ends and all.', 1.1),
  attr('verse_and_prose_shifts', 'Verse And Prose Shifts', 'Craft', 'Noticing when a character moves between verse and prose and playing what the change means.', 1.3),
  attr('verse_speaking', 'Verse Speaking', 'Voice', 'Speaking iambic pentameter so the meter holds and the sense still lands.', 1, true),
  attr('vibrato_control', 'Vibrato Control', 'Musical', 'Vibrato turned on and off, and its speed and width adjusted at will.', 1.1),
  attr('viewpoints', 'Viewpoints', 'Physical', 'You improvise from tempo, duration, shape and spatial relationship with the rest of the ensemble.', 1.2),
  attr('viewpoints_composition', 'Viewpoints Composition', 'Physical', 'Tempo, duration, spatial relationship and shape, used to compose stage material with a group.', 1.2),
  attr('vocal_age_range', 'Vocal Age Range', 'Range', 'Playing a child, a young adult and a very old person on the same instrument.', 0.7),
  attr('vocal_aging', 'Vocal Aging', 'Voice', 'Playing decades older or younger with breath, pitch and tremor, before makeup gets a say.'),
  attr('vocal_care', 'Vocal Care', 'Professionalism', 'Warm ups, water, steam and stopping before something tears.', 1.3),
  attr('vocal_color', 'Vocal Color', 'Voice', 'The texture of the tone, warm or hard or bright, changed to fit the moment.', 0.9),
  attr('vocal_dynamics', 'Vocal Dynamics', 'Voice', 'Volume from a murmur to full cry and back, inside one speech.', 1.1),
  attr('vocal_grit_and_rasp', 'Vocal Grit And Rasp', 'Musical', 'Controlled distortion added to the tone, with the cords left in one piece.', 1, true),
  attr('vocal_marking', 'Vocal Marking', 'Voice', 'Rehearsing at half voice so the full one is still there for the take or the show.', 1.3),
  attr('vocal_microphone_technique', 'Vocal Microphone Technique', 'Musical', 'Distance and angle worked on a mic, so loud and soft notes both sit right.', 1.4),
  attr('vocal_mimicry', 'Vocal Mimicry', 'Range', 'Hearing a voice once and giving it back — pitch, placement and rhythm.', 0.7),
  attr('vocal_placement', 'Vocal Placement', 'Voice', 'The voice goes forward in the mask, back in the throat, or wherever the character sits.'),
  attr('vocal_range', 'Vocal Range', 'Voice', 'Pitch and register available to the performer.', 0.8),
  attr('vocal_recovery', 'Vocal Recovery', 'Voice', 'Steaming, resting and backing off in time so a tired or bruised voice comes back by call.', 1.2),
  attr('vocal_registers', 'Vocal Registers', 'Voice', 'Moving between chest, mixed and head voice in speech without an audible crack at the join.'),
  attr('resonance', 'Vocal Resonance', 'Voice', 'The weight and color a voice carries.', 0.7),
  attr('vocal_stamina', 'Vocal Stamina', 'Voice', 'You survive a screaming scene on take nineteen.', 1, true),
  attr('vocal_warm_up', 'Vocal Warm Up', 'Voice', 'Running a warm-up that gets the voice ready in the ten minutes you actually have.', 1.4),
  attr('voice_audition_recording', 'Voice Audition Recording', 'Industry', 'Cutting your own audition at home with a slate, two takes and no processing.', 1.4),
  attr('voice_matching', 'Voice Matching', 'Specialty', 'One specific person’s voice, close enough to double or dub them.', 0.8),
  attr('voice_on_the_capture_stage', 'Voice On The Capture Stage', 'Specialty', 'Keeping the voice usable while moving, fighting and wearing a head rig.'),
  attr('voice_under_exertion', 'Voice Under Exertion', 'Voice', 'Speaking clearly while running, fighting or lifting, with the breath still under control.', 1.1),
  attr('voice_over', 'Voice-Over Technique', 'Voice', 'Carrying a character with voice alone.', 1.2),
  attr('vomiting_acting', 'Vomiting Acting', 'Specialty', 'You sell the retch, the timing and the aftermath of being sick, with a mouth rig or without.', 1.1),
  attr('vulnerability', 'Vulnerability', 'Range', 'Being seen without defending yourself.', 0.7),
  attr('walking_in_heels', 'Walking In Heels', 'Physical', 'Across a raked stage or a cobbled street in heels, and you never look down.', 1.4, true),
  attr('walking_into_the_room', 'Walking Into The Room', 'Professionalism', 'The first thirty seconds of greeting the panel, handing over the headshot and finding the mark.', 1.1, true),
  attr('water_sleeve_technique', 'Water Sleeve Technique', 'Physical', 'The long silk sleeves thrown, folded and flicked, so they land clean and read as feeling.', 1.1, true),
  attr('water_tank_safety_discipline', 'Water Tank Safety Discipline', 'Professionalism', 'Safety diver signals, bail-out drills and tank rules, followed take after take.', 1.4, true),
  attr('wayang_kulit_puppetry', 'Wayang Kulit Puppetry', 'Specialty', 'Handling the flat leather figures against the screen and voicing every one of them.', 0.9, true),
  attr('weapons_handling', 'Weapons Handling', 'Physical', 'Safe, credible handling of prop weapons.', 1.3),
  attr('weight_gain_for_a_role', 'Weight Gain For A Role', 'Range', 'Weight put on to a production schedule, and the work stays good while you carry it.', 1.2, true),
  attr('weight_loss_for_a_role', 'Weight Loss For A Role', 'Range', 'Weight taken off for a part, with focus, stamina and health all intact at the end.', 1.2, true),
  attr('what_others_say', 'What Others Say', 'Craft', 'Collecting every line other characters say about yours and deciding which of it to believe.', 1.3),
  attr('wheelchair_use_on_camera', 'Wheelchair Use On Camera', 'Specialty', 'You drive, transfer and rest in a chair the way a person who uses one every day does.', 1.2, true),
  attr('whisper_technique', 'Whisper Technique', 'Voice', 'Intimate delivery that still cuts through a mix.', 1.1),
  attr('whispering_on_mic', 'Whispering On Mic', 'Voice', 'Working a breathy, near-silent line close to a microphone without popping, hissing or clipping.', 1.3),
  attr('wide_shot_presence', 'Wide Shot Presence', 'Screen', 'You read clearly even when the camera is a long way off.'),
  attr('wing_discipline', 'Wing Discipline', 'Stage', 'Silence, traffic and standing by in the dark inches from a live stage.', 1.4),
  attr('wire_work', 'Wire Work', 'Specialty', 'Flying, jerking and landing on a harness while the rig does half of it and you sell the rest.', 1.1, true),
  attr('working_a_casting_director', 'Working A Casting Director', 'Industry', 'Keeping a casting office in touch with you between jobs without becoming a nuisance.'),
  attr('working_a_producer_session', 'Working A Producer Session', 'Professionalism', 'A read for a room of producers and executives who are mostly looking at laptops.', 0.9),
  attr('working_alone_in_the_booth', 'Working Alone In The Booth', 'Professionalism', 'Energy and judgment held up with no cast, no audience and the door shut.', 0.9),
  attr('working_in_a_body_rig', 'Working In A Body Rig', 'Screen', 'Acting with a camera strapped to your chest or head, ignoring the weight and the lens inches away.'),
  attr('working_in_an_led_volume', 'Working In An LED Volume', 'Screen', 'An environment on a wall of screens: you use the light it throws and ignore the seams.', 1.2),
  attr('working_in_coverage', 'Working In Coverage', 'Screen', 'The same scene again at each new size and angle, so the pieces cut together.', 1.1),
  attr('working_the_reverse', 'Working The Reverse', 'Screen', 'Playing the scene again after the turnaround, matching the timing and looks given in the first setup.', 1.1),
  attr('working_to_a_tennis_ball', 'Working To A Tennis Ball', 'Screen', 'Playing a full scene to a ball on a stick standing in for a character that gets added later.', 1.1),
  attr('working_with_a_body_double', 'Working With A Body Double', 'Screen', 'You set a double up so the handover is invisible: posture, walk and hand positions all matched.', 1.1),
  attr('working_with_a_handheld_operator', 'Working With A Handheld Operator', 'Screen', 'You leave the operator room to move in tight quarters, and the scene stays loose.', 1.1),
  attr('working_with_a_steadicam', 'Working With A Steadicam', 'Screen', 'Moving through a scene with an operator walking with you, holding pace and distance as you go.', 1.2),
  attr('working_with_an_earpiece', 'Working With An Earpiece', 'Screen', 'Lines or direction come through an earpiece and you play them as your own thought.', 1.1),
  attr('working_with_infants', 'Working With Infants', 'Specialty', 'A usable scene out of a baby who takes no direction and works in short bursts.'),
  attr('working_with_non_actors', 'Working With Non-Actors', 'Specialty', 'You build a scene with a person who has never acted and can’t repeat what they just did.'),
  attr('working_with_vfx_plates', 'Working With VFX Plates', 'Screen', 'Your action matches a plate shot somewhere else, so the two layers line up in the composite.', 1.1),
  attr('working_without_sides', 'Working Without Sides', 'Craft', 'An audition built from a character brief alone, because no script has been released.', 0.9),
  attr('yes_and', 'Yes And', 'Comedy', 'You accept a partner’s offer in improv, and you put new information on top of it.', 1.3, true),
] as const;

if (ATTRIBUTES.length !== 813) {
  throw new Error(`SLATE expects exactly 813 acting skills; found ${ATTRIBUTES.length}.`);
}

export const ATTRIBUTE_IDS: readonly string[] = ATTRIBUTES.map((a) => a.id);
export const ATTRIBUTE_BY_ID: Readonly<Record<string, AttributeDef>> =
  Object.fromEntries(ATTRIBUTES.map((a) => [a.id, a]));

export const ATTRIBUTE_GROUPS: readonly AttributeGroup[] = [
  'Craft', 'Voice', 'Physical', 'Screen', 'Stage', 'Range',
  'Comedy', 'Musical', 'Specialty', 'Professionalism', 'Industry', 'Tradition',
];

export function attributesInGroup(group: AttributeGroup): AttributeDef[] {
  return ATTRIBUTES.filter((a) => a.group === group);
}

/**
 * A person's 0-100 acting ratings: one base, and the exceptions to it.
 *
 * Writing all 813 out was the obvious shape and the wrong one. A person is
 * mostly unexceptional, so almost every entry repeated the same number: 20KB
 * of JSON per person to say one thing, and at a thousand people a 20MB save
 * and 63ms of `structuredClone` on every single command, because the engine
 * snapshots the universe before each one. Measured, both of them.
 *
 * So the base carries the answer for anything not named, and `of` carries only
 * what differs. A thousand people costs 7.5ms and 1.2MB instead. Read through
 * `rate`; never index `of` directly, because an id missing from it is not a
 * zero, it is the base.
 */
export interface AttributeSheet {
  /** What every attribute is, unless `of` says otherwise. */
  base: number;
  /** Only the ids that differ from the base. */
  of?: Record<string, number>;
}

/** What an attribute actually is on this sheet. */
export function rate(sheet: AttributeSheet, id: string): number {
  return sheet.of?.[id] ?? sheet.base;
}

/** A sheet where everything is `base`, except what is named. */
export function sheetOf(base: number, of?: Record<string, number>): AttributeSheet {
  const exceptions = Object.fromEntries(Object.entries(of ?? {}).filter(([, v]) => v !== base));
  return Object.keys(exceptions).length > 0 ? { base, of: exceptions } : { base };
}

export function emptyAttributeSheet(base = 10): AttributeSheet {
  return { base };
}

export function groupAverage(sheet: AttributeSheet, group: AttributeGroup): number {
  const defs = attributesInGroup(group);
  if (defs.length === 0) return 0;
  return defs.reduce((s, d) => s + rate(sheet, d.id), 0) / defs.length;
}

export function overallRating(sheet: AttributeSheet): number {
  // With no exceptions there is nothing to average: every attribute is the
  // base. Worth saying out loud, because it is the common case.
  if (!sheet.of) return sheet.base;
  let total = 0;
  for (const a of ATTRIBUTES) total += rate(sheet, a.id);
  return total / ATTRIBUTES.length;
}

// ---------------------------------------------------------------------------
// Traits
// ---------------------------------------------------------------------------

import { performerTitleOf, type PerformerTitle } from '../core/performer';

export type TraitCategory =
  | 'Talent' | 'Method' | 'Temperament' | 'Public' | 'Social' | 'Life' | 'Genre';

export interface TraitDef {
  id: string;
  name: string;
  /**
   * The two forms of a name that carries the word, for the traits where the
   * business has one of each: a method actor and a method actress. The plain
   * name is the performer's, and a screen that knows whose sheet it is renders
   * the right one through `traitName`.
   */
  nameByTitle?: Readonly<Record<PerformerTitle, string>>;
  category: TraitCategory;
  description: string;
  /**
   * The profession this trait belongs to. Absent, it is an acting trait and
   * is picked at creation; present, it is picked as that profession levels.
   */
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
  { id: 'a_face_people_trust', name: 'A Face People Trust', category: 'Public', description: 'Audiences believe them as the doctor, the cop, the parent telling the truth.' },
  { id: 'a_voice_people_know', name: 'A Voice People Know', category: 'Public', description: 'Strangers recognize them from ads and animation without ever placing the face.' },
  { id: 'action_ready', name: 'Action Ready', category: 'Talent', description: 'Insurance says yes, stunt coordinators say yes, and you do your own work.', attributeMods: { stunt_aptitude: 14, screen_fighting: 12, stamina: 10, injury_resilience: 8 } },
  { id: 'algorithm_favorite', name: 'Algorithm Favorite', category: 'Public', description: 'Platforms push their titles to the front row because that face makes people click.' },
  { id: 'allergic_to_homework', name: 'Allergic To Homework', category: 'Method', description: 'Skips the reading on purpose, certain that prep flattens whatever was alive in it.' },
  { id: 'always_working', name: 'Always Working', category: 'Social', description: 'There’s a job on the books at all times and the quality of it varies.' },
  { id: 'an_actors_actor', name: 'An Actor’s Actor', category: 'Social', description: 'Other actors know exactly who they are and the ticket-buying public doesn’t.' },
  { id: 'anonymous_face', name: 'Anonymous Face', category: 'Public', description: 'Twenty years of steady work and nobody has ever stopped them in the street.' },
  { id: 'answers_to_the_character_name', name: 'Answers To The Character Name', category: 'Method', description: 'Won’t respond on set to anything except the name printed in the script.' },
  { id: 'argues_the_script', name: 'Argues The Script', category: 'Method', description: 'Won’t shoot a line they think is false until it’s explained to them.' },
  { id: 'awards_catnip', name: 'Awards Catnip', category: 'Public', description: 'Voters like the kind of work they do, so a campaign gets built around them most seasons.' },
  { id: 'back_to_the_stage', name: 'Back To The Stage', category: 'Social', description: 'Between screen jobs you go and do a play for scale.' },
  { id: 'beloved', name: 'Beloved', category: 'Public', description: 'The public is on your side, including when you don’t deserve it.', conflictsWith: ['controversial', 'polarizing'], earnable: true },
  { id: 'better_in_the_room', name: 'Better In The Room', category: 'Temperament', description: 'Lands it in person and goes flat the moment it’s a self tape shot at home.' },
  { id: 'better_with_nobody_watching', name: 'Better With Nobody Watching', category: 'Temperament', description: 'Best on a closed set, where a full gallery would only make them watch themselves.' },
  { id: 'big_in_one_market', name: 'Big In One Market', category: 'Public', description: 'Enormous in one country or one language and completely unknown outside it.' },
  { id: 'box_office_draw', name: 'Box Office Draw', category: 'Public', description: 'Their name above the title moves the opening weekend, so the budget gets approved.' },
  { id: 'box_office_poison', name: 'Box Office Poison', category: 'Public', description: 'Three flops with their name on top and the town has started blaming the name.' },
  { id: 'brand_poison', name: 'Brand Poison', category: 'Public', description: 'Sponsors pull out as soon as their name goes on the call sheet.' },
  { id: 'brand_safe', name: 'Brand Safe', category: 'Public', description: 'No scandals and no public opinions, so advertisers and studios both feel safe signing them.' },
  { id: 'bridge_burner', name: 'Bridge Burner', category: 'Social', description: 'You say the true thing on the way out and the door shuts behind you.' },
  { id: 'brings_it_home', name: 'Brings It Home', category: 'Life', description: 'The character comes home for the length of the shoot and everybody there lives with it.' },
  { id: 'brings_options', name: 'Brings Options', category: 'Method', description: 'Has three different versions of the scene ready before anybody asks for one.' },
  { id: 'brings_the_same_crew', name: 'Brings The Same Crew', category: 'Social', description: 'The same hair, makeup and stand-in follow you from job to job.' },
  { id: 'builds_every_take', name: 'Builds Every Take', category: 'Method', description: 'Take nine beats take three and take fifteen beats take nine.' },
  { id: 'burnout_prone', name: 'Burnout Prone', category: 'Life', description: 'You run hot, and then you run out.', systemMods: { stressPerShootDay: 1.4, recoveryRate: 0.7 }, conflictsWith: ['health_conscious', 'resilient'] },
  { id: 'burns_out_by_four', name: 'Burns Out By Four', category: 'Temperament', description: 'Loses it after the fourth pass and can’t get it back until the next day.' },
  { id: 'camera_shy', name: 'Camera Shy', category: 'Public', description: 'The work is fine. The publicity is agony.', attributeMods: { interview_poise: -14, red_carpet_presence: -12 }, conflictsWith: ['press_natural'] },
  { id: 'chameleon', name: 'Chameleon', category: 'Method', description: 'Audiences forget it’s you. Casting directors love it; star vehicles don’t.', attributeMods: { character_construction: 12, dialect_acquisition: 10, mask_and_mime: 8 } },
  { id: 'character_actor', name: 'Character Actor', nameByTitle: { actor: 'Character Actor', actress: 'Character Actress' }, category: 'Talent', description: 'Never the lead, never out of work, always the best thing in it.', attributeMods: { character_construction: 10, ensemble_blending: 10 } },
  { id: 'character_face', name: 'Character Face', category: 'Talent', description: 'A face people remember from one scene, and it works from twenty right through to seventy.' },
  { id: 'chemistry_with_anyone', name: 'Chemistry With Anyone', category: 'Talent', description: 'Put them opposite almost anybody and something starts up between them on screen.' },
  { id: 'chip_on_the_shoulder', name: 'Chip On The Shoulder', category: 'Temperament', description: 'Works hardest right after being told they aren’t right for it.' },
  { id: 'classical_beauty', name: 'Classical Beauty', category: 'Talent', description: 'The kind of face a poster can run with nothing else on it.' },
  { id: 'clean_overlaps', name: 'Clean Overlaps', category: 'Method', description: 'Stays off the end of your scene partner’s line so both halves of the scene are usable.' },
  { id: 'collaborative', name: 'Collaborative', category: 'Temperament', description: 'Directors ask for you again. That’s worth more than a quote bump.', attributeMods: { collaboration: 14, note_integration: 10, ensemble_blending: 8 }, conflictsWith: ['difficult', 'diva'] },
  { id: 'comeback_story', name: 'Comeback Story', category: 'Public', description: 'The business loves the shape of their return and keeps writing the same article about it.' },
  { id: 'comedic_instinct', name: 'Comedic Instinct', category: 'Talent', description: 'You hear the joke inside the line before anyone points at it.', attributeMods: { comedy_timing: 14, dry_comedy: 8, broad_comedy: 8, improvisation: 6 } },
  { id: 'comes_out_clean', name: 'Comes Out Clean', category: 'Method', description: 'Leaves the character on set at wrap and goes home as themselves.' },
  { id: 'controversial', name: 'Controversial', category: 'Public', description: 'Attention is never a problem. Approval sometimes is.', conflictsWith: ['beloved'], earnable: true },
  { id: 'convention_circuit_fixture', name: 'Convention Circuit Fixture', category: 'Public', description: 'One genre credit keeps the signing table booked most weekends of the year.' },
  { id: 'counts_lines', name: 'Counts Lines', category: 'Temperament', description: 'Measures the part by how much of it is theirs and says so in the meeting.' },
  { id: 'critical_darling', name: 'Critical Darling', category: 'Public', description: 'Reviewers champion them by name and the notices stay good even when the film isn’t.' },
  { id: 'cult_following', name: 'Cult Following', category: 'Public', description: 'A small, loud, permanent audience turns up for everything they do, whatever the reviews say.' },
  { id: 'danger', name: 'Danger', category: 'Public', description: 'There’s a sense they might actually do it, and nobody in the scene fully relaxes.' },
  { id: 'develops_own_material', name: 'Develops Own Material', category: 'Social', description: 'You option books and take the project out yourself instead of waiting on a call.' },
  { id: 'dies_on_coverage', name: 'Dies On Coverage', category: 'Method', description: 'Empties out into the master and has nothing left when the camera turns around.' },
  { id: 'different_every_take', name: 'Different Every Take', category: 'Method', description: 'No two takes match, which the editor either loves or has to solve.' },
  { id: 'difficult', name: 'Difficult', category: 'Temperament', description: 'The work may be great. The stories travel faster than the work.', attributeMods: { note_integration: -12, collaboration: -14 }, conflictsWith: ['collaborative', 'humble'], earnable: true },
  { id: 'directors_actor', name: 'Director’s Actor', category: 'Social', description: 'One director calls and you clear the year, film after film after film.' },
  { id: 'diva', name: 'Diva', category: 'Temperament', description: 'Your requirements are extensive and widely discussed.', attributeMods: { set_etiquette: -14, punctuality: -10 }, conflictsWith: ['collaborative', 'humble'], earnable: true },
  { id: 'does_not_anticipate', name: 'Does Not Anticipate', category: 'Method', description: 'Reacts after the line lands, never on the way in, take after take.' },
  { id: 'does_the_homework', name: 'Does The Homework', category: 'Method', description: 'Arrives having read the whole script, not only the scenes they’re in.' },
  { id: 'double_books', name: 'Double Books', category: 'Social', description: 'You sign on to two things that overlap, and one of them has to be told.' },
  { id: 'dramatic_gravitas', name: 'Dramatic Gravitas', category: 'Talent', description: 'When you say something serious, a room believes it.', attributeMods: { drama: 12, tragedy: 10, restraint: 8, resonance: 6 } },
  { id: 'drops_in_fast', name: 'Drops In Fast', category: 'Method', description: 'Gets to the emotional place in the seconds between turn over and action.' },
  { id: 'drops_it_between_takes', name: 'Drops It Between Takes', category: 'Method', description: 'Cut lands and they’re themselves again, phone out, talking to the grips.' },
  { id: 'elastic_face', name: 'Elastic Face', category: 'Talent', description: 'The face goes big and strange on request and still reads as a person.' },
  { id: 'emotional_availability', name: 'Emotional Availability', category: 'Talent', description: 'Feeling sits close to the surface and comes when the scene asks, with no run-up.' },
  { id: 'everybody_wants_to_work_with_them', name: 'Everybody Wants To Work With Them', category: 'Social', description: 'Directors ask for them first and the crew is glad when the name comes up.' },
  { id: 'everyman_face', name: 'Everyman Face', category: 'Public', description: 'Audiences read them as ordinary, so they get cast as the one it happens to.' },
  { id: 'everyman_quality', name: 'Everyman Quality', category: 'Public', description: 'People watch them and see a person they actually know. That’s hard to fake.' },
  { id: 'face_of_a_campaign', name: 'Face Of A Campaign', category: 'Public', description: 'A watch or cosmetics contract puts their face on airport walls in forty countries.' },
  { id: 'face_that_reads', name: 'Face That Reads', category: 'Talent', description: 'The thought lands on their face on its own, without being pushed there.' },
  { id: 'famously_private', name: 'Famously Private', category: 'Public', description: 'No interviews and no posts, and the silence has become part of what people want.' },
  { id: 'fashion_world_darling', name: 'Fashion World Darling', category: 'Public', description: 'Designers dress them for nothing because photographs of them in the clothes travel.' },
  { id: 'fast_study', name: 'Fast Study', category: 'Talent', description: 'Takes new pages at lunch and shoots them clean in the afternoon.' },
  { id: 'fearless', name: 'Fearless', category: 'Temperament', description: 'They’ll try the embarrassing choice on take one with everybody watching.' },
  { id: 'feeds_off_the_reader', name: 'Feeds Off The Reader', category: 'Method', description: 'Only as good as whoever is reading the other part off camera.' },
  { id: 'field_work', name: 'Field Work', category: 'Method', description: 'Spends a week doing the real job before shooting a single scene about it.' },
  { id: 'fights_for_billing', name: 'Fights For Billing', category: 'Social', description: 'Card position and poster order go through the lawyers before you sign.' },
  { id: 'financially_savvy', name: 'Financially Savvy', category: 'Life', description: 'You read the deal. You understand backend. You don’t get talked into things.', attributeMods: { negotiation_awareness: 14, career_strategy: 8 }, conflictsWith: ['reckless_spender'] },
  { id: 'finds_the_light', name: 'Finds The Light', category: 'Method', description: 'Steps into the hot spot onstage without ever appearing to look for it.' },
  { id: 'first_one_on_set', name: 'First One On Set', category: 'Social', description: 'You’re in the makeup chair before the call time, every day of the shoot.' },
  { id: 'first_take_animal', name: 'First Take Animal', category: 'Talent', description: 'The first one is usually the best one and it thins out from there.' },
  { id: 'first_take_best_take', name: 'First Take Best Take', category: 'Method', description: 'The first one is the one, and every take after it is a copy drifting further away.' },
  { id: 'found_at_forty', name: 'Found At Forty', category: 'Social', description: 'Nothing happened for twenty years and then everything did at once.' },
  { id: 'franchise_face', name: 'Franchise Face', category: 'Public', description: 'One character owns them in public and every interview comes back around to it.' },
  { id: 'funny_bones', name: 'Funny Bones', category: 'Talent', description: 'They’re funny before they open their mouth, in the walk and the timing.' },
  { id: 'generous_partner', name: 'Generous Scene Partner', category: 'Temperament', description: 'Your co-stars are better in scenes with you. People notice.', attributeMods: { active_listening: 12, ensemble_blending: 12, chemistry: 8 }, conflictsWith: ['scene_stealer'] },
  { id: 'gives_it_off_camera', name: 'Gives It Off Camera', category: 'Social', description: 'Plays the scene full size on the far side of the camera at the end of a long day.' },
  { id: 'gives_lines_back', name: 'Gives Lines Back', category: 'Method', description: 'Hands dialogue back, preferring to play the beat in the face than say it out loud.' },
  { id: 'goes_all_the_way', name: 'Goes All The Way', category: 'Method', description: 'Whatever the part says they did, they go and actually do it, weight and trade and all.' },
  { id: 'good_ear', name: 'Good Ear', category: 'Talent', description: 'They hear an accent or a speech rhythm once and can hold on to it.' },
  { id: 'good_in_a_crisis', name: 'Good In A Crisis', category: 'Temperament', description: 'Gets calmer as the light goes, the location falls through and the day comes apart.' },
  { id: 'good_to_the_new_kid', name: 'Good To The New Kid', category: 'Social', description: 'You find the youngest person in the cast and make sure they’re all right.' },
  { id: 'gravity', name: 'Gravity', category: 'Public', description: 'What they say lands like it costs something, even in a small scene.' },
  { id: 'hates_improv', name: 'Hates Improv', category: 'Temperament', description: 'Wants the words fixed and the moves set, and goes flat when asked to invent.' },
  { id: 'hates_rehearsal', name: 'Hates Rehearsal', category: 'Method', description: 'Refuses to run it into the ground and wants the first real one on camera.' },
  { id: 'health_conscious', name: 'Health Conscious', category: 'Life', description: 'You sleep, you train, you last.', attributeMods: { stamina: 10, injury_resilience: 8, long_day_endurance: 8 }, systemMods: { recoveryRate: 1.35 }, conflictsWith: ['burnout_prone'] },
  { id: 'hits_the_choreography', name: 'Hits The Choreography', category: 'Talent', description: 'Runs a fight or a dance beat for beat the same way, at speed, every time.' },
  { id: 'hits_the_mark', name: 'Hits The Mark', category: 'Method', description: 'Lands on the tape every time without dropping the eyes to look for it.' },
  { id: 'hits_the_time', name: 'Hits The Time', category: 'Method', description: 'Lands the same speech in the same twenty-nine seconds, read after read.' },
  { id: 'holds_for_the_laugh', name: 'Holds For The Laugh', category: 'Method', description: 'Waits out the studio audience and picks the scene back up without losing it.' },
  { id: 'holds_out_for_more', name: 'Holds Out For More', category: 'Social', description: 'Season three starts without you until the number moves.' },
  { id: 'holds_something_back', name: 'Holds Something Back', category: 'Public', description: 'There’s always a part of them you don’t get, and the audience leans in for it.' },
  { id: 'holds_the_accent_all_day', name: 'Holds The Accent All Day', category: 'Method', description: 'Keeps the voice through lunch, phone calls and the drive home.' },
  { id: 'holds_the_arc', name: 'Holds The Arc', category: 'Method', description: 'Knows exactly where the character is on any day of an out-of-order schedule.' },
  { id: 'holds_the_eyeline', name: 'Holds The Eyeline', category: 'Method', description: 'Keeps the look on the tennis ball or the tape cross and doesn’t let it drift.' },
  { id: 'household_name', name: 'Household Name', category: 'Public', description: 'Strangers know the name in towns where nobody could name one of their titles.' },
  { id: 'huge_online_following', name: 'Huge Online Following', category: 'Public', description: 'Millions follow them directly, which the studio counts as marketing it doesn’t pay for.' },
  { id: 'humble', name: 'Humble', category: 'Temperament', description: 'Crews like you, and crews talk.', attributeMods: { set_etiquette: 10, collaboration: 8 }, conflictsWith: ['diva', 'difficult'] },
  { id: 'hungry', name: 'Hungry', category: 'Temperament', description: 'Goes out for everything, chases the meeting, and is still chasing after a bad year.' },
  { id: 'ice_in_the_room', name: 'Ice In The Room', category: 'Temperament', description: 'Reads the same in a casting session with four strangers as in an empty rehearsal room.' },
  { id: 'improv_first', name: 'Improv First', category: 'Method', description: 'Would rather find the scene loose on the floor than run what is on the page.' },
  { id: 'indie_credibility', name: 'Indie Credibility', category: 'Public', description: 'Small films get taken seriously because they said yes, and they usually do.' },
  { id: 'nepotism_adjacent', name: 'Industry Family', category: 'Social', description: 'Doors open early. Then you have to be good, and everyone is watching for whether you are.', conflictsWith: ['outsider', 'self_made'] },
  { id: 'instantly_likable', name: 'Instantly Likable', category: 'Public', description: 'Audiences take their side in the first minute and mostly stay there.' },
  { id: 'instinct_over_homework', name: 'Instinct Over Homework', category: 'Method', description: 'Reads it once and finds the rest on the floor with whoever is in it with them.' },
  { id: 'insurance_risk', name: 'Insurance Risk', category: 'Social', description: 'Bonders charge extra or refuse them outright, and the schedule gets built around it.' },
  { id: 'keeps_a_protege', name: 'Keeps A Protege', category: 'Social', description: 'You pick one young performer a decade and open every door you have for them.' },
  { id: 'keeps_score', name: 'Keeps Score', category: 'Temperament', description: 'Knows what everyone else got paid, got billed and got cast in.' },
  { id: 'killer_instinct', name: 'Killer Instinct', category: 'Temperament', description: 'Wants it more than whoever else is in the waiting room, and the room can tell.' },
  { id: 'knows_the_crews_names', name: 'Knows The Crew’s Names', category: 'Social', description: 'You learn the grips, the drivers and the second team by name in the first week.' },
  { id: 'knows_when_they_have_it', name: 'Knows When They Have It', category: 'Temperament', description: 'Can tell the take is good and doesn’t go back asking for another one.' },
  { id: 'late_bloomer', name: 'Late Bloomer', category: 'Talent', description: 'Slow to start, hard to stop. Growth compounds instead of plateauing.', attributeMods: { emotional_truth: -4, charisma: -3 }, conflictsWith: ['natural_talent', 'prodigy'] },
  { id: 'leaves_handles', name: 'Leaves Handles', category: 'Method', description: 'Holds a beat at the top and tail of the take so the editor has somewhere to cut.' },
  { id: 'leaves_it_on_set', name: 'Leaves It On Set', category: 'Life', description: 'Drops the part at wrap and goes home as themselves.' },
  { id: 'leaves_the_door_open', name: 'Leaves The Door Open', category: 'Social', description: 'You finish a badly run job politely and stay on the list for the next one.' },
  { id: 'lifts_the_room', name: 'Lifts The Room', category: 'Temperament', description: 'Everybody in the scene is better on the day, including the ones who usually aren’t.' },
  { id: 'listens', name: 'Listens', category: 'Talent', description: 'They take in what their scene partner just did and change because of it.' },
  { id: 'lives_at_the_monitor', name: 'Lives At The Monitor', category: 'Method', description: 'Watches every take back and adjusts it frame by frame.' },
  { id: 'living_legend', name: 'Living Legend', category: 'Public', description: 'Younger casts go quiet when they walk onto the floor.' },
  { id: 'locks_in', name: 'Locks In', category: 'Temperament', description: 'Goes somewhere else between action and cut and hears none of the room.' },
  { id: 'lucky_break', name: 'Lucky Break', category: 'Life', description: 'Once in your career, something goes right that had no business going right.' },
  { id: 'makes_the_day', name: 'Makes The Day', category: 'Social', description: 'Works fast and clean enough that the schedule survives contact with them.' },
  { id: 'marks_it_through', name: 'Marks It Through', category: 'Method', description: 'Rehearses at quarter volume and keeps everything real for when the camera rolls.' },
  { id: 'matches_every_take', name: 'Matches Every Take', category: 'Method', description: 'Hits the same mark, the same beat and the same breath on take one and take twenty.' },
  { id: 'matches_in_adr', name: 'Matches In ADR', category: 'Method', description: 'Puts the line back in sync months later in a booth and it sounds like the day.' },
  { id: 'matches_the_action', name: 'Matches The Action', category: 'Method', description: 'Puts the glass down on the same word in every take, so the takes cut together.' },
  { id: 'meme_face', name: 'Meme Face', category: 'Public', description: 'One frame of their work circulates online forever, cut loose from the film it came from.' },
  { id: 'method_actor', name: 'Method Actor', nameByTitle: { actor: 'Method Actor', actress: 'Method Actress' }, category: 'Method', description: 'You live inside the part. The results can be extraordinary and the cost is real.', attributeMods: { emotional_truth: 12, vulnerability: 8, grief: 6 }, systemMods: { stressPerShootDay: 1.5 }, conflictsWith: ['technical_actor'] },
  { id: 'mic_discipline', name: 'Mic Discipline', category: 'Method', description: 'Delivers at the same level take to take and doesn’t blow out the boom on the shout.' },
  { id: 'motor', name: 'Motor', category: 'Talent', description: 'Fourteen hours in they are the same as they were at call.' },
  { id: 'moves_well', name: 'Moves Well', category: 'Talent', description: 'Walking, sitting down and handling objects all look like the character, not the person playing them.' },
  { id: 'multilingual', name: 'Multilingual', category: 'Talent', description: 'International projects open up in a way they don’t for most people.', attributeMods: { dialect_acquisition: 10, accent_retention: 8 } },
  { id: 'musical', name: 'Musical', category: 'Talent', description: 'Singing and rhythm are available to you as tools.', attributeMods: { singing: 16, vocal_range: 12, dance: 8 } },
  { id: 'national_punchline', name: 'National Punchline', category: 'Public', description: 'Hosts use their name as a joke that has outlived whatever started it.' },
  { id: 'natural_authority', name: 'Natural Authority', category: 'Public', description: 'Hand them a badge or a command and the room believes it without an argument.' },
  { id: 'natural_heavy', name: 'Natural Heavy', category: 'Public', description: 'Casting sees a threat in the face before they open their mouth, so the villains keep coming.' },
  { id: 'natural_talent', name: 'Natural Talent', category: 'Talent', description: 'Things that take others years took you months. Craft starts high but coasting is a real risk.', attributeMods: { emotional_truth: 10, charisma: 6, subtext: 6 }, conflictsWith: ['late_bloomer'] },
  { id: 'needs_a_room', name: 'Needs A Room', category: 'Temperament', description: 'Comes up in front of a crowd and shrinks on a quiet set with four crew and a monitor.' },
  { id: 'needs_reassurance', name: 'Needs Reassurance', category: 'Temperament', description: 'Asks the director how it was after every take, and asks again in the car home.' },
  { id: 'needs_the_note', name: 'Needs The Note', category: 'Method', description: 'Can’t start until they’re told what the scene is for.' },
  { id: 'needs_the_room_quiet', name: 'Needs The Room Quiet', category: 'Temperament', description: 'Wants a closed set and a hushed crew before anything real comes out.' },
  { id: 'nepo_baby', name: 'Nepo Baby', category: 'Public', description: 'A famous family name opened the first doors and turns up in every review since.' },
  { id: 'nerve', name: 'Nerve', category: 'Temperament', description: 'The size of the day, the crowd or the cold start never gets into the work.' },
  { id: 'never_auditions', name: 'Never Auditions', category: 'Social', description: 'You read for nobody now; parts arrive as offers or they don’t arrive.' },
  { id: 'never_breaks', name: 'Never Breaks', category: 'Temperament', description: 'Stays in it through a boom in shot, a laughing crew or a light going over.' },
  { id: 'never_forgets_a_slight', name: 'Never Forgets A Slight', category: 'Temperament', description: 'A name goes on the list the day it earns it and stays there twenty years.' },
  { id: 'never_late', name: 'Never Late', category: 'Social', description: 'In the chair before call time, every day of the schedule.' },
  { id: 'never_misses_a_call', name: 'Never Misses A Call', category: 'Social', description: 'No unit has ever stood around waiting for you to come out of the trailer.' },
  { id: 'never_needs_the_note_twice', name: 'Never Needs The Note Twice', category: 'Social', description: 'Once a note is fixed it stays fixed for the rest of the shoot.' },
  { id: 'never_says_no', name: 'Never Says No', category: 'Social', description: 'Takes every job offered, including the ones that are obviously bad.' },
  { id: 'never_taken_seriously', name: 'Never Taken Seriously', category: 'Public', description: 'Good work keeps getting read as luck because of the show they came up on.' },
  { id: 'never_watches_playback', name: 'Never Watches Playback', category: 'Method', description: 'Stays off the monitor, on the grounds that watching it starts them directing themselves.' },
  { id: 'night_shoot_proof', name: 'Night Shoot Proof', category: 'Talent', description: 'Works at four in the morning in the rain and none of it shows up in the take.' },
  { id: 'no_vanity', name: 'No Vanity', category: 'Temperament', description: 'They’ll look ugly, stupid or old on camera and never protect the picture.' },
  { id: 'off_book_at_the_table_read', name: 'Off Book At The Table Read', category: 'Method', description: 'Has all of it memorized before the first read, every job.' },
  { id: 'off_book_day_one', name: 'Off Book Day One', category: 'Social', description: 'You walk into the first rehearsal with the whole script already learned.' },
  { id: 'off_book_early', name: 'Off Book Early', category: 'Method', description: 'Knows the lines before the read-through and can put the script down in rehearsal.' },
  { id: 'off_camera_ghost', name: 'Off Camera Ghost', category: 'Temperament', description: 'Leaves once their own coverage is done and lets a stand-in read the other side.' },
  { id: 'offer_only', name: 'Offer Only', category: 'Social', description: 'They don’t read for parts any more; work arrives as a direct offer or not at all.' },
  { id: 'one_more_for_me', name: 'One More For Me', category: 'Method', description: 'Always asks for another take after the director has already said they have it.' },
  { id: 'one_more_take', name: 'One More Take', category: 'Temperament', description: 'Asks for another after the director has already said they have got it.' },
  { id: 'one_walk_through', name: 'One Walk-Through', category: 'Method', description: 'Has the blocking after a single pass and never needs it called again.' },
  { id: 'outsider', name: 'Outsider', category: 'Social', description: 'No shortcuts. Everything you get, you got yourself.', attributeMods: { networking: -10 }, conflictsWith: ['well_connected', 'nepotism_adjacent'] },
  { id: 'overexposed', name: 'Overexposed', category: 'Public', description: 'Three of their films opened this year and audiences are tired of the face.' },
  { id: 'overprepares', name: 'Overprepares', category: 'Method', description: 'Arrives at the first read with a marked script and a binder nobody asked for.' },
  { id: 'pays_it_back', name: 'Pays It Back', category: 'Social', description: 'You remember who hired you when nobody would, and you cast them now.' },
  { id: 'perennial_nominee', name: 'Perennial Nominee', category: 'Public', description: 'Nominated over and over, never wins, and the losing streak gets its own applause.' },
  { id: 'perfectionist', name: 'Perfectionist', category: 'Temperament', description: 'Excellent results, expensive days.', attributeMods: { preparation: 10, take_consistency: 6 } },
  { id: 'photographic_memory', name: 'Photographic Memory', category: 'Talent', description: 'The script goes in once and stays.', attributeMods: { memorization: 18, cold_reading: 10, pressure_lines: 12 } },
  { id: 'plays_it_to_the_partner', name: 'Plays It To The Partner', category: 'Social', description: 'You give the scene to whoever you’re in it with and let them have the take.' },
  { id: 'plays_older', name: 'Plays Older', category: 'Talent', description: 'They carry parts written well above their age without it looking like dress-up.' },
  { id: 'plays_the_lens', name: 'Plays The Lens', category: 'Method', description: 'Sizes it to the shot, smaller on the long lens, bigger when the frame goes wide.' },
  { id: 'plays_the_long_game', name: 'Plays The Long Game', category: 'Social', description: 'Turns down the quick money and waits a year for the job that moves the career.' },
  { id: 'plays_to_nothing', name: 'Plays To Nothing', category: 'Method', description: 'Makes a tennis ball on a stick and a blue wall read as a monster and a city.' },
  { id: 'plays_to_the_crew', name: 'Plays To The Crew', category: 'Public', description: 'Aims it at whoever is standing behind the camera and knows exactly when they laugh.' },
  { id: 'plays_to_the_other_actor', name: 'Plays To The Other Actor', category: 'Temperament', description: 'Gives the same performance off camera that the close-up got.' },
  { id: 'plays_younger', name: 'Plays Younger', category: 'Talent', description: 'Casting can take ten years off them and nobody in the audience questions it.' },
  { id: 'polarizing', name: 'Polarizing', category: 'Public', description: 'Half the audience is devoted. The other half is loud.', conflictsWith: ['beloved'], earnable: true },
  { id: 'presence', name: 'Presence', category: 'Public', description: 'A room notices them before they speak and keeps noticing after.' },
  { id: 'press_averse', name: 'Press Averse', category: 'Public', description: 'You do the minimum contractual publicity and not one appearance more.', conflictsWith: ['press_natural'] },
  { id: 'press_natural', name: 'Press Natural', category: 'Public', description: 'You’re good in a room full of journalists. Rarer than talent, that.', attributeMods: { interview_poise: 14, press_discipline: 10, red_carpet_presence: 10 }, conflictsWith: ['camera_shy', 'press_averse'] },
  { id: 'prints_take_two', name: 'Prints Take Two', category: 'Temperament', description: 'Happy with the second one and moving on while the day still has light in it.' },
  { id: 'private', name: 'Private', category: 'Public', description: 'Your life stays yours. Fame grows slower and lasts longer.' },
  { id: 'prodigy', name: 'Prodigy', category: 'Talent', description: 'Extraordinary young ability, and the scrutiny that comes with it.', attributeMods: { emotional_truth: 14, memorization: 10, direction_absorption: 8 }, conflictsWith: ['late_bloomer'] },
  { id: 'protects_the_image', name: 'Protects The Image', category: 'Temperament', description: 'Steers every part back toward likable, sympathetic and well lit.' },
  { id: 'publicly_beloved', name: 'Publicly Beloved', category: 'Public', description: 'People simply like them and forgive them things other actors never get forgiven.' },
  { id: 'quick_study', name: 'Quick Study', category: 'Method', description: 'You get useful fast, which matters more than getting perfect slowly.', conflictsWith: ['slow_burn'] },
  { id: 'reads_bigger_than_they_are', name: 'Reads Bigger Than They Are', category: 'Talent', description: 'Five foot six on the day and six foot two on screen.' },
  { id: 'reads_for_anything', name: 'Reads For Anything', category: 'Social', description: 'You’ll put yourself on tape for a day player part in a soap.' },
  { id: 'reads_nervous', name: 'Reads Nervous', category: 'Temperament', description: 'The hands go and the voice thins the moment a casting camera starts recording.' },
  { id: 'reads_people', name: 'Reads People', category: 'Talent', description: 'They know what a person in the room is feeling, usually before that person says it.' },
  { id: 'reads_playback', name: 'Reads Playback', category: 'Method', description: 'Watches the monitor, sees what is wrong with it and fixes that on the next take.' },
  { id: 'reads_the_reviews', name: 'Reads The Reviews', category: 'Temperament', description: 'Reads every notice and can quote the bad sentences back years later.' },
  { id: 'reckless_spender', name: 'Reckless Spender', category: 'Life', description: 'Money arrives and immediately leaves.', conflictsWith: ['financially_savvy'], earnable: true },
  { id: 'rehearsal_junkie', name: 'Rehearsal Junkie', category: 'Method', description: 'Wants three weeks in a room with tape on the floor before anyone points a camera.' },
  { id: 'rejection_hangover', name: 'Rejection Hangover', category: 'Temperament', description: 'One no costs the rest of the week and the two auditions that were in it.' },
  { id: 'repeatable', name: 'Repeatable', category: 'Method', description: 'Take nine matches take two in timing, in size and in where the hands go.' },
  { id: 'research_hound', name: 'Research Hound', category: 'Method', description: 'Turns up with a binder of archive, interviews and three books nobody asked for.' },
  { id: 'resilient', name: 'Resilient', category: 'Life', description: 'A flop doesn’t end you. A bad year doesn’t define you.', attributeMods: { resilience: 16, pressure_tolerance: 10 }, systemMods: { recoveryRate: 1.2 }, conflictsWith: ['burnout_prone'] },
  { id: 'restless_between_jobs', name: 'Restless Between Jobs', category: 'Temperament', description: 'Two months without a start date and the walls start closing in.' },
  { id: 'rewrites_on_the_day', name: 'Rewrites On The Day', category: 'Method', description: 'Arrives with their own version of the scene and hands it to the director.' },
  { id: 'rewrites_the_lines', name: 'Rewrites The Lines', category: 'Social', description: 'The words come out different than written and the writer finds out on the day.' },
  { id: 'rides_the_move', name: 'Rides The Move', category: 'Method', description: 'Matches the pace of a dolly or a crane move without hurrying it or dragging behind.' },
  { id: 'riffs_past_the_ending', name: 'Riffs Past The Ending', category: 'Method', description: 'Keeps going after the last line, hunting for something the writer didn’t put there.' },
  { id: 'rises_to_the_room', name: 'Rises To The Room', category: 'Temperament', description: 'Gets sharper as the room gets bigger and the people in it get more important.' },
  { id: 'runs_a_campaign', name: 'Runs A Campaign', category: 'Public', description: 'You do the lunches, the panels and the ballots when an award is in reach.' },
  { id: 'runs_hot', name: 'Runs Hot', category: 'Temperament', description: 'Loses the temper on set when the day goes wrong, loudly and in front of people.' },
  { id: 'sad_eyes', name: 'Sad Eyes', category: 'Talent', description: 'Something behind the eyes reads as loss even when the scene is a cheerful one.' },
  { id: 'same_agent_since_the_start', name: 'Same Agent Since The Start', category: 'Social', description: 'One agent has had you since the first job and you aren’t moving.' },
  { id: 'same_ritual_every_morning', name: 'Same Ritual Every Morning', category: 'Method', description: 'Same music, same walk, same order before the first setup, or the day never lands.' },
  { id: 'same_show_every_night', name: 'Same Show Every Night', category: 'Method', description: 'The eighth month of the run is the same performance as the first week of previews.' },
  { id: 'saves_it_for_the_close_up', name: 'Saves It For The Close-Up', category: 'Method', description: 'Marks the wide, then plays it full out the moment the lens comes in.' },
  { id: 'saves_it_for_the_take', name: 'Saves It For The Take', category: 'Method', description: 'Marks it through in rehearsal and spends the real thing when the camera is turning.' },
  { id: 'saves_it_live', name: 'Saves It Live', category: 'Method', description: 'Covers a dropped line or a dead prop onstage so the house never knows anything went wrong.' },
  { id: 'says_no_easily', name: 'Says No Easily', category: 'Social', description: 'Passes on real money without agonizing over it for weeks.' },
  { id: 'scene_stealer', name: 'Scene Stealer', category: 'Temperament', description: 'The eye goes to you. Whether that helps the film is another question.', attributeMods: { magnetism: 12, reaction_shots: 10 }, conflictsWith: ['generous_partner'] },
  { id: 'scores_the_script', name: 'Scores The Script', category: 'Method', description: 'Turns up with the sides marked up in beats, intentions and places to breathe.' },
  { id: 'script_obsessive', name: 'Script Obsessive', category: 'Method', description: 'Lives in the sides, margins full, a fresh page of notes every night of the shoot.' },
  { id: 'self_directing', name: 'Self Directing', category: 'Method', description: 'Sets their own process and gets there without needing anything from the director.' },
  { id: 'self_made', name: 'Self Made', category: 'Social', description: 'You built it without help, and the press likes that story.', conflictsWith: ['nepotism_adjacent'] },
  { id: 'self_tape_natural', name: 'Self Tape Natural', category: 'Method', description: 'Alone in a bedroom with a phone on a stack of books, they’re as good as in the room.' },
  { id: 'set_stories_follow_them', name: 'Set Stories Follow Them', category: 'Social', description: 'Crews trade accounts of their behavior and the stories reach producers before they do.' },
  { id: 'sex_appeal', name: 'Sex Appeal', category: 'Public', description: 'The lens picks up something carnal in them whether or not the scene asks for it.' },
  { id: 'sex_symbol', name: 'Sex Symbol', category: 'Public', description: 'Their face sells covers and posters long before anybody mentions the acting.' },
  { id: 'sharp_elbows', name: 'Sharp Elbows', category: 'Social', description: 'You go after a part another performer is attached to and you come away with it.' },
  { id: 'slow_burn', name: 'Slow Burn', category: 'Method', description: 'Deep preparation, and work that keeps deepening across a shoot.', conflictsWith: ['quick_study'] },
  { id: 'slow_burner', name: 'Slow Burner', category: 'Talent', description: 'It isn’t there at take three and it’s there at take twelve.' },
  { id: 'slow_to_warm', name: 'Slow To Warm', category: 'Temperament', description: 'Stiff and general for the first hour of any day, then unrecognizably good after it.' },
  { id: 'speaks_crew', name: 'Speaks Crew', category: 'Social', description: 'Knows what a wild line, a hot brick and a martini shot are, and answers to them.' },
  { id: 'stage_animal', name: 'Stage Animal', category: 'Public', description: 'Something switches on in front of a live audience that no camera ever picks up.' },
  { id: 'stage_fright', name: 'Stage Fright', category: 'Temperament', description: 'Sick in the wings before every entrance, however long the run has been going.' },
  { id: 'star_quality', name: 'Star Quality', category: 'Talent', description: 'The camera simply prefers you. It isn’t fair and it isn’t earned.', attributeMods: { charisma: 14, magnetism: 12, photogenic_quality: 10 } },
  { id: 'starts_cold', name: 'Starts Cold', category: 'Method', description: 'Plays the peak of the scene on take one at seven in the morning with no run-up.' },
  { id: 'stays_for_the_coverage', name: 'Stays For The Coverage', category: 'Social', description: 'You stay past your own shots to read off camera for the other actors.' },
  { id: 'stays_in_character', name: 'Stays In Character', category: 'Method', description: 'Holds the voice, the walk and the name from call time to wrap, crew included.' },
  { id: 'stillness', name: 'Stillness', category: 'Public', description: 'They can do nothing on camera for a long time without going dead or looking held.' },
  { id: 'superstitious', name: 'Superstitious', category: 'Temperament', description: 'Same routine before every take, and the day is wrong when it gets broken.' },
  { id: 'tabloid_magnet', name: 'Tabloid Magnet', category: 'Public', description: 'Photographers wait outside their gym and the pictures always sell.' },
  { id: 'take_twenty', name: 'Take Twenty', category: 'Temperament', description: 'As good on the twentieth take as on the second, with nothing worn off it.' },
  { id: 'takes_a_note_hard', name: 'Takes A Note Hard', category: 'Temperament', description: 'One note in the morning sits on top of the whole rest of the day.' },
  { id: 'takes_it_personally', name: 'Takes It Personally', category: 'Temperament', description: 'Reads every pass as a verdict on the person, when it was a decision about the part.' },
  { id: 'takes_no_notes', name: 'Takes No Notes', category: 'Temperament', description: 'Hears the note, thanks them, and does exactly what they were doing before.' },
  { id: 'takes_the_note', name: 'Takes The Note', category: 'Method', description: 'The adjustment is in on the very next take, whole, with no discussion about it.' },
  { id: 'takes_the_paycheck_job', name: 'Takes The Paycheck Job', category: 'Social', description: 'You do the bad sequel for the money and never pretend it was anything else.' },
  { id: 'takes_the_rewrite', name: 'Takes The Rewrite', category: 'Social', description: 'Gets a new speech on the floor at six and plays it at eight like it was always there.' },
  { id: 'takes_the_small_part', name: 'Takes The Small Part', category: 'Social', description: 'Two scenes and a name in the crawl is fine if the film is worth being in.' },
  { id: 'talks_to_the_real_person', name: 'Talks To The Real Person', category: 'Method', description: 'Finds whoever they’re playing, or the family, and sits with them for hours.' },
  { id: 'talks_to_the_trades', name: 'Talks To The Trades', category: 'Public', description: 'A reporter can get a quote out of you about a picture you’re still shooting.' },
  { id: 'teaches_the_class', name: 'Teaches The Class', category: 'Social', description: 'You take a room of students between jobs and you actually turn up for it.' },
  { id: 'technical_actor', name: 'Technical Actor', nameByTitle: { actor: 'Technical Actor', actress: 'Technical Actress' }, category: 'Method', description: 'Precision, repeatability and a director who never worries about the edit.', attributeMods: { take_consistency: 14, continuity_awareness: 10, direction_absorption: 8, eyeline_discipline: 6 }, systemMods: { stressPerShootDay: 0.8 }, conflictsWith: ['method_actor'] },
  { id: 'technical_patience', name: 'Technical Patience', category: 'Temperament', description: 'Stands on the mark through relights and lens changes without going flat.' },
  { id: 'the_camera_loves_them', name: 'The Camera Loves Them', category: 'Public', description: 'Footage comes back better than the day felt, and nobody on the crew can explain why.' },
  { id: 'theater_royalty', name: 'Theater Royalty', category: 'Public', description: 'The stage world claims them and every return to it is treated as an event.' },
  { id: 'thick_skinned', name: 'Thick Skinned', category: 'Temperament', description: 'A pass lands, gets shrugged off, and the next tape goes out the same afternoon.' },
  { id: 'thrown_by_changes', name: 'Thrown By Changes', category: 'Temperament', description: 'New pages at lunch and the whole afternoon comes apart with them.' },
  { id: 'transparency', name: 'Transparency', category: 'Talent', description: 'You can see what they are thinking before they say it, and they can’t hide it if they try.' },
  { id: 'typecast', name: 'Typecast', category: 'Public', description: 'Every offer that comes in is another version of the one part they played well.' },
  { id: 'unbookable', name: 'Unbookable', category: 'Social', description: 'Word went round that they’re more trouble than they are worth and the phone stopped.' },
  { id: 'unbothered_by_noise', name: 'Unbothered By Noise', category: 'Temperament', description: 'Plays the scene with a crane swinging past and forty people watching from the dark.' },
  { id: 'under_a_cloud', name: 'Under A Cloud', category: 'Public', description: 'A scandal rides along with every announcement and some partners won’t sign until it clears.' },
  { id: 'uninsurable', name: 'Uninsurable', category: 'Social', description: 'The bond company won’t cover you, so the money has to want you badly.' },
  { id: 'union_to_the_bone', name: 'Union To The Bone', category: 'Social', description: 'You won’t cross a picket line and you say so before anybody asks.' },
  { id: 'unmistakable_voice', name: 'Unmistakable Voice', category: 'Talent', description: 'One line and you know exactly who it is, even off screen or in a booth.' },
  { id: 'unretires', name: 'Unretires', category: 'Life', description: 'You announce you’re done, and three years later a call comes that you take.' },
  { id: 'upstager', name: 'Upstager', category: 'Social', description: 'You find the small move that pulls the frame to you while the scene belongs to the other one.' },
  { id: 'viral_instinct', name: 'Viral Instinct', category: 'Public', description: 'You understand, without being taught, what an audience will share.', attributeMods: { social_instinct: 16 } },
  { id: 'visible_intelligence', name: 'Visible Intelligence', category: 'Public', description: 'You can watch them work something out, so the clever parts never have to explain themselves.' },
  { id: 'voice_that_carries', name: 'Voice That Carries', category: 'Talent', description: 'The back row hears every word with no strain and no shouting.' },
  { id: 'vulnerability', name: 'Vulnerability', category: 'Talent', description: 'Hurt shows on them without them playing it, and people want to step in.' },
  { id: 'waiting_to_be_found_out', name: 'Waiting To Be Found Out', category: 'Temperament', description: 'Certain the job was a mistake, and that any day now it’ll be noticed.' },
  { id: 'waits_for_the_right_one', name: 'Waits For The Right One', category: 'Social', description: 'You turn down a year of work and sit out until something worth doing comes.' },
  { id: 'waits_well', name: 'Waits Well', category: 'Social', description: 'Sits in a trailer for nine hours and walks on set ready on the first call.' },
  { id: 'walks_off', name: 'Walks Off', category: 'Social', description: 'When it goes wrong enough you leave the set and let them shoot around you.' },
  { id: 'warmth', name: 'Warmth', category: 'Public', description: 'The room and the audience both like them within about a minute.' },
  { id: 'watchable_doing_nothing', name: 'Watchable Doing Nothing', category: 'Public', description: 'A shot of them waiting or crossing a room holds an audience with no lines in it.' },
  { id: 'wears_it_home', name: 'Wears It Home', category: 'Method', description: 'The part comes off the lot with them and stays in the house for the length of the shoot.' },
  { id: 'well_connected', name: 'Well Connected', category: 'Social', description: 'You know people, and the people you know know people.', attributeMods: { networking: 14 }, conflictsWith: ['outsider'] },
  { id: 'will_go_anywhere', name: 'Will Go Anywhere', category: 'Life', description: 'Six months in a cold country with a bad hotel isn’t a reason to pass.' },
  { id: 'wit', name: 'Wit', category: 'Talent', description: 'The funny thing occurs to them in the moment and lands in the right rhythm.' },
  { id: 'wont_campaign', name: 'Won’t Campaign', category: 'Public', description: 'You let the work stand and skip the whole season of it.' },
  { id: 'wont_do_press', name: 'Won’t Do Press', category: 'Public', description: 'Junkets, talk shows and magazine covers get a no through your publicist.' },
  { id: 'wont_rehearse', name: 'Won’t Rehearse', category: 'Method', description: 'Turns down the read-through and the run, saving all of it for the take.' },
  { id: 'word_is_good', name: 'Word Is Good', category: 'Social', description: 'You take a job on a phone call and it holds, contract or no contract.' },
  { id: 'word_perfect', name: 'Word Perfect', category: 'Method', description: 'Says it as written, comma for comma, and asks before changing a word of it.' },
  { id: 'workaholic', name: 'Workaholic', category: 'Temperament', description: 'You’ll take the next job. Your family has noticed.' },
  { id: 'works_at_every_age', name: 'Works At Every Age', category: 'Social', description: 'The parts change shape as you get older and there’s always one of them.' },
  { id: 'works_close_to_home', name: 'Works Close To Home', category: 'Life', description: 'You take what shoots within an hour of the house and pass on the rest.' },
  { id: 'works_from_the_inside_out', name: 'Works From The Inside Out', category: 'Method', description: 'Starts with what the character wants and lets the body catch up later.' },
  { id: 'works_from_the_shoes', name: 'Works From The Shoes', category: 'Method', description: 'Finds the person through the costume, the wig and the walk before anything else.' },
  { id: 'worth_the_trouble', name: 'Worth The Trouble', category: 'Social', description: 'Everybody knows they’re hard work and everybody books them anyway.' },
  { id: 'wrap_crash', name: 'Wrap Crash', category: 'Life', description: 'Comes apart in the empty weeks after a job finishes.' },
  { id: 'writes_the_backstory', name: 'Writes The Backstory', category: 'Method', description: 'Fills a notebook with everything that happened to the character before page one.' },
] as const;

if (TRAITS.length !== 296) {
  throw new Error(`SLATE expects exactly 296 acting traits; found ${TRAITS.length}.`);
}

export const TRAIT_IDS: readonly string[] = TRAITS.map((t) => t.id);
/**
 * Every trait the player holds: the acting traits, and a mastery for each
 * genre. The masteries are derived from the genre list rather than written
 * here, so the two can never fall out of step.
 */
export const ALL_TRAITS: readonly TraitDef[] = [...TRAITS, ...GENRE_MASTERIES];

export const TRAIT_BY_ID: Readonly<Record<string, TraitDef>> =
  Object.fromEntries(ALL_TRAITS.map((t) => [t.id, t]));

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

/**
 * Somebody for whom traits are read.
 *
 * The prodigy flag is the founder's, and only the founder's. They hold every
 * trait in the game at once, which for anybody else would be incoherent — half
 * of these are alternatives to the other half, and most of them are paid for
 * with a weakness somewhere else. For the one person who is the best living
 * writer, director, producer, showrunner and performer, a trait costs nothing.
 * That is the whole meaning of the flag: it does not add anything, it only
 * refuses to subtract.
 */
export interface TraitHolder {
  traits: readonly string[];
  prodigy?: boolean;
}

/**
 * System knobs where a bigger number is the worse outcome.
 *
 * Seven, and it was thirteen. The six that went — `overrunOdds`, `draftDays`,
 * `coverageDays`, `decisionDays`, `dealDays` and `healthDrain` — flipped the
 * sign for knobs no trait in the game declares, so there was nothing for any of
 * them to flip. They are the shape a deleted system leaves behind: a rule about
 * a word, kept after the word went.
 *
 * One left, and the reduction from seven is the same cut applied twice. The bar
 * used to be that a guard name a knob some trait really carries, which was a lower
 * bar than being read and was defended on the grounds that a dormant knob is
 * dormant on purpose and the guard is part of what it would mean when it wakes.
 *
 * Forty-seven of the fifty-three knobs have now gone, because dormant on purpose
 * turned out to mean dormant for good: nobody but the player holds a trait at all,
 * and the player is a prodigy at the ceiling. Six knobs are left and every one of
 * them is read. The six guards that went were guarding the other forty-seven — a
 * rule about a word, kept after the word went, which is the sentence above about
 * the eleven that came before them.
 */
export const SYSTEM_HIGHER_IS_WORSE: ReadonlySet<string> = new Set([
  'stressPerShootDay',
]);

/**
 * Attribute sheet with trait modifiers folded in and clamped to 0-100.
 *
 * `floor` is the lowest any attribute may be dragged to. It exists for the
 * prodigy, whose sheet is at the ceiling and must stay there however many
 * traits they are carrying.
 */
export function effectiveAttributes(
  sheet: AttributeSheet,
  traits: readonly string[],
  opts: { floor?: number } = {},
): AttributeSheet {
  const of: Record<string, number> = { ...(sheet.of ?? {}) };
  for (const tid of traits) {
    const mods = TRAIT_BY_ID[tid]?.attributeMods;
    if (!mods) continue;
    for (const [aid, delta] of Object.entries(mods)) {
      // A trait naming an attribute this build does not have is content from
      // another version, and it moves nothing.
      if (ATTRIBUTE_BY_ID[aid] === undefined) continue;
      const from = of[aid] ?? sheet.base;
      const floor = Math.min(opts.floor ?? 0, from);
      of[aid] = Math.max(floor, Math.min(100, from + delta));
    }
  }
  return sheetOf(sheet.base, of);
}

/** The same, read from the person, so the prodigy's floor is not forgotten. */
export function attributesOf(person: TraitHolder & { attributes: AttributeSheet }): AttributeSheet {
  return effectiveAttributes(person.attributes, person.traits, { floor: person.prodigy ? 100 : 0 });
}

/**
 * Product of every trait's multiplier for a named system knob. Default 1.
 *
 * `favourableOnly` keeps the side of each multiplier that helps and discards
 * the side that hurts — which direction that is depends on the knob, so it is
 * read from SYSTEM_HIGHER_IS_WORSE rather than assumed.
 */
export function systemModifier(
  traits: readonly string[],
  key: string,
  opts: { favourableOnly?: boolean } = {},
): number {
  const worseWhenHigher = SYSTEM_HIGHER_IS_WORSE.has(key);
  let value = 1;
  for (const tid of traits) {
    const m = TRAIT_BY_ID[tid]?.systemMods?.[key];
    if (typeof m !== 'number') continue;
    if (opts.favourableOnly && (worseWhenHigher ? m > 1 : m < 1)) continue;
    value *= m;
  }
  return value;
}

/** The same, read from the person. A trait never costs the prodigy anything. */
export function modifierFor(person: TraitHolder, key: string): number {
  return systemModifier(person.traits, key, { favourableOnly: person.prodigy === true });
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


/**
 * A trait's name as it reads on one person's sheet.
 *
 * Most traits read the same for everybody. The three that name the job —
 * method, technical, character — carry both forms, and this picks theirs.
 */
export function traitName(trait: TraitDef, person?: { pronouns: string; performerTitle?: PerformerTitle | undefined }): string {
  if (!trait.nameByTitle || !person) return trait.name;
  return trait.nameByTitle[performerTitleOf(person)];
}
