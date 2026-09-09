/**
 * SLATE — the companies that make the work.
 *
 * A reference page. Nothing here is a decision the player makes yet: it is who
 * exists, who owns whom, and who is in the chair, so that when a part comes
 * from one of these the name already means something.
 */

import {
  CHECKED_ON, CHURN_NOTE, STUDIOS, STUDIO_NOTE, type Studio,
} from '@/engine/content/studios';

export function ProductionCompaniesWorkspace() {
  const majors = STUDIOS.filter((one) => one.tier === 'major');
  const labels = STUDIOS.filter((one) => one.tier === 'label');

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Production Companies</div>
        <h1>The companies that make the work.</h1>
        <p className="muted">{STUDIO_NOTE}</p>
      </div>

      <div className="row-between" style={{ marginBottom: 'var(--s3)' }}>
        <span className="eyebrow">The Majors</span>
        <span className="chip">{majors.length}</span>
      </div>
      <div className="studio-grid">
        {majors.map((one) => <StudioCard key={one.id} studio={one} />)}
      </div>

      <div className="row-between" style={{ margin: 'var(--s6) 0 var(--s3)' }}>
        <span className="eyebrow">The Labels</span>
        <span className="chip">{labels.length}</span>
      </div>
      <div className="studio-grid">
        {labels.map((one) => <StudioCard key={one.id} studio={one} />)}
      </div>

      <p className="xs dim" style={{ marginTop: 'var(--s6)' }}>
        Checked {CHECKED_ON}. {CHURN_NOTE}
      </p>
    </>
  );
}

function StudioCard({ studio }: { studio: Studio }) {
  return (
    <div className="card studio">
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{studio.rank}</div>
          <h2 className="studio-name">{studio.name}</h2>
        </div>
        <span className={studio.independent ? 'chip chip-accent' : 'chip'}>
          {studio.independent ? 'Independent' : 'Owned'}
        </span>
      </div>

      <p className="small muted">{studio.about}</p>

      {studio.parent && (
        <div className="stat">
          <span className="stat-label">Owned By</span>
          <span className="small">{studio.parent}</span>
        </div>
      )}

      {studio.labels.length > 0 && (
        <div>
          <div className="stat-label" style={{ marginBottom: 4 }}>Produces Under</div>
          <div className="row wrap gap-1">
            {studio.labels.map((label) => <span key={label} className="chip">{label}</span>)}
          </div>
        </div>
      )}

      <div>
        <div className="stat-label" style={{ marginBottom: 4 }}>Who Runs It</div>
        <div className="col gap-1">
          {studio.figures.map((one) => (
            <div key={one.name} className="xs">
              <span className="strong">{one.name}</span>
              <span className="dim"> — {one.role}</span>
            </div>
          ))}
        </div>
      </div>

      {studio.casting && studio.casting.length > 0 && (
        <div>
          <div className="stat-label" style={{ marginBottom: 4 }}>Casting</div>
          <div className="col gap-1">
            {studio.casting.map((one) => (
              <div key={one.name} className="xs">
                <span className="strong">{one.name}</span>
                <span className="dim"> — {one.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
