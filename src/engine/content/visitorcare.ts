/**
 * SLATE — what a visitor from another country pays for care, where SLATE
 * keeps it (Stage 9 of `docs/BACKLOG.md`, from 2026-10-02; `docs/DATA-GAPS.md`).
 * A hospital's own published charges for patients from abroad, each read by
 * hand on 2026-10-02:
 *
 * - **Ontario:** Michael Garron Hospital (Toronto East Health Network): an
 *   emergency visit C$1,025 with the physician's fee, a day on a standard
 *   ward C$3,100. Ontario publishes no standard price for a walk-in visit
 *   for somebody uninsured, and a doctor's visit isn't kept.
 * - **British Columbia:** Providence Health Care's non-resident rates from 1
 *   November 2025, an emergency C$1,015 and a day on a standard ward C$8,359
 *   (a search's summary: the page refuses a read); a doctor's visit at Doctors
 *   of BC's recommended uninsured fee, C$167.
 * - **Ireland:** St Vincent's University Hospital, Dublin, for patients from
 *   outside the EU: an emergency €300, a night €1,210; a GP privately, €55. A
 *   British resident is treated as resident under the Common Travel Area: the
 *   emergency department's €100 and nothing for a stay.
 * - **Mexico:** what the IMSS charges somebody without rights to it
 *   (`content/imsscosts.ts`).
 *
 * A Canadian in another province is covered by their own, and keeps it.
 */

import { IMSS_NON_MEMBER } from './imsscosts';

export interface VisitorPrices { currency: string; visit?: number; urgent?: number; emergency: number; stayDay: number }

export const VISITOR_CARE: Readonly<Record<string, VisitorPrices>> = {
  'ca-08': { currency: 'CAD', emergency: 1_025, stayDay: 3_100 },
  'ca-02': { currency: 'CAD', visit: 167, urgent: 167, emergency: 1_015, stayDay: 8_359 },
  ie: { currency: 'EUR', visit: 55, urgent: 55, emergency: 300, stayDay: 1_210 },
  mx: { currency: 'MXN', visit: IMSS_NON_MEMBER.visit, urgent: IMSS_NON_MEMBER.visit, emergency: IMSS_NON_MEMBER.emergency, stayDay: IMSS_NON_MEMBER.stayDay },
};

/** A British resident in Ireland, under the Common Travel Area: the resident's charges. */
export const IRELAND_CTA: VisitorPrices = { currency: 'EUR', visit: 55, urgent: 75, emergency: 100, stayDay: 0 };
