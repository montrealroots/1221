#!/usr/bin/env bash
# Brief 17's students (tools/voices.ts, section 10), in a clone at a commit, written to one folder. The same runs before
# (bbb82253, brief 16 as merged) and after: brief 16's seven and brief 17's four, on two seeds for fourteen months; three
# of them for twenty-six months on a third; and a new life's first four months. Each run's exit is written straight to a
# file. Usage: voices17.sh <clone> <out>
set -u
C="$1"; O="$2"; mkdir -p "$O"
cd "$C" || exit 2
echo "at $(git rev-parse --short HEAD), $(git status --short --untracked-files=no | wc -l) tracked files changed, $(date -u +%FT%TZ)" > "$O/exits.txt"
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
} | xargs -P 4 -L 1 bash -c 'one "$0" "$1" "$2" "$3"'
echo "DONE $(date -u +%FT%TZ)" >> "$O/exits.txt"
