/**
 * Getting dressed.
 *
 * You stand at the wardrobe with somewhere to be. Slot by slot, from what you
 * actually own in the condition it is actually in. The mirror has an opinion
 * before you leave rather than after, and it is specific: it names the shoes,
 * it names the colour, it names the thing that needs washing. It never stops
 * you. Leaving in it is the commit — that is when the clock moves, the clothes
 * wear, and the day goes on the record so the world can notice a repeat.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { plural } from '../core/text';
import { formatDuration, MS_MINUTE } from '../core/time';
import type { OwnedAsset, SceneSession } from '../domain/model';
import { SLOT_LABEL, codeFor, colourOf, materialOf, type Slot } from '../content/wardrobe';
import { preview, speak } from '../dialogue/library';
import {
  DRESSING_MINUTES, LOOKS_TIRED, NEEDS_WASHING, appraise, available, inSlot, verdictLabel, wardrobeView, wearing,
} from '../systems/wardrobe';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

/** The occasions the scene offers when nothing told it where you are going. */
const OCCASIONS: readonly { id: string; label: string }[] = [
  { id: 'casual', label: 'Nowhere In Particular' },
  { id: 'date', label: 'A Date' },
  { id: 'dinner', label: 'Dinner Out' },
  { id: 'meeting', label: 'A Meeting' },
  { id: 'office', label: 'Work' },
  { id: 'gym', label: 'The Gym' },
  { id: 'party', label: 'A Party' },
  { id: 'wedding', label: 'A Wedding' },
  { id: 'funeral', label: 'A Funeral' },
  { id: 'premiere', label: 'A Premiere' },
];

function occasionOf(session: SceneSession): string {
  return String(session.context['occasion'] ?? 'casual');
}

function say(
  sim: Simulation, purpose: string, beat: string,
  ctx: { flags?: string[]; result?: string; vars?: Record<string, string> },
  salt: string, record: boolean,
): string {
  const query = { section: 'wardrobe', purpose, beat };
  return (record ? speak(sim, query, ctx, salt) : preview(sim, query, ctx, salt)).text;
}

/** How a garment reads on one line: colour, cloth, and what is wrong with it. */
/** What the mirror says before you have looked at it properly. */
function mirrorLine(verdict: string, mentions: number): string {
  if (mentions === 0) return `${verdict}. Nothing the mirror would argue with.`;
  return `${verdict}. ${plural(mentions, 'Thing').toLowerCase()} the mirror would mention.`;
}

function describe(asset: OwnedAsset): string {
  const w = asset.wardrobe!;
  const bits = [colourOf(w.colour).name, materialOf(w.material).name];
  if ((w.cleanliness ?? 100) < NEEDS_WASHING) bits.push('Needs Washing');
  if (asset.condition < LOOKS_TIRED) bits.push('Worn Out');
  if (w.timesWorn && w.timesWorn > 0) bits.push(`Worn ${plural(w.timesWorn, 'Time')}`);
  return bits.join(' · ');
}

export const DRESS_SCENE = defineScene({
  id: 'life.dress',
  version: 1,
  title: 'Getting Dressed',
  placeBound: false,

  available(sim) {
    const owned = wardrobeView(sim, sim.player.id);
    if (owned.length === 0) return { ok: false, reason: 'You own nothing to put on. Buy some clothes first.' };
    return { ok: true };
  },

  start(sim, input) {
    const occasion = input['occasion'] === undefined ? '' : String(input['occasion']);
    void sim;
    return {
      node: occasion === '' ? 'where' : 'wardrobe',
      context: { occasion: occasion || 'casual', slot: '', line: '' },
    };
  },

  view(sim, session) {
    const me = sim.player;
    switch (session.node) {
      case 'where': {
        return {
          title: 'Where Are You Going',
          eyebrow: 'The Wardrobe',
          text: 'What the room expects is most of the answer, so it is worth saying first.',
          choices: OCCASIONS.map((o) => ({
            id: `for:${o.id}`,
            label: o.label,
            aliases: [o.label, o.id],
            detail: codeFor(o.id).name,
          })),
          canSkip: true,
        };
      }
      case 'wardrobe': {
        const occasion = occasionOf(session);
        const code = codeFor(occasion);
        const worn = wearing(sim, me.id);
        const appraisal = appraise(sim, worn, { occasion, personId: me.id });
        const rows = wardrobeView(sim, me.id);
        const choices: SceneChoice[] = rows.map((row) => ({
          id: `slot:${row.slot}`,
          label: row.label,
          aliases: [row.label, row.slot],
          detail: row.on ? `${row.on.name} · ${describe(row.on)}` : `${row.options.length} To Choose From`,
        }));
        if (worn.length > 0) {
          choices.push({ id: 'mirror', label: 'Look In The Mirror', aliases: ['mirror', 'look', 'check'] });
          choices.push({ id: 'save', label: 'Save This As A Look', aliases: ['save', 'name it'] });
          choices.push({ id: 'leave', label: 'Leave In It', aliases: ['leave', 'go', 'done', 'wear it'], tone: 'primary', detail: formatDuration(DRESSING_MINUTES * MS_MINUTE) });
        }
        return {
          title: 'The Wardrobe',
          eyebrow: `${code.name} · ${code.note}`,
          text: String(session.context['line'] ?? '')
            || (worn.length === 0
              ? 'Nothing on yet. Start anywhere; most people start at the bottom and regret it.'
              : mirrorLine(verdictLabel(appraisal.verdict), appraisal.notes.filter((n) => n.weight < 0).length)),
          facts: [
            { label: 'The Room Wants', value: `${code.name}, ${code.floor} To ${code.ceiling}` },
            { label: 'You Are At', value: String(appraisal.formality) },
            { label: 'On You', value: worn.length === 0 ? 'Nothing' : plural(worn.length, 'Thing') },
            ...(appraisal.missing.length > 0
              ? [{ label: 'Still Missing', value: appraisal.missing.map((s) => SLOT_LABEL[s]).join(', ') }]
              : []),
          ],
          choices,
          canSkip: true,
        };
      }
      case 'slot': {
        const slot = String(session.context['slot'] ?? '') as Slot;
        const options = inSlot(sim, me.id, slot);
        const worn = wearing(sim, me.id);
        const on = worn.find((a) => a.wardrobe!.slot === slot);
        const choices: SceneChoice[] = options.map((asset) => ({
          id: `put:${asset.id}`,
          label: asset.name,
          aliases: [asset.name],
          detail: available(sim, asset)
            ? `${describe(asset)}${on?.id === asset.id ? ' · On You' : ''}`
            : `${asset.wardrobe!.awayReason ?? 'Not Here'}`,
        }));
        if (on) choices.push({ id: 'off', label: `Take Off The ${on.name}`, aliases: ['off', 'take off', 'remove'] });
        choices.push({ id: 'back', label: 'Back To The Wardrobe', aliases: ['back', 'wardrobe'] });
        return {
          title: SLOT_LABEL[slot],
          eyebrow: 'The Wardrobe',
          text: options.length === 0
            ? 'Nothing here. That is a shopping problem rather than a dressing one.'
            : `${options.length} of them, best first.`,
          choices,
          canSkip: true,
        };
      }
      case 'mirror': {
        const occasion = occasionOf(session);
        const worn = wearing(sim, me.id);
        const appraisal = appraise(sim, worn, { occasion, personId: me.id });
        return {
          title: 'The Mirror',
          eyebrow: verdictLabel(appraisal.verdict),
          text: appraisal.notes.length === 0
            ? 'Nothing to say. Which from a mirror is a compliment.'
            : appraisal.notes.map((n) => `${n.weight < 0 ? '—' : '+'} ${n.text}`).join('\n'),
          facts: [
            { label: 'The Verdict', value: `${appraisal.verdict} Of 100` },
            { label: 'Formality', value: String(appraisal.formality) },
            { label: 'Warmth', value: String(appraisal.warmth) },
          ],
          choices: [
            { id: 'back', label: 'Change Something', aliases: ['back', 'change', 'wardrobe'] },
            { id: 'leave', label: 'Leave In It', aliases: ['leave', 'go', 'anyway'], tone: 'primary' },
          ],
          canSkip: true,
        };
      }
      case 'done': {
        return {
          title: 'Dressed',
          eyebrow: String(session.context['label'] ?? ''),
          text: String(session.context['note'] ?? ''),
          choices: [{ id: 'finish', label: 'Out The Door', aliases: ['done', 'go', 'ok'], tone: 'primary' }],
          canSkip: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    const me = sim.player;

    if (session.node === 'where' && choiceId.startsWith('for:')) {
      session.context['occasion'] = choiceId.slice(4);
      const code = codeFor(occasionOf(session));
      ctx.say(say(sim, 'code', 'wardrobe', { vars: { code: code.name, note: code.note } }, `${session.id}:code`, true));
      ctx.go('wardrobe');
      return;
    }

    if (session.node === 'wardrobe') {
      if (choiceId.startsWith('slot:')) {
        session.context['slot'] = choiceId.slice(5);
        session.context['line'] = '';
        ctx.go('slot');
        return;
      }
      if (choiceId === 'mirror') { ctx.go('mirror'); return; }
      if (choiceId === 'save') {
        const worn = wearing(sim, me.id);
        const name = `${codeFor(occasionOf(session)).name} Look`;
        ctx.commit('save', { kind: 'wear.save_look', payload: { name } });
        session.context['line'] = `Saved as ${name}. ${plural(worn.length, 'thing')}, and you can put the lot back on in one go.`;
        return;
      }
      if (choiceId === 'leave') { leaveInIt(sim, session, ctx); return; }
    }

    if (session.node === 'slot') {
      if (choiceId === 'back') { session.context['line'] = ''; ctx.go('wardrobe'); return; }
      if (choiceId === 'off') {
        const slot = String(session.context['slot'] ?? '');
        const on = wearing(sim, me.id).find((a) => a.wardrobe!.slot === slot);
        if (on) ctx.commit(`off:${on.id}`, { kind: 'wear.take_off', payload: { assetId: on.id } });
        return;
      }
      if (choiceId.startsWith('put:')) {
        const assetId = choiceId.slice(4);
        const result = ctx.commit<{ name: string; displaced?: string }>(`put:${assetId}`, {
          kind: 'wear.put_on', payload: { assetId },
        });
        session.context['line'] = result.displaced
          ? `${result.name} on, ${result.displaced} back on the hanger.`
          : `${result.name} on.`;
        ctx.go('wardrobe');
        return;
      }
    }

    if (session.node === 'mirror') {
      if (choiceId === 'back') { ctx.go('wardrobe'); return; }
      if (choiceId === 'leave') { leaveInIt(sim, session, ctx); return; }
    }

    if (session.node === 'done' && choiceId === 'finish') { ctx.finish(); return; }
    throw new CommandError('That is not a choice here.');
  },

  summarise(sim, session, ctx) {
    // The short version puts on the best of each essential slot and goes.
    if (session.node === 'where') session.node = 'wardrobe';
    const me = sim.player;
    if (wearing(sim, me.id).length === 0) {
      for (const slot of ['top', 'bottom', 'shoes'] as Slot[]) {
        const best = inSlot(sim, me.id, slot).find((a) => available(sim, a));
        if (best) ctx.commit(`put:${best.id}`, { kind: 'wear.put_on', payload: { assetId: best.id } });
      }
    }
    if (wearing(sim, me.id).length === 0) throw new CommandError('There is nothing in the wardrobe to put on.');
    leaveInIt(sim, session, ctx);
    ctx.say(String(session.context['note'] ?? 'Dressed.'));
  },
});

/** The commit. Everything before this was standing in front of a mirror. */
function leaveInIt(sim: Simulation, session: SceneSession, ctx: { commit: <R>(k: string, c: { kind: string; payload: Record<string, unknown> }) => R; say: (t: string) => void; go: (n: string) => void }): void {
  const occasion = occasionOf(session);
  const result = ctx.commit<{ verdict: number; label: string; notes: { text: string; weight: number }[] }>('leave', {
    kind: 'wear.leave_in_it', payload: { occasion },
  });
  const worst = result.notes.filter((n) => n.weight < 0).sort((a, b) => a.weight - b.weight)[0];
  const best = result.notes.filter((n) => n.weight > 0).sort((a, b) => b.weight - a.weight)[0];
  const line = say(sim, 'verdict', 'mirror', {
    result: result.verdict >= 74 ? 'good' : result.verdict >= 50 ? 'fine' : 'poor',
    vars: { label: result.label },
  }, `${session.id}:verdict`, true);
  ctx.say(line);
  session.context['label'] = result.label;
  session.context['note'] = [line, best?.text, worst?.text].filter(Boolean).join(' ');
  ctx.go('done');
}
