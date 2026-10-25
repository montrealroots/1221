/**
 * SLATE — the Career screen (from 2026-10-20, the owner's brief 19): where an actor stands as a professional, and the
 * portfolio a submission or an approach sends (`systems/pro.ts`). It had two tabs, Overview and Portfolio, until
 * 2026-10-21, when the agent's Representation came with its system (`ui/career/RepresentationPane.tsx`), the work loop's
 * Opportunities with its (`ui/career/OpportunitiesPane.tsx`, `systems/projobs.ts`) and Work, the engagements' pay and the
 * unions, with the pay's (`ui/career/WorkPane.tsx`); none is shown before it's playable (`ui/shell/sections.ts`). Charts
 * And Awards came on 2026-10-24 (brief 25's Module 6, `ui/career/IndustryPane.tsx`), and with it the Portfolio's
 * Recognition, a nomination, a win or a festival selection kept there for good. Productions And People came on 2026-10-25
 * (brief 27's K8, `ui/career/ReferencePane.tsx`): the productions, companies and people the career touches.
 *
 * Every line is read from the record where the engine keeps it, worked out as it's drawn (`profileOf`,
 * `materialsCheck`, `reelSources`), and every control runs a command through `run`, behind its guide chapter
 * (`<Gated>`), with the command's own refusal said under it before it's pressed (`WhyNot`).
 */

import { useState } from 'react';
import { SECTIONS, tabKey } from '@/ui/shell/sections';
import { useKept } from '@/ui/kept';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { RepresentationPane } from '@/ui/career/RepresentationPane';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { plural } from '@/engine/core/text';
import { countWords } from '@/engine/systems/school';
import { WorkPane } from '@/ui/career/WorkPane';
import {
  DEMO, HEADSHOTS, NAME_MOST, REEL, RESUME, SKILL_LISTED_AT, currentOf, demoCost, demoRefusal, demoSources, headshotCost, headshotRefusal,
  materialsCheck, nameRefusal, pathwayOf, pieceWords, proCreditWords, profileOf, reelCost, reelRefusal, reelSources, resumeBehind, resumeRefusal,
  schoolCreditWords, type MaterialProblem,
} from '@/engine/systems/pro';
import { OpportunitiesPane } from '@/ui/career/OpportunitiesPane';
import { IndustryPane } from '@/ui/career/IndustryPane';
import { ReferencePane } from '@/ui/career/ReferencePane';
import { recognitionOf } from '@/engine/systems/awards';
import { TabBar } from '@/ui/components/TabBar';

type CareerTab = 'overview' | 'portfolio' | 'representation' | 'opportunities' | 'work' | 'industry' | 'reference';

/** Its tabs, as the rail lists them too (`ui/shell/sections.ts`). */
const CAREER_TABS = SECTIONS['/workspace/career'] as readonly { id: CareerTab; label: string }[];

export function CareerWorkspace() {
  const [tab, setTab] = useKept<CareerTab>(tabKey('/workspace/career'), 'overview');
  const panes: Record<CareerTab, JSX.Element> = {
    overview: <OverviewPane toPortfolio={() => setTab('portfolio')} />, portfolio: <PortfolioPane />,
    representation: <RepresentationPane />, opportunities: <OpportunitiesPane />, work: <WorkPane />, industry: <IndustryPane />,
    reference: <ReferencePane />,
  };
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Work</div>
        <h1>Career</h1>
        <p className="muted">Where you stand as a professional actor, your portfolio, and the work you’ve booked with its pay and your unions.</p>
      </div>
      {/* The shared tab bar from 2026-10-23 (`components/TabBar.tsx`); until then its own copy here. */}
      <TabBar tabs={CAREER_TABS} tab={tab} onTab={setTab} label="Career" idPrefix="career" />
      <div role="tabpanel" id={`career-pane-${tab}`} aria-labelledby={`career-tab-${tab}`} tabIndex={0}>
        {panes[tab]}
      </div>
    </>
  );
}

/** A list of problems, each a sentence. */
function Problems({ problems }: { problems: readonly MaterialProblem[] }) {
  return (
    <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>
      {problems.map((p) => <li key={`${p.kind}:${p.problem}`}>{p.words}</li>)}
    </ul>
  );
}

/** Where you stand, the way you're on, what's missing and what's next. */
function OverviewPane({ toPortfolio }: { toPortfolio: () => void }) {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const p = profileOf(person, sim.now);
  const way = pathwayOf(person);
  const problems = materialsCheck(person, 'screen', sim.now);
  const needed = problems.filter((x) => x.blocking);
  const better = problems.filter((x) => !x.blocking);
  return (
    <div className="col gap-5">
      <Panel title="Where You Stand" help="ui.career">
        <dl className="col gap-2 small" style={{ margin: 0 }}>
          <div><dt className="strong">Training</dt><dd style={{ margin: 0 }}>{p.training.words}</dd></div>
          <div><dt className="strong">Availability</dt><dd style={{ margin: 0 }}>{p.availability.words}</dd></div>
          <div><dt className="strong">Based In</dt><dd style={{ margin: 0 }}>{p.location.city}</dd></div>
          <div><dt className="strong">Permission To Work</dt><dd style={{ margin: 0 }}>{p.eligibility.words}</dd></div>
          <div><dt className="strong">Unions</dt><dd style={{ margin: 0 }}>{p.unions.words}</dd></div>
        </dl>
      </Panel>
      <Panel title="The Way You’re On" subtitle={way.heading}>
        <p className="small" style={{ margin: 0 }}>{way.words}</p>
      </Panel>
      <Panel title="What’s Missing">
        <div className="col gap-3">
          {!problems.length && <p className="small" style={{ margin: 0 }}>Your headshots, résumé and reel are all current.</p>}
          {needed.length > 0 && (
            <div className="col gap-2">
              <h3 className="eyebrow" style={{ margin: 0 }}>Needed For Any Submission</h3>
              <Problems problems={needed} />
            </div>
          )}
          {better.length > 0 && (
            <div className="col gap-2">
              <h3 className="eyebrow" style={{ margin: 0 }}>Worth Doing</h3>
              <Problems problems={better} />
            </div>
          )}
        </div>
      </Panel>
      <Panel title="What’s Next">
        <div className="col gap-2">
          <p className="small" style={{ margin: 0 }}>
            {problems.length
              ? `Start with ${problems[0]!.kind === 'headshot' ? 'your headshots' : problems[0]!.kind === 'resume' ? 'your résumé' : 'your reel'}, on the Portfolio tab. Each button there says what it takes before you press it.`
              : 'Keep your portfolio current. A new credit makes your résumé fall behind, and new recorded work is worth adding to your reel. The Portfolio tab says when.'}
          </p>
          <div><button type="button" className="btn btn-sm" onClick={toPortfolio}>Go To Portfolio</button></div>
        </div>
      </Panel>
    </div>
  );
}

/** The profile, headshots, résumé, reel and, from 2026-10-24 (brief 27), voice demo, each with where it came from and its control. */
function PortfolioPane() {
  return (
    <div className="col gap-5">
      <ProfilePanel />
      <HeadshotsPanel />
      <ResumePanel />
      <ReelPanel />
      <DemoPanel />
    </div>
  );
}

function ProfilePanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const p = profileOf(person, sim.now);
  const recognition = recognitionOf(person);
  const [name, setName] = useState('');
  const no = nameRefusal(person, name);
  return (
    <Panel title="Your Profile" help="career.profile">
      <div className="col gap-4">
        <div className="col gap-2">
          <p className="small" style={{ margin: 0 }}>{p.nameSet ? `You work as ${p.name}. Your résumé uses it.` : `You work under your own name, ${p.name}, until you choose another. Your résumé uses it.`}</p>
          <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field">
              <label htmlFor="pro-name">Professional Name</label>
              <input id="pro-name" value={name} maxLength={NAME_MOST} onChange={(e) => setName(e.target.value)} placeholder={p.name} />
            </div>
            <Gated feature="pro.set_name" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ name: string; set: boolean }>('pro.set_name', { name }); if (r.ok) { toast(r.value!.set ? `You’ll work as ${r.value!.name}.` : `You’ll work under your own name, ${r.value!.name}.`, 'positive'); setName(''); } }}>Use This Name</Gated>
          </div>
          {/* Said whether or not anything is typed (from 2026-10-21): until then a grayed Use This Name, with the field empty,
              said nothing under it, where the guide's Your Career says a grayed button's line says why (brief 19's app walk). */}
          <WhyNot reasons={[['Use This Name', no]]} />
          <p className="xs dim" style={{ margin: 0 }}>Leave it blank, or type your own name, to go back to your own name.</p>
        </div>
        <dl className="col gap-2 small" style={{ margin: 0 }}>
          <div><dt className="strong">Training</dt><dd style={{ margin: 0 }}>{p.training.words}</dd></div>
          <div><dt className="strong">Availability</dt><dd style={{ margin: 0 }}>{p.availability.words}</dd></div>
          <div><dt className="strong">Based In</dt><dd style={{ margin: 0 }}>{p.location.city}</dd></div>
          <div><dt className="strong">Permission To Work</dt><dd style={{ margin: 0 }}>{p.eligibility.words}</dd></div>
          <div><dt className="strong">Unions</dt><dd style={{ margin: 0 }}>{p.unions.words}</dd></div>
        </dl>
        <div className="col gap-2">
          <h3 className="eyebrow" style={{ margin: 0 }}>School Credits</h3>
          {p.schoolCredits.length
            ? <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{p.schoolCredits.map((c) => <li key={c.key}>{schoolCreditWords(c)}</li>)}</ul>
            : <p className="small" style={{ margin: 0 }}>None yet. A part you play in a School production goes here once its run has closed.</p>}
        </div>
        <div className="col gap-2">
          <h3 className="eyebrow" style={{ margin: 0 }}>Professional Credits</h3>
          {p.proCredits.length
            ? <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{p.proCredits.map((c) => <li key={c.id}>{proCreditWords(c)}</li>)}</ul>
            : <p className="small" style={{ margin: 0 }}>None yet. Practice, practice briefs and self-tapes don’t count as credits.</p>}
        </div>
        <div className="col gap-2">
          <h3 className="eyebrow" style={{ margin: 0 }}>Recognition</h3>
          {recognition.length
            ? <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{recognition.map((r) => <li key={r.id}>{r.words}</li>)}</ul>
            : <p className="small" style={{ margin: 0 }}>None yet. An Emmy nomination or win, or a festival selection, goes here and stays.</p>}
        </div>
        <div className="col gap-2">
          <h3 className="eyebrow" style={{ margin: 0 }}>Special Skills</h3>
          {p.skills.length
            ? <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>{p.skills.map((s) => <li key={s.skill}>{`${s.label}, ${s.level}${s.mastered ? ', mastered' : ''}`}</li>)}</ul>
            : <p className="small" style={{ margin: 0 }}>{`None yet. A technique such as stage combat, singing or accents goes on your résumé once it reaches ${SKILL_LISTED_AT}.`}</p>}
        </div>
      </div>
    </Panel>
  );
}

function HeadshotsPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const current = currentOf(person.pro, 'headshot');
  const cost = formatMoney(headshotCost(sim), cur);
  const no = headshotRefusal(sim, person);
  const old = current && materialsCheck(person, 'stage', sim.now).find((x) => x.kind === 'headshot');
  const label = `Book A Headshot Session (${plural(HEADSHOTS.minutes / 60, 'Hour')}, ${cost})`;
  return (
    <Panel title="Headshots" help="career.headshots">
      <div className="col gap-3">
        {current ? (
          <dl className="col gap-2 small" style={{ margin: 0 }}>
            <div><dt className="strong">Taken</dt><dd style={{ margin: 0 }}>{formatDate(current.made, sim.zone)}{old ? ', out of date' : ', current'}</dd></div>
            <div><dt className="strong">Where They Came From</dt><dd style={{ margin: 0 }}>{current.source}</dd></div>
            <div><dt className="strong">What’s In Them</dt><dd style={{ margin: 0 }}>{current.contains.join(' ')}</dd></div>
          </dl>
        ) : <p className="small" style={{ margin: 0 }}>You have no headshots yet. A submission starts with one.</p>}
        {old && <p className="small" style={{ margin: 0 }}>{old.words}</p>}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="pro.headshots" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ cost: number }>('pro.headshots'); if (r.ok) toast(`Your headshots are taken: ${formatMoney(r.value!.cost, cur)}.`, 'positive'); }}>{label}</Gated>
        </div>
        <WhyNot reasons={[[label, no]]} />
        <Fine>A session’s price and length are estimated: no source the game uses prices one. Headshots more than two years old read as out of date, which is estimated too.</Fine>
      </div>
    </Panel>
  );
}

function ResumePanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const current = currentOf(person.pro, 'resume');
  const behind = resumeBehind(person, sim.now);
  const no = resumeRefusal(sim, person);
  const label = `${current ? 'Update' : 'Make'} Your Résumé (${plural(RESUME.minutes / 60, 'Hour')})`;
  return (
    <Panel title="Résumé" help="career.resume">
      <div className="col gap-3">
        {current ? (
          <>
            <dl className="col gap-2 small" style={{ margin: 0 }}>
              <div><dt className="strong">Made</dt><dd style={{ margin: 0 }}>{`${formatDate(current.made, sim.zone)}, the ${current.version === 1 ? 'first' : `version ${current.version}`}`}</dd></div>
              <div><dt className="strong">Where It Came From</dt><dd style={{ margin: 0 }}>{current.source}</dd></div>
              <div><dt className="strong">Standing</dt><dd style={{ margin: 0 }}>{behind.length ? `Behind: it doesn’t have ${behind.join('; ')}.` : 'Up to date with your record.'}</dd></div>
            </dl>
            <details className="small">
              <summary>What It Says</summary>
              <ul style={{ margin: 'var(--s2) 0 0', paddingLeft: '1.1rem' }}>{current.contains.map((line, i) => <li key={i}>{line}</li>)}</ul>
            </details>
          </>
        ) : <p className="small" style={{ margin: 0 }}>You have no résumé yet. It’s made from your record: your name, training, credits and special skills.</p>}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="pro.update_resume" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ version: number }>('pro.update_resume'); if (r.ok) toast(r.value!.version === 1 ? 'Your résumé is made.' : 'Your résumé is up to date.', 'positive'); }}>{label}</Gated>
        </div>
        <WhyNot reasons={[[label, no]]} />
        <Fine>The hour a résumé takes is estimated.</Fine>
      </div>
    </Panel>
  );
}

function ReelPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const current = currentOf(person.pro, 'reel');
  const sources = reelSources(person, sim.now);
  const usable = sources.filter((s) => s.usable);
  const unusable = sources.filter((s) => !s.usable);
  const [chosen, setChosen] = useState<string[]>([]);
  const no = reelRefusal(sim, person, chosen);
  const notes = materialsCheck(person, 'screen', sim.now).filter((x) => x.kind === 'reel' && x.problem !== 'missing');
  const label = `Cut A Reel (${plural(REEL.minutes / 60, 'Hour')}, ${formatMoney(reelCost(sim), cur)})`;
  const toggle = (ref: string) => setChosen((was) => (was.includes(ref) ? was.filter((x) => x !== ref) : [...was, ref]));
  return (
    <Panel title="Reel" help="career.reel">
      <div className="col gap-3">
        {current ? (
          <dl className="col gap-2 small" style={{ margin: 0 }}>
            <div><dt className="strong">Cut</dt><dd style={{ margin: 0 }}>{formatDate(current.made, sim.zone)}</dd></div>
            <div><dt className="strong">Where It Came From</dt><dd style={{ margin: 0 }}>{current.source}</dd></div>
            <div>
              <dt className="strong">What’s On It</dt>
              <dd style={{ margin: 0 }}><ul style={{ margin: 0, paddingLeft: '1.1rem' }}>{current.contains.map((line, i) => <li key={i}>{line}</li>)}</ul></dd>
            </div>
          </dl>
        ) : <p className="small" style={{ margin: 0 }}>You have no reel yet. A reel is cut only from work that was recorded: your self-tapes, the School’s filmed monologues once they’re posted, and screen work once it’s released.</p>}
        {notes.length > 0 && <Problems problems={notes} />}
        {usable.length > 0 ? (
          <fieldset className="col gap-2" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="small strong">Recorded Work To Cut From</legend>
            <p className="xs dim" style={{ margin: 0 }}>{`Choose up to ${countWords(REEL.most)} pieces. Each shows how it was judged.`}</p>
            <ul className="small" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {usable.map((s, i) => (
                <li key={s.ref} className="row gap-2" style={{ alignItems: 'baseline' }}>
                  <input type="checkbox" id={`reel-piece-${i}`} checked={chosen.includes(s.ref)} onChange={() => toggle(s.ref)} />
                  <label htmlFor={`reel-piece-${i}`}>{pieceWords(s, sim.zone)}</label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : <p className="small" style={{ margin: 0 }}>No recorded work yet. Tape a practice brief on the Player Profile, and it’s here to cut from.</p>}
        {unusable.length > 0 && (
          <details className="small">
            <summary>{`Recorded, But Not For A Reel (${unusable.length})`}</summary>
            <ul style={{ margin: 'var(--s2) 0 0', paddingLeft: '1.1rem' }}>{unusable.map((s) => <li key={s.ref}>{`${pieceWords(s, sim.zone)}. ${s.why}`}</li>)}</ul>
          </details>
        )}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="pro.cut_reel" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ cost: number; pieces: number }>('pro.cut_reel', { pieces: chosen }); if (r.ok) { toast(`Your reel is cut: ${plural(r.value!.pieces, 'piece')}, ${formatMoney(r.value!.cost, cur)}.`, 'positive'); setChosen([]); } }}>{label}</Gated>
        </div>
        <WhyNot reasons={[[label, no]]} />
        <Fine>The edit’s price and the two hours are estimated. A night on stage and a class piece aren’t recorded, so they can’t go on a reel.</Fine>
      </div>
    </Panel>
  );
}

/**
 * The voice demo (from 2026-10-24, the owner's brief 27, Part 7): mixed from recordings of the voice alone, which a reel
 * can't hold, and sent with a submission for voice work where a reel goes with screen work's.
 */
function DemoPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const cur = saveCurrency(sim.universe);
  const current = currentOf(person.pro, 'demo');
  const sources = demoSources(person, sim.now);
  const [chosen, setChosen] = useState<string[]>([]);
  const no = demoRefusal(sim, person, chosen);
  const notes = materialsCheck(person, 'voice', sim.now).filter((x) => x.kind === 'demo' && x.problem !== 'missing');
  const label = `Mix A Voice Demo (${plural(DEMO.minutes / 60, 'Hour')}, ${formatMoney(demoCost(sim), cur)})`;
  const toggle = (ref: string) => setChosen((was) => (was.includes(ref) ? was.filter((x) => x !== ref) : [...was, ref]));
  return (
    <Panel title="Voice Demo" help="career.demo">
      <div className="col gap-3">
        {current ? (
          <dl className="col gap-2 small" style={{ margin: 0 }}>
            <div><dt className="strong">Mixed</dt><dd style={{ margin: 0 }}>{`${formatDate(current.made, sim.zone)}, the ${current.version === 1 ? 'first' : `version ${current.version}`}`}</dd></div>
            <div><dt className="strong">Where It Came From</dt><dd style={{ margin: 0 }}>{current.source}</dd></div>
            <div>
              <dt className="strong">What’s On It</dt>
              <dd style={{ margin: 0 }}><ul style={{ margin: 0, paddingLeft: '1.1rem' }}>{current.contains.map((line, i) => <li key={i}>{line}</li>)}</ul></dd>
            </div>
          </dl>
        ) : <p className="small" style={{ margin: 0 }}>You have no voice demo yet. Voice casting, for animation, dubbing and narration, listens to one where screen casting watches a reel. It’s mixed only from recordings of your voice: your takes of voice briefs, and voice work once it’s released.</p>}
        {notes.length > 0 && <Problems problems={notes} />}
        {sources.length > 0 ? (
          <fieldset className="col gap-2" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="small strong">Voice Recordings To Mix From</legend>
            <p className="xs dim" style={{ margin: 0 }}>{`Choose up to ${countWords(DEMO.most)} recordings. Each shows how it was judged.`}</p>
            <ul className="small" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {sources.map((s, i) => (
                <li key={s.ref} className="row gap-2" style={{ alignItems: 'baseline' }}>
                  <input type="checkbox" id={`demo-piece-${i}`} checked={chosen.includes(s.ref)} onChange={() => toggle(s.ref)} />
                  <label htmlFor={`demo-piece-${i}`}>{pieceWords(s, sim.zone)}</label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : <p className="small" style={{ margin: 0 }}>You haven’t recorded your voice yet. Tape a voice brief on the Player Profile, and it’s here to mix from.</p>}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="pro.mix_demo" className="btn btn-sm" disabled={!!no} title={no} onClick={() => { const r = run<{ cost: number; pieces: number }>('pro.mix_demo', { pieces: chosen }); if (r.ok) { toast(`Your voice demo is mixed: ${plural(r.value!.pieces, 'recording')}, ${formatMoney(r.value!.cost, cur)}.`, 'positive'); setChosen([]); } }}>{label}</Gated>
        </div>
        <WhyNot reasons={[[label, no]]} />
        <Fine>The session’s price and the two hours are estimated. A voice demo holds only recordings of your voice, and a submission keeps the demo it sent after you mix another.</Fine>
      </div>
    </Panel>
  );
}
