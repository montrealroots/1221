/**
 * SLATE — what a country asks of a dog or cat coming in (from 2026-10-04),
 * from `docs/research/world/research-pet-care.json`'s entry rules, read
 * 2026-10-03:
 *
 * - **Great Britain** (gov.uk, verified): a microchip before the rabies
 *   vaccination, the vaccination at least 21 full days before travel, a pet
 *   health document, and a dog's tapeworm treatment 24 hours to 5 days before
 *   arrival. A pet other than an assistance dog doesn't arrive in a cabin
 *   (secondhand): it comes in the hold, on an approved route.
 * - **Ireland** (gov.ie, read secondhand): a microchip, a valid rabies
 *   vaccination, an EU health certificate, and a dog's tapeworm treatment by a
 *   vet 24 to 120 hours before arrival.
 * - **America** (the CDC, from 2024-08-01, verified): a dog microchipped, at
 *   least six months old, with the CDC Dog Import Form's receipt, good six
 *   months. Nothing of a cat.
 * - **Canada** (the CFIA, secondhand): a rabies certificate for a dog or cat
 *   three months or older; an inspection fee except from America.
 * - **Mexico** (SENASICA, verified): inspection on arrival; from Canada
 *   nothing more; from America a dog's screwworm paper from an accredited vet
 *   within 5 days; from elsewhere a health certificate within 15 days showing
 *   rabies and deworming.
 *
 * A health certificate's days are the ones each asks; Britain's and Ireland's
 * are the EU's ten days from issue to arrival, which gov.uk gives for an
 * animal health certificate. A SLATE pet is an adult, so every age rule is met.
 */

export type Paper = 'microchip' | 'rabies' | 'certificate' | 'tapeworm' | 'importForm';

export interface EntryRule {
  /** What each species needs, by paper. */
  needs: Readonly<Record<'dog' | 'cat', readonly Paper[]>>;
  /** The least days between the rabies vaccination and arrival. */
  rabiesDays?: number;
  /** The most days between a health certificate's issue and arrival. */
  certificateDays?: number;
  /** A tapeworm treatment's window before arrival, hours. */
  tapewormHours?: readonly [number, number];
  /** An import form's life, days. */
  formDays?: number;
  /** No pet arrives in the cabin. */
  noCabin?: true;
  /** Countries a pet comes from with nothing asked. */
  freeFrom?: readonly string[];
  /** A country's own rule for pets from one country, in place of its own. */
  from?: Readonly<Record<string, Omit<EntryRule, 'from'>>>;
}

export const PET_ENTRY: Readonly<Record<string, EntryRule>> = {
  uk: { needs: { dog: ['microchip', 'rabies', 'certificate', 'tapeworm'], cat: ['microchip', 'rabies', 'certificate'] }, rabiesDays: 21, certificateDays: 10, tapewormHours: [24, 120], noCabin: true },
  ie: { needs: { dog: ['microchip', 'rabies', 'certificate', 'tapeworm'], cat: ['microchip', 'rabies', 'certificate'] }, certificateDays: 10, tapewormHours: [24, 120] },
  us: { needs: { dog: ['microchip', 'importForm'], cat: [] }, formDays: 182 },
  ca: { needs: { dog: ['rabies'], cat: ['rabies'] } },
  mx: {
    needs: { dog: ['rabies', 'certificate'], cat: ['rabies', 'certificate'] }, certificateDays: 15,
    freeFrom: ['ca'],
    from: { us: { needs: { dog: ['certificate'], cat: [] }, certificateDays: 5 } },
  },
};

export const PAPER_LABEL: Readonly<Record<Paper, string>> = {
  microchip: 'A Microchip', rabies: 'A Rabies Vaccination', certificate: 'A Health Certificate', tapeworm: 'A Tapeworm Treatment', importForm: 'The CDC Dog Import Form',
};
