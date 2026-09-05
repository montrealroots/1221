/**
 * SLATE — the room, on screen.
 *
 * Who is behind the table and what each of them is watching for, and then one
 * decision at a time until the door shuts. What is never shown is what any of
 * them privately think of you: you get their reaction — somebody sat forward,
 * somebody looked at the sheet instead of at you — because that is what you
 * would actually see from where you are standing.
 */

import { useState } from 'react';
import { useGame } from '@/app/game-context';
import { Modal, Meter } from '@/ui/components/primitives';
import { formatTime } from '@/engine/core/time';
import type { Audition, Role, Project } from '@/engine/domain/model';

interface BeatPayload {
  beat: string;
  name: string;
  what: string;
  choices: { id: string; label: string; detail: string }[];
}

interface EnterPayload extends BeatPayload {
  room: { name: string; title: string; watchingFor: string }[];
  nerves: number;
}

interface PlayPayload {
  score: number;
  note: string;
  said?: string;
  reactions: { name: string; note: string; delta: number }[];
  done: boolean;
  verdict?: { score: number; line: string };
  next?: BeatPayload;
}

export function AuditionRoomDialog({ auditionId, onClose }: { auditionId: string; onClose: () => void }) {
  const { sim, run } = useGame();
  const audition = sim.universe.auditions[auditionId] as Audition | undefined;
  const role = audition ? (sim.universe.roles[audition.roleId] as Role | undefined) : undefined;
  const project = audition ? (sim.universe.projects[audition.projectId] as Project | undefined) : undefined;

  const [entered, setEntered] = useState<EnterPayload | null>(null);
  const [beat, setBeat] = useState<BeatPayload | null>(null);
  const [log, setLog] = useState<{ label: string; note: string; said?: string; reactions: { name: string; note: string; delta: number }[] }[]>([]);
  const [verdict, setVerdict] = useState<{ score: number; line: string } | null>(null);
  const [refused, setRefused] = useState<string | null>(null);
  const [prep, setPrep] = useState(4);

  const room = audition?.room;

  const enter = () => {
    const result = run<EnterPayload>('cast.enter_room', { auditionId, prepHours: prep });
    if (!result.ok) { setRefused(result.error ?? 'That room is not open to you.'); return; }
    setEntered(result.value!);
    setBeat(result.value!);
  };

  const play = (choiceId: string) => {
    const result = run<PlayPayload>('cast.play_beat', { auditionId, choiceId });
    if (!result.ok) { setRefused(result.error ?? 'You cannot do that here.'); return; }
    const value = result.value!;
    const label = beat?.choices.find((c) => c.id === choiceId)?.label ?? choiceId;
    setLog((entries) => [...entries, { label, note: value.note, said: value.said, reactions: value.reactions }]);
    if (value.done) { setVerdict(value.verdict ?? null); setBeat(null); }
    else setBeat(value.next ?? null);
  };

  const leave = () => {
    const result = run<{ verdict: { score: number; line: string } }>('cast.leave_room', { auditionId });
    if (result.ok) { setVerdict(result.value!.verdict); setBeat(null); }
  };

  return (
    <Modal
      title={`${role?.characterName ?? 'The Part'} — ${project?.title ?? 'A Project'}`}
      onClose={onClose}
      wide
      footer={verdict || !entered
        ? <button className="btn btn-primary" onClick={onClose}>{verdict ? 'Leave' : 'Not Yet'}</button>
        : <><button className="btn" onClick={leave}>Walk Out</button><span className="xs dim">Walking out of a room is remembered.</span></>}
    >
      {!entered ? (
        <>
          <p className="muted small">
            {audition?.scheduledAt ? `Your slot is ${formatTime(audition.scheduledAt, sim.homeZone)}. ` : ''}
            You will see who is behind the table when you walk in, and not before. Every beat is a decision and the
            clock is running the whole time.
          </p>
          <div className="field">
            <div className="row-between">
              <label htmlFor="room-prep" style={{ marginBottom: 0 }}>Hours Of Preparation</label>
              <span className="mono">{prep}</span>
            </div>
            <input id="room-prep" type="range" min={0} max={16} value={prep} onChange={(e) => setPrep(Number(e.target.value))} />
            <div className="row-between xs dim"><span>Go in cold</span><span>Two full days on it</span></div>
          </div>
          <div className="callout">
            {prep === 0 && 'No preparation. Everyone behind the table will know.'}
            {prep > 0 && prep < 4 && 'A pass on the material. Better than nothing.'}
            {prep >= 4 && prep < 10 && 'Properly prepared. This is what professionals do.'}
            {prep >= 10 && 'Deeply prepared, at real cost to your energy today.'}
          </div>
          {refused && <div className="callout callout-negative"><p className="xs" style={{ margin: 0 }}>{refused}</p></div>}
          <button className="btn btn-primary" onClick={enter}>Go In</button>
        </>
      ) : (
        <div className="col gap-3">
          <div>
            <div className="eyebrow">Behind The Table</div>
            <div className="list" style={{ marginTop: 'var(--s2)' }}>
              {entered.room.map((seat, i) => (
                <div key={i} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{seat.name}</div>
                    <div className="xs dim">{seat.title}</div>
                    <div className="xs muted" style={{ marginTop: 2 }}>{seat.watchingFor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {room && !verdict && (
            <Meter label="Nerves" value={room.nerves} hint={room.nerves > 65 ? 'You can feel your own heartbeat.' : room.nerves < 30 ? 'Settled.' : undefined} />
          )}

          {log.length > 0 && (
            <div>
              <div className="eyebrow">What Happened</div>
              <div className="col gap-2" style={{ marginTop: 'var(--s2)' }}>
                {log.map((entry, i) => (
                  <div key={i} className="callout">
                    <div className="xs strong">{entry.label}</div>
                    {entry.said && <p className="xs" style={{ margin: '2px 0 0', fontStyle: 'italic' }}>{entry.said}</p>}
                    <p className="xs" style={{ margin: '2px 0 0' }}>{entry.note}</p>
                    {entry.reactions.length > 0 && (
                      <div className="xs dim" style={{ marginTop: 4 }}>
                        {entry.reactions.map((r, n) => <div key={n}>{r.note}</div>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {beat && (
            <div>
              <div className="eyebrow">{beat.name}</div>
              <p className="small" style={{ margin: 'var(--s2) 0' }}>{beat.what}</p>
              <div className="list">
                {beat.choices.map((choice) => (
                  <button key={choice.id} className="list-item" onClick={() => play(choice.id)}>
                    <div className="grow" style={{ textAlign: 'left' }}>
                      <div className="small strong">{choice.label}</div>
                      <div className="xs dim">{choice.detail}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {verdict && (
            <div className={`callout ${verdict.score >= 65 ? 'callout-accent' : verdict.score < 40 ? 'callout-negative' : ''}`}>
              <strong className="small">The Door Shuts</strong>
              <p className="small" style={{ margin: '4px 0 0' }}>{verdict.line}</p>
              <p className="xs dim" style={{ margin: '4px 0 0' }}>
                It goes on the audition as one round. The office writes its own notes on you the
                moment you are out of the corridor, and some of that comes back through your agent
                in a week or three. What they decide, and when, is theirs.
              </p>
            </div>
          )}

          {refused && <div className="callout callout-negative"><p className="xs" style={{ margin: 0 }}>{refused}</p></div>}
        </div>
      )}
    </Modal>
  );
}
