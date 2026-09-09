/**
 * SLATE — the papers in your wallet, and who really issues them.
 *
 * A passport comes from a real authority with a real validity and a real
 * wait; a driver's license comes from the state, the province or the
 * national agency that actually issues one where you live. Every one of the
 * 252 countries in the geography is accounted for: it issues its own, it
 * issues its metropole's (a British Overseas Territory carries a British
 * passport; American Samoa a United States one), or it issues none and says
 * why. `tools/document-coverage` in the gate counts them.
 *
 * Public record: the authority, the validity, whether there is a road test.
 * SLATE's own calibration: the fee and the wait, which move with the year
 * and the office, so the number on screen is labeled as a calibration.
 */

export interface PassportAuthority {
  /** The office, as it names itself. */
  authority: string;
  /** Adult validity, in years. */
  validityYears: number;
  /** Fee for a standard adult book. SLATE's calibration of the published fee. */
  fee: number;
  /** Routine processing, in weeks. */
  weeks: number;
  /** An expedited service, where the office really offers one. */
  expedite?: { fee: number; weeks: number };
}

const pa = (authority: string, validityYears: number, fee: number, weeks: number, expedite?: { fee: number; weeks: number }): PassportAuthority =>
  ({ authority, validityYears, fee, weeks, expedite });

export const PASSPORT_AUTHORITIES: Readonly<Record<string, PassportAuthority>> = {
  us: pa('U.S. Department of State', 10, 165_00, 7, { fee: 60_00, weeks: 3 }),
  uk: pa('HM Passport Office', 10, 94_50, 3, { fee: 178_00, weeks: 1 }),
  ca: pa('Immigration, Refugees and Citizenship Canada', 10, 160_00, 3, { fee: 110_00, weeks: 1 }),
  au: pa('Australian Passport Office', 10, 412_00, 4, { fee: 100_00, weeks: 1 }),
  nz: pa('Department of Internal Affairs', 10, 220_00, 3, { fee: 60_00, weeks: 1 }),
  ie: pa('Passport Service, Department of Foreign Affairs', 10, 75_00, 4, { fee: 30_00, weeks: 1 }),
  fr: pa('Agence nationale des titres sécurisés', 10, 86_00, 4),
  de: pa('Bundesdruckerei via the local Bürgeramt', 10, 70_00, 5, { fee: 32_00, weeks: 1 }),
  it: pa('Questura, Polizia di Stato', 10, 116_00, 4),
  es: pa('Dirección General de la Policía', 10, 30_00, 2),
  pt: pa('Instituto dos Registos e do Notariado', 5, 65_00, 2, { fee: 30_00, weeks: 1 }),
  nl: pa('Gemeente', 10, 83_00, 1),
  be: pa('Commune / Gemeente', 7, 65_00, 2, { fee: 210_00, weeks: 1 }),
  lu: pa('Bureau des passeports', 5, 50_00, 2),
  ch: pa('Kantonales Passbüro', 10, 145_00, 2, { fee: 50_00, weeks: 1 }),
  at: pa('Passbehörde', 10, 76_00, 1),
  se: pa('Polismyndigheten', 5, 45_00, 2), no: pa('Politiet', 10, 65_00, 2), dk: pa('Borgerservice', 10, 130_00, 2),
  fi: pa('Poliisi', 5, 50_00, 1), is: pa('Þjóðskrá Íslands', 10, 105_00, 2),
  pl: pa('Urząd Wojewódzki', 10, 140_00, 4), cz: pa('Obecní úřad', 10, 25_00, 4), sk: pa('Oddelenie dokladov', 10, 33_00, 4),
  hu: pa('Kormányablak', 10, 45_00, 3), ro: pa('Direcția pentru Evidența Persoanelor', 10, 55_00, 2), bg: pa('Ministry of Interior', 5, 40_00, 4),
  gr: pa('Hellenic Police, Passport Directorate', 10, 84_00, 1), cy: pa('Civil Registry and Migration Department', 10, 70_00, 3), mt: pa('Identity Malta', 10, 70_00, 2),
  hr: pa('Ministry of the Interior', 10, 55_00, 4), si: pa('Upravna enota', 10, 46_00, 3), rs: pa('Ministry of Interior', 10, 32_00, 2),
  ba: pa('Agency for Identification Documents', 10, 50_00, 4), me: pa('Ministry of Interior', 10, 35_00, 2), mk: pa('Ministry of Interior', 10, 25_00, 2),
  al: pa('Ministry of Interior', 10, 70_00, 2), xk: pa('Civil Registration Agency', 10, 30_00, 3), md: pa('Public Services Agency', 10, 45_00, 4),
  ua: pa('State Migration Service', 10, 40_00, 4), by: pa('Ministry of Internal Affairs', 10, 100_00, 4), ru: pa('Ministry of Internal Affairs', 10, 55_00, 4),
  ee: pa('Police and Border Guard Board', 10, 45_00, 4), lv: pa('Office of Citizenship and Migration Affairs', 10, 30_00, 2), lt: pa('Migration Department', 10, 43_00, 3),
  ge: pa('Public Service Development Agency', 10, 100_00, 2), am: pa('Passport and Visa Department', 10, 25_00, 2), az: pa('State Migration Service', 10, 40_00, 2),
  tr: pa('Nüfus ve Vatandaşlık İşleri', 10, 110_00, 2), il: pa('Population and Immigration Authority', 10, 280_00, 2), jo: pa('Civil Status and Passports Department', 5, 50_00, 1),
  lb: pa('General Security', 10, 60_00, 2), ae: pa('Federal Authority for Identity and Citizenship', 10, 300_00, 1), qa: pa('Ministry of Interior', 10, 200_00, 1),
  sa: pa('General Directorate of Passports', 10, 300_00, 1), kw: pa('Ministry of Interior', 10, 30_00, 1), bh: pa('Nationality, Passports and Residence Affairs', 10, 20_00, 1),
  om: pa('Royal Oman Police', 10, 30_00, 1), iq: pa('Directorate of Passports', 8, 20_00, 3), ir: pa('National Organization for Civil Registration', 5, 85_00, 3),
  sy: pa('Immigration and Passports Directorate', 6, 120_00, 6), ye: pa('Immigration, Passports and Nationality Authority', 6, 100_00, 6), ps: pa('Ministry of Interior', 5, 200_00, 4),
  eg: pa('Passports, Immigration and Nationality Administration', 7, 16_00, 2), ma: pa('Direction Générale de la Sûreté Nationale', 5, 300_00, 2), tn: pa('Ministry of Interior', 5, 65_00, 2),
  dz: pa('Ministère de l’Intérieur', 10, 45_00, 4), ly: pa('Passports and Nationality Department', 8, 50_00, 8), sd: pa('Passports and Immigration Department', 5, 100_00, 6),
  ng: pa('Nigeria Immigration Service', 10, 45_00, 6), gh: pa('Passport Office, Ministry of Foreign Affairs', 10, 500_00, 6), ke: pa('Directorate of Immigration Services', 10, 60_00, 4),
  et: pa('Immigration and Citizenship Service', 5, 90_00, 8), tz: pa('Immigration Department', 10, 60_00, 4), ug: pa('Directorate of Citizenship and Immigration Control', 10, 70_00, 4),
  rw: pa('Directorate General of Immigration and Emigration', 10, 20_00, 2), za: pa('Department of Home Affairs', 10, 35_00, 6), zm: pa('Department of Immigration', 10, 30_00, 4),
  zw: pa('Registrar General', 10, 120_00, 8), mz: pa('Serviço Nacional de Migração', 5, 50_00, 4), mw: pa('Department of Immigration', 10, 60_00, 4),
  bw: pa('Department of Immigration and Citizenship', 10, 200_00, 4), na: pa('Ministry of Home Affairs', 10, 250_00, 6), ao: pa('Serviço de Migração e Estrangeiros', 5, 20_00, 4),
  cm: pa('Délégation Générale à la Sûreté Nationale', 5, 180_00, 4), ci: pa('Office National d’Identification', 5, 65_00, 3), sn: pa('Direction de la Police des Étrangers', 5, 35_00, 3),
  ml: pa('Direction Générale de la Police', 5, 85_00, 4), bf: pa('Office National d’Identification', 5, 85_00, 4), ne: pa('Direction de la Surveillance du Territoire', 5, 50_00, 4),
  td: pa('Direction de la Police', 5, 100_00, 6), cf: pa('Ministère de l’Intérieur', 5, 100_00, 8), cg: pa('Direction Générale de la Police', 5, 100_00, 6),
  cd: pa('Direction Générale de Migration', 5, 185_00, 6), ga: pa('Direction Générale de la Documentation', 5, 100_00, 4), gq: pa('Ministerio de Seguridad Nacional', 5, 100_00, 6),
  st: pa('Serviço de Migração e Fronteiras', 5, 65_00, 6), cv: pa('Direção de Emigração e Fronteiras', 5, 45_00, 3), gm: pa('Immigration Department', 5, 25_00, 4),
  gn: pa('Direction de la Police de l’Air et des Frontières', 5, 60_00, 6), gw: pa('Serviço de Migração', 5, 100_00, 6), sl: pa('Immigration Department', 5, 65_00, 6),
  lr: pa('Liberia Immigration Service', 5, 50_00, 6), tg: pa('Direction Générale de la Documentation Nationale', 5, 50_00, 4), bj: pa('Direction de l’Émigration et de l’Immigration', 5, 65_00, 4),
  mr: pa('Direction Générale de la Sûreté Nationale', 5, 80_00, 4), er: pa('Department of Immigration and Nationality', 5, 300_00, 12), dj: pa('Direction de la Police', 5, 225_00, 6),
  so: pa('Immigration and Naturalization Directorate', 5, 100_00, 8), ss: pa('Directorate of Nationality, Passports and Immigration', 5, 250_00, 8), bi: pa('Office National d’Identification', 5, 70_00, 6),
  km: pa('Direction de la Police', 5, 130_00, 6), mg: pa('Ministère de l’Intérieur', 5, 22_00, 6), mu: pa('Passport and Immigration Office', 10, 22_00, 2),
  sc: pa('Immigration Division', 10, 400_00, 2), ls: pa('Ministry of Home Affairs', 10, 200_00, 6), sz: pa('Department of Home Affairs', 10, 400_00, 6),
  in: pa('Passport Seva, Ministry of External Affairs', 10, 18_00, 4, { fee: 30_00, weeks: 1 }), pk: pa('Directorate General of Immigration and Passports', 10, 16_00, 4, { fee: 45_00, weeks: 1 }),
  bd: pa('Department of Immigration and Passports', 10, 50_00, 4), lk: pa('Department of Immigration and Emigration', 10, 17_00, 4), np: pa('Department of Passports', 10, 38_00, 4),
  bt: pa('Department of Immigration', 10, 12_00, 3), mv: pa('Maldives Immigration', 10, 65_00, 2), af: pa('Passport Department', 5, 85_00, 8),
  kz: pa('Ministry of Internal Affairs', 10, 60_00, 3), uz: pa('Ministry of Internal Affairs', 10, 25_00, 3), kg: pa('State Registration Service', 10, 35_00, 3),
  tj: pa('Ministry of Internal Affairs', 10, 300_00, 4), tm: pa('State Migration Service', 5, 100_00, 6), mn: pa('General Authority for State Registration', 10, 18_00, 3),
  cn: pa('National Immigration Administration', 10, 120_00, 2), hk: pa('Immigration Department', 10, 48_00, 1), mo: pa('Identification Services Bureau', 10, 38_00, 2),
  tw: pa('Bureau of Consular Affairs', 10, 42_00, 1), jp: pa('Ministry of Foreign Affairs via the prefectural passport center', 10, 105_00, 1), kr: pa('Ministry of Foreign Affairs via the district office', 10, 38_00, 1),
  kp: pa('Ministry of Foreign Affairs', 5, 40_00, 12),
  sg: pa('Immigration and Checkpoints Authority', 10, 70_00, 1), my: pa('Jabatan Imigresen Malaysia', 5, 200_00, 1), th: pa('Department of Consular Affairs', 10, 42_00, 1),
  vn: pa('Immigration Department', 10, 8_00, 2), id: pa('Direktorat Jenderal Imigrasi', 10, 42_00, 1), ph: pa('Department of Foreign Affairs', 10, 17_00, 3),
  bn: pa('Immigration and National Registration Department', 5, 60_00, 2), kh: pa('General Department of Immigration', 10, 100_00, 4), la: pa('Department of Immigration', 10, 10_00, 4),
  mm: pa('Ministry of Immigration and Population', 5, 12_00, 4), tl: pa('Migration Service', 10, 30_00, 4),
  jm: pa('Passport, Immigration and Citizenship Agency', 10, 42_00, 2), tt: pa('Immigration Division', 10, 250_00, 3), bs: pa('Passport Office', 10, 110_00, 3),
  bb: pa('Immigration Department', 10, 150_00, 2), cu: pa('Dirección de Identificación, Inmigración y Extranjería', 10, 105_00, 4), do: pa('Dirección General de Pasaportes', 10, 52_00, 1),
  ht: pa('Direction de l’Immigration et de l’Émigration', 10, 42_00, 4), ag: pa('Passport Office', 10, 250_00, 2), lc: pa('Immigration Department', 10, 250_00, 2),
  gd: pa('Immigration and Passport Department', 5, 250_00, 2), kn: pa('Ministry of National Security', 10, 250_00, 2), vc: pa('Passport and Immigration Department', 5, 250_00, 2), dm: pa('Immigration Department', 10, 200_00, 3),
  mx: pa('Secretaría de Relaciones Exteriores', 10, 190_00, 2), gt: pa('Instituto Guatemalteco de Migración', 10, 400_00, 1), bz: pa('Immigration and Nationality Department', 10, 50_00, 2),
  hn: pa('Instituto Nacional de Migración', 10, 60_00, 1), sv: pa('Dirección General de Migración', 10, 60_00, 1), ni: pa('Dirección General de Migración y Extranjería', 10, 50_00, 2),
  cr: pa('Dirección General de Migración y Extranjería', 10, 32_00, 2), pa: pa('Autoridad de Pasaportes de Panamá', 10, 100_00, 1),
  co: pa('Cancillería', 10, 60_00, 1), ve: pa('SAIME', 10, 200_00, 8), ec: pa('Registro Civil', 10, 130_00, 1), pe: pa('Migraciones', 10, 100_00, 1),
  bo: pa('Dirección General de Migración', 10, 580_00, 1), cl: pa('Registro Civil e Identificación', 10, 95_00, 2), ar: pa('Registro Nacional de las Personas', 10, 35_00, 2),
  uy: pa('Dirección Nacional de Identificación Civil', 10, 90_00, 1), py: pa('Departamento de Identificaciones', 10, 45_00, 2), br: pa('Polícia Federal', 10, 257_00, 2),
  gy: pa('Central Immigration and Passport Office', 5, 30_00, 3), sr: pa('Hoofdbureau van Politie', 10, 200_00, 3),
  fj: pa('Department of Immigration', 10, 120_00, 3), pg: pa('Immigration and Citizenship Authority', 10, 250_00, 6), sb: pa('Immigration Division', 10, 400_00, 6),
  vu: pa('Passport Office', 10, 125_00, 4), ws: pa('Immigration Office', 10, 200_00, 3), to: pa('Immigration Division', 10, 100_00, 3), ki: pa('Immigration Office', 10, 100_00, 6),
  tv: pa('Immigration Department', 10, 60_00, 6), nr: pa('Immigration Office', 5, 100_00, 6), fm: pa('Division of Immigration', 10, 50_00, 6), mh: pa('Passport Office', 10, 50_00, 6),
  pw: pa('Bureau of Immigration', 10, 50_00, 6), mc: pa('Sûreté Publique', 10, 65_00, 2), sm: pa('Ufficio di Stato Civile', 10, 110_00, 2), va: pa('Secretariat of State', 10, 30_00, 4),
  ad: pa('Servei de Passaports', 10, 60_00, 2), li: pa('Ausländer- und Passamt', 10, 250_00, 2),
};

/**
 * Territories and places whose people carry another country's passport.
 * A British Overseas Territory carries a British passport; American Samoa a
 * United States one; the French territories a French one.
 */
export const PASSPORT_OF: Readonly<Record<string, string>> = {
  // British
  ai: 'uk', bm: 'uk', vg: 'uk', ky: 'uk', fk: 'uk', gi: 'uk', ms: 'uk', pn: 'uk', sh: 'uk', tc: 'uk', gs: 'uk', io: 'uk', gg: 'uk', je: 'uk', im: 'uk',
  // French
  gf: 'fr', pf: 'fr', tf: 'fr', gp: 'fr', mq: 'fr', yt: 'fr', nc: 'fr', re: 'fr', bl: 'fr', mf: 'fr', pm: 'fr', wf: 'fr',
  // American
  as: 'us', gu: 'us', mp: 'us', pr: 'us', vi: 'us', um: 'us',
  // Dutch, Danish, Norwegian, Finnish, Australian, New Zealand, Chinese
  aw: 'nl', cw: 'nl', sx: 'nl', bq: 'nl', an: 'nl', gl: 'dk', fo: 'dk', sj: 'no', bv: 'no', ax: 'fi', cx: 'au', cc: 'au', nf: 'au', hm: 'au', ck: 'nz', nu: 'nz', tk: 'nz',
  // Legacy ids in the geography
  cs: 'rs', eh: 'ma',
};

/** Places with nobody to issue a passport to. */
export const NO_PASSPORT: Readonly<Record<string, string>> = {
  aq: 'Antarctica has no citizens. Everyone there carries the passport they came with.',
};

/** The office that issues a passport to someone from this country, following a territory to its metropole. */
export function passportAuthorityFor(countryId: string): { issuerId: string; authority: PassportAuthority } | undefined {
  const issuerId = PASSPORT_OF[countryId] ?? countryId;
  const authority = PASSPORT_AUTHORITIES[issuerId];
  return authority ? { issuerId, authority } : undefined;
}

// ---------------------------------------------------------------------------
// Driver's licenses
// ---------------------------------------------------------------------------

export interface LicenseAuthority {
  authority: string;
  validityYears: number;
  minAge: number;
  /** SLATE's calibration of the published fee for a first full license. */
  fee: number;
  /** What the road to a full license actually is. */
  tests: readonly ('knowledge' | 'road' | 'eyesight' | 'hazard')[];
  /** Weeks to a test date, calibrated. */
  weeks: number;
}

const la = (authority: string, validityYears: number, minAge: number, fee: number, tests: LicenseAuthority['tests'], weeks: number): LicenseAuthority =>
  ({ authority, validityYears, minAge, fee, tests, weeks });

/** Where a license is issued by the state or province, the national entry names the pattern and the regions carry the office. */
export const LICENSE_AUTHORITIES: Readonly<Record<string, LicenseAuthority>> = {
  us: la('State motor vehicle department', 8, 16, 45_00, ['knowledge', 'eyesight', 'road'], 3),
  ca: la('Provincial licensing office', 5, 16, 90_00, ['knowledge', 'eyesight', 'road'], 4),
  uk: la('Driver and Vehicle Licensing Agency', 10, 17, 34_00, ['knowledge', 'hazard', 'road'], 8),
  ie: la('National Driver Licence Service', 10, 17, 55_00, ['knowledge', 'road'], 10),
  au: la('State transport authority', 5, 17, 190_00, ['knowledge', 'hazard', 'road'], 4),
  nz: la('Waka Kotahi NZ Transport Agency', 10, 16, 94_00, ['knowledge', 'road'], 4),
  fr: la('Agence nationale des titres sécurisés', 15, 18, 400_00, ['knowledge', 'road'], 8),
  de: la('Führerscheinstelle', 15, 18, 2_500_00, ['knowledge', 'road'], 10),
  it: la('Motorizzazione Civile', 10, 18, 1_200_00, ['knowledge', 'road'], 8),
  es: la('Dirección General de Tráfico', 10, 18, 900_00, ['knowledge', 'road'], 8),
  pt: la('Instituto da Mobilidade e dos Transportes', 15, 18, 800_00, ['knowledge', 'road'], 8),
  nl: la('RDW / CBR', 10, 17, 2_400_00, ['knowledge', 'road'], 10), be: la('SPF Mobilité / FOD Mobiliteit', 10, 18, 200_00, ['knowledge', 'road'], 8),
  lu: la('Société Nationale de Circulation Automobile', 10, 18, 600_00, ['knowledge', 'road'], 8), ch: la('Kantonales Strassenverkehrsamt', 99, 18, 2_800_00, ['knowledge', 'road'], 8),
  at: la('Bezirkshauptmannschaft', 15, 17, 1_800_00, ['knowledge', 'road'], 8),
  se: la('Transportstyrelsen', 10, 18, 1_500_00, ['knowledge', 'road'], 8), no: la('Statens vegvesen', 15, 18, 3_500_00, ['knowledge', 'road'], 8), dk: la('Færdselsstyrelsen', 15, 17, 1_200_00, ['knowledge', 'road'], 8),
  fi: la('Traficom', 15, 18, 800_00, ['knowledge', 'road'], 6), is: la('Sýslumaður', 15, 17, 800_00, ['knowledge', 'road'], 6),
  pl: la('Wydział Komunikacji', 15, 18, 300_00, ['knowledge', 'road'], 6), cz: la('Obecní úřad', 10, 18, 300_00, ['knowledge', 'road'], 6), sk: la('Okresný úrad', 10, 17, 100_00, ['knowledge', 'road'], 6),
  hu: la('Kormányablak', 10, 17, 100_00, ['knowledge', 'road'], 6), ro: la('Direcția Regim Permise de Conducere', 10, 18, 100_00, ['knowledge', 'road'], 6), bg: la('Ministry of Interior', 10, 18, 100_00, ['knowledge', 'road'], 6),
  gr: la('Ministry of Infrastructure and Transport', 15, 18, 300_00, ['knowledge', 'road'], 8), cy: la('Department of Road Transport', 10, 18, 60_00, ['knowledge', 'road'], 6), mt: la('Transport Malta', 10, 18, 100_00, ['knowledge', 'road'], 6),
  hr: la('Ministry of the Interior', 10, 18, 300_00, ['knowledge', 'road'], 6), si: la('Upravna enota', 10, 18, 300_00, ['knowledge', 'road'], 6), rs: la('Ministry of Interior', 10, 18, 300_00, ['knowledge', 'road'], 6),
  ba: la('Ministry of the Interior', 10, 18, 200_00, ['knowledge', 'road'], 6), me: la('Ministry of Interior', 10, 18, 200_00, ['knowledge', 'road'], 6), mk: la('Ministry of Interior', 10, 18, 200_00, ['knowledge', 'road'], 6),
  al: la('Ministry of Infrastructure', 10, 18, 200_00, ['knowledge', 'road'], 6), xk: la('Ministry of Internal Affairs', 10, 18, 200_00, ['knowledge', 'road'], 6), md: la('Public Services Agency', 10, 18, 200_00, ['knowledge', 'road'], 6),
  ua: la('Service Center of the Ministry of Internal Affairs', 30, 18, 100_00, ['knowledge', 'road'], 6), by: la('State Traffic Inspectorate', 10, 18, 100_00, ['knowledge', 'road'], 6), ru: la('GIBDD', 10, 18, 100_00, ['knowledge', 'road'], 6),
  ee: la('Transport Administration', 10, 18, 300_00, ['knowledge', 'road'], 6), lv: la('Road Traffic Safety Directorate', 10, 18, 200_00, ['knowledge', 'road'], 6), lt: la('Regitra', 10, 18, 200_00, ['knowledge', 'road'], 6),
  ge: la('Service Agency of the Ministry of Internal Affairs', 15, 17, 100_00, ['knowledge', 'road'], 4), am: la('Road Police', 10, 18, 100_00, ['knowledge', 'road'], 4), az: la('State Traffic Police', 10, 18, 100_00, ['knowledge', 'road'], 4),
  tr: la('Nüfus Müdürlüğü', 10, 18, 100_00, ['knowledge', 'road'], 6), il: la('Ministry of Transport', 10, 17, 1_200_00, ['knowledge', 'road'], 8), jo: la('Driver and Vehicle Licensing Department', 5, 18, 100_00, ['knowledge', 'road'], 4),
  lb: la('Traffic and Vehicles Management Authority', 10, 18, 100_00, ['knowledge', 'road'], 4), ae: la('Roads and Transport Authority', 10, 18, 1_200_00, ['knowledge', 'road'], 6), qa: la('Ministry of Interior Traffic Department', 10, 18, 140_00, ['knowledge', 'road'], 6),
  sa: la('Saudi Driving School and Traffic Department', 10, 18, 130_00, ['knowledge', 'road'], 6), kw: la('General Traffic Department', 10, 18, 100_00, ['knowledge', 'road'], 6), bh: la('General Directorate of Traffic', 10, 18, 100_00, ['knowledge', 'road'], 6),
  om: la('Royal Oman Police', 10, 18, 100_00, ['knowledge', 'road'], 6), iq: la('Traffic Directorate', 10, 18, 100_00, ['knowledge', 'road'], 6), ir: la('Traffic Police', 10, 18, 100_00, ['knowledge', 'road'], 6),
  sy: la('Traffic Directorate', 10, 18, 50_00, ['knowledge', 'road'], 8), ye: la('Traffic Department', 5, 18, 50_00, ['knowledge', 'road'], 8), ps: la('Ministry of Transport', 5, 18, 100_00, ['knowledge', 'road'], 6),
  eg: la('Traffic Department', 10, 18, 300_00, ['knowledge', 'road'], 4), ma: la('NARSA', 10, 18, 300_00, ['knowledge', 'road'], 6), tn: la('Agence Technique des Transports Terrestres', 10, 18, 200_00, ['knowledge', 'road'], 6),
  dz: la('Wilaya', 10, 18, 200_00, ['knowledge', 'road'], 6), ly: la('Traffic Department', 10, 18, 100_00, ['knowledge', 'road'], 8), sd: la('Traffic Police', 5, 18, 100_00, ['knowledge', 'road'], 8),
  ng: la('Federal Road Safety Corps', 5, 18, 150_00, ['knowledge', 'road'], 4), gh: la('Driver and Vehicle Licensing Authority', 6, 18, 200_00, ['knowledge', 'road'], 6), ke: la('National Transport and Safety Authority', 3, 18, 100_00, ['knowledge', 'road'], 6),
  et: la('Transport Authority', 5, 18, 100_00, ['knowledge', 'road'], 8), tz: la('Tanzania Revenue Authority', 3, 18, 100_00, ['knowledge', 'road'], 6), ug: la('Uganda Driver Licensing System', 5, 18, 100_00, ['knowledge', 'road'], 6),
  rw: la('Rwanda National Police', 5, 18, 100_00, ['knowledge', 'road'], 4), za: la('Driving Licence Testing Centre', 5, 18, 250_00, ['knowledge', 'eyesight', 'road'], 8), zm: la('Road Transport and Safety Agency', 5, 18, 100_00, ['knowledge', 'road'], 6),
  zw: la('Vehicle Inspection Department', 5, 16, 100_00, ['knowledge', 'road'], 8), mz: la('Instituto Nacional dos Transportes Terrestres', 5, 18, 100_00, ['knowledge', 'road'], 8), mw: la('Directorate of Road Traffic and Safety Services', 5, 18, 100_00, ['knowledge', 'road'], 8),
  bw: la('Department of Road Transport and Safety', 5, 18, 100_00, ['knowledge', 'road'], 6), na: la('Roads Authority', 5, 18, 100_00, ['knowledge', 'road'], 6), ao: la('Direcção Nacional de Viação e Trânsito', 5, 18, 100_00, ['knowledge', 'road'], 8),
  cm: la('Ministère des Transports', 5, 18, 100_00, ['knowledge', 'road'], 8), ci: la('Société Ivoirienne de Contrôles Techniques', 10, 18, 100_00, ['knowledge', 'road'], 6), sn: la('Direction des Transports Routiers', 10, 18, 100_00, ['knowledge', 'road'], 6),
  ml: la('Direction Nationale des Transports', 5, 18, 100_00, ['knowledge', 'road'], 8), bf: la('Direction Générale des Transports', 5, 18, 100_00, ['knowledge', 'road'], 8), ne: la('Direction des Transports Terrestres', 5, 18, 100_00, ['knowledge', 'road'], 8),
  td: la('Direction des Transports', 5, 18, 100_00, ['knowledge', 'road'], 8), cf: la('Direction des Transports', 5, 18, 100_00, ['knowledge', 'road'], 8), cg: la('Direction Générale des Transports Terrestres', 5, 18, 100_00, ['knowledge', 'road'], 8),
  cd: la('Direction des Transports', 5, 18, 100_00, ['knowledge', 'road'], 8), ga: la('Direction Générale des Transports Terrestres', 5, 18, 100_00, ['knowledge', 'road'], 8), gq: la('Dirección de Tráfico', 5, 18, 100_00, ['knowledge', 'road'], 8),
  st: la('Direcção dos Transportes Terrestres', 5, 18, 50_00, ['knowledge', 'road'], 8), cv: la('Direção Geral dos Transportes Rodoviários', 10, 18, 100_00, ['knowledge', 'road'], 6), gm: la('Gambia Police Force', 5, 18, 50_00, ['knowledge', 'road'], 8),
  gn: la('Direction Nationale des Transports', 5, 18, 50_00, ['knowledge', 'road'], 8), gw: la('Direção Geral de Viação', 5, 18, 50_00, ['knowledge', 'road'], 8), sl: la('Sierra Leone Road Safety Authority', 5, 18, 50_00, ['knowledge', 'road'], 8),
  lr: la('Ministry of Transport', 5, 18, 50_00, ['knowledge', 'road'], 8), tg: la('Direction des Transports Routiers', 5, 18, 50_00, ['knowledge', 'road'], 8), bj: la('Agence Nationale des Transports Terrestres', 5, 18, 50_00, ['knowledge', 'road'], 8),
  mr: la('Direction des Transports Terrestres', 5, 18, 50_00, ['knowledge', 'road'], 8), er: la('Transport Authority', 5, 18, 50_00, ['knowledge', 'road'], 12), dj: la('Direction des Transports', 5, 18, 50_00, ['knowledge', 'road'], 8),
  so: la('Ministry of Transport', 5, 18, 50_00, ['knowledge', 'road'], 12), ss: la('Directorate of Traffic Police', 5, 18, 50_00, ['knowledge', 'road'], 12), bi: la('Direction des Transports', 5, 18, 50_00, ['knowledge', 'road'], 8),
  km: la('Direction des Transports', 5, 18, 50_00, ['knowledge', 'road'], 8), mg: la('Agence des Transports Terrestres', 10, 18, 50_00, ['knowledge', 'road'], 8), mu: la('Traffic Branch, Mauritius Police', 99, 18, 100_00, ['knowledge', 'road'], 6),
  sc: la('Seychelles Licensing Authority', 5, 18, 100_00, ['knowledge', 'road'], 6), ls: la('Department of Traffic and Transport', 5, 18, 50_00, ['knowledge', 'road'], 8), sz: la('Ministry of Public Works and Transport', 5, 18, 50_00, ['knowledge', 'road'], 8),
  in: la('Regional Transport Office', 20, 18, 40_00, ['knowledge', 'road'], 4), pk: la('District Traffic Police', 5, 18, 25_00, ['knowledge', 'road'], 4), bd: la('Bangladesh Road Transport Authority', 10, 18, 30_00, ['knowledge', 'road'], 6),
  lk: la('Department of Motor Traffic', 8, 18, 15_00, ['knowledge', 'road'], 6), np: la('Department of Transport Management', 10, 18, 15_00, ['knowledge', 'road'], 8), bt: la('Road Safety and Transport Authority', 5, 18, 10_00, ['knowledge', 'road'], 6),
  mv: la('Transport Authority', 10, 18, 40_00, ['knowledge', 'road'], 4), af: la('Traffic Department', 5, 18, 10_00, ['knowledge', 'road'], 8), kz: la('Public Service Center', 10, 18, 25_00, ['knowledge', 'road'], 4),
  uz: la('State Road Safety Service', 10, 18, 10_00, ['knowledge', 'road'], 4), kg: la('State Registration Service', 10, 18, 15_00, ['knowledge', 'road'], 4), tj: la('State Automobile Inspectorate', 10, 18, 100_00, ['knowledge', 'road'], 6),
  tm: la('State Road Inspectorate', 10, 18, 100_00, ['knowledge', 'road'], 8), mn: la('Traffic Police', 10, 18, 20_00, ['knowledge', 'road'], 4), cn: la('Vehicle Administration Office', 6, 18, 70_00, ['knowledge', 'road'], 8),
  hk: la('Transport Department', 10, 18, 115_00, ['knowledge', 'road'], 8), mo: la('Transport Bureau', 10, 18, 40_00, ['knowledge', 'road'], 8), tw: la('Motor Vehicles Office', 99, 18, 15_00, ['knowledge', 'road'], 4),
  jp: la('Prefectural Public Safety Commission', 5, 18, 2_400_00, ['knowledge', 'road'], 8), kr: la('Korea Road Traffic Authority', 10, 18, 80_00, ['knowledge', 'road'], 4), kp: la('Traffic Safety Bureau', 5, 18, 5_00, ['knowledge', 'road'], 12),
  sg: la('Singapore Police Force Traffic Police', 99, 18, 1_800_00, ['knowledge', 'road'], 10), my: la('Jabatan Pengangkutan Jalan', 10, 17, 1_000_00, ['knowledge', 'road'], 6), th: la('Department of Land Transport', 5, 18, 300_00, ['knowledge', 'road'], 4),
  vn: la('Department of Transport', 10, 18, 200_00, ['knowledge', 'road'], 6), id: la('Satpas, Korlantas Polri', 5, 17, 15_00, ['knowledge', 'road'], 4), ph: la('Land Transportation Office', 10, 17, 600_00, ['knowledge', 'road'], 4),
  bn: la('Land Transport Department', 10, 18, 100_00, ['knowledge', 'road'], 6), kh: la('Ministry of Public Works and Transport', 10, 18, 100_00, ['knowledge', 'road'], 6), la: la('Department of Transport', 5, 18, 100_00, ['knowledge', 'road'], 6),
  mm: la('Road Transport Administration Department', 5, 18, 50_00, ['knowledge', 'road'], 8), tl: la('Direção Nacional de Transportes Terrestres', 5, 18, 50_00, ['knowledge', 'road'], 8),
  jm: la('Island Traffic Authority', 5, 17, 100_00, ['knowledge', 'road'], 6), tt: la('Licensing Division', 5, 17, 100_00, ['knowledge', 'road'], 6), bs: la('Road Traffic Department', 5, 17, 100_00, ['knowledge', 'road'], 4),
  bb: la('Barbados Licensing Authority', 5, 16, 100_00, ['knowledge', 'road'], 4), cu: la('Dirección de Licencias de Conducción', 10, 18, 100_00, ['knowledge', 'road'], 8), do: la('Dirección General de Tránsito Terrestre', 8, 18, 35_00, ['knowledge', 'road'], 4),
  ht: la('Service de la Circulation', 5, 18, 50_00, ['knowledge', 'road'], 8), ag: la('Transport Board', 5, 17, 100_00, ['knowledge', 'road'], 4), lc: la('Ministry of Infrastructure', 5, 17, 100_00, ['knowledge', 'road'], 4),
  gd: la('Traffic Department', 5, 17, 100_00, ['knowledge', 'road'], 4), kn: la('Traffic Department', 5, 17, 100_00, ['knowledge', 'road'], 4), vc: la('Licensing Authority', 5, 17, 100_00, ['knowledge', 'road'], 4), dm: la('Traffic Department', 5, 17, 100_00, ['knowledge', 'road'], 4),
  mx: la('Secretaría de Movilidad', 3, 18, 900_00, ['knowledge', 'road'], 1), gt: la('Departamento de Tránsito', 5, 18, 400_00, ['knowledge', 'road'], 2), bz: la('Traffic Department', 1, 17, 50_00, ['knowledge', 'road'], 2),
  hn: la('Instituto Hondureño de Transporte Terrestre', 5, 18, 800_00, ['knowledge', 'road'], 2), sv: la('Viceministerio de Transporte', 5, 18, 60_00, ['knowledge', 'road'], 2), ni: la('Policía Nacional', 5, 18, 50_00, ['knowledge', 'road'], 2),
  cr: la('Consejo de Seguridad Vial', 6, 18, 40_00, ['knowledge', 'road'], 3), pa: la('Autoridad de Tránsito y Transporte Terrestre', 4, 18, 40_00, ['knowledge', 'road'], 2),
  co: la('Organismo de Tránsito', 10, 16, 80_00, ['knowledge', 'road'], 3), ve: la('INTT', 10, 18, 50_00, ['knowledge', 'road'], 8), ec: la('Agencia Nacional de Tránsito', 5, 18, 60_00, ['knowledge', 'road'], 3),
  pe: la('Ministerio de Transportes', 10, 18, 100_00, ['knowledge', 'road'], 3), bo: la('Dirección de Tránsito', 5, 18, 300_00, ['knowledge', 'road'], 3), cl: la('Municipalidad', 6, 18, 40_00, ['knowledge', 'road'], 3),
  ar: la('Municipio', 5, 17, 15_00, ['knowledge', 'road'], 3), uy: la('Intendencia', 10, 18, 80_00, ['knowledge', 'road'], 3), py: la('Municipalidad', 5, 18, 25_00, ['knowledge', 'road'], 3), br: la('DETRAN', 10, 18, 900_00, ['knowledge', 'road'], 8),
  gy: la('Guyana Police Force', 5, 17, 25_00, ['knowledge', 'road'], 6), sr: la('Korps Politie Suriname', 5, 18, 200_00, ['knowledge', 'road'], 6),
  fj: la('Land Transport Authority', 10, 17, 100_00, ['knowledge', 'road'], 4), pg: la('Motor Traffic Registry', 3, 17, 100_00, ['knowledge', 'road'], 6), sb: la('Transport Division', 3, 17, 100_00, ['knowledge', 'road'], 6),
  vu: la('Ministry of Infrastructure', 5, 18, 45_00, ['knowledge', 'road'], 6), ws: la('Land Transport Authority', 5, 17, 100_00, ['knowledge', 'road'], 4), to: la('Ministry of Infrastructure', 5, 18, 50_00, ['knowledge', 'road'], 4),
  ki: la('Police Traffic Unit', 5, 18, 20_00, ['knowledge', 'road'], 6), tv: la('Police', 5, 18, 20_00, ['knowledge', 'road'], 6), nr: la('Police', 5, 18, 20_00, ['knowledge', 'road'], 6),
  fm: la('Department of Public Safety', 3, 16, 20_00, ['knowledge', 'road'], 6), mh: la('Department of Public Safety', 3, 16, 20_00, ['knowledge', 'road'], 6), pw: la('Bureau of Public Safety', 3, 16, 20_00, ['knowledge', 'road'], 6),
  mc: la('Service des Titres de Circulation', 15, 18, 400_00, ['knowledge', 'road'], 8), sm: la('Ufficio Registro Automezzi', 10, 18, 300_00, ['knowledge', 'road'], 8), va: la('Vatican Gendarmerie', 10, 18, 5_00, ['knowledge', 'road'], 8),
  ad: la('Servei de Tràmits', 10, 18, 300_00, ['knowledge', 'road'], 8), li: la('Amt für Strassenverkehr', 99, 18, 1_500_00, ['knowledge', 'road'], 8),
};

/** The state and provincial offices, where the license is really the region's. Keyed by region id. */
export const REGIONAL_LICENSE_OFFICES: Readonly<Record<string, string>> = {
  'us-al': 'Alabama Law Enforcement Agency', 'us-ak': 'Alaska DMV', 'us-az': 'Arizona MVD', 'us-ar': 'Arkansas DFA', 'us-ca': 'California DMV',
  'us-co': 'Colorado DMV', 'us-ct': 'Connecticut DMV', 'us-de': 'Delaware DMV', 'us-dc': 'DC DMV', 'us-fl': 'Florida FLHSMV', 'us-ga': 'Georgia DDS',
  'us-hi': 'Hawaii County Driver Licensing', 'us-id': 'Idaho DMV', 'us-il': 'Illinois Secretary of State', 'us-in': 'Indiana BMV', 'us-ia': 'Iowa DOT',
  'us-ks': 'Kansas Division of Vehicles', 'us-ky': 'Kentucky Transportation Cabinet', 'us-la': 'Louisiana OMV', 'us-me': 'Maine BMV', 'us-md': 'Maryland MVA',
  'us-ma': 'Massachusetts RMV', 'us-mi': 'Michigan Secretary of State', 'us-mn': 'Minnesota DVS', 'us-ms': 'Mississippi DPS', 'us-mo': 'Missouri DOR',
  'us-mt': 'Montana MVD', 'us-ne': 'Nebraska DMV', 'us-nv': 'Nevada DMV', 'us-nh': 'New Hampshire DMV', 'us-nj': 'New Jersey MVC', 'us-nm': 'New Mexico MVD',
  'us-ny': 'New York DMV', 'us-nc': 'North Carolina DMV', 'us-nd': 'North Dakota DOT', 'us-oh': 'Ohio BMV', 'us-ok': 'Oklahoma Service Oklahoma', 'us-or': 'Oregon DMV',
  'us-pa': 'PennDOT', 'us-ri': 'Rhode Island DMV', 'us-sc': 'South Carolina DMV', 'us-sd': 'South Dakota DPS', 'us-tn': 'Tennessee DOS', 'us-tx': 'Texas DPS',
  'us-ut': 'Utah DLD', 'us-vt': 'Vermont DMV', 'us-va': 'Virginia DMV', 'us-wa': 'Washington DOL', 'us-wv': 'West Virginia DMV', 'us-wi': 'Wisconsin DMV', 'us-wy': 'Wyoming DOT',
  'ca-01': 'Alberta Registry Agent', 'ca-02': 'ICBC', 'ca-03': 'Manitoba Public Insurance', 'ca-04': 'Service New Brunswick', 'ca-05': 'Motor Registration Division',
  'ca-07': 'Registry of Motor Vehicles', 'ca-08': 'ServiceOntario', 'ca-09': 'Access PEI', 'ca-10': 'SAAQ', 'ca-11': 'SGI', 'ca-12': 'Yukon Motor Vehicles', 'ca-13': 'NWT DMV', 'ca-14': 'Nunavut Motor Vehicles',
  'au-01': 'Access Canberra', 'au-02': 'Service NSW', 'au-03': 'MVR NT', 'au-04': 'Queensland TMR', 'au-05': 'Service SA', 'au-06': 'Service Tasmania', 'au-07': 'VicRoads', 'au-08': 'Department of Transport WA',
};

/** The office that issues a license where this person lives. */
export function licenseAuthorityFor(countryId: string, regionId?: string): { issuerId: string; authority: LicenseAuthority; office: string } | undefined {
  const issuerId = PASSPORT_OF[countryId] && !LICENSE_AUTHORITIES[countryId] ? PASSPORT_OF[countryId]! : countryId;
  const authority = LICENSE_AUTHORITIES[issuerId];
  if (!authority) return undefined;
  const office = (regionId && REGIONAL_LICENSE_OFFICES[regionId]) || authority.authority;
  return { issuerId, authority, office };
}

/** Countries that let you swap a full license from these places without retesting. Public record, kept small on purpose. */
export const LICENSE_EXCHANGE: Readonly<Record<string, readonly string[]>> = {
  uk: ['au', 'ca', 'nz', 'sg', 'za', 'ch', 'kr', 'jp', 'hk', 'fr', 'de', 'it', 'es', 'nl', 'be', 'ie', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'pt'],
  au: ['uk', 'ca', 'nz', 'sg', 'us', 'ie', 'fr', 'de', 'it', 'es', 'nl', 'be', 'at', 'se', 'no', 'dk', 'fi', 'jp', 'kr', 'ch'],
  ca: ['uk', 'au', 'nz', 'us', 'ie', 'fr', 'de', 'kr', 'jp', 'ch', 'at', 'be', 'tw'],
  nz: ['uk', 'au', 'ca', 'us', 'ie', 'fr', 'de', 'it', 'es', 'nl', 'be', 'at', 'se', 'no', 'dk', 'fi', 'jp', 'kr', 'sg', 'za', 'ch'],
  fr: ['uk', 'ca', 'au', 'nz', 'de', 'it', 'es', 'nl', 'be', 'ie', 'at', 'ch', 'jp', 'kr', 'sg'],
  de: ['uk', 'ca', 'au', 'nz', 'fr', 'it', 'es', 'nl', 'be', 'ie', 'at', 'ch', 'jp', 'kr', 'sg', 'za', 'us'],
  us: [],
};

/** What a passport line says beside a real authority. */
export const DOCUMENT_NOTE = 'A real issuing authority, its validity and its tests are public record. The fee and the wait are SLATE’s calibration and move with the year and the office.';
export const SIX_MONTH_NOTE = 'Many countries refuse entry on a passport with less than six months left. SLATE doesn’t carry the table of which, so it warns for every border and refuses for none.';
