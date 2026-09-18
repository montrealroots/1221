/**
 * SLATE — your own work.
 *
 * Everything else in this build belongs to the family. This page is the one
 * thing that is the player's, and it asks one question: what is anybody willing
 * to see you for, and what are you going to play when you get there?
 *
 * The page gives away nothing the world has not already told the player. What
 * a room wants is the room's, and nobody volunteers any of it except as one
 * note, on one shade, once. What the page does show is the player's own
 * arithmetic on their own past: the average of what they ended up playing in
 * this holder's rooms, which is the only handle anybody has on what these
 * people like.
 *
 * Showing it is not a convenience. A taste nobody can see is a taste nobody
 * can play toward, and the whole of `HOUSE_HOLDS` would be a hidden correlation
 * the player felt as noise. So the sliders open on that average rather than on
 * dead center, and the sentence under them says how many rooms it is built
 * from and that a tape never adds to it.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Modal, Stat } from '@/ui/components/primitives';
import { LookRegion } from '@/ui/looks/Look';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { sizeById } from '@/engine/content/casting';
import {
  FURTHEST, HOW_FAR, SHADES, WAYS, shadeById, whyById,
} from '@/engine/content/audition';
import {
  alreadyUpFor, freeAcross, goingNow, heardItRight, readingOf, remembersYou,
  whatTheyKeepAskingFor, whereYourWorkStands,
} from '@/engine/world/audition';
import type { Audition } from '@/engine/domain/model';

export function AuditionsWorkspace() {
  const { sim } = useGame();
  const open = useWorld(() => goingNow(sim));
  const behind = useWorld(() => alreadyUpFor(sim));
  const [going, setGoing] = useState<string | undefined>();
  const waiting = [...open, ...behind].filter((one) => one.state === 'noted');

  return (
    <div className="col gap-4">
      <Panel title="Your Work" tight>
        <LookRegion>
          <p className="small">{whereYourWorkStands(sim)}</p>
          <p className="muted small">
            Work that isn’t the family’s comes from the stages. A production that has taken one is
            a production that needs people, so what the lot is letting a year from now is what you
            will be asked about — and there’s nothing you can do this week to change that.
          </p>
        </LookRegion>
      </Panel>

      {waiting.length > 0 && (
        <Panel title="They Are Waiting On You" tight>
          {waiting.map((one) => (
            <TheNote key={one.id} audition={one} />
          ))}
        </Panel>
      )}

      <Panel title="Going Up For It" tight>
        {open.length === 0 ? (
          <Empty
            title="Nobody Is Asking"
            body="Nobody has heard of you and the stages are quiet. Both of those are the same problem seen from two ends."
          />
        ) : (
          <div className="col gap-2">
            {open.map((one) => {
              const size = sizeById(one.size);
              const free = freeAcross(sim, one.from, one.to);
              return (
                <div key={one.id} className="holding">
                  <div className="row-between">
                    <div>
                      <div className="strong">{one.holder}</div>
                      <div className="muted small">
                        {`${size?.label ?? 'A part'} · ${formatMoney(one.feeCents)} · `}
                        {`shooting ${formatDate(one.from, sim.homeZone)}`}
                      </div>
                      <div className="dim xs">
                        {`Nobody is seen after ${formatDate(one.closesAt, sim.homeZone)}. `}
                        {`They think of you ${Math.round(remembersYou(sim, one.holder) * 100)}/100.`}
                      </div>
                    </div>
                    {free
                      ? <button className="btn btn-sm btn-primary" onClick={() => setGoing(one.id)}>Go Up For It</button>
                      : <span className="chip">You’re working</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {behind.length > 0 && (
        <Panel title="What Came Of It" tight>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {behind.filter((one) => one.state === 'over').slice(0, 12).map((one) => (
                  <tr key={one.id}>
                    <td className="nowrap">{one.holder}</td>
                    <td className="small">{sizeById(one.size)?.label ?? 'A part'}</td>
                    <td className="small">{whyById(one.why ?? '')?.label ?? 'Waiting'}</td>
                    <td className="nowrap small">
                      {one.why === 'cast' ? formatMoney(one.feeCents) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {going && <GoUpForm key={going} auditionId={going} onClose={() => setGoing(undefined)} />}
    </div>
  );
}

/**
 * Choosing what to play, and how to get it to them.
 *
 * Three sliders with no right answer shown anywhere, and a choice between a day
 * and three. The three days are not a better performance — the player cannot
 * give a worse one — they are the only way anybody will tell you anything, and
 * now also the only way anything is ever added to what the player knows about
 * these people.
 *
 * The sliders open where the player's own record says this holder lives rather
 * than at dead center. Dead center was the right answer against a room drawn
 * from nothing — rank 1 of all 343 openings in seven of the nine cells a player
 * can be in — so opening there was a decision with one answer, taken before the
 * game started. Opening on the holder's own average makes the first move a
 * reading of a record instead, and the record is thin until somebody has been
 * in enough rooms to have one.
 */
function GoUpForm({ auditionId, onClose }: { auditionId: string; onClose: () => void }) {
  const { run, sim } = useGame();
  const audition = useWorld((s) => s.universe.auditions[auditionId]);
  const holder = audition?.holder ?? '';
  const taste = useWorld((s) => whatTheyKeepAskingFor(s, holder));
  const [played, setPlayed] = useState<Record<string, number>>(
    Object.fromEntries(SHADES.map((s) => [s.id, Math.round(taste.reading[s.id])])),
  );
  const [error, setError] = useState<string | undefined>();
  if (!audition) return null;

  const go = (way: string) => {
    const answer = run<{ ok: boolean; error?: string }>(
      'life.go_up', { auditionId, way, played }, { silent: true },
    );
    if (answer.value?.ok) { onClose(); return; }
    setError(answer.value?.error ?? answer.error);
  };

  return (
    <Modal
      title={`Reading For ${audition.holder}`}
      onClose={onClose}
      footer={<button className="btn btn-ghost" onClick={onClose}>Not This One</button>}
    >
      <div className="grid grid-3">
        <Stat label="The Part" value={sizeById(audition.size)?.label ?? 'A part'} />
        <Stat label="It Pays" value={formatMoney(audition.feeCents)} />
        <Stat label="It Holds You" value={`${formatDate(audition.from, sim.homeZone)} on`} />
      </div>
      <p className="small">
        Nobody has told you what this part is for and nobody is going to until you’re standing in
        front of them. Whatever you choose you will do exactly; the only question is whether it
        was the right idea.
      </p>
      <p className="muted small">
        {taste.rooms === 0
          ? `You have never been in a room with ${audition.holder}, so the sliders start where `
            + 'anybody would start. What you end up playing in their rooms is what you’ll have '
            + 'to go on next time. A tape never adds to it — nobody gives a note to a file.'
          : `The sliders start where you have ended up in ${taste.rooms} `
            + `${taste.rooms === 1 ? 'room' : 'rooms'} with ${audition.holder}. That record is all `
            + 'anybody has on what these people like. Most of what they cast is of a piece and some '
            + 'of it isn’t. A tape never adds to this — nobody gives a note to a file.'}
      </p>
      {SHADES.map((shade) => (
        <div className="field" key={shade.id}>
          <label htmlFor={`shade-${shade.id}`}>{shade.label}</label>
          <input
            id={`shade-${shade.id}`}
            type="range"
            min={-FURTHEST}
            max={FURTHEST}
            step={1}
            value={played[shade.id] ?? 0}
            onChange={(e) => setPlayed({ ...played, [shade.id]: Number(e.target.value) })}
          />
          <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
            {`${shade.low} — ${shade.high}. ${shade.what}`}
          </p>
        </div>
      ))}
      <div className="row gap-2" style={{ marginTop: 'var(--s4)' }}>
        {WAYS.map((way) => (
          <button
            key={way.id}
            className={`btn ${way.notes ? 'btn-primary' : ''}`}
            title={way.what}
            onClick={() => go(way.id)}
          >
            {`${way.label} · ${way.days === 1 ? 'a day' : `${way.days} days`}`}
          </button>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 'var(--s3)' }}>
        {WAYS.map((way) => `${way.label}: ${way.what}`).join(' ')}
      </p>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}

/**
 * The note, and the only decision anybody takes with information in it.
 *
 * What they asked for is one shade and one direction. How far they meant is
 * never said, and will not be — so the buttons are distances the player is
 * choosing rather than fractions of an answer the game already holds. The
 * state of the person is shown beside them, because how sure they are of what
 * they just heard is the thing that decides whether committing is brave or
 * stupid, and it is the only part of this the player can actually read.
 */
function TheNote({ audition }: { audition: Audition }) {
  const { run } = useGame();
  const [error, setError] = useState<string | undefined>();
  const sure = useWorld((s) => heardItRight(s));
  const shade = shadeById(audition.note?.shade ?? '');
  if (!shade || !audition.note) return null;
  const asked = audition.note.toward > 0 ? shade.high : shade.low;
  const now = readingOf(audition.played)[audition.note.shade as 'warmth'];

  const take = (howFar: string) => {
    const answer = run<{ ok: boolean; error?: string }>(
      'life.take_note', { auditionId: audition.id, howFar }, { silent: true },
    );
    setError(answer.value?.ok ? undefined : answer.value?.error ?? answer.error);
  };

  return (
    <div className="holding">
      <div className="strong">{`${audition.holder}: “${asked}.”`}</div>
      <p className="muted small">
        {`That’s the note, and it’s on ${shade.label.toLowerCase()} — the one you were `}
        furthest off on. You played it at {now} of {FURTHEST}. How far they meant, they did not
        say, and nobody is going to tell you.
      </p>
      <p className="xs dim" style={{ margin: '0 0 var(--s3)' }}>
        {sure >= 1
          ? 'You’re sharp enough to be certain what they said.'
          : `You’re ${Math.round(sure * 100)}/100 sure you took that in the way they meant it. `
            + 'Go as far as it goes and you\u2019re three steps right or three steps wrong.'}
      </p>
      <div className="row gap-2">
        {HOW_FAR.map((one) => (
          <button key={one.id} className="btn btn-sm" title={one.what} onClick={() => take(one.id)}>
            {one.label}
          </button>
        ))}
      </div>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </div>
  );
}
