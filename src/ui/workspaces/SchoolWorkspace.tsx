/**
 * SLATE — drama school: the student's standing, classes, casting, work-study
 * and terms (`systems/school.ts`, `content/school.ts`), in five tabs.
 *
 * Every figure here is one the school system reads or writes: the craft the
 * classes grow and the chair casts by, the attendance and growth the term's
 * evaluation weighs, the calls a casting puts on the calendar, the hours
 * Friday's pay is counted from, and what each term bills and credits. Until
 * 2026-09-26 it was one page saying where the student was and what the award
 * paid, and said the award covered the whole cost of attendance, which Yale
 * doesn't do for a family with means.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Stat } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, formatDateTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { COST_2026_27, COURSES, SCHOOL_SEASON, SEAGULL_2027, SKILLS, SUMMER_CABARET, WORK_STUDY, YALE_CABARET, YALE_DRAMA, type Skill } from '@/engine/content/school';
import {
  CABARET_KIND, CALL_KIND, ESTIMATE, EVALUATION_KIND, LAB_KIND, SHIFT_KIND, STANDING_LABEL,
  cabaretSeason, classPeriod, coursesOn, daysOffIn, hasNeed, nextClasses, hourlyIn, meanCraft, rankIn, termAccount, termLabel, termOf, termStart, timetable, yearOfStudy, yearOfTerm, cabaretRefusal, shiftRefusal, summerRefusal } from '@/engine/systems/school';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { inSaveMoney } from '@/engine/systems/banking';

type SchoolTab = 'standing' | 'classes' | 'casting' | 'work' | 'terms';

const SCHOOL_TABS: readonly { id: SchoolTab; label: string }[] = [
  { id: 'standing', label: 'Standing And Craft' },
  { id: 'classes', label: 'Classes' },
  { id: 'casting', label: 'Casting' },
  { id: 'work', label: 'Shifts And Pay' },
  { id: 'terms', label: 'Terms And Award' },
];

const zone = () => CITIES.require(YALE_DRAMA.cityId).timeZone;
const dayOf = (d: { year: number; month: number; day: number }) => formatDate(instantFromZoned({ ...d, hour: 12 }, zone()), zone());
const pct = (x: number) => `${Math.round(x * 100)}%`;
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] ?? 0; };

/** The student's school items still ahead, of some kinds, soonest first. */
function ahead(sim: Simulation, person: Person, kinds: readonly string[]) {
  return sim.universe.scheduled
    .filter((item) => item.status === 'pending' && kinds.includes(item.kind) && item.payload.personId === person.id)
    .sort((a, b) => a.at - b.at);
}

export function SchoolWorkspace() {
  const person = useWorld((s) => s.player);
  const [tab, setTab] = useState<SchoolTab>('standing');
  const school = person.school;
  if (!school || !person.craft) return <Empty title="No School" body="This life didn’t begin at drama school." />;
  const where = school.standing === 'graduated' ? 'Graduated.' : school.termsBegun === 0 ? 'Arriving for the fall term.' : `Year ${yearOfStudy(person)} of three, ${STANDING_LABEL[school.standing].toLowerCase()}.`;

  const panes: Record<SchoolTab, JSX.Element> = {
    standing: <StandingPane />,
    classes: <ClassesPane />,
    casting: <CastingPane />,
    work: <WorkPane />,
    terms: <TermsPane />,
  };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your School</div>
        <h1>{YALE_DRAMA.name}</h1>
        <p className="muted">{YALE_DRAMA.degree} in {YALE_DRAMA.program}, class of {school.classOf}. {where}</p>
      </div>
      <SchoolTabs tab={tab} onTab={setTab} />
      <div role="tabpanel" id={`school-pane-${tab}`} aria-labelledby={`school-tab-${tab}`} tabIndex={0}>
        {panes[tab]}
      </div>
    </>
  );
}

/** The tabs, as a tab list: arrows move between them, Home and End go to the ends. */
function SchoolTabs({ tab, onTab }: { tab: SchoolTab; onTab: (tab: SchoolTab) => void }) {
  const go = (index: number) => {
    const next = SCHOOL_TABS[(index + SCHOOL_TABS.length) % SCHOOL_TABS.length]!;
    onTab(next.id);
    document.getElementById(`school-tab-${next.id}`)?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label="Your School">
      {SCHOOL_TABS.map((one, i) => (
        <button
          key={one.id}
          id={`school-tab-${one.id}`}
          type="button"
          role="tab"
          className="tab"
          aria-selected={one.id === tab}
          aria-controls={`school-pane-${one.id}`}
          tabIndex={one.id === tab ? 0 : -1}
          onClick={() => onTab(one.id)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
            else if (e.key === 'Home') { e.preventDefault(); go(0); }
            else if (e.key === 'End') { e.preventDefault(); go(SCHOOL_TABS.length - 1); }
          }}
        >
          {one.label}
        </button>
      ))}
    </div>
  );
}

/** Standing, this term's tally against the floors, the craft against the class, and the evaluations. */
function StandingPane() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const craft = person.craft!;
  const t = school.tally;
  const expected = (t.classDays - t.excused) + t.calls + t.shifts;
  const attendance = expected > 0 ? (t.attended + t.answered + t.worked) / expected : undefined;
  const growth = meanCraft(craft) - meanCraft(t.craftAtStart);
  const classGrowth = median(school.classmates.map((m, i) => meanCraft(m.craft) - (t.classAtStart[i] ?? meanCraft(m.craft))));
  const evaluation = ahead(sim, person, [EVALUATION_KIND])[0];
  const skills: { id?: Skill; label: string; mine: number; theirs: number[] }[] = [
    ...SKILLS.map((s) => ({ id: s.id, label: s.label, mine: craft[s.id], theirs: school.classmates.map((m) => m.craft[s.id]) })),
    { label: 'Overall', mine: meanCraft(craft), theirs: school.classmates.map((m) => meanCraft(m.craft)) },
  ];

  return (
    <div className="col gap-5">
        <Panel title="Your Standing" subtitle={evaluation ? `Evaluated ${formatDate(evaluation.at, zone())}` : undefined}>
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Standing" value={STANDING_LABEL[school.standing]} tone={school.standing === 'good' || school.standing === 'graduated' ? undefined : 'warning'} />
              <Stat label="Attendance This Term" value={attendance === undefined ? 'None Yet' : pct(attendance)} note={`${pct(ESTIMATE.attendanceFloor)} is the floor`} tone={attendance !== undefined && attendance < ESTIMATE.attendanceFloor ? 'warning' : undefined} />
              <Stat label="Growth This Term" value={growth.toFixed(1)} note={`The class’s ${classGrowth.toFixed(1)}; half of it is the floor`} tone={classGrowth > 0 && growth < ESTIMATE.growthFloor * classGrowth ? 'warning' : undefined} />
            </div>
            <p className="small" style={{ margin: 0 }}>
              Attendance counts {t.attended} of {t.classDays - t.excused} class days{t.excused ? ` (${t.excused} excused)` : ''}, {t.answered} of {t.calls} calls and {t.worked} of {t.shifts} assigned shifts. Short of either floor at the evaluation, standing falls a step, from good to concern, to warning, to dismissal; meeting both restores it. A missed performance or understudy call goes straight to warning{t.breaches ? `, and this term has had ${t.breaches === 1 ? 'one' : t.breaches}` : ''}.
            </p>
            <p className="small" style={{ margin: 0 }}>{school.castable ? 'In the casting pool.' : 'Out of the casting pool after missed rehearsal calls, until a good evaluation.'}</p>
            <p className="xs dim" style={{ margin: 0 }}>The stages are the Yale Bulletin’s. The floors are SLATE’s reading of its “appropriate standards”.</p>
          </div>
        </Panel>

        <Panel title="Your Faculty">
          <div className="col gap-2 small">
            <div>{YALE_DRAMA.dean.name}: {YALE_DRAMA.dean.title}, since {formatDate(Date.parse(`${YALE_DRAMA.dean.since}T12:00:00Z`), zone())}.</div>
            <div>{YALE_DRAMA.actingChair.name}: {YALE_DRAMA.actingChair.title}, who casts every student and meets any whose standing falls.</div>
            <p className="xs dim" style={{ margin: 0 }}>Source: {YALE_DRAMA.source}.</p>
          </div>
        </Panel>

      <Panel title="Your Craft Against The Class" subtitle={`You and ${school.classmates.length} classmates, 0 to 100`}>
        <div className="col gap-3">
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th scope="col">Area</th><th scope="col" className="num">You</th><th scope="col" className="num">Class Best</th><th scope="col" className="num">Class Median</th><th scope="col" className="num">Your Place</th></tr>
              </thead>
              <tbody>
                {skills.map((row) => (
                  <tr key={row.label} className={row.id ? undefined : 'strong'}>
                    <td>{row.label}</td>
                    <td className="num mono">{row.mine.toFixed(1)}</td>
                    <td className="num mono">{Math.max(...row.theirs).toFixed(1)}</td>
                    <td className="num mono">{median(row.theirs).toFixed(1)}</td>
                    <td className="num mono">{rankIn(person, row.id)} of {YALE_DRAMA.classSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="xs dim" style={{ margin: 0 }}>
            The faculty wanted you most from this year’s auditions, and you began ahead of every classmate in every area. Classes, rehearsals and performances grow craft, more when you come rested and less the better you already are; your classmates grow too. The scale and the rates are SLATE’s.
          </p>
        </div>
      </Panel>

      <Panel title="Evaluations">
        {school.history.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th scope="col">Term</th><th scope="col">Standing</th><th scope="col" className="num">Attendance</th><th scope="col" className="num">Growth</th><th scope="col" className="num">Class Growth</th><th scope="col">Why</th></tr>
              </thead>
              <tbody>
                {school.history.map((r) => (
                  <tr key={r.term}>
                    <td>{termLabel(r.term)}</td>
                    <td>{STANDING_LABEL[r.standing]}</td>
                    <td className="num mono">{pct(r.attendance)}</td>
                    <td className="num mono">{r.growth.toFixed(1)}</td>
                    <td className="num mono">{r.classGrowth.toFixed(1)}</td>
                    <td className="small">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>None yet. The faculty evaluate every student at the end of each term’s classes.</p>
        )}
      </Panel>
    </div>
  );
}

const SLOTS = ['9 a.m.', '11 a.m.', '1 p.m.'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/** The term's week, the courses, the class days, and calling in sick. */
function ClassesPane() {
  const { sim, run, toast } = useGame();
  const p = zonedParts(sim.now, zone());
  const today = { year: p.year, month: p.month, day: p.day };
  const term = Math.min(termOf(today), YALE_DRAMA.terms - 1);
  const year = yearOfTerm(term);
  const fall = termStart(term).fall;
  const week = timetable(year, fall ? 'fall' : 'spring');
  const period = classPeriod(term);
  const next = nextClasses(sim.now);
  const off = daysOffIn(term);
  const classToday = coursesOn(today).length > 0;
  const courses = COURSES.filter((c) => c.year === year);
  const skillLabel = (id: Skill) => SKILLS.find((s) => s.id === id)!.label;

  return (
    <div className="col gap-5">
      <Panel
        title={`Your Week, ${termLabel(term)}`}
        subtitle={`Year ${year}: nine to three on class days`}
        actions={classToday ? (
          <Gated feature="school.call_in_sick" onClick={() => { if (run('school.call_in_sick').ok) toast('You called in sick: today’s absence is excused.', 'positive'); }}>Call In Sick</Gated>
        ) : undefined}
      >
        <div className="col gap-3">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Day</th>{SLOTS.map((s) => <th key={s} scope="col">{s}</th>)}</tr></thead>
              <tbody>
                {week.map((day, i) => (
                  <tr key={WEEKDAYS[i]}>
                    <td>{WEEKDAYS[i]}</td>
                    {SLOTS.map((s, j) => <td key={s}>{day[j]?.name ?? ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small" style={{ margin: 0 }}>
            {next ? `Next classes: ${formatDateTime(next, zone())}.` : 'No classes ahead.'} This term’s classes run {dayOf(period.from)} to {dayOf(period.to)}, less {off} breaks for holidays, Community Days, work periods and recesses. Asleep or away from New Haven at nine is an absence; calling in sick excuses it when you’re unwell (condition under {ESTIMATE.sickBelow}) or down with the flu, and not otherwise; a day in hospital is excused of itself.
          </p>
          <p className="xs dim" style={{ margin: 0 }}>
            {period.estimate ? 'This term’s dates are SLATE’s estimate by the 2026–2027 pattern. ' : 'The class days are the Yale Bulletin’s. '}The courses are the Bulletin’s; how often each meets isn’t published, and the week is SLATE’s estimate.
          </p>
        </div>
      </Panel>

      <Panel title={`Year ${year} Courses`} subtitle="Required, every term they run">
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Code</th><th scope="col">Course</th><th scope="col">Taught By</th><th scope="col">Trains</th><th scope="col" className="num">A Week</th><th scope="col">Terms</th></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.code}>
                  <td className="mono">{c.code}</td>
                  <td>{c.name}</td>
                  <td>{c.teachers}</td>
                  <td>{skillLabel(c.skill)}</td>
                  <td className="num mono">{c.perWeek}</td>
                  <td>{c.terms.length === 2 ? 'Fall And Spring' : c.terms[0] === 'fall' ? 'Fall' : 'Spring'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/** What the chair cast the student in, and the calls it puts on the calendar. */
const KIND_WORDS: Record<string, string> = {
  thesis: 'A directors’ thesis production', hughes: 'The Langston Hughes Festival', shakespeare: 'A Shakespeare Repertory Project',
  carlotta: 'The Carlotta Festival', project: 'A School project', understudy: 'Understudying at Yale Rep', role: 'In the company at Yale Rep',
};

/** Whether the kind's words only say the production's name again, as the festivals' do. */
const repeats = (c: { production: string; kind: string }) => c.production.startsWith((KIND_WORDS[c.kind] ?? '-').replace(/^(A|The) /, ''));

function CastingPane() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  // Casting's calls and the labs', all of them for the counts, the next eight listed.
  const every = ahead(sim, person, [CALL_KIND, LAB_KIND]).filter((c) => c.payload.call !== 'oncall');
  const calls = every.slice(0, 8);
  const onCall = ahead(sim, person, [CALL_KIND]).filter((c) => c.payload.call === 'oncall');
  // This term’s, while at school: the last production stayed on the tab after the degree until 2026-09-27.
  const enrolled = school.standing !== 'graduated' && school.standing !== 'dismissed';
  const castings = [school.casting, school.rep].filter((c): c is NonNullable<typeof c> => c !== undefined && enrolled && c.term === school.termsBegun - 1);

  return (
    <div className="col gap-5">
      {castings.map((casting) => (
        <Panel key={casting.production} title={casting.production} subtitle={repeats(casting) ? undefined : KIND_WORDS[casting.kind]}>
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Role" value={casting.kind === 'understudy' ? `${casting.role} (Understudy)` : casting.role} />
              <Stat label={casting.kind === 'understudy' ? 'Went On' : 'Performed'} value={String(casting.performed)} />
              <Stat label="Calls Ahead" value={String(casting.kind === 'understudy' ? onCall.length : every.filter((c) => c.label.startsWith(casting.production)).length)} />
            </div>
            {casting.kind === 'understudy' && casting.production === SEAGULL_2027.name && (
              <p className="small" style={{ margin: 0 }}>
                {SEAGULL_2027.name}, {SEAGULL_2027.by}, directed by {SEAGULL_2027.director}: rehearsals from {dayOf(parseDay(SEAGULL_2027.rehearsals.from))}, performances {dayOf(parseDay(SEAGULL_2027.run.from))} to {dayOf(parseDay(SEAGULL_2027.run.to))}. You’re on call at all {onCall.length} performances still ahead: in New Haven and awake, or it’s a grave breach if you’re needed.
              </p>
            )}
          </div>
        </Panel>
      ))}
      {castings.length === 0 && (
        <Panel title="Not Cast Yet">
          <p className="small" style={{ margin: 0 }}>
            {school.castable
              ? 'The chair casts every student each term from the first spring: the Carlotta Festival then; a thesis or the Hughes Festival in a second-year’s and a third-year’s fall; a thesis or the Carlotta Festival in the second spring; a Shakespeare Repertory Project in the last spring; and once a year, for a student in good standing, Yale Rep.'
              : 'Out of the casting pool after missed rehearsal calls. A good evaluation puts you back.'}
          </p>
        </Panel>
      )}
      <p className="xs dim" style={{ margin: 0 }}>
        Casting is the Bulletin’s: the chair assigns every role, balancing each student’s needs, a student cast fulfils it, missed calls take an actor out of the pool, and a missed performance is a grave breach. The 2026–27 theses and {SEAGULL_2027.name} are the School’s and Yale Rep’s own dates; the festivals’ and later years’ dates, the rehearsal weeks and which production goes to whom are SLATE’s estimate. Source: {SCHOOL_SEASON.source}.
      </p>

      <CabaretPanel />
      <SummerPanel />

      {calls.length > 0 && (
        <Panel title="Calls Ahead">
          <div className="col gap-2">
            {calls.map((c) => (
              <div key={c.id} className="row-between small">
                <span>{c.label}</span>
                <span className="mono">{formatDateTime(c.at, zone())}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/** The Yale Cabaret: a show this term, on the chair's approval, clear of casting. */
function CabaretPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const term = school.termsBegun - 1;
  const mine = school.cabaret?.term === term ? school.cabaret : undefined;
  const calls = ahead(sim, person, [CABARET_KIND]);
  return (
    <Panel
      title="The Yale Cabaret"
      subtitle={mine ? `Your show plays the week of ${dayOf(parseDay(mine.week))}` : cabaretSeason(Math.max(0, term))}
      actions={mine || cabaretRefusal(person) ? undefined : <Gated feature="school.cabaret" onClick={() => { const a = run<{ week: string }>('school.cabaret'); if (a.ok) toast(`In the Cabaret: your show plays the week of ${dayOf(parseDay(a.value!.week))}.`, 'positive'); }}>Join A Cabaret Show</Gated>}
    >
      <div className="col gap-3">
        {mine && <Stat label="Performed" value={`${mine.performed} of ${YALE_CABARET.shows.length}`} note={`${calls.length} calls ahead`} />}
        <p className="xs dim" style={{ margin: 0 }}>
          The students’ own theater at 217 Park Street: a new show each production week, Thursday to Saturday at eight and Friday and Saturday at eleven too, unpaid. The chair approves it, nobody on academic warning may take part, and it never wins a conflict with classes, casting or work-study, so SLATE finds you a week clear of all three. The rehearsals, {YALE_CABARET.rehearsalEvenings} weekday evenings before it, and one show a term are SLATE’s estimate. Source: {YALE_CABARET.source}.
        </p>
      </div>
    </Panel>
  );
}

/** The Summer Cabaret: the summer's company, for a student with a year to come. */
function SummerPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const school = person.school!;
  const summer = school.summer && school.summer.until > sim.now ? school.summer : undefined;
  return (
    <Panel
      title="The Yale Summer Cabaret"
      subtitle={summer ? (summer.out ? 'You left the company' : `In the ${summer.year} company, to ${formatDate(summer.until, zone())}`) : 'Three shows a summer in New Haven'}
      actions={summer || summerRefusal(sim, person) ? undefined : <Gated feature="school.summer_cabaret" onClick={() => { if (run('school.summer_cabaret').ok) toast('In this summer’s company.', 'positive'); }}>Join The Summer Company</Gated>}
    >
      <p className="xs dim" style={{ margin: 0 }}>
        Three shows between late June and late August, evenings at eight and Saturdays at two, with afternoon rehearsals in the three weeks before each. It pays {formatMoney(inSaveMoney(sim, SUMMER_CABARET.stipendWeekly, 'USD'), cur)} a week, SLATE’s estimate, as are later summers’ dates and the company taking a student in good standing who asks by the end of April: neither how it’s chosen nor what it pays is published. A missed performance and the company goes on without you. The summer is yours: the Bulletin limits outside work only while classes are in session. Source: {SUMMER_CABARET.source}.
      </p>
    </Panel>
  );
}

const parseDay = (key: string) => { const [year, month, day] = key.split('-').map(Number); return { year: year!, month: month!, day: day! }; };

/** The year's hours, the shifts ahead, Friday's pay, and asking for an elective evening. */
function WorkPane() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const work = person.school!.workStudy;
  const cur = saveCurrency(sim.universe);
  const shifts = ahead(sim, person, [SHIFT_KIND]).slice(0, 6);
  const rate = hourlyIn(cur);

  return (
    <Panel
      title="Work-Study"
      subtitle={`${WORK_STUDY.assignedHours} assigned hours and up to ${WORK_STUDY.electiveHours} elective a year`}
      actions={shiftRefusal(person) ? undefined : <Gated feature="school.take_shift" onClick={() => { const a = run<{ at: number }>('school.take_shift'); if (a.ok && a.value) toast(`Front of house, ${formatDateTime(a.value.at, zone())}.`, 'positive'); }}>Take An Elective Shift</Gated>}
    >
      <div className="col gap-3">
        <div className="grid grid-3">
          <Stat label="Hours This Year" value={String(work.yearHours)} note={`Of ${WORK_STUDY.assignedHours + WORK_STUDY.electiveHours} at most`} />
          <Stat label="Elective Hours Asked For" value={`${work.electiveHours} of ${WORK_STUDY.electiveHours}`} />
          <Stat label="Owed On Friday" value={formatMoney(Math.round(work.owedHours * rate), cur)} note={`${work.owedHours} hours at ${formatMoney(rate, cur)} an hour`} />
        </div>
        {shifts.length > 0 && (
          <div className="col gap-2">
            {shifts.map((s) => (
              <div key={s.id} className="row-between small">
                <span>{s.label}</span>
                <span className="mono">{formatDateTime(s.at, zone())}</span>
              </div>
            ))}
          </div>
        )}
        <p className="small" style={{ margin: 0 }}>
          Every student works: six hours each Saturday of the class weeks, assigned, and elective evenings of four hours front of house at Yale Rep when you ask for them. Hours are paid on Friday for the week, by direct deposit, so your bank counts them as wages. A shift you’re not there for isn’t paid, and a missed assigned one counts against your attendance.
        </p>
        <p className="xs dim" style={{ margin: 0 }}>The hours and the rate are the school’s. Which Saturdays and evenings are SLATE’s estimate. Source: {WORK_STUDY.source}.</p>
      </div>
    </Panel>
  );
}

/** The six terms, and what each bills and credits on the Yale account. */
function TermsPane() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const need = hasNeed(person);
  // The term they're in, as the engine bills it; until 2026-09-27 the first year's, whatever the year.
  const current = Math.max(0, Math.min(YALE_DRAMA.terms - 1, school.termsBegun - 1));
  const account = termAccount(cur, need, current);
  const terms = Array.from({ length: YALE_DRAMA.terms }, (_, i) => ({ i, ...termStart(i) }));

  return (
    <div className="grid grid-2">
      <Panel title="Your Terms" subtitle={`${school.termsBegun} of ${YALE_DRAMA.terms} begun`}>
        <div className="col gap-2">
          {terms.map((t) => (
            <div key={t.i} className="row-between small">
              <span>{termLabel(t.i)}</span>
              <span className={t.i < school.termsBegun ? 'dim' : ''}>
                {t.i < school.termsBegun ? 'Began ' : 'Begins '}{dayOf(t.date)}{t.estimate ? ', SLATE’s estimate' : ''}
              </span>
            </div>
          ))}
          <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
            The 2026–2027 dates are the Yale Bulletin’s. Later years aren’t published yet, so they’re SLATE’s estimate by the same pattern.
          </p>
        </div>
      </Panel>

      <Panel title="Your Yale Account" subtitle={termLabel(current)}>
        <div className="col gap-3">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Each Term</th><th scope="col" className="num">Billed</th><th scope="col" className="num">Credited</th></tr></thead>
              <tbody>
                <tr><td>Tuition</td><td className="num mono">{money(account.tuition)}</td><td /></tr>
                <tr><td>Tuition Scholarship</td><td /><td className="num mono">{money(account.tuition)}</td></tr>
                <tr><td>Yale Health Plan</td><td className="num mono">{money(account.healthPlan)}</td><td /></tr>
                {need && <tr><td>Living-Expense Scholarship</td><td /><td className="num mono">{money(account.livingScholarship)}</td></tr>}
                <tr className="strong">
                  <td>{need ? 'Paid To Your Bank' : 'Paid From Your Bank'}</td>
                  <td className="num mono">{need ? '' : money(account.healthPlan)}</td>
                  <td className="num mono">{need ? money(account.refund) : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="small" style={{ margin: 0 }}>
            Tuition is met in full for every student, from the David Geffen gift. Aid for living costs, {money(inSaveMoney(sim, COST_2026_27.livingExpenses, 'USD'))} a year with the health plan and up to {money(inSaveMoney(sim, COST_2026_27.books, 'USD'))} of books, goes by need, and the need assessment reads the family’s means. {need ? 'Yours found need, and the scholarship meets it.' : 'Yours found none, so the health plan and living costs come from your bank.'}
          </p>
          <p className="xs dim" style={{ margin: 0 }}>The {COST_2026_27.year} figures are the school’s; later years grow at the Bulletins’ own rise from 2022–23, SLATE’s estimate until they’re published. Source: {COST_2026_27.source}.</p>
        </div>
      </Panel>
    </div>
  );
}
