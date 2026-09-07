/**
 * SLATE — Vehicle catalog and parts fitment.
 *
 * Manufacturer names are real and widely known. Every specification, price and
 * option here is a SLATE calibration, not a manufacturer figure, and the
 * registry says so on every record.
 *
 * The important part is fitment: a part exists in the catalog does NOT mean
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

/**
 * What kind of thing it is. A car and a motorcycle live on the road and count
 * miles; a boat and a jet count hours, cost money standing still, and are
 * bought, insured and worked on by people who do only that.
 */
export type VehicleKind = 'car' | 'motorcycle' | 'boat' | 'jet';

export type BodyStyle =
  | 'sedan' | 'coupe' | 'convertible' | 'hatchback' | 'wagon' | 'suv' | 'truck' | 'van' | 'roadster'
  | 'naked' | 'sportbike' | 'cruiser' | 'adventure' | 'tourer' | 'classic'
  | 'center_console' | 'bowrider' | 'wake' | 'runabout' | 'express_cruiser' | 'sailing_yacht' | 'motor_yacht'
  | 'very_light_jet' | 'light_jet' | 'midsize_jet' | 'super_midsize_jet' | 'large_jet' | 'long_range_jet';
export type Powertrain = 'gas' | 'diesel' | 'hybrid' | 'phev' | 'ev' | 'turbofan';
export type Drivetrain = 'fwd' | 'rwd' | 'awd' | '4wd' | 'chain' | 'belt' | 'shaft' | 'outboard' | 'sterndrive' | 'inboard' | 'pod' | 'sail' | 'twin_turbofan';

/**
 * The numbers a boat or an aircraft is described by, and a motorcycle's top
 * end. Absent on a car. Every figure is SLATE's calibration.
 */
export interface CraftSpec {
  /** Boats: length overall, in feet. */
  lengthFeet?: number;
  /** Boats: berths below. */
  berths?: number;
  /** Jets: passenger seats. Boats: people it is rated for. */
  seats?: number;
  /** Motorcycles: mph. Boats: knots. Jets: cruise, km/h. */
  topSpeed?: number;
  /** Jets: still-air range, km. */
  rangeKm?: number;
  /** Jets: runway it needs, feet. */
  runwayFeet?: number;
  /** Boats and jets: an hour under way, in fuel, crew and wear. Cents. */
  hourlyOperating?: Money;
  /** A crewed boat or any aircraft: the crew on retainer and the standing maintenance a month, before cost of living. Where it is kept is charged separately. Cents. */
  crewMonthly?: Money;
}

export interface VehicleTrim {
  id: string;
  name: string;
  /** Base MSRP in cents. Calibrated. */
  msrp: Money;
  horsepower: number;
  zeroToSixty: number;
  /** Miles per gallon equivalent on the road; gallons an hour on the water or in the air. */
  efficiency: number;
  drivetrain: Drivetrain;
  powertrain: Powertrain;
  /** Factory option codes available on this trim. */
  availableOptions: string[];
  standardFeatures: string[];
  /** What a boat, a jet or a motorcycle is described by beyond the road figures. */
  craft?: CraftSpec;
}

export interface VehicleModel extends ReferenceRecord {
  type: 'vehicle_model';
  parentId: string;
  make: string;
  kind: VehicleKind;
  bodyStyle: BodyStyle;
  segment: 'compact' | 'midsize' | 'fullsize' | 'sports' | 'super' | 'luxury' | 'utility' | 'commercial';
  /** Model years the catalog covers. */
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
  | 'audio' | 'electronics' | 'lighting' | 'security' | 'tracking' | 'aero'
  | 'windscreen' | 'luggage' | 'protection' | 'controls'
  | 'hull' | 'propeller' | 'deck' | 'tower' | 'canvas' | 'navigation' | 'power'
  | 'avionics' | 'cabin' | 'connectivity' | 'winglets';

export interface PartFitment {
  /** What kinds of thing it goes on. Absent means a car, and only a car. */
  kinds?: VehicleKind[];
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
  /** Shop labor hours to install. */
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
    /** Jets: still-air range added, km. */
    rangeKm?: number;
    /** Motorcycles and boats: top speed added, in the kind's unit. */
    topSpeed?: number;
  };
  streetLegal: boolean;
  voidsWarranty: boolean;
  /** Requires disclosure to the insurer; failing to disclose risks a denied claim. */
  insuranceRelevant: boolean;
  description: string;
}

/**
 * How each kind is owned: what it counts, how often it is serviced, how fast
 * it wears, what a year of use looks like, which lot sells it and which
 * insurance line covers it. Every figure is SLATE's calibration.
 */
export interface KindProfile {
  kind: VehicleKind;
  label: string;
  plural: string;
  /** What the odometer counts. */
  unit: 'miles' | 'hours';
  unitLabel: string;
  /** Scheduled service interval, in the unit. */
  serviceInterval: number;
  /** What a year of ordinary use adds, in the unit. */
  expectedPerYear: number;
  /** Units of use that take one point of mechanical health. */
  wearDivisor: number;
  /** Units of use that take one point of condition. */
  conditionDivisor: number;
  /** Units of use over which value falls from full to floor. */
  useSpan: number;
  /** Service cost relative to a car. */
  serviceCostIndex: number;
  /** Which of a city's lots sells it. */
  lotIndex: number;
  insuranceLine: 'auto' | 'marine' | 'aviation';
  /** What the paperwork calls it. */
  document: string;
}

export const KIND_PROFILE: Readonly<Record<VehicleKind, KindProfile>> = {
  car: { kind: 'car', label: 'Car', plural: 'Cars', unit: 'miles', unitLabel: 'Miles', serviceInterval: 7_500, expectedPerYear: 11_500, wearDivisor: 3_200, conditionDivisor: 9_000, useSpan: 260_000, serviceCostIndex: 1, lotIndex: 0, insuranceLine: 'auto', document: 'Registration' },
  motorcycle: { kind: 'motorcycle', label: 'Motorcycle', plural: 'Motorcycles', unit: 'miles', unitLabel: 'Miles', serviceInterval: 4_000, expectedPerYear: 3_000, wearDivisor: 2_000, conditionDivisor: 6_000, useSpan: 90_000, serviceCostIndex: 0.45, lotIndex: 3, insuranceLine: 'auto', document: 'Registration' },
  boat: { kind: 'boat', label: 'Boat', plural: 'Boats', unit: 'hours', unitLabel: 'Engine Hours', serviceInterval: 100, expectedPerYear: 100, wearDivisor: 40, conditionDivisor: 90, useSpan: 3_000, serviceCostIndex: 2.2, lotIndex: 4, insuranceLine: 'marine', document: 'Documentation' },
  jet: { kind: 'jet', label: 'Jet', plural: 'Jets', unit: 'hours', unitLabel: 'Airframe Hours', serviceInterval: 200, expectedPerYear: 350, wearDivisor: 60, conditionDivisor: 150, useSpan: 12_000, serviceCostIndex: 28, lotIndex: 5, insuranceLine: 'aviation', document: 'Registration' },
};

export const KINDS: readonly VehicleKind[] = ['car', 'motorcycle', 'boat', 'jet'];

/** What the screen says beside a real make. */
export const REAL_MAKE_NOTE = 'Makes and models are real and on the public record. Every specification, price and option is SLATE\'s own calibration, not a manufacturer figure.';

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
  // Motorcycles. BMW and Honda build them under the names above.
  { id: 'harley', name: 'Harley-Davidson', aliases: ['Harley'], type: 'manufacturer', country: 'us', prestige: 72, reliability: 74, segment: 'premium', ...MFG },
  { id: 'ducati', name: 'Ducati', type: 'manufacturer', country: 'it', prestige: 86, reliability: 68, segment: 'luxury', ...MFG },
  { id: 'kawasaki', name: 'Kawasaki', type: 'manufacturer', country: 'jp', prestige: 48, reliability: 86, segment: 'mainstream', ...MFG },
  { id: 'yamaha', name: 'Yamaha', type: 'manufacturer', country: 'jp', prestige: 50, reliability: 88, segment: 'mainstream', ...MFG },
  { id: 'triumph', name: 'Triumph', type: 'manufacturer', country: 'uk', prestige: 66, reliability: 78, segment: 'premium', ...MFG },
  { id: 'ktm', name: 'KTM', type: 'manufacturer', country: 'at', prestige: 60, reliability: 70, segment: 'premium', ...MFG },
  { id: 'indian', name: 'Indian Motorcycle', aliases: ['Indian'], type: 'manufacturer', country: 'us', prestige: 66, reliability: 76, segment: 'premium', ...MFG },
  { id: 'royalenfield', name: 'Royal Enfield', type: 'manufacturer', country: 'in', prestige: 40, reliability: 72, segment: 'economy', ...MFG },
  { id: 'aprilia', name: 'Aprilia', type: 'manufacturer', country: 'it', prestige: 74, reliability: 66, segment: 'premium', ...MFG },
  { id: 'suzuki', name: 'Suzuki', type: 'manufacturer', country: 'jp', prestige: 44, reliability: 86, segment: 'mainstream', ...MFG },
  // Boats.
  { id: 'bostonwhaler', name: 'Boston Whaler', type: 'manufacturer', country: 'us', prestige: 70, reliability: 88, segment: 'premium', ...MFG },
  { id: 'searay', name: 'Sea Ray', type: 'manufacturer', country: 'us', prestige: 62, reliability: 80, segment: 'mainstream', ...MFG },
  { id: 'mastercraft', name: 'MasterCraft', type: 'manufacturer', country: 'us', prestige: 68, reliability: 80, segment: 'premium', ...MFG },
  { id: 'malibu', name: 'Malibu Boats', aliases: ['Malibu'], type: 'manufacturer', country: 'us', prestige: 66, reliability: 80, segment: 'premium', ...MFG },
  { id: 'chriscraft', name: 'Chris-Craft', type: 'manufacturer', country: 'us', prestige: 82, reliability: 78, segment: 'luxury', ...MFG },
  { id: 'cobalt', name: 'Cobalt Boats', aliases: ['Cobalt'], type: 'manufacturer', country: 'us', prestige: 64, reliability: 84, segment: 'premium', ...MFG },
  { id: 'gradywhite', name: 'Grady-White', type: 'manufacturer', country: 'us', prestige: 72, reliability: 88, segment: 'premium', ...MFG },
  { id: 'axopar', name: 'Axopar', type: 'manufacturer', country: 'fi', prestige: 74, reliability: 80, segment: 'premium', ...MFG },
  { id: 'beneteau', name: 'Beneteau', type: 'manufacturer', country: 'fr', prestige: 62, reliability: 78, segment: 'mainstream', ...MFG },
  { id: 'jeanneau', name: 'Jeanneau', type: 'manufacturer', country: 'fr', prestige: 60, reliability: 78, segment: 'mainstream', ...MFG },
  { id: 'azimut', name: 'Azimut', type: 'manufacturer', country: 'it', prestige: 88, reliability: 70, segment: 'luxury', ...MFG },
  { id: 'princess', name: 'Princess Yachts', aliases: ['Princess'], type: 'manufacturer', country: 'uk', prestige: 88, reliability: 74, segment: 'luxury', ...MFG },
  { id: 'sunseeker', name: 'Sunseeker', type: 'manufacturer', country: 'uk', prestige: 92, reliability: 72, segment: 'exotic', ...MFG },
  { id: 'riva', name: 'Riva', type: 'manufacturer', country: 'it', prestige: 98, reliability: 74, segment: 'exotic', ...MFG },
  // Aircraft.
  { id: 'cirrus', name: 'Cirrus Aircraft', aliases: ['Cirrus'], type: 'manufacturer', country: 'us', prestige: 70, reliability: 84, segment: 'premium', ...MFG },
  { id: 'hondajet', name: 'Honda Aircraft Company', aliases: ['HondaJet', 'Honda Aircraft'], type: 'manufacturer', country: 'us', prestige: 78, reliability: 86, segment: 'premium', ...MFG },
  { id: 'embraer', name: 'Embraer', type: 'manufacturer', country: 'br', prestige: 80, reliability: 88, segment: 'luxury', ...MFG },
  { id: 'cessna', name: 'Cessna', aliases: ['Textron Aviation'], type: 'manufacturer', country: 'us', prestige: 78, reliability: 88, segment: 'luxury', ...MFG },
  { id: 'pilatus', name: 'Pilatus', type: 'manufacturer', country: 'ch', prestige: 82, reliability: 90, segment: 'luxury', ...MFG },
  { id: 'bombardier', name: 'Bombardier', type: 'manufacturer', country: 'ca', prestige: 92, reliability: 84, segment: 'exotic', ...MFG },
  { id: 'gulfstream', name: 'Gulfstream', type: 'manufacturer', country: 'us', prestige: 97, reliability: 86, segment: 'exotic', ...MFG },
  { id: 'dassault', name: 'Dassault Aviation', aliases: ['Dassault', 'Falcon'], type: 'manufacturer', country: 'fr', prestige: 94, reliability: 86, segment: 'exotic', ...MFG },
  { id: 'volvo', name: 'Volvo', type: 'manufacturer', country: 'de', prestige: 68, reliability: 78, segment: 'premium', ...MFG },
]);

function trim(id: string, name: string, msrpDollars: number, hp: number, zeroSixty: number, efficiency: number, drivetrain: VehicleTrim['drivetrain'], powertrain: Powertrain, options: string[], features: string[]): VehicleTrim {
  return { id, name, msrp: msrpDollars * 100, horsepower: hp, zeroToSixty: zeroSixty, efficiency, drivetrain, powertrain, availableOptions: options, standardFeatures: features };
}

interface ModelSpec {
  id: string; name: string; make: string; body: BodyStyle; segment: VehicleModel['segment'];
  years: [number, number]; seats: number; trims: VehicleTrim[]; dep: number;
  maint: number; ins: number; tags: string[]; collectorAfter?: number; kind?: VehicleKind;
}

function model(spec: ModelSpec): VehicleModel {
  return {
    id: spec.id, name: spec.name, type: 'vehicle_model', parentId: spec.make,
    make: MANUFACTURERS.require(spec.make).name,
    kind: spec.kind ?? 'car',
    bodyStyle: spec.body, segment: spec.segment, years: spec.years, seats: spec.seats,
    trims: spec.trims, depreciationRate: spec.dep, collectorAfterYears: spec.collectorAfter,
    maintenanceCostIndex: spec.maint, insuranceIndex: spec.ins, tags: spec.tags,
    aliases: [`${MANUFACTURERS.require(spec.make).name} ${spec.name}`],
    ...SIM,
  };
}

/** A motorcycle trim: road figures, a chain or belt or shaft, and a top end. */
function bike(id: string, name: string, msrpDollars: number, hp: number, zeroSixty: number, mpg: number, topMph: number, options: string[], features: string[]): VehicleTrim {
  return { id, name, msrp: msrpDollars * 100, horsepower: hp, zeroToSixty: zeroSixty, efficiency: mpg, drivetrain: 'chain', powertrain: 'gas', availableOptions: options, standardFeatures: features, craft: { topSpeed: topMph } };
}

/** A boat trim: power, gallons an hour, how it is driven, and what it is described by. */
function boat(id: string, name: string, msrpDollars: number, hp: number, gph: number, drivetrain: Drivetrain, options: string[], features: string[], craft: CraftSpec): VehicleTrim {
  return { id, name, msrp: msrpDollars * 100, horsepower: hp, zeroToSixty: 0, efficiency: gph, drivetrain, powertrain: drivetrain === 'sail' ? 'diesel' : drivetrain === 'shaft' ? 'diesel' : 'gas', availableOptions: options, standardFeatures: features, craft };
}

/** A jet trim: thrust stands in for horsepower, gallons an hour, and the numbers a route is checked against. */
function jet(id: string, name: string, msrpDollars: number, thrustLbf: number, gph: number, options: string[], features: string[], craft: CraftSpec): VehicleTrim {
  return { id, name, msrp: msrpDollars * 100, horsepower: thrustLbf, zeroToSixty: 0, efficiency: gph, drivetrain: 'twin_turbofan', powertrain: 'turbofan', availableOptions: options, standardFeatures: features, craft };
}

const MOTO_COMMON = ['opt_moto_heated_grips', 'opt_moto_alarm', 'opt_moto_tpms'];
const MOTO_SPORT = [...MOTO_COMMON, 'opt_moto_quickshifter', 'opt_moto_ti_exhaust', 'opt_moto_forged_wheels', 'opt_moto_semi_active'];
const MOTO_NAKED = [...MOTO_COMMON, 'opt_moto_quickshifter', 'opt_moto_ti_exhaust', 'opt_moto_cruise'];
const MOTO_ADV = [...MOTO_COMMON, 'opt_moto_touring_pack', 'opt_moto_cruise', 'opt_moto_semi_active', 'opt_moto_ti_exhaust'];
const MOTO_TOURING = [...MOTO_COMMON, 'opt_moto_touring_pack', 'opt_moto_cruise', 'opt_moto_audio'];
const MOTO_CRUISER = [...MOTO_COMMON, 'opt_moto_cruise', 'opt_moto_audio', 'opt_moto_ti_exhaust'];
const MOTO_CLASSIC = [...MOTO_COMMON, 'opt_moto_cruise'];

const BOAT_DAY = ['opt_boat_chartplotter', 'opt_boat_underwater_lights', 'opt_boat_bimini', 'opt_boat_audio'];
const BOAT_OFFSHORE = ['opt_boat_chartplotter', 'opt_boat_hardtop', 'opt_boat_joystick', 'opt_boat_underwater_lights', 'opt_boat_audio'];
const BOAT_WAKE = ['opt_boat_tower', 'opt_boat_ballast', 'opt_boat_audio', 'opt_boat_underwater_lights'];
const BOAT_CRUISER = ['opt_boat_chartplotter', 'opt_boat_joystick', 'opt_boat_bow_thruster', 'opt_boat_ac', 'opt_boat_generator', 'opt_boat_underwater_lights'];
const BOAT_SAIL = ['opt_boat_chartplotter', 'opt_boat_bow_thruster', 'opt_boat_generator', 'opt_boat_watermaker', 'opt_boat_teak'];
const BOAT_YACHT = ['opt_boat_gyro', 'opt_boat_teak', 'opt_boat_tender', 'opt_boat_watermaker', 'opt_boat_ac', 'opt_boat_joystick', 'opt_boat_underwater_lights'];

const JET_LIGHT = ['opt_jet_wifi', 'opt_jet_paint_scheme', 'opt_jet_ife'];
const JET_MID = ['opt_jet_wifi', 'opt_jet_paint_scheme', 'opt_jet_ife', 'opt_jet_galley', 'opt_jet_evs'];
const JET_LARGE = ['opt_jet_wifi', 'opt_jet_paint_scheme', 'opt_jet_ife', 'opt_jet_galley', 'opt_jet_evs', 'opt_jet_cabin_bespoke'];
const JET_LONG = [...JET_LARGE, 'opt_jet_crew_rest', 'opt_jet_aux_tanks'];

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
    trim('plaid', 'Plaid', 94_000, 1020, 1.99, 102, 'awd', 'ev', ['opt_premium_audio', 'opt_autopilot', 'opt_carbon_pack', 'opt_track_mode'], ['Carbon fiber spoiler', 'Track mode']),
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
    trim('gtb', 'GTB', 338_000, 819, 2.9, 18, 'rwd', 'phev', ['opt_carbon_pack', 'opt_racing_seats', 'opt_lift_axle'], ['Carbon fiber package option', 'Adaptive dampers']),
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

  // --- Motorcycles. Real makes and models; every figure SLATE's own. ---------
  model({ kind: 'motorcycle', id: 'harley_streetglide', name: 'Street Glide', make: 'harley', body: 'tourer', segment: 'luxury', years: [2015, 2030], seats: 2, dep: 0.12, maint: 0.9, ins: 1.1, tags: ['touring', 'bagger', 'holds value'], collectorAfter: 20, trims: [
    bike('base', 'Street Glide', 26_000, 95, 4.4, 43, 112, MOTO_TOURING, ['Infotainment', 'Batwing fairing', 'Hard saddlebags']),
    bike('st', 'Street Glide ST', 30_500, 105, 4.1, 41, 118, MOTO_TOURING, ['Milwaukee-Eight 117', 'Inverted forks']),
  ] }),
  model({ kind: 'motorcycle', id: 'harley_fatboy', name: 'Fat Boy', make: 'harley', body: 'cruiser', segment: 'luxury', years: [2015, 2030], seats: 2, dep: 0.11, maint: 0.85, ins: 1.0, tags: ['cruiser', 'icon', 'chrome'], collectorAfter: 20, trims: [
    bike('114', 'Fat Boy 114', 21_500, 94, 4.2, 47, 110, MOTO_CRUISER, ['Solid disc wheels', 'Cruise control']),
  ] }),
  model({ kind: 'motorcycle', id: 'harley_sportsters', name: 'Sportster S', make: 'harley', body: 'cruiser', segment: 'sports', years: [2021, 2030], seats: 2, dep: 0.14, maint: 0.8, ins: 1.0, tags: ['cruiser', 'performance', 'city'], trims: [
    bike('base', 'Sportster S', 16_000, 121, 3.6, 49, 120, MOTO_CRUISER, ['Revolution Max engine', 'Ride modes']),
  ] }),
  model({ kind: 'motorcycle', id: 'ducati_panigalev4', name: 'Panigale V4', make: 'ducati', body: 'sportbike', segment: 'super', years: [2018, 2030], seats: 1, dep: 0.13, maint: 1.6, ins: 2.2, tags: ['superbike', 'track', 'loud'], collectorAfter: 12, trims: [
    bike('v4', 'Panigale V4', 25_500, 209, 2.9, 38, 186, MOTO_SPORT, ['Cornering ABS', 'Quickshifter', 'Ride modes']),
    bike('v4s', 'Panigale V4 S', 32_500, 209, 2.8, 38, 186, MOTO_SPORT, ['Öhlins electronic suspension', 'Forged wheels', 'Lithium battery']),
  ] }),
  model({ kind: 'motorcycle', id: 'ducati_monster', name: 'Monster', make: 'ducati', body: 'naked', segment: 'sports', years: [2015, 2030], seats: 2, dep: 0.14, maint: 1.2, ins: 1.3, tags: ['naked', 'city', 'first big bike'], trims: [
    bike('base', 'Monster', 12_500, 111, 3.5, 44, 140, MOTO_NAKED, ['Cornering ABS', 'Ride modes']),
    bike('sp', 'Monster SP', 16_000, 111, 3.4, 44, 142, MOTO_NAKED, ['Öhlins suspension', 'Brembo Stylema brakes', 'Termignoni exhaust']),
  ] }),
  model({ kind: 'motorcycle', id: 'ducati_multistradav4', name: 'Multistrada V4', make: 'ducati', body: 'adventure', segment: 'luxury', years: [2021, 2030], seats: 2, dep: 0.14, maint: 1.4, ins: 1.4, tags: ['adventure', 'touring', 'fast'], trims: [
    bike('s', 'Multistrada V4 S', 27_000, 170, 3.3, 41, 155, MOTO_ADV, ['Radar cruise', 'Semi-active suspension', 'Ride modes']),
    bike('pikespeak', 'Multistrada V4 Pikes Peak', 31_500, 170, 3.2, 41, 158, MOTO_ADV, ['Öhlins Smart EC', 'Akrapovič silencer', 'Carbon front mudguard']),
  ] }),
  model({ kind: 'motorcycle', id: 'bmw_r1300gs', name: 'R 1300 GS', make: 'bmw', body: 'adventure', segment: 'luxury', years: [2024, 2030], seats: 2, dep: 0.12, maint: 1.2, ins: 1.2, tags: ['adventure', 'touring', 'round the world'], trims: [
    bike('base', 'R 1300 GS', 19_000, 145, 3.4, 50, 130, MOTO_ADV, ['Boxer engine', 'Shaft drive', 'Ride modes']),
    bike('adventure', 'R 1300 GS Adventure', 22_500, 145, 3.5, 48, 128, MOTO_ADV, ['30 liter tank', 'Adaptive ride height', 'Engine bars']),
  ] }),
  model({ kind: 'motorcycle', id: 'bmw_s1000rr', name: 'S 1000 RR', make: 'bmw', body: 'sportbike', segment: 'super', years: [2015, 2030], seats: 1, dep: 0.14, maint: 1.4, ins: 2.0, tags: ['superbike', 'track', 'electronics'], trims: [
    bike('base', 'S 1000 RR', 18_000, 205, 2.9, 40, 188, MOTO_SPORT, ['Shift assistant', 'Cornering ABS', 'Ride modes']),
    bike('m', 'M 1000 RR', 33_000, 212, 2.8, 40, 190, MOTO_SPORT, ['Carbon wheels', 'Winglets', 'M brakes']),
  ] }),
  model({ kind: 'motorcycle', id: 'honda_goldwing', name: 'Gold Wing', make: 'honda', body: 'tourer', segment: 'luxury', years: [2018, 2030], seats: 2, dep: 0.12, maint: 1.0, ins: 1.0, tags: ['touring', 'comfort', 'two up'], trims: [
    bike('base', 'Gold Wing', 25_500, 125, 4.0, 42, 118, MOTO_TOURING, ['Flat six', 'Apple CarPlay', 'Electric windscreen']),
    bike('tour', 'Gold Wing Tour', 29_000, 125, 4.1, 41, 116, MOTO_TOURING, ['Top box', 'Airbag', 'Heated seats']),
  ] }),
  model({ kind: 'motorcycle', id: 'honda_africatwin', name: 'Africa Twin', make: 'honda', body: 'adventure', segment: 'midsize', years: [2016, 2030], seats: 2, dep: 0.13, maint: 0.8, ins: 1.0, tags: ['adventure', 'off road', 'reliable'], trims: [
    bike('base', 'Africa Twin', 15_000, 101, 3.9, 48, 125, MOTO_ADV, ['Ride modes', 'Wire wheels', 'Cornering ABS']),
    bike('adventure', 'Africa Twin Adventure Sports', 18_000, 101, 4.0, 47, 124, MOTO_ADV, ['Electronic suspension', 'Big tank', 'Tubeless wheels']),
  ] }),
  model({ kind: 'motorcycle', id: 'kawasaki_zx10r', name: 'Ninja ZX-10R', make: 'kawasaki', body: 'sportbike', segment: 'super', years: [2016, 2030], seats: 1, dep: 0.15, maint: 0.9, ins: 1.9, tags: ['superbike', 'track', 'green'], trims: [
    bike('base', 'Ninja ZX-10R', 18_000, 200, 2.9, 38, 186, MOTO_SPORT, ['Launch control', 'Quickshifter', 'Cornering management']),
  ] }),
  model({ kind: 'motorcycle', id: 'kawasaki_z900', name: 'Z900', make: 'kawasaki', body: 'naked', segment: 'midsize', years: [2017, 2030], seats: 2, dep: 0.15, maint: 0.75, ins: 1.1, tags: ['naked', 'value', 'city'], trims: [
    bike('base', 'Z900', 9_500, 123, 3.3, 44, 150, MOTO_NAKED, ['Ride modes', 'Traction control']),
  ] }),
  model({ kind: 'motorcycle', id: 'yamaha_mt09', name: 'MT-09', make: 'yamaha', body: 'naked', segment: 'midsize', years: [2015, 2030], seats: 2, dep: 0.15, maint: 0.75, ins: 1.1, tags: ['naked', 'triple', 'hooligan'], trims: [
    bike('base', 'MT-09', 10_500, 117, 3.2, 46, 145, MOTO_NAKED, ['Crossplane triple', 'Quickshifter', 'Ride modes']),
    bike('sp', 'MT-09 SP', 12_500, 117, 3.2, 46, 146, MOTO_NAKED, ['Öhlins shock', 'Cruise control', 'Brembo master cylinder']),
  ] }),
  model({ kind: 'motorcycle', id: 'yamaha_r1', name: 'YZF-R1', make: 'yamaha', body: 'sportbike', segment: 'super', years: [2015, 2030], seats: 1, dep: 0.14, maint: 0.95, ins: 2.0, tags: ['superbike', 'track', 'crossplane'], trims: [
    bike('base', 'YZF-R1', 18_000, 200, 2.9, 37, 185, MOTO_SPORT, ['Crossplane four', 'Slide control', 'Launch control']),
    bike('m', 'YZF-R1M', 27_000, 200, 2.8, 37, 186, MOTO_SPORT, ['Öhlins electronic racing suspension', 'Carbon bodywork', 'Data logger']),
  ] }),
  model({ kind: 'motorcycle', id: 'triumph_streettriple', name: 'Street Triple', make: 'triumph', body: 'naked', segment: 'midsize', years: [2017, 2030], seats: 2, dep: 0.14, maint: 0.85, ins: 1.15, tags: ['naked', 'triple', 'sharp'], trims: [
    bike('r', 'Street Triple R', 10_000, 118, 3.3, 47, 145, MOTO_NAKED, ['Ride modes', 'Quickshifter']),
    bike('rs', 'Street Triple RS', 13_000, 128, 3.1, 46, 150, MOTO_NAKED, ['Öhlins shock', 'Brembo Stylema brakes', 'Lap timer']),
  ] }),
  model({ kind: 'motorcycle', id: 'triumph_bonnevillet120', name: 'Bonneville T120', make: 'triumph', body: 'classic', segment: 'midsize', years: [2016, 2030], seats: 2, dep: 0.11, maint: 0.85, ins: 0.95, tags: ['classic', 'style', 'holds value'], collectorAfter: 18, trims: [
    bike('t120', 'Bonneville T120', 13_000, 79, 4.6, 55, 115, MOTO_CLASSIC, ['Twin', 'Heated grips', 'Cruise control']),
    bike('black', 'Bonneville T120 Black', 13_200, 79, 4.6, 55, 115, MOTO_CLASSIC, ['Blacked-out finish', 'Heated grips']),
  ] }),
  model({ kind: 'motorcycle', id: 'ktm_1290superduker', name: '1290 Super Duke R', make: 'ktm', body: 'naked', segment: 'super', years: [2015, 2030], seats: 2, dep: 0.16, maint: 1.1, ins: 1.6, tags: ['naked', 'beast', 'wheelies'], trims: [
    bike('r', '1290 Super Duke R', 20_000, 180, 2.8, 40, 170, MOTO_NAKED, ['Cornering ABS', 'Ride modes', 'Quickshifter']),
    bike('evo', '1290 Super Duke R EVO', 22_000, 180, 2.8, 40, 170, MOTO_NAKED, ['Semi-active suspension', 'Track pack']),
  ] }),
  model({ kind: 'motorcycle', id: 'ktm_390duke', name: '390 Duke', make: 'ktm', body: 'naked', segment: 'compact', years: [2017, 2030], seats: 2, dep: 0.16, maint: 0.6, ins: 0.8, tags: ['naked', 'first bike', 'light'], trims: [
    bike('base', '390 Duke', 5_900, 44, 5.4, 65, 100, MOTO_NAKED, ['TFT display', 'Cornering ABS']),
  ] }),
  model({ kind: 'motorcycle', id: 'indian_chief', name: 'Chief', make: 'indian', body: 'cruiser', segment: 'luxury', years: [2022, 2030], seats: 2, dep: 0.13, maint: 0.9, ins: 1.05, tags: ['cruiser', 'american', 'style'], trims: [
    bike('base', 'Chief', 15_000, 94, 4.3, 44, 112, MOTO_CRUISER, ['Thunderstroke 111', 'Ride modes']),
    bike('darkhorse', 'Chief Dark Horse', 18_000, 108, 4.0, 42, 116, MOTO_CRUISER, ['Thunderstroke 116', 'Blacked-out finish', 'Touchscreen']),
  ] }),
  model({ kind: 'motorcycle', id: 'indian_scout', name: 'Scout', make: 'indian', body: 'cruiser', segment: 'midsize', years: [2015, 2030], seats: 2, dep: 0.14, maint: 0.8, ins: 0.95, tags: ['cruiser', 'approachable', 'style'], trims: [
    bike('base', 'Scout', 13_000, 100, 4.0, 45, 115, MOTO_CRUISER, ['Liquid-cooled V-twin', 'Low seat']),
  ] }),
  model({ kind: 'motorcycle', id: 'royalenfield_classic350', name: 'Classic 350', make: 'royalenfield', body: 'classic', segment: 'compact', years: [2021, 2030], seats: 2, dep: 0.12, maint: 0.5, ins: 0.7, tags: ['classic', 'first bike', 'cheap to run'], trims: [
    bike('base', 'Classic 350', 4_700, 20, 9.5, 85, 70, MOTO_CLASSIC, ['Single cylinder', 'Tripper navigation']),
  ] }),
  model({ kind: 'motorcycle', id: 'royalenfield_interceptor650', name: 'Interceptor 650', make: 'royalenfield', body: 'classic', segment: 'compact', years: [2019, 2030], seats: 2, dep: 0.12, maint: 0.55, ins: 0.8, tags: ['classic', 'twin', 'value'], trims: [
    bike('base', 'Interceptor 650', 6_500, 47, 5.8, 60, 105, MOTO_CLASSIC, ['Parallel twin', 'Slipper clutch']),
  ] }),
  model({ kind: 'motorcycle', id: 'aprilia_rsv4', name: 'RSV4', make: 'aprilia', body: 'sportbike', segment: 'super', years: [2015, 2030], seats: 1, dep: 0.15, maint: 1.5, ins: 2.1, tags: ['superbike', 'v4', 'track'], trims: [
    bike('base', 'RSV4', 20_000, 217, 2.9, 36, 190, MOTO_SPORT, ['V4', 'Cornering ABS', 'Quickshifter']),
    bike('factory', 'RSV4 Factory', 26_000, 217, 2.8, 36, 191, MOTO_SPORT, ['Öhlins Smart EC', 'Forged wheels', 'Winglets']),
  ] }),
  model({ kind: 'motorcycle', id: 'suzuki_hayabusa', name: 'Hayabusa', make: 'suzuki', body: 'sportbike', segment: 'super', years: [2015, 2030], seats: 2, dep: 0.13, maint: 0.9, ins: 1.8, tags: ['hyperbike', 'icon', 'fast'], collectorAfter: 15, trims: [
    bike('base', 'Hayabusa', 19_000, 188, 3.0, 40, 186, MOTO_SPORT, ['Launch control', 'Cruise control', 'Quickshifter']),
  ] }),

  // --- Boats. Real builders and models; every figure SLATE's own. ------------
  model({ kind: 'boat', id: 'bostonwhaler_montauk190', name: 'Montauk 190', make: 'bostonwhaler', body: 'center_console', segment: 'compact', years: [2015, 2030], seats: 8, dep: 0.09, maint: 0.9, ins: 0.9, tags: ['unsinkable', 'fishing', 'first boat'], collectorAfter: 25, trims: [
    boat('150', '150 Outboard', 62_000, 150, 6.5, 'outboard', BOAT_DAY, ['Unsinkable hull', 'Center console'], { lengthFeet: 19, seats: 8, topSpeed: 38, hourlyOperating: 55_00 }),
    boat('200', '200 Outboard', 68_000, 200, 8.5, 'outboard', BOAT_DAY, ['Unsinkable hull', 'Center console', 'T-top ready'], { lengthFeet: 19, seats: 8, topSpeed: 42, hourlyOperating: 68_00 }),
  ] }),
  model({ kind: 'boat', id: 'bostonwhaler_outrage280', name: 'Outrage 280', make: 'bostonwhaler', body: 'center_console', segment: 'midsize', years: [2018, 2030], seats: 12, dep: 0.10, maint: 1.2, ins: 1.1, tags: ['offshore', 'fishing', 'family'], trims: [
    boat('twin300', 'Twin 300 Outboards', 330_000, 600, 26, 'outboard', BOAT_OFFSHORE, ['Hardtop', 'Joystick piloting', 'Livewell'], { lengthFeet: 28, seats: 12, topSpeed: 50, hourlyOperating: 190_00 }),
  ] }),
  model({ kind: 'boat', id: 'searay_slx260', name: 'SLX 260', make: 'searay', body: 'bowrider', segment: 'midsize', years: [2017, 2030], seats: 12, dep: 0.12, maint: 1.0, ins: 1.0, tags: ['lake', 'family', 'day boat'], trims: [
    boat('base', 'SLX 260', 205_000, 380, 14, 'sterndrive', BOAT_DAY, ['Bow seating', 'Swim platform', 'Premium audio'], { lengthFeet: 26, seats: 12, topSpeed: 47, hourlyOperating: 110_00 }),
  ] }),
  model({ kind: 'boat', id: 'searay_sundancer320', name: 'Sundancer 320', make: 'searay', body: 'express_cruiser', segment: 'midsize', years: [2018, 2030], seats: 10, dep: 0.12, maint: 1.3, ins: 1.1, tags: ['weekender', 'cabin', 'family'], trims: [
    boat('base', 'Sundancer 320', 420_000, 700, 30, 'outboard', BOAT_CRUISER, ['Cabin with berth', 'Galley', 'Hardtop'], { lengthFeet: 32, seats: 10, berths: 2, topSpeed: 46, hourlyOperating: 230_00 }),
  ] }),
  model({ kind: 'boat', id: 'mastercraft_xt23', name: 'XT23', make: 'mastercraft', body: 'wake', segment: 'sports', years: [2017, 2030], seats: 16, dep: 0.13, maint: 1.0, ins: 1.1, tags: ['wakeboard', 'surf', 'lake'], trims: [
    boat('base', 'XT23', 190_000, 430, 12, 'inboard', BOAT_WAKE, ['Surf system', 'Ballast', 'Tower with racks'], { lengthFeet: 23, seats: 16, topSpeed: 44, hourlyOperating: 95_00 }),
  ] }),
  model({ kind: 'boat', id: 'mastercraft_x24', name: 'X24', make: 'mastercraft', body: 'wake', segment: 'sports', years: [2019, 2030], seats: 18, dep: 0.13, maint: 1.05, ins: 1.15, tags: ['wakeboard', 'surf', 'flagship'], trims: [
    boat('base', 'X24', 230_000, 522, 14, 'inboard', BOAT_WAKE, ['Surf system', 'Touchscreen helm', 'Tower with racks'], { lengthFeet: 24, seats: 18, topSpeed: 45, hourlyOperating: 105_00 }),
  ] }),
  model({ kind: 'boat', id: 'malibu_wakesetter23lsv', name: 'Wakesetter 23 LSV', make: 'malibu', body: 'wake', segment: 'sports', years: [2016, 2030], seats: 15, dep: 0.13, maint: 1.0, ins: 1.1, tags: ['wakeboard', 'surf', 'lake'], trims: [
    boat('base', 'Wakesetter 23 LSV', 200_000, 450, 12, 'inboard', BOAT_WAKE, ['Surf Gate', 'Power Wedge', 'Tower with racks'], { lengthFeet: 23, seats: 15, topSpeed: 44, hourlyOperating: 95_00 }),
  ] }),
  model({ kind: 'boat', id: 'chriscraft_launch27', name: 'Launch 27', make: 'chriscraft', body: 'runabout', segment: 'luxury', years: [2016, 2030], seats: 10, dep: 0.10, maint: 1.2, ins: 1.1, tags: ['runabout', 'teak', 'style'], collectorAfter: 20, trims: [
    boat('base', 'Launch 27', 265_000, 380, 15, 'sterndrive', BOAT_DAY, ['Teak trim', 'Bow seating', 'Heritage styling'], { lengthFeet: 27, seats: 10, topSpeed: 48, hourlyOperating: 120_00 }),
  ] }),
  model({ kind: 'boat', id: 'cobalt_r6', name: 'R6', make: 'cobalt', body: 'bowrider', segment: 'midsize', years: [2018, 2030], seats: 12, dep: 0.12, maint: 0.95, ins: 1.0, tags: ['lake', 'family', 'quality'], trims: [
    boat('base', 'R6', 150_000, 350, 13, 'sterndrive', BOAT_DAY, ['Swim step', 'Bow seating'], { lengthFeet: 25, seats: 12, topSpeed: 46, hourlyOperating: 100_00 }),
  ] }),
  model({ kind: 'boat', id: 'gradywhite_canyon336', name: 'Canyon 336', make: 'gradywhite', body: 'center_console', segment: 'midsize', years: [2016, 2030], seats: 14, dep: 0.10, maint: 1.25, ins: 1.1, tags: ['offshore', 'fishing', 'built to last'], trims: [
    boat('twin300', 'Twin 300 Outboards', 480_000, 600, 27, 'outboard', BOAT_OFFSHORE, ['Hardtop', 'Head compartment', 'Livewells'], { lengthFeet: 33, seats: 14, topSpeed: 50, hourlyOperating: 210_00 }),
  ] }),
  model({ kind: 'boat', id: 'axopar_37xc', name: '37 XC Cross Cabin', make: 'axopar', body: 'express_cruiser', segment: 'midsize', years: [2018, 2030], seats: 10, dep: 0.11, maint: 1.1, ins: 1.05, tags: ['adventure', 'cabin', 'nordic'], trims: [
    boat('twin300', 'Twin 300 Outboards', 370_000, 600, 24, 'outboard', BOAT_CRUISER, ['Enclosed cabin', 'Aft berth', 'Sliding roof'], { lengthFeet: 37, seats: 10, berths: 2, topSpeed: 48, hourlyOperating: 200_00 }),
  ] }),
  model({ kind: 'boat', id: 'beneteau_oceanis401', name: 'Oceanis 40.1', make: 'beneteau', body: 'sailing_yacht', segment: 'midsize', years: [2020, 2030], seats: 8, dep: 0.08, maint: 1.1, ins: 0.9, tags: ['sailing', 'cruising', 'weekends away'], trims: [
    boat('base', 'Oceanis 40.1', 360_000, 45, 1.2, 'sail', BOAT_SAIL, ['Three cabins', 'Furling mainsail', 'Bow thruster ready'], { lengthFeet: 41, seats: 8, berths: 6, topSpeed: 9, hourlyOperating: 28_00 }),
  ] }),
  model({ kind: 'boat', id: 'beneteau_oceanis511', name: 'Oceanis 51.1', make: 'beneteau', body: 'sailing_yacht', segment: 'fullsize', years: [2018, 2030], seats: 10, dep: 0.08, maint: 1.3, ins: 1.0, tags: ['sailing', 'bluewater', 'space'], trims: [
    boat('base', 'Oceanis 51.1', 720_000, 80, 1.8, 'sail', BOAT_SAIL, ['Four cabins', 'Electric winches', 'Generator ready'], { lengthFeet: 51, seats: 10, berths: 8, topSpeed: 10, hourlyOperating: 40_00 }),
  ] }),
  model({ kind: 'boat', id: 'jeanneau_sunodyssey410', name: 'Sun Odyssey 410', make: 'jeanneau', body: 'sailing_yacht', segment: 'midsize', years: [2019, 2030], seats: 8, dep: 0.08, maint: 1.1, ins: 0.9, tags: ['sailing', 'cruising', 'walkaround deck'], trims: [
    boat('base', 'Sun Odyssey 410', 380_000, 45, 1.2, 'sail', BOAT_SAIL, ['Walkaround deck', 'Three cabins', 'Furling mainsail'], { lengthFeet: 41, seats: 8, berths: 6, topSpeed: 9, hourlyOperating: 28_00 }),
  ] }),
  model({ kind: 'boat', id: 'azimut_55', name: 'Azimut 55', make: 'azimut', body: 'motor_yacht', segment: 'luxury', years: [2016, 2030], seats: 12, dep: 0.11, maint: 2.0, ins: 1.4, tags: ['yacht', 'flybridge', 'italian'], trims: [
    boat('base', 'Azimut 55', 1_900_000, 1_450, 80, 'shaft', BOAT_YACHT, ['Flybridge', 'Three cabins', 'Crew cabin'], { lengthFeet: 55, seats: 12, berths: 6, topSpeed: 31, hourlyOperating: 650_00, crewMonthly: 550_000 }),
  ] }),
  model({ kind: 'boat', id: 'azimut_72', name: 'Azimut 72', make: 'azimut', body: 'motor_yacht', segment: 'luxury', years: [2017, 2030], seats: 14, dep: 0.11, maint: 2.4, ins: 1.5, tags: ['yacht', 'flybridge', 'crewed'], trims: [
    boat('base', 'Azimut 72', 3_400_000, 2_400, 130, 'shaft', BOAT_YACHT, ['Flybridge', 'Four cabins', 'Crew quarters', 'Gyro stabiliser ready'], { lengthFeet: 72, seats: 14, berths: 8, topSpeed: 32, hourlyOperating: 1_050_00, crewMonthly: 950_000 }),
  ] }),
  model({ kind: 'boat', id: 'princess_v55', name: 'V55', make: 'princess', body: 'motor_yacht', segment: 'luxury', years: [2018, 2030], seats: 12, dep: 0.11, maint: 2.0, ins: 1.4, tags: ['yacht', 'sports cruiser', 'british'], trims: [
    boat('base', 'V55', 2_000_000, 1_500, 85, 'shaft', BOAT_YACHT, ['Three cabins', 'Sunroof', 'Tender garage'], { lengthFeet: 58, seats: 12, berths: 6, topSpeed: 36, hourlyOperating: 700_00, crewMonthly: 600_000 }),
  ] }),
  model({ kind: 'boat', id: 'sunseeker_predator65', name: 'Predator 65', make: 'sunseeker', body: 'motor_yacht', segment: 'luxury', years: [2019, 2030], seats: 14, dep: 0.11, maint: 2.4, ins: 1.5, tags: ['yacht', 'performance', 'status'], trims: [
    boat('base', 'Predator 65', 3_100_000, 2_400, 130, 'shaft', BOAT_YACHT, ['Three cabins', 'Crew cabin', 'Beach club', 'Tender garage'], { lengthFeet: 65, seats: 14, berths: 6, topSpeed: 38, hourlyOperating: 1_000_00, crewMonthly: 850_000 }),
  ] }),
  model({ kind: 'boat', id: 'riva_aquarivasuper', name: 'Aquariva Super', make: 'riva', body: 'runabout', segment: 'luxury', years: [2015, 2030], seats: 8, dep: 0.07, maint: 2.2, ins: 1.6, tags: ['runabout', 'mahogany', 'collector'], collectorAfter: 10, trims: [
    boat('base', 'Aquariva Super', 920_000, 740, 40, 'shaft', BOAT_DAY, ['Mahogany deck', 'Twin diesels', 'Convertible top'], { lengthFeet: 33, seats: 8, topSpeed: 41, hourlyOperating: 380_00 }),
  ] }),
  model({ kind: 'boat', id: 'riva_rivamare', name: 'Rivamare', make: 'riva', body: 'runabout', segment: 'luxury', years: [2016, 2030], seats: 10, dep: 0.08, maint: 2.2, ins: 1.6, tags: ['runabout', 'style', 'status'], collectorAfter: 12, trims: [
    boat('base', 'Rivamare', 1_400_000, 800, 45, 'shaft', BOAT_DAY, ['Convertible top', 'Cabin', 'Mahogany and steel'], { lengthFeet: 39, seats: 10, berths: 2, topSpeed: 40, hourlyOperating: 420_00 }),
  ] }),

  // --- Private aircraft. Real types; seats, range and runway rounded from the makers' published figures; prices and costs SLATE's own. ---
  model({ kind: 'jet', id: 'cirrus_visionsf50', name: 'Vision SF50', make: 'cirrus', body: 'very_light_jet', segment: 'compact', years: [2017, 2030], seats: 5, dep: 0.07, maint: 1.0, ins: 1.0, tags: ['personal jet', 'single engine', 'parachute'], trims: [
    jet('g2plus', 'Vision SF50 G2+', 3_300_000, 1_800, 65, JET_LIGHT, ['Whole-airframe parachute', 'Safe Return autoland', 'Single pilot'], { seats: 5, rangeKm: 2_200, runwayFeet: 3_200, topSpeed: 560, hourlyOperating: 1_100_00, crewMonthly: 600_000 }),
  ] }),
  model({ kind: 'jet', id: 'hondajet_eliteii', name: 'HondaJet Elite II', make: 'hondajet', body: 'light_jet', segment: 'compact', years: [2019, 2030], seats: 7, dep: 0.07, maint: 1.2, ins: 1.0, tags: ['light jet', 'over the wing engines', 'efficient'], trims: [
    jet('base', 'HondaJet Elite II', 7_500_000, 4_100, 90, JET_LIGHT, ['Over-the-wing engine mounts', 'Fully private lavatory', 'Single pilot'], { seats: 7, rangeKm: 2_900, runwayFeet: 3_700, topSpeed: 780, hourlyOperating: 1_900_00, crewMonthly: 900_000 }),
  ] }),
  model({ kind: 'jet', id: 'embraer_phenom100ev', name: 'Phenom 100EV', make: 'embraer', body: 'very_light_jet', segment: 'compact', years: [2017, 2030], seats: 6, dep: 0.07, maint: 1.1, ins: 1.0, tags: ['entry jet', 'single pilot', 'efficient'], trims: [
    jet('base', 'Phenom 100EV', 5_000_000, 3_400, 80, JET_LIGHT, ['Prodigy Touch flight deck', 'Single pilot'], { seats: 6, rangeKm: 2_200, runwayFeet: 3_200, topSpeed: 740, hourlyOperating: 1_600_00, crewMonthly: 850_000 }),
  ] }),
  model({ kind: 'jet', id: 'embraer_phenom300e', name: 'Phenom 300E', make: 'embraer', body: 'light_jet', segment: 'midsize', years: [2018, 2030], seats: 9, dep: 0.07, maint: 1.3, ins: 1.05, tags: ['light jet', 'best seller', 'single pilot'], trims: [
    jet('base', 'Phenom 300E', 10_500_000, 6_900, 130, JET_LIGHT, ['Bossa Nova interior', 'Runway overrun awareness', 'Single pilot'], { seats: 9, rangeKm: 3_700, runwayFeet: 3_200, topSpeed: 840, hourlyOperating: 2_300_00, crewMonthly: 1_200_000 }),
  ] }),
  model({ kind: 'jet', id: 'cessna_citationcj4', name: 'Citation CJ4 Gen2', make: 'cessna', body: 'light_jet', segment: 'midsize', years: [2021, 2030], seats: 9, dep: 0.07, maint: 1.3, ins: 1.05, tags: ['light jet', 'single pilot', 'workhorse'], trims: [
    jet('base', 'Citation CJ4 Gen2', 11_000_000, 7_200, 140, JET_LIGHT, ['Garmin G3000', 'Single pilot', 'Wireless cabin management'], { seats: 9, rangeKm: 4_000, runwayFeet: 3_400, topSpeed: 830, hourlyOperating: 2_400_00, crewMonthly: 1_250_000 }),
  ] }),
  model({ kind: 'jet', id: 'pilatus_pc24', name: 'PC-24', make: 'pilatus', body: 'light_jet', segment: 'midsize', years: [2018, 2030], seats: 10, dep: 0.06, maint: 1.3, ins: 1.05, tags: ['versatile', 'rough strips', 'cargo door'], trims: [
    jet('base', 'PC-24', 12_000_000, 6_800, 140, JET_LIGHT, ['Cargo door', 'Unpaved runway capable', 'Flat floor cabin'], { seats: 10, rangeKm: 3_700, runwayFeet: 2_900, topSpeed: 815, hourlyOperating: 2_500_00, crewMonthly: 1_300_000 }),
  ] }),
  model({ kind: 'jet', id: 'cessna_citationlatitude', name: 'Citation Latitude', make: 'cessna', body: 'midsize_jet', segment: 'fullsize', years: [2015, 2030], seats: 9, dep: 0.07, maint: 1.5, ins: 1.1, tags: ['midsize', 'flat floor', 'stand up cabin'], trims: [
    jet('base', 'Citation Latitude', 19_000_000, 11_700, 200, JET_MID, ['Six foot cabin', 'Flat floor', 'Garmin G5000'], { seats: 9, rangeKm: 5_000, runwayFeet: 3_600, topSpeed: 830, hourlyOperating: 3_100_00, crewMonthly: 1_600_000 }),
  ] }),
  model({ kind: 'jet', id: 'bombardier_challenger3500', name: 'Challenger 3500', make: 'bombardier', body: 'super_midsize_jet', segment: 'fullsize', years: [2022, 2030], seats: 10, dep: 0.07, maint: 1.7, ins: 1.15, tags: ['super midsize', 'coast to coast', 'quiet cabin'], trims: [
    jet('base', 'Challenger 3500', 27_000_000, 14_600, 240, JET_MID, ['Nuage seats', 'Voice-controlled cabin', 'Autothrottle'], { seats: 10, rangeKm: 6_200, runwayFeet: 4_800, topSpeed: 870, hourlyOperating: 3_900_00, crewMonthly: 2_200_000 }),
  ] }),
  model({ kind: 'jet', id: 'gulfstream_g280', name: 'G280', make: 'gulfstream', body: 'super_midsize_jet', segment: 'fullsize', years: [2015, 2030], seats: 10, dep: 0.07, maint: 1.7, ins: 1.15, tags: ['super midsize', 'range', 'gulfstream cabin'], trims: [
    jet('base', 'G280', 25_000_000, 15_200, 250, JET_MID, ['PlaneView280 flight deck', 'Fresh air system', 'Two cabin zones'], { seats: 10, rangeKm: 6_700, runwayFeet: 4_800, topSpeed: 870, hourlyOperating: 4_000_00, crewMonthly: 2_200_000 }),
  ] }),
  model({ kind: 'jet', id: 'dassault_falcon2000lxs', name: 'Falcon 2000LXS', make: 'dassault', body: 'large_jet', segment: 'luxury', years: [2015, 2030], seats: 10, dep: 0.07, maint: 2.0, ins: 1.2, tags: ['large cabin', 'short field', 'french'], trims: [
    jet('base', 'Falcon 2000LXS', 37_000_000, 14_000, 260, JET_LARGE, ['Inboard slats', 'Wide cabin', 'EASy III flight deck'], { seats: 10, rangeKm: 7_400, runwayFeet: 4_700, topSpeed: 880, hourlyOperating: 4_600_00, crewMonthly: 2_800_000 }),
  ] }),
  model({ kind: 'jet', id: 'dassault_falcon8x', name: 'Falcon 8X', make: 'dassault', body: 'long_range_jet', segment: 'luxury', years: [2016, 2030], seats: 14, dep: 0.07, maint: 2.3, ins: 1.3, tags: ['long range', 'three engines', 'quiet'], trims: [
    jet('base', 'Falcon 8X', 60_000_000, 20_400, 340, JET_LONG, ['Three engines', 'FalconEye head-up display', 'Three cabin zones'], { seats: 14, rangeKm: 11_900, runwayFeet: 6_000, topSpeed: 900, hourlyOperating: 5_600_00, crewMonthly: 3_800_000 }),
  ] }),
  model({ kind: 'jet', id: 'gulfstream_g650er', name: 'G650ER', make: 'gulfstream', body: 'long_range_jet', segment: 'luxury', years: [2015, 2030], seats: 19, dep: 0.07, maint: 2.5, ins: 1.4, tags: ['ultra long range', 'flagship', 'status'], trims: [
    jet('base', 'G650ER', 72_000_000, 33_800, 480, JET_LONG, ['Four living areas', 'Panoramic windows', 'Low cabin altitude'], { seats: 19, rangeKm: 13_900, runwayFeet: 6_000, topSpeed: 950, hourlyOperating: 6_200_00, crewMonthly: 4_500_000 }),
  ] }),
  model({ kind: 'jet', id: 'gulfstream_g700', name: 'G700', make: 'gulfstream', body: 'long_range_jet', segment: 'luxury', years: [2024, 2030], seats: 19, dep: 0.07, maint: 2.6, ins: 1.45, tags: ['ultra long range', 'newest', 'tallest cabin'], trims: [
    jet('base', 'G700', 80_000_000, 36_600, 500, JET_LONG, ['Five living areas', 'Circadian lighting', 'Ultra-galley'], { seats: 19, rangeKm: 14_300, runwayFeet: 6_250, topSpeed: 956, hourlyOperating: 6_600_00, crewMonthly: 4_800_000 }),
  ] }),
  model({ kind: 'jet', id: 'bombardier_global7500', name: 'Global 7500', make: 'bombardier', body: 'long_range_jet', segment: 'luxury', years: [2018, 2030], seats: 19, dep: 0.07, maint: 2.6, ins: 1.45, tags: ['ultra long range', 'four zones', 'status'], trims: [
    jet('base', 'Global 7500', 78_000_000, 37_400, 500, JET_LONG, ['Four living spaces', 'Full-size bed', 'Smooth Flex wing'], { seats: 19, rangeKm: 14_200, runwayFeet: 5_800, topSpeed: 956, hourlyOperating: 6_800_00, crewMonthly: 4_700_000 }),
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
  option('opt_carbon_pack', 'Carbon Fiber Package', 'exterior', 9_500, { zeroToSixty: -0.05, valueRetention: 0.7 }),
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

  // Motorcycles.
  option('opt_moto_heated_grips', 'Heated Grips', 'comfort', 300, { valueRetention: 0.3 }),
  option('opt_moto_alarm', 'Factory Alarm', 'security', 350, { valueRetention: 0.3 }),
  option('opt_moto_tpms', 'Tire Pressure Monitoring', 'electronics', 250, { valueRetention: 0.2 }),
  option('opt_moto_quickshifter', 'Quickshifter', 'electronics', 650, { zeroToSixty: -0.1, valueRetention: 0.5 }),
  option('opt_moto_ti_exhaust', 'Titanium Sports Exhaust', 'exhaust', 2_800, { horsepower: 8, valueRetention: 0.5 }),
  option('opt_moto_forged_wheels', 'Forged Wheels', 'wheels', 3_200, { zeroToSixty: -0.1, valueRetention: 0.6 }),
  option('opt_moto_semi_active', 'Semi Active Suspension', 'suspension', 1_600, { valueRetention: 0.5 }),
  option('opt_moto_cruise', 'Cruise Control', 'electronics', 450, { valueRetention: 0.4 }),
  option('opt_moto_touring_pack', 'Touring Pack', 'utility', 1_900, { valueRetention: 0.45 }),
  option('opt_moto_audio', 'Audio System', 'infotainment', 900, { valueRetention: 0.3 }),

  // Boats.
  option('opt_boat_chartplotter', 'Chartplotter And Radar', 'electronics', 16_000, { valueRetention: 0.4 }),
  option('opt_boat_underwater_lights', 'Underwater Lights', 'exterior', 3_200, { valueRetention: 0.3 }),
  option('opt_boat_bimini', 'Bimini Top', 'exterior', 4_500, { valueRetention: 0.35 }),
  option('opt_boat_audio', 'Marine Audio System', 'infotainment', 4_800, { valueRetention: 0.3 }),
  option('opt_boat_hardtop', 'Hardtop', 'exterior', 18_000, { valueRetention: 0.55 }),
  option('opt_boat_joystick', 'Joystick Docking', 'electronics', 12_000, { valueRetention: 0.5 }),
  option('opt_boat_tower', 'Wake Tower With Racks', 'exterior', 9_000, { valueRetention: 0.45 }),
  option('opt_boat_ballast', 'Extended Ballast System', 'performance', 6_500, { valueRetention: 0.4 }),
  option('opt_boat_bow_thruster', 'Bow Thruster', 'performance', 9_500, { valueRetention: 0.55 }),
  option('opt_boat_ac', 'Cabin Air Conditioning', 'comfort', 11_000, { valueRetention: 0.45 }),
  option('opt_boat_generator', 'Generator', 'utility', 22_000, { valueRetention: 0.5 }),
  option('opt_boat_watermaker', 'Watermaker', 'utility', 18_000, { valueRetention: 0.45 }),
  option('opt_boat_teak', 'Teak Decking', 'exterior', 14_000, { valueRetention: 0.5 }),
  option('opt_boat_gyro', 'Gyro Stabiliser', 'performance', 85_000, { valueRetention: 0.6 }),
  option('opt_boat_tender', 'Tender And Garage', 'utility', 65_000, { valueRetention: 0.5 }),

  // Aircraft.
  option('opt_jet_wifi', 'Cabin Connectivity', 'electronics', 250_000, { valueRetention: 0.5 }),
  option('opt_jet_paint_scheme', 'Custom Paint Scheme', 'exterior', 350_000, { valueRetention: 0.3 }),
  option('opt_jet_ife', 'Cabin Entertainment System', 'infotainment', 220_000, { valueRetention: 0.4 }),
  option('opt_jet_galley', 'Full Galley', 'interior', 180_000, { valueRetention: 0.5 }),
  option('opt_jet_evs', 'Enhanced Vision System', 'electronics', 400_000, { valueRetention: 0.55 }),
  option('opt_jet_cabin_bespoke', 'Bespoke Cabin Interior', 'interior', 1_500_000, { valueRetention: 0.45 }),
  option('opt_jet_crew_rest', 'Crew Rest Compartment', 'interior', 700_000, { valueRetention: 0.5 }),
  option('opt_jet_aux_tanks', 'Auxiliary Fuel Tanks', 'performance', 600_000, { valueRetention: 0.6 }),
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
const MOTO: PartFitment = { kinds: ['motorcycle'], makes: [], models: [] };
const BOAT: PartFitment = { kinds: ['boat'], makes: [], models: [] };
const JET: PartFitment = { kinds: ['jet'], makes: [], models: [] };

export const PARTS = new Registry<Part>('parts', [
  // Cosmetic — mostly universal, mostly legal, mostly value-neutral.
  part('paint_respray_std', 'Standard Respray', 'paint', 'Local Body Shop', 4_500, 24, UNIVERSAL, { valueDelta: -80_000, condition: 4 }, { insurance: true }, 'A color change done properly. Non-original paint costs you at resale, every time.'),
  part('paint_respray_show', 'Show-Quality Respray', 'paint', 'Concours Refinishing', 18_000, 80, UNIVERSAL, { valueDelta: 120_000, condition: 10 }, { insurance: true }, 'Bare-metal preparation and a finish that holds up under a spotlight.'),
  part('wrap_satin', 'Satin Vinyl Wrap', 'wrap', 'Cover Culture', 4_200, 20, UNIVERSAL, { valueDelta: 0, condition: 2 }, {}, 'Reversible, protects the paint underneath, and comes off without a trace.'),
  part('wrap_chrome', 'Chrome Vinyl Wrap', 'wrap', 'Cover Culture', 7_800, 26, UNIVERSAL, { valueDelta: 0 }, { legal: false, insurance: true }, 'Illegal in several jurisdictions for the glare it throws at other drivers.'),
  part('ppf_full', 'Full-Body Paint Protection Film', 'ppf', 'ClearGuard', 7_500, 22, UNIVERSAL, { valueDelta: 250_000, condition: 6 }, {}, 'Invisible armor. Pays for itself on resale for anything above sixty thousand.'),

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
  part('trim_carbon_interior', 'Carbon Fiber Interior Trim', 'trim', 'Atelier Trim', 3_400, 8, UNIVERSAL, { valueRecovery: 0.3 }, {}, 'Real weave, laid properly, in place of the plastic.'),

  // Electronics.
  part('info_headunit', 'Modern Head Unit Retrofit', 'infotainment', 'Northline Audio', 1_900, 4, { makes: [], models: [], years: [2015, 2021] }, { valueDelta: 90_000 }, {}, 'Only worth doing on an older car whose original screen has aged badly.'),
  part('audio_reference', 'Reference Audio System', 'audio', 'Northline Audio', 8_400, 14, UNIVERSAL, { valueRecovery: 0.2 }, {}, 'Amplifiers, a subwoofer, sound deadening and a tune. Transforms a long drive.'),
  part('light_led_conv', 'LED Headlight Conversion', 'lighting', 'ClearGuard', 1_200, 3, { makes: [], models: [], years: [2015, 2020] }, { valueRecovery: 0.15 }, { insurance: true }, 'Modern output on an older car. Must be a proper projector housing or it blinds oncoming traffic.'),
  part('light_underglow', 'Underbody Lighting', 'lighting', 'Cover Culture', 900, 4, UNIVERSAL, { valueDelta: -40_000 }, { legal: false, insurance: true }, 'Restricted or prohibited on public roads almost everywhere.'),
  part('security_immobiliser', 'Aftermarket Immobiliser', 'security', 'ClearGuard', 1_400, 3, UNIVERSAL, { valueRecovery: 0.2 }, { insurance: true }, 'Insurers reduce the premium for one of these on a desirable car.'),
  part('tracking_gps', 'GPS Tracking and Recovery', 'tracking', 'ClearGuard', 850, 2, UNIVERSAL, { valueRecovery: 0.1 }, { insurance: true }, 'A monthly subscription and a meaningfully better chance of seeing the car again.'),
  part('aero_splitter', 'Front Splitter and Rear Wing', 'aero', 'Apex Forged', 5_600, 8, { makes: [], models: [], bodyStyles: ['coupe', 'sedan', 'roadster'] }, { zeroToSixty: 0.04, valueRecovery: 0.15 }, { insurance: true }, 'Real downforce above 80 miles an hour. Below that it is only weight and drag.'),

  // --- Motorcycles. The brands here are SLATE's; the bikes they fit are real. ---
  part('moto_exhaust_slipon', 'Slip-On Silencer', 'exhaust', 'Resonance Works', 1_100, 1, MOTO, { horsepower: 4, topSpeed: 1, valueRecovery: 0.3 }, { insurance: true }, 'Keeps the catalyst and the noise inside the law. Most of the sound, a little of the power.'),
  part('moto_exhaust_full', 'Full Titanium Exhaust System', 'exhaust', 'Resonance Works', 3_400, 4, { ...MOTO, bodyStyles: ['sportbike', 'naked', 'adventure'] }, { horsepower: 10, topSpeed: 3, valueRecovery: 0.2, condition: -1 }, { legal: false, voids: true, insurance: true }, 'The catalyst goes in a box in the garage. Louder than the law where the law measures it.'),
  part('moto_ecu_flash', 'ECU Flash', 'tune', 'Threshold Calibration', 450, 1, MOTO, { horsepower: 7, zeroToSixty: -0.1, efficiency: -2 }, { voids: true, insurance: true }, 'Removes the restrictions the factory put in for markets it never sold you in. The dealer can read that it was done.'),
  part('moto_quickshifter_aftermarket', 'Aftermarket Quickshifter', 'electronics', 'Threshold Calibration', 600, 2, { ...MOTO, bodyStyles: ['sportbike', 'naked', 'adventure'] }, { zeroToSixty: -0.1, valueRecovery: 0.3 }, {}, 'Clutchless upshifts, and a downshift blip if the bike will take it.'),
  part('moto_fork_cartridges', 'Fork Cartridge Kit', 'suspension', 'Meridian Dynamics', 1_300, 4, MOTO, { zeroToSixty: -0.02, valueRecovery: 0.2 }, { voids: true }, 'The front end most bikes should have shipped with. Set up for your weight, once.'),
  part('moto_rear_shock', 'Fully Adjustable Rear Shock', 'suspension', 'Meridian Dynamics', 1_500, 3, MOTO, { valueRecovery: 0.25 }, { voids: true }, 'Preload, compression, rebound. Feels like a different motorcycle over a bad road.'),
  part('moto_brake_master', 'Radial Master Cylinder And Pads', 'brakes', 'Halton Racing', 700, 2, MOTO, { zeroToSixty: -0.02, valueRecovery: 0.2 }, { insurance: true }, 'Feel at the lever that the stock pump never had.'),
  part('moto_tyres_sport', 'Sport Tires', 'tires', 'Vanguard Rubber', 420, 1.5, MOTO, { zeroToSixty: -0.08, efficiency: -1 }, {}, 'Grip you can feel in the first corner and mileage you can feel at the till.'),
  part('moto_tyres_touring', 'Touring Tires', 'tires', 'Vanguard Rubber', 380, 1.5, MOTO, { efficiency: 1 }, {}, 'Twice the miles of the sport tire and fine in the rain.'),
  part('moto_seat_comfort', 'Comfort Seat', 'seats', 'Atelier Trim', 520, 0.5, MOTO, { valueRecovery: 0.3 }, {}, 'Wider and softer. The difference between three hours and six.'),
  part('moto_windscreen_touring', 'Touring Windscreen', 'windscreen', 'ClearGuard', 260, 0.5, { ...MOTO, bodyStyles: ['adventure', 'tourer', 'naked', 'classic'] }, { valueRecovery: 0.2 }, {}, 'Taller. Moves the wind from your helmet to somewhere above it.'),
  part('moto_panniers', 'Hard Panniers And Top Box', 'luggage', 'Apex Forged', 1_800, 2, { ...MOTO, bodyStyles: ['adventure', 'tourer', 'classic', 'cruiser'] }, { valueRecovery: 0.35 }, {}, 'Lockable, waterproof, and the bike becomes the thing you leave on.'),
  part('moto_crash_protection', 'Frame Sliders And Crash Bars', 'protection', 'Apex Forged', 480, 1.5, MOTO, { valueRecovery: 0.25, condition: 1 }, {}, 'The bike falls over eventually. This decides what it costs when it does.'),
  part('moto_tail_tidy', 'Tail Tidy', 'lighting', 'Cover Culture', 180, 1, MOTO, { valueDelta: 0 }, { legal: false }, 'Removes the plate hanger. The plate ends up where an officer has an opinion about it.'),
  part('moto_levers', 'Adjustable Levers', 'controls', 'Apex Forged', 220, 0.5, MOTO, { valueRecovery: 0.2 }, {}, 'Span and reach set to your hands. Fold if the bike goes down.'),
  part('moto_heated_grips_aftermarket', 'Heated Grips', 'electronics', 'Northline Audio', 260, 1.5, MOTO, { valueRecovery: 0.3 }, {}, 'Five settings. The season gets two months longer at each end.'),
  part('moto_tracker', 'Hidden GPS Tracker', 'tracking', 'ClearGuard', 350, 1.5, MOTO, { valueRecovery: 0.2 }, { insurance: true }, 'Motorcycles get stolen. This is the difference between a claim and a recovery.'),
  part('moto_alarm_aftermarket', 'Alarm And Immobiliser', 'security', 'ClearGuard', 300, 1, MOTO, { valueRecovery: 0.25 }, { insurance: true }, 'Insurers take a little off for it on anything worth stealing.'),
  part('moto_paint_custom', 'Custom Tank And Bodywork Paint', 'paint', 'Concours Refinishing', 2_400, 20, MOTO, { valueDelta: -30_000, condition: 4 }, { insurance: true }, 'Yours, exactly. The next owner will have wanted the original.'),
  part('moto_wrap', 'Vinyl Wrap', 'wrap', 'Cover Culture', 900, 8, MOTO, { valueDelta: 0, condition: 1 }, {}, 'Comes off clean when you sell.'),

  // --- Boats. ---
  part('boat_antifoul', 'Antifoul And Bottom Paint', 'hull', 'Harbor Yard', 2_800, 10, BOAT, { condition: 6, topSpeed: 1, efficiency: -1 }, {}, 'A clean bottom is a knot and a tenth of the fuel. Due every season whether you like it or not.'),
  part('boat_prop_stainless', 'Stainless Steel Propeller', 'propeller', 'Halton Marine', 1_400, 2, { ...BOAT, bodyStyles: ['center_console', 'bowrider', 'wake', 'runabout', 'express_cruiser'] }, { topSpeed: 2, zeroToSixty: -0.2, valueRecovery: 0.3 }, {}, 'Holds its shape at speed where aluminum flexes. Costs a lot more when you hit something.'),
  part('boat_repower', 'Outboard Repower', 'engine', 'Halton Marine', 28_000, 24, { ...BOAT, bodyStyles: ['center_console', 'bowrider', 'express_cruiser'] }, { horsepower: 60, topSpeed: 5, efficiency: 3, valueRecovery: 0.45, condition: 8 }, { insurance: true }, 'New engines on an old hull. The single best thing you can do for a tired boat, and it shows in the price you get.'),
  part('boat_trim_tabs', 'Trim Tabs', 'hull', 'Meridian Marine', 1_900, 5, { ...BOAT, bodyStyles: ['center_console', 'bowrider', 'runabout', 'express_cruiser'] }, { topSpeed: 1, efficiency: -1, valueRecovery: 0.3 }, {}, 'Gets the bow down sooner and the ride flat in a chop.'),
  part('boat_chartplotter', 'Chartplotter And Sounder', 'navigation', 'Northline Marine', 4_200, 6, BOAT, { valueRecovery: 0.35 }, {}, 'Where you are, what is under you, and how to get home in the dark.'),
  part('boat_radar', 'Radar Dome', 'navigation', 'Northline Marine', 5_800, 8, { ...BOAT, bodyStyles: ['center_console', 'express_cruiser', 'sailing_yacht', 'motor_yacht'] }, { valueRecovery: 0.3 }, { requires: ['navigation'] }, 'Needs a plotter to draw on. Fog stops being frightening.'),
  part('boat_autopilot', 'Autopilot', 'navigation', 'Northline Marine', 4_600, 8, { ...BOAT, bodyStyles: ['express_cruiser', 'sailing_yacht', 'motor_yacht'] }, { valueRecovery: 0.35 }, { requires: ['navigation'] }, 'Holds a course so you can make a sandwich. Follows the plotter it needs.'),
  part('boat_audio', 'Marine Audio System', 'audio', 'Northline Marine', 3_600, 8, BOAT, { valueRecovery: 0.2 }, {}, 'Amplified, sealed, and loud enough to be heard over two outboards.'),
  part('boat_tower', 'Wake Tower', 'tower', 'Apex Marine', 7_500, 10, { ...BOAT, bodyStyles: ['bowrider', 'runabout'] }, { valueRecovery: 0.3 }, {}, 'Turns a day boat into a tow boat. Board racks and a high tow point.'),
  part('boat_ballast_bags', 'Ballast Bags And Pumps', 'hull', 'Apex Marine', 1_900, 3, { ...BOAT, bodyStyles: ['wake', 'bowrider'] }, { valueRecovery: 0.15, topSpeed: -2 }, {}, 'Weight where you want the wake. The boat is slower everywhere else.'),
  part('boat_underwater_lights', 'Underwater Lights', 'lighting', 'Northline Marine', 2_400, 5, BOAT, { valueRecovery: 0.25 }, {}, 'Blue at the swim step at night. Fish come to look.'),
  part('boat_teak_synthetic', 'Synthetic Teak Decking', 'deck', 'Harbor Yard', 9_800, 30, BOAT, { valueDelta: 400_000, condition: 6 }, {}, 'Looks like teak, never needs oiling, hot underfoot in August.'),
  part('boat_upholstery', 'Marine Upholstery Retrim', 'upholstery', 'Atelier Trim', 6_500, 24, BOAT, { valueDelta: 350_000, condition: 8 }, {}, 'Sun and salt take the seats first. New vinyl takes years off the boat.'),
  part('boat_bimini', 'Bimini And Enclosure', 'canvas', 'Harbor Yard', 3_800, 6, { ...BOAT, bodyStyles: ['center_console', 'bowrider', 'runabout', 'wake', 'sailing_yacht'] }, { valueRecovery: 0.3 }, {}, 'Shade, and an enclosure for the day the weather turns.'),
  part('boat_sails_laminate', 'Laminate Sail Wardrobe', 'canvas', 'Harbor Yard', 28_000, 12, { ...BOAT, bodyStyles: ['sailing_yacht'] }, { topSpeed: 1, valueRecovery: 0.35, condition: 4 }, {}, 'Holds its shape in a breeze where Dacron bags. A knot upwind, honestly.'),
  part('boat_generator', 'Generator Install', 'power', 'Halton Marine', 19_000, 40, { ...BOAT, bodyStyles: ['express_cruiser', 'sailing_yacht', 'motor_yacht'] }, { valueRecovery: 0.4 }, { insurance: true }, 'Air conditioning at anchor and a kettle that works. Needs a survey afterwards.'),
  part('boat_watermaker', 'Watermaker', 'power', 'Halton Marine', 14_000, 20, { ...BOAT, bodyStyles: ['sailing_yacht', 'motor_yacht'] }, { valueRecovery: 0.35 }, { requires: ['power'] }, 'Fresh water from the sea. Needs the generator to run it.'),
  part('boat_gyro', 'Gyro Stabiliser Retrofit', 'hull', 'Meridian Marine', 95_000, 120, { ...BOAT, bodyStyles: ['motor_yacht'] }, { valueRecovery: 0.55, condition: 2 }, { insurance: true }, 'Takes the roll out at anchor and under way. People who have one will not go back.'),
  part('boat_bow_thruster', 'Bow Thruster Retrofit', 'controls', 'Meridian Marine', 12_000, 40, { ...BOAT, bodyStyles: ['express_cruiser', 'sailing_yacht', 'motor_yacht'] }, { valueRecovery: 0.45 }, { insurance: true }, 'A hole through the bow and a marina you can get out of in a crosswind.'),
  part('boat_tracker', 'GPS Tracker And Geofence', 'tracking', 'ClearGuard', 600, 2, BOAT, { valueRecovery: 0.2 }, { insurance: true }, 'Tells you if the boat moves when you are not on it.'),

  // --- Aircraft. Every figure SLATE's own; a completion center would quote differently. ---
  part('jet_wifi', 'Cabin Connectivity Retrofit', 'connectivity', 'Northline Aero', 320_000, 80, JET, { valueRecovery: 0.5 }, {}, 'Satellite broadband at altitude. On an older airframe it is the first thing a buyer asks about.'),
  part('jet_avionics', 'Avionics Upgrade', 'avionics', 'Threshold Avionics', 450_000, 160, { ...JET, years: [2015, 2021] }, { valueRecovery: 0.55 }, { insurance: true }, 'A modern flight deck in an older jet. Weeks in the shop, and a different airplane to fly.'),
  part('jet_adsb', 'ADS-B Out Compliance', 'avionics', 'Threshold Avionics', 60_000, 24, { ...JET, years: [2015, 2019] }, { valueRecovery: 0.4 }, {}, 'Required in controlled airspace almost everywhere. An older airframe without it is grounded, not cheap.'),
  part('jet_evs', 'Enhanced Vision Retrofit', 'avionics', 'Threshold Avionics', 380_000, 120, JET, { valueRecovery: 0.45 }, {}, 'Infrared through the cloud on the head-up display. Lower minimums into airports that fog in.'),
  part('jet_cabin_refurb', 'Cabin Refurbishment', 'cabin', 'Atelier Aero', 650_000, 400, JET, { valueDelta: 30_000_000, condition: 14 }, {}, 'Seats, veneer, carpet, headliner. Months at a completion center and the cabin is new.'),
  part('jet_seats_config', 'Cabin Reconfiguration', 'seats', 'Atelier Aero', 280_000, 200, JET, { valueRecovery: 0.35 }, {}, 'A divan where four seats were, or the other way round. Certified, weighed, documented.'),
  part('jet_ife', 'Cabin Management And Entertainment', 'infotainment', 'Northline Aero', 190_000, 100, JET, { valueRecovery: 0.4 }, {}, 'Screens, lighting, shades and the galley from one panel.'),
  part('jet_galley', 'Galley Upgrade', 'cabin', 'Atelier Aero', 140_000, 80, { ...JET, bodyStyles: ['midsize_jet', 'super_midsize_jet', 'large_jet', 'long_range_jet'] }, { valueRecovery: 0.4 }, {}, 'A convection oven and an espresso machine. The crew will thank you.'),
  part('jet_lavatory', 'Lavatory Refit', 'cabin', 'Atelier Aero', 95_000, 60, JET, { valueRecovery: 0.35, condition: 3 }, {}, 'Stone, a proper basin, and the one room every buyer opens first.'),
  part('jet_paint', 'Full Repaint', 'paint', 'Concours Aero', 250_000, 240, JET, { condition: 8, valueDelta: 8_000_000 }, { insurance: true }, 'Stripped to bare metal, inspected, repainted. Weeks on the ground.'),
  part('jet_livery', 'Custom Livery', 'wrap', 'Concours Aero', 90_000, 100, JET, { valueDelta: 0 }, { conflicts: ['paint'] }, 'Stripes and a tail design over the existing paint. Yours, and the next owner\'s to remove.'),
  part('jet_winglets', 'Winglet Retrofit', 'winglets', 'Meridian Aero', 600_000, 300, { ...JET, bodyStyles: ['light_jet', 'midsize_jet', 'super_midsize_jet', 'large_jet'] }, { rangeKm: 350, efficiency: -6, valueRecovery: 0.5 }, { insurance: true }, 'Less drag at the tips, more range at the end of the day, and a shape people notice on the ramp.'),
  part('jet_aux_tank', 'Auxiliary Fuel Tank', 'power', 'Meridian Aero', 550_000, 300, { ...JET, bodyStyles: ['midsize_jet', 'super_midsize_jet', 'large_jet', 'long_range_jet'] }, { rangeKm: 700, valueRecovery: 0.45 }, { insurance: true }, 'Range at the cost of baggage space and a supplemental type certificate.'),
  part('jet_engine_program', 'Engine Maintenance Program Enrolment', 'engine', 'Halton Aero', 900_000, 8, JET, { valueRecovery: 0.85, condition: 4 }, { insurance: true }, 'The engines are covered by the hour from now on. A jet not on a program sells for a great deal less.'),
  part('jet_tracker', 'Flight Data And Tracking Suite', 'tracking', 'ClearGuard', 45_000, 16, JET, { valueRecovery: 0.3 }, { insurance: true }, 'Where the airplane is, what the crew did with it, and what the engines saw.'),
]);

// ---------------------------------------------------------------------------
// Fitment validation
// ---------------------------------------------------------------------------

export interface FitmentSubject {
  kind: VehicleKind;
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
 * catalog.
 */
export function checkFitment(part: Part, subject: FitmentSubject): FitmentVerdict {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const f = part.fitment;

  const model = VEHICLE_MODELS.get(subject.modelId);
  const makeId = model?.parentId ?? subject.make;

  if (!(f.kinds ?? ['car']).includes(subject.kind)) {
    reasons.push(`${part.name} is made for ${(f.kinds ?? ['car']).map((k) => KIND_PROFILE[k].plural.toLowerCase()).join(' and ')}, not a ${KIND_PROFILE[subject.kind].label.toLowerCase()}.`);
  }
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

/** Parts that could fit a given vehicle, for the modification catalog UI. */
export function partsFor(subject: FitmentSubject, category?: PartCategory): Part[] {
  return PARTS.all()
    .filter((p) => (!category || p.category === category))
    .filter((p) => {
      const f = p.fitment;
      const makeId = VEHICLE_MODELS.get(subject.modelId)?.parentId ?? subject.make;
      if (!(f.kinds ?? ['car']).includes(subject.kind)) return false;
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

/** What kind of thing a catalog model is. Anything unknown is a car. */
export function kindOf(modelId: string): VehicleKind {
  return VEHICLE_MODELS.get(modelId)?.kind ?? 'car';
}

/** A short reading of a body style for a screen: 'Center Console', 'Long Range Jet'. */
export function bodyStyleLabel(style: string): string {
  return style.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
