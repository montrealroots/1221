/**
 * SLATE — the way into the guide's reference, for anything on screen (from 2026-10-12; `ui/guide/Help.tsx`).
 *
 * Kept apart from the dialog so a panel can offer How This Works without importing the dialog, which imports the
 * panel's own primitives.
 */

import { createContext, useContext } from 'react';

export interface HelpApi {
  /** Opens the reference at an entry, by its id or a feature it covers, or at the contents. */
  open: (id?: string) => void;
  /** Opens the reference's search, with words already in it if given. */
  find: (words?: string) => void;
}

export const HelpContext = createContext<HelpApi>({ open: () => {}, find: () => {} });

export const useHelp = (): HelpApi => useContext(HelpContext);
