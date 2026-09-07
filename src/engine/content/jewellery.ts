/**
 * SLATE — what a piece of jewelry is actually made of.
 *
 * A commission is a conversation about five things: what the piece is, what
 * metal it is in, what stone goes in it, how that stone is cut and graded, and
 * how it is held. Everything here is the real vocabulary a bench uses, because
 * the whole point of the room is that somebody is asking you questions a real
 * jeweler would ask.
 *
 * What is fact and what is SLATE's own arithmetic:
 *
 * - **Fact.** Karat and millesimal fineness (18k is 750 parts per thousand).
 *   The GIA color scale, D to Z. The GIA clarity scale, Flawless to I3. The
 *   named diamond cuts. The Mohs hardness figures. These are published
 *   standards and are stated as they are.
 * - **SLATE's arithmetic.** Every price. What a carat of a given grade costs
 *   moves constantly with the market, so what you see is a calibration
 *   against local cost of living and the jeweler's own tier, and the game
 *   says so wherever it prints a number.
 */

/** How much a stone is worth per carat, before grade, in whole cents. */
type PerCarat = number;

// ---------------------------------------------------------------------------
// Metal
// ---------------------------------------------------------------------------

export interface Metal {
  id: string;
  name: string;
  /** Parts per thousand of the precious metal. 750 is 18 karat. Fact. */
  fineness: number;
  /** What the bench charges for the metal, relative to sterling silver. */
  costFactor: number;
  /** How well it takes a knock, 0 to 100. Softer golds mark more easily. */
  hardness: number;
  /** Which color a piece in this metal reads as, for the mirror. */
  colour: string;
  /** Whether a resize is straightforward. Some of these fight the torch. */
  resizable: boolean;
  about: string;
}

export const METALS: readonly Metal[] = [
  { id: 'silver', name: 'Sterling Silver', fineness: 925, costFactor: 1, hardness: 42, colour: 'silver', resizable: true, about: '925 parts silver. Cheap to work, and it will tarnish if you leave it in a drawer.' },
  { id: 'gold_9', name: '9 Karat Yellow Gold', fineness: 375, costFactor: 5.5, hardness: 62, colour: 'gold', resizable: true, about: '375 parts gold. Hard wearing, paler than you might expect, and legal to call gold in Britain but not everywhere.' },
  { id: 'gold_14', name: '14 Karat Yellow Gold', fineness: 585, costFactor: 8.5, hardness: 58, colour: 'gold', resizable: true, about: '585 parts gold. The American default: enough gold to look it, hard enough to wear daily.' },
  { id: 'gold_18', name: '18 Karat Yellow Gold', fineness: 750, costFactor: 12, hardness: 52, colour: 'gold', resizable: true, about: '750 parts gold. What the maisons use. Warmer, softer, and it marks.' },
  { id: 'gold_22', name: '22 Karat Yellow Gold', fineness: 916, costFactor: 15, hardness: 38, colour: 'gold', resizable: true, about: '916 parts gold. The color of a wedding in South Asia, and soft enough to bend by hand.' },
  { id: 'white_gold_18', name: '18 Karat White Gold', fineness: 750, costFactor: 12.5, hardness: 56, colour: 'silver', resizable: true, about: 'Gold alloyed white and rhodium plated. The plating wears and wants redoing every few years.' },
  { id: 'rose_gold_18', name: '18 Karat Rose Gold', fineness: 750, costFactor: 12, hardness: 58, colour: 'rose_gold', resizable: true, about: 'Gold with copper in it. Harder than yellow, and it does not fade the way people fear.' },
  { id: 'platinum', name: 'Platinum', fineness: 950, costFactor: 16, hardness: 66, colour: 'platinum', resizable: true, about: '950 parts platinum. Heavy, white all the way through, and it develops a patina rather than wearing away.' },
  { id: 'palladium', name: 'Palladium', fineness: 950, costFactor: 13, hardness: 64, colour: 'platinum', resizable: true, about: 'Lighter than platinum, white without plating, and a quieter thing to wear.' },
  { id: 'titanium', name: 'Titanium', fineness: 0, costFactor: 2, hardness: 88, colour: 'steel', resizable: false, about: 'Very light, very hard, and it cannot be sized or soldered. What you order is what you have.' },
  { id: 'tungsten', name: 'Tungsten Carbide', fineness: 0, costFactor: 1.6, hardness: 94, colour: 'charcoal', resizable: false, about: 'Nearly unscratchable and it cannot be cut off in the ordinary way, which matters more than people think.' },
  { id: 'steel_jewel', name: 'Stainless Steel', fineness: 0, costFactor: 0.6, hardness: 82, colour: 'steel', resizable: false, about: 'What a hundred-pound chain is actually made of. Honest about itself.' },
];

export const METAL_BY_ID: Readonly<Record<string, Metal>> = Object.fromEntries(METALS.map((m) => [m.id, m]));

export function metalOf(id: string | undefined): Metal {
  return METAL_BY_ID[id ?? ''] ?? METAL_BY_ID['gold_18']!;
}

// ---------------------------------------------------------------------------
// Stones
// ---------------------------------------------------------------------------

export interface Stone {
  id: string;
  name: string;
  /** Mohs hardness. Fact: diamond is 10, ruby and sapphire 9, emerald 7.5–8. */
  mohs: number;
  /** SLATE's calibration of what a carat costs at a middling grade. */
  perCarat: PerCarat;
  /** Whether the GIA color and clarity scales apply. They are diamond scales. */
  graded: boolean;
  /** The color the mirror reads it as. */
  colour: string;
  about: string;
}

export const STONES: readonly Stone[] = [
  { id: 'none', name: 'No Stone', mohs: 0, perCarat: 0, graded: false, colour: 'gold', about: 'Metal alone. A band, a signet, a plain chain. Nothing to catch and nothing to lose.' },
  { id: 'diamond', name: 'Diamond', mohs: 10, perCarat: 5_200_00, graded: true, colour: 'white', about: 'The hardest thing there is, graded on four scales, and the only stone most people can name the grades of.' },
  { id: 'lab_diamond', name: 'Laboratory Grown Diamond', mohs: 10, perCarat: 900_00, graded: true, colour: 'white', about: 'Chemically a diamond, grown rather than mined, graded on the same scales and a fraction of the price.' },
  { id: 'moissanite', name: 'Moissanite', mohs: 9.25, perCarat: 180_00, graded: false, colour: 'white', about: 'Brighter than a diamond and not pretending to be one. The stone people buy when they have done the reading.' },
  { id: 'sapphire', name: 'Blue Sapphire', mohs: 9, perCarat: 1_400_00, graded: false, colour: 'royal_blue', about: 'Corundum, hard enough for daily wear, and the blue everybody means when they say sapphire.' },
  { id: 'pink_sapphire', name: 'Pink Sapphire', mohs: 9, perCarat: 1_100_00, graded: false, colour: 'blush', about: 'The same stone as a blue sapphire, colored differently by what was in the ground.' },
  { id: 'ruby', name: 'Ruby', mohs: 9, perCarat: 3_800_00, graded: false, colour: 'scarlet', about: 'Red corundum. A fine one costs more per carat than a diamond and almost nobody knows that.' },
  { id: 'emerald', name: 'Emerald', mohs: 7.75, perCarat: 2_600_00, graded: false, colour: 'emerald', about: 'Beryl, softer than it looks, and almost always with inclusions the trade calls a garden.' },
  { id: 'aquamarine', name: 'Aquamarine', mohs: 7.75, perCarat: 240_00, graded: false, colour: 'pale_blue', about: 'The other beryl. Big clean stones are ordinary, which makes them affordable and underrated.' },
  { id: 'tanzanite', name: 'Tanzanite', mohs: 6.5, perCarat: 620_00, graded: false, colour: 'purple', about: 'Found in one place on earth and nowhere else. Soft, so not a ring you wear to do the washing up.' },
  { id: 'opal', name: 'Opal', mohs: 5.75, perCarat: 320_00, graded: false, colour: 'off_white', about: 'Fire inside water. It can crack from a change in temperature and it is worth it anyway.' },
  { id: 'pearl', name: 'Cultured Pearl', mohs: 2.75, perCarat: 90_00, graded: false, colour: 'off_white', about: 'Not a stone at all. Soft, dislikes perfume, and needs restringing every couple of years.' },
  { id: 'jade', name: 'Jadeite Jade', mohs: 6.75, perCarat: 1_900_00, graded: false, colour: 'forest', about: 'Tough rather than hard, and the finest imperial green is one of the dearest materials in jewelry.' },
  { id: 'amethyst', name: 'Amethyst', mohs: 7, perCarat: 28_00, graded: false, colour: 'purple', about: 'Quartz. Was worth a fortune until Brazil turned up with rather a lot of it.' },
  { id: 'garnet', name: 'Garnet', mohs: 7.25, perCarat: 45_00, graded: false, colour: 'oxblood', about: 'The stone in your grandmother’s brooch. Deep, warm, and cheap for what it is.' },
  { id: 'topaz', name: 'Topaz', mohs: 8, perCarat: 55_00, graded: false, colour: 'pale_blue', about: 'Hard, clear, and mostly blue because somebody irradiated it. That is normal and disclosed.' },
  { id: 'onyx', name: 'Black Onyx', mohs: 7, perCarat: 18_00, graded: false, colour: 'black', about: 'Flat black chalcedony. What a signet ring is set with when it is set with anything.' },
  { id: 'turquoise', name: 'Turquoise', mohs: 5.5, perCarat: 60_00, graded: false, colour: 'teal', about: 'Porous, soft, and it changes color from the oil on your skin. Some people count that as the point.' },
];

export const STONE_BY_ID: Readonly<Record<string, Stone>> = Object.fromEntries(STONES.map((s) => [s.id, s]));

export function stoneOf(id: string | undefined): Stone {
  return STONE_BY_ID[id ?? ''] ?? STONE_BY_ID['none']!;
}

// ---------------------------------------------------------------------------
// The four Cs, as the GIA publishes them
// ---------------------------------------------------------------------------

/**
 * Cut. The named shapes, and how much of the stone is thrown away making them.
 *
 * The shapes and their character are fact. `yieldFactor` is SLATE's own
 * figure: it stands in for the rough a cutter loses, which is why the same
 * carat weight costs differently in different shapes.
 */
export interface Cut {
  id: string;
  name: string;
  yieldFactor: number;
  about: string;
}

export const CUTS: readonly Cut[] = [
  { id: 'round', name: 'Round Brilliant', yieldFactor: 1.28, about: 'Fifty-seven facets, the most light back out of the top, and the most rough left on the floor.' },
  { id: 'princess', name: 'Princess', yieldFactor: 0.94, about: 'A square brilliant. Keeps more of the rough, which is why it costs less per carat.' },
  { id: 'emerald_cut', name: 'Emerald Cut', yieldFactor: 1.02, about: 'Step cut, long flashes rather than sparkle, and nowhere for an inclusion to hide.' },
  { id: 'asscher', name: 'Asscher', yieldFactor: 1.04, about: 'A square emerald cut with cropped corners. Nineteen twenties, and back every twenty years.' },
  { id: 'oval', name: 'Oval', yieldFactor: 1.08, about: 'Looks larger than its weight and can show a bow tie of shadow across the middle.' },
  { id: 'pear', name: 'Pear', yieldFactor: 1.06, about: 'A teardrop. Wants a setting that protects the point, which is where they chip.' },
  { id: 'marquise', name: 'Marquise', yieldFactor: 1.05, about: 'Two points and a long body. Maximum apparent size per carat of anything on this list.' },
  { id: 'cushion', name: 'Cushion', yieldFactor: 1.03, about: 'A softened square, the old mine cut brought forward. Warmer, less clinical.' },
  { id: 'radiant', name: 'Radiant', yieldFactor: 0.98, about: 'A brilliant cut in a rectangle. The compromise between an emerald cut and a round.' },
  { id: 'heart', name: 'Heart', yieldFactor: 1.14, about: 'Difficult to cut well and easy to cut badly. Under a carat it stops reading as a heart.' },
  { id: 'baguette', name: 'Baguette', yieldFactor: 0.9, about: 'A small step-cut rectangle. Almost always a side stone rather than the center.' },
  { id: 'cabochon', name: 'Cabochon', yieldFactor: 0.82, about: 'Polished domed, not faceted. What opal, turquoise and star sapphires want.' },
];

export const CUT_BY_ID: Readonly<Record<string, Cut>> = Object.fromEntries(CUTS.map((c) => [c.id, c]));

export function cutOf(id: string | undefined): Cut {
  return CUT_BY_ID[id ?? ''] ?? CUT_BY_ID['round']!;
}

/**
 * Color, on the GIA D to Z scale.
 *
 * D is colorless and Z is light yellow or brown; the letters and their bands
 * are the published scale. `factor` is SLATE's own multiplier on price.
 */
export interface ColourGrade {
  id: string;
  name: string;
  band: string;
  factor: number;
  about: string;
}

export const COLOUR_GRADES: readonly ColourGrade[] = [
  { id: 'd', name: 'D', band: 'Colorless', factor: 1.6, about: 'The top of the scale. Nothing above it, and most people cannot tell it from an F.' },
  { id: 'e', name: 'E', band: 'Colorless', factor: 1.45, about: 'Colorless. A gemologist finds a trace under laboratory light.' },
  { id: 'f', name: 'F', band: 'Colorless', factor: 1.32, about: 'Colorless, and the last grade where that word is used without qualification.' },
  { id: 'g', name: 'G', band: 'Near Colorless', factor: 1.15, about: 'Near colorless, and the grade the trade quietly recommends. Face up it looks white.' },
  { id: 'h', name: 'H', band: 'Near Colorless', factor: 1.0, about: 'Near colorless. White in a white metal, and the sensible middle of the scale.' },
  { id: 'i', name: 'I', band: 'Near Colorless', factor: 0.88, about: 'A hint of warmth from the side. Invisible once it is set and on a hand.' },
  { id: 'j', name: 'J', band: 'Near Colorless', factor: 0.78, about: 'Warm enough to notice against a D, and nothing at all in yellow gold.' },
  { id: 'k', name: 'K', band: 'Faint', factor: 0.66, about: 'Faint yellow. Set it in gold and it reads as intentional rather than as a compromise.' },
  { id: 'm', name: 'M', band: 'Faint', factor: 0.54, about: 'Visibly warm. Cheap for the weight, and honest about what it is.' },
];

export const COLOUR_GRADE_BY_ID: Readonly<Record<string, ColourGrade>> = Object.fromEntries(COLOUR_GRADES.map((c) => [c.id, c]));

export function colourGradeOf(id: string | undefined): ColourGrade {
  return COLOUR_GRADE_BY_ID[id ?? ''] ?? COLOUR_GRADE_BY_ID['h']!;
}

/**
 * Clarity, on the GIA scale.
 *
 * The grades and what they mean are the published scale. `factor` is SLATE's
 * own multiplier.
 */
export interface ClarityGrade {
  id: string;
  name: string;
  factor: number;
  about: string;
}

export const CLARITIES: readonly ClarityGrade[] = [
  { id: 'fl', name: 'FL', factor: 2.1, about: 'Flawless. No inclusions and no blemishes at ten times magnification. Vanishingly rare.' },
  { id: 'if', name: 'IF', factor: 1.75, about: 'Internally flawless. Nothing inside; a mark on the surface a polisher could take off.' },
  { id: 'vvs1', name: 'VVS1', factor: 1.5, about: 'Very very slightly included. A grader with a loupe has to hunt for it.' },
  { id: 'vvs2', name: 'VVS2', factor: 1.38, about: 'Very very slightly included, and found from the front rather than the back.' },
  { id: 'vs1', name: 'VS1', factor: 1.2, about: 'Very slightly included. Clean to the eye, and the grade where the money starts making sense.' },
  { id: 'vs2', name: 'VS2', factor: 1.08, about: 'Very slightly included. Eye clean in almost every stone, at a real discount to VS1.' },
  { id: 'si1', name: 'SI1', factor: 0.92, about: 'Slightly included. Usually eye clean, sometimes not. Worth looking at the actual stone.' },
  { id: 'si2', name: 'SI2', factor: 0.78, about: 'Slightly included, and you can often find it without a loupe if you know where to look.' },
  { id: 'i1', name: 'I1', factor: 0.58, about: 'Included. Visible, and it can reach the surface, which is a durability question as well as a looks one.' },
];

export const CLARITY_BY_ID: Readonly<Record<string, ClarityGrade>> = Object.fromEntries(CLARITIES.map((c) => [c.id, c]));

export function clarityOf(id: string | undefined): ClarityGrade {
  return CLARITY_BY_ID[id ?? ''] ?? CLARITY_BY_ID['vs2']!;
}

// ---------------------------------------------------------------------------
// The piece, and how the stone is held
// ---------------------------------------------------------------------------

export interface PieceKind {
  id: string;
  name: string;
  /** The wardrobe peg it hangs on when it is finished. */
  slot: string;
  /** Grams of metal, roughly, before the stone. SLATE's own figure. */
  grams: number;
  /** How long the bench takes, in weeks, before anything is added for the stone. */
  weeks: number;
  /** Whether a center stone makes sense at all. */
  takesStone: boolean;
  about: string;
}

export const PIECE_KINDS: readonly PieceKind[] = [
  { id: 'solitaire_ring', name: 'Solitaire Ring', slot: 'ring', grams: 4, weeks: 5, takesStone: true, about: 'One stone, held up, nothing else asking for attention.' },
  { id: 'engagement_ring', name: 'Engagement Ring', slot: 'ring', grams: 5, weeks: 6, takesStone: true, about: 'A center stone and whatever you want around it. The one people keep the box for.' },
  { id: 'eternity_band', name: 'Eternity Band', slot: 'ring', grams: 4, weeks: 5, takesStone: true, about: 'Stones the whole way round. Cannot be resized afterwards, so the fitting matters.' },
  { id: 'wedding_band', name: 'Wedding Band', slot: 'ring', grams: 5, weeks: 3, takesStone: false, about: 'Plain, or milled, or hammered. It has to survive forty years of not being taken off.' },
  { id: 'signet_ring', name: 'Signet Ring', slot: 'ring', grams: 9, weeks: 4, takesStone: true, about: 'A flat face to engrave, or a slab of onyx. Worn on the little finger, traditionally.' },
  { id: 'cocktail_ring', name: 'Cocktail Ring', slot: 'ring', grams: 8, weeks: 6, takesStone: true, about: 'Large, and not apologizing for it. The whole idea is that it is seen from across a room.' },
  { id: 'pendant', name: 'Pendant', slot: 'necklace', grams: 3, weeks: 4, takesStone: true, about: 'One stone on a chain. The simplest thing a bench can make well.' },
  { id: 'chain', name: 'Chain', slot: 'necklace', grams: 22, weeks: 4, takesStone: false, about: 'Links, by the gram. Cuban, rope, box, figaro; the weight is the price.' },
  { id: 'riviere', name: 'Rivière Necklace', slot: 'necklace', grams: 14, weeks: 10, takesStone: true, about: 'A river of graduated stones with no metal showing. The bench will want a year of your patience.' },
  { id: 'stud_earrings', name: 'Stud Earrings', slot: 'earrings', grams: 2, weeks: 4, takesStone: true, about: 'A pair, which means two stones matched to each other as well as graded.' },
  { id: 'hoop_earrings', name: 'Hoop Earrings', slot: 'earrings', grams: 5, weeks: 3, takesStone: false, about: 'A pair of circles. Harder to make well than they look; the hinge is where they fail.' },
  { id: 'drop_earrings', name: 'Drop Earrings', slot: 'earrings', grams: 6, weeks: 6, takesStone: true, about: 'They move when you do. Weight is the enemy; nobody wears heavy drops twice.' },
  { id: 'tennis_bracelet', name: 'Tennis Bracelet', slot: 'bracelet', grams: 10, weeks: 8, takesStone: true, about: 'A line of matched stones. Named after a US Open match in 1987 where one came off.' },
  { id: 'bangle', name: 'Bangle', slot: 'bracelet', grams: 18, weeks: 4, takesStone: false, about: 'Solid, no clasp, and it has to go over the widest part of your hand.' },
  { id: 'cuff_bracelet', name: 'Cuff', slot: 'bracelet', grams: 26, weeks: 5, takesStone: false, about: 'An open band with real weight to it. A lot of metal and a lot of hammering.' },
  { id: 'cufflinks', name: 'Cufflinks', slot: 'jewellery', grams: 12, weeks: 4, takesStone: true, about: 'A pair, with a swivel back that has to work ten thousand times.' },
  { id: 'brooch', name: 'Brooch', slot: 'jewellery', grams: 11, weeks: 7, takesStone: true, about: 'The piece nobody commissions any more, which is exactly why one is worth having.' },
  // The iced-out bench.
  { id: 'miami_cuban', name: 'Miami Cuban Link', slot: 'necklace', grams: 120, weeks: 5, takesStone: true, about: 'Solid links by the gauge, and most of the price is the gold. Set with stones, it is a different price again.' },
  { id: 'tennis_chain', name: 'Tennis Chain', slot: 'necklace', grams: 30, weeks: 8, takesStone: true, about: 'A line of matched stones the whole way round the neck. Hundreds of them, each one set by hand.' },
  { id: 'nameplate', name: 'Nameplate', slot: 'necklace', grams: 9, weeks: 4, takesStone: true, about: 'Your name, or somebody else’s, cut in script and hung on a chain. Canal Street since forever.' },
  { id: 'grillz', name: 'Grillz', slot: 'jewellery', grams: 14, weeks: 3, takesStone: true, about: 'Cast from a mold of your teeth, so they come in first for the impression. Six on the bottom or eight on top.' },
];

export const PIECE_BY_ID: Readonly<Record<string, PieceKind>> = Object.fromEntries(PIECE_KINDS.map((p) => [p.id, p]));

export function pieceOf(id: string | undefined): PieceKind {
  return PIECE_BY_ID[id ?? ''] ?? PIECE_BY_ID['solitaire_ring']!;
}

export interface Setting {
  id: string;
  name: string;
  /** What the setting adds to the bench time, in weeks. */
  weeks: number;
  /** What it adds to the labor, as a multiplier on the metal cost. */
  labour: number;
  /** How well it protects the stone, 0 to 100. */
  protection: number;
  about: string;
}

export const SETTINGS: readonly Setting[] = [
  { id: 'solitaire', name: 'Four Claw Solitaire', weeks: 0, labour: 1, protection: 55, about: 'Four claws and daylight underneath. The most light into the stone and the least metal around it.' },
  { id: 'six_claw', name: 'Six Claw', weeks: 0, labour: 1.1, protection: 66, about: 'Two more claws than it needs, which is the point. Tiffany made it famous in 1886.' },
  { id: 'bezel', name: 'Bezel', weeks: 1, labour: 1.35, protection: 92, about: 'A collar of metal all the way round. The safest setting there is, and the one that snags on nothing.' },
  { id: 'halo', name: 'Halo', weeks: 1, labour: 1.6, protection: 74, about: 'Small stones ringing the center so it reads a size larger than it weighs.' },
  { id: 'pave', name: 'Pavé', weeks: 2, labour: 1.9, protection: 62, about: 'The metal disappears under stones. Beautiful, and a repair bill waiting when one drops.' },
  { id: 'channel', name: 'Channel', weeks: 1, labour: 1.5, protection: 86, about: 'Stones sunk in a groove between two walls. Nothing sticks up and nothing catches.' },
  { id: 'three_stone', name: 'Three Stone', weeks: 1, labour: 1.45, protection: 64, about: 'A center with a shoulder each side. Past, present, future, if you like that sort of thing.' },
  { id: 'tension', name: 'Tension', weeks: 2, labour: 1.8, protection: 48, about: 'The stone held by the spring of the metal alone. Looks like a trick and cannot be resized.' },
  { id: 'cluster', name: 'Cluster', weeks: 1, labour: 1.55, protection: 70, about: 'Many stones reading as one larger one. Victorian, and back in fashion roughly always.' },
  { id: 'rubover', name: 'Rub Over', weeks: 1, labour: 1.3, protection: 88, about: 'The metal burnished over the girdle. A quieter cousin of the bezel, flush to the finger.' },
  { id: 'plain', name: 'No Setting', weeks: 0, labour: 1, protection: 100, about: 'Metal alone, and nothing that can ever fall out of it.' },
];

export const SETTING_BY_ID: Readonly<Record<string, Setting>> = Object.fromEntries(SETTINGS.map((s) => [s.id, s]));

export function settingOf(id: string | undefined): Setting {
  return SETTING_BY_ID[id ?? ''] ?? SETTING_BY_ID['solitaire']!;
}

/**
 * Said wherever the game prints a price for a stone or a commission.
 *
 * The grades are a published standard and are used as published. What a stone
 * of a given grade costs is a live market SLATE has no feed for, so the money
 * is the game's own arithmetic and is labelled that way.
 */
export const JEWELLERY_NOTE = 'Karat, the GIA color and clarity scales and the named cuts are published standards, used as published. Every price here is SLATE’s own calibration, not a quotation from the trade.';
