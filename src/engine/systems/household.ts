/**
 * SLATE — the house you actually live in.
 *
 * The contract asked for three things beyond the cooking: appliances that are
 * the ones you bought, a broken washing machine that is a repair and a cost
 * and a week of launderettes, and every owned object having a place in a
 * room, a condition, and something you can do with it.
 *
 * So things wear. A machine used every day wears faster than a thing in a
 * cupboard, and below a point it stops working — not politely, not with a
 * warning, and not until somebody pays to fix it. While the oven is broken
 * you cannot roast anything; while the washing machine is broken the washing
 * goes out, costs money and takes an afternoon.
 *
 * Everything a home has is somewhere in it. A kettle is in the kitchen, a
 * sofa is in the living room, and a thing in a room is a thing you can walk
 * up to and use.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, OwnedAsset, Room } from '../domain/model';
import { CATALOG } from '../content/catalog';
import { clamp } from '../core/rng';
import { addDays, MS_MINUTE } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { recomputeRoomQuality } from './property';

/** Below this a machine has stopped rather than got tired. */
export const BREAKS_BELOW = 22;

/** What a month of ordinary use costs each kind of thing, in condition. */
const MONTHLY_WEAR: Readonly<Record<string, number>> = {
  appliance: 1.6,
  electronics: 1.3,
  // Camera kit wears harder than a television and softer than a washing
  // machine: it is carried about, it is used in the rain, and the moving parts
  // are the expensive ones.
  kit: 1.4,
  equipment: 1.2,
  household: 1.1,
  furniture: 0.9,
  home: 0.7,
  books: 0.12,
  art: 0.04,
};

/**
 * Kinds of thing that stop rather than just get shabby. A dishwasher breaks.
 * A rug wears out, and you keep walking on it.
 */
// Camera kit is in here because camera kit stops. A shutter dies, a lens
// jams, a battery will not hold a charge, and none of that is shabbiness.
const BREAKS: ReadonlySet<string> = new Set(['appliance', 'electronics', 'equipment', 'household', 'kit']);

/** What a repair costs, as a share of what the thing is worth now. */
const REPAIR_SHARE = 0.18;
/** Nobody comes out for less than this. */
const CALL_OUT = 95_00;

/** How long a repair takes, by what broke. */
const REPAIR_DAYS: Readonly<Record<string, number>> = {
  appliance: 6, electronics: 8, equipment: 7, furniture: 10, home: 5, household: 3,
};

/** A load at the launderette when the machine at home is out. */
export const LAUNDERETTE_LOAD = 9_00;

/** Everything the player owns that lives in the house. */
export function householdAssets(sim: Simulation, personId: Id): OwnedAsset[] {
  return Object.values(sim.universe.assets).filter((asset) => {
    if (asset.ownerId !== personId || asset.soldAt) return false;
    const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
    return item !== undefined && MONTHLY_WEAR[item.category] !== undefined;
  });
}

/**
 * A thing that stands in a room is also the record that holds that room up.
 * When it wears, the room it is in is worth a little less, which is what a
 * tired sofa does to a living room.
 */
function mirrorOntoRoom(sim: Simulation, asset: OwnedAsset): void {
  for (const furnishing of Object.values(sim.universe.furnishings)) {
    if (furnishing.assetId !== asset.id) continue;
    furnishing.condition = asset.condition;
    if (furnishing.roomId) recomputeRoomQuality(sim, furnishing.roomId);
    return;
  }
}

/** Whether a thing works right now. A broken machine is not a slow machine. */
export function works(asset: OwnedAsset): boolean {
  return asset.broken !== true;
}

/** Does the player have a washing machine that works? */
export function hasWorkingWasher(sim: Simulation, personId: Id): boolean {
  return householdAssets(sim, personId).some((asset) => {
    const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
    if (!item) return false;
    return /washing machine|\bwasher\b|washtower/i.test(item.name) && works(asset);
  });
}

/**
 * Does the player have something to dry the washing in?
 *
 * A washer alone gets clothes clean and wet. Without a dryer they go on an
 * airer and you have nothing to wear until tomorrow, which is the actual
 * reason people own the second machine. A stacked washer-dryer counts as both.
 */
export function hasWorkingDryer(sim: Simulation, personId: Id): boolean {
  return householdAssets(sim, personId).some((asset) => {
    const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
    if (!item) return false;
    return /\bdryer\b|washtower|washer.dryer/i.test(item.name) && works(asset);
  });
}

/** How long clean washing takes to dry when there is no machine to do it. */
export const AIR_DRY_HOURS = 14;
/** How long a dryer takes, which you do not have to sit through. */
export const TUMBLE_DRY_HOURS = 2;

/** The rooms of the home somebody lives in. */
function roomsOfHome(sim: Simulation, personId: Id): Room[] {
  const person = sim.universe.people[personId];
  if (!person?.residenceId) return [];
  const structureIds = new Set(
    Object.values(sim.universe.structures ?? {})
      .filter((st) => st.propertyId === person.residenceId)
      .map((st) => st.id),
  );
  return Object.values(sim.universe.rooms ?? {}).filter((room) => structureIds.has(room.structureId));
}

/**
 * Where a thing goes when the home has no room of the kind it was made for.
 * A flat has no laundry, so the washing machine goes in the kitchen, which is
 * where it goes in every real flat. This is the second choice, not a shrug.
 */
const INSTEAD: Readonly<Record<string, readonly string[]>> = {
  laundry: ['kitchen', 'garage', 'bathroom'],
  dining: ['kitchen', 'living'],
  den: ['living', 'office', 'bedroom'],
  office: ['living', 'bedroom', 'den'],
  foyer: ['living'],
  garage: ['outside'],
  outside: ['living'],
};

/**
 * The rooms a thing could go in, best first: the rooms it was made for, then
 * the rooms people really put it in, then anywhere with a floor.
 */
export function preferredRooms<T extends { kind: string }>(rooms: readonly T[], wanted: readonly string[]): T[] {
  if (wanted.length === 0) return [...rooms];
  const fits = rooms.filter((room) => wanted.includes(room.kind));
  if (fits.length > 0) return fits;
  const second = new Set(wanted.flatMap((kind) => INSTEAD[kind] ?? []));
  const nearly = rooms.filter((room) => second.has(room.kind));
  return nearly.length > 0 ? nearly : [...rooms];
}

/**
 * Where a kind of thing goes when the catalog does not say.
 *
 * Furniture carries the room its maker had in mind. Camera kit does not,
 * because no manufacturer thinks about which room of your house a lens lives
 * in — and yet it lives in one. It goes where people really keep it: the room
 * they work in, and failing that the bedroom, in a cupboard, in its case.
 */
const ROOMS_BY_CATEGORY: readonly { category: string; rooms: readonly string[] }[] = [
  { category: 'kit', rooms: ['office', 'den', 'bedroom'] },
  { category: 'equipment', rooms: ['office', 'den', 'garage'] },
];

function roomsWanted(category: string): readonly string[] {
  return ROOMS_BY_CATEGORY.find((one) => one.category === category)?.rooms ?? [];
}

/**
 * Puts a thing where it belongs. A kitchen appliance goes in the kitchen; if
 * the home has no room of the kind the maker had in mind, it goes where such a
 * thing really goes instead.
 */
export function placeInRoom(sim: Simulation, asset: OwnedAsset): Id | undefined {
  const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
  // Only things that live in a house go in a room of it. A coat lives in the
  // wardrobe and a car lives in the garage, and both are somebody else's job.
  if (!item || MONTHLY_WEAR[item.category] === undefined) return undefined;
  // Nothing hired ever becomes a thing on a shelf: it goes back on Monday.
  if (item.tags.includes('rental only')) return undefined;
  const rooms = roomsOfHome(sim, asset.ownerId);
  if (rooms.length === 0) return undefined;
  const wanted = item.roomKinds ?? roomsWanted(item.category);
  asset.roomId = preferredRooms(rooms, wanted)[0]?.id;
  return asset.roomId;
}

// ---------------------------------------------------------------------------
// What a thing is for
// ---------------------------------------------------------------------------

/**
 * The thing you do with a thing you own, in the words somebody would use for
 * doing it. Some things are used somewhere else in the game rather than off a
 * shelf: you cook with a pan in the kitchen and you wash with a machine in the
 * wardrobe, so those carry a `via` and point you there instead of pretending.
 *
 * Plenty of what a home holds has no verb at all. A sheet set, a vase, a rug:
 * you own them, they hold the room up, and that is the whole of it. Those
 * return nothing, which is the honest answer rather than an invented one.
 */
export interface ThingUse {
  /** Stable, so a button keeps working when the wording is improved. */
  id: string;
  label: string;
  minutes: number;
  morale: number;
  energy: number;
  /** Done through another part of the game, not from the shelf. */
  via?: 'kitchen' | 'laundry';
  /**
   * How much condition it puts back. Looking after a thing is the one use that
   * changes what the thing is, rather than what you are.
   */
  restores?: number;
}

const COOK_WITH_IT: ThingUse = { id: 'cook', label: 'Cook With It', minutes: 0, morale: 0, energy: 0, via: 'kitchen' };
const DO_THE_WASHING: ThingUse = { id: 'wash', label: 'Do The Washing', minutes: 0, morale: 0, energy: 0, via: 'laundry' };
const KEEP_FOOD_IN_IT: ThingUse = { id: 'store', label: 'Keep Food In It', minutes: 0, morale: 0, energy: 0, via: 'kitchen' };
const READ_IT: ThingUse = { id: 'read', label: 'Read It', minutes: 90, morale: 7, energy: -3 };
const LOOK_AT_IT: ThingUse = { id: 'look', label: 'Look At It', minutes: 10, morale: 4, energy: 0 };
const SIT_DOWN: ThingUse = { id: 'sit', label: 'Sit Down', minutes: 45, morale: 4, energy: 5 };
const TAKE_A_NAP: ThingUse = { id: 'nap', label: 'Take A Nap', minutes: 50, morale: 5, energy: 16 };

/**
 * What anybody who owns camera kit actually does with it between jobs.
 *
 * Not shooting: shooting is a day, and the shoot system owns it. This is the
 * hour at the kitchen table with a blower and a cloth that decides whether the
 * kit works on the day, and it is most of what owning kit is.
 */
const CHECK_IT_OVER: ThingUse = { id: 'service', label: 'Check It Over', minutes: 45, morale: 3, energy: -4, restores: 9 };
const CLEAN_THE_GLASS: ThingUse = { id: 'clean_glass', label: 'Clean The Glass', minutes: 25, morale: 2, energy: -2, restores: 5 };
const CHARGE_THE_BATTERIES: ThingUse = { id: 'charge', label: 'Put The Batteries On', minutes: 10, morale: 1, energy: 0, restores: 3 };

/** Things you wear or eat, which other systems already own. */
const NOT_A_THING_YOU_USE: ReadonlySet<string> = new Set([
  'clothing', 'footwear', 'accessory', 'watch', 'jewelry', 'makeup', 'groceries', 'haberdashery',
]);

/** Matched to say plainly that a thing has no verb, before a looser rule invents one. */
const NOTHING: readonly ThingUse[] = [];

interface UseRule { on: RegExp; uses: readonly ThingUse[]; only?: readonly string[] }

/**
 * Ordered, and the order carries meaning: a Steam Deck OLED is a console
 * before it is a screen, and a fabric shaver is laundry before it is a razor.
 *
 * Where a thing honestly has two things you do with it, both are here and the
 * first is the obvious one. A sofa is sat on far more often than it is slept
 * on, but people sleep on sofas.
 */
const USE_RULES: readonly UseRule[] = [
  // Lighting is lit. There is no doing it, and a desk lamp is not a desk.
  { on: /\blamp\b|\bpendant\b|sconce|ceiling light|light fitting/i, uses: NOTHING },

  // The washing, and the machines that do it.
  { on: /washing machine|\bwasher\b|washtower|heat pump dryer|tumble dryer|steam system|laundry detergent|fabric conditioner|persil|tide pods|downy|the laundress|fabric shaver|cedar block/i, uses: [DO_THE_WASHING] },
  { on: /dishwasher|dishdrawer/i, uses: [{ id: 'dishes', label: 'Load The Dishwasher', minutes: 10, morale: 1, energy: -2 }] },

  // The barbecue, before a kettle grill is read as a kettle.
  { on: /big green egg|traeger|kamado|pellet grill|gas grill|charcoal grill|\bweber\b/i, uses: [COOK_WITH_IT] },

  // The wine, before anything reads a wine cabinet as a fridge.
  { on: /wine storage|wine cabinet|eurocave|vintec/i, uses: [{ id: 'pour', label: 'Pour A Glass', minutes: 25, morale: 7, energy: -1 }] },
  { on: /decanter|wine glass|riedel|zalto|baccarat|waterford|nude glass|stem zero|tumbler|glassware/i, uses: [{ id: 'pour', label: 'Pour A Glass', minutes: 25, morale: 6, energy: -1 }], only: ['home'] },

  // Coffee and tea.
  { on: /tetsubin|tea canister|teapot/i, uses: [{ id: 'tea', label: 'Make A Pot Of Tea', minutes: 10, morale: 4, energy: 3 }] },
  { on: /marzocco|espresso|barista express|dual boiler|moccamaster|grinder|chemex|aeropress|moka express|french press|\bv60\b|kalita|dripper|coffee machine|coffee maker|nespresso|creatista|maestosa/i, uses: [{ id: 'coffee', label: 'Make Coffee', minutes: 12, morale: 5, energy: 7 }] },
  { on: /\bkettle\b|quooker|boiling water tap/i, uses: [{ id: 'brew', label: 'Put The Kettle On', minutes: 8, morale: 3, energy: 2 }] },

  // Cold storage is not cooking, whatever else it shares a room with.
  { on: /refrigerator|fridge|freezer|ice maker|preserving jar|storage container|pop container|food wrap|silicone bag|canister/i, uses: [KEEP_FOOD_IN_IT] },

  // The kitchen, which is cooked in rather than clicked on.
  { on: /oven|\bhob\b|\brange\b|cooker|hood\b|microwave|blender|mixer|processor|thermomix|instant pot|creami|toaster|air fryer|sous vide|\bwok\b|skillet|frying pan|saut[ée] pan|saucepan|saucier|cookware|cocotte|stock pot|grill pan|chef knife|gyuto|santoku|\bknife\b|knives|cutting board|chopping block|mandoline|peeler|spatula|mixing bowl|kitchen shears|kitchen scale|thermometer|grater|pepper mill|sandwich cage|\bpan\b|\bpot\b|utensil set|bowl set|sodastream|ice maker/i, uses: [COOK_WITH_IT] },

  // Keeping the place.
  { on: /vacuum|roomba/i, uses: [{ id: 'vacuum', label: 'Run The Vacuum', minutes: 40, morale: 3, energy: -7 }] },
  { on: /\bbroom\b|\bmop\b|dishcloth|cloths|sponge|scrub daddy|cleaner|cleanser|disinfectant|cleaning paste|dish soap|all purpose/i, uses: [{ id: 'clean', label: 'Clean The Place', minutes: 40, morale: 3, energy: -7 }] },
  { on: /\bdrill\b|impact driver|screwdriver|pliers|wrench|tape measure|laser measure|sander|block plane|bench plane|leatherman/i, uses: [{ id: 'fix', label: 'Fix Something', minutes: 60, morale: 5, energy: -8 }] },
  { on: /trowel|secateurs|topiary shears|watering can/i, uses: [{ id: 'garden', label: 'Do The Gardening', minutes: 60, morale: 7, energy: -9 }] },

  // Yourself.
  { on: /hair dryer|supersonic|airwrap|multi-styler/i, uses: [{ id: 'hair', label: 'Do Your Hair', minutes: 20, morale: 5, energy: -2 }] },
  { on: /\bshaver\b|\brazor\b/i, uses: [{ id: 'shave', label: 'Shave', minutes: 10, morale: 3, energy: -1 }] },
  { on: /theragun|hypervolt|wave roller|venom \d|massage|electrostimulator|marc pro|normatec/i, uses: [{ id: 'recover', label: 'Work The Knots Out', minutes: 20, morale: 5, energy: 4 }] },
  { on: /sauna/i, uses: [{ id: 'sauna', label: 'Sit In The Sauna', minutes: 30, morale: 8, energy: 1 }] },
  { on: /cold plunge|plunge tub/i, uses: [{ id: 'plunge', label: 'Take A Cold Plunge', minutes: 10, morale: 7, energy: 6 }] },
  { on: /bathtub|soaking tub|freestanding bath/i, uses: [{ id: 'bath', label: 'Run A Bath', minutes: 45, morale: 8, energy: 3 }] },
  { on: /body scan scale|bathroom scale/i, uses: [{ id: 'weigh', label: 'Weigh Yourself', minutes: 3, morale: 1, energy: 0 }] },

  // Screens and the things plugged into them.
  { on: /steam deck|playstation|\bxbox\b|nintendo switch|game console|portal remote|\bvr2\b/i, uses: [{ id: 'game', label: 'Play Something', minutes: 75, morale: 7, energy: -3 }] },
  { on: /\boled\b|\bqled\b|bravia|the frame|television|\btv\b|projector/i, uses: [
    { id: 'watch', label: 'Watch Something', minutes: 90, morale: 6, energy: -2 },
    { id: 'doze', label: 'Doze Off In Front Of It', minutes: 40, morale: 3, energy: 9 },
  ] },
  { on: /macbook|laptop|zbook|thinkpad|surface laptop|zephyrus|xps \d|mac studio|mac mini|imac|desktop|workstation/i, uses: [{ id: 'work', label: 'Get Some Work Done', minutes: 90, morale: -1, energy: -9 }] },
  { on: /kindle|kobo|paperwhite/i, uses: [READ_IT] },
  { on: /vision pro/i, uses: [{ id: 'headset', label: 'Put The Headset On', minutes: 45, morale: 6, energy: -5 }] },
  { on: /cintiq|wacom/i, uses: [{ id: 'draw', label: 'Draw Something', minutes: 60, morale: 7, energy: -5 }] },
  { on: /mavic|inspire 3|mini 4 pro|\bdrone\b/i, uses: [{ id: 'fly', label: 'Fly It', minutes: 40, morale: 8, energy: -4 }] },
  { on: /camera|alpha 7|alpha 1|\beos r|nikon z\d|fujifilm|leica|lumix|gopro|\bosmo\b|\bronin\b|venice 2|\bursa\b|hero 13|tripod|\bprime\b|summilux|\d+mm f/i, uses: [{ id: 'shoot', label: 'Take Some Pictures', minutes: 60, morale: 7, energy: -4 }], only: ['electronics'] },
  { on: /sm7b|sm58|\bmv7|\bu 87\b|kh 120|mkh \d|ntg\d|\bnt1\b|shotgun|zoom h6|apollo twin|scarlett|atem mini|ninja ultra|microphone/i, uses: [{ id: 'record', label: 'Record Something', minutes: 75, morale: 6, energy: -6 }] },
  { on: /airpods|headphones|wh-1000|quietcomfort|ath-m50x|hd 660/i, uses: [{ id: 'listen', label: 'Listen To Something', minutes: 45, morale: 7, energy: 1 }] },
  { on: /turntable|record player|\bcd player\b/i, uses: [{ id: 'record_on', label: 'Put A Record On', minutes: 40, morale: 7, energy: 1 }] },
  { on: /sonos|\bkef\b|bowers & wilkins|genelec|beosound|beoplay|speaker|hi-?fi|stereo|soundbar/i, uses: [{ id: 'music', label: 'Put Some Music On', minutes: 40, morale: 7, energy: 1 }] },

  // Making a noise yourself.
  { on: /piano|guitar|violin|cello|drum kit|synthesi[sz]er/i, uses: [{ id: 'play', label: 'Play It', minutes: 60, morale: 9, energy: -4 }] },

  // Training.
  { on: /peloton|treadmill|tread\+|\brower\b|rowerg|bikeerg|skierg|airbike|airdyne|stepmill|indoor bike|kickr|smart trainer|home gym|kinesis|elliptical/i, uses: [{ id: 'cardio', label: 'Train On It', minutes: 45, morale: 6, energy: -14 }] },
  { on: /power bar|weightlifting bar|pendlay bar|steel plates|dumbbell|kettlebell|power rack|lite rack|workout bench|bench pro|ab-5200|suspension trainer|gymnastic rings|jump rope|bala bangles/i, uses: [{ id: 'lift', label: 'Lift Some Weights', minutes: 50, morale: 6, energy: -15 }] },
  { on: /\byoga\b|foam roller|balance trainer|\bbosu\b|resistance band|reversible mat/i, uses: [{ id: 'stretch', label: 'Stretch It Out', minutes: 30, morale: 5, energy: -4 }] },
  { on: /madone|domane|tarmac|roubaix|cerv[ée]lo|pinarello|colnago|synapse|brompton|radcity|hightower|\bbike\b|bicycle/i, uses: [{ id: 'ride', label: 'Go For A Ride', minutes: 75, morale: 8, energy: -14 }] },
  { on: /racquet|racket/i, uses: [{ id: 'tennis', label: 'Hit Some Balls', minutes: 60, morale: 7, energy: -12 }] },
  { on: /qi10 driver|iron set|putter|\bgolf\b/i, uses: [{ id: 'golf', label: 'Play A Round', minutes: 240, morale: 9, energy: -14 }] },
  { on: /surfboard|paddleboard|wetsuit|freestyler paddles|vanquisher|smart swim/i, uses: [{ id: 'swim', label: 'Get In The Water', minutes: 90, morale: 9, energy: -12 }] },

  // The room itself.
  { on: /office chair|aeron|embody chair|sayl chair|task chair/i, uses: [{ id: 'work', label: 'Get Some Work Done', minutes: 90, morale: -1, energy: -8 }] },
  { on: /\bdesk\b/i, uses: [{ id: 'work', label: 'Get Some Work Done', minutes: 90, morale: -1, energy: -9 }] },
  { on: /sofa|sectional|settee|couch|chaise|daybed|seating system|recliner|lounger/i, uses: [SIT_DOWN, TAKE_A_NAP] },
  { on: /lounge chair|easy chair|armchair|wing chair|egg chair|swan chair|womb chair/i, uses: [SIT_DOWN, TAKE_A_NAP] },
  { on: /chair|\bstool\b|bench\b|ottoman/i, uses: [{ id: 'sit', label: 'Sit Down', minutes: 30, morale: 3, energy: 4 }] },
  { on: /\bbed\b|bed frame|mattress|\bdivan\b/i, uses: [TAKE_A_NAP, { id: 'lie', label: 'Lie Down And Read', minutes: 60, morale: 6, energy: 6 }], only: ['furniture'] },
  { on: /candle/i, uses: [{ id: 'light', label: 'Light It', minutes: 5, morale: 4, energy: 1 }] },
];

/** Everything you could do with a thing, the obvious one first. */
export function usesFor(name: string, category: string): readonly ThingUse[] {
  if (NOT_A_THING_YOU_USE.has(category)) return NOTHING;
  if (category === 'books') return [READ_IT];
  if (category === 'art') return [LOOK_AT_IT];
  // Kit is looked after rather than used from a shelf. A lens is cleaned, a
  // body is checked over, and the batteries go on the night before.
  if (category === 'kit') {
    if (/lens|prime|zoom|glass|filter/i.test(name)) return [CLEAN_THE_GLASS, CHECK_IT_OVER];
    if (/battery|batteries|charger|\bv.?mount\b/i.test(name)) return [CHARGE_THE_BATTERIES];
    return [CHECK_IT_OVER, CLEAN_THE_GLASS];
  }
  for (const rule of USE_RULES) {
    if (rule.only && !rule.only.includes(category)) continue;
    if (rule.on.test(name)) return rule.uses;
  }
  return NOTHING;
}

/** The obvious thing to do with a thing, or nothing if it is only owned. */
export function whatItIsFor(name: string, category: string): ThingUse | undefined {
  return usesFor(name, category)[0];
}

export const USE_ELSEWHERE: Readonly<Record<NonNullable<ThingUse['via']>, string>> = {
  kitchen: 'Cooking is in Wellbeing.',
  laundry: 'The washing is in the Wardrobe.',
};

/**
 * Everything the house needs to be a house, applied to a save that may never
 * have had it. Idempotent: it arms the wear clock only if it is not already
 * running, and it moves nothing that already has a room.
 */
export function ensureHomeUpkeep(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    if (!person.isPlayer) continue;
    for (const asset of householdAssets(sim, person.id)) {
      if (asset.broken === undefined) asset.broken = false;
      if (asset.roomId === undefined) placeInRoom(sim, asset);
    }
  }
  if (sim.timeline.pending().some((i) => i.kind === 'home.wear')) return;
  sim.schedule({
    at: addDays(sim.now, 30, sim.homeZone), kind: 'home.wear',
    label: 'Wear And Tear', category: 'system', priority: 92,
  });
}

export function registerHousehold(sim: Simulation): void {
  // --- Wear, and the day a thing stops --------------------------------------

  sim.onSchedule('home.wear', () => {
    for (const person of Object.values(sim.universe.people)) {
      if (!person.isPlayer) continue;
      for (const asset of householdAssets(sim, person.id)) {
        if (asset.broken) continue;
        const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
        if (!item) continue;
        const base = MONTHLY_WEAR[item.category] ?? 1;
        // A thing that gets used wears; a thing in a cupboard mostly does not.
        const used = asset.lastUsedAt !== undefined && sim.now - asset.lastUsedAt < 45 * 86_400_000;
        // Better things last longer, which is most of what better means.
        const madeWell = clamp(item.quality / 100, 0.4, 1);
        const wear = (base * (used ? 1.4 : 0.7)) / madeWell;
        asset.condition = clamp(asset.condition - wear, 0, 100);
        mirrorOntoRoom(sim, asset);
        if (asset.condition < BREAKS_BELOW && BREAKS.has(item.category)) {
          asset.broken = true;
          asset.brokenAt = sim.now;
          sim.notify({
            title: `${asset.name} Has Stopped`,
            body: 'It needs a repair before it will work again.',
            category: 'household',
            refType: 'asset', refId: asset.id,
          });
          sim.emit('home.broke', { assetId: asset.id, name: asset.name });
        }
      }
    }
    sim.schedule({
      at: addDays(sim.now, 30, sim.homeZone), kind: 'home.wear',
      label: 'Wear And Tear', category: 'system', priority: 92,
    });
  });

  sim.onSchedule('home.repaired', (item) => {
    const asset = sim.universe.assets[item.payload.assetId as Id];
    if (!asset) return;
    asset.broken = false;
    asset.brokenAt = undefined;
    asset.repairDueAt = undefined;
    asset.condition = clamp(Math.max(asset.condition, 78), 0, 100);
    mirrorOntoRoom(sim, asset);
    sim.notify({
      title: `${asset.name} Is Working Again`,
      body: 'The repair is done.',
      category: 'household',
      refType: 'asset', refId: asset.id,
    });
    sim.emit('home.repaired', { assetId: asset.id });
  });

  // --- Getting it fixed -----------------------------------------------------

  sim.onCommand<{ assetId: Id; accountId?: Id }, { cost: Money; dueAt: number }>(
    'home.repair',
    (p, { sim: s }) => {
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.ownerId !== s.player.id) throw new CommandError('You don’t own that.');
      if (works(asset)) throw new CommandError(`${asset.name} is working.`);
      if (asset.repairDueAt !== undefined) throw new CommandError(`${asset.name} is already booked in.`);

      const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
      const cost = Math.max(CALL_OUT, Math.round(asset.currentValue * REPAIR_SHARE));
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`The repair is ${formatMoney(cost)} and you can’t cover it.`);
      }

      s.expense(accountId, cost, `Repair — ${asset.name}`, 'household', { refType: 'asset', refId: asset.id });
      const days = REPAIR_DAYS[item?.category ?? 'appliance'] ?? 6;
      const dueAt = addDays(s.now, days, s.homeZone);
      asset.repairDueAt = dueAt;
      s.schedule({
        at: dueAt, kind: 'home.repaired', payload: { assetId: asset.id },
        label: `${asset.name} Back`, category: 'household', priority: 60,
      });
      s.emit('home.repair_booked', { assetId: asset.id, cost, dueAt });
      return { cost, dueAt };
    },
  );

  // --- Using the things you own ---------------------------------------------

  sim.onCommand<{ assetId: Id; useId?: string; minutes?: number }, { label: string; minutes: number }>(
    'home.use',
    (p, { sim: s }) => {
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.ownerId !== s.player.id) throw new CommandError('You don’t own that.');
      const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
      const choices = item ? usesFor(item.name, item.category) : NOTHING;
      const use = p.useId ? choices.find((c) => c.id === p.useId) : choices[0];
      if (!use) throw new CommandError(`There’s nothing to do with ${asset.name} but own it.`);
      if (use.via) throw new CommandError(`${asset.name} isn’t used from here. ${USE_ELSEWHERE[use.via]}`);
      if (!works(asset)) throw new CommandError(`${asset.name} is broken. It needs a repair first.`);

      const minutes = clamp(p.minutes ?? use.minutes, 5, 240);
      const person = s.player;
      s.advanceTo(s.now + minutes * MS_MINUTE);
      const share = minutes / use.minutes;
      person.wellbeing.morale = clamp(person.wellbeing.morale + use.morale * share, 0, 100);
      person.wellbeing.energy = clamp(person.wellbeing.energy + use.energy * share, 0, 100);
      // Using a thing is what wears it out, a little at a time — unless the
      // use was looking after it, which is the one that puts condition back.
      asset.condition = use.restores === undefined
        ? clamp(asset.condition - 0.12 * share, 0, 100)
        : clamp(asset.condition + use.restores * Math.min(1, share), 0, 100);
      asset.lastUsedAt = s.now;
      s.emit('home.used', { assetId: asset.id, label: use.label, minutes });
      return { label: use.label, minutes };
    },
  );
}
