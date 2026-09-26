/**
 * SLATE — drama school: where the life began, and what the school pays
 * (`systems/school.ts`, `content/school.ts`).
 *
 * The student's place (the program, the class, the year, who leads it), the
 * six terms and when each begins, and the award, term by term, as it stands
 * on the student's Yale account: what's billed, what the scholarships meet,
 * and what's paid out to the bank.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty } from '@/ui/components/primitives';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, instantFromZoned } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { COST_2026_27, ORIENTATION_2026, YALE_DRAMA } from '@/engine/content/school';
import { termAccount, termName, termStart, yearOfStudy } from '@/engine/systems/school';

export function SchoolWorkspace() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school;
  if (!school) return <Empty title="No School" body="This life didn’t begin at drama school." />;
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const zone = CITIES.require(YALE_DRAMA.cityId).timeZone;
  const day = (d: { year: number; month: number; day: number }) => formatDate(instantFromZoned({ ...d, hour: 12 }, zone), zone);
  const account = termAccount(cur);
  const dean = YALE_DRAMA.dean;
  const terms = Array.from({ length: YALE_DRAMA.terms }, (_, i) => ({ i, ...termStart(i) }));
  const orientationAhead = sim.now < instantFromZoned({ ...ORIENTATION_2026.classesBegin, hour: 9 }, zone);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your School</div>
        <h1>{YALE_DRAMA.name}</h1>
        <p className="muted">
          {YALE_DRAMA.degree} in {YALE_DRAMA.program}, class of {school.classOf}. {school.termsBegun === 0 ? 'Arriving for the fall term.' : `Year ${yearOfStudy(person)} of three.`}
        </p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
        <Panel title="Your Place" subtitle={`One of ${YALE_DRAMA.classSize} actors admitted this year`}>
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              The faculty saw you at the auditions and wanted you more than anyone else that year. The school won you with an award that covers your whole cost of attendance, with nothing to borrow.
            </p>
            <p className="small" style={{ margin: 0 }}>
              {dean.name}: {dean.title}, since {formatDate(Date.parse(`${dean.since}T12:00:00Z`), zone)}. {YALE_DRAMA.actingChair.name}: {YALE_DRAMA.actingChair.title}.
            </p>
            {orientationAhead && (
              <p className="small" style={{ margin: 0 }}>
                Orientation runs from {day(ORIENTATION_2026.begins)} to {day(ORIENTATION_2026.ends)}, and classes begin {day(ORIENTATION_2026.classesBegin)} at 9 a.m.
              </p>
            )}
            <p className="xs dim" style={{ margin: 0 }}>Source: {YALE_DRAMA.source}.</p>
          </div>
        </Panel>

        <Panel title="Your Terms" subtitle={`${school.termsBegun} of ${YALE_DRAMA.terms} begun`}>
          <div className="col gap-2">
            {terms.map((t) => (
              <div key={t.i} className="row-between small">
                <span>{termName(t.i)}</span>
                <span className={t.i < school.termsBegun ? 'dim' : ''}>
                  {t.i < school.termsBegun ? 'Begun ' : 'Begins '}{day(t.date)}{t.estimate ? ', SLATE’s estimate' : ''}
                </span>
              </div>
            ))}
            <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
              The 2026–2027 dates are the Yale Bulletin’s. Later years aren’t published yet, so they’re SLATE’s estimate by the same pattern.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Your Award" subtitle="Each term, on your Yale student account">
        <div className="col gap-3">
          <div className="table-scroll">
            <table className="award">
              <thead>
                <tr><th scope="col">Each term</th><th scope="col" className="num">Billed</th><th scope="col" className="num">Credited</th></tr>
              </thead>
              <tbody>
                <tr><td>Tuition</td><td className="num mono">{money(account.tuition)}</td><td /></tr>
                <tr><td>Tuition scholarship, from the David Geffen gift</td><td /><td className="num mono">{money(account.tuition)}</td></tr>
                <tr><td>Yale Health hospitalization and specialty plan</td><td className="num mono">{money(account.healthPlan)}</td><td /></tr>
                <tr><td>Living-expense scholarship, for living expenses and books</td><td /><td className="num mono">{money(account.livingScholarship)}</td></tr>
                <tr className="strong"><td>Paid to your bank at the start of the term</td><td /><td className="num mono">{money(account.refund)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="small" style={{ margin: 0 }}>
            A year costs {money(COST_2026_27.tuition + COST_2026_27.livingExpenses + COST_2026_27.books)} to attend, and the award meets all of it: tuition, {money(COST_2026_27.livingExpenses)} of living expenses with the health plan, and {money(COST_2026_27.books)} of books and supplies. There’s nothing to borrow and nothing to repay.
          </p>
          <p className="xs dim" style={{ margin: 0 }}>
            The {COST_2026_27.year} figures are the school’s; later years will cost more, and until they’re published the award holds at these. Books and supplies run $913 to $2,373 by program, and the school doesn’t say an actor’s, so the award takes the most. Yale’s usual top award includes a $9,500 first-year loan; this one doesn’t. Source: {COST_2026_27.source}.
          </p>
        </div>
      </Panel>
    </>
  );
}
