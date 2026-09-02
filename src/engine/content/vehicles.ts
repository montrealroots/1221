/**
 * SLATE — Vehicle catalogue and parts fitment.
 *
 * Manufacturer names are real and widely known. Every specification, price and
 * option here is a SLATE calibration, not a manufacturer figure, and the
 * registry says so on every record.
 *
 * The important part is fitment: a part exists in the catalogue does NOT mean
 * it can go on your car. Every part declares which makes, models, years,
 * powertrains and trims it fits, what it depends on, whether it stays street
 * legal, whether it voids warranty and what it does to performance and value.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';
import type { Money } from '../core/money';

const V = REFERENCE_VERSION;

export interface Manufacturer extends ReferenceRecord {
  type: 'manufacturer';
  country: string;
  /** 0-100 how exclusive the brand reads. */
  prestige: number;
  /** 0-100 typical reliability. */
  reliability: number;
  segment: 'economy' | 'mainstream' | 'premium' | 'luxury' | 'exotic';
}

export type BodyStyle = 'sedan' | 'coupe' | 'convertible' | 'hatchback' | 'wagon' | 'suv' | 'truck' | 'van' | 'roadster';
export type Powertrain = 'gas' | 'diesel' | 'hybrid' | 'phev' | 'ev';

export interface VehicleTrim {
  id: string;
  name: string;
  /** Base MSRP in cents. Calibrated. */
  msrp: Money;
  horsepower: number;
  zeroToSixty: number;
  /** Miles per gallon equivalent. */
  efficiency: number;
  drivetrain: 'fwd' | 'rwd' | 'awd' | '4wd';
  powertrain: Powertrain;
  /** Factory option codes available on this trim. */
  availableOptions: string[];
  standardFeatures: string[];
}

export interface VehicleModel extends ReferenceRecord {
  type: 'vehicle_model';
  parentId: string;
  make: string;
  bodyStyle: BodyStyle;
  segment: 'compact' | 'midsize' | 'fullsize' | 'sports' | 'super' | 'luxury' | 'utility' | 'commercial';
  /** Model years the catalogue covers. */
  years: [number, number];
  seats: number;
  trims: VehicleTrim[];
  /** Annual depreciation as a decimal in the first years. */
  depreciationRate: number;
  /** Collector appreciation kicks in after this many years, if positive. */
  collectorAfterYears?: number;
  maintenanceCostIndex: number;
  insuranceIndex: number;
  tags: string[];
}

export interface FactoryOption extends ReferenceRecord {
  type: 'factory_option';
  category: string;
  price: Money;
  effects: { horsepower?: number; zeroToSixty?: number; efficiency?: number; valueRetention?: number };
}

export type PartCategory =
  | 'paint' | 'wrap' | 'ppf' | 'wheels' | 'tires' | 'brakes' | 'suspension'
  | 'exhaust' | 'intake' | 'engine' | 'turbo' | 'tune' | 'cooling'
  | 'seats' | 'steering_wheel' | 'upholstery' | 'trim' | 'infotainment'
  | 'audio' | 'electronics' | 'lighting' | 'security' | 'tracking' | 'aero';

export interface PartFitment {
  /** Manufacturer ids this part fits. Empty means universal. */
  makes: string[];
  /** Model ids. Empty means any model of a listed make. */
  models: string[];
  /** Inclusive model-year range. */
  years?: [number, number];
  /** Powertrains this part is compatible with. */
  powertrains?: Powertrain[];
  /** Trim ids required, if the part only fits certain trims. */
  trims?: string[];
  /** Body styles. */
  bodyStyles?: BodyStyle[];
}

export interface Part extends ReferenceRecord {
  type: 'part';
  category: PartCategory;
  brand: string;
  price: Money;
  /** Shop labour hours to install. */
  labourHours: number;
  fitment: PartFitment;
  /** Other part categories that must already be installed. */
  requires: PartCategory[];
  /** Parts that cannot coexist with this one. */
  conflictsWith: PartCategory[];
  effects: {
    horsepower?: number;
    zeroToSixty?: number;
    efficiency?: number;
    /** Change to resale value, as a fraction of the part price recovered. */
    valueRecovery?: number;
    condition?: number;
    /** Flat value change in cents, for cosmetic work. */
    valueDelta?: Money;
  };
  streetLegal: boolean;
  voidsWarranty: boolean;
  /** Requires disclosure to the insurer; failing to disclose risks a denied claim. */
  insuranceRelevant: boolean;
  description: string;
}

const MFG = {
  source: 'public_reference', confidence: 'high', version: V,
  note: 'Manufacturer identity is public knowledge. Prestige and reliability ratings are SLATE calibrations.',
} as const;

const SIM = {
  source: 'calibrated_estimate', confidence: 'low', version: V,
  note: 'Specifications, prices and options are SLATE calibrations, not manufacturer data.',
} as const;

export const MANUFACTURERS = new Registry<Manufacturer>('manufacturers', [
  { id: 'toyota', name: 'Toyota', type: 'manufacturer', country: 'jp', prestige: 42, reliability: 94, segment: 'mainstream', ...MFG },
  { id: 'honda', name: 'Honda', type: 'manufacturer', country: 'jp', prestige: 44, reliability: 92, segment: 'mainstream', ...MFG },
  { id: 'ford', name: 'Ford', type: 'manufacturer', country: 'us', prestige: 40, reliability: 76, segment: 'mainstream', ...MFG },
  { id: 'chevrolet', name: 'Chevrolet', aliases: ['Chevy'], type: 'manufacturer', country: 'us', prestige: 40, reliability: 74, segment: 'mainstream', ...MFG },
  { id: 'subaru', name: 'Subaru', type: 'manufacturer', country: 'jp', prestige: 46, reliability: 84, segment: 'mainstream', ...MFG },
  { id: 'mazda', name: 'Mazda', type: 'manufacturer', country: 'jp', prestige: 50, reliability: 86, segment: 'mainstream', ...MFG },
  { id: 'volkswagen', name: 'Volkswagen', aliases: ['VW'], type: 'manufacturer', country: 'de', prestige: 54, reliability: 72, segment: 'mainstream', ...MFG },
  { id: 'tesla', name: 'Tesla', type: 'manufacturer', country: 'us', prestige: 70, reliability: 72, segment: 'premium', ...MFG },
  { id: 'bmw', name: 'BMW', type: 'manufacturer', country: 'de', prestige: 78, reliability: 70, segment: 'luxury', ...MFG },
  { id: 'mercedes', name: 'Mercedes-Benz', aliases: ['Mercedes', 'Benz'], type: 'manufacturer', country: 'de', prestige: 82, reliability: 70, segment: 'luxury', ...MFG },
  { id: 'audi', name: 'Audi', type: 'manufacturer', country: 'de', prestige: 76, reliability: 70, segment: 'luxury', ...MFG },
  { id: 'porsche', name: 'Porsche', type: 'manufacturer', country: 'de', prestige: 90, reliability: 82, segment: 'luxury', ...MFG },
  { id: 'landrover', name: 'Land Rover', type: 'manufacturer', country: 'uk', prestige: 80, reliability: 58, segment: 'luxury', ...MFG },
  { id: 'lexus', name: 'Lexus', type: 'manufacturer', country: 'jp', prestige: 74, reliability: 95, segment: 'luxury', ...MFG },
  { id: 'rangerover', name: 'Range Rover', type: 'manufacturer', country: 'uk', prestige: 86, reliability: 58, segment: 'luxury', parentId: 'landrover', ...MFG },
  { id: 'ferrari', name: 'Ferrari', type: 'manufacturer', country: 'it', prestige: 98, reliability: 62, segment: 'exotic', ...MFG },
  { id: 'lamborghini', name: 'Lamborghini', type: 'manufacturer', country: 'it', prestige: 97, reliability: 60, segment: 'exotic', ...MFG },
  { id: 'mclaren', name: 'McLaren', type: 'manufacturer', country: 'uk', prestige: 94, reliability: 58, segment: 'exotic', ...MFG },
  { id: 'aston', name: 'Aston Martin', type: 'manufacturer', country: 'uk', prestige: 93, reliability: 60, segment: 'exotic', ...MFG },
  { id: 'bentley', name: 'Bentley', type: 'manufacturer', country: 'uk', prestige: 95, reliability: 66, segment: 'exotic', ...MFG },
  { id: 'rollsroyce', name: 'Rolls-Royce', type: 'manufacturer', country: 'uk', prestige: 100, reliability: 74, segment: 'exotic', ...MFG },
  { id: 'rivian', name: 'Rivian', type: 'manufacturer', country: 'us', prestige: 68, reliability: 70, segment: 'premium', ...MFG },
  { id: 'jeep', name: 'Jeep', type: 'manufacturer', country: 'us', prestige: 50, reliability: 66, segment: 'mainstream', ...MFG },
  { id: 'volvo', name: 'Volvo', type: 'manufacturer', country: 'de', prestige: 68, reliability: 78, segment: 'premium', ...MFG },
]);

function trim(id: string, name: string, msrpDollars: number, hp: number, zeroSixty: number, efficiency: number, drivetrain: VehicleTrim['drivetrain'], powertrain: Powertrain, options: string[], features: string[]): VehicleTrim {
  return { id, name, msrp: msrpDollars * 100, horsepower: hp, zeroToSixty: zeroSixty, efficiency, drivetrain, powertrain, availableOptions: options, standardFeatures: features };
}

interface ModelSpec {
  id: string; name: string; make: string; body: BodyStyle; segment: VehicleModel['segment'];
  years: [number, number]; seats: number; trims: VehicleTrim[]; dep: number;
  maint: number; ins: number; tags: string[]; collectorAfter?: number;
}

function model(spec: ModelSpec): VehicleModel {
  return {
    id: spec.id, name: spec.name, type: 'vehicle_model', parentId: spec.make,
    make: MANUFACTURERS.require(spec.make).name,
    bodyStyle: spec.body, segment: spec.segment, years: spec.years, seats: spec.seats,
    trims: spec.trims, depreciationRate: spec.dep, collectorAfterYears: spec.collectorAfter,
    maintenanceCostIndex: spec.maint, insuranceIndex: spec.ins, tags: spec.tags,
    aliases: [`${MANUFACTURERS.require(spec.make).name} ${spec.name}`],
    ...SIM,
  };
}

const COMFORT = ['opt_premium_audio', 'opt_leather', 'opt_sunroof', 'opt_driver_assist', 'opt_cold_weather'];
const PERF = ['opt_perf_brakes', 'opt_sport_suspension', 'opt_sport_exhaust', 'opt_carbon_pack', 'opt_perf_tires'];

export const VEHICLE_MODELS = new Registry<VehicleModel>('vehicle_models', [
  model({ id: 'toyota_corolla', name: 'Corolla', make: 'toyota', body: 'sedan', segment: 'compact', years: [2015, 2030], seats: 5, dep: 0.13, maint: 0.7, ins: 0.8, tags: ['commuter', 'reliable', 'first car'], trims: [
    trim('le', 'LE', 23_500, 169, 8.9, 35, 'fwd', 'gas', COMFORT, ['Backup camera', 'Adaptive cruise']),
    trim('se', 'SE', 25_900, 169, 8.5, 34, 'fwd', 'gas', [...COMFORT, 'opt_perf_tires'], ['Sport seats', 'Backup camera']),
    trim('hybrid', 'Hybrid LE', 26_500, 138, 10.2, 50, 'fwd', 'hybrid', COMFORT, ['Backup camera', 'Adaptive cruise']),
  ] }),
  model({ id: 'honda_civic', name: 'Civic', make: 'honda', body: 'sedan', segment: 'compact', years: [2015, 2030], seats: 5, dep: 0.13, maint: 0.72, ins: 0.85, tags: ['commuter', 'reliable', 'tuner'], trims: [
    trim('lx', 'LX', 24_250, 158, 8.2, 36, 'fwd', 'gas', COMFORT, ['Backup camera']),
    trim('sport', 'Sport', 26_900, 180, 7.4, 33, 'fwd', 'gas', [...COMFORT, ...PERF], ['Sport suspension', 'Alloy wheels']),
    trim('typer', 'Type R', 45_900, 315, 5.0, 26, 'fwd', 'gas', PERF, ['Limited-slip differential', 'Brembo brakes', 'Adaptive dampers']),
  ] }),
  model({ id: 'ford_f150', name: 'F-150', make: 'ford', body: 'truck', segment: 'utility', years: [2015, 2030], seats: 6, dep: 0.16, maint: 1.1, ins: 1.0, tags: ['truck', 'towing', 'work'], trims: [
    trim('xl', 'XL', 38_000, 290, 7.4, 22, '4wd', 'gas', COMFORT, ['Tow package']),
    trim('lariat', 'Lariat', 62_500, 400, 6.1, 20, '4wd', 'gas', [...COMFORT, 'opt_tow_max'], ['Leather', 'Tow package', 'Bed liner']),
    trim('lightning', 'Lightning', 72_000, 452, 4.5, 76, 'awd', 'ev', COMFORT, ['Onboard power', 'Frunk']),
  ] }),
  model({ id: 'tesla_model3', name: 'Model 3', make: 'tesla', body: 'sedan', segment: 'midsize', years: [2018, 2030], seats: 5, dep: 0.18, maint: 0.55, ins: 1.15, tags: ['ev', 'tech', 'commuter'], trims: [
    trim('rwd', 'Long Range RWD', 42_500, 283, 5.8, 132, 'rwd', 'ev', ['opt_premium_audio', 'opt_autopilot', 'opt_tow'], ['Glass roof', 'Heated seats']),
    trim('awd', 'Long Range AWD', 47_500, 394, 4.2, 123, 'awd', 'ev', ['opt_premium_audio', 'opt_autopilot', 'opt_tow'], ['Glass roof', 'Heated seats']),
    trim('performance', 'Performance', 54_500, 510, 3.1, 113, 'awd', 'ev', ['opt_premium_audio', 'opt_autopilot', 'opt_track_mode'], ['Track mode', 'Performance brakes', 'Lowered suspension']),
  ] }),
  model({ id: 'tesla_models', name: 'Model S', make: 'tesla', body: 'sedan', segment: 'luxury', years: [2015, 2030], seats: 5, dep: 0.21, maint: 0.7, ins: 1.4, tags: ['ev', 'luxury', 'fast'], trims: [
    trim('lr', 'Long Range', 79_000, 670, 3.1, 120, 'awd', 'ev', ['opt_premium_audio', 'opt_autopilot', 'opt_carbon_pack'], ['Glass roof', 'Premium interior']),
    trim('plaid', 'Plaid', 94_000, 1020, 1.99, 102, 'awd', 'ev', ['opt_premium_audio', 'opt_autopilot', 'opt_carbon_pack', 'opt_track_mode'], ['Carbon fibre spoiler', 'Track mode']),
  ] }),
  model({ id: 'bmw_3series', name: '3 Series', make: 'bmw', body: 'sedan', segment: 'midsize', years: [2015, 2030], seats: 5, dep: 0.20, maint: 1.35, ins: 1.2, tags: ['sport sedan', 'daily'], trims: [
    trim('330i', '330i', 46_500, 255, 5.6, 30, 'rwd', 'gas', [...COMFORT, ...PERF], ['Sport seats', 'Adaptive suspension']),
    trim('m340i', 'M340i', 59_000, 382, 4.1, 26, 'awd', 'gas', [...COMFORT, ...PERF], ['M Sport differential', 'Adaptive M suspension']),
    trim('m3', 'M3 Competition', 84_500, 503, 3.4, 19, 'awd', 'gas', PERF, ['Carbon bucket seats', 'M Compound brakes']),
  ] }),
  model({ id: 'mercedes_eclass', name: 'E-Class', make: 'mercedes', body: 'sedan', segment: 'luxury', years: [2015, 2030], seats: 5, dep: 0.23, maint: 1.5, ins: 1.3, tags: ['executive', 'comfort', 'chauffeur'], trims: [
    trim('e350', 'E 350', 62_500, 255, 6.1, 27, 'rwd', 'gas', COMFORT, ['Leather', 'Ambient lighting']),
    trim('e450', 'E 450 4MATIC', 70_500, 375, 4.9, 25, 'awd', 'gas', [...COMFORT, 'opt_rear_entertainment'], ['Air suspension', 'Burmester audio']),
    trim('amge63', 'AMG E 63 S', 122_000, 603, 3.3, 18, 'awd', 'gas', [...COMFORT, ...PERF], ['AMG Ride Control', 'Carbon ceramic option']),
  ] }),
  model({ id: 'mercedes_sclass', name: 'S-Class', make: 'mercedes', body: 'sedan', segment: 'luxury', years: [2015, 2030], seats: 5, dep: 0.26, maint: 1.8, ins: 1.5, tags: ['flagship', 'chauffeur', 'status'], trims: [
    trim('s500', 'S 500', 121_000, 429, 4.9, 24, 'awd', 'gas', [...COMFORT, 'opt_rear_entertainment', 'opt_exec_rear'], ['Air suspension', 'Rear executive seats']),
    trim('s580', 'S 580', 138_000, 496, 4.4, 22, 'awd', 'gas', [...COMFORT, 'opt_rear_entertainment', 'opt_exec_rear'], ['E-Active Body Control', 'Burmester 4D']),
  ] }),
  model({ id: 'mercedes_gwagen', name: 'G-Class', aliasName: 'G-Wagen', make: 'mercedes', body: 'suv', segment: 'luxury', years: [2015, 2030], seats: 5, dep: 0.11, maint: 1.7, ins: 1.5, tags: ['status', 'suv', 'holds value'], collectorAfter: 20, trims: [
    trim('g550', 'G 550', 148_000, 416, 5.6, 15, '4wd', 'gas', COMFORT, ['Three locking differentials']),
    trim('amgg63', 'AMG G 63', 186_000, 577, 4.5, 14, '4wd', 'gas', [...COMFORT, ...PERF], ['AMG exhaust', 'AMG Ride Control']),
  ] } as ModelSpec & { aliasName?: string }),
  model({ id: 'porsche_911', name: '911', make: 'porsche', body: 'coupe', segment: 'sports', years: [2015, 2030], seats: 4, dep: 0.09, maint: 1.6, ins: 1.6, tags: ['sports car', 'holds value', 'weekend'], collectorAfter: 15, trims: [
    trim('carrera', 'Carrera', 116_000, 379, 4.0, 20, 'rwd', 'gas', [...COMFORT, ...PERF], ['Sport Chrono option', 'PASM']),
    trim('carrera4s', 'Carrera 4S', 136_000, 443, 3.2, 19, 'awd', 'gas', [...COMFORT, ...PERF], ['PASM', 'Sport exhaust']),
    trim('turbos', 'Turbo S', 231_000, 640, 2.6, 18, 'awd', 'gas', PERF, ['Carbon ceramic brakes', 'Rear axle steering']),
  ] }),
  model({ id: 'porsche_cayenne', name: 'Cayenne', make: 'porsche', body: 'suv', segment: 'luxury', years: [2015, 2030], seats: 5, dep: 0.20, maint: 1.6, ins: 1.35, tags: ['suv', 'family', 'fast'], trims: [
    trim('base', 'Cayenne', 82_000, 348, 5.7, 21, 'awd', 'gas', COMFORT, ['Air suspension option']),
    trim('gts', 'Cayenne GTS', 116_000, 493, 4.2, 17, 'awd', 'gas', [...COMFORT, ...PERF], ['Sport exhaust', 'Air suspension']),
  ] }),
  model({ id: 'rangerover_sport', name: 'Range Rover Sport', make: 'rangerover', body: 'suv', segment: 'luxury', years: [2015, 2030], seats: 5, dep: 0.27, maint: 1.9, ins: 1.4, tags: ['suv', 'status', 'school run'], trims: [
    trim('se', 'SE', 84_000, 355, 5.9, 21, 'awd', 'gas', COMFORT, ['Air suspension', 'Terrain Response']),
    trim('autobiography', 'Autobiography', 122_000, 523, 4.3, 18, 'awd', 'gas', [...COMFORT, 'opt_rear_entertainment'], ['Meridian audio', 'Semi-aniline leather']),
  ] }),
  model({ id: 'ferrari_296', name: '296 GTB', make: 'ferrari', body: 'coupe', segment: 'super', years: [2022, 2030], seats: 2, dep: 0.06, maint: 3.2, ins: 3.0, tags: ['supercar', 'collector', 'weekend'], collectorAfter: 8, trims: [
    trim('gtb', 'GTB', 338_000, 819, 2.9, 18, 'rwd', 'phev', ['opt_carbon_pack', 'opt_racing_seats', 'opt_lift_axle'], ['Carbon fibre package option', 'Adaptive dampers']),
    trim('assetto', 'Assetto Fiorano', 388_000, 819, 2.8, 18, 'rwd', 'phev', ['opt_carbon_pack', 'opt_racing_seats'], ['Multimatic dampers', 'Carbon aero']),
  ] }),
  model({ id: 'lamborghini_huracan', name: 'Huracan', make: 'lamborghini', body: 'coupe', segment: 'super', years: [2015, 2029], seats: 2, dep: 0.08, maint: 3.0, ins: 3.2, tags: ['supercar', 'loud', 'status'], collectorAfter: 10, trims: [
    trim('evo', 'EVO', 268_000, 631, 2.9, 15, 'awd', 'gas', ['opt_carbon_pack', 'opt_racing_seats', 'opt_lift_axle'], ['Lamborghini Dinamica Veicolo Integrata']),
    trim('sto', 'STO', 335_000, 631, 3.0, 14, 'rwd', 'gas', ['opt_carbon_pack', 'opt_racing_seats'], ['Carbon ceramic brakes', 'Roof snorkel']),
  ] }),
  model({ id: 'rollsroyce_ghost', name: 'Ghost', make: 'rollsroyce', body: 'sedan', segment: 'luxury', years: [2015, 2030], seats: 5, dep: 0.24, maint: 2.8, ins: 2.4, tags: ['flagship', 'chauffeur', 'arrival'], trims: [
    trim('base', 'Ghost', 355_000, 563, 4.6, 14, 'awd', 'gas', ['opt_starlight', 'opt_rear_entertainment', 'opt_bespoke_paint', 'opt_exec_rear'], ['Starlight headliner option', 'Planar suspension']),
    trim('ewb', 'Extended', 405_000, 563, 4.8, 14, 'awd', 'gas', ['opt_starlight', 'opt_rear_entertainment', 'opt_bespoke_paint', 'opt_exec_rear'], ['Extended wheelbase', 'Rear champagne cooler']),
  ] }),
  model({ id: 'rivian_r1s', name: 'R1S', make: 'rivian', body: 'suv', segment: 'utility', years: [2022, 2030], seats: 7, dep: 0.22, maint: 0.8, ins: 1.2, tags: ['ev', 'family', 'outdoors'], trims: [
    trim('dual', 'Dual Motor', 77_000, 533, 4.5, 78, 'awd', 'ev', ['opt_offroad', 'opt_premium_audio', 'opt_tow'], ['Air suspension', 'Camp mode']),
    trim('tri', 'Tri Motor', 92_000, 850, 3.0, 71, 'awd', 'ev', ['opt_offroad', 'opt_premium_audio', 'opt_tow'], ['Air suspension', 'Tank turn']),
  ] }),
  model({ id: 'subaru_outback', name: 'Outback', make: 'subaru', body: 'wagon', segment: 'midsize', years: [2015, 2030], seats: 5, dep: 0.15, maint: 0.85, ins: 0.9, tags: ['practical', 'awd', 'outdoors'], trims: [
    trim('premium', 'Premium', 32_500, 182, 8.7, 29, 'awd', 'gas', COMFORT, ['Symmetrical AWD', 'Roof rails']),
    trim('xt', 'Onyx XT', 40_500, 260, 6.1, 25, 'awd', 'gas', COMFORT, ['Turbocharged', 'X-Mode']),
  ] }),
  model({ id: 'volvo_xc90', name: 'XC90', make: 'volvo', body: 'suv', segment: 'luxury', years: [2016, 2030], seats: 7, dep: 0.22, maint: 1.2, ins: 1.1, tags: ['family', 'safe', 'school run'], trims: [
    trim('b6', 'B6 Plus', 62_000, 295, 6.2, 24, 'awd', 'hybrid', COMFORT, ['Pilot Assist', 'Third row']),
    trim('t8', 'T8 Ultra', 74_500, 455, 4.6, 58, 'awd', 'phev', [...COMFORT, 'opt_bowers'], ['Air suspension', 'Bowers & Wilkins audio']),
  ] }),
  model({ id: 'jeep_wrangler', name: 'Wrangler', make: 'jeep', body: 'suv', segment: 'utility', years: [2015, 2030], seats: 5, dep: 0.12, maint: 1.15, ins: 1.0, tags: ['offroad', 'character', 'holds value'], trims: [
    trim('sport', 'Sport', 35_000, 285, 7.6, 21, '4wd', 'gas', ['opt_offroad', 'opt_premium_audio'], ['Removable roof', 'Skid plates']),
    trim('rubicon', 'Rubicon', 50_500, 285, 7.8, 20, '4wd', 'gas', ['opt_offroad', 'opt_premium_audio', 'opt_winch'], ['Locking differentials', 'Disconnecting sway bar']),
  ] }),
  model({ id: 'mazda_mx5', name: 'MX-5 Miata', make: 'mazda', body: 'roadster', segment: 'sports', years: [2016, 2030], seats: 2, dep: 0.11, maint: 0.8, ins: 0.95, tags: ['fun', 'affordable', 'weekend'], collectorAfter: 18, trims: [
    trim('club', 'Club', 33_500, 181, 5.7, 30, 'rwd', 'gas', [...COMFORT, ...PERF], ['Limited-slip differential', 'Bilstein dampers']),
    trim('grand', 'Grand Touring', 36_500, 181, 5.7, 30, 'rwd', 'gas', COMFORT, ['Leather', 'Adaptive headlights']),
  ] }),
]);

function option(id: string, name: string, category: string, priceDollars: number, effects: FactoryOption['effects'] = {}): FactoryOption {
  return { id, name, type: 'factory_option', category, price: priceDollars * 100, effects, ...SIM };
}

export const FACTORY_OPTIONS = new Registry<FactoryOption>('factory_options', [
  option('opt_premium_audio', 'Premium Audio System', 'infotainment', 1_400, { valueRetention: 0.3 }),
  option('opt_leather', 'Leather Upholstery', 'interior', 1_800, { valueRetention: 0.4 }),
  option('opt_sunroof', 'Panoramic Sunroof', 'exterior', 1_500, { valueRetention: 0.45 }),
  option('opt_driver_assist', 'Driver Assistance Package', 'electronics', 2_200, { valueRetention: 0.35 }),
  option('opt_cold_weather', 'Cold Weather Package', 'comfort', 850, { valueRetention: 0.25 }),
  option('opt_perf_brakes', 'Performance Brake Package', 'brakes', 3_800, { zeroToSixty: -0.05, valueRetention: 0.5 }),
  option('opt_sport_suspension', 'Sport Suspension', 'suspension', 2_400, { zeroToSixty: -0.1, valueRetention: 0.45 }),
  option('opt_sport_exhaust', 'Sport Exhaust', 'exhaust', 3_200, { horsepower: 8, valueRetention: 0.55 }),
  option('opt_carbon_pack', 'Carbon Fibre Package', 'exterior', 9_500, { zeroToSixty: -0.05, valueRetention: 0.7 }),
  option('opt_perf_tires', 'Performance Tires', 'tires', 1_200, { zeroToSixty: -0.1, valueRetention: 0.1 }),
  option('opt_autopilot', 'Advanced Autonomy Package', 'electronics', 8_000, { valueRetention: 0.3 }),
  option('opt_track_mode', 'Track Package', 'performance', 5_500, { zeroToSixty: -0.1, valueRetention: 0.55 }),
  option('opt_rear_entertainment', 'Rear Entertainment', 'infotainment', 3_400, { valueRetention: 0.2 }),
  option('opt_exec_rear', 'Executive Rear Seating', 'interior', 7_800, { valueRetention: 0.4 }),
  option('opt_starlight', 'Starlight Headliner', 'interior', 14_500, { valueRetention: 0.75 }),
  option('opt_bespoke_paint', 'Bespoke Paint', 'exterior', 22_000, { valueRetention: 0.6 }),
  option('opt_racing_seats', 'Carbon Racing Seats', 'interior', 6_800, { valueRetention: 0.6 }),
  option('opt_lift_axle', 'Front Axle Lift', 'suspension', 4_600, { valueRetention: 0.65 }),
  option('opt_offroad', 'Off-Road Package', 'suspension', 3_600, { valueRetention: 0.5 }),
  option('opt_tow', 'Tow Package', 'utility', 1_100, { valueRetention: 0.4 }),
  option('opt_tow_max', 'Max Trailer Tow', 'utility', 2_400, { valueRetention: 0.45 }),
  option('opt_winch', 'Front Winch', 'utility', 2_100, { valueRetention: 0.35 }),
  option('opt_bowers', 'Bowers & Wilkins Audio', 'infotainment', 3_200, { valueRetention: 0.35 }),
]);

function part(
  id: string, name: string, category: PartCategory, brand: string, priceDollars: number, labourHours: number,
  fitment: PartFitment, effects: Part['effects'], flags: { legal?: boolean; voids?: boolean; insurance?: boolean; requires?: PartCategory[]; conflicts?: PartCategory[] },
  description: string,
): Part {
  return {
    id, name, type: 'part', category, brand, price: priceDollars * 100, labourHours,
    fitment, requires: flags.requires ?? [], conflictsWith: flags.conflicts ?? [], effects,
    streetLegal: flags.legal ?? true, voidsWarranty: flags.voids ?? false,
    insuranceRelevant: flags.insurance ?? false, description,
    aliases: [`${brand} ${name}`],
    ...SIM,
  };
}

const UNIVERSAL: PartFitment = { makes: [], models: [] };

export const PARTS = new Registry<Part>('parts', [
  // Cosmetic — mostly universal, mostly legal, mostly value-neutral.
  part('paint_respray_std', 'Standard Respray', 'paint', 'Local Body Shop', 4_500, 24, UNIVERSAL, { valueDelta: -80_000, condition: 4 }, { insurance: true }, 'A colour change done properly. Non-original paint costs you at resale, every time.'),
  part('paint_respray_show', 'Show-Quality Respray', 'paint', 'Concours Refinishing', 18_000, 80, UNIVERSAL, { valueDelta: 120_000, condition: 10 }, { insurance: true }, 'Bare-metal preparation and a finish that holds up under a spotlight.'),
  part('wrap_satin', 'Satin Vinyl Wrap', 'wrap', 'Cover Culture', 4_200, 20, UNIVERSAL, { valueDelta: 0, condition: 2 }, {}, 'Reversible, protects the paint underneath, and comes off without a trace.'),
  part('wrap_chrome', 'Chrome Vinyl Wrap', 'wrap', 'Cover Culture', 7_800, 26, UNIVERSAL, { valueDelta: 0 }, { legal: false, insurance: true }, 'Illegal in several jurisdictions for the glare it throws at other drivers.'),
  part('ppf_full', 'Full-Body Paint Protection Film', 'ppf', 'ClearGuard', 7_500, 22, UNIVERSAL, { valueDelta: 250_000, condition: 6 }, {}, 'Invisible armour. Pays for itself on resale for anything above sixty thousand.'),

  // Wheels and tires — fitment matters.
  part('wheels_forged_19', '19-inch Forged Wheels', 'wheels', 'Apex Forged', 6_400, 3, { makes: [], models: [], bodyStyles: ['sedan', 'coupe', 'hatchback', 'wagon', 'roadster'] }, { zeroToSixty: -0.08, valueRecovery: 0.35 }, { insurance: true }, 'Lighter than cast wheels, which the car feels everywhere.'),
  part('wheels_forged_22', '22-inch Forged Wheels', 'wheels', 'Apex Forged', 9_800, 3, { makes: [], models: [], bodyStyles: ['suv', 'truck'] }, { zeroToSixty: 0.06, efficiency: -2, valueRecovery: 0.4 }, { insurance: true }, 'They look extraordinary and they cost you a little of everything else.'),
  part('tires_summer', 'Ultra-High-Performance Summer Tires', 'tires', 'Vanguard Rubber', 1_800, 1.5, UNIVERSAL, { zeroToSixty: -0.12, efficiency: -1 }, {}, 'Enormous grip above 45 degrees and genuinely dangerous below 40.'),
  part('tires_allseason', 'All-Season Touring Tires', 'tires', 'Vanguard Rubber', 1_100, 1.5, UNIVERSAL, { efficiency: 1 }, {}, 'Competent everywhere, exceptional nowhere. The correct choice for most people.'),

  // Brakes and suspension.
  part('brakes_bigbrake', 'Six-Piston Big Brake Kit', 'brakes', 'Halton Racing', 8_900, 6, { makes: ['bmw', 'porsche', 'mercedes', 'audi', 'chevrolet', 'ford'], models: [] }, { zeroToSixty: -0.05, valueRecovery: 0.3 }, { voids: true, insurance: true, requires: ['wheels'] }, 'Will not clear a stock wheel. You need the wheels first, and the dealer will notice.'),
  part('brakes_carbon', 'Carbon Ceramic Brake Package', 'brakes', 'Halton Racing', 24_000, 8, { makes: ['porsche', 'ferrari', 'lamborghini', 'mclaren', 'mercedes'], models: [] }, { zeroToSixty: -0.08, valueRecovery: 0.55 }, { insurance: true, requires: ['wheels'] }, 'Fade-free and astonishingly expensive to replace when they finally wear.'),
  part('susp_coilover', 'Adjustable Coilovers', 'suspension', 'Meridian Dynamics', 3_400, 6, { makes: [], models: [], bodyStyles: ['sedan', 'coupe', 'hatchback', 'wagon', 'roadster'] }, { zeroToSixty: -0.06, valueRecovery: 0.15, condition: -2 }, { voids: true, insurance: true }, 'Ride height and damping in your hands. Set it wrong and the car is worse everywhere.'),
  part('susp_airlift', 'Air Suspension Conversion', 'suspension', 'Meridian Dynamics', 6_200, 12, { makes: [], models: [], bodyStyles: ['sedan', 'coupe', 'suv', 'truck'] }, { valueRecovery: 0.1, condition: -3 }, { voids: true, insurance: true }, 'Adjustable on the move. More things to fail, and they do fail.'),
  part('susp_lowering', 'Lowering Springs', 'suspension', 'Meridian Dynamics', 950, 4, { makes: [], models: [], bodyStyles: ['sedan', 'coupe', 'hatchback', 'wagon'] }, { zeroToSixty: -0.03, valueRecovery: 0.05 }, { voids: true }, 'Cheapest way to change how a car looks and the fastest way to ruin the ride.'),

  // Engine and drivetrain — heavy fitment restrictions.
  part('exhaust_catback', 'Cat-Back Exhaust System', 'exhaust', 'Resonance Works', 2_600, 3, { makes: [], models: [], powertrains: ['gas', 'diesel', 'hybrid'] }, { horsepower: 12, valueRecovery: 0.25 }, { insurance: true }, 'Keeps the catalytic converters, so it stays legal. Sounds like the car finally woke up.'),
  part('exhaust_straight', 'Straight-Pipe Exhaust', 'exhaust', 'Resonance Works', 1_800, 3, { makes: [], models: [], powertrains: ['gas', 'diesel'] }, { horsepower: 18, valueRecovery: 0.0, condition: -2 }, { legal: false, voids: true, insurance: true }, 'Removes the catalytic converters. Fails inspection everywhere that has one.'),
  part('intake_cai', 'Cold Air Intake', 'intake', 'Resonance Works', 780, 1.5, { makes: [], models: [], powertrains: ['gas', 'hybrid'] }, { horsepower: 9, valueRecovery: 0.1 }, {}, 'A few honest horsepower and considerably more induction noise.'),
  part('tune_stage1', 'Stage 1 ECU Tune', 'tune', 'Threshold Calibration', 1_400, 2, { makes: [], models: [], powertrains: ['gas', 'diesel'] }, { horsepower: 45, zeroToSixty: -0.3, efficiency: -1, valueRecovery: 0 }, { voids: true, insurance: true }, 'Software only. Big gains on a turbocharged engine, modest ones otherwise, and the dealer can read it.'),
  part('tune_stage2', 'Stage 2 ECU Tune', 'tune', 'Threshold Calibration', 2_900, 3, { makes: [], models: [], powertrains: ['gas'] }, { horsepower: 95, zeroToSixty: -0.6, efficiency: -3, valueRecovery: 0, condition: -4 }, { voids: true, insurance: true, requires: ['exhaust', 'intake'] }, 'Requires the exhaust and intake to already be there, or the engine runs out of breath and into trouble.'),
  part('turbo_upgrade', 'Upgraded Turbocharger', 'turbo', 'Threshold Calibration', 7_400, 14, { makes: ['bmw', 'audi', 'volkswagen', 'ford', 'subaru', 'mercedes'], models: [], powertrains: ['gas'] }, { horsepower: 140, zeroToSixty: -0.8, efficiency: -4, valueRecovery: 0.1, condition: -6 }, { voids: true, insurance: true, requires: ['tune', 'cooling', 'exhaust'] }, 'A serious build. Without the supporting tune, cooling and exhaust it will destroy the engine.'),
  part('cooling_intercooler', 'Front-Mount Intercooler', 'cooling', 'Threshold Calibration', 2_200, 6, { makes: [], models: [], powertrains: ['gas', 'diesel'] }, { horsepower: 15, valueRecovery: 0.15 }, { voids: true }, 'Keeps intake temperatures down so the tune can actually deliver what it promises.'),
  part('engine_swap_v8', 'V8 Engine Swap', 'engine', 'Halton Racing', 34_000, 90, { makes: ['mazda', 'ford', 'chevrolet', 'bmw'], models: [], powertrains: ['gas'] }, { horsepower: 260, zeroToSixty: -1.6, efficiency: -8, valueRecovery: 0.2, condition: -12 }, { voids: true, insurance: true, legal: false, requires: ['cooling', 'brakes', 'suspension'] }, 'Months of work, a new registration classification in most places, and a completely different car at the end.'),

  // Interior.
  part('seats_bucket', 'Fixed-Back Bucket Seats', 'seats', 'Apex Forged', 4_800, 4, { makes: [], models: [], bodyStyles: ['coupe', 'sedan', 'hatchback', 'roadster'] }, { zeroToSixty: -0.04, valueRecovery: 0.2 }, { insurance: true }, 'Twenty kilos lighter and completely unsuitable for a long drive.'),
  part('wheel_alcantara', 'Alcantara Steering Wheel', 'steering_wheel', 'Atelier Trim', 1_600, 1.5, UNIVERSAL, { valueRecovery: 0.25 }, {}, 'Better grip, and it wears visibly within two years.'),
  part('uphol_full_leather', 'Full Custom Leather Retrim', 'upholstery', 'Atelier Trim', 9_800, 40, UNIVERSAL, { valueDelta: 200_000, condition: 8 }, {}, 'Done well, it lifts an old interior completely. Done cheaply, it halves the car.'),
  part('trim_carbon_interior', 'Carbon Fibre Interior Trim', 'trim', 'Atelier Trim', 3_400, 8, UNIVERSAL, { valueRecovery: 0.3 }, {}, 'Real weave, laid properly, in place of the plastic.'),

  // Electronics.
  part('info_headunit', 'Modern Head Unit Retrofit', 'infotainment', 'Northline Audio', 1_900, 4, { makes: [], models: [], years: [2015, 2021] }, { valueDelta: 90_000 }, {}, 'Only worth doing on an older car whose original screen has aged badly.'),
  part('audio_reference', 'Reference Audio System', 'audio', 'Northline Audio', 8_400, 14, UNIVERSAL, { valueRecovery: 0.2 }, {}, 'Amplifiers, a subwoofer, sound deadening and a tune. Transforms a long drive.'),
  part('light_led_conv', 'LED Headlight Conversion', 'lighting', 'ClearGuard', 1_200, 3, { makes: [], models: [], years: [2015, 2020] }, { valueRecovery: 0.15 }, { insurance: true }, 'Modern output on an older car. Must be a proper projector housing or it blinds oncoming traffic.'),
  part('light_underglow', 'Underbody Lighting', 'lighting', 'Cover Culture', 900, 4, UNIVERSAL, { valueDelta: -40_000 }, { legal: false, insurance: true }, 'Restricted or prohibited on public roads almost everywhere.'),
  part('security_immobiliser', 'Aftermarket Immobiliser', 'security', 'ClearGuard', 1_400, 3, UNIVERSAL, { valueRecovery: 0.2 }, { insurance: true }, 'Insurers reduce the premium for one of these on a desirable car.'),
  part('tracking_gps', 'GPS Tracking and Recovery', 'tracking', 'ClearGuard', 850, 2, UNIVERSAL, { valueRecovery: 0.1 }, { insurance: true }, 'A monthly subscription and a meaningfully better chance of seeing the car again.'),
  part('aero_splitter', 'Front Splitter and Rear Wing', 'aero', 'Apex Forged', 5_600, 8, { makes: [], models: [], bodyStyles: ['coupe', 'sedan', 'roadster'] }, { zeroToSixty: 0.04, valueRecovery: 0.15 }, { insurance: true }, 'Real downforce above 80 miles an hour. Below that it is only weight and drag.'),
]);

// ---------------------------------------------------------------------------
// Fitment validation
// ---------------------------------------------------------------------------

export interface FitmentSubject {
  modelId: string;
  make: string;
  year: number;
  trimId: string;
  powertrain: Powertrain;
  bodyStyle: BodyStyle;
  /** Categories already installed on this vehicle. */
  installedCategories: PartCategory[];
}

export interface FitmentVerdict {
  fits: boolean;
  reasons: string[];
  warnings: string[];
}

/**
 * Decides whether a part may be installed. This is the guard that stops a
 * player bolting a Ferrari brake kit onto a Corolla because both exist in the
 * catalogue.
 */
export function checkFitment(part: Part, subject: FitmentSubject): FitmentVerdict {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const f = part.fitment;

  const model = VEHICLE_MODELS.get(subject.modelId);
  const makeId = model?.parentId ?? subject.make;

  if (f.makes.length > 0 && !f.makes.includes(makeId)) {
    const names = f.makes.map((m) => MANUFACTURERS.get(m)?.name ?? m).join(', ');
    reasons.push(`${part.name} is made for ${names}. It does not fit a ${subject.make}.`);
  }
  if (f.models.length > 0 && !f.models.includes(subject.modelId)) {
    reasons.push(`${part.name} is model-specific and does not fit this model.`);
  }
  if (f.years && (subject.year < f.years[0] || subject.year > f.years[1])) {
    reasons.push(`${part.name} fits ${f.years[0]} to ${f.years[1]} model years. This car is a ${subject.year}.`);
  }
  if (f.powertrains && !f.powertrains.includes(subject.powertrain)) {
    reasons.push(`${part.name} is not compatible with a ${subject.powertrain === 'ev' ? 'fully electric' : subject.powertrain} powertrain.`);
  }
  if (f.trims && !f.trims.includes(subject.trimId)) {
    reasons.push(`${part.name} only fits specific trims, and this is not one of them.`);
  }
  if (f.bodyStyles && !f.bodyStyles.includes(subject.bodyStyle)) {
    reasons.push(`${part.name} does not fit a ${subject.bodyStyle} body.`);
  }

  for (const required of part.requires) {
    if (!subject.installedCategories.includes(required)) {
      reasons.push(`${part.name} requires ${categoryLabel(required)} to be upgraded first. Fitting it alone would do damage.`);
    }
  }
  for (const conflict of part.conflictsWith) {
    if (subject.installedCategories.includes(conflict)) {
      reasons.push(`${part.name} conflicts with the ${categoryLabel(conflict)} already fitted.`);
    }
  }

  if (part.voidsWarranty) warnings.push('This voids the manufacturer warranty.');
  if (!part.streetLegal) warnings.push('This is not street legal and will fail inspection.');
  if (part.insuranceRelevant) warnings.push('Your insurer must be told about this, or a future claim can be denied.');

  return { fits: reasons.length === 0, reasons, warnings };
}

function categoryLabel(category: PartCategory): string {
  return category.replace(/_/g, ' ');
}

/** Parts that could fit a given vehicle, for the modification catalogue UI. */
export function partsFor(subject: FitmentSubject, category?: PartCategory): Part[] {
  return PARTS.all()
    .filter((p) => (!category || p.category === category))
    .filter((p) => {
      const f = p.fitment;
      const makeId = VEHICLE_MODELS.get(subject.modelId)?.parentId ?? subject.make;
      if (f.makes.length > 0 && !f.makes.includes(makeId)) return false;
      if (f.models.length > 0 && !f.models.includes(subject.modelId)) return false;
      if (f.years && (subject.year < f.years[0] || subject.year > f.years[1])) return false;
      if (f.powertrains && !f.powertrains.includes(subject.powertrain)) return false;
      if (f.bodyStyles && !f.bodyStyles.includes(subject.bodyStyle)) return false;
      return true;
    })
    .sort((a, b) => a.category.localeCompare(b.category) || a.price - b.price);
}

export function trimOf(modelId: string, trimId: string): VehicleTrim | undefined {
  return VEHICLE_MODELS.get(modelId)?.trims.find((t) => t.id === trimId);
}
