/**
 * SLATE — replacing a lost or stolen driving license (the master plan's
 * §49k, from 2026-10-02), from `docs/research/world/research-replacements.json`,
 * each from its issuing authority's own pages, read 2026-10-02.
 *
 * The fee, how long the new card takes, and whether the holder may drive
 * meanwhile: on an interim or temporary document where one is issued (New
 * York, Connecticut, Ontario, British Columbia), on the record in Britain and
 * Ireland, where the right to drive is the record's, not the card's. In
 * California nothing interim is issued and the law (Vehicle Code §12951)
 * asks the license in hand, so a Californian waits for the card. Mexico City
 * prints it at the appointment. Ireland asks a Garda declaration first, and
 * Mexico City an acta from a Juzgado Cívico; both are free, and taken as part
 * of applying.
 */

export interface Replacement {
  fee: number; currency: string; days: number; driveMeanwhile: boolean; first?: string; source: string;
  /**
   * Replaced by mail to an address outside the issuing state, for a holder living elsewhere (from 2026-10-10,
   * `docs/research/world/research-coverage-gaps.json`): New York's form MV-44 by mail takes a temporary address,
   * where its online service mails only to the address on record. Where this is absent, SLATE found no way to have it
   * sent out of state, and says so.
   */
  byMail?: { form: string; source: string };
}

export const LICENSE_REPLACEMENT: Readonly<Record<string, Replacement>> = {
  'us-ny': { fee: 17.5, currency: 'USD', days: 21, driveMeanwhile: true, source: 'https://dmv.ny.gov/driver-license/replace-a-license-or-permit', byMail: { form: 'MV-44', source: 'https://dmv.ny.gov/driver-license/replace-a-license-or-permit' } },
  'us-ca': { fee: 37, currency: 'USD', days: 28, driveMeanwhile: false, source: 'https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/replace-your-driver-license-or-identification-dl-id-card/' },
  'us-ct': { fee: 30, currency: 'USD', days: 30, driveMeanwhile: true, source: 'https://portal.ct.gov/dmv/licenses-permits-ids/request-duplicate-driver-license' },
  'ca-on': { fee: 35.75, currency: 'CAD', days: 42, driveMeanwhile: true, source: 'https://www.ontario.ca/page/replace-drivers-licence' },
  'ca-bc': { fee: 17, currency: 'CAD', days: 14, driveMeanwhile: true, source: 'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/334_91' },
  'mx-cmx': { fee: 1_142, currency: 'MXN', days: 0, driveMeanwhile: true, first: 'an acta from a Juzgado Cívico for a loss, or a denuncia for a theft', source: 'https://cdmxassets.s3.us-east-1.amazonaws.com/media/files-pdf/control-vehicular/2026/CONT_VEH_CV_2026.pdf' },
  gb: { fee: 20, currency: 'GBP', days: 7, driveMeanwhile: true, source: 'https://www.gov.uk/apply-online-to-replace-a-driving-licence' },
  ie: { fee: 35, currency: 'EUR', days: 14, driveMeanwhile: true, first: 'a Garda declaration', source: 'https://www.citizensinformation.ie/en/travel-and-recreation/motoring/driver-licensing/replacing-a-lost-or-stolen-irish-driving-licence/' },
};

/**
 * Replacing a lost or stolen ID card (from later on 2026-10-02;
 * `docs/research/world/research-id-replace.json`, each issuer's own page): New
 * York's Non-Driver ID, $8 or $6.50 from 62, allow three weeks; Connecticut's,
 * $30, within 30 days; California's, $40, free from 62, three to four weeks;
 * Ontario's Photo Card, $10, four to six weeks; British Columbia's BCID, $15,
 * its time not stated, so the license's two weeks there, SLATE's reading;
 * Mexico's INE, free, a month; Ireland's passport card, €35, ten working
 * days. The later end of a range is taken. Nothing interim stands in for
 * the card as a photo ID meanwhile.
 */
export interface IdCardReplacement { fee: number; seniorFee?: number; seniorFrom?: number; currency: string; days: number; daysRead: boolean; source: string }
export const ID_CARD_REPLACEMENT: Readonly<Record<string, IdCardReplacement>> = {
  'us-ny': { fee: 8, seniorFee: 6.5, seniorFrom: 62, currency: 'USD', days: 21, daysRead: true, source: 'https://dmv.ny.gov/non-driver-id/replace-a-non-driver-id' },
  'us-ct': { fee: 30, currency: 'USD', days: 30, daysRead: true, source: 'https://portal.ct.gov/dmv/licenses-permits-ids/request-duplicate-non-driver-id' },
  'us-ca': { fee: 40, seniorFee: 0, seniorFrom: 62, currency: 'USD', days: 28, daysRead: true, source: 'https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/replace-your-driver-license-or-identification-dl-id-card' },
  'ca-on': { fee: 10, currency: 'CAD', days: 42, daysRead: true, source: 'https://www.ontario.ca/page/ontario-photo-card' },
  'ca-bc': { fee: 15, currency: 'CAD', days: 14, daysRead: false, source: 'https://www.icbc.com/driver-licensing/visit-dl-office/Fees' },
  'mx-cmx': { fee: 0, currency: 'MXN', days: 30, daysRead: true, source: 'https://www.gob.mx/public/tramites/detalleTramite.xhtml?homoclave=INE-2023-1790-002-D' },
  ie: { fee: 35, currency: 'EUR', days: 14, daysRead: true, source: 'https://www.ireland.ie/en/dfa/passports/passport-fees/' },
};

