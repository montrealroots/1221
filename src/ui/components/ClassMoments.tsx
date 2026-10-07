/**
 * The class's moments on the School's Coursework tab (`systems/classmates.ts`,
 * from 2026-10-08): what a classmate has brought you and is waiting on an
 * answer for, each answer a button with the reason it can't be given where it
 * can't; and the last few moments had, and how you answered.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatDate, formatTime } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { YALE_DRAMA } from '@/engine/content/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { CHOICES, MOMENT_TITLE, momentsOf, respondRefusal } from '@/engine/systems/classmates';

const zone = () => CITIES.require(YALE_DRAMA.cityId).timeZone;

export function ClassMoments() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cw = courseworkOf(sim, person);
  if (!cw) return null;
  const all = momentsOf(cw);
  const open = all.filter((m) => m.status === 'open');
  const past = all.filter((m) => m.status !== 'open').slice(-6).reverse();
  if (!open.length && !past.length) return null;
  const answerOf = (kind: keyof typeof CHOICES, id?: string) => CHOICES[kind].find((c) => c.id === id)?.label;
  return (
    <Panel title="Your Class" subtitle="What classmates bring you, and how you answered">
      <div className="col gap-3">
        {open.map((m) => {
          const mate = person.school!.classmates[m.mate]!;
          return (
            <div key={m.id} className="col gap-1">
              <div className="small"><strong>{mate.name}: {MOMENT_TITLE[m.kind]}.</strong> {m.text} <span className="xs dim">Answer by {formatTime(m.until, zone())}, {formatDate(m.until, zone())}.</span></div>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {CHOICES[m.kind].map((c) => {
                  const no = respondRefusal(sim, person, m, c.id);
                  return (
                    <Gated key={c.id} feature="school.respond" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? c.label}
                      onClick={() => { const r = run<{ done: string }>('school.respond', { momentId: m.id, choice: c.id }); if (r.ok) toast(r.value!.done, 'neutral'); }}>
                      {c.label}
                    </Gated>
                  );
                })}
              </div>
            </div>
          );
        })}
        {past.map((m) => (
          <div key={m.id} className="xs dim">
            {formatDate(m.at, zone())}, {person.school!.classmates[m.mate]!.name}: {MOMENT_TITLE[m.kind]}{m.status === 'answered' ? ` · ${answerOf(m.kind, m.choice)}` : m.status === 'lapsed' ? ' · Not Answered' : ''}
          </div>
        ))}
        <Fine>Who brings what follows what each classmate cares about and what has happened between you; how often a moment comes, and what each answer does to their trust and your bond, are SLATE’s estimate.</Fine>
      </div>
    </Panel>
  );
}
