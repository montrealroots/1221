/**
 * SLATE — the channels of the video app.
 *
 * The contract asked for the app rather than a panel of numbers, and an app is
 * nothing without a world on the other side of it. This is that world: two
 * hundred and forty channels across twenty subjects, each with a name, a
 * handle, a subject, a size, a rhythm it uploads on, and a voice it speaks in.
 *
 * **These channels are SLATE's, not the real internet's.** They are invented,
 * and deliberately so. A real channel's subscriber count moves every hour and
 * nobody can state one honestly inside a game, so rather than putting a real
 * name next to a number that would be wrong the moment it was written, the app
 * is populated with creators of its own. What is real in it is the shape: how
 * a subject sounds, how often a channel of that size posts, and how an audience
 * of that size behaves.
 *
 * The titles are generated. A channel that has been running four years has put
 * out a few hundred videos, and hand-writing that is neither possible nor the
 * point; what matters is that two videos are never the same and that a title
 * reads like something a person would click.
 */

/** What a channel is about, which drives its titles, its audience and its comments. */
export const TOPICS = [
  'film', 'making', 'acting', 'cooking', 'cars', 'fitness', 'music', 'tech',
  'travel', 'comedy', 'news', 'fashion', 'gaming', 'home', 'money', 'science',
  'history', 'outdoors', 'craft', 'talk',
] as const;

export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABEL: Readonly<Record<Topic, string>> = {
  film: 'Film', making: 'Filmmaking', acting: 'Acting', cooking: 'Cooking',
  cars: 'Cars', fitness: 'Fitness', music: 'Music', tech: 'Technology',
  travel: 'Travel', comedy: 'Comedy', news: 'News', fashion: 'Fashion',
  gaming: 'Gaming', home: 'Home', money: 'Money', science: 'Science',
  history: 'History', outdoors: 'Outdoors', craft: 'Making Things', talk: 'Interviews',
};

/** What an hour of it does to you, which is not the same for all of them. */
export const TOPIC_EFFECT: Readonly<Record<Topic, { morale: number; energy: number; stress: number; note: string }>> = {
  film: { morale: 6, energy: -2, stress: -4, note: 'You come away wanting to make something.' },
  making: { morale: 5, energy: -3, stress: -2, note: 'Half of it is technique you will actually use.' },
  acting: { morale: 5, energy: -2, stress: -3, note: 'Watching somebody good is its own lesson.' },
  cooking: { morale: 7, energy: -1, stress: -6, note: 'Nothing in the world is calmer than a knife on a board.' },
  cars: { morale: 6, energy: -2, stress: -3, note: 'Loud, and none of it your problem.' },
  fitness: { morale: 3, energy: -1, stress: -1, note: 'Watching training is not training.' },
  music: { morale: 8, energy: 2, stress: -7, note: 'It sits with you afterwards.' },
  tech: { morale: 4, energy: -3, stress: 0, note: 'You now want something you did not know existed.' },
  travel: { morale: 8, energy: -1, stress: -6, note: 'Somewhere else, for an hour, at no cost.' },
  comedy: { morale: 10, energy: 1, stress: -9, note: 'You laughed properly at least twice.' },
  news: { morale: -4, energy: -4, stress: 7, note: 'You are better informed and worse off.' },
  fashion: { morale: 5, energy: -2, stress: -2, note: 'You have opinions about a hem now.' },
  gaming: { morale: 7, energy: -4, stress: -5, note: 'Three hours can go like that.' },
  home: { morale: 5, energy: -2, stress: -4, note: 'You look around your own place differently.' },
  money: { morale: 1, energy: -4, stress: 3, note: 'Sensible, and slightly alarming.' },
  science: { morale: 6, energy: -3, stress: -3, note: 'You understood about two thirds of it.' },
  history: { morale: 6, energy: -3, stress: -4, note: 'One long thing, told properly.' },
  outdoors: { morale: 7, energy: -1, stress: -7, note: 'Weather, distance, and nobody talking.' },
  craft: { morale: 7, energy: -2, stress: -6, note: 'Somebody making a thing well, start to finish.' },
  talk: { morale: 5, energy: -3, stress: -2, note: 'Two people talking for three hours, and it went quickly.' },
};

export interface ChannelSeed {
  id: string;
  name: string;
  handle: string;
  topic: Topic;
  /** Subscribers when the save begins. */
  subscribers: number;
  /** Days between uploads. */
  cadenceDays: number;
  /** 0-100 how good they are at it. */
  craft: number;
  tone: string;
  about: string;
}

/**
 * Channels whose whole identity is a length. A daily twelve minute brief is
 * twelve minutes, and a channel that promises forty minute essays delivers
 * them, so these override the usual range rather than being a rough average.
 */
export const RUNTIMES: Readonly<Record<string, readonly [number, number]>> = {
  c_the_morning_desk: [10, 14],
  c_the_long_take: [34, 58],
  c_three_hours: [124, 208],
  c_the_contract_read: [46, 95],
  c_the_wire: [3, 8],
  c_box_office_desk: [7, 13],
  c_mobility_monday: [12, 18],
  c_take_seventeen: [4, 11],
  c_corpsing: [5, 12],
  c_two_takes: [2, 6],
  c_the_long_answer: [52, 78],
  c_long_form_report: [34, 52],
  c_the_industry_brief: [6, 12],
  c_the_joiners_bench: [22, 46],
  c_restoration_bench: [26, 55],
};

function ch(
  id: string, name: string, handle: string, topic: Topic,
  subscribers: number, cadenceDays: number, craft: number, tone: string, about: string,
): ChannelSeed {
  return { id, name, handle, topic, subscribers, cadenceDays, craft, tone, about };
}

// ---------------------------------------------------------------------------
// The roster
// ---------------------------------------------------------------------------

const FILM: ChannelSeed[] = [
  ch('c_frame_by_frame', 'Frame By Frame', 'framebyframe', 'film', 2_840_000, 11, 92, 'essayist', 'One shot, taken apart, for as long as it takes.'),
  ch('c_the_cutting_room', 'The Cutting Room', 'cuttingroom', 'film', 1_420_000, 9, 88, 'essayist', 'Editing, and why you did not notice it.'),
  ch('c_second_unit', 'Second Unit', 'secondunit', 'film', 940_000, 7, 84, 'enthusiast', 'The parts of a picture nobody credits.'),
  ch('c_reel_talk', 'Reel Talk', 'reeltalk', 'film', 3_610_000, 3, 71, 'loud', 'Reviews on the Friday, argument by the Sunday.'),
  ch('c_the_long_take', 'The Long Take', 'thelongtake', 'film', 612_000, 21, 95, 'quiet', 'Forty minute video essays and no apologies.'),
  ch('c_bad_movie_club', 'Bad Movie Club', 'badmovieclub', 'film', 5_200_000, 5, 62, 'loud', 'We watched it so you have to hear about it.'),
  ch('c_the_archive_seat', 'The Archive Seat', 'archiveseat', 'film', 289_000, 14, 90, 'quiet', 'Prints, restorations and the reasons films go missing.'),
  ch('c_first_watch', 'First Watch', 'firstwatch', 'film', 1_880_000, 4, 66, 'warm', 'Seeing the classics for the first time, on camera.'),
  ch('c_double_bill', 'Double Bill', 'doublebill', 'film', 447_000, 10, 81, 'warm', 'Two films that explain each other.'),
  ch('c_the_credits_roll', 'The Credits Roll', 'creditsroll', 'film', 733_000, 8, 79, 'essayist', 'Who actually made it, and what they did.'),
  ch('c_box_office_desk', 'Box Office Desk', 'boxofficedesk', 'film', 1_060_000, 2, 68, 'brisk', 'Weekend numbers, Monday morning, no spin.'),
  ch('c_the_third_act', 'The Third Act', 'thirdact', 'film', 358_000, 12, 86, 'essayist', 'Endings, and why most of them are not earned.'),
];

const MAKING: ChannelSeed[] = [
  ch('c_no_budget_no_excuse', 'No Budget No Excuse', 'nobudget', 'making', 1_210_000, 7, 87, 'warm', 'Films made for the price of a used car.'),
  ch('c_the_gaffer', 'The Gaffer', 'thegaffer', 'making', 486_000, 9, 93, 'brisk', 'Lighting, properly, by somebody who does it for a living.'),
  ch('c_camera_department', 'Camera Department', 'cameradept', 'making', 812_000, 6, 89, 'brisk', 'Bodies, glass, and what actually matters on the day.'),
  ch('c_sound_first', 'Sound First', 'soundfirst', 'making', 244_000, 11, 91, 'quiet', 'Because bad sound is the only unforgivable one.'),
  ch('c_the_edit_bay', 'The Edit Bay', 'editbay', 'making', 977_000, 5, 84, 'warm', 'Cuts, assemblies and the second week of despair.'),
  ch('c_grip_and_grin', 'Grip And Grin', 'gripandgrin', 'making', 163_000, 8, 80, 'loud', 'Rigging, stands, sandbags, and not dying.'),
  ch('c_the_colour_bay', 'The Color Bay', 'colorbay', 'making', 331_000, 13, 90, 'quiet', 'Grading, and how a look is actually built.'),
  ch('c_indie_producer', 'Indie Producer', 'indieproducer', 'making', 592_000, 7, 83, 'brisk', 'Schedules, budgets, permits and the phone calls.'),
  ch('c_the_script_desk', 'The Script Desk', 'scriptdesk', 'making', 1_340_000, 6, 85, 'warm', 'Structure, rewrites and the page that fixes everything.'),
  ch('c_location_scout', 'Location Scout', 'locationscout', 'making', 208_000, 15, 82, 'quiet', 'Finding the place, and getting permission for it.'),
  ch('c_the_stunt_pad', 'The Stunt Pad', 'stuntpad', 'making', 1_480_000, 9, 88, 'loud', 'How the fall was done, by the people who fell.'),
  ch('c_practical_effects', 'Practical Effects', 'practicalfx', 'making', 2_020_000, 10, 91, 'warm', 'Foam, latex, fire and a very steady hand.'),
];

const ACTING: ChannelSeed[] = [
  ch('c_the_audition_room', 'The Audition Room', 'auditionroom', 'acting', 704_000, 8, 88, 'warm', 'Tapes, rooms, callbacks and what the reader is thinking.'),
  ch('c_scene_study', 'Scene Study', 'scenestudy', 'acting', 421_000, 10, 90, 'quiet', 'Two pages, four ways, and why one of them works.'),
  ch('c_working_actor', 'Working Actor', 'workingactor', 'acting', 1_090_000, 6, 82, 'warm', 'The trade, not the fantasy.'),
  ch('c_the_cold_read', 'The Cold Read', 'coldread', 'acting', 268_000, 12, 86, 'brisk', 'Sight reading, out loud, unrehearsed.'),
  ch('c_voice_and_body', 'Voice And Body', 'voiceandbody', 'acting', 337_000, 9, 89, 'quiet', 'Breath, placement, and standing still convincingly.'),
  ch('c_the_callback', 'The Callback', 'thecallback', 'acting', 813_000, 5, 74, 'loud', 'Casting news, and who nearly had it.'),
  ch('c_on_camera', 'On Camera', 'oncamera', 'acting', 549_000, 7, 85, 'brisk', 'What a lens does to a performance.'),
  ch('c_the_green_room', 'The Green Room', 'thegreenroom', 'acting', 1_620_000, 11, 80, 'warm', 'Long conversations with people who work.'),
  ch('c_theatre_notes', 'Theater Notes', 'theaternotes', 'acting', 141_000, 14, 91, 'quiet', 'Stage craft, from people who tour it.'),
  ch('c_first_position', 'First Position', 'firstposition', 'acting', 226_000, 13, 87, 'quiet', 'Movement, dance and how bodies read on screen.'),
  ch('c_the_dialect_desk', 'The Dialect Desk', 'dialectdesk', 'acting', 902_000, 8, 92, 'warm', 'Accents, and the three that everybody gets wrong.'),
  ch('c_take_seventeen', 'Take Seventeen', 'takeseventeen', 'acting', 3_180_000, 4, 63, 'loud', 'Outtakes, corpsing and going again.'),
];

const COOKING: ChannelSeed[] = [
  ch('c_one_pan', 'One Pan', 'onepan', 'cooking', 4_120_000, 3, 84, 'warm', 'Dinner, one pan, forty minutes, no fuss.'),
  ch('c_the_proving_drawer', 'The Proving Drawer', 'provingdrawer', 'cooking', 1_760_000, 7, 93, 'quiet', 'Bread, slowly, in real time.'),
  ch('c_knife_work', 'Knife Work', 'knifework', 'cooking', 2_340_000, 5, 91, 'brisk', 'Technique first. Recipes are downstream of it.'),
  ch('c_sunday_lunch', 'Sunday Lunch', 'sundaylunch', 'cooking', 987_000, 7, 86, 'warm', 'One big meal a week, done properly.'),
  ch('c_market_day', 'Market Day', 'marketday', 'cooking', 612_000, 9, 88, 'warm', 'What is good this week, and what to do with it.'),
  ch('c_the_test_kitchen_bench', 'The Test Bench', 'testbench', 'cooking', 3_050_000, 4, 90, 'brisk', 'Six versions of one thing until it is right.'),
  ch('c_late_night_eggs', 'Late Night Eggs', 'latenighteggs', 'cooking', 1_410_000, 2, 76, 'loud', 'Cooking at one in the morning like a person.'),
  ch('c_the_stock_pot', 'The Stock Pot', 'thestockpot', 'cooking', 448_000, 11, 92, 'quiet', 'Stocks, sauces and the things underneath everything.'),
  ch('c_two_burners', 'Two Burners', 'twoburners', 'cooking', 2_680_000, 4, 82, 'warm', 'Small kitchen, no space, still eating well.'),
  ch('c_the_cake_table', 'The Cake Table', 'cakemtable', 'cooking', 1_930_000, 6, 89, 'warm', 'Baking, measured, patient and forgiving.'),
  ch('c_fire_and_smoke', 'Fire And Smoke', 'fireandsmoke', 'cooking', 2_270_000, 8, 87, 'loud', 'Live fire, all year, in all weather.'),
  ch('c_the_pantry_shelf', 'The Pantry Shelf', 'pantryshelf', 'cooking', 726_000, 10, 85, 'quiet', 'Preserving, pickling and making it last.'),
];

const CARS: ChannelSeed[] = [
  ch('c_the_workshop_floor', 'The Workshop Floor', 'workshopfloor', 'cars', 3_420_000, 6, 90, 'brisk', 'Spanners, diagnostics and honest labor times.'),
  ch('c_apex_and_exit', 'Apex And Exit', 'apexandexit', 'cars', 1_880_000, 5, 87, 'loud', 'Driving fast, on a track, legally.'),
  ch('c_barn_find', 'Barn Find', 'barnfind', 'cars', 2_640_000, 9, 84, 'warm', 'Dragging something dead back into the light.'),
  ch('c_the_long_test', 'The Long Test', 'thelongtest', 'cars', 1_120_000, 12, 89, 'quiet', 'Six months with one car, then a verdict.'),
  ch('c_two_wheels', 'Two Wheels', 'twowheels', 'cars', 987_000, 7, 85, 'warm', 'Motorcycles, and the roads worth the ride.'),
  ch('c_used_and_abused', 'Used And Abused', 'usedandabused', 'cars', 4_060_000, 4, 72, 'loud', 'Cheap cars, terrible decisions, good television.'),
  ch('c_the_paint_booth', 'The Paint Booth', 'paintbooth', 'cars', 543_000, 14, 92, 'quiet', 'Bodywork, primer, color and patience.'),
  ch('c_electric_daily', 'Electric Daily', 'electricdaily', 'cars', 1_390_000, 6, 81, 'brisk', 'Living with the batteries, not arguing about them.'),
  ch('c_the_auction_block', 'The Auction Block', 'auctionblock', 'cars', 812_000, 8, 83, 'brisk', 'What sold, for what, and whether it was mad.'),
  ch('c_garage_built', 'Garage Built', 'garagebuilt', 'cars', 1_570_000, 10, 88, 'warm', 'One build, followed all the way through.'),
  ch('c_the_road_trip_seat', 'The Road Trip Seat', 'roadtripseat', 'cars', 668_000, 13, 86, 'quiet', 'Long distances, in old cars, on purpose.'),
  ch('c_engine_bay', 'Engine Bay', 'enginebay', 'cars', 429_000, 9, 91, 'brisk', 'How the thing under the lid actually works.'),
];

const FITNESS: ChannelSeed[] = [
  ch('c_the_barbell_room', 'The Barbell Room', 'barbellroom', 'fitness', 2_180_000, 4, 88, 'brisk', 'Strength, programmed, boring and effective.'),
  ch('c_run_easy', 'Run Easy', 'runeasy', 'fitness', 1_340_000, 5, 86, 'warm', 'Miles at a conversational pace, mostly.'),
  ch('c_the_rehab_bench', 'The Rehab Bench', 'rehabbench', 'fitness', 743_000, 8, 92, 'quiet', 'Coming back from the injury properly.'),
  ch('c_kitchen_and_gym', 'Kitchen And Gym', 'kitchenandgym', 'fitness', 1_920_000, 6, 79, 'warm', 'Eating for it without making it your identity.'),
  ch('c_mobility_monday', 'Mobility Monday', 'mobilitymonday', 'fitness', 986_000, 7, 84, 'quiet', 'Fifteen minutes, every week, for your hips.'),
  ch('c_the_lifting_log', 'The Lifting Log', 'liftinglog', 'fitness', 511_000, 3, 81, 'brisk', 'One person, one log, four years of it.'),
  ch('c_cold_water', 'Cold Water', 'coldwater', 'fitness', 1_610_000, 9, 74, 'loud', 'Swimming outdoors, all year, arguing about it.'),
  ch('c_the_climbing_wall', 'The Climbing Wall', 'climbingwall', 'fitness', 1_270_000, 6, 87, 'warm', 'Fingers, footwork and falling off gracefully.'),
  ch('c_home_gym_build', 'Home Gym Build', 'homegymbuild', 'fitness', 634_000, 11, 83, 'brisk', 'A garage, a rack and a budget.'),
  ch('c_the_long_walk', 'The Long Walk', 'thelongwalk', 'fitness', 892_000, 10, 85, 'quiet', 'Walking, which is the underrated one.'),
  ch('c_ring_work', 'Ring Work', 'ringwork', 'fitness', 1_480_000, 5, 89, 'loud', 'Boxing, pads, footwork and the first three rounds.'),
  ch('c_sleep_and_recover', 'Sleep And Recover', 'sleepandrecover', 'fitness', 2_040_000, 8, 80, 'quiet', 'The half of training nobody films.'),
];

const MUSIC: ChannelSeed[] = [
  ch('c_the_live_room', 'The Live Room', 'theliveroom', 'music', 3_260_000, 7, 93, 'warm', 'One band, one room, one take.'),
  ch('c_mix_notes', 'Mix Notes', 'mixnotes', 'music', 891_000, 9, 91, 'brisk', 'What a mix engineer actually does to a song.'),
  ch('c_four_chords', 'Four Chords', 'fourchords', 'music', 2_710_000, 4, 78, 'loud', 'Why that one goes round your head all day.'),
  ch('c_the_practice_room', 'The Practice Room', 'practiceroom', 'music', 654_000, 6, 88, 'quiet', 'Scales, tone and the boring hours.'),
  ch('c_sample_and_hold', 'Sample And Hold', 'sampleandhold', 'music', 1_180_000, 8, 87, 'brisk', 'Synths, hardware and happy accidents.'),
  ch('c_the_score_desk', 'The Score Desk', 'scoredesk', 'music', 1_460_000, 11, 92, 'essayist', 'Film music, taken apart bar by bar.'),
  ch('c_open_mic', 'Open Mic', 'openmic', 'music', 428_000, 5, 74, 'warm', 'Small rooms, new songs, some of them terrible.'),
  ch('c_vinyl_shelf', 'Vinyl Shelf', 'vinylshelf', 'music', 776_000, 10, 82, 'quiet', 'Records, sleeves and where they came from.'),
  ch('c_the_drum_riser', 'The Drum Riser', 'drumriser', 'music', 1_020_000, 6, 90, 'loud', 'Grooves, fills and why that one hits.'),
  ch('c_songwriting_desk', 'Songwriting Desk', 'songwritingdesk', 'music', 592_000, 9, 89, 'warm', 'From a hum in the car to a finished second verse.'),
  ch('c_the_pit', 'The Pit', 'thepit', 'music', 2_390_000, 3, 71, 'loud', 'Live shows from the front, badly lit, brilliant.'),
  ch('c_choir_stalls', 'Choir Stalls', 'choirstalls', 'music', 213_000, 15, 90, 'quiet', 'Voices in old buildings, unaccompanied.'),
];

const TECH: ChannelSeed[] = [
  ch('c_the_bench_test', 'The Bench Test', 'benchtest', 'tech', 4_480_000, 5, 89, 'brisk', 'Measured, repeatable, no sponsorship in the numbers.'),
  ch('c_teardown', 'Teardown', 'teardown', 'tech', 2_140_000, 8, 92, 'quiet', 'Opening it up to see who actually built it.'),
  ch('c_daily_driver', 'Daily Driver', 'dailydriver', 'tech', 3_710_000, 4, 76, 'warm', 'Living with it for a month before saying anything.'),
  ch('c_the_terminal', 'The Terminal', 'theterminal', 'tech', 687_000, 9, 94, 'brisk', 'Software, from the command line up.'),
  ch('c_old_hardware', 'Old Hardware', 'oldhardware', 'tech', 1_290_000, 11, 88, 'quiet', 'Machines from before, still running.'),
  ch('c_the_repair_desk', 'The Repair Desk', 'repairdesk', 'tech', 1_830_000, 7, 91, 'brisk', 'Fixing what you were told to replace.'),
  ch('c_signal_path', 'Signal Path', 'signalpath', 'tech', 512_000, 12, 90, 'quiet', 'Audio hardware, measured properly.'),
  ch('c_pocket_sized', 'Pocket Sized', 'pocketsized', 'tech', 5_620_000, 3, 70, 'loud', 'Phones, fast, loud and first.'),
  ch('c_the_photo_lab', 'The Photo Lab', 'thephotolab', 'tech', 964_000, 8, 89, 'warm', 'Cameras, lenses and pictures rather than specs.'),
  ch('c_home_server', 'Home Server', 'homeserver', 'tech', 743_000, 10, 87, 'brisk', 'Running your own, in a cupboard, on purpose.'),
  ch('c_the_screen_test', 'The Screen Test', 'screentest', 'tech', 1_120_000, 9, 91, 'quiet', 'Displays, color and what a calibration is for.'),
  ch('c_first_boot', 'First Boot', 'firstboot', 'tech', 2_260_000, 6, 79, 'warm', 'Unboxing without pretending it is an event.'),
];

const TRAVEL: ChannelSeed[] = [
  ch('c_slow_road', 'Slow Road', 'slowroad', 'travel', 2_910_000, 9, 90, 'quiet', 'Overland, unhurried, one country at a time.'),
  ch('c_the_night_train', 'The Night Train', 'nighttrain', 'travel', 1_340_000, 12, 92, 'quiet', 'Sleepers, couchettes and waking up somewhere else.'),
  ch('c_two_days_in', 'Two Days In', 'twodaysin', 'travel', 3_480_000, 5, 81, 'warm', 'A city, a weekend, an honest budget.'),
  ch('c_the_ferry_deck', 'The Ferry Deck', 'ferrydeck', 'travel', 612_000, 14, 88, 'quiet', 'Islands, crossings and bad coffee at sea.'),
  ch('c_border_town', 'Border Town', 'bordertown', 'travel', 874_000, 11, 89, 'essayist', 'The places either side of a line on a map.'),
  ch('c_economy_seat', 'Economy Seat', 'economyseat', 'travel', 4_220_000, 4, 73, 'loud', 'Flying badly, in detail, for your entertainment.'),
  ch('c_the_walking_route', 'The Walking Route', 'walkingroute', 'travel', 1_060_000, 10, 90, 'quiet', 'Long distance paths, filmed as they are walked.'),
  ch('c_market_streets', 'Market Streets', 'marketstreets', 'travel', 1_720_000, 6, 85, 'warm', 'Eating where people actually eat.'),
  ch('c_the_last_stop', 'The Last Stop', 'thelaststop', 'travel', 448_000, 15, 91, 'quiet', 'The end of the line, wherever that is.'),
  ch('c_out_of_season', 'Out Of Season', 'outofseason', 'travel', 967_000, 13, 87, 'quiet', 'Resorts in February, and why they are better.'),
  ch('c_the_visa_desk', 'The Visa Desk', 'visadesk', 'travel', 336_000, 9, 84, 'brisk', 'Paperwork, honestly, before you book anything.'),
  ch('c_hotel_review_room', 'The Hotel Room', 'thehotelroom', 'travel', 1_490_000, 7, 82, 'warm', 'One room, filmed properly, no euphemisms.'),
];

const COMEDY: ChannelSeed[] = [
  ch('c_the_back_room', 'The Back Room', 'thebackroom', 'comedy', 2_640_000, 5, 86, 'loud', 'Stand up from rooms above pubs.'),
  ch('c_two_takes', 'Two Takes', 'twotakes', 'comedy', 3_910_000, 3, 79, 'loud', 'Sketches, short, unserious.'),
  ch('c_the_panel_seat', 'The Panel Seat', 'panelseat', 'comedy', 1_820_000, 7, 81, 'warm', 'Four people, one topic, no structure.'),
  ch('c_bit_by_bit', 'Bit By Bit', 'bitbybit', 'comedy', 748_000, 10, 90, 'essayist', 'How a joke is actually built.'),
  ch('c_corpsing', 'Corpsing', 'corpsing', 'comedy', 5_040_000, 4, 68, 'loud', 'People failing to keep a straight face.'),
  ch('c_the_open_spot', 'The Open Spot', 'openspot', 'comedy', 392_000, 6, 77, 'warm', 'First gigs, filmed, with permission.'),
  ch('c_improv_night', 'Improv Night', 'improvnight', 'comedy', 1_170_000, 8, 84, 'warm', 'One suggestion, then whatever happens.'),
  ch('c_the_heckle', 'The Heckle', 'theheckle', 'comedy', 2_280_000, 5, 74, 'loud', 'Crowd work, and the nights it goes wrong.'),
  ch('c_dry_material', 'Dry Material', 'drymaterial', 'comedy', 634_000, 12, 88, 'quiet', 'Very slow jokes for very patient people.'),
  ch('c_the_prank_line', 'The Prank Line', 'pranklinemn', 'comedy', 4_460_000, 4, 61, 'loud', 'Nothing here is your problem.'),
  ch('c_late_set', 'Late Set', 'lateset', 'comedy', 1_390_000, 9, 85, 'loud', 'The eleven o clock crowd, which is a different animal.'),
  ch('c_written_down', 'Written Down', 'writtendown', 'comedy', 516_000, 11, 89, 'essayist', 'Comedy writing, on the page, before anybody says it.'),
];

const NEWS: ChannelSeed[] = [
  ch('c_the_morning_desk', 'The Morning Desk', 'morningdesk', 'news', 4_820_000, 1, 78, 'brisk', 'Twelve minutes, every morning, no shouting.'),
  ch('c_long_form_report', 'Long Form Report', 'longformreport', 'news', 1_640_000, 14, 93, 'quiet', 'One story, six weeks, forty minutes.'),
  ch('c_the_fact_check', 'The Fact Check', 'thefactcheck', 'news', 2_070_000, 4, 89, 'brisk', 'Sources shown on screen or it does not count.'),
  ch('c_the_industry_brief', 'The Industry Brief', 'industrybrief', 'news', 736_000, 2, 84, 'brisk', 'What moved in the trade today.'),
  ch('c_local_paper', 'Local Paper', 'localpaper', 'news', 288_000, 3, 81, 'warm', 'Council meetings, potholes and planning rows.'),
  ch('c_the_wire', 'The Wire Desk', 'thewiredesk', 'news', 3_140_000, 1, 72, 'loud', 'Fast, first, occasionally wrong.'),
  ch('c_court_report', 'Court Report', 'courtreport', 'news', 512_000, 5, 90, 'quiet', 'From the public gallery, notebook only.'),
  ch('c_the_numbers_desk', 'The Numbers Desk', 'numbersdesk', 'news', 964_000, 6, 92, 'brisk', 'The chart, the source, and what it does not show.'),
  ch('c_foreign_desk', 'Foreign Desk', 'foreigndesk', 'news', 1_880_000, 3, 87, 'quiet', 'Reporting from the place it is happening.'),
  ch('c_the_correction', 'The Correction', 'thecorrection', 'news', 341_000, 9, 91, 'quiet', 'What we got wrong last month, and why.'),
  ch('c_press_gallery', 'Press Gallery', 'pressgallery', 'news', 1_230_000, 2, 79, 'brisk', 'Politics, plainly, without the theater.'),
  ch('c_the_science_brief', 'The Science Brief', 'sciencebrief', 'news', 1_570_000, 4, 88, 'brisk', 'Papers read properly before they are reported.'),
];

const FASHION: ChannelSeed[] = [
  ch('c_the_fitting_room', 'The Fitting Room', 'fittingroom', 'fashion', 2_240_000, 5, 87, 'warm', 'Cut, fit and why that jacket is wrong on you.'),
  ch('c_cloth_and_thread', 'Cloth And Thread', 'clothandthread', 'fashion', 684_000, 10, 93, 'quiet', 'Fabric, mills and what a cloth actually is.'),
  ch('c_front_row', 'Front Row', 'frontrow', 'fashion', 3_060_000, 6, 79, 'loud', 'Shows, seasons and who sat where.'),
  ch('c_second_hand', 'Second Hand', 'secondhand', 'fashion', 1_490_000, 4, 82, 'warm', 'Charity shops, markets and better clothes for less.'),
  ch('c_the_cobblers_bench', 'The Cobblers Bench', 'cobblersbench', 'fashion', 392_000, 12, 92, 'quiet', 'Shoes made, repaired and made to last.'),
  ch('c_capsule', 'Capsule', 'capsule', 'fashion', 1_820_000, 7, 84, 'brisk', 'Fewer clothes, chosen better.'),
  ch('c_the_alterations_table', 'The Alterations Table', 'alterationstable', 'fashion', 547_000, 9, 90, 'quiet', 'A tailor showing what a fitting really changes.'),
  ch('c_street_and_season', 'Street And Season', 'streetandseason', 'fashion', 2_680_000, 3, 74, 'loud', 'What people are actually wearing this month.'),
  ch('c_the_watch_case', 'The Watch Case', 'thewatchcase', 'fashion', 1_140_000, 8, 89, 'quiet', 'Movements, cases and honest prices.'),
  ch('c_wardrobe_audit', 'Wardrobe Audit', 'wardrobeaudit', 'fashion', 963_000, 11, 83, 'warm', 'Emptying somebody wardrobe on the floor and starting again.'),
  ch('c_the_knitwear_room', 'The Knitwear Room', 'knitwearroom', 'fashion', 726_000, 9, 86, 'warm', 'Wool, gauge and the jumper that lasts twenty years.'),
  ch('c_menswear_notes', 'Menswear Notes', 'menswearnotes', 'fashion', 418_000, 13, 91, 'essayist', 'A hundred years of one garment.'),
];

const GAMING: ChannelSeed[] = [
  ch('c_first_playthrough', 'First Playthrough', 'firstplaythrough', 'gaming', 5_840_000, 2, 74, 'loud', 'Going in blind and saying everything out loud.'),
  ch('c_the_design_desk', 'The Design Desk', 'designdesk', 'gaming', 1_260_000, 12, 93, 'essayist', 'Why that level teaches you without telling you.'),
  ch('c_speedrun_room', 'Speedrun Room', 'speedrunroom', 'gaming', 2_470_000, 5, 88, 'brisk', 'Routes, frames and a great deal of patience.'),
  ch('c_couch_co_op', 'Couch Co Op', 'couchcoop', 'gaming', 1_930_000, 4, 79, 'warm', 'Two people, one sofa, mild betrayal.'),
  ch('c_the_backlog', 'The Backlog', 'thebacklog', 'gaming', 894_000, 8, 85, 'quiet', 'Finishing the ones everybody bought and shelved.'),
  ch('c_indie_shelf', 'Indie Shelf', 'indieshelf', 'gaming', 1_120_000, 6, 87, 'warm', 'Small games that deserved more than they got.'),
  ch('c_the_patch_notes', 'The Patch Notes', 'patchnotes', 'gaming', 3_310_000, 3, 71, 'loud', 'What changed, and who is furious about it.'),
  ch('c_hardware_and_frames', 'Hardware And Frames', 'hardwareframes', 'gaming', 1_680_000, 7, 90, 'brisk', 'Benchmarks with the settings actually shown.'),
  ch('c_the_lore_desk', 'The Lore Desk', 'loredesk', 'gaming', 2_050_000, 9, 84, 'essayist', 'Four hours on a story told in item descriptions.'),
  ch('c_tabletop_night', 'Tabletop Night', 'tabletopnight', 'gaming', 762_000, 7, 86, 'warm', 'Dice, boards and people arguing about rules.'),
  ch('c_the_arcade_floor', 'The Arcade Floor', 'arcadefloor', 'gaming', 486_000, 14, 89, 'quiet', 'Cabinets, boards and machines kept alive.'),
  ch('c_hardcore_run', 'Hardcore Run', 'hardcorerun', 'gaming', 2_890_000, 4, 82, 'loud', 'One life. It has gone badly eleven times.'),
];

const HOME: ChannelSeed[] = [
  ch('c_one_room_at_a_time', 'One Room At A Time', 'oneroomatatime', 'home', 2_960_000, 10, 89, 'warm', 'A whole house, slowly, by two people.'),
  ch('c_the_tool_wall', 'The Tool Wall', 'toolwall', 'home', 1_340_000, 6, 91, 'brisk', 'What to buy, what to hire and what to leave alone.'),
  ch('c_damp_and_rot', 'Damp And Rot', 'dampandrot', 'home', 786_000, 9, 93, 'quiet', 'Old buildings, honestly diagnosed.'),
  ch('c_rented_and_fixed', 'Rented And Fixed', 'rentedandfixed', 'home', 1_620_000, 7, 82, 'warm', 'Making a rental liveable without losing the deposit.'),
  ch('c_the_planning_office', 'The Planning Office', 'planningoffice', 'home', 412_000, 13, 88, 'brisk', 'Permission, drawings and the six month wait.'),
  ch('c_small_flat', 'Small Flat', 'smallflat', 'home', 2_180_000, 5, 84, 'warm', 'Forty square meters, arranged properly.'),
  ch('c_the_garden_gate', 'The Garden Gate', 'gardengate', 'home', 1_470_000, 8, 87, 'quiet', 'A year in one garden, filmed weekly.'),
  ch('c_the_second_fix', 'The Second Fix', 'secondfix', 'home', 638_000, 11, 92, 'brisk', 'Wiring, plumbing and where the money goes.'),
  ch('c_furniture_first', 'Furniture First', 'furniturefirst', 'home', 924_000, 9, 85, 'warm', 'Buying things once, and living with them.'),
  ch('c_the_loft', 'The Loft', 'theloft', 'home', 1_060_000, 12, 86, 'quiet', 'Conversions, dormers and head height.'),
  ch('c_energy_bill', 'Energy Bill', 'energybill', 'home', 1_290_000, 10, 90, 'brisk', 'Insulation, heat pumps and the actual numbers.'),
  ch('c_the_move_in', 'The Move In', 'themovein', 'home', 573_000, 14, 83, 'warm', 'First week in a new place, unedited.'),
];

const MONEY: ChannelSeed[] = [
  ch('c_the_household_ledger', 'The Household Ledger', 'householdledger', 'money', 2_410_000, 5, 88, 'brisk', 'Ordinary budgets, shown, with real numbers.'),
  ch('c_first_paycheck', 'First Paycheck', 'firstpaycheck', 'money', 1_760_000, 7, 84, 'warm', 'For people who have never had to think about it.'),
  ch('c_the_index_shelf', 'The Index Shelf', 'indexshelf', 'money', 1_120_000, 9, 90, 'quiet', 'Boring investing, at length, on purpose.'),
  ch('c_the_tax_desk', 'The Tax Desk', 'thetaxdesk', 'money', 684_000, 11, 92, 'brisk', 'Returns, allowances and what is actually deductible.'),
  ch('c_freelance_books', 'Freelance Books', 'freelancebooks', 'money', 496_000, 8, 89, 'brisk', 'Invoicing, chasing and putting some aside.'),
  ch('c_the_mortgage_room', 'The Mortgage Room', 'mortgageroom', 'money', 938_000, 10, 87, 'quiet', 'Rates, terms and the arithmetic under the offer.'),
  ch('c_debt_free_by', 'Debt Free By', 'debtfreeby', 'money', 2_070_000, 6, 79, 'warm', 'One family, one plan, filmed to the end of it.'),
  ch('c_the_receipts', 'The Receipts', 'thereceipts', 'money', 1_540_000, 4, 76, 'loud', 'Where the month actually went.'),
  ch('c_pension_desk', 'Pension Desk', 'pensiondesk', 'money', 372_000, 13, 91, 'quiet', 'The dullest important thing there is.'),
  ch('c_the_small_business', 'The Small Business', 'thesmallbusiness', 'money', 812_000, 9, 86, 'brisk', 'Margins, staff and the first bad quarter.'),
  ch('c_price_check', 'Price Check', 'pricecheck', 'money', 1_890_000, 3, 81, 'brisk', 'What things cost now, tracked weekly.'),
  ch('c_the_contract_read', 'The Contract Read', 'contractread', 'money', 264_000, 15, 93, 'quiet', 'Reading the whole thing aloud, clause by clause.'),
];

const SCIENCE: ChannelSeed[] = [
  ch('c_the_lab_bench', 'The Lab Bench', 'thelabbench', 'science', 3_680_000, 8, 92, 'warm', 'Experiments filmed properly, failures included.'),
  ch('c_orders_of_magnitude', 'Orders Of Magnitude', 'ordersofmagnitude', 'science', 2_140_000, 12, 94, 'essayist', 'One number, taken seriously, for thirty minutes.'),
  ch('c_field_notes', 'Field Notes', 'fieldnotes', 'science', 1_260_000, 10, 90, 'quiet', 'Biology outdoors, in the mud.'),
  ch('c_the_night_sky', 'The Night Sky', 'thenightsky', 'science', 1_830_000, 7, 88, 'quiet', 'What is up there this month and how to find it.'),
  ch('c_slow_chemistry', 'Slow Chemistry', 'slowchemistry', 'science', 947_000, 11, 91, 'quiet', 'Reactions in real time, with the boring bits left in.'),
  ch('c_the_proof', 'The Proof', 'theproof', 'science', 1_420_000, 9, 93, 'essayist', 'Mathematics, worked through, not summarized.'),
  ch('c_weather_watch', 'Weather Watch', 'weatherwatch', 'science', 2_560_000, 3, 85, 'brisk', 'Why it did that, explained the next morning.'),
  ch('c_the_specimen_drawer', 'The Specimen Drawer', 'specimendrawer', 'science', 618_000, 14, 90, 'quiet', 'Museum collections, opened up.'),
  ch('c_engineering_failure', 'Engineering Failure', 'engineeringfailure', 'science', 3_020_000, 10, 92, 'brisk', 'What broke, why, and what changed after.'),
  ch('c_the_brain_room', 'The Brain Room', 'thebrainroom', 'science', 1_190_000, 8, 87, 'warm', 'Neuroscience without the headlines.'),
  ch('c_deep_water', 'Deep Water', 'deepwater', 'science', 1_670_000, 13, 91, 'quiet', 'The ocean, filmed by people who go down there.'),
  ch('c_the_replication', 'The Replication', 'thereplication', 'science', 428_000, 15, 94, 'brisk', 'Running the study again and reporting what happened.'),
];

const HISTORY: ChannelSeed[] = [
  ch('c_the_long_century', 'The Long Century', 'longcentury', 'history', 2_780_000, 12, 93, 'essayist', 'One hundred years, told in order, at length.'),
  ch('c_primary_source', 'Primary Source', 'primarysource', 'history', 1_140_000, 10, 94, 'quiet', 'Reading the document itself before saying anything.'),
  ch('c_the_dig', 'The Dig', 'thedig', 'history', 1_520_000, 14, 90, 'quiet', 'Archaeology as it actually goes, slowly.'),
  ch('c_maps_and_borders', 'Maps And Borders', 'mapsandborders', 'history', 2_360_000, 8, 87, 'essayist', 'How a line got there and who paid for it.'),
  ch('c_the_kitchen_of_1840', 'The Kitchen Of 1840', 'kitchen1840', 'history', 892_000, 11, 91, 'warm', 'Historic cooking, from the original book.'),
  ch('c_the_shipping_lane', 'The Shipping Lane', 'shippinglane', 'history', 634_000, 13, 89, 'quiet', 'Trade routes, and what moved along them.'),
  ch('c_battlefield_walk', 'Battlefield Walk', 'battlefieldwalk', 'history', 1_760_000, 9, 88, 'quiet', 'Standing on the ground and explaining the day.'),
  ch('c_the_workhouse_ledger', 'The Workhouse Ledger', 'workhouseledger', 'history', 412_000, 15, 92, 'quiet', 'Ordinary lives, from the records they left.'),
  ch('c_industrial_age', 'Industrial Age', 'industrialage', 'history', 1_290_000, 10, 90, 'brisk', 'Machines, mills and the towns they built.'),
  ch('c_the_court_record', 'The Court Record', 'thecourtrecord', 'history', 748_000, 12, 91, 'quiet', 'Trials, transcripts and what they reveal.'),
  ch('c_lost_buildings', 'Lost Buildings', 'lostbuildings', 'history', 1_060_000, 11, 89, 'essayist', 'What stood there before, and who pulled it down.'),
  ch('c_oral_history', 'Oral History', 'oralhistory', 'history', 526_000, 14, 93, 'warm', 'People in their eighties, talking, uninterrupted.'),
];

const OUTDOORS: ChannelSeed[] = [
  ch('c_the_ridge_line', 'The Ridge Line', 'ridgeline', 'outdoors', 2_240_000, 9, 90, 'quiet', 'Mountains, weather and a very light pack.'),
  ch('c_wild_camp', 'Wild Camp', 'wildcamp', 'outdoors', 1_680_000, 7, 87, 'quiet', 'One night out, filmed, in whatever it does.'),
  ch('c_the_river_bank', 'The River Bank', 'riverbank', 'outdoors', 926_000, 10, 89, 'quiet', 'Fishing, patiently, mostly unsuccessfully.'),
  ch('c_bothy_nights', 'Bothy Nights', 'bothynights', 'outdoors', 512_000, 13, 91, 'quiet', 'Stone huts, wet boots and a stove.'),
  ch('c_the_paddle', 'The Paddle', 'thepaddle', 'outdoors', 743_000, 11, 88, 'warm', 'Canoe, kayak and open water.'),
  ch('c_snow_line', 'Snow Line', 'snowline', 'outdoors', 1_390_000, 12, 90, 'brisk', 'Winter skills, avalanche sense and cold hands.'),
  ch('c_the_kit_list', 'The Kit List', 'thekitlist', 'outdoors', 1_820_000, 6, 85, 'brisk', 'Gear tested for a season, not a weekend.'),
  ch('c_coast_path', 'Coast Path', 'coastpath', 'outdoors', 1_140_000, 8, 89, 'quiet', 'Cliffs, wind and a very long walk.'),
  ch('c_the_forest_floor', 'The Forest Floor', 'forestfloor', 'outdoors', 668_000, 12, 92, 'quiet', 'Foraging, identification and not poisoning yourself.'),
  ch('c_night_navigation', 'Night Navigation', 'nightnavigation', 'outdoors', 384_000, 14, 90, 'brisk', 'Map, compass and no phone.'),
  ch('c_the_bike_packing_run', 'The Bikepacking Run', 'bikepackingrun', 'outdoors', 1_060_000, 10, 87, 'warm', 'Four days, two bags, gravel.'),
  ch('c_swim_wild', 'Swim Wild', 'swimwild', 'outdoors', 892_000, 9, 86, 'quiet', 'Lakes, rivers and sea, all year.'),
];

const CRAFT: ChannelSeed[] = [
  ch('c_the_joiners_bench', 'The Joiners Bench', 'joinersbench', 'craft', 3_140_000, 10, 94, 'quiet', 'Hand tools, hardwood and no talking.'),
  ch('c_the_forge', 'The Forge', 'theforge', 'craft', 2_260_000, 9, 92, 'quiet', 'Steel, heat and a hammer.'),
  ch('c_the_wheel', 'The Wheel', 'thewheel', 'craft', 1_480_000, 7, 90, 'quiet', 'Pottery, thrown, glazed and fired.'),
  ch('c_stitch_and_seam', 'Stitch And Seam', 'stitchandseam', 'craft', 1_120_000, 8, 89, 'warm', 'Sewing garments from a flat pattern.'),
  ch('c_the_bindery', 'The Bindery', 'thebindery', 'craft', 486_000, 13, 93, 'quiet', 'Books, sewn and cased by hand.'),
  ch('c_leather_and_awl', 'Leather And Awl', 'leatherandawl', 'craft', 926_000, 11, 91, 'quiet', 'Saddle stitch, edge finishing, patience.'),
  ch('c_the_glass_shop', 'The Glass Shop', 'theglassshop', 'craft', 1_670_000, 12, 92, 'quiet', 'Blowing, and the terrifying speed of it.'),
  ch('c_the_lathe', 'The Lathe', 'thelathe', 'craft', 1_340_000, 8, 90, 'brisk', 'Metal turning, measured in hundredths.'),
  ch('c_restoration_bench', 'Restoration Bench', 'restorationbench', 'craft', 2_910_000, 11, 93, 'quiet', 'Something ruined, brought back, in silence.'),
  ch('c_the_print_room', 'The Print Room', 'theprintroom', 'craft', 612_000, 12, 91, 'quiet', 'Letterpress, screen and lithograph.'),
  ch('c_model_makers_desk', 'Model Makers Desk', 'modelmakersdesk', 'craft', 1_060_000, 9, 89, 'warm', 'Miniatures built to the millimetre.'),
  ch('c_the_luthier', 'The Luthier', 'theluthier', 'craft', 748_000, 14, 94, 'quiet', 'A guitar, from a board, over eleven months.'),
];

const TALK: ChannelSeed[] = [
  ch('c_three_hours', 'Three Hours', 'threehours', 'talk', 4_260_000, 7, 86, 'warm', 'One guest, no notes, however long it takes.'),
  ch('c_the_working_life', 'The Working Life', 'workinglife', 'talk', 1_480_000, 9, 90, 'quiet', 'People talking about what they actually do all day.'),
  ch('c_the_first_job', 'The First Job', 'thefirstjob', 'talk', 862_000, 11, 88, 'warm', 'How everybody actually got in.'),
  ch('c_two_chairs', 'Two Chairs', 'twochairs', 'talk', 2_140_000, 6, 84, 'warm', 'Conversations, filmed simply.'),
  ch('c_the_difficult_question', 'The Difficult Question', 'difficultquestion', 'talk', 1_720_000, 8, 89, 'brisk', 'Interviews where the follow up is asked.'),
  ch('c_after_hours', 'After Hours', 'afterhoursshow', 'talk', 3_080_000, 5, 78, 'loud', 'Late, loose and occasionally regrettable.'),
  ch('c_the_craft_interview', 'The Craft Interview', 'craftinterview', 'talk', 594_000, 12, 92, 'quiet', 'How the work is made, from the maker.'),
  ch('c_in_the_car', 'In The Car', 'inthecar', 'talk', 2_680_000, 7, 81, 'warm', 'A drive, a passenger and a conversation.'),
  ch('c_the_long_answer', 'The Long Answer', 'thelonganswer', 'talk', 736_000, 10, 91, 'essayist', 'One question, properly answered, for an hour.'),
  ch('c_off_the_record', 'Off The Record', 'offtherecord', 'talk', 1_260_000, 9, 83, 'brisk', 'Industry people, anonymised, being honest.'),
  ch('c_the_debrief', 'The Debrief', 'thedebrief', 'talk', 448_000, 13, 90, 'quiet', 'After a project ends, what really happened.'),
  ch('c_kitchen_table_talk', 'Kitchen Table Talk', 'kitchentabletalk', 'talk', 982_000, 8, 85, 'warm', 'Two friends, one table, twelve years running.'),
];

/**
 * Which slot in a subject's titles a channel's beat narrows.
 *
 * A cooking channel covers dishes; a science channel covers subjects. Naming
 * the slot lets a specialist channel keep to what it is actually about, so the
 * astronomy channel does not put out a video about antibiotics.
 */
export const BEAT_SLOT: Readonly<Record<Topic, string>> = {
  film: 'element', making: 'subject', acting: 'subject', cooking: 'dish',
  cars: 'car', fitness: 'training', music: 'element', tech: 'device',
  travel: 'place', comedy: 'subject', news: 'story', fashion: 'garment',
  gaming: 'element', home: 'room', money: 'topic', science: 'thing',
  history: 'event', outdoors: 'route', craft: 'object', talk: 'subject',
};

/**
 * What a specialist channel is actually about. A channel with no entry here
 * covers its whole subject, which is true of most of them.
 */
export const BEATS: Readonly<Record<string, readonly string[]>> = {
  // Film: the ones with a department.
  c_the_cutting_room: ['Editing', 'Pacing', 'Framing'],
  c_the_credits_roll: ['Costume', 'Production Design', 'Casting', 'Score'],
  c_the_third_act: ['Pacing', 'The Final Shot', 'Silence'],

  // Filmmaking: the ones with a trade.
  c_the_gaffer: ['A Night Exterior', 'A Car Interior', 'A Kitchen Scene', 'A Rain Scene'],
  c_sound_first: ['An Interview', 'A Crowd Scene', 'A Two Hander'],
  c_the_colour_bay: ['A Night Exterior', 'A Single Take', 'A Music Video'],
  c_the_stunt_pad: ['A Chase', 'A Rain Scene', 'A Crowd Scene'],
  c_location_scout: ['A Wedding', 'A Crowd Scene', 'A Night Exterior'],

  // Acting.
  c_the_dialect_desk: ['A Confession', 'An Argument', 'A First Meeting'],
  c_first_position: ['Exhaustion', 'Fear', 'Relief'],

  // Cooking: a bakery is not a barbecue.
  c_the_proving_drawer: ['Bread', 'Focaccia', 'Pizza'],
  c_the_cake_table: ['Bread', 'Tarte Tatin', 'Focaccia'],
  c_fire_and_smoke: ['Steak', 'Pizza', 'Stew'],
  c_the_stock_pot: ['Soup', 'Stew', 'Ragu', 'Risotto'],
  c_late_night_eggs: ['Omelette', 'Fried Rice', 'Pasta', 'Ramen'],
  c_the_pantry_shelf: ['Soup', 'Stew', 'Curry', 'Dal'],
  c_sunday_lunch: ['Roast Chicken', 'Stew', 'Tarte Tatin'],

  // Cars.
  c_two_wheels: ['Roadster', 'Track Car'],
  c_electric_daily: ['Hatchback', 'Saloon', 'Estate'],
  c_the_paint_booth: ['Coupe', 'Roadster', 'Saloon'],

  // Fitness.
  c_run_easy: ['Easy Running', 'Intervals', 'Zone Two', 'Hill Repeats'],
  c_the_barbell_room: ['Squats', 'Deadlifts', 'Pressing'],
  c_the_climbing_wall: ['Bodyweight Work', 'Mobility Work'],
  c_cold_water: ['Swimming', 'Zone Two'],
  c_ring_work: ['Intervals', 'Bodyweight Work'],
  c_mobility_monday: ['Mobility Work', 'Planks', 'Hinge Work', 'Step Ups'],
  c_the_long_walk: ['Zone Two', 'Easy Running'],

  // Music.
  c_mix_notes: ['Compression', 'Reverb', 'Arrangement'],
  c_the_drum_riser: ['Rhythm', 'Groove'],
  c_the_score_desk: ['Arrangement', 'Countermelody', 'Harmony', 'Silence'],
  c_songwriting_desk: ['The Bridge', 'Chord Voicing', 'Key Change'],

  // Technology.
  c_pocket_sized: ['Phone', 'Watch', 'Tablet'],
  c_the_photo_lab: ['Camera', 'Scanner', 'Printer'],
  c_signal_path: ['Headphones', 'Microphone'],
  c_the_screen_test: ['Monitor', 'Projector', 'Tablet'],
  c_home_server: ['Drive', 'Router'],
  c_the_terminal: ['Laptop', 'Drive'],

  // Travel.
  c_the_ferry_deck: ['The Islands', 'A Port City', 'The North Coast'],
  c_the_night_train: ['A Mountain Town', 'The Highlands', 'An Inland Sea'],
  c_border_town: ['A Border Region', 'The Far South', 'The Delta'],

  // News: the ones with a beat by definition.
  c_court_report: ['The Ruling', 'The Inquiry'],
  c_the_industry_brief: ['The Contract', 'The Merger', 'The Strike'],
  c_local_paper: ['The Planning Row', 'The Delay', 'The Overrun'],
  c_the_numbers_desk: ['The Audit', 'The Shortage', 'The Overrun'],
  c_the_science_brief: ['The Recall', 'The Inquiry'],

  // Fashion.
  c_the_cobblers_bench: ['Shoe', 'Boot'],
  c_the_watch_case: ['Belt', 'Scarf'],
  c_the_knitwear_room: ['Knit', 'Scarf'],
  c_menswear_notes: ['Jacket', 'Suit', 'Coat', 'Shirt'],
  c_the_alterations_table: ['Jacket', 'Trouser', 'Suit'],

  // Gaming.
  c_speedrun_room: ['Difficulty', 'The Map', 'Pacing'],
  c_hardware_and_frames: ['The Camera', 'Difficulty'],
  c_the_lore_desk: ['The Opening Hour', 'The Map'],

  // Home.
  c_the_garden_gate: ['Garden', 'Porch'],
  c_the_loft: ['Loft', 'Bedroom'],
  c_damp_and_rot: ['Hallway', 'Bathroom', 'Utility Room'],
  c_energy_bill: ['Loft', 'Hallway', 'Living Room'],

  // Money.
  c_the_tax_desk: ['Tax', 'Fees', 'Refunds', 'Salaries'],
  c_pension_desk: ['Pensions', 'Wills', 'Interest', 'Deposits'],
  c_the_mortgage_room: ['A Mortgage', 'Rent'],
  c_the_index_shelf: ['Investing', 'Saving'],
  c_debt_free_by: ['Debt', 'Budgeting'],

  // Science: the reason this table exists.
  c_the_night_sky: ['Gravity', 'Orbits', 'Starlight', 'Eclipses', 'Comets', 'Black Holes', 'The Moon'],
  c_field_notes: ['Photosynthesis', 'The Immune System', 'Fermentation'],
  c_slow_chemistry: ['Fermentation', 'Radioactivity', 'Entropy'],
  c_the_proof: ['Prime Numbers', 'Infinity', 'Probability', 'Symmetry', 'Entropy'],
  c_weather_watch: ['The Water Cycle', 'Clouds', 'Storms', 'Wind', 'Pressure Systems'],
  c_deep_water: ['The Tides', 'The Water Cycle', 'Plate Tectonics'],
  c_the_brain_room: ['Sleep', 'Attention', 'Dreams', 'Addiction', 'Language', 'Memory'],
  c_engineering_failure: ['Plate Tectonics', 'Entropy', 'Gravity'],

  // History.
  c_the_kitchen_of_1840: ['The Cholera Year', 'The Enclosure', 'The Long Winter'],
  c_the_shipping_lane: ['The Harbor Blockade', 'The Cotton Crash', 'The Canal Boom'],
  c_industrial_age: ['The Mill Strike', 'The Railway Mania', 'The Cotton Crash'],
  c_the_court_record: ['The Land Reform', 'The Enclosure'],

  // Outdoors.
  c_the_river_bank: ['The River Route', 'The Long Valley'],
  c_snow_line: ['The High Traverse', 'The Cirque', 'The Ridge'],
  c_coast_path: ['The Coast Path', 'The Cape Trail'],
  c_the_forest_floor: ['The Forest Loop', 'The Long Valley'],

  // Making things.
  c_the_forge: ['Knife', 'Plane'],
  c_the_wheel: ['Bowl', 'Kettle'],
  c_stitch_and_seam: ['Bag', 'Coat', 'Apron', 'Cushion', 'Quilt', 'Satchel'],
  c_the_bindery: ['Book', 'Box'],
  c_leather_and_awl: ['Bag', 'Box'],
  c_the_luthier: ['Guitar', 'Violin', 'Mandolin', 'Ukulele'],
  c_the_joiners_bench: ['Chair', 'Table', 'Cabinet', 'Box'],
  c_the_lathe: ['Knife', 'Plane', 'Lamp'],
};

/** Every channel in the world, before the player adds theirs. */
export const REAL_CHANNELS: readonly ChannelSeed[] = [
  ...FILM, ...MAKING, ...ACTING, ...COOKING, ...CARS, ...FITNESS, ...MUSIC, ...TECH,
  ...TRAVEL, ...COMEDY, ...NEWS, ...FASHION, ...GAMING, ...HOME, ...MONEY, ...SCIENCE,
  ...HISTORY, ...OUTDOORS, ...CRAFT, ...TALK,
];

/**
 * Said on screen wherever a channel is shown, so nobody mistakes SLATE's
 * creators for people who exist.
 */
export const CHANNEL_NOTE =
  'The channels here are SLATE’s own. Nobody real is named, and no subscriber count belongs to anybody.';
