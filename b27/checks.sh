#!/usr/bin/env bash
# The gate's 24 checks after validate, each run on its own, reporting failures only.
cd /home/user/1221
fail=0
for c in "node tools/title-case.mjs --check" "node tools/label-sweep.mjs" "node tools/plural-check.mjs" "node tools/voice-check.mjs --check" "node tools/tics.mjs --check" "node tools/doc-refs.mjs --check" "node tools/wired.mjs --check" "node tools/deciders.mjs --check" "node tools/spelling.mjs" "node tools/typos.mjs" "npx vite-node tools/geo-check.mjs" "node tools/inventory.mjs --check" "node tools/devmap.mjs --check" "node tools/traceability.mjs" "node tools/capabilities.mjs --check" "node tools/coverage.mjs --check" "node tools/student-matrix.mjs --check" "node tools/text-inventory.mjs --check" "node tools/guide-quotes.mjs --check" "node tools/surfaces.mjs --check" "node tools/effects.mjs --check" "node tools/career-register.mjs --check" "node tools/completion-matrix.mjs --check" "node tools/sweep.mjs --check"; do
  out=$($c 2>&1); code=$?
  if [ $code -ne 0 ]; then fail=$((fail+1)); echo "[$code] $c"; echo "$out" | tail -n 8; fi
done
echo "checks failing: $fail of 24"
