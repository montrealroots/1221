/**
 * SLATE — the real airlines, and which of them actually fly where.
 *
 * Name, IATA code and home country are public record. The quality figure is
 * SLATE's own calibration of cabin and reliability, and every route, schedule
 * and fare the game shows is SLATE's own, not the airline's.
 *
 * The promise this file keeps is that a flight anywhere in the geography is
 * flown by a carrier that really goes there. A domestic hop inside Nigeria is
 * Air Peace, not Emirates. So every one of the 252 countries in the world
 * data is accounted for in one of three ways, and `tools/airline-coverage`
 * in the gate counts them rather than trusting this comment:
 *
 * 1. it is home to at least one airline below;
 * 2. it has no scheduled airline of its own and `SERVED_BY` names the
 *    neighbors' carriers that really fly in (a real Air France flight to
 *    Cayenne, a real Airlink flight to Saint Helena);
 * 3. it has no scheduled air service at all, and `NO_SERVICE` says why in
 *    plain words rather than the game inventing a flight to an uninhabited
 *    island.
 *
 * Airlines that have stopped flying are left out, however famous. Air
 * Vanuatu, Nordica, Air Namibia, Kulula, Vistara and Ukraine International
 * are not on this list because, at the time of writing, they are not flying.
 */

export interface Airline {
  /** IATA two character code. */
  code: string;
  name: string;
  /** Home country, as the geography keys it. The United Kingdom is `uk`. */
  countryId: string;
  /** SLATE's own calibration of cabin and reliability, 0-100. */
  quality: number;
  /** Flies intercontinental on its own metal. */
  longHaul: boolean;
}

const a = (code: string, name: string, countryId: string, quality: number, longHaul = false): Airline =>
  ({ code, name, countryId, quality, longHaul });

export const AIRLINES: readonly Airline[] = [
  // --- North America ----------------------------------------------------------------------------------
  a('DL', 'Delta Air Lines', 'us', 76, true), a('UA', 'United Airlines', 'us', 72, true),
  a('AA', 'American Airlines', 'us', 70, true), a('B6', 'JetBlue', 'us', 71), a('WN', 'Southwest Airlines', 'us', 66),
  a('AS', 'Alaska Airlines', 'us', 74), a('NK', 'Spirit Airlines', 'us', 52), a('F9', 'Frontier Airlines', 'us', 54),
  a('HA', 'Hawaiian Airlines', 'us', 73, true), a('G4', 'Allegiant Air', 'us', 55), a('SY', 'Sun Country Airlines', 'us', 62),
  a('AC', 'Air Canada', 'ca', 72, true), a('WS', 'WestJet', 'ca', 68, true), a('PD', 'Porter Airlines', 'ca', 74),
  a('TS', 'Air Transat', 'ca', 66, true), a('F8', 'Flair Airlines', 'ca', 54),
  a('AM', 'Aeroméxico', 'mx', 68, true), a('Y4', 'Volaris', 'mx', 58), a('VB', 'Viva Aerobus', 'mx', 56),
  a('GL', 'Air Greenland', 'gl', 70), a('PJ', 'Air Saint-Pierre', 'pm', 66),
  // --- Central America and the Caribbean --------------------------------------------------------------
  a('CM', 'Copa Airlines', 'pa', 76, true), a('AV', 'Avianca', 'co', 68, true), a('CU', 'Cubana', 'cu', 48, true),
  a('BW', 'Caribbean Airlines', 'tt', 64, true), a('UP', 'Bahamasair', 'bs', 60), a('KX', 'Cayman Airways', 'ky', 66),
  a('DM', 'Arajet', 'do', 62), a('LI', 'LIAT', 'ag', 54), a('TX', 'Air Caraïbes', 'gp', 66, true),
  a('S6', 'Sunrise Airways', 'ht', 52), a('9N', 'Tropic Air', 'bz', 60),
  // --- South America ----------------------------------------------------------------------------------
  a('LA', 'LATAM Airlines', 'cl', 70, true), a('JA', 'JetSMART', 'cl', 58), a('H2', 'Sky Airline', 'cl', 60),
  a('JJ', 'LATAM Brasil', 'br', 68, true), a('G3', 'Gol', 'br', 62), a('AD', 'Azul', 'br', 70, true),
  a('AR', 'Aerolíneas Argentinas', 'ar', 64, true), a('FO', 'Flybondi', 'ar', 50),
  a('LP', 'LATAM Perú', 'pe', 66, true), a('OB', 'Boliviana de Aviación', 'bo', 58, true),
  a('V0', 'Conviasa', 've', 46, true), a('PY', 'Surinam Airways', 'sr', 56, true), a('PZ', 'Paranair', 'py', 52),
  // --- Western Europe ---------------------------------------------------------------------------------
  a('BA', 'British Airways', 'uk', 74, true), a('VS', 'Virgin Atlantic', 'uk', 77, true), a('U2', 'easyJet', 'uk', 60),
  a('LM', 'Loganair', 'uk', 64), a('BE', 'Jet2', 'uk', 66), a('EI', 'Aer Lingus', 'ie', 70, true), a('FR', 'Ryanair', 'ie', 52),
  a('AF', 'Air France', 'fr', 75, true), a('TO', 'Transavia France', 'fr', 58), a('SS', 'Corsair', 'fr', 62, true),
  a('KL', 'KLM', 'nl', 76, true), a('HV', 'Transavia', 'nl', 58), a('SN', 'Brussels Airlines', 'be', 70, true),
  a('LG', 'Luxair', 'lu', 72), a('LH', 'Lufthansa', 'de', 77, true), a('EW', 'Eurowings', 'de', 60), a('DE', 'Condor', 'de', 64, true),
  a('LX', 'Swiss', 'ch', 80, true), a('WK', 'Edelweiss Air', 'ch', 70, true), a('OS', 'Austrian Airlines', 'at', 74, true),
  a('IB', 'Iberia', 'es', 70, true), a('VY', 'Vueling', 'es', 58), a('UX', 'Air Europa', 'es', 64, true),
  a('TP', 'TAP Air Portugal', 'pt', 66, true), a('AZ', 'ITA Airways', 'it', 68, true), a('NO', 'Neos', 'it', 62, true),
  a('KM', 'KM Malta Airlines', 'mt', 66), a('A3', 'Aegean Airlines', 'gr', 76), a('OA', 'Olympic Air', 'gr', 64),
  a('CY', 'Cyprus Airways', 'cy', 62), a('GR', 'Aurigny', 'gg', 62), a('SI', 'Blue Islands', 'je', 60),
  // --- Northern Europe --------------------------------------------------------------------------------
  a('SK', 'SAS', 'se', 70, true), a('DY', 'Norwegian', 'no', 62), a('WF', 'Widerøe', 'no', 68),
  a('AY', 'Finnair', 'fi', 76, true), a('FI', 'Icelandair', 'is', 70, true), a('RC', 'Atlantic Airways', 'fo', 68),
  a('BT', 'airBaltic', 'lv', 68), a('DX', 'Danish Air Transport', 'dk', 60),
  // --- Central and Eastern Europe ---------------------------------------------------------------------
  a('LO', 'LOT Polish Airlines', 'pl', 68, true), a('QS', 'Smartwings', 'cz', 56), a('W6', 'Wizz Air', 'hu', 54),
  a('RO', 'TAROM', 'ro', 58), a('FB', 'Bulgaria Air', 'bg', 58), a('JU', 'Air Serbia', 'rs', 64, true),
  a('OU', 'Croatia Airlines', 'hr', 62), a('4O', 'Air Montenegro', 'me', 56), a('ZB', 'Air Albania', 'al', 54),
  a('5F', 'FlyOne', 'md', 52), a('B2', 'Belavia', 'by', 56), a('SU', 'Aeroflot', 'ru', 60, true), a('S7', 'S7 Airlines', 'ru', 62),
  a('A9', 'Georgian Airways', 'ge', 58), a('J2', 'Azerbaijan Airlines', 'az', 66, true),
  // --- Middle East ------------------------------------------------------------------------------------
  a('TK', 'Turkish Airlines', 'tr', 78, true), a('PC', 'Pegasus Airlines', 'tr', 58),
  a('EK', 'Emirates', 'ae', 86, true), a('EY', 'Etihad Airways', 'ae', 82, true), a('FZ', 'flydubai', 'ae', 66), a('G9', 'Air Arabia', 'ae', 60),
  a('QR', 'Qatar Airways', 'qa', 88, true), a('GF', 'Gulf Air', 'bh', 72, true), a('WY', 'Oman Air', 'om', 78, true),
  a('KU', 'Kuwait Airways', 'kw', 62, true), a('J9', 'Jazeera Airways', 'kw', 60),
  a('SV', 'Saudia', 'sa', 70, true), a('XY', 'flynas', 'sa', 60), a('F3', 'flyadeal', 'sa', 56),
  a('RJ', 'Royal Jordanian', 'jo', 66, true), a('ME', 'Middle East Airlines', 'lb', 68, true),
  a('LY', 'El Al', 'il', 70, true), a('IZ', 'Arkia', 'il', 58), a('6H', 'Israir', 'il', 58),
  a('IR', 'Iran Air', 'ir', 46, true), a('W5', 'Mahan Air', 'ir', 50, true), a('IA', 'Iraqi Airways', 'iq', 44, true),
  a('RB', 'Syrian Air', 'sy', 36), a('IY', 'Yemenia', 'ye', 40),
  // --- North Africa -----------------------------------------------------------------------------------
  a('MS', 'EgyptAir', 'eg', 64, true), a('SM', 'Air Cairo', 'eg', 52), a('AT', 'Royal Air Maroc', 'ma', 66, true),
  a('TU', 'Tunisair', 'tn', 56, true), a('AH', 'Air Algérie', 'dz', 54, true), a('LN', 'Libyan Airlines', 'ly', 40),
  a('8U', 'Afriqiyah Airways', 'ly', 42), a('SD', 'Sudan Airways', 'sd', 36),
  // --- West and Central Africa ------------------------------------------------------------------------
  a('P4', 'Air Peace', 'ng', 58, true), a('W3', 'Arik Air', 'ng', 50), a('QI', 'Ibom Air', 'ng', 60),
  a('HF', 'Air Côte d’Ivoire', 'ci', 60), a('KP', 'ASKY Airlines', 'tg', 58), a('HC', 'Air Senegal', 'sn', 60, true),
  a('2J', 'Air Burkina', 'bf', 52), a('L6', 'Mauritania Airlines', 'mr', 50), a('VR', 'Cabo Verde Airlines', 'cv', 58, true),
  a('QC', 'Camair-Co', 'cm', 50), a('C2', 'Ceiba Intercontinental', 'gq', 46), a('8Z', 'Congo Airways', 'cd', 46),
  a('DT', 'TAAG Angola Airlines', 'ao', 60, true),
  // --- East and Southern Africa -----------------------------------------------------------------------
  a('ET', 'Ethiopian Airlines', 'et', 71, true), a('KQ', 'Kenya Airways', 'ke', 66, true), a('JM', 'Jambojet', 'ke', 58),
  a('WB', 'RwandAir', 'rw', 68, true), a('UR', 'Uganda Airlines', 'ug', 62, true), a('TC', 'Air Tanzania', 'tz', 58, true),
  a('PW', 'Precision Air', 'tz', 54), a('3W', 'Malawi Airlines', 'mw', 52), a('P0', 'Proflight Zambia', 'zm', 56),
  a('UM', 'Air Zimbabwe', 'zw', 44), a('TM', 'LAM Mozambique Airlines', 'mz', 48), a('BP', 'Air Botswana', 'bw', 58),
  a('SA', 'South African Airways', 'za', 66, true), a('4Z', 'Airlink', 'za', 70), a('FA', 'FlySafair', 'za', 66),
  a('MK', 'Air Mauritius', 'mu', 68, true), a('HM', 'Air Seychelles', 'sc', 66), a('MD', 'Madagascar Airlines', 'mg', 46),
  a('UU', 'Air Austral', 're', 66, true), a('DJ', 'Air Djibouti', 'dj', 44),
  // --- South and Central Asia -------------------------------------------------------------------------
  a('AI', 'Air India', 'in', 62, true), a('6E', 'IndiGo', 'in', 66), a('SG', 'SpiceJet', 'in', 54), a('QP', 'Akasa Air', 'in', 62),
  a('PK', 'Pakistan International Airlines', 'pk', 48, true), a('BG', 'Biman Bangladesh Airlines', 'bd', 50, true),
  a('BS', 'US-Bangla Airlines', 'bd', 54), a('UL', 'SriLankan Airlines', 'lk', 66, true), a('RA', 'Nepal Airlines', 'np', 46, true),
  a('H9', 'Himalaya Airlines', 'np', 52), a('KB', 'Drukair', 'bt', 62), a('Q2', 'Maldivian', 'mv', 56),
  a('KC', 'Air Astana', 'kz', 72, true), a('HY', 'Uzbekistan Airways', 'uz', 60, true), a('T5', 'Turkmenistan Airlines', 'tm', 48, true),
  a('FG', 'Ariana Afghan Airlines', 'af', 36), a('RQ', 'Kam Air', 'af', 38), a('OM', 'MIAT Mongolian Airlines', 'mn', 58, true),
  // --- East Asia --------------------------------------------------------------------------------------
  a('JL', 'Japan Airlines', 'jp', 85, true), a('NH', 'ANA', 'jp', 86, true), a('MM', 'Peach Aviation', 'jp', 60),
  a('KE', 'Korean Air', 'kr', 80, true), a('OZ', 'Asiana Airlines', 'kr', 76, true), a('7C', 'Jeju Air', 'kr', 60),
  a('CA', 'Air China', 'cn', 68, true), a('MU', 'China Eastern', 'cn', 66, true), a('CZ', 'China Southern', 'cn', 66, true),
  a('HU', 'Hainan Airlines', 'cn', 74, true), a('3U', 'Sichuan Airlines', 'cn', 62, true), a('9C', 'Spring Airlines', 'cn', 54),
  a('CX', 'Cathay Pacific', 'hk', 84, true), a('HX', 'Hong Kong Airlines', 'hk', 64, true), a('NX', 'Air Macau', 'mo', 62),
  a('CI', 'China Airlines', 'tw', 74, true), a('BR', 'EVA Air', 'tw', 82, true), a('IT', 'Tigerair Taiwan', 'tw', 56),
  a('JS', 'Air Koryo', 'kp', 30),
  // --- Southeast Asia ---------------------------------------------------------------------------------
  a('SQ', 'Singapore Airlines', 'sg', 90, true), a('TR', 'Scoot', 'sg', 62, true),
  a('MH', 'Malaysia Airlines', 'my', 72, true), a('AK', 'AirAsia', 'my', 58), a('D7', 'AirAsia X', 'my', 56, true),
  a('TG', 'Thai Airways', 'th', 74, true), a('FD', 'Thai AirAsia', 'th', 56), a('DD', 'Nok Air', 'th', 52),
  a('VN', 'Vietnam Airlines', 'vn', 70, true), a('VJ', 'VietJet Air', 'vn', 54), a('QH', 'Bamboo Airways', 'vn', 60),
  a('GA', 'Garuda Indonesia', 'id', 72, true), a('JT', 'Lion Air', 'id', 46), a('QG', 'Citilink', 'id', 54), a('ID', 'Batik Air', 'id', 56),
  a('PR', 'Philippine Airlines', 'ph', 66, true), a('5J', 'Cebu Pacific', 'ph', 54), a('BI', 'Royal Brunei Airlines', 'bn', 70, true),
  a('QV', 'Lao Airlines', 'la', 50), a('K6', 'Air Cambodia', 'kh', 50), a('UB', 'Myanmar National Airlines', 'mm', 44),
  // --- Oceania ----------------------------------------------------------------------------------------
  a('QF', 'Qantas', 'au', 80, true), a('JQ', 'Jetstar', 'au', 58, true), a('VA', 'Virgin Australia', 'au', 68),
  a('ZL', 'Rex Airlines', 'au', 60), a('TL', 'Airnorth', 'au', 58), a('NZ', 'Air New Zealand', 'nz', 82, true),
  a('FJ', 'Fiji Airways', 'fj', 70, true), a('PX', 'Air Niugini', 'pg', 56, true), a('IE', 'Solomon Airlines', 'sb', 52),
  a('TN', 'Air Tahiti Nui', 'pf', 72, true), a('VT', 'Air Tahiti', 'pf', 64), a('SB', 'Aircalin', 'nc', 66, true),
  a('ON', 'Nauru Airlines', 'nr', 50), a('4A', 'Air Kiribati', 'ki', 44),
];

/**
 * Countries with no scheduled airline of their own, and the neighbors'
 * carriers that really fly in. Every code here is on the list above.
 *
 * A territory is served by its metropole's carrier (Air France to Cayenne,
 * KLM to Curaçao, United across Micronesia) and a small state by the big
 * regional connectors that actually schedule it (Ethiopian and Kenya
 * Airways across the smaller East African capitals, Turkish and Royal Air
 * Maroc across West Africa, LIAT and American across the Leewards).
 */
export const SERVED_BY: Readonly<Record<string, readonly string[]>> = {
  // Europe: microstates with no airport of their own.
  ad: ['VY', 'AF', 'IB'], mc: ['AF', 'U2', 'BA'], sm: ['AZ', 'FR'], va: ['AZ', 'FR', 'BA'], li: ['LX', 'WK'],
  gi: ['BA', 'U2'], im: ['LM', 'U2', 'BA'], ax: ['AY'], sj: ['SK', 'DY'],
  // Europe: states whose flag carrier has gone.
  ee: ['AY', 'LH', 'LO', 'BT'], lt: ['BT', 'W6', 'FR', 'LO'], si: ['LH', 'OS', 'LX', 'W6'], ba: ['TK', 'OS', 'LH', 'W6'],
  sk: ['FR', 'W6', 'LO', 'OS'], mk: ['W6', 'TK', 'A3', 'OS'], xk: ['W6', 'TK', 'A3', 'EW'], am: ['5F', 'QR', 'SU', 'LH'], cs: ['JU', '4O'],
  // Territories reached by their metropoles.
  gf: ['AF', 'TX'], mq: ['AF', 'TX', 'SS'], bl: ['TX', 'AF'], mf: ['TX', 'AF'], yt: ['UU', 'AF'], wf: ['SB'],
  aw: ['KL', 'AA', 'AV'], cw: ['KL', 'AA'], bq: ['KL', 'AA'], sx: ['KL', 'AA'], an: ['KL', 'AA'],
  bm: ['BA', 'AA', 'DL'], tc: ['AA', 'B6', 'BA'], vg: ['AA', 'LI'], ai: ['AA', 'LI'], ms: ['LI'],
  fk: ['LA'], sh: ['4Z'], pr: ['AA', 'B6', 'WN', 'DL'], vi: ['AA', 'B6', 'DL'], gu: ['UA', 'JL'], mp: ['UA'], as: ['HA'],
  fm: ['UA', 'ON'], mh: ['UA', 'ON'], pw: ['UA', 'CI'], cx: ['VA'], cc: ['VA'], nf: ['QF'], ck: ['NZ', 'JQ'], nu: ['NZ'],
  eh: ['AT'],
  // The Caribbean's small states.
  bb: ['BW', 'AA', 'VS', 'BA'], jm: ['BW', 'AA', 'B6'], kn: ['AA', 'BA', 'LI'], lc: ['AA', 'BA', 'VS'], vc: ['AA', 'LI'],
  gd: ['AA', 'BA', 'BW'], dm: ['AA', 'LI'],
  // Latin America without a flag carrier.
  uy: ['AR', 'LA', 'CM', 'AA'], ec: ['LA', 'AV', 'CM'], gy: ['BW', 'AA', 'CM'], gt: ['AV', 'AA', 'UA'], hn: ['AV', 'AA', 'UA'],
  sv: ['AV', 'AA', 'UA'], ni: ['AV', 'CM', 'AA'], cr: ['AV', 'CM', 'AA', 'UA'],
  // Africa: served by the regional connectors that really schedule them.
  gm: ['SN', 'TK', 'AT'], lr: ['SN', 'KQ', 'AT'], gn: ['AF', 'TK', 'AT'], sl: ['AF', 'TK', 'AT', 'SN'], gw: ['TP', 'AT'],
  ml: ['AF', 'TK', 'AT', 'ET'], ne: ['AF', 'TK', 'KP'], td: ['AF', 'ET', 'TK'], cf: ['AF', 'ET', 'KQ'], bj: ['AF', 'KP', 'ET'],
  cg: ['AF', 'ET', 'KP'], ga: ['AF', 'ET', 'KP'], st: ['TP', 'DT'], gh: ['P4', 'ET', 'KQ', 'BA'],
  so: ['TK', 'ET'], er: ['MS', 'TK', 'ET'], ss: ['ET', 'KQ', 'MS'], bi: ['ET', 'KQ', 'WB'], km: ['ET', 'KQ'],
  ls: ['4Z'], sz: ['4Z'], na: ['4Z', 'ET'],
  // Asia and the Pacific.
  ps: ['RJ'], kg: ['KC', 'TK', 'SU'], tj: ['TK', 'SU', 'FZ'], tl: ['TL', 'QG'], to: ['FJ', 'NZ'], ws: ['FJ', 'NZ'],
  vu: ['FJ', 'QF', 'NZ'], tv: ['FJ'],
  // States whose own airspace is closed to civil flights at the time of writing.
  ua: ['LO', 'W6'],
};

/**
 * Places with no scheduled air service at all, and why.
 *
 * The game does not invent a flight here. Reaching one of these is a ship,
 * a charter or an expedition, and the Travel screen says so.
 */
export const NO_SERVICE: Readonly<Record<string, string>> = {
  aq: 'Antarctica has no scheduled airline. Research stations are reached by charter or by ship.',
  bv: 'Bouvet Island is uninhabited and has no airstrip.',
  hm: 'Heard Island and McDonald Islands are uninhabited and reached only by ship.',
  gs: 'South Georgia is reached by ship from the Falklands. There’s no runway.',
  tf: 'The French Southern Territories are reached by ship from Réunion.',
  io: 'The British Indian Ocean Territory has a military runway with no civilian service.',
  um: 'The United States Minor Outlying Islands have no civilian scheduled service.',
  pn: 'Pitcairn has no airstrip. The supply ship from Mangareva is the way in.',
  tk: 'Tokelau has no airstrip. The ferry runs from Apia.',
};

const BY_CODE: Readonly<Record<string, Airline>> = Object.fromEntries(AIRLINES.map((x) => [x.code, x]));

export function airlineByCode(code: string): Airline | undefined {
  return BY_CODE[code];
}

/** The carriers based in a country. */
export function homeCarriers(countryId: string | undefined): Airline[] {
  if (!countryId) return [];
  return AIRLINES.filter((x) => x.countryId === countryId);
}

/**
 * Every carrier that really flies into a country: its own, then the
 * neighbors' that schedule it.
 */
export function carriersServing(countryId: string | undefined): Airline[] {
  if (!countryId) return [];
  const own = homeCarriers(countryId);
  const visiting = (SERVED_BY[countryId] ?? []).map((code) => BY_CODE[code]).filter((x): x is Airline => Boolean(x));
  return [...own, ...visiting.filter((x) => !own.includes(x))];
}

/** How a country is covered, for the Travel screen and for the gate. */
export type Coverage =
  | { kind: 'home'; carriers: Airline[] }
  | { kind: 'served'; carriers: Airline[] }
  | { kind: 'none'; reason: string }
  | { kind: 'unaccounted' };

export function coverageOf(countryId: string): Coverage {
  const own = homeCarriers(countryId);
  if (own.length > 0) return { kind: 'home', carriers: own };
  const served = carriersServing(countryId);
  if (served.length > 0) return { kind: 'served', carriers: served };
  const reason = NO_SERVICE[countryId];
  if (reason) return { kind: 'none', reason };
  return { kind: 'unaccounted' };
}

/**
 * The carriers that would plausibly fly a route.
 *
 * Domestic: the home carriers, and where a country has none, the carriers
 * that actually serve it. International: everyone serving either end, and
 * on long haul the world's connectors as well, because Lagos to Singapore is
 * a Qatar Airways or Ethiopian connection in real life and not a nonstop.
 */
export function airlinesFor(fromCountryId: string | undefined, toCountryId: string | undefined, km: number): Airline[] {
  const from = carriersServing(fromCountryId);
  const to = carriersServing(toCountryId);
  const ends = [...new Set([...from, ...to])];
  const domestic = fromCountryId === toCountryId;
  // A carrier that serves both ends flies it nonstop: Air France is how you
  // get from Cayenne to Paris. The connectors only join a route long enough,
  // and unshared enough, that it really would go through one of their hubs.
  const shared = from.some((x) => to.includes(x));
  const pool = domestic || km <= 3500 || shared ? ends : [...ends, ...CONNECTORS.filter((x) => !ends.includes(x))];
  const usable = km > 3500 ? pool.filter((x) => x.longHaul) : pool;
  if (usable.length > 0) return usable;
  // A long-haul route between two places with only short-haul carriers is a
  // connection through a hub, so the connectors fly it.
  return [...CONNECTORS];
}

/** The carriers that connect the world through their hubs. */
const CONNECTORS: readonly Airline[] = ['EK', 'QR', 'TK', 'ET', 'AF', 'KL', 'LH', 'BA', 'SQ', 'CX', 'DL', 'UA', 'AA']
  .map((code) => BY_CODE[code]!)
  .filter(Boolean);

/** What the Travel screen says beside a real name. */
export const REAL_CARRIER_NOTE = 'A real airline. The route, the schedule and the fare are SLATE\'s own.';
