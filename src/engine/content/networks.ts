/**
 * SLATE — the real networks and streaming services.
 *
 * Who owns them, who runs them, what they pay for, and the deals that decide
 * where a film goes after the cinema. Leadership carries the source that
 * confirmed the seat this year, or none when it is from the record; a seat
 * that could not be confirmed says so rather than guessing. Reach figures
 * are the services' last published numbers or SLATE's estimate, and are
 * labelled as such.
 *
 * Deals are the public ones: a pay-one window is where a studio's films go
 * after cinemas; an output deal is a standing commitment; "own" means the
 * network and the studio share a parent.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';
import type { Money } from '../core/money';
import type { Leader, StudioFormat } from './studios';

export type NetworkKind = 'streaming' | 'broadcast' | 'cable' | 'premium';
export type DealKind = 'own' | 'pay_one' | 'pay_one_second' | 'output' | 'library' | 'next_day' | 'co_production' | 'supply';

export interface NetworkDeal {
  studioId: string;
  kind: DealKind;
  note: string;
  /** A URL that confirmed the deal this year. Absent means from the record. */
  source?: string;
}

export interface NetworkSeed {
  id: string;
  name: string;
  shortName: string;
  type: NetworkKind;
  aliases?: string[];
  parent?: { name: string; note?: string };
  ownership: string;
  countryId: string;
  city: string;
  founded?: number;
  leadership: Leader[];
  status?: string;
  description: string;
  deals: NetworkDeal[];
  /** Reach, as last published or estimated. */
  reach?: { value: number; unit: 'subscribers' | 'monthly users' | 'households' | 'primetime viewers'; note: string };
  /** What it commissions. */
  formats: StudioFormat[];
  wants: string[];
  avoids: string[];
  /** Season budgets it will commission, in cents. */
  budgetFloor: Money;
  budgetCeiling: Money;
  /** New scripted series a year, roughly. */
  slateSize: number;
  accessDifficulty: number;
  riskAppetite: number;
  prestigeBias: number;
  /** Names the catalogue records as the broadcaster of a series. */
  broadcasterNames: string[];
}

export interface Network extends NetworkSeed, Omit<ReferenceRecord, 'id' | 'name' | 'type' | 'aliases'> {}

const M = 1_000_000_00;
const V = REFERENCE_VERSION;

const S = {
  disney: 'https://thewaltdisneycompany.com/press-releases/the-walt-disney-company-sets-leadership-team-for-expanded-disney-entertainment-segment/',
  fx: 'https://thedesk.net/2026/03/disney-entertainment-executive-leadership-changes/',
  erwich: 'https://deadline.com/2026/03/debra-oconnell-disney-craig-erwich-20th-television-1236757197/',
  peacock: 'https://variety.com/2026/tv/news/matt-strauss-nbcuniversal-peacock-streaming-strictly-1236829718/',
  nbcu: 'https://www.thewrap.com/nbcuniversal-leadership-changes-universal-television-entertainment-group/',
  versant: 'https://variety.com/2026/tv/news/comcast-completes-versant-spinoff-stock-public-company-1236623658/',
  prime: 'https://www.hollywoodreporter.com/business/business-news/peter-friedlander-head-of-tv-amazon-mgm-studios-1236386015/',
  hbo: 'https://variety.com/2026/tv/global/hbo-max-bosses-storngest-slate-hbo-max-roll-out-italy-1236632158/',
  paramountPlus: 'https://www.paramountpressexpress.com/paramount-plus/executives/?view=cindy-holland',
  cbs: 'https://deadline.com/2026/04/george-cheeks-late-show-replaced-comics-unleashed-cbs-late-night-1236861996/',
  fox: 'https://www.foxcorporation.com/management/business-unit-leaders/rob-wade/',
  cw: 'https://www.hollywoodreporter.com/tv/tv-news/shakeup-the-cw-dennis-miller-exit-brad-schwartz-1236033503/',
  amc: 'https://deadline.com/2025/10/amc-networks-ceo-kristin-dolan-reupped-2028-1236577682/',
  starz: 'https://investors.starz.com/management/jeffrey-hirsch',
  tubi: 'https://www.hollywoodreporter.com/business/digital/tubi-hits-110-million-monthly-users-fox-streamer-report-1236665132/',
  hallmark: 'https://deadline.com/2026/03/hallmark-media-darren-abbott-president-1236770144/',
  ae: 'https://deadline.com/2026/08/disney-deal-closed-ae-global-media-stake-hearst-price-1237017577/',
  cn: 'https://en.wikipedia.org/wiki/The_Cartoon_Network,_Inc.',
  bet: 'https://variety.com/2025/tv/news/scott-mills-exiting-bet-louis-carr-president-1236598869/',
  showtime: 'https://au.variety.com/2025/biz/news/skydance-tv-matt-thunell-paramount-studios-26101',
  crunchyroll: 'https://www.hollywoodreporter.com/movies/movie-news/crunchyroll-launch-taiwan-south-korea-1236623182/',
  roku: 'https://www.pbs.org/newshour/economy/fox-corp-to-buy-streaming-pioneer-roku-in-a-22-billion-deal',
  pbs: 'https://foundation.pbs.org/team_member/paula-a-kerger/',
  bbc: 'https://en.wikipedia.org/wiki/Tim_Davie',
  bbcPhillips: 'https://www.hollywoodreporter.com/news/general-news/bbc-kate-phillips-chief-content-officer-charlotte-moore-1236294038/',
  itv: 'https://deadline.com/2026/07/sky-acquires-itv-love-island-1236973761/',
  channel4: 'https://variety.com/2025/tv/global/priya-dogra-chief-executive-u-k-broadcaster-channel-4-1236605146/',
  sky: 'https://www.skygroup.sky/about/our-company/leadership/dana-strong',
  canal: 'https://www.screendaily.com/news/canal-names-anna-marsh-chief-content-officer/5204024.article',
  tf1: 'https://fr.wikipedia.org/wiki/Rodolphe_Belmer',
  zdf: 'https://www.zdfheute.de/in-eigener-sache/norbert-himmler-wiederwahl-zdf-intendant-100.html',
  ard: 'https://presseportal.zdf.de/pressemitteilung/ard-und-zdf-auf-der-republica-2026',
  rai: 'https://www.economymagazine.it/rai-cambio-ai-vertici-nuovo-presidente-amministratore-delegato-direttore-generale/',
  rtve: 'https://en.wikipedia.org/wiki/Chair_of_RTVE',
  movistar: 'https://variety.com/2026/film/markets-festivals/movistar-plus-management-restructure-alfonso-gomez-palacio-1236753364/',
  fuji: 'https://www.fujitv.com/about/corporate_profile/',
  nhk: 'https://statemediamonitor.com/2026/08/japan-broadcasting-corporation-nhk/',
  tvAsahi: 'https://www.globaldata.com/company-profile/tv-asahi-holdings-corp/executives/',
  ntv: 'https://worldscreen.com/hiroyuki-fukuda-tapped-as-new-nippon-tv-president/',
  mbc: 'https://en.wikipedia.org/wiki/Munhwa_Broadcasting_Corporation',
  jtbc: 'https://en.wikipedia.org/wiki/JTBC',
  kbs: 'https://www.koreaherald.com/article/3830261',
  cjenm: 'https://www.imdb.com/news/ni63803926/',
  jiostar: 'https://www.jiostar.com/about-us/',
  zee: 'https://www.business-standard.com/companies/news/punit-goenka-resigns-as-managing-director-of-zee-appointed-as-ceo-124111900008_1.html',
  spn: 'https://variety.com/2026/tv/news/sony-pictures-networks-india-leadership-restructure-1236632887/',
  iqiyi: 'https://global.chinadaily.com.cn/a/202604/22/WS69e889f8a310d6866eb44ea6.html',
  cctv: 'https://en.wikipedia.org/wiki/China_Central_Television',
  tvb: 'https://en.wikipedia.org/wiki/Thomas_Hui_To',
  cbc: 'https://cbc.radio-canada.ca/en/media-centre/speech-standing-committee-on-canadian-heritage-2026-04-23',
  bell: 'https://deadline.com/2026/02/heated-rivalry-bell-media-sean-cohan-yaga-slo-pitch-canada-1236738442/',
  televisa: 'https://deadline.com/2026/04/televisaunivision-q1-2026-earnings-world-cup-challenge-1236874886/',
  globo: 'https://neofeed.com.br/negocios/convergencia-total-o-que-pensa-paulo-marinho-ceo-da-globo-sobre-a-teve-do-futuro/',
  abcAu: 'https://www.abc.net.au/about/media-centre/press-releases/hugh-marks-appointed-managing-director-of-the-abc/104734236',
  nine: 'https://www.c21media.net/news/australias-nine-entertainment-confirms-appointment-of-matt-stanton-as-new-ceo-and-md/',
  seven: 'https://www.c21media.net/news/jeff-howard-exits-newly-merged-southern-cross-media-group-as-new-chair-takes-the-reigns/',
  stan: 'https://au.variety.com/2026/biz/news/martin-kugeler-football-australia-ceo-31978/',
  canalAfrica: 'https://brandcom.ng/2026/07/15/canal-seals-r55bn-deal-takes-full-control-of-multichoice/',
  showmax: 'https://nairametrics.com/2026/03/05/multichoice-owner-canal-to-shut-down-showmax-streaming-platform/',
  a24Max: 'https://deadline.com/2026/01/a24-hbo-max-renew-pay-1-deal-marty-supreme-1236683170/',
  neonHulu: 'https://www.indiewire.com/news/analysis/a24-films-streaming-on-max-1234932695/',
  focusPeacock: 'https://www.filmtake.com/distribution/cracking-the-code-inside-the-intricate-world-of-content-licensing-deals-and-slate-programming/',
  universalWindows: 'https://www.whats-on-netflix.com/news/universal-pictures-live-action-first-window-deal-with-netflix-begins-a-year-early/',
  lionsgateStarz: 'https://variety.com/2025/tv/news/starz-lionsgate-theatrical-output-deal-split-1236282839/',
  sonyNetflix: 'https://www.thewrap.com/industry-news/business/sony-pictures-entertainment-layoffs-2026/',
  amcNetflix: 'https://deadline.com/2025/08/amc-networks-embraces-ai-ceo-kristin-dolan-technology-ip-1236482175/',
};

const TV: StudioFormat[] = ['series', 'limited_series', 'tv_movie'];
const ALL: StudioFormat[] = ['feature', 'series', 'limited_series', 'documentary', 'tv_movie'];

const SEEDS: NetworkSeed[] = [
  // --- Streaming --------------------------------------------------------------
  {
    id: 'netflix-service', name: 'Netflix', shortName: 'Netflix', type: 'streaming', ownership: 'Independent public company', countryId: 'us', city: 'Los Gatos', founded: 2007,
    leadership: [{ name: 'Ted Sarandos', title: 'Co-Chief Executive Officer' }, { name: 'Greg Peters', title: 'Co-Chief Executive Officer' }, { name: 'Bela Bajaria', title: 'Chief Content Officer', source: 'https://www.thewrap.com/creative-content/movies/netflix-film-chief-dan-lin-outlines-vision/' }],
    description: 'The biggest subscription service in the world, and the biggest buyer of series and films in it.',
    deals: [
      { studioId: 'netflix', kind: 'own', note: 'Its own films and series.' },
      { studioId: 'sony', kind: 'pay_one', note: 'Sony\'s exclusive worldwide streaming home for new features from January 2026.', source: S.sonyNetflix },
      { studioId: 'universal', kind: 'pay_one_second', note: 'Universal\'s live-action films after their first Peacock window, taking over the middle window from Prime Video; animated films already came here.', source: S.universalWindows },
      { studioId: 'amazon-mgm', kind: 'library', note: 'Licensed library titles, as with every studio.' },
    ],
    reach: { value: 301_600_000, unit: 'subscribers', note: 'Last published figure, end of 2024. Netflix stopped reporting membership in 2025.' },
    formats: ALL, wants: ['thriller', 'drama', 'comedy', 'romance', 'documentary', 'crime', 'action'], avoids: [], budgetFloor: 20 * M, budgetCeiling: 300 * M, slateSize: 90, accessDifficulty: 80, riskAppetite: 62, prestigeBias: 48,
    broadcasterNames: ['Netflix'],
  },
  {
    id: 'prime-video', name: 'Prime Video', shortName: 'Prime Video', type: 'streaming', aliases: ['Amazon Prime Video'], parent: { name: 'Amazon' }, ownership: 'Public company', countryId: 'us', city: 'Culver City', founded: 2006,
    leadership: [{ name: 'Mike Hopkins', title: 'Head Of Prime Video And Amazon MGM Studios', source: S.prime }, { name: 'Peter Friedlander', title: 'Head Of Global Television, Amazon MGM Studios', source: S.prime, note: 'Since October 2025.' }, { name: 'Courtenay Valenti', title: 'Head Of Film, Streaming And Theatrical', source: 'https://www.imdb.com/news/ni65168853/' }],
    description: 'Bundled with Prime, which is why it is everywhere. Big swings, sport, and MGM\'s library.',
    deals: [
      { studioId: 'amazon-mgm', kind: 'own', note: 'Amazon MGM\'s own films and series.' },
      { studioId: 'universal', kind: 'pay_one_second', note: 'Held Universal\'s live-action middle window from 2022; Netflix takes it over.', source: S.universalWindows },
    ],
    reach: { value: 200_000_000, unit: 'monthly users', note: 'Amazon\'s stated global monthly viewers, an approximation.' },
    formats: ALL, wants: ['action', 'thriller', 'fantasy', 'science fiction', 'comedy', 'drama'], avoids: [], budgetFloor: 20 * M, budgetCeiling: 300 * M, slateSize: 40, accessDifficulty: 82, riskAppetite: 55, prestigeBias: 50,
    broadcasterNames: ['Prime Video', 'Amazon Prime Video', 'Amazon Video'],
  },
  {
    id: 'disney-plus', name: 'Disney+', shortName: 'Disney+', type: 'streaming', parent: { name: 'The Walt Disney Company' }, ownership: 'Public company', countryId: 'us', city: 'Burbank', founded: 2019,
    leadership: [{ name: 'Dana Walden', title: 'President And Chief Creative Officer, The Walt Disney Company', source: S.disney }, { name: 'Joe Earley', title: 'Co-President, Direct To Consumer', source: S.disney }, { name: 'Adam Smith', title: 'Co-President, Direct To Consumer', source: S.disney }],
    description: 'Disney, Pixar, Marvel, Star Wars and National Geographic, with Hulu folded in.',
    deals: [{ studioId: 'disney', kind: 'own', note: 'Every Disney, Pixar, Marvel, Lucasfilm and 20th Century film after cinemas.' }, { studioId: 'searchlight', kind: 'own', note: 'Searchlight titles, mostly by way of Hulu.' }],
    reach: { value: 125_000_000, unit: 'subscribers', note: 'SLATE\'s estimate from Disney\'s last reported figures.' },
    formats: ALL, wants: ['family', 'fantasy', 'adventure', 'animation', 'science fiction', 'action'], avoids: ['horror', 'experimental'], budgetFloor: 25 * M, budgetCeiling: 250 * M, slateSize: 25, accessDifficulty: 90, riskAppetite: 30, prestigeBias: 38,
    broadcasterNames: ['Disney+', 'Disney Plus'],
  },
  {
    id: 'hulu', name: 'Hulu', shortName: 'Hulu', type: 'streaming', parent: { name: 'The Walt Disney Company' }, ownership: 'Public company', countryId: 'us', city: 'Santa Monica', founded: 2007,
    leadership: [{ name: 'Debra OConnell', title: 'Chairman, Disney Entertainment Television', source: S.fx }, { name: 'Craig Erwich', title: 'President, Disney Television Group, Including Hulu Originals', source: S.erwich }],
    description: 'Disney\'s general-entertainment service: FX, ABC next day, Searchlight and Neon films, and its own originals.',
    deals: [
      { studioId: 'searchlight', kind: 'pay_one', note: 'Searchlight releases debut on Hulu.', source: S.focusPeacock },
      { studioId: 'neon', kind: 'pay_one', note: 'Neon\'s films live on Hulu under an output deal dating to 2017.', source: S.neonHulu },
      { studioId: 'disney', kind: 'own', note: 'ABC, FX and 20th Television series.' },
    ],
    reach: { value: 55_000_000, unit: 'subscribers', note: 'SLATE\'s estimate from Disney\'s last reported figures.' },
    formats: ALL, wants: ['drama', 'comedy', 'thriller', 'crime', 'documentary'], avoids: [], budgetFloor: 15 * M, budgetCeiling: 150 * M, slateSize: 22, accessDifficulty: 78, riskAppetite: 60, prestigeBias: 60,
    broadcasterNames: ['Hulu'],
  },
  {
    id: 'hbo-max', name: 'HBO Max', shortName: 'HBO Max', type: 'streaming', aliases: ['Max'], parent: { name: 'Warner Bros. Discovery', note: 'Sale to Paramount Skydance blocked in court pending a 2027 trial.' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 2020,
    leadership: [{ name: 'JB Perrette', title: 'Chief Executive Officer And President, Global Streaming And Games', source: S.hbo }, { name: 'Casey Bloys', title: 'Chairman And Chief Executive Officer, HBO And Max Content', source: S.hbo }],
    status: 'Launched in Britain and Ireland in 2026 and is separating from Sky there.',
    description: 'HBO, Warner Bros. films after cinemas, DC, and A24\'s slate.',
    deals: [
      { studioId: 'warner', kind: 'own', note: 'Warner Bros., New Line and DC films after cinemas.' },
      { studioId: 'a24', kind: 'pay_one', note: 'A24\'s films exclusively in the United States pay-one window, renewed January 2026.', source: S.a24Max },
    ],
    reach: { value: 128_000_000, unit: 'subscribers', note: 'Warner Bros. Discovery\'s reported direct-to-consumer total; an approximation for HBO Max alone.' },
    formats: ALL, wants: ['drama', 'crime', 'fantasy', 'comedy', 'documentary'], avoids: ['family'], budgetFloor: 30 * M, budgetCeiling: 250 * M, slateSize: 20, accessDifficulty: 86, riskAppetite: 55, prestigeBias: 80,
    broadcasterNames: ['HBO Max', 'Max'],
  },
  {
    id: 'paramount-plus', name: 'Paramount+', shortName: 'Paramount+', type: 'streaming', parent: { name: 'Paramount Skydance Corporation' }, ownership: 'Public company', countryId: 'us', city: 'Los Angeles', founded: 2021,
    leadership: [{ name: 'Cindy Holland', title: 'Chair, Direct To Consumer', source: S.paramountPlus }, { name: 'David Ellison', title: 'Chairman And Chief Executive Officer, Paramount Skydance', source: S.paramountPlus }],
    description: 'Paramount films after cinemas, CBS next day, Showtime, and Taylor Sheridan\'s universe.',
    deals: [{ studioId: 'paramount', kind: 'own', note: 'Paramount films after cinemas and CBS Studios series.' }],
    reach: { value: 79_000_000, unit: 'subscribers', note: 'Paramount\'s last reported figure, an approximation.' },
    formats: ALL, wants: ['drama', 'crime', 'action', 'family', 'science fiction'], avoids: [], budgetFloor: 15 * M, budgetCeiling: 200 * M, slateSize: 24, accessDifficulty: 78, riskAppetite: 48, prestigeBias: 44,
    broadcasterNames: ['Paramount+', 'Paramount Plus', 'CBS All Access'],
  },
  {
    id: 'peacock', name: 'Peacock', shortName: 'Peacock', type: 'streaming', parent: { name: 'NBCUniversal', note: 'Comcast is spinning NBCUniversal and Sky off as their own public company.' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 2020,
    leadership: [{ name: 'Matt Strauss', title: 'Chairman, NBCUniversal Media Group', source: S.peacock }, { name: 'Mike Cavanagh', title: 'Chief Executive Officer, NBCUniversal', source: S.peacock }],
    description: 'Universal films first after cinemas, NBC next day, Bravo, and sport.',
    deals: [
      { studioId: 'universal', kind: 'pay_one', note: 'Universal films for their first four months after cinemas, and again for the last four.', source: S.universalWindows },
      { studioId: 'focus', kind: 'pay_one', note: 'Focus Features titles go to Peacock.', source: S.focusPeacock },
      { studioId: 'blumhouse', kind: 'pay_one', note: 'By way of Universal\'s windows.' },
    ],
    reach: { value: 41_000_000, unit: 'subscribers', note: 'NBCUniversal\'s last reported figure, an approximation.' },
    formats: ALL, wants: ['comedy', 'drama', 'crime', 'thriller', 'documentary'], avoids: [], budgetFloor: 15 * M, budgetCeiling: 150 * M, slateSize: 18, accessDifficulty: 72, riskAppetite: 50, prestigeBias: 46,
    broadcasterNames: ['Peacock'],
  },
  {
    id: 'apple-tv-plus', name: 'Apple TV+', shortName: 'Apple TV+', type: 'streaming', aliases: ['Apple TV'], parent: { name: 'Apple Inc.' }, ownership: 'Public company', countryId: 'us', city: 'Cupertino', founded: 2019,
    leadership: [{ name: 'Eddy Cue', title: 'Senior Vice President, Services, Apple' }, { name: 'Zack Van Amburg', title: 'Head Of Worldwide Video', source: 'https://www.screendaily.com/features/apple-content-team-on-f1-emmys-success-and-launching-a-platform/5210477.article' }, { name: 'Jamie Erlicht', title: 'Head Of Worldwide Video', source: 'https://www.screendaily.com/features/apple-content-team-on-f1-emmys-success-and-launching-a-platform/5210477.article' }],
    description: 'Originals only, fewer of them, and paid for like features.',
    deals: [{ studioId: 'apple', kind: 'own', note: 'Apple Original Films and Apple Studios series.' }],
    reach: { value: 45_000_000, unit: 'subscribers', note: 'Undisclosed by Apple. SLATE\'s estimate.' },
    formats: ALL, wants: ['drama', 'thriller', 'comedy', 'science fiction', 'biography'], avoids: ['horror'], budgetFloor: 30 * M, budgetCeiling: 300 * M, slateSize: 14, accessDifficulty: 86, riskAppetite: 45, prestigeBias: 72,
    broadcasterNames: ['Apple TV+', 'Apple TV'],
  },
  {
    id: 'tubi', name: 'Tubi', shortName: 'Tubi', type: 'streaming', parent: { name: 'Fox Corporation' }, ownership: 'Public company', countryId: 'us', city: 'San Francisco', founded: 2014,
    leadership: [{ name: 'Anjali Sud', title: 'Chief Executive Officer', source: S.tubi }],
    description: 'Free with advertising, and bigger than most of the services people pay for.',
    deals: [],
    reach: { value: 110_000_000, unit: 'monthly users', note: 'Reported in 2026.' },
    formats: ['feature', 'series', 'documentary', 'tv_movie'], wants: ['horror', 'thriller', 'comedy', 'action', 'romance'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 15 * M, slateSize: 40, accessDifficulty: 40, riskAppetite: 70, prestigeBias: 20,
    broadcasterNames: ['Tubi'],
  },
  {
    id: 'crunchyroll', name: 'Crunchyroll', shortName: 'Crunchyroll', type: 'streaming', parent: { name: 'Sony Group Corporation' }, ownership: 'Public company', countryId: 'us', city: 'Culver City', founded: 2006,
    leadership: [{ name: 'Rahul Purini', title: 'President', source: S.crunchyroll }],
    description: 'Anime, worldwide, and the theatrical releases that go with it.',
    deals: [{ studioId: 'sony', kind: 'own', note: 'Sony\'s anime service.' }, { studioId: 'toei', kind: 'supply', note: 'Simulcasts and licences from Japan\'s studios.' }, { studioId: 'toho', kind: 'supply', note: 'Simulcasts and licences from Japan\'s studios.' }],
    reach: { value: 17_000_000, unit: 'subscribers', note: 'Last reported paid subscribers, an approximation.' },
    formats: ['series', 'feature'], wants: ['animation', 'fantasy', 'action', 'science fiction'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 40 * M, slateSize: 30, accessDifficulty: 62, riskAppetite: 55, prestigeBias: 30,
    broadcasterNames: ['Crunchyroll'],
  },
  {
    id: 'roku-channel', name: 'The Roku Channel', shortName: 'Roku', type: 'streaming', parent: { name: 'Roku, Inc.', note: 'Fox Corporation agreed in 2026 to buy Roku.' }, ownership: 'Public company', countryId: 'us', city: 'San Jose', founded: 2017,
    leadership: [{ name: 'Anthony Wood', title: 'Founder, Chairman And Chief Executive Officer, Roku', source: S.roku }, { name: 'Charlie Collier', title: 'President, Roku Media', source: S.roku }],
    status: 'Fox Corporation agreed to acquire Roku in 2026.',
    description: 'Free streaming on the boxes that are already in the living room.',
    deals: [],
    formats: ['feature', 'series', 'documentary'], wants: ['comedy', 'crime', 'romance', 'documentary'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 20 * M, slateSize: 15, accessDifficulty: 45, riskAppetite: 60, prestigeBias: 25,
    broadcasterNames: ['The Roku Channel', 'Roku Channel'],
  },
  {
    id: 'pluto-tv', name: 'Pluto TV', shortName: 'Pluto', type: 'streaming', parent: { name: 'Paramount Skydance Corporation' }, ownership: 'Public company', countryId: 'us', city: 'Los Angeles', founded: 2014,
    leadership: [{ name: 'Cindy Holland', title: 'Chair, Direct To Consumer', source: S.paramountPlus }],
    description: 'Free channels made of the Paramount library.',
    deals: [{ studioId: 'paramount', kind: 'library', note: 'Paramount\'s library as channels.' }],
    reach: { value: 80_000_000, unit: 'monthly users', note: 'Paramount\'s last stated figure, an approximation.' },
    formats: ['series', 'feature'], wants: ['comedy', 'crime', 'drama'], avoids: [], budgetFloor: 500_000_00, budgetCeiling: 5 * M, slateSize: 4, accessDifficulty: 35, riskAppetite: 40, prestigeBias: 10,
    broadcasterNames: ['Pluto TV'],
  },

  // --- United States broadcast ------------------------------------------------
  {
    id: 'abc', name: 'ABC', shortName: 'ABC', type: 'broadcast', aliases: ['American Broadcasting Company'], parent: { name: 'The Walt Disney Company' }, ownership: 'Public company', countryId: 'us', city: 'Burbank', founded: 1948,
    leadership: [{ name: 'Debra OConnell', title: 'Chairman, Disney Entertainment Television', source: S.fx }, { name: 'Craig Erwich', title: 'President, Disney Television Group', source: S.erwich }],
    description: 'Disney\'s broadcast network: procedurals, Shondaland, and next day on Hulu.',
    deals: [{ studioId: 'disney', kind: 'own', note: '20th Television and ABC Signature series.' }],
    reach: { value: 3_500_000, unit: 'primetime viewers', note: 'Average primetime audience, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'medical', 'crime', 'comedy', 'family'], avoids: ['horror', 'experimental'], budgetFloor: 30 * M, budgetCeiling: 120 * M, slateSize: 6, accessDifficulty: 70, riskAppetite: 28, prestigeBias: 34,
    broadcasterNames: ['American Broadcasting Company', 'ABC'],
  },
  {
    id: 'cbs', name: 'CBS', shortName: 'CBS', type: 'broadcast', parent: { name: 'Paramount Skydance Corporation' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1941,
    leadership: [{ name: 'George Cheeks', title: 'Chair, TV Media, Paramount Skydance', source: S.cbs }, { name: 'Amy Reisenbach', title: 'President, CBS Entertainment', source: S.cbs }, { name: 'David Stapf', title: 'President, CBS Studios', source: S.cbs }],
    description: 'The most-watched network in America, on procedurals, comedies and the NFL.',
    deals: [{ studioId: 'paramount', kind: 'own', note: 'CBS Studios series, next day on Paramount+.' }],
    reach: { value: 5_000_000, unit: 'primetime viewers', note: 'Average primetime audience, SLATE\'s estimate.' },
    formats: TV, wants: ['crime', 'comedy', 'drama', 'legal', 'medical'], avoids: ['horror', 'experimental'], budgetFloor: 30 * M, budgetCeiling: 130 * M, slateSize: 6, accessDifficulty: 72, riskAppetite: 24, prestigeBias: 30,
    broadcasterNames: ['CBS'],
  },
  {
    id: 'nbc', name: 'NBC', shortName: 'NBC', type: 'broadcast', parent: { name: 'NBCUniversal' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1939,
    leadership: [{ name: 'Donna Langley', title: 'Chairman, NBCUniversal Entertainment And Studios', source: S.nbcu }, { name: 'Pearlena Igbokwe', title: 'Chairman, Television Studios, NBC Entertainment And Peacock Scripted', source: S.nbcu }, { name: 'Frances Berwick', title: 'Chairman, Bravo And Peacock Unscripted', source: S.nbcu }],
    description: 'Dick Wolf\'s network, with Saturday Night Live and the Olympics.',
    deals: [{ studioId: 'universal', kind: 'own', note: 'Universal Television series, next day on Peacock.' }],
    reach: { value: 4_000_000, unit: 'primetime viewers', note: 'Average primetime audience, SLATE\'s estimate.' },
    formats: TV, wants: ['crime', 'drama', 'comedy', 'medical', 'legal'], avoids: ['horror', 'experimental'], budgetFloor: 30 * M, budgetCeiling: 130 * M, slateSize: 6, accessDifficulty: 72, riskAppetite: 28, prestigeBias: 34,
    broadcasterNames: ['NBC'],
  },
  {
    id: 'fox', name: 'Fox', shortName: 'Fox', type: 'broadcast', aliases: ['Fox Broadcasting Company'], parent: { name: 'Fox Corporation' }, ownership: 'Public company, controlled by the Murdoch family', countryId: 'us', city: 'Los Angeles', founded: 1986,
    leadership: [{ name: 'Rob Wade', title: 'Chief Executive Officer, Fox Entertainment', source: S.fox }, { name: 'Michael Thorn', title: 'President, Fox Television Network', source: S.fox }],
    description: 'Animation, unscripted and sport, with a studio of its own since it sold the old one to Disney.',
    deals: [{ studioId: 'disney', kind: 'supply', note: 'Its animated comedies are made by 20th Television Animation.' }],
    reach: { value: 3_000_000, unit: 'primetime viewers', note: 'Average primetime audience, SLATE\'s estimate.' },
    formats: TV, wants: ['animation', 'comedy', 'drama', 'crime'], avoids: ['experimental'], budgetFloor: 20 * M, budgetCeiling: 100 * M, slateSize: 5, accessDifficulty: 66, riskAppetite: 36, prestigeBias: 28,
    broadcasterNames: ['Fox Broadcasting Company', 'Fox'],
  },
  {
    id: 'the-cw', name: 'The CW', shortName: 'The CW', type: 'broadcast', parent: { name: 'Nexstar Media Group' }, ownership: 'Public company', countryId: 'us', city: 'Burbank', founded: 2006,
    leadership: [{ name: 'Brad Schwartz', title: 'President', source: S.cw }],
    description: 'Cheap, acquired and scrappy since Nexstar took it over. Sport and imports rather than the old superhero slate.',
    deals: [],
    reach: { value: 600_000, unit: 'primetime viewers', note: 'Average primetime audience, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'comedy', 'sport', 'crime'], avoids: ['experimental'], budgetFloor: 5 * M, budgetCeiling: 40 * M, slateSize: 4, accessDifficulty: 46, riskAppetite: 40, prestigeBias: 20,
    broadcasterNames: ['The CW'],
  },
  {
    id: 'pbs', name: 'PBS', shortName: 'PBS', type: 'broadcast', ownership: 'Non-profit, owned by its member stations', countryId: 'us', city: 'Arlington', founded: 1969,
    leadership: [{ name: 'Paula Kerger', title: 'President And Chief Executive Officer', source: S.pbs }],
    description: 'Public television: Masterpiece, Ken Burns and Nature.',
    deals: [{ studioId: 'bbc-film', kind: 'co_production', note: 'British drama through Masterpiece.' }],
    reach: { value: 1_500_000, unit: 'primetime viewers', note: 'SLATE\'s estimate.' },
    formats: ['series', 'limited_series', 'documentary'], wants: ['documentary', 'drama', 'biography'], avoids: ['horror', 'action'], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 5, accessDifficulty: 50, riskAppetite: 30, prestigeBias: 80,
    broadcasterNames: ['PBS', 'Public Broadcasting Service'],
  },

  // --- United States cable and premium -------------------------------------------
  {
    id: 'hbo', name: 'HBO', shortName: 'HBO', type: 'premium', parent: { name: 'Warner Bros. Discovery' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1972,
    leadership: [{ name: 'Casey Bloys', title: 'Chairman And Chief Executive Officer, HBO And Max Content', source: S.hbo }],
    description: 'The network that invented prestige television and still sets its price.',
    deals: [{ studioId: 'warner', kind: 'own', note: 'Warner Bros. Television and HBO Entertainment series.' }],
    reach: { value: 38_000_000, unit: 'households', note: 'United States linear subscribers, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'fantasy', 'comedy', 'documentary'], avoids: ['family'], budgetFloor: 40 * M, budgetCeiling: 250 * M, slateSize: 8, accessDifficulty: 88, riskAppetite: 60, prestigeBias: 92,
    broadcasterNames: ['HBO', 'Home Box Office'],
  },
  {
    id: 'showtime', name: 'Showtime', shortName: 'Showtime', type: 'premium', aliases: ['Paramount+ with Showtime'], parent: { name: 'Paramount Skydance Corporation' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1976,
    leadership: [{ name: 'George Cheeks', title: 'Chair, TV Media', source: S.cbs }, { name: 'Matt Thunell', title: 'Head Of Paramount Television Studios', source: S.showtime }],
    status: 'Folded into Paramount+ with Showtime; the studio behind it was merged into Paramount Television Studios in 2025.',
    description: 'Dexter, Billions and Yellowjackets, now a tier of Paramount+.',
    deals: [{ studioId: 'paramount', kind: 'own', note: 'Paramount Television Studios series.' }],
    reach: { value: 25_000_000, unit: 'households', note: 'SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'thriller', 'comedy'], avoids: ['family'], budgetFloor: 30 * M, budgetCeiling: 150 * M, slateSize: 5, accessDifficulty: 78, riskAppetite: 56, prestigeBias: 72,
    broadcasterNames: ['Showtime'],
  },
  {
    id: 'starz', name: 'Starz', shortName: 'Starz', type: 'premium', ownership: 'Independent public company since its 2025 split from Lionsgate', countryId: 'us', city: 'Santa Monica', founded: 1994,
    leadership: [{ name: 'Jeffrey Hirsch', title: 'President And Chief Executive Officer', source: S.starz }],
    description: 'Outlander, Power and the pay-one window for every Lionsgate film.',
    deals: [{ studioId: 'lionsgate', kind: 'pay_one', note: 'Exclusive first pay window on Lionsgate\'s theatrical films, on an accelerated window, extended through the separation.', source: S.lionsgateStarz }],
    reach: { value: 21_000_000, unit: 'subscribers', note: 'Starz\'s last reported figure, an approximation.' },
    formats: TV, wants: ['drama', 'crime', 'romance', 'fantasy'], avoids: ['family'], budgetFloor: 25 * M, budgetCeiling: 120 * M, slateSize: 5, accessDifficulty: 68, riskAppetite: 52, prestigeBias: 52,
    broadcasterNames: ['Starz'],
  },
  {
    id: 'fx', name: 'FX', shortName: 'FX', type: 'cable', parent: { name: 'The Walt Disney Company' }, ownership: 'Public company', countryId: 'us', city: 'Los Angeles', founded: 1994,
    leadership: [{ name: 'John Landgraf', title: 'Chairman, FX', source: S.fx }],
    description: 'The Bear, Shōgun, Fargo. The other prestige address, now living on Hulu.',
    deals: [{ studioId: 'disney', kind: 'own', note: 'FX Productions and 20th Television series, streaming on Hulu.' }],
    reach: { value: 60_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'comedy', 'thriller'], avoids: ['family'], budgetFloor: 25 * M, budgetCeiling: 200 * M, slateSize: 7, accessDifficulty: 84, riskAppetite: 62, prestigeBias: 88,
    broadcasterNames: ['FX', 'FXX', 'FX on Hulu'],
  },
  {
    id: 'amc', name: 'AMC', shortName: 'AMC', type: 'cable', parent: { name: 'AMC Networks' }, ownership: 'Public company, controlled by the Dolan family', countryId: 'us', city: 'New York City', founded: 1984,
    leadership: [{ name: 'Kristin Dolan', title: 'Chief Executive Officer, AMC Networks', source: S.amc }, { name: 'Dan McDermott', title: 'Chief Content Officer And President, AMC Studios', source: S.amc }],
    description: 'The Walking Dead, Anne Rice and Breaking Bad\'s home, licensing its originals to Netflix to pay for the next ones.',
    deals: [{ studioId: 'ifc', kind: 'own', note: 'IFC Films, RLJE and Shudder share the parent.' }, { studioId: 'netflix', kind: 'library', note: 'A block of AMC originals licensed to Netflix.', source: S.amcNetflix }],
    reach: { value: 55_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'horror', 'crime', 'fantasy'], avoids: ['family'], budgetFloor: 20 * M, budgetCeiling: 120 * M, slateSize: 5, accessDifficulty: 68, riskAppetite: 58, prestigeBias: 64,
    broadcasterNames: ['AMC', 'AMC+'],
  },
  {
    id: 'usa-network', name: 'USA Network', shortName: 'USA', type: 'cable', parent: { name: 'Versant Media', note: 'Spun off from Comcast in January 2026.' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1977,
    leadership: [{ name: 'Mark Lazarus', title: 'Chief Executive Officer, Versant', source: S.versant }],
    description: 'Once the biggest cable network on scripted; now sport, wrestling and reruns under a new owner.',
    deals: [],
    reach: { value: 55_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['crime', 'drama', 'action'], avoids: ['experimental'], budgetFloor: 10 * M, budgetCeiling: 60 * M, slateSize: 2, accessDifficulty: 52, riskAppetite: 36, prestigeBias: 30,
    broadcasterNames: ['USA Network'],
  },
  {
    id: 'syfy', name: 'Syfy', shortName: 'Syfy', type: 'cable', parent: { name: 'Versant Media' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1992,
    leadership: [{ name: 'Mark Lazarus', title: 'Chief Executive Officer, Versant', source: S.versant }],
    description: 'Genre television, mostly acquired now.',
    deals: [],
    reach: { value: 50_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['science fiction', 'fantasy', 'horror'], avoids: [], budgetFloor: 8 * M, budgetCeiling: 50 * M, slateSize: 2, accessDifficulty: 48, riskAppetite: 50, prestigeBias: 30,
    broadcasterNames: ['Syfy', 'Sci Fi Channel'],
  },
  {
    id: 'tnt', name: 'TNT', shortName: 'TNT', type: 'cable', parent: { name: 'Warner Bros. Discovery' }, ownership: 'Public company', countryId: 'us', city: 'Atlanta', founded: 1988,
    leadership: [{ name: 'David Zaslav', title: 'President And Chief Executive Officer, Warner Bros. Discovery' }],
    description: 'Sport and films; the scripted slate is gone.',
    deals: [{ studioId: 'warner', kind: 'own', note: 'Warner Bros. films on cable.' }],
    reach: { value: 55_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'action', 'sport'], avoids: [], budgetFloor: 10 * M, budgetCeiling: 60 * M, slateSize: 1, accessDifficulty: 50, riskAppetite: 30, prestigeBias: 30,
    broadcasterNames: ['TNT'],
  },
  {
    id: 'tbs', name: 'TBS', shortName: 'TBS', type: 'cable', parent: { name: 'Warner Bros. Discovery' }, ownership: 'Public company', countryId: 'us', city: 'Atlanta', founded: 1976,
    leadership: [{ name: 'David Zaslav', title: 'President And Chief Executive Officer, Warner Bros. Discovery' }],
    description: 'Comedy reruns, baseball and American Dad.',
    deals: [],
    reach: { value: 55_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['comedy', 'animation'], avoids: [], budgetFloor: 8 * M, budgetCeiling: 40 * M, slateSize: 1, accessDifficulty: 48, riskAppetite: 30, prestigeBias: 22,
    broadcasterNames: ['TBS'],
  },
  {
    id: 'paramount-network', name: 'Paramount Network', shortName: 'Paramount Network', type: 'cable', parent: { name: 'Paramount Skydance Corporation' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 2018,
    leadership: [{ name: 'George Cheeks', title: 'Chair, TV Media', source: S.cbs }],
    description: 'Yellowstone made it; Yellowstone is most of it.',
    deals: [{ studioId: 'paramount', kind: 'own', note: 'Paramount Television Studios series.' }],
    reach: { value: 50_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'western', 'crime'], avoids: [], budgetFloor: 15 * M, budgetCeiling: 120 * M, slateSize: 2, accessDifficulty: 60, riskAppetite: 40, prestigeBias: 40,
    broadcasterNames: ['Paramount Network', 'Spike'],
  },
  {
    id: 'bravo', name: 'Bravo', shortName: 'Bravo', type: 'cable', parent: { name: 'NBCUniversal', note: 'Kept by NBCUniversal in the Versant spin-off.' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1980,
    leadership: [{ name: 'Frances Berwick', title: 'Chairman, Bravo And Peacock Unscripted', source: S.nbcu }],
    description: 'The Housewives, Below Deck, and everything Andy Cohen touches.',
    deals: [],
    reach: { value: 55_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['comedy', 'drama'], avoids: ['horror', 'science fiction'], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 2, accessDifficulty: 50, riskAppetite: 40, prestigeBias: 18,
    broadcasterNames: ['Bravo'],
  },
  {
    id: 'comedy-central', name: 'Comedy Central', shortName: 'Comedy Central', type: 'cable', parent: { name: 'Paramount Skydance Corporation' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1991,
    leadership: [{ name: 'George Cheeks', title: 'Chair, TV Media', source: S.cbs }],
    description: 'South Park, The Daily Show, and a thin slate beyond them.',
    deals: [{ studioId: 'paramount', kind: 'own', note: 'MTV Entertainment Studios series.' }],
    reach: { value: 50_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['comedy', 'animation'], avoids: ['drama'], budgetFloor: 5 * M, budgetCeiling: 40 * M, slateSize: 2, accessDifficulty: 52, riskAppetite: 55, prestigeBias: 26,
    broadcasterNames: ['Comedy Central'],
  },
  {
    id: 'mtv', name: 'MTV', shortName: 'MTV', type: 'cable', parent: { name: 'Paramount Skydance Corporation' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1981,
    leadership: [{ name: 'George Cheeks', title: 'Chair, TV Media', source: S.cbs }],
    description: 'Reality and the awards shows; the music is elsewhere.',
    deals: [{ studioId: 'paramount', kind: 'own', note: 'MTV Entertainment Studios.' }],
    reach: { value: 50_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['comedy', 'drama'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 2, accessDifficulty: 48, riskAppetite: 50, prestigeBias: 16,
    broadcasterNames: ['MTV'],
  },
  {
    id: 'nickelodeon', name: 'Nickelodeon', shortName: 'Nick', type: 'cable', parent: { name: 'Paramount Skydance Corporation' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1977,
    leadership: [{ name: 'George Cheeks', title: 'Chair, TV Media', source: S.cbs, note: 'Nickelodeon has had no president of its own confirmed since Brian Robbins left in 2025.' }],
    description: 'SpongeBob, Paw Patrol and the Kids\' Choice Awards.',
    deals: [{ studioId: 'paramount', kind: 'own', note: 'Nickelodeon Animation Studio and Nickelodeon Movies.' }],
    reach: { value: 50_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['family', 'animation', 'comedy', 'adventure'], avoids: ['horror', 'crime'], budgetFloor: 5 * M, budgetCeiling: 60 * M, slateSize: 6, accessDifficulty: 62, riskAppetite: 36, prestigeBias: 18,
    broadcasterNames: ['Nickelodeon', 'Nicktoons'],
  },
  {
    id: 'disney-channel', name: 'Disney Channel', shortName: 'Disney Channel', type: 'cable', parent: { name: 'The Walt Disney Company' }, ownership: 'Public company', countryId: 'us', city: 'Burbank', founded: 1983,
    leadership: [{ name: 'Craig Erwich', title: 'President, Disney Television Group, Including Disney Branded Television', source: S.erwich }],
    description: 'Disney\'s kids\' channel, now mostly a feeder for Disney+.',
    deals: [{ studioId: 'disney', kind: 'own', note: 'Disney Television Animation and Disney Branded Television.' }],
    reach: { value: 48_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['family', 'animation', 'comedy', 'musical'], avoids: ['horror', 'crime'], budgetFloor: 5 * M, budgetCeiling: 60 * M, slateSize: 5, accessDifficulty: 64, riskAppetite: 30, prestigeBias: 18,
    broadcasterNames: ['Disney Channel', 'Disney XD', 'Disney Junior'],
  },
  {
    id: 'cartoon-network', name: 'Cartoon Network', shortName: 'Cartoon Network', type: 'cable', parent: { name: 'Warner Bros. Discovery' }, ownership: 'Public company', countryId: 'us', city: 'Atlanta', founded: 1992,
    leadership: [{ name: 'Michael Ouweleen', title: 'President, The Cartoon Network, Inc.', source: S.cn }],
    description: 'Adventure Time, Steven Universe, and a much thinner slate than it had.',
    deals: [{ studioId: 'warner', kind: 'own', note: 'Cartoon Network Studios and Warner Bros. Animation.' }],
    reach: { value: 48_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['animation', 'family', 'comedy', 'adventure'], avoids: ['horror'], budgetFloor: 4 * M, budgetCeiling: 40 * M, slateSize: 3, accessDifficulty: 60, riskAppetite: 50, prestigeBias: 28,
    broadcasterNames: ['Cartoon Network', 'Boomerang'],
  },
  {
    id: 'adult-swim', name: 'Adult Swim', shortName: 'Adult Swim', type: 'cable', parent: { name: 'Warner Bros. Discovery' }, ownership: 'Public company', countryId: 'us', city: 'Atlanta', founded: 2001,
    leadership: [{ name: 'Michael Ouweleen', title: 'President, The Cartoon Network, Inc.', source: S.cn }],
    description: 'Rick and Morty and the strangest half-hours on television.',
    deals: [{ studioId: 'warner', kind: 'own', note: 'Williams Street productions.' }],
    reach: { value: 48_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['animation', 'comedy', 'science fiction', 'experimental'], avoids: ['family'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 4, accessDifficulty: 58, riskAppetite: 80, prestigeBias: 40,
    broadcasterNames: ['Adult Swim'],
  },
  {
    id: 'hallmark-channel', name: 'Hallmark Channel', shortName: 'Hallmark', type: 'cable', parent: { name: 'Hallmark Media, part of Hallmark Cards' }, ownership: 'Privately held', countryId: 'us', city: 'Studio City', founded: 2001,
    leadership: [{ name: 'Darren Abbott', title: 'President, Hallmark Media', source: S.hallmark, note: 'Since March 2026.' }, { name: 'Michelle Vicary', title: 'Head Of Programming', source: S.hallmark }],
    description: 'Forty Christmas films a year and the audience that wants exactly that.',
    deals: [],
    reach: { value: 55_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: ['tv_movie', 'series'], wants: ['romance', 'family', 'drama', 'mystery'], avoids: ['horror', 'crime', 'experimental'], budgetFloor: 2 * M, budgetCeiling: 20 * M, slateSize: 12, accessDifficulty: 42, riskAppetite: 20, prestigeBias: 10,
    broadcasterNames: ['Hallmark Channel', 'Hallmark Movies & Mysteries', 'Hallmark Mystery'],
  },
  {
    id: 'lifetime', name: 'Lifetime', shortName: 'Lifetime', type: 'cable', parent: { name: 'A+E Global Media, wholly owned by Hearst since August 2026' }, ownership: 'Privately held', countryId: 'us', city: 'New York City', founded: 1984,
    leadership: [{ name: 'Paul Buccieri', title: 'President And Chairman, A+E Global Media', source: S.ae }],
    description: 'Television films for women, true crime, and the occasional prestige swing.',
    deals: [],
    reach: { value: 55_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: ['tv_movie', 'series', 'limited_series'], wants: ['drama', 'thriller', 'romance', 'biography'], avoids: ['science fiction'], budgetFloor: 2 * M, budgetCeiling: 30 * M, slateSize: 10, accessDifficulty: 44, riskAppetite: 36, prestigeBias: 18,
    broadcasterNames: ['Lifetime'],
  },
  {
    id: 'history', name: 'History', shortName: 'History', type: 'cable', parent: { name: 'A+E Global Media, wholly owned by Hearst since August 2026' }, ownership: 'Privately held', countryId: 'us', city: 'New York City', founded: 1995,
    leadership: [{ name: 'Paul Buccieri', title: 'President And Chairman, A+E Global Media', source: S.ae }],
    description: 'Documentary and the occasional scripted period drama.',
    deals: [],
    reach: { value: 55_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: ['series', 'limited_series', 'documentary'], wants: ['documentary', 'war', 'biography', 'drama'], avoids: ['horror', 'comedy'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 4, accessDifficulty: 48, riskAppetite: 34, prestigeBias: 30,
    broadcasterNames: ['History', 'The History Channel', 'History Channel'],
  },
  {
    id: 'discovery-channel', name: 'Discovery Channel', shortName: 'Discovery', type: 'cable', parent: { name: 'Warner Bros. Discovery' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1985,
    leadership: [{ name: 'David Zaslav', title: 'President And Chief Executive Officer, Warner Bros. Discovery' }],
    description: 'Unscripted: Deadliest Catch, Gold Rush, Shark Week.',
    deals: [],
    reach: { value: 55_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: ['series', 'documentary'], wants: ['documentary'], avoids: ['drama', 'comedy'], budgetFloor: 2 * M, budgetCeiling: 20 * M, slateSize: 6, accessDifficulty: 46, riskAppetite: 30, prestigeBias: 20,
    broadcasterNames: ['Discovery Channel', 'Discovery'],
  },
  {
    id: 'freeform', name: 'Freeform', shortName: 'Freeform', type: 'cable', parent: { name: 'The Walt Disney Company' }, ownership: 'Public company', countryId: 'us', city: 'Burbank', founded: 1977,
    leadership: [{ name: 'Craig Erwich', title: 'President, Disney Television Group, Including Freeform', source: S.erwich }],
    description: 'Young-adult drama for Hulu, by way of cable.',
    deals: [{ studioId: 'disney', kind: 'own', note: 'ABC Signature series.' }],
    reach: { value: 45_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'comedy', 'romance'], avoids: ['horror'], budgetFloor: 8 * M, budgetCeiling: 40 * M, slateSize: 2, accessDifficulty: 52, riskAppetite: 44, prestigeBias: 26,
    broadcasterNames: ['Freeform', 'ABC Family'],
  },
  {
    id: 'bet', name: 'BET', shortName: 'BET', type: 'cable', parent: { name: 'Paramount Skydance Corporation' }, ownership: 'Public company', countryId: 'us', city: 'New York City', founded: 1980,
    leadership: [{ name: 'Louis Carr', title: 'President, BET', source: S.bet, note: 'Succeeded Scott Mills, who left after 23 years.' }, { name: 'George Cheeks', title: 'Chair, TV Media', source: S.bet }],
    description: 'Black entertainment television, with BET+ beside it.',
    deals: [{ studioId: 'paramount', kind: 'own', note: 'BET Studios.' }],
    reach: { value: 50_000_000, unit: 'households', note: 'Cable reach, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'comedy', 'romance', 'crime'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 4, accessDifficulty: 46, riskAppetite: 46, prestigeBias: 26,
    broadcasterNames: ['BET', 'BET+'],
  },

  // --- Britain and Ireland ---------------------------------------------------------
  {
    id: 'bbc-one', name: 'BBC One', shortName: 'BBC One', type: 'broadcast', aliases: ['BBC'], parent: { name: 'The BBC' }, ownership: 'Public broadcaster, licence fee', countryId: 'uk', city: 'London', founded: 1936,
    leadership: [{ name: 'Matt Brittin', title: 'Director-General, The BBC', source: S.bbc, note: 'Since May 18, 2026, after Tim Davie resigned.' }, { name: 'Kate Phillips', title: 'Chief Content Officer', source: S.bbcPhillips }],
    description: 'The nation\'s channel: Doctor Who, Strictly, Line of Duty, and everything the licence fee pays for.',
    deals: [{ studioId: 'bbc-film', kind: 'own', note: 'BBC Film and BBC Studios.' }, { studioId: 'disney', kind: 'co_production', note: 'Doctor Who was co-produced with Disney+ outside Britain.' }],
    reach: { value: 27_000_000, unit: 'households', note: 'British television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'comedy', 'documentary', 'family'], avoids: [], budgetFloor: 5 * M, budgetCeiling: 60 * M, slateSize: 20, accessDifficulty: 66, riskAppetite: 44, prestigeBias: 70,
    broadcasterNames: ['BBC One', 'BBC', 'BBC Two', 'BBC Three', 'BBC Four', 'BBC iPlayer'],
  },
  {
    id: 'itv', name: 'ITV', shortName: 'ITV', type: 'broadcast', aliases: ['ITV1', 'ITVX'], ownership: 'Public company', countryId: 'uk', city: 'London', founded: 1955,
    leadership: [{ name: 'Carolyn McCall', title: 'Chief Executive', source: S.itv }, { name: 'Kevin Lygo', title: 'Managing Director, Media And Entertainment', source: S.itv }],
    status: 'Sky agreed in July 2026 to take over ITV\'s channels and ITVX; ITV Studios would continue on its own.',
    description: 'Britain\'s biggest commercial channel: Coronation Street, Love Island, Mr Bates vs The Post Office.',
    deals: [],
    reach: { value: 27_000_000, unit: 'households', note: 'British television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'comedy', 'romance'], avoids: ['experimental'], budgetFloor: 4 * M, budgetCeiling: 40 * M, slateSize: 14, accessDifficulty: 60, riskAppetite: 38, prestigeBias: 46,
    broadcasterNames: ['ITV', 'ITV1', 'ITVX', 'ITV2'],
  },
  {
    id: 'channel-4', name: 'Channel 4', shortName: 'Channel 4', type: 'broadcast', ownership: 'Publicly owned, commercially funded', countryId: 'uk', city: 'London', founded: 1982,
    leadership: [{ name: 'Priya Dogra', title: 'Chief Executive', source: S.channel4, note: 'Since March 2026.' }],
    description: 'The broadcaster that commissions rather than makes, with Film4 beside it.',
    deals: [{ studioId: 'film4', kind: 'own', note: 'Film4 Productions.' }],
    reach: { value: 27_000_000, unit: 'households', note: 'British television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'comedy', 'documentary', 'crime'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 12, accessDifficulty: 56, riskAppetite: 66, prestigeBias: 66,
    broadcasterNames: ['Channel 4', 'E4', 'All 4'],
  },
  {
    id: 'sky', name: 'Sky', shortName: 'Sky', type: 'premium', aliases: ['Sky Atlantic', 'Sky UK'], parent: { name: 'Comcast', note: 'Comcast is spinning Sky off with NBCUniversal.' }, ownership: 'Public company', countryId: 'uk', city: 'London', founded: 1989,
    leadership: [{ name: 'Dana Strong', title: 'Group Chief Executive', source: S.sky }],
    status: 'Agreed in July 2026 to take over ITV\'s channels and ITVX; losing HBO to HBO Max\'s own British launch.',
    description: 'Britain\'s pay-television giant: Sky Atlantic, Sky Cinema, sport, and Sky Studios.',
    deals: [{ studioId: 'universal', kind: 'own', note: 'Shares Comcast with Universal; Sky Cinema carries the studios\' films in Britain.' }],
    reach: { value: 12_000_000, unit: 'subscribers', note: 'Britain and Ireland, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'comedy', 'thriller'], avoids: [], budgetFloor: 8 * M, budgetCeiling: 80 * M, slateSize: 10, accessDifficulty: 70, riskAppetite: 50, prestigeBias: 66,
    broadcasterNames: ['Sky Atlantic', 'Sky One', 'Sky Max', 'Sky', 'Sky Cinema', 'NOW'],
  },

  // --- Europe ----------------------------------------------------------------------
  {
    id: 'canal-plus', name: 'Canal+', shortName: 'Canal+', type: 'premium', parent: { name: 'Canal+ Group, controlled by Bolloré' }, ownership: 'Public company', countryId: 'fr', city: 'Issy-les-Moulineaux', founded: 1984,
    leadership: [{ name: 'Maxime Saada', title: 'Chief Executive Officer, Canal+', source: S.canal }, { name: 'Anna Marsh', title: 'Deputy Chief Executive Officer And Chief Content Officer', source: S.canal }],
    status: 'Took full control of MultiChoice in Africa in July 2026.',
    description: 'French pay television, the first window for every French film, and StudioCanal\'s parent.',
    deals: [{ studioId: 'studiocanal', kind: 'own', note: 'StudioCanal.' }, { studioId: 'pathe', kind: 'pay_one', note: 'French chronology gives Canal+ the first pay window on French releases.' }, { studioId: 'gaumont', kind: 'pay_one', note: 'French chronology gives Canal+ the first pay window on French releases.' }],
    reach: { value: 27_000_000, unit: 'subscribers', note: 'Worldwide, Canal+\'s stated figure before MultiChoice.' },
    formats: TV, wants: ['drama', 'crime', 'comedy', 'thriller'], avoids: [], budgetFloor: 5 * M, budgetCeiling: 60 * M, slateSize: 10, accessDifficulty: 68, riskAppetite: 52, prestigeBias: 68,
    broadcasterNames: ['Canal+', 'Canal Plus', 'Canal+ Séries'],
  },
  {
    id: 'tf1', name: 'TF1', shortName: 'TF1', type: 'broadcast', parent: { name: 'Bouygues' }, ownership: 'Public company', countryId: 'fr', city: 'Boulogne-Billancourt', founded: 1975,
    leadership: [{ name: 'Rodolphe Belmer', title: 'Chairman And Chief Executive Officer', source: S.tf1 }],
    description: 'France\'s biggest commercial channel.',
    deals: [],
    reach: { value: 28_000_000, unit: 'households', note: 'French television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'comedy', 'romance'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 10, accessDifficulty: 58, riskAppetite: 36, prestigeBias: 40,
    broadcasterNames: ['TF1'],
  },
  {
    id: 'france-2', name: 'France 2', shortName: 'France 2', type: 'broadcast', aliases: ['France Télévisions'], parent: { name: 'France Télévisions' }, ownership: 'Public broadcaster', countryId: 'fr', city: 'Paris', founded: 1964,
    leadership: [{ name: 'Delphine Ernotte Cunci', title: 'President, France Télévisions' }],
    description: 'French public television\'s flagship.',
    deals: [],
    reach: { value: 28_000_000, unit: 'households', note: 'French television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'documentary', 'comedy'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 12, accessDifficulty: 56, riskAppetite: 40, prestigeBias: 56,
    broadcasterNames: ['France 2', 'France 3', 'France Télévisions'],
  },
  {
    id: 'ard', name: 'Das Erste', shortName: 'ARD', type: 'broadcast', aliases: ['ARD'], parent: { name: 'ARD' }, ownership: 'Public broadcaster', countryId: 'de', city: 'Munich', founded: 1952,
    leadership: [{ name: 'Florian Hager', title: 'Chairman, ARD', source: S.ard }],
    description: 'Germany\'s first channel: Tatort and the public-service slate.',
    deals: [],
    reach: { value: 38_000_000, unit: 'households', note: 'German television households, SLATE\'s estimate.' },
    formats: TV, wants: ['crime', 'drama', 'documentary'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 12, accessDifficulty: 56, riskAppetite: 36, prestigeBias: 52,
    broadcasterNames: ['Das Erste', 'ARD', 'ARD Mediathek'],
  },
  {
    id: 'zdf', name: 'ZDF', shortName: 'ZDF', type: 'broadcast', ownership: 'Public broadcaster', countryId: 'de', city: 'Mainz', founded: 1963,
    leadership: [{ name: 'Norbert Himmler', title: 'Intendant', source: S.zdf, note: 'Confirmed in March 2026 for a further five years.' }],
    description: 'Germany\'s second public channel, and a big co-producer of European drama.',
    deals: [],
    reach: { value: 38_000_000, unit: 'households', note: 'German television households, SLATE\'s estimate.' },
    formats: TV, wants: ['crime', 'drama', 'documentary'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 12, accessDifficulty: 56, riskAppetite: 40, prestigeBias: 54,
    broadcasterNames: ['ZDF', 'ZDFneo'],
  },
  {
    id: 'rtl', name: 'RTL', shortName: 'RTL', type: 'broadcast', aliases: ['RTL Television'], parent: { name: 'RTL Group, Bertelsmann' }, ownership: 'Public company, controlled by Bertelsmann', countryId: 'de', city: 'Cologne', founded: 1984,
    leadership: [{ name: 'Stephan Schmitter', title: 'Chief Executive Officer, RTL Deutschland' }],
    description: 'Germany\'s biggest commercial channel.',
    deals: [],
    reach: { value: 38_000_000, unit: 'households', note: 'German television households, SLATE\'s estimate.' },
    formats: TV, wants: ['crime', 'drama', 'comedy'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 25 * M, slateSize: 8, accessDifficulty: 52, riskAppetite: 40, prestigeBias: 30,
    broadcasterNames: ['RTL', 'RTL Television', 'RTL+'],
  },
  {
    id: 'rai-1', name: 'Rai 1', shortName: 'Rai', type: 'broadcast', aliases: ['RAI'], parent: { name: 'RAI' }, ownership: 'Public broadcaster', countryId: 'it', city: 'Rome', founded: 1954,
    leadership: [{ name: 'Giampaolo Rossi', title: 'Chief Executive Officer, RAI', source: S.rai }],
    description: 'Italian public television\'s flagship, and Rai Cinema behind it.',
    deals: [],
    reach: { value: 24_000_000, unit: 'households', note: 'Italian television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'romance', 'biography'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 25 * M, slateSize: 10, accessDifficulty: 56, riskAppetite: 34, prestigeBias: 50,
    broadcasterNames: ['Rai 1', 'Rai 2', 'Rai 3', 'RAI', 'RaiPlay'],
  },
  {
    id: 'rtve', name: 'La 1', shortName: 'RTVE', type: 'broadcast', aliases: ['RTVE', 'Televisión Española'], parent: { name: 'RTVE' }, ownership: 'Public broadcaster', countryId: 'es', city: 'Madrid', founded: 1956,
    leadership: [{ name: 'José Pablo López', title: 'Chair, RTVE', source: S.rtve }],
    description: 'Spanish public television.',
    deals: [],
    reach: { value: 19_000_000, unit: 'households', note: 'Spanish television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'comedy'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 20 * M, slateSize: 8, accessDifficulty: 52, riskAppetite: 38, prestigeBias: 46,
    broadcasterNames: ['La 1', 'TVE', 'Televisión Española', 'RTVE'],
  },
  {
    id: 'movistar-plus', name: 'Movistar Plus+', shortName: 'Movistar+', type: 'premium', parent: { name: 'Telefónica' }, ownership: 'Public company', countryId: 'es', city: 'Madrid', founded: 2015,
    leadership: [{ name: 'Alfonso Gómez Palacio', title: 'Chief Executive Officer', source: S.movistar, note: 'Since April 2026.' }],
    description: 'Spain\'s premium originals: La Peste, Antidisturbios, Los Favoritos de Midas.',
    deals: [],
    reach: { value: 4_000_000, unit: 'subscribers', note: 'SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'thriller', 'comedy'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 6, accessDifficulty: 58, riskAppetite: 56, prestigeBias: 66,
    broadcasterNames: ['Movistar Plus+', 'Movistar+', 'Movistar Plus'],
  },

  // --- Asia ------------------------------------------------------------------------
  {
    id: 'nhk', name: 'NHK', shortName: 'NHK', type: 'broadcast', aliases: ['NHK General TV'], ownership: 'Public broadcaster, licence fee', countryId: 'jp', city: 'Tokyo', founded: 1953,
    leadership: [{ name: 'Tatsuhiko Inoue', title: 'President', source: S.nhk, note: 'Since January 25, 2026.' }],
    description: 'Japan\'s public broadcaster: the Taiga drama and the morning serial.',
    deals: [],
    reach: { value: 50_000_000, unit: 'households', note: 'Japanese television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'biography', 'documentary', 'family'], avoids: ['horror'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 10, accessDifficulty: 66, riskAppetite: 30, prestigeBias: 62,
    broadcasterNames: ['NHK', 'NHK General TV', 'NHK BS'],
  },
  {
    id: 'fuji-tv', name: 'Fuji TV', shortName: 'Fuji TV', type: 'broadcast', aliases: ['Fuji Television'], parent: { name: 'Fuji Media Holdings' }, ownership: 'Public company', countryId: 'jp', city: 'Tokyo', founded: 1959,
    leadership: [{ name: 'Kenji Shimizu', title: 'President And Chief Executive Officer', source: S.fuji, note: 'Took over in January 2025 after a scandal forced out his predecessors.' }],
    description: 'Drama, variety and Toho\'s co-productions, rebuilding its sponsor base after 2025.',
    deals: [{ studioId: 'toho', kind: 'co_production', note: 'Co-produces films with Toho.' }],
    reach: { value: 50_000_000, unit: 'households', note: 'Japanese television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'romance', 'comedy', 'animation'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 25 * M, slateSize: 12, accessDifficulty: 58, riskAppetite: 40, prestigeBias: 40,
    broadcasterNames: ['Fuji TV', 'Fuji Television'],
  },
  {
    id: 'tv-asahi', name: 'TV Asahi', shortName: 'TV Asahi', type: 'broadcast', parent: { name: 'TV Asahi Holdings' }, ownership: 'Public company', countryId: 'jp', city: 'Tokyo', founded: 1959,
    leadership: [{ name: 'Hiroshi Shinozuka', title: 'President', source: S.tvAsahi }, { name: 'Hiroshi Hayakawa', title: 'Chairman And Chief Executive Officer, TV Asahi Holdings', source: S.tvAsahi }],
    description: 'Doraemon, Crayon Shin-chan, Super Sentai and the Kamen Riders.',
    deals: [{ studioId: 'toei', kind: 'supply', note: 'Toei makes its tokusatsu and much of its animation.' }],
    reach: { value: 50_000_000, unit: 'households', note: 'Japanese television households, SLATE\'s estimate.' },
    formats: TV, wants: ['animation', 'action', 'family', 'crime'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 25 * M, slateSize: 12, accessDifficulty: 58, riskAppetite: 40, prestigeBias: 36,
    broadcasterNames: ['TV Asahi'],
  },
  {
    id: 'ntv-japan', name: 'Nippon TV', shortName: 'NTV', type: 'broadcast', aliases: ['Nippon Television'], parent: { name: 'Nippon Television Holdings' }, ownership: 'Public company', countryId: 'jp', city: 'Tokyo', founded: 1953,
    leadership: [{ name: 'Hiroyuki Fukuda', title: 'President And Chief Operating Officer', source: S.ntv }],
    description: 'Japan\'s ratings leader, and Studio Ghibli\'s owner since 2023.',
    deals: [{ studioId: 'toho', kind: 'co_production', note: 'Ghibli\'s films are released by Toho.' }],
    reach: { value: 50_000_000, unit: 'households', note: 'Japanese television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'animation', 'comedy', 'family'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 25 * M, slateSize: 12, accessDifficulty: 60, riskAppetite: 40, prestigeBias: 40,
    broadcasterNames: ['Nippon TV', 'Nippon Television', 'NTV'],
  },
  {
    id: 'tbs-japan', name: 'TBS Television', shortName: 'TBS', type: 'broadcast', aliases: ['Tokyo Broadcasting System'], parent: { name: 'TBS Holdings' }, ownership: 'Public company', countryId: 'jp', city: 'Tokyo', founded: 1955,
    leadership: [{ name: 'Takashi Ryuzaki', title: 'President', note: 'Not confirmed this year.' }],
    description: 'Sunday-night drama and a growing anime business.',
    deals: [],
    reach: { value: 50_000_000, unit: 'households', note: 'Japanese television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'romance', 'animation'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 25 * M, slateSize: 12, accessDifficulty: 58, riskAppetite: 40, prestigeBias: 40,
    broadcasterNames: ['TBS Television', 'Tokyo Broadcasting System', 'TBS'],
  },
  {
    id: 'kbs', name: 'KBS', shortName: 'KBS', type: 'broadcast', aliases: ['Korean Broadcasting System'], ownership: 'Public broadcaster', countryId: 'kr', city: 'Seoul', founded: 1961,
    leadership: [{ name: 'Park Jang-beom', title: 'President', source: S.kbs, note: 'Nominated in October 2024; not re-confirmed this year.' }],
    description: 'Korea\'s public broadcaster and its weekend family dramas.',
    deals: [],
    reach: { value: 20_000_000, unit: 'households', note: 'Korean television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'romance', 'family', 'documentary'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 10, accessDifficulty: 60, riskAppetite: 36, prestigeBias: 44,
    broadcasterNames: ['KBS', 'KBS2', 'KBS1', 'Korean Broadcasting System'],
  },
  {
    id: 'mbc', name: 'MBC', shortName: 'MBC', type: 'broadcast', aliases: ['Munhwa Broadcasting Corporation'], ownership: 'Public-service broadcaster, commercially funded', countryId: 'kr', city: 'Seoul', founded: 1961,
    leadership: [{ name: 'Ahn Hyung-joon', title: 'President And Chief Executive Officer', source: S.mbc }],
    description: 'Korean drama and variety.',
    deals: [],
    reach: { value: 20_000_000, unit: 'households', note: 'Korean television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'romance', 'comedy', 'thriller'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 10, accessDifficulty: 58, riskAppetite: 40, prestigeBias: 42,
    broadcasterNames: ['MBC', 'Munhwa Broadcasting Corporation', 'MBC TV'],
  },
  {
    id: 'sbs-korea', name: 'SBS', shortName: 'SBS', type: 'broadcast', aliases: ['Seoul Broadcasting System'], parent: { name: 'Taeyoung Group' }, ownership: 'Public company', countryId: 'kr', city: 'Seoul', founded: 1990,
    leadership: [{ name: 'Not Confirmed', title: 'Chief Executive Officer', note: 'The seat could not be confirmed this year.' }],
    description: 'Korea\'s commercial network and a steady drama supplier to the streamers.',
    deals: [],
    reach: { value: 20_000_000, unit: 'households', note: 'Korean television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'romance', 'thriller', 'crime'], avoids: [], budgetFloor: 3 * M, budgetCeiling: 30 * M, slateSize: 10, accessDifficulty: 58, riskAppetite: 42, prestigeBias: 42,
    broadcasterNames: ['SBS', 'Seoul Broadcasting System', 'SBS TV'],
  },
  {
    id: 'tvn', name: 'tvN', shortName: 'tvN', type: 'cable', parent: { name: 'CJ ENM' }, ownership: 'Public company', countryId: 'kr', city: 'Seoul', founded: 2006,
    leadership: [{ name: 'Koo Chang-gun', title: 'Chief Executive Officer, Entertainment Division, CJ ENM', source: S.cjenm }],
    description: 'Crash Landing on You, Goblin, Queen of Tears: the cable channel the K-drama wave came from.',
    deals: [{ studioId: 'cj-enm', kind: 'own', note: 'Studio Dragon and CJ ENM series.' }, { studioId: 'netflix', kind: 'supply', note: 'Studio Dragon series licensed to Netflix outside Korea.' }],
    reach: { value: 20_000_000, unit: 'households', note: 'Korean television households, SLATE\'s estimate.' },
    formats: TV, wants: ['romance', 'drama', 'thriller', 'comedy', 'fantasy'], avoids: [], budgetFloor: 5 * M, budgetCeiling: 40 * M, slateSize: 14, accessDifficulty: 66, riskAppetite: 52, prestigeBias: 56,
    broadcasterNames: ['tvN', 'TVING', 'OCN'],
  },
  {
    id: 'jtbc', name: 'JTBC', shortName: 'JTBC', type: 'cable', parent: { name: 'JoongAng Group' }, ownership: 'Privately held', countryId: 'kr', city: 'Seoul', founded: 2011,
    leadership: [{ name: 'Lee Soo-young', title: 'Chief Executive Officer And President', source: S.jtbc }],
    description: 'SKY Castle, The World of the Married, Reborn Rich.',
    deals: [{ studioId: 'netflix', kind: 'supply', note: 'Series licensed to Netflix outside Korea.' }],
    reach: { value: 20_000_000, unit: 'households', note: 'Korean television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'thriller', 'romance', 'crime'], avoids: [], budgetFloor: 4 * M, budgetCeiling: 35 * M, slateSize: 10, accessDifficulty: 62, riskAppetite: 54, prestigeBias: 58,
    broadcasterNames: ['JTBC'],
  },
  {
    id: 'jiostar', name: 'JioStar', shortName: 'JioStar', type: 'broadcast', aliases: ['Star Plus', 'Star India', 'JioHotstar', 'Disney+ Hotstar'], parent: { name: 'Reliance Industries and The Walt Disney Company' }, ownership: 'Joint venture, Reliance majority', countryId: 'in', city: 'Mumbai', founded: 2024,
    leadership: [{ name: 'Nita Ambani', title: 'Chairperson', source: S.jiostar }, { name: 'Uday Shankar', title: 'Vice Chairperson', source: S.jiostar }, { name: 'Kevin Vaz', title: 'Chief Executive Officer, Entertainment', source: S.jiostar }, { name: 'Kiran Mani', title: 'Chief Executive Officer, Digital', source: S.jiostar }],
    description: 'India\'s biggest broadcaster and streamer, Star and Hotstar merged with Reliance\'s Viacom18.',
    deals: [{ studioId: 'disney', kind: 'library', note: 'Disney\'s films and series in India through JioHotstar.' }],
    reach: { value: 280_000_000, unit: 'monthly users', note: 'JioHotstar\'s stated figure, an approximation.' },
    formats: TV, wants: ['drama', 'romance', 'family', 'crime', 'musical'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 20 * M, slateSize: 40, accessDifficulty: 66, riskAppetite: 40, prestigeBias: 30,
    broadcasterNames: ['Star Plus', 'StarPlus', 'Disney+ Hotstar', 'JioHotstar', 'Hotstar', 'Star India', 'Colors TV', 'JioCinema'],
  },
  {
    id: 'zee-tv', name: 'Zee TV', shortName: 'Zee', type: 'broadcast', aliases: ['Zee Entertainment'], parent: { name: 'Zee Entertainment Enterprises' }, ownership: 'Public company', countryId: 'in', city: 'Mumbai', founded: 1992,
    leadership: [{ name: 'Punit Goenka', title: 'Chief Executive Officer, Zee Entertainment Enterprises', source: S.zee }],
    description: 'India\'s first private channel, with ZEE5 beside it.',
    deals: [],
    reach: { value: 200_000_000, unit: 'households', note: 'Indian television households reached, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'romance', 'family', 'musical'], avoids: [], budgetFloor: 500_000_00, budgetCeiling: 10 * M, slateSize: 30, accessDifficulty: 56, riskAppetite: 40, prestigeBias: 24,
    broadcasterNames: ['Zee TV', 'ZEE5', 'Zee Entertainment Enterprises'],
  },
  {
    id: 'sony-liv', name: 'SonyLIV', shortName: 'SonyLIV', type: 'streaming', aliases: ['Sony Entertainment Television'], parent: { name: 'Sony Pictures Networks India, so Sony Group' }, ownership: 'Public company', countryId: 'in', city: 'Mumbai', founded: 2013,
    leadership: [{ name: 'Gaurav Banerjee', title: 'Managing Director And Chief Executive Officer, Sony Pictures Networks India', source: S.spn }],
    description: 'Scam 1992, Rocket Boys, and Sony\'s Indian channels.',
    deals: [{ studioId: 'sony', kind: 'own', note: 'Sony Pictures Networks India.' }],
    reach: { value: 40_000_000, unit: 'monthly users', note: 'SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'biography', 'comedy'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 15 * M, slateSize: 12, accessDifficulty: 56, riskAppetite: 50, prestigeBias: 46,
    broadcasterNames: ['SonyLIV', 'Sony Entertainment Television', 'Sony TV', 'Sony SAB'],
  },
  {
    id: 'iqiyi', name: 'iQIYI', shortName: 'iQIYI', type: 'streaming', parent: { name: 'Baidu' }, ownership: 'Public company', countryId: 'cn', city: 'Beijing', founded: 2010,
    leadership: [{ name: 'Gong Yu', title: 'Founder And Chief Executive Officer', source: S.iqiyi }],
    description: 'China\'s biggest subscription service, with a deep bench of original drama.',
    deals: [],
    reach: { value: 100_000_000, unit: 'subscribers', note: 'iQIYI\'s last reported figure, an approximation.' },
    formats: TV, wants: ['drama', 'romance', 'crime', 'fantasy'], avoids: ['horror'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 40, accessDifficulty: 70, riskAppetite: 40, prestigeBias: 40,
    broadcasterNames: ['iQIYI', 'iQiyi'],
  },
  {
    id: 'tencent-video', name: 'Tencent Video', shortName: 'Tencent Video', type: 'streaming', parent: { name: 'Tencent' }, ownership: 'Public company', countryId: 'cn', city: 'Shenzhen', founded: 2011,
    leadership: [{ name: 'Sun Zhonghuai', title: 'Chief Executive Officer, Tencent Online Video', note: 'Not confirmed this year.' }],
    description: 'Tencent\'s service, tied to the biggest games and social platforms in China.',
    deals: [],
    reach: { value: 115_000_000, unit: 'subscribers', note: 'Tencent\'s last reported figure, an approximation.' },
    formats: TV, wants: ['drama', 'romance', 'fantasy', 'crime', 'animation'], avoids: ['horror'], budgetFloor: 3 * M, budgetCeiling: 40 * M, slateSize: 40, accessDifficulty: 70, riskAppetite: 40, prestigeBias: 40,
    broadcasterNames: ['Tencent Video', 'WeTV'],
  },
  {
    id: 'cctv', name: 'China Central Television', shortName: 'CCTV', type: 'broadcast', aliases: ['CCTV'], ownership: 'State broadcaster', countryId: 'cn', city: 'Beijing', founded: 1958,
    leadership: [{ name: 'Shen Haixiong', title: 'President', source: S.cctv }],
    description: 'The state broadcaster, and the biggest single audience in the world.',
    deals: [{ studioId: 'china-film', kind: 'supply', note: 'State studios and state television move together.' }],
    reach: { value: 400_000_000, unit: 'households', note: 'Chinese television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'war', 'biography', 'documentary'], avoids: ['horror', 'experimental'], budgetFloor: 2 * M, budgetCeiling: 40 * M, slateSize: 20, accessDifficulty: 92, riskAppetite: 15, prestigeBias: 40,
    broadcasterNames: ['China Central Television', 'CCTV', 'CCTV-1', 'CCTV-8'],
  },
  {
    id: 'tvb', name: 'TVB', shortName: 'TVB', type: 'broadcast', aliases: ['Television Broadcasts Limited'], ownership: 'Public company', countryId: 'hk', city: 'Hong Kong', founded: 1967,
    leadership: [{ name: 'Thomas Hui To', title: 'Executive Chairman', source: S.tvb }],
    description: 'Hong Kong\'s broadcaster and the Cantonese drama factory.',
    deals: [],
    reach: { value: 2_500_000, unit: 'households', note: 'Hong Kong television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'romance', 'comedy'], avoids: [], budgetFloor: 500_000_00, budgetCeiling: 8 * M, slateSize: 15, accessDifficulty: 52, riskAppetite: 30, prestigeBias: 30,
    broadcasterNames: ['TVB', 'TVB Jade', 'Television Broadcasts Limited'],
  },

  // --- Americas and Australia --------------------------------------------------------
  {
    id: 'cbc', name: 'CBC Television', shortName: 'CBC', type: 'broadcast', aliases: ['CBC'], parent: { name: 'CBC/Radio-Canada' }, ownership: 'Public broadcaster', countryId: 'ca', city: 'Toronto', founded: 1952,
    leadership: [{ name: 'Marie-Philippe Bouchard', title: 'President And Chief Executive Officer', source: S.cbc }],
    description: 'Canada\'s public broadcaster: Schitt\'s Creek\'s home, and a steady co-producer.',
    deals: [],
    reach: { value: 15_000_000, unit: 'households', note: 'Canadian television households, SLATE\'s estimate.' },
    formats: TV, wants: ['comedy', 'drama', 'documentary', 'crime'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 20 * M, slateSize: 8, accessDifficulty: 50, riskAppetite: 44, prestigeBias: 50,
    broadcasterNames: ['CBC Television', 'CBC', 'CBC Gem'],
  },
  {
    id: 'ctv', name: 'CTV', shortName: 'CTV', type: 'broadcast', aliases: ['CTV Television Network'], parent: { name: 'Bell Media, part of BCE' }, ownership: 'Public company', countryId: 'ca', city: 'Toronto', founded: 1961,
    leadership: [{ name: 'Sean Cohan', title: 'President, Bell Media', source: S.bell }],
    description: 'Canada\'s most-watched network, with Crave beside it.',
    deals: [{ studioId: 'warner', kind: 'library', note: 'Crave carried HBO in Canada.' }],
    reach: { value: 15_000_000, unit: 'households', note: 'Canadian television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'comedy', 'romance'], avoids: [], budgetFloor: 2 * M, budgetCeiling: 25 * M, slateSize: 8, accessDifficulty: 52, riskAppetite: 42, prestigeBias: 42,
    broadcasterNames: ['CTV', 'CTV Television Network', 'Crave'],
  },
  {
    id: 'televisa', name: 'Las Estrellas', shortName: 'Televisa', type: 'broadcast', aliases: ['TelevisaUnivision', 'Canal de las Estrellas'], parent: { name: 'TelevisaUnivision' }, ownership: 'Public company', countryId: 'mx', city: 'Mexico City', founded: 1951,
    leadership: [{ name: 'Daniel Alegre', title: 'Chief Executive Officer, TelevisaUnivision', source: S.televisa }],
    description: 'The telenovela factory, on both sides of the border, with ViX beside it.',
    deals: [{ studioId: 'videocine', kind: 'own', note: 'Videocine.' }],
    reach: { value: 35_000_000, unit: 'households', note: 'Mexican television households, SLATE\'s estimate.' },
    formats: TV, wants: ['romance', 'drama', 'comedy', 'crime'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 15 * M, slateSize: 20, accessDifficulty: 56, riskAppetite: 32, prestigeBias: 26,
    broadcasterNames: ['Las Estrellas', 'Canal de las Estrellas', 'Televisa', 'Univision', 'ViX'],
  },
  {
    id: 'tv-globo', name: 'TV Globo', shortName: 'Globo', type: 'broadcast', aliases: ['Rede Globo'], parent: { name: 'Grupo Globo' }, ownership: 'Privately held, the Marinho family', countryId: 'br', city: 'Rio de Janeiro', founded: 1965,
    leadership: [{ name: 'Paulo Marinho', title: 'President And Chief Executive Officer, Globo', source: S.globo }],
    description: 'Brazil\'s dominant network and its nightly novelas, with Globoplay beside it.',
    deals: [{ studioId: 'globo', kind: 'own', note: 'Globo Filmes.' }],
    reach: { value: 70_000_000, unit: 'households', note: 'Brazilian television households, SLATE\'s estimate.' },
    formats: TV, wants: ['romance', 'drama', 'comedy', 'crime'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 20 * M, slateSize: 20, accessDifficulty: 62, riskAppetite: 34, prestigeBias: 36,
    broadcasterNames: ['TV Globo', 'Rede Globo', 'Globo', 'Globoplay'],
  },
  {
    id: 'globoplay', name: 'Globoplay', shortName: 'Globoplay', type: 'streaming', parent: { name: 'Grupo Globo' }, ownership: 'Privately held', countryId: 'br', city: 'Rio de Janeiro', founded: 2015,
    leadership: [{ name: 'Paulo Marinho', title: 'President And Chief Executive Officer, Globo', source: S.globo }],
    description: 'Globo\'s streaming service.',
    deals: [{ studioId: 'globo', kind: 'own', note: 'Globo Filmes and Globo\'s series.' }],
    reach: { value: 20_000_000, unit: 'subscribers', note: 'SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'romance', 'documentary'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 15 * M, slateSize: 10, accessDifficulty: 56, riskAppetite: 46, prestigeBias: 40,
    broadcasterNames: ['Globoplay'],
  },
  {
    id: 'abc-australia', name: 'ABC TV', shortName: 'ABC Australia', type: 'broadcast', aliases: ['Australian Broadcasting Corporation'], parent: { name: 'Australian Broadcasting Corporation' }, ownership: 'Public broadcaster', countryId: 'au', city: 'Sydney', founded: 1956,
    leadership: [{ name: 'Hugh Marks', title: 'Managing Director', source: S.abcAu }],
    description: 'Australia\'s public broadcaster: Bluey\'s home, and the drama the streamers buy.',
    deals: [{ studioId: 'bbc-film', kind: 'co_production', note: 'Bluey is co-commissioned with the BBC.' }],
    reach: { value: 10_000_000, unit: 'households', note: 'Australian television households, SLATE\'s estimate.' },
    formats: TV, wants: ['comedy', 'drama', 'family', 'documentary'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 15 * M, slateSize: 8, accessDifficulty: 50, riskAppetite: 46, prestigeBias: 54,
    broadcasterNames: ['ABC TV', 'ABC', 'ABC iview', 'ABC Kids', 'Australian Broadcasting Corporation'],
  },
  {
    id: 'nine-network', name: 'Nine Network', shortName: 'Nine', type: 'broadcast', aliases: ['Channel Nine'], parent: { name: 'Nine Entertainment' }, ownership: 'Public company', countryId: 'au', city: 'Sydney', founded: 1956,
    leadership: [{ name: 'Matt Stanton', title: 'Chief Executive Officer, Nine Entertainment', source: S.nine }],
    description: 'Australia\'s commercial ratings leader, with Stan beside it.',
    deals: [],
    reach: { value: 10_000_000, unit: 'households', note: 'Australian television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'comedy', 'crime'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 15 * M, slateSize: 6, accessDifficulty: 50, riskAppetite: 36, prestigeBias: 30,
    broadcasterNames: ['Nine Network', 'Channel Nine', 'Nine', '9Now'],
  },
  {
    id: 'seven-network', name: 'Seven Network', shortName: 'Seven', type: 'broadcast', aliases: ['Channel Seven'], parent: { name: 'Southern Cross Media Group, since the January 2026 merger' }, ownership: 'Public company', countryId: 'au', city: 'Sydney', founded: 1956,
    leadership: [{ name: 'Not Confirmed', title: 'Chief Executive Officer', source: S.seven, note: 'Jeff Howard left the merged company in February 2026; a successor could not be confirmed.' }],
    status: 'Merged into Southern Cross Media Group in January 2026.',
    description: 'Home and Away, the AFL and the Olympics.',
    deals: [],
    reach: { value: 10_000_000, unit: 'households', note: 'Australian television households, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'romance', 'sport'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 15 * M, slateSize: 5, accessDifficulty: 50, riskAppetite: 32, prestigeBias: 26,
    broadcasterNames: ['Seven Network', 'Channel Seven', 'Seven', '7plus'],
  },
  {
    id: 'stan', name: 'Stan', shortName: 'Stan', type: 'streaming', parent: { name: 'Nine Entertainment' }, ownership: 'Public company', countryId: 'au', city: 'Sydney', founded: 2015,
    leadership: [{ name: 'Not Confirmed', title: 'Chief Executive Officer', source: S.stan, note: 'Martin Kugeler left for Football Australia in February 2026; a successor could not be confirmed.' }],
    description: 'Australia\'s home-grown streamer, with its own originals.',
    deals: [],
    reach: { value: 2_500_000, unit: 'subscribers', note: 'SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'comedy', 'crime', 'thriller'], avoids: [], budgetFloor: 1 * M, budgetCeiling: 15 * M, slateSize: 6, accessDifficulty: 50, riskAppetite: 50, prestigeBias: 44,
    broadcasterNames: ['Stan'],
  },

  // --- Africa -------------------------------------------------------------------------
  {
    id: 'showmax', name: 'Showmax', shortName: 'Showmax', type: 'streaming', parent: { name: 'MultiChoice, wholly owned by Canal+ since July 2026' }, ownership: 'Public company', countryId: 'za', city: 'Johannesburg', founded: 2015,
    leadership: [{ name: 'David Mignot', title: 'Chief Executive Officer, Canal+ Africa', source: S.canalAfrica }],
    status: 'Canal+ said in 2026 that Showmax was not a commercial success and would be wound down; treat it as closing.',
    description: 'Africa\'s biggest home-grown streamer, on its way out.',
    deals: [],
    reach: { value: 3_000_000, unit: 'subscribers', note: 'SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'crime', 'romance', 'comedy'], avoids: [], budgetFloor: 200_000_00, budgetCeiling: 4 * M, slateSize: 4, accessDifficulty: 44, riskAppetite: 40, prestigeBias: 30,
    broadcasterNames: ['Showmax'],
  },
  {
    id: 'africa-magic', name: 'Africa Magic', shortName: 'Africa Magic', type: 'cable', aliases: ['M-Net'], parent: { name: 'MultiChoice, wholly owned by Canal+ since July 2026' }, ownership: 'Public company', countryId: 'ng', city: 'Lagos', founded: 2003,
    leadership: [{ name: 'David Mignot', title: 'Chief Executive Officer, Canal+ Africa', source: S.canalAfrica }, { name: 'Calvo Mawela', title: 'Chairman, Canal+ Africa', source: S.canalAfrica }],
    description: 'Nollywood on pay television across the continent, on DStv.',
    deals: [{ studioId: 'filmone', kind: 'supply', note: 'Nollywood films after cinemas.' }, { studioId: 'ebonylife', kind: 'supply', note: 'EbonyLife\'s series and films.' }],
    reach: { value: 24_000_000, unit: 'subscribers', note: 'DStv across Africa, SLATE\'s estimate.' },
    formats: TV, wants: ['drama', 'romance', 'comedy', 'crime'], avoids: [], budgetFloor: 100_000_00, budgetCeiling: 3 * M, slateSize: 10, accessDifficulty: 40, riskAppetite: 44, prestigeBias: 26,
    broadcasterNames: ['Africa Magic', 'M-Net', 'DStv'],
  },
];

export const NETWORKS = new Registry<Network>('networks', SEEDS.map((seed) => ({
  ...seed,
  source: 'public_reference', confidence: 'high', version: V,
  note: 'Identity, parent and leadership from the public record; reach as last published or estimated, and behaviour calibrated by SLATE.',
})));

export const NETWORK_KIND_LABEL: Readonly<Record<NetworkKind, string>> = { streaming: 'Streaming', broadcast: 'Broadcast', cable: 'Cable', premium: 'Premium' };
export const NETWORK_KIND_ORDER: readonly NetworkKind[] = ['streaming', 'broadcast', 'premium', 'cable'];
export const DEAL_KIND_LABEL: Readonly<Record<DealKind, string>> = {
  own: 'Same Parent', pay_one: 'Pay-One Window', pay_one_second: 'Second Pay Window', output: 'Output Deal', library: 'Library Licence', next_day: 'Next-Day Streaming', co_production: 'Co-Production', supply: 'Supply Deal',
};

/** The network a real series aired on, by the name the catalogue records. */
export function networkForBroadcaster(name: string): Network | undefined {
  const wanted = name.toLowerCase();
  for (const network of NETWORKS.all()) {
    if (network.broadcasterNames.some((b) => b.toLowerCase() === wanted)) return network;
  }
  return undefined;
}

/** Where a studio's films go after cinemas: its pay-one partner, or none. */
export function payOnePartner(studioId: string): { network: Network; deal: NetworkDeal } | undefined {
  // A published pay-one deal names the window outright; a service that
  // simply belongs to the same parent is the answer only when no deal does.
  let owned: { network: Network; deal: NetworkDeal } | undefined;
  for (const network of NETWORKS.all()) {
    if (network.type !== 'streaming' && network.type !== 'premium') continue;
    const deal = network.deals.find((d) => d.studioId === studioId && (d.kind === 'pay_one' || d.kind === 'own'));
    if (!deal) continue;
    if (deal.kind === 'pay_one') return { network, deal };
    owned ??= { network, deal };
  }
  return owned;
}

/** Every deal a studio has with a network, for its profile. */
export function dealsForStudio(studioId: string): { network: Network; deal: NetworkDeal }[] {
  const out: { network: Network; deal: NetworkDeal }[] = [];
  for (const network of NETWORKS.all()) for (const deal of network.deals) if (deal.studioId === studioId) out.push({ network, deal });
  return out;
}
