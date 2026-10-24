/**
 * SLATE — the agencies brief 25 names, as their own pages had them (from 2026-10-24, the owner's brief 25, Part 4;
 * `docs/verification/career-world-2026-10-23/criteria.md`, Module 3, A1 to A4). Reference data, not the save: what each
 * agency's pages said when this build read them, office by office, and how an actor's materials reach it there. Every
 * field is a reading, held to the register's record of the page's words (tests/career-agents.test.ts), or unknown with
 * why, as the catalog's are (`content/catalog.ts`).
 *
 * No agency is ranked: the brief allows no "top ten" without a defined, sourced measure, and none was read. A print
 * department's route is never given as an actor's (Stewart Talent's print form, S102, isn't one). Which agents a life can
 * approach is the game's (`content/agents.ts`); this file says only what the pages say, and `inGame` what the game does
 * with it.
 */

import { spokenList } from '../core/text';
import type { Field, Read, Unknown } from './catalog';

/** The day this build read the agencies' pages (the register's `retrieved`; United Agents' and the about pages a day before). */
export const AGENCIES_READ_ON = '2026-10-24';

/** One office's way in for an actor, as its page has it. */
export interface AgencyOffice {
  /** The office's city, where its pages name one. */
  city?: string;
  /** How the office takes an actor's materials, in the page's words. */
  route: Field<string>;
  /** The agents the page names for acting there, where it names any. */
  agents: Field<readonly string[]>;
}

export interface AgencyRecord {
  id: string;
  name: string;
  /** What its own pages say it does for actors. */
  about: Field<string>;
  offices: readonly AgencyOffice[];
  /** Every source a field of it reads. */
  sources: readonly string[];
  /** What the game does with it: who in it a life can approach, and why no one, where no one. */
  inGame: string;
}

// A reading's `words` are a stretch of the page's own words that the register holds, enough to find the fact by; the
// value says it whole. Where the page says "do not", the stretch is the part after it, so the game's prose keeps its
// contractions and the page its own wording (the refusal the player reads quotes the page in full, `content/agents.ts`).
const read = <T,>(value: T, source: string, words: string): Read<T> => ({ kind: 'read', value, source, words });
const unknown = (why: string): Unknown => ({ kind: 'unknown', why });
const NO_ROUTE = unknown('The pages the game read don’t say how it takes an actor’s materials.');
const NO_AGENTS = unknown('The pages the game read name no agent for actors.');

const UA_ACTORS = [
  'Jess Alford', 'Sophie Austin', 'Joshua Baumring-Gledhill', 'Ellie Blackford', 'Alex Campbell', 'Gabriella Capisani', 'Olivia Carlile', 'Charlotte Davies',
  'Lorna Fallowfield', 'Sean Gascoine', 'Duncan Hayes', 'Olivia Homan', 'John Hyslop', 'Ellie James', 'Joel Keating', 'Lindy King', 'Kitty Laing',
  'Donovan Mathews', 'Stephanie Moore', 'Cat Palethorpe', 'Lucia Pallaris', 'Carly Peters', 'Alexandra Rae', 'Sarah Roberts', 'Helen Robinson',
  'Tessa Schiller', 'Dallas Smith', 'Isaac Storm', 'Maureen Vincent', 'Kirk Whelan-Foran', 'Ruth Young',
] as const;

export const AGENCY_RECORDS: readonly AgencyRecord[] = [
  {
    id: 'stewart-talent', name: 'Stewart Talent',
    about: read('A national agency founded in Chicago in 1984, with offices in Atlanta, Los Angeles and New York', 'S101', 'Founded in Chicago in 1984, and now with offices in Atlanta, Los Angeles, and New York.'),
    offices: [
      {
        city: 'New York',
        route: read('No unsolicited submissions', 'N05', 'accept unsolicited submissions at this time'),
        // The page names five theatrical agents; Jordan Parente isn't given here, the owner having chosen on 2026-10-21 not
        // to depict him.
        agents: read(['Dan Patack', 'Jay Schachter', 'Rachel Grandizio', 'Tim Marshall'], 'N05', 'Dan Patack Theatrical Agent'),
      },
      {
        city: 'Los Angeles',
        route: read('No unsolicited submissions', 'N06', 'accept unsolicited submissions at this time'),
        agents: read(['Daniel Ortega', 'Ellen Drantch-Billet', 'Spencer Willis'], 'N06', 'Daniel Ortega Theatrical Agent'),
      },
      {
        city: 'Chicago',
        route: read('A picture, a résumé and a reel if you have one, by mail or email, to its Film/TV/Theatre division', 'N07', 'For consideration, please submit a picture, resume and reel (if you have one) via mail or email.'),
        agents: NO_AGENTS,
      },
      {
        city: 'Atlanta',
        // Two undated pages disagree, the contact page (N08) and the submissions page (N09), so neither is used: C7 needs
        // a later page to prefer.
        route: unknown('Its contact page says it takes submissions only by referral, and its submissions page says by email from full-time residents of the Southeast. Neither page is dated, so the game uses neither.'),
        agents: NO_AGENTS,
      },
    ],
    sources: ['S101', 'N05', 'N06', 'N07', 'N08', 'N09'],
    inGame: 'Four of its New York theatrical agents are in the game, reached through a referral from someone you’ve worked with: Dan Patack, Jay Schachter, Rachel Grandizio and Tim Marshall. Work in Chicago, Los Angeles and Atlanta through its offices there isn’t in the game yet.',
  },
  {
    id: 'united-agents', name: 'United Agents',
    about: read('An agency in London, at 12-26 Lexington Street', 'S98', '12-26 Lexington Street, London W1F 0LE'),
    offices: [{
      city: 'London',
      route: read('A CV, headshot and showreel by email to one agent only; no reply in four to six weeks means no', 'S99', 'email your CV, headshot and showreel to one agent only'),
      agents: read(UA_ACTORS, 'S98', 'Agents Actors Jess Alford Agent Sophie Austin Agent'),
    }],
    sources: ['S98', 'S99'],
    inGame: 'Its actors’ agents represent actors for work in the UK, which isn’t in the game yet, so no one here can take you on.',
  },
  {
    id: 'wme', name: 'WME',
    about: read('Represents actors for the screen and for voice work', 'S91', 'WME represents generations of actors who routinely garner major awards.'),
    offices: [{ route: read('No submissions of any kind', 'N10', 'accept submissions of any kind through the Website, email, or otherwise'), agents: NO_AGENTS }],
    sources: ['S91', 'N10'],
    inGame: 'It takes no submissions of any kind, and the pages the game read name no agent, so no one here is in the game.',
  },
  {
    id: 'caa', name: 'CAA',
    about: read('Represents actors, directors, writers and producers in film', 'S89', 'CAA represents the world\'s premier actors, directors, writers, and producers.'),
    offices: [{ route: NO_ROUTE, agents: NO_AGENTS }],
    sources: ['S89'],
    inGame: 'The pages the game read name no agent and no way in, so no one here is in the game.',
  },
  {
    id: 'uta', name: 'UTA',
    about: unknown('Its talent page loads only in a browser, so the text the game read holds nothing of it.'),
    offices: [{ route: NO_ROUTE, agents: NO_AGENTS }],
    sources: ['S90'],
    inGame: 'Its page loads only in a browser, so the game holds nothing of it and no one here is in the game.',
  },
  {
    id: 'curtis-brown', name: 'Curtis Brown',
    about: unknown('Its actors’ page loads only in a browser, so the text the game read holds nothing of it.'),
    offices: [{ route: NO_ROUTE, agents: NO_AGENTS }],
    sources: ['S103'],
    inGame: 'Its page loads only in a browser, so the game holds nothing of it and no one here is in the game.',
  },
];

/** A field said to a player: its value, or what isn't known. */
export const fieldWords = (f: Field<string | readonly string[]>): string =>
  f.kind === 'unknown' ? f.why : Array.isArray(f.value) ? spokenList(f.value as readonly string[]) : String(f.value);
