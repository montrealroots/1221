/**
 * SLATE — what each real festival asks of a film, and what its juries give.
 *
 * The festivals live in the events data (names, dates, sections, prizes).
 * This adds what a submission runs into: whether the film must be a world
 * premiere, what kinds of film the festival takes, the fee, the budget cap
 * where there is one, whether buyers are in the room, and how prestigious a
 * selection is. Fees are SLATE's estimates from the festivals' published
 * schedules and are labelled as estimates wherever they are shown.
 */

export type PremiereRequirement = 'world' | 'international' | 'north_american' | 'none';
export type FestivalFocus = 'general' | 'documentary' | 'animation' | 'genre' | 'shorts' | 'independent' | 'television';

export interface FestivalRules {
  premiere: PremiereRequirement;
  focus: FestivalFocus;
  /** Formats the festival programmes. */
  formats: ('feature' | 'short' | 'series' | 'limited_series' | 'tv_movie' | 'documentary' | 'special')[];
  /** Budget ceiling in cents for the competition, where the festival has one. */
  maxBudget?: number;
  /** Submission fee for a feature, in cents. An estimate. */
  feeCents: number;
  /** 0-100: how much a selection is worth to a career. */
  prestige: number;
  /** How hard it is to get in: the quality a film needs to have a fair chance. */
  bar: number;
  /** Buyers attend and acquisitions happen. */
  market: boolean;
  /** The competition strand a strong film goes into, and the strand a good one goes into. */
  competition: string;
  secondStrand: string;
  /** Only films from these countries, where a festival is a national showcase. */
  countries?: string[];
  /** The rule in a sentence. */
  eligibility: string;
}

const FILM = ['feature', 'documentary'] as const;

export const FESTIVAL_RULES: Record<string, FestivalRules> = {
  sundance: { premiere: 'world', focus: 'independent', formats: [...FILM, 'short', 'series'], maxBudget: 0, feeCents: 110_00, prestige: 90, bar: 74, market: true, competition: 'U.S. Dramatic Competition', secondStrand: 'Premieres', eligibility: 'Independent films that have not screened publicly anywhere; the competitions take world premieres, and the U.S. competition wants American independent films. Nothing with a distributor already attached goes into competition.' },
  rotterdam: { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 60_00, prestige: 72, bar: 68, market: true, competition: 'Tiger Competition', secondStrand: 'Harbour', eligibility: 'First, second or third features for the Tiger Competition, as world or international premieres.' },
  slamdance: { premiere: 'world', focus: 'independent', formats: [...FILM, 'short'], maxBudget: 1_000_000_00, feeCents: 65_00, prestige: 52, bar: 58, market: false, competition: 'Narrative Features', secondStrand: 'Breakouts', eligibility: 'First-time feature filmmakers with budgets under one million dollars and no distribution, as world premieres.' },
  'santa-barbara': { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 75_00, prestige: 60, bar: 60, market: false, competition: 'U.S. Independent', secondStrand: 'International Cinema', eligibility: 'Features and shorts from the year; the awards contenders it shows are already released.' },
  berlinale: { premiere: 'world', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 0, prestige: 94, bar: 78, market: true, competition: 'Competition', secondStrand: 'Panorama', eligibility: 'World premieres for the Competition; international premieres for Panorama and Forum; nothing that has been released or streamed anywhere.' },
  'true-false': { premiere: 'none', focus: 'documentary', formats: ['documentary', 'short'], feeCents: 45_00, prestige: 58, bar: 66, market: false, competition: 'Features', secondStrand: 'Shorts', eligibility: 'Nonfiction features and shorts; no premiere requirement.' },
  sxsw: { premiere: 'world', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 85_00, prestige: 76, bar: 68, market: true, competition: 'Narrative Feature Competition', secondStrand: 'Narrative Spotlight', eligibility: 'World premieres for the competitions; the Headliners and Spotlight strands take films with distribution.' },
  'cph-dox': { premiere: 'international', focus: 'documentary', formats: ['documentary', 'short'], feeCents: 40_00, prestige: 70, bar: 68, market: true, competition: 'DOX:AWARD', secondStrand: 'F:ACT AWARD', eligibility: 'Documentaries as world or international premieres for the competitions.' },
  'series-mania': { premiere: 'international', focus: 'television', formats: ['series', 'limited_series'], feeCents: 0, prestige: 66, bar: 66, market: true, competition: 'International Competition', secondStrand: 'International Panorama', eligibility: 'Series that have not aired outside their home country, as international premieres.' },
  hkiff: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 40_00, prestige: 62, bar: 62, market: true, competition: 'Young Cinema Competition', secondStrand: 'Global Vision', eligibility: 'First or second features for the Firebird competitions; the rest of the programme has no premiere rule.' },
  canneseries: { premiere: 'world', focus: 'television', formats: ['series', 'limited_series'], feeCents: 0, prestige: 64, bar: 66, market: true, competition: 'Competition', secondStrand: 'Out of Competition', eligibility: 'Series as world premieres for the Competition.' },
  'hot-docs': { premiere: 'international', focus: 'documentary', formats: ['documentary', 'short'], feeCents: 55_00, prestige: 68, bar: 64, market: true, competition: 'International Spectrum', secondStrand: 'World Showcase', eligibility: 'Documentaries completed in the last year, as Canadian premieres at least; the competitions want world or international premieres.' },
  cannes: { premiere: 'world', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 100, bar: 82, market: true, competition: 'Competition', secondStrand: 'Un Certain Regard', eligibility: 'Films completed in the last twelve months that have not been released anywhere, shown anywhere outside their country of origin, or put online; world premieres only.' },
  annecy: { premiere: 'international', focus: 'animation', formats: [...FILM, 'short', 'series'], feeCents: 0, prestige: 74, bar: 68, market: true, competition: 'Feature Films (Official Competition)', secondStrand: 'Contrechamp', eligibility: 'Animated work completed in the last eighteen months; the official competition wants international premieres.' },
  tribeca: { premiere: 'world', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 95_00, prestige: 74, bar: 66, market: true, competition: 'U.S. Narrative Competition', secondStrand: 'Spotlight Narrative', eligibility: 'World premieres for the competitions, North American premieres for Spotlight; nothing already released in the United States.' },
  'sheffield-docfest': { premiere: 'international', focus: 'documentary', formats: ['documentary', 'short'], feeCents: 50_00, prestige: 62, bar: 64, market: true, competition: 'International Competition', secondStrand: 'Rebellions', eligibility: 'Documentaries as UK premieres at least; the competitions take world and international premieres.' },
  sydney: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 60_00, prestige: 62, bar: 62, market: false, competition: 'Official Competition', secondStrand: 'Features', eligibility: 'Australian premieres for the Official Competition.' },
  shanghai: { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 68, bar: 68, market: true, competition: 'Golden Goblet Main Competition', secondStrand: 'Panorama', eligibility: 'World or international premieres for the Golden Goblet.' },
  'karlovy-vary': { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 74, bar: 70, market: true, competition: 'Crystal Globe Competition', secondStrand: 'Horizons', eligibility: 'World or international premieres for the Crystal Globe; Proxima takes first and second features.' },
  fantasia: { premiere: 'none', focus: 'genre', formats: [...FILM, 'short'], feeCents: 45_00, prestige: 58, bar: 60, market: true, competition: 'Cheval Noir Competition', secondStrand: 'Selection Camera Lucida', eligibility: 'Genre films, with Canadian premieres preferred; no strict premiere rule.' },
  locarno: { premiere: 'world', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 82, bar: 74, market: true, competition: 'Concorso internazionale', secondStrand: 'Concorso Cineasti del presente', eligibility: 'World premieres for the competitions; the Piazza Grande takes international premieres.' },
  miff: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 55_00, prestige: 60, bar: 62, market: true, competition: 'Bright Horizons Competition', secondStrand: 'Headliners', eligibility: 'Australian premieres for Bright Horizons.' },
  edinburgh: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 50_00, prestige: 58, bar: 60, market: false, competition: 'Sean Connery Prize competition', secondStrand: 'Special Screenings', eligibility: 'UK premieres for the competition.' },
  sarajevo: { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 62, bar: 64, market: true, competition: 'Competition Programme – Feature Film', secondStrand: 'Kinoscope', eligibility: 'Films from Southeast Europe for the competition, as world or international premieres.', countries: ['ba', 'hr', 'rs', 'si', 'me', 'mk', 'al', 'bg', 'ro', 'gr', 'hu', 'tr', 'cy', 'md', 'ua', 'ge', 'am', 'az', 'xk', 'mt'] },
  venice: { premiere: 'world', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 0, prestige: 98, bar: 80, market: true, competition: 'Competition (Venezia)', secondStrand: 'Orizzonti', eligibility: 'World premieres for the Competition and Orizzonti; nothing released, broadcast or put online anywhere.' },
  telluride: { premiere: 'north_american', focus: 'general', formats: [...FILM, 'short'], feeCents: 60_00, prestige: 84, bar: 78, market: false, competition: 'The Show (main programme)', secondStrand: 'Backlot', eligibility: 'The programme is chosen by invitation and kept secret until the day before; North American premieres, shared with Venice by tradition.' },
  tiff: { premiere: 'north_american', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 95_00, prestige: 92, bar: 74, market: true, competition: 'Platform', secondStrand: 'Special Presentations', eligibility: 'North American premieres for Galas, Special Presentations and Platform; nothing released in Canada; Platform is for films without a distributor.' },
  'san-sebastian': { premiere: 'world', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 84, bar: 74, market: true, competition: 'Official Selection', secondStrand: 'Perlak', eligibility: 'World premieres for the Official Selection; Perlak takes the year\'s best from other festivals.' },
  'fantastic-fest': { premiere: 'none', focus: 'genre', formats: [...FILM, 'short'], feeCents: 55_00, prestige: 62, bar: 62, market: true, competition: 'Features', secondStrand: 'Next Wave', eligibility: 'Genre films; US premieres preferred.' },
  zurich: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 40_00, prestige: 66, bar: 66, market: true, competition: 'Feature Film Competition', secondStrand: 'Gala Premieres', eligibility: 'First to third features for the competitions, as Swiss premieres at least.' },
  nyff: { premiere: 'north_american', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 84, bar: 78, market: false, competition: 'Main Slate', secondStrand: 'Spotlight', eligibility: 'Chosen by a selection committee; no competition, no fee, and no film that has been released in New York.' },
  busan: { premiere: 'international', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 0, prestige: 78, bar: 70, market: true, competition: 'Competition (Asian cinema, since 2025)', secondStrand: 'A Window on Asian Cinema', eligibility: 'Asian films as world or international premieres for the competition; the rest of Asia and the world in the panorama strands.' },
  'bfi-london': { premiere: 'none', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 45_00, prestige: 78, bar: 70, market: true, competition: 'Official Competition', secondStrand: 'Galas', eligibility: 'UK premieres; the Official Competition takes films that have not been released in the UK.' },
  sitges: { premiere: 'none', focus: 'genre', formats: [...FILM, 'short'], feeCents: 60_00, prestige: 66, bar: 64, market: true, competition: 'Oficial Fantàstic Competition', secondStrand: 'Panorama Fantàstic', eligibility: 'Fantastic, horror and genre films, Spanish premieres for the competition.' },
  hamptons: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 60_00, prestige: 56, bar: 60, market: false, competition: 'Narrative Competition', secondStrand: 'Spotlight', eligibility: 'East Coast premieres preferred; no strict rule.' },
  'mill-valley': { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 60_00, prestige: 56, bar: 60, market: false, competition: 'US Cinema', secondStrand: 'World Cinema', eligibility: 'No premiere rule; a favourite stop for the season\'s contenders.' },
  chicago: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 60_00, prestige: 60, bar: 62, market: false, competition: 'International Feature Competition', secondStrand: 'Spotlight', eligibility: 'North American premieres preferred for the competition.' },
  middleburg: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 50_00, prestige: 54, bar: 60, market: false, competition: 'Featured Films', secondStrand: 'Documentaries', eligibility: 'No premiere rule.' },
  'austin-film-festival': { premiere: 'none', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 60_00, prestige: 56, bar: 58, market: false, competition: 'Narrative Feature Competition', secondStrand: 'Marquee Features', eligibility: 'No premiere rule; the writers\' festival.' },
  tokyo: { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 72, bar: 68, market: true, competition: 'Competition', secondStrand: 'Gala Selection', eligibility: 'World or international premieres for the Competition.' },
  savannah: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 55_00, prestige: 54, bar: 58, market: false, competition: 'Competition Features', secondStrand: 'Gala Screenings', eligibility: 'No premiere rule.' },
  'afi-fest': { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 60_00, prestige: 66, bar: 66, market: false, competition: 'World Cinema', secondStrand: 'Red Carpet Premieres', eligibility: 'Los Angeles premieres at least.' },
  tallinn: { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 68, bar: 66, market: true, competition: 'Official Selection – Competition', secondStrand: 'Critics\' Picks', eligibility: 'World or international premieres for the Official Selection; first features have their own competition.' },
  'doc-nyc': { premiere: 'none', focus: 'documentary', formats: ['documentary', 'short'], feeCents: 60_00, prestige: 62, bar: 62, market: true, competition: 'U.S. Competition', secondStrand: 'Metropolis', eligibility: 'Documentaries; New York premieres for the competitions.' },
  cairo: { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 64, bar: 64, market: true, competition: 'International Competition', secondStrand: 'International Panorama', eligibility: 'World or international premieres for the International Competition; Arab films have their own strand.' },
  camerimage: { premiere: 'none', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 50_00, prestige: 64, bar: 66, market: false, competition: 'Main Competition', secondStrand: 'Special Screenings', eligibility: 'Judged on the cinematography; no premiere rule.' },
  idfa: { premiere: 'world', focus: 'documentary', formats: ['documentary', 'short'], feeCents: 50_00, prestige: 78, bar: 70, market: true, competition: 'International Competition', secondStrand: 'Frontlight', eligibility: 'Documentaries as world or international premieres for the competitions; nothing broadcast or put online.' },
  'iffi-goa': { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 60, bar: 62, market: true, competition: 'International Competition', secondStrand: 'Cinema of the World', eligibility: 'Indian premieres for the International Competition.' },
  marrakech: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 64, bar: 66, market: false, competition: 'Official Competition', secondStrand: 'Gala Screenings', eligibility: 'First or second features for the Official Competition.' },
  'red-sea': { premiere: 'none', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 0, prestige: 62, bar: 64, market: true, competition: 'Red Sea: Competition', secondStrand: 'Red Sea: Festival Favourites', eligibility: 'Films from Africa, Asia and the Arab world for the competition; no strict premiere rule.' },
  'palm-springs': { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 60_00, prestige: 62, bar: 62, market: false, competition: 'New Voices/New Visions', secondStrand: 'World Cinema Now', eligibility: 'No premiere rule; the international feature submissions gather here.' },
  'clermont-ferrand': { premiere: 'none', focus: 'shorts', formats: ['short'], feeCents: 0, prestige: 64, bar: 66, market: true, competition: 'International Competition', secondStrand: 'Lab Competition', eligibility: 'Short films under sixty minutes completed in the last two years.' },
  goteborg: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 40_00, prestige: 60, bar: 62, market: true, competition: 'Nordic Competition', secondStrand: 'International Competition', eligibility: 'Nordic films for the Dragon Award; the rest of the world in the international strands.' },
  viennale: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 60, bar: 66, market: false, competition: 'Features', secondStrand: 'Documentaries', eligibility: 'Austrian premieres; chosen by the director of the festival.' },
  thessaloniki: { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 60, bar: 64, market: true, competition: 'International Competition', secondStrand: 'Open Horizons', eligibility: 'First or second features as world or international premieres for the competition.' },
  guadalajara: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 62, bar: 62, market: true, competition: 'Ibero-American Fiction Feature Competition', secondStrand: 'Galas', eligibility: 'Ibero-American films for the competitions.', countries: ['mx', 'es', 'pt', 'br', 'ar', 'cl', 'co', 'pe', 've', 'uy', 'py', 'bo', 'ec', 'cu', 'do', 'gt', 'hn', 'sv', 'ni', 'cr', 'pa', 'pr'] },
  morelia: { premiere: 'none', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 60, bar: 62, market: false, competition: 'Mexican Feature Competition', secondStrand: 'International Selection', eligibility: 'Mexican films for the competitions.', countries: ['mx'] },
  'mar-del-plata': { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 64, bar: 64, market: true, competition: 'International Competition', secondStrand: 'Panorama', eligibility: 'World or international premieres for the International Competition.' },
  warsaw: { premiere: 'international', focus: 'general', formats: [...FILM, 'short'], feeCents: 0, prestige: 62, bar: 64, market: true, competition: 'International Competition', secondStrand: 'Discoveries', eligibility: 'World or international premieres for the competitions.' },
  outfest: { premiere: 'none', focus: 'general', formats: [...FILM, 'short', 'series'], feeCents: 55_00, prestige: 56, bar: 58, market: false, competition: 'Narrative Features', secondStrand: 'Documentary Features', eligibility: 'LGBTQ+ stories; Los Angeles premieres preferred.' },
};

/** What the older, fictional festivals were called, so a save's history still reads. */
export const LEGACY_FESTIVAL_NAMES: Record<string, string> = {
  alpine: 'Alpine Film Festival',
  lumiere: 'Lumiere International Film Festival',
  meridian_fest: 'Meridian Festival',
  coastline: 'Coastline Film Festival',
  harbourlight: 'Harbourlight Festival',
  southbank: 'Southbank Documentary Festival',
  redrock: 'Red Rock Genre Festival',
  crescent: 'Crescent City Shorts',
};

export type PrizeKind = 'top' | 'grand' | 'jury' | 'director' | 'actor' | 'actress' | 'performance' | 'screenplay' | 'first_feature' | 'documentary' | 'short' | 'audience' | 'craft' | 'other';

/** What a festival prize is for, from its name. */
export function classifyPrize(name: string): PrizeKind {
  const s = name.toLowerCase();
  if (/audience|prix du public|people's choice|publikum|público|pubblico|観客|觀眾|관객|popular/.test(s)) return 'audience';
  if (/short|court|corto|kurz|短|단편|pardino/.test(s)) return 'short';
  if (/documentar|nonfiction|non-fiction|doc\b|docs?\b|grierson|l'œil d'or|golden eye for best documentary/.test(s)) return 'documentary';
  if (/first feature|first film|debut|caméra d'or|camera d'or|de laurentiis|new director|first-time|opera prima|esordio|sutherland|new currents|gwff|perspectives award|new flesh|bright horizons|cineasti del presente|proxima|kutxabank/.test(s)) return 'first_feature';
  if (/screenplay|screenwriting|scénario|guion|sceneggiatura|writing|waldo salt/.test(s)) return 'screenplay';
  if (/actress|volpi cup for best actress|female|leading performance|actriz|attrice|女/.test(s) && !/actor\b/.test(s)) return 'actress';
  if (/\bactor\b|volpi cup for best actor|male|actor\b|attore|男/.test(s)) return 'actor';
  if (/performance|performer|acting|interpretación|interprétation|marcello mastroianni|revelation/.test(s)) return 'performance';
  if (/director|directing|direction|réalisation|regia|regie|dirección|kurosawa akira|kieślowski|kieslowski/.test(s)) return 'director';
  if (/cinematograph|photograph|frog|tadpole|music|score|editing|sound|design|artistic contribution|artistic achievement|technical/.test(s)) return 'craft';
  if (/palme d'or|golden lion|golden bear|golden leopard|pardo d'oro|golden shell|golden goblet|crystal globe|golden alexander|golden pyramid|tokyo grand prix|busan award|grand prize|golden peacock|golden yusr|golden eye for best feature|golden hugo|golden star|étoile d'or|grand prix for best film|warsaw grand prix|astor de oro|mayahuel de plata for best ibero|tiger award|dox:award|idfa award for best film|cristal for a feature|cheval noir|founders award|best feature|best film|best narrative feature|best u\.s\. narrative|best international narrative|best picture|best fiction|best international feature|gold hugo|grand jury prize|grand jury award|best documentary feature award|best international feature documentary|sean connery prize|heart of sarajevo for best feature|golden alexander$|dragon award best nordic film|best feature film|golden frog|grand jury award \(international competition\)|golden eye for best feature film|best u\.s\. narrative feature|silver gateway|golden gateway|international competition\)/.test(s)) return 'top';
  if (/grand prix|grand jury|silver lion|silver bear grand|jury grand|special grand|silver leopard|special jury prize|special jury award|silver shell|silver alexander|silver pyramid|silver yusr|bronze|jury prize|jury award|special prize|special mention|special jury|honourable mention|honorable mention/.test(s)) return /grand/.test(s) ? 'grand' : 'jury';
  if (/lifetime|honorary|career|tribute|achievement|medallion|honour|honor|fipresci|netpac|ecumenical|queer|teddy|palm dog|label|club|fund|market|fellowship|award to|special award/.test(s)) return 'other';
  return 'other';
}
