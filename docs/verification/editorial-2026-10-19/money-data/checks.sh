#!/bin/sh
# Brief 15, money-data: the per-batch text checks, each exit read from its own run, never through a pipe that ends early.
# sh docs/verification/editorial-2026-10-19/money-data/checks.sh > <batch>-checks.txt
T=$(mktemp)
for c in "node tools/title-case.mjs --check" "node tools/label-sweep.mjs" "node tools/plural-check.mjs" "node tools/voice-check.mjs --check" "node tools/tics.mjs --check" "node tools/spelling.mjs" "node tools/typos.mjs" "node tools/text-inventory.mjs --check" "node tools/doc-refs.mjs --check" "node tools/deciders.mjs --check" "node tools/guide-quotes.mjs --check" "node tools/research-dates.mjs"; do
  $c > "$T" 2>&1; e=$?
  echo "$c => exit=$e"
  if [ $e -ne 0 ]; then tail -12 "$T"; fi
  case "$c" in *text-inventory*) grep -E "engine-speak hits|holds" "$T" | tail -2;; esac
done
rm -f "$T"
