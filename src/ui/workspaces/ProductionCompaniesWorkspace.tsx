/**
 * SLATE — the companies that make the work.
 *
 * A reference page. Nothing here is a decision the player makes yet: it is who
 * exists, who owns whom, and who is in the chair, so that when a part comes
 * from one of these the name already means something.
 *
 * The face of a card carries the company and how it is owned, and nothing
 * else. The people are inside it. Fourteen names on a card is not a card, it
 * is a wall, and the eight of them side by side never lined up: every company
 * has a different number of executives, so every card ran to a different
 * length and the row went ragged. One line each on the outside, everything on
 * the inside, and the grid holds its shape at any width.
 */

import { useState, type ReactNode } from 'react';
import { Modal, Stat } from '@/ui/components/primitives';
import { plural } from '@/engine/core/text';
import {
  AGREEMENT_LABEL, BUDGET_LABEL, CHECKED_ON, CHURN_NOTE, FORMAT_LABEL, NEW_FACES_LABEL,
  NEW_FACES_NOTE, OWNERSHIP_LABEL, SCALE_NOTE, STUDIO_NOTE, UNION_NOTE, VOLUME_LABEL,
  VOLUME_NOTE, agreementsFor, citiesFor, genresOf, ownershipDetail, scaleFloor,
  shootsWhere, studiosInTier, volumeOf,
  type Studio, type StudioFigure,
} from '@/engine/content/studios';
import { useGame } from '@/app/game-context';

export function ProductionCompaniesWorkspace() {
  const [open, setOpen] = useState<Studio | null>(null);
  const majors = studiosInTier('major');
  const labels = studiosInTier('label');

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Production Companies</div>
        <h1>The companies that make the work.</h1>
        <p className="muted">{STUDIO_NOTE}</p>
      </div>

      <Shelf title="The Majors" note="The eight that make at scale." studios={majors} onOpen={setOpen} />
      <Shelf title="The Labels" note="Smaller rooms, and the ones with a house style." studios={labels} onOpen={setOpen} />

      <p className="xs dim" style={{ marginTop: 'var(--s6)' }}>
        Checked {CHECKED_ON}. {CHURN_NOTE}
      </p>

      {open && <StudioDetail studio={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Shelf({
  title, note, studios, onOpen,
}: {
  title: string;
  note: string;
  studios: readonly Studio[];
  onOpen: (studio: Studio) => void;
}) {
  return (
    <section style={{ marginBottom: 'var(--s6)' }}>
      <div style={{ marginBottom: 'var(--s3)' }}>
        <div className="row gap-2">
          <span className="eyebrow">{title}</span>
          <span className="chip">{studios.length}</span>
        </div>
        <p className="xs dim" style={{ margin: '2px 0 0' }}>{note}</p>
      </div>
      <div className="studio-grid">
        {studios.map((one) => <StudioCard key={one.id} studio={one} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

/** Tone carries no meaning on its own here; the chip says the words as well. */
const FACES_TONE: Record<Studio['newFaces'], string> = {
  discovers: 'chip-positive',
  open: 'chip-info',
  guarded: 'chip-warning',
};

function StudioCard({ studio, onOpen }: { studio: Studio; onOpen: (studio: Studio) => void }) {
  const detail = ownershipDetail(studio);

  return (
    <button className="card studio" onClick={() => onOpen(studio)}>
      <h2 className="studio-name">{studio.name}</h2>

      <div className="studio-owner">
        <span className="chip">{OWNERSHIP_LABEL[studio.ownership]}</span>
        <span className="xs dim">{detail ?? ''}</span>
        <span className={`chip ${FACES_TONE[studio.newFaces]}`}>{NEW_FACES_LABEL[studio.newFaces]}</span>
      </div>

      <p className="small muted studio-about">{studio.about}</p>

      <div className="studio-foot xs dim">
        <span>About {studio.titlesAYear} A Year</span>
        <span>{plural(studio.worksIn.length, 'Genre')}</span>
        <span>{plural(studio.shootsIn.length, 'City', 'Cities')}</span>
      </div>
    </button>
  );
}

function StudioDetail({ studio, onClose }: { studio: Studio; onClose: () => void }) {
  const { sim } = useGame();
  const here = sim.player.currentLocationId;
  const scale = scaleFloor(studio);
  return (
    <Modal title={studio.name} onClose={onClose}>
      <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
        {/* The ticker, not ownershipDetail: on a subsidiary that would repeat
            the parent company, which is already the stat beside it. */}
        <Stat label="Ownership" value={OWNERSHIP_LABEL[studio.ownership]} note={studio.ticker} />
        <Stat
          label="Parent Company"
          value={studio.parent ?? 'None'}
          note={studio.parent ? undefined : 'It answers to nobody above it.'}
        />
      </div>

      <p className="small muted">{studio.about}</p>
      {studio.control && <p className="small muted">{studio.control}</p>}

      <Block label="What It Makes">
        <p className="small" style={{ margin: '0 0 var(--s2)' }}>{studio.specialty}</p>
        <div className="chip-row">
          {studio.formats.map((format) => (
            <span key={format} className="chip chip-accent">{FORMAT_LABEL[format]}</span>
          ))}
        </div>
      </Block>

      <Block label="At What Size">
        <div className="chip-row" style={{ marginBottom: 'var(--s2)' }}>
          {studio.budgets.map((band) => (
            <span key={band} className="chip">{BUDGET_LABEL[band]}</span>
          ))}
        </div>
        <p className="xs dim" style={{ margin: 0 }}>
          About {studio.titlesAYear} scripted titles a year. {VOLUME_LABEL[volumeOf(studio)]} output:{' '}
          {VOLUME_NOTE[volumeOf(studio)]}
        </p>
      </Block>

      <Block label="Works In">
        <div className="chip-row">
          {genresOf(studio).map((genre) => (
            <span key={genre.id} className="chip">{genre.label}</span>
          ))}
        </div>
      </Block>

      {studio.labels.length > 0 && (
        <Block label="Produces Under">
          <div className="chip-row">
            {studio.labels.map((label) => <span key={label} className="chip">{label}</span>)}
          </div>
        </Block>
      )}

      <Block label="Who Runs It">
        <Figures people={studio.figures} />
      </Block>

      {studio.casting && studio.casting.length > 0 && (
        <Block label="Casting">
          <Figures people={studio.casting} />
        </Block>
      )}

      <Block label="Known For">
        <div className="chip-row">
          {studio.knownFor.map((title) => <span key={title} className="chip">{title}</span>)}
        </div>
      </Block>

      <Block label="Getting In">
        <div className="chip-row" style={{ marginBottom: 'var(--s2)' }}>
          <span className={`chip ${FACES_TONE[studio.newFaces]}`}>{NEW_FACES_LABEL[studio.newFaces]}</span>
        </div>
        <p className="small" style={{ margin: 0 }}>{NEW_FACES_NOTE[studio.newFaces]}</p>
      </Block>

      <Block label="Where It Shoots">
        <div className="chip-row">
          {citiesFor(studio).map((city) => (
            <span
              key={city.id}
              className={shootsWhere(studio, here) && city.id === here ? 'chip chip-accent' : 'chip'}
            >
              {city.name}{city.id === here ? ' · you are here' : ''}
            </span>
          ))}
        </div>
      </Block>

      <Block label="What Scale Pays">
        {/* Three across in the dialog, stacking on a phone. grid-3's 200px
            floor put two on one row and the third alone under them. */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))',
            marginBottom: 'var(--s2)',
          }}
        >
          <Stat label="Background" value={money(scale.background)} note="A day as an extra" />
          <Stat label="Day Performer" value={money(scale.day)} note="A day with lines" />
          <Stat label="Weekly" value={money(scale.week)} note="A week on the call sheet" />
        </div>
        <div className="chip-row" style={{ marginBottom: 'var(--s2)' }}>
          {agreementsFor(studio).map((one) => (
            <span key={one} className="chip">{AGREEMENT_LABEL[one]}</span>
          ))}
        </div>
        <p className="xs dim" style={{ margin: 0 }}>{UNION_NOTE} {SCALE_NOTE}</p>
      </Block>
    </Modal>
  );
}

/** Whole dollars. Scale is quoted to the dollar and never to the cent. */
function money(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 'var(--s4)' }}>
      <div className="stat-label" style={{ marginBottom: 'var(--s2)' }}>{label}</div>
      {children}
    </div>
  );
}

/**
 * A name and what they do, in two columns rather than run together on one
 * line. Eleven of these one after another only reads if the names line up.
 */
function Figures({ people }: { people: readonly StudioFigure[] }) {
  return (
    <div className="figure-rows">
      {people.map((one) => (
        <div key={one.name} className="figure-row">
          <span className="small strong">{one.name}</span>
          <span className="small dim">{one.role}</span>
        </div>
      ))}
    </div>
  );
}
