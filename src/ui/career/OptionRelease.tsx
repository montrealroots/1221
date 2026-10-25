/**
 * SLATE — an offer on days an option holds (from 2026-10-25, the owner's brief 27, loop 20: "a conflicting opportunity
 * arrives → evaluate permitted responses → release, exercise, negotiate, or decline according to the arrangement";
 * `systems/continuity.ts`). Drawn on an offer only where a production's open option holds some of its days: the option's
 * hold is said by the offer's warning, and this is its one control, Ask To Be Released (`pro.ask_option_release`), with
 * its refusal said beside it. Declining the offer and accepting it, which gives the option up, are the offer's own.
 */

import { useGame, useWorld } from '@/app/game-context';
import { SectionHead, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatWeekdayDate } from '@/engine/core/time';
import type { Opportunity } from '@/engine/systems/pro';
import { datesOf, projectOf, spansOf } from '@/engine/systems/projobs';
import { heldOptions, optionReleaseRefusal } from '@/engine/systems/continuity';

const NY = 'America/New_York';

export function OptionRelease({ o }: { o: Opportunity }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  if (o.status !== 'offered') return null;
  const held = heldOptions(person, spansOf(person, projectOf(o), datesOf(o)));
  if (!held.length) return null;
  const no = optionReleaseRefusal(sim, person, o);
  return (
    <div className="col gap-2">
      <SectionHead title="An Option Holds Some Of These Days" help="career.series" />
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="pro.ask_option_release" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const x = run<{ answerAt: number }>('pro.ask_option_release', { opportunityId: o.id }); if (x.ok) toast(`Asked. The answer comes on ${formatWeekdayDate(x.value!.answerAt, NY)}.`, 'positive'); }}>Ask To Be Released</Gated>
      </div>
      <WhyNot reasons={[['Ask To Be Released', no]]} />
    </div>
  );
}
