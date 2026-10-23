# Brief 25’s Coverage Register

Written by `node tools/career-register.mjs --write` from `register.json`, never by hand; `--check` holds it to the code.

290 rows: 190 requirements, process rows and constraints from the brief’s Parts 1 to 18, and 100 scenarios from the dossier (T01 to T100). 12 of the 190 and 0 of the 100 are Implemented And Verified.

| Status | Rows |
|---|---|
| Implemented And Verified | 12 |
| Implemented, Verification Incomplete | 7 |
| Partially Implemented | 7 |
| Not Implemented | 264 |
| Blocked Externally | 0 |
| Decision Required | 0 |
| Explicitly Deferred | 0 |

| Track | Yes | Partial | No | n/a |
|---|---|---|---|---|
| Source Located | 28 | 0 | 0 | 262 |
| Source Verified | 0 | 0 | 28 | 262 |
| Rule Extracted | 0 | 0 | 28 | 262 |
| Implemented | 16 | 10 | 264 | 0 |
| Tested | 6 | 13 | 264 | 7 |
| Externally Blocked | 0 | 0 | 290 | 0 |

## Start (10)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| BASE-01 | Implemented And Verified | Inspect the repository instructions, branch, exact HEAD, remote main, handoff, uncommitted changes and worktrees before work, and fetch without overwriting local work. | — | `docs/verification/career-world-2026-10-23/CHECKPOINT.md` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: n/a, EB: no | — |
| BASE-02 | Implemented And Verified | Audit the existing creation suite, profile, school and graduation, career foundation, attributes and genres, money, papers, calendar and Advance, inbox, geography, weather, holidays, self-care, tutorials, saves and UI before extending them. | — | `docs/verification/career-world-2026-10-23/audit.md` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: n/a, EB: no | — |
| BASE-03 | Implemented, Verification Incomplete | Extend existing systems: no duplicate clocks, banks, player records or parallel career engines. | `src/engine/systems/pro.ts` | — | SL: n/a, SV: n/a, RE: n/a, I: yes, T: partial, EB: no | — |
| BASE-04 | Implemented And Verified | Preserve the established early-graduation behavior: the Bulletin allows no Acting degree below two years and gives no way to ask, so none is offered. | `src/engine/systems/proshowcase.ts` | `tests/pro-showcase.test.ts#no early degree` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: yes, EB: no | — |
| BASE-05 | Implemented And Verified | Keep school attendance, graduation and permission to work separate constraints. | `src/engine/systems/projobs.ts`, `src/engine/systems/propay.ts` | `tests/propay.test.ts#signing with an agent changes nothing`, `tests/pro-work.test.ts#a request the dean refuses` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: yes, EB: no | — |
| BASE-06 | Implemented And Verified | Do not block all professional interactions until graduation: a student can be represented and can submit to open work. | `src/engine/systems/proagent.ts`, `src/engine/systems/projobs.ts` | `tests/pro-agent.test.ts#comes through the School` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: yes, EB: no | — |
| BASE-07 | Implemented And Verified | Do not assume every student can legally accept every paid engagement: an F-1 student is refused outside acting work in words. | `src/engine/systems/projobs.ts` | `tests/pro-work.test.ts#an F-1 student in term is refused at acceptance` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: yes, EB: no | — |
| BASE-08 | Implemented And Verified | Do not restore removed housing, vehicle ownership, general shopping, unrelated occupations or parental leave. | — | `docs/verification/career-world-2026-10-23/audit.md` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: n/a, EB: no | — |
| BASE-09 | Not Implemented | Career travel and temporary accommodation where work requires them. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| BASE-10 | Implemented, Verification Incomplete | Preserve desktop and landscape-phone navigation, Title Case and alignment, and reintroduce no redundant navigation. | `src/ui/shell/destinations.ts` | — | SL: n/a, SV: n/a, RE: n/a, I: yes, T: partial, EB: no | — |

## Register (3)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| REG-01 | Implemented And Verified | A durable coverage register, one row per feature, rule and data family, with every field the brief lists. | `tools/career-register.mjs` | `docs/verification/career-world-2026-10-23/register.json` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: n/a, EB: no | — |
| REG-02 | Implemented And Verified | Track separately: source located, source verified, rule extracted, implemented, tested, externally blocked. | `tools/career-register.mjs` | `docs/verification/career-world-2026-10-23/register.json` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: n/a, EB: no | — |
| REG-03 | Implemented And Verified | No completion bought by deleting failed requirements, weakening criteria or relabeling unfinished work: a row once recorded can’t be removed. | `tools/career-register.mjs` | `docs/verification/career-world-2026-10-23/register-ids.txt` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: n/a, EB: no | — |

## Provenance (10)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| PROV-01 | Not Implemented | Keep four kinds of information distinct: verified reference fact, game-design assumption, event simulated in this save, unknown. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| PROV-02 | Not Implemented | Field-level provenance for every real fact: source URL, publication date, retrieval date, effective date or edition, territory, verification status. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| PROV-03 | Not Implemented | Recheck facts that may have changed since 23 October 2026 before they are activated, and record what each retrieval covered. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| PROV-04 | Not Implemented | A real show is not evidence that it is casting. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| PROV-05 | Not Implemented | A fictional offer from a real director is a game event, said as one, never a public announcement. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| PROV-06 | Not Implemented | Invent no confidential salaries, private contracts, ballots, retention, casting briefs or representation relationships. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| PROV-07 | Not Implemented | Keep the factual baseline apart from save history: a data update never erases accepted contracts, completed work, money, credits or awards. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| PROV-08 | Not Implemented | Never insert the player into completed filming as a current vacancy. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| PROV-09 | Not Implemented | Preserve attached real cast unless an alternate-history mode, clearly identified, allows replacement. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| PROV-10 | Not Implemented | Missing creative details are labeled simulation assumptions; unsupported material rules are recorded as gaps, never guessed as fact. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Representation (13)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| REP-01 | Not Implemented | Agency records and individual-person records kept separately. (S89, S90, S91, S98, S101, S103) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| REP-02 | Not Implemented | Each agent: real name, agency, role, department, office or territory, sourced specialties, submission route, verified relationships, last verification date. (S98, S100) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| REP-03 | Not Implemented | Start from CAA, WME, UTA, Stewart Talent, Curtis Brown UK and United Agents. (S89, S90, S91, S101, S103, S98) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| REP-04 | Not Implemented | Claim no objective top-ten ranking of agencies without a defined, sourced metric. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| REP-05 | Not Implemented | Develop agents individually with useful interactions, never an agency logo as a representation engine. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| REP-06 | Partially Implemented | The representation journey: discover, inspect, prepare truthful materials, submit or be referred, wait, meet, review an offer, negotiate, accept or decline, maintain, renew or terminate. Brief 19 built it for one fictional agent, without negotiation or renewal. | `src/engine/systems/proagent.ts` | `tests/journey-agent.test.ts`, `tests/pro-agent.test.ts#comes through the School` | SL: n/a, SV: n/a, RE: n/a, I: partial, T: partial, EB: no | — |
| REP-07 | Not Implemented | Differentiate school showcase interest, professional referrals, direct inquiries, unsolicited submissions and existing relationships. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| REP-08 | Partially Implemented | Track headshots, CV and credits, showreels, skills, application status, follow-up timing, territory, exclusivity, commission applicability and relationship history. | `src/engine/systems/pro.ts` | `tests/pro-core.test.ts` | SL: n/a, SV: n/a, RE: n/a, I: partial, T: partial, EB: no | — |
| REP-09 | Not Implemented | Never apply a print department’s submission rules to theatrical representation. (S102) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| REP-10 | Not Implemented | Fabricate no private preferences or roster capacity for a real agent. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| REP-11 | Not Implemented | Representation is never an arbitrary purchase; duplicate commissions and incompatible agreements are prevented. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| REP-12 | Not Implemented | Every agency message and application stays simulated inside the game; nothing contacts real people or submits externally. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| REP-13 | Not Implemented | United Agents’ published actor route: CV, headshot and showreel to one agent; no reply in four to six weeks is unsuccessful; no telephone inquiries. (S99) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |

## Catalog (14)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| CAT-01 | Not Implemented | Separate production company, studio, distributor, broadcaster, streaming platform, project, season, episode, role, character, performer, director, showrunner, casting director and representative. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAT-02 | Not Implemented | Never confuse ownership, production and distribution. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAT-03 | Not Implemented | A transparent major-company coverage inventory: each company’s official slate read within a recorded date range, with pages inspected, titles discovered, imported, duplicates removed, unresolved records and unverified fields. (S82, S83, S84) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| CAT-04 | Not Implemented | Claim no “all current productions” from a handful of examples. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAT-05 | Not Implemented | Reference record: 9-1-1. (S80, S81, S88) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| CAT-06 | Not Implemented | Reference record: Slow Horses. (S78, S79) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| CAT-07 | Not Implemented | Reference record: Severance. (S85) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| CAT-08 | Not Implemented | Reference record: Abbott Elementary. (S86, S109) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| CAT-09 | Not Implemented | Reference records for officially announced film slates. (S82, S110) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| CAT-10 | Not Implemented | Each production: stable ID, title, format, genres, languages, companies and their roles, status, season and episode structure, runtimes, classification by territory, cast and characters, scoped directors, filming locations, schedule, release windows, provenance. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAT-11 | Not Implemented | Never infer filming location from story setting. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAT-12 | Not Implemented | A series cast page doesn’t prove an appearance in every season or episode. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAT-13 | Not Implemented | An announced film doesn’t prove a role is available. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAT-14 | Not Implemented | Generate explicitly simulated roles, opportunities and situations from the real baseline, never presented as actual casting notices. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Casting (11)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| CAST-01 | Partially Implemented | Separate opportunity access, role suitability, audition execution and the booking decision. Brief 19 kept fit, the round’s band and the field apart; access isn’t yet its own assessment. | `src/engine/systems/projobs.ts` | `tests/pro-work.test.ts` | SL: n/a, SV: n/a, RE: n/a, I: partial, T: partial, EB: no | — |
| CAST-02 | Not Implemented | Check project casting state, role need, availability, essential capabilities, work eligibility, attributes, genre proficiency, preparation, evidence, language or dialect, character requirements and history. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAST-03 | Implemented And Verified | Beginners have viable routes to first credits; entry-level roles don’t require professional credits. | `src/engine/systems/projobs.ts`, `src/engine/content/careerwork.ts` | `tests/pro-work.test.ts#from a posted student film to a booked, worked and credited part` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: yes, EB: no | — |
| CAST-04 | Not Implemented | Direct offers from prominent directors are earned routes, never the default for a beginner. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAST-05 | Not Implemented | Use representative submission, self-tape, audition, callback, chemistry read, screen test, creative approval, offer and negotiation only where they apply. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAST-06 | Not Implemented | For mixed genres, derive scene-specific demands; never average every genre tag equally. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAST-07 | Not Implemented | Maxed relevant skills give consistently strong controllable execution under comparable conditions, never a guaranteed role, profit or award. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAST-08 | Not Implemented | Never count one attribute bonus again across audition, filming and reception. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAST-09 | Not Implemented | Explain outcomes naturally: scheduling conflict, missing materials, strong fit, callback requested, paperwork unresolved, another candidate selected. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAST-10 | Not Implemented | A suitability score is not a booking probability unless calibrated as one. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CAST-11 | Implemented, Verification Incomplete | Persist decisions and competition: opening a screen or reloading never rerolls an outcome. | `src/engine/systems/projobs.ts`, `src/engine/decided.ts` | `tests/b20-career-saveload.test.ts` | SL: n/a, SV: n/a, RE: n/a, I: partial, T: partial, EB: no | — |

## Contracts (11)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| CON-01 | Not Implemented | The engagement lifecycle: inquiry, audition, callback or test, offer, negotiation, agreement, onboarding, preparation, services, completion, payment, release and reuse, career consequences. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CON-02 | Not Implemented | Contracts distinguish classification, format, governing agreement, effective date, service dates, location, episode guarantee, expected appearances, pay basis, compensation, options, exclusivity, billing, publicity, travel, expenses, allowances, overtime, residuals and riders, each only where it applies. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CON-03 | Not Implemented | A contract’s headline value is not cash. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CON-04 | Not Implemented | Episodes ordered are not the player’s guaranteed paid appearances. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CON-05 | Partially Implemented | Track estimated, earned, due, settled, overdue and disputed pay, reimbursements, commission, employer contributions, withholding, residuals and participation. | `src/engine/systems/propay.ts` | `tests/propay.test.ts` | SL: n/a, SV: n/a, RE: n/a, I: partial, T: partial, EB: no | — |
| CON-06 | Not Implemented | Employer contributions never become personal deductions. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CON-07 | Implemented, Verification Incomplete | Money in integer minor units with explicit rounding, currency and conversion dates. | `src/engine/core/money.ts`, `src/engine/core/ledger.ts` | `tests/b20-money-defects.test.ts` | SL: n/a, SV: n/a, RE: n/a, I: partial, T: partial, EB: no | — |
| CON-08 | Implemented, Verification Incomplete | A retried event, an imported record or a notification never deposits twice. Held for US engagements since brief 19; to hold for every new payment kind. | `src/engine/systems/propay.ts` | `tests/propay.test.ts#no payment twice` | SL: n/a, SV: n/a, RE: n/a, I: partial, T: partial, EB: no | — |
| CON-09 | Not Implemented | Residuals have separate entitlement, exploitation, calculation and settlement records. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CON-10 | Not Implemented | Box-office gross is not actor income; a weekly chart update is not a payday. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CON-11 | Not Implemented | Invent no confidential participation terms. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Workflows (27)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| WF-01 | Not Implemented | A distinct workflow: Live-action feature films. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-02 | Not Implemented | A distinct workflow: Independent and studio productions. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-03 | Not Implemented | A distinct workflow: Procedural television. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-04 | Not Implemented | A distinct workflow: Serialized drama. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-05 | Not Implemented | A distinct workflow: Serialized comedy. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-06 | Not Implemented | A distinct workflow: Limited series. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-07 | Not Implemented | A distinct workflow: Anthologies. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-08 | Not Implemented | A distinct workflow: Television movies. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-09 | Not Implemented | A distinct workflow: Single-camera comedy. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-10 | Not Implemented | A distinct workflow: Multicamera comedy. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-11 | Not Implemented | A distinct workflow: Animated films. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-12 | Not Implemented | A distinct workflow: Animated series. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-13 | Not Implemented | A distinct workflow: Dubbing and localization. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-14 | Not Implemented | A distinct workflow: Performance capture. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-15 | Not Implemented | A distinct workflow: Documentary narration. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-16 | Not Implemented | A distinct workflow: Documentary reenactments. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-17 | Not Implemented | A distinct workflow: Musical work. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-18 | Not Implemented | A distinct workflow: Action-heavy work. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-19 | Not Implemented | A distinct workflow: Short films. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-20 | Not Implemented | A distinct workflow: Student-to-professional transition work. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-21 | Not Implemented | Each enabled workflow has real entry points, preparation, work units, player decisions, feedback, completion conditions and consequences: never a new label over a generic activity. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-22 | Not Implemented | Original scenes and exercises, never copied copyrighted scripts. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-23 | Not Implemented | Activities where they apply: objectives, listening and reaction, timing, blocking, continuity, direction changes, takes, recording sessions, vocal preparation, pickups, ADR, choreography, specialist preparation. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-24 | Not Implemented | Track scene and script versions, episode IDs, preparation, work reports, fatigue and performance evidence. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-25 | Not Implemented | Filming order can differ from release order. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-26 | Not Implemented | Stamina, general health and vocal condition distinct where supported, without cosmetic duplicate stats. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| WF-27 | Not Implemented | Safety, accommodations and agreed boundaries affect the workflow; accepting intimate content is never a universal requirement for success. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## World (22)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| GEO-01 | Not Implemented | Extensible country and regional packages sharing one geography and travel system. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-02 | Not Implemented | For each enabled jurisdiction: nationality and immigration status, work permission, sponsor conditions, permit restrictions, employer and location, local time, agreement applicability, working conditions, withholding, required documents. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-03 | Not Implemented | A country coverage matrix. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-04 | Partially Implemented | United States: O-1, F-1 with CPT and OPT, SAG-AFTRA’s agreements. F-1 and OPT since brief 19; O-1 not modeled. (S05, S06, S31, S32, S21) | `src/engine/systems/propay.ts`, `src/engine/systems/permission.ts` | `tests/propay.test.ts#OPT counts an engagement worked` | SL: yes, SV: no, RE: no, I: partial, T: partial, EB: no | — |
| GEO-05 | Not Implemented | United Kingdom: Creative Worker route, Pact and Equity agreements, foreign-entertainer tax. (S02, S104, S17, S18, S19, S29) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| GEO-06 | Not Implemented | Australia: Temporary Activity 408 Entertainment Activities, MEAA agreements, permits, safety, foreign-resident withholding. (S01, S13, S25, S26, S28) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| GEO-07 | Not Implemented | Canada: work permits, ACTRA’s IPA and British Columbia’s separate agreement. (S07, S105, S15, S16) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| GEO-08 | Not Implemented | New Zealand: Entertainers Work Visa and employer support. (S03, S04) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| GEO-09 | Not Implemented | France: talent and salaried-employment routes and their exemptions. (S08, S09) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| GEO-10 | Not Implemented | Japan: the Entertainer working visa. (S10) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| GEO-11 | Not Implemented | India: film visa after shooting permission, and documentary filming. (S11, S12) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| GEO-12 | Not Implemented | Never silently apply US rules worldwide: a jurisdiction without researched rules is an explicit gap and never permission. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-13 | Not Implemented | Travel consumes real elapsed time and accounts for time zones, arrival location, local dates, rest, work readiness, existing commitments and temporary accommodation. (S33) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| GEO-14 | Not Implemented | Connect documents to Papers. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-15 | Not Implemented | Connect income and expenses to Money. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-16 | Partially Implemented | Connect conflicts to the School and the calendar. For New York State work since brief 19. | `src/engine/systems/projobs.ts` | `tests/pro-work.test.ts#clashes with classes` | SL: n/a, SV: n/a, RE: n/a, I: partial, T: partial, EB: no | — |
| GEO-17 | Not Implemented | Connect readiness to the existing condition systems. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-18 | Not Implemented | Connect experience and exposure to the profile and the career. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-19 | Not Implemented | Withholding is not final tax liability, and no worldwide tax is one generic percentage. (S28, S29, S30) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| GEO-20 | Not Implemented | Invent no cancellation fees, clawbacks or termination rights: apply the actual agreement. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-21 | Not Implemented | No impossible simultaneous presence: transit is a state, and an in-person session needs physical presence. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| GEO-22 | Not Implemented | Daylight-saving changes, repeated and skipped local times, and the date line are handled. (S33) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |

## Charts (11)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| CHART-01 | Not Implemented | Keep domestic box office, country or grouped-territory box office, worldwide aggregates, Netflix views, Netflix hours, Nielsen minutes, rank-only charts and linear measurements separate. (S93, S94, S37, S39, S40) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| CHART-02 | Not Implemented | Never combine incompatible units, overlapping territories or mismatched periods. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CHART-03 | Not Implemented | Every snapshot: source, measured interval, publication date, import date, territory, metric, unit, rank, value or explicit unknown, actual/estimate/simulation status, revision, stable title mapping. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CHART-04 | Not Implemented | Three input modes: authorized provider integration, dated imported reference data, labeled save-world simulation. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CHART-05 | Not Implemented | Purchase no data service; public access is not unrestricted reuse. (S108) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| CHART-06 | Not Implemented | Real reference charts stay apart from save-world charts; generated results are never presented as published facts. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CHART-07 | Not Implemented | Display the measured week. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CHART-08 | Not Implemented | Handle stale reports, unavailable figures, rank-only data, partial reports, corrections, outages, revisions and duplicate imports. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CHART-09 | Not Implemented | Unknown is not zero; outside the top ten is not rank eleven. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CHART-10 | Not Implemented | Infer no private retention or completion from public rankings. (S38) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| CHART-11 | Not Implemented | Outside productions give rankings and market context; no autonomous celebrity careers. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Awards (23)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| AWD-01 | Not Implemented | Institution, edition, section or category, eligibility, submission, consideration, selection or nomination, voting or jury, result, recognition. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| AWD-02 | Not Implemented | A named awards inventory: Oscars, Television Academy Emmys, NATAS, International Emmys, BAFTA, Actor Awards, Golden Globes, Spirit Awards, Critics Choice, Gotham, AACTA, César, Goya, Annie Awards. (S42, S43, S44, S45, S46, S47, S48, S49, S50, S51, S52, S53, S54, S55, S56, S57, S58, S59, S60, S61, S62, S63, S64, S92, S106) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| AWD-03 | Not Implemented | A festival inventory: Cannes, Venice, Berlin, Sundance, TIFF, Annecy, IDFA, Busan. (S65, S66, S67, S68, S69, S70, S71, S72, S73, S74, S75, S76, S77) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| AWD-04 | Not Implemented | Extract an edition’s and category’s rules before enabling authoritative eligibility decisions. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| AWD-05 | Not Implemented | Never treat all Emmy organizations as one competition or a festival’s sections as one rulebook. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| AWD-06 | Not Implemented | Store recipient rules, role restrictions, runtime thresholds, territory, qualifying windows, premiere restrictions, submission authority, deadlines and their zones, voting rounds, nominee counts, tie rules, ceremony dates and sources. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| AWD-07 | Not Implemented | Track submission, selection, acceptance and exhibition separately. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| AWD-08 | Not Implemented | Prior selection itself may affect eligibility, not only public screening. (S65) | — | — | SL: yes, SV: no, RE: no, I: no, T: no, EB: no | — |
| AWD-09 | Not Implemented | The player can’t submit or distribute a whole production without the authority. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| AWD-10 | Not Implemented | Use published annual calendars; never reuse a previous year’s date as verified. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| AWD-11 | Not Implemented | Unpublished future rules are unknown or explicitly projected simulation. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| AWD-12 | Not Implemented | Never nominate old work years later unless the actual rule permits it. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-01 | Not Implemented | A functioning anonymous competitive field with stable IDs, simulated strength and exposure, persisted for the competition. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-02 | Not Implemented | Follow published voting structures without claiming knowledge of real private ballots. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-03 | Not Implemented | Outside nominees and winners stay unnamed in every screen and message. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-04 | Not Implemented | The player’s states: ineligible, eligible, not entered, entered, not nominated, nominated, did not win, won, disqualified. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-05 | Not Implemented | A loss says only that the player didn’t win, and the nomination is kept. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-06 | Not Implemented | A win is recorded permanently: award, category, edition, work, performance, eligible recipient status. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-07 | Not Implemented | Being in a Best Picture winner doesn’t make the player its recipient; ensemble conditions apply as written. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-08 | Not Implemented | Attendance doesn’t guarantee victory, and no cash prize is invented. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-09 | Not Implemented | An interactive ceremony and a concise recap of the same settled result. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-10 | Not Implemented | Reloading or changing presentation never changes who won. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| ANON-11 | Not Implemented | Awards influence visibility and access without rewriting contracts, depositing money or guaranteeing another award. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Continuity (9)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| CONT-01 | Not Implemented | Persist applications, auditions, negotiations, contracts, roles, collaborators, scenes, footage, credits, earnings, reception, nominations, awards and relationships. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CONT-02 | Not Implemented | A show’s renewal is separate from the renewal of the player’s engagement. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CONT-03 | Not Implemented | Options, expiration, new offers, conflicts, renegotiation, character exits, reduced orders, cancellation, suspension, delayed release, edited-out performances and revival. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CONT-04 | Not Implemented | Preserve valid completed work and earned compensation through every disruption. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CONT-05 | Not Implemented | A revival creates new engagement and eligibility records and keeps the earlier history. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CONT-06 | Not Implemented | New situations follow from history, changing demands and world state, not shuffled text. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CONT-07 | Partially Implemented | Track recent event signatures and dialogue context to reduce repetition. | `src/engine/systems/projobs.ts` | `tests/pro-work.test.ts#isn’t posted to them again` | SL: n/a, SV: n/a, RE: n/a, I: partial, T: partial, EB: no | — |
| CONT-08 | Not Implemented | Real recurring activities may recur; identical consequence-free loops don’t. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| CONT-09 | Not Implemented | Not every rejection punitive, not every success an instant promotion, not every week a manufactured crisis. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Loop (6)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| LOOP-01 | Implemented, Verification Incomplete | Timestamps and dependencies, never panel-render order. | `src/engine/core/scheduler.ts` | `tests/propay.test.ts#no payment twice` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: partial, EB: no | — |
| LOOP-02 | Not Implemented | Resolve in order: deadlines and responses, calendar obligations, travel and work, earned pay, due settlements, releases, charts, exposure and reception, project decisions, new opportunities, festival and award events, save and recap. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| LOOP-03 | Not Implemented | Important messages arrive with meaningful response windows. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| LOOP-04 | Not Implemented | If Advance crosses an actionable deadline, pause before it or apply an explicitly configured response policy. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| LOOP-05 | Implemented And Verified | Never accept a binding offer automatically to keep time moving. | `src/engine/systems/projobs.ts` | `tests/pro-work.test.ts#an offer not answered lapses` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: yes, EB: no | — |
| LOOP-06 | Not Implemented | Weekly reporting is a presentation interval; renewals, payments and awards keep their own dates. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Interface (8)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| UI-01 | Not Implemented | Natural game language: what happened, what the player can do, what deadline applies, what consequence matters. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| UI-02 | Not Implemented | No developer jargon or formula dumps on ordinary screens. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| UI-03 | Not Implemented | Connected drill-downs: Project, Role, Offer, Contract, Calendar, Work, Pay, Release, Recognition. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| UI-04 | Not Implemented | Back navigation, filters and scroll context preserved. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| UI-05 | Not Implemented | Tutorials explain actual implemented behavior and connections. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| UI-06 | Not Implemented | “Why can’t I accept?” names the real blocker and links to the relevant schedule, document or requirement. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| UI-07 | Not Implemented | Desktop and landscape-phone layout preserved: overflow, alignment, touch targets and help placement fixed. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| UI-08 | Not Implemented | No redundant sidebar destinations reintroduced. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Testing (9)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| TEST-01 | Not Implemented | Measurable acceptance criteria written before tuning. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| TEST-02 | Not Implemented | T01 to T100 mapped to executable tests (the dossier was supplied with the brief, so the scenarios are its own). | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| TEST-03 | Not Implemented | Test layers: unit, cross-engine integration, real UI action, save migration and reload, event replay and idempotency, data-adapter failures and corrections, regression. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| TEST-04 | Not Implemented | Complete playthroughs: newcomer, experienced, maxed skills, mixed genres, low funds, rejected audition, direct offer, international work, scheduling conflict, animation, narration, returning season, cancellation, delayed release, nomination loss, personal award win, eligible ensemble recognition. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| TEST-05 | Not Implemented | At least 100 reproducible lightweight seeds for balance, with fixed seed lists, paired comparisons and separate calibration and verification sets. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| TEST-06 | Not Implemented | Verify: relevant skill helps under matched conditions; irrelevant skill doesn’t dominate; beginners have routes; high skill guarantees nothing unrelated; genre effects aren’t duplicated; money and time stay consistent; history survives reload; no duplicate payments; no impossible simultaneous locations; no invalid award years; no retroactive casting into completed production; no permission silently granted. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| TEST-07 | Not Implemented | Report distributions and failures, not only successes. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| TEST-08 | Not Implemented | Trace representative features: UI, validated command, state or event, downstream consumer, visible result, save and reload. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| TEST-09 | Not Implemented | Fix defects, rerun what they touch, and run the repository gate on the final intended commit; pending tests are never called passed. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Completion (3)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| DONE-01 | Implemented, Verification Incomplete | Resumable checkpoints: completed requirement IDs, remaining work, branch and commit, test commands and results, blockers, next action. | — | `docs/verification/career-world-2026-10-23/CHECKPOINT.md` | SL: n/a, SV: n/a, RE: n/a, I: yes, T: n/a, EB: no | — |
| DONE-02 | Not Implemented | Each genuine external blocker says what is unavailable, what was attempted, what it affects and what honest fallback exists. | — | `docs/verification/career-world-2026-10-23/CHECKPOINT.md` | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| DONE-03 | Not Implemented | The eleven deliverables: tested commit, reviewable changes, register, source registry, catalog counts, test counts, seeds and balance, playthroughs, save evidence, defects and blockers, the loop in plain words. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |

## Scenarios (100)

| ID | Status | Requirement | Where | Tests | Tracks | Blocker |
|---|---|---|---|---|---|---|
| T01 | Not Implemented | Graduate with completed requirements. Expected: correct career status; school history preserved. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T02 | Not Implemented | Attempt early graduation without requirements. Expected: clear refusal; no career bypass. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T03 | Not Implemented | Student receives conflicting paid work. Expected: academic and work-permission checks both evaluated. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T04 | Not Implemented | Update reel after audition submission. Expected: casting retains the submitted version. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T05 | Not Implemented | Agent sends availability inquiry. Expected: reading does not accept. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T06 | Not Implemented | Decline politely. Expected: reason/history retained; no automatic severe punishment. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T07 | Not Implemented | Direct offer. Expected: unnecessary audition skipped, contract not skipped. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T08 | Not Implemented | Audition followed by callback. Expected: correct materials, deadline and prior feedback. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T09 | Not Implemented | Response deadline expires. Expected: one deterministic expiration. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T10 | Not Implemented | Project cancelled before booking. Expected: thread closes; no nonexistent pay. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T11 | Not Implemented | Australia offer with valid permission. Expected: planning proceeds under applicable rules. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T12 | Not Implemented | Australia offer with unresolved permission. Expected: no unauthorized shoot completion. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T13 | Not Implemented | Permission expires during engagement. Expected: correct boundary behavior and valid next steps. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T14 | Not Implemented | UK creative work. Expected: correct route, not an Australian form reused. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T15 | Not Implemented | Missing New Zealand employer support. Expected: conditional/blocked status with explanation. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T16 | Not Implemented | Toronto versus Vancouver. Expected: correct agreement distinction. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T17 | Not Implemented | Short French engagement. Expected: exact exemption conditions, not blanket permission. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T18 | Not Implemented | India documentary versus scripted film. Expected: correct activity classification. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T19 | Not Implemented | Unsupported destination. Expected: explicit research gap, no false verified badge. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T20 | Not Implemented | Multiple nationalities or statuses. Expected: correct person-specific branch. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T21 | Not Implemented | New Haven to Sydney. Expected: positive travel duration and physical-location changes. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T22 | Not Implemented | Date-line crossing. Expected: correct displayed dates and elapsed time. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T23 | Not Implemented | Daylight-saving transition. Expected: no duplicate or skipped scheduled event. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T24 | Not Implemented | Flight delay. Expected: dependent transfer and call reassessed. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T25 | Not Implemented | Missed connection. Expected: rebooking, payer and availability updated. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T26 | Not Implemented | Production extends stay. Expected: lodging, return, permissions and conflicts updated. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T27 | Not Implemented | Remote voice session. Expected: no fictional physical relocation. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T28 | Not Implemented | Overlapping in-person calls. Expected: impossible attendance rejected. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T29 | Not Implemented | Revised call sheet. Expected: old version retained; current schedule authoritative. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T30 | Not Implemented | Local holiday. Expected: applicable calendar and contract consulted. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T31 | Not Implemented | Bad weather at outdoor shoot. Expected: relevant alternative or rescheduling. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T32 | Not Implemented | Rain during indoor recording. Expected: no unjustified identical weather penalty. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T33 | Not Implemented | Missing required safety preparation. Expected: risky activity unavailable; safe next step offered. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T34 | Not Implemented | Original animation. Expected: voice-specific preparation and report. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T35 | Not Implemented | Dubbing. Expected: timing/synchronization choices. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T36 | Not Implemented | Documentary narration. Expected: narration credit, not fictional-character credit. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T37 | Not Implemented | Multicamera versus single-camera comedy. Expected: distinct production workflow. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T38 | Not Implemented | Mixed genres with reordered tags. Expected: identical applicability. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T39 | Not Implemented | Higher relevant skill under matched conditions. Expected: better expected quality across paired runs. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T40 | Not Implemented | High unrelated skill. Expected: no unjustified scene mastery. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T41 | Not Implemented | Fatigue and recovery. Expected: temporary effects separate from permanent skill. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T42 | Not Implemented | Work completed before release. Expected: earnings follow contractual trigger. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T43 | Not Implemented | Payroll retry or reload. Expected: no duplicate money. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T44 | Not Implemented | Foreign-currency payment. Expected: amount, conversion and fees reconcile. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T45 | Not Implemented | Reimbursement versus wages. Expected: separate bases and treatment. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T46 | Not Implemented | Scene cut after work. Expected: earned pay and work history retained. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T47 | Not Implemented | ADR after wrap. Expected: new schedule and contract checks. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T48 | Not Implemented | Release delayed. Expected: reception and award timing updated. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T49 | Not Implemented | Regional release and classification. Expected: territory-specific availability and labels. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T50 | Not Implemented | Netflix views versus Nielsen minutes. Expected: units remain distinct. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T51 | Not Implemented | Festival premiere conflict. Expected: ineligible route explained before the relevant commitment. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T52 | Not Implemented | Short versus feature entry. Expected: correct section rules. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T53 | Not Implemented | Closed entry window. Expected: no ordinary late entry without a supported exception. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T54 | Not Implemented | Award time boundary. Expected: correct edition and deadline time zone. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T55 | Not Implemented | Guest, supporting or lead classification. Expected: rules enforced, no user-selected loophole. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T56 | Not Implemented | Ensemble victory. Expected: only eligible recipients receive recognition. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T57 | Not Implemented | Attend versus skip ceremony. Expected: same result, different attendance history. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T58 | Not Implemented | Renewal without player return. Expected: no automatic contract. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T59 | Not Implemented | Cancellation followed by revival. Expected: earlier obligations/history preserved. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T60 | Not Implemented | Long career and interrupted-save recovery. Expected: no repeated first meetings, rerolls, duplicate threads or lost money. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T61 | Not Implemented | Famous show is not casting. Expected: no invented current vacancy labeled verified. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T62 | Not Implemented | Series renewed without player’s character. Expected: no automatic returning offer. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T63 | Not Implemented | Excellent novice versus famous weak fit. Expected: ability and fit matter; access remains separate. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T64 | Not Implemented | Deadline passes while offer page is open. Expected: acceptance revalidates current state. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T65 | Not Implemented | Higher relevant capability. Expected: better expected performance without forced wins. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T66 | Not Implemented | Mixed genres reordered or duplicated. Expected: no inflation or order dependency. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T67 | Not Implemented | Rank published without number. Expected: rank shown; audience Not Reported. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T68 | Not Implemented | Title leaves Top 10. Expected: no invented rank eleven or zero audience. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T69 | Not Implemented | Weekly and weekend charts. Expected: separate periods, no double counting. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T70 | Not Implemented | Netflix versus Nielsen. Expected: units, territories and periods remain visible. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T71 | Not Implemented | Provider outage. Expected: dated last-valid chart retained. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T72 | Not Implemented | Revised chart. Expected: revision tracked; no duplicate payment. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T73 | Not Implemented | Fictional player film enters market. Expected: derived chart labeled simulated. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T74 | Not Implemented | Unreleased film. Expected: no ordinary released-film box-office revenue. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T75 | Not Implemented | Old series returns to streaming chart. Expected: possible rediscovery without false new-release label. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T76 | Not Implemented | Anonymous award field. Expected: no rival names leak through screens or messages. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T77 | Not Implemented | Entered but not nominated. Expected: correct state, no ceremony-loss record. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T78 | Not Implemented | Nominated but did not win. Expected: nomination preserved; anonymous winner persisted. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T79 | Not Implemented | Award win followed by reload. Expected: one award and one recognition update. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T80 | Not Implemented | Ceremony skipped. Expected: same result; no automatic punishment/disqualification. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T81 | Not Implemented | Outdated performance entered later. Expected: blocked unless a verified rule permits it. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T82 | Not Implemented | Award creates new interest. Expected: schedule and eligibility still apply. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T83 | Not Implemented | Skill rises after completed work. Expected: old performance is not retroactively upgraded. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T84 | Not Implemented | Outside celebrity careers disabled. Expected: rankings and anonymous awards still function. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T85 | Not Implemented | Series renewed, character not returning. Expected: no automatic engagement. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T86 | Not Implemented | Multi-season order with limited guarantee. Expected: player not paid for every ordered episode. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T87 | Not Implemented | Inquiry accepted. Expected: no fabricated contract, salary or binding service. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T88 | Not Implemented | Offer during existing engagement. Expected: conflict visible and explicitly resolved. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T89 | Not Implemented | Option exercised. Expected: correct contract version and conditions. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T90 | Not Implemented | Option expires. Expected: status changes once; no endless hold. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T91 | Not Implemented | Cancellation after completed work. Expected: valid earnings and history survive. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T92 | Not Implemented | Entire performance edited out. Expected: released-performance checks reevaluated separately from wages. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T93 | Not Implemented | Revival years later. Expected: new engagement and award cycle; old history unchanged. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T94 | Not Implemented | Release crosses eligibility boundary. Expected: recalculation using applicable edition rules. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T95 | Not Implemented | Advance crosses reply deadline. Expected: warning or explicit response policy. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T96 | Not Implemented | Payment notice replayed. Expected: no duplicate money. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T97 | Not Implemented | Chart revised. Expected: prior snapshot retained; no duplicate exposure or payments. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T98 | Not Implemented | Excellent acting in unsuccessful production. Expected: execution and skills distinct from commercial outcome. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T99 | Not Implemented | Mixed-genre scene. Expected: relevant demands; no duplicate skill stacking. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
| T100 | Not Implemented | Reload during cancellation/renewal. Expected: same decisions, history and pending obligations. | — | — | SL: n/a, SV: n/a, RE: n/a, I: no, T: no, EB: no | — |
