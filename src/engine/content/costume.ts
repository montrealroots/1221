/**
 * SLATE — how a costume gets made.
 *
 * Three ways a garment that does not exist yet ends up on a hanger with your
 * name on it: a costume house cuts it for you, a tailor alters something you
 * already own, or you make it yourself on your own machine.
 *
 * The vocabulary here is the workroom's, not a game's: a garment kind has a
 * yardage and a construction difficulty, a cloth has a hand and a price by
 * the yard, a finish is a real tailoring decision, and a fitting is a fitting.
 * Every figure is SLATE's own calibration. There is no feed for what a
 * costume house charges and a real one would not publish it.
 */

/** What is being made. Yardage and hours are for a single garment, cut to fit. */
export interface GarmentKind {
  id: string;
  name: string;
  /** The wardrobe peg it hangs on when it is finished. */
  slot: string;
  /** How much cloth it eats, in yards, at an average size. */
  yards: number;
  /** Bench hours for a competent maker, before any finish is added. */
  hours: number;
  /** How hard it is to get right, 1 easy to 5 unforgiving. */
  difficulty: number;
  /** Roughly how formal the finished thing reads. */
  formality: number;
  /** Fittings a house would want before it is finished. */
  fittings: number;
}

export const GARMENT_KINDS: readonly GarmentKind[] = [
  { id: 'tee', name: 'T-Shirt', slot: 'top', yards: 1.5, hours: 2, difficulty: 1, formality: 12, fittings: 0 },
  { id: 'shirt', name: 'Shirt', slot: 'top', yards: 2.5, hours: 7, difficulty: 3, formality: 62, fittings: 1 },
  { id: 'blouse', name: 'Blouse', slot: 'top', yards: 2.5, hours: 8, difficulty: 3, formality: 64, fittings: 1 },
  { id: 'waistcoat', name: 'Waistcoat', slot: 'top', yards: 1.75, hours: 10, difficulty: 3, formality: 74, fittings: 1 },
  { id: 'trousers', name: 'Trousers', slot: 'bottom', yards: 2.25, hours: 9, difficulty: 3, formality: 68, fittings: 2 },
  { id: 'skirt', name: 'Skirt', slot: 'bottom', yards: 2, hours: 6, difficulty: 2, formality: 60, fittings: 1 },
  { id: 'jeans', name: 'Jeans', slot: 'bottom', yards: 2.5, hours: 11, difficulty: 4, formality: 20, fittings: 2 },
  { id: 'day_dress', name: 'Day Dress', slot: 'outfit', yards: 3.5, hours: 12, difficulty: 3, formality: 56, fittings: 2 },
  { id: 'evening_gown', name: 'Evening Gown', slot: 'outfit', yards: 6.5, hours: 40, difficulty: 5, formality: 96, fittings: 3 },
  { id: 'cocktail_dress', name: 'Cocktail Dress', slot: 'outfit', yards: 3.5, hours: 20, difficulty: 4, formality: 82, fittings: 2 },
  { id: 'jumpsuit', name: 'Jumpsuit', slot: 'outfit', yards: 4, hours: 16, difficulty: 4, formality: 58, fittings: 2 },
  { id: 'jacket', name: 'Tailored Jacket', slot: 'top', yards: 3.25, hours: 34, difficulty: 5, formality: 78, fittings: 3 },
  { id: 'two_piece_suit', name: 'Two Piece Suit', slot: 'top', yards: 4.5, hours: 52, difficulty: 5, formality: 86, fittings: 3 },
  { id: 'three_piece_suit', name: 'Three Piece Suit', slot: 'top', yards: 5.25, hours: 66, difficulty: 5, formality: 90, fittings: 3 },
  { id: 'dinner_suit', name: 'Dinner Suit', slot: 'top', yards: 4.75, hours: 60, difficulty: 5, formality: 96, fittings: 3 },
  { id: 'overcoat', name: 'Overcoat', slot: 'outerwear', yards: 4.5, hours: 44, difficulty: 5, formality: 76, fittings: 3 },
  { id: 'trench', name: 'Trench Coat', slot: 'outerwear', yards: 5, hours: 38, difficulty: 5, formality: 66, fittings: 2 },
  { id: 'blouson', name: 'Blouson Jacket', slot: 'outerwear', yards: 2.75, hours: 18, difficulty: 4, formality: 30, fittings: 1 },
  { id: 'cape', name: 'Cape', slot: 'outerwear', yards: 4, hours: 14, difficulty: 3, formality: 70, fittings: 1 },
  { id: 'corset', name: 'Corset', slot: 'base', yards: 2, hours: 26, difficulty: 5, formality: 60, fittings: 3 },
  { id: 'period_gown', name: 'Period Gown', slot: 'outfit', yards: 11, hours: 84, difficulty: 5, formality: 94, fittings: 3 },
  { id: 'stage_costume', name: 'Stage Costume', slot: 'outfit', yards: 6, hours: 46, difficulty: 5, formality: 50, fittings: 3 },
  { id: 'creature_suit', name: 'Creature Suit', slot: 'outfit', yards: 9, hours: 120, difficulty: 5, formality: 10, fittings: 3 },
  { id: 'uniform', name: 'Uniform', slot: 'outfit', yards: 4.5, hours: 30, difficulty: 4, formality: 72, fittings: 2 },
];

/** What it is cut from. `perYard` is a base before the cloth's own price. */
export interface Cloth {
  id: string;
  name: string;
  /** What it feels like and how it hangs, in the words a cutter would use. */
  hand: string;
  /** Multiplies the bench hours: some cloth fights you. */
  effort: number;
  /** How well the finished garment survives being worn. */
  durability: number;
  /** Cloths that misbehave, said out loud rather than refused. */
  caution?: string;
}

export const CLOTHS: readonly Cloth[] = [
  { id: 'cotton_shirting', name: 'Cotton Shirting', hand: 'crisp, holds a press', effort: 1.0, durability: 74 },
  { id: 'cotton_twill', name: 'Cotton Twill', hand: 'firm, hard wearing', effort: 1.0, durability: 82 },
  { id: 'denim', name: 'Selvedge Denim', hand: 'heavy, stiff until it isn’t', effort: 1.3, durability: 92,
    caution: 'Heavy denim is hard on a domestic machine. Expect broken needles.' },
  { id: 'linen', name: 'Linen', hand: 'dry, cool, creases on sight', effort: 1.1, durability: 68,
    caution: 'Linen creases. That’s the fabric, not the making, and pressing won’t cure it.' },
  { id: 'wool_suiting', name: 'Wool Suiting', hand: 'obedient, takes shape from an iron', effort: 1.2, durability: 86 },
  { id: 'wool_flannel', name: 'Wool Flannel', hand: 'soft, warm, a little sleepy', effort: 1.15, durability: 80 },
  { id: 'wool_melton', name: 'Wool Melton', hand: 'thick, dense, coat weight', effort: 1.4, durability: 90 },
  { id: 'tweed', name: 'Tweed', hand: 'hairy, honest, forgiving', effort: 1.2, durability: 90 },
  { id: 'cashmere', name: 'Cashmere', hand: 'weightless and expensive', effort: 1.5, durability: 62,
    caution: 'Cashmere marks under a hot iron and never comes back. One pass, with a cloth.' },
  { id: 'silk_charmeuse', name: 'Silk Charmeuse', hand: 'liquid, slippery, unforgiving', effort: 1.8, durability: 54,
    caution: 'Charmeuse moves under the needle and shows every needle hole. There are no second seams.' },
  { id: 'silk_dupioni', name: 'Silk Dupioni', hand: 'crisp with slubs in it', effort: 1.3, durability: 66 },
  { id: 'silk_chiffon', name: 'Silk Chiffon', hand: 'weightless, almost not there', effort: 2.0, durability: 46,
    caution: 'Chiffon has to be cut between paper and sewn slowly. Rushing it ruins it.' },
  { id: 'silk_velvet', name: 'Silk Velvet', hand: 'deep, shifting, one direction only', effort: 1.9, durability: 60,
    caution: 'Velvet has a nap, so every piece must be cut the same way up, and it can’t be pressed flat.' },
  { id: 'satin', name: 'Duchesse Satin', hand: 'heavy, glossy, structural', effort: 1.4, durability: 70 },
  { id: 'taffeta', name: 'Silk Taffeta', hand: 'papery, rustles, holds a shape', effort: 1.3, durability: 68 },
  { id: 'jersey', name: 'Stretch Jersey', hand: 'soft, moves with you', effort: 1.2, durability: 66,
    caution: 'Knits want a stretch stitch. A straight seam on jersey will pop the first time you sit down.' },
  { id: 'ponte', name: 'Ponte Knit', hand: 'stable knit, behaves like a woven', effort: 1.0, durability: 78 },
  { id: 'lace', name: 'Chantilly Lace', hand: 'fragile, patterned, needs backing', effort: 1.9, durability: 44,
    caution: 'Lace has to be placed, not just cut, so the pattern runs on across a seam. That’s most of the work.' },
  { id: 'sequin', name: 'Sequin Mesh', hand: 'heavy, sharp, blunts everything', effort: 2.2, durability: 52,
    caution: 'Sequins destroy needles and scissors, and every seam has to be picked clear by hand first.' },
  { id: 'leather', name: 'Lambskin Leather', hand: 'supple, permanent once pierced', effort: 1.7, durability: 88,
    caution: 'Leather keeps every hole you put in it, so nothing can be unpicked and sewn again.' },
  { id: 'canvas', name: 'Cotton Canvas', hand: 'stiff, tough, unglamorous', effort: 1.2, durability: 90 },
  { id: 'faux_fur', name: 'Faux Fur', hand: 'bulky, sheds everywhere', effort: 1.6, durability: 70,
    caution: 'Faux fur sheds through the whole room. Cut it from the back, one layer at a time.' },
];

/** The finishing decisions a house asks about, each with what it costs. */
export interface Finish {
  id: string;
  name: string;
  /** Extra bench hours. */
  hours: number;
  /** What it does to the finished garment's quality. */
  quality: number;
  detail: string;
}

export const FINISHES: readonly Finish[] = [
  { id: 'machine', name: 'Machine Finished', hours: 0, quality: 0,
    detail: 'Seams closed and overlocked by machine. What most clothes are.' },
  { id: 'french_seams', name: 'French Seams', hours: 4, quality: 6,
    detail: 'Every raw edge enclosed inside the seam. Slower, and the inside is as clean as the outside.' },
  { id: 'hand_finished', name: 'Hand Finished', hours: 10, quality: 12,
    detail: 'Hems, facings and linings closed by hand. It hangs differently and it lasts longer.' },
  { id: 'full_canvas', name: 'Full Canvas', hours: 22, quality: 20,
    detail: 'A floating horsehair canvas through the whole front, not fused. The coat learns your shape.' },
  { id: 'half_canvas', name: 'Half Canvas', hours: 12, quality: 12,
    detail: 'Canvas through the chest, fused below. Most of the benefit for half the hours.' },
  { id: 'boned', name: 'Boned And Corseted', hours: 18, quality: 14,
    detail: 'Steel bones in taped channels with a coutil foundation. It holds the body, not the other way round.' },
  { id: 'lined_silk', name: 'Silk Lined', hours: 6, quality: 8,
    detail: 'A cut silk lining, bagged and hand felled at the hem.' },
  { id: 'beaded', name: 'Hand Beaded', hours: 60, quality: 18,
    detail: 'Beading applied by hand on a frame after the shell is made. Hours, not minutes.' },
  { id: 'distressed', name: 'Aged And Broken Down', hours: 8, quality: -4,
    detail: 'Dyed back, sanded, and worn in on purpose so it doesn’t read as new on camera.' },
];

/** Who is making it, and what that says about the result. */
export type Maker = 'house' | 'tailor' | 'self';

export const MAKER_LABEL: Readonly<Record<Maker, string>> = {
  house: 'A Costume House', tailor: 'A Tailor', self: 'You',
};

export function garmentKindOf(id: string): GarmentKind {
  return GARMENT_KINDS.find((g) => g.id === id) ?? GARMENT_KINDS[0]!;
}

export function clothOf(id: string): Cloth {
  return CLOTHS.find((c) => c.id === id) ?? CLOTHS[0]!;
}

export function finishOf(id: string | undefined): Finish {
  return FINISHES.find((f) => f.id === id) ?? FINISHES[0]!;
}

/** What every quoted price on this rail is, and is not. */
export const COSTUME_NOTE =
  'A costume house doesn’t publish a price list and there’s no feed for one, so every figure here is '
  + 'SLATE’s own calibration from cloth, hours and where you are standing. It isn’t a quote from a real workroom.';

/** What making it yourself needs on the table before you can start. */
export const SELF_MADE_NOTE =
  'Making it yourself needs a machine you own, enough cloth for the pattern, and the hours. '
  + 'How it comes out depends on your hands, and a first attempt at a tailored coat will look like one.';
