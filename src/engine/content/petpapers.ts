/**
 * SLATE — what a pet's papers for going abroad cost (from 2026-10-04), from
 * `docs/research/world/research-pet-papers.json`, read that day.
 *
 * - **A microchip** at a named clinic where one was read: Petco Vetco in New
 *   York and Los Angeles ($41) and North Haven for New Haven ($40), before tax;
 *   Donnybrook Vets in Dublin (€40); Ontario Spay and Neuter in Toronto (CAD
 *   30); Killarney Animal Hospital in Vancouver (CAD 46); Petzer's at-home
 *   chipping in Mexico City (MXN 2,344). England has asked a dog's chip since
 *   2016 and a cat's since June 2024, and Ireland a dog's since 2016, so a pet
 *   adopted there comes chipped and London keeps no price.
 * - **A health certificate**: the vet's own where read: London Vet Clinic's
 *   animal health certificate, £232 for the first pet and £75 each more;
 *   Donnybrook's EU pet passport, €90, good into Ireland and Britain while it's held rather than for one trip; the Hospital Veterinario de la CDMX's,
 *   MXN 89 (secondhand). Where no vet's fee was published (New York, Los
 *   Angeles, New Haven, Toronto, Vancouver), it's the town's named vet visit
 *   (`VET_YEAR`), SLATE's estimate, since a certificate is an examination.
 *   On top, the government's endorsement: USDA APHIS's $101 for a certificate
 *   without lab tests, any number of pets (verified); the CFIA's CAD 22 a form
 *   (secondhand: the CFIA's own page says an officer works it out).
 * - **A tapeworm treatment** by a vet, as Britain and Ireland ask: no named
 *   vet's price was read, so the town's vet visit, SLATE's estimate.
 * - **The CDC Dog Import Form**: nothing charged that was read; the CDC's own
 *   page doesn't say.
 * - **On arrival**: London's Heathrow Animal Reception Centre, £213 with its
 *   pre-check and £55 each more pet, for a pet arriving in the hold (verified);
 *   Canada's inspection, CAD 36.95 and 6.16 each more, not from America
 *   (verified). Mexico's SENASICA certificate is free for one or two pets
 *   (secondhand); from three it's charged at a price not read.
 */

/** A microchip, by town. */
export const CHIP_PRICE: Readonly<Record<string, { price: number; currency: string; clinic: string; plusTax?: true }>> = {
  'us-ny-newyork': { price: 41, currency: 'USD', clinic: 'Petco Vetco Turtle Bay', plusTax: true },
  'us-ca-losangeles': { price: 41, currency: 'USD', clinic: 'Petco Vetco, West Centinela Avenue', plusTax: true },
  'us-ct-newhaven': { price: 40, currency: 'USD', clinic: 'Petco Vetco North Haven', plusTax: true },
  'ie-lei-dublin': { price: 40, currency: 'EUR', clinic: 'Donnybrook Vets' },
  'ca-on-toronto': { price: 30, currency: 'CAD', clinic: 'Ontario Spay and Neuter' },
  'ca-bc-vancouver': { price: 46, currency: 'CAD', clinic: 'Killarney Animal Hospital' },
  'mx-cmx-mexicocity': { price: 2_344, currency: 'MXN', clinic: 'Petzer, at home' },
};

/** Where a pet must be chipped by law, by species: it comes chipped from a shelter there. */
export const CHIP_LAW: Readonly<Record<string, readonly ('dog' | 'cat')[]>> = { 'uk-eng': ['dog', 'cat'], ie: ['dog'] };

/**
 * A vet's own health certificate, by town (the vets named above): the first pet, and each more; where none, the town's
 * vet visit stands. Until 2026-10-04 each row also named its vet, and nothing read it.
 */
export const CERTIFICATE_FEE: Readonly<Record<string, { first: number; more: number; currency: string }>> = {
  'uk-eng-london': { first: 232, more: 75, currency: 'GBP' },
  'ie-lei-dublin': { first: 90, more: 90, currency: 'EUR' },
  'mx-cmx-mexicocity': { first: 89, more: 89, currency: 'MXN' },
};

/** A government's endorsement of a certificate (USDA APHIS's, the CFIA's), by the country it's issued in: once for any number of pets, or a form each. */
export const ENDORSEMENT: Readonly<Record<string, { fee: number; currency: string; each: boolean }>> = {
  us: { fee: 101, currency: 'USD', each: false },
  ca: { fee: 22, currency: 'CAD', each: true },
};

/**
 * A fee on arriving with pets (the Heathrow Animal Reception Centre's, the Canada Border Services Agency's), by the town
 * or country arrived in: the first pet and each more, and where it's waived from. Until 2026-10-04 each row also named
 * who charges it, and London's said its pets come in the hold; nothing read either.
 */
export const ARRIVAL_FEE: Readonly<Record<string, { first: number; more: number; currency: string; notFrom?: readonly string[] }>> = {
  'uk-eng-london': { first: 213, more: 55, currency: 'GBP' },
  ca: { first: 36.95, more: 6.16, currency: 'CAD', notFrom: ['us'] },
};
