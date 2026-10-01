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
