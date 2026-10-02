/**
 * SLATE — the plays the School's productions are, and their parts.
 *
 * Yale announces a season's directors' thesis productions a term or so ahead,
 * and 2026–27's (Machinal, Marisol, The Doctor) are cast from the classes
 * above the player's. The years the player is cast in aren't announced, so
 * which play each production is, is SLATE's estimate, drawn from plays long in
 * the public domain that conservatories stage: the characters are the plays'
 * own. The festivals' plays are new, written by the School's playwrights and
 * chosen after casting, so they stay unnamed, with parts by size. How big a
 * part is and what each play asks of an actor (`reads`, in the craft's skills)
 * are SLATE's reading of the play.
 */

import type { Craft } from '../systems/school';

export type PartSize = 'lead' | 'supporting' | 'featured';
/** Who a part is written for: an actor, an actress, or either. */
export type PartFor = 'actor' | 'actress' | 'either';

export interface Part { name: string; size: PartSize; for: PartFor }

export interface Play {
  title: string;
  by: string;
  parts: readonly Part[];
  /** What the play asks of its cast, by weight. */
  reads: Partial<Craft>;
}

const p = (name: string, size: PartSize, who: PartFor): Part => ({ name, size, for: who });

/** Plays for the directors' thesis productions, in the order SLATE deals them out. */
export const THESIS_PLAYS: readonly Play[] = [
  {
    title: 'Hedda Gabler', by: 'Henrik Ibsen', reads: { scene: 2, emotion: 2, character: 2, script: 1 },
    parts: [p('Hedda Tesman', 'lead', 'actress'), p('Eilert Løvborg', 'supporting', 'actor'), p('Thea Elvsted', 'supporting', 'actress'), p('George Tesman', 'supporting', 'actor'), p('Judge Brack', 'supporting', 'actor'), p('Juliane Tesman', 'featured', 'actress'), p('Berte', 'featured', 'actress')],
  },
  {
    title: 'The Importance Of Being Earnest', by: 'Oscar Wilde', reads: { comedy: 2, speech: 2, classical: 1, scene: 1 },
    parts: [p('John Worthing', 'lead', 'actor'), p('Algernon Moncrieff', 'lead', 'actor'), p('Lady Bracknell', 'supporting', 'actress'), p('Gwendolen Fairfax', 'supporting', 'actress'), p('Cecily Cardew', 'supporting', 'actress'), p('Miss Prism', 'featured', 'actress'), p('Canon Chasuble', 'featured', 'actor'), p('Lane', 'featured', 'actor'), p('Merriman', 'featured', 'actor')],
  },
  {
    title: 'Woyzeck', by: 'Georg Büchner', reads: { movement: 2, emotion: 2, character: 1, scene: 1 },
    parts: [p('Woyzeck', 'lead', 'actor'), p('Marie', 'lead', 'actress'), p('The Drum Major', 'supporting', 'actor'), p('The Captain', 'supporting', 'actor'), p('The Doctor', 'supporting', 'either'), p('Andres', 'featured', 'actor'), p('Margret', 'featured', 'actress'), p('The Showman', 'featured', 'either')],
  },
  {
    title: 'Three Sisters', by: 'Anton Chekhov', reads: { scene: 2, emotion: 2, character: 1, script: 1 },
    parts: [p('Masha', 'lead', 'actress'), p('Olga', 'lead', 'actress'), p('Irina', 'lead', 'actress'), p('Vershinin', 'supporting', 'actor'), p('Andrei', 'supporting', 'actor'), p('Natasha', 'supporting', 'actress'), p('Tuzenbach', 'supporting', 'actor'), p('Solyony', 'featured', 'actor'), p('Kulygin', 'featured', 'actor'), p('Chebutykin', 'featured', 'actor'), p('Anfisa', 'featured', 'actress'), p('Ferapont', 'featured', 'actor')],
  },
  {
    title: 'Blood Wedding', by: 'Federico García Lorca', reads: { emotion: 2, movement: 1, voice: 1, scene: 1, singing: 0.5 },
    parts: [p('The Bride', 'lead', 'actress'), p('The Mother', 'lead', 'actress'), p('Leonardo', 'supporting', 'actor'), p('The Bridegroom', 'supporting', 'actor'), p('Leonardo’s Wife', 'supporting', 'actress'), p('The Moon', 'featured', 'either'), p('The Beggar Woman', 'featured', 'actress'), p('The Bride’s Father', 'featured', 'actor'), p('The Servant', 'featured', 'actress')],
  },
  {
    title: 'The Cherry Orchard', by: 'Anton Chekhov', reads: { scene: 2, emotion: 1, comedy: 1, character: 1, script: 1 },
    parts: [p('Lyubov Ranevskaya', 'lead', 'actress'), p('Lopakhin', 'lead', 'actor'), p('Varya', 'supporting', 'actress'), p('Trofimov', 'supporting', 'actor'), p('Gaev', 'supporting', 'actor'), p('Anya', 'supporting', 'actress'), p('Charlotta', 'featured', 'actress'), p('Dunyasha', 'featured', 'actress'), p('Yasha', 'featured', 'actor'), p('Epikhodov', 'featured', 'actor'), p('Firs', 'featured', 'actor')],
  },
  {
    title: 'Major Barbara', by: 'Bernard Shaw', reads: { speech: 2, script: 2, comedy: 1, scene: 1 },
    parts: [p('Barbara Undershaft', 'lead', 'actress'), p('Andrew Undershaft', 'lead', 'actor'), p('Adolphus Cusins', 'supporting', 'actor'), p('Lady Britomart', 'supporting', 'actress'), p('Bill Walker', 'supporting', 'actor'), p('Stephen Undershaft', 'featured', 'actor'), p('Sarah Undershaft', 'featured', 'actress'), p('Charles Lomax', 'featured', 'actor'), p('Jenny Hill', 'featured', 'actress'), p('Snobby Price', 'featured', 'actor')],
  },
  {
    title: 'Spring Awakening', by: 'Frank Wedekind', reads: { emotion: 2, scene: 2, intimacy: 1, character: 1 },
    parts: [p('Melchior Gabor', 'lead', 'actor'), p('Wendla Bergmann', 'lead', 'actress'), p('Moritz Stiefel', 'lead', 'actor'), p('Ilse', 'supporting', 'actress'), p('Frau Bergmann', 'supporting', 'actress'), p('Frau Gabor', 'featured', 'actress'), p('Hänschen Rilow', 'featured', 'actor'), p('Ernst Röbel', 'featured', 'actor'), p('Martha Bessel', 'featured', 'actress')],
  },
];

/** Plays for the Shakespeare Repertory Projects, three a spring. */
export const SHAKESPEARE_PLAYS: readonly Play[] = [
  {
    title: 'Twelfth Night', by: 'William Shakespeare', reads: { classical: 3, comedy: 1, voice: 1, speech: 1, scene: 1, singing: 0.5 },
    parts: [p('Viola', 'lead', 'actress'), p('Olivia', 'lead', 'actress'), p('Malvolio', 'lead', 'actor'), p('Orsino', 'supporting', 'actor'), p('Sir Toby Belch', 'supporting', 'actor'), p('Sir Andrew Aguecheek', 'supporting', 'actor'), p('Maria', 'supporting', 'actress'), p('Feste', 'supporting', 'either'), p('Sebastian', 'featured', 'actor'), p('Antonio', 'featured', 'actor'), p('Fabian', 'featured', 'actor')],
  },
  {
    title: 'Measure For Measure', by: 'William Shakespeare', reads: { classical: 3, emotion: 1, voice: 1, speech: 1, scene: 1 },
    parts: [p('Isabella', 'lead', 'actress'), p('Angelo', 'lead', 'actor'), p('Duke Vincentio', 'lead', 'actor'), p('Claudio', 'supporting', 'actor'), p('Lucio', 'supporting', 'actor'), p('Mariana', 'supporting', 'actress'), p('Escalus', 'featured', 'either'), p('Pompey', 'featured', 'actor'), p('Mistress Overdone', 'featured', 'actress'), p('The Provost', 'featured', 'either')],
  },
  {
    title: 'The Winter’s Tale', by: 'William Shakespeare', reads: { classical: 3, emotion: 1, voice: 1, speech: 1, scene: 1 },
    parts: [p('Leontes', 'lead', 'actor'), p('Hermione', 'lead', 'actress'), p('Paulina', 'lead', 'actress'), p('Polixenes', 'supporting', 'actor'), p('Perdita', 'supporting', 'actress'), p('Florizel', 'supporting', 'actor'), p('Autolycus', 'supporting', 'actor'), p('Camillo', 'supporting', 'either'), p('The Old Shepherd', 'featured', 'actor'), p('The Clown', 'featured', 'actor'), p('Antigonus', 'featured', 'actor')],
  },
  {
    title: 'Macbeth', by: 'William Shakespeare', reads: { classical: 3, combat: 1, emotion: 1, voice: 1, speech: 1 },
    parts: [p('Macbeth', 'lead', 'actor'), p('Lady Macbeth', 'lead', 'actress'), p('Banquo', 'supporting', 'actor'), p('Macduff', 'supporting', 'actor'), p('Malcolm', 'supporting', 'actor'), p('Lady Macduff', 'featured', 'actress'), p('Ross', 'featured', 'either'), p('The First Witch', 'featured', 'either'), p('The Second Witch', 'featured', 'either'), p('The Third Witch', 'featured', 'either')],
  },
  {
    title: 'As You Like It', by: 'William Shakespeare', reads: { classical: 3, comedy: 1, voice: 1, speech: 1, scene: 1 },
    parts: [p('Rosalind', 'lead', 'actress'), p('Orlando', 'lead', 'actor'), p('Celia', 'supporting', 'actress'), p('Jaques', 'supporting', 'either'), p('Touchstone', 'supporting', 'actor'), p('Duke Senior', 'featured', 'actor'), p('Oliver', 'featured', 'actor'), p('Phebe', 'featured', 'actress'), p('Silvius', 'featured', 'actor'), p('Audrey', 'featured', 'actress'), p('Adam', 'featured', 'actor')],
  },
  {
    title: 'Much Ado About Nothing', by: 'William Shakespeare', reads: { classical: 3, comedy: 2, speech: 1, scene: 1 },
    parts: [p('Beatrice', 'lead', 'actress'), p('Benedick', 'lead', 'actor'), p('Hero', 'supporting', 'actress'), p('Claudio', 'supporting', 'actor'), p('Don Pedro', 'supporting', 'actor'), p('Dogberry', 'supporting', 'either'), p('Leonato', 'featured', 'actor'), p('Don John', 'featured', 'actor'), p('Margaret', 'featured', 'actress'), p('Borachio', 'featured', 'actor')],
  },
];

/**
 * Plays for Yale Rep's productions in the seasons that aren't announced: the
 * classics a professional regional theater stages beside its new work. Which
 * one a season has is SLATE's estimate; 2026–27's is The Seagull, the Rep's
 * own.
 */
export const REP_PLAYS: readonly Play[] = [
  {
    title: 'A Doll’s House', by: 'Henrik Ibsen', reads: { scene: 2, emotion: 2, character: 1, script: 1 },
    parts: [p('Nora Helmer', 'lead', 'actress'), p('Torvald Helmer', 'lead', 'actor'), p('Nils Krogstad', 'supporting', 'actor'), p('Kristine Linde', 'supporting', 'actress'), p('Doctor Rank', 'supporting', 'actor'), p('Anne-Marie', 'featured', 'actress'), p('Helene', 'featured', 'actress')],
  },
  {
    title: 'Uncle Vanya', by: 'Anton Chekhov', reads: { scene: 2, emotion: 2, character: 1, script: 1 },
    parts: [p('Vanya', 'lead', 'actor'), p('Yelena', 'lead', 'actress'), p('Sonya', 'lead', 'actress'), p('Astrov', 'supporting', 'actor'), p('Serebryakov', 'supporting', 'actor'), p('Maria Vasilyevna', 'featured', 'actress'), p('Telegin', 'featured', 'actor'), p('Marina', 'featured', 'actress')],
  },
  {
    title: 'Tartuffe', by: 'Molière', reads: { comedy: 2, classical: 2, speech: 1, scene: 1 },
    parts: [p('Tartuffe', 'lead', 'actor'), p('Orgon', 'lead', 'actor'), p('Elmire', 'lead', 'actress'), p('Dorine', 'supporting', 'actress'), p('Madame Pernelle', 'supporting', 'actress'), p('Cléante', 'supporting', 'actor'), p('Mariane', 'featured', 'actress'), p('Valère', 'featured', 'actor'), p('Damis', 'featured', 'actor')],
  },
  {
    title: 'An Enemy Of The People', by: 'Henrik Ibsen', reads: { scene: 2, speech: 1, character: 1, script: 1, emotion: 1 },
    parts: [p('Doctor Thomas Stockmann', 'lead', 'actor'), p('Peter Stockmann', 'lead', 'actor'), p('Petra Stockmann', 'supporting', 'actress'), p('Katherine Stockmann', 'supporting', 'actress'), p('Hovstad', 'supporting', 'actor'), p('Aslaksen', 'featured', 'actor'), p('Billing', 'featured', 'actor'), p('Morten Kiil', 'featured', 'actor')],
  },
  {
    title: 'The Playboy Of The Western World', by: 'J. M. Synge', reads: { accents: 2, comedy: 1, scene: 1, character: 1 },
    parts: [p('Christy Mahon', 'lead', 'actor'), p('Pegeen Mike', 'lead', 'actress'), p('The Widow Quin', 'supporting', 'actress'), p('Shawn Keogh', 'supporting', 'actor'), p('Old Mahon', 'supporting', 'actor'), p('Michael James', 'featured', 'actor'), p('Sara Tansey', 'featured', 'actress'), p('Susan Brady', 'featured', 'actress')],
  },
  {
    title: 'Mrs Warren’s Profession', by: 'Bernard Shaw', reads: { speech: 2, script: 2, scene: 1, character: 1 },
    parts: [p('Vivie Warren', 'lead', 'actress'), p('Mrs Kitty Warren', 'lead', 'actress'), p('Frank Gardner', 'supporting', 'actor'), p('Sir George Crofts', 'supporting', 'actor'), p('Praed', 'featured', 'actor'), p('The Reverend Samuel Gardner', 'featured', 'actor')],
  },
];

/**
 * Plays for the Summer Cabaret, three a summer: the short and chamber plays
 * a small summer company stages, long in the public domain. The Summer
 * Cabaret's own seasons after 2026 aren't announced, so which a summer has
 * is SLATE's estimate.
 */
export const SUMMER_PLAYS: readonly Play[] = [
  { title: 'Miss Julie', by: 'August Strindberg', reads: { emotion: 2, scene: 2, intimacy: 1 }, parts: [p('Miss Julie', 'lead', 'actress'), p('Jean', 'lead', 'actor'), p('Kristin', 'supporting', 'actress')] },
  { title: 'Trifles', by: 'Susan Glaspell', reads: { scene: 2, character: 1, script: 1 }, parts: [p('Mrs Hale', 'lead', 'actress'), p('Mrs Peters', 'lead', 'actress'), p('Sheriff Peters', 'supporting', 'actor'), p('George Henderson', 'supporting', 'actor'), p('Lewis Hale', 'featured', 'actor')] },
  { title: 'The Bear', by: 'Anton Chekhov', reads: { comedy: 2, scene: 1, movement: 1 }, parts: [p('Yelena Popova', 'lead', 'actress'), p('Grigory Smirnov', 'lead', 'actor'), p('Luka', 'supporting', 'actor')] },
  { title: 'A Marriage Proposal', by: 'Anton Chekhov', reads: { comedy: 2, scene: 1, speech: 1 }, parts: [p('Ivan Lomov', 'lead', 'actor'), p('Natalya Stepanovna', 'lead', 'actress'), p('Stepan Chubukov', 'supporting', 'actor')] },
  { title: 'Riders To The Sea', by: 'J. M. Synge', reads: { emotion: 2, accents: 1, voice: 1 }, parts: [p('Maurya', 'lead', 'actress'), p('Cathleen', 'supporting', 'actress'), p('Bartley', 'supporting', 'actor'), p('Nora', 'supporting', 'actress')] },
  { title: 'Salomé', by: 'Oscar Wilde', reads: { movement: 2, classical: 1, voice: 1, emotion: 1 }, parts: [p('Salomé', 'lead', 'actress'), p('Herod', 'lead', 'actor'), p('Herodias', 'supporting', 'actress'), p('Jokanaan', 'supporting', 'actor'), p('The Young Syrian', 'featured', 'actor'), p('The Page Of Herodias', 'featured', 'either')] },
];

/**
 * The festivals' new plays: unnamed, as they're chosen after casting, with
 * parts by size. A festival's new
 * plays ask for the script and quick changes as pages come in.
 */
export const NEW_PLAYS_READ: Partial<Craft> = { scene: 2, script: 2, character: 1, coldReading: 1 };

/** What a part in Yale Rep's company asks, its plays unannounced: a professional stage's. */
export const COMPANY_READ: Partial<Craft> = { scene: 2, voice: 1, speech: 1, character: 1, movement: 1, script: 1 };

/** What a part's size is called on the page. */
export const SIZE_WORD: Readonly<Record<PartSize, string>> = { lead: 'A Leading Part', supporting: 'A Supporting Part', featured: 'A Featured Part' };

/** A festival's or the company's parts, unnamed: so many leads, supporting and featured parts. */
export function unnamedParts(leads: number, supporting: number, featured: number): Part[] {
  return [
    ...Array.from({ length: leads }, () => p(SIZE_WORD.lead, 'lead', 'either')),
    ...Array.from({ length: supporting }, () => p(SIZE_WORD.supporting, 'supporting', 'either')),
    ...Array.from({ length: featured }, () => p(SIZE_WORD.featured, 'featured', 'either')),
  ];
}
