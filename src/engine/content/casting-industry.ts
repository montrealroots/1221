/**
 * SLATE — how casting actually works.
 *
 * This file is the reference the casting system is built on: the real
 * sequence a part goes through from a breakdown to a booking, the real
 * categories a part is hired under, the real people in the room, the real
 * paperwork, and the real vocabulary the business uses for all of it.
 *
 * What is stated here as industry practice is industry practice: the terms,
 * the order things happen in, who sits in which room, and what each document
 * is for. Where practice varies — by union agreement, by studio, by whether
 * it is network television or a streaming series or a film financed out of
 * somebody's house — the variation is written down rather than flattened.
 *
 * Every figure in money is SLATE's calibration for a working simulation. Union
 * minimums are set by agreement and change with each negotiated contract, so
 * nothing here is quoted as a current rate; the shape of the schedule is
 * modelled, the numbers are the game's own and are labelled as such wherever
 * the player sees them.
 */

// ---------------------------------------------------------------------------
// Who the work is under
// ---------------------------------------------------------------------------

export type AgreementId =
  | 'sag_theatrical' | 'sag_television' | 'sag_new_media'
  | 'sag_low_budget' | 'sag_modified_low' | 'sag_ultra_low' | 'sag_student'
  | 'non_union';

export interface Agreement {
  id: AgreementId;
  name: string;
  /** What it covers, in plain words. */
  covers: string;
  /** Whether the production is a union signatory. */
  union: boolean;
  /**
   * SLATE's calibration for the day-performer minimum, in cents. The real
   * minimums are set by the negotiated agreement and change with it; this is
   * the game's own scale, shaped like the schedule rather than quoted from it.
   */
  dayScaleCalibration: number;
  /** The same for a weekly performer. */
  weekScaleCalibration: number;
  /** Whether a non-union performer can be hired onto it under Taft-Hartley. */
  taftHartley: boolean;
  note?: string;
}

/**
 * The agreements a production can be made under.
 *
 * SAG-AFTRA is one union, formed in 2012 by the merger of the Screen Actors
 * Guild and the American Federation of Television and Radio Artists. Its
 * low-budget agreements exist so that films that cannot pay full scale can
 * still hire union performers; each tier trades a lower minimum for a budget
 * ceiling and tighter conditions.
 */
export const AGREEMENTS: readonly Agreement[] = [
  { id: 'sag_theatrical', name: 'SAG-AFTRA Theatrical', covers: 'Feature films at full scale.', union: true, dayScaleCalibration: 1_200_00, weekScaleCalibration: 4_300_00, taftHartley: true },
  { id: 'sag_television', name: 'SAG-AFTRA Television', covers: 'Series, pilots, movies of the week and specials.', union: true, dayScaleCalibration: 1_200_00, weekScaleCalibration: 4_300_00, taftHartley: true },
  { id: 'sag_new_media', name: 'SAG-AFTRA New Media', covers: 'Content made for streaming and online distribution, with terms negotiated against the production’s own budget.', union: true, dayScaleCalibration: 700_00, weekScaleCalibration: 2_600_00, taftHartley: true, note: 'Terms are negotiated per production rather than fixed by a single schedule.' },
  { id: 'sag_low_budget', name: 'SAG-AFTRA Low Budget', covers: 'Features under the Low Budget ceiling.', union: true, dayScaleCalibration: 700_00, weekScaleCalibration: 2_500_00, taftHartley: true },
  { id: 'sag_modified_low', name: 'SAG-AFTRA Modified Low Budget', covers: 'Features under the Modified Low Budget ceiling.', union: true, dayScaleCalibration: 500_00, weekScaleCalibration: 1_800_00, taftHartley: true },
  { id: 'sag_ultra_low', name: 'SAG-AFTRA Ultra Low Budget', covers: 'Features made for very little, where the union still wants its members working.', union: true, dayScaleCalibration: 250_00, weekScaleCalibration: 900_00, taftHartley: true },
  { id: 'sag_student', name: 'SAG-AFTRA Student Film', covers: 'Films made by enrolled students, with deferred pay.', union: true, dayScaleCalibration: 0, weekScaleCalibration: 0, taftHartley: true, note: 'Pay is generally deferred; the agreement exists so union members can work on student films at all.' },
  { id: 'non_union', name: 'Non-Union', covers: 'Anything made outside a union agreement. Rates, hours and conditions are whatever the contract says.', union: false, dayScaleCalibration: 150_00, weekScaleCalibration: 600_00, taftHartley: false },
];

export const AGREEMENT_BY_ID: Readonly<Record<AgreementId, Agreement>> =
  Object.fromEntries(AGREEMENTS.map((a) => [a.id, a])) as Record<AgreementId, Agreement>;

/**
 * How a performer becomes eligible to join SAG-AFTRA.
 *
 * All three of these are real routes. Taft-Hartley is the one most people come
 * through: a signatory production hires a non-union performer, files the
 * report, and the performer becomes eligible to join — and must join before
 * their next union job after a grace period.
 */
export const ELIGIBILITY_ROUTES: readonly { id: string; name: string; how: string }[] = [
  { id: 'taft_hartley', name: 'Taft-Hartley', how: 'A signatory production hires you when no union performer will do, and files a Taft-Hartley report. You become eligible, and must join before working union again after the grace period.' },
  { id: 'vouchers', name: 'Background Vouchers', how: 'Three union background vouchers on covered productions make you eligible. Vouchers are limited per day and are the slowest honest route there is.' },
  { id: 'sister_union', name: 'Sister Union', how: 'A year of paid membership in an affiliated performers’ union, with at least one principal engagement under it, makes you eligible to join.' },
];

// ---------------------------------------------------------------------------
// What kind of part it is
// ---------------------------------------------------------------------------

export type RoleCategory =
  | 'series_regular' | 'recurring' | 'guest_star' | 'co_star' | 'under_five'
  | 'lead' | 'supporting' | 'featured' | 'day_player' | 'background' | 'voice';

export interface RoleCategorySpec {
  id: RoleCategory;
  name: string;
  /** What the part is, as the business means it. */
  what: string;
  /** Film, television, or both. */
  medium: 'film' | 'television' | 'both';
  /** How the engagement is paid. */
  engagement: 'series_contract' | 'episodic' | 'weekly' | 'daily' | 'flat';
  /** Whether the part is normally tested before it is offered. */
  tested: boolean;
  /** Whether the deal normally options the performer for future seasons. */
  optioned: boolean;
  /** Whether the part normally reads sides at all. */
  auditions: boolean;
  /** Where the part sits in the credits by default. */
  billing: 'main_title' | 'guest_card' | 'end_credits' | 'uncredited';
}

/**
 * The categories a part is hired under.
 *
 * These are the industry's own names, and the differences between them are
 * contractual rather than descriptive: a guest star and a co-star are not
 * distinguished by how many lines they have but by how they are engaged,
 * credited and paid.
 */
export const ROLE_CATEGORIES: readonly RoleCategorySpec[] = [
  { id: 'series_regular', name: 'Series Regular', what: 'Contracted to the series rather than to an episode. Paid an episodic fee against a guarantee, credited in the main titles, and optioned for future seasons before they are ever cast.', medium: 'television', engagement: 'series_contract', tested: true, optioned: true, auditions: true, billing: 'main_title' },
  { id: 'recurring', name: 'Recurring', what: 'Comes back across episodes without being contracted to the series. Booked episode by episode, which means they can be lost to another job at any time.', medium: 'television', engagement: 'episodic', tested: false, optioned: false, auditions: true, billing: 'guest_card' },
  { id: 'guest_star', name: 'Guest Star', what: 'A substantial part in one episode, engaged and credited as a guest. The card usually reads "Guest Starring" and the money is negotiated above scale.', medium: 'television', engagement: 'episodic', tested: false, optioned: false, auditions: true, billing: 'guest_card' },
  { id: 'co_star', name: 'Co-Star', what: 'A small speaking part in one episode. Cast fast, often off a tape alone, credited at the end.', medium: 'television', engagement: 'daily', tested: false, optioned: false, auditions: true, billing: 'end_credits' },
  { id: 'under_five', name: 'Under-Five', what: 'Fewer than five lines. A category of its own in daytime, paid on its own schedule.', medium: 'television', engagement: 'daily', tested: false, optioned: false, auditions: false, billing: 'end_credits' },
  { id: 'lead', name: 'Lead', what: 'The part the picture is built on. Weekly or on a run-of-picture deal, top billing, and usually cast by offer or by test rather than by a first read.', medium: 'film', engagement: 'weekly', tested: true, optioned: false, auditions: true, billing: 'main_title' },
  { id: 'supporting', name: 'Supporting', what: 'A substantial part across the picture, engaged weekly or daily depending on how the days fall.', medium: 'film', engagement: 'weekly', tested: false, optioned: false, auditions: true, billing: 'main_title' },
  { id: 'featured', name: 'Featured', what: 'A handful of scenes, engaged by the day or the week, credited in the end roll.', medium: 'film', engagement: 'daily', tested: false, optioned: false, auditions: true, billing: 'end_credits' },
  { id: 'day_player', name: 'Day Player', what: 'Hired by the day for a speaking part. The largest category of working actors by a distance.', medium: 'both', engagement: 'daily', tested: false, optioned: false, auditions: true, billing: 'end_credits' },
  { id: 'background', name: 'Background', what: 'Non-speaking. Booked through a background office, worked in numbers, and uncredited. A line of dialogue on the day upgrades the engagement and the pay.', medium: 'both', engagement: 'daily', tested: false, optioned: false, auditions: false, billing: 'uncredited' },
  { id: 'voice', name: 'Voice', what: 'Recorded in a booth against picture or before there is any. Cast off a voice audition and engaged by the session.', medium: 'both', engagement: 'daily', tested: false, optioned: false, auditions: true, billing: 'end_credits' },
];

export const ROLE_CATEGORY_BY_ID: Readonly<Record<RoleCategory, RoleCategorySpec>> =
  Object.fromEntries(ROLE_CATEGORIES.map((c) => [c.id, c])) as Record<RoleCategory, RoleCategorySpec>;

// ---------------------------------------------------------------------------
// How a part gets to an actor
// ---------------------------------------------------------------------------

export interface SubmissionChannel {
  id: string;
  name: string;
  what: string;
  /** Whether an actor can put themselves up, or only their representation can. */
  selfSubmit: boolean;
}

/**
 * Where breakdowns go and who can answer them.
 *
 * Breakdown Services has distributed casting notices to agents and managers
 * since 1971; its electronic system is Breakdown Express and its actor-facing
 * site is Actors Access. Casting Networks and Backstage are the other
 * long-standing services. A breakdown released "to representation only" never
 * appears on an actor-facing site at all, which is most of the good work.
 */
export const SUBMISSION_CHANNELS: readonly SubmissionChannel[] = [
  { id: 'breakdown_express', name: 'Breakdown Express', what: 'The industry’s distribution system for casting notices, read by agents and managers. Most of what matters goes out here and nowhere else.', selfSubmit: false },
  { id: 'actors_access', name: 'Actors Access', what: 'Breakdown Services’ actor-facing site. Actors submit themselves to the notices released publicly.', selfSubmit: true },
  { id: 'casting_networks', name: 'Casting Networks', what: 'A submission and session-management service used widely for commercials and increasingly for everything else.', selfSubmit: true },
  { id: 'backstage', name: 'Backstage', what: 'Open listings, weighted towards independent film, theatre and student work.', selfSubmit: true },
  { id: 'direct', name: 'Direct To The Office', what: 'The casting director calls your agent because they already know what you do. Nothing is posted anywhere.', selfSubmit: false },
  { id: 'offer_only', name: 'Offer Only', what: 'No audition exists. An offer goes to the representation of somebody the production has decided it wants.', selfSubmit: false },
];

/**
 * What a breakdown actually says.
 *
 * Every field here appears on a real casting notice. The character line is the
 * one actors read first and the one that decides whether they are right, and
 * it carries far more than a name: age range, how the character reads, what
 * the part is for, and the skills the part cannot be played without.
 */
export const BREAKDOWN_FIELDS: readonly { field: string; what: string; required: boolean }[] = [
  { field: 'Project Title', what: 'Or a working title, or a codename when the project is under wraps.', required: true },
  { field: 'Project Type', what: 'Feature, series, pilot, short, commercial, voice-over.', required: true },
  { field: 'Union Status', what: 'Which agreement it is under, or that it is non-union.', required: true },
  { field: 'Rate', what: 'Scale, scale plus ten, a stated figure, or "negotiable".', required: true },
  { field: 'Production Company', what: 'Who is making it.', required: true },
  { field: 'Casting Director', what: 'Whose office is running it. Actors and agents read this field before the part.', required: true },
  { field: 'Director', what: 'Named unless the project is protecting it.', required: false },
  { field: 'Writer', what: 'Named on most breakdowns.', required: false },
  { field: 'Producers', what: 'The producing team, when they are a reason to want the job.', required: false },
  { field: 'Shoot Dates', what: 'The window, so an actor can check their own calendar before they read.', required: true },
  { field: 'Location', what: 'Where it shoots, and whether it works as a local hire.', required: true },
  { field: 'Local Hire', what: 'Whether travel and housing are provided or the actor is expected to be local.', required: false },
  { field: 'Character Name', what: 'The name in the script.', required: true },
  { field: 'Category', what: 'Series regular, guest star, co-star, day player, and so on. This is the contract, not the size.', required: true },
  { field: 'Age Range', what: 'How old the character reads on screen, which is not how old the actor is.', required: true },
  { field: 'Gender', what: 'As written, including when the part is open to anyone.', required: false },
  { field: 'Ethnicity', what: 'Stated when the story requires it, and left open when it does not.', required: false },
  { field: 'Physical Description', what: 'Anything the part genuinely needs: height against another actor, build for a stunt, a specific look the story turns on.', required: false },
  { field: 'Character Description', what: 'Two or three lines on who they are and what they want. The part of the notice actors actually read.', required: true },
  { field: 'Special Skills', what: 'Accents, languages, singing, an instrument, riding, swimming, martial arts, driving stick, ice skating. If it is here, it is not optional.', required: false },
  { field: 'Nudity', what: 'Stated up front when there is any, with the intimacy terms that go with it.', required: false },
  { field: 'Audition Details', what: 'Self-tape and its deadline, or a session date and where.', required: true },
];

// ---------------------------------------------------------------------------
// The sequence
// ---------------------------------------------------------------------------

export type CastingStageId =
  | 'breakdown' | 'submissions' | 'prescreen' | 'self_tape' | 'first_read'
  | 'callback' | 'producer_session' | 'chemistry_read' | 'director_session'
  | 'studio_test' | 'network_test' | 'screen_test'
  | 'avail_check' | 'test_option' | 'offer' | 'deal_memo' | 'booked';

export interface CastingStage {
  id: CastingStageId;
  name: string;
  /** What happens, in plain words. */
  what: string;
  /** Who is normally in the room, by seat id. */
  room: readonly RoomSeatId[];
  /** Whether the performer is present at all. */
  performerPresent: boolean;
  /** Typical days from the stage before it, as SLATE's calibration. */
  daysAfterPrevious: [number, number];
}

/**
 * Every stage that exists, in the order they can happen.
 *
 * No single job runs all of them. A co-star is a tape and a booking. A series
 * regular is a tape, a callback, a producer session, a studio test and a
 * network test, with a signed deal in place before the last two.
 */
export const CASTING_STAGES: readonly CastingStage[] = [
  { id: 'breakdown', name: 'Breakdown Released', what: 'The casting office releases the notice to representation, and sometimes publicly.', room: ['casting_director', 'casting_associate'], performerPresent: false, daysAfterPrevious: [0, 0] },
  { id: 'submissions', name: 'Submissions', what: 'Agents and managers submit their clients; the office reads through them. A busy office sees thousands for one part.', room: ['casting_director', 'casting_associate', 'casting_assistant'], performerPresent: false, daysAfterPrevious: [1, 4] },
  { id: 'prescreen', name: 'Pre-Read', what: 'The casting director sees you alone, on tape, with a reader. Nobody from the production is there. It exists so the office only shows the director people it believes in.', room: ['casting_director', 'reader', 'casting_assistant'], performerPresent: true, daysAfterPrevious: [2, 10] },
  { id: 'self_tape', name: 'Self-Tape', what: 'You shoot it yourself to the office’s specification and send it by the deadline. Now the first round on most jobs.', room: ['casting_director', 'casting_associate'], performerPresent: false, daysAfterPrevious: [1, 7] },
  { id: 'first_read', name: 'First Read', what: 'The first time you are in the room reading the sides, taped for whoever is not there.', room: ['casting_director', 'reader', 'casting_assistant'], performerPresent: true, daysAfterPrevious: [2, 10] },
  { id: 'callback', name: 'Callback', what: 'They want to see it again. Wear what you wore, do what you did, and be ready for it to change.', room: ['casting_director', 'director', 'reader', 'casting_associate'], performerPresent: true, daysAfterPrevious: [3, 14] },
  { id: 'producer_session', name: 'Producer Session', what: 'The producers are in the room. The director will give you an adjustment and watch what you do with it.', room: ['casting_director', 'director', 'producer', 'writer', 'reader'], performerPresent: true, daysAfterPrevious: [2, 12] },
  { id: 'chemistry_read', name: 'Chemistry Read', what: 'Read against the actor already cast, or against the other candidates in every combination. What is being watched is the space between two people, which nobody can fake alone.', room: ['casting_director', 'director', 'producer', 'attached_lead'], performerPresent: true, daysAfterPrevious: [2, 10] },
  { id: 'director_session', name: 'Director Session', what: 'A working session alone with the director, closer to a rehearsal than an audition.', room: ['director', 'casting_director'], performerPresent: true, daysAfterPrevious: [2, 10] },
  { id: 'studio_test', name: 'Studio Test', what: 'The studio sees the shortlist. On camera, and the deal is already signed.', room: ['casting_director', 'director', 'producer', 'showrunner', 'studio_executive'], performerPresent: true, daysAfterPrevious: [3, 14] },
  { id: 'network_test', name: 'Network Test', what: 'The last room in network television. Two or three candidates, back to back, in front of the people who decide. Often the same day as the studio test.', room: ['casting_director', 'showrunner', 'producer', 'studio_executive', 'network_executive'], performerPresent: true, daysAfterPrevious: [0, 3] },
  { id: 'screen_test', name: 'Screen Test', what: 'A film test: camera, wardrobe, hair and makeup, sometimes a set and a crew. Expensive, and only for parts worth it.', room: ['casting_director', 'director', 'producer', 'studio_executive'], performerPresent: true, daysAfterPrevious: [4, 21] },
  { id: 'avail_check', name: 'Avail Check', what: 'Production asks your representation whether you are free for the dates, and puts a hold on them. An avail is not an offer and nobody may say otherwise.', room: ['casting_director', 'producer'], performerPresent: false, daysAfterPrevious: [0, 5] },
  { id: 'test_option', name: 'Test Option Deal', what: 'Before a series regular tests, the whole deal is negotiated and signed: episodic fee, guarantee, billing, and options on future seasons. The network will not watch you read until it is done.', room: ['casting_director', 'producer', 'studio_executive'], performerPresent: false, daysAfterPrevious: [1, 7] },
  { id: 'offer', name: 'Offer', what: 'It goes to your representation, not to you. Terms, dates, money, billing.', room: ['casting_director', 'producer'], performerPresent: false, daysAfterPrevious: [1, 10] },
  { id: 'deal_memo', name: 'Deal Memo', what: 'The agreed terms in writing, ahead of the long-form contract nobody signs until later.', room: ['producer'], performerPresent: false, daysAfterPrevious: [1, 7] },
  { id: 'booked', name: 'Booked', what: 'You have the job. Fitting, table read, and a call sheet with your name on it.', room: ['casting_director'], performerPresent: false, daysAfterPrevious: [1, 14] },
];

export const CASTING_STAGE_BY_ID: Readonly<Record<CastingStageId, CastingStage>> =
  Object.fromEntries(CASTING_STAGES.map((s) => [s.id, s])) as Record<CastingStageId, CastingStage>;

/**
 * The sequence a given kind of part actually runs, by what is being cast.
 *
 * A co-star is a tape and a phone call. A series regular on a network show is
 * the longest road in the business, and the deal is signed two rooms before
 * anybody says yes.
 */
export const CASTING_PATHS: Readonly<Record<string, readonly CastingStageId[]>> = {
  network_series_regular: ['breakdown', 'submissions', 'self_tape', 'callback', 'producer_session', 'chemistry_read', 'test_option', 'studio_test', 'network_test', 'offer', 'deal_memo', 'booked'],
  streaming_series_regular: ['breakdown', 'submissions', 'self_tape', 'callback', 'producer_session', 'chemistry_read', 'test_option', 'studio_test', 'offer', 'deal_memo', 'booked'],
  recurring: ['breakdown', 'submissions', 'self_tape', 'callback', 'producer_session', 'avail_check', 'offer', 'booked'],
  guest_star: ['breakdown', 'submissions', 'self_tape', 'producer_session', 'avail_check', 'offer', 'booked'],
  co_star: ['breakdown', 'submissions', 'self_tape', 'avail_check', 'offer', 'booked'],
  studio_film_lead: ['breakdown', 'submissions', 'first_read', 'callback', 'director_session', 'chemistry_read', 'screen_test', 'avail_check', 'offer', 'deal_memo', 'booked'],
  studio_film_supporting: ['breakdown', 'submissions', 'self_tape', 'callback', 'producer_session', 'avail_check', 'offer', 'booked'],
  indie_film_lead: ['breakdown', 'submissions', 'prescreen', 'callback', 'director_session', 'chemistry_read', 'offer', 'booked'],
  day_player: ['breakdown', 'submissions', 'self_tape', 'offer', 'booked'],
  voice: ['breakdown', 'submissions', 'self_tape', 'callback', 'offer', 'booked'],
  offer_only: ['offer', 'deal_memo', 'booked'],
};

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

export type RoomSeatId =
  | 'casting_director' | 'casting_associate' | 'casting_assistant' | 'reader'
  | 'director' | 'producer' | 'writer' | 'showrunner'
  | 'studio_executive' | 'network_executive' | 'attached_lead';

export interface RoomSeat {
  id: RoomSeatId;
  name: string;
  /** What this person is actually watching for. */
  watchingFor: string;
  /** The attributes they weigh, and by how much. Weights sum to roughly one. */
  weighs: Readonly<Record<string, number>>;
  /** How much their opinion moves the decision, 0-1. */
  sway: number;
  /** Whether they can give you an adjustment mid-room. */
  redirects: boolean;
  /** What being in the room with them does to a performer's nerves, 0-1. */
  pressure: number;
}

/**
 * Everybody who might be in the room, and what each of them is doing there.
 *
 * The casting director is not the enemy: they brought you in, and you being
 * good is their credibility with the director. The producers are working out
 * what you cost and whether you are a risk. The network is working out whether
 * they can sell you. The reader is being paid very little and may be reading
 * the other part flat, which is not their fault and is your problem.
 */
export const ROOM_SEATS: readonly RoomSeat[] = [
  {
    id: 'casting_director', name: 'Casting Director',
    watchingFor: 'Whether you are right, whether you can take a note, and whether they can put you in front of the director without it costing them.',
    weighs: { emotional_truth: 0.2, script_analysis: 0.15, audition_technique: 0.2, direction_absorption: 0.2, set_etiquette: 0.1, preparation: 0.15 },
    sway: 0.85, redirects: true, pressure: 0.3,
  },
  {
    id: 'casting_associate', name: 'Casting Associate',
    watchingFor: 'Running the session and keeping it to time. Their opinion reaches the casting director afterwards, in one sentence.',
    weighs: { audition_technique: 0.3, punctuality: 0.2, set_etiquette: 0.2, preparation: 0.3 },
    sway: 0.25, redirects: false, pressure: 0.1,
  },
  {
    id: 'casting_assistant', name: 'Casting Assistant',
    watchingFor: 'The camera, the sign-in sheet and the door. They are not judging you and they will remember how you treated them.',
    weighs: { set_etiquette: 0.6, punctuality: 0.4 },
    sway: 0.05, redirects: false, pressure: 0.05,
  },
  {
    id: 'reader', name: 'Reader',
    watchingFor: 'Nothing. They are feeding you the other lines, and how well they do it is out of your hands.',
    weighs: {}, sway: 0, redirects: false, pressure: 0.05,
  },
  {
    id: 'director', name: 'Director',
    watchingFor: 'Whether there is a performance here they can shape, and whether it changes when they ask it to.',
    weighs: { emotional_truth: 0.25, direction_absorption: 0.25, subtext: 0.15, character_construction: 0.15, improvisation: 0.1, collaboration: 0.1 },
    sway: 1, redirects: true, pressure: 0.6,
  },
  {
    id: 'producer', name: 'Producer',
    watchingFor: 'Whether you are a risk. Whether you will be a problem at hour thirteen, what you cost, and whether the money will be happy.',
    weighs: { reliability: 0.25, set_etiquette: 0.2, charisma: 0.2, take_consistency: 0.2, pressure_tolerance: 0.15 },
    sway: 0.8, redirects: false, pressure: 0.5,
  },
  {
    id: 'writer', name: 'Writer',
    watchingFor: 'Whether the lines work in your mouth, and whether you understood what they are for.',
    weighs: { script_analysis: 0.3, subtext: 0.25, diction: 0.15, comedy_timing: 0.15, emotional_truth: 0.15 },
    sway: 0.5, redirects: true, pressure: 0.35,
  },
  {
    id: 'showrunner', name: 'Showrunner',
    watchingFor: 'Everything the writer and the producer are watching for at once, because on a series they are both, and they are the person who decides.',
    weighs: { script_analysis: 0.2, emotional_truth: 0.2, direction_absorption: 0.15, reliability: 0.15, charisma: 0.15, take_consistency: 0.15 },
    sway: 1, redirects: true, pressure: 0.7,
  },
  {
    id: 'studio_executive', name: 'Studio Executive',
    watchingFor: 'What you have done before, what you are worth, and whether casting you is a decision they can defend upwards.',
    weighs: { charisma: 0.25, photogenic_quality: 0.2, magnetism: 0.2, interview_poise: 0.15, camera_awareness: 0.2 },
    sway: 0.9, redirects: false, pressure: 0.8,
  },
  {
    id: 'network_executive', name: 'Network Executive',
    watchingFor: 'Whether an audience will follow you for six years, and whether they can put your face on the side of a building.',
    weighs: { charisma: 0.3, magnetism: 0.25, photogenic_quality: 0.2, camera_awareness: 0.15, screen_test_composure: 0.1 },
    sway: 1, redirects: false, pressure: 1,
  },
  {
    id: 'attached_lead', name: 'The Actor Already Cast',
    watchingFor: 'Whether they can work with you for five months, and whether you make them better in the scene.',
    weighs: { chemistry: 0.35, active_listening: 0.25, ensemble_blending: 0.2, collaboration: 0.2 },
    sway: 0.7, redirects: false, pressure: 0.45,
  },
];

export const ROOM_SEAT_BY_ID: Readonly<Record<RoomSeatId, RoomSeat>> =
  Object.fromEntries(ROOM_SEATS.map((s) => [s.id, s])) as Record<RoomSeatId, RoomSeat>;

// ---------------------------------------------------------------------------
// The paperwork and the vocabulary
// ---------------------------------------------------------------------------

export interface DealTerm {
  id: string;
  name: string;
  what: string;
  /** Whether it binds the production, the performer, or both. */
  binds: 'production' | 'performer' | 'both' | 'neither';
}

/**
 * The terms that decide what a booking actually is.
 *
 * Every one of these is a real thing an agent will argue about, and several of
 * them are worth more than the fee.
 */
export const DEAL_TERMS: readonly DealTerm[] = [
  { id: 'avail', name: 'Avail', what: 'Production asks whether you are free for the dates. It is a question, not an offer, and it binds nobody.', binds: 'neither' },
  { id: 'hold', name: 'Hold', what: 'They ask you to keep the dates clear while they decide. Still not an offer.', binds: 'neither' },
  { id: 'first_refusal', name: 'First Refusal', what: 'If another job wants those dates, you must go back to the first production and give them the chance to book you before you take it.', binds: 'performer' },
  { id: 'pay_or_play', name: 'Pay Or Play', what: 'They pay you whether the picture is made or not, and whether they use you or not. The strongest thing an actor can be given short of a signed start date.', binds: 'production' },
  { id: 'test_option', name: 'Test Option', what: 'The full series deal, agreed and signed before you are allowed to test. It is how the network makes sure nobody can hold them up on price after they have fallen in love with you.', binds: 'both' },
  { id: 'guarantee', name: 'Guarantee', what: 'How many episodes you are paid for whether or not you are in them — "six of thirteen" means six, however the season is written.', binds: 'production' },
  { id: 'episodic_fee', name: 'Episodic Fee', what: 'What you are paid per episode, before bumps for later seasons.', binds: 'production' },
  { id: 'options', name: 'Options', what: 'The production’s right to bring you back for future seasons at agreed money. They hold the option; you do not.', binds: 'performer' },
  { id: 'run_of_picture', name: 'Run Of Picture', what: 'Engaged for the whole shoot rather than by the day or week, whatever the schedule does.', binds: 'both' },
  { id: 'billing', name: 'Billing', what: 'Where your name goes: main titles or end roll, which card, which position, and whether it reads "and" or "with" — which are the two most fought-over words in a deal.', binds: 'production' },
  { id: 'favoured_nations', name: 'Favoured Nations', what: 'Everybody at your level gets the same terms, so nobody has to know what anybody else got.', binds: 'both' },
  { id: 'exclusivity', name: 'Exclusivity', what: 'What else you may take while you are theirs. On a series it is most of the reason the money is what it is.', binds: 'performer' },
  { id: 'nudity_rider', name: 'Nudity Rider', what: 'What is agreed in writing before anything is shot, in detail, with an intimacy coordinator on the day.', binds: 'both' },
  { id: 'perks', name: 'Perks', what: 'Travel, housing, per diem, trailer size, an assistant, a trainer. Negotiated seriously, because they are worth real money and they signal position.', binds: 'production' },
  { id: 'backend', name: 'Backend', what: 'A share of defined proceeds. Almost always worth nothing, and asked for anyway.', binds: 'production' },
  { id: 'quote', name: 'Quote', what: 'What you were last paid for comparable work. It is what your agent uses to set the price, and it is why taking a job cheap costs more than the difference.', binds: 'neither' },
  { id: 'scale_plus_ten', name: 'Scale Plus Ten', what: 'Union minimum plus ten per cent, so the agent’s commission does not come out of a floor payment.', binds: 'production' },
];

export const DEAL_TERM_BY_ID: Readonly<Record<string, DealTerm>> =
  Object.fromEntries(DEAL_TERMS.map((t) => [t.id, t]));

/**
 * What a self-tape has to be.
 *
 * Offices state these, and an actor who ignores them is telling the office
 * something about how they will be on set. The specification is real; the
 * tolerances are how much it actually costs you to get each one wrong.
 */
export const SELF_TAPE_SPEC: readonly { id: string; rule: string; costOfGettingItWrong: number }[] = [
  { id: 'slate', rule: 'Slate at the top or the end: your name, and whatever else the office asked for — height, agency, the role you are reading.', costOfGettingItWrong: 4 },
  { id: 'framing', rule: 'Head and shoulders to mid-chest for close work, wider only if the scene needs your body. Eyeline just off the lens.', costOfGettingItWrong: 6 },
  { id: 'background', rule: 'A plain wall, blue or grey. Nothing behind you that anybody could look at instead of your face.', costOfGettingItWrong: 3 },
  { id: 'lighting', rule: 'Lit from the front so your eyes are visible. A window is free and better than most lamps.', costOfGettingItWrong: 5 },
  { id: 'sound', rule: 'Quiet room, no echo, no traffic. Bad sound is the fastest way to be switched off.', costOfGettingItWrong: 6 },
  { id: 'reader', rule: 'A reader off camera, off to one side, giving you something to act against and staying quieter than you.', costOfGettingItWrong: 7 },
  { id: 'no_costume', rule: 'Suggest the character; do not dress as them. A hint of the world, not a costume.', costOfGettingItWrong: 2 },
  { id: 'file_naming', rule: 'Named the way the office asked — usually name, role and project — because they are handling hundreds of files.', costOfGettingItWrong: 3 },
  { id: 'deadline', rule: 'In by the deadline. A tape that arrives after the session has been watched has not been sent.', costOfGettingItWrong: 12 },
  { id: 'take_count', rule: 'One take of each scene unless they asked for options. Nobody is watching your fourth version.', costOfGettingItWrong: 3 },
];

/**
 * Sides: the pages you are given to read.
 *
 * Rarely the whole script, usually two or three scenes, sometimes watermarked
 * with your name on every page, and on a secret project sometimes not from the
 * script at all.
 */
export const SIDES_KINDS: readonly { id: string; name: string; what: string }[] = [
  { id: 'scene_sides', name: 'Scene Sides', what: 'Two or three scenes from the script, which is what you will be reading.' },
  { id: 'watermarked', name: 'Watermarked Sides', what: 'The same, with your name across every page so a leak has a name on it.' },
  { id: 'fake_sides', name: 'Fake Sides', what: 'Dialogue from another script entirely, used when the project cannot let its pages out. You are being watched on what you do with words that are not the ones you will say.' },
  { id: 'nda_sides', name: 'Sides Under NDA', what: 'Released only after you have signed. Standard on anything with a franchise behind it.' },
  { id: 'monologue', name: 'Monologue', what: 'Asked for when the office wants to see you alone, without a reader in the way.' },
  { id: 'improv_brief', name: 'Improvisation Brief', what: 'A situation rather than a page. Comedy offices do this, and it is a specific skill.' },
];

/** Anything here can be asked for on a breakdown, and cannot be faked on the day. */
export const SPECIAL_SKILLS: readonly { id: string; name: string; attributeId?: string }[] = [
  { id: 'accent', name: 'A Specific Accent', attributeId: 'dialect_acquisition' },
  { id: 'language', name: 'Fluency In Another Language' },
  { id: 'singing', name: 'Singing', attributeId: 'singing' },
  { id: 'instrument', name: 'Playing An Instrument' },
  { id: 'dance', name: 'Dance', attributeId: 'dance' },
  { id: 'riding', name: 'Horse Riding', attributeId: 'horsemanship' },
  { id: 'swimming', name: 'Strong Swimming' },
  { id: 'martial_arts', name: 'Martial Arts', attributeId: 'screen_fighting' },
  { id: 'stage_combat', name: 'Stage Combat', attributeId: 'stage_combat' },
  { id: 'weapons', name: 'Weapons Handling', attributeId: 'weapons_handling' },
  { id: 'driving_manual', name: 'Driving A Manual' },
  { id: 'skating', name: 'Ice Skating' },
  { id: 'physical_comedy', name: 'Physical Comedy', attributeId: 'physical_comedy' },
  { id: 'mask_work', name: 'Mask And Movement Work', attributeId: 'mask_and_mime' },
];

/** Every price in this file is the game's own calibration, not a quoted rate. */
export const CASTING_MONEY_NOTE =
  'Union minimums are set by negotiated agreement and change with each contract. SLATE models the shape of the schedule with its own numbers; nothing here is quoted as a current rate.';
