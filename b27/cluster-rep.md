# Your cluster: representation

The owner's brief 27 is at `docs/verification/briefs-2026-10-16/27-foundation-limits-and-connected-professional-career-universe.txt`
(Part 6 in full, Part 7's "Voice samples", and the supplement's loops 6 to 9). The build's account: README section "K3:
Representation And Materials". The code: `src/engine/content/agents.ts` (`AgentField`, `AgentRoute`, `AgentMaterial`, the
agents, real and invented), `src/engine/systems/proagent.ts` (approaches, requests for materials, `interestOf`, agreements),
`src/engine/content/careerwork.ts` (`AGREEMENT`, `AGREEMENT_TERMS`, around lines 832 to 850), `src/engine/systems/propay.ts`
(`coveredWork`, commission), the agent's submissions in `src/engine/systems/projobs.ts`, `src/ui/career/RepresentationPane.tsx`.
The real agents' facts are in the research register; the game's invented agents are labeled simulated. Never put words or
offers in a real agent's mouth beyond what the game already does with them (the owner forbids implying a real person
offered employment).

Build:
1. **Negotiating an agency agreement's terms** (Part 6: "Support relevant: … - Scope, territory, medium, exclusivity, term,
   and commission. … - Negotiation."; loop 8: "→ review scope, term, commission, exclusivity, and obligations → negotiate
   where supported"). The build said the terms "aren't negotiated, since they're the unions' regulations as read (a
   commission over ten percent is barred)", but only the commission cap is regulation; the term (`AGREEMENT.termDays`,
   marked ASSUMPTION) and the scope, territory and exclusions are the game's (`basis: 'simulation'`). When an agreement
   is offered, let the player ask once for a shorter term (within any maximum the register's agency regulations give;
   check the SAG-AFTRA and ATA sources it names) or a different scope (adding voice-over, or a territory). The agent agrees
   or not (labeled chance reading how keen the agent is, `interestOf`). The terms are kept, versioned, on the agreement,
   and read by when it ends, by `coveredWork` and commission, and by which parts the agent submits the actor for. The
   commission cap stays.
2. **A voice department** (Part 6 "medium"; Part 7 "Voice samples"; loop 7: "A role or representative requires
   materials"). No agent covers voice work today, so an office never asks for a voice demo. Give the game's own invented
   agency a voice department or agent (simulated, labeled; a real agent only where a public page verifies it), with
   `AgentField 'voice'` and `AgentMaterial 'demo'`: requestable, read by `interestOf` as a reel's band is, and, where the
   agreement's scope includes voice-over, covered work with commission and agent submissions for voice parts (dubbing,
   animation, narration). Voice demos already exist (`demoSources`, `pro.mix_demo`).
3. **An introduction at a festival**, as a route an agent can be reached by (`AgentRoute`): build the route and an
   exported function another cluster will call when the player attends a festival screening and does its press (that
   cluster builds attendance; you build the introduction it leads to, read by the approach loop exactly as a showcase or
   referral introduction is). Test it directly, as that cluster's call will.
Every new command needs refusal words, a control on the Representation tab and a guide chapter that opens it.
