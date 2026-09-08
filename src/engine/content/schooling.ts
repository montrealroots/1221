/**
 * SLATE — school, wherever you are.
 *
 * The shape of an education is public record and it is different everywhere:
 * a fifteen year old is in Year 11 in England, Grade 10 in America, Seconde
 * in France, Class 10 in India and the first year of high school in Japan,
 * and what they sit at the end of it is a GCSE, a state test, the Brevet, a
 * board exam or nothing yet. That structure is real and it is carried here.
 *
 * What is not real, and is said not to be, is the individual school. There
 * are millions of them and no feed to name them from, so every school in
 * SLATE is SLATE's own invention with a plausible name, and the room says so.
 * Universities are different and come later: those are public record.
 */

export const SCHOOLING_NOTE =
  'The shape of an education is public record and it is what SLATE carries: the stages, what each '
  + 'year is called where you are, the exam at the end of it and the ages the law makes school '
  + 'compulsory. The school itself is not. There are millions of schools and no feed to name them '
  + 'from, so every one in SLATE is SLATE’s own invention with a plausible name, and so is every '
  + 'timetable, every mark and every fixture.';

// ---------------------------------------------------------------------------
// What a year is called, and what you sit at the end of it
// ---------------------------------------------------------------------------

export interface Qualification {
  /** What it is really called where it is sat. */
  name: string;
  about: string;
}

export interface Stage {
  id: string;
  /** What the stage is called there. */
  label: string;
  /** First and last age in it. */
  from: number;
  to: number;
  /** The word before the number: Grade, Year, Class, Form. */
  word: string;
  /** The number the first year of the stage carries. */
  numberFrom: number;
  /** Sat at the end of the stage, where the country has one. */
  exam?: Qualification;
  /** Where a stage's years are named rather than numbered. */
  names?: readonly string[];
}

export interface EducationSystem {
  id: string;
  label: string;
  countryIds: readonly string[];
  about: string;
  /** The ages the law requires somebody to be in school. */
  compulsory: readonly [number, number];
  stages: readonly Stage[];
}

const st = (
  id: string, label: string, from: number, to: number, word: string, numberFrom: number,
  exam?: Qualification, names?: readonly string[],
): Stage => ({ id, label, from, to, word, numberFrom, exam, names });

export const EDUCATION_SYSTEMS: readonly EducationSystem[] = [
  {
    id: 'us', label: 'American', countryIds: ['us'], compulsory: [6, 17],
    about: 'Kindergarten, elementary, middle and high school, with a diploma at the end and a grade point average all the way through.',
    stages: [
      st('kindergarten', 'Kindergarten', 5, 5, 'Kindergarten', 0),
      st('elementary', 'Elementary School', 6, 10, 'Grade', 1),
      st('middle', 'Middle School', 11, 13, 'Grade', 6),
      st('high', 'High School', 14, 17, 'Grade', 9, {
        name: 'High School Diploma',
        about: 'Awarded on credits and a grade point average rather than one examination.',
      }),
    ],
  },
  {
    id: 'england', label: 'English And Welsh', countryIds: ['uk'], compulsory: [5, 17],
    about: 'Reception, primary, secondary to GCSE and then sixth form to A Levels.',
    stages: [
      st('reception', 'Reception', 4, 4, 'Reception', 0),
      st('primary', 'Primary School', 5, 10, 'Year', 1),
      st('secondary', 'Secondary School', 11, 15, 'Year', 7, {
        name: 'GCSE',
        about: 'Sat subject by subject at sixteen, and what a sixth form looks at.',
      }),
      st('sixthform', 'Sixth Form', 16, 17, 'Year', 12, {
        name: 'A Level',
        about: 'Three or four subjects at eighteen, and what a university offer is made on.',
      }),
    ],
  },
  {
    id: 'scotland', label: 'Scottish', countryIds: [], compulsory: [5, 16],
    about: 'Primary one to seven, then secondary to National 5 and Highers.',
    stages: [
      st('primary', 'Primary School', 5, 11, 'P', 1),
      st('lower', 'Secondary School', 12, 15, 'S', 1, {
        name: 'National 5',
        about: 'Sat at sixteen, subject by subject.',
      }),
      st('upper', 'Sixth Year', 16, 17, 'S', 5, {
        name: 'Higher',
        about: 'What a Scottish university offer is made on, with Advanced Highers above it.',
      }),
    ],
  },
  {
    id: 'ireland', label: 'Irish', countryIds: ['ie'], compulsory: [6, 16],
    about: 'Primary, then the Junior Cycle and the Leaving Certificate.',
    stages: [
      st('primary', 'Primary School', 4, 11, 'Class', 0),
      st('junior', 'Junior Cycle', 12, 14, 'Year', 1, {
        name: 'Junior Certificate',
        about: 'Sat at fifteen, across a broad set of subjects.',
      }),
      st('senior', 'Senior Cycle', 15, 17, 'Year', 4, {
        name: 'Leaving Certificate',
        about: 'Points from it are what a place at an Irish university is offered on.',
      }),
    ],
  },
  {
    id: 'france', label: 'French', countryIds: ['fr', 'lu', 'be'], compulsory: [3, 16],
    about: 'Maternelle, élémentaire, collège to the Brevet and lycée to the Baccalauréat.',
    stages: [
      st('maternelle', 'École Maternelle', 3, 5, 'Section', 1),
      st('elementaire', 'École Élémentaire', 6, 10, 'Year', 1, undefined,
        ['CP', 'CE1', 'CE2', 'CM1', 'CM2']),
      st('college', 'Collège', 11, 14, 'Year', 1, {
        name: 'Diplôme National Du Brevet',
        about: 'Sat at the end of collège, and the first thing on the record.',
      }, ['Sixième', 'Cinquième', 'Quatrième', 'Troisième']),
      st('lycee', 'Lycée', 15, 17, 'Year', 1, {
        name: 'Baccalauréat',
        about: 'The examination that opens a French university, sat at eighteen.',
      }, ['Seconde', 'Première', 'Terminale']),
    ],
  },
  {
    id: 'germany', label: 'German', countryIds: ['de', 'at', 'ch'], compulsory: [6, 15],
    about: 'Grundschule, then a secondary track, and the Abitur for those who take it.',
    stages: [
      st('grundschule', 'Grundschule', 6, 9, 'Klasse', 1),
      st('sekundar', 'Sekundarstufe I', 10, 15, 'Klasse', 5, {
        name: 'Mittlerer Schulabschluss',
        about: 'The leaving certificate at sixteen, and what decides whether the Oberstufe follows.',
      }),
      st('oberstufe', 'Gymnasiale Oberstufe', 16, 17, 'Klasse', 11, {
        name: 'Abitur',
        about: 'The qualification a German university admits on.',
      }),
    ],
  },
  {
    id: 'italy', label: 'Italian', countryIds: ['it'], compulsory: [6, 15],
    about: 'Primary, lower secondary and upper secondary, to the Maturità.',
    stages: [
      st('primaria', 'Scuola Primaria', 6, 10, 'Classe', 1),
      st('primogrado', 'Scuola Secondaria Di Primo Grado', 11, 13, 'Classe', 1),
      st('secondogrado', 'Scuola Secondaria Di Secondo Grado', 14, 18, 'Classe', 1, {
        name: 'Esame Di Maturità',
        about: 'Sat at nineteen at the end of upper secondary school.',
      }),
    ],
  },
  {
    id: 'spain', label: 'Spanish', countryIds: ['es'], compulsory: [6, 15],
    about: 'Primaria, the ESO, and Bachillerato to the EBAU.',
    stages: [
      st('primaria', 'Educación Primaria', 6, 11, 'Curso', 1),
      st('eso', 'Educación Secundaria Obligatoria', 12, 15, 'Curso', 1, {
        name: 'Título De Graduado En ESO',
        about: 'The compulsory secondary certificate, at sixteen.',
      }),
      st('bachillerato', 'Bachillerato', 16, 17, 'Curso', 1, {
        name: 'EBAU',
        about: 'The university entrance examination, and the mark a place is offered on.',
      }),
    ],
  },
  {
    id: 'portugal', label: 'Portuguese', countryIds: ['pt'], compulsory: [6, 17],
    about: 'Three cycles of basic education and then secondary.',
    stages: [
      st('basico1', 'Ensino Básico', 6, 14, 'Ano', 1),
      st('secundario', 'Ensino Secundário', 15, 17, 'Ano', 10, {
        name: 'Exames Nacionais',
        about: 'National examinations at the end of secondary school.',
      }),
    ],
  },
  {
    id: 'netherlands', label: 'Dutch', countryIds: ['nl'], compulsory: [5, 17],
    about: 'Basisschool for eight years, then a secondary track chosen at twelve.',
    stages: [
      st('basisschool', 'Basisschool', 4, 11, 'Groep', 1),
      st('voortgezet', 'Voortgezet Onderwijs', 12, 17, 'Klas', 1, {
        name: 'Eindexamen',
        about: 'The leaving examination for whichever track was taken.',
      }),
    ],
  },
  {
    id: 'nordic', label: 'Nordic', countryIds: ['se', 'no', 'dk', 'fi', 'is'], compulsory: [6, 15],
    about: 'One comprehensive school to sixteen, then upper secondary.',
    stages: [
      st('grundskola', 'Grundskola', 6, 15, 'Årskurs', 0),
      st('gymnasium', 'Gymnasium', 16, 18, 'År', 1, {
        name: 'Studentexamen',
        about: 'The upper secondary leaving qualification.',
      }),
    ],
  },
  {
    id: 'poland', label: 'Polish', countryIds: ['pl'], compulsory: [7, 15],
    about: 'Eight years of primary school and then a liceum to the Matura.',
    stages: [
      st('podstawowa', 'Szkoła Podstawowa', 7, 14, 'Klasa', 1),
      st('liceum', 'Liceum', 15, 18, 'Klasa', 1, {
        name: 'Matura',
        about: 'The examination a Polish university admits on.',
      }),
    ],
  },
  {
    id: 'russia', label: 'Russian', countryIds: ['ru', 'by', 'kz'], compulsory: [7, 15],
    about: 'Primary, basic general to the OGE, and secondary general to the EGE.',
    stages: [
      st('nachalnaya', 'Primary School', 7, 10, 'Class', 1),
      st('osnovnaya', 'Basic General School', 11, 15, 'Class', 5, {
        name: 'OGE',
        about: 'The basic state examination at fifteen.',
      }),
      st('srednyaya', 'Secondary General School', 16, 17, 'Class', 10, {
        name: 'EGE',
        about: 'The unified state examination, and what a Russian university admits on.',
      }),
    ],
  },
  {
    id: 'japan', label: 'Japanese', countryIds: ['jp'], compulsory: [6, 14],
    about: 'Six years of elementary, three of junior high and three of high school.',
    stages: [
      st('shogakko', 'Elementary School', 6, 11, 'Year', 1),
      st('chugakko', 'Junior High School', 12, 14, 'Year', 1, {
        name: 'High School Entrance Examination',
        about: 'Sat at fifteen, and it decides which high school takes you.',
      }),
      st('kotogakko', 'High School', 15, 17, 'Year', 1, {
        name: 'Common Test For University Admissions',
        about: 'The national test a Japanese university admits on.',
      }),
    ],
  },
  {
    id: 'korea', label: 'Korean', countryIds: ['kr'], compulsory: [6, 14],
    about: 'Six years of elementary, three of middle and three of high school.',
    stages: [
      st('chodeung', 'Elementary School', 6, 11, 'Year', 1),
      st('jung', 'Middle School', 12, 14, 'Year', 1),
      st('godeung', 'High School', 15, 17, 'Year', 1, {
        name: 'Suneung',
        about: 'The College Scholastic Ability Test, sat on one day in November.',
      }),
    ],
  },
  {
    id: 'china', label: 'Chinese', countryIds: ['cn'], compulsory: [6, 14],
    about: 'Six years of primary, three of junior secondary to the Zhongkao and three of senior secondary to the Gaokao.',
    stages: [
      st('xiaoxue', 'Primary School', 6, 11, 'Grade', 1),
      st('chuzhong', 'Junior Secondary School', 12, 14, 'Grade', 7, {
        name: 'Zhongkao',
        about: 'The senior secondary entrance examination, and it decides which school takes you.',
      }),
      st('gaozhong', 'Senior Secondary School', 15, 17, 'Grade', 10, {
        name: 'Gaokao',
        about: 'The national college entrance examination, sat over two days in June.',
      }),
    ],
  },
  {
    id: 'india', label: 'Indian', countryIds: ['in', 'np', 'bd'], compulsory: [6, 14],
    about: 'Classes one to twelve, with board examinations at Class 10 and Class 12.',
    stages: [
      st('primary', 'Primary School', 6, 10, 'Class', 1),
      st('middle', 'Middle School', 11, 13, 'Class', 6),
      st('secondary', 'Secondary School', 14, 15, 'Class', 9, {
        name: 'Class 10 Board Examination',
        about: 'The first board examination, and it decides the stream that follows.',
      }),
      st('senior', 'Senior Secondary School', 16, 17, 'Class', 11, {
        name: 'Class 12 Board Examination',
        about: 'The board examination an Indian university admits on.',
      }),
    ],
  },
  {
    id: 'pakistan', label: 'Pakistani', countryIds: ['pk'], compulsory: [5, 16],
    about: 'Primary and middle, then Matriculation and Intermediate.',
    stages: [
      st('primary', 'Primary School', 5, 9, 'Class', 1),
      st('middle', 'Middle School', 10, 12, 'Class', 6),
      st('matric', 'Matriculation', 13, 15, 'Class', 9, {
        name: 'Matriculation Certificate',
        about: 'Sat at the end of Class 10.',
      }),
      st('intermediate', 'Intermediate College', 16, 17, 'Class', 11, {
        name: 'Intermediate Certificate',
        about: 'Sat at the end of Class 12, and what a university admits on.',
      }),
    ],
  },
  {
    id: 'australia', label: 'Australian', countryIds: ['au'], compulsory: [6, 16],
    about: 'Primary to Year 6 and secondary to Year 12, with a rank at the end.',
    stages: [
      st('prep', 'Preparatory Year', 5, 5, 'Prep', 0),
      st('primary', 'Primary School', 6, 11, 'Year', 1),
      st('secondary', 'Secondary School', 12, 17, 'Year', 7, {
        name: 'ATAR',
        about: 'A rank rather than a mark, and what an Australian university offer is made on.',
      }),
    ],
  },
  {
    id: 'newzealand', label: 'New Zealand', countryIds: ['nz'], compulsory: [6, 15],
    about: 'Primary and intermediate, then secondary to the NCEA.',
    stages: [
      st('primary', 'Primary School', 5, 10, 'Year', 1),
      st('intermediate', 'Intermediate School', 11, 12, 'Year', 7),
      st('secondary', 'Secondary School', 13, 17, 'Year', 9, {
        name: 'NCEA',
        about: 'The National Certificate of Educational Achievement, taken at three levels.',
      }),
    ],
  },
  {
    id: 'canada', label: 'Canadian', countryIds: ['ca'], compulsory: [6, 17],
    about: 'Elementary, middle and secondary school, with a provincial diploma at the end.',
    stages: [
      st('kindergarten', 'Kindergarten', 5, 5, 'Kindergarten', 0),
      st('elementary', 'Elementary School', 6, 11, 'Grade', 1),
      st('middle', 'Middle School', 12, 13, 'Grade', 7),
      st('secondary', 'Secondary School', 14, 17, 'Grade', 9, {
        name: 'Secondary School Diploma',
        about: 'Awarded on credits by the province rather than one national examination.',
      }),
    ],
  },
  {
    id: 'brazil', label: 'Brazilian', countryIds: ['br'], compulsory: [4, 17],
    about: 'Nine years of fundamental school and three of secondary, to the ENEM.',
    stages: [
      st('preescola', 'Pré-Escola', 4, 5, 'Pré-Escola', 0),
      st('fundamental1', 'Ensino Fundamental I', 6, 10, 'Ano', 1),
      st('fundamental2', 'Ensino Fundamental II', 11, 14, 'Ano', 6),
      st('medio', 'Ensino Médio', 15, 17, 'Ano', 1, {
        name: 'ENEM',
        about: 'The national secondary education examination, and how most university places are allocated.',
      }),
    ],
  },
  {
    id: 'mexico', label: 'Mexican', countryIds: ['mx'], compulsory: [6, 17],
    about: 'Primaria, secundaria and preparatoria.',
    stages: [
      st('primaria', 'Primaria', 6, 11, 'Grado', 1),
      st('secundaria', 'Secundaria', 12, 14, 'Grado', 1),
      st('preparatoria', 'Preparatoria', 15, 17, 'Grado', 1, {
        name: 'Certificado De Bachillerato',
        about: 'The upper secondary certificate.',
      }),
    ],
  },
  {
    id: 'latinamerica', label: 'Latin American', countryIds: ['ar', 'cl', 'co', 'pe', 'uy', 'ec', 'bo', 'py', 've', 'cr', 'pa', 'gt', 'do', 'cu'],
    compulsory: [6, 17],
    about: 'Primary and secondary school, with a national entrance examination in most of it.',
    stages: [
      st('primaria', 'Primaria', 6, 11, 'Grado', 1),
      st('secundaria', 'Secundaria', 12, 17, 'Grado', 1, {
        name: 'Examen De Admisión',
        about: 'The national or university entrance examination.',
      }),
    ],
  },
  {
    id: 'southafrica', label: 'South African', countryIds: ['za', 'na', 'bw', 'zw'], compulsory: [7, 15],
    about: 'Grades R to 12, with the National Senior Certificate at the end.',
    stages: [
      st('foundation', 'Foundation Phase', 6, 9, 'Grade', 1),
      st('intermediate', 'Intermediate Phase', 10, 12, 'Grade', 4),
      st('senior', 'Senior Phase', 13, 15, 'Grade', 7),
      st('fet', 'Further Education And Training', 16, 17, 'Grade', 10, {
        name: 'National Senior Certificate',
        about: 'Matric, and the bachelor pass on it is what opens a university.',
      }),
    ],
  },
  {
    id: 'westafrica', label: 'West African', countryIds: ['ng', 'gh', 'sl', 'lr', 'gm'], compulsory: [6, 14],
    about: 'Primary, junior secondary to the BECE and senior secondary to the WASSCE.',
    stages: [
      st('primary', 'Primary School', 6, 11, 'Primary', 1),
      st('junior', 'Junior Secondary School', 12, 14, 'JSS', 1, {
        name: 'BECE',
        about: 'The Basic Education Certificate Examination, at the end of junior secondary.',
      }),
      st('senior', 'Senior Secondary School', 15, 17, 'SSS', 1, {
        name: 'WASSCE',
        about: 'The West African Senior School Certificate Examination, sat across the region.',
      }),
    ],
  },
  {
    id: 'eastafrica', label: 'East African', countryIds: ['ke', 'tz', 'ug', 'rw', 'et', 'zm', 'mw'], compulsory: [6, 13],
    about: 'Primary to a national certificate, then secondary.',
    stages: [
      st('primary', 'Primary School', 6, 13, 'Standard', 1, {
        name: 'Primary School Leaving Examination',
        about: 'Sat at the end of primary, and it decides which secondary school takes you.',
      }),
      st('secondary', 'Secondary School', 14, 17, 'Form', 1, {
        name: 'Secondary School Certificate',
        about: 'The national secondary leaving examination.',
      }),
    ],
  },
  {
    id: 'arab', label: 'Arab', countryIds: ['eg', 'sa', 'ae', 'jo', 'lb', 'kw', 'qa', 'om', 'bh', 'iq', 'ma', 'dz', 'tn', 'ly'],
    compulsory: [6, 15],
    about: 'Primary, preparatory and secondary, to the Thanawiya Amma.',
    stages: [
      st('primary', 'Primary School', 6, 11, 'Grade', 1),
      st('preparatory', 'Preparatory School', 12, 14, 'Grade', 7),
      st('secondary', 'Secondary School', 15, 17, 'Grade', 10, {
        name: 'Thanawiya Amma',
        about: 'The general secondary certificate, and the mark a university place is offered on.',
      }),
    ],
  },
  {
    id: 'turkey', label: 'Turkish', countryIds: ['tr'], compulsory: [6, 17],
    about: 'Four years each of primary, middle and high school.',
    stages: [
      st('ilkokul', 'İlkokul', 6, 9, 'Sınıf', 1),
      st('ortaokul', 'Ortaokul', 10, 13, 'Sınıf', 5, {
        name: 'LGS',
        about: 'The high school entrance examination at fourteen.',
      }),
      st('lise', 'Lise', 14, 17, 'Sınıf', 9, {
        name: 'YKS',
        about: 'The higher education institutions examination.',
      }),
    ],
  },
  {
    id: 'southeastasia', label: 'Southeast Asian', countryIds: ['id', 'my', 'th', 'vn', 'ph', 'sg', 'bn', 'kh', 'la', 'mm'],
    compulsory: [6, 14],
    about: 'Primary, lower secondary and upper secondary, with a national examination at each break.',
    stages: [
      st('primary', 'Primary School', 6, 11, 'Grade', 1),
      st('lower', 'Lower Secondary School', 12, 14, 'Grade', 7, {
        name: 'Lower Secondary Certificate',
        about: 'The national examination at the end of lower secondary.',
      }),
      st('upper', 'Upper Secondary School', 15, 17, 'Grade', 10, {
        name: 'Upper Secondary Certificate',
        about: 'The national examination a university admits on.',
      }),
    ],
  },
  {
    id: 'world', label: 'General', countryIds: [], compulsory: [6, 15],
    about: 'Primary and secondary school, where SLATE does not carry a country’s own structure.',
    stages: [
      st('primary', 'Primary School', 6, 11, 'Grade', 1),
      st('secondary', 'Secondary School', 12, 17, 'Grade', 7, {
        name: 'Secondary School Certificate',
        about: 'The national secondary leaving qualification.',
      }),
    ],
  },
];

export const SYSTEM_BY_ID: Readonly<Record<string, EducationSystem>> = Object.fromEntries(
  EDUCATION_SYSTEMS.map((one) => [one.id, one]),
);

const SYSTEM_BY_COUNTRY: Readonly<Record<string, EducationSystem>> = Object.fromEntries(
  EDUCATION_SYSTEMS.flatMap((one) => one.countryIds.map((countryId) => [countryId, one])),
);

/** The education system where somebody is. */
export function systemIn(countryId: string): EducationSystem {
  return SYSTEM_BY_COUNTRY[countryId] ?? SYSTEM_BY_ID.world!;
}

/** Whether SLATE carries this country's own structure, or the general one. */
export function systemIsCountrys(countryId: string): boolean {
  return SYSTEM_BY_COUNTRY[countryId] !== undefined;
}

/** The stage somebody of this age is in, or none if they are past school. */
export function stageForAge(system: EducationSystem, age: number): Stage | undefined {
  return system.stages.find((one) => age >= one.from && age <= one.to);
}

/** What the year is called: Year 11, Grade 10, Seconde, Class 10. */
export function yearLabel(stage: Stage, age: number): string {
  const into = Math.max(0, age - stage.from);
  if (stage.names && stage.names[into]) return stage.names[into]!;
  if (stage.numberFrom === 0) return stage.word;
  return `${stage.word} ${stage.numberFrom + into}`;
}

/** Whether the law requires somebody of this age to be at school here. */
export function mustAttend(system: EducationSystem, age: number): boolean {
  return age >= system.compulsory[0] && age <= system.compulsory[1];
}

// ---------------------------------------------------------------------------
// What is on the timetable
// ---------------------------------------------------------------------------

export interface Subject {
  id: string;
  label: string;
  /** Which attribute or skill doing well in it feeds. */
  feeds?: { key: string; kind: 'attribute' | 'skill' };
  /** The earliest stage it appears on a timetable. */
  fromAge: number;
  about: string;
}

/**
 * The subjects a school day is made of.
 *
 * Broadly the same everywhere, because broadly they are: everybody does their
 * own language, mathematics, some science, some history and some sport. What
 * a country calls each one differs and SLATE does not carry that; what it
 * carries is the shape of a week.
 */
export const SUBJECTS: readonly Subject[] = [
  { id: 'language', label: 'Language And Literature', fromAge: 5, feeds: { key: 'script_analysis', kind: 'attribute' }, about: 'Reading, writing, and eventually arguing about what a book meant.' },
  { id: 'mathematics', label: 'Mathematics', fromAge: 5, about: 'Numbers, and later letters standing in for them.' },
  { id: 'science', label: 'Science', fromAge: 7, about: 'One subject early on and three later.' },
  { id: 'history', label: 'History', fromAge: 8, about: 'What happened, and the argument about why.' },
  { id: 'geography', label: 'Geography', fromAge: 8, about: 'Where things are and why they are there.' },
  { id: 'foreign', label: 'A Foreign Language', fromAge: 9, feeds: { key: 'languages', kind: 'skill' }, about: 'Two years of it before anybody says a full sentence.' },
  { id: 'art', label: 'Art', fromAge: 5, feeds: { key: 'production_design', kind: 'skill' }, about: 'Paint, then drawing, then somebody says you are good at it.' },
  { id: 'music', label: 'Music', fromAge: 5, feeds: { key: 'singing', kind: 'attribute' }, about: 'A recorder, and then a real instrument if it takes.' },
  { id: 'drama', label: 'Drama', fromAge: 9, feeds: { key: 'emotional_truth', kind: 'attribute' }, about: 'Standing up in front of people, which is the whole job.' },
  { id: 'pe', label: 'Physical Education', fromAge: 5, about: 'A field, a hall, and somebody with a whistle.' },
  { id: 'computing', label: 'Computing', fromAge: 11, about: 'Typing, then logic, then somebody makes something.' },
  { id: 'economics', label: 'Economics', fromAge: 15, feeds: { key: 'negotiation', kind: 'skill' }, about: 'Only on an upper secondary timetable, and only if it is offered.' },
  { id: 'film', label: 'Film Studies', fromAge: 15, feeds: { key: 'visual_language', kind: 'skill' }, about: 'Rare, offered by a few schools, and the reason some people end up doing this.' },
];

export const SUBJECT_BY_ID: Readonly<Record<string, Subject>> = Object.fromEntries(
  SUBJECTS.map((one) => [one.id, one]),
);

/** How many lessons a week, and how long each is. SLATE's own calibration. */
export const PERIODS_A_DAY = 6;
export const PERIOD_MINUTES = 55;
export const SCHOOL_STARTS_HOUR = 8;
export const SCHOOL_DAYS: readonly number[] = [1, 2, 3, 4, 5];

// ---------------------------------------------------------------------------
// What a mark means
// ---------------------------------------------------------------------------

/** A mark out of a hundred, and the word a report puts next to it. */
export const MARK_BANDS: readonly { from: number; label: string; about: string }[] = [
  { from: 85, label: 'Outstanding', about: 'Top of the year, and the staff have noticed.' },
  { from: 72, label: 'Strong', about: 'Comfortably above what is expected.' },
  { from: 58, label: 'Sound', about: 'Where most of the year sits.' },
  { from: 44, label: 'Passing', about: 'Through, but nothing to write home about.' },
  { from: 30, label: 'Struggling', about: 'Somebody has already had a word.' },
  { from: 0, label: 'Failing', about: 'This one is not being passed without a change.' },
];

export function markLabel(mark: number): string {
  return MARK_BANDS.find((one) => mark >= one.from)?.label ?? 'Failing';
}

/** What an average across the year has to clear for a university to look. */
export const UNIVERSITY_LOOKS_AT = 68;
/** And what a scholarship on marks alone takes. */
export const ACADEMIC_SCHOLARSHIP = 88;

// ---------------------------------------------------------------------------
// Sport, at school
// ---------------------------------------------------------------------------

export interface SchoolSport {
  id: string;
  label: string;
  /** Countries whose schools really play it as a school sport. */
  countryIds: readonly string[];
  /** Months the school season runs, in the northern hemisphere sense. */
  months: readonly number[];
  /** How hard it is on a body, out of ten. */
  demand: number;
  about: string;
}

const sp = (
  id: string, label: string, countryIds: readonly string[], months: readonly number[],
  demand: number, about: string,
): SchoolSport => ({ id, label, countryIds, months, demand, about });

/**
 * What a school actually fields a team in.
 *
 * Which sports a country's schools play is public record and it is not the
 * same list anywhere: an American high school fields a football team and an
 * English one does not, an Australian school plays Australian rules and a
 * Kenyan one runs. The season and the fixture are SLATE's own.
 */
export const SCHOOL_SPORTS: readonly SchoolSport[] = [
  sp('american_football', 'American Football', ['us'], [8, 9, 10, 11], 9, 'Friday nights, and the whole town comes.'),
  sp('basketball', 'Basketball', ['us', 'ca', 'ph', 'cn', 'es', 'lt', 'gr', 'au'], [11, 12, 1, 2], 7, 'A hall, a squeaking floor and a bus to the away game.'),
  sp('baseball', 'Baseball', ['us', 'jp', 'kr', 'do', 'cu', 've'], [3, 4, 5], 6, 'Long afternoons, and in Japan the whole country watches the schools play it.'),
  sp('football', 'Football', ['uk', 'fr', 'de', 'es', 'it', 'br', 'ar', 'ng', 'gh', 'nl', 'pt', 'be', 'jp', 'kr', 'mx', 'za', 'ke', 'us'], [9, 10, 11, 12, 1, 2, 3], 7, 'The one everywhere plays, on a field with the lines half worn off.'),
  sp('rugby', 'Rugby', ['nz', 'za', 'uk', 'au', 'fr', 'ie', 'ar', 'fj', 'ws', 'to'], [9, 10, 11, 12, 1], 9, 'Mud, and somebody’s father on the touchline.'),
  sp('cricket', 'Cricket', ['uk', 'in', 'au', 'za', 'nz', 'pk', 'lk', 'bd', 'zw'], [4, 5, 6, 7], 5, 'A long summer afternoon and a tea interval.'),
  sp('netball', 'Netball', ['uk', 'au', 'nz', 'za', 'jm'], [9, 10, 11, 12, 1, 2], 6, 'Outdoor courts, in January, in the cold.'),
  sp('aussie_rules', 'Australian Rules Football', ['au'], [3, 4, 5, 6, 7, 8], 9, 'The whole school turns out for the grand final.'),
  sp('athletics', 'Track And Field', ['us', 'uk', 'ke', 'et', 'jm', 'au', 'de', 'ng', 'za', 'in', 'ca'], [3, 4, 5, 6], 7, 'Sports day, and the one race that decides the year.'),
  sp('cross_country', 'Cross Country', ['us', 'uk', 'ke', 'et', 'ca', 'nz'], [9, 10, 11], 8, 'Six in the morning, in the rain, for no clear reason.'),
  sp('swimming', 'Swimming', ['us', 'au', 'uk', 'nl', 'jp', 'ca', 'za'], [11, 12, 1, 2], 7, 'Early mornings and chlorine in everything you own.'),
  sp('volleyball', 'Volleyball', ['us', 'br', 'jp', 'kr', 'it', 'pl', 'cn', 'ph'], [8, 9, 10, 11], 6, 'The one the hall is set up for most of the year.'),
  sp('field_hockey', 'Field Hockey', ['uk', 'in', 'pk', 'nl', 'au', 'za', 'de'], [9, 10, 11, 12], 7, 'Shin pads, and a ball that hurts.'),
  sp('ice_hockey', 'Ice Hockey', ['ca', 'us', 'fi', 'se', 'ru', 'cz'], [10, 11, 12, 1, 2], 9, 'A rink booked at half past five in the morning.'),
  sp('tennis', 'Tennis', ['us', 'uk', 'fr', 'es', 'au', 'de', 'jp'], [4, 5, 6], 5, 'Two courts and a queue for them.'),
  sp('wrestling', 'Wrestling', ['us', 'ir', 'tr', 'ru', 'in', 'jp'], [11, 12, 1, 2], 9, 'Weight classes, and a season spent hungry.'),
  sp('judo', 'Judo', ['jp', 'fr', 'kr', 'br', 'ru'], [9, 10, 11, 12, 1, 2], 8, 'A mat, and being thrown onto it until you stop minding.'),
  sp('table_tennis', 'Table Tennis', ['cn', 'jp', 'kr', 'de', 'se', 'sg'], [9, 10, 11, 12, 1, 2, 3], 4, 'The table in the corner of the hall, and a queue at it.'),
  sp('badminton', 'Badminton', ['in', 'id', 'my', 'cn', 'dk', 'uk', 'th'], [10, 11, 12, 1, 2], 5, 'Fast, and much harder than it looks from the side.'),
  sp('handball', 'Handball', ['de', 'dk', 'fr', 'no', 'se', 'es', 'hu', 'pl'], [9, 10, 11, 12, 1, 2], 8, 'The European hall sport, and it is brutal.'),
  sp('futsal', 'Futsal', ['br', 'pt', 'es', 'ar', 'ru'], [3, 4, 5, 6, 7, 8], 7, 'Football indoors and much faster, which is where the touch comes from.'),
  sp('kabaddi', 'Kabaddi', ['in', 'bd', 'pk', 'np'], [10, 11, 12, 1], 8, 'One breath, one raid, and the whole ground shouting.'),
  sp('taekwondo', 'Taekwondo', ['kr'], [9, 10, 11, 12, 1, 2, 3], 8, 'A belt to work toward, and the whole school does some of it.'),
  sp('rowing', 'Rowing', ['uk', 'us', 'au', 'nz', 'de', 'nl'], [3, 4, 5, 6], 9, 'Dark mornings on the water, and the boat is never balanced.'),
];

/** What the schools of a country actually field a team in. */
export function sportsIn(countryId: string): SchoolSport[] {
  return SCHOOL_SPORTS.filter((one) => one.countryIds.includes(countryId));
}

/** The age a school starts fielding teams a player can try out for. */
export const TEAM_FROM_AGE = 11;

// ---------------------------------------------------------------------------
// The clubs, and the one that matters
// ---------------------------------------------------------------------------

export interface Club {
  id: string;
  label: string;
  fromAge: number;
  feeds?: { key: string; kind: 'attribute' | 'skill' };
  about: string;
}

export const CLUBS: readonly Club[] = [
  { id: 'drama', label: 'Drama Club', fromAge: 9, feeds: { key: 'improvisation', kind: 'attribute' }, about: 'Two afternoons a week, and the play at the end of it.' },
  { id: 'film', label: 'Film Club', fromAge: 12, feeds: { key: 'visual_language', kind: 'skill' }, about: 'A borrowed camera and somebody who has opinions about Kubrick.' },
  { id: 'choir', label: 'Choir', fromAge: 7, feeds: { key: 'singing', kind: 'attribute' }, about: 'Lunchtimes, and a concert nobody’s parents miss.' },
  { id: 'orchestra', label: 'Orchestra', fromAge: 9, feeds: { key: 'coordination', kind: 'attribute' }, about: 'Tuning takes longer than the rehearsal.' },
  { id: 'debate', label: 'Debating Society', fromAge: 12, feeds: { key: 'public_speaking', kind: 'skill' }, about: 'Arguing a side you do not hold, which turns out to be a skill.' },
  { id: 'newspaper', label: 'School Newspaper', fromAge: 12, feeds: { key: 'character_writing', kind: 'skill' }, about: 'Four pages a term and one story somebody tries to stop.' },
  { id: 'dance', label: 'Dance', fromAge: 7, feeds: { key: 'dance', kind: 'attribute' }, about: 'A hall with mirrors, and a showcase in the spring.' },
  { id: 'chess', label: 'Chess Club', fromAge: 8, about: 'Quiet, and far more competitive than it looks.' },
];

export const CLUB_BY_ID: Readonly<Record<string, Club>> = Object.fromEntries(
  CLUBS.map((one) => [one.id, one]),
);

/**
 * The school play.
 *
 * The reason this whole system exists in a game about film. A part in a
 * school play is the first thing on anybody's record, and where somebody is
 * good enough it is the thing that gets noticed.
 */
export interface Production {
  id: string;
  title: string;
  about: string;
  /** How many named parts there are to go round. */
  parts: number;
}

/**
 * What schools actually put on.
 *
 * Out of copyright, performed by school drama departments everywhere, and
 * real titles rather than invented ones — which is honest, because these are
 * public domain works and a school really can and does stage them.
 */
export const SCHOOL_PLAYS: readonly Production[] = [
  { id: 'macbeth', title: 'Macbeth', about: 'The short one, which is why every school does it.', parts: 8 },
  { id: 'midsummer', title: 'A Midsummer Night’s Dream', about: 'Big cast, and somebody has to be the donkey.', parts: 14 },
  { id: 'romeo', title: 'Romeo And Juliet', about: 'Everybody wants one of two parts and there are twelve.', parts: 12 },
  { id: 'twelfth', title: 'Twelfth Night', about: 'Comic, and the staging is cheap, which matters.', parts: 10 },
  { id: 'tempest', title: 'The Tempest', about: 'An excuse for the lighting department to do something.', parts: 9 },
  { id: 'importance', title: 'The Importance Of Being Earnest', about: 'Wilde, and it plays to parents better than Shakespeare does.', parts: 8 },
  { id: 'inspector', title: 'An Inspector Calls', about: 'One room, seven people, and it is on the syllabus anyway.', parts: 7 },
  { id: 'antigone', title: 'Antigone', about: 'Sophocles, and it is shorter than anybody expects.', parts: 8 },
  { id: 'dolls_house', title: 'A Doll’s House', about: 'Ibsen, and the door slam at the end never fails.', parts: 6 },
  { id: 'crucible', title: 'The Crucible', about: 'A big cast and a good deal of shouting.', parts: 15 },
  { id: 'seagull', title: 'The Seagull', about: 'Chekhov, attempted by a sixth form with more ambition than sense.', parts: 9 },
  { id: 'pygmalion', title: 'Pygmalion', about: 'Shaw, and the accents are the whole exercise.', parts: 9 },
];

/** How good you have to be for the part to be the lead. */
export const LEAD_TAKES = 72;
/**
 * And how much has to be in there before anybody outside the school notices.
 *
 * Read against raw talent rather than what a young body can currently deliver,
 * because a scout at the back of a school hall is reading potential. It is
 * what makes being found as a child possible at all.
 */
export const NOTICED_AT = 84;

/** How a part in a school play reads. */
export const PART_LABEL: Readonly<Record<string, string>> = {
  lead: 'The Lead',
  supporting: 'A Named Part',
  ensemble: 'The Ensemble',
  crew: 'Backstage',
};
