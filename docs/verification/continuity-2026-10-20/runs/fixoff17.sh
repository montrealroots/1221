#!/usr/bin/env bash
# The incident fix taken out (brief 17, section 10: "For the explicitly authorized incident-continuity fix, explain and test
# the intended behavioral difference separately"): the tested commit with the one condition that makes an apology a
# candidate put back as brief 16 had it, and nothing else. An apology is due again while a classmate's misses outnumber
# the apologies among their last 20 moments (`stoodUp`), where the tested commit asks whether any miss since their last
# apology is uncovered (`missesOwed`). The words stay brief 17's. Then brief 17's 24 students (voices17.sh's list), two at
# a time beside the final lanes. If the fix is the only change to play, these runs are brief 16's game event for event.
# Usage: fixoff17.sh <clone at the tested commit> <out>
set -u
C="$1"; O="$2"; mkdir -p "$O"
cd "$C" || exit 2
F=src/engine/systems/classmates.ts
git checkout -q -- "$F"
python3 - "$F" <<'PY' || exit 3
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
new = "if (owed.length && !recent(mate, 'apology'))"
old = "if ((mateRecord(mate).stoodUp ?? 0) > (personOf(mate).moments ?? []).filter((m) => m.kind === 'apology').length && !recent(mate, 'apology'))"
if s.count(new) != 1: sys.exit(f'the condition is in {p} {s.count(new)} times, not once')
open(p, 'w', encoding='utf-8').write(s.replace(new, old))
PY
git diff > "$O/fix-off.patch"
echo "at $(git rev-parse --short HEAD) with fix-off.patch, $(git status --short --untracked-files=no | wc -l) tracked files changed, $(date -u +%FT%TZ)" > "$O/exits.txt"
one() {
  local name="$1" scen="$2" seed="$3" months="$4"
  local t0=$(date +%s)
  npx vite-node tools/voices.ts -- --scenario "$scen" --seed "$seed" --months "$months" --out "$O/$name.json" > "$O/$name.log" 2>&1
  echo "$name exit=$? secs=$(( $(date +%s) - t0 )) cmd: tools/voices.ts --scenario $scen --seed $seed --months $months" >> "$O/exits.txt"
}
export -f one; export O
{
  for seed in v16-0 v17-1; do for s in attentive underprepared improving regressing skilled pressure practicing tired distant approaches; do echo "$s-$seed $s $seed 14"; done; done
  for s in attentive underprepared distant; do echo "$s-long-v17-2 $s v17-2 26"; done
  echo "newplayer-v17-3 newplayer v17-3 4"
} | xargs -P 2 -L 1 bash -c 'one "$0" "$1" "$2" "$3"'
echo "DONE $(date -u +%FT%TZ)" >> "$O/exits.txt"
