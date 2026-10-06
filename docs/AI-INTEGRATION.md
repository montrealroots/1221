# The Built-In Assistant: How Claude Can Be Connected

Researched on 2026-10-01 for requirement 32 of the owner's Final Master Build
Command. Recheck everything here at activation; model ids and prices change.

## What the owner's subscriptions can and can't do

- **A personal Claude subscription can't power the game.** A Pro or Max plan,
  or a Claude Code subscription, is for the owner's own use in Anthropic's
  apps. Anthropic's Consumer Terms don't permit using it, or its OAuth
  tokens, to make API calls for a third-party app, whether for the developer
  or for players. Source: https://www.anthropic.com/legal/consumer-terms. A
  date for enforcement was reported in the press, not found in Anthropic's
  own docs.
- **There is no "Sign in with Claude".** Anthropic offers no OAuth or account
  linking that lets a player bring their own Claude subscription to a
  third-party app.

## The supported way

- **Billing:** the Claude API, with a key from the Claude Console
  (https://platform.claude.com/settings/keys). It is billed per token,
  separately from any subscription.
- **Model:** a cheap, fast model suits an in-game assistant. At the time of
  research that was Claude Haiku 4.5 (`claude-haiku-4-5-20251001`, $1 per
  million input tokens and $5 per million output), with a Sonnet model for
  harder planning. Confirm the current ids and prices at
  https://platform.claude.com/docs/en/about-claude/pricing before activating.
- **Cost controls:**
  - Prompt caching cuts a repeated system prompt to about a tenth of the
    input price.
  - The Console sets daily and monthly spend limits and rate limits.
- **Security:** the key lives server-side only, as a Base44 secret read by a
  Deno function. It never goes in the browser bundle.
- **Shape of the output:** tool use and structured outputs make Claude
  propose actions as JSON against a schema
  (https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview,
  https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

## How SLATE will use it (Stage 14 of `docs/BACKLOG.md`)

1. **Off by default.** Ordinary play never needs it, and the game says so
   when it's unavailable.
2. **Proposals only.** The assistant reads a summary of the player's state
   and returns proposed commands. Each one is validated and run by the engine
   exactly as a button press would be, with the same refusals. It can't
   create money, ownership, qualifications or finished work.
3. **Three roles kept apart:**
   - an explainer and planner;
   - a customization builder, which turns words into a specification that
     the customization system validates;
   - a development assistant, which writes a proposal document for a missing
     mechanic, never code that runs against a save.
4. **Usage controls:** a per-player request cap and a monthly spend ceiling,
   on top of the Console's own limits.

## What the owner needs to do to activate it

1. Create an Anthropic Console account and an API key, and set a spend limit.
2. Accept that player usage is billed per token to that account.
3. Store the key as a Base44 secret.

Nothing is sent to Anthropic until all three are done.

## Built, 2026-10-02: off until the key is set

**Roles, from 2026-10-05.** Ask It To chooses one. *Help You Play*, the default, proposes any listed command. *Help Customize What You Own* is told only the customization commands (`CUSTOMIZE_COMMANDS`: a wrap, a stereo or speakers, tires, clothes and outfits, a lamp, paint, a renovation), each tried and put back like any other. *Propose A New Mechanic For Review* (requirement 57) answers through a second tool, `propose_mechanics`: each mechanic's title, what it would do, why, its sources and the systems it would touch, stored in the `SlateMechanicProposal` entity with status `proposed` for the owner to review. It returns no command, so nothing it says runs or reaches a save. A test checks every command the assistant may propose is one the engine handles.

- **The engine's side** (`src/engine/systems/assistant.ts`): `assistantState` is
  the summary sent (where you are, money, wellbeing, what's on the calendar,
  your garments, outfits, vehicles, homes and contacts), and
  `ASSISTANT_COMMANDS` is the list of commands it may propose, each with its
  payload. `checkProposal` tries each proposal with `Simulation.preview` and
  puts the world back, so the player sees what it would cost, what it would
  say, or the engine's own refusal, before taking it.
- **The server's side** (`base44/functions/askAssistant/entry.js`): signed-in
  players only; sends nothing without `ANTHROPIC_API_KEY`; a daily cap per
  player (`SLATE_ASSISTANT_DAILY`, 40 unless set) counted in the
  `SlateAssistantUsage` entity; the model is `SLATE_ASSISTANT_MODEL`, Claude
  Haiku 4.5 by default; the system prompt is cached; the answer comes back
  through one forced tool, `propose_actions`, and only proposals whose command
  is in the list are returned.
- **The screen** (`src/ui/assistant/Assistant.tsx`): Ask, in the top bar,
  opened by the guide's chapter "The Assistant". Without the server it says
  it isn't available, and nothing else changes.
- **Tests** (`tests/assistant.test.ts`): a proposal leaves the world as it
  was; refusals and the allowlist hold; the function sends nothing without
  the key, returns only listed commands, and stops a player at the cap.

Not built yet: the customization builder and the development assistant
roles. They need the customization system and a review workflow first.
