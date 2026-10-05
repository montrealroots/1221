/**
 * SLATE — the hierarchy every brand-based catalog is counted by (the owner's
 * expansion of 2026-10-03, §E3, and its restatement of 2026-10-05). Departments
 * hold categories; a category is the unit the target applies to, never a
 * department or the whole game.
 *
 * The target for a brand-based category: at least 50 real brands, and at least
 * 100 distinct real products from each where the brand makes that many, 5,000 a
 * category, a floor and not a ceiling. A service category (hotels, restaurants,
 * clubs, clinics, stores) is counted by providers, branches and bookable
 * offerings instead, and a category whose real market is narrow (aircraft,
 * boats, home consoles) keeps its real range and says so.
 * `tools/catalog-coverage.mjs` counts each one from the catalogs themselves into
 * `docs/CATALOG-COVERAGE.md`; nothing here is a count.
 *
 * A product is one distinct model; a variant is a size, color, storage or trim
 * of it; an offer is one seller's listing of it; an owned item is what a player
 * bought. They're counted apart, so a shoe in ten sizes sold by five retailers is
 * one product, ten variants and five offers. Owned items live in each save, and
 * the report names the record a purchase makes instead (`owned`).
 *
 * Until 2026-10-05 the hierarchy had 45 categories, and it joined what the owner
 * names apart: underwear with lingerie and socks, every shoe in one category
 * beside a Sneakers that held only the Air Jordan line, toiletries with grooming
 * and haircare, bicycles with ATVs, tires with wheels, cleaning with household
 * paper, pet food with pet supplies. Each is its own category now, read from the
 * same catalogs (`clothingCategoryOf`, `footwearStyleOf`).
 */

export type CategoryStructure = 'brand' | 'service' | 'narrow';

/**
 * The steps an owned item's life can take (§E8): each one a player takes by a
 * command, or the game takes on its own by a scheduled kind (a delivery). Only
 * the steps that make sense for a category are named; a step that fits and
 * isn't built is in its `missing`.
 */
export type LifeStep = 'purchase' | 'delivery' | 'collection' | 'carrying' | 'installation' | 'assembly' | 'activation' | 'storage'
  | 'use' | 'consumption' | 'cleaning' | 'maintenance' | 'alteration' | 'repair' | 'return' | 'resale' | 'gifting' | 'packing'
  | 'recycling' | 'disposal';

export const LIFE_STEPS: readonly LifeStep[] = ['purchase', 'delivery', 'collection', 'carrying', 'installation', 'assembly', 'activation', 'storage', 'use',
  'consumption', 'cleaning', 'maintenance', 'alteration', 'repair', 'return', 'resale', 'gifting', 'packing', 'recycling', 'disposal'];

export interface CatalogCategory {
  id: string;
  department: string;
  label: string;
  structure: CategoryStructure;
  /** What the narrow market really holds, where it can't reach the brand target. */
  realRange?: string;
  /** The record buying one makes: a garment, a device, a vehicle, a consumable... */
  owned?: string;
  /**
   * Each step an owned one takes, by the command the screens send for it or the
   * scheduled kind that does it; `tools/catalog-coverage.mjs` fails a kind the
   * engine doesn't register, and a command no screen sends.
   */
  steps?: Partial<Record<LifeStep, string>>;
  /** The steps that fit it and aren't built. */
  missing?: readonly LifeStep[];
  /** What else is short, in a sentence: the catalog's and the life's. */
  gaps?: string;
}

export const BRAND_TARGET = { brands: 50, productsPerBrand: 100 } as const;

/** A garment's life, from the clothing catalog: bought in store, delivered or collected, carried home, worn, washed, altered, packed, returned, sold on or given. */
const GARMENT: Partial<Record<LifeStep, string>> = {
  purchase: 'clothes.buy', delivery: 'items.order_arrives', collection: 'clothes.collect_order', carrying: 'items.put_away', storage: 'items.move',
  use: 'clothes.dress', cleaning: 'life.look_after', alteration: 'clothes.alter', return: 'clothes.return', resale: 'clothes.sell', gifting: 'items.give',
  packing: 'luggage.pack',
};
/** A garment can't be thrown away, given to a charity shop or mended: `items.discard` takes furniture to the council's collection only. */
const GARMENT_MISSING: readonly LifeStep[] = ['repair', 'recycling', 'disposal'];
/** A shoe, bag or accessory is bought, delivered, worn and sold as a garment is, but isn't altered. */
const WORN: Partial<Record<LifeStep, string>> = { ...GARMENT };
delete WORN.alteration;
/** A road vehicle: a factory order delivered on the date `vehicle.buy` sets, driven on errands, filled, serviced, mended and sold. */
const VEHICLE: Partial<Record<LifeStep, string>> = {
  purchase: 'vehicle.buy', delivery: 'vehicle.buy', use: 'errand.go', consumption: 'vehicle.refuel', maintenance: 'vehicle.service', repair: 'vehicle.repair',
  resale: 'vehicle.sell', storage: 'vehicle.keep_in',
};
/** A bicycle, e-bike or ATV is ridden for its own sake, not on errands (`forOutings` in `systems/vehicles.ts`), and takes no fuel. */
const OUTING: Partial<Record<LifeStep, string>> = { purchase: 'vehicle.buy', use: 'life.look_after', resale: 'vehicle.sell' };
const CONSUMABLE = (purchase: string, use: string): Partial<Record<LifeStep, string>> => ({ purchase, delivery: 'items.order_arrives', carrying: 'items.put_away', storage: 'items.move', consumption: use });

export const CATEGORIES: readonly CatalogCategory[] = [
  // Apparel. Maternity, petite, tall and plus are fit lines across these, not categories of their own (`fitLines`).
  { id: 'everyday', department: 'Apparel', label: 'Everyday Clothing', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'designer', department: 'Apparel', label: 'Designer Fashion', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING,
    gaps: 'A designer house is one on the Paris, Milan, London or New York ready-to-wear calendar, SLATE\'s reading of those calendars (`DESIGNER_HOUSES`); their resale against the price new is unpublished, so a piece sells on as any garment does.' },
  { id: 'formalwear', department: 'Apparel', label: 'Formalwear', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'outerwear', department: 'Apparel', label: 'Outerwear', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'activewear', department: 'Apparel', label: 'Activewear', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'underwear', department: 'Apparel', label: 'Underwear', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'lingerie', department: 'Apparel', label: 'Bras And Lingerie', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'shapewear', department: 'Apparel', label: 'Shapewear And Slips', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'hosiery', department: 'Apparel', label: 'Socks And Hosiery', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'thermals', department: 'Apparel', label: 'Thermals And Base Layers', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'sleepwear', department: 'Apparel', label: 'Sleepwear', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'swimwear', department: 'Apparel', label: 'Swimwear', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  { id: 'cultural', department: 'Apparel', label: 'Cultural Clothing', structure: 'brand', owned: 'a garment', steps: GARMENT, missing: GARMENT_MISSING },
  // Footwear, by the style its name says (`footwearStyleOf`).
  { id: 'sneakers', department: 'Footwear', label: 'Sneakers', structure: 'brand', owned: 'a pair of shoes', steps: WORN, missing: GARMENT_MISSING,
    gaps: 'The Air Jordans add GOAT\'s new and used asks in America (`sneakers.buy`, `sneakers.sell`); a sole worn through isn\'t kept.' },
  { id: 'dress-shoes', department: 'Footwear', label: 'Dress Shoes', structure: 'brand', owned: 'a pair of shoes', steps: WORN, missing: GARMENT_MISSING },
  { id: 'boots', department: 'Footwear', label: 'Boots', structure: 'brand', owned: 'a pair of shoes', steps: WORN, missing: GARMENT_MISSING },
  { id: 'sandals', department: 'Footwear', label: 'Sandals And Slides', structure: 'brand', owned: 'a pair of shoes', steps: WORN, missing: GARMENT_MISSING },
  { id: 'footwear-other', department: 'Footwear', label: 'Other Footwear', structure: 'brand', owned: 'a pair of shoes', steps: WORN, missing: GARMENT_MISSING },
  // Accessories
  { id: 'bags', department: 'Accessories', label: 'Bags', structure: 'brand', owned: 'a bag, worn as an accessory', steps: WORN, missing: GARMENT_MISSING },
  { id: 'accessories', department: 'Accessories', label: 'Hats, Scarves, Belts And Small Accessories', structure: 'brand', owned: 'an accessory', steps: WORN, missing: GARMENT_MISSING },
  { id: 'watches', department: 'Accessories', label: 'Watches', structure: 'brand', owned: 'a watch, worn', steps: { ...WORN, maintenance: 'watch.service', repair: 'watch.battery' }, missing: ['recycling', 'disposal'] },
  { id: 'jewelry', department: 'Accessories', label: 'Jewelry', structure: 'brand', owned: 'a piece, worn', steps: { ...WORN, storage: 'valuables.lock_up', alteration: 'jewelry.engrave' }, missing: ['repair', 'recycling', 'disposal'],
    gaps: 'Pawned as well as sold (`pawn.pledge`); commissioned from a named jeweler (`jewelry.commission`).' },
  { id: 'luggage', department: 'Accessories', label: 'Luggage', structure: 'brand', owned: 'a bag that holds its liters', steps: { purchase: 'luggage.buy', delivery: 'items.order_arrives', storage: 'items.move', use: 'luggage.take', packing: 'luggage.pack', gifting: 'items.give' },
    missing: ['return', 'resale', 'repair', 'disposal'], gaps: 'A bag lost by the airline isn\'t kept.' },
  // Electronics
  { id: 'phones', department: 'Electronics', label: 'Phones', structure: 'brand', owned: 'a device on a line', steps: { purchase: 'phone.buy', activation: 'phone.activate', use: 'phone.activate', maintenance: 'phone.battery', repair: 'phone.claim', gifting: 'items.give' },
    missing: ['return', 'resale', 'recycling'], gaps: 'Traded in only against a new phone; most makers sell through carriers, which the maker\'s-own-store rule leaves out.' },
  { id: 'computers', department: 'Electronics', label: 'Computers', structure: 'brand', gaps: 'Nothing a computer does was built, so none is sold.' },
  { id: 'tablets', department: 'Electronics', label: 'Tablets And E-Readers', structure: 'brand', owned: 'an e-reader, read on', steps: { purchase: 'reading.buy', use: 'life.look_after' },
    missing: ['return', 'resale', 'repair'], gaps: 'E-readers only, unbranded in the catalog; no tablet.' },
  { id: 'televisions', department: 'Electronics', label: 'Televisions', structure: 'brand', owned: 'the home\'s TV', steps: { purchase: 'tv.buy', use: 'tv.watch' },
    missing: ['delivery', 'installation', 'repair', 'resale', 'disposal'] },
  { id: 'audio', department: 'Electronics', label: 'Audio Equipment', structure: 'brand', gaps: 'Headphones and speakers aren\'t sold.' },
  { id: 'consoles', department: 'Electronics', label: 'Game Consoles', structure: 'narrow', realRange: 'three makers sell home consoles: Sony, Microsoft and Nintendo', owned: 'a console', steps: { purchase: 'home.console', use: 'life.look_after' },
    missing: ['resale', 'repair'] },
  { id: 'gaming', department: 'Electronics', label: 'Video Games And Gaming Accessories', structure: 'brand', owned: 'a game', steps: { purchase: 'home.buy_game', use: 'life.look_after' },
    missing: ['resale'], gaps: 'Nintendo\'s own games only: Sony\'s and Microsoft\'s stores weren\'t read, and no accessory is sold.' },
  // Home
  { id: 'furniture', department: 'Home', label: 'Furniture', structure: 'brand', owned: 'a piece that stands in a room', steps: { purchase: 'home.buy_piece', assembly: 'items.assemble', storage: 'items.move', use: 'social.host', resale: 'home.sell_back', disposal: 'items.discard' },
    missing: ['cleaning', 'repair'], gaps: 'IKEA alone.' },
  { id: 'mattresses', department: 'Home', label: 'Mattresses And Beds', structure: 'brand', owned: 'a bed or mattress', steps: { purchase: 'home.buy_piece', use: 'life.sleep', maintenance: 'home.replace_mattress', disposal: 'items.discard' },
    missing: ['cleaning', 'resale'], gaps: 'IKEA alone.' },
  { id: 'bedding', department: 'Home', label: 'Bedding And Towels', structure: 'brand', gaps: 'Towels are given at the start and can\'t be bought; bedding isn\'t kept.' },
  { id: 'appliances', department: 'Home', label: 'Major Appliances', structure: 'brand', owned: 'a machine fitted at home', steps: { purchase: 'home.fit', installation: 'home.fit', use: 'life.look_after', repair: 'home.repair_machine' },
    missing: ['resale', 'disposal'], gaps: 'Washers, dryers and dishwashers by make and model; a fridge or cooker is the home\'s own.' },
  { id: 'small-appliances', department: 'Home', label: 'Small Kitchen Appliances', structure: 'brand', owned: 'kitchen gear', steps: { purchase: 'food.buy_gear', use: 'food.cook' },
    missing: ['return', 'repair', 'disposal'], gaps: 'A blender and a slow cooker in each market, their brand kept in the name only.' },
  { id: 'kitchenware', department: 'Home', label: 'Cookware And Kitchenware', structure: 'brand', gaps: 'A kitchen\'s pans and knives aren\'t kept.' },
  { id: 'lighting', department: 'Home', label: 'Lighting', structure: 'brand', gaps: 'Lighting is inside the electricity bill, with no fixture sold.' },
  { id: 'household-equipment', department: 'Home', label: 'Household Equipment', structure: 'brand', gaps: 'Vacuums, irons, fans and heaters aren\'t sold.' },
  { id: 'home-security', department: 'Home', label: 'Safes And Home Security', structure: 'brand', owned: 'a safe, or the home\'s alarm', steps: { purchase: 'valuables.buy_safe', installation: 'home.alarm', storage: 'valuables.lock_up', use: 'valuables.take_out' },
    missing: ['resale'], gaps: 'Safes and an alarm kit, their brands in their names only; window locks and light timers by `home.security`.' },
  // Personal care
  { id: 'toiletries', department: 'Personal Care', label: 'Toiletries', structure: 'brand', owned: 'a bottle or pack used up', steps: CONSUMABLE('hygiene.buy', 'life.look_after') },
  { id: 'haircare', department: 'Personal Care', label: 'Haircare', structure: 'brand', owned: 'a bottle used up', steps: CONSUMABLE('hygiene.buy', 'life.look_after'), gaps: 'Shampoo and conditioner; no styling product.' },
  { id: 'shaving', department: 'Personal Care', label: 'Shaving And Grooming', structure: 'brand', owned: 'razors and cream used up', steps: CONSUMABLE('hygiene.buy', 'hygiene.shave_every') },
  { id: 'cosmetics', department: 'Personal Care', label: 'Cosmetics And Skincare', structure: 'brand', gaps: 'Makeup and skincare weren\'t read at any chain.' },
  // Household
  { id: 'cleaning', department: 'Household', label: 'Laundry And Cleaning Products', structure: 'brand', owned: 'a supply used up', steps: CONSUMABLE('hygiene.buy', 'life.look_after') },
  { id: 'consumables', department: 'Household', label: 'Household Paper And Consumables', structure: 'brand', owned: 'a supply', steps: { purchase: 'hygiene.buy', carrying: 'items.put_away', storage: 'items.move' },
    missing: ['consumption'], gaps: 'Paper towels, sponges and bin bags are bought and kept, never used up: how fast they go isn\'t published; toilet paper is used up.' },
  // Food
  { id: 'groceries', department: 'Food', label: 'Groceries', structure: 'brand', owned: 'food in the kitchen', steps: { ...CONSUMABLE('food.buy_groceries', 'food.cook'), use: 'food.eat_ready' } },
  { id: 'beverages', department: 'Food', label: 'Beverages', structure: 'brand', owned: 'drink in the kitchen', steps: CONSUMABLE('food.buy_groceries', 'food.drink_home') },
  // Vehicles
  { id: 'cars', department: 'Vehicles', label: 'Cars, Pickups And Vans', structure: 'brand', owned: 'a vehicle', steps: VEHICLE, missing: ['cleaning'] },
  { id: 'motorcycles', department: 'Vehicles', label: 'Motorcycles And Scooters', structure: 'brand', owned: 'a vehicle', steps: VEHICLE, missing: ['cleaning'] },
  { id: 'bicycles', department: 'Vehicles', label: 'Bicycles And E-Bikes', structure: 'brand', owned: 'a vehicle ridden for its own sake', steps: OUTING, missing: ['maintenance', 'repair'] },
  { id: 'atvs', department: 'Vehicles', label: 'ATVs', structure: 'brand', owned: 'a vehicle ridden for its own sake', steps: OUTING, missing: ['maintenance', 'repair'] },
  { id: 'rvs', department: 'Vehicles', label: 'Motorhomes And Campervans', structure: 'brand', owned: 'a vehicle', steps: VEHICLE, missing: ['cleaning'] },
  { id: 'boats', department: 'Vehicles', label: 'Boats', structure: 'narrow', realRange: 'recreational boat makers number in the dozens, few publishing prices', owned: 'a boat', steps: { purchase: 'boat.buy', resale: 'boat.sell' } },
  { id: 'aircraft', department: 'Vehicles', label: 'Light Aircraft', structure: 'narrow', realRange: 'a handful of makers build new light aircraft for private owners', owned: 'an aircraft', steps: { purchase: 'aircraft.buy', resale: 'aircraft.sell' } },
  { id: 'car-options', department: 'Vehicles', label: 'Factory Options', structure: 'brand', owned: 'kept with the car', steps: { purchase: 'vehicle.buy' } },
  { id: 'tires', department: 'Vehicles', label: 'Tires', structure: 'brand', owned: 'a set on the car', steps: { purchase: 'vehicle.replace_tires', installation: 'vehicle.replace_tires', use: 'errand.go' },
    gaps: 'A set at each market\'s named retailer, unbranded; winter tires by `vehicle.winter_tires`.' },
  { id: 'wheels', department: 'Vehicles', label: 'Wheels', structure: 'brand', owned: 'fitted to the car', steps: { purchase: 'vehicle.modify', installation: 'vehicle.modify' }, gaps: 'One set of alloys in Britain and America, unbranded.' },
  { id: 'car-parts', department: 'Vehicles', label: 'Aftermarket Parts', structure: 'brand', owned: 'fitted to the car', steps: { purchase: 'vehicle.modify', installation: 'vehicle.modify' },
    gaps: 'A body kit, LED bulbs, an exhaust and lowering springs, unbranded, in Britain and America.' },
  { id: 'car-audio', department: 'Vehicles', label: 'Car Audio', structure: 'brand', owned: 'fitted to the car', steps: { purchase: 'vehicle.audio', installation: 'vehicle.audio' }, gaps: 'One head unit, speakers and an amplifier a market, their brands in their names only.' },
  { id: 'upholstery', department: 'Vehicles', label: 'Upholstery Materials', structure: 'brand', owned: 'the car\'s interior', steps: { purchase: 'vehicle.interior', installation: 'vehicle.interior_fit' }, gaps: 'Seven materials from named suppliers, sold by the yard or foot.' },
  { id: 'car-accessories', department: 'Vehicles', label: 'Vehicle Accessories', structure: 'brand', owned: 'a rack or box on the car', steps: { purchase: 'vehicle.roof_box', installation: 'vehicle.roof_box_fit', storage: 'items.move' } },
  // Building, garden, sport, pets
  { id: 'building-materials', department: 'Building And Garden', label: 'Building Materials', structure: 'brand', gaps: 'A build and a project are priced whole, not by material.' },
  { id: 'fixtures', department: 'Building And Garden', label: 'Fixtures', structure: 'brand', gaps: 'Taps, sinks, toilets and showers aren\'t sold apart from a project.' },
  { id: 'finishes', department: 'Building And Garden', label: 'Finishes', structure: 'brand', gaps: 'Paint, flooring and tiles aren\'t sold apart from a project.' },
  { id: 'garden', department: 'Building And Garden', label: 'Garden Equipment', structure: 'brand', gaps: 'A raised bed and a greenhouse are built at the cost guides\' prices, unbranded (`garden.plant`); a mower or a tool isn\'t sold.' },
  { id: 'sports', department: 'Sport', label: 'Sports Equipment', structure: 'brand', gaps: 'Balls, rackets and weights aren\'t sold.' },
  { id: 'pet-food', department: 'Pets', label: 'Pet Food', structure: 'brand', owned: 'a bag fed from', steps: { purchase: 'pets.buy', delivery: 'items.order_arrives', consumption: 'pets.feed' } },
  { id: 'pet-supplies', department: 'Pets', label: 'Pet Supplies', structure: 'brand', owned: 'litter used up', steps: { purchase: 'pets.buy', delivery: 'items.order_arrives' },
    gaps: 'Litter alone, unbranded; no carrier, bed or lead.' },
  // Services, counted by providers and branches
  { id: 'hotels', department: 'Services', label: 'Hotels', structure: 'service' },
  { id: 'restaurants', department: 'Services', label: 'Restaurants', structure: 'service' },
  { id: 'clubs', department: 'Services', label: 'Clubs And Lessons', structure: 'service' },
  { id: 'gyms', department: 'Services', label: 'Gyms And Studios', structure: 'service' },
  { id: 'clinics', department: 'Services', label: 'Clinics, Dentists And Opticians', structure: 'service' },
  { id: 'vets', department: 'Services', label: 'Vets', structure: 'service' },
  { id: 'stores', department: 'Services', label: 'Stores And Chains', structure: 'service' },
  { id: 'salons', department: 'Services', label: 'Barbers And Salons', structure: 'service' },
  { id: 'tailors', department: 'Services', label: 'Tailors', structure: 'service' },
  { id: 'dealers', department: 'Services', label: 'Car Dealers', structure: 'service' },
  { id: 'car-shops', department: 'Services', label: 'Car Repair Shops', structure: 'service' },
  { id: 'fuel', department: 'Services', label: 'Fuel Stations And Chargers', structure: 'service' },
  { id: 'parking', department: 'Services', label: 'Parking Garages', structure: 'service' },
  { id: 'roadside', department: 'Services', label: 'Breakdown Cover', structure: 'service' },
];

/**
 * The houses whose clothes are Designer Fashion: each shows its ready-to-wear on
 * the official calendar of Paris (FHCM), Milan (CNMI), London (BFC) or New York
 * (CFDA). SLATE's reading of those calendars, not a read of them; their shoes,
 * bags, watches and jewelry stay in those categories.
 */
export const DESIGNER_HOUSES: ReadonlySet<string> = new Set([
  'Alexander McQueen', 'Balenciaga', 'Bottega Veneta', 'Burberry', 'Celine', 'Chanel', 'Christian Dior', 'Dior', 'Dolce & Gabbana', 'Erdem', 'Fendi',
  'GIVENCHY', 'Givenchy', 'Gucci', 'Isabel Marant', 'Jacquemus', 'JW Anderson', 'Loewe', 'Louis Vuitton', 'Marc Jacobs', 'Moncler', 'Paul Smith',
  'Philipp Plein', 'Prada', 'Ralph Lauren Purple Label', 'Saint Laurent', 'Simone Rocha', 'Stella McCartney', 'Tom Ford', 'Valentino', 'Versace',
  'Vivienne Westwood',
]);

/** The footwear categories, by style. */
export type FootwearStyle = 'sneakers' | 'dress-shoes' | 'boots' | 'sandals' | 'footwear-other';
export const FOOTWEAR_STYLE_LABEL: Readonly<Record<FootwearStyle, string>> = {
  sneakers: 'Sneakers', 'dress-shoes': 'Dress Shoes', boots: 'Boots', sandals: 'Sandals And Slides', 'footwear-other': 'Other Footwear',
};

/**
 * The words that say a shoe's style, in English and the Mexican stores' Spanish: each one decides a real product's
 * style, read on 2026-10-05, where no other word or its filing would. Flip-flops, slides, a botín or a Wellington are
 * filed by their retailers so, and the words came out.
 */
const STYLE_WORDS: readonly [FootwearStyle, RegExp][] = [
  ['sandals', /\b(sandals?|sandalias?|chanclas?)\b/],
  ['sneakers', /\b(tenis|sneakers?|trainers?|running shoes?|runners?|air force 1|samba|deportivo|chuck|high tops?|low tops?|athletic)\b/],
  ['boots', /\b(boots?|chelsea)\b/],
  ['dress-shoes', /\b(oxfords?|derby|loafers?|pumps?|heels?|kitten|vestir|choclo|dress shoes?)\b/],
];

/**
 * A shoe's style from its name, else from what its retailer files it under: a
 * sandal, flip-flop or slide; a sneaker, trainer or running shoe (a "tenis de
 * bota" is a high-top sneaker); a boot; an oxford, derby, loafer, heel or pump,
 * as a dress shoe; else a slipper, clog, mule, flat or espadrille. In Mexico a
 * zapatilla is a woman's pump. A name is read before the filing: OluKai files
 * its sandals as "Men's Beach Sandals" under names that say none. A filing
 * that joins several ("shoes, heels and slippers", M&S's and Arnotts') names
 * none of them.
 */
export function footwearStyleOf(name: string, market?: string, filed?: string | null): FootwearStyle {
  const one = filed && !/,|&|\band\b/.test(filed) ? filed : '';
  for (const text of [name, one]) {
    const n = text.toLowerCase();
    for (const [style, re] of STYLE_WORDS) if (re.test(n)) return style;
    if (market === 'MX' && /\bzapatillas?\b/.test(n)) return 'dress-shoes';
  }
  return 'footwear-other';
}

/** What `clothingCategoryOf` reads of a clothing product. */
export interface ClothingLike { category: string; subcategory: string | null; kind: string; subtype: string | null; brand: string; name: string; market: string }

/**
 * The category a clothing product is counted in: its retailer's own filing,
 * where that's one category already, else what it is. Cultural clothing stays
 * one category whatever the garment; a shoe is its style's; underwear, a bra, a
 * slip or shapewear, socks or tights, and a thermal are each their own; a
 * designer house's clothes are Designer Fashion.
 */
export function clothingCategoryOf(p: ClothingLike): string {
  if (p.category === 'cultural' || p.subtype === 'cultural') return 'cultural';
  if (p.kind === 'shoes') return footwearStyleOf(p.name, p.market, p.subcategory);
  if (p.category === 'watches' || p.category === 'jewelry' || p.category === 'bags' || p.category === 'accessories') return p.category;
  if (p.kind === 'swimsuit' || p.category === 'swimwear') return 'swimwear';
  if (p.category === 'thermals' || p.kind.startsWith('thermal')) return 'thermals';
  if (p.category === 'shapewear' || p.category === 'slips' || p.kind === 'slip') return 'shapewear';
  if (p.kind === 'bra') return 'lingerie';
  if (p.kind === 'socks' || p.category === 'hosiery') return 'hosiery';
  if (p.kind === 'underwear' || p.category === 'underwear' || p.category === 'underwear and socks') return 'underwear';
  if (p.category === 'sleepwear' || p.kind === 'pajamas') return 'sleepwear';
  if (DESIGNER_HOUSES.has(p.brand)) return 'designer';
  return p.category;
}
