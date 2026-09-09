/**
 * SLATE — color, cloth and what the room expects you to wear.
 *
 * None of this is fashion advice and none of it is a rule anybody has to
 * follow. It is the set of conventions a mirror in a game can reasonably
 * comment on: that brown shoes under a black suit reads as a mistake to most
 * people, that mixing metals is a choice, that linen in February is a
 * decision. The player can ignore every one of them and the world will simply
 * have an opinion, which is what the world does.
 */

/**
 * The pegs an outfit hangs on, in the order you get dressed.
 *
 * Jewelry is four pegs rather than one, because earrings, a chain, a ring
 * and a bracelet are worn at the same time and a single slot would make you
 * choose between them. `jewellery` stays for everything that is none of
 * those — cufflinks, a brooch, a body chain — and because saves written
 * before the split still carry it.
 */
export const SLOTS = [
  'base', 'top', 'bottom', 'outfit', 'outerwear', 'shoes', 'socks', 'belt', 'watch',
  'earrings', 'necklace', 'ring', 'bracelet', 'jewellery', 'bag', 'eyewear', 'hat', 'scarf', 'gloves', 'tie',
] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_LABEL: Readonly<Record<Slot, string>> = {
  base: 'Underneath', top: 'Top', bottom: 'Bottom', outfit: 'One Piece', outerwear: 'Coat',
  shoes: 'Shoes', socks: 'Socks', belt: 'Belt', watch: 'Watch',
  earrings: 'Earrings', necklace: 'Necklace', ring: 'Ring', bracelet: 'Bracelet', jewellery: 'Jewelry',
  bag: 'Bag', eyewear: 'Eyewear', hat: 'Hat', scarf: 'Scarf', gloves: 'Gloves', tie: 'Tie',
};

/** The four pegs the one old jewelry slot became, plus the one it kept. */
export const JEWELLERY_SLOTS: readonly Slot[] = ['earrings', 'necklace', 'ring', 'bracelet', 'jewellery'];

/**
 * Which peg a piece of jewelry hangs on, from what kind of thing it is.
 *
 * Used when the catalog does not say, and when a save written before the
 * split is opened: a necklace that has been sitting in the one jewelry slot
 * moves to its own without the player losing it.
 */
export function jewellerySlotFor(subcategory: string, name = ''): Slot {
  // The subcategory is what the catalog says the thing is, so it decides on
  // its own first. Reading the name at the same time gets it wrong on pieces
  // whose names borrow another peg's word: a Panthère Chain Bracelet is a
  // bracelet, and a Diamonds By The Yard Necklace is a necklace.
  return readSlot(subcategory.toLowerCase()) ?? readSlot(name.toLowerCase()) ?? 'jewellery';
}

function readSlot(text: string): Slot | undefined {
  if (text.length === 0) return undefined;
  // Cufflinks first: they are none of the four, and "cuff" would otherwise
  // read them as a bracelet.
  if (/cufflink|cuff link|brooch|body chain|tie pin|tie bar|lapel/.test(text)) return 'jewellery';
  if (/earring|ear cuff|ear crawler|huggie|stud|hoop/.test(text)) return 'earrings';
  if (/bracelet|bangle|\bcuffs?\b|tennis/.test(text)) return 'bracelet';
  if (/necklace|pendant|chain|choker|strand|riviere|rivière|collier|pearl/.test(text)) return 'necklace';
  if (/\bring\b|\bband\b|solitaire|engagement|signet/.test(text)) return 'ring';
  return undefined;
}

/** Who a garment is cut for. Nothing is refused; this is what a shop shows first. */
export type Audience = 'men' | 'women' | 'unisex';

export const AUDIENCE_LABEL: Readonly<Record<Audience, string>> = {
  men: "Men's", women: "Women's", unisex: 'Unisex',
};

/** Slots an outfit is not really dressed without. */
export const ESSENTIAL_SLOTS: readonly Slot[] = ['top', 'bottom', 'shoes'];

/** A one-piece covers the top and the bottom by itself. */
export const COVERED_BY_OUTFIT: readonly Slot[] = ['top', 'bottom'];

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

export type ColourFamily = 'neutral' | 'earth' | 'cool' | 'warm' | 'bold' | 'pastel' | 'metal';

export interface Colour {
  id: string;
  name: string;
  family: ColourFamily;
  /** 0 is white, 100 is black. */
  depth: number;
  /** How loud it is in a room, 0 to 100. */
  volume: number;
}

export const COLOURS: readonly Colour[] = [
  // --- Neutrals ---------------------------------------------------------------
  { id: 'black', name: 'Black', family: 'neutral', depth: 96, volume: 20 },
  { id: 'charcoal', name: 'Charcoal', family: 'neutral', depth: 82, volume: 14 },
  { id: 'grey', name: 'Gray', family: 'neutral', depth: 55, volume: 10 },
  { id: 'light_grey', name: 'Light Gray', family: 'neutral', depth: 30, volume: 10 },
  { id: 'white', name: 'White', family: 'neutral', depth: 4, volume: 22 },
  { id: 'off_white', name: 'Off White', family: 'neutral', depth: 12, volume: 12 },
  { id: 'ecru', name: 'Ecru', family: 'neutral', depth: 18, volume: 10 },
  // --- Earth ------------------------------------------------------------------
  { id: 'brown', name: 'Brown', family: 'earth', depth: 74, volume: 18 },
  { id: 'chocolate', name: 'Chocolate', family: 'earth', depth: 84, volume: 18 },
  { id: 'tan', name: 'Tan', family: 'earth', depth: 44, volume: 20 },
  { id: 'camel', name: 'Camel', family: 'earth', depth: 40, volume: 26 },
  { id: 'khaki', name: 'Khaki', family: 'earth', depth: 46, volume: 14 },
  { id: 'olive', name: 'Olive', family: 'earth', depth: 62, volume: 20 },
  { id: 'rust', name: 'Rust', family: 'earth', depth: 60, volume: 44 },
  { id: 'oxblood', name: 'Oxblood', family: 'earth', depth: 80, volume: 36 },
  // --- Cool -------------------------------------------------------------------
  { id: 'navy', name: 'Navy', family: 'cool', depth: 86, volume: 14 },
  { id: 'blue', name: 'Blue', family: 'cool', depth: 58, volume: 30 },
  { id: 'pale_blue', name: 'Pale Blue', family: 'cool', depth: 26, volume: 18 },
  { id: 'teal', name: 'Teal', family: 'cool', depth: 62, volume: 42 },
  { id: 'forest', name: 'Forest Green', family: 'cool', depth: 76, volume: 26 },
  { id: 'sage', name: 'Sage', family: 'cool', depth: 40, volume: 16 },
  { id: 'indigo', name: 'Indigo', family: 'cool', depth: 72, volume: 24 },
  // --- Warm -------------------------------------------------------------------
  { id: 'burgundy', name: 'Burgundy', family: 'warm', depth: 78, volume: 34 },
  { id: 'cream', name: 'Cream', family: 'warm', depth: 14, volume: 14 },
  { id: 'mustard', name: 'Mustard', family: 'warm', depth: 48, volume: 52 },
  { id: 'terracotta', name: 'Terracotta', family: 'warm', depth: 56, volume: 44 },
  // --- Bold -------------------------------------------------------------------
  { id: 'red', name: 'Red', family: 'bold', depth: 60, volume: 82 },
  { id: 'scarlet', name: 'Scarlet', family: 'bold', depth: 56, volume: 88 },
  { id: 'emerald', name: 'Emerald', family: 'bold', depth: 60, volume: 70 },
  { id: 'royal_blue', name: 'Royal Blue', family: 'bold', depth: 60, volume: 68 },
  { id: 'fuchsia', name: 'Fuchsia', family: 'bold', depth: 52, volume: 90 },
  { id: 'orange', name: 'Orange', family: 'bold', depth: 48, volume: 84 },
  { id: 'yellow', name: 'Yellow', family: 'bold', depth: 24, volume: 86 },
  { id: 'purple', name: 'Purple', family: 'bold', depth: 66, volume: 66 },
  // --- Pastel -----------------------------------------------------------------
  { id: 'blush', name: 'Blush', family: 'pastel', depth: 22, volume: 26 },
  { id: 'lilac', name: 'Lilac', family: 'pastel', depth: 28, volume: 30 },
  { id: 'mint', name: 'Mint', family: 'pastel', depth: 24, volume: 28 },
  // --- Metal ------------------------------------------------------------------
  { id: 'gold', name: 'Gold', family: 'metal', depth: 44, volume: 54 },
  { id: 'silver', name: 'Silver', family: 'metal', depth: 36, volume: 34 },
  { id: 'rose_gold', name: 'Rose Gold', family: 'metal', depth: 42, volume: 46 },
  { id: 'steel', name: 'Steel', family: 'metal', depth: 40, volume: 24 },
  { id: 'platinum', name: 'Platinum', family: 'metal', depth: 30, volume: 30 },
];

export const COLOUR_BY_ID: Readonly<Record<string, Colour>> = Object.fromEntries(COLOURS.map((c) => [c.id, c]));

export function colourOf(id: string | undefined): Colour {
  return COLOUR_BY_ID[id ?? ''] ?? COLOUR_BY_ID['black']!;
}

/**
 * Said out loud wherever a colorway is shown, because it is a calibration and
 * not a fact about the product. Which colors a real garment actually shipped
 * in, in which season, is not public data at this scale.
 */
export const COLOUR_NOTE = 'The colorway is the one your copy came in, chosen by SLATE from what the piece would plausibly be made in. It isn’t a claim about the season the maker actually offered.';

/**
 * The color a thing is when nobody chose one.
 *
 * A shop floor sells colorways and records which one you carried out. Every
 * other way of acquiring clothes — an order placed from the catalog, a gift,
 * a save written before color existed — has to decide for itself, and
 * deciding black every time gives you a wardrobe that looks like a funeral.
 *
 * So: if the name states a color, that is the color. Otherwise take one from
 * what that slot is usually made in, keyed to the item's own id, so the same
 * product is always the same color in every save and nothing shifts under a
 * player who reloads.
 */
export function defaultColour(itemId: string, name: string, slot: string): string {
  const text = name.toLowerCase();
  for (const colour of COLOURS_BY_NAME_LENGTH) {
    if (text.includes(colour.name.toLowerCase())) return colour.id;
  }
  const palette = SLOT_PALETTE[slot] ?? SLOT_PALETTE['default']!;
  let hash = 0;
  for (let i = 0; i < itemId.length; i++) hash = (hash * 31 + itemId.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length]!;
}

/** Longest first, so "Light Gray" is not read as "Gray" and "Royal Blue" not as "Blue". */
const COLOURS_BY_NAME_LENGTH: readonly Colour[] = [...COLOURS].sort((a, b) => b.name.length - a.name.length);

/**
 * What each slot tends to come in. Not every color in the book: a belt is not
 * mustard and a suit is not fuchsia, whatever the runway did last season.
 */
const SLOT_PALETTE: Readonly<Record<string, readonly string[]>> = {
  top: ['white', 'off_white', 'pale_blue', 'navy', 'black', 'grey', 'charcoal', 'ecru', 'olive', 'burgundy', 'cream', 'sage'],
  bottom: ['navy', 'charcoal', 'grey', 'khaki', 'black', 'indigo', 'olive', 'tan', 'cream'],
  outfit: ['navy', 'charcoal', 'black', 'grey', 'burgundy', 'forest'],
  outerwear: ['camel', 'navy', 'charcoal', 'black', 'olive', 'khaki', 'grey', 'oxblood'],
  shoes: ['black', 'brown', 'chocolate', 'tan', 'oxblood', 'white', 'navy'],
  belt: ['black', 'brown', 'chocolate', 'tan'],
  bag: ['black', 'brown', 'tan', 'navy', 'chocolate', 'oxblood'],
  watch: ['steel', 'silver', 'gold', 'rose_gold', 'platinum', 'black'],
  earrings: ['gold', 'silver', 'platinum', 'rose_gold'],
  necklace: ['gold', 'silver', 'platinum', 'rose_gold'],
  ring: ['gold', 'silver', 'platinum', 'rose_gold'],
  bracelet: ['gold', 'silver', 'platinum', 'rose_gold'],
  jewellery: ['gold', 'silver', 'platinum', 'rose_gold'],
  socks: ['black', 'charcoal', 'navy', 'grey', 'burgundy'],
  underwear: ['white', 'black', 'grey', 'navy'],
  scarf: ['camel', 'grey', 'burgundy', 'navy', 'forest', 'charcoal'],
  hat: ['black', 'navy', 'camel', 'charcoal', 'olive'],
  gloves: ['black', 'brown', 'charcoal', 'tan'],
  eyewear: ['black', 'tan', 'steel', 'gold'],
  default: ['black', 'navy', 'charcoal', 'grey', 'brown', 'olive'],
};

/** Colors that go with everything, so a wardrobe of them is never wrong. */
export const SAFE_COLOURS: readonly string[] = ['black', 'charcoal', 'grey', 'navy', 'white', 'off_white', 'ecru'];

// ---------------------------------------------------------------------------
// Cloth
// ---------------------------------------------------------------------------

export interface Material {
  id: string;
  name: string;
  /** How warm it is to wear, 0 to 100. */
  warmth: number;
  /** How formal it reads on its own, 0 to 100. */
  formality: number;
  /** How well it survives being worn, 0 to 100. Low means it shows everything. */
  hardiness: number;
  /** Whether rain ruins it. */
  hatesRain: boolean;
  /** Whether it needs a specialist rather than a machine. */
  dryCleanOnly: boolean;
}

export const MATERIALS: readonly Material[] = [
  { id: 'cotton', name: 'Cotton', warmth: 35, formality: 40, hardiness: 70, hatesRain: false, dryCleanOnly: false },
  { id: 'linen', name: 'Linen', warmth: 12, formality: 42, hardiness: 45, hatesRain: true, dryCleanOnly: false },
  { id: 'wool', name: 'Wool', warmth: 75, formality: 72, hardiness: 66, hatesRain: false, dryCleanOnly: true },
  { id: 'worsted', name: 'Worsted Wool', warmth: 62, formality: 88, hardiness: 72, hatesRain: false, dryCleanOnly: true },
  { id: 'flannel', name: 'Flannel', warmth: 82, formality: 62, hardiness: 60, hatesRain: false, dryCleanOnly: true },
  { id: 'tweed', name: 'Tweed', warmth: 88, formality: 60, hardiness: 92, hatesRain: false, dryCleanOnly: true },
  { id: 'cashmere', name: 'Cashmere', warmth: 80, formality: 70, hardiness: 32, hatesRain: true, dryCleanOnly: true },
  { id: 'silk', name: 'Silk', warmth: 22, formality: 86, hardiness: 24, hatesRain: true, dryCleanOnly: true },
  { id: 'satin', name: 'Satin', warmth: 24, formality: 90, hardiness: 26, hatesRain: true, dryCleanOnly: true },
  { id: 'velvet', name: 'Velvet', warmth: 66, formality: 88, hardiness: 40, hatesRain: true, dryCleanOnly: true },
  { id: 'denim', name: 'Denim', warmth: 48, formality: 18, hardiness: 94, hatesRain: false, dryCleanOnly: false },
  { id: 'leather', name: 'Leather', warmth: 58, formality: 46, hardiness: 88, hatesRain: true, dryCleanOnly: true },
  { id: 'suede', name: 'Suede', warmth: 54, formality: 50, hardiness: 30, hatesRain: true, dryCleanOnly: true },
  { id: 'nylon', name: 'Nylon', warmth: 42, formality: 12, hardiness: 84, hatesRain: false, dryCleanOnly: false },
  { id: 'gore_tex', name: 'Technical Shell', warmth: 46, formality: 10, hardiness: 90, hatesRain: false, dryCleanOnly: false },
  { id: 'down', name: 'Down', warmth: 96, formality: 16, hardiness: 62, hatesRain: false, dryCleanOnly: true },
  { id: 'fleece', name: 'Fleece', warmth: 70, formality: 10, hardiness: 74, hatesRain: false, dryCleanOnly: false },
  { id: 'jersey', name: 'Jersey', warmth: 40, formality: 20, hardiness: 62, hatesRain: false, dryCleanOnly: false },
  { id: 'canvas', name: 'Canvas', warmth: 38, formality: 16, hardiness: 88, hatesRain: false, dryCleanOnly: false },
  { id: 'rubber', name: 'Rubber', warmth: 30, formality: 6, hardiness: 92, hatesRain: false, dryCleanOnly: false },
  { id: 'metal', name: 'Metal', warmth: 0, formality: 60, hardiness: 96, hatesRain: false, dryCleanOnly: false },
  { id: 'gemstone', name: 'Gemstone', warmth: 0, formality: 92, hardiness: 94, hatesRain: false, dryCleanOnly: false },
];

export const MATERIAL_BY_ID: Readonly<Record<string, Material>> = Object.fromEntries(MATERIALS.map((m) => [m.id, m]));

export function materialOf(id: string | undefined): Material {
  return MATERIAL_BY_ID[id ?? ''] ?? MATERIAL_BY_ID['cotton']!;
}

/**
 * What a thing is probably made of, from what it is called. Explicit beats
 * guessing, so anything with a material word in its name gets that; the rest
 * fall back to something reasonable for the slot.
 */
export function guessMaterial(name: string, slot: string, subcategory: string): string {
  const text = `${name} ${subcategory}`.toLowerCase();
  const named: [RegExp, string][] = [
    [/swimsuit|swim shorts|swim trunks|bikini|bathing suit|board short|rash guard/, 'nylon'],
    [/cashmere/, 'cashmere'], [/linen/, 'linen'], [/silk|charmeuse/, 'silk'], [/satin/, 'satin'],
    [/velvet/, 'velvet'], [/tweed/, 'tweed'], [/flannel/, 'flannel'], [/worsted/, 'worsted'],
    [/denim|jean|trucker/, 'denim'], [/leather|cordovan/, 'leather'], [/suede/, 'suede'],
    [/wax|waxed|waxwear/, 'canvas'],
    [/down|puffer|nuptse|parka/, 'down'], [/fleece/, 'fleece'], [/gore|shell|technical|waterproof/, 'gore_tex'],
    [/nylon|re-nylon/, 'nylon'], [/canvas/, 'canvas'], [/wool|merino|lambswool/, 'wool'],
    [/rubber|clog|flip flop/, 'rubber'], [/cotton|poplin|oxford|jersey|t-shirt|polo/, 'cotton'],
    // A suit is worsted and a gown is silk unless the name says otherwise, and
    // both of them go to the cleaner rather than into a machine.
    [/tuxedo|dinner jacket|dinner suit|tailcoat|suit|blazer/, 'worsted'],
    [/gown|couture|bandage dress|dress/, 'silk'],
  ];
  for (const [pattern, material] of named) if (pattern.test(text)) return material;
  switch (slot) {
    case 'outfit': return 'worsted';
    case 'watch': return 'metal';
    case 'earrings': case 'necklace': case 'ring': case 'bracelet': case 'jewellery': return 'gemstone';
    case 'shoes': return 'leather';
    case 'bag': return 'leather';
    case 'belt': return 'leather';
    case 'outerwear': return 'wool';
    case 'socks': return 'wool';
    default: return 'cotton';
  }
}

// ---------------------------------------------------------------------------
// What the room expects
// ---------------------------------------------------------------------------

export interface DressCode {
  id: string;
  name: string;
  /** The formality band it wants. Outside it, the mirror says so. */
  floor: number;
  ceiling: number;
  /** Slots it really wants filled. */
  wants: Slot[];
  /** What it does not want to see. */
  avoidMaterials: string[];
  /** One line on what it actually means, said before you leave. */
  note: string;
}

export const DRESS_CODES: readonly DressCode[] = [
  { id: 'white_tie', name: 'White Tie', floor: 96, ceiling: 100, wants: ['outfit', 'shoes', 'watch'], avoidMaterials: ['denim', 'fleece', 'nylon', 'gore_tex', 'rubber'], note: 'Tails, or the most formal thing you own. There’s no upper limit and there’s a hard floor.' },
  { id: 'black_tie', name: 'Black Tie', floor: 90, ceiling: 100, wants: ['outfit', 'shoes'], avoidMaterials: ['denim', 'fleece', 'nylon', 'gore_tex', 'rubber', 'canvas'], note: 'A dinner suit or a long dress. Not a dark lounge suit, whatever anybody tells you.' },
  { id: 'black_tie_optional', name: 'Black Tie Optional', floor: 80, ceiling: 100, wants: ['outfit', 'shoes'], avoidMaterials: ['denim', 'fleece', 'nylon', 'rubber'], note: 'Black tie if you have it, your darkest suit if you don’t. Nobody minds which.' },
  { id: 'formal', name: 'Formal', floor: 74, ceiling: 96, wants: ['top', 'bottom', 'shoes'], avoidMaterials: ['denim', 'fleece', 'nylon', 'rubber'], note: 'A suit, or something with the same weight to it.' },
  { id: 'mourning', name: 'Mourning', floor: 70, ceiling: 96, wants: ['top', 'bottom', 'shoes'], avoidMaterials: ['denim', 'fleece', 'nylon', 'rubber'], note: 'Dark, plain, and not about you.' },
  { id: 'cocktail', name: 'Cocktail', floor: 66, ceiling: 92, wants: ['outfit', 'shoes'], avoidMaterials: ['denim', 'fleece', 'gore_tex', 'rubber'], note: 'Short and sharp. Dressed up, not dressed for a wedding.' },
  { id: 'business', name: 'Business', floor: 62, ceiling: 88, wants: ['top', 'bottom', 'shoes'], avoidMaterials: ['denim', 'fleece', 'rubber'], note: 'The room is deciding whether to give you money. Look like the answer is yes.' },
  { id: 'business_casual', name: 'Business Casual', floor: 44, ceiling: 74, wants: ['top', 'bottom', 'shoes'], avoidMaterials: ['fleece', 'rubber'], note: 'A collar and something that isn’t jeans. That’s the whole rule.' },
  { id: 'smart_casual', name: 'Smart Casual', floor: 34, ceiling: 66, wants: ['top', 'bottom', 'shoes'], avoidMaterials: ['fleece'], note: 'Looks like you thought about it for four minutes rather than none.' },
  { id: 'casual', name: 'Casual', floor: 8, ceiling: 52, wants: ['top', 'bottom', 'shoes'], avoidMaterials: [], note: 'Wear what you like. Turning up in a dinner suit is its own statement.' },
  { id: 'athletic', name: 'Athletic', floor: 2, ceiling: 30, wants: ['top', 'bottom', 'shoes'], avoidMaterials: ['silk', 'satin', 'velvet', 'cashmere', 'worsted'], note: 'Something you can sweat in and wash afterwards.' },
  { id: 'beach', name: 'Beach', floor: 0, ceiling: 30, wants: ['top', 'shoes'], avoidMaterials: ['wool', 'worsted', 'tweed', 'down', 'velvet'], note: 'Sand gets into everything. Bring nothing you’d miss.' },
  { id: 'red_carpet', name: 'Red Carpet', floor: 92, ceiling: 100, wants: ['outfit', 'shoes', 'jewellery'], avoidMaterials: ['denim', 'fleece', 'nylon', 'gore_tex', 'rubber', 'canvas'], note: 'Photographed from four feet away by people who do this for a living. Everything shows.' },
];

export const DRESS_CODE_BY_ID: Readonly<Record<string, DressCode>> = Object.fromEntries(DRESS_CODES.map((d) => [d.id, d]));

/** What an occasion actually asks for. */
export const OCCASION_CODE: Readonly<Record<string, string>> = {
  premiere: 'red_carpet', awards: 'red_carpet', gala: 'black_tie', charity_gala: 'black_tie',
  wedding: 'formal', funeral: 'mourning', memorial: 'mourning',
  party: 'cocktail', club: 'cocktail', opening: 'cocktail', fashion_show: 'cocktail',
  meeting: 'business', pitch: 'business', interview: 'business', bank: 'business',
  office: 'business_casual', lunch: 'business_casual',
  date: 'smart_casual', dinner: 'smart_casual', drinks: 'smart_casual', theatre: 'smart_casual',
  cinema: 'casual', shopping: 'casual', errand: 'casual', home: 'casual', shoot_day: 'casual',
  gym: 'athletic', run: 'athletic', training: 'athletic',
  beach: 'beach', pool: 'beach',
};

export function codeFor(occasion: string): DressCode {
  return DRESS_CODE_BY_ID[OCCASION_CODE[occasion] ?? 'casual'] ?? DRESS_CODE_BY_ID['casual']!;
}
