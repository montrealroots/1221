/**
 * SLATE — how each real award body decides, and what each category judges.
 *
 * The bodies themselves live in the events data (names, dates, categories).
 * This file is the part a simulation needs on top: what a category is *for*
 * (a lead actress, a screenplay, the picture, a craft), who votes and what
 * they respond to, and the honest limits of what SLATE can judge. A category
 * the simulation cannot evaluate is still listed under the body; it is
 * simply not contested, and the interface says so rather than pretending.
 */

export type CategoryKind =
  | 'picture' | 'picture_drama' | 'picture_comedy' | 'animated' | 'international' | 'documentary'
  | 'short' | 'short_animated' | 'short_documentary' | 'first_feature' | 'independent'
  | 'director' | 'first_director' | 'screenplay' | 'screenplay_original' | 'screenplay_adapted'
  | 'lead_actor' | 'lead_actress' | 'lead_performance' | 'supporting_actor' | 'supporting_actress' | 'supporting_performance'
  | 'newcomer' | 'young_performer' | 'ensemble' | 'stunt_ensemble' | 'voice_performance'
  | 'craft_cinematography' | 'craft_editing' | 'craft_score' | 'craft_song' | 'craft_production_design'
  | 'craft_costume' | 'craft_makeup' | 'craft_sound' | 'craft_vfx' | 'craft_casting' | 'craft_stunts'
  | 'series_drama' | 'series_comedy' | 'series' | 'limited_series' | 'tv_movie' | 'new_series' | 'animated_series'
  | 'tv_lead_actor_drama' | 'tv_lead_actress_drama' | 'tv_lead_actor_comedy' | 'tv_lead_actress_comedy'
  | 'tv_lead_actor_limited' | 'tv_lead_actress_limited' | 'tv_lead_performance' | 'tv_supporting_actor' | 'tv_supporting_actress'
  | 'tv_supporting_performance' | 'tv_ensemble' | 'tv_directing' | 'tv_writing' | 'tv_guest'
  | 'audience' | 'worst_picture' | 'worst_director' | 'worst_actor' | 'worst_actress' | 'worst_supporting_actor'
  | 'worst_supporting_actress' | 'worst_screenplay' | 'worst_combo' | 'worst_sequel'
  | 'honorary';

/** Categories that go to a person rather than to the work. */
export const PERSON_KINDS = new Set<CategoryKind>([
  'director', 'first_director', 'screenplay', 'screenplay_original', 'screenplay_adapted',
  'lead_actor', 'lead_actress', 'lead_performance', 'supporting_actor', 'supporting_actress', 'supporting_performance',
  'newcomer', 'young_performer', 'voice_performance',
  'tv_lead_actor_drama', 'tv_lead_actress_drama', 'tv_lead_actor_comedy', 'tv_lead_actress_comedy',
  'tv_lead_actor_limited', 'tv_lead_actress_limited', 'tv_lead_performance', 'tv_supporting_actor', 'tv_supporting_actress',
  'tv_supporting_performance', 'tv_directing', 'tv_writing', 'tv_guest',
  'worst_director', 'worst_actor', 'worst_actress', 'worst_supporting_actor', 'worst_supporting_actress', 'worst_screenplay',
]);

/** Kinds the simulation decides against the film's reception rather than a person. */
export const WORK_KINDS = new Set<CategoryKind>([
  'picture', 'picture_drama', 'picture_comedy', 'animated', 'international', 'documentary', 'short', 'short_animated',
  'short_documentary', 'first_feature', 'independent', 'ensemble', 'stunt_ensemble',
  'craft_cinematography', 'craft_editing', 'craft_score', 'craft_song', 'craft_production_design', 'craft_costume',
  'craft_makeup', 'craft_sound', 'craft_vfx', 'craft_casting', 'craft_stunts',
  'series_drama', 'series_comedy', 'series', 'limited_series', 'tv_movie', 'new_series', 'animated_series', 'tv_ensemble',
  'audience', 'worst_picture', 'worst_combo', 'worst_sequel',
]);

const has = (s: string, ...words: string[]) => words.some((w) => s.includes(w));
const word = (s: string, re: RegExp) => re.test(s);

/**
 * What a category is for, read from its name in whichever language the body
 * writes it. The CJK bodies carry an English gloss in brackets, which is read
 * too. Returns undefined for a category SLATE cannot judge (honorary awards,
 * podcasts, commercials, student films, sports coverage), which is then
 * listed but never contested.
 */
export function classifyCategory(name: string): CategoryKind | undefined {
  const s = name.toLowerCase();

  // Not contests: honours, tributes, things outside the simulation.
  if (has(s, 'honorary', 'lifetime', 'career achievement', 'achievement award', 'fellowship', 'icon award', 'tribute', 'hall of fame',
    'humanitarian', 'trailblazer', 'vanguard award', 'special award', 'lycéens', 'giovani', 'di honor', 'de honor', 'd\'honneur', 'honorary',
    'heritage', 'milestone', 'visionary', 'innovation', 'governors', 'ub iwerks', 'june foray', 'winsor mccay', 'seeher', 'chairman', 'president\'s',
    'entertainer of the year', 'personality', 'commercial', 'promotional', 'podcast', 'video game', 'videogame', 'interactive', 'student',
    'sports', 'news', 'radio', 'audio', 'game show', 'quiz', 'talk', 'variety', 'sketch', 'stand-up', 'reality', 'competition program',
    'children\'s', 'preschool', 'daytime', 'live event', 'current affairs', 'specialist factual', 'factual', 'non-fiction', 'nonfiction',
    'main title', 'motion design', 'lighting', 'technical direction', 'emerging', 'trailer', 'music video', 'music film', 'compilation',
    'box office achievement', 'cinematic and box office', 'top ten', 'top five', 'freedom of expression', 'made in ny', 'grant', 'appreciation',
    'redeemer', 'legacy', 'hero award', 'unforgettables', 'amicus', 'pare lorentz', 'wolper', 'abc news', 'pennebaker', 'catalyst', 'institutional',
    'public service', 'arts', 'ceremony', 'dialling', 'honorees', 'crafts (multiple)', '(multiple)', 'the same five', 'each (multiple)',
    'demille', 'burnett', 'narrator', 'narration', 'contribution to cinema', 'altman', 'someone to watch', 'truer than fiction', 'producers award',
    'spotlight award', 'memorable moment', 'new generation', 'kramer', 'aldrich', 'curtis clark', 'méliès', 'melies', 'outstanding product', 'computer cinematic',
    'bowers', 'apple award', 'stalmaster', 'collaborator', 'theatrical productions', 'artisan', 'special production', 'home media', 'contestant',
    'social celebrity', 'culinary', 'host', 'internacional', 'longford', 'digital media', 'earle grey', 'golden screen', 'technical award', 'best play',
    'impact award', 'produttore', 'carriera', 'richard harris', 'special jury prize', 'ehrenpreis', 'ariel de oro', 'excellence in asian', 'next generation',
    'irish language', 'service award', 'jury prize', 'gucci')) {
    return 'honorary';
  }

  // Worst of the year.
  if (s.startsWith('worst') || has(s, 'peor', 'worst')) {
    if (has(s, 'screen combo', 'combo')) return 'worst_combo';
    if (has(s, 'remake', 'sequel', 'rip-off')) return 'worst_sequel';
    if (has(s, 'supporting actor')) return 'worst_supporting_actor';
    if (has(s, 'supporting actress')) return 'worst_supporting_actress';
    if (has(s, 'actress')) return 'worst_actress';
    if (has(s, 'actor')) return 'worst_actor';
    if (has(s, 'director')) return 'worst_director';
    if (has(s, 'screenplay')) return 'worst_screenplay';
    return 'worst_picture';
  }

  const tv = (has(s, 'series', 'série', 'serie', 'television', 'televisión', 'tv ', 'tv/', 'tv-', 'télévision', 'episodic', 'episode', 'limited', 'miniseries',
    'mini-series', 'anthology', 'telenovela', 'drama (tv)', '(tv)', 'streamed or televised', 'made for television', 'telefeature', 'broadcast', 'programme', 'program',
    'show of the year', 'fiction special', 'achievement in drama', 'achievement in comedy')
    || word(s, /^best drama$/))
    && !has(s, 'motion picture', 'feature film');
  const supporting = has(s, 'supporting', 'second rôle', 'reparto', 'non protagonista', 'nebenrolle', 'coactuación', '助演', '조연', '配角', 'supporting role');
  const feminine = has(s, 'femenina', 'féminin', 'femminile');
  const masculine = has(s, 'masculina', 'masculin', 'maschile');
  const actress = word(s, /\bactress\b/) || feminine || has(s, 'actrice', 'actriz', 'attrice', 'schauspielerin', 'female actor', 'female', '女優', '女主角', '女配角', '여우', 'weibliche');
  const actor = (word(s, /\bactor\b/) && !has(s, 'female actor')) || masculine || has(s, 'acteur', 'attore', 'schauspieler ', 'male actor', ' male ', '男優', '男主角', '男配角', '남우', 'männliche')
    || (word(s, /\bactor\b/) && !actress);
  const performance = has(s, 'performance', 'performer', 'interpretación', 'interprétation', 'protagonista', 'lead role', 'leading role', 'hauptrolle', 'acting', 'coactuación', 'star');
  const guest = has(s, 'guest');
  const ensemble = has(s, 'ensemble', 'cast in a motion picture', 'cast in', 'elenco', 'ensemble cast');
  const stunt = has(s, 'stunt');
  const voice = has(s, 'voice');
  const young = has(s, 'young', 'younger', 'youth', 'child performer');
  const newcomer = has(s, 'révélation', 'revelación', 'new performer', 'newcomer', 'breakthrough performer', 'breakthrough performance', 'new actor', 'new actress',
    'espoir', '新人', '신인', 'rising star', 'debut performance', 'male debut', 'female debut', 'breakthrough');

  // Television.
  if (tv) {
    if (has(s, 'animated', 'animation')) return 'animated_series';
    if (has(s, 'director', 'directing', 'direction', 'réalisation', 'regie', 'dirección')) return 'tv_directing';
    if (has(s, 'writing', 'writer', 'screenplay', 'script', 'teleplay', 'scénario', 'guion')) return 'tv_writing';
    if (guest) return 'tv_guest';
    if (ensemble) return 'tv_ensemble';
    if (stunt) return 'honorary';
    if (actress || actor || performance || newcomer) {
      if (supporting) return actress ? 'tv_supporting_actress' : actor ? 'tv_supporting_actor' : 'tv_supporting_performance';
      const limited = has(s, 'limited', 'miniseries', 'mini-series', 'anthology', 'movie', 'film', 'telefeature');
      const comedy = has(s, 'comedy', 'musical or comedy', 'comédie', 'comedia');
      if (actress) return limited ? 'tv_lead_actress_limited' : comedy ? 'tv_lead_actress_comedy' : 'tv_lead_actress_drama';
      if (actor) return limited ? 'tv_lead_actor_limited' : comedy ? 'tv_lead_actor_comedy' : 'tv_lead_actor_drama';
      return 'tv_lead_performance';
    }
    if (has(s, 'limited', 'miniseries', 'mini-series', 'anthology') && !has(s, 'movie', 'film')) return 'limited_series';
    if (has(s, 'television movie', 'tv movie', 'movie made for television', 'television film', 'tv film', 'telefeature', 'original film', 'streamed or televised motion', 'single drama', 'television movie, limited', 'movies for television', 'limited series, anthology series or television film', 'limited or anthology series or movie', 'movie/mini', 'tv movie/mini')) {
      return has(s, 'limited', 'mini', 'anthology') ? 'limited_series' : 'tv_movie';
    }
    if (has(s, 'new series', 'breakthrough series', 'new scripted', 'new program', 'breakthrough comedy', 'breakthrough drama')) return 'new_series';
    if (has(s, 'fiction special')) return 'tv_movie';
    if (has(s, 'individual achievement')) return 'tv_lead_performance';
    if (has(s, 'comedy', 'comédie', 'comedia')) return 'series_comedy';
    if (has(s, 'drama', 'drame')) return 'series_drama';
    if (has(s, 'documentary', 'docuseries')) return 'honorary';
    return 'series';
  }

  // People, in film.
  if (has(s, 'first-time feature film director', 'first feature film director', 'debut director', 'esordio alla regia', 'dirección novel', 'new director', 'best directorial debut', 'first-time director', 'douglas hickox', 'bingham ray', 'breakthrough director', 'new narrative director', 'new documentary director', 'nuevo director', 'debutant')) return 'first_director';
  if (has(s, 'director', 'directing', 'direction', 'réalisation', 'réalisateur', 'regia', 'regie', 'dirección', 'regista', '監督', '감독', '導演', '导演', 'directorial')) return 'director';
  if (has(s, 'adapted', 'adaptation', 'non originale', 'adaptado', 'non-original', 'non original', 'nicht-original', '改編', '改编')) return 'screenplay_adapted';
  if (has(s, 'original screenplay', 'scénario original', 'guion original', 'sceneggiatura originale', 'original story', 'best story', '原著劇本', 'original story')) return 'screenplay_original';
  if (has(s, 'screenplay', 'screenwriter', 'script', 'scénario', 'guion', 'sceneggiatura', 'drehbuch', 'writing', 'writer', '脚本', '각본', '劇本', '编剧', 'dialogue')) return 'screenplay';
  if (voice && (actress || actor || performance || has(s, 'voice'))) return 'voice_performance';
  if (stunt) return 'stunt_ensemble';
  if (ensemble) return 'ensemble';
  if (young) return 'young_performer';
  if (newcomer) return 'newcomer';
  if (actress || actor || performance) {
    if (supporting) return actress ? 'supporting_actress' : actor ? 'supporting_actor' : 'supporting_performance';
    return actress ? 'lead_actress' : actor ? 'lead_actor' : 'lead_performance';
  }

  // Crafts.
  if (has(s, 'cinematograph', 'photograph', 'fotograf', 'kamera', 'camera', '撮影', '攝影', '촬영', 'image', 'bildgestaltung')) return 'craft_cinematography';
  if (has(s, 'editing', 'edited', 'montage', 'montaje', 'montatore', 'montaggio', 'schnitt', '編集', '剪接', '剪辑', '편집', 'editor', 'edición')) return 'craft_editing';
  if (has(s, 'original song', 'canción', 'chanson', 'canzone', 'song', '歌曲', 'lyric')) return 'craft_song';
  if (word(s, /\bscore\b|\bmusic\b|\bmusique\b|\bmúsica\b|\bmusica\b|\bmusik\b|\bfilmmusik\b|compos|音楽|音樂|음악|soundtrack/)) return 'craft_score';
  if (has(s, 'production design', 'art direction', 'scenograf', 'décor', 'dirección artística', 'diseño de arte', 'szenenbild', 'set decor', '美術', '美术', '미술', 'design of a feature', 'decor/design')) return 'craft_production_design';
  if (has(s, 'costume', 'vestuario', 'costumi', 'kostüm', '服裝', '衣装', 'wardrobe')) return 'craft_costume';
  if (has(s, 'makeup', 'make-up', 'make up', 'maquillage', 'maquillaje', 'trucc', 'maske', 'hair', 'acconciat', 'peluquería', '造型')) return 'craft_makeup';
  if (has(s, 'sound', 'sonido', 'suono', '録音', '音響', '音效', '음향', 'mixing', 'dialogue/adr', 'foley', 'tongestaltung') || word(s, /\bson\b|\bton\b/)) return 'craft_sound';
  if (has(s, 'visual effects', 'effets visuels', 'efectos visuales', 'effetti visivi', 'visuelle effekte', 'vfx', 'special effects', 'efectos especiales', '視覺效果', '视觉效果', 'effects')) return 'craft_vfx';
  if (has(s, 'casting')) return 'craft_casting';
  if (has(s, 'action choreography', 'action design', 'best action', 'choreograph', '動作設計')) return 'craft_stunts';

  // The work.
  if (has(s, 'audience', 'people\'s choice', 'popular', 'favorite', 'favourite', 'spettatore', 'público', 'public', '観客', '觀眾', '관객', 'popularity')) return 'audience';
  if (has(s, 'short')) {
    if (has(s, 'animat')) return 'short_animated';
    if (has(s, 'documentar')) return 'short_documentary';
    return 'short';
  }
  if (has(s, 'cortometraje', 'court métrage', 'cortometraggio', 'kurzfilm', '短片', '단편')) {
    if (has(s, 'animación', 'animation', 'animazione', '動畫', '动画')) return 'short_animated';
    if (has(s, 'documental', 'documentaire', 'documentario', '紀錄', '纪录')) return 'short_documentary';
    return 'short';
  }
  if (has(s, 'animated', 'animation', 'animación', 'animazione', 'アニメーション', '動畫', '动画', '美术片', 'animatie')) return 'animated';
  if (has(s, 'documentary', 'documentaire', 'documental', 'documentario', 'dokumentar', '紀錄片', '纪录', 'non-fiction feature', 'nonfiction feature')) return 'documentary';
  if (has(s, 'international', 'foreign', 'étranger', 'iberoamericana', 'europea', 'non-english', 'not in the english language', 'world cinema', 'asian chinese language', 'internazionale', '外国', '外語', '外语', 'flamand', 'coproduction', 'co-production')) return 'international';
  if (has(s, 'first feature', 'premier film', 'ópera prima', 'opera prima', 'first film', 'debut feature', 'first-time', 'erstlingsfilm', 'debut film')) return 'first_feature';
  if (has(s, 'independent', 'indie', 'micro budget', 'small-to-medium budget', 'cassavetes')) return 'independent';
  if (has(s, 'musical or comedy', 'comedy')) return 'picture_comedy';
  if (has(s, 'drama') && has(s, 'picture', 'film')) return 'picture_drama';
  if (has(s, 'picture', 'film', 'feature', 'película', 'pellicola', 'spielfilm', 'kinofilm', 'motion picture', 'movie', '作品', '故事片', '劇情片', '영화', 'producer of theatrical', 'zanuck')) return 'picture';

  return undefined;
}

/** Whether a kind belongs to television rather than film. */
export function isTelevisionKind(kind: CategoryKind): boolean {
  return kind.startsWith('tv_') || ['series_drama', 'series_comedy', 'series', 'limited_series', 'tv_movie', 'new_series', 'animated_series'].includes(kind);
}

/**
 * Who votes, and what moves them. The weights are SLATE's model of each kind
 * of electorate, written in plain words beside the numbers so a nomination
 * can be explained in the body's own terms.
 */
export type VoterKind = 'academy' | 'journalists' | 'actors' | 'producers' | 'directors' | 'writers' | 'craft_guild' | 'critics' | 'audience' | 'jury' | 'animators' | 'genre_fans' | 'razzie_voters' | 'television_academy';

export interface VoterProfile {
  kind: VoterKind;
  /** Who they are, for the explanation. */
  who: string;
  /** Relative weights. They are normalised in use. */
  quality: number;
  critics: number;
  audience: number;
  boxOffice: number;
  standing: number;
  precursors: number;
  campaign: number;
  prestigeGenre: number;
  /** How much a comedy, horror or action film is marked down. */
  populistPenalty: number;
  noise: number;
  /** What this electorate is known to respond to, in a sentence. */
  responds: string;
}

export const VOTER_PROFILES: Record<VoterKind, VoterProfile> = {
  academy: { kind: 'academy', who: 'the members of the Academy, each branch voting its own craft for nominations and everyone voting the winners', quality: 0.34, critics: 0.22, audience: 0.04, boxOffice: 0.04, standing: 0.12, precursors: 0.14, campaign: 0.06, prestigeGenre: 8, populistPenalty: 6, noise: 7, responds: 'Serious drama, craft, and the momentum a film brings from the guilds and the critics.' },
  television_academy: { kind: 'television_academy', who: 'the members of the Television Academy, peer groups voting their own categories', quality: 0.34, critics: 0.24, audience: 0.08, boxOffice: 0.0, standing: 0.12, precursors: 0.08, campaign: 0.08, prestigeGenre: 4, populistPenalty: 2, noise: 7, responds: 'Prestige drama and sharp comedy, returning favourites, and a well-run For Your Consideration campaign.' },
  journalists: { kind: 'journalists', who: 'some three hundred entertainment journalists from around the world', quality: 0.26, critics: 0.20, audience: 0.06, boxOffice: 0.08, standing: 0.18, precursors: 0.06, campaign: 0.10, prestigeGenre: 4, populistPenalty: 0, noise: 9, responds: 'Star power, a good press tour, films that travel, and comedies and musicals in their own categories.' },
  actors: { kind: 'actors', who: 'working actors, voting for other actors', quality: 0.30, critics: 0.18, audience: 0.06, boxOffice: 0.04, standing: 0.22, precursors: 0.10, campaign: 0.06, prestigeGenre: 4, populistPenalty: 2, noise: 7, responds: 'The performance itself, an ensemble that plays as one, and actors they admire.' },
  producers: { kind: 'producers', who: 'producers, on a preferential ballot', quality: 0.34, critics: 0.20, audience: 0.06, boxOffice: 0.10, standing: 0.08, precursors: 0.10, campaign: 0.08, prestigeGenre: 6, populistPenalty: 2, noise: 6, responds: 'Films that were well made and well handled, and that the whole room can live with in second place.' },
  directors: { kind: 'directors', who: 'directors, voting for directors', quality: 0.40, critics: 0.24, audience: 0.02, boxOffice: 0.04, standing: 0.14, precursors: 0.06, campaign: 0.04, prestigeGenre: 6, populistPenalty: 2, noise: 6, responds: 'Command of the film, scale handled well, and a director\'s standing among peers.' },
  writers: { kind: 'writers', who: 'writers, voting for writers, on scripts written under the guild\'s agreement', quality: 0.38, critics: 0.26, audience: 0.02, boxOffice: 0.02, standing: 0.10, precursors: 0.06, campaign: 0.04, prestigeGenre: 4, populistPenalty: 0, noise: 8, responds: 'The script on the page, wit, structure, and originality.' },
  craft_guild: { kind: 'craft_guild', who: 'the members of the craft guild, judging their own craft', quality: 0.44, critics: 0.16, audience: 0.02, boxOffice: 0.06, standing: 0.06, precursors: 0.04, campaign: 0.06, prestigeGenre: 2, populistPenalty: 0, noise: 8, responds: 'The craft itself, whatever the film; a spectacle can win here that wins nothing else.' },
  critics: { kind: 'critics', who: 'critics, voting early and among themselves', quality: 0.30, critics: 0.42, audience: 0.0, boxOffice: 0.0, standing: 0.08, precursors: 0.0, campaign: 0.0, prestigeGenre: 6, populistPenalty: 2, noise: 9, responds: 'The reviews, auteurs, and the pleasure of getting there first. Campaigns do nothing here.' },
  audience: { kind: 'audience', who: 'the public, voting online', quality: 0.10, critics: 0.04, audience: 0.40, boxOffice: 0.26, standing: 0.16, precursors: 0.0, campaign: 0.0, prestigeGenre: 0, populistPenalty: -8, noise: 8, responds: 'What people actually watched and loved, and the stars they follow.' },
  jury: { kind: 'jury', who: 'a small jury, in a room, for a fortnight', quality: 0.46, critics: 0.18, audience: 0.0, boxOffice: 0.0, standing: 0.08, precursors: 0.0, campaign: 0.0, prestigeGenre: 8, populistPenalty: 4, noise: 12, responds: 'The film in front of them and the argument in the room. Nothing else gets in.' },
  animators: { kind: 'animators', who: 'the members of ASIFA-Hollywood, animation professionals', quality: 0.42, critics: 0.24, audience: 0.08, boxOffice: 0.06, standing: 0.06, precursors: 0.04, campaign: 0.06, prestigeGenre: 0, populistPenalty: 0, noise: 8, responds: 'The animation itself, character and design, from people who do it.' },
  genre_fans: { kind: 'genre_fans', who: 'the members of the Academy of Science Fiction, Fantasy and Horror Films', quality: 0.30, critics: 0.18, audience: 0.22, boxOffice: 0.14, standing: 0.08, precursors: 0.0, campaign: 0.04, prestigeGenre: -4, populistPenalty: -10, noise: 9, responds: 'Genre done with conviction; the films other bodies overlook.' },
  razzie_voters: { kind: 'razzie_voters', who: 'the paying members of the Golden Raspberry Award Foundation', quality: -0.40, critics: -0.36, audience: -0.10, boxOffice: 0.10, standing: 0.04, precursors: 0.0, campaign: 0.0, prestigeGenre: 0, populistPenalty: 0, noise: 10, responds: 'The worst-reviewed films that the most people saw, and famous names attached to them.' },
};

/**
 * The eligibility window a body judges, relative to the ceremony year.
 * - calendar: the previous calendar year (most film bodies).
 * - emmy: June 1 of the previous year to May 31 of the ceremony year.
 * - bafta: the previous calendar year plus January and part of February of the ceremony year, as the UK release calendar runs.
 * - same_year: the ceremony year itself (television bodies that judge the season just ended, held in May or June).
 */
export type WindowKind = 'calendar' | 'emmy' | 'bafta' | 'same_year';

/** What sort of release a body requires. */
export type ReleaseRequirement = 'theatrical' | 'any' | 'television' | 'festival_or_release';

export interface BodyRules {
  voters: VoterKind;
  window: WindowKind;
  release: ReleaseRequirement;
  /** 0-100, how much a win moves a career. */
  prestige: number;
  /** Nominees per category; the picture category may take more. */
  slots: number;
  pictureSlots?: number;
  /** Whether a For Your Consideration campaign is even possible. Critics and juries take none. */
  campaignable: boolean;
  /** Winners are announced on the "nominations" day and the ceremony is a dinner (the critics' groups). */
  announcesWinnersDirectly?: boolean;
  /** Formats the body judges at all. */
  formats?: ('feature' | 'short' | 'series' | 'limited_series' | 'tv_movie' | 'documentary' | 'special')[];
  /** Production countries admitted (SLATE country ids). */
  countries?: string[];
  /** Languages admitted (ISO 639-1). */
  languages?: string[];
  /** Budget ceiling in cents, for the independent bodies. */
  maxBudget?: number;
  /** Not owned by a studio. */
  notStudio?: boolean;
  /** Only these genres (the genre academies). */
  genres?: string[];
  /** Only animated work. */
  animatedOnly?: boolean;
  /** Only documentary work. */
  documentaryOnly?: boolean;
  /** The rule in a sentence, as the body itself would put it. */
  eligibility: string;
  /** What SLATE cannot check, said plainly. */
  approximation?: string;
}
