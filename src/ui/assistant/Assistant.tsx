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
import { ASSISTANT_COMMANDS, assistantState, checkProposal, type CheckedProposal, type Proposal } from '@/engine/systems/assistant';
import { Modal } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';

interface Answer { ok: boolean; answer?: string; proposals?: Proposal[]; error?: string }

/** Asks the server function, where Base44 is there to ask; otherwise says it isn't. */
export async function askAssistant(request: string, state: unknown): Promise<Answer> {
  const client = (globalThis as unknown as { base44?: { functions?: { invoke(name: string, payload: Record<string, unknown>): Promise<{ data?: Answer }> } } }).base44;
  if (typeof client?.functions?.invoke !== 'function') return { ok: false, error: 'The assistant runs where the game is hosted with its server; it isn’t here.' };
  try {
    const res = await client.functions.invoke('askAssistant', { request, state });
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
  const { sim, run, toast } = useGame();
  const [request, setRequest] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [proposals, setProposals] = useState<CheckedProposal[]>([]);
  const cur = saveCurrency(sim.universe);

  const ask = async () => {
    setBusy(true);
    setError(undefined);
    const got = await askAssistant(request, assistantState(sim));
    setBusy(false);
    if (!got.ok) { setError(got.error); setAnswer(undefined); setProposals([]); return; }
    setAnswer(got.answer);
    setProposals((got.proposals ?? []).map((p) => checkProposal(sim, p)));
  };

  const take = (p: CheckedProposal, i: number) => {
    const done = run(p.kind, p.payload);
    if (done.ok) {
      toast('Done.', 'positive');
      // What's left is tried again against the world as it is now.
      setProposals((list) => list.filter((_, j) => j !== i).map((q) => checkProposal(sim, q)));
    }
  };

  return (
    <Modal title="Ask" onClose={onClose} wide>
      <div className="col gap-3">
        <p className="small muted" style={{ margin: 0 }}>Ask in plain words: plan a day, find an outfit within a budget, explain a requirement. It proposes; you decide, and each proposal is checked by the game first.</p>
        <label className="sr-only" htmlFor="assistant-request">Your Question</label>
        <textarea id="assistant-request" rows={3} value={request} onChange={(e) => setRequest(e.target.value)} placeholder="What should I do before tomorrow’s call?" />
        <div><button type="button" className="btn btn-sm btn-primary" disabled={busy || !request.trim()} onClick={() => { void ask(); }}>{busy ? 'Asking' : 'Ask It'}</button></div>
        {error && <div className="callout callout-warning small">{error}</div>}
        {answer && <p className="small" style={{ margin: 0 }}>{answer}</p>}
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
