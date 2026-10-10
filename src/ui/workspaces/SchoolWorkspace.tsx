/**
 * SLATE — drama school: the student's standing, classes, casting, work-study
 * and terms (`systems/school.ts`, `content/school.ts`), in six tabs: from
 * 2026-10-07 the coursework between classes too (`components/CourseworkPane.tsx`).
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
import { degreeShortfall, extendRefusal, makeUpRefusal, type CourseRecord } from '@/engine/systems/courserecord';
import { GENRE_BY_ID } from '@/engine/content/film-genres';
import { SECTIONS, tabKey } from '@/ui/shell/sections';
import { useKept } from '@/ui/kept';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Stat, Fine } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { copyAt, partFor, readRefusal, researchRefusal } from '@/engine/systems/playreading';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate, formatDateTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import { LookRegion, Open, at } from '@/ui/looks';
import { CITIES } from '@/engine/content/geography';
import { COST_2026_27, COURSES, REQUIRED_PPE, SCHOOL_POLICIES, SCHOOL_SEASON, SEAGULL_2027, SKILLS, SUMMER_CABARET, WORK_STUDY, YALE_CABARET, YALE_DRAMA, type Skill } from '@/engine/content/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { SIZE_WORD } from '@/engine/content/plays';
import {
  CABARET_KIND, CALL_KIND, CLASSES_KIND, ESTIMATE, EVALUATION_KIND, LAB_KIND, SHIFT_KIND, STANDING_LABEL,
  cabaretSeason, keyOf, summerRuns, classPeriod, daysOffIn, hasNeed, nextClasses, hourlyIn, actingOf, CEILING, ceilingOf, termGrowth, bondWord, meanCraft, rankIn, termAccount, termLabel, termOf, termStart, timetable, yearOfStudy, yearOfTerm, cabaretRefusal, ppeCost, ppeRefusal, shiftRefusal, sickRefusal, summerRefusal, schoolEnded } from '@/engine/systems/school';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { inSaveMoney } from '@/engine/systems/banking';
import { AttributesPanel } from '@/ui/components/AttributesPanel';
import { CourseworkPane } from '@/ui/components/CourseworkPane';
import { RehearsalProcess } from '@/ui/components/RehearsalProcess';
import { hasProcess, holderFor } from '@/engine/systems/production';

type SchoolTab = 'standing' | 'classes' | 'coursework' | 'casting' | 'work' | 'terms';

/** Its tabs, as the rail lists them too (`ui/shell/sections.ts`, from 2026-10-08). */
const SCHOOL_TABS = SECTIONS['/workspace/school'] as readonly { id: SchoolTab; label: string }[];

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
  const [tab, setTab] = useKept<SchoolTab>(tabKey('/workspace/school'), 'standing');
  const school = person.school;
  if (!school || !person.craft) return <Empty title="No School" body="This life didn’t begin at drama school." />;
  const where = school.standing === 'graduated' ? 'Graduated.' : schoolEnded(school.standing) ? 'Left the school.' : school.termsBegun === 0 ? 'Arriving for the fall term.' : `Year ${yearOfStudy(person)} of three, ${STANDING_LABEL[school.standing].toLowerCase()}.`;

  const panes: Record<SchoolTab, JSX.Element> = {
    standing: <StandingPane />,
    classes: <ClassesPane />,
    coursework: <><CourseworkPane /><PlaysToRead /></>,
    casting: <CastingPane />,
    work: <WorkPane />,
    terms: <TermsPane />,
  };

  return (
    <>
      <LookRegion className="page-head">
        <div className="eyebrow">Your School</div>
        <h1><Open subject={at('school', YALE_DRAMA.id)}>{YALE_DRAMA.name}</Open></h1>
        <p className="muted"><Open subject={at('school', YALE_DRAMA.id)}>{YALE_DRAMA.degree} in {YALE_DRAMA.program}</Open>, class of {school.classOf}. {where}</p>
      </LookRegion>
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
  // As the evaluation weighs it (`termGrowth`): until 2026-09-28 this screen warned on raw points while the faculty weighed the room each had.
  const { growth, classGrowth, grewTooLittle, pace } = termGrowth(person);
  const reach = person.craftCeiling;
  const evaluation = ahead(sim, person, [EVALUATION_KIND])[0];
  const skills: { id?: Skill; label: string; mine: number; reach: number; theirs: number[] }[] = [
    ...SKILLS.map((s) => ({ id: s.id, label: s.label, mine: craft[s.id], reach: ceilingOf(craft, s.id), theirs: school.classmates.map((m) => m.craft[s.id]) })),
    { label: 'Acting', mine: actingOf(craft), reach: reach ? actingOf(reach) : 100, theirs: school.classmates.map((m) => actingOf(m.craft)) },
    { label: 'Overall', mine: meanCraft(craft), reach: reach ? meanCraft(reach) : 100, theirs: school.classmates.map((m) => meanCraft(m.craft)) },
  ];

  return (
    <div className="col gap-5">
        <Panel title="Your Standing" subtitle={evaluation ? `Evaluation On ${formatDate(evaluation.at, zone())}` : undefined}>
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Standing" value={STANDING_LABEL[school.standing]} tone={school.standing === 'good' || school.standing === 'graduated' ? undefined : 'warning'} />
              <Stat label="Attendance This Term" value={attendance === undefined ? 'None Yet' : pct(attendance)} note={`${pct(ESTIMATE.attendanceFloor)} is the floor`} tone={attendance !== undefined && attendance < ESTIMATE.attendanceFloor ? 'warning' : undefined} />
              <Stat label="Growth This Term" value={growth.toFixed(1)} note={`The class’s ${classGrowth.toFixed(1)}: for the room each has, ${pace} it, and half its pace is the floor`} tone={grewTooLittle ? 'warning' : undefined} />
            </div>
            <p className="small" style={{ margin: 0 }}>
              Attendance counts {t.attended} of {t.classDays - t.excused} class days{t.excused ? ` (${t.excused} excused)` : ''}, {t.answered} of {t.calls} calls and {t.worked} of {t.shifts} assigned shifts. Short of either floor at the evaluation, or with a run on stage gone mostly off, or half or more of three or more pieces of coursework due unready or not shown, standing falls a step, from good to concern, to warning, to dismissal; meeting them all restores it. A missed performance or understudy call goes straight to warning, or from warning to dismissal{t.breaches ? `, and this term has had ${t.breaches === 1 ? 'one' : t.breaches}` : ''}. After the last term, Commencement confers the degree in good standing or with a concern; the last term ending on academic warning, the faculty don’t recommend it.
            </p>
            <p className="small" style={{ margin: 0 }}>{school.castable ? 'In the casting pool.' : 'Out of the casting pool after missed rehearsal calls, until a good evaluation.'}</p>
            <WithdrawControl />
            <CoursesPanel />
            <PoliciesPanel />
            <Fine>The four standings, no readmission after dismissal, and the faculty’s vote on the degree are the Yale Bulletin’s. One evaluation a term, a step at a time, the floors, and what withholds the degree are SLATE’s reading: the Bulletin says the faculty evaluate regularly and may act at any time.</Fine>
          </div>
        </Panel>

        <AttributesPanel />

        {(() => {
          const last = school.history.at(-1);
          return last?.notes?.length ? (
            <Panel title="From Your Teachers" subtitle={`On ${termLabel(last.term)}`}>
              <div className="col gap-2">
                {last.notes.map((n) => (
                  <div key={n.course} className="small"><strong>{n.teacher}</strong>, {n.course}: {n.note}</div>
                ))}
                <div className="xs dim">Simulated notes: the game’s words under the course’s teachers, not theirs.</div>
              </div>
            </Panel>
          ) : null;
        })()}
        <Panel title="Your Faculty">
          <div className="col gap-2 small">
            <div>{YALE_DRAMA.dean.name}: {YALE_DRAMA.dean.title}, since {formatDate(Date.parse(`${YALE_DRAMA.dean.since}T12:00:00Z`), zone())}.</div>
            <div>{YALE_DRAMA.actingChair.name}: {YALE_DRAMA.actingChair.title}, who casts every student and meets any whose standing falls.</div>
            <Fine>Source: {YALE_DRAMA.source}.</Fine>
          </div>
        </Panel>

      <Panel title="Your Craft Against The Class" subtitle={`You and ${school.classmates.length} classmates, 0 to 100`}>
        <div className="col gap-3">
          <LookRegion className="table-scroll">
            <table>
              <thead>
                <tr><th scope="col">Skill</th><th scope="col" className="num">You</th><th scope="col" className="num">You Can Reach</th><th scope="col" className="num">Class Best</th><th scope="col" className="num">Class Median</th><th scope="col" className="num">Your Place</th></tr>
              </thead>
              <tbody>
                {skills.map((row) => (
                  <tr key={row.label} className={row.id ? undefined : 'strong'}>
                    <td>{row.id ? <Open subject={at('skill', row.id)}>{row.label}</Open> : row.label}</td>
                    <td className="num mono">{row.id ? <Open subject={at('skill', row.id)}>{row.mine.toFixed(1)}</Open> : row.mine.toFixed(1)}</td>
                    <td className="num mono">{row.reach.toFixed(1)}</td>
                    <td className="num mono">{Math.max(...row.theirs).toFixed(1)}</td>
                    <td className="num mono">{median(row.theirs).toFixed(1)}</td>
                    <td className="num mono">{rankIn(person, row.id)} of {YALE_DRAMA.classSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LookRegion>
          <Fine>
            You began among the class’s strongest from this year’s auditions, not ahead of everyone, and each classmate grows at their own pace. Classes, rehearsals, performances and later the work grow craft, more when you come rested and less the nearer you are to what you can reach: each skill where it began and {CEILING.headroom} points more. Experience gives most in the first years and little past twelve (McDaniel, Schmidt and Hunter, 1988), and practice is a fifth of what an actor becomes in the performing arts (Macnamara, Hambrick and Oswald, 2014); the ceiling is fitted to both. The scale and the rates of a session are SLATE’s.
          </Fine>
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
  const person = useWorld((s) => s.player);
  const school = person.school!;
  // Only while at school: until 2026-09-27 a dismissed student was told of their next classes.
  const enrolled = !schoolEnded(school.standing);
  const p = zonedParts(sim.now, zone());
  const today = { year: p.year, month: p.month, day: p.day };
  const term = Math.min(termOf(today), YALE_DRAMA.terms - 1);
  const year = yearOfTerm(term);
  const fall = termStart(term).fall;
  const week = timetable(year, fall ? 'fall' : 'spring');
  const period = classPeriod(term);
  const next = enrolled ? nextClasses(sim.now) : undefined;
  const off = daysOffIn(term);
  // Offered until the day's classes have run, as the command takes it.
  const classToday = enrolled && ahead(sim, person, [CLASSES_KIND]).some((c) => c.payload.day === keyOf(today));
  const courses = COURSES.filter((c) => c.year === year);
  const skillLabel = (id: Skill) => SKILLS.find((s) => s.id === id)!.label;

  return (
    <div className="col gap-5">
      <Panel
        title={`Your Week, ${termLabel(term)}`}
        subtitle={`Year ${year}: nine to three on class days`}
        actions={sickRefusal(sim, person) === 'There’s nothing at school today to miss.' && !classToday ? undefined : (
          // Offered on any day with something at school, with why it can't be used where it can't (from 2026-10-10).
          <Gated feature="school.call_in_sick" disabled={Boolean(sickRefusal(sim, person))} title={sickRefusal(sim, person) ?? 'Today’s classes, calls and shift excused'} onClick={() => { if (run('school.call_in_sick').ok) toast('You called in sick: today’s absence is excused.', 'positive'); }}>Call In Sick</Gated>
        )}
      >
        <LookRegion className="col gap-3">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Day</th>{SLOTS.map((s) => <th key={s} scope="col">{s}</th>)}</tr></thead>
              <tbody>
                {week.map((day, i) => (
                  <tr key={WEEKDAYS[i]}>
                    <td>{WEEKDAYS[i]}</td>
                    {SLOTS.map((s, j) => <td key={s}>{day[j] ? <Open subject={at('course', day[j]!.code)}>{day[j]!.name}</Open> : ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small" style={{ margin: 0 }}>
            {next ? <>Next classes: <Open subject={at('day', dateKey(next, sim.homeZone))}>{formatDateTime(next, zone())}</Open>.</> : 'No classes ahead.'} This term’s classes run {dayOf(period.from)} to {dayOf(period.to)}, less {off} breaks for holidays, Community Days, work periods and recesses. Asleep or away from New Haven at nine is an absence; calling in sick excuses it when you’re unwell (condition under {ESTIMATE.sickBelow}) or down with the flu, and not otherwise; a day in hospital is excused of itself.
          </p>
          <Fine>
            {period.estimate ? 'This term’s dates are SLATE’s estimate by the 2026–2027 pattern. ' : 'The class days are the Yale Bulletin’s. '}The courses are the Bulletin’s; how often each meets isn’t published, and the week is SLATE’s estimate.
          </Fine>
        </LookRegion>
      </Panel>

      <Panel title={`Year ${year} Courses`} subtitle="Required, every term they run">
        <LookRegion className="table-scroll">
          <table>
            <thead><tr><th scope="col">Code</th><th scope="col">Course</th><th scope="col">Taught By</th><th scope="col">Trains</th><th scope="col" className="num">A Week</th><th scope="col">Terms</th></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.code}>
                  <td className="mono"><Open subject={at('course', c.code)}>{c.code}</Open></td>
                  <td><Open subject={at('course', c.code)}>{c.name}</Open></td>
                  <td>{c.teachers}</td>
                  <td>{c.skills.map((one, k) => <span key={one}>{k > 0 ? ', ' : ''}<Open subject={at('skill', one)}>{skillLabel(one)}</Open></span>)}</td>
                  <td className="num mono">{c.perWeek}</td>
                  <td>{c.terms.length === 2 ? 'Fall And Spring' : c.terms[0] === 'fall' ? 'Fall' : 'Spring'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LookRegion>
      </Panel>
    </div>
  );
}

/** What the chair cast the student in, and the calls it puts on the calendar. */
const KIND_WORDS: Record<string, string> = {
  thesis: 'A directors’ thesis production', hughes: 'The Langston Hughes Festival', shakespeare: 'A Shakespeare Repertory Project',
  carlotta: 'The Carlotta Festival', project: 'A School project', understudy: 'Understudying at Yale Rep', role: 'In the company at Yale Rep',
};

/** A run's nights, and its note once it's over, as a line. */
const nightsLine = (run: { nights?: Partial<Record<keyof typeof NIGHT_WORD, number>>; note?: string }) =>
  `Your nights: ${(['remarkable', 'strong', 'solid', 'off'] as const).filter((b) => run.nights?.[b]).map((b) => `${NIGHT_WORD[b]} ${run.nights![b]}`).join(', ')}.${run.note ? ` The director’s note: ${run.note}` : ''}`;

/** A night's reading as the Casting tab says it. */
const NIGHT_WORD = { remarkable: 'Remarkable', strong: 'Strong', solid: 'Solid', off: 'Off' } as const;

/** Whether the kind's words only say the production's name again, as the festivals' do. */
const repeats = (c: { production: string; kind: string }) => c.production.startsWith((KIND_WORDS[c.kind] ?? '-').replace(/^(A|The) /, ''));

/**
 * Why this cast (from 2026-10-10): the chair's read of the production the player is in (`SchoolRecord.castRead`),
 * each student's fit for the play, how much of themselves they delivered last time, the balance of opportunity and
 * the part given. Fit is what a night would come to, read the same for everyone; it isn't anybody's recorded work,
 * which stays as it was judged.
 */
const SOURCE_WORD: Record<string, string> = { school: 'a School production', rep: 'Yale Rep', cabaret: 'the Yale Cabaret', summer: 'the Summer Cabaret' };

function CastReadPanel() {
  const person = useWorld((s) => s.player);
  const read = person.school?.castRead;
  if (!read) return null;
  const rows = [...read.rows].sort((a, b) => b.score - a.score);
  const you = read.rows.find((r) => r.you);
  const asks = Object.keys(read.reads).map((k) => SKILLS.find((x) => x.id === k)?.label ?? k).join(', ');
  return (
    <Panel title="Why This Cast" subtitle={`${read.play}, ${termLabel(read.term)}`}>
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>The play asks for {asks}{read.kinds.length ? `, as its kinds of play do (${read.kinds.map((k) => GENRE_BY_ID[k]?.label ?? k).join(', ')})` : ''}. The chair reads each student’s fit for it the same way, then a fifth of it by how much of themselves they delivered in their runs since the last casting, and balances who had the big parts in the School’s last productions; the best read takes the biggest part written for them.</p>
        {you?.from && you.from.length > 0 && <p className="small" style={{ margin: 0 }}>Your {Math.round(you.delivery * 100)}% delivered is read from {you.from.map((f) => `${f.what}${f.source === 'before' ? '' : `, ${SOURCE_WORD[f.source]}, ${f.nights} night${f.nights === 1 ? '' : 's'}`} (${Math.round(f.delivery * 100)}%, weighted ${f.weight})`).join('; ')}. A Cabaret or Summer run weighs half a School production’s, each run up to eight nights; a night missed out of hospital is delivered at nothing. How the nights were judged isn’t read here: it’s in your work.</p>}
        <LookRegion className="table-scroll">
          <table>
            <thead><tr><th scope="col">Student</th><th scope="col" className="num">Fit</th><th scope="col" className="num">Delivered</th><th scope="col" className="num">Balance</th><th scope="col" className="num">Read</th><th scope="col">Part</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className={r.you ? 'strong' : undefined}>
                  <td>{r.name}</td>
                  <td className="num mono">{r.fit.toFixed(1)}</td>
                  <td className="num mono">{Math.round(r.delivery * 100)}%</td>
                  <td className="num mono">{r.balance > 0 ? `+${r.balance}` : r.balance}</td>
                  <td className="num mono">{r.score.toFixed(1)}</td>
                  <td>{r.part}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LookRegion>
        <Fine>Fit is the evaluation’s night for the play, with preparation complete and a sufficient day; stamina and discipline count as full for everyone, since the class’s bodies and habits aren’t simulated. A classmate’s delivery is the share of calls they keep. Who somebody is plays no part.</Fine>
      </div>
    </Panel>
  );
}

function CastingPane() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  // Casting's calls and the labs', all of them for the counts, the next eight listed.
  const every = ahead(sim, person, [CALL_KIND, LAB_KIND]).filter((c) => c.payload.call !== 'oncall');
  const calls = every.slice(0, 8);
  const onCall = ahead(sim, person, [CALL_KIND]).filter((c) => c.payload.call === 'oncall');
  // This term’s, while at school: the last production stayed on the tab after the degree until 2026-09-27.
  const enrolled = !schoolEnded(school.standing);
  const castings = [school.casting, school.rep].filter((c): c is NonNullable<typeof c> => c !== undefined && enrolled && c.term === school.termsBegun - 1);

  return (
    <div className="col gap-5">
      <CastReadPanel />
      {castings.map((casting) => {
        // A production whose calls are all behind it reads as done: until 2026-09-27 a closed run said there were none ahead, and that you were on call at all nought of them.
        const mine = (c: { label: string }) => c.label.startsWith(casting.production);
        const onCallLeft = casting.kind === 'understudy' ? onCall.filter(mine).length : 0;
        const left = every.filter(mine).length + onCallLeft;
        return (
        <Panel key={casting.production} title={casting.play ?? casting.production} subtitle={casting.play ? `${casting.production}, by ${casting.by}${left === 0 ? ', finished' : ''}` : left === 0 ? 'Finished' : repeats(casting) ? undefined : KIND_WORDS[casting.kind]}>
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Role" value={casting.kind === 'understudy' && !casting.role.includes('Understudy') ? `${casting.role} (Understudy)` : casting.role} note={casting.size && !casting.role.startsWith('A ') ? SIZE_WORD[casting.size] : undefined} />
              <Stat label={casting.kind === 'understudy' ? 'Went On' : 'Performed'} value={String(casting.performed)} />
              {left > 0 ? <Stat label="Calls Ahead" value={String(left)} note={casting.kind === 'understudy' ? `${onCallLeft} of them on call` : undefined} /> : <Stat label="Calls Ahead" value="None" note="The run is over" />}
            </div>
            {casting.nights && (
              <p className="small" style={{ margin: 0 }}>
                Your nights: {(['remarkable', 'strong', 'solid', 'off'] as const).filter((b) => casting.nights![b]).map((b) => `${NIGHT_WORD[b]} ${casting.nights![b]}`).join(', ')}.
                {casting.note ? ` The director’s note: ${casting.note}` : ' How much of yourself you bring to its nights is read by the chair when casting you next.'}
              </p>
            )}
            <RehearsalProcess casting={casting} which={casting === school.rep ? 'rep' : 'school'} />
            {casting.cast && casting.cast.length > 0 && (
              <p className="small" style={{ margin: 0 }}>
                From the class with you: {casting.cast.map((c) => `${c.name} as ${c.part}`).join('; ')}. The rest of the cast are from the other two classes.
              </p>
            )}
            {casting.kind === 'understudy' && casting.production === SEAGULL_2027.name && (
              <p className="small" style={{ margin: 0 }}>
                {SEAGULL_2027.name}, {SEAGULL_2027.by}, directed by {SEAGULL_2027.director}: rehearsals from {dayOf(parseDay(SEAGULL_2027.rehearsals.from))}, performances {dayOf(parseDay(SEAGULL_2027.run.from))} to {dayOf(parseDay(SEAGULL_2027.run.to))}. {onCallLeft > 0 ? `On call on ${onCallLeft} performance days still ahead: the Rep calls at five, so be in New Haven then. Not needed, the evening is yours; needed, you’re told and the curtain goes on your calendar. Away when called is a grave breach. Your understudy run-through is on the calendar too.` : 'The run is over.'}
              </p>
            )}
          </div>
        </Panel>
        );
      })}
      {castings.length === 0 && (
        <Panel title="Not Cast Yet">
          <p className="small" style={{ margin: 0 }}>
            {school.castable
              ? 'The chair casts every student each term from the first spring: the Carlotta Festival then; a thesis or the Hughes Festival in a second-year’s and a third-year’s fall; a thesis or the Carlotta Festival in the second spring; a Shakespeare Repertory Project in the last spring; and once a year, for a student in good standing, Yale Rep.'
              : 'Out of the casting pool after missed rehearsal calls. A good evaluation puts you back.'}
          </p>
        </Panel>
      )}
      {school.around && school.around.term === school.termsBegun - 1 && enrolled && (
        <Panel title="Around The Class" subtitle="Who’s playing what this term">
          <table className="table">
            <thead><tr><th scope="col">Student</th><th scope="col">Production</th><th scope="col">Part</th><th scope="col">Last Run</th><th scope="col">To You</th></tr></thead>
            <tbody>
              {school.around.list.map((a) => <tr key={`${a.name}-${a.production}`}><td>{a.name}</td><td>{a.production}</td><td>{a.part}</td><td className="mono">{(() => { const m = school.classmates.find((x) => x.name === a.name); return m?.shown ? `${Math.round(m.shown.quality)} in ${m.shown.production}` : ''; })()}</td><td>{bondWord(school.classmates.find((m) => m.name === a.name)?.bond) ?? ''}</td></tr>)}
            </tbody>
          </table>
        </Panel>
      )}
      <Fine>
        Casting is the Bulletin’s: the chair assigns every role, balancing each student’s needs, a student cast fulfils it, missed calls take an actor out of the pool, and a missed performance is a grave breach. The chair reads each student for the play: the skills it asks, a lead last time counting against the next and a featured part for it, and how you delivered in the last run (not how its nights were banded). The best read takes the biggest part written for them. Which play each thesis and Shakespeare project is, the festivals’ and later years’ dates, the rehearsal weeks and the reading are SLATE’s estimate, as the seasons you’re cast in aren’t announced; the characters are the plays’ own. Source: {SCHOOL_SEASON.source}.
      </Fine>

      <CabaretPanel />
      <SummerPanel />

      {calls.length > 0 && (
        <Panel title="Calls Ahead">
          <LookRegion className="col gap-2">
            {calls.map((c) => (
              <div key={c.id} className="row-between small">
                <span><Open subject={at('entry', c.id)}>{c.label}</Open></span>
                <span className="mono"><Open subject={at('day', dateKey(c.at, sim.homeZone))}>{formatDateTime(c.at, zone())}</Open></span>
              </div>
            ))}
          </LookRegion>
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
  // Why it can't be joined, said where the button would be (from 2026-10-10: until then the button just wasn't there).
  const why = mine ? undefined : cabaretRefusal(sim, person);
  return (
    <Panel
      title="The Yale Cabaret"
      subtitle={mine ? `Your show plays the week of ${dayOf(parseDay(mine.week))}` : cabaretSeason(Math.max(0, term))}
      actions={mine || cabaretRefusal(sim, person) ? undefined : <Gated feature="school.cabaret" onClick={() => { const a = run<{ week: string }>('school.cabaret'); if (a.ok) toast(`In the Cabaret: your show plays the week of ${dayOf(parseDay(a.value!.week))}.`, 'positive'); }}>Join A Cabaret Show</Gated>}
    >
      <div className="col gap-3">
        {mine && (
          <div className="grid grid-2">
            {mine.role && <Stat label="Your Part" value={mine.role} note="A new piece, made by the students" />}
            <Stat label="Performed" value={`${mine.performed} of ${YALE_CABARET.shows.length}`} note={`${calls.length} calls ahead`} />
          </div>
        )}
        {mine?.withdrawn && <p className="small" style={{ margin: 0 }}>Out of the show on {mine.withdrawn.why}, {formatDate(mine.withdrawn.at, sim.zone)}: the calls after it were called off, and not held against you.</p>}
        {why && <p className="small muted" style={{ margin: 0 }}>{why}</p>}
        {mine?.nights && <p className="small" style={{ margin: 0 }}>{nightsLine(mine)}</p>}
        {mine && <RehearsalProcess casting={mine} which="cabaret" />}
        <Fine>
          The students’ own theater at 217 Park Street: a new show each production week, Thursday to Saturday at eight and Friday and Saturday at eleven too, unpaid. The chair approves it, nobody on academic warning may take part (a warning during a show takes you out of what’s left of it), and it never wins a conflict with classes, casting or work-study, so SLATE finds you a week clear of all three. The rehearsals, {YALE_CABARET.rehearsalEvenings} weekday evenings before it, and one show a term are SLATE’s estimate. Source: {YALE_CABARET.source}.
        </Fine>
      </div>
    </Panel>
  );
}

/** What the School asks, as orientation's faculty session set it out (`SCHOOL_POLICIES`), kept for reading at any time. */
function PoliciesPanel() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const told = courseworkOf(sim, person)?.orientation.done.faculty;
  return (
    <details className="small">
      <summary>What The School Asks{told ? ` (set out at orientation, ${formatDate(told, sim.zone)})` : ''}</summary>
      <ul style={{ margin: 'var(--s2) 0 0' }}>{SCHOOL_POLICIES.map((p) => <li key={p.rule}>{p.rule} <span className="dim">Bulletin 2026–27 {p.page}.</span></li>)}</ul>
    </details>
  );
}

/**
 * Each course's record and what the degree still needs (`systems/courserecord.ts`, from 2026-10-10): this term's
 * courses as they stand, each Incomplete with its make-up and deadline, and every course not passed, first; the rest
 * in a list below.
 */
function CoursesPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const school = person.school!;
  const all = Object.entries(school.courses ?? {});
  if (!all.length) return null;
  const { failed, incomplete } = degreeShortfall(school);
  const term = Math.max(0, school.termsBegun - 1);
  const now = all.filter(([, r]) => r.term === term && r.result === undefined);
  const word = (r: CourseRecord) => r.result === 'pass' ? 'Passed' : r.result === 'incomplete' ? 'Incomplete' : r.result === 'fail' ? 'Not Passed' : r.result === 'permanent' ? 'Permanent Incomplete' : 'In Progress';
  const passed = all.filter(([, r]) => r.result === 'pass').length;
  return (
    <div className="col gap-2">
      <div className="eyebrow">Courses And The Degree</div>
      <p className="small" style={{ margin: 0 }}>
        {passed} of {all.length} courses passed so far.{' '}
        {failed.length ? `The degree can’t be completed: ${failed.map((r) => r.name).join(', ')} ${failed.length === 1 ? 'wasn’t' : 'weren’t'} passed, and SLATE models no repeated course.` : incomplete.length ? 'An Incomplete stands between you and the degree until it’s made up.' : 'Only the terms to come stand between you and the degree.'}
      </p>
      {incomplete.map((r) => {
        const key = `${r.term}:${r.code}`;
        const no = makeUpRefusal(sim, person, key);
        return (
          <div key={key} className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="small"><strong>{r.name}</strong>, Incomplete: {(r.owed ?? 0) - (r.madeUp ?? 0)} of {r.owed} make-up sessions left, by {formatDate(r.dueBy!, sim.zone)}.</span>
            <Gated feature="school.make_up" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ passed: boolean }>('school.make_up', { key }); if (a.ok) toast(a.value!.passed ? `${r.name}: passed.` : 'A session made up.', 'positive'); }}>Make Up A Session</Gated>
            {!extendRefusal(sim, person, key) && <Gated feature="school.extend_incomplete" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ dueBy: number }>('school.extend_incomplete', { key }); if (a.ok) toast(`Extended to ${formatDate(a.value!.dueBy, sim.zone)}.`, 'positive'); }}>Ask For A Month More</Gated>}
            {no && <span className="xs dim">{no}</span>}
          </div>
        );
      })}
      {failed.map((r) => <p key={`${r.term}:${r.code}`} className="small" style={{ margin: 0 }}><strong>{r.name}</strong>, {word(r)}: {r.why}.</p>)}
      {now.length > 0 && (
        <ul className="small" style={{ margin: 0 }}>
          {now.map(([key, r]) => <li key={key}>{r.name}: at {r.attended} of {r.meetings} meetings{r.excused ? `, ${r.excused} excused` : ''}.</li>)}
        </ul>
      )}
      <details className="small"><summary>Every Course</summary>
        <ul style={{ margin: 0 }}>{all.map(([key, r]) => <li key={key}>{termLabel(r.term)}, {r.code} {r.name}: {word(r)}</li>)}</ul>
      </details>
      <Fine>The acting courses are Pass/Fail, the degree is recommended for a student who has completed every one, and an Incomplete is due within a month (Bulletin 2026–27 pp.151–152). SLATE’s estimates: the three quarters of a course’s meetings that pass it, two-hour make-up sessions each worth a week of the course, and one month’s extension. The Bulletin’s nine semesters would let a course be repeated; SLATE models no added term.</Fine>
    </div>
  );
}

/**
 * Withdrawing (`school.withdraw`, from 2026-10-10): what it does said first, then a second press to confirm, since it
 * can't be undone in SLATE.
 */
function WithdrawControl() {
  const { run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const [asking, setAsking] = useState(false);
  if (!person.school || schoolEnded(person.school.standing)) return null;
  return (
    <div className="col gap-2">
      {asking && (
        <p className="small" style={{ margin: 0 }}>
          Withdrawing gives up your place today: classes, calls, shifts and coursework end, and hours you worked are still paid. By the fifteenth day of a term’s classes Yale Health is canceled back to the term’s start and its premium refunded; after it, you’re covered thirty days more. On an F-1 you’d have fifteen days’ grace and no OPT. The Bulletin lets a student who withdrew apply to come back, which SLATE doesn’t model.
        </p>
      )}
      <div className="row gap-2">
        {!asking
          ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking(true)}>Withdraw From The School…</button>
          : (
            <>
              <Gated feature="school.withdraw" className="btn btn-sm btn-danger" onClick={() => { const r = run('school.withdraw', { confirm: true }); if (r.ok) toast('You withdrew from the School.', 'neutral'); setAsking(false); }}>Withdraw</Gated>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsking(false)}>Stay</button>
            </>
          )}
      </div>
    </div>
  );
}

/** The Summer Cabaret: the summer's company, for a student with a year to come. */
function SummerPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const school = person.school!;
  const summer = school.summer && school.summer.until > sim.now ? school.summer : undefined;
  const current = summer ? holderFor(sim, person, 'summer') : undefined;
  return (
    <Panel
      title="The Yale Summer Cabaret"
      subtitle={summer ? (summer.out ? 'The company let you go' : `In the ${summer.year} company, to ${formatDate(summer.until, zone())}`) : 'Three shows a summer in New Haven'}
      actions={summer || summerRefusal(sim, person) ? undefined : <Gated feature="school.summer_cabaret" onClick={() => { if (run('school.summer_cabaret').ok) toast('In this summer’s company.', 'positive'); }}>Join The Summer Company</Gated>}
    >
      {!summer && summerRefusal(sim, person) && <p className="small muted" style={{ margin: '0 0 var(--s2)' }}>{summerRefusal(sim, person)}</p>}
      {summer && (
        <div className="col gap-2" style={{ margin: '0 0 var(--s2)' }}>
          {summerRuns(summer.year).map((run, i) => {
            const show = summer.shows?.[i];
            return (
              <div key={i} className="small">
                <strong>{show?.play ?? `Show ${i + 1}`}</strong>{show?.by ? `, by ${show.by}` : ''}: {show ? `${show.role}, ` : ''}{dayOf(run.from)} to {dayOf(run.to)}, played {summer.played[i] ?? 0}.
                {show?.nights ? ` ${nightsLine(show)}` : ''}
                {show && show === current && <RehearsalProcess casting={show} which="summer" />}
                {show && show !== current && hasProcess(show) && show.process.reflection && <div className="xs dim">Looking Back: {show.process.reflection.text}</div>}
              </div>
            );
          })}
        </div>
      )}
      <Fine>
        Three shows between late June and late August, evenings at eight and Saturdays at two, with afternoon rehearsals in the three weeks before each. It pays {formatMoney(inSaveMoney(sim, SUMMER_CABARET.stipendWeekly, 'USD'), cur)} a week, SLATE’s estimate, as are later summers’ dates and the company taking a student in good standing who asks by the end of April: neither how it’s chosen nor what it pays is published. A missed performance and the company goes on without you. The summer is yours: the Bulletin limits outside work only while classes are in session. Source: {SUMMER_CABARET.source}.
      </Fine>
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
      subtitle={`${WORK_STUDY.assignedHours} assigned hours and at least ${WORK_STUDY.electiveHours} elective a year`}
      actions={shiftRefusal(person) ? undefined : <Gated feature="school.take_shift" onClick={() => { const a = run<{ at: number }>('school.take_shift'); if (a.ok && a.value) toast(`Front of house, ${formatDateTime(a.value.at, zone())}.`, 'positive'); }}>Take An Elective Shift</Gated>}
    >
      <div className="col gap-3">
        {shiftRefusal(person) && <p className="small muted" style={{ margin: 0 }}>{shiftRefusal(person)}</p>}
        <div className="grid grid-3">
          <Stat label="Assigned Hours Booked" value={`${work.assignedBooked ?? 0} of ${WORK_STUDY.assignedHours}`} />
          <Stat label="Elective Hours Asked For" value={`${work.electiveHours}`} note={`The Bulletin’s minimum is ${WORK_STUDY.electiveHours}`} />
          <Stat label="Owed On Friday" value={formatMoney(Math.round(work.owedHours * rate), cur)} note={`${work.owedHours} hours at ${formatMoney(rate, cur)} an hour`} />
          <Stat label="Protective Equipment" value={person.school!.ppe ? 'Bought' : 'Not Yet'} note={person.school!.ppe ? `On ${formatDate(person.school!.ppe.at, zone())}, ${formatMoney(person.school!.ppe.cost, cur)}` : `Required for the Saturday crew: ${formatMoney(ppeCost(sim), cur)}, or bought at your first shift`} />
        </div>
        {!person.school!.ppe && !ppeRefusal(person) && (
          <div>
            <Gated feature="school.buy_ppe" className="btn btn-sm btn-ghost" title={`${formatMoney(ppeCost(sim), cur)}, from your bank`} onClick={() => { const r = run<{ cost: number }>('school.buy_ppe'); if (r.ok) toast(`Bought: ${formatMoney(r.value!.cost, cur)}.`, 'positive'); }}>Buy The Protective Equipment</Gated>
          </div>
        )}
        {shifts.length > 0 && (
          <LookRegion className="col gap-2">
            {shifts.map((s) => (
              <div key={s.id} className="row-between small">
                <span><Open subject={at('entry', s.id)}>{s.label}</Open></span>
                <span className="mono"><Open subject={at('day', dateKey(s.at, sim.homeZone))}>{formatDateTime(s.at, zone())}</Open></span>
              </div>
            ))}
          </LookRegion>
        )}
        <p className="small" style={{ margin: 0 }}>
          Every student works: six hours on class-week Saturdays, assigned, up to {WORK_STUDY.assignedHours} hours a year, and elective evenings of four hours front of house at Yale Rep when you ask for them. Hours are paid on Friday for the week, by direct deposit, so your bank counts them as wages. A shift you’re not there for isn’t paid, and a missed assigned one counts against your attendance.
        </p>
        <Fine>The hours and the rate are the school’s. Which Saturdays and evenings are SLATE’s estimate. The protective equipment is the school’s requirement and its $150 the school’s figure; what the kit holds beyond steel-toed work shoes isn’t published. Without it, or the money for it at the shift, the supervisor sends you home. Source: {WORK_STUDY.source}; {REQUIRED_PPE.source}.</Fine>
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
  // This year's figures, as the engine grows them; until 2026-09-27 the sentence quoted 2026–27's in every year.
  const aid = termAccount(cur, true, current);
  const aidBooks = 2 * (aid.livingScholarship - aid.taxable);
  const aidLiving = 2 * aid.livingScholarship - aidBooks;
  const terms = Array.from({ length: YALE_DRAMA.terms }, (_, i) => ({ i, ...termStart(i) }));

  return (
    <div className="grid grid-2">
      <Panel title="Your Terms" subtitle={`${school.termsBegun} of ${YALE_DRAMA.terms} begun`}>
        <LookRegion className="col gap-2">
          {terms.map((t) => (
            <div key={t.i} className="row-between small">
              <span>{termLabel(t.i)}</span>
              <span className={t.i < school.termsBegun ? 'dim' : ''}>
                {t.i < school.termsBegun ? 'Began ' : 'Begins '}<Open subject={at('day', keyOf(t.date))}>{dayOf(t.date)}</Open>{t.estimate ? ', SLATE’s estimate' : ''}
              </span>
            </div>
          ))}
          <Fine>
            The 2026–2027 dates are the Yale Bulletin’s. Later years aren’t published yet, so they’re SLATE’s estimate by the same pattern.
          </Fine>
        </LookRegion>
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
            Tuition is met in full for every student, from the David Geffen gift. Aid for living costs, {money(aidLiving)} a year with the health plan and up to {money(aidBooks)} of books this year, goes by need, and the need assessment reads the family’s means. {need ? 'Yours found need, and the scholarship meets it.' : 'Yours found none, so the health plan and living costs come from your bank.'}
          </p>
          <Fine>The {COST_2026_27.year} figures are the school’s; later years grow at the Bulletins’ own rise from 2022–23, SLATE’s estimate until they’re published. Source: {COST_2026_27.source}.</Fine>
        </div>
      </Panel>
    </div>
  );
}

/**
 * Real plays from 2000 on (`systems/playreading.ts`, from 2026-10-08): their
 * facts on record, read with a library's copy and researched. None is played:
 * the scene work is public-domain plays and SLATE's own. It was on the Belongings screen until that went in the
 * scope reset of 2026-10-09, and came here, beside the coursework it serves.
 */
function PlaysToRead() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const read = useFeature('plays.read');
  const research = useFeature('plays.research');
  const copy = copyAt(person);
  const studies = person.plays ?? {};
  const notes = CONTEMPORARY_PLAYS.flatMap((p) => (studies[p.id]?.notes[0] ? [{ p, n: studies[p.id]!.notes[0]! }] : [])).sort((a, b) => b.n.at - a.n.at).slice(0, 5);
  return (
    <Panel title="Plays To Read" subtitle={'library' in copy ? `A Copy From ${copy.library}` : 'No Copy To Hand'}>
      <div className="col gap-2">
        <div className="xs dim">Twenty-nine plays first staged since 2000, their facts as their theaters and publishers give them. A copy is borrowed from a library to read and research; none is played here, as their texts are under copyright.</div>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Play</th><th scope="col">Cast</th><th scope="col">Read</th></tr></thead>
            <tbody>
              {CONTEMPORARY_PLAYS.map((p) => {
                const st = studies[p.id];
                const fit = partFor(person, p, sim.now, sim.zone);
                const noRead = readRefusal(sim, person, p.id);
                const noResearch = researchRefusal(sim, person, p.id);
                return (
                  <tr key={p.id}>
                    <td><span className="small">{p.title}</span><div className="xs dim">{p.by}; first staged {p.premiere.year}, {p.premiere.venue}</div></td>
                    <td><span className="small">{p.cast?.text ?? 'Not on record'}</span>{fit !== 'unknown' && <div className="xs dim">{fit === 'yes' ? 'A part for you' : 'No part for you'}</div>}</td>
                    <td>
                      <span className="small" style={{ whiteSpace: 'nowrap' }}>{st ? (st.reads === 1 ? 'Once' : `${st.reads} Times`) : 'Not Yet'}</span>{st?.researchedAt && <div className="xs dim">Researched</div>}
                      <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-sm btn-ghost" style={{ whiteSpace: 'nowrap' }} disabled={!read.open || Boolean(noRead)} title={noRead ?? read.reason} onClick={() => { const r = run<{ minutes: number; note: string }>('plays.read', { playId: p.id }); if (r.ok) toast(r.value!.note, 'positive'); }}>{st ? 'Read It Again' : 'Read It'}</button>
                        {st && !st.researchedAt && <button type="button" className="btn btn-sm btn-ghost" disabled={!research.open || Boolean(noResearch)} title={noResearch ?? research.reason} onClick={() => { const r = run<{ minutes: number; note: string }>('plays.research', { playId: p.id }); if (r.ok) toast(r.value!.note, 'positive'); }}>Research It</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {notes.length > 0 && (
          <div className="col gap-1">
            <div className="small">Your Latest Notes</div>
            {notes.map(({ p, n }) => <div key={p.id} className="xs"><span className="dim">{formatDate(n.at, sim.zone)}, {p.title}:</span> {n.what}</div>)}
          </div>
        )}
      </div>
    </Panel>
  );
}
