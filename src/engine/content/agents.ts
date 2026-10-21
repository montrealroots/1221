/**
 * SLATE — the agents a player can approach, and their agencies (from 2026-10-20, the owner's brief 19, "Professional
 * Career Foundation And The First Individual Agent"; `docs/verification/career-2026-10-20/design.md`, The Agent).
 *
 * One agent, in depth: Thomas Ashgrove, an agent in the Legit (Theatrical) Department of Halberd Talent's New York
 * office. He and the agency are invented for the game, as every project, company and casting office in it is, and the
 * notice below says so where he first appears and on his panel. Until 2026-10-21 the agent was a real person, Jordan
 * Parente of Stewart Talent, depicted only from what the agency and the trade press published
 * (`docs/research/career-2026-10-20/agent.md`); the owner chose a fictional agent in his place that day ("Let's go ahead
 * and swap in a fictional agent."). Neither name was found as a real talent agent or agency when checked that day.
 *
 * His office's ways are the game's own, kept from the real agency's published ones as the research read them: it takes
 * no submissions it hasn't asked for (`policy`), and he never seeks the player out. A route to him is the School's
 * follow-up after its showcase or a referral from somebody the player has worked with (`routes`), and his replies only
 * answer an approach the player made.
 *
 * How many actors his list takes in a year, and of which types, is the game's assumption (`roster`). The draw of a
 * year's openings belongs to the agent's system and its decider; this file gives the shape and the bounds.
 *
 * A second agent is another entry in `AGENTS` with its own data: no engine code names him (the design's Swappable,
 * which the swap of 2026-10-21 bore out: it changed this file, the guide's and the tutorial's words and the tests).
 */

import type { PartSize } from './plays';

/** The fields an agent's department covers. */
export type AgentField = 'television' | 'film' | 'broadway' | 'off-broadway' | 'national-tour' | 'regional';

/** Each field as the game names it on a screen. */
export const FIELD_LABEL: Readonly<Record<AgentField, string>> = {
  television: 'Television', film: 'Film', broadway: 'Broadway', 'off-broadway': 'Off-Broadway', 'national-tour': 'National Tours', regional: 'Regional Theater',
};

/** The ways an agent can be reached that the agency's way of working allows. */
export type AgentRoute = 'showcase' | 'referral';

export interface Agency {
  id: string;
  name: string;
  /** The office the agent works in: its city as the game names it, and the gazetteer's id. */
  office: { city: string; cityId: string };
  department: {
    /** The department's name, and the other name the trade gives it. */
    called: string;
    alsoCalled: string;
    fields: readonly AgentField[];
  };
  /** How the agency takes submissions in the game, its own rule said in `words`: an unsolicited one is refused in them. */
  policy: { unsolicited: 'refused'; words: string };
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
  agencyId: string;
  /** The role, as a legit agency's staff list would give it. */
  role: string;
  routes: readonly AgentRoute[];
  /** What the player reads where the agent first appears, and again on the agent's panel. */
  notice: string;
  roster: RosterAssumption;
}

export const AGENCIES: readonly Agency[] = [
  {
    id: 'halberd-talent',
    name: 'Halberd Talent',
    office: { city: 'New York', cityId: 'us-ny-newyork' },
    department: {
      called: 'Legit', alsoCalled: 'Theatrical',
      fields: ['television', 'film', 'broadway', 'off-broadway', 'national-tour', 'regional'],
    },
    // The game's rule, kept from the real agency's published policy for New York legit submissions ("We do not accept
    // unsolicited submissions at this time.", agent.md): an unsolicited submission is refused in these words.
    policy: { unsolicited: 'refused', words: 'His office takes no submissions it hasn’t asked for.' },
  },
];

export const AGENTS: readonly Agent[] = [
  {
    id: 'thomas-ashgrove',
    name: 'Thomas Ashgrove',
    agencyId: 'halberd-talent',
    role: 'Agent, Legit Department',
    routes: ['showcase', 'referral'],
    notice: 'Thomas Ashgrove and Halberd Talent are invented for the game, as every agency, project and casting office in it is. His office takes no submissions it hasn’t asked for: it sees your materials through the School’s follow-up after the showcase, or a referral from someone you’ve worked with. He never gets in touch first.',
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
      words: 'How many new actors his list takes on in a year, and of which types, is assumed in the game.',
    },
  },
];

/** An agent's id, as `AGENTS` gives it (`thomas-ashgrove`). */
export type AgentId = string;

export const agentById = (id: string): Agent | undefined => AGENTS.find((a) => a.id === id);
export const agencyById = (id: string): Agency | undefined => AGENCIES.find((a) => a.id === id);
/** The agency an agent works at. Every agent's is in `AGENCIES`. */
export const agencyOf = (agent: Agent): Agency => agencyById(agent.agencyId)!;
