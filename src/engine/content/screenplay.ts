/**
 * SLATE — a script as a document.
 *
 * A draft used to be one number and three sub-scores. It is now the thing a
 * production actually runs on: fourteen craft dimensions weighted by what the
 * genre asks for, a scene list with sluglines a schedule can be boarded from,
 * and a cast of characters with the archetype each one plays, from which the
 * roles are broken down.
 *
 * Everything here is generated and deterministic: the same writers, the same
 * project and the same draft number produce the same script. The settings and
 * the purposes are written per genre family so a horror script does not read
 * like a romantic comedy with the word 'blood' in it.
 */

import type { Rng } from '../core/rng';
import { clamp } from '../core/rng';
import type { CharacterArchetype, Scene, SceneKind, SceneNeed, ScriptCharacter } from '../domain/model';
import { CRAFT_DIMENSIONS, craftWeights, type CraftDimension } from './genres';
import { registerFor, type Register } from './titles';
import { generateCharacterName } from './names';

// ---------------------------------------------------------------------------
// Where scenes happen, by the kind of picture
// ---------------------------------------------------------------------------

interface SettingBank {
  interiors: readonly string[];
  exteriors: readonly string[];
  /** How much of the script is interior, 0-1. */
  interiorShare: number;
  /** How much of it is at night, 0-1. */
  nightShare: number;
  /** What the scenes need, and how often. */
  needs: readonly [SceneNeed, number][];
  /** Which kinds of scene the genre runs on, weighted. */
  kinds: readonly [SceneKind, number][];
  /** What scenes are for, in one line each. */
  purposes: readonly string[];
}

const SHARED_INTERIORS = ['KITCHEN', 'LIVING ROOM', 'BEDROOM', 'HALLWAY', 'CAR', 'DINER', 'OFFICE', 'HOTEL ROOM', 'BAR', 'HOSPITAL ROOM', 'STAIRWELL', 'BATHROOM', 'CORRIDOR'];
const SHARED_EXTERIORS = ['STREET', 'PARKING LOT', 'PORCH', 'CAR PARK', 'ROOFTOP', 'BEACH', 'PARK', 'ALLEY', 'GAS STATION', 'BRIDGE', 'BACKYARD', 'ROAD'];

const SETTINGS: Readonly<Record<Register, SettingBank>> = {
  crime: {
    interiors: ['INTERROGATION ROOM', 'BULLPEN', 'BACK OFFICE', 'WAREHOUSE', 'COUNTING ROOM', 'PAWN SHOP', 'SAFE HOUSE', 'COURTROOM', 'MOTEL ROOM', 'GARAGE', 'BOOKMAKER', 'EVIDENCE LOCKUP'],
    exteriors: ['DOCKS', 'UNDERPASS', 'IMPOUND YARD', 'RAILWAY SIDING', 'STRIP MALL', 'HARBOUR ROAD', 'SCRAPYARD', 'PAYPHONE'],
    interiorShare: 0.62, nightShare: 0.48,
    needs: [['weapons', 0.22], ['vehicles', 0.18], ['stunts', 0.1], ['night_exterior', 0.2]],
    kinds: [['dialogue', 5], ['action', 2], ['set_piece', 1], ['reveal', 1.5], ['transition', 1]],
    purposes: ['The plan is laid out and one person is not listening.', 'Somebody lies and somebody notices.', 'The money changes hands, badly.', 'A cop and a suspect, neither telling the truth.', 'The job goes wrong in the first thirty seconds.', 'The favour that costs more than it is worth.', 'Two men decide who is expendable.', 'The evidence that should not exist.', 'A door that should have been locked.', 'The alibi falls apart under one question.'],
  },
  horror: {
    interiors: ['CELLAR', 'ATTIC', 'CHILD\'S BEDROOM', 'FARMHOUSE KITCHEN', 'CHAPEL', 'CRAWLSPACE', 'MOTEL ROOM', 'HOSPITAL WARD', 'BARN', 'BOILER ROOM', 'LIBRARY', 'MIRROR ROOM'],
    exteriors: ['WOODS', 'CORNFIELD', 'GRAVEYARD', 'LAKE SHORE', 'OLD ROAD', 'CHURCHYARD', 'PORCH', 'WELL'],
    interiorShare: 0.66, nightShare: 0.6,
    needs: [['practical_effects', 0.3], ['creature', 0.12], ['children', 0.1], ['night_exterior', 0.25], ['water', 0.05]],
    kinds: [['dialogue', 3], ['reveal', 3], ['set_piece', 2], ['intimate', 1], ['transition', 1]],
    purposes: ['The house makes a sound it has not made before.', 'Somebody explains the rules, and is wrong about one.', 'The first one of them is taken.', 'A prayer said too fast.', 'What was in the photograph.', 'The door is open and nobody opened it.', 'The thing they buried is not where they buried it.', 'The survivor decides to go back in.', 'A child says something a child should not know.', 'The last light goes out.'],
  },
  scifi: {
    interiors: ['BRIDGE', 'CARGO BAY', 'MEDICAL BAY', 'LABORATORY', 'AIRLOCK', 'HABITAT MODULE', 'CONTROL ROOM', 'SERVER HALL', 'CRYO DECK', 'BRIEFING ROOM', 'MAINTENANCE SHAFT'],
    exteriors: ['SURFACE', 'LANDING PAD', 'RIDGE', 'CRATER FLOOR', 'ORBITAL PLATFORM', 'DUST PLAIN', 'ROOFTOP'],
    interiorShare: 0.7, nightShare: 0.3,
    needs: [['vfx', 0.45], ['stunts', 0.12], ['creature', 0.08], ['practical_effects', 0.15]],
    kinds: [['dialogue', 4], ['set_piece', 2], ['reveal', 2], ['action', 1.5], ['montage', 1]],
    purposes: ['The signal repeats, and it is not random.', 'A decision the protocol does not cover.', 'What the readings actually mean.', 'The crew votes, and the captain does not.', 'The thing that came back with them.', 'Oxygen, counted in hours.', 'A message from someone who should be dead.', 'The door will not open from this side.', 'The last transmission, played twice.', 'Home, seen from further away than anybody has seen it.'],
  },
  fantasy: {
    interiors: ['GREAT HALL', 'THRONE ROOM', 'TAVERN', 'ARMOURY', 'TOWER CHAMBER', 'CRYPT', 'WAR TENT', 'LIBRARY', 'SMITHY', 'TEMPLE'],
    exteriors: ['BATTLEFIELD', 'FOREST ROAD', 'RIVER CROSSING', 'CASTLE WALL', 'MOUNTAIN PASS', 'VILLAGE SQUARE', 'RUINS', 'HARBOUR'],
    interiorShare: 0.5, nightShare: 0.32,
    needs: [['vfx', 0.32], ['stunts', 0.22], ['crowd', 0.18], ['animals', 0.15], ['period_dress', 0.6], ['creature', 0.12], ['weapons', 0.3]],
    kinds: [['dialogue', 4], ['set_piece', 2], ['action', 2], ['reveal', 1.5], ['montage', 1]],
    purposes: ['The oath, and the one who will break it.', 'A map that is wrong on purpose.', 'The price of the crossing.', 'What the old one knows and will not say.', 'The crown is offered and refused.', 'The battle, seen from the wrong side.', 'A gift that is a curse.', 'The heir learns whose child they are.', 'The gate holds for one more night.', 'What was promised at the river.'],
  },
  romance: {
    interiors: ['BOOKSHOP', 'APARTMENT', 'RESTAURANT', 'TRAIN CARRIAGE', 'WEDDING VENUE', 'HOTEL LOBBY', 'FLORIST', 'KITCHEN', 'TAXI', 'GALLERY', 'AIRPORT GATE'],
    exteriors: ['PIER', 'STREET MARKET', 'RIVERSIDE PATH', 'ROOFTOP', 'RAILWAY PLATFORM', 'VINEYARD', 'BEACH', 'TOWN SQUARE'],
    interiorShare: 0.58, nightShare: 0.28,
    needs: [['intimacy', 0.14], ['crowd', 0.08]],
    kinds: [['dialogue', 6], ['intimate', 2], ['montage', 1.5], ['reveal', 1], ['transition', 1]],
    purposes: ['They meet badly.', 'The thing neither of them says at dinner.', 'A letter, read by the wrong person.', 'The friend who sees it before they do.', 'The argument that is really about something else.', 'The kiss that was not the plan.', 'What the ex said, and whether it was true.', 'The wrong train, taken deliberately.', 'A wedding, not theirs.', 'The door, and whether to knock.'],
  },
  comedy: {
    interiors: ['OPEN-PLAN OFFICE', 'BREAK ROOM', 'FAMILY KITCHEN', 'DENTIST WAITING ROOM', 'REGISTRY OFFICE', 'PARISH HALL', 'TINY APARTMENT', 'SUPERMARKET', 'GYM', 'CONFERENCE ROOM', 'MINIBUS'],
    exteriors: ['SUBURBAN STREET', 'GARDEN CENTRE', 'SCHOOL GATE', 'CAR PARK', 'FIVE-A-SIDE PITCH', 'HIGH STREET', 'CAMPSITE'],
    interiorShare: 0.64, nightShare: 0.18,
    needs: [['vehicles', 0.08], ['animals', 0.08], ['crowd', 0.1], ['stunts', 0.06]],
    kinds: [['dialogue', 6], ['set_piece', 2], ['montage', 1.5], ['crowd', 1], ['transition', 1]],
    purposes: ['The lie that requires a second lie.', 'Everybody is in the wrong room.', 'A speech that goes exactly as badly as feared.', 'The plan, explained to someone who was not meant to hear it.', 'An apology that makes it worse.', 'The neighbour, again.', 'A misunderstanding nobody will clear up because that would be awkward.', 'The list, and who is not on it.', 'The one honest conversation, at the worst time.', 'The car will not start and it is his fault.'],
  },
  drama: {
    interiors: ['KITCHEN', 'HOSPITAL CORRIDOR', 'SOLICITOR\'S OFFICE', 'FUNERAL HOME', 'CHILDHOOD BEDROOM', 'FACTORY FLOOR', 'SCHOOL STAFFROOM', 'CAR', 'COUNCIL FLAT', 'FISHING BOAT CABIN', 'COURTROOM', 'SHOP BACK ROOM'],
    exteriors: ['HARBOUR WALL', 'ALLOTMENT', 'ESTATE STAIRWELL', 'BUS STOP', 'CLIFF PATH', 'PLAYING FIELD', 'RIVERBANK', 'FRONT STEP'],
    interiorShare: 0.6, nightShare: 0.3,
    needs: [['children', 0.1], ['vehicles', 0.08], ['water', 0.05], ['intimacy', 0.06]],
    kinds: [['dialogue', 6], ['intimate', 2], ['reveal', 1.5], ['montage', 1], ['transition', 1]],
    purposes: ['The thing that was never said at the table.', 'A decision made for someone else.', 'What the letter actually says.', 'The last conversation, which neither of them knows is the last.', 'The money, and where it went.', 'A brother comes back.', 'The apology that is thirty years late.', 'What the doctor did not say.', 'The house, sold.', 'Somebody stays.'],
  },
  war: {
    interiors: ['DUGOUT', 'FIELD HOSPITAL', 'COMMAND POST', 'BARRACKS', 'TRANSPORT PLANE', 'FARMHOUSE', 'CHURCH', 'RADIO ROOM', 'MESS TENT'],
    exteriors: ['TRENCH LINE', 'RIDGE', 'RIVER CROSSING', 'VILLAGE ROAD', 'BEACHHEAD', 'FOREST EDGE', 'AIRFIELD', 'CHECKPOINT'],
    interiorShare: 0.4, nightShare: 0.35,
    needs: [['weapons', 0.7], ['stunts', 0.3], ['crowd', 0.3], ['vehicles', 0.25], ['practical_effects', 0.35], ['period_dress', 0.7], ['night_exterior', 0.2]],
    kinds: [['action', 3], ['dialogue', 4], ['set_piece', 2], ['montage', 1], ['reveal', 1]],
    purposes: ['The order, and the man who has to give it.', 'A letter home that will not be sent.', 'The crossing, under fire.', 'What was left in the village.', 'The relief that does not come.', 'Two men who will not both make it.', 'The lieutenant is wrong and everybody knows it.', 'The ridge, taken twice.', 'A prisoner, and what to do with him.', 'Morning, and a count.'],
  },
  western: {
    interiors: ['SALOON', 'SHERIFF\'S OFFICE', 'HOMESTEAD KITCHEN', 'BANK', 'LIVERY STABLE', 'CHURCH', 'HOTEL ROOM', 'GENERAL STORE', 'JAIL CELL'],
    exteriors: ['MAIN STREET', 'RIDGE', 'RIVER CROSSING', 'CANYON', 'RAILHEAD', 'RANCH GATE', 'DRY WASH', 'CEMETERY HILL'],
    interiorShare: 0.38, nightShare: 0.25,
    needs: [['animals', 0.55], ['weapons', 0.5], ['stunts', 0.25], ['period_dress', 0.8], ['vehicles', 0.1]],
    kinds: [['dialogue', 4], ['action', 2], ['set_piece', 1.5], ['reveal', 1], ['transition', 1.5]],
    purposes: ['The stranger, and what the town decides about him.', 'The claim that was never filed.', 'A horse, traded for a life.', 'The marshal is late on purpose.', 'What the river took.', 'The stand-off nobody wanted.', 'A grave dug by the wrong man.', 'The railroad man makes an offer.', 'The last ride out.', 'Dawn, and who is still standing.'],
  },
  history: {
    interiors: ['DRAWING ROOM', 'COUNCIL CHAMBER', 'SERVANTS\' HALL', 'CHAPEL', 'STUDY', 'BEDCHAMBER', 'COURTROOM', 'PRINTING SHOP', 'BALLROOM', 'CARRIAGE'],
    exteriors: ['ESTATE GARDENS', 'MARKET SQUARE', 'DOCKSIDE', 'PARADE GROUND', 'COUNTRY LANE', 'CHURCHYARD', 'PALACE COURTYARD'],
    interiorShare: 0.62, nightShare: 0.3,
    needs: [['period_dress', 0.9], ['crowd', 0.2], ['animals', 0.2], ['vehicles', 0.05]],
    kinds: [['dialogue', 6], ['reveal', 1.5], ['crowd', 1], ['intimate', 1], ['montage', 1]],
    purposes: ['The letter that changes the succession.', 'A marriage arranged in a corridor.', 'What the servants know first.', 'The vote, counted twice.', 'A debt called in.', 'The audience, refused.', 'What was said at the ball.', 'The trial, and what it is really about.', 'A ship that does not come back.', 'The will is read.'],
  },
  family: {
    interiors: ['TREEHOUSE', 'FAMILY KITCHEN', 'SCHOOL HALL', 'GRANDMA\'S ATTIC', 'PET SHOP', 'BEDROOM', 'GARAGE WORKSHOP', 'TOY SHOP', 'CLASSROOM', 'CARAVAN'],
    exteriors: ['BACK GARDEN', 'PLAYGROUND', 'RIVERBANK', 'SEAFRONT', 'VILLAGE FETE', 'FOREST PATH', 'FARMYARD', 'SCHOOL GATE'],
    interiorShare: 0.5, nightShare: 0.12,
    needs: [['children', 0.7], ['animals', 0.3], ['vfx', 0.15], ['vehicles', 0.08], ['water', 0.08]],
    kinds: [['dialogue', 4], ['set_piece', 2], ['montage', 2], ['action', 1], ['reveal', 1]],
    purposes: ['The plan, which is a very good plan.', 'The dog knows something.', 'A rule that has to be broken.', 'What the grown-ups will not explain.', 'The map to the thing.', 'Everybody gets lost at once.', 'The apology, and the hug.', 'A machine that nearly works.', 'The day of the fete.', 'Home, in time for tea.'],
  },
  doc: {
    interiors: ['INTERVIEW ROOM', 'ARCHIVE', 'KITCHEN TABLE', 'NEWSROOM', 'COURTROOM', 'TOWN HALL', 'WORKSHOP', 'CONTROL ROOM'],
    exteriors: ['SITE', 'HARBOUR', 'MEMORIAL', 'FIELD', 'MAIN STREET', 'RIVER', 'FACTORY GATE'],
    interiorShare: 0.55, nightShare: 0.1,
    needs: [['crowd', 0.1], ['vehicles', 0.1], ['water', 0.08]],
    kinds: [['dialogue', 6], ['montage', 3], ['reveal', 2], ['transition', 2]],
    purposes: ['The witness, on the record.', 'The document nobody was meant to see.', 'The site, as it is now.', 'What the official account leaves out.', 'The family, and what they were told.', 'Footage from the day.', 'The expert, and the limits of what can be known.', 'The town, ten years on.', 'A phone call, recorded.', 'The question that is not answered.'],
  },
  musical: {
    interiors: ['REHEARSAL ROOM', 'DRESSING ROOM', 'THEATRE STAGE', 'BACKSTAGE CORRIDOR', 'DANCE HALL', 'DINER', 'RECORDING STUDIO', 'APARTMENT', 'CLUB'],
    exteriors: ['STAGE DOOR', 'ROOFTOP', 'CITY STREET', 'FIRE ESCAPE', 'PIER', 'PARK BANDSTAND'],
    interiorShare: 0.62, nightShare: 0.4,
    needs: [['crowd', 0.3], ['stunts', 0.05], ['period_dress', 0.3]],
    kinds: [['set_piece', 4], ['dialogue', 4], ['montage', 2], ['intimate', 1.5], ['reveal', 1]],
    purposes: ['The number that introduces her.', 'The audition, and who is watching.', 'A duet neither of them meant to sing.', 'The opening night that nearly does not happen.', 'The rehearsal where it finally works.', 'What the reviews said.', 'A song about leaving.', 'The understudy goes on.', 'The ballad at the end of the pier.', 'The finale, all of them.'],
  },
  sport: {
    interiors: ['LOCKER ROOM', 'GYM', 'MANAGER\'S OFFICE', 'PHYSIO ROOM', 'FAMILY KITCHEN', 'PRESS ROOM', 'TEAM BUS', 'HOTEL ROOM'],
    exteriors: ['PITCH', 'TRAINING GROUND', 'STADIUM TUNNEL', 'RUNNING TRACK', 'CAR PARK', 'TERRACES', 'BOXING RING'],
    interiorShare: 0.5, nightShare: 0.25,
    needs: [['crowd', 0.4], ['stunts', 0.2], ['vehicles', 0.05]],
    kinds: [['dialogue', 4], ['set_piece', 3], ['montage', 2.5], ['reveal', 1], ['action', 1]],
    purposes: ['The team talk that does not work.', 'The injury, and who saw it coming.', 'A contract, and what it is really for.', 'The comeback, first attempt.', 'The last five minutes.', 'What the coach said to the press.', 'Training, in the rain.', 'The one who does not make the squad.', 'The final, from the bench.', 'The whistle.'],
  },
  mystery: {
    interiors: ['DRAWING ROOM', 'STUDY', 'CORONER\'S OFFICE', 'HOTEL ROOM', 'LIBRARY', 'INCIDENT ROOM', 'KITCHEN', 'TRAIN COMPARTMENT', 'ARCHIVE', 'BASEMENT'],
    exteriors: ['GRAVEL DRIVE', 'BOATHOUSE', 'MOOR', 'CHURCHYARD', 'RIVERBANK', 'STATION PLATFORM', 'CLIFFTOP'],
    interiorShare: 0.66, nightShare: 0.42,
    needs: [['vehicles', 0.1], ['water', 0.06], ['weapons', 0.1], ['period_dress', 0.2]],
    kinds: [['dialogue', 6], ['reveal', 3], ['intimate', 1], ['transition', 1.5]],
    purposes: ['The body, and the time on the clock.', 'An alibi that is one minute too tight.', 'The second interview, which is different.', 'The photograph, enlarged.', 'What the housekeeper saw.', 'The detective is wrong, and knows it.', 'A letter dated after the death.', 'The reconstruction.', 'Everybody in one room.', 'The answer, and what it costs to say.'],
  },
  action: {
    interiors: ['CONTROL ROOM', 'PARKING STRUCTURE', 'SERVER FARM', 'CARGO HOLD', 'SAFE HOUSE', 'HOTEL CORRIDOR', 'SUBWAY CAR', 'HANGAR', 'PENTHOUSE', 'ENGINE ROOM'],
    exteriors: ['HIGHWAY', 'ROOFTOP', 'DOCKS', 'DAM', 'MARKET', 'AIRSTRIP', 'BRIDGE', 'CONSTRUCTION SITE', 'FREIGHT YARD'],
    interiorShare: 0.45, nightShare: 0.4,
    needs: [['stunts', 0.55], ['vehicles', 0.4], ['weapons', 0.5], ['vfx', 0.35], ['practical_effects', 0.3], ['night_exterior', 0.2], ['water', 0.1]],
    kinds: [['action', 4], ['set_piece', 3], ['dialogue', 3], ['transition', 1], ['reveal', 1]],
    purposes: ['The extraction, which is not clean.', 'A phone call from someone who should not have the number.', 'The chase, downhill.', 'What the handler did not say.', 'The exchange on the bridge.', 'Two minutes to get out.', 'The safe house is not safe.', 'The one they were sent to kill.', 'The bridge, and what is under it.', 'The last door.'],
  },
  institution: {
    interiors: ['WARD', 'OPERATING THEATRE', 'CHAMBERS', 'COURTROOM', 'PARTNERS\' OFFICE', 'ON-CALL ROOM', 'NURSES\' STATION', 'CONFERENCE ROOM', 'A&E BAY', 'RECORDS ROOM', 'CANTEEN'],
    exteriors: ['AMBULANCE BAY', 'COURTHOUSE STEPS', 'HOSPITAL CAR PARK', 'STREET OUTSIDE CHAMBERS', 'ROOFTOP'],
    interiorShare: 0.8, nightShare: 0.35,
    needs: [['crowd', 0.1], ['practical_effects', 0.1], ['vehicles', 0.08]],
    kinds: [['dialogue', 7], ['reveal', 2], ['set_piece', 1], ['intimate', 1], ['transition', 1]],
    purposes: ['The case nobody wants.', 'A diagnosis, and how to say it.', 'The partner who will not sign.', 'Twelve hours in, and a mistake.', 'The witness changes their story.', 'The consultant is wrong, and junior.', 'What the chart does not show.', 'The verdict, read badly.', 'A patient who knows more than the doctor.', 'Handover.'],
  },
};

// ---------------------------------------------------------------------------
// Who is in it
// ---------------------------------------------------------------------------

/** The parts a picture of this size carries, in order of billing. */
function archetypesFor(register: Register, format: string, rng: Rng): CharacterArchetype[] {
  const isSeries = format === 'series' || format === 'limited_series';
  const isShort = format === 'short';
  if (isShort) return ['protagonist', 'antagonist', 'confidant'];
  const out: CharacterArchetype[] = ['protagonist'];
  if (isSeries || rng.chance(0.45)) out.push('deuteragonist');
  if (register !== 'doc') out.push('antagonist');
  if (register === 'romance' || rng.chance(register === 'comedy' || register === 'drama' ? 0.6 : 0.35)) out.push('love_interest');
  if (rng.chance(register === 'fantasy' || register === 'sport' || register === 'action' ? 0.7 : 0.4)) out.push('mentor');
  if (rng.chance(0.55)) out.push('foil');
  if (rng.chance(0.7)) out.push('confidant');
  if (register === 'comedy' || rng.chance(0.4)) out.push('comic_relief');
  const ensemble = isSeries ? rng.int(3, 5) : rng.int(2, 4);
  for (let i = 0; i < ensemble; i++) out.push('ensemble');
  const dayPlayers = isSeries ? rng.int(3, 6) : rng.int(3, 8);
  for (let i = 0; i < dayPlayers; i++) out.push('day_player');
  return out;
}

const ARCHETYPE_LABEL: Readonly<Record<CharacterArchetype, string>> = {
  protagonist: 'Protagonist', deuteragonist: 'Second Lead', antagonist: 'Antagonist',
  love_interest: 'Love Interest', mentor: 'Mentor', foil: 'Foil', confidant: 'Confidant',
  comic_relief: 'Comic Relief', ensemble: 'Ensemble', day_player: 'Day Player',
};

export function archetypeLabel(archetype: CharacterArchetype): string {
  return ARCHETYPE_LABEL[archetype];
}

/** How much of the script each archetype is in, and how old they tend to be. */
const ARCHETYPE_SHAPE: Readonly<Record<CharacterArchetype, { presence: number; lines: number; age: [number, number] }>> = {
  protagonist: { presence: 0.72, lines: 30, age: [24, 48] },
  deuteragonist: { presence: 0.5, lines: 18, age: [22, 50] },
  antagonist: { presence: 0.3, lines: 12, age: [32, 62] },
  love_interest: { presence: 0.35, lines: 12, age: [22, 45] },
  mentor: { presence: 0.16, lines: 7, age: [48, 74] },
  foil: { presence: 0.25, lines: 8, age: [24, 52] },
  confidant: { presence: 0.22, lines: 7, age: [22, 50] },
  comic_relief: { presence: 0.2, lines: 6, age: [22, 55] },
  ensemble: { presence: 0.12, lines: 3, age: [18, 65] },
  day_player: { presence: 0.03, lines: 1, age: [18, 75] },
};

/** A line on who the character is, by archetype and register. Written, not templated. */
const DESCRIPTIONS: Readonly<Record<CharacterArchetype, readonly string[]>> = {
  protagonist: ['The one the story happens to, and the one who decides what to do about it.', 'Carries every act. On the page in nearly every scene.', 'The person with the most to lose, which is why it is their film.', 'Competent, tired, and about to be tested past what competence covers.'],
  deuteragonist: ['The other half of the argument, with a story of their own that crosses the lead\'s.', 'Second on the call sheet and first in the second act.', 'The partner, the sibling or the rival — whichever the scene needs.'],
  antagonist: ['Wants the opposite thing for a reason the audience can follow.', 'Not a straw one. Wins for most of the picture.', 'Reasonable in every scene but the last.', 'The pressure the whole story is under.'],
  love_interest: ['Sees the lead clearly, which is the problem and the point.', 'Has a life the lead keeps interrupting.', 'The reason the ending costs something.'],
  mentor: ['Has done this before and paid for it.', 'Says the thing the lead is not ready to hear, once.', 'Gone by the third act, one way or another.'],
  foil: ['Makes the same choice the other way, so the audience can see the difference.', 'Everything the lead is not, in the same job.', 'Right about the small things and wrong about the large one.'],
  confidant: ['The one the lead tells the truth to.', 'Two scenes of listening and one of not.', 'Knows before anyone else does.'],
  comic_relief: ['Lets the air out of a scene that needs it.', 'Funny on purpose, and occasionally right.', 'Steals every scene they are given and is given exactly enough.'],
  ensemble: ['Part of the world the lead moves through.', 'A face the audience learns and then trusts.', 'Recurring, specific, and never explained.'],
  day_player: ['One scene and two lines that have to be exactly right.', 'A day on set, a name in the credits.', 'The clerk, the driver, the neighbour — whoever the scene requires.'],
};

// ---------------------------------------------------------------------------
// Generating the document
// ---------------------------------------------------------------------------

export interface ScriptBreakdown {
  scenes: Scene[];
  characters: ScriptCharacter[];
}

/**
 * The script as a breakdown reads it.
 *
 * Built from the page count, the genre family and the format, deterministically
 * from the draft's own seeded stream. Scenes fall into three acts, the set
 * pieces cluster where a genre puts them, the protagonist is in most of it, the
 * antagonist in the third of it that matters, and the day players in one scene
 * each.
 */
export function breakDownScript(rng: Rng, options: { genres: readonly string[]; format: string; pages: number; taken?: (name: string) => boolean }): ScriptBreakdown {
  const register = registerFor(options.genres);
  const bank = SETTINGS[register];
  const pages = Math.max(4, options.pages);

  // Characters first, so scenes can be populated.
  const usedNames = new Set<string>();
  const taken = (name: string) => usedNames.has(name) || (options.taken?.(name) ?? false);
  const archetypes = archetypesFor(register, options.format, rng);
  const characters: ScriptCharacter[] = archetypes.map((archetype) => {
    const name = generateCharacterName(rng, taken);
    usedNames.add(name);
    const shape = ARCHETYPE_SHAPE[archetype];
    const spread = rng.int(0, 6);
    const low = clamp(rng.int(shape.age[0], shape.age[1] - 6), 6, 80);
    return {
      name, archetype,
      description: rng.pick(DESCRIPTIONS[archetype]),
      ageRange: [low, Math.min(90, low + 6 + spread)],
      sceneCount: 0,
      lineShare: shape.lines,
    };
  });

  // Scene count from the genre's own rhythm: action cuts fast, drama holds.
  const averageLength = register === 'action' || register === 'war' ? 1.15
    : register === 'comedy' || register === 'romance' || register === 'family' ? 1.4
    : register === 'doc' ? 1.8 : 1.6;
  const sceneCount = Math.max(3, Math.round(pages / averageLength));

  // Page lengths that vary the way real ones do: a long dialogue scene, a
  // half-page transition, a set piece that runs four pages.
  const weights: number[] = [];
  for (let i = 0; i < sceneCount; i++) weights.push(Math.max(0.1, rng.normal(1, 0.55)));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const scenes: Scene[] = [];
  let numbered = 0;
  for (let i = 0; i < sceneCount; i++) {
    const position = i / Math.max(1, sceneCount - 1);
    const act = position < 0.25 ? 1 : position < 0.78 ? 2 : 3;

    // The kind of scene: the genre's mix, tilted toward set pieces late.
    const tilt = act === 3 ? 1.6 : act === 2 && position > 0.6 ? 1.2 : 1;
    const kind = weightedKind(bank.kinds, rng, tilt, position);

    const interior = rng.chance(kind === 'set_piece' || kind === 'action' ? bank.interiorShare * 0.7 : bank.interiorShare);
    const night = rng.chance(act === 3 ? bank.nightShare * 1.25 : bank.nightShare);
    const timeOfDay: Scene['timeOfDay'] = night ? 'night' : rng.chance(0.08) ? (rng.chance(0.5) ? 'dawn' : 'dusk') : 'day';
    const pool = interior ? [...bank.interiors, ...SHARED_INTERIORS] : [...bank.exteriors, ...SHARED_EXTERIORS];
    const setting = pool[rng.int(0, pool.length - 1)] ?? 'ROOM';

    const scenePages = Number(Math.max(0.1, (weights[i]! / totalWeight) * pages).toFixed(1));

    // Who is in it.
    const present: string[] = [];
    for (const character of characters) {
      const shape = ARCHETYPE_SHAPE[character.archetype];
      let chance = shape.presence;
      if (character.archetype === 'antagonist' && act === 3) chance *= 1.8;
      if (character.archetype === 'mentor' && act === 3) chance *= 0.4;
      if (character.archetype === 'day_player') chance = 0;
      if (kind === 'crowd' || kind === 'set_piece') chance *= 1.2;
      if (rng.chance(clamp(chance, 0, 0.95))) present.push(character.name);
    }
    if (present.length === 0) present.push(characters[0]!.name);

    const needs: SceneNeed[] = [];
    for (const [need, chance] of bank.needs) {
      const boosted = (kind === 'set_piece' || kind === 'action') && (need === 'stunts' || need === 'vfx' || need === 'vehicles' || need === 'practical_effects')
        ? chance * 2 : chance;
      if (rng.chance(clamp(boosted, 0, 0.95))) needs.push(need);
    }
    if (!interior && night && !needs.includes('night_exterior')) needs.push('night_exterior');
    if (kind === 'crowd' && !needs.includes('crowd')) needs.push('crowd');
    if (kind === 'intimate' && rng.chance(0.4) && !needs.includes('intimacy')) needs.push('intimacy');

    const complexity = clamp(Math.round(
      (kind === 'set_piece' ? 4 : kind === 'action' || kind === 'crowd' ? 3.2 : kind === 'montage' ? 2.4 : 1.6)
      + needs.length * 0.5 + (night && !interior ? 0.6 : 0) + (present.length > 4 ? 0.5 : 0) + rng.normal(0, 0.4),
    ), 1, 5);

    numbered++;
    scenes.push({
      number: String(numbered), interior, timeOfDay, setting, pages: scenePages, kind,
      characters: present, needs,
      purpose: bank.purposes[rng.int(0, bank.purposes.length - 1)] ?? 'The scene.',
      complexity,
    });
  }

  // Day players go into one scene each, and everybody's count is filled in.
  for (const character of characters) {
    if (character.archetype !== 'day_player') continue;
    const scene = scenes[rng.int(0, scenes.length - 1)]!;
    if (!scene.characters.includes(character.name)) scene.characters.push(character.name);
  }
  for (const character of characters) {
    character.sceneCount = scenes.filter((scene) => scene.characters.includes(character.name)).length;
  }
  // Nobody with no scenes at all: a character who is not in the script is not
  // a character. Put them in the scene with the fewest people.
  for (const character of characters) {
    if (character.sceneCount > 0) continue;
    const thinnest = [...scenes].sort((a, b) => a.characters.length - b.characters.length)[0]!;
    thinnest.characters.push(character.name);
    character.sceneCount = 1;
  }

  // Line share is renormalised to the people who are actually in it.
  const totalLines = characters.reduce((sum, c) => sum + c.lineShare * Math.max(1, c.sceneCount), 0) || 1;
  for (const character of characters) {
    character.lineShare = Math.round((character.lineShare * Math.max(1, character.sceneCount) / totalLines) * 100);
  }

  return { scenes, characters };
}

function weightedKind(kinds: readonly [SceneKind, number][], rng: Rng, tilt: number, position: number): SceneKind {
  const weighted = kinds.map(([kind, weight]) => {
    let w = weight;
    if ((kind === 'set_piece' || kind === 'action') && tilt > 1) w *= tilt;
    if (kind === 'reveal' && position > 0.68 && position < 0.82) w *= 2.2;
    if (kind === 'transition' && position > 0.95) w *= 0.2;
    return [kind, w] as const;
  });
  let roll = rng.float(0, weighted.reduce((sum, [, w]) => sum + w, 0));
  for (const [kind, w] of weighted) {
    roll -= w;
    if (roll <= 0) return kind;
  }
  return weighted[weighted.length - 1]![0];
}

// ---------------------------------------------------------------------------
// Scoring the craft
// ---------------------------------------------------------------------------

/** What each craft dimension is made of, in the writer's own skills. */
const CRAFT_FROM_SKILLS: Readonly<Record<CraftDimension, readonly [string, number][]>> = {
  structure: [['story_structure', 1]],
  dialogue: [['dialogue', 1]],
  character: [['character_writing', 1]],
  premise: [['story_structure', 0.4], ['character_writing', 0.3], ['world_building', 0.3]],
  pacing: [['story_structure', 0.6], ['page_speed', 0.4]],
  theme: [['character_writing', 0.5], ['story_structure', 0.5]],
  tension: [['story_structure', 0.7], ['dialogue', 0.3]],
  humour: [['dialogue', 0.7], ['character_writing', 0.3]],
  emotion: [['character_writing', 0.7], ['dialogue', 0.3]],
  spectacle: [['world_building', 0.6], ['story_structure', 0.4]],
  world: [['world_building', 1]],
  authenticity: [['adaptation', 0.5], ['character_writing', 0.5]],
  originality: [['rewriting', 0.3], ['world_building', 0.3], ['story_structure', 0.4]],
  ending: [['story_structure', 0.6], ['character_writing', 0.4]],
};

export interface CraftScore {
  craft: Record<CraftDimension, number>;
  quality: number;
  /** The three the genre weights most, and how the draft does on them. */
  strengths: CraftDimension[];
  weaknesses: CraftDimension[];
}

/**
 * The fourteen dimensions of a draft, and the one number they weigh up to.
 *
 * Each dimension comes from the writers' own skills, with more time on the
 * page pulling every number up, and a rewrite improving on the previous draft
 * rather than starting over. The quality is the genre's own weighting of them
 * — a comedy is mostly its humour and dialogue, a thriller mostly its tension
 * and structure — so the same draft is a different number as a different film.
 */
export function scoreCraft(
  rng: Rng,
  options: {
    genres: readonly string[];
    skillOf: (key: string) => number;
    days: number;
    previous?: Record<string, number>;
    rewriteSkill: number;
  },
): CraftScore {
  const time = clamp(0.7 + Math.log10(Math.max(3, options.days)) * 0.24, 0.7, 1.16);
  const craft = {} as Record<CraftDimension, number>;
  for (const dimension of CRAFT_DIMENSIONS) {
    const parts = CRAFT_FROM_SKILLS[dimension];
    const base = parts.reduce((sum, [skill, weight]) => sum + options.skillOf(skill) * weight, 0);
    const fresh = clamp(base * time + rng.normal(0, 7), 0, 100);
    const previous = options.previous?.[dimension];
    craft[dimension] = previous === undefined
      ? Math.round(fresh)
      : Math.round(clamp(previous + (fresh - previous) * clamp(0.25 + options.rewriteSkill / 220, 0.15, 0.7) + rng.normal(1.5, 3), 0, 100));
  }

  const weights = craftWeights(options.genres);
  const quality = Math.round(clamp(CRAFT_DIMENSIONS.reduce((sum, d) => sum + craft[d] * weights[d], 0), 0, 100));

  // The dimensions the genre cares about most, ranked by how the draft does.
  const important = [...CRAFT_DIMENSIONS].sort((a, b) => weights[b] - weights[a]).slice(0, 6);
  const ranked = [...important].sort((a, b) => craft[b] - craft[a]);
  return {
    craft, quality,
    strengths: ranked.slice(0, 3),
    weaknesses: ranked.slice(-3).reverse(),
  };
}

/** The craft record an old draft implies, so nothing written before scenes existed is lost. */
export function craftFromLegacy(structure: number, dialogue: number, characters: number, quality: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const dimension of CRAFT_DIMENSIONS) {
    out[dimension] = dimension === 'structure' ? structure
      : dimension === 'dialogue' ? dialogue
      : dimension === 'character' ? characters
      : quality;
  }
  return out;
}

/** How a draft's page count is chosen for a format. */
export function pagesFor(format: string, rng: Rng): number {
  switch (format) {
    case 'short': return rng.int(8, 28);
    case 'series': case 'limited_series': return rng.int(48, 62);
    case 'tv_movie': return rng.int(88, 100);
    case 'documentary': return rng.int(40, 70);
    default: return rng.int(96, 124);
  }
}

/** What a breakdown needs from a script, summed. */
export function breakdownSummary(scenes: readonly Scene[]): {
  scenes: number; pages: number; interiors: number; exteriors: number; nights: number;
  needs: Record<string, number>; setPieces: number; complexity: number;
} {
  const needs: Record<string, number> = {};
  let complexity = 0;
  for (const scene of scenes) {
    for (const need of scene.needs) needs[need] = (needs[need] ?? 0) + 1;
    complexity += scene.complexity;
  }
  return {
    scenes: scenes.length,
    pages: Number(scenes.reduce((sum, s) => sum + s.pages, 0).toFixed(1)),
    interiors: scenes.filter((s) => s.interior).length,
    exteriors: scenes.filter((s) => !s.interior).length,
    nights: scenes.filter((s) => s.timeOfDay === 'night').length,
    needs,
    setPieces: scenes.filter((s) => s.kind === 'set_piece').length,
    complexity: scenes.length > 0 ? Number((complexity / scenes.length).toFixed(2)) : 0,
  };
}

export const SCENE_KIND_LABEL: Readonly<Record<SceneKind, string>> = {
  dialogue: 'Dialogue', action: 'Action', set_piece: 'Set Piece', montage: 'Montage',
  intimate: 'Intimate', crowd: 'Crowd', reveal: 'Reveal', transition: 'Transition',
};

export const SCENE_NEED_LABEL: Readonly<Record<SceneNeed, string>> = {
  stunts: 'Stunts', vfx: 'Visual Effects', animals: 'Animals', vehicles: 'Vehicles', crowd: 'Crowd',
  water: 'Water Work', children: 'Children', weapons: 'Weapons', practical_effects: 'Practical Effects',
  intimacy: 'Intimacy Coordinator', night_exterior: 'Night Exterior', period_dress: 'Period Dress',
  creature: 'Creature',
};
