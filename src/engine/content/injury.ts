/**
 * SLATE — how often a body is hurt, doing what, how long it takes to mend,
 * and who pays when it happened at work (`systems/injury.ts`).
 *
 * Rates are injuries a thousand hours of the thing, or a year for everyday
 * life:
 *
 * - A run: 7.7 for a recreational runner (Videbæk et al., Sports Med 2015).
 *   A gym or a workout at home: weight training's 0.24 to 1 (Keogh & Winwood,
 *   Sports Med 2017), SLATE taking the middle. A swim: collegiate swimmers'
 *   3.04 (Res Sports Med 2013), the most a recreational swimmer meets.
 * - The stage: performing arts workers lose 1.6 cases a hundred full-time
 *   workers a year to days away (BLS SOII, 2024), 0.8 a thousand hours; a part
 *   that dances, sings or fights, professional dancers' 1.2 time-loss
 *   injuries a thousand hours (Mattiussi et al., BJSM 2021).
 * - The screen: film and video production's 0.2 a hundred a year, 0.1 a
 *   thousand hours; a part that fights or does its stunts, the stage's
 *   performing rate, SLATE's estimate, since no rate for stunts is published
 *   (80% of stunt performers report a head impact or whiplash in a career,
 *   Senn et al., JOEM 2023).
 * - Everyday life: medically consulted injuries at 18 to 44, a thousand a
 *   year, by cause (NHIS 2014, Table P-6a): falls 26.11, struck 10.20,
 *   overexertion 13.72, cuts 15.20, other 28.95; transport's 12.75 left out,
 *   since until 2026-09-29 SLATE's lives didn't drive. A driver's crash is
 *   drawn by the mile since (`systems/driving.ts`).
 *
 * What each is, and how long it keeps them from what: a hamstring or other
 * strain by its grade's days absent (Ekstrand et al., BJSM 2012: 17, 22 and
 * 73); a back strain's six weeks to mostly mend (Costa et al., CMAJ 2012); a
 * sprain at the AAFP's 5 to 10 days of support (2025); a broken wrist's 4 to 6
 * weeks in a cast and an ankle's 6 to 12 (AAOS); a concussion's about 14 days
 * (Amsterdam consensus, BJSM 2023); a cut, a few. Which one a cause brings,
 * and which keep a performer off work, are SLATE's estimates.
 */

export type InjuryKind = 'strain' | 'back' | 'sprain' | 'fracture' | 'concussion' | 'cut' | 'bruise';

/**
 * What each limits while it mends (from 2026-10-10): `body`, training and the work's physical dimensions (the
 * evaluation's `injury` condition); `mind`, a concussion's, every dimension of the work as well, since its symptoms
 * are thinking, memory and balance (Patricios et al., Amsterdam consensus, BJSM 2023); `none`, neither, a cut or a
 * knock, which already didn't stop a workout. Until 2026-10-10 any injury at all took the same from the body's
 * dimensions, a cut finger's as much as a broken ankle's. Which kind limits what is SLATE's reading.
 */
export type InjuryLimits = 'body' | 'mind' | 'none';

export const INJURY_KIND: Readonly<Record<InjuryKind, { label: string; days: readonly [number, number]; offWork: boolean; care: 'visit' | 'urgent' | 'emergency'; therapy: number; limits: InjuryLimits }>> = {
  strain: { label: 'A Pulled Muscle', days: [17, 22], offWork: false, care: 'urgent', therapy: 2, limits: 'body' },
  back: { label: 'A Back Strain', days: [28, 42], offWork: false, care: 'visit', therapy: 4, limits: 'body' },
  sprain: { label: 'A Sprained Ankle', days: [5, 10], offWork: false, care: 'urgent', therapy: 2, limits: 'body' },
  fracture: { label: 'A Broken Bone', days: [42, 84], offWork: true, care: 'emergency', therapy: 6, limits: 'body' },
  concussion: { label: 'A Concussion', days: [10, 14], offWork: true, care: 'emergency', therapy: 0, limits: 'mind' },
  cut: { label: 'A Deep Cut', days: [3, 7], offWork: false, care: 'urgent', therapy: 0, limits: 'none' },
  bruise: { label: 'A Bad Knock', days: [3, 7], offWork: false, care: 'visit', therapy: 0, limits: 'none' },
};

/** What each source brings, by share: SLATE's estimate of the mix, from what each study says is most common. */
export const INJURY_MIX: Readonly<Record<'run' | 'gym' | 'swim' | 'stage' | 'screen' | 'fall' | 'struck' | 'overexertion' | 'cutting' | 'other' | 'crash', readonly (readonly [InjuryKind, number])[]>> = {
  // A crash: whiplash is a neck strain, the knocks, the breaks and the concussions.
  crash: [['bruise', 0.35], ['strain', 0.3], ['fracture', 0.15], ['concussion', 0.1], ['cut', 0.1]],
  run: [['strain', 0.5], ['sprain', 0.4], ['fracture', 0.1]],
  gym: [['strain', 0.5], ['back', 0.4], ['sprain', 0.1]],
  swim: [['strain', 0.9], ['back', 0.1]],
  stage: [['sprain', 0.45], ['strain', 0.3], ['back', 0.15], ['concussion', 0.05], ['fracture', 0.05]],
  screen: [['sprain', 0.35], ['strain', 0.25], ['bruise', 0.2], ['concussion', 0.1], ['fracture', 0.1]],
  fall: [['sprain', 0.45], ['bruise', 0.3], ['fracture', 0.2], ['concussion', 0.05]],
  struck: [['bruise', 0.8], ['concussion', 0.1], ['fracture', 0.1]],
  overexertion: [['back', 0.6], ['strain', 0.4]],
  cutting: [['cut', 1]],
  other: [['bruise', 0.5], ['sprain', 0.3], ['strain', 0.2]],
};

export const INJURY = {
  perThousandHours: { run: 7.7, gym: (0.24 + 1) / 2, swim: 3.04, stage: 1.6 / 2, stageDemanding: 1.2, screen: 0.2 / 2, screenDemanding: 1.6 / 2 },
  everydayYearly: { fall: 26.11, struck: 10.2, overexertion: 13.72, cutting: 15.2, other: 28.95 },
  /** While hurt: what it weighs on the mood and the stress each day, SLATE's estimate. (This promised a fitter body's spared risk too, until 2026-10-10; nothing ever spared it.) */
  weighs: { morale: 1, stress: 1 },
  source: 'Videbæk et al. 2015; Keogh & Winwood 2017; Res Sports Med 2013; https://www.bls.gov/web/osh/table-1-industry-rates-national.htm; Mattiussi et al. 2021; https://ftp.cdc.gov/pub/Health_Statistics/NCHS/NHIS/SHS/2014_SHS_Table_P-6.pdf; Ekstrand et al. 2012; AAOS OrthoInfo; AAFP 2025',
} as const;

/**
 * Workers' compensation for an injury at work, which Equity's rulebooks and
 * SAG-AFTRA's employers of record carry: the care, and two-thirds of the
 * average week's wage for the days off work, between the state's minimum and
 * maximum. New York from 1 July 2026, $384.45 to $1,281.50 (WCB Subject No.
 * 046-1805); California from 1 January 2026, $264.61 to $1,764.11 (DIR
 * 2025-116). The first week in New York, three days in California, aren't
 * paid unless the time off runs past fourteen days (NY WCL §15(11); Cal.
 * Labor Code §4652). Elsewhere a production's own cover, SLATE takes New
 * York's.
 */
export const WORKERS_COMP = {
  share: 2 / 3,
  states: {
    'us-ny': { min: 384_45, max: 1_281_50, waitingDays: 7 },
    'us-ca': { min: 264_61, max: 1_764_11, waitingDays: 3 },
  } as Readonly<Record<string, { min: number; max: number; waitingDays: number }>>,
  retroAfterDays: 14,
  source: 'https://www.wcb.ny.gov/content/main/SubjectNos/sn046_1805.jsp; https://dir.ca.gov/DIRNews/2025/2025-116.html; Equity rulebooks (Workers’ Compensation); https://www.sagaftraplans.org/health/faq/if-i-am-injured-set-will-plan-pay-my-medical-expenses',
} as const;
