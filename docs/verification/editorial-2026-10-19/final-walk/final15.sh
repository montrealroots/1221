#!/usr/bin/env bash
# Brief 15's final walk and the guide followed (2026-10-20), on the tested commit's build: lane A's clone of the tested
# commit, its dist and its scenario saves (runs15.sh A). Each step's exit is recorded in final-walk/exits.txt, and a step
# already passed on this commit is skipped when it's started again (the container restarts).
# Usage: final15.sh
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
C=$S/f15b-A; SV=$S/f15b-A-work/saves
B=/home/user/1221/docs/verification/editorial-2026-10-19
W=$B/final-walk; F=$B/final-follow
mkdir -p "$W" "$F"
cd "$C" || exit 2
EX=$W/exits.txt
[ -f "$EX" ] || echo "at $(git rev-parse --short HEAD), $(git status --short --untracked-files=no | wc -l) tracked files uncommitted, $(date -u +%FT%TZ)" > "$EX"
grep -q "^at $(git rev-parse --short HEAD)," "$EX" || { echo "$EX is from another commit" >&2; exit 3; }
done_() { grep -q "^$1 exit=0 " "$EX"; }
log() { echo "$1 exit=$2 secs=$3 cmd: ${*:4}" >> "$EX"; }
run() { local name="$1" lf="$2"; shift 2; done_ "$name" && return 0; local t0=$(date +%s); "$@" > "$lf" 2>&1; local e=$?; log "$name" $e $(( $(date +%s) - t0 )) "$@"; return $e; }
node node_modules/vite/bin/vite.js preview --port 4241 --strictPort > "$S/final15-preview.log" 2>&1 & P=$!; sleep 6
if kill -0 "$P" 2>/dev/null && curl -sf http://localhost:4241/ | cmp -s - dist/index.html; then log preview-4241 0 6 "this clone's dist/index.html served"; else log preview-4241 1 6 "not this clone's build"; kill "$P"; exit 4; fi
export SLATE_BASE=http://localhost:4241
for w in 1440 390; do run "walk-$w" "$W/walk-$w.log" node tools/text-walk.mjs "$W/$w" "$w" "$SV"; done
run omissions "$W/omissions.log" node tools/text-omissions.mjs "$W/omissions.json" "$W/1440" "$W/390"
for w in 1440 390; do
  run "follow-$w" "$F/follow-$w.log" npx vite-node docs/verification/editorial-2026-10-19/tutorial/follow.mjs -- "$F/follow-$w" "$w"
  grep "^follow-$w exit=" "$EX" | tail -1 > "$F/follow-$w-exit.txt"
done
run follow-saves "$F/follow-saves.log" node docs/verification/editorial-2026-10-19/tutorial/follow-saves.mjs "$F/follow-saves" "$SV"
kill "$P"
echo "DONE $(date -u +%FT%TZ)" >> "$EX"
