/**
 * SLATE — what a person is into.
 *
 * Three lists. Interests and genres are on the character sheet because a
 * person has them, not because the game reads them to decide how good anybody
 * is at anything. None of them did anything until 2026-09-24, when the owner
 * let an interest change how much somebody gets out of doing a thing:
 * Cooking, Fitness, Sport and the evening pastimes lift the mood and ease the
 * stress of the hour they go with (`systems/enjoyment.ts`). The crafts and
 * the genres waited for the career until 2026-09-27: a day on a job in a
 * genre somebody loves, or of Voice Acting for one who loves that, lifts
 * the mood the same way. The other crafts are trades an actor's jobs don't
 * do, and are said back.
 *
 * The crafts are the ones film and television are actually made of, from the
 * ones everybody can name to the ones only a crew knows. It says something
 * about somebody which of the trades they care about.
 *
 * The genres are the genres. Sorted by name, and held that way by a test:
 * a list this long is only usable if a reader can guess where a word will be.
 */

export interface Interest {
  id: string;
  label: string;
}

const of = (id: string, label: string): Interest => ({ id, label });

/**
 * The trades that make a film or a television show.
 *
 * Alphabetical, like the genres, because there is no other order that means
 * anything: a grip's work is not above or below a colourist's.
 */
export const CRAFT_INTERESTS: readonly Interest[] = [
  of('animation', 'Animation'),
  of('art_direction', 'Art Direction'),
  of('casting', 'Casting'),
  of('choreography', 'Choreography'),
  of('cinematography', 'Cinematography'),
  of('color_grading', 'Color Grading'),
  of('costume_design', 'Costume Design'),
  of('creature_effects', 'Creature Effects'),
  of('dialect_coaching', 'Dialect Coaching'),
  of('directing', 'Directing'),
  of('editing', 'Editing'),
  of('film_criticism', 'Film Criticism'),
  of('film_festivals', 'Film Festivals'),
  of('film_history', 'Film History'),
  of('film_preservation', 'Film Preservation'),
  of('film_scoring', 'Film Scoring'),
  of('foley', 'Foley'),
  of('hair_and_makeup', 'Hair And Makeup'),
  of('improvisation', 'Improvisation'),
  of('intimacy_coordination', 'Intimacy Coordination'),
  of('lighting', 'Lighting'),
  of('location_scouting', 'Location Scouting'),
  of('miniatures', 'Miniatures'),
  of('motion_capture', 'Motion Capture'),
  of('music_supervision', 'Music Supervision'),
  of('practical_effects', 'Practical Effects'),
  of('producing', 'Producing'),
  of('production_design', 'Production Design'),
  of('props', 'Props'),
  of('puppetry', 'Puppetry'),
  of('screenwriting', 'Screenwriting'),
  of('script_supervision', 'Script Supervision'),
  of('set_decoration', 'Set Decoration'),
  of('showrunning', 'Showrunning'),
  of('sound_design', 'Sound Design'),
  of('sound_mixing', 'Sound Mixing'),
  of('stage_combat', 'Stage Combat'),
  of('storyboarding', 'Storyboarding'),
  of('stunts', 'Stunts'),
  of('title_design', 'Title Design'),
  of('visual_effects', 'Visual Effects'),
  of('voice_acting', 'Voice Acting'),
  of('writers_rooms', 'Writers’ Rooms'),
];

/** Everything else a person can be into. The ids predate the labels. */
export const GENERAL_INTERESTS: readonly Interest[] = [
  of('animals', 'Animals'),
  of('art', 'Art'),
  of('cars', 'Cars'),
  of('cooking', 'Cooking'),
  of('design', 'Design'),
  of('fashion', 'Fashion'),
  of('film', 'Film'),
  of('fitness', 'Fitness'),
  of('games', 'Games'),
  of('history', 'History'),
  of('music', 'Music'),
  of('nature', 'Nature'),
  of('photography', 'Photography'),
  of('politics', 'Politics'),
  of('sport', 'Sport'),
  of('technology', 'Technology'),
  of('television', 'Television'),
  of('theatre', 'Theater'),
  of('travel', 'Travel'),
  of('writing', 'Writing'),
];

/**
 * Every genre a film gets filed under.
 *
 * The broad ones a listings page uses, the subgenres a critic uses, the
 * national traditions with their own names, and the movements that ended up
 * as genres because everybody kept making them.
 */
export const FILM_GENRES: readonly Interest[] = [
  of('absurdist', 'Absurdist'),
  of('action', 'Action'),
  of('action_comedy', 'Action Comedy'),
  of('adventure', 'Adventure'),
  of('alternate_history', 'Alternate History'),
  of('animated', 'Animated'),
  of('anime', 'Anime'),
  of('anthology', 'Anthology'),
  of('apocalyptic', 'Apocalyptic'),
  of('art_house', 'Art House'),
  of('avant_garde', 'Avant-Garde'),
  of('backstage_musical', 'Backstage Musical'),
  of('biker', 'Biker'),
  of('biographical', 'Biographical'),
  of('black_comedy', 'Black Comedy'),
  of('blaxploitation', 'Blaxploitation'),
  of('body_horror', 'Body Horror'),
  of('buddy_comedy', 'Buddy Comedy'),
  of('buddy_cop', 'Buddy Cop'),
  of('caper', 'Caper'),
  of('chanbara', 'Chanbara'),
  of('chase', 'Chase'),
  of('childrens', 'Children’s'),
  of('christmas', 'Christmas'),
  of('comedy', 'Comedy'),
  of('coming_of_age', 'Coming Of Age'),
  of('concert_film', 'Concert Film'),
  of('conspiracy_thriller', 'Conspiracy Thriller'),
  of('cosmic_horror', 'Cosmic Horror'),
  of('costume_drama', 'Costume Drama'),
  of('courtroom_drama', 'Courtroom Drama'),
  of('creature_feature', 'Creature Feature'),
  of('crime', 'Crime'),
  of('cyberpunk', 'Cyberpunk'),
  of('dance', 'Dance'),
  of('dark_fantasy', 'Dark Fantasy'),
  of('detective', 'Detective'),
  of('disaster', 'Disaster'),
  of('docudrama', 'Docudrama'),
  of('docufiction', 'Docufiction'),
  of('documentary', 'Documentary'),
  of('domestic_drama', 'Domestic Drama'),
  of('drama', 'Drama'),
  of('dystopian', 'Dystopian'),
  of('eco_horror', 'Eco-Horror'),
  of('epic', 'Epic'),
  of('erotic_thriller', 'Erotic Thriller'),
  of('espionage', 'Espionage'),
  of('experimental', 'Experimental'),
  of('exploitation', 'Exploitation'),
  of('fairy_tale', 'Fairy Tale'),
  of('family', 'Family'),
  of('fantasy', 'Fantasy'),
  of('farce', 'Farce'),
  of('film_noir', 'Film Noir'),
  of('folk_horror', 'Folk Horror'),
  of('found_footage', 'Found Footage'),
  of('gangster', 'Gangster'),
  of('giallo', 'Giallo'),
  of('gothic_horror', 'Gothic Horror'),
  of('grindhouse', 'Grindhouse'),
  of('hangout', 'Hangout'),
  of('heist', 'Heist'),
  of('historical_drama', 'Historical Drama'),
  of('historical_fiction', 'Historical Fiction'),
  of('holiday', 'Holiday'),
  of('hood_film', 'Hood Film'),
  of('horror', 'Horror'),
  of('horror_comedy', 'Horror Comedy'),
  of('isekai', 'Isekai'),
  of('jidaigeki', 'Jidaigeki'),
  of('jukebox_musical', 'Jukebox Musical'),
  of('kaiju', 'Kaiju'),
  of('kitchen_sink', 'Kitchen Sink Drama'),
  of('legal_drama', 'Legal Drama'),
  of('magical_realism', 'Magical Realism'),
  of('martial_arts', 'Martial Arts'),
  of('medical_drama', 'Medical Drama'),
  of('melodrama', 'Melodrama'),
  of('military', 'Military'),
  of('mockumentary', 'Mockumentary'),
  of('monster_movie', 'Monster Movie'),
  of('mumblecore', 'Mumblecore'),
  of('musical', 'Musical'),
  of('mystery', 'Mystery'),
  of('nature_documentary', 'Nature Documentary'),
  of('neo_noir', 'Neo-Noir'),
  of('neorealism', 'Neorealism'),
  of('new_wave', 'New Wave'),
  of('nordic_noir', 'Nordic Noir'),
  of('occult', 'Occult'),
  of('parody', 'Parody'),
  of('period_drama', 'Period Drama'),
  of('picaresque', 'Picaresque'),
  of('police_procedural', 'Police Procedural'),
  of('political_drama', 'Political Drama'),
  of('political_thriller', 'Political Thriller'),
  of('post_apocalyptic', 'Post-Apocalyptic'),
  of('prison_film', 'Prison Film'),
  of('psychological_horror', 'Psychological Horror'),
  of('psychological_thriller', 'Psychological Thriller'),
  of('queer_cinema', 'Queer Cinema'),
  of('revenge', 'Revenge'),
  of('road_movie', 'Road Movie'),
  of('rockumentary', 'Rockumentary'),
  of('romance', 'Romance'),
  of('romantic_comedy', 'Romantic Comedy'),
  of('romantic_drama', 'Romantic Drama'),
  of('samurai', 'Samurai'),
  of('satire', 'Satire'),
  of('science_fantasy', 'Science Fantasy'),
  of('science_fiction', 'Science Fiction'),
  of('screwball_comedy', 'Screwball Comedy'),
  of('sea_adventure', 'Sea Adventure'),
  of('silent_film', 'Silent Film'),
  of('slapstick', 'Slapstick'),
  of('slasher', 'Slasher'),
  of('slice_of_life', 'Slice Of Life'),
  of('social_realism', 'Social Realism'),
  of('space_opera', 'Space Opera'),
  of('spaghetti_western', 'Spaghetti Western'),
  of('splatter', 'Splatter'),
  of('sports', 'Sports'),
  of('spy', 'Spy'),
  of('steampunk', 'Steampunk'),
  of('stoner_comedy', 'Stoner Comedy'),
  of('superhero', 'Superhero'),
  of('supernatural', 'Supernatural'),
  of('surrealist', 'Surrealist'),
  of('survival', 'Survival'),
  of('swashbuckler', 'Swashbuckler'),
  of('sword_and_sandal', 'Sword And Sandal'),
  of('sword_and_sorcery', 'Sword And Sorcery'),
  of('techno_thriller', 'Techno-Thriller'),
  of('teen', 'Teen'),
  of('thriller', 'Thriller'),
  of('time_travel', 'Time Travel'),
  of('tokusatsu', 'Tokusatsu'),
  of('tragedy', 'Tragedy'),
  of('tragicomedy', 'Tragicomedy'),
  of('true_crime', 'True Crime'),
  of('vampire', 'Vampire'),
  of('war', 'War'),
  of('werewolf', 'Werewolf'),
  of('western', 'Western'),
  of('whodunit', 'Whodunit'),
  of('wuxia', 'Wuxia'),
  of('yakuza', 'Yakuza'),
  of('zombie', 'Zombie'),
];

/** Every interest the creation screen offers, craft and general together. */
export const ALL_INTERESTS: readonly Interest[] = [...CRAFT_INTERESTS, ...GENERAL_INTERESTS];

export const INTEREST_BY_ID: Readonly<Record<string, Interest>> = Object.fromEntries(
  ALL_INTERESTS.map((one) => [one.id, one]),
);

export const GENRE_BY_ID: Readonly<Record<string, Interest>> = Object.fromEntries(
  FILM_GENRES.map((one) => [one.id, one]),
);

/** Whether a list of names is in the order a reader would look for them in. */
export function isAlphabetical(items: readonly Interest[]): boolean {
  for (let i = 1; i < items.length; i++) {
    if (items[i - 1]!.label.localeCompare(items[i]!.label, 'en') > 0) return false;
  }
  return true;
}
