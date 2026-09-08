/**
 * SLATE — what a thing is, once it is a memory.
 *
 * The simulation already narrates itself. Three hundred and sixteen different
 * world events fire as a life is lived: a shift worked, a grading passed, a
 * bill missed, a friend seen, a car sold, a bag lost at an airport. Until now
 * almost none of it was written down. A whole simulated year produced four
 * lines of history, because history is for milestones and a life is not made
 * of milestones.
 *
 * This is the book that turns the stream into a memory. Each rule says what
 * one event means when you look back at it: what kind of remembering it is,
 * how much it mattered at the time, how fast the ordinary part of it fades,
 * and what to file it under.
 *
 * Two things this deliberately does not do. It does not invent: every rule is
 * keyed to an event the engine really emits, and the checker fails the build
 * if one of them stops existing. And it does not write the names into the
 * memory: a recollection carries ids, so a shop that changes hands or a
 * person who changes their name is remembered correctly rather than as they
 * were spelled on the day.
 */

import type { RecallKind } from '../domain/model';

/**
 * What is worth remembering about one kind of event.
 *
 * `weight` is how much it mattered when it happened, on a hundred. `halfLife`
 * is how many days it takes for the ordinary part of that to halve; zero
 * means it does not fade at all, which is right for the handful of things
 * nobody forgets.
 */
export interface RecallRule {
  event: string;
  kind: RecallKind;
  /** What it was, in the words it would be recalled in. */
  what: string;
  weight: number;
  halfLife: number;
  tags: readonly string[];
  /** The payload key naming what it was about, and what kind of thing that is. */
  subject?: { key: string; type: string };
  /** Remember it only when the payload says this. */
  onlyIf?: { key: string; is: string | number | boolean };
}

/**
 * Above this weight, a memory keeps half its force no matter how long ago it
 * was. Getting married, burying somebody, holding a first pay packet: the
 * detail goes and the fact never does.
 */
export const NEVER_BELOW_HALF = 75;

/** How long an ordinary memory of a kind takes to lose half its force. */
export const FADES = {
  sameWeek: 4,
  aMonth: 30,
  aSeason: 120,
  aYear: 365,
  never: 0,
} as const;

const r = (
  event: string, kind: RecallKind, what: string, weight: number, halfLife: number,
  tags: readonly string[], subject?: { key: string; type: string },
  onlyIf?: { key: string; is: string | number | boolean },
): RecallRule => ({ event, kind, what, weight, halfLife, tags, subject, onlyIf });

/**
 * The book.
 *
 * Weights are SLATE's own judgement about what a life feels like, and they
 * are the one thing here that is a judgement rather than a fact. The events
 * are real, the payload keys are real, and what the game did is real.
 */
export const RECALLBOOK: readonly RecallRule[] = [
  // --- Work, which is where a lot of a life goes ---------------------------
  r('job.taken', 'got', 'Started a job', 82, FADES.never, ['work', 'money'], { key: 'employerId', type: 'employer' }),
  r('job.worked', 'did', 'Worked a shift', 34, FADES.aMonth, ['work'], { key: 'employerId', type: 'employer' }),
  r('job.paid', 'got', 'Was paid', 48, FADES.aSeason, ['work', 'money']),
  r('job.promoted', 'got', 'Was promoted', 80, FADES.never, ['work'], { key: 'employerId', type: 'employer' }),
  r('job.rang_in', 'did', 'Rang in sick', 30, FADES.aMonth, ['work', 'health']),
  r('job.cover_asked', 'got', 'Was asked to come in on a day off', 26, FADES.sameWeek, ['work']),
  r('job.covered', 'did', 'Came in on a day off', 40, FADES.aSeason, ['work']),
  r('job.declined_cover', 'said', 'Said no to coming in', 28, FADES.aMonth, ['work']),
  r('job.left', 'lost', 'Handed a notice in', 74, FADES.never, ['work'], { key: 'employerId', type: 'employer' }),
  r('job.let_go', 'lost', 'Was let go', 88, FADES.never, ['work'], { key: 'employerId', type: 'employer' }),
  r('profession.levelled', 'got', 'Got better at the work', 58, FADES.aYear, ['work']),
  r('profession.unlocked', 'got', 'A line of work opened up', 62, FADES.aYear, ['work']),

  // --- School, which is where the rest of a young life goes ----------------
  r('school.attended', 'went', 'Went to school', 22, FADES.sameWeek, ['school']),
  r('school.skipped', 'did', 'Skipped school', 40, FADES.aSeason, ['school']),
  r('school.reported', 'got', 'Got a report card', 62, FADES.aYear, ['school']),
  r('school.joined_club', 'did', 'Joined something at school', 52, FADES.aYear, ['school', 'people']),
  r('school.cast', 'got', 'Was cast in the school play', 72, FADES.never, ['school', 'acting']),
  r('school.performed', 'did', 'Performed in front of the school', 76, FADES.never, ['school', 'acting']),
  r('exam.registered', 'did', 'Entered for an examination', 44, FADES.aSeason, ['school']),
  r('exam.studied', 'did', 'Worked a past paper', 24, FADES.sameWeek, ['school']),
  r('exam.sat', 'did', 'Sat an examination', 70, FADES.aYear, ['school']),
  r('exam.result', 'got', 'Got a result back', 84, FADES.never, ['school']),
  r('exam.withdrawn', 'did', 'Pulled out of an examination', 48, FADES.aYear, ['school']),
  r('edu.enrolled', 'did', 'Enrolled on a course', 56, FADES.aYear, ['school']),
  r('edu.completed', 'got', 'Finished a course', 68, FADES.never, ['school']),
  r('uni.applied', 'did', 'Applied to a university', 66, FADES.aYear, ['school']),
  r('uni.accepted', 'got', 'Got in', 92, FADES.never, ['school']),
  r('uni.declined', 'got', 'Was turned down', 78, FADES.never, ['school']),
  r('uni.term_done', 'did', 'Got through a term', 44, FADES.aYear, ['school']),
  r('uni.graduated', 'got', 'Graduated', 98, FADES.never, ['school']),
  r('uni.left', 'lost', 'Left university', 84, FADES.never, ['school']),
  r('growing.lesson', 'did', 'Was taught something', 30, FADES.aSeason, ['growing']),
  r('growing.test', 'did', 'Was tested on something', 34, FADES.aSeason, ['growing']),
  r('growing.arrived', 'felt', 'Grew into something new', 66, FADES.never, ['growing']),
  r('growing.lived', 'felt', 'A day of growing up', 18, FADES.sameWeek, ['growing']),
  r('growing.lapsed', 'lost', 'Let something go', 38, FADES.aSeason, ['growing']),
  r('growing.pet_ended', 'lost', 'Lost a pet', 90, FADES.never, ['growing', 'people']),

  // --- The week: training, classes, the people in it -----------------------
  r('week.training_started', 'did', 'Started training', 70, FADES.never, ['training']),
  r('week.trained', 'did', 'Trained', 28, FADES.aMonth, ['training']),
  r('week.graded', 'got', 'Was graded', 86, FADES.never, ['training']),
  r('week.training_stopped', 'lost', 'Stopped training', 60, FADES.aYear, ['training']),
  r('week.class_taken', 'did', 'Took a class', 34, FADES.aMonth, ['training']),
  r('week.spent', 'did', 'Spent part of a week on something', 24, FADES.sameWeek, ['week']),
  r('gym.checked_in', 'went', 'Went to the gym', 22, FADES.sameWeek, ['training']),
  r('gym.pass_bought', 'got', 'Joined a gym', 48, FADES.aYear, ['training', 'money']),
  r('fitness.workout_completed', 'did', 'Trained properly', 30, FADES.aMonth, ['training']),

  // --- The track, which is a season and not a hobby ------------------------
  r('track.trained', 'did', 'Trained on the track', 30, FADES.aMonth, ['track']),
  r('track.season_started', 'did', 'A season opened', 62, FADES.aYear, ['track']),
  r('track.meet_run', 'did', 'Ran a meet', 66, FADES.aYear, ['track']),
  r('track.trial', 'did', 'Ran a trial', 82, FADES.never, ['track']),
  r('track.season_ended', 'did', 'A season closed', 58, FADES.aYear, ['track']),
  r('track.signed', 'got', 'Was signed', 94, FADES.never, ['track', 'work']),
  r('track.turned_pro', 'got', 'Turned professional', 96, FADES.never, ['track', 'work']),
  r('track.retired', 'lost', 'Stopped running', 90, FADES.never, ['track']),

  // --- The body and the day it lives in ------------------------------------
  r('life.sleep_started', 'did', 'A night of sleep', 9, FADES.sameWeek, ['body']),
  r('life.ate', 'did', 'Ate something', 10, FADES.sameWeek, ['body', 'food']),
  r('life.cooked', 'did', 'Cooked', 26, FADES.aMonth, ['food', 'home']),
  r('life.showered', 'did', 'Showered', 6, FADES.sameWeek, ['body']),
  r('life.activity_completed', 'did', 'Spent an hour on something', 20, FADES.sameWeek, ['life']),
  r('life.birthday', 'felt', 'Had a birthday', 72, FADES.never, ['life']),
  r('life.passed', 'lost', 'Somebody died', 100, FADES.never, ['life', 'people']),

  // --- People, which is the part that matters ------------------------------
  r('rel.created', 'met', 'Met somebody', 56, FADES.never, ['people'], { key: 'personId', type: 'person' }),
  r('rel.interaction', 'met', 'Spent time with somebody', 30, FADES.aMonth, ['people'], { key: 'personId', type: 'person' }),
  r('rel.gift_given', 'did', 'Gave somebody something', 52, FADES.aYear, ['people'], { key: 'personId', type: 'person' }),
  r('rel.became_partners', 'got', 'Started seeing somebody properly', 92, FADES.never, ['people'], { key: 'personId', type: 'person' }),
  r('rel.engaged', 'got', 'Got engaged', 98, FADES.never, ['people'], { key: 'personId', type: 'person' }),
  r('rel.married', 'got', 'Got married', 100, FADES.never, ['people'], { key: 'personId', type: 'person' }),
  r('rel.wedding_planned', 'did', 'Set a wedding date', 88, FADES.never, ['people']),
  r('rel.child_added', 'got', 'A child arrived', 100, FADES.never, ['people', 'family']),
  r('rel.ended', 'lost', 'It ended', 94, FADES.never, ['people'], { key: 'personId', type: 'person' }),
  r('rel.proposal_declined', 'lost', 'Was turned down', 96, FADES.never, ['people'], { key: 'personId', type: 'person' }),
  r('rel.ask_out_declined', 'lost', 'Was told no', 58, FADES.aYear, ['people'], { key: 'personId', type: 'person' }),
  r('rel.birthday', 'felt', 'Somebody else had a birthday', 34, FADES.aYear, ['people'], { key: 'personId', type: 'person' }),
  r('rel.intimacy', 'met', 'A night with somebody', 62, FADES.aYear, ['people'], { key: 'personId', type: 'person' }),
  r('rel.date_scheduled', 'said', 'Arranged to see somebody', 44, FADES.aMonth, ['people'], { key: 'personId', type: 'person' }),
  r('rel.date_resolved', 'met', 'Went on a date', 64, FADES.aYear, ['people'], { key: 'personId', type: 'person' }),
  r('date.started', 'met', 'A date began', 40, FADES.aSeason, ['people']),
  r('date.closed', 'met', 'A date ended', 54, FADES.aYear, ['people']),
  r('date.cancelled', 'lost', 'Called a date off', 46, FADES.aSeason, ['people']),
  r('date.they_cancelled', 'lost', 'They called it off', 58, FADES.aYear, ['people']),
  r('date.stood_up', 'lost', 'Was stood up', 78, FADES.never, ['people']),
  r('place.ran_into', 'met', 'Ran into somebody', 38, FADES.aSeason, ['people']),
  r('place.recognised', 'felt', 'Was recognized', 60, FADES.aYear, ['people', 'fame']),

  // --- Money, which is remembered accurately or not at all -----------------
  r('finance.account_opened', 'did', 'Opened an account', 46, FADES.aYear, ['money']),
  r('finance.bill_paid', 'did', 'Paid a bill', 14, FADES.sameWeek, ['money']),
  r('finance.bill_missed', 'lost', 'Missed a bill', 56, FADES.aYear, ['money']),
  r('finance.loan_taken', 'got', 'Took a loan', 72, FADES.never, ['money']),
  r('finance.tax_reconciled', 'did', 'Squared the tax', 44, FADES.aYear, ['money']),
  r('bank.opened', 'did', 'Opened a bank account', 42, FADES.aYear, ['money']),
  r('bank.closed', 'lost', 'Closed a bank account', 38, FADES.aYear, ['money']),
  r('bank.overdrawn', 'felt', 'Went overdrawn', 54, FADES.aYear, ['money']),
  r('bank.card_late', 'lost', 'Paid a card late', 50, FADES.aYear, ['money']),
  r('bank.invited', 'got', 'Was invited somewhere by a bank', 64, FADES.never, ['money']),
  r('bank.private_opened', 'got', 'Was taken on privately by a bank', 78, FADES.never, ['money']),
  r('bank.private_declined', 'lost', 'A bank said no', 62, FADES.aYear, ['money']),
  r('bank.matured', 'got', 'Something matured', 48, FADES.aYear, ['money']),

  // --- Owning things -------------------------------------------------------
  r('shop.asset_acquired', 'got', 'Bought something', 30, FADES.aSeason, ['shopping'], { key: 'assetId', type: 'asset' }),
  r('shop.asset_sold', 'lost', 'Sold something', 34, FADES.aSeason, ['shopping'], { key: 'assetId', type: 'asset' }),
  r('shop.order_placed', 'did', 'Ordered something', 18, FADES.sameWeek, ['shopping']),
  r('shop.order_delivered', 'got', 'Something arrived', 22, FADES.sameWeek, ['shopping']),
  r('shop.returned', 'did', 'Took something back', 26, FADES.aMonth, ['shopping']),
  r('retail.entered', 'went', 'Went into a shop', 12, FADES.sameWeek, ['shopping'], { key: 'placeId', type: 'place' }),
  r('retail.left', 'did', 'Came out of a shop with something', 24, FADES.sameWeek, ['shopping'], { key: 'placeId', type: 'place' }, { key: 'bought', is: true }),
  r('wear.dressed', 'did', 'Got dressed for something', 16, FADES.sameWeek, ['clothes']),
  r('wear.cleaned', 'did', 'Got clothes cleaned', 12, FADES.sameWeek, ['clothes']),

  // --- Cars, and the rest of what moves ------------------------------------
  r('vehicle.purchased', 'got', 'Bought a car', 80, FADES.never, ['vehicle'], { key: 'vehicleId', type: 'vehicle' }),
  r('vehicle.delivered', 'got', 'Took delivery', 74, FADES.never, ['vehicle'], { key: 'vehicleId', type: 'vehicle' }),
  r('vehicle.sold', 'lost', 'Sold a car', 66, FADES.never, ['vehicle'], { key: 'vehicleId', type: 'vehicle' }),
  r('vehicle.named', 'did', 'Named a car', 44, FADES.never, ['vehicle'], { key: 'vehicleId', type: 'vehicle' }),
  r('vehicle.serviced', 'did', 'Had a car serviced', 24, FADES.aSeason, ['vehicle'], { key: 'vehicleId', type: 'vehicle' }),
  r('vehicle.modified', 'did', 'Changed something on a car', 46, FADES.aYear, ['vehicle'], { key: 'vehicleId', type: 'vehicle' }),
  r('vehicle.cruised', 'did', 'Went for a drive', 26, FADES.aMonth, ['vehicle'], { key: 'vehicleId', type: 'vehicle' }),
  r('place.refuelled', 'did', 'Filled the tank', 10, FADES.sameWeek, ['vehicle'], { key: 'placeId', type: 'place' }),
  r('deal.opened', 'did', 'Sat down with a dealer', 34, FADES.aSeason, ['vehicle']),
  r('deal.agreed', 'got', 'Agreed a price', 68, FADES.never, ['vehicle', 'money']),
  r('deal.signed', 'did', 'Signed for a car', 76, FADES.never, ['vehicle', 'money']),
  r('deal.walked', 'did', 'Walked away from a deal', 56, FADES.aYear, ['vehicle']),

  // --- Where you live ------------------------------------------------------
  r('property.purchased', 'got', 'Bought a place', 100, FADES.never, ['home'], { key: 'propertyId', type: 'property' }),
  r('prop.rented', 'got', 'Took a place on', 82, FADES.never, ['home'], { key: 'propertyId', type: 'property' }),
  r('prop.moved_in', 'went', 'Moved in', 92, FADES.never, ['home'], { key: 'propertyId', type: 'property' }),
  r('prop.listed', 'did', 'Put a place up', 74, FADES.never, ['home'], { key: 'propertyId', type: 'property' }),
  r('prop.offer_submitted', 'did', 'Made an offer', 70, FADES.aYear, ['home']),
  r('prop.offer_accepted', 'got', 'An offer was accepted', 90, FADES.never, ['home']),
  r('prop.offer_rejected', 'lost', 'An offer was turned down', 68, FADES.aYear, ['home']),
  r('prop.showing_attended', 'went', 'Went to look round a place', 42, FADES.aSeason, ['home']),
  r('prop.showing_missed', 'lost', 'Missed a viewing', 44, FADES.aSeason, ['home']),
  r('prop.room_finished', 'did', 'Finished a room', 58, FADES.aYear, ['home']),
  r('prop.furnishing_added', 'got', 'Put something in a room', 22, FADES.aMonth, ['home']),
  r('home.broke', 'lost', 'Something broke', 44, FADES.aSeason, ['home']),
  r('home.repair_booked', 'did', 'Booked a repair', 22, FADES.aMonth, ['home']),
  r('home.repaired', 'got', 'Something was mended', 30, FADES.aSeason, ['home']),
  r('home.used', 'did', 'Used something in the house', 8, FADES.sameWeek, ['home']),

  // --- Health, and the rooms nobody enjoys ---------------------------------
  r('health.appointment_booked', 'did', 'Booked an appointment', 26, FADES.aMonth, ['health']),
  r('health.appointment_completed', 'went', 'Saw a doctor', 54, FADES.aYear, ['health']),
  r('health.appointment_missed', 'lost', 'Missed an appointment', 44, FADES.aSeason, ['health']),
  r('health.consulted', 'met', 'Was seen by somebody', 50, FADES.aYear, ['health']),
  r('health.results', 'got', 'Results came back', 76, FADES.never, ['health']),
  r('health.prescription_filled', 'got', 'Picked up a prescription', 30, FADES.aSeason, ['health']),
  r('health.prescription_lapsed', 'lost', 'Let a prescription lapse', 44, FADES.aSeason, ['health']),
  r('room.dentist', 'went', 'Went to the dentist', 46, FADES.aYear, ['health'], { key: 'placeId', type: 'place' }),
  r('room.vet', 'went', 'Took a pet to the vet', 54, FADES.aYear, ['health'], { key: 'placeId', type: 'place' }),
  r('room.counter', 'did', 'Got something done at a counter', 34, FADES.aSeason, ['papers'], { key: 'placeId', type: 'place' }),
  r('room.counter_refused', 'lost', 'Was sent home from a counter', 48, FADES.aYear, ['papers'], { key: 'placeId', type: 'place' }),
  r('room.phone_repaired', 'got', 'Had a phone mended', 32, FADES.aSeason, ['shopping'], { key: 'placeId', type: 'place' }),
  r('room.plan_taken', 'got', 'Took a phone plan', 38, FADES.aYear, ['money']),
  r('room.plan_ended', 'lost', 'Ended a phone plan', 30, FADES.aYear, ['money']),
  r('doc.issued', 'got', 'A document came through', 62, FADES.never, ['papers']),
  r('doc.applied', 'did', 'Applied for a document', 40, FADES.aYear, ['papers']),
  r('doc.lost', 'lost', 'Lost a document', 66, FADES.never, ['papers']),
  r('doc.test_failed', 'lost', 'Failed a test', 72, FADES.never, ['papers']),

  // --- Going places, and going out -----------------------------------------
  r('travel.trip_booked', 'did', 'Booked a trip', 62, FADES.aYear, ['travel']),
  r('travel.flight_booked', 'did', 'Booked a flight', 44, FADES.aSeason, ['travel']),
  r('travel.departed', 'went', 'Flew somewhere', 58, FADES.aYear, ['travel']),
  r('travel.arrived', 'went', 'Landed somewhere', 60, FADES.aYear, ['travel']),
  r('travel.flight_missed', 'lost', 'Missed a flight', 80, FADES.never, ['travel']),
  r('travel.bag_lost', 'lost', 'Lost a bag', 72, FADES.never, ['travel']),
  r('travel.bag_returned', 'got', 'Got a bag back', 50, FADES.aYear, ['travel']),
  r('travel.checked_in', 'went', 'Checked into a hotel', 40, FADES.aSeason, ['travel']),
  r('travel.drive_started', 'went', 'Set off driving', 30, FADES.aMonth, ['travel']),
  r('go.arrived', 'went', 'Went somewhere in the city', 12, FADES.sameWeek, ['city'], { key: 'placeId', type: 'place' }),
  r('place.visited', 'went', 'Saw something worth seeing', 40, FADES.aYear, ['city'], { key: 'placeId', type: 'place' }),
  r('place.photographed', 'did', 'Took a picture of something', 34, FADES.aYear, ['city'], { key: 'placeId', type: 'place' }),
  r('cine.attended', 'went', 'Went to the pictures', 44, FADES.aYear, ['going', 'film']),
  r('cine.missed', 'lost', 'Missed a showing', 30, FADES.aSeason, ['going']),
  r('going.attended', 'went', 'Went to something in town', 52, FADES.aYear, ['going']),
  r('going.missed', 'lost', 'Missed something in town', 36, FADES.aSeason, ['going']),
  r('fw.attended', 'went', 'Sat at a show', 74, FADES.never, ['going', 'clothes']),
  r('fw.refused', 'lost', 'A house said no', 58, FADES.aYear, ['going', 'clothes']),
  r('dine.settled', 'did', 'Ate out', 34, FADES.aMonth, ['food'], { key: 'placeId', type: 'place' }),
  r('errand.cut', 'did', 'Got a haircut', 26, FADES.aMonth, ['city']),
  r('errand.posted', 'did', 'Posted something', 12, FADES.sameWeek, ['city']),
  r('errand.parcel_lost', 'lost', 'A parcel went missing', 46, FADES.aSeason, ['city']),

  // --- The work you are actually here to do --------------------------------
  r('shoot.planned', 'did', 'Planned a shoot', 62, FADES.aYear, ['film']),
  r('shoot.wrapped', 'did', 'Wrapped a shoot', 84, FADES.never, ['film']),
  r('shoot.abandoned', 'lost', 'Abandoned a shoot', 76, FADES.never, ['film']),
  r('shoot.permission_answered', 'got', 'Heard back about permission', 44, FADES.aSeason, ['film']),
  r('kit.hired', 'got', 'Hired kit', 38, FADES.aSeason, ['film', 'money']),
  r('kit.returned', 'did', 'Took kit back', 20, FADES.aMonth, ['film']),
  r('kit.lost', 'lost', 'Lost hired kit', 78, FADES.never, ['film', 'money']),
  r('film.started', 'did', 'Started something', 80, FADES.never, ['film']),
  r('film.finished', 'did', 'Finished something', 92, FADES.never, ['film']),
  r('film.screened', 'got', 'It was shown', 90, FADES.never, ['film']),
  r('film.submitted', 'did', 'Submitted something', 66, FADES.aYear, ['film']),
  r('film.abandoned', 'lost', 'Gave up on something', 82, FADES.never, ['film']),
  r('co.founded', 'got', 'Started a company', 96, FADES.never, ['work']),

  // --- The phone, and the part of a life that happens on it ----------------
  r('video.published', 'did', 'Put a video up', 46, FADES.aSeason, ['online']),
  r('video.read_harsh', 'felt', 'Read something unkind', 54, FADES.aYear, ['online']),
  r('video.taken_down', 'lost', 'Something was taken down', 66, FADES.never, ['online']),
  r('social.post_published', 'did', 'Posted something', 22, FADES.sameWeek, ['online']),
  r('social.deal_offered', 'got', 'Was offered a deal', 62, FADES.aYear, ['online', 'money']),
  r('social.deal_completed', 'did', 'Finished a deal', 58, FADES.aYear, ['online', 'money']),
  r('social.deal_breached', 'lost', 'Missed what a deal asked for', 74, FADES.never, ['online', 'money']),
  r('social.earnings_paid', 'got', 'Was paid for it', 50, FADES.aSeason, ['online', 'money']),
  r('feed.went_live', 'did', 'Went live', 40, FADES.aSeason, ['online']),
  r('feed.messaged', 'said', 'Messaged somebody', 18, FADES.sameWeek, ['online', 'people']),

  // --- Insurance, which is only remembered when it goes wrong --------------
  r('ins.policy_purchased', 'did', 'Took a policy out', 34, FADES.aYear, ['money']),
  r('ins.claim_settled', 'got', 'A claim was paid', 64, FADES.never, ['money']),
  r('ins.claim_denied', 'lost', 'A claim was refused', 76, FADES.never, ['money']),
];

export const RULE_BY_EVENT: Readonly<Record<string, RecallRule>> = Object.fromEntries(
  RECALLBOOK.map((one) => [one.event, one]),
);

/** Payload keys that name somebody who was there. */
export const PERSON_KEYS = [
  'personId', 'otherId', 'withId', 'friendId', 'partnerId', 'trainerId',
  'guestId', 'coachId', 'providerId', 'staffId',
] as const;

/** Payload keys that name where it happened. */
export const PLACE_KEYS = ['placeId', 'venueId', 'gymId', 'cinemaId', 'restaurantId'] as const;

/** Payload keys that carry money, in cents. */
export const MONEY_KEYS = ['amount', 'price', 'cost', 'net', 'total', 'fee', 'paid', 'premium'] as const;

export const RECALL_NOTE = 'A memory is written from something that really happened in the '
  + 'simulation, and it carries ids rather than names, so it is never wrong about what a '
  + 'thing is called. What an event was worth remembering is SLATE’s own judgement; that it '
  + 'happened is not.';

export const RECALL_LIMITS_NOTE = 'There is no model here and no network. The game remembers '
  + 'what it did, ranked by what it would still be thinking about, and it can only bring up '
  + 'something that is in the record. It cannot remember what it was never told, and it will '
  + 'not invent a memory to fill a gap.';
