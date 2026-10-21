#!/usr/bin/env bash
# F1 played again on the tested commit's game (728b4972) with the journeys tool's check 2 pairing two pieces of one title,
# moment and score one to one, into the replay's folders, then the journeys' compare and summary again. Each step's exit
# is appended to runs/exits-F1-again.txt in the repository. Usage: journeys-f1-again19.sh
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
R=/home/user/1221/docs/verification/career-2026-10-20/final-runs/runs
EX="$R/exits-F1-again.txt"
C="$S/f19-JR3"; K="$S/f19-JRC"
cp /home/user/1221/tools/journeys.ts "$C/tools/journeys.ts"; cp /home/user/1221/tools/journeys.ts "$K/tools/journeys.ts"
echo "at $(git -C "$C" rev-parse --short HEAD), $(git -C "$C" status --short --untracked-files=no | wc -l) tracked files uncommitted, $(date -u +%FT%TZ)" > "$EX"
J="$S/f19-journeys-2"; ST="$S/jr19-state-2"
run() { local name="$1" dir="$2"; shift 2; local t0=$(date +%s); (cd "$dir" && "$@") > "$S/f1-again-$name.log" 2>&1; echo "$name exit=$? secs=$(( $(date +%s) - t0 )) cmd: $*" >> "$EX"; }
for n in 1 2 3 4; do run "F1-p$n" "$C" npx vite-node tools/journeys.ts -- --journey F1 --part $n --state "$ST" --out "$J/F1-p$n.json"; done
run journeys-compare "$K" npx vite-node tools/journeys.ts -- --compare "$ST" --out "$J/compare.json"
run journeys-summarize "$K" npx vite-node tools/journeys.ts -- --summarize "$J"
echo "F1 AGAIN DONE $(date -u +%T)" >> "$EX"
