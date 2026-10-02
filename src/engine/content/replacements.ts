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

export interface Replacement { fee: number; currency: string; days: number; driveMeanwhile: boolean; first?: string; source: string }

export const LICENSE_REPLACEMENT: Readonly<Record<string, Replacement>> = {
  'us-ny': { fee: 17.5, currency: 'USD', days: 21, driveMeanwhile: true, source: 'https://dmv.ny.gov/driver-license/replace-a-license-or-permit' },
  'us-ca': { fee: 37, currency: 'USD', days: 28, driveMeanwhile: false, source: 'https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/replace-your-driver-license-or-identification-dl-id-card/' },
  'us-ct': { fee: 30, currency: 'USD', days: 30, driveMeanwhile: true, source: 'https://portal.ct.gov/dmv/licenses-permits-ids/request-duplicate-driver-license' },
  'ca-on': { fee: 35.75, currency: 'CAD', days: 42, driveMeanwhile: true, source: 'https://www.ontario.ca/page/replace-drivers-licence' },
  'ca-bc': { fee: 17, currency: 'CAD', days: 14, driveMeanwhile: true, source: 'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/334_91' },
  'mx-cmx': { fee: 1_142, currency: 'MXN', days: 0, driveMeanwhile: true, first: 'an acta from a Juzgado Cívico for a loss, or a denuncia for a theft', source: 'https://cdmxassets.s3.us-east-1.amazonaws.com/media/files-pdf/control-vehicular/2026/CONT_VEH_CV_2026.pdf' },
  gb: { fee: 20, currency: 'GBP', days: 7, driveMeanwhile: true, source: 'https://www.gov.uk/apply-online-to-replace-a-driving-licence' },
  ie: { fee: 35, currency: 'EUR', days: 14, driveMeanwhile: true, first: 'a Garda declaration', source: 'https://www.citizensinformation.ie/en/travel-and-recreation/motoring/driver-licensing/replacing-a-lost-or-stolen-irish-driving-licence/' },
};
