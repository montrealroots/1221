/**
 * The big tests, the grade in the country's own scale, and the report that
 * comes home.
 *
 * Almost every country puts its young people through a small number of
 * examinations that decide what happens to them next, and the names of those
 * examinations are public record: the SAT and the ACT, the Gaokao, the
 * Suneung, ENEM, the EGE, the Leaving Certificate, NAPLAN, the Regents. This
 * file carries them as published: what each is called, who sits it, at what
 * age, in which month, and on what scale it is scored.
 *
 * What is SLATE's own is everything about performance: how a mark at school
 * turns into a score, what studying is worth, what nerve does on the day, and
 * every teacher's comment on every report card. None of that is anybody's
 * published methodology and the room says so.
 */

import type { Money } from '../core/money';

export const EXAM_NOTE =
  'The tests are real and so are their scales: the SAT is out of 1600, the ACT out of 36, the Gaokao '
  + 'out of 750, the Suneung on its nine grade bands, ENEM out of 1000 on each area, the Baccalauréat '
  + 'out of 20. What SLATE carries is the name, who sits it, roughly when in the year, and the range a '
  + 'score falls in. How a particular character scores is SLATE’s own arithmetic on their marks, '
  + 'their preparation and their nerve, and it isn’t a prediction about anybody real.';

export const SITTING_NOTE =
  'A real examination calendar moves every year and several of these run on several dates a year. '
  + 'SLATE puts each one in a month it really runs in and offers it once a year, which is the shape '
  + 'of it rather than this year’s timetable. Fees are the order of the real fee at the time it '
  + 'was carried, converted into the game’s one currency and rounded.';

export const STATE_TEST_NOTE =
  'Every American state tests its schools every year and most call it something of their own. SLATE '
  + 'carries the name where it is confident of it and says "the state assessment" where it isn’t, '
  + 'rather than inventing an acronym. A state test decides nothing about a character’s future in '
  + 'this game, which is roughly what it decides in life; it’s on the calendar because it’s on the '
  + 'calendar.';

export const GRADE_NOTE =
  'A mark out of a hundred is SLATE’s internal number and no country reports one. What a report '
  + 'card shows is the country’s own scale: letters and a grade point average in America, nine '
  + 'down to one at GCSE, one to six in Germany where one is the good end, nought to twenty in France, '
  + 'one to ten in the Netherlands, one to five in Japan. The scales and their directions are real; '
  + 'where the boundaries sit is SLATE’s own calibration, because real boundaries move every year '
  + 'and differ by subject and by board.';

export const REPORT_NOTE =
  'A report card arrives at the end of a term and a progress report halfway through it, which is how '
  + 'most school years are actually shaped. Every comment on every report is written for this game. No '
  + 'teacher said any of it and none of it is drawn from any real school’s reporting.';

export const TERM_NOTE =
  'School years are shaped differently around the world and the shapes here are real: three terms in '
  + 'Britain and much of the Commonwealth, two semesters in America and Germany, four quarters in '
  + 'Japan and Korea, and a year that opens in April in Japan and in January south of the equator. '
  + 'Which week a term starts is SLATE’s own; which month it starts isn’t.';

export const PREP_NOTE =
  'Sitting down with a past paper is worth something and everybody knows it is. How much it’s worth '
  + 'here is SLATE’s calibration: preparation moves a score, it doesn’t replace the year of '
  + 'lessons behind it, and there’s a ceiling on how much of it does any good.';

// ---------------------------------------------------------------------------
// The tests themselves
// ---------------------------------------------------------------------------

/** What kind of thing a test is, which decides what it can do for you. */
export type TestKind = 'admissions' | 'practice' | 'national' | 'leaving' | 'entrance' | 'language';

export const TEST_KIND_LABEL: Readonly<Record<TestKind, string>> = {
  admissions: 'An Admissions Test',
  practice: 'A Practice Run',
  national: 'A National Assessment',
  leaving: 'A Leaving Examination',
  entrance: 'An Entrance Examination',
  language: 'A Language Test',
};

/** One scored part of a test paper. */
export interface Section {
  id: string;
  label: string;
  min: number;
  max: number;
  /** Which school subjects it reads, and how much of each. Shares sum to 1. */
  reads: readonly { subjectId: string; share: number }[];
}

export interface StandardTest {
  id: string;
  /** What it is really called. */
  name: string;
  /** The short form people actually say, where there is one. */
  shortName?: string;
  kind: TestKind;
  /** Countries where it is sat. Empty when it is a region's own. */
  countryIds: readonly string[];
  /** Regions where it is sat, for the tests a state or province sets. */
  regionIds?: readonly string[];
  /** The ages somebody sits it at. */
  fromAge: number;
  toAge: number;
  /** The month it runs in, 1 for January. */
  month: number;
  /** The whole scale, which is the sum of the sections where there are any. */
  min: number;
  max: number;
  sections: readonly Section[];
  /** What it costs to sit, where it costs anything. */
  fee: Money;
  /** How many times somebody may sit it again. */
  retakes: number;
  /** How long the results take to come back. */
  resultsAfterDays: number;
  about: string;
}

const sec = (
  id: string, label: string, min: number, max: number,
  reads: readonly { subjectId: string; share: number }[],
): Section => ({ id, label, min, max, reads });

/** Half of one subject and half of another, which most papers are. */
const half = (a: string, b: string) => [{ subjectId: a, share: 0.5 }, { subjectId: b, share: 0.5 }];
const whole = (a: string) => [{ subjectId: a, share: 1 }];
const third = (a: string, b: string, c: string) => [
  { subjectId: a, share: 0.34 }, { subjectId: b, share: 0.33 }, { subjectId: c, share: 0.33 },
];

/**
 * The examinations, as published.
 *
 * Every name, scale, age and month here is a matter of public record. What is
 * not public record, and is not claimed to be, is how any particular person
 * scores: that is SLATE's arithmetic on the year they have had.
 */
export const TESTS: readonly StandardTest[] = [
  // --- The United States ----------------------------------------------------
  {
    id: 'sat', name: 'The SAT', shortName: 'SAT', kind: 'admissions', countryIds: ['us'],
    fromAge: 15, toAge: 18, month: 3, min: 400, max: 1600, fee: 68_00, retakes: 4, resultsAfterDays: 13,
    sections: [
      sec('rw', 'Reading And Writing', 200, 800, half('language', 'history')),
      sec('math', 'Math', 200, 800, whole('mathematics')),
    ],
    about: 'Two sections of eight hundred each, digital and adaptive since 2024, and the number most American universities still ask for.',
  },
  {
    id: 'act', name: 'The ACT', shortName: 'ACT', kind: 'admissions', countryIds: ['us'],
    fromAge: 15, toAge: 18, month: 4, min: 1, max: 36, fee: 68_00, retakes: 4, resultsAfterDays: 14,
    sections: [
      sec('english', 'English', 1, 36, whole('language')),
      sec('math', 'Math', 1, 36, whole('mathematics')),
      sec('reading', 'Reading', 1, 36, half('language', 'history')),
      sec('science', 'Science', 1, 36, whole('science')),
    ],
    about: 'Four papers each scored one to thirty six and averaged into a composite, and accepted everywhere the SAT is.',
  },
  {
    id: 'psat_nmsqt', name: 'The PSAT/NMSQT', shortName: 'PSAT', kind: 'practice', countryIds: ['us'],
    fromAge: 15, toAge: 16, month: 10, min: 320, max: 1520, fee: 18_00, retakes: 1, resultsAfterDays: 30,
    sections: [
      sec('rw', 'Reading And Writing', 160, 760, half('language', 'history')),
      sec('math', 'Math', 160, 760, whole('mathematics')),
    ],
    about: 'The practice run for the SAT, sat in October, and in the junior year the qualifying test for a National Merit Scholarship.',
  },
  {
    id: 'psat_89', name: 'The PSAT 8/9', kind: 'practice', countryIds: ['us'],
    fromAge: 13, toAge: 14, month: 10, min: 240, max: 1440, fee: 14_00, retakes: 1, resultsAfterDays: 30,
    sections: [
      sec('rw', 'Reading And Writing', 120, 720, whole('language')),
      sec('math', 'Math', 120, 720, whole('mathematics')),
    ],
    about: 'The first of the practice tests, sat in eighth or ninth grade, and the first time anybody sees where they stand.',
  },
  {
    id: 'ap', name: 'An Advanced Placement Examination', shortName: 'AP', kind: 'admissions', countryIds: ['us'],
    fromAge: 15, toAge: 18, month: 5, min: 1, max: 5, fee: 99_00, retakes: 2, resultsAfterDays: 60,
    sections: [sec('paper', 'The Paper', 1, 5, third('language', 'history', 'science'))],
    about: 'A college course taught at school and examined in May on a scale of one to five, where a three is usually a pass and a five is what the selective places want.',
  },
  // --- Britain and Ireland --------------------------------------------------
  {
    id: 'ks2_sats', name: 'The Key Stage 2 Tests', shortName: 'SATs', kind: 'national', countryIds: ['uk'],
    fromAge: 10, toAge: 11, month: 5, min: 80, max: 120, fee: 0, retakes: 0, resultsAfterDays: 60,
    sections: [
      sec('reading', 'Reading', 80, 120, whole('language')),
      sec('maths', 'Mathematics', 80, 120, whole('mathematics')),
    ],
    about: 'Sat in the last week of primary school and reported as a scaled score where a hundred is the expected standard.',
  },
  {
    id: 'eleven_plus', name: 'The Eleven Plus', kind: 'entrance', countryIds: ['uk'],
    fromAge: 10, toAge: 11, month: 9, min: 69, max: 141, fee: 0, retakes: 0, resultsAfterDays: 30,
    sections: [sec('paper', 'The Paper', 69, 141, half('language', 'mathematics'))],
    about: 'Still sat in the parts of England that kept grammar schools, on a standardized score, and it decides which school you go to.',
  },
  {
    id: 'gcse_mocks', name: 'The GCSE Mocks', kind: 'practice', countryIds: ['uk'],
    fromAge: 15, toAge: 16, month: 11, min: 1, max: 9, fee: 0, retakes: 0, resultsAfterDays: 21,
    sections: [sec('paper', 'The Papers', 1, 9, third('language', 'mathematics', 'science'))],
    about: 'Sat in November of the year you sit the real thing, graded nine down to one like the real thing, and the basis of every predicted grade.',
  },
  {
    id: 'ucat', name: 'The University Clinical Aptitude Test', shortName: 'UCAT', kind: 'admissions', countryIds: ['uk'],
    fromAge: 17, toAge: 18, month: 7, min: 1200, max: 3600, fee: 90_00, retakes: 1, resultsAfterDays: 1,
    sections: [sec('paper', 'The Paper', 1200, 3600, half('science', 'mathematics'))],
    about: 'What a British medical school asks for on top of A Levels, sat in the summer before the application, with the result on the day.',
  },
  // --- Continental Europe ---------------------------------------------------
  {
    id: 'brevet', name: 'Le Diplôme National du Brevet', shortName: 'Le Brevet', kind: 'national',
    countryIds: ['fr'], fromAge: 14, toAge: 15, month: 6, min: 0, max: 800, fee: 0, retakes: 1,
    resultsAfterDays: 14,
    sections: [sec('paper', 'Les Épreuves', 0, 800, third('language', 'mathematics', 'history'))],
    about: 'The first French diploma, sat at the end of collège on eight hundred points, and the first line on anybody’s record.',
  },
  {
    id: 'evau', name: 'La Evaluación de Bachillerato para el Acceso a la Universidad', shortName: 'La EvAU',
    kind: 'admissions', countryIds: ['es'], fromAge: 17, toAge: 18, month: 6, min: 0, max: 14,
    fee: 90_00, retakes: 1, resultsAfterDays: 10,
    sections: [sec('paper', 'Las Pruebas', 0, 14, third('language', 'history', 'science'))],
    about: 'What everybody still calls Selectividad, marked out of ten with four more available on the optional papers, and the number a Spanish university offer is made on.',
  },
  {
    id: 'maturita', name: 'L’Esame di Stato', shortName: 'La Maturità', kind: 'leaving', countryIds: ['it'],
    fromAge: 18, toAge: 19, month: 6, min: 60, max: 100, fee: 0, retakes: 1, resultsAfterDays: 14,
    sections: [sec('paper', 'Le Prove', 60, 100, third('language', 'history', 'science'))],
    about: 'Two written papers and an oral in front of a commission, out of a hundred with sixty to pass and a lode above it.',
  },
  {
    id: 'doorstroomtoets', name: 'De Doorstroomtoets', kind: 'national', countryIds: ['nl'],
    fromAge: 11, toAge: 12, month: 2, min: 501, max: 550, fee: 0, retakes: 0, resultsAfterDays: 45,
    sections: [sec('paper', 'De Toets', 501, 550, half('language', 'mathematics'))],
    about: 'What everybody in the Netherlands still calls the Cito, sat at the end of primary school, and it points you at one kind of secondary school rather than another.',
  },
  {
    id: 'matura_pl', name: 'Egzamin Maturalny', shortName: 'Matura', kind: 'leaving', countryIds: ['pl'],
    fromAge: 18, toAge: 19, month: 5, min: 0, max: 100, fee: 0, retakes: 2, resultsAfterDays: 60,
    sections: [sec('paper', 'Arkusze', 0, 100, third('language', 'mathematics', 'foreign'))],
    about: 'Polish, mathematics and a foreign language compulsory, extended papers on top, and every percentage point is what a Polish university counts.',
  },
  {
    id: 'osmoklasisty', name: 'Egzamin Ósmoklasisty', kind: 'national', countryIds: ['pl'],
    fromAge: 14, toAge: 15, month: 5, min: 0, max: 100, fee: 0, retakes: 0, resultsAfterDays: 60,
    sections: [sec('paper', 'Arkusze', 0, 100, third('language', 'mathematics', 'foreign'))],
    about: 'Sat at the end of the eighth class and it decides which secondary school will take you, which in Poland matters a great deal.',
  },
  {
    id: 'hogskoleprovet', name: 'Högskoleprovet', kind: 'admissions', countryIds: ['se'],
    fromAge: 17, toAge: 60, month: 3, min: 0, max: 20, fee: 45_00, retakes: 8, resultsAfterDays: 35,
    sections: [
      sec('kvant', 'The Quantitative Part', 0, 20, whole('mathematics')),
      sec('verb', 'The Verbal Part', 0, 20, whole('language')),
    ],
    about: 'Sweden’s university aptitude test, scored nought to two on each part and normalized to a nought to two point nought quota score, and anybody may sit it as often as they like.',
  },
  {
    id: 'ege', name: 'Единый Государственный Экзамен', shortName: 'The EGE', kind: 'leaving',
    countryIds: ['ru'], fromAge: 17, toAge: 18, month: 6, min: 0, max: 100, fee: 0, retakes: 1,
    resultsAfterDays: 12,
    sections: [sec('paper', 'The Papers', 0, 100, third('language', 'mathematics', 'history'))],
    about: 'Russian and mathematics compulsory and the rest chosen, each paper out of a hundred, and it’s both the leaving certificate and the university application.',
  },
  {
    id: 'oge', name: 'Основной Государственный Экзамен', shortName: 'The OGE', kind: 'national',
    countryIds: ['ru'], fromAge: 14, toAge: 15, month: 6, min: 0, max: 5, fee: 0, retakes: 2,
    resultsAfterDays: 12,
    sections: [sec('paper', 'The Papers', 0, 5, half('language', 'mathematics'))],
    about: 'Sat at the end of the ninth class on the five point scale everybody grew up with, and it decides whether the tenth class is open to you.',
  },
  {
    id: 'yks', name: 'Yükseköğretim Kurumları Sınavı', shortName: 'YKS', kind: 'admissions',
    countryIds: ['tr'], fromAge: 17, toAge: 19, month: 6, min: 100, max: 500, fee: 25_00, retakes: 5,
    resultsAfterDays: 30,
    sections: [
      sec('tyt', 'Temel Yeterlilik Testi', 100, 500, half('language', 'mathematics')),
      sec('ayt', 'Alan Yeterlilik Testleri', 100, 500, third('mathematics', 'science', 'history')),
    ],
    about: 'A basic paper and then a field paper on the same weekend, and between them they rank every applicant in Turkey against every other.',
  },
  {
    id: 'lgs', name: 'Liselere Geçiş Sınavı', shortName: 'LGS', kind: 'entrance', countryIds: ['tr'],
    fromAge: 13, toAge: 14, month: 6, min: 100, max: 500, fee: 0, retakes: 0, resultsAfterDays: 21,
    sections: [sec('paper', 'The Paper', 100, 500, third('language', 'mathematics', 'science'))],
    about: 'Sat at the end of the eighth class for a place at a selective high school, and the percentile matters more than the score.',
  },
];

/** The rest of the world, which sits more of these and takes them harder. */
export const TESTS_ELSEWHERE: readonly StandardTest[] = [
  // --- East Asia ------------------------------------------------------------
  {
    id: 'gaokao', name: '普通高等学校招生全国统一考试', shortName: 'The Gaokao', kind: 'admissions',
    countryIds: ['cn'], fromAge: 17, toAge: 19, month: 6, min: 0, max: 750, fee: 10_00, retakes: 3,
    resultsAfterDays: 17,
    sections: [
      sec('chinese', 'Chinese', 0, 150, whole('language')),
      sec('maths', 'Mathematics', 0, 150, whole('mathematics')),
      sec('foreign', 'A Foreign Language', 0, 150, whole('foreign')),
      sec('elective', 'The Elective Papers', 0, 300, third('science', 'history', 'geography')),
    ],
    about: 'Two days in June, out of seven hundred and fifty in most provinces, and the single number that decides which university in China will have you.',
  },
  {
    id: 'zhongkao', name: '初中学业水平考试', shortName: 'The Zhongkao', kind: 'entrance',
    countryIds: ['cn'], fromAge: 14, toAge: 15, month: 6, min: 0, max: 750, fee: 0, retakes: 1,
    resultsAfterDays: 20,
    sections: [sec('paper', 'The Papers', 0, 750, third('language', 'mathematics', 'science'))],
    about: 'The high school entrance examination, and in a lot of cities the place it gets you decides the Gaokao three years later.',
  },
  {
    id: 'suneung', name: '대학수학능력시험', shortName: 'The Suneung', kind: 'admissions',
    countryIds: ['kr'], fromAge: 17, toAge: 19, month: 11, min: 0, max: 400, fee: 40_00, retakes: 3,
    resultsAfterDays: 25,
    sections: [
      sec('korean', 'Korean', 0, 100, whole('language')),
      sec('maths', 'Mathematics', 0, 100, whole('mathematics')),
      sec('english', 'English', 0, 100, whole('foreign')),
      sec('elective', 'The Elective Papers', 0, 100, half('science', 'history')),
    ],
    about: 'One Thursday in November on which the whole country goes quiet, aeroplanes are held on the ground for the listening paper and the results are reported in nine grade bands.',
  },
  {
    id: 'kyotsu', name: '大学入学共通テスト', shortName: 'The Common Test', kind: 'admissions',
    countryIds: ['jp'], fromAge: 17, toAge: 19, month: 1, min: 0, max: 900, fee: 130_00, retakes: 2,
    resultsAfterDays: 14,
    sections: [
      sec('japanese', 'Japanese', 0, 200, whole('language')),
      sec('maths', 'Mathematics', 0, 200, whole('mathematics')),
      sec('foreign', 'A Foreign Language', 0, 200, whole('foreign')),
      sec('other', 'The Remaining Papers', 0, 300, third('science', 'history', 'geography')),
    ],
    about: 'Two days in the middle of January, in the snow, and then the university sets its own second stage paper on top of it.',
  },
  {
    id: 'hkdse', name: 'The Hong Kong Diploma of Secondary Education', shortName: 'The DSE',
    kind: 'leaving', countryIds: ['hk'], fromAge: 17, toAge: 18, month: 4, min: 1, max: 7,
    fee: 60_00, retakes: 2, resultsAfterDays: 90,
    sections: [sec('paper', 'The Core Papers', 1, 7, third('language', 'mathematics', 'foreign'))],
    about: 'Graded one to five with two starred levels above it, and the four core subjects are compulsory for everybody.',
  },
  {
    id: 'psle', name: 'The Primary School Leaving Examination', shortName: 'The PSLE', kind: 'national',
    countryIds: ['sg'], fromAge: 11, toAge: 12, month: 9, min: 4, max: 32, fee: 0, retakes: 1,
    resultsAfterDays: 45,
    sections: [sec('paper', 'The Papers', 4, 32, third('language', 'mathematics', 'science'))],
    about: 'Scored in achievement levels since 2021 where four is the best total available, and it still decides which secondary school in Singapore takes you.',
  },
  // --- South Asia -----------------------------------------------------------
  {
    id: 'cbse10', name: 'The CBSE Class 10 Board Examination', kind: 'national', countryIds: ['in'],
    fromAge: 15, toAge: 16, month: 2, min: 0, max: 100, fee: 20_00, retakes: 1, resultsAfterDays: 60,
    sections: [sec('paper', 'The Papers', 0, 100, third('language', 'mathematics', 'science'))],
    about: 'Five or six papers each out of a hundred, and the aggregate percentage follows an Indian student around for years.',
  },
  {
    id: 'cbse12', name: 'The CBSE Class 12 Board Examination', kind: 'leaving', countryIds: ['in'],
    fromAge: 17, toAge: 18, month: 2, min: 0, max: 100, fee: 20_00, retakes: 1, resultsAfterDays: 60,
    sections: [sec('paper', 'The Papers', 0, 100, third('language', 'mathematics', 'science'))],
    about: 'The one that matters: a Delhi University cut off has been known to sit above ninety eight percent.',
  },
  {
    id: 'jee', name: 'The Joint Entrance Examination Main', shortName: 'JEE Main', kind: 'entrance',
    countryIds: ['in'], fromAge: 17, toAge: 19, month: 1, min: 0, max: 300, fee: 12_00, retakes: 5,
    resultsAfterDays: 15,
    sections: [
      sec('physics', 'Physics', 0, 100, whole('science')),
      sec('chemistry', 'Chemistry', 0, 100, whole('science')),
      sec('maths', 'Mathematics', 0, 100, whole('mathematics')),
    ],
    about: 'The engineering entrance, sat twice a year by more than a million people, and the percentile is what anybody actually quotes.',
  },
  {
    id: 'neet', name: 'The National Eligibility cum Entrance Test', shortName: 'NEET', kind: 'entrance',
    countryIds: ['in'], fromAge: 17, toAge: 19, month: 5, min: 0, max: 720, fee: 20_00, retakes: 5,
    resultsAfterDays: 30,
    sections: [
      sec('physics', 'Physics', 0, 180, whole('science')),
      sec('chemistry', 'Chemistry', 0, 180, whole('science')),
      sec('biology', 'Biology', 0, 360, whole('science')),
    ],
    about: 'One paper out of seven hundred and twenty for every medical seat in India, and a wrong answer costs a mark.',
  },
  // --- Africa and the Middle East -------------------------------------------
  {
    id: 'wassce', name: 'The West African Senior School Certificate Examination', shortName: 'WASSCE',
    kind: 'leaving', countryIds: ['ng', 'gh', 'sl', 'lr', 'gm'], fromAge: 16, toAge: 19, month: 5,
    min: 1, max: 9, fee: 30_00, retakes: 2, resultsAfterDays: 75,
    sections: [sec('paper', 'The Papers', 1, 9, third('language', 'mathematics', 'science'))],
    about: 'Set by the West African Examinations Council across five countries and graded A1 down to F9, where five credits including English and mathematics is the line everything else depends on.',
  },
  {
    id: 'jamb', name: 'The Unified Tertiary Matriculation Examination', shortName: 'JAMB', kind: 'entrance',
    countryIds: ['ng'], fromAge: 16, toAge: 19, month: 4, min: 0, max: 400, fee: 12_00, retakes: 4,
    resultsAfterDays: 3,
    sections: [sec('paper', 'The Papers', 0, 400, third('language', 'mathematics', 'science'))],
    about: 'Four subjects out of four hundred, sat on a computer, and every Nigerian university sets its own cut off above it.',
  },
  {
    id: 'nsc', name: 'The National Senior Certificate', shortName: 'Matric', kind: 'leaving',
    countryIds: ['za'], fromAge: 17, toAge: 19, month: 10, min: 1, max: 7, fee: 0, retakes: 2,
    resultsAfterDays: 60,
    sections: [sec('paper', 'The Papers', 1, 7, third('language', 'mathematics', 'science'))],
    about: 'Written in October and November and graded one to seven, with a bachelor pass the level a South African university degree needs.',
  },
  {
    id: 'thanaweya', name: 'الثانوية العامة', shortName: 'Thanaweya Amma', kind: 'leaving',
    countryIds: ['eg'], fromAge: 17, toAge: 19, month: 6, min: 0, max: 100, fee: 0, retakes: 1,
    resultsAfterDays: 30,
    sections: [sec('paper', 'The Papers', 0, 100, third('language', 'mathematics', 'science'))],
    about: 'The Egyptian leaving examination, reported as a percentage, and the faculty you’re allowed to enter is decided by it alone.',
  },
  {
    id: 'bagrut', name: 'בגרות', shortName: 'The Bagrut', kind: 'leaving', countryIds: ['il'],
    fromAge: 16, toAge: 18, month: 6, min: 0, max: 100, fee: 0, retakes: 2, resultsAfterDays: 60,
    sections: [sec('paper', 'The Papers', 0, 100, third('language', 'mathematics', 'history'))],
    about: 'Sat subject by subject across the last three years at different unit weights, and the certificate is the sum of all of them.',
  },
  // --- The Americas and Oceania ---------------------------------------------
  {
    id: 'enem', name: 'O Exame Nacional do Ensino Médio', shortName: 'O ENEM', kind: 'admissions',
    countryIds: ['br'], fromAge: 16, toAge: 25, month: 11, min: 0, max: 1000, fee: 20_00, retakes: 6,
    resultsAfterDays: 60,
    sections: [
      sec('linguagens', 'Linguagens', 0, 1000, whole('language')),
      sec('matematica', 'Matemática', 0, 1000, whole('mathematics')),
      sec('naturais', 'Ciências da Natureza', 0, 1000, whole('science')),
      sec('humanas', 'Ciências Humanas', 0, 1000, half('history', 'geography')),
      sec('redacao', 'A Redação', 0, 1000, whole('language')),
    ],
    about: 'Two Sundays in November, five areas each out of a thousand and scored by item response theory rather than by counting, and it opens nearly every public university in Brazil.',
  },
  {
    id: 'exani', name: 'El Examen Nacional de Ingreso a la Educación Superior', shortName: 'EXANI-II',
    kind: 'entrance', countryIds: ['mx'], fromAge: 17, toAge: 20, month: 5, min: 700, max: 1300,
    fee: 30_00, retakes: 3, resultsAfterDays: 20,
    sections: [sec('paper', 'Las Secciones', 700, 1300, third('language', 'mathematics', 'science'))],
    about: 'Set by Ceneval and reported on an index from seven hundred to thirteen hundred, and most Mexican universities admit on it.',
  },
  {
    id: 'comipems', name: 'El Examen COMIPEMS', kind: 'entrance', countryIds: ['mx'],
    fromAge: 14, toAge: 16, month: 6, min: 0, max: 128, fee: 25_00, retakes: 1, resultsAfterDays: 30,
    sections: [sec('paper', 'El Examen', 0, 128, third('language', 'mathematics', 'science'))],
    about: 'A hundred and twenty eight questions on one Saturday in Mexico City, and the number of them you get right decides which high school of the twenty you listed you’re sent to.',
  },
  {
    id: 'naplan', name: 'The National Assessment Program Literacy and Numeracy', shortName: 'NAPLAN',
    kind: 'national', countryIds: ['au'], fromAge: 8, toAge: 15, month: 3, min: 0, max: 1000,
    fee: 0, retakes: 0, resultsAfterDays: 90,
    sections: [
      sec('literacy', 'Literacy', 0, 1000, whole('language')),
      sec('numeracy', 'Numeracy', 0, 1000, whole('mathematics')),
    ],
    about: 'Sat in years three, five, seven and nine every March, reported in four proficiency levels since 2023, and it’s about the school as much as about the child.',
  },
  {
    id: 'atar', name: 'The Australian Tertiary Admission Rank', shortName: 'The ATAR', kind: 'admissions',
    countryIds: ['au'], fromAge: 17, toAge: 19, month: 11, min: 0, max: 99.95, fee: 0, retakes: 0,
    resultsAfterDays: 30,
    sections: [sec('paper', 'The Final Year', 0, 99.95, third('language', 'mathematics', 'science'))],
    about: 'Not a mark but a rank: it says what percentage of your year you finished above, it stops at ninety nine point nine five, and every Australian offer is made on it.',
  },
  {
    id: 'ncea', name: 'The National Certificate of Educational Achievement', shortName: 'NCEA',
    kind: 'leaving', countryIds: ['nz'], fromAge: 15, toAge: 18, month: 11, min: 0, max: 120,
    fee: 0, retakes: 1, resultsAfterDays: 60,
    sections: [sec('paper', 'The Standards', 0, 120, third('language', 'mathematics', 'science'))],
    about: 'Credits rather than marks, gathered across the year at three levels, with merit and excellence endorsements above a plain achieved.',
  },
  {
    id: 'osslt', name: 'The Ontario Secondary School Literacy Test', shortName: 'The OSSLT',
    kind: 'national', countryIds: [], regionIds: ['ca-on'], fromAge: 15, toAge: 16, month: 3,
    min: 0, max: 400, fee: 0, retakes: 2, resultsAfterDays: 60,
    sections: [sec('paper', 'The Test', 0, 400, whole('language'))],
    about: 'You can’t get an Ontario high school diploma without passing it, which is the whole of its reputation.',
  },
  // --- The international programs -----------------------------------------
  {
    id: 'ib', name: 'The International Baccalaureate Diploma', shortName: 'The IB', kind: 'leaving',
    countryIds: [], fromAge: 17, toAge: 19, month: 5, min: 0, max: 45, fee: 170_00, retakes: 1,
    resultsAfterDays: 45,
    sections: [
      sec('subjects', 'The Six Subjects', 0, 42, third('language', 'mathematics', 'science')),
      sec('core', 'The Core', 0, 3, half('language', 'history')),
    ],
    about: 'Six subjects out of seven each plus three points for the extended essay and theory of knowledge, forty five in all, and it’s sat in schools in more than a hundred and fifty countries.',
  },
  {
    id: 'ielts', name: 'The International English Language Testing System', shortName: 'IELTS',
    kind: 'language', countryIds: [], fromAge: 16, toAge: 60, month: 8, min: 0, max: 9,
    fee: 250_00, retakes: 6, resultsAfterDays: 13,
    sections: [
      sec('listening', 'Listening', 0, 9, whole('foreign')),
      sec('reading', 'Reading', 0, 9, whole('language')),
      sec('writing', 'Writing', 0, 9, whole('language')),
      sec('speaking', 'Speaking', 0, 9, whole('foreign')),
    ],
    about: 'Four bands averaged to a half point, and what a university or a visa asks for from anybody who didn’t do their schooling in English.',
  },
];

// ---------------------------------------------------------------------------
// The American state assessments
// ---------------------------------------------------------------------------

/**
 * What each state calls the test it gives its schools every spring.
 *
 * Every state assesses; most have their own name for it. These are the ones
 * SLATE is confident of. A state that is not in here still tests, and the game
 * puts a plainly labelled state assessment on its calendar rather than
 * inventing an acronym for it.
 */
export const STATE_TESTS: Readonly<Record<string, { name: string; short?: string; about: string }>> = {
  'us-tx': { name: 'The State of Texas Assessments of Academic Readiness', short: 'STAAR', about: 'Sat every spring from the third grade, and in high school by end of course paper rather than by year.' },
  'us-ca': { name: 'The California Assessment of Student Performance and Progress', short: 'CAASPP', about: 'Smarter Balanced in English and mathematics with California’s own science test beside it.' },
  'us-ny': { name: 'The Regents Examinations', short: 'The Regents', about: 'Older than any other state test in the country and still the thing a New York diploma is built out of.' },
  'us-fl': { name: 'The Florida Assessment of Student Thinking', short: 'FAST', about: 'Three progress monitoring windows a year rather than one paper in the spring, which is unusual.' },
  'us-ma': { name: 'The Massachusetts Comprehensive Assessment System', short: 'MCAS', about: 'The test the rest of the country tends to point at, and for years the one you had to pass to graduate.' },
  'us-pa': { name: 'The Pennsylvania System of School Assessment', short: 'PSSA', about: 'Sat through middle school, with the Keystone Exams taking over in high school.' },
  'us-oh': { name: 'The Ohio State Tests', about: 'English, mathematics, science and social studies, with end of course papers in high school.' },
  'us-ga': { name: 'The Georgia Milestones Assessment System', short: 'Milestones', about: 'End of grade papers in the elementary and middle years and end of course papers after that.' },
  'us-nj': { name: 'The New Jersey Student Learning Assessments', short: 'NJSLA', about: 'English and mathematics every year and science in three of them.' },
  'us-va': { name: 'The Standards of Learning', short: 'SOL', about: 'Virginia has tested on its own standards since long before most states did.' },
  'us-il': { name: 'The Illinois Assessment of Readiness', short: 'IAR', about: 'English and mathematics from the third grade through the eighth.' },
  'us-md': { name: 'The Maryland Comprehensive Assessment Program', short: 'MCAP', about: 'English, mathematics, science and, unusually, social studies.' },
  'us-nc': { name: 'The North Carolina End of Grade Tests', short: 'EOG', about: 'End of grade through the eighth and end of course after that.' },
  'us-mi': { name: 'The Michigan Student Test of Educational Progress', short: 'M-STEP', about: 'Sat in the spring, with the SAT standing in for it in the eleventh grade.' },
  'us-mn': { name: 'The Minnesota Comprehensive Assessments', short: 'MCA', about: 'Reading, mathematics and science on Minnesota’s own academic standards.' },
  'us-mo': { name: 'The Missouri Assessment Program', short: 'MAP', about: 'Grade level papers through the eighth and end of course papers in high school.' },
  'us-tn': { name: 'The Tennessee Comprehensive Assessment Program', short: 'TCAP', about: 'Sat every spring, with end of course papers counting toward the grade in high school.' },
  'us-la': { name: 'LEAP 2025', about: 'Louisiana names its assessment after the year the standards it tests were written for.' },
  'us-sc': { name: 'SC READY', about: 'English and mathematics from the third grade through the eighth, with SCPASS for science.' },
  'us-ky': { name: 'The Kentucky Summative Assessments', short: 'KSA', about: 'Reading, mathematics, science, social studies and writing, which is more than most states test.' },
  'us-co': { name: 'The Colorado Measures of Academic Success', short: 'CMAS', about: 'English and mathematics every year and science in three grades.' },
  'us-in': { name: 'ILEARN', about: 'Indiana’s online adaptive assessment, sat in the spring from the third grade.' },
  'us-wi': { name: 'The Wisconsin Forward Exam', short: 'The Forward Exam', about: 'English, mathematics, science and social studies, sat online each spring.' },
  'us-ia': { name: 'The Iowa Statewide Assessment of Student Progress', short: 'ISASP', about: 'Written for Iowa by the university at Iowa City, which is where the whole idea of standardized testing rather began.' },
  'us-or': { name: 'The Oregon Statewide Assessment System', short: 'OSAS', about: 'Smarter Balanced in English and mathematics with Oregon’s own science test beside it.' },
  'us-wa': { name: 'The Washington Comprehensive Assessment of Science', short: 'WCAS', about: 'Washington’s own science paper, sat alongside Smarter Balanced in English and mathematics.' },
  'us-ct': { name: 'The Connecticut Smarter Balanced Assessment', about: 'Smarter Balanced in English and mathematics with the Next Generation Science Standards test beside it.' },
  'us-ri': { name: 'The Rhode Island Comprehensive Assessment System', short: 'RICAS', about: 'Rhode Island adopted its neighbor’s test outright, which is why it reads like MCAS.' },
  'us-nh': { name: 'The New Hampshire Statewide Assessment System', short: 'NH SAS', about: 'Sat in the spring, with the SAT standing in for it in the eleventh grade.' },
  'us-me': { name: 'The Maine Educational Assessment', short: 'The MEA', about: 'Reading and mathematics through the eighth grade and science in three of them.' },
  'us-de': { name: 'The Delaware System of Student Assessments', short: 'DeSSA', about: 'Smarter Balanced in English and mathematics with Delaware’s own science and social studies papers.' },
  'us-wv': { name: 'The West Virginia General Summative Assessment', about: 'English, mathematics and science, sat online in the spring.' },
  'us-ok': { name: 'The Oklahoma School Testing Program', short: 'OSTP', about: 'Grade level papers through the eighth, with the ACT or SAT in the eleventh grade.' },
  'us-ms': { name: 'The Mississippi Academic Assessment Program', short: 'MAAP', about: 'English and mathematics every year with end of course papers in high school.' },
  'us-al': { name: 'The Alabama Comprehensive Assessment Program', short: 'ACAP', about: 'Reading, mathematics and science, sat in the spring from the second grade.' },
  'us-nv': { name: 'The Nevada Smarter Balanced Assessment', about: 'Smarter Balanced in English and mathematics, with Nevada’s own science test in three grades.' },
  'us-id': { name: 'The Idaho Standards Achievement Test', short: 'ISAT', about: 'Smarter Balanced in English and mathematics with Idaho’s own science test beside it.' },
  'us-hi': { name: 'The Hawaii State Assessments', short: 'HSA', about: 'Smarter Balanced in English and mathematics with Hawaii’s own science paper.' },
  'us-nd': { name: 'The North Dakota State Assessment', short: 'NDSA', about: 'English, mathematics and science, sat online each spring.' },
  'us-ks': { name: 'The Kansas Assessment Program', short: 'KAP', about: 'Built at the university at Lawrence and sat on Kansas’s own standards.' },
  'us-ak': { name: 'AK STAR', about: 'Alaska’s own assessment in English and mathematics, sat in the spring.' },
  'us-nm': { name: 'The New Mexico Measures of Student Success and Achievement', short: 'NM-MSSA', about: 'English and mathematics from the third grade, with a separate science paper.' },
  'us-ne': { name: 'The Nebraska Student-Centered Assessment System', short: 'NSCAS', about: 'English, mathematics and science, sat online in the spring.' },
  'us-dc': { name: 'The District of Columbia Comprehensive Assessment System', short: 'DC CAPE', about: 'English, mathematics and science on the District’s own standards.' },
};

/** What a state test is called where SLATE does not carry the state's own name. */
export const GENERAL_STATE_TEST = 'The State Assessment';

/** The month the American spring testing window falls in. */
export const STATE_TEST_MONTH = 4;
/** The ages a state test is sat at, which is most of school. */
export const STATE_TEST_FROM = 8;
export const STATE_TEST_TO = 15;

// ---------------------------------------------------------------------------
// The grade a report actually shows
// ---------------------------------------------------------------------------

/** A band on a country's own grading scale. */
export interface GradeBand {
  /** The lowest SLATE mark out of a hundred that reaches this band. */
  from: number;
  /** What the country actually prints. */
  label: string;
  /**
   * What this grade is worth toward the average the country reports, on that
   * country's own scale. Carried where the average is really built out of the
   * grades rather than out of a percentage.
   */
  points?: number;
  about: string;
}

export interface GradeScale {
  id: string;
  label: string;
  countryIds: readonly string[];
  /** Whether the best grade is the highest number or the lowest one. */
  direction: 'high' | 'low';
  bands: readonly GradeBand[];
  /** Where the country reports an average as well, what it is called. */
  averageLabel?: string;
  averageMax?: number;
  about: string;
}

/**
 * The grading scales, as countries really print them.
 *
 * The scales and which end of them is good are matters of public record. Where
 * SLATE puts the boundary between one grade and the next is SLATE's own, for
 * the plain reason that real boundaries move every year, differ by subject and
 * differ by examination board.
 */
export const GRADE_SCALES: readonly GradeScale[] = [
  {
    id: 'letters', label: 'Letters And A Grade Point Average', countryIds: ['us', 'ca', 'ph', 'sa'],
    direction: 'high', averageLabel: 'Grade Point Average', averageMax: 4,
    bands: [
      { from: 97, label: 'A+', points: 4, about: 'Four point oh, and there’s nothing above it.' },
      { from: 88, label: 'A', points: 4, about: 'Four point oh on an unweighted scale.' },
      { from: 84, label: 'A-', points: 3.7, about: 'Three point seven, and still an A on a transcript.' },
      { from: 80, label: 'B+', points: 3.3, about: 'Three point three, and a comfortable place to be.' },
      { from: 75, label: 'B', points: 3, about: 'Three point oh, which is the number people mean by a B average.' },
      { from: 71, label: 'B-', points: 2.7, about: 'Two point seven, and above the middle of the class.' },
      { from: 66, label: 'C+', points: 2.3, about: 'Two point three, and the top half of the ordinary band.' },
      { from: 60, label: 'C', points: 2, about: 'Two point oh, and where most of a year group actually sits.' },
      { from: 56, label: 'C-', points: 1.7, about: 'One point seven, and eligibility for a lot of things stops here.' },
      { from: 52, label: 'D+', points: 1.3, about: 'One point three, and a conversation is coming.' },
      { from: 45, label: 'D', points: 1, about: 'One point oh: a pass on paper and nothing more.' },
      { from: 0, label: 'F', points: 0, about: 'Nothing at all, and the course has to be taken again.' },
    ],
    about: 'A through F with pluses and minuses, averaged into a grade point average out of four, which is the number every American application asks for.',
  },
  {
    id: 'gcse', label: 'Nine Down To One', countryIds: ['uk'], direction: 'high',
    bands: [
      { from: 92, label: '9', about: 'Above the old A star, and awarded to a small share of the entry.' },
      { from: 85, label: '8', about: 'The other half of what used to be an A star.' },
      { from: 78, label: '7', about: 'An A in the old money.' },
      { from: 70, label: '6', about: 'A high B in the old letters, and a comfortable pass.' },
      { from: 62, label: '5', about: 'A strong pass, which is the line the government counts.' },
      { from: 52, label: '4', about: 'A standard pass, which is the line a school counts.' },
      { from: 42, label: '3', about: 'Below a pass, and English and mathematics have to be sat again.' },
      { from: 30, label: '2', about: 'Below a pass.' },
      { from: 0, label: '1', about: 'The bottom of the scale, and above it’s U for ungraded.' },
    ],
    about: 'England and Wales replaced letters with numbers at GCSE in 2017, where nine is the top and a four is a pass, and A Levels stayed on A star down to E.',
  },
  {
    id: 'german', label: 'One Through Six', countryIds: ['de', 'at', 'cz', 'sk', 'hr'],
    direction: 'low', averageLabel: 'Der Notendurchschnitt', averageMax: 6,
    bands: [
      { from: 88, label: '1', points: 1, about: 'Sehr gut. The best there is, and the good end is the low end.' },
      { from: 76, label: '2', points: 2, about: 'Gut, and the grade a solid student in Germany lives on.' },
      { from: 60, label: '3', points: 3, about: 'Befriedigend, which is where most of a class sits.' },
      { from: 46, label: '4', points: 4, about: 'Ausreichend: a pass, just.' },
      { from: 30, label: '5', points: 5, about: 'Mangelhaft, and it has to be made up.' },
      { from: 0, label: '6', points: 6, about: 'Ungenügend, and the year can be repeated for it.' },
    ],
    about: 'One is the good end and six is the bad one, which catches out everybody who grew up on a scale that runs the other way.',
  },
  {
    id: 'french', label: 'Out Of Twenty', countryIds: ['fr', 'be', 'lu', 'ma', 'tn', 'dz', 'sn', 'ci'],
    direction: 'high', averageLabel: 'La Moyenne', averageMax: 20,
    bands: [
      { from: 90, label: '18/20', about: 'Rare enough that a teacher will remark on it.' },
      { from: 80, label: '16/20', about: 'Très bien, and the mention that goes with it.' },
      { from: 70, label: '14/20', about: 'Bien, and a mention on the bulletin for it.' },
      { from: 60, label: '12/20', about: 'Assez bien.' },
      { from: 50, label: '10/20', about: 'La moyenne exactly, which is the pass.' },
      { from: 35, label: '8/20', about: 'Below the average, and it drags the moyenne down.' },
      { from: 0, label: '5/20', about: 'A long way below, and somebody will be asking why.' },
    ],
    about: 'Everything out of twenty, ten is the pass, and a twenty is famously almost never given at all.',
  },
  {
    id: 'dutch', label: 'One Through Ten', countryIds: ['nl'], direction: 'high',
    averageLabel: 'Het Gemiddelde', averageMax: 10,
    bands: [
      { from: 92, label: '10', about: 'Given so rarely that it’s a story when it happens.' },
      { from: 84, label: '9', about: 'Uitmuntend.' },
      { from: 74, label: '8', about: 'Goed, and about as high as most Dutch marking goes.' },
      { from: 64, label: '7', about: 'Ruim voldoende, and where a good student lives.' },
      { from: 55, label: '6', about: 'Voldoende: the pass, and the grade the whole country aims at.' },
      { from: 42, label: '5', about: 'Onvoldoende, and it needs making up somewhere else.' },
      { from: 0, label: '4', about: 'Well short, and it can’t be averaged away.' },
    ],
    about: 'One to ten with a six as the pass, and the Dutch habit of aiming squarely at the six has a name of its own.',
  },
  {
    id: 'japanese', label: 'Five Through One', countryIds: ['jp'], direction: 'high',
    bands: [
      { from: 88, label: '5', about: 'The top band, and relatively few of a class are given it.' },
      { from: 74, label: '4', about: 'Above the expected standard.' },
      { from: 55, label: '3', about: 'The expected standard, and where most of a class is placed.' },
      { from: 38, label: '2', about: 'Below the expected standard.' },
      { from: 0, label: '1', about: 'Well below, and the school will be in touch.' },
    ],
    about: 'The five point 評定 on a Japanese report card, set against the standard for the year rather than against the rest of the class.',
  },
  {
    id: 'russian', label: 'Five Through Two', countryIds: ['ru', 'ua', 'kz', 'by', 'uz'],
    direction: 'high',
    bands: [
      { from: 85, label: '5', about: 'Отлично: excellent, and everybody knows what a five means.' },
      { from: 68, label: '4', about: 'Хорошо: good.' },
      { from: 45, label: '3', about: 'Удовлетворительно: satisfactory, and the pass.' },
      { from: 0, label: '2', about: 'Неудовлетворительно, and there’s no one on the scale at all.' },
    ],
    about: 'Five down to two with nothing below it, which is why a two is the thing every schoolchild in the region dreads.',
  },
  {
    id: 'percent', label: 'A Percentage', countryIds: ['in', 'pk', 'bd', 'ng', 'za', 'eg', 'ke'],
    direction: 'high', averageLabel: 'The Aggregate', averageMax: 100,
    bands: [
      { from: 90, label: '90%', about: 'A distinction, and the number that gets quoted for years.' },
      { from: 80, label: '80%', about: 'A first division comfortably.' },
      { from: 70, label: '70%', about: 'A first division.' },
      { from: 60, label: '60%', about: 'A second division.' },
      { from: 45, label: '45%', about: 'A third division, and a pass.' },
      { from: 33, label: '33%', about: 'The bare pass mark on most Indian boards.' },
      { from: 0, label: 'Fail', about: 'Below the pass mark, and the paper has to be sat again.' },
    ],
    about: 'Reported as a percentage and an aggregate across all subjects, which is why cut offs in the high nineties are a thing that really happens.',
  },
  {
    id: 'general', label: 'A Mark Out Of A Hundred', countryIds: [], direction: 'high',
    bands: [
      { from: 85, label: 'Excellent', about: 'The top band.' },
      { from: 70, label: 'Very Good', about: 'Well above the expected standard.' },
      { from: 55, label: 'Good', about: 'The expected standard.' },
      { from: 40, label: 'Satisfactory', about: 'A pass, and nothing more said about it.' },
      { from: 0, label: 'Unsatisfactory', about: 'Below the pass.' },
    ],
    about: 'Where SLATE doesn’t carry a country’s own scale, a mark out of a hundred in plain words, said plainly rather than dressed up as somebody’s national system.',
  },
];

// ---------------------------------------------------------------------------
// The shape of a school year, and the report that comes out of it
// ---------------------------------------------------------------------------

export interface Term {
  label: string;
  /** The month it opens in, 1 for January. */
  startMonth: number;
  /** How many months it runs for. */
  months: number;
}

export interface TermPattern {
  id: string;
  label: string;
  countryIds: readonly string[];
  terms: readonly Term[];
  /** Whether a progress report comes halfway through each term as well. */
  progressReports: boolean;
  about: string;
}

/**
 * How a school year is divided where you are.
 *
 * Which months a school year runs in is a matter of public record and it
 * differs a great deal: the northern year opens in August or September, the
 * southern one in January or February, and Japan's opens in April. Which week
 * a particular term begins is a school's own business and SLATE's own here.
 */
export const TERM_PATTERNS: readonly TermPattern[] = [
  {
    id: 'three_terms', label: 'Three Terms', countryIds: ['uk', 'ie', 'nz', 'sg', 'hk', 'ke', 'ng', 'in'],
    progressReports: true,
    terms: [
      { label: 'The Autumn Term', startMonth: 9, months: 4 },
      { label: 'The Spring Term', startMonth: 1, months: 3 },
      { label: 'The Summer Term', startMonth: 4, months: 3 },
    ],
    about: 'Three terms with a half term holiday in the middle of each, which is the shape most of the Commonwealth kept.',
  },
  {
    id: 'two_semesters', label: 'Two Semesters', countryIds: ['us', 'ca', 'de', 'at', 'ch', 'nl', 'be', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'ru', 'tr', 'mx', 'eg', 'il'],
    progressReports: true,
    terms: [
      { label: 'The Fall Semester', startMonth: 8, months: 5 },
      { label: 'The Spring Semester', startMonth: 1, months: 5 },
    ],
    about: 'Two long halves with a report card at the end of each and a progress report in the middle, and in America a marking period inside each of those.',
  },
  {
    id: 'french_terms', label: 'Three Trimestres', countryIds: ['fr', 'lu', 'ma', 'tn', 'dz', 'sn', 'ci', 'it', 'es', 'pt'],
    progressReports: false,
    terms: [
      { label: 'Le Premier Trimestre', startMonth: 9, months: 4 },
      { label: 'Le Deuxième Trimestre', startMonth: 1, months: 3 },
      { label: 'Le Troisième Trimestre', startMonth: 4, months: 3 },
    ],
    about: 'Three trimestres, each ending in a bulletin with a moyenne on it and a conseil de classe that decides whether the year is passed.',
  },
  {
    id: 'four_terms', label: 'Four Terms', countryIds: ['jp', 'kr', 'cn', 'tw'],
    progressReports: false,
    terms: [
      { label: 'The First Term', startMonth: 4, months: 3 },
      { label: 'The Second Term', startMonth: 9, months: 4 },
      { label: 'The Third Term', startMonth: 1, months: 3 },
    ],
    about: 'The Japanese year opens in April with the cherry blossom and closes in March, which is why a Japanese school year and a Japanese financial year line up.',
  },
  {
    id: 'southern', label: 'Four Terms, Southern', countryIds: ['au', 'za', 'ar', 'cl', 'br'],
    progressReports: true,
    terms: [
      { label: 'Term One', startMonth: 2, months: 3 },
      { label: 'Term Two', startMonth: 4, months: 3 },
      { label: 'Term Three', startMonth: 7, months: 3 },
      { label: 'Term Four', startMonth: 10, months: 3 },
    ],
    about: 'South of the equator the year opens in late January or February and the long holiday is at Christmas, which is summer.',
  },
];

/** Where SLATE does not carry a country's own shape, the commonest one. */
export const GENERAL_TERMS = 'three_terms';

// ---------------------------------------------------------------------------
// What a teacher writes
// ---------------------------------------------------------------------------

/**
 * The comment on a report card, by band.
 *
 * Every one of these is written for this game. No teacher said any of it and
 * none of it is taken from any real school's reporting. What makes them work
 * is that each says something specific about the work rather than something
 * general about the child.
 */
export const REPORT_COMMENTS: Readonly<Record<string, readonly string[]>> = {
  Outstanding: [
    'Works at a level above the year and is beginning to set the pace for the rest of the class.',
    'Arrives having already thought about it, which isn’t something that can be taught.',
    'The quality of the written work is well beyond what is asked for at this stage.',
    'Asks the question the rest of the room hasn’t got to yet.',
    'A pleasure to teach, and I have stopped being surprised by what comes back.',
    'Should be entered for the harder paper without hesitation.',
    'Has taken every piece of feedback and done something with it.',
    'Consistently the strongest work in the set, and consistent is the word that matters.',
  ],
  Strong: [
    'A confident term’s work, and the gap to the top of the class is now small.',
    'Contributes well and the written work has caught up with the talking.',
    'Understands the material and is starting to see how the parts of it join up.',
    'Has worked steadily and it shows in every piece handed in.',
    'A good term. More precision in the written answers would take this further.',
    'Handles the hard questions well; the marks are being lost on the easy ones.',
    'Reads around the subject, which is why the essays have something in them.',
    'Well above where the year is expected to be at this point.',
  ],
  Sound: [
    'Solid, steady work, and there’s more here than the marks are showing.',
    'Understands it in the room; the difficulty is getting it onto the page.',
    'Doing what is asked. Doing a little more than that would move things on.',
    'A fair term. The written work is thinner than the contributions in class.',
    'Comfortable with the routine work and hesitant with anything unfamiliar.',
    'Would benefit from asking when something hasn’t gone in, rather than waiting.',
    'On track. The next step is being able to explain the working, not just get there.',
    'Sits where most of the year sits, and could sit higher with a little more at home.',
  ],
  Passing: [
    'Getting through, but the homework is arriving late and thin.',
    'The understanding is there in patches and the gaps between them are the problem.',
    'Needs to be in the room and paying attention for the whole of the lesson.',
    'Capable of considerably better than this and both of us know it.',
    'A difficult term. The basics need going over again before anything else will stick.',
    'Progress has stalled. A conversation at home would help.',
    'Turns up and does the minimum, and the minimum isn’t going to be enough next year.',
    'Marks are being lost to carelessness rather than to not knowing.',
  ],
  Struggling: [
    'Falling behind the rest of the set and it’s going to take work to close.',
    'Missing too many lessons for anything to build on anything.',
    'Needs support with the fundamentals before the year’s material makes sense.',
    'I have spoken to them about this twice and I would like to speak to somebody at home.',
    'The work that’s handed in isn’t finished and a lot of it isn’t handed in.',
    'This can be turned round, but not without a change in the next few weeks.',
    'Has stopped asking, which worries me more than the marks do.',
    'A hard term, and I don’t think the difficulty is ability.',
  ],
  Failing: [
    'Won’t pass this course on the current work and needs a plan rather than a comment.',
    'Almost nothing has been handed in this term.',
    'Attendance is the first thing that has to change; everything else follows it.',
    'I would like to meet before the next report rather than after it.',
    'This is a long way below what this student can do, and that’s the frustrating part.',
    'The course has moved beyond where they are and the gap is now the whole term.',
    'Needs to repeat the material rather than carry on past it.',
    'A serious conversation is overdue.',
  ],
};

/** What a progress report says, which is shorter and more immediate. */
export const PROGRESS_COMMENTS: Readonly<Record<string, readonly string[]>> = {
  Outstanding: ['Flying.', 'No concerns at all.', 'Ahead of the scheme of work.', 'Setting the standard.'],
  Strong: ['Going well.', 'Working hard and it shows.', 'Above where the year should be.', 'Pleased with this.'],
  Sound: ['On track.', 'Steady.', 'Where they should be.', 'No concerns, but no fireworks.'],
  Passing: ['Coasting.', 'Homework is the issue.', 'Could do more.', 'Needs a push.'],
  Struggling: ['Concerned.', 'Falling behind.', 'Attendance is the problem.', 'Needs support now.'],
  Failing: ['Urgent.', 'Very little work this half term.', 'A meeting is needed.', 'Not currently passing.'],
};

/** How hard somebody is trying, which a report says as well as a mark. */
export const EFFORT_LEVELS: readonly { from: number; label: string; about: string }[] = [
  { from: 85, label: 'Excellent', about: 'Everything asked for, on time, and more besides.' },
  { from: 68, label: 'Good', about: 'Consistent, and the work arrives.' },
  { from: 50, label: 'Satisfactory', about: 'What is asked for and not much beyond it.' },
  { from: 32, label: 'Inconsistent', about: 'Some weeks, and not others.' },
  { from: 0, label: 'A Concern', about: 'The work isn’t being done.' },
];

/** How much a term of preparation is worth on the day, at its ceiling. */
export const PREP_CEILING = 12;
/** What one sitting down with a past paper is worth toward that ceiling. */
export const PREP_PER_SESSION = 2.5;
/** How much nerve on the day can move a score either way. */
export const NERVE_SWING = 7;

// ---------------------------------------------------------------------------
// Looking it all up
// ---------------------------------------------------------------------------

/** Every test the game carries, wherever it is sat. */
export const ALL_TESTS: readonly StandardTest[] = [...TESTS, ...TESTS_ELSEWHERE];

export const TEST_BY_ID: Readonly<Record<string, StandardTest>> = Object.fromEntries(
  ALL_TESTS.map((one) => [one.id, one]),
);

/** The tests somebody of this age, in this country, could sit this year. */
export function testsFor(countryId: string, age: number, regionId?: string): StandardTest[] {
  return ALL_TESTS.filter((one) => {
    if (age < one.fromAge || age > one.toAge) return false;
    if (one.regionIds?.length) return regionId !== undefined && one.regionIds.includes(regionId);
    // The international programs are sat anywhere, so they carry no country.
    if (one.countryIds.length === 0) return true;
    return one.countryIds.includes(countryId);
  });
}

/** Whether SLATE carries a test of this country's own, rather than only the open ones. */
export function testsAreCountrys(countryId: string): boolean {
  return ALL_TESTS.some((one) => one.countryIds.includes(countryId));
}

/** What this state calls its yearly assessment, and whether SLATE knows the name. */
export function stateTestFor(regionId: string): { name: string; short?: string; about: string; carried: boolean } {
  const carried = STATE_TESTS[regionId];
  if (carried) return { ...carried, carried: true };
  return {
    name: GENERAL_STATE_TEST,
    about: 'Every state tests its schools every spring. SLATE doesn’t carry this one’s own name for it and says so rather than inventing one.',
    carried: false,
  };
}

export const SCALE_BY_COUNTRY: Readonly<Record<string, GradeScale>> = Object.fromEntries(
  GRADE_SCALES.flatMap((scale) => scale.countryIds.map((countryId) => [countryId, scale])),
);

/** The scale a report card is printed on where you are. */
export function scaleIn(countryId: string): GradeScale {
  return SCALE_BY_COUNTRY[countryId] ?? GRADE_SCALES[GRADE_SCALES.length - 1]!;
}

/** Whether SLATE carries this country's own scale rather than the general one. */
export function scaleIsCountrys(countryId: string): boolean {
  return countryId in SCALE_BY_COUNTRY;
}

/** What the country prints next to a mark out of a hundred. */
export function gradeFor(mark: number, countryId: string): GradeBand {
  const scale = scaleIn(countryId);
  return scale.bands.find((one) => mark >= one.from) ?? scale.bands[scale.bands.length - 1]!;
}

/** The average a country reports alongside the grades, where it reports one. */
export function averageFor(mark: number, countryId: string): { label: string; value: number; max: number } | undefined {
  const scale = scaleIn(countryId);
  if (!scale.averageLabel || scale.averageMax === undefined) return undefined;
  // Where the average is really built out of the grades — a grade point
  // average, a Notendurchschnitt — it is the grade's own worth and not a
  // percentage dressed up as one.
  const band = gradeFor(mark, countryId);
  if (band.points !== undefined) {
    return { label: scale.averageLabel, value: band.points, max: scale.averageMax };
  }
  const share = Math.max(0, Math.min(1, mark / 100));
  // A scale whose good end is the low end runs the other way, which is the
  // whole reason the direction is carried at all.
  const value = scale.direction === 'low'
    ? scale.averageMax - share * (scale.averageMax - 1)
    : share * scale.averageMax;
  return {
    label: scale.averageLabel,
    value: Math.round(value * 100) / 100,
    max: scale.averageMax,
  };
}

export const TERMS_BY_COUNTRY: Readonly<Record<string, TermPattern>> = Object.fromEntries(
  TERM_PATTERNS.flatMap((one) => one.countryIds.map((countryId) => [countryId, one])),
);

/** How the school year is divided where you are. */
export function termsIn(countryId: string): TermPattern {
  return TERMS_BY_COUNTRY[countryId]
    ?? TERM_PATTERNS.find((one) => one.id === GENERAL_TERMS)!;
}

/** Whether SLATE carries this country's own year shape. */
export function termsAreCountrys(countryId: string): boolean {
  return countryId in TERMS_BY_COUNTRY;
}

/** How hard somebody has been trying, said in a word. */
export function effortLabel(effort: number): string {
  return EFFORT_LEVELS.find((one) => effort >= one.from)?.label ?? 'A Concern';
}
