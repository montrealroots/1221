/**
 * SLATE — permission to work as an actor where one isn't a citizen, apart
 * from permission to enter (`content/entry.ts`). Researched 2026-09-29 from
 * USCIS, gov.uk and IRCC, and kept with its sources in
 * `docs/research/world/research-workpermission.json`. A figure the research
 * couldn't find is SLATE's estimate and says so.
 *
 * - **The United States.** An F-1 student works off campus only on
 *   Curricular Practical Training the school authorizes, which Yale's
 *   program doesn't build in, so not at all while studying. After the
 *   degree, post-completion OPT: Form I-765, filed from 90 days before the
 *   program's end to 60 days after it, twelve months from the later of
 *   the end and the approval, with no more than 90 days unemployed in all;
 *   acting is the MFA's field, and it isn't tied to one employer. Then O-1B,
 *   extraordinary achievement in motion pictures and television: a US
 *   employer or agent petitions on Form I-129 with the peer group's advisory
 *   opinion, and USCIS approves on at least three of the six kinds of
 *   evidence in 8 CFR 214.2(o)(3)(v)(B), for up to three years, extended a
 *   year at a time.
 * - **The United Kingdom.** An actor employed by an overseas company filming
 *   a production made and financed overseas may do it as a visitor
 *   (Appendix Visitor: Permitted Activities), which is what a SLATE location
 *   shoot is: the entry rule is the whole of it.
 * - **Canada.** A film or television production needs a work permit, not
 *   the performing artists' exemption: code C14, significant benefit
 *   (R205(a)), tied to the production. A US citizen applies at the port of
 *   entry on arrival; anyone else applies before traveling, with
 *   biometrics.
 * - **Free rights.** An Irish citizen works in the UK under the Common
 *   Travel Area, and an EU or EEA citizen within the EU and EEA. No
 *   citizenship but the host's works freely in the US or Canada: CUSMA's
 *   professions list has no actors.
 */

export const WORK_RULES = {
  opt: {
    form: 'Form I-765, (c)(3)(B)',
    fee: 470,
    feeBasis: 'Filed online; $520 on paper (USCIS G-1055, 09/09/26).',
    premiumFee: 1_780,
    /** Premium processing's clock, in business days, for OPT since the 2024 fee rule. */
    premiumBusinessDays: 30,
    /** USCIS publishes no standard time for it: SLATE's estimate. */
    standardDays: 90,
    windowBeforeDays: 90,
    windowAfterDays: 60,
    months: 12,
    unemploymentDays: 90,
    /**
     * The hours a week a job must average to be employment on OPT (from 2026-10-22, the owner's brief 22): SEVP Policy
     * Guidance 1004-03 (2010-04-23), 7.1.5, "at least 20 hours per week", and DHS's Study in the States page (updated
     * 2025-05-19), "at least 20 hours per week or full-time" (docs/verification/career-genre-2026-10-22/authorization-sources.md).
     */
    weeklyHours: 20,
    currency: 'USD',
    source: 'https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students; https://www.uscis.gov/g-1055',
  },
  o1: {
    form: 'Form I-129, O-1B',
    fee: 1_055,
    /** The Asylum Program Fee the petitioner pays beside it. */
    asylumFee: 600,
    /** SAG-AFTRA's advisory opinion from 1 May 2026, as reported: its own page couldn't be read. */
    opinionFee: 300,
    premiumFee: 2_965,
    premiumBusinessDays: 15,
    /** USCIS publishes no standard time for it: SLATE's estimate. */
    standardDays: 90,
    /** Days the peer group's opinion takes: SLATE's estimate. */
    opinionDays: 15,
    years: 3,
    extensionYears: 1,
    /** Of the six kinds of evidence, how many USCIS asks. */
    criteriaNeeded: 3,
    currency: 'USD',
    source: 'https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement; https://www.uscis.gov/g-1055; 8 CFR 214.2(o)',
  },
  caC14: {
    name: 'Work Permit (C14)',
    fee: 155,
    biometricsFee: 85,
    /** IRCC's time varies by the country applied from, and wasn't published as one figure: SLATE's estimate. */
    standardDays: 30,
    currency: 'CAD',
    source: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/hire-temporary-foreign/international-mobility-program/work-permit/exemption-codes/significant-benefit-film-television.html',
  },
} as const;
