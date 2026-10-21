/**
 * SLATE — the agents a player can approach, and their agencies (from 2026-10-20, the owner's brief 19, "Professional
 * Career Foundation And The First Individual Agent"; `docs/verification/career-2026-10-20/design.md`, The Agent).
 *
 * One agent, in depth: Jordan Parente, an agent in the Legit (Theatrical) Department of Stewart Talent's New York office.
 * He is a real person, so the game holds only what the agency and the trade press publish about his role
 * (`docs/research/career-2026-10-20/agent.md`, read 2026-10-20): his name, the agency, the office, the department and
 * the fields it covers, and the agency's published policy for New York legit submissions. It holds no contact detail,
 * no client, no term of his, no taste, manner or opinion of his, no claim that he attends the School's showcase or has
 * seen anybody's work, and no union-franchise claim (unverified, agent.md). Everything he says and decides in the game is
 * fictional, and the notice below says so where he first appears and on his panel.
 *
 * He never seeks the player out: the agency's own home page warns that people pose as its representatives to approach
 * unrepresented actors (agent.md, "Agency's warning about impersonators"). A route to him is one the policy allows, the
 * School's follow-up after its showcase or a referral from somebody the player has worked with (`routes`), and his
 * replies only answer an approach the player made.
 *
 * How many actors his list takes in a year, and of which types, is the game's assumption (`roster`): nothing about his
 * real list is known or used. The draw of a year's openings belongs to the agent's system and its decider; this file
 * gives the shape and the bounds.
 *
 * A second agent, or a fictional one in his place, is another entry in `AGENTS` with its own data: no engine code names
 * him (agent.md, Alternates; the design's Swappable).
 */

import type { PartSize } from './plays';

/** A fact's source: where it was read, the page's own title, the date the page shows (where it shows one) and the day read. */
export interface SourceRef {
  url: string;
  page: string;
  shown?: string;
  read: string;
  /** The words relied on, as the page has them. */
  quote: string;
}

/** The fields an agent's department covers, by the department's own published list. */
export type AgentField = 'television' | 'film' | 'broadway' | 'off-broadway' | 'national-tour' | 'regional';

/** Each field as the game names it on a screen. */
export const FIELD_LABEL: Readonly<Record<AgentField, string>> = {
  television: 'Television', film: 'Film', broadway: 'Broadway', 'off-broadway': 'Off-Broadway', 'national-tour': 'National Tours', regional: 'Regional Theater',
};

/** The ways an agent can be reached that the agency's policy allows. */
export type AgentRoute = 'showcase' | 'referral';

export interface Agency {
  id: string;
  name: string;
  /** The office the agent works in: its city as the game names it, and the gazetteer's id. */
  office: { city: string; cityId: string };
  department: {
    /** The department's name, and the other name the agency's own site and the listing give it. */
    called: string;
    alsoCalled: string;
    fields: readonly AgentField[];
    /** The fields as the department's published bio lists them, quoted in its own spelling. */
    fieldsQuoted: string;
    source: SourceRef;
  };
  /** The agency's published policy for this department's submissions, quoted, and what it means in the game. */
  policy: { quote: string; unsolicited: 'refused'; source: SourceRef };
  /** The agency's warning that people pose as its representatives, quoted: why no message from it arrives unasked. */
  warning: { quote: string; source: SourceRef };
}

/**
 * A type of actor a list may take on in a year: the billing the parts would be, and the playing ages. The game's
 * assumption for every agent, never a fact about one.
 */
export interface RosterType {
  billing: PartSize;
  ages: readonly [from: number, to: number];
}

/**
 * The roster needs, as simulation data: the types a list may have room for, and how many openings a year holds in all.
 * The agent's system draws a year's openings from these through its decider (`src/engine/decided.ts`), and shows them
 * as the game's assumption (`words`).
 */
export interface RosterAssumption {
  basis: 'assumption';
  types: readonly RosterType[];
  /** The least and the most openings a year holds, across every type. */
  openingsPerYear: readonly [least: number, most: number];
  words: string;
}

/** One year's drawn opening, the shape the agent's system keeps or works out again: a type and how many. */
export interface RosterOpening {
  year: number;
  type: RosterType;
  count: number;
}

export interface Agent {
  id: string;
  name: string;
  /** A real person: every word and decision of theirs in the game is fictional, and `notice` says so. */
  real: boolean;
  agencyId: string;
  /** The role as the agency's staff list and the trade press give it. */
  role: string;
  routes: readonly AgentRoute[];
  /** What the player reads where the agent first appears, and again on the agent's panel. */
  notice: string;
  /** The short line every panel and message of theirs carries. */
  fictional: string;
  roster: RosterAssumption;
  sources: readonly SourceRef[];
}

const READ = '2026-10-20';

/** Stewart Talent's policy for New York legit submissions, in its own words: kept once, and quoted from here. */
const POLICY = 'We do not accept unsolicited submissions at this time.';
/** Its warning about people posing as its representatives, in its own words. */
const WARNING = 'It has come to our attention that there are individuals claiming to be representatives of Stewart Talent that are soliciting talent via email, social media, and known casting hubs for unrepresented talent.';
/** The department's fields as its bio lists them, in the bio's own spelling. */
const FIELDS_QUOTED = 'Television, Film, Broadway, Off-Broadway, National Tours and Regional Theatre';

/** The agency's New York contact page and its staff list: "Jordan Parente / Theatrical Agent" (agent.md). */
const STAFF: SourceRef = {
  url: 'https://www.stewarttalent.com/site/contact_new_york', page: 'Contact | New York | Stewart Talent', shown: '© Stewart Talent 2015-2020', read: READ,
  quote: 'Jordan Parente / Theatrical Agent',
};
/** The trade press naming him among the New York office's agents (agent.md). */
const DEADLINE: SourceRef = {
  url: 'https://deadline.com/2025/09/stewart-talent-rachel-grandizio-promotes-agent-1236548471/', page: 'Stewart Talent Promotes Rachel Grandizio To Agent', shown: 'September 18, 2025', read: READ,
  quote: 'She joins agents Donald Birge (Owner), Tim Marshall (Managing Director), Jay Schachter (Head of Film and Television), Jordan Parente and Dan Patack in the New York office.',
};
/** The department and its fields, from a seminar listing's bio, secondary and probably his own (agent.md). */
const LISTING: SourceRef = {
  url: 'https://www.actorsconnection.com/seminars/2025-06-02-img-3890lzoom-online-seminar-with-jordan-parente-agent-stewart-talent/',
  page: 'Zoom: Online SEMINAR with JORDAN PARENTE, Agent, Stewart Talent | Actors Connection', shown: 'Monday, June 2, 2025', read: READ,
  quote: `Jordan Parente is an Agent in the Legit Department at Stewart Talent in New York City … in the genres of ${FIELDS_QUOTED}.`,
};
/** The agency's submission page, New York legit (agent.md). */
const SCOUTING: SourceRef = {
  url: 'https://www.stewarttalent.com/scouting', page: 'TALENT SUBMISSION | Stewart Talent', shown: '© Stewart Talent 2015-2020', read: READ,
  quote: `New York / Legit: ${POLICY}`,
};
/** The agency's home page and its warning (agent.md). */
const HOME: SourceRef = {
  url: 'https://www.stewarttalent.com/', page: 'Stewart Talent Agency', read: READ,
  quote: WARNING,
};

export const AGENCIES: readonly Agency[] = [
  {
    id: 'stewart-talent',
    name: 'Stewart Talent',
    office: { city: 'New York', cityId: 'us-ny-newyork' },
    department: {
      called: 'Legit', alsoCalled: 'Theatrical',
      fields: ['television', 'film', 'broadway', 'off-broadway', 'national-tour', 'regional'],
      fieldsQuoted: FIELDS_QUOTED,
      source: LISTING,
    },
    // The agency's words, kept as its page has them (agent.md, Submission policy): an unsolicited submission is refused
    // in them, by whatever system takes one, quoting `policy.quote` from here.
    policy: { quote: POLICY, unsolicited: 'refused', source: SCOUTING },
    warning: { quote: WARNING, source: HOME },
  },
];

export const AGENTS: readonly Agent[] = [
  {
    id: 'jordan-parente',
    name: 'Jordan Parente',
    real: true,
    agencyId: 'stewart-talent',
    role: 'Agent, Legit Department',
    routes: ['showcase', 'referral'],
    // The research's labeling, put in the player's words (agent.md, Risks; docs/STYLE.md, Truth in the text).
    notice: 'Jordan Parente is a real agent at Stewart Talent in New York. Everything he says and decides in this game is invented: he hasn’t seen your work, and he isn’t involved with the game. Stewart Talent’s New York legit department doesn’t accept unsolicited submissions, so please don’t contact the agency about the game.',
    fictional: 'Fictional: his words and decisions here are invented.',
    roster: {
      basis: 'assumption',
      // ASSUMPTION, the game's: types a legit list for stage and screen might take on, by billing and playing age.
      types: [
        { billing: 'lead', ages: [22, 30] },
        { billing: 'lead', ages: [30, 40] },
        { billing: 'supporting', ages: [22, 35] },
        { billing: 'supporting', ages: [35, 50] },
        { billing: 'featured', ages: [22, 45] },
      ],
      // ASSUMPTION: a list takes on one to three new actors a year.
      openingsPerYear: [1, 3],
      words: 'How many new actors his list takes on in a year, and of which types, is assumed in the game. The game knows nothing of his real list and uses none of it.',
    },
    sources: [STAFF, DEADLINE, LISTING, SCOUTING, HOME],
  },
];

/** An agent's id, as `AGENTS` gives it (`jordan-parente`). */
export type AgentId = string;

export const agentById = (id: string): Agent | undefined => AGENTS.find((a) => a.id === id);
export const agencyById = (id: string): Agency | undefined => AGENCIES.find((a) => a.id === id);
/** The agency an agent works at. Every agent's is in `AGENCIES`. */
export const agencyOf = (agent: Agent): Agency => agencyById(agent.agencyId)!;
