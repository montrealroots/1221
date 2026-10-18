/**
 * SLATE — a classmate, opened (from 2026-10-12).
 *
 * Until then a partner’s preparation, reliability and trust were read by the scene together (`systems/ensemble.ts`)
 * and shown as a line on the Coursework tab’s Your Partners, with nothing to open into; the connected-journey pass’s
 * critic found it (`docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md`, item 20). A classmate’s look says what the
 * scene together reads of them, on each piece of work you share: their preparation, their timing and their
 * reliability, beside what’s happened between you. Their own figures are the game’s; nothing here is drawn to show.
 */
import { dateKey, formatDate } from '@/engine/core/time';
import { plural } from '@/engine/core/text';
import { CITIES } from '@/engine/content/geography';
import { YALE_DRAMA } from '@/engine/content/school';
import { templateById } from '@/engine/content/coursework';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { WORK, mateRecord, partnerReadOf, trustOf } from '@/engine/systems/coursework';
import { PRIORITY_WORDS, boundaryLiftsAfter, personOf, sharedWork } from '@/engine/systems/classmates';
import { bondWord, type Classmate } from '@/engine/systems/school';
import { defineLook, type Way } from './registry';
import { at } from './subject';

const zone = () => CITIES.require(YALE_DRAMA.cityId).timeZone;
const pct = (x: number) => `${Math.round(x * 100)}%`;

interface TheClassmate { person: Person; mate: Classmate; i: number }

/** The player’s classmate by place in the class, while there’s a school. */
function classmate(sim: Simulation, id: string): TheClassmate | undefined {
  const person = sim.universe.people[sim.universe.playerId];
  const i = Number(id);
  const mate = person?.school?.classmates[i];
  return person && Number.isInteger(i) && mate ? { person, mate, i } : undefined;
}

defineLook<TheClassmate>('classmate', {
  gone: 'There’s no such classmate in your class.',
  resolve: (sim, id) => classmate(sim, id),
  seeds: (sim) => { const p = sim.universe.people[sim.universe.playerId]; return (p?.school?.classmates ?? []).slice(0, 3).map((_, i) => String(i)); },
  look: ({ person, mate, i }, { sim }) => {
    const r = mateRecord(mate);
    const p = personOf(mate);
    const trust = trustOf(mate);
    const came = r.kept ?? 0;
    const asked = came + (r.stoodUp ?? 0);
    const bond = bondWord(mate.bond);
    const today = dateKey(sim.now, zone());
    const shared = sharedWork(sim, person, i).map((a) => ({ a, read: partnerReadOf(sim, person, a, today) }));
    const ways: Way[] = [
      { to: at('school', YALE_DRAMA.id), label: 'The School', detail: 'Your class, your standing and the term' },
      ...shared.map(({ a }) => ({ to: at('assignment', a.id), label: templateById(a.template)?.title ?? a.template, detail: 'The work you share with them, and how far each part of it stands' })),
    ];
    return {
      name: mate.name,
      kind: 'A Classmate',
      // The rehearsals counted in the singular at one (from 2026-10-17, brief 14's dynamic cases: until then “Came to 1 of 1
      // rehearsals”, and a boundary “lifts after 1 more rehearsals kept”).
      summary: `${asked ? `Came to ${came} of ${plural(asked, 'rehearsal')} with you` : 'You haven’t rehearsed together yet'}; their trust in you is ${Math.round(trust)} of 100${r.reliability !== undefined ? `, and they come through ${pct(r.reliability)} of the time` : ''}.${bond ? ` ${bond}.` : ''}`,
      parent: at('school', YALE_DRAMA.id),
      body: (
        <div className="col gap-3">
          {shared.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">The Work You Share</th><th scope="col" className="num">Their Preparation</th><th scope="col" className="num">Their Timing</th><th scope="col" className="num">Readings Agree</th></tr></thead>
                <tbody>
                  {shared.map(({ a, read }) => (
                    <tr key={a.id}>
                      <td className="small">{templateById(a.template)?.title ?? a.template}</td>
                      <td className="num mono">{read ? pct(read.prep) : '—'}</td>
                      <td className="num mono">{read ? pct(read.timing) : '—'}</td>
                      <td className="num mono">{read ? (read.agree < 1 ? 'Held Apart' : 'Yes') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ul className="small" style={{ margin: 0, paddingLeft: 'var(--s4)' }}>
            {p.priority && <li>Cares most about {PRIORITY_WORDS[p.priority].toLowerCase()}.</li>}
            {p.boundary && <li>Wants a day’s notice: that lifts after {(() => { const n = Math.max(0, boundaryLiftsAfter(p.boundary) - p.boundary.keptSince); return `${n} more ${n === 1 ? 'rehearsal' : 'rehearsals'}`; })()} kept.</li>}
            {(r.missedByYou ?? 0) > 0 && <li>You missed {r.missedByYou} rehearsal{r.missedByYou === 1 ? '' : 's'} with them.</li>}
            {(r.log ?? []).slice(0, 5).map((x) => <li key={`${x.at}-${x.what}`}>{formatDate(x.at, zone())}: {x.what}</li>)}
          </ul>
        </div>
      ),
      ways,
      provenance: `How a scene goes together depends on their preparation, timing and reliability; your own result never does. Trust starts at ${WORK.trust.start}: a rehearsal kept +${WORK.trust.kept}, missed −${-WORK.trust.missed}, called off late −${-WORK.trust.lateCancel}.`,
    };
  },
});
