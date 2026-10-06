/**
 * SLATE — the built-in assistant, in the top bar (Stage 14; the engine's side
 * in `systems/assistant.ts`, the server's in `base44/functions/askAssistant`).
 *
 * Ask it something in plain words. It answers, and proposes things to do, each
 * of which the game has already tried and put back: what it would cost, or
 * why the world would refuse it. Take one and it runs as the same button
 * would, with the same refusals. It is off until the owner connects a Claude
 * Console key, and the game says so; nothing else changes without it.
 */

import { useState } from 'react';
import { useGame } from '@/app/game-context';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { ASSISTANT_COMMANDS, assistantState, checkSequence, takeSequence, type AssistantRole, type CheckedProposal, type MechanicProposal, type Proposal } from '@/engine/systems/assistant';
import { Modal } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';

interface Answer { ok: boolean; answer?: string; proposals?: Proposal[]; mechanics?: MechanicProposal[]; error?: string }

/** Asks the server function, where Base44 is there to ask; otherwise says it isn't. */
export async function askAssistant(request: string, state: unknown, role: AssistantRole = 'play'): Promise<Answer> {
  const client = (globalThis as unknown as { base44?: { functions?: { invoke(name: string, payload: Record<string, unknown>): Promise<{ data?: Answer }> } } }).base44;
  if (typeof client?.functions?.invoke !== 'function') return { ok: false, error: 'The assistant runs where the game is hosted with its server; it isn’t here.' };
  try {
    const res = await client.functions.invoke('askAssistant', { request, state, role });
    return res.data ?? { ok: false, error: 'The assistant didn’t answer.' };
  } catch {
    return { ok: false, error: 'The assistant didn’t answer; try again in a moment.' };
  }
}

export function AssistantButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Gated feature="ui.assistant" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Ask</Gated>
      {open && <AssistantDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function AssistantDialog({ onClose }: { onClose: () => void }) {
  const { sim, run, runAll, toast } = useGame();
  const [request, setRequest] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [proposals, setProposals] = useState<CheckedProposal[]>([]);
  const [mechanics, setMechanics] = useState<MechanicProposal[]>([]);
  const [role, setRole] = useState<AssistantRole>('play');
  const cur = saveCurrency(sim.universe);

  const ask = async () => {
    setBusy(true);
    setError(undefined);
    const got = await askAssistant(request, assistantState(sim, role), role);
    setBusy(false);
    if (!got.ok) { setError(got.error); setAnswer(undefined); setProposals([]); setMechanics([]); return; }
    setAnswer(got.answer);
    setMechanics(got.mechanics ?? []);
    // Tried in order, each against the world the ones before it leave (`checkSequence`).
    setProposals(checkSequence(sim, got.proposals ?? [], role));
  };

  const take = (p: CheckedProposal, i: number) => {
    const done = run(p.kind, p.payload);
    if (done.ok) {
      toast('Done.', 'positive');
      // What's left is tried again against the world as it is now.
      setProposals((list) => checkSequence(sim, list.filter((_, j) => j !== i), role));
    }
  };

  // All of them in order, all or none.
  const takeAll = () => {
    if (runAll((s) => takeSequence(s, proposals, role))) { toast('Done, all of them.', 'positive'); setProposals([]); }
  };

  return (
    <Modal title="Ask" onClose={onClose} wide>
      <div className="col gap-3">
        <p className="small muted" style={{ margin: 0 }}>Ask in plain words: plan a day, find an outfit within a budget, explain a requirement. It proposes; you decide, and each proposal is checked by the game first.</p>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="assistant-role">Ask It To</label>
          <select id="assistant-role" value={role} onChange={(e) => setRole(e.target.value as AssistantRole)}>
            <option value="develop">Propose A New Mechanic For Review</option>
            <option value="customize">Help Customize What You Own</option>
            <option value="play">Help You Play</option>
          </select>
        </div>
        <label className="sr-only" htmlFor="assistant-request">Your Question</label>
        <textarea id="assistant-request" rows={3} value={request} onChange={(e) => setRequest(e.target.value)} placeholder="What should I do before tomorrow’s call?" />
        <div><button type="button" className="btn btn-sm btn-primary" disabled={busy || !request.trim()} onClick={() => { void ask(); }}>{busy ? 'Asking' : 'Ask It'}</button></div>
        {error && <div className="callout callout-warning small">{error}</div>}
        {answer && <p className="small" style={{ margin: 0 }}>{answer}</p>}
        {mechanics.map((m, i) => (
          <div key={`m-${i}`} className="card card-tight col gap-1">
            <div className="strong small">{m.title}</div>
            <div className="small">{m.what}</div>
            {m.why && <div className="small muted">{m.why}</div>}
            <div className="xs dim">Kept for the owner’s review; nothing in your game changes.{m.sources.length ? ` Sources: ${m.sources.join('; ')}.` : ''}</div>
          </div>
        ))}
        {proposals.length > 1 && <div className="row gap-2" style={{ alignItems: 'center' }}><button type="button" className="btn btn-sm" disabled={!proposals.every((p) => p.ok)} onClick={takeAll}>Do All In Order</button><span className="xs dim">Each is checked after the ones above it; all are done, or none.</span></div>}
        {proposals.map((p, i) => (
          <div key={`${p.kind}-${i}`} className="card card-tight col gap-1">
            <div className="strong small">{ASSISTANT_COMMANDS[p.kind]?.does ?? p.kind}</div>
            <div className="small muted">{p.why}</div>
            <div className="xs dim">{p.ok ? `${p.costs ? `Costs ${formatMoney(p.costs, cur)}` : 'Costs nothing'}${p.notices.length ? ` · ${p.notices.join(' · ')}` : ''}` : `The game would refuse it: ${p.refusal}`}</div>
            <div><button type="button" className="btn btn-sm" disabled={!p.ok} onClick={() => take(p, i)}>Do It</button></div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
