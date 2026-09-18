/**
 * SLATE — the things that decide, and the proof that they are deciding.
 *
 * A decider is a function that turns the state of the world into an outcome
 * the player did not choose: who got the part, how the day went, what the sky
 * did. It is the only kind of code where a simulation and a slot machine are
 * indistinguishable from the outside.
 *
 * Both of these compile, pass every test in the suite, and look identical on
 * screen — the drill-down opens, the reasons read well, the audit record is
 * there:
 *
 *   decideCasting(role, people) { return best(people, role.wants); }
 *   decideCasting(role, people) { return people[rng.pick()]; }   // + prose
 *
 * `docs/DEPTH.md` calls the difference the falsifiability test: change one
 * input a little, and does the outcome change, or only the sentence explaining
 * it? A registered decider has to answer that, and `tests/deciders.test.ts`
 * asks it automatically. There is no hand-written sensitivity test to write
 * weakly: the harness sweeps every input a decider declares and fails if the
 * outcome never moves.
 *
 * So the declaration is the work. Saying what you read is a promise that
 * reading it matters, and the promise is checked.
 *
 * `tools/deciders.mjs --check` holds the other half: a file in the engine that
 * draws from the random number generator and registers no decider fails the
 * gate. Randomness is where slot machines live, so that is where the rule is.
 */

/**
 * How to set one input anywhere across its range. `t` runs 0 to 1, and the
 * two ends should be the extremes a real game would ever reach — not the
 * extremes the type allows. Sweeping latitude from -90 to 90 proves something.
 * Sweeping it from 0 to 0.001 proves nothing and is the way to cheat this.
 */
export type Across<Input> = (input: Input, t: number) => Input;

export interface Decider<Input, Outcome> {
  /** Stable id, `area.thing`: `weather.day`, `casting.decided`. */
  id: string;
  /** What it decides, in a sentence a person would say. */
  decides: string;
  /**
   * The engine file whose draws this decider accounts for.
   *
   * `tools/deciders.mjs` reads these: a file that draws from the random number
   * generator and appears in no decider's `drawnIn` fails the gate. That is
   * the rule that makes registering the thing to do rather than the thing to
   * remember.
   */
  drawnIn: string;
  /**
   * The named draw streams this decision takes, where they are not its own id.
   *
   * `tools/deciders.mjs` counts streams as well as files, and it used to insist a
   * stream be owned by a decider whose id matched it exactly. That is a rule about
   * naming rather than about accounting, and it left thirteen streams unowned
   * while the decisions they feed were all registered and documented: `weather.day`
   * takes `weather` for the day and `weather-hours` for the hours inside it, and
   * both are the same decision about the same sky.
   *
   * The alternative was renaming the streams to match, which is the one thing that
   * must not happen: a stream key is an input to the generator, so changing one
   * changes every seeded outcome in the build and every measured number that rests
   * on them.
   *
   * So a decision declares what it draws from. One decision, however many dice.
   */
  draws?: readonly string[];
  /**
   * Every input the outcome is supposed to depend on. Declaring one is a
   * claim that it changes the answer, and the harness will try it.
   */
  reads: Record<string, Across<Input>>;
  /** A baseline input. The seed varies it, so a sweep is not one lucky case. */
  sample: (seed: number) => Input;
  /** The decision itself. */
  decide: (input: Input) => Outcome;
  /**
   * What counts as the same outcome. The default compares the whole thing,
   * which is right when the outcome is small and wrong when it carries a
   * timestamp or an id that moves on its own.
   */
  shape?: (outcome: Outcome) => string;
}

// Deciders register at import time, so the registry is only as complete as
// what has been imported. `all.ts` pulls in every one, and the test imports
// that, the same way the looks graph is assembled.
const REGISTRY = new Map<string, Decider<never, never>>();

export function defineDecider<Input, Outcome>(decider: Decider<Input, Outcome>): Decider<Input, Outcome> {
  if (REGISTRY.has(decider.id)) throw new Error(`Two deciders both call themselves '${decider.id}'.`);
  if (Object.keys(decider.reads).length === 0) {
    throw new Error(`'${decider.id}' reads nothing, so nothing about the world can change what it decides.`);
  }
  REGISTRY.set(decider.id, decider as unknown as Decider<never, never>);
  return decider;
}

/** Every decider that has been registered, in the order they registered. */
export function deciders(): readonly Decider<never, never>[] {
  return [...REGISTRY.values()];
}

export interface Sweep {
  /** The input that was moved. */
  reads: string;
  /** Every distinct outcome the sweep produced, across every sample. */
  outcomes: string[];
  /** How many samples were tried, which is what makes `inert` mean anything. */
  samples: number;
  /** True when moving this input changed nothing inside any single sample. */
  inert: boolean;
}

/**
 * Moves one declared input from one end of its range to the other and collects
 * what came out.
 *
 * Several samples, because a decider can be genuinely flat in one corner of
 * its space and alive everywhere else — a casting call nobody is right for
 * gives the same answer whatever you do to it. One sample proving nothing is
 * not evidence; every sample proving nothing is.
 *
 * ## Inside a sample, which is the only place the question means anything
 *
 * This pooled every outcome from every sample into one set and called the
 * input live if that set had more than one thing in it. That is not the
 * question. The samples differ from each other by construction — the seed is
 * there to vary them — so a decider that ignores a declared input entirely
 * still filled the pooled set and still passed. Measured on the registry the
 * day this was found: an input made deliberately unreachable was live in the
 * pooled reading and inert in every one of its six samples, and the suite said
 * nothing.
 *
 * So the comparison is inside a sample, with everything else held still, which
 * is what "change an input; does the outcome change?" has always meant. An
 * input counts as read if it moved the answer in at least one of the six
 * worlds, because a decider can be genuinely flat in one corner and alive
 * everywhere else. All sixteen deciders registered on the day this changed were
 * live under it, so it costs nothing today and holds tomorrow.
 */
export function sweepOne<Input, Outcome>(
  decider: Decider<Input, Outcome>,
  reads: string,
  opts: { samples?: number; steps?: number } = {},
): Sweep {
  const samples = opts.samples ?? 6;
  const steps = opts.steps ?? 7;
  const across = decider.reads[reads];
  if (!across) throw new Error(`'${decider.id}' doesn’t say it reads '${reads}'.`);
  const shape = decider.shape ?? ((o: Outcome) => JSON.stringify(o));
  const seen = new Set<string>();
  let movedIn = 0;
  for (let s = 0; s < samples; s += 1) {
    const base = decider.sample(s);
    const here = new Set<string>();
    for (let i = 0; i < steps; i += 1) {
      const t = steps === 1 ? 0 : i / (steps - 1);
      const out = shape(decider.decide(across(base, t)));
      here.add(out);
      seen.add(out);
    }
    if (here.size > 1) movedIn += 1;
  }
  return { reads, outcomes: [...seen], samples, inert: movedIn === 0 };
}

/** The same, for every input a decider claims to read. */
export function sweepAll<Input, Outcome>(
  decider: Decider<Input, Outcome>,
  opts?: { samples?: number; steps?: number },
): Sweep[] {
  return Object.keys(decider.reads).map((reads) => sweepOne(decider, reads, opts));
}
