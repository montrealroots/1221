/**
 * SLATE — the trade press.
 *
 * Two things on one screen, and the line between them is stated on every page.
 *
 * The publications are real. Who owns them, when they started, where they are
 * published, what they cover and their masthead all come from the public
 * record, and the licence on every mark is recorded beside the file.
 *
 * The stories are not. Every piece here was written by SLATE, in the register
 * that outlet writes in, about films that do not exist. No real publication
 * wrote any of it, and nothing in it is a claim about anything real.
 *
 * The type is the third thing. Where a publication's own face is a matter of
 * record it is named; what is actually rendered is a freely licensed face
 * chosen to sit in the same part of the type spectrum, because the real ones
 * are proprietary and SLATE has no licence to them.
 */

import { useEffect, useMemo, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Tabs, Modal, Logo, Stat } from '@/ui/components/primitives';
import { titleCaseLabel } from '@/engine/core/text';
import { formatDate } from '@/engine/core/time';
import { COUNTRIES } from '@/engine/content/geography';
import {
  BEAT_LABEL, CADENCE_LABEL, OUTLETS, OUTLET_KIND_LABEL, PAYWALL_LABEL, REGISTER_LABEL,
  type Outlet,
} from '@/engine/content/press';
import { fontStylesheetHref, typeFor } from '@/engine/content/press-type';
import { STORY_KIND_LABEL, type StoryKind } from '@/engine/content/press-story';
import { frontPage, outletActivity, pressFromOutlet } from '@/engine/systems/press';
import type { PressItem } from '@/engine/domain/model';

/**
 * Loads the faces the press is set in, once, when the tab is first opened.
 *
 * Ten families is a real download and most players never look at this screen,
 * so it is not in the bundle's critical path. If the request is blocked the
 * page still renders — every stack has a real fallback behind it.
 */
function useMastheadFonts(): void {
  useEffect(() => {
    const id = 'slate-press-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = fontStylesheetHref();
    document.head.appendChild(link);
  }, []);
}

/** One piece, set the way that publication sets things. */
function Piece({ item, onOutlet }: { item: PressItem; onOutlet: (id: string) => void }) {
  const { sim } = useGame();
  const { style } = typeFor(item.outletId);
  const outlet = OUTLETS.get(item.outletId);
  return (
    <article className="list-item list-static" style={{ display: 'block', padding: 'var(--s4)' }}>
      <div className="row-between wrap gap-2" style={{ marginBottom: 6 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onOutlet(item.outletId)}
          style={{ padding: 0, fontFamily: style.bodyStack, fontWeight: 600 }}
        >
          {item.outletName}
        </button>
        <span className="xs dim">
          {STORY_KIND_LABEL[item.kind as StoryKind] ?? titleCaseLabel(item.kind)}
          {' · '}{formatDate(item.at, sim.homeZone)}
          {outlet && ` · ${outlet.city}`}
        </span>
      </div>
      <h3
        style={{
          fontFamily: style.headlineStack,
          fontWeight: style.headlineWeight,
          letterSpacing: style.headlineTracking,
          fontSize: 'var(--size-lg)',
          lineHeight: 1.2,
          margin: '0 0 6px',
        }}
      >
        {item.headline}
      </h3>
      <p className="small muted" style={{ fontFamily: style.bodyStack, margin: '0 0 10px', fontStyle: 'italic' }}>
        {item.standfirst}
      </p>
      {item.paragraphs.map((paragraph, i) => (
        <p
          key={i}
          className="small"
          style={{ fontFamily: style.bodyStack, margin: '0 0 8px', lineHeight: 1.55, maxWidth: '68ch' }}
        >
          {paragraph}
        </p>
      ))}
    </article>
  );
}

/** Everything the press has run in this save. */
export function PressTab() {
  useMastheadFonts();
  const [openOutlet, setOpenOutlet] = useState<string | null>(null);
  const [view, setView] = useState<'front' | 'outlets'>('front');
  const [desk, setDesk] = useState<string>('all');
  const [shown, setShown] = useState(20);

  const page = useWorld((s) => frontPage(s, 400));
  const activity = useWorld(outletActivity);
  const items = useMemo(
    () => page.filter((item) => desk === 'all' || item.desk === desk),
    [page, desk],
  );
  const desks = useMemo(() => [...new Set(page.map((item) => item.desk))].sort(), [page]);
  const outlet = openOutlet ? OUTLETS.get(openOutlet) : undefined;

  return (
    <>
      <div className="callout callout-accent" style={{ marginBottom: 'var(--s4)' }}>
        <div className="xs">
          <span className="strong">The publications are real; the stories are not.</span> Who owns each
          outlet, when it started, where it is published and what it covers all come from the public
          record. Everything written here is SLATE&rsquo;s, about films that do not exist, in the
          register that publication writes in. No real publication wrote any of it.
        </div>
      </div>

      <Tabs active={view} onChange={setView} tabs={[
        { id: 'front', label: 'The Front Page', badge: page.length },
        { id: 'outlets', label: 'The Publications', badge: OUTLETS.all().length },
      ]} />

      {view === 'front' && (
        <Panel
          title="What The Trades Are Running"
          subtitle={page.length > 0 ? `${page.length} pieces, newest first` : undefined}
          flush
          actions={desks.length > 1 ? (
            <select className="btn btn-sm" value={desk} onChange={(e) => { setDesk(e.target.value); setShown(20); }} aria-label="Desk">
              <option value="all">Every Desk</option>
              {desks.map((d) => <option key={d} value={d}>{titleCaseLabel(d)}</option>)}
            </select>
          ) : undefined}
        >
          {items.length === 0 ? (
            <Empty
              title="Nothing Written Yet"
              body="The trades fill in as the industry acts: a picture set up, a name attached, a weekend counted. Nothing is published about anything that has not happened in public."
            />
          ) : (
            <div className="list">
              {items.slice(0, shown).map((item) => (
                <Piece key={item.id} item={item} onOutlet={setOpenOutlet} />
              ))}
              {items.length > shown && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShown((n) => n + 20)}>
                  Show More ({items.length - shown} Left)
                </button>
              )}
            </div>
          )}
        </Panel>
      )}

      {view === 'outlets' && (
        <Panel
          title="The Publications"
          subtitle="Everything stated here is the public record. Where a fact was not clear it is absent rather than guessed at."
          flush
        >
          <div className="list">
            {OUTLETS.all().map((entry) => {
              const { style } = typeFor(entry.id);
              const pieces = activity.find((a) => a.outletId === entry.id)?.pieces ?? 0;
              return (
                <button key={entry.id} className="list-item" onClick={() => setOpenOutlet(entry.id)}>
                  <Logo id={entry.id} name={entry.shortName} small />
                  <div className="grow">
                    <div className="small strong" style={{ fontFamily: style.headlineStack, fontWeight: style.headlineWeight }}>
                      {entry.name}
                    </div>
                    <div className="xs dim">
                      {OUTLET_KIND_LABEL[entry.kind]} · {entry.city}
                      {entry.founded ? ` · Since ${entry.founded}` : ''}
                      {entry.owner ? ` · ${entry.owner}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="xs dim">{REGISTER_LABEL[entry.register]}</div>
                    {pieces > 0 && <div className="xs mono">{pieces} Here</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      {outlet && <OutletProfile outlet={outlet} onClose={() => setOpenOutlet(null)} />}
    </>
  );
}

/** One publication: what it is, how it writes, and what it has run here. */
function OutletProfile({ outlet, onClose }: { outlet: Outlet; onClose: () => void }) {
  const { style, realTypeface } = typeFor(outlet.id);
  const ran = useWorld((s) => pressFromOutlet(s, outlet.id));
  const [openPiece, setOpenPiece] = useState<string | null>(null);
  void openPiece;

  return (
    <Modal
      title={outlet.name}
      onClose={onClose}
      wide
      footer={<button className="btn" onClick={onClose}>Close</button>}
    >
      <div className="row wrap gap-4" style={{ alignItems: 'flex-start', marginBottom: 'var(--s4)' }}>
        <Logo id={outlet.id} name={outlet.shortName} large />
        <div className="grow" style={{ minWidth: 220 }}>
          <div
            style={{
              fontFamily: style.headlineStack, fontWeight: style.headlineWeight,
              letterSpacing: style.headlineTracking, fontSize: 26, lineHeight: 1.1, marginBottom: 6,
            }}
          >
            {outlet.name}
          </div>
          <p className="small" style={{ fontFamily: style.bodyStack, margin: 0, lineHeight: 1.55 }}>
            {outlet.about}
          </p>
        </div>
      </div>

      <div className="grid grid-4 gap-4" style={{ marginBottom: 'var(--s4)' }}>
        <Stat label="Kind" value={OUTLET_KIND_LABEL[outlet.kind]} />
        <Stat label="Published" value={CADENCE_LABEL[outlet.cadence]} note={outlet.city} />
        <Stat label="Founded" value={outlet.founded ?? '—'} note={outlet.founded ? undefined : 'not clear on the record'} />
        <Stat label="Reading" value={PAYWALL_LABEL[outlet.paywall]} />
      </div>

      <div className="grid grid-2 gap-4" style={{ marginBottom: 'var(--s4)' }}>
        <div>
          <div className="xs dim" style={{ marginBottom: 4 }}>What The Record Holds</div>
          {outlet.owner && <div className="xs" style={{ padding: '2px 0' }}><span className="dim">Owned by</span> <span className="strong">{outlet.owner}</span></div>}
          {outlet.foundedBy && <div className="xs" style={{ padding: '2px 0', overflowWrap: 'anywhere' }}><span className="dim">Founded by</span> <span className="strong">{outlet.foundedBy}</span></div>}
          <div className="xs" style={{ padding: '2px 0' }}><span className="dim">Published in</span> <span className="strong">{outlet.city}, {COUNTRIES.get(outlet.countryId)?.name ?? outlet.countryId}</span></div>
          <div className="xs" style={{ padding: '2px 0' }}><span className="dim">Online at</span> <span className="strong">{outlet.site}</span></div>
        </div>
        <div>
          <div className="xs dim" style={{ marginBottom: 4 }}>What It Covers</div>
          <div className="row wrap gap-1">
            {outlet.beats.map((beat) => <span key={beat} className="chip">{BEAT_LABEL[beat]}</span>)}
          </div>
        </div>
      </div>

      <div className="callout" style={{ marginBottom: 'var(--s4)' }}>
        <div className="xs">
          <span className="strong">The type is SLATE&rsquo;s, not theirs.</span>{' '}
          {realTypeface
            ? `${outlet.name} sets its pages in ${realTypeface}. That is a commissioned face SLATE has no licence to and does not ship, so this page is set in ${style.headline} and ${style.body}, which are freely licensed and sit in the same part of the type spectrum.`
            : `SLATE sets this publication in ${style.headline} and ${style.body} — a ${style.label.toLowerCase()} pairing chosen so no two outlets read the same. It is not the face the publication uses.`}
        </div>
      </div>

      <div className="callout" style={{ marginBottom: 'var(--s4)' }}>
        <div className="xs">
          <span className="strong">How it writes here: {REGISTER_LABEL[outlet.register]}.</span> That is
          SLATE&rsquo;s reading of a house style, used to decide how a piece is built — where the news
          goes, how much number is in it, how much opinion. It is not a claim about editorial policy.
        </div>
      </div>

      <div className="xs dim" style={{ marginBottom: 4 }}>
        {ran.length > 0 ? `${ran.length} Piece${ran.length === 1 ? '' : 's'} In Your Save` : 'Nothing In Your Save Yet'}
      </div>
      {ran.length === 0 ? (
        <div className="xs dim">They have not written about anything in your world yet.</div>
      ) : (
        <div className="list" style={{ maxHeight: 340, overflowY: 'auto' }}>
          {ran.slice(0, 20).map((item) => (
            <Piece key={item.id} item={item} onOutlet={() => setOpenPiece(item.id)} />
          ))}
        </div>
      )}
    </Modal>
  );
}
