/**
 * SLATE — the studio, played as text.
 *
 * The production system is an engine, and an engine nobody can sit in front of is
 * a library. This is the seat: a terminal front end over `world/production.ts`
 * that takes the same five decisions the rest of the build takes and prints what
 * came of them.
 *
 * It exists for two reasons, and the second is the one that earns its place in
 * `tools/`. The first is that it is playable. The second is that it is an
 * **instrument**: it plays a real career against the real engine, and every figure
 * it prints was produced by the same code path the game uses. A number measured
 * here is measured on a played career rather than an idle save, which is the rule
 * this project has paid for twice.
 *
 *   npx vite-node tools/studio.mjs                 a season, played and reported
 *   npx vite-node tools/studio.mjs --play          choose it yourself
 *   npx vite-node tools/studio.mjs --seeds 20      many seasons, for the spread
 *   npx vite-node tools/studio.mjs --receipt       show every link on every film
 */

import { createInterface } from 'node:readline/promises';
import { quickSave } from '../src/engine/index.ts';
import { CENTS_IN_A_MILLION } from '../src/engine/core/money.ts';
import { FORMATS, FORMAT_BY_ID, CHANNEL_LABEL } from '../src/engine/content/format.ts';
import { BANDS, DEPARTMENTS, headsCostCents } from '../src/engine/content/department.ts';
import { MONTH_SAID } from '../src/engine/content/release.ts';
import { ENGINES, ENGINE_BY_ID } from '../src/engine/content/concept.ts';
import { reckonTheRun, theReceipt } from '../src/engine/world/boxoffice.ts';
import { staffingOf } from '../src/engine/world/production.ts';

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const SEEDS = Number(arg('seeds', 1));
const SHOW_RECEIPT = has('receipt');
const PLAY = has('play');

const m = (cents) => {
  const mil = cents / CENTS_IN_A_MILLION;
  if (Math.abs(mil) >= 1) return `${mil < 0 ? '-' : ''}EUR ${Math.abs(mil).toFixed(2)}m`;
  return `${cents < 0 ? "-" : ""}EUR ${Math.round(Math.abs(cents) / 100_000)}k`;
};
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);
const rule = (ch = '-') => console.log(ch.repeat(74));

/**
 * A slate of productions, drawn so that the seasons differ from each other.
 *
 * Not random choices — chosen ones, spread across the decision space, so that a
 * run of this reports what the engine does with a range of plans rather than what
 * it does with one plan nine times. The point of the instrument is the spread.
 */
function aSlate(seed) {
  const pick = (list, n) => list[(seed * 7 + n * 3) % list.length];
  return [
    {
      title: 'The Weight of Water',
      formatId: 'feature', parts: 1, secondsEach: 118 * 60,
      spendCents: 4_200_000_00, campaignCents: 620_000_00, channel: 'theatrical',
      staffing: { director: 'sought', writer: 'sought', photography: 'working', cutting: 'working', casting: 'first', music: 'working', production: 'working' },
    },
    {
      title: 'Hraun',
      formatId: 'miniseries', parts: 6, secondsEach: 52 * 60,
      spendCents: 7_800_000_00, campaignCents: 140_000_00, channel: 'broadcast',
      engineId: 'serial',
      staffing: { director: 'first', writer: 'first', photography: 'sought', cutting: 'sought', casting: 'working', music: 'starting', production: 'sought' },
    },
    {
      title: 'Night Shift',
      formatId: 'tv-movie', parts: 1, secondsEach: 92 * 60,
      spendCents: 900_000_00, campaignCents: 22_000_00, channel: 'broadcast',
      staffing: { director: 'working', writer: 'working', photography: 'starting', cutting: 'working', casting: 'starting', music: 'starting', production: 'working' },
    },
    {
      title: 'Twelve Small Rooms',
      formatId: 'anthology', parts: 8, secondsEach: 38 * 60,
      spendCents: 3_400_000_00, campaignCents: 90_000_00, channel: 'streaming',
      engineId: 'dilemma',
      staffing: { director: 'sought', writer: 'first', photography: 'working', cutting: 'first', casting: 'working', music: 'sought', production: 'starting' },
    },
    {
      title: 'Ten Second Gods',
      formatId: 'micro', parts: 24, secondsEach: 5 * 60,
      spendCents: 600_000_00, campaignCents: 14_000_00, channel: 'streaming',
      engineId: 'case',
      staffing: { director: 'starting', writer: 'sought', photography: 'starting', cutting: 'sought', casting: 'starting', music: 'working', production: 'first' },
    },
    {
      title: pick(['Coldwater', 'The Long Eighty', 'Salt'], 1),
      formatId: 'serial', parts: 10, secondsEach: 48 * 60,
      spendCents: 11_000_000_00, campaignCents: 300_000_00, channel: 'streaming',
      engineId: 'ensemble',
      staffing: { director: 'first', writer: 'first', photography: 'first', cutting: 'sought', casting: 'first', music: 'sought', production: 'sought' },
    },
  ];
}

/**
 * Reckons one production against the real engine and reports it.
 *
 * Deliberately calls `reckonTheRun` rather than reimplementing anything: the whole
 * value of this file is that what it prints is what the game would do.
 */
function makeIt(plan, month, field) {
  const format = FORMAT_BY_ID[plan.formatId];
  const engine = plan.engineId ? ENGINE_BY_ID[plan.engineId] : undefined;
  const heads = headsCostCents(plan.staffing, plan.parts);
  const spent = plan.spendCents + heads;
  const run = reckonTheRun({
    format,
    parts: plan.parts,
    secondsEach: plan.secondsEach,
    spentCents: spent,
    campaignCents: plan.campaignCents,
    staffing: plan.staffing,
    engine,
    month,
    field,
  }, plan.channel);
  const outlay = spent + plan.campaignCents;
  return { plan, format, run, heads, spent, outlay, profit: run.totalCents - outlay };
}

function reportOne(made) {
  const { plan, format, run, heads, outlay, profit } = made;
  rule();
  console.log(`${plan.title}`);
  console.log(`  ${format.label} — ${plan.parts} x ${Math.round(plan.secondsEach / 60)} min, `
    + `${CHANNEL_LABEL[plan.channel]}`);
  if (plan.engineId) console.log(`  Engine: ${ENGINE_BY_ID[plan.engineId].label}`);
  console.log(`  Heads: ${Object.entries(plan.staffing)
    .map(([d, b]) => `${DEPARTMENTS.find((x) => x.id === d).label} ${b}`)
    .join(', ')}`);
  console.log('');
  console.log(`  Negative cost   ${rpad(m(made.spent - heads), 12)}`);
  console.log(`  Heads           ${rpad(m(heads), 12)}`);
  console.log(`  Campaign        ${rpad(m(plan.campaignCents), 12)}`);
  console.log(`  ${pad('OUTLAY', 15)} ${rpad(m(outlay), 12)}`);
  console.log('');
  if (SHOW_RECEIPT) {
    console.log('  How the take was reckoned:');
    for (const line of theReceipt(run.reckoning)) console.log(`  ${line}`);
    console.log('');
  }
  const mouth = run.reckoning.wordOfMouth;
  const said = mouth > 0.35 ? 'people told each other'
    : mouth > 0.05 ? 'reviews were kind'
      : mouth > -0.05 ? 'nobody said much'
        : mouth > -0.35 ? 'word got round' : 'word got round badly';
  console.log(`  Word of mouth   ${rpad(mouth.toFixed(2), 12)}  (${said})`);
  if (run.weeks.length > 1) {
    const front = run.weeks.slice(0, 3).reduce((s, w) => s + w.grossCents, 0);
    console.log(`  Opened          ${rpad(m(run.weeks[0].grossCents), 12)}  `
      + `first three weeks were ${Math.round((front / run.grossCents) * 100)}% of the run`);
  }
  console.log(`  Audience paid   ${rpad(m(run.grossCents), 12)}`);
  console.log(`  Reached us      ${rpad(m(run.rentalCents), 12)}`);
  for (const take of run.takes) {
    console.log(`    ${pad(take.label, 24)} ${rpad(m(take.cents), 12)}  week ${take.week}`);
  }
  console.log(`  ${pad('TOOK', 15)} ${rpad(m(run.totalCents), 12)}`);
  console.log(`  ${pad(profit >= 0 ? 'PROFIT' : 'LOSS', 15)} ${rpad(m(profit), 12)}`);
}

function playASeason(seed) {
  const slate = aSlate(seed);
  const made = [];
  for (let i = 0; i < slate.length; i += 1) {
    // Spread the releases across the year, and let each one crowd the next. The
    // field is a share of the month's attention, so a studio that stacks its own
    // slate competes with itself — which is a real mistake a studio can make.
    const month = (i * 2 + seed) % 12;
    const clashes = slate.filter((_, j) => j !== i && ((j * 2 + seed) % 12) === month).length;
    made.push(makeIt(slate[i], month, Math.min(1, clashes * 0.34 + 0.18)));
  }
  return made;
}

function reportSeason(seed, made) {
  rule('=');
  console.log(`A YEAR AT THE STUDIO   (world ${seed})`);
  rule('=');
  for (const one of made) reportOne(one);
  rule('=');
  const outlay = made.reduce((s, x) => s + x.outlay, 0);
  const took = made.reduce((s, x) => s + x.run.totalCents, 0);
  const won = made.filter((x) => x.profit > 0).length;
  console.log(`  ${pad('SPENT', 15)} ${rpad(m(outlay), 12)}`);
  console.log(`  ${pad('TOOK', 15)} ${rpad(m(took), 12)}`);
  console.log(`  ${pad(took - outlay >= 0 ? 'PROFIT' : 'LOSS', 15)} ${rpad(m(took - outlay), 12)}`
    + `   ${won} of ${made.length} paid for themselves`);
  const best = [...made].sort((a, b) => b.profit - a.profit)[0];
  const worst = [...made].sort((a, b) => a.profit - b.profit)[0];
  console.log(`\n  Best:  ${pad(best.plan.title, 22)} ${m(best.profit)}`);
  console.log(`  Worst: ${pad(worst.plan.title, 22)} ${m(worst.profit)}`);
  rule('=');
}

// ---------------------------------------------------------------------------
// Playing it yourself
// ---------------------------------------------------------------------------

async function play() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q, options, fallback) => {
    if (options) {
      console.log('');
      options.forEach((o, i) => console.log(`   ${i + 1}) ${o.label}${o.note ? `  — ${o.note}` : ''}`));
    }
    const said = (await rl.question(`${q} `)).trim();
    if (!said) return fallback;
    if (options) {
      const n = Number(said);
      return Number.isInteger(n) && n >= 1 && n <= options.length ? options[n - 1].value : fallback;
    }
    return said;
  };

  rule('=');
  console.log('SLATE — a production, start to finish');
  rule('=');

  const title = await ask('What is it called?', null, 'Untitled');

  const formatId = await ask('Which format?',
    FORMATS.map((f) => ({ label: f.label, note: f.what.slice(0, 54) + '…', value: f.id })), 'feature');
  const format = FORMAT_BY_ID[formatId];

  let engineId;
  if (format.medium === 'television') {
    const can = ENGINES.filter((e) => e.cadences.some((c) => format.cadences.includes(c)));
    engineId = await ask('What keeps it going?',
      can.map((e) => ({ label: e.label, note: e.asks, value: e.id })), can[0].id);
  }

  const parts = Number(await ask(
    `How many parts? (${format.parts.least}-${format.parts.most})`, null, String(format.parts.least),
  )) || format.parts.least;
  const mins = Number(await ask(
    `How long is each, in minutes? (${Math.round(format.secondsEach.least / 60)}-`
    + `${Math.round(format.secondsEach.most / 60)})`, null,
    String(Math.round(format.secondsEach.least / 60)),
  )) || Math.round(format.secondsEach.least / 60);

  console.log('\n--- The heads. This settles the shape. ---');
  const staffing = {};
  for (const dept of DEPARTMENTS) {
    staffing[dept.id] = await ask(`${dept.post}?`,
      BANDS.map((b) => ({ label: b.label, note: `${m(b.perPartCents)} a part`, value: b.id })), 'working');
  }
  const heads = headsCostCents(staffing, parts);
  console.log(`\n  The heads want ${m(heads)} for ${parts} part${parts === 1 ? '' : 's'}.`);

  const spend = Number(await ask('What else does it cost, in millions?', null, '3')) || 3;
  const campaign = Number(await ask(
    `Campaign, in millions? (${format.label} expects ${m(format.expectsCampaignCents)})`, null, '0.5',
  )) || 0.5;

  const channel = await ask('Where does it open?',
    format.channels.map((c) => ({ label: CHANNEL_LABEL[c], value: c })), format.channels[0]);
  const month = await ask('Which month?',
    MONTH_SAID.map((name, i) => ({ label: name, value: i })), 5);

  rl.close();

  const made = makeIt({
    title, formatId, parts, secondsEach: mins * 60,
    spendCents: Math.round(spend * 1_000_000_00), campaignCents: Math.round(campaign * 1_000_000_00),
    channel, engineId, staffing,
  }, Number(month), 0.3);

  console.log('');
  reportOne(made);
  rule('=');
}

// ---------------------------------------------------------------------------

async function main() {
  // Built even in the reporting path, because the point of the instrument is that
  // it runs against a real save rather than against the content tables alone.
  const sim = quickSave({}, 'studio');
  if (!sim.hasCommand('production.release')) {
    console.log('The production system is not registered on this save.');
    process.exit(1);
  }

  if (PLAY) { await play(); return; }

  const seasons = [];
  for (let seed = 0; seed < SEEDS; seed += 1) {
    const made = playASeason(seed);
    seasons.push(made);
    if (SEEDS <= 3) reportSeason(seed, made);
  }

  if (SEEDS > 3) {
    rule('=');
    console.log(`${SEEDS} SEASONS`);
    rule('=');
    const profits = seasons.map((s) => s.reduce((a, x) => a + x.profit, 0));
    const won = profits.filter((p) => p > 0).length;
    const sorted = [...profits].sort((a, b) => a - b);
    console.log(`  Profitable years   ${won} of ${SEEDS}`);
    console.log(`  Worst year         ${m(sorted[0])}`);
    console.log(`  Median year        ${m(sorted[Math.floor(sorted.length / 2)])}`);
    console.log(`  Best year          ${m(sorted[sorted.length - 1])}`);
    // A studio that always wins is not a game and a studio that always loses is
    // not one either. The spread is the thing worth reporting.
    console.log(`\n  A spread of ${m(sorted[sorted.length - 1] - sorted[0])} across the same slate,`);
    console.log('  from nothing but when each thing opened and what it opened against.');
    rule('=');
  }
}

await main();
