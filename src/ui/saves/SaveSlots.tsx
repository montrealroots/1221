/**
 * SLATE — three save slots, three separate universes.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SaveAdapter, SaveSlotInfo, Slot } from '@/engine/persistence/adapter';
import { PERFORMER_NOUN } from '@/engine/core/performer';
import type { SaveUniverse } from '@/engine/domain/model';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { migrate, validateUniverse } from '@/engine';
import { APP_VERSION } from '@/engine/world/bootstrap';

export function SaveSlots({
  adapter, initialSlots, onNew, onContinue,
}: {
  adapter: SaveAdapter;
  initialSlots: SaveSlotInfo[];
  onNew: (slot: Slot) => void;
  onContinue: (universe: SaveUniverse) => void;
}) {
  const [slots, setSlots] = useState(initialSlots);
  const [busy, setBusy] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Slot | null>(null);

  const reload = useCallback(async () => {
    try {
      setSlots(await adapter.listSlots());
    } catch (e) {
      setError((e as Error).message);
    }
  }, [adapter]);

  useEffect(() => { void reload(); }, [reload]);

  const load = async (slot: Slot, fromBackup = false) => {
    setBusy(slot);
    setError(null);
    try {
      const universe = fromBackup ? await adapter.restoreBackup(slot) : await adapter.load(slot);
      if (!universe) {
        setError(fromBackup ? 'There’s no backup for that slot.' : 'That slot is empty.');
        return;
      }

      if ((universe.meta.schemaVersion ?? 1) > SAVE_SCHEMA_VERSION) {
        setError(
          `Slot ${slot} was written by a newer version of SLATE (schema ${universe.meta.schemaVersion}). Opening it here could damage it, so it hasn’t been loaded.`,
        );
        return;
      }

      // A migration takes a checkpoint before it touches anything.
      if ((universe.meta.schemaVersion ?? 1) < SAVE_SCHEMA_VERSION) {
        await adapter.backup(slot);
        universe.meta.migrationInProgress = {
          from: universe.meta.schemaVersion ?? 1,
          to: SAVE_SCHEMA_VERSION,
          startedAt: Date.now(),
        };
        const result = migrate(universe);
        if (result.problems.length > 0) {
          setError(result.problems.join(' '));
          return;
        }
        universe.meta.migrationInProgress = undefined;
        await adapter.save(universe);
      }

      const validation = validateUniverse(universe);
      if (!validation.ok) {
        setError(
          `That save didn’t pass validation: ${validation.errors[0]}${validation.errors.length > 1 ? ` (and ${validation.errors.length - 1} more)` : ''}.` +
          `${slots.find((s) => s.slot === slot)?.hasBackup ? ' A backup is available to restore from.' : ''}`,
        );
        return;
      }

      onContinue(universe);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (slot: Slot) => {
    setBusy(slot);
    try {
      await adapter.remove(slot);
      setConfirmDelete(null);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="main">
      <div className="main-inner">
        <div className="center" style={{ marginBottom: 'var(--s7)', paddingTop: 'var(--s6)' }}>
          <div style={{ fontSize: 44, marginBottom: 'var(--s3)' }} role="img" aria-label="SLATE">🎬</div>
          <div className="wordmark" style={{ fontSize: 32 }}>SLATE</div>
          <p className="muted">Three slots. Three separate worlds. Nothing crosses between them.</p>
        </div>

        {error && (
          <div className="callout callout-negative" style={{ marginBottom: 'var(--s5)' }}>
            {error}
          </div>
        )}

        <div className="slot-grid">
          {([1, 2, 3] as Slot[]).map((slot) => {
            const info = slots.find((s) => s.slot === slot) ?? { slot, occupied: false, hasBackup: false };
            const working = busy === slot;

            if (!info.occupied) {
              return (
                <div key={slot} className="slot slot-empty">
                  <div className="slot-number">Slot {slot}</div>
                  <p className="small dim center" style={{ maxWidth: 220 }}>
                    An empty universe, waiting for someone to live in it.
                  </p>
                  <button className="btn btn-primary" onClick={() => onNew(slot)} disabled={working}>
                    New Save
                  </button>
                </div>
              );
            }

            const meta = info.meta;
            return (
              <div key={slot} className="slot">
                <div className="row-between">
                  <span className="slot-number">Slot {slot}</span>
                  {info.hasBackup && <span className="chip">Backup</span>}
                </div>

                {info.error ? (
                  <>
                    <div className="slot-name" style={{ fontSize: 'var(--size-md)' }}>Unreadable save</div>
                    <p className="small negative">{info.error}</p>
                    <div className="col gap-2" style={{ marginTop: 'auto' }}>
                      {info.hasBackup && (
                        <button className="btn" onClick={() => void load(slot, true)} disabled={working}>
                          Restore From Backup
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(slot)} disabled={working}>
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row gap-3" style={{ alignItems: 'center' }}>
                      {meta?.portrait && (
                        <img
                          className="headshot headshot-sm"
                          src={meta.portrait}
                          alt={`Headshot for ${meta.characterName}`}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div className="slot-name">{meta?.characterName}</div>
                        <div className="muted small">{meta?.performerTitle ? PERFORMER_NOUN[meta.performerTitle] : (meta?.careerLabel || '—')}</div>
                      </div>
                    </div>

                    <div className="slot-meta">
                      <div className="stat">
                        <span className="stat-label">Date</span>
                        <span className="small">{meta?.worldDateLabel || '—'}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Location</span>
                        <span className="small">{meta?.locationLabel || '—'}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Net worth</span>
                        <span className="small mono">{meta?.netWorthLabel || '—'}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Played</span>
                        <span className="small mono">{formatPlaytime(meta?.playtimeSeconds ?? 0)}</span>
                      </div>
                    </div>

                    <div className="xs dim">
                      Version {meta?.appVersion ?? '—'} · Schema {meta?.schemaVersion ?? '—'}
                      {meta && meta.schemaVersion < SAVE_SCHEMA_VERSION && ' · will be updated on load'}
                      {info.bytes !== undefined && ` · ${formatBytes(info.bytes)}`}
                    </div>

                    <div className="col gap-2" style={{ marginTop: 'auto' }}>
                      <button className="btn btn-primary btn-block" onClick={() => void load(slot)} disabled={working}>
                        {working ? 'Opening…' : 'Continue'}
                      </button>
                      <div className="row gap-2">
                        {info.hasBackup && (
                          <button className="btn btn-sm grow" onClick={() => void load(slot, true)} disabled={working}>
                            Restore Backup
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm grow" onClick={() => setConfirmDelete(slot)} disabled={working}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <p className="center dim xs" style={{ marginTop: 'var(--s7)' }}>
          SLATE {APP_VERSION} · Saved To {adapter.name}
          {adapter.serverAuthoritative ? ' · Server Authoritative For Critical State' : ''}
        </p>
      </div>

      {confirmDelete !== null && (
        <div className="overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Confirm Deletion">
            <div className="modal-head">
              <h2>Delete slot {confirmDelete}?</h2>
            </div>
            <div className="modal-body">
              <p>
                This ends that universe. Everything in it — the people, the history, the work — stops existing.
              </p>
              <p className="muted small">
                A backup is kept, so this can be undone from this screen if you change your mind.
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setConfirmDelete(null)}>Keep It</button>
              <button className="btn btn-danger" onClick={() => void remove(confirmDelete)}>
                Delete slot {confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatPlaytime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
