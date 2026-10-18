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
import { Panel, Empty, Stat, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated, useFeature } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { copyAt, partFor, readRefusal, researchRefusal } from '@/engine/systems/playreading';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate, formatDateTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import { plural } from '@/engine/core/text';
import { LookRegion, Open, at } from '@/ui/looks';
import { CITIES } from '@/engine/content/geography';
import { COST_2026_27, COURSES, REQUIRED_PPE, SCHOOL_POLICIES, SCHOOL_SEASON, SEAGULL_2027, SKILLS, SUMMER_CABARET, WORK_STUDY, YALE_CABARET, YALE_DRAMA, type Skill } from '@/engine/content/school';
import { courseworkOf, termTally } from '@/engine/systems/coursework';
import { SIZE_WORD } from '@/engine/content/plays';
import {
  CABARET_KIND, CALL_KIND, CLASSES_KIND, ESTIMATE, EVALUATION_KIND, LAB_KIND, SHIFT_KIND, STANDING_LABEL,
  academicTerm, cabaretSeason, keyOf, summerRuns, classPeriod, daysOffIn, hasNeed, nextClasses, hourlyIn, actingOf, CEILING, ceilingOf, termGrowth, bondWord, meanCraft, rankIn, termAccount, termLabel, termOf, termStart, timetable, yearOfStudy, yearOfTerm, cabaretRefusal, ppeCost, ppeRefusal, shiftRefusal, sickRefusal, summerRefusal, schoolEnded, termSupport, termWords, partWords } from '@/engine/systems/school';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { inSaveMoney } from '@/engine/systems/banking';
import { AttributesPanel } from '@/ui/components/AttributesPanel';
import { CourseworkPane } from '@/ui/components/CourseworkPane';
import { RehearsalProcess } from '@/ui/components/RehearsalProcess';
import { ClassesPanel, LeavePanel, RepeatPanel, WorkLimitsBlock, YaleAccountPanel } from '@/ui/components/StudyPlanPanels';
import { enrolledTerms, yaleAccount } from '@/engine/systems/leave';
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
  const where = school.standing === 'graduated' ? 'Graduated.' : schoolEnded(school.standing) ? 'Left the School.' : school.termsBegun === 0 ? 'Arriving for the fall term.' : school.leave?.status === 'on' ? `On leave until ${termLabel(school.leave.returnTerm)}.` : `Year ${yearOfStudy(person)} of 3, ${STANDING_LABEL[school.standing].toLowerCase()}.`;

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
        <div className="eyebrow">School</div>
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
    <div className="tabs" role="tablist" aria-label="School">
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
  // The term's coursework as its review will read it (`termTally`, `ESTIMATE.coursework`), from 2026-10-16: until then the
  // tab showed attendance and growth against their floors and nothing of the third measure until the term's warning, six
  // pieces in (found by tests/remaining-school-term.test.ts).
  const work = termTally(courseworkOf(sim, person)?.assignments ?? [], Math.max(0, school.termsBegun - 1));
  const workShort = work.shown >= ESTIMATE.coursework.shown && work.unready >= ESTIMATE.coursework.unready * work.shown;
  // Once the School has ended no evaluation is to come: the three figures are the last term's, their floors what that
  // term was held to, and nothing casts them (from 2026-10-16: until then a graduate's tab read “This Term” with each floor
  // ahead of them and “In the casting pool.”, found playing a life to the degree, brief 09's journeys).
  const ended = schoolEnded(school.standing);
  const skills: { id?: Skill; label: string; mine: number; reach: number; theirs: number[] }[] = [
    ...SKILLS.map((s) => ({ id: s.id, label: s.label, mine: craft[s.id], reach: ceilingOf(craft, s.id), theirs: school.classmates.map((m) => m.craft[s.id]) })),
    { label: 'Acting', mine: actingOf(craft), reach: reach ? actingOf(reach) : 100, theirs: school.classmates.map((m) => actingOf(m.craft)) },
    { label: 'Overall', mine: meanCraft(craft), reach: reach ? meanCraft(reach) : 100, theirs: school.classmates.map((m) => meanCraft(m.craft)) },
  ];

  return (
    <div className="col gap-5">
        <Panel title="Your Standing" subtitle={evaluation ? `Term Review On ${formatDate(evaluation.at, zone())}` : undefined} help="school.standing">
          <div className="col gap-3">
            <div className="grid grid-4">
              <Stat label="Standing" value={STANDING_LABEL[school.standing]} tone={school.standing === 'good' || school.standing === 'graduated' ? undefined : 'warning'} />
              <Stat label={ended ? 'Attendance Last Term' : 'Attendance This Term'} value={attendance === undefined ? (ended ? 'None' : 'None Yet') : pct(attendance)} note={ended ? `${pct(ESTIMATE.attendanceFloor)} was the minimum` : `You need ${pct(ESTIMATE.attendanceFloor)} or more`} tone={attendance !== undefined && attendance < ESTIMATE.attendanceFloor ? 'warning' : undefined} />
              <Stat label={ended ? 'Growth Last Term' : 'Growth This Term'} value={growth.toFixed(1)} note={`The class’s middle: ${classGrowth.toFixed(1)}. Allowing for room to grow, ${ended ? 'you were' : 'you’re'} ${pace} the class, and ${ended ? 'half its pace was the minimum' : 'you need at least half its pace'}`} tone={grewTooLittle ? 'warning' : undefined} />
              <Stat label={ended ? 'Coursework Last Term' : 'Coursework This Term'} value={work.shown ? `${work.unready} of ${work.shown}` : ended ? 'None' : 'None Yet'} note={`Unready or not shown, of the pieces due. Once ${ESTIMATE.coursework.shown} or more are due, half or more ${ended ? 'was' : 'is'} short of what’s asked`} tone={workShort ? 'warning' : undefined} />
            </div>
            <p className="small" style={{ margin: 0 }}>
              {t.classDays - t.excused + t.calls + t.shifts === 0 ? (ended ? 'There was no class day, call or shift to count toward attendance last term. ' : 'There’s been no class day, call or shift to count toward attendance this term yet. ') : <>Attendance counts {t.attended} of {plural(t.classDays - t.excused, 'class day')}{t.excused ? ` (${t.excused} excused)` : ''}, {t.answered} of {plural(t.calls, 'call')} and {t.worked} of {plural(t.shifts, 'assigned shift')}. </>}At the term review, a term falls short if your attendance or your growth is under its minimum, if a run on stage went mostly off, if you fail a course, or if half or more of your coursework due was Unready or not shown (once {ESTIMATE.coursework.shown} or more pieces are due). A term that falls short moves your standing one step: from good standing to academic concern, then to academic warning, then to dismissal. A term that meets them all puts you back in good standing. Missing a performance or an understudy call is a grave breach: it puts you straight on academic warning, or dismisses you if you’re already on warning{t.breaches ? `, and this term has had ${t.breaches === 1 ? 'one' : t.breaches}` : ''}. After your last term, Commencement confers the degree if you’re in good standing or have a concern; if your last term ends on academic warning, the faculty don’t recommend it.
            </p>
            {!ended && <p className="small" style={{ margin: 0 }}>{school.castable ? 'You’re in the casting pool.' : 'You’re out of the casting pool after missed calls, until a term review finds you in good standing.'}</p>}
            <WithdrawControl />
            <LeavePanel />
            <CoursesPanel />
            <RepeatPanel />
            <ClassesPanel />
            <PoliciesPanel />
            <Fine>Source: the Yale Bulletin, for the four standings, no return after dismissal and the faculty’s vote on the degree. One review a term, one step at a time, the minimums and what withholds the degree are estimated: the Bulletin says only that the faculty evaluate regularly and may act at any time.</Fine>
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
                <div className="xs dim">These notes are simulated. The words are the game’s, not the teachers’.</div>
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
            You began among the class’s strongest from this year’s auditions, not ahead of everyone, and each classmate grows at their own pace. Classes, rehearsals, performances and later the work grow your craft: more when you come rested, and less the nearer you are to what you can reach, which is each skill’s starting level plus {CEILING.headroom} points. Experience gives most in the first years and little past twelve (McDaniel, Schmidt and Hunter, 1988), and practice is a fifth of what an actor becomes in the performing arts (Macnamara, Hambrick and Oswald, 2014); the ceiling is fitted to both. The scale and the rate of a session are estimated.
          </Fine>
        </div>
      </Panel>

      <Panel title="Term Reviews">
        {school.history.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th scope="col">Term</th><th scope="col">Standing</th><th scope="col" className="num">Attendance</th><th scope="col" className="num">Growth</th><th scope="col" className="num">Class Growth</th><th scope="col">Coursework</th><th scope="col">Why</th></tr>
              </thead>
              <tbody>
                {school.history.map((r, i) => (
                  <tr key={i}>
                    <td>{termLabel(r.term)}</td>
                    <td>{STANDING_LABEL[r.standing]}</td>
                    <td className="num mono">{pct(r.attendance)}</td>
                    <td className="num mono">{r.growth.toFixed(1)}</td>
                    <td className="num mono">{r.classGrowth.toFixed(1)}</td>
                    {/* The review's own count of the term's coursework (`TermReview.coursework`), from 2026-10-16: until then it
                        was kept at every evaluation and shown nowhere, and its words named it only where the mark was reached. */}
                    <td className="small">{r.coursework ? `${r.coursework.unready} of ${r.coursework.shown} Unready or not shown` : 'None counted'}</td>
                    <td className="small">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>None yet. The faculty review every student at the end of each term’s classes.</p>
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
  // The calendar term for its name, its class days and its breaks; the program year by where the student is in it
  // (from 2026-10-12): until then both came from the calendar term capped at the sixth, so back from a leave or a
  // repeated year this showed the year ahead's week and courses, and past the sixth calendar term the spring before.
  const term = termOf(today);
  const year = yearOfTerm(Math.min(YALE_DRAMA.terms - 1, Math.max(0, academicTerm(school, term))));
  const season = termStart(term).fall ? 'fall' : 'spring';
  // An additional term has only the courses retaken, each on its own year's days for the season, as `coursesFor` has them.
  const extra = school.extra?.term === term ? school.extra : undefined;
  const week = extra
    ? WEEKDAYS.map((_, i) => extra.courses.flatMap((c) => (timetable(yearOfTerm(c.academic), season)[i] ?? []).filter((x) => x.code === c.code)))
    : timetable(year, season);
  const period = classPeriod(term);
  const next = enrolled ? nextClasses(sim.now, school) : undefined;
  const off = daysOffIn(term);
  // Offered until the day's classes have run, as the command takes it.
  const classToday = enrolled && ahead(sim, person, [CLASSES_KIND]).some((c) => c.payload.day === keyOf(today));
  const courses = extra ? COURSES.filter((c) => extra.courses.some((x) => x.code === c.code)) : COURSES.filter((c) => c.year === year);
  const skillLabel = (id: Skill) => SKILLS.find((s) => s.id === id)!.label;
  // Offered on any day with something at school, with why it can't be used where it can't (from 2026-10-10); not at all
  // once they've left (from 2026-10-12: until then it stayed, grayed with "You’re not at school.", for good).
  const sick = sickRefusal(sim, person);
  const offerSick = enrolled && !(sick === 'There’s nothing at school today to miss.' && !classToday);

  return (
    <div className="col gap-5">
      <Panel
        title={`Your Week, ${termLabel(term)}`}
        subtitle={`${extra ? 'Your additional term' : `Year ${year}`}: nine to three on class days`}
        actions={offerSick ? (
          <Gated feature="school.call_in_sick" disabled={Boolean(sick)} title={sick ?? 'Excuses today’s classes, calls and shift'} onClick={() => { if (run('school.call_in_sick').ok) toast('You called in sick. Today’s absence is excused.', 'positive'); }}>Call In Sick</Gated>
        ) : undefined}
        help="school.sick"
      >
        <LookRegion className="col gap-3">
          {/* Why it's grayed, said under the panel's head where it sits (from 2026-10-12): until then only its tooltip said
              it, which a phone never shows and a keyboard never reaches. */}
          {offerSick && <WhyNot reasons={[['Call In Sick', sick]]} />}
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
            {next ? <>Next classes: <Open subject={at('day', dateKey(next, sim.homeZone))}>{formatDateTime(next, zone())}</Open>.</> : 'No classes ahead.'} This term’s classes run from {dayOf(period.from)} to {dayOf(period.to)}, with {off === 1 ? 'one break' : `${off} breaks`} for holidays, Community Days, work periods and recesses. If you’re asleep or away from New Haven at nine, it counts as an absence. Calling in sick excuses it only when you’re unwell (condition under {ESTIMATE.sickBelow}) or down with the flu. A day in hospital is excused automatically.
          </p>
          <Fine>
            {period.estimate ? 'This term’s dates are estimated from the 2026–2027 pattern. ' : 'Source: the Yale Bulletin, for the class days. '}The courses are the Bulletin’s. How often each meets isn’t published, so the week is estimated.
          </Fine>
        </LookRegion>
      </Panel>

      <Panel title={extra ? 'Your Additional Term’s Courses' : `Year ${year} Courses`} subtitle={extra ? `Retaken in ${termLabel(term)}, and only these` : 'Required, every term they run'} help="school.standing">
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
    <Panel title="Why This Cast" subtitle={`${read.play}, ${termLabel(read.term)}`} help="productions.casting">
      <div className="col gap-3">
        <p className="small" style={{ margin: 0 }}>The play asks for {asks}{read.kinds.length ? `, as its kinds of play do (${read.kinds.map((k) => GENRE_BY_ID[k]?.label ?? k).join(', ')})` : ''}. The chair judges every student’s fit for it the same way, weighs a fifth of it by how much of themselves they delivered in their runs since the last casting, and balances who had the big parts in the School’s last productions. The best read gets the biggest part written for them.</p>
        {you?.from && you.from.length > 0 && <p className="small" style={{ margin: 0 }}>Your {Math.round(you.delivery * 100)}% delivered comes from {you.from.map((f) => `${f.what}${f.source === 'before' ? '' : `, ${SOURCE_WORD[f.source]}, ${f.nights} night${f.nights === 1 ? '' : 's'}`} (${Math.round(f.delivery * 100)}%, counted ×${f.weight})`).join('; ')}. A Cabaret or Summer run counts half as much as a School production, each run up to eight nights, and a night missed when you weren’t in hospital counts as nothing delivered. How the nights were judged doesn’t count here: that’s in your work.</p>}
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
        <Fine>Fit is how a night of the play would go, fully prepared and on a good day. Stamina and discipline count as full for everyone, since the game doesn’t simulate your classmates’ bodies and habits. A classmate’s delivery is the share of calls they keep. Who someone is plays no part.</Fine>
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
        <Panel key={casting.production} title={casting.play ?? casting.production} subtitle={casting.play ? `${casting.production}, by ${casting.by}${left === 0 ? ', finished' : ''}` : left === 0 ? 'Finished' : repeats(casting) ? undefined : KIND_WORDS[casting.kind]} help="productions.nights">
          <div className="col gap-3">
            <div className="grid grid-3">
              <Stat label="Role" value={casting.kind === 'understudy' && !casting.role.includes('Understudy') ? `${casting.role} (Understudy)` : casting.role} note={casting.size && !casting.role.startsWith('A ') ? SIZE_WORD[casting.size] : undefined} />
              <Stat label={casting.kind === 'understudy' ? 'Went On' : 'Performed'} value={String(casting.performed)} />
              {left > 0 ? <Stat label="Calls Ahead" value={String(left)} note={casting.kind === 'understudy' ? `${onCallLeft} of them on call` : undefined} /> : <Stat label="Calls Ahead" value="None" note="The run is over" />}
            </div>
            {casting.nights && (
              <p className="small" style={{ margin: 0 }}>
                Your nights: {(['remarkable', 'strong', 'solid', 'off'] as const).filter((b) => casting.nights![b]).map((b) => `${NIGHT_WORD[b]} ${casting.nights![b]}`).join(', ')}.
                {casting.note ? ` The director’s note: ${casting.note}` : ' How much of yourself you bring to its nights counts when the chair casts you next.'}
              </p>
            )}
            {/* A run that went on without them has no nights, and its note was until 2026-10-13 only a notification's; found by the evidence pass of that day. */}
            {!casting.nights && casting.note && <p className="small" style={{ margin: 0 }}>The director’s note: {casting.note}</p>}
            <RehearsalProcess casting={casting} which={casting === school.rep ? 'rep' : 'school'} />
            {/* The Rep's company is the Rep's own past the class's few asked into it with you, each in a featured part (from 2026-10-12, when the Rep's casting first listed them). */}
            {casting.cast && casting.cast.length > 0 && (
              <p className="small" style={{ margin: 0 }}>
                {casting === school.rep
                  ? `From the class in the company with you, each in a featured part: ${casting.cast.map((c) => c.name).join(', ')}. The rest of the company is the Rep’s own.`
                  : `From the class with you: ${casting.cast.map((c) => (/^(A|An) /.test(c.part) ? `${c.name}, ${partWords(c.part)}` : `${c.name} as ${c.part}`)).join('; ')}. The rest of the cast are from the other two classes.`}
              </p>
            )}
            {casting.kind === 'understudy' && casting.production === SEAGULL_2027.name && (
              <p className="small" style={{ margin: 0 }}>
                {SEAGULL_2027.name}, {SEAGULL_2027.by}, directed by {SEAGULL_2027.director}: rehearsals from {dayOf(parseDay(SEAGULL_2027.rehearsals.from))}, performances {dayOf(parseDay(SEAGULL_2027.run.from))} to {dayOf(parseDay(SEAGULL_2027.run.to))}. {onCallLeft > 0 ? `You’re on call for ${onCallLeft} performance ${onCallLeft === 1 ? 'day' : 'days'} still ahead. The Rep calls at five, so be in New Haven then. If you’re not needed, the evening is yours; if you are, you’re told and the performance goes on your calendar. Being away when called is a grave breach. Your understudy run-through is on your calendar too.` : 'The run is over.'}
              </p>
            )}
          </div>
        </Panel>
        );
      })}
      {/* Once the School has ended nothing is cast (from 2026-10-16: until then a graduate's tab said Not Cast Yet and when
          the chair casts, a casting that would never come; found playing a life to the degree). What was played stays on the
          Profile (`keepCredit`), as the end's notice says. */}
      {castings.length === 0 && !enrolled && (
        <Panel title="No Casting Ahead" help="productions.casting">
          <p className="small" style={{ margin: 0 }}>The chair casts students at the School, and {school.standing === 'graduated' ? 'your degree is conferred' : 'you’ve left it'}, so there’s no casting now. The productions you played stay on your Profile.</p>
        </Panel>
      )}
      {castings.length === 0 && enrolled && (
        <Panel title="Not Cast Yet" help="productions.casting">
          <p className="small" style={{ margin: 0 }}>
            {school.castable
              ? 'The chair casts every student each term from the first spring: the Carlotta Festival then; a thesis or the Hughes Festival in a second-year’s and a third-year’s fall; a thesis or the Carlotta Festival in the second spring; a Shakespeare Repertory Project in the last spring; and once a year, for a student in good standing, Yale Rep.'
              : 'You’re out of the casting pool after missed calls. A term review that finds you in good standing puts you back.'}
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
        Casting is the Bulletin’s: the chair assigns every role, balancing each student’s needs, a student cast fulfills it, missed calls take an actor out of the pool, and a missed performance is a grave breach. The chair reads each student for the play: the skills it asks, a lead last time counting against the next and a featured part for it, and how you delivered in the last run (not how its nights were banded). The best read gets the biggest part written for them. Which play each thesis and Shakespeare project is, the festivals’ and later years’ dates, the rehearsal weeks and the chair’s reading are estimated, since the seasons you’re cast in aren’t announced. The characters are the plays’ own. Source: {SCHOOL_SEASON.source}.
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
      help="school.cabaret"
    >
      <div className="col gap-3">
        {mine && (
          <div className="grid grid-2">
            {mine.role && <Stat label="Your Part" value={mine.role} note="A new piece, made by the students" />}
            <Stat label="Performed" value={`${mine.performed} of ${YALE_CABARET.shows.length}`} note={`${calls.length} calls ahead`} />
          </div>
        )}
        {mine?.withdrawn && <p className="small" style={{ margin: 0 }}>Out of the show on {mine.withdrawn.why}, {formatDate(mine.withdrawn.at, sim.zone)}. The calls after it were called off, and they aren’t held against you.</p>}
        {why && <p className="small muted" style={{ margin: 0 }}>{why}</p>}
        {mine?.nights && <p className="small" style={{ margin: 0 }}>{nightsLine(mine)}</p>}
        {mine && <RehearsalProcess casting={mine} which="cabaret" />}
        <Fine>
          The students’ own theater at 217 Park Street: a new show each production week, Thursday to Saturday at eight and Friday and Saturday at eleven too, unpaid. The chair approves it, and nobody on academic warning may take part (a warning during a show takes you out of what’s left of it). It never wins a conflict with classes, casting or work-study, so the game finds you a week clear of all three. The rehearsals, {YALE_CABARET.rehearsalEvenings} weekday evenings before it, and one show a term are estimated. Source: {YALE_CABARET.source}.
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
  // A course the School ended in the middle of, by a withdrawal or a dismissal, keeps no result: Not Finished, not In
  // Progress, and not listed with this term's meetings (from 2026-10-16, found playing a withdrawal, brief 09's journeys).
  const ended = schoolEnded(school.standing);
  const word = (r: CourseRecord) => r.result === 'pass' ? 'Passed' : r.result === 'incomplete' ? 'Incomplete' : r.result === 'fail' ? 'Not Passed' : r.result === 'permanent' ? 'Permanent Incomplete' : r.result === 'withdrawn' ? 'Left On Leave' : ended ? 'Not Finished' : 'In Progress';
  const passed = all.filter(([, r]) => r.result === 'pass').length;
  // Once the School has ended, what the record came to and no way on (from 2026-10-16: until then a graduate read “Only
  // the terms to come stand between you and the degree.”, found in the built app that day, and a student who had left
  // with a course failed was told a year “can be repeated, below”, which nothing then offered). Each clause is what
  // `setStanding` says of the end.
  const unpassed = [...failed, ...incomplete].map((r) => r.name);
  const notPassed = unpassed.length ? `, with ${unpassed.join(', ')} not passed` : '';
  const endedWords = school.standing === 'graduated'
    ? `Every course the degree needs was passed, and it was conferred${school.endedAt !== undefined ? ` on ${formatDate(school.endedAt, zone())}` : ''}.`
    : school.standing === 'withdrawn' ? `You withdrew${notPassed}. The Bulletin lets a student who withdrew apply to come back, but the game doesn’t offer a return.`
      : school.standing === 'dismissed' ? `You were dismissed${notPassed}. A dismissed student can’t return to the School.`
        : `The degree wasn’t recommended${notPassed}, and nothing more can be asked for it.`;
  return (
    <div className="col gap-2">
      <div className="row-between"><div className="eyebrow">Courses And The Degree</div><HowItWorks help="school.repeat" /></div>
      <p className="small" style={{ margin: 0 }}>
        {passed} of {all.length} courses passed{ended ? '' : ' so far'}.{' '}
        {ended ? endedWords : failed.length ? `The degree still needs ${failed.map((r) => r.name).join(', ')}. A course left on a leave is taken on your return, and a year with a failed course can be repeated, below.` : incomplete.length ? 'An Incomplete stands between you and the degree until it’s made up.' : 'Only the terms to come stand between you and the degree.'}
      </p>
      {incomplete.map((r) => {
        const key = `${r.term}:${r.code}`;
        // Not offered once they’ve left, as Ask For A Month More, Call In Sick and Take A Shift aren’t (from 2026-10-13:
        // until then it stayed, grayed with “You’re not at school.”, for good; found by that day’s final checks).
        const left = school.endedAt !== undefined;
        const no = left ? undefined : makeUpRefusal(sim, person, key);
        return (
          <div key={key} className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="small"><strong>{r.name}</strong>, Incomplete: {(r.owed ?? 0) - (r.madeUp ?? 0)} of {r.owed} make-up {r.owed === 1 ? 'session' : 'sessions'} left, by {formatDate(r.dueBy!, sim.zone)}.</span>
            {!left && <Gated feature="school.make_up" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => { const a = run<{ passed: boolean }>('school.make_up', { key }); if (a.ok) toast(a.value!.passed ? `${r.name}: passed.` : 'A session made up.', 'positive'); }}>Make Up A Session</Gated>}
            {!extendRefusal(sim, person, key) && <Gated feature="school.extend_incomplete" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ dueBy: number }>('school.extend_incomplete', { key }); if (a.ok) toast(`Extended to ${formatDate(a.value!.dueBy, sim.zone)}.`, 'positive'); }}>Ask For A Month More</Gated>}
            {no && <span className="xs dim">{no}</span>}
          </div>
        );
      })}
      {failed.map((r) => <p key={`${r.term}:${r.code}`} className="small" style={{ margin: 0 }}><strong>{r.name}</strong>, {word(r)}: {r.why}.</p>)}
      {now.length > 0 && !ended && (
        <ul className="small" style={{ margin: 0 }}>
          {now.map(([key, r]) => <li key={key}>{r.name}: {r.attended} of {plural(r.meetings, 'class', 'classes')} attended{r.excused ? `, ${r.excused} excused` : ''}.</li>)}
        </ul>
      )}
      <details className="small"><summary>Every Course</summary>
        <ul style={{ margin: 0 }}>{all.map(([key, r]) => <li key={key}>{termLabel(r.term)}, {r.code} {r.name}: {word(r)}</li>)}</ul>
      </details>
      {/* Whose the Incomplete's giving is, said from 2026-10-16: the Bulletin (p.152) has a student ask the instructor for
          one, and the instructor grant it and any extension. */}
      <Fine>Source: the Yale Bulletin 2026–27, pp.151–152: the acting courses are Pass/Fail, the degree is recommended for a student who has completed every one, and an Incomplete is due within a month. Estimated: the three quarters of a course’s classes that pass it, two-hour make-up sessions each worth a week of the course, and one month’s extension. The game also gives an Incomplete for classes missed ill, where the Bulletin has the student ask the instructor for one and petition for any extension. A year with a failed course can be repeated once, by the game’s own rule (below); each attempt stays on the record, and the degree counts the pass.</Fine>
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
          Withdrawing gives up your place today: classes, calls, shifts and coursework end, and hours you worked are still paid. By the fifteenth day of a term’s classes Yale Health’s cover ends the day you withdraw, or goes back to the start of its insurance term (1 August, for a fall term) where that came first, and its premium is refunded; after it, you’re covered thirty days more. On an F-1 you’d have fifteen days’ grace and no OPT. The Bulletin lets a student who withdrew apply to come back, but the game doesn’t offer a return.
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
        <HowItWorks help="school.withdraw" />
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
      actions={summer || summerRefusal(sim, person) ? undefined : <Gated feature="school.summer_cabaret" onClick={() => { if (run('school.summer_cabaret').ok) toast('You’re in this summer’s company.', 'positive'); }}>Join The Summer Company</Gated>}
      help="school.summer_cabaret"
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
        Three shows between late June and late August, evenings at eight and Saturdays at two, with afternoon rehearsals in the three weeks before each. It pays {formatMoney(inSaveMoney(sim, SUMMER_CABARET.stipendWeekly, 'USD'), cur)} a week. That, later summers’ dates, and the company taking a student in good standing who asks by the end of April are estimated: neither how it’s chosen nor what it pays is published. Miss a performance and the company goes on without you. The summer is yours: the Bulletin limits outside work only while classes are in session. Source: {SUMMER_CABARET.source}.
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
      help="school.shifts"
    >
      <div className="col gap-3">
        {shiftRefusal(person) && <p className="small muted" style={{ margin: 0 }}>{shiftRefusal(person)}</p>}
        <WorkLimitsBlock />
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
        <Fine>The hours and the rate are the school’s. Which Saturdays and evenings is estimated. The protective equipment is the school’s requirement and its $150 the school’s figure; what the kit holds beyond steel-toed work shoes isn’t published. Without it, or the money for it at the shift, the supervisor sends you home. Source: {WORK_STUDY.source}; {REQUIRED_PPE.source}.</Fine>
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
  const found = hasNeed(person);
  // The term they're in, as the engine bills it; until 2026-09-27 the first year's, whatever the year.
  // The calendar term they're in, past the sixth too (from 2026-10-10), and whether it has tuition support and living
  // aid, by the engine's own rule (`termSupport`, from 2026-10-12: until then a term past six counted as unsupported
  // here whatever the aid office's review granted, so a waived term showed as billed and a kept living aid didn't show).
  const current = Math.max(0, school.termsBegun - 1);
  const { unsupported, need } = termSupport(person, enrolledTerms(school).length);
  const waived = !unsupported && enrolledTerms(school).length > YALE_DRAMA.terms;
  const account = termAccount(cur, need, current);
  // This year's figures, as the engine grows them; until 2026-09-27 the sentence quoted 2026–27's in every year.
  const aid = termAccount(cur, true, current);
  const aidBooks = 2 * (aid.livingScholarship - aid.taxable);
  const aidLiving = 2 * aid.livingScholarship - aidBooks;
  // Every calendar term the program runs to, with a leave's or a repeated year's (from 2026-10-10).
  const enrolled = enrolledTerms(school);
  const terms = Array.from({ length: YALE_DRAMA.terms + (school.offset ?? 0) }, (_, i) => ({ i, ...termStart(i) }));
  // What the term's living scholarship put on the Yale account and paid to the bank: its own posting once the term has
  // begun, else what it would, a term past six's paying its tuition first (from 2026-10-16, `aidOnAccount`). Until then
  // the table said the whole refund was paid to the bank, whatever the account owed.
  const yale = yaleAccount(sim, person, false);
  const posted = need ? sim.universe.transactions.find((t) => t.category === 'scholarship' && t.memo.startsWith(`Living-expense scholarship, ${termWords(current)}:`)) : undefined;
  const leg = (keep: (accountId: string) => boolean) => posted!.postings.filter((p) => keep(p.accountId)).reduce((n, p) => n + p.amount, 0);
  const onYale = posted ? leg((id) => id === yale?.id) : unsupported && need ? Math.min(account.tuition, account.refund) : 0;
  const toBank = posted ? leg((id) => id !== yale?.id && sim.universe.accounts[id]?.ownerId === person.id && !sim.universe.accounts[id]?.nominal) : account.refund - onYale;


  return (
    <div className="grid grid-2">
      <Panel title="Your Terms" subtitle={`${enrolled.length} enrolled, ${YALE_DRAMA.terms} with tuition support${school.offset ? `; ${school.offset} on leave or repeated` : ''}`}>
        <LookRegion className="col gap-2">
          {terms.map((t) => (
            <div key={t.i} className="row-between small">
              <span>{termLabel(t.i)}{t.i < school.termsBegun && !enrolled.includes(t.i) ? ', On Leave' : ''}{(school.leaves ?? []).concat(school.leave ? [school.leave] : []).some((l) => l.startedAt !== undefined && (t.i === l.firstTerm || t.i === l.firstTerm + 1)) && t.i >= school.termsBegun ? ', On Leave' : ''}</span>
              <span className={t.i < school.termsBegun ? 'dim' : ''}>
                {t.i < school.termsBegun ? 'Began ' : 'Begins '}<Open subject={at('day', keyOf(t.date))}>{dayOf(t.date)}</Open>{t.estimate ? ' (estimated)' : ''}
              </span>
            </div>
          ))}
          <Fine>
            Source: the Yale Bulletin, for the 2026–2027 dates. Later years aren’t published yet, so they’re estimated from the same pattern.
          </Fine>
        </LookRegion>
      </Panel>

      <Panel title="Your Yale Account" subtitle={termLabel(current)} help="school.money">
        <div className="col gap-3">
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">Each Term</th><th scope="col" className="num">Billed</th><th scope="col" className="num">Credited</th></tr></thead>
              <tbody>
                <tr><td>Tuition</td><td className="num mono">{money(account.tuition)}</td><td /></tr>
                {!unsupported && <tr><td>Tuition Scholarship</td><td /><td className="num mono">{money(account.tuition)}</td></tr>}
                <tr><td>Yale Health Plan</td><td className="num mono">{money(account.healthPlan)}</td><td /></tr>
                {need && <tr><td>Living-Expense Scholarship</td><td /><td className="num mono">{money(account.livingScholarship)}</td></tr>}
                {/* A term billed past six: its tuition on the Yale account, and its health fee too unless living aid meets it, as `billUnsupportedTerm` charges them. */}
                {onYale > 0 && <tr><td>Applied To Your Yale Account</td><td className="num mono" /><td className="num mono">{money(onYale)}</td></tr>}
                {unsupported && <tr className="strong"><td>On Your Yale Account</td><td className="num mono">{money(account.tuition + (need ? 0 : account.healthPlan) - (posted ? Math.min(onYale, account.tuition) : onYale))}</td><td className="num mono" /></tr>}
                {(need || !unsupported) && (
                  <tr className="strong">
                    <td>{need ? 'Paid To Your Bank' : 'Paid From Your Bank'}</td>
                    <td className="num mono">{need ? '' : money(account.healthPlan)}</td>
                    <td className="num mono">{need ? money(toBank) : ''}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="small" style={{ margin: 0 }}>
            {unsupported ? `This term is past the six the tuition scholarship supports, so its tuition${need ? ' is billed to your Yale account, and the living scholarship the aid office kept meets its health fee and pays what the account owes before any reaches your bank' : ' and health fee are billed to your Yale account'}. ` : waived ? 'This term is past the six the tuition scholarship supports, and the aid office granted an exception: it’s supported as the six were. ' : ''}Tuition is met in full for every student’s six terms, from the David Geffen gift. Aid for living costs, {money(aidLiving)} a year with the health plan and up to {money(aidBooks)} of books this year, goes by need, judged from your family’s means. {found ? (need ? 'Yours show need, and the scholarship meets it.' : 'Yours show need, but a term past six has living aid only where the aid office’s review keeps it.') : 'Yours rule it out, so the health plan and living costs come from your bank.'}
          </p>
          <YaleAccountPanel />
          <Fine>The {COST_2026_27.year} figures are the school’s; later years grow at the Bulletins’ own rise from 2022–23, estimated until they’re published. Source: {COST_2026_27.source}.</Fine>
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
  const plays = CONTEMPORARY_PLAYS.map((p) => ({ p, st: studies[p.id], noRead: readRefusal(sim, person, p.id), noResearch: researchRefusal(sim, person, p.id) }));
  // Why a Read It or a Research It is grayed, in words above the plays (from 2026-10-12): until then only each button's
  // tooltip said it, which a phone never shows and a keyboard never reaches. Above the list, not under it, since it's
  // twenty-nine plays long, and each button's reason once: the copy and the hour refuse every play alike.
  const shut = new Map(plays.flatMap(({ st, noRead, noResearch }) => [
    [st ? 'Read It Again' : 'Read It', noRead ?? (read.open ? undefined : read.reason)] as const,
    ...(st && !st.researchedAt ? [['Research It', noResearch ?? (research.open ? undefined : research.reason)] as const] : []),
  ]).map((one) => [`${one[0]}: ${one[1] ?? ''}`, one] as const));
  return (
    <Panel title="Plays To Read" subtitle={'library' in copy ? `A Copy From ${copy.library}` : 'No Copy To Hand'} help="plays.read">
      <div className="col gap-2">
        <div className="xs dim">Twenty-nine plays first staged since 2000, their facts as their theaters and publishers give them. A copy is borrowed from a library to read and research; none is played here, as their texts are under copyright.</div>
        <WhyNot reasons={[...shut.values()]} />
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Play</th><th scope="col">Cast</th><th scope="col">Read</th></tr></thead>
            <tbody>
              {plays.map(({ p, st, noRead, noResearch }) => {
                const fit = partFor(person, p, sim.now, sim.zone);
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
