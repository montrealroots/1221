/**
 * SLATE — a car's model year, body, transmission and drivetrain, as far as its
 * maker's own page states them (the master plan's §36a, from 2026-10-03;
 * `docs/research/world/research-vehicles-deeper.json`). They identify the car
 * and filter the catalog; they change nothing it does, no rule SLATE keeps
 * reading any of them. What a page didn't state is left out, and a model whose
 * maker's page refused the read has none.
 */

export interface CarSpecDetail { year?: number; body?: string; transmission?: string; drivetrain?: string }

export const CAR_DETAILS: Readonly<Record<string, CarSpecDetail>> = {
  'us-honda-cr-v': { year: 2027, body: 'Compact SUV', transmission: 'CVT', drivetrain: 'FWD Or AWD' },
  'us-toyota-rav4': { year: 2026, body: 'Compact SUV', transmission: 'CVT', drivetrain: 'FWD Or AWD' },
  'ca-nissan-rogue': { year: 2026, drivetrain: 'AWD' },
  'ca-hyundai-tucson': { year: 2026, drivetrain: 'AWD' },
  'mx-nissan-versa': { year: 2026, body: 'Sedan', transmission: 'Manual Or CVT' },
  'gb-ford-puma': { body: 'Compact Crossover', transmission: 'Manual' },
  'gb-volkswagen-golf': { body: 'Hatchback', transmission: 'Manual Or DSG' },
  'ie-toyota-corolla': { body: 'Hatchback' },
};
