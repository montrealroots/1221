/**
 * SLATE — the sections inside a screen, its tabs, said once (from 2026-10-08).
 *
 * The screen draws its tabs from here and the rail lists the same ones under
 * the screen when it's open, so the two can't name a section differently.
 * Which tab is showing is kept by `tabKey`, so the rail can open a screen at
 * a section and the screen keeps its tab while the player is elsewhere.
 */

export interface Section { id: string; label: string }

export const SECTIONS: Readonly<Record<string, readonly Section[]>> = {
  '/workspace/career': [
    { id: 'agency', label: 'Representation' }, { id: 'auditions', label: 'Auditions' }, { id: 'work', label: 'Work' },
    { id: 'unions', label: 'Unions And Pay' }, { id: 'home', label: 'Where You Live' },
  ],
  '/workspace/school': [
    { id: 'standing', label: 'Standing And Craft' }, { id: 'classes', label: 'Classes' }, { id: 'coursework', label: 'Coursework' },
    { id: 'casting', label: 'Casting' }, { id: 'work', label: 'Shifts And Pay' }, { id: 'terms', label: 'Terms And Award' },
  ],
  '/workspace/industry': [
    { id: 'find', label: 'Find' }, { id: 'projects', label: 'This Save’s Projects' }, { id: 'companies', label: 'Companies' },
    { id: 'releases', label: 'Releases' }, { id: 'awards', label: 'Awards' }, { id: 'charts', label: 'Charts' }, { id: 'lists', label: 'Your Lists' },
  ],
  '/workspace/bank': [
    { id: 'accounts', label: 'Accounts' }, { id: 'cards', label: 'Cards' }, { id: 'payments', label: 'Payments And Cash' },
    { id: 'borrowing', label: 'Borrowing' }, { id: 'statements', label: 'Statements' },
  ],
  '/workspace/homes': [{ id: 'sale', label: 'For Sale' }, { id: 'yours', label: 'Your Homes' }],
  '/workspace/papers': [
    { id: 'returns', label: 'Tax Returns' }, { id: 'health', label: 'Health Cover' }, { id: 'benefits', label: 'Unemployment' },
    { id: 'passport', label: 'Passport And Travel' }, { id: 'work', label: 'Permission To Work' }, { id: 'driving', label: 'Driving' },
  ],
};

/** Where a screen's showing tab is kept (`ui/kept.ts`). */
export const tabKey = (route: string) => `tab:${route}`;
