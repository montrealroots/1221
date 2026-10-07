/**
 * The School's coursework tab (`systems/coursework.ts`, from 2026-10-07): the
 * first week, each course's open work and how far it's prepared, the steps
 * that prepare it, the table work's choices, rehearsals agreed with a partner,
 * the feedback when it's shown, and the partners themselves.
 *
 * Every button runs the command the engine checks; a step that can't be done
 * now says why on the button. Feedback is the game's, marked simulated.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Fine } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { formatDate, formatDateTime, formatTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { COURSES, YALE_DRAMA } from '@/engine/content/school';
import { PREP_DIMS, sceneById, templateById, type PrepDim } from '@/engine/content/coursework';
import {
  BAND_LABEL, ORIENTATION, WORK, answerRefusal, askRefusal, courseworkOf, minutesOf, orientationRefusal, prepareRefusal, preparedParts, questionsFor, readsLabel, trustOf, mateRecord,
  type Assignment,
  notesOf, readingDiffers, revisitWords, weightsOf,
} from '@/engine/systems/coursework';
import { OBJECTIVE_DIM, noteSubject, objectiveLabel, type NoteKind, type NoteRecord } from '@/engine/systems/learning';
import { garmentsOf } from '@/engine/systems/wardrobe';
import { phonesOf } from '@/engine/systems/phones';
import { routinesOf } from '@/engine/systems/routines';
import { itemsOf } from '@/engine/systems/items';

const zone = () => CITIES.require(YALE_DRAMA.cityId).timeZone;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const dayOfKey = (key: string) => { const [y, m, d] = key.split('-').map(Number); return formatDate(instantFromZoned({ year: y!, month: m!, day: d!, hour: 12 }, zone()), zone()); };
const courseName = (code: string) => COURSES.find((c) => c.code === code)?.name ?? code;

export function CourseworkPane() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const cw = courseworkOf(sim, person);
  if (!cw) return null;
  const open = cw.assignments.filter((a) => a.status === 'open' || a.status === 'revising');
  const past = cw.assignments.filter((a) => a.status !== 'open' && a.status !== 'revising').slice(-12).reverse();
  return (
    <div className="col gap-5">
      {!cw.orientation.behind && <FirstWeek />}
      <Arrangements />
      {open.length === 0
        ? <Panel title="Work Set"><p className="small muted" style={{ margin: 0 }}>Nothing set yet: each course sets its work at a meeting, or at orientation’s session on the courses.</p></Panel>
        : open.map((a) => <AssignmentCard key={a.id} a={a} />)}
      {past.length > 0 && <Shown list={past} />}
      <NotesLedger />
      <Partners />
    </div>
  );
}

function FirstWeek() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cw = courseworkOf(sim, person)!;
  return (
    <Panel title="Orientation" subtitle="The first week, 24 to 28 August: each session changes what you know or have arranged, once">
      <div className="col gap-2">
        {ORIENTATION.map((o) => {
          const done = cw.orientation.done[o.task];
          const when = instantFromZoned({ year: 2026, month: 8, day: o.day, hour: o.hour, minute: 0 }, zone());
          const no = orientationRefusal(sim, person, o.task);
          return (
            <div key={o.task} className="row-between small">
              <span>{o.label}<span className="xs dim"> · {formatDateTime(when, zone())}</span></span>
              {done ? <span className="xs">Done {formatDate(done, zone())}</span>
                : sim.now < when ? <span className="xs dim">On The Calendar</span>
                  : <Gated feature="school.orientation" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? `Catch it up: ${o.minutes} minutes`} onClick={() => { const r = run<{ told: string }>('school.orientation', { task: o.task }); if (r.ok) toast(r.value!.told, 'positive'); }}>Catch Up</Gated>}
            </div>
          );
        })}
        <Fine>The first week’s dates are the school’s (registration, then orientation to the 29th); what each session covers, and its hours, are SLATE’s estimate.</Fine>
      </div>
    </Panel>
  );
}

/** What daily life at school needs, read from where things stand, each with what the game does with it. */
function Arrangements() {
  const person = useWorld((s) => s.player);
  const homeHere = person.home?.cityId === YALE_DRAMA.cityId;
  const food = itemsOf(person).some((i) => (i as { food?: unknown }).food && i.at.kind === 'home');
  const moving = garmentsOf(person).some((g) => g.garment.slot === 'active') ? 'Activewear' : garmentsOf(person).some((g) => g.garment.slot === 'top') ? 'A Top Will Do' : 'None';
  const phone = phonesOf(person).length > 0;
  const morning = routinesOf(person).some((r) => r.at && r.at.hour < 9 && r.at.days.some((d) => d >= 1 && d <= 5));
  return (
    <Panel title="Arrangements" subtitle="What the term’s days run on">
      <div className="grid grid-3">
        <Stat label="A Home In New Haven" value={homeHere ? 'Yes' : 'No'} note="Classes are at nine; the studios and library are here" />
        <Stat label="Food At Home" value={food ? 'Yes' : 'None'} note="Hungry, you come less ready" />
        <Stat label="Clothes To Move In" value={moving} note="Movement and combat work wear them" />
        <Stat label="A Phone That Records" value={phone ? 'Yes' : 'No'} note="On-camera work is taped on it" />
        <Stat label="A Weekday Morning Routine" value={morning ? 'Set' : 'Not Set'} note="On Routines: set one before nine" />
      </div>
    </Panel>
  );
}

function AssignmentCard({ a }: { a: Assignment }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const t = templateById(a.template)!;
  const scene = a.sceneId ? sceneById(a.sceneId) : undefined;
  const mate = a.partner !== undefined ? person.school!.classmates[a.partner] : undefined;
  const due = a.status === 'revising' ? a.revision!.dueOn : a.dueOn;
  const parts = preparedParts(person, a, due);
  const dims = (Object.keys(t.dims) as PrepDim[]).filter((d) => PREP_DIMS.includes(d));
  const course = COURSES.find((c) => c.code === a.course)!;
  const weights = weightsOf(a);
  return (
    <Panel title={`${course.name}: ${t.title}${a.status === 'revising' ? ', To Show Again' : ''}${t.rounds ? `, Round ${(a.round ?? 0) + 1} Of ${t.rounds.length}: ${t.rounds[a.round ?? 0]!.label}` : ''}`} subtitle={`${course.code} · Due ${dayOfKey(due)} · Shown for ${readsLabel(t)}`}>
      <div className="col gap-3">
        <div className="small">
          {scene ? <><strong>{scene.play}</strong>, {scene.by} ({scene.year}), {scene.where}: you play <strong>{scene.roles[a.role!].name}</strong>{mate ? <>, {mate.name} plays {scene.roles[a.role === 0 ? 1 : 0].name}</> : null}. {scene.summary}</>
            : a.repPlay ? <>On <strong>{a.repPlay}</strong>, this season at Yale Rep. {t.deliverable}.</>
              : <>{t.deliverable}{mate ? `, with ${mate.name}` : ''}.</>}
        </div>
        {(a.objective || a.revisit) && (
          <div className="small">
            {a.objective && <div><strong>Put First: {objectiveLabel(t, a.objective)}.</strong> <span className="xs dim">{objectiveWhy(a, notesOf(courseworkOf(sim, person)!))}</span></div>}
            {a.revisit && scene && <div>{revisitWords(a, scene.roles[a.revisit.role].name, person.school!.classmates[a.revisit.partner ?? -1]?.name)}{a.revisit.change === 'reading' && <span className="xs dim"> {readingDiffers(a) ? 'Your reading differs from last time’s.' : 'Your reading is last time’s so far.'}</span>}</div>}
          </div>
        )}
        <div className="grid grid-3">
          {dims.map((d) => <Stat key={d} label={t.dims[d]!.label} value={pct(parts[d] ?? 0)} note={`Weighs ${pct(weights[d] ?? 0)}`} />)}
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {t.activities.filter((x) => x.dim !== 'partner').map((act) => {
            const no = prepareRefusal(sim, person, a, act.id);
            return (
              <Gated key={act.id} feature="school.prepare" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? `${minutesOf(a, act)} minutes`}
                onClick={() => { const r = run<{ moved: number; minutes: number }>('school.prepare', { assignmentId: a.id, activity: act.id }); if (r.ok) toast(`${act.label}: ${r.value!.minutes} minutes, ${t.dims[act.dim]?.label ?? act.dim} up ${pct(r.value!.moved)}.`, 'positive'); }}>
                {act.label}
              </Gated>
            );
          })}
        </div>
        {questionsFor(a).length > 0 && <TableWork a={a} />}
        {mate && <Rehearsals a={a} />}
        {a.feedback && <FeedbackBlock a={a} />}
      </div>
    </Panel>
  );
}

function TableWork({ a }: { a: Assignment }) {
  const { run, toast } = useGame();
  const choose = useFeature('school.choose');
  return (
    <div className="col gap-2">
      <div className="eyebrow">Table Work</div>
      {questionsFor(a).map(({ q, options }) => (
        <div key={q.id} className="field" style={{ margin: 0 }}>
          <label htmlFor={`${a.id}-${q.id}`}>{q.label}</label>
          <select id={`${a.id}-${q.id}`} value={a.answers[q.id] ?? ''} disabled={!choose.open} title={choose.reason} onChange={(e) => { if (!e.target.value) return; const r = run<{ supported: boolean }>('school.choose', { assignmentId: a.id, question: q.id, option: e.target.value }); if (r.ok) toast('Decided at the table.', 'neutral'); }}>
            <option value="">Not Decided</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.text}</option>)}
          </select>
          {a.shown && (() => { const o = options.find((x) => x.id === a.answers[q.id]); return o?.why ? <div className="xs dim">{o.supported ? 'What it rests on' : 'What cuts against it'}: {o.why}</div> : null; })()}
        </div>
      ))}
      <Fine>Ten minutes a question. Which readings the text supports is SLATE’s reading of the play, and some questions have more than one; each supported reading counts the same. Once it’s shown, each choice says what in the text it rests on or what cuts against it.</Fine>
    </div>
  );
}

function Rehearsals({ a }: { a: Assignment }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const mate = person.school!.classmates[a.partner!]!;
  const first = mate.name.split(' ')[0];
  const due = a.status === 'revising' ? a.revision!.dueOn : a.dueOn;
  const days: { key: string; label: string; parts: { year: number; month: number; day: number } }[] = [];
  const now = zonedParts(sim.now, zone());
  for (let n = 0; n < 14; n += 1) {
    const d = new Date(Date.UTC(now.year, now.month - 1, now.day + n));
    const p = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    const key = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    if (key >= due) break;
    days.push({ key, label: formatDate(instantFromZoned({ ...p, hour: 12 }, zone()), zone()), parts: p });
  }
  const [day, setDay] = useState(days[0]?.key ?? '');
  const [hour, setHour] = useState(19);
  const pick = days.find((d) => d.key === day) ?? days[0];
  const when = pick ? instantFromZoned({ ...pick.parts, hour, minute: 0 }, zone()) : NaN;
  const q = askRefusal(sim, person, a, when);
  const m = mateRecord(mate);
  return (
    <div className="col gap-2">
      <div className="eyebrow">Rehearsing With {first}</div>
      <div className="xs dim">{`Trust ${Math.round(trustOf(mate))} of 100 · Came to ${m.kept ?? 0} of ${(m.kept ?? 0) + (m.stoodUp ?? 0)} agreed${m.missedByYou ? ` · You missed ${m.missedByYou}` : ''}${m.reliability !== undefined ? ` · Reliability ${pct(m.reliability)}` : ''}`}</div>
      {days.length > 0 ? (
        <div className="row gap-2" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor={`${a.id}-day`}>Day</label>
            <select id={`${a.id}-day`} value={pick?.key} onChange={(e) => setDay(e.target.value)}>{days.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}</select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor={`${a.id}-hour`}>Time</label>
            <select id={`${a.id}-hour`} value={hour} onChange={(e) => setHour(Number(e.target.value))}>
              {Array.from({ length: WORK.rehearsal.until - WORK.rehearsal.from - 1 }, (_, i) => WORK.rehearsal.from + i).map((h) => <option key={h} value={h}>{formatTime(instantFromZoned({ ...(pick?.parts ?? { year: 2026, month: 9, day: 1 }), hour: h, minute: 0 }, zone()), zone())}</option>)}
            </select>
          </div>
          <Gated feature="school.ask_partner" className="btn btn-sm" disabled={Boolean(q.refused)} title={q.refused ?? q.declines ?? `Ask ${first} to rehearse, ${WORK.rehearsal.minutes} minutes`}
            onClick={() => { const r = run<{ accepted: boolean; reason?: string }>('school.ask_partner', { assignmentId: a.id, at: when }); if (r.ok) toast(r.value!.accepted ? `${first} said yes.` : `${first} can’t: ${r.value!.reason}`, r.value!.accepted ? 'positive' : 'neutral'); }}>
            Ask {first}
          </Gated>
        </div>
      ) : <p className="small muted" style={{ margin: 0 }}>No days left before it’s due.</p>}
      {(a.asks ?? []).filter((k) => k.status === 'open').map((k) => {
        const yes = answerRefusal(sim, person, a, k.id, true);
        return (
          <div key={k.id} className="col gap-1">
            <div className="small">{first} asks to rehearse on {formatDateTime(k.at, zone())}. Answer by {formatTime(k.until, zone())} that day.</div>
            <div className="row gap-2">
              <Gated feature="school.answer_partner" className="btn btn-sm" disabled={Boolean(yes)} title={yes ?? 'Yes: It Goes On Your Calendar'} onClick={() => { const r = run<{ booked: boolean }>('school.answer_partner', { assignmentId: a.id, askId: k.id, yes: true }); if (r.ok) toast('On your calendar.', 'positive'); }}>Say Yes</Gated>
              <Gated feature="school.answer_partner" className="btn btn-sm btn-ghost" title="No: They’ll Know, And It Costs Nothing" onClick={() => { if (run('school.answer_partner', { assignmentId: a.id, askId: k.id, yes: false }).ok) toast(`You told ${first} you can’t.`, 'neutral'); }}>Say No</Gated>
            </div>
          </div>
        );
      })}
      {a.rehearsals.map((r) => (
        <div key={r.id} className="col">
        <div className="row-between small">
          <span>{formatDateTime(r.at, zone())}</span>
          {r.status === 'booked'
            ? <Gated feature="school.cancel_rehearsal" className="btn btn-sm btn-ghost" title={r.at - sim.now < 86_400_000 ? `Short notice: ${first} will mind` : 'With notice'} onClick={() => { if (run('school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: r.id }).ok) toast('Called off.', 'neutral'); }}>Call It Off</Gated>
            : <span className="xs">{{ kept: 'Rehearsed', missedByYou: 'You Didn’t Come', missedByThem: `${first} Didn’t Come`, cancelled: 'Called Off', booked: '' }[r.status]}</span>}
        </div>
        {r.said && <div className="xs dim">{r.said} <span>(Simulated: the game’s words.)</span></div>}
        </div>
      ))}
    </div>
  );
}

function FeedbackBlock({ a }: { a: Assignment }) {
  const { run } = useGame();
  const f = a.feedback!;
  return (
    <div className="col gap-1">
      <div className="eyebrow">Feedback{a.shown ? `: ${BAND_LABEL[a.shown.band]}` : ''}{f.kind ? ` · ${KIND_LABEL[f.kind]}` : ''}</div>
      {a.shown && a.shown.strengths.length > 0 && <div className="small">{a.shown.strengths.join('. ')}.</div>}
      <div className="small">{f.text}</div>
      <div className="xs dim">Simulated feedback in {f.course}, taught by {f.teachers}: the game’s words, not theirs.</div>
      {!f.seen && <div><Gated feature="school.read_feedback" className="btn btn-sm btn-ghost" onClick={() => run('school.read_feedback', { assignmentId: a.id })}>Take The Note</Gated></div>}
    </div>
  );
}

const KIND_LABEL: Record<NoteKind, string> = { new: 'A New Note', recurring: 'Still There', partial: 'Better, Not Yet', applied: 'Taken', advanced: 'The Next Step' };

/** Why an assignment asks what it asks first: the note that keeps coming back, or the part this course hasn't asked of you lately. */
function objectiveWhy(a: Assignment, notes: readonly NoteRecord[]): string {
  const dim = OBJECTIVE_DIM[a.objective!];
  const rec = notes.find((n) => n.key === `dim:${dim}` && n.status === 'open' && n.given >= 2);
  return rec ? `Your notes have named it ${rec.given} times since ${dayOfKey(rec.first)}; it weighs more in this showing.` : 'The course hasn’t asked it of you lately; it weighs more in this showing.';
}

/** The ledger: every note given, by what it's about, across courses; open ones first. */
function NotesLedger() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const cw = courseworkOf(sim, person);
  const notes = cw ? notesOf(cw).filter((n) => !n.key.startsWith('advanced:')) : [];
  if (!notes.length) return null;
  const sorted = [...notes].sort((x, y) => (x.status === y.status ? (x.last < y.last ? 1 : -1) : x.status === 'open' ? -1 : 1));
  return (
    <Panel title="Your Notes" subtitle="What showings have named, across courses, and where each stands">
      <div className="col gap-1">
        {sorted.map((n) => (
          <div key={n.key} className="row-between small">
            <span>{noteSubject(n.key)} <span className="xs dim">· Given {n.given} {n.given === 1 ? 'time' : 'times'}, first {dayOfKey(n.first)}, last {dayOfKey(n.last)}</span></span>
            <span className="xs">{n.status === 'resolved' ? `Taken ${dayOfKey(n.resolvedOn!)}` : n.history.at(-1)?.kind === 'partial' ? 'Better, Not Yet' : 'Open'}</span>
          </div>
        ))}
        <Fine>Simulated notes: the game’s reading of the work, never a teacher’s words. A note taken isn’t given again unless the part slips back.</Fine>
      </div>
    </Panel>
  );
}

function Shown({ list }: { list: Assignment[] }) {
  return (
    <Panel title="Work Shown" subtitle="The last twelve">
      <div className="col gap-2">
        {list.map((a) => {
          const t = templateById(a.template)!;
          const scene = a.sceneId ? sceneById(a.sceneId) : undefined;
          return (
            <div key={a.id} className="small">
              <strong>{courseName(a.course)}</strong>: {t.title}{scene ? `, ${scene.play}` : ''} · {a.status === 'missed' ? 'Not Shown' : a.status === 'lapsed' ? 'Lapsed At Term’s End' : a.shown ? BAND_LABEL[a.shown.band] : 'Done'}
              {a.revision?.applied !== undefined && <span className="xs dim"> · {a.revision.applied ? 'Note Taken' : 'Note Not Taken'}</span>}
              {a.feedback && <div className="xs dim">{a.feedback.text}</div>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Partners() {
  const person = useWorld((s) => s.player);
  const mates = person.school!.classmates.map((m) => ({ m, r: mateRecord(m) })).filter((x) => x.r.log?.length || x.r.kept || x.r.stoodUp || x.r.missedByYou);
  if (mates.length === 0) return null;
  return (
    <Panel title="Your Partners" subtitle="Who you’ve worked with, and how it’s gone">
      <div className="col gap-2">
        {mates.map(({ m, r }) => (
          <div key={m.name} className="small">
            <strong>{m.name}</strong> <span className="xs dim">Trust {Math.round(trustOf(m))} · Came {r.kept ?? 0} of {(r.kept ?? 0) + (r.stoodUp ?? 0)}{r.reliability !== undefined ? ` · Reliability ${pct(r.reliability)}` : ''}</span>
            {r.log?.[0] && <div className="xs dim">{formatDate(r.log[0].at, zone())}: {r.log[0].what}</div>}
          </div>
        ))}
      </div>
    </Panel>
  );
}
