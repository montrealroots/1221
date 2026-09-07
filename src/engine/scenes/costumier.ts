/**
 * The costume house.
 *
 * Four things happen in this room. You can have something cut for you, which
 * is the reason the room exists. You can bring something you already own and
 * have a tailor move it. You can stand on the box for a fitting on something
 * already on the table. Or you can collect what is finished.
 *
 * The design is a conversation with an order to it — what is it, what is it
 * cut from, how is it finished, what goes in the neck — because that is the
 * order a real workroom goes in, and because each answer changes what the
 * next question sensibly offers. The cutter says the awkward things out loud
 * before you pay: that chiffon has to be cut between paper, that leather keeps
 * every hole, that boning on this garment will read as armor. None of it
 * refuses the order. It is your money and your costume.
 *
 * Making one yourself is not in this room. That happens at your own table,
 * from the Shopping page, because the workroom is not involved.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { plural } from '../core/text';
import { MS_DAY } from '../core/time';
import { formatMoney } from '../core/money';
import type { SceneSession } from '../domain/model';
import { placeById, type Place } from '../content/places';
import { CLOTHS, FINISHES, GARMENT_KINDS, clothOf, finishOf, garmentKindOf } from '../content/costume';
import { preview, speak } from '../dialogue/library';
import {
  ALTERATIONS, CONSULT_MINUTES, cutterAt, describeSpec, isCostumier, openCostumes,
  quoteFor, standingAt, tierOf, type Spec,
} from '../systems/costume';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

function line(
  sim: Simulation, purpose: string, beat: string,
  ctx: { flags?: string[]; result?: string; vars?: Record<string, string> },
  salt: string, record: boolean,
): string {
  const query = { section: 'costume', purpose, beat };
  return (record ? speak(sim, query, ctx, salt) : preview(sim, query, ctx, salt)).text;
}

/** The spec being built, read back off the session. */
function specOf(session: SceneSession): Spec {
  const c = session.context;
  return {
    kind: String(c['kind'] ?? 'jacket'),
    cloth: String(c['cloth'] ?? 'wool_suiting'),
    finish: String(c['finish'] ?? 'machine'),
    label: c['label'] ? String(c['label']) : undefined,
  };
}

function placeOf(sim: Simulation, session: SceneSession): Place {
  const place = placeById(sim.player.currentLocationId, String(session.context['placeId'] ?? ''));
  if (!place) throw new CommandError('You are not standing in the workroom any more.');
  return place;
}

export const COSTUMIER_SCENE = defineScene({
  id: 'life.costumier',
  version: 1,
  title: 'The Costume House',
  placeBound: true,

  available(sim) {
    const place = placeById(sim.player.currentLocationId, sim.player.currentPlaceId ?? '');
    if (!isCostumier(place)) return { ok: false, reason: 'You are not at a costume house.' };
    return { ok: true };
  },

  start(sim) {
    const place = placeById(sim.player.currentLocationId, sim.player.currentPlaceId ?? '');
    if (!isCostumier(place)) throw new CommandError('You are not at a costume house.');
    return {
      node: 'counter',
      context: {
        placeId: place!.id,
        kind: 'jacket',
        cloth: 'wool_suiting',
        finish: 'machine',
        label: '',
        line: '',
      },
    };
  },

  view(sim, session) {
    const place = placeOf(sim, session);
    const cutter = sim.universe.people[cutterAt(sim, place).id]!;
    const standing = standingAt(sim, place);
    const spec = specOf(session);
    const said = String(session.context['line'] ?? '');

    switch (session.node) {
      case 'counter': {
        const open = openCostumes(sim, sim.player.id).filter((c) => c.placeId === place.id);
        const ready = open.filter((c) => c.status === 'ready');
        const fitting = open.filter(
          (c) => (c.status === 'ordered' || c.status === 'fitting') && c.fittingsDone < c.fittingsWanted,
        );
        const choices: SceneChoice[] = [
          { id: 'design', label: 'Have Something Cut', aliases: ['commission', 'make', 'design', 'bespoke'], tone: 'primary', detail: 'They will ask you four questions.' },
        ];
        for (const c of fitting) {
          choices.push({
            id: `fit:${c.id}`,
            label: 'Stand For A Fitting',
            aliases: ['fitting', 'fit', 'stand'],
            tone: 'primary',
            detail: `${describeSpec(c)} — fitting ${c.fittingsDone + 1} of ${c.fittingsWanted}.`,
          });
        }
        for (const c of ready) {
          choices.push({
            id: `collect:${c.id}`,
            label: 'Collect What Is Finished',
            aliases: ['collect', 'pick up'],
            tone: 'primary',
            detail: `${describeSpec(c)} — ${formatMoney(c.quotedPrice - c.deposit)} to settle.`,
          });
        }
        choices.push({ id: 'alter', label: 'Ask About An Alteration', aliases: ['alter', 'tailor', 'take in', 'hem'] });
        choices.push({ id: 'look', label: 'Look At The Rail', aliases: ['rail', 'browse', 'see'], detail: 'What is hanging, and what it was for.' });
        choices.push({ id: 'leave', label: 'Leave', aliases: ['out', 'go'] });
        return {
          title: place.name,
          eyebrow: `${cutter.displayName} · At The Table`,
          text: said || line(sim, 'greeting', 'counter', {
            flags: [standing.regular ? 'regular' : 'stranger', tierOf(place) >= 4 ? 'grand' : 'workroom'],
            vars: { name: cutter.displayName, shop: place.name },
          }, `${session.id}:greet`, false),
          facts: [
            { label: 'The Room', value: tierOf(place) >= 4 ? 'A House That Cuts For Film' : 'A Working Workroom' },
            ...(standing.visits > 0 ? [{ label: 'Been In', value: plural(standing.visits, 'Time') }] : []),
            ...(standing.commissions > 0 ? [{ label: 'Cut For You', value: plural(standing.commissions, 'Piece') }] : []),
          ],
          choices,
          canSkip: true,
        };
      }

      case 'kind':
        return {
          title: 'What Are We Making',
          eyebrow: place.name,
          text: said || line(sim, 'design', 'garment', { vars: { name: cutter.displayName } }, `${session.id}:kind`, false),
          choices: [
            ...GARMENT_KINDS.map((g) => ({
              id: `kind:${g.id}`,
              label: g.name,
              aliases: [g.id],
              detail: `${plural(Math.ceil(g.yards), 'yard')}, about ${plural(g.hours, 'hour')} at the table, `
                + `${g.fittings === 0 ? 'no fittings' : plural(g.fittings, 'fitting')}.`,
            })),
            { id: 'back', label: 'Not Today', aliases: ['back', 'cancel'] },
          ],
          canSkip: true,
        };

      case 'cloth':
        return {
          title: 'Cut From What',
          eyebrow: garmentKindOf(spec.kind).name,
          text: said || line(sim, 'design', 'cloth', {}, `${session.id}:cloth`, false),
          choices: [
            ...CLOTHS.map((c) => ({
              id: `cloth:${c.id}`,
              label: c.name,
              aliases: [c.id],
              detail: `${c.hand.charAt(0).toUpperCase()}${c.hand.slice(1)}.`,
            })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };

      case 'finish':
        return {
          title: 'Finished How',
          eyebrow: `${clothOf(spec.cloth).name} ${garmentKindOf(spec.kind).name}`,
          text: said || line(sim, 'design', 'finish', {}, `${session.id}:finish`, false),
          choices: [
            ...FINISHES.map((f) => ({ id: `finish:${f.id}`, label: f.name, aliases: [f.id], detail: f.detail })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };

      case 'label':
        return {
          title: 'Anything In The Neck',
          eyebrow: describeSpec(spec),
          text: said || 'Type what you want woven into the label, or leave it blank. '
            + 'Forty-eight characters, and it stays in there for the life of the garment.',
          choices: [
            { id: 'label:none', label: 'Leave It Blank', tone: 'primary', aliases: ['none', 'blank', 'no'] },
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          // Anything typed here is the label itself, not a command.
          freeText: { label: 'Label', placeholder: 'What to weave into the neck', prefix: 'label:' },
          canSkip: true,
        };

      case 'quote': {
        const quote = quoteFor(place, spec);
        return {
          title: 'What It Would Cost',
          eyebrow: describeSpec(spec),
          text: [
            said || line(sim, 'quote', 'counter', {
              vars: { total: formatMoney(quote.total), weeks: String(quote.weeks) },
              flags: [quote.cautions.length > 0 ? 'caution' : 'clean'],
            }, `${session.id}:quote`, false),
            // Said before you pay, not after. None of it refuses the order.
            ...quote.cautions,
          ].join('\n\n'),
          facts: [
            { label: 'Cloth', value: formatMoney(quote.clothCost) },
            { label: 'The Table', value: formatMoney(quote.labour) },
            { label: 'All In', value: formatMoney(quote.total) },
            { label: 'Ready In', value: plural(quote.weeks, 'Week') },
            { label: 'Fittings', value: quote.fittings === 0 ? 'None' : plural(quote.fittings, 'Fitting') },
          ],
          choices: [
            {
              id: 'approve',
              label: 'Have It Cut',
              tone: 'primary',
              aliases: ['yes', 'order', 'go ahead'],
              detail: `${formatMoney(Math.round(quote.total * 0.35))} down, the rest on collection.`,
            },
            { id: 'change', label: 'Change Something', aliases: ['back', 'again', 'rethink'] },
            { id: 'think', label: 'Think About It', aliases: ['leave', 'no', 'later'] },
          ],
          canSkip: true,
        };
      }

      case 'alter': {
        const wearable = Object.values(sim.universe.assets)
          .filter((a) => a.ownerId === sim.player.id && !a.soldAt && a.wardrobe)
          .slice(0, 12);
        return {
          title: 'What Needs Moving',
          eyebrow: place.name,
          text: said || 'Bring it in and they will tell you what can be done to it. '
            + 'Taking in is always possible. Letting out depends on what the maker left inside the seam.',
          choices: [
            ...wearable.map((a) => ({
              id: `garment:${a.id}`,
              label: a.name,
              aliases: [a.id],
              detail: a.wardrobe?.fit ? `Fits ${a.wardrobe.fit} of 100.` : 'Off the rack.',
            })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };
      }

      case 'alteration': {
        const assetId = String(session.context['assetId'] ?? '');
        const asset = sim.universe.assets[assetId];
        return {
          title: 'What Are We Doing To It',
          eyebrow: asset?.name ?? 'The Garment',
          text: said || 'The tailor turns it inside out, looks at the allowances, and tells you what it will take.',
          choices: [
            ...ALTERATIONS.map((a) => ({ id: `alteration:${a.id}`, label: a.name, aliases: [a.id], detail: a.note })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };
      }

      case 'done':
        return {
          title: 'Done',
          eyebrow: place.name,
          text: said || 'That is that.',
          choices: [{ id: 'finish', label: 'Leave', tone: 'primary', aliases: ['out', 'go'] }],
          canSkip: false,
        };

      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    const place = placeOf(sim, session);
    const spec = () => specOf(session);

    if (session.node === 'counter') {
      if (choiceId === 'design') {
        ctx.commit('look', { kind: 'costume.look', payload: { placeId: place.id } });
        session.context['line'] = '';
        ctx.go('kind');
        return;
      }
      if (choiceId === 'look') {
        const result = ctx.commit<{ visits: number; regular: boolean }>('look', {
          kind: 'costume.look', payload: { placeId: place.id },
        });
        session.context['line'] = result.regular
          ? 'They pull two things off the rail without being asked, because they remember what suited you.'
          : 'Toiles on one wall, finished pieces on the other, and a docket pinned to every hanger saying what it was for.';
        return;
      }
      if (choiceId === 'alter') { session.context['line'] = ''; ctx.go('alter'); return; }
      if (choiceId.startsWith('fit:')) {
        const costumeId = choiceId.slice(4);
        const result = ctx.commit<{ done: number; wanted: number; note: string }>(`fit:${costumeId}`, {
          kind: 'costume.fitting', payload: { costumeId },
        });
        session.context['line'] = `${result.note} That is ${result.done} of ${result.wanted}.`;
        return;
      }
      if (choiceId.startsWith('collect:')) {
        const costumeId = choiceId.slice(8);
        const result = ctx.commit<{ paid: number; quality: number; description: string }>(`collect:${costumeId}`, {
          kind: 'costume.collect', payload: { costumeId },
        });
        session.context['line'] = `${result.description}. ${formatMoney(result.paid)} settled, `
          + `and it fits ${result.quality} of 100.`;
        ctx.go('done');
        return;
      }
      if (choiceId === 'leave') { ctx.say('You put the swatch back on the pile, say thank you, and go out past the machines.'); ctx.finish(); return; }
    }

    if (choiceId === 'back') {
      // Straight back one question, or out of the design altogether.
      const order = ['kind', 'cloth', 'finish', 'label', 'quote'];
      const at = order.indexOf(session.node);
      session.context['line'] = '';
      if (session.node === 'alteration') { ctx.go('alter'); return; }
      ctx.go(at <= 0 ? 'counter' : order[at - 1]!);
      return;
    }

    if (session.node === 'kind' && choiceId.startsWith('kind:')) {
      session.context['kind'] = garmentKindOf(choiceId.slice(5)).id;
      session.context['line'] = '';
      ctx.go('cloth');
      return;
    }

    if (session.node === 'cloth' && choiceId.startsWith('cloth:')) {
      session.context['cloth'] = clothOf(choiceId.slice(6)).id;
      session.context['line'] = '';
      ctx.go('finish');
      return;
    }

    if (session.node === 'finish' && choiceId.startsWith('finish:')) {
      session.context['finish'] = finishOf(choiceId.slice(7)).id;
      session.context['line'] = '';
      ctx.go('label');
      return;
    }

    if (session.node === 'label') {
      if (choiceId === 'label:none') { session.context['label'] = ''; ctx.go('quote'); return; }
      // Anything else typed here is the label itself.
      const text = choiceId.startsWith('label:') ? choiceId.slice(6) : choiceId;
      session.context['label'] = text.trim().slice(0, 48);
      session.context['line'] = '';
      ctx.go('quote');
      return;
    }

    if (session.node === 'quote') {
      if (choiceId === 'change') { session.context['line'] = ''; ctx.go('kind'); return; }
      if (choiceId === 'think') {
        ctx.say('You fold the docket into your pocket. Cloth and hours do not get cheaper for being slept on, but they do not get dearer either.');
        ctx.finish();
        return;
      }
      if (choiceId === 'approve') {
        const made = ctx.commit<{ costumeId: string; description: string }>('commission', {
          kind: 'costume.commission', payload: { placeId: place.id, ...spec() },
        });
        const ordered = ctx.commit<{ deposit: number; balance: number; readyAt: number; weeks: number; fittings: number }>('approve', {
          kind: 'costume.approve', payload: { costumeId: made.costumeId },
        });
        const weeks = Math.max(1, Math.round((ordered.readyAt - sim.now) / (7 * MS_DAY)));
        session.context['line'] = `${made.description}. ${formatMoney(ordered.deposit)} down, `
          + `${formatMoney(ordered.balance)} on collection, ${plural(weeks, 'week')} to wait`
          + `${ordered.fittings > 0 ? `, and ${plural(ordered.fittings, 'fitting')} in between` : ''}.`;
        ctx.go('done');
        return;
      }
    }

    if (session.node === 'alter' && choiceId.startsWith('garment:')) {
      session.context['assetId'] = choiceId.slice(8);
      session.context['line'] = '';
      ctx.go('alteration');
      return;
    }

    if (session.node === 'alteration' && choiceId.startsWith('alteration:')) {
      const change = choiceId.slice(11);
      const assetId = String(session.context['assetId'] ?? '');
      const result = ctx.commit<{ cost: number; note: string; fit: number }>(`alter:${assetId}:${change}`, {
        kind: 'costume.alter', payload: { placeId: place.id, assetId, change },
      });
      session.context['line'] = `${result.note} ${formatMoney(result.cost)}, and it fits ${result.fit} of 100 now.`;
      ctx.go('done');
      return;
    }

    if (session.node === 'done' && choiceId === 'finish') {
      ctx.say(String(session.context['line'] ?? 'You leave.'));
      ctx.finish();
      return;
    }
  },

  /**
   * The short version.
   *
   * Skipping a fitting conversation should not silently order a coat and
   * charge you for it, so this walks out without commissioning anything.
   * Standing for a fitting that is already due, and collecting something
   * already finished and paid for, are different, and it does both.
   */
  summarise(sim, session, ctx) {
    const place = placeOf(sim, session);
    const open = openCostumes(sim, sim.player.id).filter((c) => c.placeId === place.id);
    const fitted = open.filter((c) => (c.status === 'ordered' || c.status === 'fitting') && c.fittingsDone < c.fittingsWanted);
    for (const c of fitted) {
      ctx.commit(`fit:${c.id}`, { kind: 'costume.fitting', payload: { costumeId: c.id } });
    }
    const ready = open.filter((c) => c.status === 'ready');
    for (const c of ready) {
      ctx.commit(`collect:${c.id}`, { kind: 'costume.collect', payload: { costumeId: c.id } });
    }
    const bits: string[] = [];
    if (fitted.length > 0) bits.push(`Stood for ${plural(fitted.length, 'fitting')}`);
    if (ready.length > 0) bits.push(`collected ${plural(ready.length, 'piece')}`);
    ctx.say(bits.length > 0
      ? `${bits.join(' and ')} at ${place.name}.`
      : 'Had a look and left it. Nothing gets cut by skipping the conversation.');
    ctx.finish();
    void CONSULT_MINUTES;
  },
});
