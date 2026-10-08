/**
 * SLATE — real plays from 2000 on, as facts to read and research by
 * (from 2026-10-09; `docs/research/world/research-contemporary-plays.json`,
 * each fact read on 2026-10-07 from the producing theater's, the publisher's or
 * a trade paper's own page, the page and its words kept there).
 *
 * **What this is.** Thirty plays by thirty playwrights, first staged from 2000
 * to 2023 in the US and the UK: the title, who wrote it, its first production
 * (the year always; the day where a source names it), and where a source says
 * so its form, its cast as the publisher lists it, when and where it's set, and
 * its first edition. A play's premiere is when it was first staged; its
 * `published` year when its first edition came out; its `setting` when its
 * story happens. None of these is a play Yale assigns: nothing here says the
 * School teaches it.
 *
 * **What it isn't.** No text of any of them: each is under copyright (`research-contemporary-material.json`),
 * so nothing is quoted and no scene of one is played. The scene work SLATE
 * plays is public-domain plays and its own originals (`origin: 'original'` in
 * `content/coursework.ts`). Who licenses a play's performance is a different
 * fact from what it is, and isn't kept: the research could confirm it for four
 * plays of thirty. The research's notes on acting each play were its own
 * words, not its sources', and weren't brought in.
 *
 * So each play is, in SLATE: **known** (its facts, for research and planning),
 * **studied** (read with a copy borrowed from a library, and its first
 * production researched: `systems/playreading.ts`), and never **played**.
 *
 * Written from the research file, the titles in SLATE’s Title Case: correct
 * the research, then this.
 */

export interface ContemporaryPlay {
  id: string;
  title: string;
  by: string;
  /** The first production anywhere. */
  premiere: { year: number; date?: string; venue: string };
  form?: string;
  /** The cast as the publisher lists it: women (`f`) and men (`m`) where it counts them, the youngest playing age where it gives one. */
  cast?: { text: string; f?: number; m?: number; minAge?: number; size?: number };
  /** When and where the story happens, as the source has it. */
  setting?: string;
  /** The first edition, where the publisher's own page shows it. */
  published?: { year: number; by: string };
  /** The page the premiere was read on. */
  source: string;
}

export const CONTEMPORARY_PLAYS: readonly ContemporaryPlay[] = [
  { id: 'proof', title: 'Proof', by: 'David Auburn', premiere: { year: 2000, venue: 'Manhattan Theatre Club, New York (off-Broadway)' }, form: 'drama', source: 'https://shubert.nyc/press/ayo-edebiri-don-cheadle-to-make-their-broadway-debuts-this-spring-in-david-auburn-s-proof-directed-by-thomas-kail/' },
  { id: 'doubt-a-parable', title: 'Doubt: A Parable', by: 'John Patrick Shanley', premiere: { year: 2004, venue: 'Manhattan Theatre Club, New York (off-Broadway)' }, form: 'drama', cast: { text: '3f 1m', f: 3, m: 1 }, setting: '1964, a Catholic school in the Bronx', source: 'https://www.nickhernbooks.co.uk/plays-to-perform/doubt' },
  { id: 'topdog-underdog', title: 'Topdog/Underdog', by: 'Suzan-Lori Parks', premiere: { year: 2001, venue: 'Joseph Papp Public Theater, New York' }, form: 'drama; a darkly comic fable (two-hander)', cast: { text: '2m', f: 0, m: 2 }, source: 'https://www.nickhernbooks.co.uk/plays-to-perform/topdog-underdog' },
  { id: 'sweat', title: 'Sweat', by: 'Lynn Nottage', premiere: { year: 2015, venue: 'Oregon Shakespeare Festival' }, form: 'drama, based on interviews with residents', cast: { text: '3f 6m', f: 3, m: 6 }, setting: 'Reading, Pennsylvania, the time not given', source: 'https://www.nickhernbooks.co.uk/plays-to-perform/sweat' },
  { id: 'clybourne-park', title: 'Clybourne Park', by: 'Bruce Norris', premiere: { year: 2010, venue: 'Playwrights Horizons, New York' }, form: 'satire', cast: { text: '3f 5m', f: 3, m: 5 }, setting: '1959 (first act) and 2009 (second act), the same house in Clybourne Park, Chicago', source: 'https://www.nickhernbooks.co.uk/plays-to-perform/clybourne-park' },
  { id: 'venus-in-fur', title: 'Venus In Fur', by: 'David Ives', premiere: { year: 2010, date: '2010-01-13', venue: 'Classic Stage Company, New York' }, form: 'two-character play', cast: { text: 'two characters', size: 2 }, source: 'https://playbill.com/article/david-ives-venus-in-fur-with-bentley-and-arianda-begins-world-premiere-in-nyc-com-164899' },
  { id: 'disgraced', title: 'Disgraced', by: 'Ayad Akhtar', premiere: { year: 2012, venue: 'American Theater Company, Chicago' }, source: 'https://www.lct.org/shows/disgraced-at-lct3/' },
  { id: 'water-by-the-spoonful', title: 'Water By The Spoonful', by: 'Quiara Alegría Hudes', premiere: { year: 2011, venue: 'Hartford Stage, Hartford, Connecticut' }, form: 'the second play of a three-play cycle', source: 'https://www.hartfordstage.org/pulitzer' },
  { id: 'august-osage-county', title: 'August: Osage County', by: 'Tracy Letts', premiere: { year: 2007, venue: 'Steppenwolf Theatre Company, Chicago' }, form: 'black comedy', cast: { text: '7f 6m', f: 7, m: 6 }, setting: 'Oklahoma, the Weston family home, the time not given', source: 'https://www.nickhernbooks.co.uk/plays-to-perform/august-osage-county' },
  { id: 'the-humans', title: 'The Humans', by: 'Stephen Karam', premiere: { year: 2014, venue: 'American Theater Company, Chicago' }, form: 'drama', cast: { text: '4f 2m', f: 4, m: 2 }, setting: 'Thanksgiving (year not stated), an apartment in Lower Manhattan', source: 'https://www.nickhernbooks.co.uk/plays-to-perform/the-humans' },
  { id: 'constellations', title: 'Constellations', by: 'Nick Payne', premiere: { year: 2012, venue: 'Royal Court Theatre (Theatre Upstairs), London' }, form: 'a play about free will and friendship, built on multiverse theory', cast: { text: 'two characters (a quantum physicist and a beekeeper)', size: 2 }, published: { year: 2012, by: 'Faber & Faber' }, source: 'https://www.faber.co.uk/product/9780571289080-constellations/' },
  { id: 'jerusalem', title: 'Jerusalem', by: 'Jez Butterworth', premiere: { year: 2009, venue: 'Royal Court Theatre, London' }, form: 'comic, contemporary play', cast: { text: '5f 8m plus 1 boy', f: 5, m: 8 }, setting: 'St George’s Day, the morning of the local country fair (year not stated)', published: { year: 2009, by: 'Nick Hern Books' }, source: 'https://www.nickhernbooks.co.uk/plays-to-perform/jerusalem' },
  { id: 'lungs', title: 'Lungs', by: 'Duncan Macmillan', premiere: { year: 2011, venue: 'Studio Theatre, Washington, D.C.' }, form: 'drama', source: 'https://www.studiotheatre.org/plays/play-detail/2011-2012-lungs' },
  { id: 'the-flick', title: 'The Flick', by: 'Annie Baker', premiere: { year: 2013, venue: 'Playwrights Horizons, New York (off-Broadway)' }, form: 'drama with comedy', cast: { text: '1f 3m', f: 1, m: 3 }, setting: 'a run-down movie theater in central Massachusetts, the time not given', source: 'https://www.playwrightshorizons.org/shows/production-history/2010s/2012-13/flick' },
  { id: 'fairview', title: 'Fairview', by: 'Jackie Sibblies Drury', premiere: { year: 2018, date: '2018-06-17', venue: 'Soho Rep, New York' }, source: 'https://playbill.com/article/jackie-sibblies-drurys-fairview-opens-at-soho-rep-june-17' },
  { id: 'the-wolves', title: 'The Wolves', by: 'Sarah DeLappe', premiere: { year: 2016, venue: 'The Playwrights Realm, at The Duke on 42nd Street, New York (off-Broadway)' }, source: 'https://www.playwrightsrealm.org/all-playwrights/sarah-delappe' },
  { id: 'cost-of-living', title: 'Cost Of Living', by: 'Martyna Majok', premiere: { year: 2016, venue: 'Williamstown Theatre Festival, Massachusetts' }, form: 'drama', cast: { text: '2f 2m', f: 2, m: 2 }, source: 'https://www.nickhernbooks.co.uk/plays-to-perform/cost-of-living' },
  { id: 'gloria', title: 'Gloria', by: 'Branden Jacobs-Jenkins', premiere: { year: 2015, venue: 'Vineyard Theatre, New York (off-Broadway)' }, form: 'comic drama', cast: { text: '3f 3m, doubling (7f 6m)', f: 3, m: 3 }, setting: 'the offices of a Manhattan magazine, the time not given', source: 'https://vineyardtheatre.org/archive/garry-marshall-will-direct-first-show-2014-15-season/' },
  { id: 'rabbit-hole', title: 'Rabbit Hole', by: 'David Lindsay-Abaire', premiere: { year: 2006, venue: 'Manhattan Theatre Club, Biltmore Theatre, New York' }, cast: { text: 'five roles: Howie, Jason, Becca, Nat, Izzy (2m 3f)', f: 3, m: 2 }, source: 'https://www.manhattantheatreclub.com/who-we-are/about-mtc/history/' },
  { id: 'between-riverside-and-crazy', title: 'Between Riverside And Crazy', by: 'Stephen Adly Guirgis', premiere: { year: 2014, venue: 'Atlantic Theater Company, Linda Gross Theater, New York' }, source: 'https://atlantictheater.org/production/between-riverside-and-crazy/' },
  { id: 'fat-ham', title: 'Fat Ham', by: 'James Ijames', premiere: { year: 2021, venue: 'Wilma Theater, Philadelphia' }, form: 'comic tragedy; a reinvention of Hamlet', setting: 'a Southern family barbecue, the time not given', source: 'https://www.nickhernbooks.co.uk/plays-to-perform/fat-ham' },
  { id: 'english', title: 'English', by: 'Sanaz Toossi', premiere: { year: 2022, venue: 'Atlantic Theater Company, Linda Gross Theater, New York (off-Broadway)' }, setting: '2008, a TOEFL class in Karaj, Iran', source: 'https://www.nickhernbooks.co.uk/plays-to-perform/english-wish-you-were-here-two-plays' },
  { id: 'primary-trust', title: 'Primary Trust', by: 'Eboni Booth', premiere: { year: 2023, venue: 'Laura Pels Theatre, New York (off-Broadway)' }, form: 'character study', setting: 'suburban New York, the time not given', source: 'https://www.nickhernbooks.co.uk/plays-to-perform/primary-trust' },
  { id: 'the-children', title: 'The Children', by: 'Lucy Kirkwood', premiere: { year: 2016, venue: 'Royal Court Theatre (Jerwood Theatre Downstairs), London' }, form: 'drama', cast: { text: '2f 1m', f: 2, m: 1 }, setting: 'an isolated cottage on the coast, the time not given', published: { year: 2016, by: 'Nick Hern Books' }, source: 'https://www.nickhernbooks.co.uk/plays-to-perform/thechildren' },
  { id: 'enron', title: 'Enron', by: 'Lucy Prebble', premiere: { year: 2009, venue: 'Chichester Festival Theatre (co-production with Headlong and the Royal Court)' }, form: 'large-scale new play with ensemble, video and stage spectacle', source: 'https://www.cft.org.uk/about-us/our-history/2009' },
  { id: 'escaped-alone', title: 'Escaped Alone', by: 'Caryl Churchill', premiere: { year: 2016, venue: 'Royal Court Theatre, London' }, form: 'short play', cast: { text: '4f, all playing age at least 70', f: 4, m: 0, minAge: 70 }, setting: 'a summer of afternoons (year not stated), in a back yard', published: { year: 2016, by: 'Nick Hern Books' }, source: 'https://www.nickhernbooks.co.uk/plays-to-perform/escapedalone' },
  { id: 'king-charles-iii', title: 'King Charles III', by: 'Mike Bartlett', premiere: { year: 2014, venue: 'Almeida Theatre, London' }, form: 'future history play in the style and structure of a Shakespearean history play', cast: { text: '4f 8m, doubling', f: 4, m: 8 }, setting: 'after the death of Queen Elizabeth II (an imagined future at the time of writing)', published: { year: 2014, by: 'Nick Hern Books' }, source: 'https://www.nickhernbooks.co.uk/plays-to-perform/KingCharlesIII' },
  { id: 'fleabag', title: 'Fleabag', by: 'Phoebe Waller-Bridge', premiere: { year: 2013, venue: 'Edinburgh Festival Fringe (then Soho Theatre, London)' }, form: 'monologue for a female performer (solo)', cast: { text: '1f plus 6 recorded voices', f: 1, m: 0 }, published: { year: 2016, by: 'Nick Hern Books' }, source: 'https://www.nickhernbooks.co.uk/plays-to-perform/fleabag' },
  { id: 'the-laramie-project', title: 'The Laramie Project', by: 'Moisés Kaufman and the members of Tectonic Theater Project', premiere: { year: 2000, date: '2000-02-26', venue: 'Denver Center Theatre Company, Ricketson Theatre, Denver' }, form: 'documentary play drawn from interviews with the people of Laramie', setting: 'the aftermath of Matthew Shepard’s murder in October 1998, Laramie, Wyoming (as the interviews were gathered from November 1998)', source: 'https://www.denvercenter.org/news-center/moises-kaufman-on-the-laramie-project-from-process-to-production/' },
  { id: 'black-watch', title: 'Black Watch', by: 'Gregory Burke', premiere: { year: 2006, venue: 'Edinburgh Festival Fringe (National Theatre of Scotland production)' }, source: 'https://www.nationaltheatrescotland.com/latest/acclaimed-black-watch-features-in-new-v-a-dundee-exhibition' },
];
