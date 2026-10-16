#!/usr/bin/env bash
# Brief 10's acting criteria measured, one part at a time, each command's exit recorded (from 2026-10-16).
# Usage: docs/verification/decisions-2026-10-16/measure.sh <out dir> <part>
#   parts: stage, ag, indirect, journeys-a, journeys-b, mono-0..mono-3, mono-merge, l3r, mutations, test-mutations,
#   genres-a, genres-b
# Run from the repository's root. Each part writes its own files, so a container restart costs one part.
set -u
OUT="$1"; PART="$2"
mkdir -p "$OUT"
[ -f "$OUT/exits.txt" ] || echo "at $(git rev-parse --short HEAD), $(git status --short | wc -l) files uncommitted" > "$OUT/exits.txt"
run() {
  local name="$1"; shift
  "$@" > "$OUT/$name.log" 2>&1
  echo "$name exit=$? cmd: $*" | sed "s#$OUT#<out>#g" >> "$OUT/exits.txt"
}
journey() { run "journey-$1-$2" npx vite-node tools/brief-journeys.ts -- --profile "$1" --seed "$2" --days 120 --write "$OUT/journey-$1-$2.json" --trace "$OUT/l3-trace-$1-$2.json"; }
case "$PART" in
  stage) run stage npx vite-node tools/interpretation.ts -- --fresh --stage --out "$OUT/stage.json" --st3 "$OUT/st3.json" --st6 "$OUT/st6.json" ;;
  ag) run ag npx vite-node tools/ag-baseline.ts -- --out "$OUT/ag-baseline.json"; run criteria node tools/ag-criteria.mjs "$OUT/ag-baseline.json"; cp "$OUT/criteria.log" "$OUT/criteria.txt" ;;
  indirect) run indirect npx vite-node tools/h4-indirect.ts -- --out "$OUT/h4-indirect.json" ;;
  journeys-a) for p in beginner developing; do for s in bj-0 bj-1; do journey $p $s; done; done ;;
  journeys-b) for p in specialist generalist; do for s in bj-0 bj-1; do journey $p $s; done; done ;;
  mono-0|mono-1|mono-2|mono-3) k="${PART#mono-}"; run "$PART" npx vite-node tools/monotonicity.ts -- --part "$k" --of 4 --out "$OUT/$PART.json" ;;
  mono-merge) run mono-merge npx vite-node tools/monotonicity.ts -- --merge "$OUT/mono-0.json,$OUT/mono-1.json,$OUT/mono-2.json,$OUT/mono-3.json" --out "$OUT/monotonicity.json" ;;
  l3r) run l3r node tools/l3r.mjs "$OUT" ;;
  mutations) run mutations node tools/judge-mutations.mjs --list docs/verification/decisions-2026-10-16/mutations.json --work "${MUT_WORK:-/tmp/judge-mutations}" --out "$OUT/mutations.json" ;;
  test-mutations) VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 run test-mutations node tools/judge-mutations.mjs --list docs/verification/decisions-2026-10-16/test-mutations.json --work "${MUT_WORK:-/tmp/judge-mutations}" --out "$OUT/test-mutations.json" ;;
  genres-a)
    run signature npx vite-node tools/genre-signature.ts -- --out "$OUT/signature.json"
    run signature-fresh npx vite-node tools/genre-signature.ts -- --fresh --out "$OUT/signature-fresh.json" ;;
  genres-b)
    run signature-validate npx vite-node tools/genre-signature.ts -- --validate --out "$OUT/signature-validate.json"
    run identity npx vite-node tools/genre-identity.ts -- --out "$OUT/genre-identity.json"
    run audit npx vite-node tools/genre-audit.ts -- --out "$OUT/genre-audit.md" ;;
  *) echo "no such part: $PART"; exit 2 ;;
esac
