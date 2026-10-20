/**
 * The frame's words, read in every variant a sentence built from parts has (from 2026-10-17, the owner's brief 14,
 * "Complete Player-Facing Language And Tutorial Overhaul": its frame area, `docs/verification/language-2026-10-17/frame/`).
 *
 * Each test draws what the player reads, through the code that writes it, and holds it word for word: one and many,
 * none, the states a thing can be in, and a missing part. What a sentence says is checked against the rule it says it
 * of, never against the helper that writes it.
 *
 * TEST SETUP, said where it's done: questions raised through `requireDecision` as their raisers raise them, and closed by
 * hand the way the world tick and an answer close them.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate } from '@/engine/core/time';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import '@/ui/looks/attention';

/** The words a player reads in a look's body: tags out, entities back, spaces closed. */
const words = (node: unknown): string => renderToStaticMarkup(node as never)
  .replace(/<\/(p|span|div)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
const look = (sim: Simulation, kind: string, id: string) => resolveLook(sim, at(kind, id)) as Looked;

/** A question as the tax return raises one (`systems/taxreturn.ts`): urgency 70, filed from Papers. TEST SETUP. */
function ask(sim: Simulation, n: number, extra: { urgency?: number; dueAt?: number; route?: string; actions?: { label: string; commandKind: string; payload: Record<string, unknown> }[] } = {}) {
  sim.requireDecision({
    urgency: extra.urgency ?? 70, category: 'taxes', title: `Your ${2020 + n} Tax Return`, detail: 'You owe $10.00 on $100.00 of income.',
    dueAt: extra.dueAt ?? sim.now + 60 * MS_DAY, refType: 'return', refId: String(2020 + n),
    ...(extra.route ? { route: extra.route } : {}), actions: extra.actions ?? [{ label: 'File It', commandKind: 'tax.file', payload: { year: 2020 + n } }],
  });
  return Object.values(sim.universe.decisions).find((d) => d.refId === String(2020 + n))!;
}

describe('a question in What Needs You, opened', () => {
  it('says when to answer it, where it sits among the rest, its buttons on Home, and what closes it, for one and for several', () => {
    const sim = quickSave({}, 'frame-question');
    for (const d of Object.values(sim.universe.decisions)) d.dismissedAt = sim.now;
    const due = sim.now + 60 * MS_DAY;
    const one = ask(sim, 6, { dueAt: due, route: '/workspace/papers' });
    let seen = look(sim, 'decision', one.id);
    expect([seen.kind, seen.name, seen.summary]).toEqual(['Waiting On You', 'Your 2026 Tax Return', `Answer it by ${formatDate(due, sim.zone)}. That’s in 2 months.`]);
    const body = words(seen.body);
    expect(body).toContain('It came up just now, about your taxes. Its urgency is high, at 70/100. If it comes up again while it’s open, its urgency can only go up. It’s the only question waiting on you.');
    expect(body).toContain(`It closes when you answer it on Home or deal with it on its own screen. If you don’t, it closes by itself within two days after its date, ${formatDate(due, sim.zone)}. You can still open it here for 180 days after it closes.`);
    expect(body).toContain('On Home, its buttons are File It, Go There and Dismiss. Reading it here changes nothing.');
    expect(seen.provenance).toBe('Urgency is estimated, from 0 to 100.');

    // Several: the more urgent first, and past Home's six rows, a seventh waits for its buttons.
    const urgent = ask(sim, 1, { urgency: 90 });
    for (let n = 2; n <= 5; n++) ask(sim, n, { urgency: 50 });
    const low = ask(sim, 7, { urgency: 20, actions: [] });
    expect(look(sim, 'decision', urgent.id).summary).toMatch(/^Answer it by /);
    expect(words(look(sim, 'decision', urgent.id).body)).toContain('Its urgency is very high, at 90/100.');
    expect(words(look(sim, 'decision', urgent.id).body)).toContain('It’s first of the seven questions waiting on you.');
    seen = look(sim, 'decision', low.id);
    expect(words(seen.body)).toContain('Its urgency is low, at 20/100.');
    expect(words(seen.body)).toContain('It’s seventh of the seven questions waiting on you.');
    expect(words(seen.body)).toContain('Home shows the first six questions, and this one is further down. Its buttons appear there once one of the questions above it closes.');
    expect(words(seen.body)).toContain('Answers None It can only be dismissed');
    expect(words(look(sim, 'decision', ask(sim, 3).id).body)).toContain('Its urgency is high, at 70/100.');
    expect(words(look(sim, 'decision', ask(sim, 2, { urgency: 50 }).id).body)).toContain('Its urgency is ordinary, at 50/100.');
  });

  it('says an overdue question comes first and closes itself within the world tick’s two days, and each way one closes', () => {
    const sim = quickSave({}, 'frame-question-closed');
    for (const d of Object.values(sim.universe.decisions)) d.dismissedAt = sim.now;
    const late = ask(sim, 1, { dueAt: sim.now + MS_HOUR });
    ask(sim, 2, { urgency: 95 });
    sim.advanceTo(sim.now + 4 * MS_HOUR);
    // The tick hasn't come yet: still open, past its date. TEST SETUP: the tick's closing is by hand below.
    late.resolvedAt = undefined;
    let seen = look(sim, 'decision', late.id);
    expect(seen.summary).toBe('Its date passed 3 hours ago. It stays at the top of What Needs You until it closes by itself, within two days.');
    expect(words(seen.body)).toContain('Being overdue puts it first, ahead of anything more urgent.');
    expect(words(seen.body)).toContain('Place On Home 1 of 2 Overdue first, then the most urgent');

    // Closed by the world tick after its date: no longer waiting, nothing to press.
    late.resolvedAt = sim.now;
    seen = look(sim, 'decision', late.id);
    expect([seen.kind, seen.summary]).toEqual(['No Longer Waiting', 'It closed after its date had passed, so it isn’t asking you for anything now.']);
    expect(words(seen.body)).toContain('It closed just now, and Home no longer lists it.');
    expect(words(seen.body)).toContain(`You can still open it here until ${formatDate(sim.now + 180 * MS_DAY, sim.zone)}, 180 days after it closed.`);
    expect(words(seen.body)).toContain('It’s no longer on Home, so there’s nothing to press.');
    expect(words(seen.body)).toContain('Not listed Closed after its date');

    // Answered before its date.
    const filed = ask(sim, 3);
    sim.advanceTo(sim.now + 2 * MS_HOUR);
    filed.resolvedAt = sim.now - MS_HOUR;
    seen = look(sim, 'decision', filed.id);
    expect(seen.summary).toBe('It was dealt with 1 hour ago, so it’s no longer in What Needs You.');
    expect(words(seen.body)).toContain('Not listed Dealt with');

    // Dismissed from Home: what it was about still stands.
    const waved = ask(sim, 4);
    sim.must({ kind: 'world.dismiss_decision', payload: { decisionId: waved.id } });
    seen = look(sim, 'decision', waved.id);
    expect(seen.summary).toBe(`You dismissed it from Home just now. Dismissing only takes it off the list: what it was about still stands, and its date is ${formatDate(waved.dueAt, sim.zone)}.`);
    expect(words(seen.body)).toContain('Not listed Dismissed');

    // Gone from the save, and a notice gone from the log.
    expect(resolveLook(sim, at('decision', 'decision_none'))).toEqual({ gone: 'That question closed more than 180 days ago, so there’s nothing left to open.' });
    expect(resolveLook(sim, at('notification', 'notice_none'))).toEqual({ gone: 'That notice is gone. SLATE keeps only your latest 500 notices, and this one was older.' });
  });
});

describe('a notice, opened', () => {
  it('says when it came, where it sits among the unread, what Mark Read does, and how long it’s kept, for one, for many and read', () => {
    const sim = quickSave({}, 'frame-notice');
    sim.must({ kind: 'world.mark_read', payload: {} });
    sim.notify({ category: 'school', title: 'A Word On Your Coursework', body: 'Two pieces are unready.', importance: 70, route: '/workspace/school' });
    let note = sim.universe.notifications.at(-1)!;
    let seen = look(sim, 'notification', note.id);
    expect([seen.kind, seen.name, seen.summary]).toEqual(['Notice', 'A Word On Your Coursework', 'It came in just now, and it’s your only unread notice.']);
    expect(words(seen.body)).toContain('It’s about your school, and its importance is 70/100. Unread notices are listed most important first, and the newer first when two are equal. Opening it here doesn’t mark it read. On Home, Mark 1 Read marks it read. On Home, Go There opens the screen it’s about.');
    expect(seen.provenance).toBeUndefined();

    sim.advanceTo(sim.now + 2 * MS_HOUR);
    sim.notify({ category: 'bank', title: 'Paid', body: 'Paid $5.00.', importance: 80 });
    sim.notify({ category: 'mystery_side', title: 'Quiet', body: 'A quiet one.', importance: 10 });
    seen = look(sim, 'notification', note.id);
    expect(seen.summary).toBe('It came in 2 hours ago. It’s second of your three unread notices.');
    expect(words(seen.body)).toContain('On Home, Mark 3 Read marks all 3 unread notices read at once.');
    expect(words(seen.body)).toContain('Status Unread 2 of 3 unread');
    const quiet = sim.universe.notifications.at(-1)!;
    expect(words(look(sim, 'notification', quiet.id).body)).toContain('It’s about something in your life, and its importance is 10/100.');
    expect(words(look(sim, 'notification', quiet.id).body)).toContain('About Mystery Side');

    sim.must({ kind: 'world.mark_read', payload: {} });
    note = sim.universe.notifications.find((n) => n.id === note.id)!;
    seen = look(sim, 'notification', note.id);
    expect(seen.summary).toBe('You’ve read this notice. It came in 2 hours ago.');
    expect(words(seen.body)).toContain('SLATE keeps your latest 500 notices, so this one stays until 500 newer ones have come in.');
    expect(words(seen.body)).toContain('Status Read No longer listed on Home');
  });
});

describe('a life’s own words: the night, a failure to start or open', () => {
  it('says when not even the longest night would make up a day, late and not, from LONGEST_NIGHT', async () => {
    const { suggestedSleep, LONGEST_NIGHT } = await import('@/engine/systems/life');
    const sim = quickSave({}, 'frame-long-night');
    for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.requiresPlayer) sim.timeline.cancel(i.id, sim.now);
    // TEST SETUP: a body owed more sleep than any night can repay, as weeks of short nights leave one.
    Object.assign(sim.player.wellbeing, { sleepDebt: 100, stress: 95 });
    const said = suggestedSleep(sim).reason;
    expect(LONGEST_NIGHT).toBe(14);
    expect(['Going to bed this late, not even fourteen hours of sleep would make up for a whole day. An earlier night would.', 'Not even fourteen hours of sleep would make up for a whole day tonight.']).toContain(said);
  });

  it('says a life that couldn’t start what the slot holds, and a save that couldn’t open what to do', async () => {
    const { startFailure, OPEN_FAILURE } = await import('@/app/SlateApp');
    const { PersistenceError } = await import('@/engine/persistence/adapter');
    expect(startFailure(new PersistenceError('There isn’t enough storage space on this device to save, so nothing in the slot changed. Free some space, or delete a save you no longer want, then try again.', true)))
      .toBe('Your new life couldn’t be saved, so it hasn’t started. There isn’t enough storage space on this device to save, so nothing in the slot changed. Free some space, or delete a save you no longer want, then try again.');
    expect(startFailure(new TypeError('Cannot read properties of undefined (reading \'countryId\')'))).toBe('Your new life couldn’t start because of an error in the game, and nothing was saved to the slot.');
    expect(OPEN_FAILURE).toBe('That save couldn’t be opened because of an error in the game. Restart SLATE to try again, or restore the slot’s backup if it has one.');
  });
});

describe('the entry rules’ notes, as the Papers screen’s fine print shows them', () => {
  it('keeps a note’s first word whole, and says a country’s own citizen is one', async () => {
    const { ENTRY } = await import('@/engine/content/entry');
    // Until 2026-10-17 the builder took "Visa exempt" off "Visa exemption", and Japan's rule read "Ion for short-term stay".
    expect(ENTRY.JP!.citizens.US!.note).toBe('No visa is needed for a short stay of up to 90 days. There’s no travel authorization to apply for yet: Japan plans one, JESTA, but when it starts wasn’t confirmed.');
    expect(Object.values(ENTRY).flatMap((d) => Object.values(d.citizens)).filter((r) => /^Ion\b/.test(r.note))).toEqual([]);
    expect(ENTRY.US!.citizens.US).toMatchObject({ status: 'citizen', note: 'You’re one of its citizens.' });
    expect(Object.values(ENTRY).flatMap((d) => Object.values(d.citizens)).filter((r) => r.note === 'Own nationals.')).toEqual([]);
  });

  // From 2026-10-19 (brief 15): the research's shorthand said as sentences (`tools/entry-notes.mjs`). Until then a note
  // pointed at "see uncertain", a list no screen shows, named agencies by their initials alone, and ran on semicolons.
  it('says each rule in sentences, with no pointer to a list the player can’t see and no agency by its initials alone', async () => {
    const { ENTRY } = await import('@/engine/content/entry');
    const notes = Object.values(ENTRY).flatMap((d) => Object.values(d.citizens)).map((r) => r.note);
    expect(notes.filter((n) => /see uncertain|\bCBP\b|\bMOFA\b|authoris|scrutinis|;/.test(n))).toEqual([]);
    expect(ENTRY.US!.citizens.GB!.note).toBe('Under the Visa Waiver Program: up to 90 days each visit, with no extension. There’s no fixed limit over a year, but border officers look closely at frequent or long stays. You need an e-passport.');
    expect(ENTRY.FR!.citizens.GB!.note).toBe('Under Regulation (EU) 2018/1806, Annex II: up to 90 days in any 180-day period across the whole Schengen area. Since October 12, 2025, visitors register their fingerprints and a photo in the Entry/Exit System (EES) at the external border, fully running from April 10, 2026. ETIAS will be required once it launches. It wasn’t live on September 29, 2026. UK nationals have been treated as non-EU nationals since January 1, 2021.');
    expect(ENTRY.NZ!.citizens.US!.note).toBe('No visa is needed for up to 3 months each visit, but you need an NZeTA and must pay the visitor levy (IVL, NZD 100) before you travel.');
    expect(ENTRY.DE!.citizens.FR!.note).toBe('Free movement within the EU and EEA.');
  });
});

describe('the breadcrumbs’ names', () => {
  it('name a screen reached without a label, by a notice’s Go There or an address, as the rail names it', async () => {
    const { labelForRoute } = await import('@/app/game-context');
    const { RAIL_DESTINATIONS } = await import('@/ui/shell/destinations');
    const rail = RAIL_DESTINATIONS.flatMap((g) => g.items);
    expect(rail.length).toBeGreaterThan(0);
    for (const d of rail) expect(labelForRoute(d.route), d.route).toBe(d.label);
    // Until 2026-10-17 School's breadcrumb was "Your School" where its rail entry, its Home line and its own heading say School.
    expect(['/home', '/workspace/calendar', '/workspace/school'].map(labelForRoute)).toEqual(['Home', 'Calendar', 'School']);
  });
});
