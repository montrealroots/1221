/**
 * SLATE — the ordinary rooms.
 *
 * The salon, the chemist, the post office and the launderette. Two minutes of
 * play each, and between them most of what makes a week feel like a week.
 *
 * The chains and the postal operators are real companies trading where they
 * really trade — including the countries where a pharmacy is required by law
 * to be independently owned, which is why there is no chain on the corner in
 * Germany or France. What a cut costs, what a parcel costs, how long the post
 * takes and what is on the shelf are SLATE's own calibration.
 *
 * Nothing here is medical advice. The counter sells the ordinary things a
 * counter sells, by the plain name of the thing, with no dose, no claim and
 * no instruction attached to any of it.
 */

import type { Money } from '../core/money';

/**
 * What a chemist's counter is and is not.
 *
 * Shown in the room, so it says only what that room needs: whose shop it is,
 * why some countries have no chains, and that a name on a shelf is a name and
 * nothing more.
 */
export const PHARMACY_NOTE =
  'The chains are real companies trading where they really trade, and where a country requires its '
  + 'pharmacies to be independently owned there’s no chain — that’s the law there, not an omission. '
  + 'Every price and everything on a shelf is SLATE’s own calibration. What is on the counter isn’t '
  + 'medical advice: it’s the plain name of an ordinary thing, with no dose and no claim attached.';

/** What a post office counter is and is not. */
export const POST_NOTE =
  'The postal operators are real companies carrying the post where they really carry it. Every price, '
  + 'every waiting time and every parcel that goes astray is SLATE’s own calibration, not a published '
  + 'service record.';

/** Both of the above, for anywhere that has to state the whole claim at once. */
export const ERRAND_NOTE = `${PHARMACY_NOTE} ${POST_NOTE}`;

// ---------------------------------------------------------------------------
// The chemist
// ---------------------------------------------------------------------------

export interface PharmacyChain {
  id: string;
  name: string;
  /** Countries it really trades in, by the geography's country ids. */
  countryIds: readonly string[];
  about: string;
}

const ph = (id: string, name: string, countryIds: readonly string[], about: string): PharmacyChain =>
  ({ id, name, countryIds, about });

/**
 * The chains.
 *
 * Public record: the company exists and has pharmacies or drugstores in those
 * countries. SLATE's own: which branch is where, what is on its shelves and
 * what any of it costs.
 */
export const PHARMACY_CHAINS: readonly PharmacyChain[] = [
  ph('cvs', 'CVS Pharmacy', ['us'], 'The drugstore on the corner of half the intersections in America.'),
  ph('walgreens', 'Walgreens', ['us'], 'The other American drugstore, usually across the road from the first.'),
  ph('boots', 'Boots', ['uk', 'ie'], 'The British chemist, on every high street since the nineteenth century.'),
  ph('superdrug', 'Superdrug', ['uk'], 'The cheaper British one, more cosmetics than medicine.'),
  ph('shoppers', 'Shoppers Drug Mart', ['ca'], 'The Canadian chain, open late and selling most of a supermarket.'),
  ph('londondrugs', 'London Drugs', ['ca'], 'A western Canadian chain that also sells cameras and televisions.'),
  ph('chemistwarehouse', 'Chemist Warehouse', ['au', 'nz'], 'The Australian discounter, stacked to the ceiling and priced accordingly.'),
  ph('priceline', 'Priceline Pharmacy', ['au'], 'An Australian chain, more of a beauty hall with a dispensary at the back.'),
  ph('unichem', 'Unichem', ['nz'], 'A New Zealand pharmacy group.'),
  ph('etos', 'Etos', ['nl'], 'The Dutch drugstore chain.'),
  ph('kruidvat', 'Kruidvat', ['nl', 'be'], 'The low-priced Dutch and Belgian chain.'),
  ph('apotekhjartat', 'Apotek Hjärtat', ['se'], 'A Swedish pharmacy chain.'),
  ph('apoteket', 'Apoteket', ['se'], 'The old Swedish state pharmacy, still the largest there.'),
  ph('apotek1', 'Apotek 1', ['no'], 'The largest Norwegian chain.'),
  ph('yliopiston', 'Yliopiston Apteekki', ['fi'], 'The university pharmacy, and the biggest in Finland.'),
  ph('rossmann', 'Rossmann', ['pl', 'hu', 'cz'], 'A German drugstore group with a large presence across central Europe.'),
  ph('superpharm', 'Super-Pharm', ['pl', 'il'], 'A chain in Poland and Israel.'),
  ph('guadalajara', 'Farmacias Guadalajara', ['mx'], 'The Mexican chain, a great many of them open all night.'),
  ph('delahorro', 'Farmacias del Ahorro', ['mx'], 'Another Mexican chain, and a doctor in a booth beside the counter.'),
  ph('drogaraia', 'Droga Raia', ['br'], 'A Brazilian chain.'),
  ph('drogasil', 'Drogasil', ['br'], 'The other Brazilian one, from the same group.'),
  ph('farmacity', 'Farmacity', ['ar'], 'The Argentine chain, open late on Corrientes and everywhere else.'),
  ph('cruzverde', 'Cruz Verde', ['cl', 'co'], 'A Chilean chain, also across Colombia.'),
  ph('salcobrand', 'Salcobrand', ['cl'], 'Another Chilean chain.'),
  ph('matsukiyo', 'Matsumoto Kiyoshi', ['jp'], 'The yellow-signed Japanese drugstore, on every station approach.'),
  ph('sundrug', 'Sundrug', ['jp'], 'Another Japanese drugstore chain.'),
  ph('welcia', 'Welcia', ['jp'], 'The largest drugstore group in Japan.'),
  ph('oliveyoung', 'Olive Young', ['kr'], 'The Korean health and beauty chain, on every block in Seoul.'),
  ph('watsons', 'Watsons', ['hk', 'sg', 'my', 'th', 'ph', 'tw', 'id', 'vn', 'cn'], 'The Hong Kong group’s chain, across most of Asia.'),
  ph('mannings', 'Mannings', ['hk'], 'The other Hong Kong chain, usually on the opposite corner.'),
  ph('guardian', 'Guardian', ['sg', 'my', 'id', 'bn'], 'A Southeast Asian pharmacy chain.'),
  ph('apollo', 'Apollo Pharmacy', ['in'], 'The largest Indian chain, attached to the hospital group.'),
  ph('medplus', 'MedPlus', ['in'], 'Another Indian chain.'),
  ph('clicks', 'Clicks', ['za'], 'The South African chain, a dispensary at the back of a shop.'),
  ph('dischem', 'Dis-Chem', ['za'], 'The other South African one, larger and cheaper.'),
  ph('lifepharmacy', 'Life Pharmacy', ['ae', 'om', 'qa'], 'The Gulf chain, a green sign in most Emirati malls and along the corniche.'),
  ph('nahdi', 'Nahdi', ['sa'], 'The largest Saudi chain.'),
  ph('aldawaa', 'Al Dawaa', ['sa'], 'Another Saudi chain.'),
  ph('elezaby', 'El Ezaby', ['eg'], 'The Egyptian chain, most of them open all night.'),
  ph('healthplus', 'HealthPlus', ['ng'], 'A Nigerian pharmacy chain.'),
  ph('goodlife', 'Goodlife Pharmacy', ['ke'], 'The largest Kenyan chain.'),
  ph('rigla', 'Rigla', ['ru'], 'A Russian chain.'),
];

/**
 * Countries where a pharmacy has to be independently owned.
 *
 * This is a real feature of pharmacy law in these places: a pharmacy must be
 * owned and run by a licensed pharmacist, which is why there is no chain on
 * the corner. SLATE generates an independent one there instead, and the room
 * says so rather than looking like a gap.
 */
export const PHARMACIES_ARE_INDEPENDENT: ReadonlySet<string> = new Set([
  'de', 'fr', 'it', 'es', 'at', 'gr', 'tr', 'dk', 'lu',
]);

/** What an independent pharmacy is called where it stands. */
export const INDEPENDENT_PHARMACY_WORD: Readonly<Record<string, string>> = {
  de: 'Apotheke', at: 'Apotheke', fr: 'Pharmacie', it: 'Farmacia', es: 'Farmacia',
  gr: 'Farmakeio', tr: 'Eczane', dk: 'Apotek', lu: 'Pharmacie',
};

export function pharmacyChainsIn(countryId: string): PharmacyChain[] {
  return PHARMACY_CHAINS.filter((chain) => chain.countryIds.includes(countryId));
}

/**
 * What is over the counter.
 *
 * The plain name of an ordinary thing, and nothing else. No dose, no claim,
 * no instruction, and nothing that is not sold without a prescription
 * essentially everywhere.
 */
export interface CounterGood {
  id: string;
  name: string;
  /** SLATE's own calibration, before the local cost of living. */
  price: Money;
  /** What having one in the house does, if anything. */
  effect: 'none' | 'ease' | 'guard' | 'clean';
  about: string;
}

const cg = (id: string, name: string, price: Money, effect: CounterGood['effect'], about: string): CounterGood =>
  ({ id, name, price, effect, about });

export const COUNTER_GOODS: readonly CounterGood[] = [
  cg('painkillers', 'Painkillers', 6_00, 'ease', 'The small box everybody has in a drawer somewhere.'),
  cg('cold_remedy', 'Cold Remedy', 9_00, 'ease', 'The sachets that taste of lemon and not much else.'),
  cg('antihistamines', 'Antihistamines', 8_00, 'ease', 'For the season that does this to you every year.'),
  cg('plasters', 'Plasters', 4_00, 'guard', 'A box of them, and you’ll still not have one when it happens.'),
  cg('antiseptic', 'Antiseptic', 5_00, 'guard', 'The bottle that lives at the back of the cupboard.'),
  cg('sunscreen', 'Sunscreen', 14_00, 'guard', 'The one thing worth buying before a shoot in the desert.'),
  cg('vitamins', 'Vitamins', 12_00, 'none', 'A tub of them. You’ll remember for eleven days.'),
  cg('rehydration', 'Rehydration Salts', 7_00, 'ease', 'For the morning after the wrap party.'),
  cg('throat_lozenges', 'Throat Lozenges', 5_00, 'ease', 'For a voice that has been used all week.'),
  cg('toothpaste', 'Toothpaste', 5_00, 'clean', 'The ordinary tube.'),
  cg('toothbrush', 'Toothbrush', 4_00, 'clean', 'Replaced far less often than anybody admits.'),
  cg('shampoo', 'Shampoo', 8_00, 'clean', 'The bottle in the shower.'),
  cg('razors', 'Razors', 13_00, 'clean', 'A pack, sold at a price that has always been a joke.'),
  cg('deodorant', 'Deodorant', 6_00, 'clean', 'The thing you notice you have run out of at the worst time.'),
  cg('contact_solution', 'Contact Lens Solution', 11_00, 'clean', 'The bottle you can’t fly with.'),
  cg('hand_cream', 'Hand Cream', 9_00, 'none', 'For hands that have been in and out of water all day.'),
];

export const COUNTER_BY_ID: Readonly<Record<string, CounterGood>> = Object.fromEntries(
  COUNTER_GOODS.map((good) => [good.id, good]),
);

// ---------------------------------------------------------------------------
// The post office
// ---------------------------------------------------------------------------

export interface PostalOperator {
  id: string;
  name: string;
  countryId: string;
  about: string;
}

const po = (id: string, name: string, countryId: string, about: string): PostalOperator =>
  ({ id, name, countryId, about });

/**
 * The national postal operator of each country.
 *
 * Public record: the operator exists and carries that country's post. What a
 * parcel costs, how long it takes and what happens to it on the way are
 * SLATE's own calibration.
 */
export const POSTAL_OPERATORS: readonly PostalOperator[] = [
  po('usps', 'United States Postal Service', 'us', 'The post office, and a queue at lunchtime everywhere in the country.'),
  po('royalmail', 'Royal Mail', 'uk', 'The British operator, with a counter at the back of a shop as often as not.'),
  po('anpost', 'An Post', 'ie', 'The Irish operator.'),
  po('canadapost', 'Canada Post', 'ca', 'The Canadian operator, often a counter inside a pharmacy.'),
  po('laposte', 'La Poste', 'fr', 'The French operator, and a bank as well.'),
  po('deutschepost', 'Deutsche Post', 'de', 'The German operator.'),
  po('posteitaliane', 'Poste Italiane', 'it', 'The Italian operator, where the whole neighborhood queues on pension day.'),
  po('correos', 'Correos', 'es', 'The Spanish operator.'),
  po('ctt', 'CTT', 'pt', 'The Portuguese operator.'),
  po('postnl', 'PostNL', 'nl', 'The Dutch operator.'),
  po('bpost', 'bpost', 'be', 'The Belgian operator.'),
  po('swisspost', 'Swiss Post', 'ch', 'The Swiss operator, and famously on time.'),
  po('austrianpost', 'Österreichische Post', 'at', 'The Austrian operator.'),
  po('postnord_se', 'PostNord', 'se', 'The Swedish half of the joint Nordic operator.'),
  po('postnord_dk', 'PostNord', 'dk', 'The Danish half of the joint Nordic operator.'),
  po('postennorge', 'Posten Norge', 'no', 'The Norwegian operator.'),
  po('posti', 'Posti', 'fi', 'The Finnish operator.'),
  po('poczta', 'Poczta Polska', 'pl', 'The Polish operator.'),
  po('ceskaposta', 'Česká Pošta', 'cz', 'The Czech operator.'),
  po('elta', 'ELTA', 'gr', 'The Greek operator.'),
  po('ptt', 'PTT', 'tr', 'The Turkish operator.'),
  po('russianpost', 'Russian Post', 'ru', 'The Russian operator.'),
  po('ukrposhta', 'Ukrposhta', 'ua', 'The Ukrainian operator.'),
  po('japanpost', 'Japan Post', 'jp', 'The Japanese operator, and a bank, and an insurer.'),
  po('koreapost', 'Korea Post', 'kr', 'The Korean operator.'),
  po('chinapost', 'China Post', 'cn', 'The Chinese operator.'),
  po('hongkongpost', 'Hongkong Post', 'hk', 'The Hong Kong operator.'),
  po('singpost', 'SingPost', 'sg', 'The Singaporean operator.'),
  po('posmalaysia', 'Pos Malaysia', 'my', 'The Malaysian operator.'),
  po('thailandpost', 'Thailand Post', 'th', 'The Thai operator.'),
  po('posindonesia', 'Pos Indonesia', 'id', 'The Indonesian operator.'),
  po('phlpost', 'PHLPost', 'ph', 'The Philippine operator.'),
  po('vietnampost', 'Vietnam Post', 'vn', 'The Vietnamese operator.'),
  po('indiapost', 'India Post', 'in', 'The Indian operator, and the largest postal network in the world.'),
  po('pakpost', 'Pakistan Post', 'pk', 'The Pakistani operator.'),
  po('bangladeshpost', 'Bangladesh Post', 'bd', 'The Bangladeshi operator.'),
  po('auspost', 'Australia Post', 'au', 'The Australian operator.'),
  po('nzpost', 'New Zealand Post', 'nz', 'The New Zealand operator.'),
  po('sapo', 'South African Post Office', 'za', 'The South African operator.'),
  po('nipost', 'NIPOST', 'ng', 'The Nigerian operator.'),
  po('postakenya', 'Posta Kenya', 'ke', 'The Kenyan operator.'),
  po('egyptpost', 'Egypt Post', 'eg', 'The Egyptian operator.'),
  po('baridalmaghrib', 'Barid Al-Maghrib', 'ma', 'The Moroccan operator.'),
  po('emiratespost', 'Emirates Post', 'ae', 'The Emirati operator.'),
  po('saudipost', 'Saudi Post', 'sa', 'The Saudi operator.'),
  po('israelpost', 'Israel Post', 'il', 'The Israeli operator.'),
  po('correios', 'Correios', 'br', 'The Brazilian operator.'),
  po('correosmx', 'Correos de México', 'mx', 'The Mexican operator.'),
  po('correoargentino', 'Correo Argentino', 'ar', 'The Argentine operator.'),
  po('correoschile', 'CorreosChile', 'cl', 'The Chilean operator.'),
  po('serpost', 'Serpost', 'pe', 'The Peruvian operator.'),
  po('magyarposta', 'Magyar Posta', 'hu', 'The Hungarian operator.'),
  po('slovenskaposta', 'Slovenská pošta', 'sk', 'The Slovak operator.'),
  po('postaslovenije', 'Pošta Slovenije', 'si', 'The Slovenian operator.'),
  po('hrvatskaposta', 'Hrvatska pošta', 'hr', 'The Croatian operator.'),
  po('postasrbije', 'Pošta Srbije', 'rs', 'The Serbian operator.'),
  po('postaromana', 'Poșta Română', 'ro', 'The Romanian operator.'),
  po('bulgarianposts', 'Bulgarian Posts', 'bg', 'The Bulgarian operator.'),
  po('omniva', 'Omniva', 'ee', 'The Estonian operator, and the parcel lockers with it.'),
  po('latvijaspasts', 'Latvijas Pasts', 'lv', 'The Latvian operator.'),
  po('lietuvospastas', 'Lietuvos paštas', 'lt', 'The Lithuanian operator.'),
  po('islandspostur', 'Íslandspóstur', 'is', 'The Icelandic operator.'),
  po('cypruspost', 'Cyprus Post', 'cy', 'The Cypriot operator.'),
  po('maltapost', 'MaltaPost', 'mt', 'The Maltese operator.'),
  po('postluxembourg', 'POST Luxembourg', 'lu', 'The Luxembourgish operator, and a telephone company as well.'),
  po('chunghwapost', 'Chunghwa Post', 'tw', 'The Taiwanese operator, and a savings bank at the same counter.'),
  po('srilankapost', 'Sri Lanka Post', 'lk', 'The Sri Lankan operator.'),
  po('nepalpost', 'Nepal Post', 'np', 'The Nepali operator.'),
  po('kazpost', 'Kazpost', 'kz', 'The Kazakh operator.'),
  po('georgianpost', 'Georgian Post', 'ge', 'The Georgian operator.'),
  po('haypost', 'HayPost', 'am', 'The Armenian operator.'),
  po('azerpost', 'Azerpost', 'az', 'The Azerbaijani operator.'),
  po('jordanpost', 'Jordan Post', 'jo', 'The Jordanian operator.'),
  po('libanpost', 'LibanPost', 'lb', 'The Lebanese operator.'),
  po('qatarpost', 'Qatar Post', 'qa', 'The Qatari operator.'),
  po('omanpost', 'Oman Post', 'om', 'The Omani operator.'),
  po('bahrainpost', 'Bahrain Post', 'bh', 'The Bahraini operator.'),
  po('kuwaitpost', 'Kuwait Post', 'kw', 'The Kuwaiti operator.'),
  po('laposteTunisienne', 'La Poste Tunisienne', 'tn', 'The Tunisian operator.'),
  po('algerieposte', 'Algérie Poste', 'dz', 'The Algerian operator.'),
  po('ghanapost', 'Ghana Post', 'gh', 'The Ghanaian operator.'),
  po('ethiopianpost', 'Ethiopian Postal Service', 'et', 'The Ethiopian operator.'),
  po('tanzaniaposts', 'Tanzania Posts Corporation', 'tz', 'The Tanzanian operator.'),
  po('postauganda', 'Posta Uganda', 'ug', 'The Ugandan operator.'),
  po('zampost', 'Zampost', 'zm', 'The Zambian operator.'),
  po('correosecuador', 'Correos del Ecuador', 'ec', 'The Ecuadorian operator.'),
  po('correouruguayo', 'Correo Uruguayo', 'uy', 'The Uruguayan operator.'),
  po('correoparaguayo', 'Correo Paraguayo', 'py', 'The Paraguayan operator.'),
  po('correoscostarica', 'Correos de Costa Rica', 'cr', 'The Costa Rican operator.'),
  po('correospanama', 'Correos de Panamá', 'pa', 'The Panamanian operator.'),
  po('correosdecuba', 'Correos de Cuba', 'cu', 'The Cuban operator.'),
  po('jamaicapost', 'Jamaica Post', 'jm', 'The Jamaican operator.'),
  po('ttpost', 'TTPost', 'tt', 'The Trinidadian operator.'),
];

export function postalOperatorIn(countryId: string): PostalOperator | undefined {
  return POSTAL_OPERATORS.find((one) => one.countryId === countryId);
}

/** How a parcel goes. SLATE's own calibration, all of it. */
export interface PostService {
  id: string;
  label: string;
  /** What it costs before weight, distance and the local cost of living. */
  base: Money;
  /** Added per kilogram. */
  perKilo: Money;
  /** How many days it takes within the same country. */
  homeDays: readonly [number, number];
  /** How many days it takes to another country. */
  abroadDays: readonly [number, number];
  /** Whether it can be followed on its way. */
  tracked: boolean;
  about: string;
}

export const POST_SERVICES: readonly PostService[] = [
  { id: 'standard', label: 'Standard', base: 5_00, perKilo: 3_50, homeDays: [2, 5], abroadDays: [8, 21], tracked: false, about: 'It gets there when it gets there, and nobody can tell you where it is in the meantime.' },
  { id: 'tracked', label: 'Tracked', base: 9_00, perKilo: 4_50, homeDays: [2, 4], abroadDays: [6, 14], tracked: true, about: 'The same van, and a number you can look at.' },
  { id: 'express', label: 'Express', base: 22_00, perKilo: 8_00, homeDays: [1, 2], abroadDays: [3, 6], tracked: true, about: 'Next day where it can be, and priced like it.' },
  { id: 'signed', label: 'Signed For', base: 13_00, perKilo: 5_00, homeDays: [2, 4], abroadDays: [7, 16], tracked: true, about: 'Somebody has to be in, and somebody has to sign.' },
];

export const SERVICE_BY_ID: Readonly<Record<string, PostService>> = Object.fromEntries(
  POST_SERVICES.map((one) => [one.id, one]),
);

/** The heaviest thing a counter will take, in grams. */
export const MAX_PARCEL_GRAMS = 30_000;

/** How often a parcel goes astray, and how often it is merely late. */
export const LOST_CHANCE = 0.012;
export const DELAY_CHANCE = 0.11;

/** How long a queue at a counter takes, in minutes. */
export const QUEUE_MINUTES: readonly [number, number] = [4, 25];

// ---------------------------------------------------------------------------
// The salon
// ---------------------------------------------------------------------------

export interface SalonService {
  id: string;
  label: string;
  /** SLATE's own calibration, before the salon's tier and the local prices. */
  price: Money;
  minutes: number;
  /** How much of a cut this is: a trim resets less than a proper cut. */
  restores: number;
  about: string;
}

export const SALON_SERVICES: readonly SalonService[] = [
  { id: 'trim', label: 'A Trim', price: 32_00, minutes: 30, restores: 60, about: 'Tidy the ends and take the weight out. Twenty minutes if the chair is free.' },
  { id: 'cut', label: 'A Cut', price: 58_00, minutes: 55, restores: 100, about: 'The proper thing, washed and finished, and a conversation you didn’t plan on.' },
  { id: 'cut_colour', label: 'A Cut And Color', price: 165_00, minutes: 150, restores: 100, about: 'Most of an afternoon, foils, and a magazine you’d never buy.' },
  { id: 'beard', label: 'A Beard Trim', price: 26_00, minutes: 25, restores: 45, about: 'A hot towel and a straight razor, if the barber is any good.' },
  { id: 'blow_dry', label: 'A Blow Dry', price: 44_00, minutes: 45, restores: 25, about: 'For tonight rather than for the month. It won’t survive the rain.' },
];

export const SALON_BY_ID: Readonly<Record<string, SalonService>> = Object.fromEntries(
  SALON_SERVICES.map((one) => [one.id, one]),
);

/**
 * How long a cut lasts before it stops looking like one.
 *
 * SLATE's own calibration: six weeks from the chair to needing the chair
 * again, which is roughly what a barber will tell you.
 */
export const GROOMING_DAYS = 42;

/** Below this, the mirror has something to say about it. */
export const LOOKS_UNKEMPT = 40;

// ---------------------------------------------------------------------------
// The launderette
// ---------------------------------------------------------------------------

/** How long a wash and a dry actually takes, sitting there. */
export const LAUNDERETTE_MINUTES = 95;

/** What a service wash costs on top, when you leave it with them. */
export const SERVICE_WASH_SHARE = 1.8;
