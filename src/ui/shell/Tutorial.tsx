/**
 * SLATE — contextual tutorials.
 *
 * The first time you enter a deep system, it explains itself, once. Tutorial
 * progress lives on the save but resetting it never touches save data.
 */

import { useEffect } from 'react';
import { useGame } from '@/app/game-context';

export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  /** Shown as the primary action. */
  cta?: string;
}

export const TUTORIALS: Readonly<Record<string, TutorialStep>> = {
  '/home': {
    id: 'home',
    title: 'This Is Home',
    body: 'Where you are, what time it is, what happens next, and anything that needs deciding. When something genuinely needs you, it appears in the Decision Center rather than being buried in a menu.',
  },
  '/workspace/calendar': {
    id: 'calendar',
    title: 'Calendar Catches Collisions',
    body: 'Everything that takes your time lands here. If a shift and an audition want the same afternoon, the calendar flags it before it costs you one of them.',
  },
  '/workspace/bank': {
    id: 'bank',
    title: 'Every Balance Has A Cause',
    body: 'Balances are the sum of transactions, never a number someone typed. Anything you see here can be traced back to the thing that caused it.',
  },
  '/workspace/casting': {
    id: 'casting',
    title: 'You Can Lose The Part',
    body: 'You are scored against everyone else who read. Preparation and how rested you are on the day are real inputs, and when you do not get it, you can find out why.',
  },
  '/workspace/projects': {
    id: 'projects',
    title: 'One Project, All The Way Through',
    body: 'There is one record per film. Writing, casting, the shoot, post, marketing and the result all point at it, so nothing ever gets out of step with itself.',
  },
  '/workspace/property': {
    id: 'property',
    title: 'Buying Is A Process',
    body: 'Showings, an offer, a counter, an inspection that finds things, an appraisal that can come in low, and financing that has to be approved. It is not one button.',
  },
  '/workspace/vehicles': {
    id: 'vehicles',
    title: 'Not Every Part Fits',
    body: 'Modifications are checked against your exact car and against what is already fitted. Some void the warranty, some fail inspection, and your insurer has opinions about both.',
  },
  '/workspace/social': {
    id: 'social',
    title: 'Posting Guarantees Nothing',
    body: 'Reach depends on quality, your audience, consistency, momentum and timing. Going viral is a roll you can improve the odds of and never buy outright.',
  },
  '/workspace/company': {
    id: 'company',
    title: 'Scale Has To Be Earned',
    body: 'What a company can commit to comes from its cash, its library and its track record. That is why a new production company cannot greenlight a tentpole on day one.',
  },
  '/workspace/relationships': {
    id: 'relationships',
    title: 'People Remember',
    body: 'Seven dimensions, not one bar, and a memory of what you actually did. Showing up when it matters is remembered permanently; so is not showing up.',
  },
};

export function TutorialCard() {
  const { sim, route, run, refresh } = useGame();
  const tutorial = TUTORIALS[route];
  const progress = sim.universe.tutorial;

  const shouldShow = Boolean(
    tutorial &&
    progress.guidedMode &&
    !progress.completed.includes(tutorial.id) &&
    !progress.dismissed.includes(tutorial.id),
  );

  useEffect(() => {
    if (shouldShow && tutorial && !progress.active.includes(tutorial.id)) {
      progress.active.push(tutorial.id);
      refresh();
    }
  }, [shouldShow, tutorial, progress, refresh]);

  if (!shouldShow || !tutorial) return null;

  return (
    <div className="tutorial-card" role="dialog" aria-label={tutorial.title}>
      <div className="row-between" style={{ marginBottom: 'var(--s2)' }}>
        <span className="eyebrow">Guided mode</span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => run('tutorial.dismiss', { tutorialId: tutorial.id })}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <h3 style={{ marginBottom: 'var(--s2)' }}>{tutorial.title}</h3>
      <p className="small muted">{tutorial.body}</p>
      <div className="row gap-2" style={{ marginTop: 'var(--s3)' }}>
        <button className="btn btn-primary btn-sm" onClick={() => run('tutorial.complete', { tutorialId: tutorial.id })}>
          {tutorial.cta ?? 'Got It'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => run('tutorial.set_mode', { guided: false })}>
          Turn Guided Mode Off
        </button>
      </div>
    </div>
  );
}
