/**
 * SLATE — the names of languages.
 *
 * GeoNames records each country's languages as ISO 639 codes. These are the
 * names those codes stand for, for the ones that appear across the world's
 * countries, so that a place can say "Spanish, Catalan" rather than "es, ca".
 * A code not listed here is shown as itself rather than guessed at.
 */

import { countWords } from '../core/text';

const NAMES: Record<string, string> = {
  aa: 'Afar', ab: 'Abkhaz', af: 'Afrikaans', ak: 'Akan', am: 'Amharic', ar: 'Arabic', as: 'Assamese',
  ay: 'Aymara', az: 'Azerbaijani', ba: 'Bashkir', be: 'Belarusian', bg: 'Bulgarian', bi: 'Bislama',
  bm: 'Bambara', bn: 'Bengali', bo: 'Tibetan', bs: 'Bosnian', ca: 'Catalan', ch: 'Chamorro', cs: 'Czech',
  cy: 'Welsh', da: 'Danish', de: 'German', dv: 'Dhivehi', dz: 'Dzongkha', el: 'Greek', en: 'English',
  es: 'Spanish', et: 'Estonian', eu: 'Basque', fa: 'Persian', ff: 'Fula', fi: 'Finnish', fj: 'Fijian',
  fo: 'Faroese', fr: 'French', ga: 'Irish', gd: 'Scottish Gaelic', gl: 'Galician', gn: 'Guarani',
  gu: 'Gujarati', gv: 'Manx', ha: 'Hausa', he: 'Hebrew', hi: 'Hindi', hr: 'Croatian', ht: 'Haitian Creole',
  hu: 'Hungarian', hy: 'Armenian', id: 'Indonesian', ig: 'Igbo', is: 'Icelandic', it: 'Italian',
  ja: 'Japanese', jv: 'Javanese', ka: 'Georgian', kg: 'Kongo', kk: 'Kazakh', kl: 'Greenlandic', km: 'Khmer',
  kn: 'Kannada', ko: 'Korean', ku: 'Kurdish', ky: 'Kyrgyz', la: 'Latin', lb: 'Luxembourgish', ln: 'Lingala',
  lo: 'Lao', lt: 'Lithuanian', lv: 'Latvian', mg: 'Malagasy', mh: 'Marshallese', mi: 'Māori',
  mk: 'Macedonian', ml: 'Malayalam', mn: 'Mongolian', mr: 'Marathi', ms: 'Malay', mt: 'Maltese',
  my: 'Burmese', na: 'Nauruan', nb: 'Norwegian Bokmål', nd: 'Ndebele', ne: 'Nepali', nl: 'Dutch',
  nn: 'Norwegian Nynorsk', no: 'Norwegian', ny: 'Chichewa', om: 'Oromo', or: 'Odia', pa: 'Punjabi',
  pl: 'Polish', ps: 'Pashto', pt: 'Portuguese', qu: 'Quechua', rm: 'Romansh', rn: 'Kirundi', ro: 'Romanian',
  ru: 'Russian', rw: 'Kinyarwanda', sd: 'Sindhi', sg: 'Sango', si: 'Sinhala', sk: 'Slovak', sl: 'Slovene',
  sm: 'Samoan', sn: 'Shona', so: 'Somali', sq: 'Albanian', sr: 'Serbian', ss: 'Swazi', st: 'Sotho',
  su: 'Sundanese', sv: 'Swedish', sw: 'Swahili', ta: 'Tamil', te: 'Telugu', tg: 'Tajik', th: 'Thai',
  ti: 'Tigrinya', tk: 'Turkmen', tl: 'Tagalog', tn: 'Tswana', to: 'Tongan', tr: 'Turkish', ts: 'Tsonga',
  tt: 'Tatar', ty: 'Tahitian', uk: 'Ukrainian', ur: 'Urdu', uz: 'Uzbek', ve: 'Venda', vi: 'Vietnamese',
  wo: 'Wolof', xh: 'Xhosa', yo: 'Yoruba', zh: 'Chinese', zu: 'Zulu',
  fil: 'Filipino', haw: 'Hawaiian', nso: 'Northern Sotho', tet: 'Tetum', gil: 'Gilbertese', tvl: 'Tuvaluan',
  pap: 'Papiamento', crs: 'Seychellois Creole', niu: 'Niuean', tkl: 'Tokelauan', gsw: 'Swiss German',
  prs: 'Dari', ckb: 'Sorani Kurdish', yue: 'Cantonese', nan: 'Min Nan', hak: 'Hakka',
};

/** "es-MX,en" → ["Spanish", "English"], de-duplicated, at most `limit`. */
export function languageNames(codes: string, limit = 4): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of codes.split(',')) {
    const code = raw.trim().split('-')[0]?.toLowerCase() ?? '';
    if (!code) continue;
    const name = NAMES[code] ?? code.toUpperCase();
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// What a life speaks (from 2026-10-25, the owner's brief 27, Part 7: "Languages and accents"; Part 9: "Accent, language,
// movement, and vocal preparation"). Until then the game recorded no languages: every market the slate made work in
// worked in English, and the README of the career universe (K3) left a language on the résumé out as a word nothing
// would read. The owner ruled that no reader was a reason to build one: a part of the slate can be written for a
// character who speaks a named language as well as English, and eligibility, casting's fit and the preparation read
// what the actor speaks (`systems/speaking.ts`). The names are the ones above, real languages each.
// ---------------------------------------------------------------------------------------------------------------------

/** How well a language is spoken: grown up speaking it, at ease in it, or able to hold a conversation in it. */
export type LanguageLevel = 'native' | 'fluent' | 'conversational';
export const LANGUAGE_LEVELS: readonly LanguageLevel[] = ['native', 'fluent', 'conversational'];
export const LEVEL_LABEL: Readonly<Record<LanguageLevel, string>> = { native: 'Native', fluent: 'Fluent', conversational: 'Conversational' };

/** A language a person speaks, by its code, and how well. */
export interface SpokenLanguage { id: string; level: LanguageLevel }

export const ENGLISH = 'en';

/**
 * What a person with no languages on record speaks: English, natively. Every save made before 2026-10-25 has none
 * (`Person.languages` is optional), and reads as this, so an older life loads and plays on as it did: every part it was
 * offered was in English, and every part written in English alone still is.
 */
export const ENGLISH_ONLY: readonly SpokenLanguage[] = [{ id: ENGLISH, level: 'native' }];

/** The most languages creation takes. ASSUMPTION: the game's limit, for a list a résumé can carry. */
export const LANGUAGES_MOST = 6;

/**
 * The languages a life can speak, by name: every one above but four. Chinese is offered as the two spoken languages its
 * code covers, Mandarin and Cantonese, since a part names the one its character speaks; Norwegian once, not again as its
 * two written standards; and Latin, which nobody speaks today, not at all.
 */
const SPOKEN_NAMES: Readonly<Record<string, string>> = (() => {
  const out: Record<string, string> = { ...NAMES, cmn: 'Mandarin' };
  for (const gone of ['zh', 'nb', 'nn', 'la']) delete out[gone];
  return out;
})();

/** Each language a life can speak, A to Z by name. */
export const SPOKEN: readonly { id: string; name: string }[] = Object.entries(SPOKEN_NAMES)
  .map(([id, name]) => ({ id, name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

/** A spoken language's name, or undefined for a code the list doesn't hold. */
export const spokenName = (id: string): string | undefined => SPOKEN_NAMES[id];

/** What a person speaks: what they said at creation, or, with nothing on record, English natively (`ENGLISH_ONLY`). */
export const languagesOf = (person: { languages?: readonly SpokenLanguage[] }): readonly SpokenLanguage[] => person.languages ?? ENGLISH_ONLY;

/** How well a person speaks a language, or undefined where they don't. */
export const levelIn = (person: { languages?: readonly SpokenLanguage[] }, id: string): LanguageLevel | undefined => languagesOf(person).find((l) => l.id === id)?.level;

/**
 * What's wrong with a list of languages, each in a sentence creation shows: a language not on the list, one listed twice,
 * English missing or under fluent (the School teaches in English, and every part the game offers is in English), no
 * language marked native, or more than `LANGUAGES_MOST`.
 */
export function languagesProblems(list: readonly SpokenLanguage[]): string[] {
  const out: string[] = [];
  if (list.some((l) => !spokenName(l.id) || !LANGUAGE_LEVELS.includes(l.level))) out.push('Choose each language and how well you speak it from the lists.');
  const seen = new Set<string>();
  for (const l of list) {
    if (seen.has(l.id) && spokenName(l.id)) out.push(`You’ve listed ${spokenName(l.id)} twice.`);
    seen.add(l.id);
  }
  const english = list.find((l) => l.id === ENGLISH);
  if (!english || english.level === 'conversational') out.push('Your training and every part in the game are in English, so list English as native or fluent.');
  if (!list.some((l) => l.level === 'native')) out.push('Mark the language you grew up speaking as native.');
  if (list.length > LANGUAGES_MOST) out.push(`List ${countWords(LANGUAGES_MOST)} languages at most.`);
  return [...new Set(out)];
}

/**
 * A list made into one creation would take, for a save made straight from the engine (as `cleanPersonality` does for the
 * dispositions): the languages on the list, each once, at a level it has; English among them at fluent where another is
 * native and at native where none is; and no more than `LANGUAGES_MOST`.
 */
export function cleanLanguages(list: readonly SpokenLanguage[]): SpokenLanguage[] {
  const out: SpokenLanguage[] = [];
  for (const l of list) if (spokenName(l.id) && LANGUAGE_LEVELS.includes(l.level) && !out.some((x) => x.id === l.id)) out.push({ id: l.id, level: l.level });
  const others = out.filter((l) => l.id !== ENGLISH);
  const english = out.find((l) => l.id === ENGLISH);
  const englishLevel: LanguageLevel = english && english.level !== 'conversational' ? english.level : others.some((l) => l.level === 'native') ? 'fluent' : 'native';
  const kept: SpokenLanguage[] = [{ id: ENGLISH, level: englishLevel }, ...others].slice(0, LANGUAGES_MOST);
  if (!kept.some((l) => l.level === 'native')) kept[0] = { id: ENGLISH, level: 'native' };
  return kept;
}
