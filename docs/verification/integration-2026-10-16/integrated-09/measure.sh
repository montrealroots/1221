#!/usr/bin/env bash
# Brief 09's criteria measured on the integrated tree, one command after another, each exit recorded.
# Usage: measure-integrated.sh <clone> <out>
set -u
cd "$1" || exit 2
OUT="$2"
mkdir -p "$OUT"
echo "at $(git rev-parse --short HEAD), $(git status --short | wc -l) files uncommitted" > "$OUT/exits.txt"
run() {
  local name="$1"; shift
  local t0=$(date +%s)
  "$@" > "$OUT/$name.log" 2>&1
  local code=$?
  echo "$name exit=$code secs=$(( $(date +%s) - t0 )) cmd: $*" >> "$OUT/exits.txt"
}
run stage npx vite-node tools/interpretation.ts -- --fresh --stage --out "$OUT/stage.json"
run ag npx vite-node tools/ag-baseline.ts -- --out "$OUT/ag-baseline.json"
run criteria node tools/ag-criteria.mjs "$OUT/ag-baseline.json"
cp "$OUT/criteria.log" "$OUT/criteria.txt"
run journey-specialist npx vite-node tools/brief-journeys.ts -- --profile specialist --seed bj-0 --days 120 --write "$OUT/journey-specialist-bj-0.json" --trace "$OUT/l3-trace-specialist-bj-0.json"
run journey-beginner npx vite-node tools/brief-journeys.ts -- --profile beginner --seed bj-0 --days 120 --write "$OUT/journey-beginner-bj-0.json" --trace "$OUT/l3-trace-beginner-bj-0.json"
run signature npx vite-node tools/genre-signature.ts -- --out "$OUT/signature.json"
run signature-fresh npx vite-node tools/genre-signature.ts -- --fresh --out "$OUT/signature-fresh.json"
run signature-validate npx vite-node tools/genre-signature.ts -- --validate --out "$OUT/signature-validate.json"
run identity npx vite-node tools/genre-identity.ts -- --out "$OUT/genre-identity.json"
run audit npx vite-node tools/genre-audit.ts -- --out "$OUT/genre-audit.md"
run genre-pairs npx vite-node tools/genre-pairs.ts -- --json "$OUT/genre-pairs-all.json"
echo DONE >> "$OUT/exits.txt"
