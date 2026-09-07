/**
 * SLATE — who really writes insurance, and where.
 *
 * Every policy in the game is written by a company that really sells that
 * line in the country the holder lives in. A car in Lagos is insured by
 * Leadway or AIICO, not by anyone from Ohio; a house in Manchester by Aviva
 * or Direct Line; a camera package by Athos or Front Row, who really write
 * production kit; a boat by Pantaenius. Every one of the 252 countries in the
 * geography is accounted for: named insurers that operate there, its
 * metropole's market (a British Overseas Territory buys from British
 * insurers; French Polynesia from AXA and Groupama), a local-only market
 * whose companies SLATE does not name, or no market at all, with a reason.
 * `tools/insurer-coverage` in the gate counts them.
 *
 * What a company writes is SLATE's reading of its public business, in broad
 * lines: a composite insurer sells motor, home, life and health; a life
 * office sells life; a specialist sells the one thing it is known for. The
 * lines are not a quote from anybody's rate book, and the premium is
 * SLATE's own calibration, as it always was.
 *
 * Nothing here is a health scheme you can buy: a state scheme is named so
 * the game can say what private cover sits on top of.
 */

import type { InsuranceLine } from '../domain/model';
import { PASSPORT_OF } from './documents';

export interface Insurer {
  /** The company, as it names itself. */
  name: string;
  /** The lines it writes, in the game's fifteen. */
  lines: readonly InsuranceLine[];
  /** A specialist that writes only in these countries. Absent: wherever it is listed, or through a broker anywhere. */
  onlyIn?: readonly string[];
  /** The group it belongs to, when the name alone does not say. */
  group?: string;
}

// --- Line bundles, so a composite insurer is one word --------------------

const PC: readonly InsuranceLine[] = ['auto', 'homeowners', 'renters'];
const LIFE: readonly InsuranceLine[] = ['life'];
const HEALTH: readonly InsuranceLine[] = ['health', 'dental', 'vision'];
const GENERAL: readonly InsuranceLine[] = [...PC, 'travel', 'business', 'umbrella'];
const COMPOSITE: readonly InsuranceLine[] = [...GENERAL, ...LIFE, ...HEALTH];
const NONLIFE: readonly InsuranceLine[] = [...GENERAL, 'marine'];
const GENERAL_LIFE: readonly InsuranceLine[] = [...GENERAL, ...LIFE];
const LIFE_HEALTH: readonly InsuranceLine[] = [...LIFE, ...HEALTH];

const registry = new Map<string, Insurer>();
function add(name: string, lines: readonly InsuranceLine[], extra?: { onlyIn?: readonly string[]; group?: string }): string {
  if (!registry.has(name)) registry.set(name, { name, lines, ...extra });
  return name;
}
/** A composite insurer named once, listed in many countries. */
const c = (name: string, group?: string): string => add(name, COMPOSITE, group ? { group } : undefined);
/** A property, casualty and life insurer that does not write health: the American and British shape. */
const gl = (name: string, group?: string): string => add(name, GENERAL_LIFE, group ? { group } : undefined);
const g = (name: string, group?: string): string => add(name, GENERAL, group ? { group } : undefined);
const l = (name: string, group?: string): string => add(name, LIFE, group ? { group } : undefined);
const h = (name: string, group?: string): string => add(name, HEALTH, group ? { group } : undefined);
const lh = (name: string, group?: string): string => add(name, LIFE_HEALTH, group ? { group } : undefined);
const nl = (name: string, group?: string): string => add(name, NONLIFE, group ? { group } : undefined);

// --- The world's groups, once each --------------------------------------

const ALLIANZ = c('Allianz');
const AXA = c('AXA');
const ZURICH = c('Zurich');
const GENERALI = c('Generali');
const MAPFRE = c('Mapfre');
const CHUBB = add('Chubb', [...GENERAL, 'valuables', 'marine', 'production', 'equipment', 'life']);
const AIG = add('AIG', [...GENERAL, 'aviation', 'marine', 'life', 'production']);
const LIBERTY = g('Liberty Mutual');
const METLIFE = lh('MetLife');
const PRUDENTIAL_PLC = lh('Prudential plc');
const AIA = lh('AIA');
const MANULIFE = lh('Manulife');
const SUNLIFE = lh('Sun Life');
const BUPA = h('Bupa');
const CIGNA = h('Cigna');
const HISCOX = add('Hiscox', ['business', 'valuables', 'homeowners', 'equipment', 'production', 'umbrella']);
const TOKIO = nl('Tokio Marine');
const SOMPO = nl('Sompo');
const MSIG = nl('MSIG', 'MS&AD');
const QBE = nl('QBE');
const SANLAM = c('Sanlam');
const OLD_MUTUAL = c('Old Mutual');
const HOLLARD = c('Hollard');
const JUBILEE = c('Jubilee Insurance');
const BRITAM = c('Britam');
const NSIA = c('NSIA Assurances');
const SUNU = c('SUNU Assurances');
const ACTIVA = c('Activa Assurances');
const SAGICOR = c('Sagicor');
const GUARDIAN_CARIBBEAN = c('Guardian Group');
const NAGICO = g('Nagico');
const CARIBBEAN_ALLIANCE = g('Caribbean Alliance Insurance');
const MASSY = g('Massy United Insurance');
const BEACON = g('Beacon Insurance');
const PALIG = lh('Pan-American Life');
const ASSA = c('ASSA Compañía de Seguros');
const SURA = c('Sura');
const HDI = g('HDI');
const GIG = c('Gulf Insurance Group');
const VIG = c('Vienna Insurance Group');
const UNIQA = c('UNIQA');
const TRIGLAV = c('Triglav');
const SAVA = c('Sava Insurance');
const IF_PC = g('If P&C Insurance');
const TRYG = g('Tryg');
const ERGO = c('ERGO', 'Munich Re');
const GRAWE = c('Grawe');
const NN = lh('NN Group');
const ACHMEA = c('Achmea');
const STANDARD_LIFE = l('Standard Life');
const FWD = lh('FWD');
const GREAT_EASTERN = lh('Great Eastern', 'OCBC');
const ETIQA = c('Etiqa', 'Maybank');
const CHINA_TAIPING = c('China Taiping');
const DAI_ICHI = l('Dai-ichi Life');
const CATHAY = c('Cathay Financial');
const FUBON = c('Fubon');

// --- Specialists, and where they write ------------------------------------

const JEWELERS_MUTUAL = add('Jewelers Mutual', ['valuables'], { onlyIn: ['us', 'ca'] });
const AXA_ART = add('AXA XL Art & Lifestyle', ['valuables'], { group: 'AXA' });
const TH_MARCH = add('T.H. March', ['valuables'], { onlyIn: ['uk'] });
const FRONT_ROW = add('Front Row Insurance Brokers', ['production', 'equipment'], { onlyIn: ['us', 'ca', 'uk'] });
const ATHOS = add('Athos Insurance Services', ['production', 'equipment'], { onlyIn: ['us'] });
const RUBEN = add('Aon / Albert G. Ruben Insurance Services', ['production', 'equipment'], { onlyIn: ['us'] });
const MIB = add('Media Insurance Brokers International', ['production', 'equipment'], { onlyIn: ['uk'] });
const AADUKI = add('Aaduki Multimedia Insurance', ['equipment'], { onlyIn: ['uk'] });
const TM_HCC = add('Tokio Marine HCC', ['production', 'equipment', 'business'], { group: 'Tokio Marine', onlyIn: ['us', 'uk'] });
const ALLIANZ_COMMERCIAL = add('Allianz Commercial', ['production', 'equipment', 'aviation', 'marine', 'business'], { group: 'Allianz' });
const AXA_XL = add('AXA XL', ['production', 'equipment', 'aviation', 'marine', 'business'], { group: 'AXA' });
const PANTAENIUS = add('Pantaenius', ['marine']);
const MARKEL = add('Markel', ['marine', 'business', 'equipment'], { onlyIn: ['us', 'uk', 'ca'] });
const GEICO_MARINE = add('GEICO Marine (BoatUS)', ['marine'], { group: 'GEICO', onlyIn: ['us'] });
const HAVEN_KJ = add('Haven Knox-Johnston', ['marine'], { onlyIn: ['uk'] });
const GJW = add('GJW Direct', ['marine'], { onlyIn: ['uk'] });
const CLUB_MARINE = add('Club Marine', ['marine'], { group: 'Allianz', onlyIn: ['au', 'nz'] });
const GLOBAL_AEROSPACE = add('Global Aerospace', ['aviation']);
const AVEMCO = add('Avemco', ['aviation'], { onlyIn: ['us'] });
const STARR_AVIATION = add('Starr Aviation', ['aviation'], { onlyIn: ['us', 'uk'] });
const OLD_REPUBLIC_AERO = add('Old Republic Aerospace', ['aviation'], { onlyIn: ['us'] });
const ALLIANZ_TRAVEL = add('Allianz Travel', ['travel'], { group: 'Allianz' });
const WORLD_NOMADS = add('World Nomads', ['travel']);
const TRAVEL_GUARD = add('AIG Travel Guard', ['travel'], { group: 'AIG' });
const AXA_ASSISTANCE = add('AXA Assistance', ['travel'], { group: 'AXA' });
const SAFETYWING = add('SafetyWing', ['travel', 'health']);
const BUPA_GLOBAL = add('Bupa Global', HEALTH, { group: 'Bupa' });
const CIGNA_GLOBAL = add('Cigna Global', HEALTH, { group: 'Cigna' });
const ALLIANZ_CARE = add('Allianz Care', HEALTH, { group: 'Allianz' });
const AXA_GLOBAL_HEALTH = add('AXA Global Healthcare', HEALTH, { group: 'AXA' });
const AIG_PRIVATE = add('AIG Private Client', ['homeowners', 'valuables', 'umbrella', 'auto'], { group: 'AIG', onlyIn: ['us', 'uk'] });
const PURE = add('PURE Insurance', ['homeowners', 'valuables', 'umbrella', 'auto'], { onlyIn: ['us'] });

/**
 * Written through a broker, anywhere: the specialists that will cover a
 * camera package in Reykjavík or a hull in Phuket because nobody local does.
 * A name on here with `onlyIn` is offered only in those countries.
 */
export const GLOBAL_SPECIALISTS: Readonly<Record<InsuranceLine, readonly string[]>> = {
  health: [BUPA_GLOBAL, CIGNA_GLOBAL, ALLIANZ_CARE, AXA_GLOBAL_HEALTH, SAFETYWING],
  dental: [CIGNA_GLOBAL, BUPA_GLOBAL],
  vision: [CIGNA_GLOBAL],
  auto: [], homeowners: [], renters: [],
  valuables: [JEWELERS_MUTUAL, CHUBB, AXA_ART, HISCOX, TH_MARCH, AIG_PRIVATE, PURE],
  travel: [ALLIANZ_TRAVEL, WORLD_NOMADS, TRAVEL_GUARD, AXA_ASSISTANCE, SAFETYWING],
  life: [METLIFE, ALLIANZ, AXA, ZURICH],
  umbrella: [CHUBB, AIG_PRIVATE, PURE, ALLIANZ],
  business: [HISCOX, CHUBB, AIG, ZURICH, ALLIANZ_COMMERCIAL, AXA_XL, TM_HCC, MARKEL],
  production: [FRONT_ROW, ATHOS, RUBEN, MIB, CHUBB, ALLIANZ_COMMERCIAL, TM_HCC, AXA_XL],
  equipment: [ATHOS, FRONT_ROW, HISCOX, AADUKI, CHUBB, ALLIANZ_COMMERCIAL, MARKEL],
  marine: [PANTAENIUS, GEICO_MARINE, HAVEN_KJ, GJW, CLUB_MARINE, CHUBB, MARKEL, ALLIANZ_COMMERCIAL, AXA_XL],
  aviation: [GLOBAL_AEROSPACE, AVEMCO, STARR_AVIATION, OLD_REPUBLIC_AERO, AIG, ALLIANZ_COMMERCIAL, AXA_XL],
};

// --- Country by country ----------------------------------------------------

/** The insurers that really sell in a country, its own market first. Names only; the registry above carries the lines. */
export const INSURERS_BY_COUNTRY: Readonly<Record<string, readonly string[]>> = {
  // North America
  us: [gl('State Farm'), add('GEICO', ['auto', 'renters', 'umbrella'], { group: 'Berkshire Hathaway' }), add('Progressive', ['auto', 'renters', 'homeowners', 'marine']), gl('Allstate'), LIBERTY, gl('Nationwide'), g('Travelers'), gl('Farmers Insurance'), g('The Hartford'), CHUBB, AIG, AIG_PRIVATE, PURE,
    h('UnitedHealthcare'), h('Elevance Health (Anthem)'), h('Aetna', 'CVS Health'), CIGNA, h('Blue Cross Blue Shield'), h('Kaiser Permanente'), h('Humana'), add('Delta Dental', ['dental']), add('VSP Vision Care', ['vision']), add('EyeMed', ['vision']),
    METLIFE, l('Prudential Financial'), l('Northwestern Mutual'), l('New York Life'), l('Lincoln Financial'), HISCOX, JEWELERS_MUTUAL, FRONT_ROW, ATHOS, RUBEN, TM_HCC, GEICO_MARINE, MARKEL, GLOBAL_AEROSPACE, AVEMCO, STARR_AVIATION, OLD_REPUBLIC_AERO, ALLIANZ_TRAVEL, TRAVEL_GUARD, WORLD_NOMADS],
  ca: [g('Intact Insurance'), g('Aviva Canada', 'Aviva'), c('Desjardins Insurance'), g('TD Insurance'), c('The Co-operators'), g('Wawanesa'), g('Economical Insurance', 'Definity'), MANULIFE, SUNLIFE, lh('Canada Life'), h('Blue Cross Canada'), g('belairdirect', 'Intact'), g('Sonnet', 'Definity'), CHUBB, AIG, JEWELERS_MUTUAL, FRONT_ROW, MARKEL, ALLIANZ_TRAVEL, WORLD_NOMADS, GLOBAL_AEROSPACE],
  mx: [c('GNP Seguros'), c('AXA Seguros México', 'AXA'), g('Qualitas'), lh('Seguros Monterrey New York Life'), METLIFE, c('Mapfre México', 'Mapfre'), g('HDI Seguros México', 'HDI'), CHUBB, ZURICH, c('Seguros Banorte'), c('Seguros Inbursa'), c('Seguros Atlas'), SURA, ALLIANZ],

  // Central America and the Caribbean
  gt: [c('Seguros G&T'), c('Seguros El Roble'), c('Mapfre Guatemala', 'Mapfre'), c('Aseguradora General'), c('Seguros Universales'), ASSA, PALIG],
  bz: [g('RF&G Insurance'), g('Atlantic Insurance Belize'), g('Insurance Corporation of Belize'), GUARDIAN_CARIBBEAN],
  sv: [c('Asesuisa', 'Sura'), c('Mapfre La Centro Americana', 'Mapfre'), c('ACSA'), c('SISA'), ASSA, PALIG, g('Qualitas El Salvador', 'Qualitas')],
  hn: [c('Seguros Atlántida'), c('Mapfre Honduras', 'Mapfre'), c('Ficohsa Seguros'), c('Seguros Crefisa'), PALIG, c('Seguros Lafise')],
  ni: [c('INISER'), ASSA, c('Mapfre Nicaragua', 'Mapfre'), c('Seguros América'), c('Seguros Lafise')],
  cr: [c('Instituto Nacional de Seguros'), c('Mapfre Costa Rica', 'Mapfre'), ASSA, PALIG, g('Oceánica de Seguros'), g('Qualitas Costa Rica', 'Qualitas'), SAGICOR, h('BMI'), c('Adisa')],
  pa: [ASSA, c('Mapfre Panamá', 'Mapfre'), c('Internacional de Seguros'), SURA, PALIG, c('Banesco Seguros')],
  cu: [],
  do: [c('Seguros Universal'), h('Humano Seguros'), c('Mapfre BHD', 'Mapfre'), c('Seguros Reservas'), c('La Colonial'), SURA, h('ARS Palic'), g('Seguros Pepín'), c('Atlántica Seguros')],
  ht: [],
  jm: [SAGICOR, GUARDIAN_CARIBBEAN, g('JN General Insurance'), g('British Caribbean Insurance Company'), g('Advantage General'), g('Key Insurance'), g('General Accident Jamaica'), g('IronRock Insurance'), g('Insurance Company of the West Indies')],
  tt: [GUARDIAN_CARIBBEAN, SAGICOR, BEACON, g('Maritime General'), g('Tatil'), g('Colfire'), MASSY, g('Furness Anchorage General')],
  bb: [SAGICOR, GUARDIAN_CARIBBEAN, g('Insurance Corporation of Barbados'), MASSY, g('CGI Consumers’ Guarantee Insurance')],
  bs: [c('Colina Insurance'), c('Family Guardian'), g('Bahamas First'), g('RoyalStar Assurance'), g('Summit Insurance'), g('Insurance Company of the Bahamas'), g('Security & General'), SAGICOR],
  ky: [g('Cayman First'), g('Island Heritage'), SAGICOR, g('BritCay'), g('Fidelity Insurance (Cayman)')],
  bm: [c('BF&M'), c('Argus Group'), g('Colonial Group International'), g('Freisenbruch-Meyer')],
  ag: [g('Anjo Insurances'), SAGICOR, GUARDIAN_CARIBBEAN, CARIBBEAN_ALLIANCE],
  lc: [g('EC Global Insurance'), SAGICOR, GUARDIAN_CARIBBEAN, BEACON, MASSY, CARIBBEAN_ALLIANCE],
  vc: [g('St. Vincent Insurances'), SAGICOR, GUARDIAN_CARIBBEAN, g('Metrocint General')],
  gd: [g('Netherlands Insurance (Grenada)'), SAGICOR, GUARDIAN_CARIBBEAN, BEACON],
  dm: [SAGICOR, GUARDIAN_CARIBBEAN, CARIBBEAN_ALLIANCE],
  kn: [g('St. Kitts Nevis Insurance Company'), SAGICOR, GUARDIAN_CARIBBEAN, CARIBBEAN_ALLIANCE],
  aw: [c('Ennia'), NAGICO, GUARDIAN_CARIBBEAN, g('Boogaard Assurantiën'), c('Fatum', 'Guardian Group')],
  cw: [c('Ennia'), c('Fatum', 'Guardian Group'), NAGICO],
  sx: [NAGICO, c('Ennia'), c('Fatum', 'Guardian Group')],
  bq: [c('Ennia'), NAGICO],
  tc: [g('Colonial Group International'), GUARDIAN_CARIBBEAN],
  ai: [NAGICO, CARIBBEAN_ALLIANCE],
  vg: [NAGICO, g('Colonial Group International'), CARIBBEAN_ALLIANCE],
  ms: [],
  pr: [h('Triple-S'), c('Mapfre Puerto Rico', 'Mapfre'), c('Universal Insurance Company'), h('MCS'), h('MMM Healthcare'), c('Cooperativa de Seguros Múltiples'), h('First Medical'), h('Humana')],
  vi: [g('Guardian Insurance (USVI)'), g('Marshall & Sterling')],

  // South America
  br: [c('Porto Seguro'), c('Bradesco Seguros'), c('SulAmérica'), c('Itaú Seguros'), c('Tokio Marine Seguradora', 'Tokio Marine'), c('Mapfre Brasil', 'Mapfre'), c('Allianz Seguros Brasil', 'Allianz'), g('Azul Seguros', 'Porto Seguro'), g('HDI Seguros Brasil', 'HDI'), g('Liberty Seguros Brasil', 'HDI'), c('Zurich Brasil', 'Zurich'), c('Caixa Seguradora'), h('Amil'), h('Unimed'), h('Hapvida NotreDame Intermédica'), l('Prudential do Brasil'), l('Icatu Seguros'), CHUBB],
  ar: [c('Federación Patronal'), c('Sancor Seguros'), c('La Caja'), c('Provincia Seguros'), c('Zurich Argentina', 'Zurich'), c('Allianz Argentina', 'Allianz'), c('Mapfre Argentina', 'Mapfre'), c('San Cristóbal Seguros'), h('Galeno'), h('OSDE'), h('Swiss Medical'), h('Medifé'), c('La Segunda'), c('Rivadavia Seguros'), c('Mercantil Andina'), c('Nación Seguros'), CHUBB, SURA, g('HDI Seguros Argentina', 'HDI')],
  cl: [SURA, c('BCI Seguros'), c('Mapfre Chile', 'Mapfre'), g('Liberty Seguros Chile', 'HDI'), g('HDI Seguros Chile', 'HDI'), c('Zurich Chile', 'Zurich'), c('Consorcio'), l('BICE Vida'), c('Chilena Consolidada', 'Zurich'), c('Seguros Security'), h('Isapre Banmédica'), h('Isapre Colmena'), h('Isapre Cruz Blanca'), METLIFE, l('Confuturo')],
  co: [SURA, c('Seguros Bolívar'), c('Allianz Colombia', 'Allianz'), c('Mapfre Colombia', 'Mapfre'), c('Liberty Seguros Colombia', 'HDI'), c('AXA Colpatria', 'AXA'), g('Seguros del Estado'), CHUBB, ZURICH, g('SBS Seguros'), c('Positiva Compañía de Seguros'), c('La Previsora'), h('Colmena Salud'), h('Sanitas', 'Keralty'), h('Compensar'), h('Nueva EPS')],
  pe: [c('Rímac Seguros'), c('Pacífico Seguros'), c('La Positiva'), c('Mapfre Perú', 'Mapfre'), lh('Interseguro'), l('Protecta Security'), g('Qualitas Perú', 'Qualitas'), CHUBB, g('HDI Seguros Perú', 'HDI')],
  ec: [c('Seguros Equinoccial'), CHUBB, c('Seguros Sucre'), c('Mapfre Atlas', 'Mapfre'), c('Zurich Ecuador', 'Zurich'), g('Liberty Seguros Ecuador', 'HDI'), c('Aseguradora del Sur'), c('Seguros Alianza'), g('Sweaden'), h('BMI'), h('Salud S.A.'), c('Latina Seguros'), c('Hispana de Seguros')],
  ve: [c('Mercantil Seguros'), c('Seguros Caracas'), c('Seguros La Previsora'), c('Seguros Pirámide'), c('Seguros Universitas'), c('Mapfre La Seguridad', 'Mapfre'), c('Multinacional de Seguros'), c('Seguros Horizonte')],
  bo: [c('Alianza Seguros'), c('La Boliviana Ciacruz'), c('BISA Seguros'), c('Nacional Seguros'), g('Credinform'), g('Unibienes'), c('Fortaleza Seguros')],
  py: [c('Mapfre Paraguay', 'Mapfre'), c('Aseguradora del Este'), c('Aseguradora Tajy'), c('Aseguradora Paraguaya'), c('La Consolidada'), c('Sancor Seguros Paraguay', 'Sancor Seguros'), c('Patria S.A. de Seguros'), c('Fénix Seguros'), c('Regional Seguros'), c('Cenit Seguros')],
  uy: [c('Banco de Seguros del Estado'), c('Mapfre Uruguay', 'Mapfre'), SURA, c('Porto Seguro Uruguay', 'Porto Seguro'), g('HDI Seguros Uruguay', 'HDI'), c('Sancor Seguros Uruguay', 'Sancor Seguros'), METLIFE, g('SBI Seguros'), g('Berkley Uruguay')],
  gy: [c('GTM Group'), c('Hand-in-Hand Insurance'), c('Demerara Mutual'), c('Assuria')],
  sr: [c('Assuria'), c('Self Reliance'), c('Fatum', 'Guardian Group'), g('Parsasco')],

  // Western Europe
  uk: [add('Aviva', [...GENERAL_LIFE, ...HEALTH]), PRUDENTIAL_PLC, c('AXA UK', 'AXA'), g('Direct Line'), g('Admiral'), g('Churchill', 'Direct Line Group'), gl('LV='), g('Hastings Direct'), BUPA, lh('Vitality'), add('Legal & General', ['life', 'homeowners', 'renters']), HISCOX, gl('Zurich UK', 'Zurich'), g('Allianz UK', 'Allianz'), gl('NFU Mutual'), g('Saga'), h('Simplyhealth'), add('Denplan', ['dental'], { group: 'Simplyhealth' }), g('esure'), g('Ageas UK', 'Ageas'), l('Royal London'), l('Scottish Widows'), STANDARD_LIFE, AIG, AIG_PRIVATE, TH_MARCH, MIB, AADUKI, FRONT_ROW, TM_HCC, HAVEN_KJ, GJW, PANTAENIUS, MARKEL, GLOBAL_AEROSPACE, STARR_AVIATION, ALLIANZ_TRAVEL, WORLD_NOMADS],
  ie: [c('Aviva Ireland', 'Aviva'), c('AXA Ireland', 'AXA'), c('Allianz Ireland', 'Allianz'), c('FBD Insurance'), h('Vhi Healthcare'), h('Laya Healthcare', 'AXA'), h('Irish Life Health'), l('Irish Life'), c('Zurich Ireland', 'Zurich'), c('RSA Ireland', 'Intact'), g('Liberty Insurance Ireland', 'HDI')],
  fr: [AXA, c('Allianz France', 'Allianz'), c('Groupama'), c('MAIF'), c('MACIF'), c('MMA', 'Covéa'), c('GMF', 'Covéa'), c('Generali France', 'Generali'), h('Harmonie Mutuelle'), h('Malakoff Humanis'), l('CNP Assurances'), c('Crédit Agricole Assurances'), c('BNP Paribas Cardif'), c('Matmut'), c('MACSF'), PANTAENIUS, ALLIANZ_TRAVEL],
  de: [ALLIANZ, HDI, c('HUK-Coburg'), ERGO, c('AXA Deutschland', 'AXA'), c('R+V Versicherung'), lh('Debeka'), h('Techniker Krankenkasse'), h('Barmer'), h('DKV Deutsche Krankenversicherung', 'ERGO'), c('Signal Iduna'), c('HDI Versicherung', 'HDI'), c('Gothaer'), c('LVM Versicherung'), c('Württembergische'), c('Generali Deutschland', 'Generali'), c('Zurich Deutschland', 'Zurich'), c('Provinzial'), c('VHV'), PANTAENIUS],
  it: [GENERALI, c('UnipolSai'), c('Allianz Italia', 'Allianz'), c('AXA Italia', 'AXA'), c('Reale Mutua'), c('Cattolica Assicurazioni', 'Generali'), c('Poste Assicura'), c('Intesa Sanpaolo Assicura'), c('Zurich Italia', 'Zurich'), c('Vittoria Assicurazioni')],
  es: [MAPFRE, c('Mutua Madrileña'), c('Allianz Seguros', 'Allianz'), c('AXA Seguros', 'AXA'), h('Sanitas', 'Bupa'), h('Adeslas', 'SegurCaixa'), g('Línea Directa'), c('Catalana Occidente'), c('Generali España', 'Generali'), c('Santalucía'), c('Pelayo'), h('Asisa'), h('DKV Seguros', 'ERGO'), c('Reale Seguros', 'Reale Mutua'), c('Zurich Seguros', 'Zurich')],
  pt: [c('Fidelidade'), c('Ageas Seguros', 'Ageas'), c('Tranquilidade', 'Generali'), c('Allianz Portugal', 'Allianz'), h('Multicare', 'Fidelidade'), h('Médis', 'Ageas'), c('Zurich Portugal', 'Zurich'), c('Liberty Seguros Portugal', 'Generali'), c('Lusitania Seguros')],
  nl: [ACHMEA, NN, c('Centraal Beheer', 'Achmea'), c('Interpolis', 'Achmea'), h('Zilveren Kruis', 'Achmea'), c('Nationale-Nederlanden', 'NN Group'), c('a.s.r.'), c('Univé'), h('CZ'), h('VGZ'), h('Menzis'), l('Aegon'), c('Allianz Nederland', 'Allianz'), c('FBTO', 'Achmea'), h('DSW')],
  be: [c('AG Insurance', 'Ageas'), c('Ethias'), c('KBC Verzekeringen'), c('Belfius Insurance'), c('AXA Belgium', 'AXA'), c('Baloise'), h('DKV Belgium', 'ERGO'), c('Allianz Belgium', 'Allianz'), c('P&V Verzekeringen'), c('NN Belgium', 'NN Group')],
  lu: [c('Foyer'), c('Lalux'), c('Baloise'), c('AXA Luxembourg', 'AXA'), l('Cardif Lux Vie'), l('Swiss Life')],
  ch: [ZURICH, c('AXA Schweiz', 'AXA'), l('Swiss Life'), c('Helvetia'), c('Baloise'), c('Die Mobiliar'), c('Allianz Suisse', 'Allianz'), c('Generali Schweiz', 'Generali'), h('CSS'), h('Helsana'), h('Swica'), h('Sanitas'), h('Concordia'), h('Visana'), c('Vaudoise'), PANTAENIUS],
  at: [UNIQA, VIG, GRAWE, c('Wiener Städtische', 'Vienna Insurance Group'), c('Generali Österreich', 'Generali'), c('Allianz Österreich', 'Allianz'), c('Donau Versicherung', 'Vienna Insurance Group'), c('Merkur Versicherung'), c('Zürich Österreich', 'Zurich'), c('Grazer Wechselseitige'), c('Helvetia Österreich', 'Helvetia')],
  li: [c('Liechtenstein Life'), ZURICH, c('AXA Schweiz', 'AXA')],
  mc: [AXA, c('Allianz France', 'Allianz'), c('Generali France', 'Generali'), PANTAENIUS],
  ad: [],
  sm: [GENERALI, c('UnipolSai'), c('Allianz Italia', 'Allianz')],
  va: [],
  mt: [c('Mapfre Middlesea', 'Mapfre'), c('GasanMamo Insurance'), c('Atlas Insurance'), c('Elmo Insurance'), c('Citadel Insurance')],
  gi: [c('Aviva'), c('AXA UK', 'AXA'), c('Zurich UK', 'Zurich'), g('Ibex Insurance'), BUPA],

  // Nordics
  se: [IF_PC, c('Folksam'), c('Länsförsäkringar'), c('Trygg-Hansa', 'Tryg'), l('Skandia'), c('Moderna Försäkringar', 'Tryg'), h('Euro Accident'), l('SEB Pension och Försäkring'), PANTAENIUS],
  no: [c('Gjensidige'), IF_PC, TRYG, c('Fremtind'), c('Storebrand'), c('SpareBank 1 Forsikring'), c('DNB Forsikring'), c('Frende'), PANTAENIUS],
  dk: [TRYG, c('Topdanmark', 'Sampo'), c('Alm. Brand'), c('Codan', 'Alm. Brand'), IF_PC, c('GF Forsikring'), c('Danica Pension', 'Danske Bank'), l('PFA Pension'), h('Sygeforsikringen danmark'), PANTAENIUS],
  fi: [c('LähiTapiola'), c('OP Vakuutus'), IF_PC, c('Fennia'), c('Pohjantähti'), l('Mandatum'), c('Turva'), c('Aktia'), l('Nordea Henkivakuutus')],
  is: [c('Sjóvá'), c('VÍS'), c('TM'), c('Vörður')],
  gl: [c('Kalaallit Forsikring', 'Tryg'), TRYG],
  fo: [c('Tryggingarfelagið Føroyar'), c('Trygd')],
  ax: [c('Ålands Ömsesidiga Försäkringsbolag'), c('LähiTapiola'), IF_PC],

  // Central and Eastern Europe
  pl: [c('PZU'), c('Warta', 'Talanx'), c('ERGO Hestia', 'ERGO'), c('Allianz Polska', 'Allianz'), g('Link4', 'PZU'), h('LUX MED', 'Bupa'), h('Medicover'), c('Compensa', 'Vienna Insurance Group'), c('Generali Polska', 'Generali'), c('UNIQA Polska', 'UNIQA'), c('Nationale-Nederlanden Polska', 'NN Group'), c('InterRisk', 'Vienna Insurance Group')],
  cz: [c('Generali Česká pojišťovna', 'Generali'), c('Kooperativa', 'Vienna Insurance Group'), c('Allianz pojišťovna', 'Allianz'), c('ČSOB Pojišťovna', 'KBC'), c('Česká podnikatelská pojišťovna', 'Vienna Insurance Group'), c('UNIQA pojišťovna', 'UNIQA'), c('Direct pojišťovna'), h('Všeobecná zdravotní pojišťovna')],
  sk: [c('Allianz – Slovenská poisťovňa', 'Allianz'), c('Kooperativa', 'Vienna Insurance Group'), c('Generali Slovensko', 'Generali'), c('Union poisťovňa', 'Achmea'), c('UNIQA Slovensko', 'UNIQA'), c('ČSOB Poisťovňa', 'KBC'), h('Dôvera'), h('Všeobecná zdravotná poisťovňa')],
  hu: [c('Allianz Hungária', 'Allianz'), c('Generali Biztosító', 'Generali'), c('Alfa Biztosító', 'Vienna Insurance Group'), c('Groupama Biztosító', 'Groupama'), c('UNIQA Biztosító', 'UNIQA'), c('Union Biztosító', 'Vienna Insurance Group'), c('K&H Biztosító', 'KBC'), c('Posta Biztosító'), c('NN Biztosító', 'NN Group')],
  ro: [c('Allianz-Țiriac', 'Allianz'), c('Groupama Asigurări', 'Groupama'), c('Omniasig', 'Vienna Insurance Group'), c('Generali România', 'Generali'), c('NN Asigurări', 'NN Group'), c('Asirom', 'Vienna Insurance Group'), c('UNIQA Asigurări', 'UNIQA'), h('Regina Maria'), h('MedLife'), c('Signal Iduna România', 'Signal Iduna')],
  bg: [c('Bulstrad', 'Vienna Insurance Group'), c('Allianz Bulgaria', 'Allianz'), c('DZI', 'KBC'), c('Armeec'), c('Euroins'), c('Generali Bulgaria', 'Generali'), c('UNIQA Bulgaria', 'UNIQA'), c('Lev Ins'), c('OZK Insurance')],
  gr: [c('Ethniki Asfalistiki'), c('Interamerican', 'Achmea'), c('Eurolife FFH'), c('Generali Hellas', 'Generali'), c('Allianz Greece', 'Allianz'), c('NN Hellas', 'NN Group'), c('Groupama Asfalistiki', 'Groupama'), c('Ydrogios'), c('Interlife'), c('Hellenic Post Insurance')],
  cy: [c('Universal Life'), c('CNP Cyprialife', 'CNP Assurances'), c('Trust Insurance Cyprus'), c('Eurolife Cyprus'), c('Hydra Insurance'), c('Pancyprian Insurance'), c('Gan Direct', 'Groupama'), c('Altius Insurance'), c('Allianz Hellas', 'Allianz')],
  hr: [c('Croatia Osiguranje'), c('Allianz Hrvatska', 'Allianz'), c('Euroherc Osiguranje'), c('Wiener Osiguranje', 'Vienna Insurance Group'), c('Generali Osiguranje', 'Generali'), c('Adriatic Osiguranje'), c('UNIQA Osiguranje', 'UNIQA'), c('Grawe Hrvatska', 'Grawe'), c('Agram Life')],
  si: [TRIGLAV, SAVA, c('Generali Zavarovalnica', 'Generali'), h('Vzajemna'), c('Zavarovalnica Sava', 'Sava Insurance'), c('Merkur Zavarovalnica', 'Merkur Versicherung'), c('Grawe Slovenija', 'Grawe'), c('Modra Zavarovalnica')],
  rs: [c('Dunav Osiguranje'), c('Generali Osiguranje Srbija', 'Generali'), c('DDOR Novi Sad', 'UnipolSai'), c('Wiener Städtische Beograd', 'Vienna Insurance Group'), c('Triglav Osiguranje Beograd', 'Triglav'), c('Sava Neživotno Osiguranje', 'Sava Insurance'), c('UNIQA Srbija', 'UNIQA'), c('Milenijum Osiguranje'), c('Globos Osiguranje'), c('Grawe Srbija', 'Grawe')],
  ba: [c('Sarajevo Osiguranje'), c('UNIQA BiH', 'UNIQA'), c('Triglav Osiguranje Sarajevo', 'Triglav'), c('Euroherc Osiguranje BiH'), c('Adriatic Osiguranje BiH'), c('Croatia Osiguranje BiH', 'Croatia Osiguranje'), c('Grawe BiH', 'Grawe'), c('Wiener Osiguranje BiH', 'Vienna Insurance Group'), c('Bosna-Sunce Osiguranje')],
  me: [c('Lovćen Osiguranje', 'Triglav'), c('Sava Osiguranje Podgorica', 'Sava Insurance'), c('Generali Osiguranje Montenegro', 'Generali'), c('UNIQA Crna Gora', 'UNIQA'), c('Wiener Städtische Podgorica', 'Vienna Insurance Group'), c('Grawe Montenegro', 'Grawe'), c('Swiss Osiguranje')],
  mk: [c('Triglav Osiguruvanje', 'Triglav'), c('Croatia Osiguruvanje', 'Croatia Osiguranje'), c('Sava Osiguruvanje', 'Sava Insurance'), c('Eurolink Osiguruvanje', 'Grawe'), c('UNIQA Makedonija', 'UNIQA'), c('Winner', 'Vienna Insurance Group'), c('Halk Osiguruvanje', 'Halkbank'), c('Makedonija Osiguruvanje', 'Vienna Insurance Group'), c('Grawe Makedonija', 'Grawe')],
  al: [c('Sigal UNIQA Group Austria', 'UNIQA'), c('Sigma Interalbanian', 'Vienna Insurance Group'), c('Albsig'), c('Intersig', 'Vienna Insurance Group'), c('Eurosig'), c('Atlantik'), c('Ansig'), c('Insig')],
  xk: [c('Sigal UNIQA Group Austria', 'UNIQA'), c('Scardian'), c('Illyria', 'Sava Insurance'), c('Elsig'), c('Sigma Interalbanian', 'Vienna Insurance Group'), c('Eurosig'), c('Prisig'), c('Dukagjini'), c('Siguria')],
  md: [c('Moldasig'), c('Grawe Carat', 'Grawe'), c('Asito'), c('Donaris', 'Vienna Insurance Group'), c('Moldcargo'), c('General Asigurări'), c('Acord Grup')],
  ua: [c('ARX', 'Fairfax'), c('UNIQA Ukraine', 'UNIQA'), c('TAS Insurance Group'), c('PZU Ukraine', 'PZU'), c('INGO Ukraine'), c('Oranta'), c('Universalna', 'Fairfax'), c('VUSO'), c('Arsenal Insurance'), c('Kniazha', 'Vienna Insurance Group'), c('USG', 'Vienna Insurance Group')],
  by: [c('Belgosstrakh'), c('Belneftestrakh'), c('TASK'), c('Promtransinvest'), c('Belarusian National Reinsurance Organization'), c('Kupala'), c('Imkliva Insurance'), c('Belvneshstrakh')],
  ru: [c('SOGAZ'), c('Rosgosstrakh'), c('Ingosstrakh'), c('AlfaStrakhovanie'), c('RESO-Garantia'), c('SberInsurance'), c('VSK'), c('Renaissance Insurance'), c('Soglasie'), c('Tinkoff Insurance'), c('Zetta Insurance'), c('Absolut Insurance')],
  ee: [IF_PC, c('ERGO Estonia', 'ERGO'), c('Swedbank P&C', 'Swedbank'), c('Salva Kindlustus'), c('Compensa', 'Vienna Insurance Group'), c('PZU Estonia', 'PZU'), c('BTA Baltic', 'Vienna Insurance Group'), c('Gjensidige Baltic', 'Gjensidige'), c('SEB Elu- ja Pensionikindlustus', 'SEB')],
  lv: [c('BTA Baltic', 'Vienna Insurance Group'), c('Balta', 'PZU'), IF_PC, c('ERGO Latvia', 'ERGO'), c('Gjensidige Baltic', 'Gjensidige'), c('Balcia'), c('Compensa', 'Vienna Insurance Group'), c('Swedbank P&C', 'Swedbank'), c('Seesam', 'Vienna Insurance Group')],
  lt: [c('Lietuvos draudimas', 'PZU'), c('BTA Baltic', 'Vienna Insurance Group'), IF_PC, c('ERGO Lietuva', 'ERGO'), c('Gjensidige Baltic', 'Gjensidige'), c('Compensa', 'Vienna Insurance Group'), c('Swedbank P&C', 'Swedbank'), c('Balcia'), c('SB draudimas', 'Šiaulių bankas')],
  ge: [c('Aldagi'), c('GPI Holding', 'Vienna Insurance Group'), c('Imedi L', 'Vienna Insurance Group'), c('Ardi'), c('TBC Insurance'), c('Unison'), c('IC Group'), c('Alpha Insurance'), c('PSP Insurance')],
  am: [c('Ingo Armenia'), c('Rosgosstrakh Armenia', 'Rosgosstrakh'), c('Sil Insurance'), c('Nairi Insurance'), c('Reso Armenia'), c('Armenia Insurance'), c('Efes Insurance')],
  az: [c('Pasha Insurance'), c('AtaSigorta'), c('Qala Insurance'), c('AXA MBASK', 'AXA'), c('Ateshgah'), c('Azerbaijan Industrial Insurance'), c('Meqa Sigorta'), c('Xalq Sigorta'), c('Naxçıvan Sığorta')],

  // Middle East and North Africa
  tr: [c('Anadolu Sigorta'), c('Allianz Türkiye', 'Allianz'), c('Aksigorta', 'Ageas'), c('Türkiye Sigorta'), c('HDI Sigorta', 'HDI'), c('Mapfre Sigorta', 'Mapfre'), c('AXA Türkiye', 'AXA'), c('Sompo Sigorta', 'Sompo'), c('Ray Sigorta', 'Vienna Insurance Group'), c('Quick Sigorta'), c('Neova Sigorta'), c('Doğa Sigorta'), c('Zurich Sigorta', 'Zurich'), c('Generali Sigorta', 'Generali'), h('Acıbadem Sigorta')],
  il: [c('Harel'), c('Migdal'), c('Clal Insurance'), c('The Phoenix'), c('Menora Mivtachim'), c('Ayalon Insurance'), h('Clalit'), h('Maccabi Healthcare Services'), h('Meuhedet'), h('Leumit'), c('Shlomo Insurance'), c('Libra Insurance'), c('Shirbit'), c('AIG Israel', 'AIG')],
  jo: [c('Jordan Insurance Company'), c('gig Jordan', 'Gulf Insurance Group'), c('Middle East Insurance'), c('Jordan French Insurance'), c('Al-Nisr Al-Arabi Insurance', 'Gulf Insurance Group'), c('Arab Orient Insurance', 'Gulf Insurance Group'), c('Jerusalem Insurance'), c('Islamic Insurance Company'), c('Solidarity First Insurance'), c('MetLife Jordan', 'MetLife')],
  lb: [c('Bankers Assurance'), c('Allianz SNA', 'Allianz'), c('Cumberland Insurance'), c('Libano-Suisse'), c('Medgulf Lebanon', 'Medgulf'), c('Fidelity Insurance'), c('Arope Insurance'), c('LIA Insurance'), c('AXA Middle East', 'AXA'), c('Al Mashrek Insurance'), c('Securité Assurance')],
  sy: [],
  iq: [],
  ir: [c('Iran Insurance Company'), c('Asia Insurance'), c('Alborz Insurance'), c('Dana Insurance'), c('Parsian Insurance'), c('Pasargad Insurance'), c('Mellat Insurance'), c('Saman Insurance'), c('Karafarin Insurance'), c('Moallem Insurance')],
  ae: [c('Orient Insurance', 'Al-Futtaim'), c('Abu Dhabi National Insurance Company'), c('Sukoon Insurance'), h('Daman'), c('GIG Gulf', 'Gulf Insurance Group'), c('Dubai Insurance Company'), c('Emirates Insurance'), c('Salama'), c('Abu Dhabi National Takaful'), c('Al Sagr National Insurance'), c('Noor Takaful'), c('Dubai National Insurance'), c('Al Buhaira National Insurance'), c('Union Insurance'), c('Cigna Middle East', 'Cigna'), c('Watania International Holding'), c('MetLife Gulf', 'MetLife'), c('Zurich International Life', 'Zurich'), BUPA_GLOBAL, ALLIANZ_CARE],
  qa: [c('Qatar Insurance Company'), c('Doha Insurance Group'), c('Al Khaleej Takaful'), h('QLM Life & Medical', 'Qatar Insurance Company'), c('Qatar General Insurance & Reinsurance'), c('Seib Insurance', 'Beema'), c('Qatar Islamic Insurance'), c('Damaan Islamic Insurance (Beema)')],
  sa: [c('Tawuniya'), h('Bupa Arabia', 'Bupa'), c('Al Rajhi Takaful'), c('Malath Insurance'), c('Walaa Cooperative Insurance'), c('Medgulf', 'Medgulf'), c('GIG Saudi', 'Gulf Insurance Group'), c('SAICO'), c('Allianz Saudi Fransi', 'Allianz'), c('Salama Cooperative Insurance'), c('Al Etihad Cooperative Insurance'), c('Gulf General Cooperative Insurance'), c('Arabian Shield'), c('Sagr Cooperative Insurance'), c('Wataniya Insurance'), c('Buruj Cooperative Insurance'), c('Liva Insurance', 'Liva'), c('ACIG'), c('Al Sagr Cooperative Insurance'), c('Amana Cooperative Insurance')],
  kw: [GIG, c('Kuwait Insurance Company'), c('Al Ahleia Insurance'), c('Warba Insurance'), c('First Takaful Insurance'), c('Wethaq Takaful'), c('Bahrain Kuwait Insurance'), c('Kuwait Reinsurance')],
  bh: [c('Bahrain National Insurance'), c('GIG Bahrain', 'Gulf Insurance Group'), c('Solidarity Bahrain'), c('Takaful International'), c('Bahrain Kuwait Insurance'), c('Arab Insurance Group (Arig)'), c('Medgulf Bahrain', 'Medgulf')],
  om: [c('Oman United Insurance'), c('Dhofar Insurance'), c('Liva Insurance', 'Liva'), c('Al Madina Takaful'), c('Sukoon Insurance'), c('Muscat Insurance'), c('Oman Qatar Insurance'), c('Takaful Oman'), c('Arabia Falcon Insurance'), c('Vision Insurance')],
  ye: [],
  ps: [c('Al-Mashreq Insurance'), c('National Insurance Company (Palestine)'), c('Trust International Insurance'), c('Ahleia Insurance Group'), c('Takaful Palestine'), c('Global United Insurance'), c('Palestine Insurance Company')],
  eg: [c('Misr Insurance'), c('Allianz Egypt', 'Allianz'), c('GIG Egypt', 'Gulf Insurance Group'), c('Orient Takaful Egypt', 'Orient Insurance'), c('Royal Insurance Egypt'), c('Chubb Egypt', 'Chubb'), c('MetLife Egypt', 'MetLife'), c('Bupa Egypt', 'Bupa'), c('AXA Egypt', 'Gulf Insurance Group'), c('Misr Life Insurance'), c('Wethaq Takaful Egypt'), c('Mohandes Insurance'), c('Suez Canal Insurance'), c('Delta Insurance'), c('Arab Misr Insurance Group'), c('Tokio Marine Egypt', 'Tokio Marine'), c('Sarwa Insurance'), c('Iskan Insurance'), c('Egyptian Takaful')],
  ly: [],
  tn: [c('STAR Assurances'), c('Comar Assurances'), c('GAT Assurances'), c('Assurances Maghrebia'), c('Astree'), c('AMI Assurances'), c('Lloyd Tunisien'), c('Carte Assurances'), c('Assurances BIAT'), c('Attijari Assurance'), c('Zitouna Takaful'), c('El Amana Takaful'), c('Assurances Salim')],
  dz: [c('SAA'), c('CAAR'), c('CAAT'), c('Alliance Assurances'), c('AXA Assurances Algérie', 'AXA'), c('Salama Assurances Algérie', 'Salama'), c('Macir Vie'), c('CIAR'), c('2A Assurances'), c('Trust Algeria'), c('GAM Assurances'), c('CASH Assurances'), c('Le Mutualiste')],
  ma: [c('Wafa Assurance'), c('RMA'), c('AXA Assurance Maroc', 'AXA'), c('Sanlam Maroc', 'Sanlam'), c('Atlanta Sanad'), c('MCMA'), c('Allianz Maroc', 'Allianz'), c('MAMDA'), c('La Marocaine Vie', 'Société Générale'), c('Mutuelle Attamine Chaabi'), c('Euler Hermes Acmar', 'Allianz')],
  eh: [c('Wafa Assurance'), c('RMA'), c('AXA Assurance Maroc', 'AXA'), c('Sanlam Maroc', 'Sanlam')],
  sd: [],
  ss: [],

  // Sub-Saharan Africa
  ng: [c('Leadway Assurance'), c('AIICO Insurance'), c('AXA Mansard', 'AXA'), c('Custodian Investment'), c('Cornerstone Insurance'), c('Mutual Benefits Assurance'), c('Sovereign Trust Insurance'), c('NEM Insurance'), c('Old Mutual Nigeria', 'Old Mutual'), c('Allianz Nigeria', 'Allianz'), c('Sanlam Nigeria', 'Sanlam'), c('Prudential Zenith Life', 'Prudential plc'), h('Hygeia HMO'), h('Avon HMO'), h('Reliance HMO'), c('Coronation Insurance'), c('Linkage Assurance'), c('Lasaco Assurance'), c('Consolidated Hallmark'), c('Universal Insurance'), c('Veritas Kapital'), c('Guinea Insurance'), c('Regency Alliance'), c('Sunu Assurances Nigeria', 'SUNU Assurances'), c('Zenith General Insurance'), c('Anchor Insurance'), c('Great Nigeria Insurance'), c('Prestige Assurance'), c('Royal Exchange'), c('Tangerine Life'), c('Heirs Insurance'), c('FBS Reinsurance'), h('Leadway Health'), h('AXA Mansard Health', 'AXA')],
  gh: [c('SIC Insurance'), c('Enterprise Insurance'), c('Star Assurance'), c('Hollard Ghana', 'Hollard'), c('Vanguard Assurance'), c('Glico'), c('SanlamAllianz Ghana', 'Sanlam'), c('Old Mutual Ghana', 'Old Mutual'), c('Prudential Life Ghana', 'Prudential plc'), h('Nationwide Medical Insurance'), h('Acacia Health Insurance'), c('Donewell Insurance'), c('Phoenix Insurance Ghana'), c('Activa International Ghana', 'Activa Assurances'), c('Provident Insurance'), c('Loyalty Insurance'), c('Best Assurance'), c('Quality Insurance'), c('Ghana Union Assurance'), c('Serene Insurance'), c('Imperial General Assurance'), c('Bedrock Insurance'), c('Priority Insurance'), c('Millennium Insurance'), c('Unique Insurance'), c('Wapic Insurance Ghana', 'Coronation Insurance'), c('Metropolitan Life Ghana', 'Momentum Metropolitan'), c('StarLife Assurance'), c('Miracle Life')],
  ke: [JUBILEE, BRITAM, c('CIC Insurance Group'), c('APA Insurance'), c('ICEA Lion'), c('Old Mutual Kenya', 'Old Mutual'), c('Madison Group'), c('Sanlam Kenya', 'Sanlam'), h('AAR Insurance'), c('Heritage Insurance'), c('GA Insurance'), c('First Assurance'), c('Liberty Kenya', 'Liberty Holdings'), c('Prudential Kenya', 'Prudential plc'), c('Kenya Orient'), c('Directline Assurance'), c('Pacis Insurance'), c('Mayfair Insurance'), c('Geminia Insurance'), c('Kenindia Assurance'), c('Fidelity Shield'), c('Intra Africa Assurance'), c('Occidental Insurance'), c('AIG Kenya', 'AIG'), c('Xplico Insurance'), c('Takaful Insurance of Africa'), c('Trident Insurance'), c('Pioneer Assurance'), c('Kenya Alliance Insurance'), c('Corporate Insurance'), c('Monarch Insurance'), c('MUA Kenya', 'MUA'), c('Sanlam General Kenya', 'Sanlam'), c('Cannon General'), c('Resolution Insurance'), c('Metropolitan Cannon', 'Momentum Metropolitan'), c('Capex Life'), c('Kuza Insurance'), c('Invesco Assurance')],
  et: [c('Ethiopian Insurance Corporation'), c('Awash Insurance'), c('Nyala Insurance'), c('Nile Insurance'), c('Nib Insurance'), c('Africa Insurance'), c('United Insurance (Ethiopia)'), c('Oromia Insurance'), c('Abay Insurance'), c('Global Insurance (Ethiopia)'), c('Lion Insurance'), c('Berhan Insurance'), c('Tsehay Insurance'), c('Lucy Insurance'), c('Bunna Insurance'), c('Zemen Insurance'), c('Ethio Life and General Insurance'), c('National Insurance Company of Ethiopia')],
  tz: [c('Jubilee Tanzania', 'Jubilee Insurance'), c('Britam Tanzania', 'Britam'), c('Alliance Insurance Corporation'), c('Heritage Insurance Tanzania'), h('Strategis Insurance'), c('National Insurance Corporation of Tanzania'), c('Sanlam Tanzania', 'Sanlam'), c('Reliance Insurance Tanzania'), c('Phoenix of Tanzania'), c('Mayfair Tanzania'), c('UAP Tanzania', 'Old Mutual'), c('Bumaco Insurance'), c('Metropolitan Tanzania', 'Momentum Metropolitan'), c('MGen Tanzania'), c('Milembe Insurance'), c('ZIC Insurance'), c('First Assurance Tanzania'), c('GA Insurance Tanzania'), c('Icea Lion Tanzania', 'ICEA Lion'), c('Resolution Tanzania'), c('Tanzindia Assurance'), c('Star General Tanzania'), c('Assemble Insurance'), c('Meticulous Insurance'), c('Maxinsure')],
  ug: [c('Jubilee Uganda', 'Jubilee Insurance'), c('UAP Old Mutual Uganda', 'Old Mutual'), c('Sanlam Uganda', 'Sanlam'), c('Britam Uganda', 'Britam'), c('Prudential Uganda', 'Prudential plc'), c('ICEA Lion Uganda', 'ICEA Lion'), c('Liberty Uganda', 'Liberty Holdings'), c('GoldStar Insurance'), c('NIC Holdings'), h('AAR Uganda', 'AAR Insurance'), c('CIC Africa Uganda', 'CIC Insurance Group'), c('Alliance Africa General Assurance'), c('Statewide Insurance'), c('Excel Insurance'), c('Pax Insurance'), c('TransAfrica Assurance'), c('MUA Uganda', 'MUA'), c('Mayfair Uganda'), c('Rio Insurance'), c('CIC Life Uganda', 'CIC Insurance Group')],
  rw: [c('Sonarwa'), c('Radiant Insurance'), c('Prime Insurance'), c('Old Mutual Rwanda', 'Old Mutual'), c('Sanlam Rwanda', 'Sanlam'), c('BK General Insurance'), c('Mayfair Rwanda'), c('Britam Rwanda', 'Britam'), c('MUA Rwanda', 'MUA')],
  bi: [c('SOCABU'), c('Jubilee Burundi', 'Jubilee Insurance'), c('UCAR'), c('BICOR'), c('Egic Assurances'), c('SOGEAR'), c('Nouvelle Assurance'), c('Fidelia Assurance Burundi')],
  za: [c('Santam'), OLD_MUTUAL, c('Old Mutual Insure', 'Old Mutual'), HOLLARD, g('OUTsurance'), c('Discovery'), h('Discovery Health'), c('Momentum Metropolitan'), h('Bonitas'), h('Medihelp'), c('Liberty Holdings'), SANLAM, g('MiWay', 'Sanlam'), g('King Price'), g('Auto & General', 'Telesure'), g('Budget Insurance', 'Telesure'), g('Dialdirect', 'Telesure'), g('Bryte'), c('Guardrisk', 'Momentum Metropolitan'), c('AIG South Africa', 'AIG'), CHUBB, h('Fedhealth'), h('Bestmed'), h('Momentum Health'), h('Profmed'), l('Sanlam Sky', 'Sanlam'), c('Absa Insurance', 'Absa'), c('Nedbank Insurance', 'Nedbank'), c('Standard Bank Insurance', 'Standard Bank'), c('1Life', 'Telesure'), c('Clientèle'), c('Assupol'), c('Hollard Life', 'Hollard'), g('Naked Insurance'), g('Pineapple'), g('iWYZE', 'Old Mutual'), g('Vodacom Insurance'), g('Virseker', 'Santam'), h('Genesis Medical Scheme'), h('Keyhealth'), h('Sizwe Hosmed'), h('Medshield'), h('Bankmed'), h('Polmed'), h('GEMS')],
  zm: [c('Madison General Insurance'), c('Professional Insurance Corporation Zambia'), c('ZSIC'), c('Hollard Zambia', 'Hollard'), c('Prudential Zambia', 'Prudential plc'), c('Sanlam Zambia', 'Sanlam'), c('Mayfair Zambia'), c('Phoenix of Zambia'), c('Goldman Insurance'), c('NICO Zambia'), c('Advantage Insurance'), c('Meanwood General'), c('Innovate General'), c('Swan Zambia', 'SWAN'), c('General Alliance Zambia'), c('Savenda General'), c('Golden Lotus'), c('Guardian Insurance Zambia')],
  zw: [c('Old Mutual Zimbabwe', 'Old Mutual'), c('Nyaradzo Group'), c('First Mutual Holdings'), c('Zimnat'), c('Cell Insurance'), c('Alliance Insurance Zimbabwe'), c('Champions Insurance'), h('CIMAS'), h('PSMAS'), c('Nicoz Diamond', 'First Mutual Holdings'), c('FBC Insurance'), c('CBZ Insurance'), c('Eagle Insurance'), c('Sanctuary Insurance'), c('Credsure'), c('Evolution Insurance'), c('Clarion Insurance'), c('Hamilton Insurance'), c('Safel Insurance'), c('Allied Insurance'), c('Fidelity Life Zimbabwe'), c('Econet Life', 'Cassava'), c('CIMAS Health'), h('First Mutual Health', 'First Mutual Holdings'), h('Bonvie Medical Aid'), c('ZB Life', 'ZB Financial')],
  mz: [c('EMOSE'), c('Hollard Moçambique', 'Hollard'), c('Sanlam Moçambique', 'Sanlam'), c('Global Alliance Seguros', 'Absa'), c('Britam Mozambique', 'Britam'), c('Ímpar', 'Fidelidade'), c('Índico Seguros'), c('Diamond Seguros'), c('Mediplus'), c('Moçambique Seguros'), c('Phoenix Seguros'), c('Horizonte Seguros')],
  mw: [c('NICO General'), c('Old Mutual Malawi', 'Old Mutual'), c('General Alliance Malawi'), c('Britam Malawi', 'Britam'), c('United General Insurance'), c('Reunion Insurance'), c('Prime Insurance Malawi'), c('Smile Life'), c('Charter Insurance'), c('Liberty General Malawi')],
  bw: [c('Botswana Insurance Company'), c('Hollard Botswana', 'Hollard'), c('Botswana Life', 'BIHL'), c('Old Mutual Botswana', 'Old Mutual'), g('Alpha Direct'), l('Bona Life'), h('Pula Medical Aid'), h('Botsogo Health Plan'), h('BPOMAS'), c('Metropolitan Botswana', 'Momentum Metropolitan'), c('Liberty Life Botswana'), c('Sunshine Insurance'), c('Bryte Botswana', 'Bryte'), c('Phoenix of Botswana')],
  na: [c('Santam Namibia', 'Santam'), c('Old Mutual Namibia', 'Old Mutual'), c('Hollard Namibia', 'Hollard'), c('Momentum Namibia', 'Momentum Metropolitan'), c('Sanlam Namibia', 'Sanlam'), c('Trustco Insurance'), h('Namibia Medical Care'), h('Prosperity Health'), h('Renaissance Health'), c('NAMFISA'), c('Alexander Forbes Namibia'), c('King Price Namibia', 'King Price'), c('Outsurance Namibia', 'OUTsurance'), c('Phoenix Namibia'), c('Corporate Guarantee'), c('Nammic Financial Services'), c('Quanta Insurance'), c('Hallmark Insurance')],
  ao: [c('ENSA Seguros de Angola'), c('Fidelidade Angola', 'Fidelidade'), c('Global Seguros'), c('Nossa Seguros'), c('Fortaleza Seguros'), c('GA Angola Seguros'), c('Tranquilidade Angola', 'Generali'), c('Sanlam Angola', 'Sanlam'), c('Universal Seguros'), c('Mundial Seguros'), c('Prudential Angola', 'Prudential plc'), c('Bonws Seguros'), c('Protteja Seguros'), c('Garantia Seguros')],
  cm: [c('Chanas Assurances'), ACTIVA, c('AXA Cameroun', 'AXA'), c('Allianz Cameroun', 'Allianz'), c('Sanlam Cameroun', 'Sanlam'), c('Zenithe Insurance'), c('Prudential Beneficial', 'Prudential plc'), c('Atlantique Assurances Cameroun'), c('Area Assurances'), c('Pro Assur'), c('Sunu Assurances Cameroun', 'SUNU Assurances'), c('NSIA Cameroun', 'NSIA Assurances'), c('Colina', 'Sanlam'), c('Garantie Mutuelle des Cadres')],
  ci: [NSIA, c('Sanlam Côte d’Ivoire', 'Sanlam'), c('Allianz Côte d’Ivoire', 'Allianz'), c('AXA Côte d’Ivoire', 'AXA'), c('Atlantique Assurances'), SUNU, c('Loyale Assurance'), c('Serenity S.A.'), c('Amsa Assurances'), c('GNA Assurances'), c('Wafa Assurance Côte d’Ivoire', 'Wafa Assurance'), c('Leadway Assurance Côte d’Ivoire', 'Leadway Assurance'), c('Sonam Côte d’Ivoire'), c('Belife Insurance', 'Prudential plc'), c('Coris Assurances'), c('Ascoma')],
  sn: [c('Amsa Assurances'), c('Sanlam Sénégal', 'Sanlam'), c('Allianz Sénégal', 'Allianz'), c('AXA Sénégal', 'AXA'), c('Askia Assurances'), SUNU, NSIA, c('SONAM'), c('Salama Assurances Sénégal', 'Salama'), c('CNART Assurances'), c('Prévoyance Assurances'), c('La Providence Assurances'), c('Wafa Assurance Sénégal', 'Wafa Assurance')],
  ml: [c('Sonavie'), c('Allianz Mali', 'Allianz'), c('Sanlam Mali', 'Sanlam'), NSIA, SUNU, c('Sabunyuman'), c('Lafia SA'), c('NALLIAS')],
  bf: [c('SONAR'), c('Allianz Burkina', 'Allianz'), c('Sanlam Burkina', 'Sanlam'), SUNU, c('UAB'), c('Coris Assurances'), c('GA Burkina'), c('Yelen Assurances'), c('Raynal Assurances')],
  ne: [c('CAREN'), c('UGAN'), c('Sanlam Niger', 'Sanlam'), c('NIA Assurances'), c('Leyma Assurances'), SUNU],
  td: [],
  cf: [],
  cg: [c('AGC Assurances'), c('Allianz Congo', 'Allianz'), NSIA, c('Sanlam Congo', 'Sanlam'), c('Assurances Générales du Congo'), c('SUNU Assurances Congo', 'SUNU Assurances')],
  cd: [c('SONAS'), c('Activa RDC', 'Activa Assurances'), c('Rawsur'), c('Sanlam RDC', 'Sanlam'), c('SUNU RDC', 'SUNU Assurances'), c('Afrissur'), c('GPA Assurances'), c('Mayfair RDC'), c('Jubilee RDC', 'Jubilee Insurance'), c('Prudential RDC', 'Prudential plc'), c('Ascoma RDC'), c('Africa Assurances'), c('Sfa Congo')],
  ga: [c('OGAR'), c('Assinco'), NSIA, c('Sanlam Gabon', 'Sanlam'), c('AXA Gabon', 'AXA'), SUNU, c('Ascoma Gabon'), c('Assurances Mutuelles du Gabon')],
  gq: [],
  st: [],
  cv: [c('Garantia Seguros'), c('Ímpar', 'Fidelidade')],
  gm: [c('Gambia National Insurance Company'), c('Prime Insurance Gambia'), c('Enterprise Life Gambia', 'Enterprise Insurance'), c('Takaful Gambia'), c('Sunshine Insurance Gambia'), c('Global Security Insurance'), c('Londongate Insurance'), c('International Insurance Company Gambia')],
  gn: [c('Activa Guinée', 'Activa Assurances'), c('SONAG'), c('UGAR'), c('NSIA Guinée', 'NSIA Assurances'), c('Sanlam Guinée', 'Sanlam'), c('SUNU Guinée', 'SUNU Assurances')],
  gw: [],
  sl: [c('Activa Sierra Leone', 'Activa Assurances'), c('Aureol Insurance'), c('Reliance Insurance Trust Corporation'), c('International Insurance Company Sierra Leone'), c('NICOL Insurance')],
  lr: [c('Activa Liberia', 'Activa Assurances'), c('Atlantic Life & General Insurance'), c('Medicare Insurance Liberia'), c('Accident & Casualty Insurance Company Liberia'), c('Sky Insurance')],
  tg: [SUNU, NSIA, c('Sanlam Togo', 'Sanlam'), c('Fidelia Assurances'), c('GTA-C2A'), c('Allianz Togo', 'Allianz'), c('Saham Togo', 'Sanlam'), c('Ogar Vie Togo')],
  bj: [NSIA, SUNU, c('Sanlam Bénin', 'Sanlam'), c('Africaine des Assurances'), c('L’Africaine Vie'), c('Atlantique Assurances Bénin'), c('Allianz Bénin', 'Allianz'), c('GAB Assurances'), c('Ascoma Bénin')],
  mr: [],
  er: [c('National Insurance Corporation of Eritrea')],
  dj: [],
  so: [],
  km: [],
  mg: [c('ARO'), c('Ny Havana'), c('Allianz Madagascar', 'Allianz'), c('Sanlam Madagascar', 'Sanlam'), c('MAMA'), c('Assurances Réunion Madagascar')],
  mu: [c('SWAN'), c('MUA'), c('SICOM'), c('Jubilee Allianz General Insurance (Mauritius)', 'Allianz'), c('Phoenix Insurance Mauritius'), c('La Prudence Mauricienne', 'MUA'), c('Mauritius Union Assurance', 'MUA'), c('Lamco International'), c('Island Life'), c('Sun Insurance Mauritius'), c('NIC Mauritius'), c('Quantum Insurance'), c('Bharat Insurance'), c('Life Insurance Corporation (International)')],
  sc: [c('SACOS'), c('H. Savy Insurance'), c('Mauritius Union Seychelles', 'MUA'), c('Bharat Insurance Seychelles')],
  ls: [c('Alliance Insurance Lesotho'), c('LNIG Hollard', 'Hollard'), c('Metropolitan Lesotho', 'Momentum Metropolitan'), c('Lesotho National General Insurance'), c('Minet Lesotho'), c('Alexander Forbes Lesotho')],
  sz: [c('Eswatini Royal Insurance Corporation'), c('Old Mutual Eswatini', 'Old Mutual'), c('Lidwala Insurance'), c('Phoenix of Eswatini'), c('Liberty Eswatini'), c('Orchard Insurance'), c('Getmed'), c('Metropolitan Eswatini', 'Momentum Metropolitan'), c('Safrican Eswatini')],
  re: [AXA, c('Groupama'), c('Allianz France', 'Allianz'), c('MAIF'), c('MACIF')],
  yt: [AXA, c('Groupama'), c('Allianz France', 'Allianz')],
  sh: [],

  // South and Central Asia
  in: [l('Life Insurance Corporation of India'), c('New India Assurance'), c('ICICI Lombard'), c('HDFC ERGO', 'ERGO'), c('Bajaj Allianz', 'Allianz'), c('Tata AIG', 'AIG'), c('SBI General'), h('Star Health'), h('Niva Bupa', 'Bupa'), h('Care Health Insurance'), c('Reliance General'), c('United India Insurance'), c('The Oriental Insurance Company'), c('National Insurance Company'), l('HDFC Life'), l('ICICI Prudential Life'), l('SBI Life'), c('Go Digit'), c('Acko'), c('Future Generali', 'Generali'), c('Royal Sundaram'), c('Cholamandalam MS', 'MS&AD'), c('IFFCO-Tokio', 'Tokio Marine'), c('Kotak General'), c('Zuno General'), l('Max Life'), l('Bajaj Allianz Life', 'Allianz'), l('Tata AIA Life', 'AIA'), h('Aditya Birla Health'), h('ManipalCigna', 'Cigna'), c('Universal Sompo', 'Sompo'), c('Liberty General Insurance India', 'Liberty Mutual'), c('Magma HDI', 'HDI'), c('Shriram General'), c('Raheja QBE', 'QBE'), c('Navi General'), l('PNB MetLife', 'MetLife'), l('Canara HSBC Life', 'HSBC'), l('Aditya Birla Sun Life', 'Sun Life'), l('Pramerica Life', 'Prudential Financial')],
  pk: [c('EFU Insurance'), c('Jubilee General Insurance'), c('Adamjee Insurance'), l('State Life Insurance'), c('Pak-Qatar Takaful'), c('TPL Insurance'), c('UBL Insurers'), c('IGI General'), c('Askari General'), c('Habib Insurance'), c('Atlas Insurance'), c('Century Insurance'), c('Alfalah Insurance'), c('Security General'), c('Premier Insurance'), c('Salaam Takaful'), l('Jubilee Life'), l('EFU Life'), l('Pak-Qatar Family Takaful'), l('Dawood Family Takaful')],
  bd: [c('Sadharan Bima Corporation'), l('Jiban Bima Corporation'), c('Green Delta Insurance'), c('Pragati Insurance'), c('Reliance Insurance Bangladesh'), l('MetLife Bangladesh', 'MetLife'), l('Guardian Life Bangladesh'), l('Delta Life'), c('Pioneer Insurance Bangladesh'), c('Eastland Insurance'), c('Bangladesh General Insurance'), c('Peoples Insurance Bangladesh'), c('Phoenix Insurance Bangladesh'), c('Nitol Insurance'), l('Pragati Life'), l('Popular Life'), l('National Life Bangladesh'), l('Fareast Islami Life'), l('Sandhani Life'), c('Prime Insurance Bangladesh')],
  lk: [c('Sri Lanka Insurance Corporation'), c('Ceylinco Insurance'), l('AIA Sri Lanka', 'AIA'), c('Union Assurance'), c('Janashakthi Insurance'), c('Allianz Lanka', 'Allianz'), c('Fairfirst Insurance', 'Fairfax'), c('HNB Assurance'), l('Softlogic Life'), c('People’s Insurance'), c('Continental Insurance Lanka'), c('Amana Takaful'), c('Cooperative Insurance'), c('Orient Insurance Lanka'), c('LOLC Insurance'), c('Sanasa Insurance'), l('Arpico Insurance')],
  np: [c('Shikhar Insurance'), c('Nepal Insurance'), c('Sagarmatha Lumbini Insurance'), c('Neco Insurance'), c('Prabhu Insurance'), c('Rastriya Beema Company'), l('Nepal Life'), l('National Life'), c('IME General Insurance'), c('Siddhartha Premier Insurance'), c('Himalayan Everest Insurance'), c('United Ajod Insurance'), c('NLG Insurance'), c('Sanima GIC'), l('Life Insurance Corporation Nepal'), l('Surya Jyoti Life'), l('Asian Life'), l('Reliable Nepal Life')],
  bt: [c('Royal Insurance Corporation of Bhutan'), c('Bhutan Insurance Limited'), l('GIC-Bhutan')],
  mv: [c('Allied Insurance Maldives'), c('Amana Takaful Maldives', 'Amana Takaful'), c('Sri Lanka Insurance Maldives', 'Sri Lanka Insurance Corporation'), c('Ceylinco Maldives', 'Ceylinco Insurance'), c('Dhivehi Insurance'), c('Solarelle Insurance')],
  af: [],
  kz: [c('Halyk Insurance'), c('Eurasia Insurance'), c('Kazakhinstrakh'), c('Nomad Insurance'), c('Freedom Finance Insurance'), c('Jusan Garant'), c('Centras Insurance'), h('Interteach'), c('Basel Insurance'), c('Kommesk-Omir'), c('Amanat Insurance'), c('Sinoasia B&R'), c('Victoria Insurance'), l('Halyk Life'), l('Nomad Life'), l('Freedom Life')],
  uz: [c('Uzbekinvest'), c('Gross Insurance'), c('Alfa Invest'), c('Kafolat'), c('Apex Insurance'), c('Alskom'), c('Uzagrosugurta'), c('Ingo-Uzbekistan', 'Ingosstrakh'), c('Insurance Company Alliance'), c('Mybank Insurance'), c('Euroasia Insurance'), l('New Life Insurance'), l('Uzbekinvest Hayot')],
  kg: [c('Jubilee Kyrgyzstan', 'Jubilee Insurance'), c('Kyrgyzstan Insurance Company'), c('Ingosstrakh Kyrgyzstan', 'Ingosstrakh'), c('Ayu Garant'), c('Kyrgyzinstrakh'), c('Ak-Zhol Insurance')],
  tj: [],
  tm: [],
  mn: [c('Mongol Daatgal'), c('Bodi Insurance'), c('Tenger Insurance'), c('Ard Insurance'), c('Mandal Insurance'), c('Nomin Insurance'), c('Practical Insurance'), c('Monre Insurance'), c('Munkh Daatgal'), c('National Life Insurance Mongolia'), c('Sod Daatgal'), c('Ulaanbaatar City Insurance')],

  // East and Southeast Asia
  cn: [c('PICC'), c('Ping An'), c('China Life'), c('China Pacific Insurance'), CHINA_TAIPING, c('Sunshine Insurance'), c('ZhongAn'), l('New China Life'), c('AIA China', 'AIA'), c('Allianz China', 'Allianz'), c('AXA Tianping', 'AXA'), c('Taikang Life'), c('China Re'), c('Bank of China Insurance'), c('Dinghe Insurance'), c('Huatai Insurance'), c('Yingda Insurance'), c('Zhongyuan Agricultural Insurance'), c('Sinosafe Insurance'), c('Dubon Insurance'), c('Anhua Agricultural'), l('Taiping Life', 'China Taiping'), l('Sunshine Life', 'Sunshine Insurance'), l('Ping An Life', 'Ping An'), h('Ping An Health', 'Ping An'), c('Generali China', 'Generali'), c('Manulife-Sinochem', 'Manulife'), c('MetLife China', 'MetLife'), c('Prudential CITIC (CPIC)', 'Prudential plc'), c('HSBC Life China', 'HSBC'), c('Cigna & CMB', 'Cigna'), c('Tokio Marine China', 'Tokio Marine'), c('Sompo China', 'Sompo'), c('MSIG China', 'MS&AD'), c('Chubb China', 'Chubb'), c('Liberty China', 'Liberty Mutual'), c('Zurich China', 'Zurich'), c('Samsung Fire & Marine China', 'Samsung Fire & Marine'), c('Hyundai Insurance China', 'Hyundai Marine & Fire'), c('Cathay Insurance China', 'Cathay Financial'), c('Fubon Insurance China', 'Fubon')],
  hk: [AIA, c('Prudential Hong Kong', 'Prudential plc'), c('Manulife Hong Kong', 'Manulife'), c('AXA Hong Kong', 'AXA'), h('Bupa Hong Kong', 'Bupa'), c('Zurich Hong Kong', 'Zurich'), c('Blue Cross (Asia-Pacific)', 'AIA'), c('Bank of China Group Insurance'), l('HSBC Life', 'HSBC'), FWD, c('Sun Life Hong Kong', 'Sun Life'), c('China Taiping Hong Kong', 'China Taiping'), c('Chubb Hong Kong', 'Chubb'), c('Generali Hong Kong', 'Generali'), c('QBE Hong Kong', 'QBE'), c('Liberty Hong Kong', 'Liberty Mutual'), c('Allied World Hong Kong', 'Fairfax'), c('Bolttech'), c('Blue', 'Aviva'), c('Dah Sing Insurance'), c('MSIG Hong Kong', 'MS&AD'), c('Tokio Marine Hong Kong', 'Tokio Marine'), c('Sompo Hong Kong', 'Sompo'), c('AIG Hong Kong', 'AIG'), c('Cigna Hong Kong', 'Cigna'), c('YF Life'), c('China Life Hong Kong', 'China Life'), c('Hang Seng Insurance', 'HSBC'), c('BOC Life', 'Bank of China Group Insurance'), c('Ping An OneConnect', 'Ping An'), c('Standard Life Hong Kong', 'Standard Life'), c('Well Link Insurance'), c('Target Insurance'), c('Asia Insurance'), c('Bowtie'), c('Avo Insurance'), c('OneDegree'), c('Pacific Insurance'), c('Falcon Insurance'), c('Chong Hing Insurance'), c('CTF Life'), BUPA_GLOBAL, CIGNA_GLOBAL, PANTAENIUS],
  mo: [c('Macau Insurance Company'), c('Fidelidade Macau', 'Fidelidade'), c('AIA Macau', 'AIA'), c('AXA Macau', 'AXA'), c('China Taiping Macau', 'China Taiping'), c('Luen Fung Hang Insurance'), c('QBE Macau', 'QBE'), c('Bank of China Group Insurance Macau', 'Bank of China Group Insurance'), c('Companhia de Seguros de Macau Vida'), c('MSIG Macau', 'MS&AD'), c('Asia Insurance Macau'), c('Generali Macau', 'Generali'), c('Manulife Macau', 'Manulife'), c('Prudential Macau', 'Prudential plc'), c('YF Life Macau')],
  tw: [CATHAY, FUBON, c('Shin Kong'), l('Nan Shan Life'), c('Taiwan Life', 'CTBC'), c('Mingtai Insurance', 'MS&AD'), c('Union Insurance Taiwan'), c('Chung Kuo Insurance', 'Mega Financial'), c('Tokio Marine Newa', 'Tokio Marine'), c('Hotai Insurance'), c('First Insurance'), c('Taian Insurance'), c('South China Insurance'), c('Chubb Taiwan', 'Chubb'), c('AIA Taiwan', 'AIA'), c('Allianz Taiwan Life', 'Allianz'), c('Prudential Taiwan', 'Prudential plc'), c('TransGlobe Life'), c('China Life Taiwan', 'China Development Financial'), c('Mercuries Life'), c('Hontai Life'), c('Bank Taiwan Life'), c('Farglory Life'), c('Chunghwa Post'), c('Zurich Taiwan', 'Zurich'), c('AIG Taiwan', 'AIG'), c('Cigna Taiwan', 'Cigna'), c('Cardif Taiwan', 'BNP Paribas Cardif'), c('Yuanta Life'), c('Global Life Taiwan'), c('Central Insurance Taiwan'), c('Chung Hsing Insurance')],
  jp: [TOKIO, SOMPO, c('Mitsui Sumitomo Insurance', 'MS&AD'), c('Aioi Nissay Dowa', 'MS&AD'), l('Nippon Life'), DAI_ICHI, l('Meiji Yasuda Life'), l('Sumitomo Life'), l('Japan Post Insurance'), g('Sony Assurance'), g('AXA Direct Japan', 'AXA'), h('Aflac Japan', 'Aflac'), g('Zurich Japan', 'Zurich'), g('Rakuten Insurance'), l('Fukoku Life'), l('Taiyo Life', 'T&D'), l('Daido Life', 'T&D'), l('Prudential Life Japan', 'Prudential Financial'), l('MetLife Japan', 'MetLife'), l('Manulife Japan', 'Manulife'), l('Axa Life Japan', 'AXA'), l('Orix Life'), l('Lifenet'), h('Sony Life'), g('Chubb Japan', 'Chubb'), g('AIG Japan', 'AIG'), g('SBI Insurance'), g('Mitsui Direct'), g('Saison Automobile & Fire'), g('Kyoei Fire & Marine'), g('Nisshin Fire & Marine', 'Sompo'), g('Secom General Insurance'), g('Toa Re'), l('Asahi Life'), l('Gibraltar Life', 'Prudential Financial'), l('Neo First Life', 'Dai-ichi Life'), l('Hanasaku Life', 'Nippon Life'), l('FWD Life Japan', 'FWD'), l('Medicare Life', 'Sumitomo Life'), l('Zurich Life Japan', 'Zurich'), l('Cardif Japan', 'BNP Paribas Cardif'), l('Chubb Life Japan', 'Chubb'), l('Allianz Life Japan', 'Allianz'), h('Sumitomo Mitsui Health', 'MS&AD'), g('Anshin Sompo', 'Sompo'), g('Jibun Sompo', 'Sompo'), g('E.design Insurance', 'Tokio Marine'), g('Tokio Marine Nichido', 'Tokio Marine'), g('Sompo Japan', 'Sompo')],
  kr: [c('Samsung Fire & Marine'), c('Hyundai Marine & Fire'), c('DB Insurance'), c('KB Insurance'), c('Meritz Fire & Marine'), c('Hanwha General Insurance'), l('Samsung Life'), l('Hanwha Life'), l('Kyobo Life'), c('Lotte Insurance'), c('Heungkuk Fire & Marine'), c('MG Insurance'), c('AXA Korea', 'AXA'), l('Shinhan Life'), l('NH Life'), l('Mirae Asset Life'), l('Tongyang Life'), l('KDB Life'), l('Lina Korea', 'Chubb'), l('MetLife Korea', 'MetLife'), l('AIA Korea', 'AIA'), l('Prudential Korea', 'KB Financial'), l('ABL Life'), l('DGB Life'), l('Hana Life'), c('Carrot Insurance'), c('AIG Korea', 'AIG'), c('Chubb Korea', 'Chubb'), c('Ace American Korea', 'Chubb'), c('NH Property & Casualty'), c('Seoul Guarantee Insurance'), c('Korean Re'), l('Heungkuk Life'), l('Kyobo Lifeplanet'), l('BNP Paribas Cardif Korea', 'BNP Paribas Cardif'), l('Fubon Hyundai Life', 'Fubon')],
  kp: [],
  vn: [c('Bảo Việt'), c('PVI Insurance'), c('Bảo Minh'), c('PTI'), c('PJICO'), c('MIC (Military Insurance Corporation)'), c('BIC', 'BIDV'), l('Prudential Vietnam', 'Prudential plc'), l('Manulife Vietnam', 'Manulife'), l('AIA Vietnam', 'AIA'), l('Dai-ichi Life Vietnam', 'Dai-ichi Life'), c('Liberty Vietnam', 'Liberty Mutual'), c('VBI'), c('Chubb Vietnam', 'Chubb'), c('Bảo Long'), c('AAA Assurance'), c('Bảo Việt Nhân Thọ', 'Bảo Việt'), c('Generali Vietnam', 'Generali'), c('FWD Vietnam', 'FWD'), c('Sun Life Vietnam', 'Sun Life'), c('MB Ageas Life', 'Ageas'), c('Hanwha Life Vietnam', 'Hanwha Life'), c('Cathay Life Vietnam', 'Cathay Financial'), c('Fubon Life Vietnam', 'Fubon'), c('Tokio Marine Vietnam', 'Tokio Marine'), c('MSIG Vietnam', 'MS&AD'), c('Phu Hung Assurance'), c('VNI'), c('ABIC'), c('Hùng Vương Insurance'), c('Bảo Hiểm Xuân Thành'), c('OPES Insurance'), c('VASS'), c('Saigon-Hanoi Insurance')],
  th: [c('Viriyah Insurance'), c('Dhipaya Insurance'), c('Muang Thai'), c('Bangkok Insurance'), c('Krungthai Panich'), l('AIA Thailand', 'AIA'), l('Thai Life'), c('FWD Thailand', 'FWD'), c('Allianz Ayudhya', 'Allianz'), c('Tokio Marine Thailand', 'Tokio Marine'), c('AXA Thailand', 'AXA'), c('Chubb Thailand', 'Chubb'), c('Safety Insurance'), c('LMG Insurance'), c('Roojai'), c('Thanachart Insurance'), c('Thaivivat Insurance'), c('Navakij Insurance'), c('Southeast Insurance'), c('Indara Insurance'), c('Syn Mun Kong'), c('Falcon Insurance'), c('Thai Setakij'), c('MSIG Thailand', 'MS&AD'), c('Sompo Thailand', 'Sompo'), c('AIG Thailand', 'AIG'), c('Generali Thailand', 'Generali'), c('Prudential Thailand', 'Prudential plc'), c('Manulife Thailand', 'Manulife'), c('Ocean Life'), c('Bangkok Life'), c('Krungthai-AXA Life', 'AXA'), c('SCB Life', 'FWD'), c('Thai Samsung Life', 'Samsung Life'), c('Dhipaya Life'), c('Muang Thai Life', 'Muang Thai'), c('BLA'), c('Pacific Cross Thailand'), c('Luma Health'), c('Aetna Thailand', 'CVS Health'), c('Cigna Thailand', 'Cigna'), c('Bupa Thailand', 'Bupa'), c('KSK Insurance'), c('Mitsui Sumitomo Thailand', 'MS&AD'), c('Aioi Bangkok', 'MS&AD'), c('Phillip Life'), c('Tune Protect Thailand', 'Tune Protect'), c('Etiqa Thailand', 'Etiqa'), c('Sunday Insurance'), c('Frank Insurance'), c('Cigna Global Thailand', 'Cigna')],
  my: [ETIQA, c('Allianz Malaysia', 'Allianz'), GREAT_EASTERN, c('AIA Malaysia', 'AIA'), c('Prudential Malaysia', 'Prudential plc'), c('Takaful Malaysia'), c('Zurich Malaysia', 'Zurich'), c('Tokio Marine Malaysia', 'Tokio Marine'), c('Lonpac Insurance'), c('Berjaya Sompo', 'Sompo'), c('MSIG Malaysia', 'MS&AD'), c('Liberty Insurance Malaysia', 'Liberty Mutual'), c('Kurnia Insurans', 'Liberty Mutual'), c('Chubb Malaysia', 'Chubb'), c('Generali Malaysia', 'Generali'), c('Hong Leong Assurance'), c('Tune Protect'), c('RHB Insurance'), c('Pacific Insurance Malaysia'), c('QBE Malaysia', 'QBE'), c('AmMetLife', 'MetLife'), c('Manulife Malaysia', 'Manulife'), c('Sun Life Malaysia', 'Sun Life'), c('FWD Takaful', 'FWD'), c('Prudential BSN Takaful', 'Prudential plc'), c('Hong Leong MSIG Takaful', 'MS&AD'), c('Zurich Takaful', 'Zurich'), c('AIA Public Takaful', 'AIA'), c('Great Eastern Takaful', 'Great Eastern'), c('Etiqa Takaful', 'Etiqa'), c('Takaful Ikhlas'), c('Syarikat Takaful Malaysia Keluarga'), c('Progressive Insurance Malaysia'), c('Pacific & Orient Insurance'), c('Malaysian Re'), c('Bank Islam Takaful'), c('Sompo Malaysia', 'Sompo'), c('AXA Affin', 'Generali'), c('Allianz Life Malaysia', 'Allianz')],
  sg: [GREAT_EASTERN, MSIG, c('AIA Singapore', 'AIA'), c('Prudential Singapore', 'Prudential plc'), c('Income Insurance'), c('Manulife Singapore', 'Manulife'), c('Singlife'), c('HSBC Life Singapore', 'HSBC'), c('Tokio Marine Singapore', 'Tokio Marine'), c('MSIG Singapore', 'MS&AD'), c('Liberty Insurance Singapore', 'Liberty Mutual'), c('Chubb Singapore', 'Chubb'), c('FWD Singapore', 'FWD'), c('Allianz Singapore', 'Allianz'), c('Sompo Singapore', 'Sompo'), c('Etiqa Singapore', 'Etiqa'), c('DirectAsia'), h('Raffles Health Insurance'), c('China Taiping Singapore', 'China Taiping'), c('QBE Singapore', 'QBE'), c('Zurich Singapore', 'Zurich'), c('AIG Singapore', 'AIG'), c('AXA Singapore', 'HSBC'), c('Aviva Singapore', 'Singlife'), c('Budget Direct Singapore'), c('India International Insurance'), c('ECICS'), c('Lonpac Singapore', 'Lonpac Insurance'), c('United Overseas Insurance', 'UOB'), c('Cigna Singapore', 'Cigna'), c('Bupa Singapore', 'Bupa'), c('Pacific Prime'), c('Now Health'), c('Tiq', 'Etiqa'), c('Swiss Re Singapore', 'Swiss Re'), c('Munich Re Singapore', 'Munich Re'), c('Manulife Financial Advisers', 'Manulife'), c('Transamerica Life Bermuda', 'Aegon'), c('Sun Life Singapore', 'Sun Life'), c('Prudential Assurance Company Singapore', 'Prudential plc'), c('Great Eastern General', 'Great Eastern'), c('Etiqa Insurance Singapore', 'Etiqa'), c('EQ Insurance'), c('Ergo Singapore', 'ERGO'), BUPA_GLOBAL, CIGNA_GLOBAL, PANTAENIUS],
  id: [c('Asuransi Astra'), c('Asuransi Sinar Mas'), c('Allianz Indonesia', 'Allianz'), c('Prudential Indonesia', 'Prudential plc'), c('AIA Indonesia', 'AIA'), c('Manulife Indonesia', 'Manulife'), c('AXA Mandiri', 'AXA'), c('Tokio Marine Indonesia', 'Tokio Marine'), c('Jasa Raharja'), c('Jasindo'), c('Zurich Indonesia', 'Zurich'), c('Sompo Indonesia', 'Sompo'), c('MSIG Indonesia', 'MS&AD'), c('Asuransi Central Asia'), c('Chubb Indonesia', 'Chubb'), c('Great Eastern Indonesia', 'Great Eastern'), c('Tugu Insurance'), c('Asuransi Bintang'), c('Asuransi Ramayana'), c('Asuransi Wahana Tata'), c('Asuransi Bina Dana Arta'), c('BRI Insurance'), c('BNI Life'), c('Mandiri Inhealth'), c('Asuransi Jiwa Sequis'), c('Asuransi Jiwasraya'), c('Asuransi Jiwa IFG Life'), c('FWD Indonesia', 'FWD'), c('Generali Indonesia', 'Generali'), c('Sun Life Indonesia', 'Sun Life'), c('Cigna Indonesia', 'Cigna'), c('Asuransi Adira Dinamika', 'Zurich'), c('Asuransi Sompo Japan Nipponkoa', 'Sompo'), c('Asuransi Tri Pakarta'), c('Asuransi Umum Mega'), c('Asuransi Sinarmas MSIG', 'MS&AD'), c('Asuransi Jiwa Taspen'), c('BCA Insurance'), c('Asuransi Reliance Indonesia'), c('Asuransi Simas Net'), c('Asuransi Cakrawala Proteksi'), c('Asuransi Kredit Indonesia'), c('Asuransi Ekspor Indonesia'), c('Asuransi Bangun Askrida'), c('Asuransi Harta Aman Pratama'), c('Asuransi Purna Artanugraha'), c('Asuransi Bosowa'), c('Asuransi Sahabat Artha Proteksi'), c('Asuransi Umum BCA', 'BCA Insurance'), c('Asuransi Multi Artha Guna'), c('Asuransi Etiqa Indonesia', 'Etiqa'), c('KB Insurance Indonesia', 'KB Insurance'), c('Asuransi Samsung Tugu', 'Samsung Fire & Marine'), c('Asuransi Sinar Mas Syariah', 'Asuransi Sinar Mas'), c('Asuransi Takaful Umum'), c('Asuransi Takaful Keluarga'), c('Allianz Syariah', 'Allianz'), c('Prudential Syariah', 'Prudential plc'), c('AXA Insurance Indonesia', 'AXA'), c('Asuransi Astra Buana', 'Asuransi Astra'), c('Asuransi Jiwa Manulife Indonesia', 'Manulife'), c('Asuransi Jiwa Generali Indonesia', 'Generali'), c('Asuransi Jiwa Sinarmas MSIG', 'MS&AD'), c('Asuransi Jiwa Central Asia Raya'), c('Asuransi Jiwa Bringin Jiwa Sejahtera'), c('Asuransi Jiwa Indolife'), c('Asuransi Jiwa Astra', 'Asuransi Astra'), c('Asuransi Jiwa Adisarana Wanaartha'), c('Asuransi Jiwa Kresna'), c('Asuransi Jiwa Bumiputera'), c('Asuransi Jiwa Tugu Mandiri', 'Tugu Insurance'), c('Asuransi Jiwa Sequis Financial', 'Asuransi Jiwa Sequis'), c('Asuransi Jiwa Sinarmas', 'Asuransi Sinar Mas'), c('Asuransi Jiwa Panin Dai-ichi', 'Dai-ichi Life'), c('Asuransi Jiwa Hanwha Indonesia', 'Hanwha Life'), c('Asuransi Jiwa Starinvestama'), c('Asuransi Jiwa Reliance Indonesia'), c('Asuransi Jiwa Mega Indonesia'), c('Asuransi Jiwa Advista'), c('Asuransi Jiwa Sraya Putra'), c('Asuransi Jiwa Perisai'), c('Asuransi Jiwa Equity Life')],
  ph: [c('Malayan Insurance'), c('Pioneer Insurance'), c('BPI/MS Insurance', 'MS&AD'), c('FPG Insurance'), c('Standard Insurance Philippines'), c('Prudential Guarantee'), c('Chubb Philippines', 'Chubb'), l('Sun Life Philippines', 'Sun Life'), l('Pru Life UK', 'Prudential plc'), c('AXA Philippines', 'AXA'), l('Manulife Philippines', 'Manulife'), l('Insular Life'), h('Maxicare'), h('Intellicare'), h('Medicard'), l('AIA Philippines', 'AIA'), l('Cocolife'), c('Mercantile Insurance'), c('Charter Ping An', 'Ayala'), c('UCPB General Insurance'), c('Oriental Assurance'), c('Stronghold Insurance'), c('MAA General Assurance'), c('Milestone Guaranty'), c('Alpha Insurance'), c('Commonwealth Insurance'), c('Cibeles Insurance'), c('Pacific Union Insurance'), c('Philippine British Assurance'), c('PGA Sompo', 'Sompo'), c('Liberty Insurance Philippines', 'Liberty Mutual'), c('Paramount Life & General'), c('Etiqa Philippines', 'Etiqa'), c('Generali Philippines', 'Generali'), c('Allianz PNB Life', 'Allianz'), c('FWD Philippines', 'FWD'), c('BDO Life'), c('Sun Life Grepa', 'Sun Life'), c('Manulife China Bank Life', 'Manulife'), c('Beneficial Life'), c('Fortune Life'), c('First Life'), c('United Coconut Planters Life'), c('Philippine Prudential Life'), c('Bankers Assurance Philippines'), c('Empire Insurance'), c('Malayan Insurance Tokio Marine', 'Tokio Marine'), c('PhilAm Life', 'AIA'), c('Etiqa Life Philippines', 'Etiqa'), c('SGI Philippines'), c('Cigna Philippines', 'Cigna'), c('Pacific Cross Philippines'), c('PhilCare'), c('Insular Health Care', 'Insular Life'), c('Kaiser International'), c('Avega Managed Care'), c('Cocolife Healthcare', 'Cocolife'), c('CareHealth Plus'), c('EastWest Healthcare'), c('Value Care Health Systems'), c('Health Maintenance Inc.'), c('Fortune Care'), c('Getwell Health Systems'), c('Optimum Medical'), c('Lacson & Lacson Insurance')],
  kh: [c('Forte Insurance'), c('Caminco'), c('Asia Insurance Cambodia'), l('Prudential Cambodia', 'Prudential plc'), l('Manulife Cambodia', 'Manulife'), l('AIA Cambodia', 'AIA'), c('Campu Lonpac', 'Lonpac Insurance'), l('Sovannaphum Life', 'Muang Thai'), c('Dara Insurance'), c('Etiqa Cambodia', 'Etiqa'), c('Infinity General Insurance'), c('Phillip General Insurance Cambodia'), c('People & Partners Insurance'), c('Cambodia Life Insurance'), c('Bamboo Insurance Cambodia'), c('Fortune Life Cambodia'), c('Cambodia-Vietnam Insurance'), c('Chubb Cambodia', 'Chubb'), c('Grand China Life Cambodia'), c('Nagacorp Insurance')],
  la: [c('Allianz General Laos', 'Allianz'), c('Lao-Viet Insurance'), c('Toko Assurance Lao'), c('APA Insurance Lao'), c('MSIG Laos', 'MS&AD'), c('Lao Insurance Company'), c('Lane Xang Assurance'), c('Prudential Laos', 'Prudential plc')],
  mm: [c('Myanma Insurance'), c('IKBZ Insurance'), c('AYA Sompo', 'Sompo'), c('Grand Guardian Nippon Life'), c('GGI'), c('First National Insurance'), c('Young Insurance Global'), c('Aung Thitsa Oo Insurance'), c('Excellent Fortune Insurance'), c('Global World Insurance'), l('Prudential Myanmar', 'Prudential plc'), l('Manulife Myanmar', 'Manulife'), l('Dai-ichi Life Myanmar', 'Dai-ichi Life'), c('Chubb Myanmar', 'Chubb'), l('AIA Myanmar', 'AIA'), c('Capital Life Myanmar'), c('CB Insurance'), c('Citizen Business Insurance')],
  bn: [c('Takaful Brunei'), c('Insurans Islam TAIB'), c('Standard Insurance Brunei'), c('National Insurance Company Brunei'), c('Tokio Marine Brunei', 'Tokio Marine'), l('AIA Brunei', 'AIA'), l('Great Eastern Brunei', 'Great Eastern'), c('MBA Insurance'), c('Etiqa Brunei', 'Etiqa')],
  tl: [],

  // Oceania
  au: [g('NRMA Insurance', 'IAG'), c('Allianz Australia', 'Allianz'), g('AAMI', 'Suncorp'), g('RACV'), QBE, g('Youi'), g('Budget Direct', 'Auto & General'), h('Medibank'), h('Bupa Australia', 'Bupa'), h('nib'), h('HCF'), h('HBF'), l('TAL', 'Dai-ichi Life'), CLUB_MARINE, add('Cover-More', ['travel'], { group: 'Zurich' }), g('Suncorp'), g('GIO', 'Suncorp'), g('RAC'), g('RACQ'), g('RAA'), g('Hollard Australia', 'Hollard'), g('Real Insurance', 'Hollard'), l('AIA Australia', 'AIA'), l('Zurich Australia', 'Zurich'), l('MLC Life', 'Nippon Life'), l('Resolution Life'), h('Australian Unity'), h('GMHBA'), h('Frank Health', 'GMHBA'), h('Teachers Health'), h('Defence Health'), h('CBHS'), h('Latrobe Health'), h('Peoples Choice'), h('St.LukesHealth'), h('Westfund'), h('Phoenix Health'), h('Health Partners'), h('Queensland Country Health'), h('Doctors’ Health Fund'), h('RT Health'), h('Navy Health'), h('Police Health'), h('Mildura Health'), h('Onemedifund'), h('TUH'), h('CUA Health'), g('Bingle', 'Suncorp'), g('Shannons', 'Suncorp'), g('Coles Insurance'), g('Woolworths Insurance'), g('ING Australia'), g('Honey Insurance'), g('Huddle'), g('Rollin’', 'IAG'), g('SGIO', 'IAG'), g('SGIC', 'IAG'), g('CGU', 'IAG'), g('Swann', 'IAG'), g('Vero', 'Suncorp'), g('Terri Scheer', 'Suncorp'), g('Apia', 'Suncorp'), g('Australian Seniors', 'Hollard'), g('Guardian Insurance', 'Hollard'), g('Kogan Insurance'), g('Qantas Insurance'), g('Virgin Money Insurance'), g('Bendigo Bank Insurance'), g('Elders Insurance', 'QBE'), g('Catholic Church Insurance'), g('Ansvar'), g('Chubb Australia', 'Chubb'), g('AIG Australia', 'AIG'), g('Liberty Australia', 'Liberty Mutual'), g('Berkshire Hathaway Specialty Australia'), g('Sompo Australia', 'Sompo'), g('Tokio Marine Australia', 'Tokio Marine'), g('Mitsui Sumitomo Australia', 'MS&AD'), g('Allied World Australia', 'Fairfax'), g('Great Lakes Australia', 'Munich Re'), g('HDI Global Australia', 'HDI'), g('Zurich Australia General', 'Zurich'), g('Pacific International Insurance'), g('Auto & General'), g('Insurance Australia Group'), g('Assetinsure'), g('Lloyd’s Australia'), g('Wesfarmers Insurance'), g('Youi Home'), g('Nationwide Marine'), g('Trident Marine'), g('Nautilus Marine'), g('Aviation Insurance Australia'), g('QBE Aviation', 'QBE'), g('Allianz Aviation', 'Allianz')],
  nz: [g('AA Insurance', 'Suncorp'), g('State Insurance', 'IAG'), g('Tower Insurance'), g('AMI', 'IAG'), h('Southern Cross Health Society'), h('nib New Zealand', 'nib'), l('Partners Life', 'Dai-ichi Life'), g('Vero New Zealand', 'Suncorp'), l('AIA New Zealand', 'AIA'), l('Fidelity Life'), l('Asteron Life', 'Resolution Life'), h('Accuro'), h('UniMed'), l('Chubb Life New Zealand', 'Chubb'), g('FMG'), g('Initio'), g('Cove Insurance'), g('Trade Me Insurance'), g('Protecta Insurance'), g('Lumley', 'IAG'), g('NZI', 'IAG'), g('Ando Insurance'), g('Delta Insurance'), g('QBE New Zealand', 'QBE'), g('AIG New Zealand', 'AIG'), g('Zurich New Zealand', 'Zurich'), g('Allianz New Zealand', 'Allianz'), g('MAS'), g('Cigna New Zealand', 'Chubb'), CLUB_MARINE, g('Mariner Insurance'), g('Nautical Insurance'), g('Aviation Cooperating Underwriters Pacific')],
  pg: [c('Pacific MMI'), c('Capital Insurance Group'), c('Tower Insurance'), c('Kwila Insurance'), c('Trans Pacific Assurance'), l('BSP Life'), l('Kina Life'), c('Pacific Assurance Group'), c('QBE PNG', 'QBE'), c('Century Insurance'), c('Niugini Insurance'), c('Marsh PNG')],
  fj: [c('Sun Insurance'), c('Tower Insurance'), h('FijiCare'), l('BSP Life'), c('Capital Insurance Group'), l('Life Insurance Corporation of India (Fiji)'), c('QBE Fiji', 'QBE'), c('New India Assurance Fiji', 'New India Assurance')],
  ws: [c('Progressive Insurance Samoa'), c('National Pacific Insurance', 'Tower Insurance'), c('Apia Insurance')],
  to: [c('National Pacific Insurance', 'Tower Insurance'), c('Federal Pacific Insurance')],
  vu: [c('QBE Vanuatu', 'QBE'), c('Vanuatu Insurance Company'), c('Tower Insurance')],
  sb: [c('Tower Insurance'), c('Solomon Islands Insurance'), c('QBE Solomon Islands', 'QBE')],
  ki: [],
  tv: [],
  nr: [],
  mh: [c('Moylan’s Insurance Underwriters')],
  fm: [c('Moylan’s Insurance Underwriters')],
  pw: [c('Moylan’s Insurance Underwriters')],
  gu: [c('Moylan’s Insurance Underwriters'), h('StayWell Insurance'), h('Calvo’s SelectCare'), h('TakeCare Insurance'), h('NetCare'), c('Cassidy’s Associated Insurers'), c('Pacific Indemnity')],
  mp: [c('Moylan’s Insurance Underwriters'), h('StayWell Insurance'), h('Calvo’s SelectCare'), h('TakeCare Insurance')],
  as: [],
  ck: [],
  nu: [],
  tk: [],
  pn: [],
  wf: [],
  pf: [AXA, c('Groupama'), c('Allianz France', 'Allianz'), c('Generali France', 'Generali')],
  nc: [AXA, c('Groupama'), c('Allianz France', 'Allianz'), c('Generali France', 'Generali')],
  aq: [],
};

/** A country whose insurers exist but SLATE does not name: too thin, too closed or too new a market to be sure of. */
export const LOCAL_ONLY: Readonly<Record<string, string>> = {
  cu: 'Two state insurers, ESEN and ESICUBA, with nothing private beside them. SLATE does not sell you a policy from a state monopoly.',
  ht: 'A handful of local companies in a market too thin for SLATE to name one honestly.',
  ms: 'A few agencies for Caribbean insurers. Nobody underwrites on the island itself.',
  ad: 'A small national market of Andorran companies and Spanish and French agencies SLATE cannot vouch for one by one.',
  sy: 'A state insurer and a market shut by war and sanctions. Nobody international writes here.',
  iq: 'State insurers and a few private ones in a market that international companies have left.',
  ye: 'A few local insurers in a market broken by war.',
  ly: 'Local companies only, in a market international insurers left.',
  sd: 'Local companies only, and a war that has closed most of them.',
  ss: 'Local companies only, in one of the thinnest markets on earth.',
  td: 'A few local companies under the CIMA code. Nobody international writes here.',
  cf: 'A few local companies under the CIMA code, and very few of those.',
  gq: 'A few local companies. Nobody international writes here.',
  st: 'One or two local agencies. Nobody underwrites on the islands.',
  gw: 'A few local companies in one of the thinnest markets in West Africa.',
  mr: 'Local companies only. Nobody international writes here.',
  dj: 'Local companies only, and few of those.',
  so: 'Takaful start-ups and Kenyan branches. Nobody international writes here.',
  km: 'One or two local agencies.',
  af: 'A state insurer and a market international companies left.',
  tj: 'State and local companies only.',
  tm: 'State insurers only.',
  kp: 'One state insurer, the Korea National Insurance Corporation, under sanctions. SLATE does not sell you a policy from it.',
  tl: 'A few local agencies for Indonesian and Portuguese insurers.',
  ki: 'One local agency for Australian and New Zealand insurers.',
  tv: 'No insurer on the islands; cover is bought through Fiji.',
  nr: 'No insurer on the island; cover is bought through Australia.',
  as: 'Agencies for Hawaiian and mainland insurers, none underwriting on the islands.',
  ck: 'Agencies for New Zealand insurers only.',
  nu: 'Cover is bought through New Zealand.',
  wf: 'Cover is bought through New Caledonia and France.',
  sh: 'One local company on St Helena, and British insurers for the rest.',
};

/** Nowhere to insure anything, and why. */
export const NO_INSURER: Readonly<Record<string, string>> = {
  aq: 'Nobody lives in Antarctica and nobody insures anything there. Expedition cover is bought at home before you go.',
  tk: 'Tokelau has no insurer and no road to need one on.',
  pn: 'Pitcairn has fifty people and no insurer.',
  va: 'The Holy See insures itself. Anyone else there buys from an Italian insurer.',
};

/** What sits under the private cover: a state scheme, where there is one. */
export const STATE_HEALTH: Readonly<Record<string, string>> = {
  uk: 'The NHS. Private cover is a top-up for speed and choice, not the system.',
  ie: 'The HSE, with charges. Most people carry private cover as well.',
  ca: 'Provincial medicare. Private cover fills in dental, drugs and eyes.',
  au: 'Medicare, with a levy on higher earners who go without private cover.',
  nz: 'Public hospitals, free at the point of care. Private cover buys the queue.',
  fr: 'L’Assurance Maladie, with a mutuelle on top that nearly everybody holds.',
  de: 'Statutory insurance from a Krankenkasse, or private cover above the earnings threshold.',
  it: 'The Servizio Sanitario Nazionale.',
  es: 'The Sistema Nacional de Salud.',
  pt: 'The Serviço Nacional de Saúde.',
  nl: 'A compulsory private basic policy, which everybody buys and the state regulates.',
  be: 'Mutual health funds, compulsory.',
  ch: 'A compulsory private basic policy from a Krankenkasse.',
  at: 'Statutory insurance through the ÖGK.',
  se: 'Regional public care.', no: 'Public care through Helfo.', dk: 'Public care through the regions.', fi: 'Municipal public care, with Kela.',
  is: 'Public care through Sjúkratryggingar Íslands.',
  pl: 'The NFZ.', cz: 'Statutory insurance funds, VZP the largest.', sk: 'Statutory insurance funds.', hu: 'The NEAK.', ro: 'The CNAS.', bg: 'The NHIF.', gr: 'EOPYY.', hr: 'The HZZO.', si: 'The ZZZS.',
  ru: 'Compulsory medical insurance, OMS.', ua: 'The National Health Service of Ukraine.',
  jp: 'National Health Insurance or employee insurance, with a thirty percent co-pay.',
  kr: 'The National Health Insurance Service.',
  tw: 'National Health Insurance, a single scheme for everybody.',
  sg: 'MediShield Life, with Medisave. Private cover sits on top.',
  hk: 'The Hospital Authority, with long waits that private cover buys past.',
  cn: 'Basic medical insurance, urban and rural.',
  th: 'The Universal Coverage Scheme.',
  my: 'Public hospitals, heavily subsidised.',
  in: 'Ayushman Bharat for those eligible, and public hospitals for everybody.',
  br: 'The SUS, free to everybody. Private plans buy speed.',
  mx: 'IMSS for the employed, IMSS-Bienestar for the rest.',
  ar: 'Public hospitals, obras sociales for the employed.',
  cl: 'Fonasa, or an Isapre instead.',
  co: 'An EPS under the state system, contributory or subsidised.',
  cr: 'The Caja Costarricense de Seguro Social.',
  cu: 'State care for everybody, and nothing else.',
  il: 'National health insurance through the four HMOs.',
  tr: 'The SGK.',
  sa: 'Free public care for citizens; employer cover compulsory for everyone else.',
  ae: 'Employer cover is compulsory; Daman and Thiqa for nationals.',
  qa: 'Hamad Medical Corporation, with cover required for residents.',
  kw: 'Public care for citizens; Afya for pensioners.',
  eg: 'The Universal Health Insurance System, rolling out governorate by governorate.',
  ma: 'AMO, the compulsory scheme.',
  tn: 'The CNAM.',
  dz: 'CNAS, the social security fund.',
  za: 'Public hospitals; a National Health Insurance fund is on the statute book and not yet paying.',
  ke: 'The Social Health Authority, which replaced the NHIF.',
  gh: 'The National Health Insurance Scheme.',
  ng: 'The National Health Insurance Authority, thinly.',
  rw: 'Mutuelle de Santé, which nearly everybody is on.',
  tz: 'The NHIF.',
  et: 'Community based health insurance, and public hospitals.',
  us: 'Medicare past sixty-five and Medicaid below the line. Everyone else buys or is covered through work.',
};

// --- Lookups ---------------------------------------------------------------

/** Every insurer named anywhere. */
export const INSURERS: readonly Insurer[] = [...registry.values()];
const byName = new Map(INSURERS.map((i) => [i.name, i]));

export function insurerByName(name: string): Insurer | undefined {
  return byName.get(name);
}

export type InsurerCoverage =
  | { kind: 'named'; names: readonly string[] }
  | { kind: 'metropole'; via: string; names: readonly string[] }
  | { kind: 'local_only'; reason: string }
  | { kind: 'none'; reason: string }
  | { kind: 'unaccounted' };

/** How a country is accounted for. */
export function insurerCoverageOf(countryId: string): InsurerCoverage {
  const own = INSURERS_BY_COUNTRY[countryId];
  if (own && own.length > 0) return { kind: 'named', names: own };
  if (NO_INSURER[countryId]) return { kind: 'none', reason: NO_INSURER[countryId]! };
  if (LOCAL_ONLY[countryId]) return { kind: 'local_only', reason: LOCAL_ONLY[countryId]! };
  const via = PASSPORT_OF[countryId];
  const theirs = via ? INSURERS_BY_COUNTRY[via] : undefined;
  if (via && theirs && theirs.length > 0) return { kind: 'metropole', via, names: theirs };
  return { kind: 'unaccounted' };
}

export interface InsurerOffer {
  name: string;
  /** `local`: writes in the country; `metropole`: the metropole's market; `broker`: a specialist placed through a broker. */
  how: 'local' | 'metropole' | 'broker';
  group?: string;
}

/**
 * Who will write this line for someone living in this country, its own
 * market first, then the specialists a broker would place it with. Empty
 * when nobody will, which the caller must say out loud.
 */
export function insurersFor(countryId: string, line: InsuranceLine): InsurerOffer[] {
  const cover = insurerCoverageOf(countryId);
  const out: InsurerOffer[] = [];
  const seen = new Set<string>();
  const push = (name: string, how: InsurerOffer['how']) => {
    const insurer = byName.get(name);
    if (!insurer || seen.has(name) || !insurer.lines.includes(line)) return;
    if (insurer.onlyIn && !insurer.onlyIn.includes(countryId) && !(cover.kind === 'metropole' && insurer.onlyIn.includes(cover.via))) return;
    seen.add(name);
    out.push({ name, how, group: insurer.group });
  };
  if (cover.kind === 'named') for (const name of cover.names) push(name, 'local');
  if (cover.kind === 'metropole') for (const name of cover.names) push(name, 'metropole');
  if (cover.kind !== 'none') for (const name of GLOBAL_SPECIALISTS[line]) push(name, 'broker');
  return out;
}

/** Whether a real company writes this line here at all. */
export function insuredHere(countryId: string, line: InsuranceLine): boolean {
  return insurersFor(countryId, line).length > 0;
}

/**
 * A stable price factor per carrier, so the choice between two real names
 * is a choice and not a coin toss: the same insurer is always the same
 * amount dearer or cheaper than the game's base. Between 0.90 and 1.12.
 */
export function carrierFactor(name: string): number {
  let hash = 7;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return 0.9 + (hash % 23) / 100;
}

export const REAL_INSURER_NOTE = 'Every policy is written by a company that really sells that line where you live. Which lines a company writes is SLATE’s reading of its public business, and the premium is SLATE’s own calibration, not a quote from anybody.';
export const BROKER_NOTE = 'Placed through a broker: a specialist that writes this line anywhere, because nobody in your own market does.';
