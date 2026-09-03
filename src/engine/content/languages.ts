/**
 * SLATE — the names of languages.
 *
 * GeoNames records each country's languages as ISO 639 codes. These are the
 * names those codes stand for, for the ones that appear across the world's
 * countries, so that a place can say "Spanish, Catalan" rather than "es, ca".
 * A code not listed here is shown as itself rather than guessed at.
 */

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
