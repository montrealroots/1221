/**
 * SLATE — What is pending at the real companies, and how it can go.
 *
 * Each event is something on the public record as of the save's start: a sale
 * awaiting a court, a buyout under way, a restructuring, a closure announced.
 * The record says what is pending; it does not say how it ends. SLATE rolls
 * the outcome inside the save, on a date inside the window, and everything
 * that follows is the save's own simulation, labelled as such. An event whose
 * outcome the record already fixes (a purchase that completed on a stated
 * day) fires on that day with one outcome.
 *
 * Nothing here is invented about the present: every `record` line is the same
 * text the studio and network registries carry, verified there.
 */

import type { StudioStrategy } from '../domain/model';

export interface CorporateOutcome {
  id: string;
  label: string;
  /** Share of the roll. The outcomes of one event sum to 1. */
  chance: number;
  effects: {
    parent?: string;
    ownership?: string;
    /** Replaces the status line shown for the company; empty string clears it. */
    status?: string;
    closing?: boolean;
    slateMultiplier?: number;
    confidence?: number;
    /** Multiplier on the player's standing: a new regime does not know you. */
    standingMultiplier?: number;
    strategy?: StudioStrategy;
    /** Seats that change hands. A named successor is a real person already in the registry; none means SLATE fills the seat. */
    leaves?: { name: string; successor?: string; successorTitle?: string }[];
  };
  note: string;
}

export interface CorporateEvent {
  id: string;
  subjectKind: 'studio' | 'network';
  subjectId: string;
  label: string;
  /** What the record says is pending. */
  record: string;
  /** The window in which it resolves, as dates. Equal dates mean a fixed day. */
  from: string;
  to: string;
  outcomes: CorporateOutcome[];
}

export const CORPORATE_EVENTS: readonly CorporateEvent[] = [
  {
    id: 'alcon-village-roadshow', subjectKind: 'studio', subjectId: 'alcon', label: 'Alcon Completes The Village Roadshow Purchase',
    record: 'Bought the Village Roadshow Pictures studio and its 108-film library out of bankruptcy, effective May 1, 2026.',
    from: '2026-05-01', to: '2026-05-01',
    outcomes: [
      { id: 'completed', label: 'Completed On The Day', chance: 1, effects: { slateMultiplier: 1.2, confidence: 10, status: 'Owns the Village Roadshow Pictures studio and its 108-film library, bought out of bankruptcy on May 1, 2026.' }, note: 'The purchase closed as announced. A bigger library and a bigger slate to feed.' },
    ],
  },
  {
    id: 'annapurna-cuts', subjectKind: 'studio', subjectId: 'annapurna', label: 'Annapurna Cuts Jobs',
    record: 'Cut about thirty jobs in August 2026 while its film heads were newly installed.',
    from: '2026-08-14', to: '2026-08-14',
    outcomes: [
      { id: 'cuts', label: 'The Cuts Land', chance: 1, effects: { strategy: 'cost_cutting', slateMultiplier: 0.8, confidence: -10 }, note: 'About thirty jobs went. The new film heads have a smaller shop and a shorter leash.' },
    ],
  },
  {
    id: 'pathe-buyout', subjectKind: 'studio', subjectId: 'pathe', label: 'The Seydoux Buyout Of Pathé',
    record: 'The family is buying out the remaining public shareholders in 2026.',
    from: '2026-06-01', to: '2026-12-31',
    outcomes: [
      { id: 'completed', label: 'Taken Private', chance: 0.9, effects: { ownership: 'Privately held by the Seydoux family after buying out the public shareholders', status: '' }, note: 'The family bought out the last public shareholders. Pathé answers to nobody else now.' },
      { id: 'slipped', label: 'Slipped Into Next Year', chance: 0.1, effects: { status: 'The buyout of the remaining public shareholders slipped into 2027.' }, note: 'The buyout is still on, but the paperwork ran past the year.' },
    ],
  },
  {
    id: 'huayi-restructuring', subjectKind: 'studio', subjectId: 'huayi', label: 'Huayi Brothers Restructuring',
    record: 'A creditor petitioned for restructuring in April 2026. Treat it as distressed.',
    from: '2026-09-01', to: '2027-06-30',
    outcomes: [
      { id: 'restructured', label: 'Restructured Under Its Creditors', chance: 0.55, effects: { slateMultiplier: 0.6, confidence: -15, strategy: 'cost_cutting', status: 'Restructured under its creditors; a smaller slate and a shorter horizon.' }, note: 'The creditors took a smaller, slower Huayi over none at all.' },
      { id: 'wound_down', label: 'Wound Down', chance: 0.45, effects: { closing: true, slateMultiplier: 0, confidence: -40, status: 'Wound down after the restructuring failed. Its library is being sold; it makes nothing new.' }, note: 'The restructuring failed. The library goes to the highest bidder and the name stops making films.' },
    ],
  },
  {
    id: 'wbd-paramount-trial', subjectKind: 'studio', subjectId: 'warner', label: 'The Paramount Skydance Sale Goes To Trial',
    record: 'Sale to Paramount Skydance approved by shareholders and regulators, then blocked by a federal court pending a trial in 2027.',
    from: '2027-02-01', to: '2027-10-31',
    outcomes: [
      { id: 'cleared', label: 'The Court Clears The Sale', chance: 0.5, effects: { parent: 'Paramount Skydance Corporation', status: 'Sold to Paramount Skydance after the court cleared the deal. Two majors under one roof, and a slate being cut down to size.', slateMultiplier: 0.85, standingMultiplier: 0.8, confidence: -10, strategy: 'cost_cutting', leaves: [{ name: 'David Zaslav', successor: 'David Ellison', successorTitle: 'Chairman And Chief Executive Officer, Paramount Skydance' }] }, note: 'The court cleared it. Warner Bros. belongs to Paramount Skydance, David Ellison runs both, and everyone who knew you at Warner is looking over their shoulder.' },
      { id: 'blocked', label: 'The Court Blocks The Sale', chance: 0.5, effects: { status: 'The court blocked the sale to Paramount Skydance for good. Warner Bros. Discovery stays on its own.', confidence: 5 }, note: 'The court blocked it. Warner Bros. Discovery stays independent and gets on with the slate.' },
    ],
  },
  {
    id: 'fox-roku', subjectKind: 'network', subjectId: 'roku-channel', label: 'Fox Buys Roku',
    record: 'Fox Corporation agreed to acquire Roku in 2026.',
    from: '2026-07-01', to: '2026-12-31',
    outcomes: [
      { id: 'closed', label: 'The Acquisition Closes', chance: 0.85, effects: { parent: 'Fox Corporation', status: 'Owned by Fox Corporation since the 2026 acquisition closed.' }, note: 'Fox closed on Roku. The Roku Channel is a Fox service now, Tubi beside it.' },
      { id: 'collapsed', label: 'The Deal Falls Through', chance: 0.15, effects: { status: 'Fox\'s agreed acquisition did not close. Roku stays independent.' }, note: 'The deal fell through. Roku stays on its own.' },
    ],
  },
  {
    id: 'sky-itv', subjectKind: 'network', subjectId: 'itv', label: 'Sky Takes Over ITV\'s Channels',
    record: 'Sky agreed in July 2026 to take over ITV\'s channels and ITVX; ITV Studios would continue on its own.',
    from: '2027-01-01', to: '2027-09-30',
    outcomes: [
      { id: 'completed', label: 'The Takeover Completes', chance: 0.8, effects: { parent: 'Sky, part of Comcast', status: 'ITV\'s channels and ITVX belong to Sky. ITV Studios continues on its own.' }, note: 'Sky completed the takeover. ITV1 answers to Sky; ITV Studios sells to everyone.' },
      { id: 'blocked', label: 'The Takeover Is Blocked', chance: 0.2, effects: { status: 'The takeover by Sky was blocked. ITV keeps its channels.' }, note: 'The regulator blocked it. ITV keeps its channels and its independence.' },
    ],
  },
  {
    id: 'showmax-wind-down', subjectKind: 'network', subjectId: 'showmax', label: 'Showmax Is Wound Down',
    record: 'Canal+ said in 2026 that Showmax was not a commercial success and would be wound down; treat it as closing.',
    from: '2026-10-01', to: '2027-03-31',
    outcomes: [
      { id: 'closed', label: 'Closed', chance: 1, effects: { closing: true, status: 'Wound down by Canal+. It commissions nothing.' }, note: 'Canal+ closed Showmax. Its originals scatter to other services.' },
    ],
  },
];

export function corporateEvent(id: string): CorporateEvent | undefined {
  return CORPORATE_EVENTS.find((e) => e.id === id);
}
