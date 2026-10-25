/**
 * SLATE — the Career screen's Productions And People tab (from 2026-10-25, the owner's brief 27, K8, Part 16 and loop 48):
 * the industry reference, read from the record as it's drawn (`systems/reference.ts`).
 *
 * The front page lists your own work first, then the series, the real productions the game read, the companies and
 * agencies, and the people, with Find over all of them. A page tags every fact Verified, Not Given, Simulated or Yours, and
 * its links open the page they name. The trail of pages followed is kept while the player is elsewhere (`ui/kept.ts`), so
 * an action that opens another tab, and the tab bar back, return to the same page with the same trail. Not saved with the
 * game: where the player was reading, not anything in the world. Nothing here runs a command: an action opens the tab
 * where the player can act.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine } from '@/ui/components/primitives';
import { useFeature } from '@/ui/guide/Guide';
import { keep, useKept } from '@/ui/kept';
import { tabKey } from '@/ui/shell/sections';
import { KNOWN_LABEL, pageOf, refFind, refId, refIndex, type Known, type RefEntry, type RefFact, type RefKey } from '@/engine/systems/reference';

/** Where the trail of pages is kept, and the front page's Find. */
export const STACK_KEY = 'reference:trail';
const FIND_KEY = 'reference:find';

/** Open a page of Productions And People from anywhere: the Career screen turns to the tab, the page on a new trail. */
export function openReference(key: RefKey): void {
  keep(STACK_KEY, [key]);
  keep(tabKey('/workspace/career'), 'reference');
}

const CHIP: Readonly<Record<Known, string>> = { verified: 'chip chip-positive', 'not-given': 'chip', simulated: 'chip chip-accent', yours: 'chip chip-info' };
const Tag = ({ known }: { known: Known }) => <span className={CHIP[known]}>{KNOWN_LABEL[known]}</span>;

/** How many of a long list show before Show All. */
const SHORT = 12;

export function ReferencePane() {
  const [trail, setTrail] = useKept<RefKey[]>(STACK_KEY, []);
  // Opened by the guide's chapter on the Career screen, as the tab's other controls are.
  const gate = useFeature('ui.career-reference');
  const open = (key: RefKey) => setTrail((t) => [...t, key]);
  if (!gate.open) {
    return (
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>{gate.reason}</p>
        <div><button type="button" className="btn btn-sm" onClick={gate.ask}>Open The Guide</button></div>
      </div>
    );
  }
  return trail.length ? <PageView trail={trail} setTrail={setTrail} open={open} /> : <FrontPage open={open} />;
}

function FrontPage({ open }: { open: (k: RefKey) => void }) {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const [find, setFind] = useKept<string>(FIND_KEY, '');
  const found = refFind(sim, person, find);
  return (
    <div className="col gap-5">
      <p className="small" style={{ margin: 0 }}>The productions, companies and people your career touches: real ones as their official pages had them when the game read them, the game’s own marked as simulated, and your part in each. It holds only these, never everything another listing has.</p>
      <div className="row gap-2 wrap">
        <label className="small" htmlFor="reference-find">Find</label>
        <input id="reference-find" type="search" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Type a title or a name" />
        {find.trim() && <span className="xs dim">{found.length === 1 ? 'One found' : `${found.length} found`}</span>}
      </div>
      {find.trim()
        ? <Panel title="Found" help="career.reference"><Entries id="found" entries={found} open={open} empty="Nothing here by that name." /></Panel>
        : refIndex(sim, person).map((g) => (
          <Panel key={g.title} title={g.title} help="career.reference">
            <Entries id={g.title} entries={g.entries} open={open} empty={g.title === 'Your Work' ? 'No project has reached you yet. A part posted to you, booked or credited shows here.' : 'None yet.'} />
          </Panel>
        ))}
      <Fine>A real production’s, company’s, agency’s or person’s facts are what its own pages said on the day the game read them, each one tagged Verified, or Not Given where no page said. A published chart’s week is the provider’s figure. Every project, company, casting office and series invented for the game is tagged Simulated, and so is what its clock has done with them: a season’s audience, a film’s run in the game’s own chart, a network’s word. A part shows only once it’s been posted to you.</Fine>
    </div>
  );
}

function Entries({ id, entries, open, empty }: { id: string; entries: readonly RefEntry[]; open: (k: RefKey) => void; empty: string }) {
  const [all, setAll] = useKept<boolean>(`reference:all:${id}`, false);
  if (!entries.length) return <p className="small" style={{ margin: 0 }}>{empty}</p>;
  const shown = all ? entries : entries.slice(0, SHORT);
  return (
    <div className="col gap-2">
      <ul className="small col gap-1" style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {shown.map((e) => (
          <li key={refId(e.key)}>
            <button type="button" className="link" onClick={() => open(e.key)}>{e.words}</button>
            {` ${e.note}. `}<Tag known={e.known} />
          </li>
        ))}
      </ul>
      {entries.length > SHORT && <div><button type="button" className="btn btn-sm btn-ghost" onClick={() => setAll(!all)}>{all ? 'Show Fewer' : `Show All ${entries.length}`}</button></div>}
    </div>
  );
}

function PageView({ trail, setTrail, open }: { trail: RefKey[]; setTrail: (t: RefKey[]) => void; open: (k: RefKey) => void }) {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const key = trail[trail.length - 1]!;
  const page = pageOf(sim, person, key);
  const titles = trail.map((k) => pageOf(sim, person, k)?.title ?? 'A Page');
  return (
    <div className="col gap-5">
      <nav aria-label="Pages followed" className="row gap-2 wrap small">
        <button type="button" className="btn btn-sm" onClick={() => setTrail(trail.slice(0, -1))}>Back</button>
        <button type="button" className="link" onClick={() => setTrail([])}>Productions And People</button>
        {titles.map((t, i) => (
          <span key={`${refId(trail[i]!)}:${i}`}>
            {' › '}
            {i < titles.length - 1 ? <button type="button" className="link" onClick={() => setTrail(trail.slice(0, i + 1))}>{t}</button> : <span aria-current="page">{t}</span>}
          </span>
        ))}
      </nav>
      {page ? (
        <>
          <div className="col gap-2">
            <h2 style={{ margin: 0 }}>{page.title} <Tag known={page.known} /></h2>
            <p className="small" style={{ margin: 0 }}>{page.what}</p>
          </div>
          {page.actions.length > 0 && (
            <Panel title="What You Can Do" help="career.reference">
              <ul className="small col gap-2" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {page.actions.map((a) => (
                  <li key={a.tab}>
                    {`${a.words} `}
                    <button type="button" className="btn btn-sm" onClick={() => keep(tabKey('/workspace/career'), a.tab)}>{a.label}</button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {page.sections.map((s) => (
            <Panel key={s.title} title={s.title} help="career.reference">
              <dl className="col gap-2 small" style={{ margin: 0 }}>
                {s.facts.map((f, i) => <Fact key={`${f.label}:${i}`} f={f} open={open} />)}
              </dl>
            </Panel>
          ))}
        </>
      ) : <p className="small" style={{ margin: 0 }}>This page isn’t in your records now. Press Back, or start again from Productions And People.</p>}
    </div>
  );
}

function Fact({ f, open }: { f: RefFact; open: (k: RefKey) => void }) {
  return (
    <div>
      <dt className="strong">{f.label} <Tag known={f.known} /></dt>
      <dd style={{ margin: 0 }}>{f.to ? <button type="button" className="link" onClick={() => open(f.to!)}>{f.words}</button> : f.words}</dd>
    </div>
  );
}
