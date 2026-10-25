/**
 * SLATE — the agents a player can approach, and their agencies (from 2026-10-20, the owner's brief 19, "Professional
 * Career Foundation And The First Individual Agent"; `docs/verification/career-2026-10-20/design.md`, The Agent).
 *
 * The game's own agent, in depth: Thomas Ashgrove, an agent in the Legit (Theatrical) Department of Halberd Talent's
 * New York office. Until 2026-10-24 he was the only one. He and the agency are invented for the game, and the notice
 * below says so where he first appears and on his panel; until 2026-10-24 it said every project, casting office and
 * agency was too, which the parts drawn from real productions (brief 25's Module 2) and the real agents beside him
 * (Module 3) had made untrue. Until 2026-10-21 the agent was a real person, Jordan Parente of Stewart Talent, depicted
 * only from what the agency and the trade press published
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
 *
 * A voice department (from 2026-10-25, the owner's brief 27, Part 6's "medium", Part 7's "Voice samples" and loop 7): until
 * then no agent in the game covered voice work, so no office ever asked for a voice demo and no agreement could cover an
 * animated part, a dub or a narration. Halberd Talent, the game's own agency, has a voice-over department beside its legit
 * one (`otherDepartments`), and Celia Brannock, an agent in it, is invented for the game as the agency is: a web search on
 * 2026-10-25 for her name as a talent or voice-over agent found no one. A real agency's voice-over department is in the
 * game only where a page the register read names one, and none does, so no real agent covers voice.
 *
 * Real agents (from 2026-10-24, the owner's brief 25, Part 4, and their word that day: "Use real agents."): the theatrical
 * agents Stewart Talent's New York office names on its own page, each with the page's words for name and role
 * (`real`), read on 2026-10-24. Nothing is said of a real agent that the page doesn't give: no specialties, clients,
 * preferences, list or room on it (so no `roster`), and no pronoun, so the player's words name the agent (`words`). The
 * office takes no unsolicited submissions, and in the game a referral from someone the player worked with reaches it,
 * the game's reading that a referral isn't unsolicited, said as one. Jordan Parente, named on the same page, isn't one of
 * them: the owner chose on 2026-10-21 not to depict him, and the plan they agreed on 2026-10-24 left him out. Whatever
 * a real agent does in a life is the game's invention, and the notice says so. The agencies' own records, office by
 * office, are `content/agencies.ts`.
 */

import type { PartSize } from './plays';

/**
 * The fields an agent's department covers. From 2026-10-25 (brief 27) voice-over too: an animated part, a dub or a
 * narration, the work `voiceOnly` (`systems/workflow.ts`) records with the voice alone.
 */
export type AgentField = 'television' | 'film' | 'broadway' | 'off-broadway' | 'national-tour' | 'regional' | 'voice';

/** Each field as the game names it on a screen. */
export const FIELD_LABEL: Readonly<Record<AgentField, string>> = {
  television: 'Television', film: 'Film', broadway: 'Broadway', 'off-broadway': 'Off-Broadway', 'national-tour': 'National Tours', regional: 'Regional Theater',
  voice: 'Voice-Over',
};

/**
 * The ways an agent can be reached that the agency's way of working allows. From 2026-10-25 (brief 27) an introduction at
 * a festival where the actor's film screens and they do its press (`introduceAtFestival`, `systems/representation.ts`),
 * read by the approach as the School's follow-up and a referral are.
 */
export type AgentRoute = 'showcase' | 'referral' | 'festival';

/** A department of an agency: its name, the other name the trade gives it, and the fields it covers. */
export interface Department {
  /** Its id among the agency's other departments (`Agency.otherDepartments`), which an agent in it names. */
  id?: string;
  called: string;
  alsoCalled: string;
  fields: readonly AgentField[];
  /** Its own words for the agency's rule on submissions, where they name its own agent (`policyOf`). */
  policy?: { unsolicited: 'refused'; words: string };
}

export interface Agency {
  id: string;
  name: string;
  /** A real agency's office: the register's sources for what's said of it, and the day this build read them. */
  real?: { sources: readonly string[]; read: string };
  /** The office the agent works in: its city as the game names it, and the gazetteer's id. */
  office: { city: string; cityId: string };
  /** The department its agents work in unless they name another (`Agent.department`). */
  department: Department;
  /** Its other departments (from 2026-10-25, brief 27): the game's own agency's voice-over department. */
  otherDepartments?: readonly Department[];
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

/**
 * How the player's words name an agent (from 2026-10-24, brief 25's Module 3): the game's own agent by his pronouns, and
 * a real one, whose pronouns the pages don't give, by name, with "the office", "the department" and "the list".
 */
export interface AgentWords {
  he: string;
  him: string;
  his: string;
  office: string;
  department: string;
  list: string;
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
  words: AgentWords;
  /** A real agent: the register's source that names the agent, its own words, and the day this build read it. */
  real?: { source: string; words: string; read: string };
  /** The game's assumption of room on the list: the game's own agent only, since a real agent's list isn't known. */
  roster?: RosterAssumption;
  /** The agency's other department the agent works in (`Agency.otherDepartments`), where it isn't the agency's own. */
  department?: string;
}

/** The game's own agent's words: his pronouns. */
const HIS: AgentWords = { he: 'he', him: 'him', his: 'his', office: 'his office', department: 'his department', list: 'his list' };
/** The game's voice-over agent's words: her pronouns (from 2026-10-25, brief 27). */
const HERS: AgentWords = { he: 'she', him: 'her', his: 'her', office: 'her office', department: 'her department', list: 'her list' };

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
    // From 2026-10-25 (brief 27): its voice-over department, the game's own, which takes no unsolicited submissions either.
    otherDepartments: [{
      id: 'voice', called: 'Voice-Over', alsoCalled: 'Voice', fields: ['voice'],
      policy: { unsolicited: 'refused', words: 'Her office takes no submissions it hasn’t asked for.' },
    }],
  },
  {
    id: 'stewart-talent-new-york',
    name: 'Stewart Talent',
    real: { sources: ['N05', 'N09', 'N11', 'S101'], read: '2026-10-24' },
    office: { city: 'New York', cityId: 'us-ny-newyork' },
    department: {
      // Its agents' role on the page is "Theatrical Agent", and its submissions line names the department "Legit" (N05);
      // the office's own section covers "film/tv/theatre" (N11), which the game reads as its six fields.
      called: 'Theatrical', alsoCalled: 'Legit',
      fields: ['television', 'film', 'broadway', 'off-broadway', 'national-tour', 'regional'],
    },
    policy: { unsolicited: 'refused', words: 'The office takes no unsolicited submissions, as its page says: “We do not accept unsolicited submissions at this time.”' },
  },
];

/** A real New York theatrical agent at Stewart Talent, from the office's page (N05) as this build read it. */
function stewart(id: string, name: string): Agent {
  return {
    id, name, agencyId: 'stewart-talent-new-york', role: 'Theatrical Agent', routes: ['referral'],
    words: { he: name, him: name, his: `${name}’s`, office: 'the office', department: 'the department', list: 'the list' },
    real: { source: 'N05', words: `${name} Theatrical Agent`, read: '2026-10-24' },
    notice: `${name} is a theatrical agent at Stewart Talent’s New York office, named on the office’s own page when the game read it on October 24, 2026. Whatever happens between you here is the game’s invention: nothing reaches the real office, and the real ${name} knows nothing of you. The office takes no unsolicited submissions, so in the game it sees your materials only through a referral from someone you’ve worked with.`,
  };
}

export const AGENTS: readonly Agent[] = [
  {
    id: 'thomas-ashgrove',
    name: 'Thomas Ashgrove',
    agencyId: 'halberd-talent',
    role: 'Agent, Legit Department',
    // An introduction at a festival from 2026-10-25 (brief 27): the game's own agent only, since saying a real agent was at a
    // festival would put the game's events on a real person.
    routes: ['showcase', 'referral', 'festival'],
    words: HIS,
    notice: 'Thomas Ashgrove and Halberd Talent are invented for the game. His office takes no submissions it hasn’t asked for: it sees your materials through the School’s follow-up after the showcase, a referral from someone you’ve worked with or an introduction at a festival where your film screens. He never gets in touch first.',
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
  {
    // From 2026-10-25 (brief 27): the game's voice-over agent, in Halberd Talent's voice-over department.
    id: 'celia-brannock',
    name: 'Celia Brannock',
    agencyId: 'halberd-talent',
    department: 'voice',
    role: 'Agent, Voice-Over Department',
    routes: ['referral'],
    words: HERS,
    notice: 'Celia Brannock and Halberd Talent are invented for the game. She’s an agent in its voice-over department, for animation, dubbing and narration. Her office takes no submissions it hasn’t asked for: it hears your voice demo only through a referral from someone you’ve worked with. She never gets in touch first.',
    roster: {
      basis: 'assumption',
      // ASSUMPTION, the game's: types a voice-over list might take on, by billing and playing age; voice casts wider ages.
      types: [
        { billing: 'lead', ages: [20, 45] },
        { billing: 'supporting', ages: [20, 60] },
        { billing: 'featured', ages: [18, 60] },
      ],
      // ASSUMPTION: a voice-over list takes on one to three new actors a year, as the legit list does.
      openingsPerYear: [1, 3],
      words: 'How many new actors her list takes on in a year, and of which types, is assumed in the game.',
    },
  },
  stewart('dan-patack', 'Dan Patack'),
  stewart('jay-schachter', 'Jay Schachter'),
  stewart('rachel-grandizio', 'Rachel Grandizio'),
  stewart('tim-marshall', 'Tim Marshall'),
];

/** An agent's id, as `AGENTS` gives it (`thomas-ashgrove`). */
export type AgentId = string;

export const agentById = (id: string): Agent | undefined => AGENTS.find((a) => a.id === id);
export const agencyById = (id: string): Agency | undefined => AGENCIES.find((a) => a.id === id);
/** The agency an agent works at. Every agent's is in `AGENCIES`. */
export const agencyOf = (agent: Agent): Agency => agencyById(agent.agencyId)!;
/** The department an agent works in: the agency's other one the agent names, or the agency's own (from 2026-10-25). */
export const departmentOf = (agent: Agent): Department => agencyOf(agent).otherDepartments?.find((d) => d.id === agent.department) ?? agencyOf(agent).department;
/** The rule on submissions in an agent's own words: the department's, where it has its own, or the agency's. */
export const policyOf = (agent: Agent): Agency['policy'] => departmentOf(agent).policy ?? agencyOf(agent).policy;
/** Whether an agent's agency has a department for a field, the agent's own or another (from 2026-10-25, brief 27). */
export const agencyCovers = (agent: Agent, field: AgentField): boolean =>
  [agencyOf(agent).department, ...(agencyOf(agent).otherDepartments ?? [])].some((d) => d.fields.includes(field));
