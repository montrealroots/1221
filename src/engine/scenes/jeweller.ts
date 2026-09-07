/**
 * The jeweller's.
 *
 * Two things happen in this room and they are not the same thing. You can look
 * at what is in the case, which is shopping. Or you can sit down at the far end
 * of the counter and describe something that does not exist yet, and somebody
 * who does this for a living asks you five questions and then tells you what it
 * would cost and how long it would take.
 *
 * The design is deliberately a conversation with an order to it — piece, metal,
 * stone, grade, setting — because that is the order a real one goes in, and
 * because each answer changes what the next question sensibly offers. The
 * jeweller says the awkward things out loud before you pay: that titanium
 * cannot be sized, that an emerald is oiled, that a pearl in a ring is a
 * decision. It never refuses the order. It is your money and your piece.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { plural } from '../core/text';
import { MS_DAY } from '../core/time';
import { formatMoney } from '../core/money';
import type { SceneSession } from '../domain/model';
import { placeById, type Place } from '../content/places';
import {
  CLARITIES, COLOUR_GRADES, CUTS, METALS, PIECE_KINDS, SETTINGS, STONES,
  clarityOf, colourGradeOf, cutOf, metalOf, pieceOf, settingOf, stoneOf,
} from '../content/jewellery';
import { preview, speak } from '../dialogue/library';
import {
  DESIGN_MINUTES, describeSpec, isJeweller, jewellerAt, openCommissions, quoteFor,
  standingAt, tierOf, type Spec,
} from '../systems/jewellery';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

/** Carat weights the counter offers without you having to type a number. */
const CARATS: readonly number[] = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5];

function line(
  sim: Simulation, purpose: string, beat: string,
  ctx: { flags?: string[]; result?: string; vars?: Record<string, string> },
  salt: string, record: boolean,
): string {
  const query = { section: 'jewellery', purpose, beat };
  return (record ? speak(sim, query, ctx, salt) : preview(sim, query, ctx, salt)).text;
}

/** The spec being built, read back off the session. */
function specOf(session: SceneSession): Spec {
  const c = session.context;
  return {
    piece: String(c['piece'] ?? 'solitaire_ring'),
    metal: String(c['metal'] ?? 'gold_18'),
    stone: String(c['stone'] ?? 'diamond'),
    carats: Number(c['carats'] ?? 1),
    cut: String(c['cut'] ?? 'round'),
    colourGrade: c['colourGrade'] ? String(c['colourGrade']) : undefined,
    clarity: c['clarity'] ? String(c['clarity']) : undefined,
    setting: String(c['setting'] ?? 'solitaire'),
    engraving: c['engraving'] ? String(c['engraving']) : undefined,
  };
}

function placeOf(sim: Simulation, session: SceneSession): Place {
  const place = placeById(sim.player.currentLocationId, String(session.context['placeId'] ?? ''));
  if (!place) throw new CommandError('You are not standing in the shop any more.');
  return place;
}

export const JEWELLER_SCENE = defineScene({
  id: 'life.jeweller',
  version: 1,
  title: 'The Jeweller',
  placeBound: true,

  available(sim) {
    const place = placeById(sim.player.currentLocationId, sim.player.currentPlaceId ?? '');
    if (!isJeweller(place)) return { ok: false, reason: 'You are not at a jeweller.' };
    return { ok: true };
  },

  start(sim) {
    const place = placeById(sim.player.currentLocationId, sim.player.currentPlaceId ?? '');
    if (!isJeweller(place)) throw new CommandError('You are not at a jeweller.');
    return {
      node: 'counter',
      context: {
        placeId: place!.id,
        piece: 'solitaire_ring',
        metal: 'gold_18',
        stone: 'diamond',
        carats: 1,
        cut: 'round',
        colourGrade: 'g',
        clarity: 'vs1',
        setting: 'solitaire',
        engraving: '',
        line: '',
      },
    };
  },

  view(sim, session) {
    const place = placeOf(sim, session);
    const jeweller = sim.universe.people[jewellerAt(sim, place).id]!;
    const standing = standingAt(sim, place);
    const spec = specOf(session);
    const said = String(session.context['line'] ?? '');

    switch (session.node) {
      case 'counter': {
        const open = openCommissions(sim, sim.player.id);
        const ready = open.filter((c) => c.status === 'ready' && c.placeId === place.id);
        const choices: SceneChoice[] = [
          { id: 'design', label: 'Have Something Made', aliases: ['commission', 'bespoke', 'design', 'make'], tone: 'primary', detail: 'They will ask you five questions.' },
          { id: 'look', label: 'Look In The Case', aliases: ['case', 'browse', 'see'], detail: 'What is already made.' },
          { id: 'services', label: 'Ask About A Repair', aliases: ['repair', 'service', 'clean', 'size', 'valuation'] },
        ];
        for (const c of ready) {
          choices.push({
            id: `collect:${c.id}`,
            label: 'Collect What Is Waiting',
            aliases: ['collect', 'pick up'],
            tone: 'primary',
            detail: `${describeSpec(c)} — ${formatMoney(c.quotedPrice - c.deposit)} to settle.`,
          });
        }
        choices.push({ id: 'leave', label: 'Leave', aliases: ['out', 'go'] });
        return {
          title: place.name,
          eyebrow: `${jeweller.displayName} · ${place.kind === 'jeweller' ? 'At The Bench' : 'Behind The Counter'}`,
          text: said || line(sim, 'greeting', 'counter', {
            flags: [standing.regular ? 'regular' : 'stranger', tierOf(place) >= 5 ? 'maison' : 'bench'],
            vars: { name: jeweller.displayName, shop: place.name },
          }, `${session.id}:greet`, false),
          facts: [
            { label: 'The Room', value: place.kind === 'jeweller' ? 'An Independent Bench' : 'A House' },
            ...(standing.visits > 0 ? [{ label: 'Been In', value: plural(standing.visits, 'Time') }] : []),
            ...(standing.commissions > 0 ? [{ label: 'Made For You', value: plural(standing.commissions, 'Piece') }] : []),
          ],
          choices,
          canSkip: true,
        };
      }

      case 'piece':
        return {
          title: 'What Are We Making',
          eyebrow: place.name,
          text: said || line(sim, 'design', 'piece', { vars: { name: jeweller.displayName } }, `${session.id}:piece`, false),
          choices: [
            ...PIECE_KINDS.map((p) => ({ id: `piece:${p.id}`, label: p.name, aliases: [p.id], detail: p.about })),
            { id: 'back', label: 'Not Today', aliases: ['back', 'cancel'] },
          ],
          canSkip: true,
        };

      case 'metal':
        return {
          title: 'In What',
          eyebrow: pieceOf(spec.piece).name,
          text: said || line(sim, 'design', 'metal', {}, `${session.id}:metal`, false),
          choices: [
            ...METALS.map((m) => ({
              id: `metal:${m.id}`,
              label: m.name,
              aliases: [m.id],
              detail: m.about,
            })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };

      case 'stone': {
        const piece = pieceOf(spec.piece);
        if (!piece.takesStone) {
          return {
            title: 'No Stone In This One',
            eyebrow: piece.name,
            text: `${piece.name} is metal alone. Nothing to set, nothing to lose.`,
            choices: [{ id: 'skip_stone', label: 'Go On', tone: 'primary', aliases: ['on', 'next'] }],
            canSkip: true,
          };
        }
        return {
          title: 'Set With What',
          eyebrow: `${metalOf(spec.metal).name} ${piece.name}`,
          text: said || line(sim, 'design', 'stone', {}, `${session.id}:stone`, false),
          choices: [
            ...STONES.map((st) => ({
              id: `stone:${st.id}`,
              label: st.name,
              aliases: [st.id],
              detail: st.mohs > 0 ? `${st.about} Mohs ${st.mohs}.` : st.about,
            })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };
      }

      case 'size': {
        const stone = stoneOf(spec.stone);
        return {
          title: 'How Big',
          eyebrow: stone.name,
          text: said || line(sim, 'design', 'size', { vars: { stone: stone.name } }, `${session.id}:size`, false),
          choices: [
            ...CARATS.map((c) => ({
              id: `carats:${c}`,
              label: `${c.toFixed(2)} Carat`,
              aliases: [String(c)],
              detail: c <= 0.5 ? 'Quiet. You notice it close up.'
                : c <= 1 ? 'The size most people mean when they say a diamond.'
                  : c <= 2 ? 'Unmistakable across a table.'
                    : 'Everybody in the room will see it, which is either the point or the problem.',
            })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };
      }

      case 'cut':
        return {
          title: 'Cut How',
          eyebrow: `${spec.carats.toFixed(2)} Carat ${stoneOf(spec.stone).name}`,
          text: said || line(sim, 'design', 'cut', {}, `${session.id}:cut`, false),
          choices: [
            ...CUTS.map((c) => ({ id: `cut:${c.id}`, label: c.name, aliases: [c.id], detail: c.about })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };

      case 'grade': {
        const graded = stoneOf(spec.stone).graded;
        if (!graded) {
          return {
            title: 'Not A Graded Stone',
            eyebrow: stoneOf(spec.stone).name,
            text: 'The colour and clarity scales are diamond scales. This one is judged by eye, and by whoever is holding it.',
            choices: [{ id: 'skip_grade', label: 'Go On', tone: 'primary', aliases: ['on', 'next'] }],
            canSkip: true,
          };
        }
        const stage = String(session.context['gradeStage'] ?? 'colour');
        if (stage === 'colour') {
          return {
            title: 'Colour',
            eyebrow: 'The GIA Scale, D To Z',
            text: said || line(sim, 'design', 'colour', {}, `${session.id}:colour`, false),
            choices: [
              ...COLOUR_GRADES.map((g) => ({
                id: `colour:${g.id}`, label: `${g.name} — ${g.band}`, aliases: [g.id], detail: g.about,
              })),
              { id: 'back', label: 'Back', aliases: ['back'] },
            ],
            canSkip: true,
          };
        }
        return {
          title: 'Clarity',
          eyebrow: 'The GIA Scale, Flawless To Included',
          text: said || line(sim, 'design', 'clarity', {}, `${session.id}:clarity`, false),
          choices: [
            ...CLARITIES.map((c) => ({ id: `clarity:${c.id}`, label: c.name, aliases: [c.id], detail: c.about })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };
      }

      case 'setting':
        return {
          title: 'Held How',
          eyebrow: describeSpec(spec),
          text: said || line(sim, 'design', 'setting', {}, `${session.id}:setting`, false),
          choices: [
            ...SETTINGS.map((st) => ({
              id: `setting:${st.id}`, label: st.name, aliases: [st.id],
              detail: `${st.about} Protection ${st.protection} of 100.`,
            })),
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          canSkip: true,
        };

      case 'engrave':
        return {
          title: 'Anything Inside',
          eyebrow: describeSpec(spec),
          text: said || 'Type what you want cut into it, or leave it plain. Sixty characters, and it is permanent.',
          choices: [
            { id: 'engrave:none', label: 'Leave It Plain', tone: 'primary', aliases: ['none', 'plain', 'no'] },
            { id: 'back', label: 'Back', aliases: ['back'] },
          ],
          // Anything typed here is the engraving itself, not a command.
          freeText: { label: 'Engraving', placeholder: 'What to cut inside it', prefix: 'engrave:' },
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
            { label: 'Metal', value: formatMoney(quote.metalCost) },
            ...(quote.stoneCost > 0 ? [{ label: 'Stone', value: formatMoney(quote.stoneCost) }] : []),
            { label: 'The Bench', value: formatMoney(quote.labour) },
            { label: 'All In', value: formatMoney(quote.total) },
            { label: 'Ready In', value: plural(quote.weeks, 'Week') },
          ],
          choices: [
            {
              id: 'approve',
              label: 'Have It Made',
              tone: 'primary',
              aliases: ['yes', 'order', 'go ahead'],
              detail: `${formatMoney(Math.round(quote.total * 0.4))} down, the rest on collection.`,
            },
            { id: 'change', label: 'Change Something', aliases: ['back', 'again', 'rethink'] },
            { id: 'think', label: 'Think About It', aliases: ['leave', 'no', 'later'] },
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
        ctx.commit('look', { kind: 'jewel.look', payload: { placeId: place.id } });
        session.context['line'] = '';
        ctx.go('piece');
        return;
      }
      if (choiceId === 'look') {
        const result = ctx.commit<{ visits: number; regular: boolean }>('look', {
          kind: 'jewel.look', payload: { placeId: place.id },
        });
        session.context['line'] = result.regular
          ? 'They bring out three things without being asked, because they remember what you looked at last time.'
          : 'Everything comes out one at a time, on a grey cloth, and goes back before the next one appears.';
        return;
      }
      if (choiceId === 'services') {
        session.context['line'] = 'Sizing, a new clasp, a claw retipped, a clean, or a valuation for your insurer. '
          + 'The counter can do all of it; the Shopping page is where you hand a piece over.';
        return;
      }
      if (choiceId.startsWith('collect:')) {
        const commissionId = choiceId.slice(8);
        const result = ctx.commit<{ paid: number; description: string }>(`collect:${commissionId}`, {
          kind: 'jewel.collect', payload: { commissionId },
        });
        session.context['line'] = `${result.description}. ${formatMoney(result.paid)} settled, and it is yours.`;
        ctx.go('done');
        return;
      }
      if (choiceId === 'leave') { ctx.say('You look, you thank them, and you leave with nothing.'); ctx.finish(); return; }
    }

    if (choiceId === 'back') {
      // Straight back one question, or out of the design altogether.
      const order = ['piece', 'metal', 'stone', 'size', 'cut', 'grade', 'setting', 'engrave', 'quote'];
      const at = order.indexOf(session.node);
      session.context['line'] = '';
      ctx.go(at <= 0 ? 'counter' : order[at - 1]!);
      return;
    }

    if (session.node === 'piece' && choiceId.startsWith('piece:')) {
      const piece = pieceOf(choiceId.slice(6));
      session.context['piece'] = piece.id;
      if (!piece.takesStone) { session.context['stone'] = 'none'; session.context['carats'] = 0; }
      session.context['line'] = '';
      ctx.go('metal');
      return;
    }

    if (session.node === 'metal' && choiceId.startsWith('metal:')) {
      session.context['metal'] = metalOf(choiceId.slice(6)).id;
      session.context['line'] = '';
      ctx.go('stone');
      return;
    }

    if (session.node === 'stone') {
      if (choiceId === 'skip_stone') { ctx.go('setting'); return; }
      if (choiceId.startsWith('stone:')) {
        const stone = stoneOf(choiceId.slice(6));
        session.context['stone'] = stone.id;
        session.context['line'] = '';
        if (stone.id === 'none') { session.context['carats'] = 0; ctx.go('setting'); return; }
        ctx.go('size');
        return;
      }
    }

    if (session.node === 'size' && choiceId.startsWith('carats:')) {
      session.context['carats'] = Number(choiceId.slice(7));
      session.context['line'] = '';
      ctx.go('cut');
      return;
    }

    if (session.node === 'cut' && choiceId.startsWith('cut:')) {
      session.context['cut'] = cutOf(choiceId.slice(4)).id;
      session.context['line'] = '';
      session.context['gradeStage'] = 'colour';
      ctx.go('grade');
      return;
    }

    if (session.node === 'grade') {
      if (choiceId === 'skip_grade') {
        session.context['colourGrade'] = '';
        session.context['clarity'] = '';
        ctx.go('setting');
        return;
      }
      if (choiceId.startsWith('colour:')) {
        session.context['colourGrade'] = colourGradeOf(choiceId.slice(7)).id;
        session.context['gradeStage'] = 'clarity';
        session.context['line'] = '';
        return;
      }
      if (choiceId.startsWith('clarity:')) {
        session.context['clarity'] = clarityOf(choiceId.slice(8)).id;
        session.context['line'] = '';
        ctx.go('setting');
        return;
      }
    }

    if (session.node === 'setting' && choiceId.startsWith('setting:')) {
      session.context['setting'] = settingOf(choiceId.slice(8)).id;
      session.context['line'] = '';
      ctx.go('engrave');
      return;
    }

    if (session.node === 'engrave') {
      if (choiceId === 'engrave:none') { session.context['engraving'] = ''; ctx.go('quote'); return; }
      // Anything else typed here is the engraving itself.
      const text = choiceId.startsWith('engrave:') ? choiceId.slice(8) : choiceId;
      session.context['engraving'] = text.trim().slice(0, 60);
      session.context['line'] = '';
      ctx.go('quote');
      return;
    }

    if (session.node === 'quote') {
      if (choiceId === 'change') { session.context['line'] = ''; ctx.go('piece'); return; }
      if (choiceId === 'think') {
        ctx.say('You take the number away with you. It will still be the number tomorrow.');
        ctx.finish();
        return;
      }
      if (choiceId === 'approve') {
        const made = ctx.commit<{ commissionId: string; description: string }>('commission', {
          kind: 'jewel.commission', payload: { placeId: place.id, ...spec() },
        });
        const ordered = ctx.commit<{ deposit: number; balance: number; readyAt: number; weeks: number }>('approve', {
          kind: 'jewel.approve', payload: { commissionId: made.commissionId },
        });
        const weeks = Math.max(1, Math.round((ordered.readyAt - sim.now) / (7 * MS_DAY)));
        session.context['line'] = `${made.description}. ${formatMoney(ordered.deposit)} down, `
          + `${formatMoney(ordered.balance)} on collection, and ${plural(weeks, 'week')} to wait.`;
        ctx.go('done');
        return;
      }
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
   * Skipping a design conversation should not silently order something and
   * charge you for it, so this walks out with nothing rather than guessing at
   * a piece worth thousands. Collecting something already finished and paid
   * for is different, and that it does.
   */
  summarise(sim, session, ctx) {
    const place = placeOf(sim, session);
    const ready = openCommissions(sim, sim.player.id).filter((c) => c.status === 'ready' && c.placeId === place.id);
    for (const c of ready) {
      ctx.commit(`collect:${c.id}`, { kind: 'jewel.collect', payload: { commissionId: c.id } });
    }
    ctx.say(ready.length > 0
      ? `Collected ${plural(ready.length, 'piece')} from ${place.name}.`
      : 'Had a look and left it. Nothing worth thousands gets ordered by skipping the conversation.');
    ctx.finish();
    void DESIGN_MINUTES;
  },
});
