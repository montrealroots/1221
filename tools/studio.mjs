/**
 * SLATE — the studio, played as text.
 *
 * The production system is an engine, and an engine nobody can sit in front of is a
 * library. This is the seat.
 *
 * It earns its place in `tools/` for a second reason, and that one matters more: it
 * is an **instrument**. Every figure it prints came out of the same command path the
 * game uses — it options material, writes a script, settles a shape, engages people,
 * commits the money and opens the picture by issuing the real commands and reading
 * the real ledger. Nothing here reimplements anything. So a number measured with this
 * is measured on a played career rather than on an idle save, which is the rule this
 * project has paid for twice.
 *
 * The run is driven by `payAWeek` rather than by advancing the world clock a year per
 * picture. That is the one place it departs from a player's path, and deliberately: a
 * measurement that takes a year of world time per release is a measurement nobody
 * takes. The weeks it pays are the weeks the scheduler would have paid.
 *
 *   npx vite-node tools/studio.mjs                a year, played and reported
 *   npx vite-node tools/studio.mjs --receipt      every link on every picture
 *   npx vite-node tools/studio.mjs --seeds 12     many years, for the spread
 *   npx vite-node tools/studio.mjs --play         make the decisions yourself
 */

import { createInterface } from 'node:readline/promises';
import { quickSave } from '../src/engine/index.ts';
import { CENTS_IN_A_MILLION } from '../src/engine/core/money.ts';
import { foundTheCompany, cashAccountFor, parentCompany, projectsOf } from '../src/engine/world/company.ts';
import { FORMATS, FORMAT_BY_ID, CHANNEL_LABEL } from '../src/engine/content/format.ts';
import { GENRES, GENRE_BY_ID, DIALS, DIAL_BY_ID, MOST, ATTENTION, leftToSpend } from '../src/engine/content/story.ts';
import { SOURCES, SOURCE_BY_ID, carriedInto } from '../src/engine/content/source.ts';
import { POSTS } from '../src/engine/content/craft.ts';
import { castingFor } from '../src/engine/content/roles.ts';
import { LAST_WEEK_ANYTHING_PAYS, MONTH_SAID } from '../src/engine/content/release.ts';
import {
  shortlistFor, castingShortlist, offersFor, sourceOf, feesOn, pointsGiven,
} from '../src/engine/world/production.ts';
import { payAWeek } from '../src/engine/world/run.ts';
import { receivedBy, costOf } from '../src/engine/world/takings.ts';
import { theWeeksAhead } from '../src/engine/world/field.ts';
import { theReceipt } from '../src/engine/world/boxoffice.ts';

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const SEEDS = Number(arg('seeds', 1));
const SHOW_RECEIPT = has('receipt');
const PLAY = has('play');
const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

const m = (cents) => {
  const mil = cents / CENTS_IN_A_MILLION;
  if (Math.abs(mil) >= 1) return `${mil < 0 ? '-' : ''}EUR ${Math.abs(mil).toFixed(2)}m`;
  return `${cents < 0 ? '-' : ''}EUR ${Math.round(Math.abs(cents) / 100_000)}k`;
};
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);
const rule = (ch = '-') => console.log(ch.repeat(76));

/**
 * A company with money in it, which a fresh save does not have.
 *
 * The family's own money reaches the company through the sugar group over years, and
 * an instrument that waited for that would be measuring the sugar group. So this puts
 * capital in directly, as an equity posting rather than by assigning a balance —
 * because a balance somebody typed is the one thing the ledger will not have.
 */
function aStudioWithMoney(seed, cents = 40_000_000_00) {
  const sim = quickSave({}, `studio-${seed}`);
  const company = parentCompany(sim.universe) ?? foundTheCompany(sim);
  let cash = cashAccountFor(sim.universe, company.id);
  if (!cash) {
    cash = sim.ledger.open({
      id: `acct:${company.id}:cash`,
      saveId: sim.universe.meta.id,
      kind: 'company_cash',
      name: `${company.name} Cash`,
      ownerId: company.id,
      balance: 0,
      openedAt: sim.now,
      nominal: false,
      category: 'business',
    });
  }
  if (!sim.ledger.tryAccount('equity:capital')) {
    sim.ledger.open({
      id: 'equity:capital',
      saveId: sim.universe.meta.id,
      kind: 'equity',
      name: 'Capital',
      ownerId: 'world',
      balance: 0,
      openedAt: sim.now,
      nominal: true,
      category: 'business',
    });
  }
  const short = cents - cash.balance;
  if (short > 0) {
    sim.post({
      memo: 'Capital In',
      category: 'business',
      postings: [{ accountId: 'equity:capital', amount: -short }, { accountId: cash.id, amount: short }],
    });
  }
  return { sim, company, cash };
}

/** Runs a command and throws with the refusal, because a silent refusal is a lie. */
function must(sim, kind, payload) {
  const done = sim.execute({ kind, payload });
  const said = done.value?.error ?? done.error;
  if (!done.ok) throw new Error(`${kind} refused: ${said}`);
  return done.value ?? {};
}

/** A slate spread across the decision space, so a year is not one plan nine times. */
function aSlate(seed) {
  const pick = (list, n) => list[(seed * 7 + n * 3) % list.length];
  return [
    {
      title: 'The Weight of Water', provenance: 'novel', genreId: 'drama',
      formatId: 'feature', parts: 1, mins: 118,
      dials: { depth: 5, dialogue: 5, pace: 2, turns: 2, threads: 4, spectacle: 4 },
      spend: 4_200_000_00, campaign: 380_000_00, channel: 'theatrical',
      want: { director: 'sought', writer: 'sought', lead: 'first' },
    },
    {
      title: 'Hraun', provenance: 'format', genreId: 'thriller',
      engineId: 'serial', people: 5,
      formatId: 'miniseries', parts: 6, mins: 52,
      dials: { depth: 3, dialogue: 3, pace: 5, turns: 5, threads: 3, spectacle: 4 },
      spend: 7_800_000_00, campaign: 140_000_00, channel: 'broadcast',
      want: { director: 'first', writer: 'first', lead: 'working' },
    },
    {
      title: 'Night Shift', provenance: 'article', genreId: 'crime',
      formatId: 'tv-movie', parts: 1, mins: 92,
      dials: { depth: 4, dialogue: 4, pace: 3, turns: 4, threads: 3, spectacle: 2 },
      spend: 900_000_00, campaign: 18_000_00, channel: 'broadcast',
      want: { director: 'working', lead: 'starting' },
    },
    {
      title: 'Twelve Small Rooms', provenance: 'play', genreId: 'romance',
      formatId: 'feature', parts: 1, mins: 96,
      dials: { depth: 5, dialogue: 5, pace: 2, turns: 1, threads: 5, spectacle: 1 },
      spend: 1_900_000_00, campaign: 160_000_00, channel: 'theatrical',
      want: { writer: 'first', lead: 'sought' },
    },
    {
      title: 'Ten Second Gods', provenance: 'original', genreId: 'comedy',
      engineId: 'case', people: 3,
      formatId: 'micro', parts: 24, mins: 5,
      dials: { depth: 2, dialogue: 5, pace: 5, turns: 3, threads: 1, spectacle: 2 },
      spend: 600_000_00, campaign: 12_000_00, channel: 'streaming',
      want: { writer: 'sought', lead: 'starting' },
    },
    {
      title: pick(['Coldwater', 'The Long Eighty', 'Salt'], 1), provenance: 'novel',
      genreId: 'action', formatId: 'feature', parts: 1, mins: 132,
      dials: { depth: 2, dialogue: 2, pace: 5, turns: 4, threads: 2, spectacle: 5 },
      spend: 11_000_000_00, campaign: 600_000_00, channel: 'theatrical',
      want: { director: 'first', lead: 'first', music: 'sought' },
    },
  ];
}

/** Puts one picture all the way through the real pipeline. */
function make(sim, plan, weeksOut) {
  const source = SOURCE_BY_ID[plan.provenance];
  must(sim, 'company.option', {
    title: plan.title, provenance: plan.provenance, hold: 'option',
    optionFeeCents: source.aboutCents,
  });
  const holding = Object.values(sim.universe.holdings).find((h) => h.title === plan.title);
  const { id: projectId } = must(sim, 'company.develop', {
    title: plan.title, holdingId: holding?.id,
  });

  // Television is a machine that makes episodes, and the engine refuses a premise
  // with nothing underneath it. A film needs none, which is the whole distinction.
  if (plan.engineId) {
    must(sim, 'company.conceive', {
      projectId, engineId: plan.engineId, worldId: 'is-39-reykjavik', people: plan.people ?? 5,
    });
  }

  must(sim, 'production.write', { projectId, genreId: plan.genreId, dials: plan.dials });
  must(sim, 'production.shape', {
    projectId, formatId: plan.formatId, parts: plan.parts, secondsEach: plan.mins * 60,
  });

  // Engage from the real shortlist, taking the best person at or under the standing
  // asked for, and points wherever the fee would not be affordable on its own.
  const engaged = [];
  for (const [postId, want] of Object.entries(plan.want)) {
    const list = shortlistFor(sim, projectId, postId);
    const pick = list.find((one) => one.standingId === want) ?? list[0];
    if (!pick) continue;
    const post = POSTS.find((p) => p.id === postId);
    const kind = post?.aboveTheLine && want === 'first' ? 'points' : 'fee';
    must(sim, 'production.engage', { projectId, postId, talentId: pick.id, dealKind: kind });
    engaged.push({ name: pick.name, post: post?.title ?? postId, standing: want, kind });
  }

  // And the cast, which is a list decided by the shape rather than one chair. The
  // plan says what standing it wants at the top and the rest fall away from it, the
  // way a real cast list does.
  const billings = castingFor(FORMAT_BY_ID[plan.formatId].medium, plan.parts);
  for (let i = 0; i < billings.length; i += 1) {
    const billing = billings[i];
    const want = i === 0 ? (plan.leads ?? 'sought') : i < 3 ? 'working' : 'starting';
    const list = castingShortlist(sim, projectId, billing.id);
    const pick = list.find((one) => one.standingId === want) ?? list[0];
    if (!pick) continue;
    const kind = i === 0 && want === 'first' ? 'points' : 'fee';
    must(sim, 'production.cast', { projectId, billingId: billing.id, talentId: pick.id, dealKind: kind });
    engaged.push({ name: pick.name, post: billing.label, standing: pick.standingId, kind });
  }

  const project = projectsOf(sim.universe).find((p) => p.id === projectId);
  const fees = feesOn(project);
  // The budget is what the picture costs to make, and it leaves the bank here with
  // the fees. Until the commit charged it, a player could declare an eighty million
  // pound picture and pay for seven department heads.
  must(sim, 'production.commit', { projectId, budgetCents: plan.spend });

  const at = sim.now + weeksOut * MS_WEEK;
  const opened = must(sim, 'production.open', {
    projectId, channel: plan.channel, at, campaignCents: plan.campaign,
  });

  // Play the whole life of the release. The scheduler would do this a week at a
  // time over more than a year of world time; the instrument does not have a year.
  for (let week = 1; week <= LAST_WEEK_ANYTHING_PAYS; week += 1) payAWeek(sim, projectId, week);

  return {
    plan, projectId, engaged, fees, source, at,
    opened,
    received: receivedBy(sim, projectId),
    cost: costOf(sim, projectId),
  };
}

function report(sim, made) {
  const { plan, engaged, fees, source, at } = made;
  const format = FORMAT_BY_ID[plan.formatId];
  const project = projectsOf(sim.universe).find((p) => p.id === made.projectId);
  rule();
  console.log(plan.title);
  console.log(`  ${format.label} — ${plan.parts} x ${plan.mins} min, ${CHANNEL_LABEL[plan.channel]}`);
  console.log(`  ${GENRE_BY_ID[plan.genreId].label}, from ${source.label.toLowerCase()}`);
  console.log(`  Opened ${MONTH_SAID[new Date(at).getUTCMonth()]} ${new Date(at).getUTCDate()}`);
  console.log('');
  console.log(`  Script: ${DIALS.map((d) => `${DIAL_BY_ID[d].label.split(' ')[0].toLowerCase()} ${plan.dials[d]}`).join(', ')}`);
  console.log(`          ${leftToSpend(plan.dials, carriedInto(source))} of `
    + `${ATTENTION + carriedInto(source)} points spare`);
  for (const one of engaged) {
    console.log(`  ${pad(one.post, 22)} ${pad(one.name, 24)} ${one.standing}`
      + `${one.kind === 'points' ? ', on points' : ''}`);
  }
  if (pointsGiven(project) > 0) console.log(`  ${pointsGiven(project)}% of the back end given away`);
  console.log('');
  if (SHOW_RECEIPT) {
    console.log('  How the opening was reckoned:');
    for (const line of theReceipt({ said: made.opened.receiptNotes ?? [], cents: 0, wordOfMouth: 0 })) {
      console.log(`    ${line}`);
    }
    for (const line of made.opened.receipt ?? []) console.log(`    ${line}`);
    console.log('');
  }
  console.log(`  Word of mouth  ${rpad(made.opened.wordOfMouth.toFixed(2), 10)}`);
  console.log(`  Fees           ${rpad(m(fees), 10)}`);
  console.log(`  Campaign       ${rpad(m(plan.campaign), 10)}`);
  console.log(`  Negative cost  ${rpad(m(plan.spend), 10)}`);
  console.log(`  ${pad('IN', 14)} ${rpad(m(made.received), 10)}`);
  console.log(`  ${pad('OUT', 14)} ${rpad(m(made.cost), 10)}`);
  // Both sides off the ledger. The budget goes out with the fees at the greenlight
  // now, so it is inside `costOf` and must not be taken off a second time here —
  // which is what this line did while nothing was charging it.
  const profit = made.received - made.cost;
  console.log(`  ${pad(profit >= 0 ? 'PROFIT' : 'LOSS', 14)} ${rpad(m(profit), 10)}`);
  return profit;
}

function playAYear(seed) {
  const { sim, cash } = aStudioWithMoney(seed);
  const slate = aSlate(seed);
  const made = [];
  for (let i = 0; i < slate.length; i += 1) {
    try {
      made.push(make(sim, slate[i], 6 + i * 7 + (seed % 5)));
    } catch (why) {
      console.log(`  ${slate[i].title}: ${why.message}`);
    }
  }
  return { sim, cash, made };
}

function reportYear(seed, { sim, cash, made }) {
  rule('=');
  console.log(`A YEAR AT THE STUDIO   (world ${seed})`);
  rule('=');
  let profit = 0;
  for (const one of made) profit += report(sim, one);
  rule('=');
  const inAll = made.reduce((s, x) => s + x.received, 0);
  const outAll = made.reduce((s, x) => s + x.cost, 0);
  const won = made.filter((x) => x.received - x.cost > 0).length;
  console.log(`  ${pad('TOOK', 14)} ${rpad(m(inAll), 10)}`);
  console.log(`  ${pad('SPENT', 14)} ${rpad(m(outAll), 10)}`);
  console.log(`  ${pad(profit >= 0 ? 'PROFIT' : 'LOSS', 14)} ${rpad(m(profit), 10)}`
    + `   ${won} of ${made.length} paid for themselves`);
  console.log(`  ${pad('IN THE BANK', 14)} ${rpad(m(cash.balance), 10)}`);
  rule('=');
  return profit;
}

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
    if (!options) return said;
    const n = Number(said);
    return Number.isInteger(n) && n >= 1 && n <= options.length ? options[n - 1].value : fallback;
  };

  const { sim, cash } = aStudioWithMoney('you');
  rule('=');
  console.log('SLATE — one picture, start to finish');
  console.log(`The company has ${m(cash.balance)}.`);
  rule('=');

  const title = await ask('What is it called?', null, 'Untitled');
  const provenance = await ask('Where did it come from?',
    SOURCES.map((s) => ({
      label: s.label,
      note: `${m(s.aboutCents)}, ${Math.round(s.knownAlready * 100)}% of the campaign already paid`,
      value: s.id,
    })), 'original');
  const source = SOURCE_BY_ID[provenance];

  must(sim, 'company.option', { title, provenance, hold: 'option', optionFeeCents: source.aboutCents });
  const holding = Object.values(sim.universe.holdings).find((h) => h.title === title);
  const { id: projectId } = must(sim, 'company.develop', { title, holdingId: holding?.id });

  const genreId = await ask('What is it?',
    GENRES.map((g) => ({ label: g.label, note: g.what, value: g.id })), 'drama');
  const genre = GENRE_BY_ID[genreId];

  console.log(`\n--- The page. ${ATTENTION + carriedInto(source)} points across six dials. ---`);
  const dials = {};
  for (const d of DIALS) {
    const want = genre.wants[d] >= 2 ? '  (this audience came for it)' : '';
    const spare = leftToSpend(dials, carriedInto(source));
    const at = await ask(`${DIAL_BY_ID[d].label}, 0-${MOST}? ${spare} spare.${want}`, null, '3');
    dials[d] = Math.max(0, Math.min(MOST, Number(at) || 0));
  }
  const wrote = sim.execute({ kind: 'production.write', payload: { projectId, genreId, dials } });
  if (!wrote.ok) console.log(`  ${wrote.value?.error ?? wrote.error}`);

  const suits = FORMATS.filter((f) => source.suits.length === 0 || source.suits.includes(f.id));
  const formatId = await ask('Made as?',
    suits.map((f) => ({ label: f.label, note: f.what.slice(0, 56), value: f.id })), suits[0].id);
  const format = FORMAT_BY_ID[formatId];
  const parts = Number(await ask(
    `How many parts? (${format.parts.least}-${format.parts.most})`, null, String(format.parts.least),
  )) || format.parts.least;
  const mins = Number(await ask(
    `Minutes each? (${Math.round(format.secondsEach.least / 60)}-${Math.round(format.secondsEach.most / 60)})`,
    null, String(Math.round(format.secondsEach.least / 60)),
  )) || Math.round(format.secondsEach.least / 60);
  const shaped = sim.execute({
    kind: 'production.shape', payload: { projectId, formatId, parts, secondsEach: mins * 60 },
  });
  if (!shaped.ok) { console.log(`  ${shaped.value?.error ?? shaped.error}`); rl.close(); return; }

  console.log('\n--- Who is on it. Engaging anybody settles the shape and the page. ---');
  for (const post of POSTS) {
    const list = shortlistFor(sim, projectId, post.id);
    const options = [{ label: 'Nobody — let the office find one', value: undefined }];
    for (const one of list) {
      const offers = offersFor(one, parts);
      options.push({ label: `${one.name} — ${m(offers.fee.feeCents)} flat`, value: { id: one.id, kind: 'fee' } });
      if (post.aboveTheLine) {
        options.push({
          label: `${one.name} — ${m(offers.points.feeCents)} and ${offers.points.points}% of what comes in`,
          value: { id: one.id, kind: 'points' },
        });
      }
    }
    const took = await ask(`${post.title}?`, options, undefined);
    if (!took) continue;
    const done = sim.execute({
      kind: 'production.engage',
      payload: { projectId, postId: post.id, talentId: took.id, dealKind: took.kind },
    });
    if (!done.ok) console.log(`  ${done.value?.error ?? done.error}`);
  }

  const project = projectsOf(sim.universe).find((p) => p.id === projectId);
  console.log(`\n  Fees at the greenlight: ${m(feesOn(project))}. `
    + `Back end given away: ${pointsGiven(project)}%.`);
  const committed = sim.execute({ kind: 'production.commit', payload: { projectId } });
  if (!committed.ok) { console.log(`  ${committed.value?.error ?? committed.error}`); rl.close(); return; }

  const channel = await ask('Where does it open?',
    format.channels.map((c) => ({ label: CHANNEL_LABEL[c], value: c })), format.channels[0]);
  const ahead = theWeeksAhead(sim, sim.now, channel, 26);
  const weeksOut = await ask('Which week?', ahead.map((w, i) => ({
    label: `${MONTH_SAID[new Date(w.at).getUTCMonth()]} ${new Date(w.at).getUTCDate()}`,
    note: `${Math.round(w.crowding * 100)}% taken${w.against.length ? ` — ${w.against.map((a) => a.who).join(', ')}` : ''}`,
    value: i,
  })), 8);
  const campaign = Math.round((Number(await ask(
    `Campaign, in millions? (it needs about ${m(Math.round(format.expectsCampaignCents * (1 - source.knownAlready)))})`,
    null, '0.3',
  )) || 0.3) * CENTS_IN_A_MILLION);

  rl.close();
  const out = sim.execute({
    kind: 'production.open',
    payload: { projectId, channel, at: sim.now + Number(weeksOut) * MS_WEEK, campaignCents: campaign },
  });
  if (!out.ok) { console.log(`\n  ${out.value?.error ?? out.error}`); return; }

  for (let week = 1; week <= LAST_WEEK_ANYTHING_PAYS; week += 1) payAWeek(sim, projectId, week);

  rule('=');
  console.log(`${title} — how it went`);
  rule('=');
  for (const line of out.value.receipt ?? []) console.log(`  ${line}`);
  console.log('');
  console.log(`  Word of mouth  ${out.value.wordOfMouth.toFixed(2)}`);
  console.log(`  ${pad('IN', 14)} ${rpad(m(receivedBy(sim, projectId)), 10)}`);
  console.log(`  ${pad('OUT', 14)} ${rpad(m(costOf(sim, projectId)), 10)}`);
  console.log(`  ${pad('IN THE BANK', 14)} ${rpad(m(cash.balance), 10)}`);
  rule('=');
}

async function main() {
  if (PLAY) { await play(); return; }
  const years = [];
  for (let seed = 0; seed < SEEDS; seed += 1) {
    const year = playAYear(seed);
    years.push(SEEDS <= 3 ? reportYear(seed, year) : reportQuietly(year));
  }
  if (SEEDS > 3) {
    rule('=');
    console.log(`${SEEDS} YEARS, SAME SLATE`);
    rule('=');
    const sorted = [...years].sort((a, b) => a - b);
    console.log(`  Profitable years   ${years.filter((p) => p > 0).length} of ${SEEDS}`);
    console.log(`  Worst              ${m(sorted[0])}`);
    console.log(`  Median             ${m(sorted[Math.floor(sorted.length / 2)])}`);
    console.log(`  Best               ${m(sorted[sorted.length - 1])}`);
    console.log(`\n  A spread of ${m(sorted[sorted.length - 1] - sorted[0])} on the same six pictures,`);
    console.log('  from nothing but which week each opened and what it opened against.');
    rule('=');
  }
}

/** The same year, totalled and not printed, for the spread. */
function reportQuietly({ made }) {
  return made.reduce((sum, x) => sum + x.received - x.cost, 0);
}

await main();
