/**
 * SLATE — The simulation kernel.
 *
 * This is the object every system talks to. It owns:
 *   - the one world clock and the ONE code path that advances it;
 *   - the event bus that lets buying a house touch nine other systems;
 *   - the ledger, timeline, historian and deterministic RNG;
 *   - the command bus, which gives every mutation idempotency and atomicity.
 *
 * Nothing outside this file is allowed to assign `universe.now`.
 */

import type { SaveUniverse, Id } from '../domain/model';
import type { Instant, TimeZone } from './time';
import { addDays, addMonths, addYears, MS_MINUTE, MS_DAY, formatDateTime } from './time';
import { Ledger, type LedgerTransaction, type Account } from './ledger';
import { Timeline, type ScheduledItem, type Recurrence, nextRecurrence } from './scheduler';
import { Historian, type HistoryRecord } from './audit';
import { EventBus, type WorldEvent, worldEvent } from './events';
import { createIdFactory, type IdNamespace } from './ids';
import { rngFor, type Rng } from './rng';
import type { Money } from './money';

/** Handlers for scheduled items, keyed by `ScheduledItem.kind`. */
export type ScheduleHandler = (item: ScheduledItem, sim: Simulation) => void;

/**
 * Something that happens as time passes rather than at an instant. It is
 * handed the instant the clock has just moved from; the clock stands at
 * `sim.now`.
 */
export type PassageReactor = (sim: Simulation, from: Instant) => void;

/** A command mutates the universe. Commands are the only legal way to do so. */
export interface Command<P = Record<string, unknown>, R = unknown> {
  kind: string;
  payload: P;
  /** Repeating a command with the same key returns the first result. */
  idempotencyKey?: string;
  /**
   * Phantom marker carrying the result type so `execute` can infer it from the
   * command literal. Never set at runtime.
   */
  readonly __result?: R;
}

export interface CommandContext {
  sim: Simulation;
  u: SaveUniverse;
  now: Instant;
}

export type CommandHandler<P = never, R = unknown> = (payload: P, ctx: CommandContext) => R;

export interface CommandResult<R = unknown> {
  ok: boolean;
  value?: R;
  error?: string;
  /** True when the command was a replay of an already-applied idempotency key. */
  replayed?: boolean;
  /** Events emitted, for tests and the developer console. */
  events?: string[];
}

export class CommandError extends Error {
  constructor(message: string, readonly code = 'command_failed') {
    super(message);
    this.name = 'CommandError';
  }
}

/** Progress callback for long time jumps, so the UI can show a real bar. */
export type AdvanceProgress = (processed: number, total: number, at: Instant) => void;

export interface AdvanceResult {
  from: Instant;
  to: Instant;
  itemsProcessed: number;
  /** Items that needed the player but were passed while they were unavailable. */
  missed: ScheduledItem[];
  events: WorldEvent[];
  /** Set when advancement stopped early because something demands attention. */
  interruptedBy?: ScheduledItem;
}

const MAX_ITEMS_PER_ADVANCE = 250_000;

export class Simulation {
  readonly ledger: Ledger;
  readonly timeline: Timeline;
  readonly historian: Historian;
  readonly bus: EventBus<CommandContext & { emit: (e: WorldEvent) => void }>;
  readonly nextId: (ns: IdNamespace) => Id;

  private scheduleHandlers = new Map<string, ScheduleHandler>();
  private passageReactors = new Map<string, PassageReactor>();
  private commandHandlers = new Map<string, CommandHandler<never, unknown>>();
  private pendingEvents: WorldEvent[] = [];
  private advancing = false;
  /** The advance in progress, for `advancingTo`. */
  private advance: { from: Instant; target: Instant; stopsForPlayer: boolean } | undefined;
  private depth = 0;

  constructor(public universe: SaveUniverse) {
    this.ledger = new Ledger(universe);
    this.timeline = new Timeline(universe);
    this.historian = new Historian(universe);
    this.bus = new EventBus();
    this.nextId = createIdFactory(universe as unknown as { __idCounter: number });
  }

  // -------------------------------------------------------------------------
  // Clock
  // -------------------------------------------------------------------------

  get now(): Instant {
    return this.universe.now;
  }

  get zone(): TimeZone {
    return this.universe.currentZone;
  }

  get homeZone(): TimeZone {
    return this.universe.homeZone;
  }

  get player() {
    const p = this.universe.people[this.universe.playerId];
    if (!p) throw new Error('Save universe has no player. This save is corrupt.');
    return p;
  }

  /** Seeded stream. The same situation always draws the same number. */
  rng(stream: string, ...keys: (string | number)[]): Rng {
    return rngFor(this.universe.meta.seed, stream, ...keys);
  }

  // -------------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------------

  onSchedule(kind: string, handler: ScheduleHandler): this {
    if (this.scheduleHandlers.has(kind)) {
      throw new Error(`Duplicate schedule handler for '${kind}'.`);
    }
    this.scheduleHandlers.set(kind, handler);
    return this;
  }

  /**
   * Registers something that time does on its own, as it passes.
   *
   * It runs every time the clock moves: at each instant `advanceTo` stops on to
   * run something due there, before that thing runs, and at the instant it
   * ends on. So what it does is spread over the clock the way the clock was
   * actually moved, one second at a time in live play and a stretch at a time
   * in a jump, and whatever is due next finds it already done. It is handed
   * the stretch just crossed, and every stretch exactly once: the stops of
   * one advance meet end to end, each advance starts where the last one
   * stopped, and a command that fails rolls the clock back with everything
   * that was charged on the way.
   *
   * Waking drain was the first. It used to be charged by the midnight
   * rollover, for the whole day ahead in one lump, so nothing on Home moved
   * while a day was played and energy fell seventy-two points at midnight.
   * The second puts somebody to bed when the clock is carried through the
   * rest of a night the player kept them up in. They run in the order they
   * were registered, so the night comes before the drain that would
   * otherwise charge its hours as awake.
   */
  onPassage(name: string, reactor: PassageReactor): this {
    if (this.passageReactors.has(name)) {
      throw new Error(`Duplicate passage reactor '${name}'.`);
    }
    this.passageReactors.set(name, reactor);
    return this;
  }

  /**
   * Where the advance in progress will stop, or undefined outside one: its
   * target, or the first thing before it that needs the player, when it was
   * asked to stop for one.
   *
   * It is how the world tells a player who is there from one who has jumped
   * the clock. Live play moves it a second at a time and never more than half
   * an hour, and One Hour on the Advance menu an hour, and either way the
   * player is back before long; a skip carries it through whole nights.
   * People sleep through a night nobody stays up with them (`life.ts`), and
   * nobody can tell that at midnight from the midnight alone. Something
   * scheduled during the advance that stops it for the player is not
   * foreseen.
   */
  get advancingTo(): Instant | undefined {
    const advance = this.advance;
    if (!advance) return undefined;
    if (!advance.stopsForPlayer) return advance.target;
    const after = this.universe.now > advance.from ? this.universe.now - 1 : advance.from;
    const stop = this.timeline.next(after, (item) => item.requiresPlayer === true);
    return stop !== undefined && stop.at <= advance.target ? stop.at : advance.target;
  }

  onCommand<P, R>(kind: string, handler: CommandHandler<P, R>): this {
    if (this.commandHandlers.has(kind)) {
      throw new Error(`Duplicate command handler for '${kind}'.`);
    }
    this.commandHandlers.set(kind, handler as CommandHandler<never, unknown>);
    return this;
  }

  onEvent(kind: string, name: string, reactor: (event: WorldEvent, ctx: CommandContext & { emit: (e: WorldEvent) => void }) => void, priority = 100): this {
    this.bus.on(kind, name, reactor, priority);
    return this;
  }

  hasCommand(kind: string): boolean {
    return this.commandHandlers.has(kind);
  }

  commandKinds(): string[] {
    return [...this.commandHandlers.keys()].sort();
  }

  scheduleKinds(): string[] {
    return [...this.scheduleHandlers.keys()].sort();
  }

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  /**
   * Emits an event and runs every reactor, synchronously, inside the current
   * transaction. One event can have any number of reactors, and all of them
   * run here, before the command that emitted it returns.
   */
  emit<P>(kind: string, payload: P, opts: { at?: Instant; subjectId?: string; tags?: string[] } = {}): WorldEvent[] {
    const event = worldEvent(kind, opts.at ?? this.now, payload, opts);
    const ctx = this.context();
    const fired = this.bus.dispatch(event, ctx, (e) => this.pendingEvents.push(e));
    this.pendingEvents.push(...fired.filter((f) => f === event));
    return fired;
  }

  private context(): CommandContext & { emit: (e: WorldEvent) => void } {
    // Arrow functions capture `this` without aliasing it, so the getters below
    // always read the live universe rather than a snapshot of it.
    const universe = () => this.universe;
    return {
      sim: this,
      get u() { return universe(); },
      get now() { return universe().now; },
      emit: () => {
        throw new Error('emit is injected per-cascade by the event bus');
      },
    };
  }

  // -------------------------------------------------------------------------
  // Scheduling
  // -------------------------------------------------------------------------

  schedule(spec: {
    at: Instant;
    kind: string;
    label: string;
    category: string;
    payload?: Record<string, unknown>;
    priority?: number;
    refType?: string;
    refId?: Id;
    recurrence?: Recurrence;
    requiresPlayer?: boolean;
    locationId?: string;
    durationMinutes?: number;
  }): ScheduledItem {
    if (!this.scheduleHandlers.has(spec.kind)) {
      throw new Error(
        `Can’t schedule '${spec.kind}': no handler is registered. ` +
        'Every scheduled kind must have a handler, or time advancement would silently drop it.',
      );
    }
    const item: ScheduledItem = {
      id: this.nextId('sched'),
      saveId: this.universe.meta.id,
      at: spec.at,
      kind: spec.kind,
      payload: spec.payload ?? {},
      status: 'pending',
      priority: spec.priority ?? 100,
      label: spec.label,
      category: spec.category,
      refType: spec.refType,
      refId: spec.refId,
      recurrence: spec.recurrence,
      requiresPlayer: spec.requiresPlayer ?? false,
      locationId: spec.locationId,
      durationMinutes: spec.durationMinutes,
      createdAt: this.now,
    };
    return this.timeline.add(item);
  }

  // -------------------------------------------------------------------------
  // Time advancement — the ONE path
  // -------------------------------------------------------------------------

  /**
   * Advances the world to `target`, processing every scheduled item that comes
   * due, in chronological order, at the instant it is due.
   *
   * Real-time ticking, sleeping and Skip to Event all call this. There is no
   * other way to move the clock, which is why the world can never skip work.
   * It is also why what time does on its own (`onPassage`) is run from here:
   * every way of moving the clock pays it, and at the same rate.
   */
  advanceTo(target: Instant, opts: { onProgress?: AdvanceProgress; stopOnPlayerRequired?: boolean } = {}): AdvanceResult {
    if (this.advancing) {
      throw new Error('advanceTo called re-entrantly. A handler tried to move the clock itself.');
    }
    const from = this.universe.now;
    if (target < from) {
      throw new Error(
        `Refusing to move the world clock backwards (from ${formatDateTime(from, this.zone)} to ${formatDateTime(target, this.zone)}). Time only runs forwards.`,
      );
    }

    this.advancing = true;
    this.advance = { from, target, stopsForPlayer: opts.stopOnPlayerRequired === true };
    const result: AdvanceResult = { from, to: target, itemsProcessed: 0, missed: [], events: [] };

    // Time acts on the world wherever the clock stops, before anything due
    // there. Several items due at one instant are one stop, not several.
    let passedAt = from;
    const pass = () => {
      if (this.universe.now <= passedAt) return;
      const was = passedAt;
      passedAt = this.universe.now;
      for (const reactor of this.passageReactors.values()) reactor(this, was);
    };

    try {
      this.timeline.resetScan();
      const totalDue = this.timeline.between(from, target).length;
      let guard = 0;

      for (;;) {
        if (guard++ > MAX_ITEMS_PER_ADVANCE) {
          throw new Error(
            `Time advancement exceeded ${MAX_ITEMS_PER_ADVANCE} scheduled items. A handler is very likely re-scheduling itself in the past.`,
          );
        }

        // The earliest pending item at or before the target. The timeline keeps
        // a forward cursor, so this is amortised O(1) rather than a rescan.
        const due = this.timeline.nextDue(target);
        if (!due) break;

        if (opts.stopOnPlayerRequired && due.requiresPlayer && due.at > from) {
          result.interruptedBy = due;
          this.universe.now = Math.max(this.universe.now, due.at);
          pass();
          result.to = this.universe.now;
          return result;
        }

        // Move the clock to the moment the item is due, never past it.
        this.universe.now = Math.max(this.universe.now, Math.min(due.at, target));
        pass();

        const handler = this.scheduleHandlers.get(due.kind);
        if (!handler) {
          due.status = 'missed';
          due.resolvedAt = this.universe.now;
          result.missed.push(due);
          continue;
        }

        due.status = 'done';
        due.resolvedAt = this.universe.now;
        try {
          handler(due, this);
        } catch (err) {
          due.status = 'missed';
          this.notify({
            category: 'system',
            title: 'A Scheduled Event Could Not Be Processed',
            body: `'${due.label}' failed: ${(err as Error).message}`,
            importance: 40,
          });
          result.missed.push(due);
        }

        // Re-arm recurrences.
        if (due.recurrence) {
          const nextAt = nextRecurrence(due, (fromAt, unit, interval) => this.addUnit(fromAt, unit, interval));
          if (nextAt !== undefined) {
            const rec: Recurrence = { ...due.recurrence, fired: (due.recurrence.fired ?? 0) + 1 };
            this.schedule({
              at: nextAt,
              kind: due.kind,
              label: due.label,
              category: due.category,
              payload: due.payload,
              priority: due.priority,
              refType: due.refType,
              refId: due.refId,
              recurrence: rec,
              requiresPlayer: due.requiresPlayer,
              locationId: due.locationId,
              durationMinutes: due.durationMinutes,
            });
          }
        }

        result.itemsProcessed++;
        if (opts.onProgress && result.itemsProcessed % 25 === 0) {
          opts.onProgress(result.itemsProcessed, Math.max(totalDue, result.itemsProcessed), this.universe.now);
        }
      }

      this.universe.now = target;
      pass();
      result.to = target;

      // Drain any events that reactors queued but nobody consumed.
      result.events = this.pendingEvents.splice(0, this.pendingEvents.length);
      return result;
    } finally {
      this.advancing = false;
      this.advance = undefined;
    }
  }

  private addUnit(from: Instant, unit: Recurrence['unit'], interval: number): Instant {
    const zone = this.homeZone;
    switch (unit) {
      case 'day': return addDays(from, interval, zone);
      case 'week': return addDays(from, interval * 7, zone);
      case 'month': return addMonths(from, interval, zone);
      case 'year': return addYears(from, interval, zone);
      default: return from + interval * MS_DAY;
    }
  }

  /** Advances by an elapsed duration. Used by the realtime ticker. */
  advanceBy(ms: number, opts: Parameters<Simulation['advanceTo']>[1] = {}): AdvanceResult {
    return this.advanceTo(this.now + ms, opts);
  }

  /** Advances to the next commitment, whatever it is. */
  advanceToNextEvent(filter?: (i: ScheduledItem) => boolean): AdvanceResult | undefined {
    const next = this.timeline.next(this.now, filter);
    if (!next) return undefined;
    return this.advanceTo(next.at);
  }

  // -------------------------------------------------------------------------
  // Commands: idempotent, atomic, audited
  // -------------------------------------------------------------------------

  /**
   * Runs a command. If it throws, the universe is restored to exactly the state
   * it was in before, so a half-created house or a paid-but-not-delivered order
   * can never exist.
   *
   * There are three boundaries a command can run inside:
   *
   * - A player command, at the top level. It snapshots the universe and rolls
   *   back completely on failure. This is the guarantee the player relies on.
   * - A nested command, inside another command. It shares the outer snapshot,
   *   so a failure propagates and takes the whole outer command down with it.
   *   That is deliberate: a greenlight whose producer agreement cannot be
   *   executed must not complete.
   * - An engine command, raised by a scheduled handler while the clock is
   *   moving. The scheduled item is already the unit of isolation there — the
   *   advance loop marks a failing item missed and carries on — so these do not
   *   snapshot. Cloning the whole universe several hundred times a simulated
   *   year is what makes a long save unplayable, and it buys nothing the item
   *   boundary does not already provide.
   */
  execute<R = unknown>(command: Command<Record<string, unknown>, R>): CommandResult<R> {
    const handler = this.commandHandlers.get(command.kind);
    if (!handler) {
      return { ok: false, error: `Unknown command '${command.kind}'.` };
    }

    // Idempotency: a retried purchase must never charge twice.
    if (command.idempotencyKey) {
      const prior = this.universe.idempotency[command.idempotencyKey];
      if (prior) {
        return { ok: true, value: prior.result as R, replayed: true };
      }
    }

    // Nested commands share the outer transaction rather than snapshotting again.
    if (this.depth > 0) {
      const value = (handler as CommandHandler<Record<string, unknown>, R>)(command.payload, this.context());
      if (command.idempotencyKey) {
        this.universe.idempotency[command.idempotencyKey] = { at: this.now, result: value };
      }
      return { ok: true, value };
    }

    // Raised by a scheduled handler mid-advance: the item is the boundary.
    if (this.advancing) {
      this.depth++;
      try {
        const value = (handler as CommandHandler<Record<string, unknown>, R>)(command.payload, this.context());
        if (command.idempotencyKey) {
          this.universe.idempotency[command.idempotencyKey] = { at: this.now, result: value };
        }
        return { ok: true, value };
      } catch (err) {
        const message = err instanceof CommandError ? err.message : `${command.kind} failed: ${(err as Error).message}`;
        this.universe.engineFailures.push({ at: this.now, kind: command.kind, error: message });
        if (this.universe.engineFailures.length > 200) this.universe.engineFailures.shift();
        return { ok: false, error: message };
      } finally {
        this.depth--;
      }
    }

    const snapshot: UniverseSnapshot = snapshotUniverse(this.universe);
    const eventsBefore = this.pendingEvents.length;
    this.depth++;
    try {
      const value = (handler as CommandHandler<Record<string, unknown>, R>)(command.payload, this.context());
      if (command.idempotencyKey) {
        this.universe.idempotency[command.idempotencyKey] = { at: this.now, result: value };
      }
      const events = this.pendingEvents.splice(eventsBefore).map((e) => e.kind);
      return { ok: true, value, events };
    } catch (err) {
      restoreUniverse(this.universe, snapshot);
      this.pendingEvents.length = eventsBefore;
      const message = err instanceof CommandError ? err.message : `${command.kind} failed: ${(err as Error).message}`;
      return { ok: false, error: message };
    } finally {
      this.depth--;
    }
  }

  /** Throws on failure. For internal call sites that treat failure as a bug. */
  must<R = unknown>(command: Command<Record<string, unknown>, R>): R {
    const result = this.execute<R>(command);
    if (!result.ok) throw new CommandError(result.error ?? 'command failed');
    return result.value as R;
  }

  // -------------------------------------------------------------------------
  // Convenience writers used across systems
  // -------------------------------------------------------------------------

  /** Posts a balanced transaction with a generated id. */
  post(spec: {
    memo: string;
    category: string;
    postings: { accountId: Id; amount: Money }[];
    at?: Instant;
    refType?: string;
    refId?: Id;
    idempotencyKey?: string;
  }): LedgerTransaction {
    const txn: LedgerTransaction = {
      id: this.nextId('txn'),
      saveId: this.universe.meta.id,
      at: spec.at ?? this.now,
      memo: spec.memo,
      category: spec.category,
      postings: spec.postings,
      refType: spec.refType,
      refId: spec.refId,
      idempotencyKey: spec.idempotencyKey,
    };
    return this.ledger.post(txn);
  }

  /** Moves money between two accounts. Positive `amount` flows from -> to. */
  transfer(fromAccountId: Id, toAccountId: Id, amount: Money, memo: string, category: string, refs: { refType?: string; refId?: Id } = {}): LedgerTransaction {
    if (amount < 0) throw new CommandError('Transfer amounts must be positive; swap the accounts instead.');
    return this.post({
      memo,
      category,
      postings: [
        { accountId: fromAccountId, amount: -amount },
        { accountId: toAccountId, amount },
      ],
      ...refs,
    });
  }

  openAccount(spec: Omit<Account, 'saveId' | 'balance' | 'nominal'> & { balance?: Money; nominal?: boolean }): Account {
    const account: Account = {
      ...spec,
      saveId: this.universe.meta.id,
      balance: 0,
      nominal: spec.nominal ?? false,
    };
    this.ledger.open(account);
    if (spec.balance) {
      const equity = this.nominalAccount('equity', 'Opening Balances');
      this.post({
        memo: `Opening balance: ${account.name}`,
        category: 'opening',
        postings: [
          { accountId: account.id, amount: spec.balance },
          { accountId: equity.id, amount: -spec.balance },
        ],
      });
    }
    return account;
  }

  /**
   * Finds or creates a nominal counter-account. These are how income and
   * expense get a place to come from and go to, so every transaction balances.
   */
  nominalAccount(kind: 'income' | 'expense' | 'equity' | 'asset_value' | 'liability_other', name: string): Account {
    const key = `${kind}:${name}`;
    for (const acct of Object.values(this.universe.accounts)) {
      if (acct.nominal && acct.kind === kind && acct.name === name) return acct;
    }
    const account: Account = {
      id: this.nextId('account'),
      saveId: this.universe.meta.id,
      kind,
      name,
      ownerId: 'world',
      balance: 0,
      openedAt: this.now,
      nominal: true,
      category: key,
    };
    this.ledger.open(account);
    return account;
  }

  /** Records money entering the player's world from outside it. */
  income(toAccountId: Id, amount: Money, source: string, category: string, refs: { refType?: string; refId?: Id; at?: Instant } = {}): LedgerTransaction {
    const src = this.nominalAccount('income', source);
    return this.post({
      memo: source,
      category,
      at: refs.at,
      postings: [
        { accountId: toAccountId, amount },
        { accountId: src.id, amount: -amount },
      ],
      refType: refs.refType,
      refId: refs.refId,
    });
  }

  /** Records money leaving the player's world. */
  expense(fromAccountId: Id, amount: Money, purpose: string, category: string, refs: { refType?: string; refId?: Id; at?: Instant } = {}): LedgerTransaction {
    const dst = this.nominalAccount('expense', purpose);
    return this.post({
      memo: purpose,
      category,
      at: refs.at,
      postings: [
        { accountId: fromAccountId, amount: -amount },
        { accountId: dst.id, amount },
      ],
      refType: refs.refType,
      refId: refs.refId,
    });
  }

  remember(spec: Omit<HistoryRecord, 'id' | 'saveId' | 'at'> & { at?: Instant }): HistoryRecord {
    return this.historian.recordHistory({
      ...spec,
      id: this.nextId('history'),
      saveId: this.universe.meta.id,
      at: spec.at ?? this.now,
    });
  }

  notify(spec: { category: string; title: string; body: string; importance?: number; route?: string; refType?: string; refId?: Id }): void {
    this.universe.notifications.push({
      id: this.nextId('notice'),
      saveId: this.universe.meta.id,
      at: this.now,
      category: spec.category,
      title: spec.title,
      body: spec.body,
      read: false,
      route: spec.route,
      refType: spec.refType,
      refId: spec.refId,
      importance: spec.importance ?? 50,
    });
    if (this.universe.notifications.length > 500) {
      this.universe.notifications.splice(0, this.universe.notifications.length - 500);
    }
  }

  /** Raises something into the Decision Center. Deduplicates on refType+refId+category. */
  requireDecision(spec: {
    urgency: number;
    category: string;
    title: string;
    detail: string;
    /** Where to act on it. Omitted when the screen for it is not built. */
    route?: string;
    actions?: { label: string; commandKind: string; payload: Record<string, unknown> }[];
    dueAt?: Instant;
    refType?: string;
    refId?: Id;
  }): void {
    for (const d of Object.values(this.universe.decisions)) {
      if (d.resolvedAt || d.dismissedAt) continue;
      if (d.category === spec.category && d.refType === spec.refType && d.refId === spec.refId) {
        d.urgency = Math.max(d.urgency, spec.urgency);
        d.detail = spec.detail;
        d.dueAt = spec.dueAt;
        return;
      }
    }
    const id = this.nextId('decision');
    this.universe.decisions[id] = {
      id,
      saveId: this.universe.meta.id,
      urgency: spec.urgency,
      category: spec.category,
      title: spec.title,
      detail: spec.detail,
      route: spec.route,
      actions: spec.actions ?? [],
      dueAt: spec.dueAt,
      createdAt: this.now,
      refType: spec.refType,
      refId: spec.refId,
    };
  }

  resolveDecision(refType: string, refId: Id, category?: string): void {
    for (const d of Object.values(this.universe.decisions)) {
      if (d.refType === refType && d.refId === refId && (!category || d.category === category) && !d.resolvedAt) {
        d.resolvedAt = this.now;
      }
    }
  }

  counter(key: string): number {
    const next = (this.universe.counters[key] ?? 0) + 1;
    this.universe.counters[key] = next;
    return next;
  }
}

// ---------------------------------------------------------------------------
// Transaction support
// ---------------------------------------------------------------------------

/**
 * Rollback support.
 *
 * `transactions`, `history` and `notifications` are strictly
 * append-only, so rolling them back is a truncation rather than a clone. That
 * matters: those four are the collections that grow without bound over a
 * decade of play, and cloning them on every command would make a long save
 * progressively slower to play.
 */
const APPEND_ONLY_LOGS = ['transactions', 'history', 'notifications'] as const;

export interface UniverseSnapshot {
  clone: SaveUniverse;
  logLengths: Record<string, number>;
}

export function snapshotUniverse(u: SaveUniverse): UniverseSnapshot {
  const logLengths: Record<string, number> = {};
  const detached: Record<string, unknown[]> = {};
  for (const key of APPEND_ONLY_LOGS) {
    const list = u[key] as unknown[];
    logLengths[key] = list.length;
    detached[key] = list;
    (u as unknown as Record<string, unknown>)[key] = [];
  }
  let clone: SaveUniverse;
  try {
    clone = structuredClone(u);
  } finally {
    for (const key of APPEND_ONLY_LOGS) {
      (u as unknown as Record<string, unknown>)[key] = detached[key] as unknown[];
    }
  }
  return { clone, logLengths };
}

/**
 * Puts the universe back exactly as the snapshot found it.
 *
 * The subtle part is object identity. Swapping in the snapshot's clones would
 * restore every *value* correctly while quietly invalidating every reference
 * anything still holds: a caller that read `const player = sim.player` before a
 * command, and keeps using it after that command failed, would be writing to a
 * detached copy that is no longer part of the world. Those writes vanish, and
 * nothing reports an error. That is how a player ended up with a live job the
 * game did not think they had.
 *
 * So the restore writes the old values back *into* the objects that are already
 * there, keeping their identity. Records that the failed command created are
 * removed; records it deleted are put back. A reference taken before a command
 * is still the right object afterwards, whether the command succeeded or not.
 */
export function restoreUniverse(target: SaveUniverse, snapshot: UniverseSnapshot): void {
  const record = target as unknown as Record<string, unknown>;
  const clone = snapshot.clone as unknown as Record<string, unknown>;

  // The append-only logs roll back by truncation; they were never cloned.
  for (const key of APPEND_ONLY_LOGS) {
    (target[key] as unknown[]).length = snapshot.logLengths[key] ?? 0;
  }

  for (const key of Object.keys(record)) {
    if ((APPEND_ONLY_LOGS as readonly string[]).includes(key)) continue;
    if (!(key in clone)) {
      delete record[key];
    }
  }

  for (const [key, before] of Object.entries(clone)) {
    if ((APPEND_ONLY_LOGS as readonly string[]).includes(key)) continue;
    const now = record[key];

    if (Array.isArray(before)) {
      restoreList(now, before, record, key);
      continue;
    }
    if (isPlainRecord(before) && isPlainRecord(now)) {
      restoreCollection(now, before);
      continue;
    }
    record[key] = before;
  }
}

/** Whether a value is a plain object we can restore field by field. */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Restores an id-keyed collection without replacing the objects in it. */
function restoreCollection(now: Record<string, unknown>, before: Record<string, unknown>): void {
  for (const id of Object.keys(now)) {
    if (!(id in before)) delete now[id];
  }
  for (const [id, wasValue] of Object.entries(before)) {
    const isValue = now[id];
    if (isPlainRecord(wasValue) && isPlainRecord(isValue)) {
      restoreObject(isValue, wasValue);
    } else {
      now[id] = wasValue;
    }
  }
}

/** Copies a snapshot's fields back into the live object, in place. */
function restoreObject(live: Record<string, unknown>, before: Record<string, unknown>): void {
  for (const field of Object.keys(live)) {
    if (!(field in before)) delete live[field];
  }
  for (const [field, wasValue] of Object.entries(before)) {
    const isValue = live[field];
    if (isPlainRecord(wasValue) && isPlainRecord(isValue)) {
      restoreObject(isValue, wasValue);
      continue;
    }
    if (Array.isArray(wasValue) && Array.isArray(isValue)) {
      // Keep the array object itself; anything holding it stays correct.
      isValue.length = 0;
      for (const entry of wasValue) isValue.push(entry);
      continue;
    }
    live[field] = wasValue;
  }
}

/**
 * Restores an array of records in place. `scheduled` is the one that matters:
 * the timeline holds a cursor into it and handlers hold items out of it.
 */
function restoreList(now: unknown, before: unknown[], owner: Record<string, unknown>, key: string): void {
  if (!Array.isArray(now)) {
    owner[key] = before;
    return;
  }
  const living = new Map<string, Record<string, unknown>>();
  for (const entry of now) {
    if (isPlainRecord(entry) && typeof entry['id'] === 'string') living.set(entry['id'], entry);
  }
  now.length = 0;
  for (const wasEntry of before) {
    if (isPlainRecord(wasEntry) && typeof wasEntry['id'] === 'string') {
      const live = living.get(wasEntry['id']);
      if (live) {
        restoreObject(live, wasEntry);
        now.push(live);
        continue;
      }
    }
    now.push(wasEntry);
  }
}

/** Minutes of world time an activity should consume, rounded to the minute. */
export function minutes(n: number): number {
  return Math.round(n) * MS_MINUTE;
}
