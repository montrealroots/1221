/**
 * SLATE — the Actor Showcase on the School's Coursework tab, and the early degree on its Terms And Award tab (from
 * 2026-10-21, the owner's brief 19, W1, W2 and A5; `systems/proshowcase.ts`).
 *
 * The showcase panel is drawn only once the final term has begun it: when and where its days and rehearsal calls are,
 * whether the student takes part and why, the faculty's options with their notes until two scenes are chosen, the
 * scenes and how each day went after. Its one control runs `school.choose_showcase` behind its guide chapter, with the
 * command's own refusal said under it before it's pressed. The scenes themselves are prepared on the coursework's own
 * cards below it, as any piece is.
 *
 * The early degree's words are the module's (`EARLY_DEGREE`), so the Career's The Way You're On says the same.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { CITIES } from '@/engine/content/geography';
import { sceneById } from '@/engine/content/coursework';
import { formatDate, formatWeekdayDate } from '@/engine/core/time';
import { schoolEnded } from '@/engine/systems/school';
import { BAND_LABEL } from '@/engine/systems/coursework';
import { coursesOf } from '@/engine/systems/courserecord';
import {
  EARLY_DEGREE, SHOWCASE, callWords, choiceRefusal, showcaseCalendar, showcaseOf, showcaseOptions, showcasePieces, type ShowcaseOption,
} from '@/engine/systems/proshowcase';

const cityName = (id: string) => CITIES.get(id)?.name ?? id;

export function ShowcasePanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const sc = showcaseOf(person);
  if (!sc || !person.school) return null;
  const zone = sim.zone;
  const cal = showcaseCalendar(sc.term);
  const [ny1, ny2, la] = cal.days;
  const first = cal.rehearsals[0];
  const lastCall = cal.rehearsals.at(-1);
  const open = Object.values(coursesOf(person.school)).filter((r) => r.result === 'incomplete').map((r) => r.name);
  const taking = sc.eligible === true
    ? 'You’re in it: no course was incomplete at the end of the term’s fourth week.'
    : sc.eligible === false
      ? `You’re not in it. ${(sc.outstanding ?? []).join(', ')} ${(sc.outstanding ?? []).length === 1 ? 'was' : 'were'} still incomplete at the end of the term’s fourth week, and the Bulletin keeps a student with an Incomplete outstanding out of the Actor Showcase. Its calls are off your calendar.`
      : `To take part, make up every Incomplete by ${formatWeekdayDate(cal.checkBy, zone)}, the end of the term’s fourth week. ${open.length ? `${open.join(', ')} ${open.length === 1 ? 'is' : 'are'} still incomplete: make ${open.length === 1 ? 'it' : 'them'} up on the Standing And Craft tab.` : 'You have none outstanding.'}`;
  return (
    <Panel title="The Actor Showcase" subtitle="DRAM 793b, your last term" help="school.choose_showcase">
      <div className="col gap-4">
        <p className="small" style={{ margin: 0 }}>Two scenes you choose and rehearse, which the Bulletin says are presented to agents, managers and casting directors in New York and Los Angeles. Each scene is judged at each showcase day on how prepared it is, how you are that day and what the scene asks.</p>
        <dl className="col gap-2 small" style={{ margin: 0 }}>
          <div><dt className="strong">New York</dt><dd style={{ margin: 0 }}>{callWords(ny1!)}; and {callWords(ny2!)}.</dd></div>
          <div><dt className="strong">Los Angeles</dt><dd style={{ margin: 0 }}>{callWords(la!)}.</dd></div>
          {first && lastCall && <div><dt className="strong">Rehearsal Calls</dt><dd style={{ margin: 0 }}>{`Tuesday to Friday from 3 PM for three hours, ${formatDate(first, zone).replace(/, \d{4}$/, '')} to ${formatDate(lastCall, zone)}. Each works both scenes on their feet with your partners.`}</dd></div>}
          <div><dt className="strong">Taking Part</dt><dd style={{ margin: 0 }}>{taking}</dd></div>
        </dl>
        {sc.eligible !== false && (sc.scenes.length ? <YourScenes /> : <Options />)}
        <Fine>{SHOWCASE.source} Each call starts in New Haven, with the trip inside its hours.</Fine>
      </div>
    </Panel>
  );
}

/** The scenes chosen, and how each day went. */
function YourScenes() {
  const { sim, navigate } = useGame();
  const person = useWorld((s) => s.player);
  const sc = showcaseOf(person)!;
  const pieces = showcasePieces(sim, person);
  return (
    <div className="col gap-3">
      <h3 className="eyebrow" style={{ margin: 0 }}>Your Scenes</h3>
      <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {pieces.map((a) => {
          const scene = sceneById(a.sceneId!)!;
          const mate = a.partner !== undefined ? person.school!.classmates[a.partner]?.name : undefined;
          const by = sc.scenes.find((s) => s.assignmentId === a.id)?.by === 'faculty' ? 'The faculty chose it.' : 'You chose it.';
          const prep = sc.scenes.find((s) => s.assignmentId === a.id)?.prep;
          return <li key={a.id}>{`${scene.roles[a.role!].name} in ${scene.play}${mate ? `, with ${mate} as ${scene.roles[a.role === 0 ? 1 : 0].name}` : ''}. ${by}${prep !== undefined ? ` At its last showcase day it was ${Math.round(prep * 100)}% prepared.` : ' Prepare it below, on its card under Actor Showcase: Your Showcase Scene.'}`}</li>;
        })}
      </ul>
      {sc.performed.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Day</th><th scope="col">Scene</th><th scope="col">How It Went</th><th scope="col" className="num">Of 100</th></tr></thead>
            <tbody>
              {sc.performed.map((p, i) => (
                <tr key={i}>
                  <td>{`${cityName(p.city)}, ${formatDate(p.at, sim.zone)}`}</td>
                  <td>{sceneById(p.scene ?? '')?.play ?? ''}</td>
                  <td>{p.band ? BAND_LABEL[p.band] : ''}</td>
                  <td className="num mono">{p.overall !== undefined ? p.overall.toFixed(1) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(sc.missed ?? []).length > 0 && <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{sc.missed!.map((m, i) => <li key={i}>{`${cityName(m.city)}, ${formatDate(m.at, sim.zone)}: missed${m.excused ? ', excused because you were ill' : ', unexcused'}.`}</li>)}</ul>}
      {person.school && schoolEnded(person.school.standing) && <div><button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/workspace/career', 'Career')}>Your Career</button></div>}
    </div>
  );
}

/** The faculty's options, each scene with its note and its two parts, until two are chosen. */
function Options() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const [chosen, setChosen] = useState<string[]>([]);
  const options = showcaseOptions(sim, person);
  const no = choiceRefusal(sim, person, chosen);
  const byScene = new Map<string, ShowcaseOption[]>();
  for (const o of options) byScene.set(o.scene.id, [...(byScene.get(o.scene.id) ?? []), o]);
  const toggle = (id: string) => setChosen((was) => (was.includes(id) ? was.filter((x) => x !== id) : [...was, id]));
  return (
    <fieldset className="col gap-3" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="small strong">The Faculty’s Options</legend>
      <p className="xs dim" style={{ margin: 0 }}>Choose two scenes, each in one of its parts. Each scene’s forecast is the scene fully prepared, on a good day: a forecast, not a result. If you haven’t chosen by the end of the term’s fourth week, the faculty choose their first two.</p>
      {[...byScene.values()].map((parts) => (
        <div key={parts[0]!.scene.id} className="col gap-1">
          <p className="small" style={{ margin: 0 }}><strong>{parts[0]!.scene.play}</strong>{`, ${parts[0]!.scene.by} (${parts[0]!.scene.year}). ${parts[0]!.sceneNote}`}</p>
          <ul className="small" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {parts.map((o) => (
              <li key={o.id} className="row gap-2" style={{ alignItems: 'baseline' }}>
                <input type="checkbox" id={`showcase-${o.id}`} checked={chosen.includes(o.id)} onChange={() => toggle(o.id)} />
                <label htmlFor={`showcase-${o.id}`}>{`You play ${o.part}, opposite ${o.other}.${o.partNote ? ` ${o.partNote}` : ''}${o.faculty ? ' The faculty would choose this one.' : ''}`}</label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="school.choose_showcase" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ assignments: string[] }>('school.choose_showcase', { options: chosen }); if (r.ok) { toast('Your two showcase scenes are chosen. Prepare them on their cards below.', 'positive'); setChosen([]); } }}>Choose These Scenes</Gated>
      </div>
      <WhyNot reasons={[['Choose These Scenes', no]]} />
    </fieldset>
  );
}

/** The Bulletin's word on finishing early, for a student still in the program. */
export function EarlyDegree() {
  const person = useWorld((s) => s.player);
  if (!person.school || schoolEnded(person.school.standing)) return null;
  return (
    <Panel title="Finishing Early">
      <div className="col gap-2">
        <p className="small" style={{ margin: 0 }}>{EARLY_DEGREE.words}</p>
        <Fine>{EARLY_DEGREE.source}</Fine>
      </div>
    </Panel>
  );
}
