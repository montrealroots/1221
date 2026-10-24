/**
 * SLATE — the reference charts (from 2026-10-24, the owner's brief 25, Part 10; `docs/verification/career-world-2026-10-23/
 * criteria.md`, Module 6, X1 to X4): the charts three providers publish, each imported once by this build as a dated
 * snapshot, and never fetched by the game. Box Office Mojo's domestic weekly chart (N19, N20), Netflix's global Top 10 file
 * (N21) and Nielsen's streaming Top 10 page (N22) were read on 2026-10-24; the dossier's own observations of the day before
 * (S93, S94, S37) are kept as what it saw. Reading a public page isn't leave to reuse it automatically, so nothing here is
 * refreshed: a newer week comes only as a new import, and the game says how old the last one is.
 *
 * A title has one id in every chart it's in: Netflix's Below and Nielsen's Below are one series, and so are East of Eden
 * and Nielsen's East of Eden (2026). Netflix lists each week's Raw on its own, so each is its own title; the first import
 * gave them one id, and the second week's read as the first's, down three places.
 *
 * Each chart keeps its own unit, territory and week, and nothing adds across them: Netflix counts views (hours viewed over
 * the runtime) and hours worldwide, Monday to Sunday; Nielsen counts minutes viewed by persons 2+ in the U.S., Monday to
 * Sunday, in millions; Box Office Mojo counts dollars in the U.S. and Canada, Friday to Thursday. A value a provider didn't
 * publish is `null`, said Not Reported, never zero.
 */

/** A chart the game holds snapshots of. */
export type ChartId = 'bom-domestic-weekly' | 'netflix-films-english' | 'netflix-films-other' | 'netflix-tv-english' | 'netflix-tv-other' | 'nielsen-streaming-overall';

/** What a chart counts: dollars, views or millions of minutes. */
export type ChartUnit = 'usd' | 'views' | 'minutes-millions';

export interface ChartSpec {
  id: ChartId;
  name: string;
  provider: string;
  /** This build's source record (`sources.json`). */
  source: string;
  url: string;
  territory: string;
  /** What's ranked, in the provider's terms. */
  metric: string;
  unit: ChartUnit;
  /** The weekday a measured week starts on, 0 Sunday to 6 Saturday; every week is seven days. */
  startsOn: number;
  /** Whether a figure is an estimate or an actual, as far as the provider says. */
  figures: string;
}

export const CHARTS: Readonly<Record<ChartId, ChartSpec>> = {
  'bom-domestic-weekly': {
    id: 'bom-domestic-weekly', name: 'Domestic Weekly Box Office', provider: 'Box Office Mojo by IMDbPro', source: 'N19',
    url: 'https://www.boxofficemojo.com/weekly/', territory: 'the United States and Canada', metric: 'gross for the week', unit: 'usd',
    startsOn: 5, figures: 'The page doesn’t say whether a week’s figures are estimates or actuals, and it revised week 42’s between two readings a day apart.',
  },
  'netflix-films-english': {
    id: 'netflix-films-english', name: 'Netflix Global Top 10: Films (English)', provider: 'Netflix', source: 'N21',
    url: 'https://www.netflix.com/tudum/top10', territory: 'worldwide', metric: 'views: hours viewed divided by the runtime', unit: 'views',
    startsOn: 1, figures: 'Netflix publishes views and hours rounded to the hundred thousand.',
  },
  'netflix-films-other': {
    id: 'netflix-films-other', name: 'Netflix Global Top 10: Films (Non-English)', provider: 'Netflix', source: 'N21',
    url: 'https://www.netflix.com/tudum/top10', territory: 'worldwide', metric: 'views: hours viewed divided by the runtime', unit: 'views',
    startsOn: 1, figures: 'Netflix publishes views and hours rounded to the hundred thousand.',
  },
  'netflix-tv-english': {
    id: 'netflix-tv-english', name: 'Netflix Global Top 10: TV (English)', provider: 'Netflix', source: 'N21',
    url: 'https://www.netflix.com/tudum/top10/tv', territory: 'worldwide', metric: 'views: hours viewed divided by the runtime', unit: 'views',
    startsOn: 1, figures: 'Netflix publishes views and hours rounded to the hundred thousand.',
  },
  'netflix-tv-other': {
    id: 'netflix-tv-other', name: 'Netflix Global Top 10: TV (Non-English)', provider: 'Netflix', source: 'N21',
    url: 'https://www.netflix.com/tudum/top10/tv', territory: 'worldwide', metric: 'views: hours viewed divided by the runtime', unit: 'views',
    startsOn: 1, figures: 'Netflix publishes views and hours rounded to the hundred thousand.',
  },
  'nielsen-streaming-overall': {
    id: 'nielsen-streaming-overall', name: 'Nielsen Streaming Top 10: Overall', provider: 'Nielsen', source: 'N22',
    url: 'https://www.nielsen.com/data-center/top-ten/', territory: 'the United States', metric: 'minutes viewed by persons 2 and over, in millions', unit: 'minutes-millions',
    startsOn: 1, figures: 'Nielsen publishes minutes in millions, a series’ minutes across all its episodes on the providers it measures.',
  },
};

/** One title's place in a week of a chart: `value` null where the provider didn't publish it. */
export interface ChartEntry {
  rank: number;
  /**
   * The title as the provider wrote it. Called `name`, not `title`: `tools/title-case.mjs` reads a `title` as one of the
   * game's own labels, and puts a provider's "East of Eden" into the game's Title Case.
   */
  name: string;
  /** The game's stable id for the title, the same in every chart it's in. */
  titleId: string;
  value: number | null;
  extra?: Readonly<Record<string, number | string | null>>;
}

/** A week of a chart as it was read: when, from what, and which revision. */
export interface ChartSnapshot {
  chart: ChartId;
  /** The measured week, first and last day, as the provider gives it. */
  from: string;
  to: string;
  /** When the provider published it, where it says; otherwise only when it was first seen. */
  published?: string;
  firstSeen: string;
  imported: string;
  /** Who saw it: this build, or the dossier. */
  seenBy: string;
  /** Ranks read; a partial snapshot holds fewer than the chart's ten. */
  entries: readonly ChartEntry[];
  partial?: true;
}

/**
 * The snapshots as imported, oldest first (`systems/charts.ts` validates each, keeps a changed week as a revision and a
 * repeated one as nothing new). Box Office Mojo's week 42 comes twice: the dossier's reading of 2026-10-23, two ranks of it,
 * and this build's of 2026-10-24, which gives Street Fighter $38,338,634 where the first gave $37,177,832.
 */
export const SNAPSHOTS: readonly ChartSnapshot[] = [
  {
    chart: 'bom-domestic-weekly', from: '2026-10-09', to: '2026-10-15', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Other Mommy", titleId: 'other-mommy', value: 36504440, extra: { theaters: 3365, total: 36504440, weeks: 1 } },
      { rank: 2, name: "Verity", titleId: 'verity', value: 17501351, extra: { theaters: 3572, total: 59880402, weeks: 2 } },
      { rank: 3, name: "Resident Evil", titleId: 'resident-evil', value: 12782547, extra: { theaters: 3085, total: 142957955, weeks: 4 } },
      { rank: 4, name: "Heart of the Beast", titleId: 'heart-of-the-beast', value: 10924783, extra: { theaters: 3365, total: 53488451, weeks: 3 } },
      { rank: 5, name: "Forgotten Island", titleId: 'forgotten-island', value: 7084935, extra: { theaters: 2898, total: 32857265, weeks: 3 } },
      { rank: 6, name: "The Social Reckoning", titleId: 'the-social-reckoning', value: 6732057, extra: { theaters: 2606, total: 6732057, weeks: 1 } },
      { rank: 7, name: "Primetime", titleId: 'primetime', value: 6209216, extra: { theaters: 2269, total: 43662846, weeks: 3 } },
      { rank: 8, name: "Digger", titleId: 'digger', value: 5089204, extra: { theaters: 3321, total: 16321958, weeks: 2 } },
      { rank: 9, name: "The Odyssey", titleId: 'the-odyssey', value: 3376035, extra: { theaters: 560, total: 624348825, weeks: 13 } },
      { rank: 10, name: "Angel and the Badman", titleId: 'angel-and-the-badman', value: 3150795, extra: { theaters: 2263, total: 3150795, weeks: 1 } },
    ],
  },
  {
    chart: 'bom-domestic-weekly', from: '2026-10-16', to: '2026-10-22', firstSeen: '2026-10-23', imported: '2026-10-24', seenBy: 'the dossier (S93)', partial: true, entries: [
      { rank: 1, name: 'Street Fighter', titleId: 'street-fighter', value: 37177832 },
      { rank: 2, name: 'You Can See Everything', titleId: 'you-can-see-everything', value: 23407485 },
    ],
  },
  {
    chart: 'bom-domestic-weekly', from: '2026-10-16', to: '2026-10-22', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Street Fighter", titleId: 'street-fighter', value: 38338634, extra: { theaters: 3575, total: 38338634, weeks: 1 } },
      { rank: 2, name: "You Can See Everything", titleId: 'you-can-see-everything', value: 25645476, extra: { theaters: 855, total: 25645476, weeks: 1 } },
      { rank: 3, name: "Other Mommy", titleId: 'other-mommy', value: 11179290, extra: { theaters: 3370, total: 47683730, weeks: 2 } },
      { rank: 4, name: "Whalefall", titleId: 'whalefall', value: 10873434, extra: { theaters: 3065, total: 10873434, weeks: 1 } },
      { rank: 5, name: "Sense and Sensibility", titleId: 'sense-and-sensibility', value: 10281645, extra: { theaters: 2545, total: 10281645, weeks: 1 } },
      { rank: 6, name: "Verity", titleId: 'verity', value: 8587796, extra: { theaters: 3072, total: 68468198, weeks: 3 } },
      { rank: 7, name: "Resident Evil", titleId: 'resident-evil', value: 7722577, extra: { theaters: 2705, total: 150680532, weeks: 5 } },
      { rank: 8, name: "Heart of the Beast", titleId: 'heart-of-the-beast', value: 6524726, extra: { theaters: 3049, total: 60013177, weeks: 4 } },
      { rank: 9, name: "Jailer 2", titleId: 'jailer-2', value: 3260000, extra: { theaters: 420, total: 3260000, weeks: 2 } },
      { rank: 10, name: "Forgotten Island", titleId: 'forgotten-island', value: 2912080, extra: { theaters: 2149, total: 35769345, weeks: 4 } },
    ],
  },
  {
    chart: 'netflix-films-english', from: '2026-10-05', to: '2026-10-11', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Animals", titleId: 'animals', value: 23800000, extra: { hours: 42800000, runtime: 1.8, weeksInTop10: 1 } },
      { rank: 2, name: "Doing Life", titleId: 'doing-life', value: 18200000, extra: { hours: 32800000, runtime: 1.8, weeksInTop10: 2 } },
      { rank: 3, name: "Ice Age", titleId: 'ice-age', value: 11200000, extra: { hours: 15500000, runtime: 1.3833, weeksInTop10: 1 } },
      { rank: 4, name: "Ice Age: Collision Course", titleId: 'ice-age-collision-course', value: 9300000, extra: { hours: 15100000, runtime: 1.6167, weeksInTop10: 4 } },
      { rank: 5, name: "Ice Age: Dawn of the Dinosaurs", titleId: 'ice-age-dawn-of-the-dinosaurs', value: 8000000, extra: { hours: 12700000, runtime: 1.5833, weeksInTop10: 4 } },
      { rank: 6, name: "Ice Age: The Meltdown", titleId: 'ice-age-the-meltdown', value: 7700000, extra: { hours: 11900000, runtime: 1.55, weeksInTop10: 1 } },
      { rank: 7, name: "UNABOMBER", titleId: 'unabomber', value: 7300000, extra: { hours: 12100000, runtime: 1.6667, weeksInTop10: 3 } },
      { rank: 8, name: "The Widower: 'Til Death Do Us Part", titleId: 'the-widower-til-death-do-us-part', value: 7200000, extra: { hours: 11000000, runtime: 1.5333, weeksInTop10: 2 } },
      { rank: 9, name: "Ice Age: Continental Drift", titleId: 'ice-age-continental-drift', value: 6600000, extra: { hours: 10000000, runtime: 1.5167, weeksInTop10: 1 } },
      { rank: 10, name: "The Forever Purge", titleId: 'the-forever-purge', value: 4000000, extra: { hours: 6900000, runtime: 1.7167, weeksInTop10: 2 } },
    ],
  },
  {
    chart: 'netflix-films-other', from: '2026-10-05', to: '2026-10-11', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Acid", titleId: 'acid', value: 3500000, extra: { hours: 5900000, runtime: 1.6667, weeksInTop10: 1 } },
      { rank: 2, name: "Crazy Rich, Incredibly Broke", titleId: 'crazy-rich-incredibly-broke', value: 3200000, extra: { hours: 5300000, runtime: 1.6333, weeksInTop10: 2 } },
      { rank: 3, name: "Mandaadi", titleId: 'mandaadi', value: 2200000, extra: { hours: 5600000, runtime: 2.55, weeksInTop10: 1 } },
      { rank: 4, name: "Demon Slayer: Kimetsu no Yaiba Infinity Castle I", titleId: 'demon-slayer-kimetsu-no-yaiba-infinity-castle-i', value: 2000000, extra: { hours: 5100000, runtime: 2.5833, weeksInTop10: 4 } },
      { rank: 5, name: "What a Father!", titleId: 'what-a-father', value: 1700000, extra: { hours: 2800000, runtime: 1.6167, weeksInTop10: 2 } },
      { rank: 6, name: "Reporting Live", titleId: 'reporting-live', value: 1600000, extra: { hours: 3200000, runtime: 1.95, weeksInTop10: 1 } },
      { rank: 7, name: "Schumacher ’94 — The Birth of a Legend", titleId: 'schumacher-94-the-birth-of-a-legend', value: 1500000, extra: { hours: 2600000, runtime: 1.7833, weeksInTop10: 2 } },
      { rank: 8, name: "Unhappily Ever After", titleId: 'unhappily-ever-after', value: 1300000, extra: { hours: 1900000, runtime: 1.45, weeksInTop10: 2 } },
      { rank: 9, name: "Facing El Chapo", titleId: 'facing-el-chapo', value: 1300000, extra: { hours: 2000000, runtime: 1.55, weeksInTop10: 8 } },
      { rank: 10, name: "Pradhama Drishtya Kuttakkar", titleId: 'pradhama-drishtya-kuttakkar', value: 1100000, extra: { hours: 2800000, runtime: 2.6167, weeksInTop10: 1 } },
    ],
  },
  {
    chart: 'netflix-tv-english', from: '2026-10-05', to: '2026-10-11', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Below: Limited Series", titleId: 'below', value: 17000000, extra: { hours: 69300000, runtime: 4.0667, weeksInTop10: 1 } },
      { rank: 2, name: "East of Eden: Limited Series", titleId: 'east-of-eden', value: 12600000, extra: { hours: 87700000, runtime: 6.95, weeksInTop10: 2 } },
      { rank: 3, name: "Percy Jackson and the Olympians: Season 1", titleId: 'percy-jackson-and-the-olympians', value: 4100000, extra: { hours: 21600000, runtime: 5.25, weeksInTop10: 1 } },
      { rank: 4, name: "Mojo Brookzz: I Know You Lying", titleId: 'mojo-brookzz-i-know-you-lying', value: 3300000, extra: { hours: 2600000, runtime: 0.8, weeksInTop10: 1 } },
      { rank: 5, name: "Monster: The Lizzie Borden Story: Season 1", titleId: 'monster-the-lizzie-borden-story', value: 3000000, extra: { hours: 19600000, runtime: 6.6333, weeksInTop10: 4 } },
      { rank: 6, name: "Mayor of Kingstown: Season 1", titleId: 'mayor-of-kingstown', value: 2700000, extra: { hours: 23200000, runtime: 8.75, weeksInTop10: 1 } },
      { rank: 7, name: "Raw: October 5, 2026", titleId: 'raw-october-5-2026', value: 2400000, extra: { hours: 4300000, runtime: 1.7333, weeksInTop10: 1 } },
      { rank: 8, name: "The Gentlemen: Season 2", titleId: 'the-gentlemen', value: 2000000, extra: { hours: 14900000, runtime: 7.4333, weeksInTop10: 6 } },
      { rank: 9, name: "Wonka's The Golden Ticket: Season 1", titleId: 'wonka-s-the-golden-ticket', value: 1900000, extra: { hours: 15100000, runtime: 7.85, weeksInTop10: 3 } },
      { rank: 10, name: "A Different World: Season 1", titleId: 'a-different-world', value: 1900000, extra: { hours: 10300000, runtime: 5.45, weeksInTop10: 3 } },
    ],
  },
  {
    chart: 'netflix-tv-other', from: '2026-10-05', to: '2026-10-11', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Doctor X: Mafia in White: Limited Series", titleId: 'doctor-x-mafia-in-white', value: 4600000, extra: { hours: 9900000, runtime: 2.1667, weeksInTop10: 1 } },
      { rank: 2, name: "Not a Stranger: Season 1", titleId: 'not-a-stranger', value: 3200000, extra: { hours: 21500000, runtime: 6.7833, weeksInTop10: 4 } },
      { rank: 3, name: "Take Charge of My Heart: Limited Series", titleId: 'take-charge-of-my-heart', value: 3000000, extra: { hours: 32000000, runtime: 10.5333, weeksInTop10: 1 } },
      { rank: 4, name: "Inside The Circle: Season 1", titleId: 'inside-the-circle', value: 2100000, extra: { hours: 13100000, runtime: 6.1833, weeksInTop10: 1 } },
      { rank: 5, name: "Shaque: Trust No One: Season 1", titleId: 'shaque-trust-no-one', value: 1700000, extra: { hours: 7600000, runtime: 4.45, weeksInTop10: 3 } },
      { rank: 6, name: "Irreplaceable: Season 1", titleId: 'irreplaceable', value: 1600000, extra: { hours: 19900000, runtime: 12.6667, weeksInTop10: 2 } },
      { rank: 7, name: "Medusa: Season 2", titleId: 'medusa', value: 1500000, extra: { hours: 12100000, runtime: 7.8167, weeksInTop10: 1 } },
      { rank: 8, name: "STEEL BALL RUN JoJo’s Bizarre Adventure: 2nd-3rd STAGE", titleId: 'steel-ball-run-jojo-s-bizarre-adventure', value: 1500000, extra: { hours: 1800000, runtime: 1.1833, weeksInTop10: 2 } },
      { rank: 9, name: "The Apothecary Diaries: Season 3", titleId: 'the-apothecary-diaries', value: 1500000, extra: { hours: 1200000, runtime: 0.8, weeksInTop10: 1 } },
      { rank: 10, name: "The Ramparts of Ice: Season 2", titleId: 'the-ramparts-of-ice', value: 1500000, extra: { hours: 1200000, runtime: 0.8, weeksInTop10: 1 } },
    ],
  },
  {
    chart: 'netflix-films-english', from: '2026-10-12', to: '2026-10-18', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Animals", titleId: 'animals', value: 30800000, extra: { hours: 55400000, runtime: 1.8, weeksInTop10: 2 } },
      { rank: 2, name: "Doing Life", titleId: 'doing-life', value: 7300000, extra: { hours: 13100000, runtime: 1.8, weeksInTop10: 3 } },
      { rank: 3, name: "Ice Age: Collision Course", titleId: 'ice-age-collision-course', value: 6300000, extra: { hours: 10200000, runtime: 1.6167, weeksInTop10: 5 } },
      { rank: 4, name: "Ice Age: Dawn of the Dinosaurs", titleId: 'ice-age-dawn-of-the-dinosaurs', value: 4900000, extra: { hours: 7800000, runtime: 1.5833, weeksInTop10: 5 } },
      { rank: 5, name: "Ice Age", titleId: 'ice-age', value: 4800000, extra: { hours: 6600000, runtime: 1.3833, weeksInTop10: 2 } },
      { rank: 6, name: "Corpse Bride", titleId: 'corpse-bride', value: 4600000, extra: { hours: 5900000, runtime: 1.2833, weeksInTop10: 1 } },
      { rank: 7, name: "Anyone But You", titleId: 'anyone-but-you', value: 4400000, extra: { hours: 7700000, runtime: 1.7333, weeksInTop10: 4 } },
      { rank: 8, name: "Ice Age: Continental Drift", titleId: 'ice-age-continental-drift', value: 4300000, extra: { hours: 6500000, runtime: 1.5167, weeksInTop10: 2 } },
      { rank: 9, name: "UNABOMBER", titleId: 'unabomber', value: 4200000, extra: { hours: 7000000, runtime: 1.6667, weeksInTop10: 4 } },
      { rank: 10, name: "Ice Age: The Meltdown", titleId: 'ice-age-the-meltdown', value: 3600000, extra: { hours: 5600000, runtime: 1.55, weeksInTop10: 2 } },
    ],
  },
  {
    chart: 'netflix-films-other', from: '2026-10-12', to: '2026-10-18', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Therapy Done Right", titleId: 'therapy-done-right', value: 3000000, extra: { hours: 4900000, runtime: 1.65, weeksInTop10: 1 } },
      { rank: 2, name: "The Storm", titleId: 'the-storm', value: 2600000, extra: { hours: 4400000, runtime: 1.6833, weeksInTop10: 1 } },
      { rank: 3, name: "Mandaadi", titleId: 'mandaadi', value: 2200000, extra: { hours: 5600000, runtime: 2.55, weeksInTop10: 2 } },
      { rank: 4, name: "Reporting Live", titleId: 'reporting-live', value: 1900000, extra: { hours: 3700000, runtime: 1.95, weeksInTop10: 2 } },
      { rank: 5, name: "Acid", titleId: 'acid', value: 1800000, extra: { hours: 3000000, runtime: 1.6667, weeksInTop10: 2 } },
      { rank: 6, name: "Facing El Chapo", titleId: 'facing-el-chapo', value: 1300000, extra: { hours: 2000000, runtime: 1.55, weeksInTop10: 9 } },
      { rank: 7, name: "Demon Slayer: Kimetsu no Yaiba Infinity Castle I", titleId: 'demon-slayer-kimetsu-no-yaiba-infinity-castle-i', value: 1200000, extra: { hours: 3100000, runtime: 2.5833, weeksInTop10: 5 } },
      { rank: 8, name: "Enna Vilai : The Price of Dignity", titleId: 'enna-vilai-the-price-of-dignity', value: 1200000, extra: { hours: 2400000, runtime: 2.0333, weeksInTop10: 1 } },
      { rank: 9, name: "Pradhama Drishtya Kuttakkar", titleId: 'pradhama-drishtya-kuttakkar', value: 1100000, extra: { hours: 3000000, runtime: 2.6167, weeksInTop10: 2 } },
      { rank: 10, name: "Crazy Rich, Incredibly Broke", titleId: 'crazy-rich-incredibly-broke', value: 1000000, extra: { hours: 1600000, runtime: 1.6333, weeksInTop10: 3 } },
    ],
  },
  {
    chart: 'netflix-tv-english', from: '2026-10-12', to: '2026-10-18', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Below: Limited Series", titleId: 'below', value: 21200000, extra: { hours: 86400000, runtime: 4.0667, weeksInTop10: 2 } },
      { rank: 2, name: "East of Eden: Limited Series", titleId: 'east-of-eden', value: 6200000, extra: { hours: 43300000, runtime: 6.95, weeksInTop10: 3 } },
      { rank: 3, name: "Instadocs: AI Gone Wild", titleId: 'instadocs-ai-gone-wild', value: 5100000, extra: { hours: 2300000, runtime: 0.45, weeksInTop10: 1 } },
      { rank: 4, name: "TYSON: Limited Series", titleId: 'tyson', value: 5100000, extra: { hours: 22500000, runtime: 4.4167, weeksInTop10: 1 } },
      { rank: 5, name: "The Diplomat: Season 4", titleId: 'the-diplomat', value: 4800000, extra: { hours: 33500000, runtime: 7.0333, weeksInTop10: 1 } },
      { rank: 6, name: "Love Is Blind: S11: Boston", titleId: 'love-is-blind', value: 3600000, extra: { hours: 17100000, runtime: 4.7833, weeksInTop10: 1 } },
      { rank: 7, name: "Spike: Season 1", titleId: 'spike', value: 2800000, extra: { hours: 8500000, runtime: 3.0167, weeksInTop10: 1 } },
      { rank: 8, name: "Is It Cake? Halloween: Season 2", titleId: 'is-it-cake-halloween', value: 2700000, extra: { hours: 5300000, runtime: 1.9833, weeksInTop10: 1 } },
      { rank: 9, name: "Haunted Hotel: Season 2", titleId: 'haunted-hotel', value: 2700000, extra: { hours: 9100000, runtime: 3.4167, weeksInTop10: 1 } },
      { rank: 10, name: "Raw: October 12, 2026", titleId: 'raw-october-12-2026', value: 2500000, extra: { hours: 4500000, runtime: 1.7667, weeksInTop10: 1 } },
    ],
  },
  {
    chart: 'netflix-tv-other', from: '2026-10-12', to: '2026-10-18', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Doctor X: Mafia in White: Limited Series", titleId: 'doctor-x-mafia-in-white', value: 7100000, extra: { hours: 30000000, runtime: 4.25, weeksInTop10: 2 } },
      { rank: 2, name: "Take Charge of My Heart: Limited Series", titleId: 'take-charge-of-my-heart', value: 6400000, extra: { hours: 67800000, runtime: 10.5333, weeksInTop10: 2 } },
      { rank: 3, name: "The Trap: Limited Series", titleId: 'the-trap', value: 5400000, extra: { hours: 26400000, runtime: 4.9167, weeksInTop10: 1 } },
      { rank: 4, name: "100 Days of Deception: Limited Series", titleId: '100-days-of-deception', value: 2800000, extra: { hours: 13000000, runtime: 4.5667, weeksInTop10: 1 } },
      { rank: 5, name: "Not a Stranger: Season 1", titleId: 'not-a-stranger', value: 2100000, extra: { hours: 14100000, runtime: 6.7833, weeksInTop10: 5 } },
      { rank: 6, name: "Inside The Circle: Season 1", titleId: 'inside-the-circle', value: 2000000, extra: { hours: 12300000, runtime: 6.1833, weeksInTop10: 2 } },
      { rank: 7, name: "Where the Mask Ends: Season 1", titleId: 'where-the-mask-ends', value: 1600000, extra: { hours: 12200000, runtime: null, weeksInTop10: 1 } }, // the file's runtime is 0, which isn't one
      { rank: 8, name: "STEEL BALL RUN JoJo’s Bizarre Adventure: 2nd-3rd STAGE", titleId: 'steel-ball-run-jojo-s-bizarre-adventure', value: 1200000, extra: { hours: 1900000, runtime: 1.5833, weeksInTop10: 3 } },
      { rank: 9, name: "The Apothecary Diaries: Season 3", titleId: 'the-apothecary-diaries', value: 1200000, extra: { hours: 1400000, runtime: 1.2, weeksInTop10: 2 } },
      { rank: 10, name: "The Ramparts of Ice: Season 2", titleId: 'the-ramparts-of-ice', value: 1200000, extra: { hours: 1400000, runtime: 1.2, weeksInTop10: 2 } },
    ],
  },
  {
    chart: 'nielsen-streaming-overall', from: '2026-10-05', to: '2026-10-11', firstSeen: '2026-10-24', imported: '2026-10-24', seenBy: 'this build', entries: [
      { rank: 1, name: "Carrie (2026)", titleId: 'carrie-2026', value: 1264, extra: { episodes: 8, providers: "Prime Video" } },
      { rank: 2, name: "Below", titleId: 'below', value: 1187, extra: { episodes: 6, providers: "Netflix" } },
      { rank: 3, name: "East of Eden (2026)", titleId: 'east-of-eden', value: 1162, extra: { episodes: 7, providers: "Netflix" } },
      { rank: 4, name: "Ted Lasso", titleId: 'ted-lasso', value: 943, extra: { episodes: 44, providers: "Apple TV" } },
      { rank: 5, name: "The Big Bang Theory", titleId: 'the-big-bang-theory', value: 812, extra: { episodes: 279, providers: "HBO Max" } },
      { rank: 6, name: "Bluey", titleId: 'bluey', value: 764, extra: { episodes: 154, providers: "Disney+" } },
      { rank: 7, name: "Spongebob Squarepants", titleId: 'spongebob-squarepants', value: 737, extra: { episodes: 336, providers: "Paramount+" } },
      { rank: 8, name: "Animals", titleId: 'animals', value: 719, extra: { episodes: 1, providers: "Netflix" } },
      { rank: 9, name: "Mayor of Kingstown", titleId: 'mayor-of-kingstown', value: 712, extra: { episodes: 40, providers: "Netflix | Paramount+" } },
      { rank: 10, name: "Bob's Burgers", titleId: 'bob-s-burgers', value: 626, extra: { episodes: 307, providers: "Hulu" } },
    ],
  },
];
