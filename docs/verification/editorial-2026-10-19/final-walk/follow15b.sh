#!/usr/bin/env bash
# The guide followed again (2026-10-20) on d6f6527a's build (lane A's clone's dist), with follow.mjs from the branch,
# whose bank check had the control's old name. The branch's src and tools are d6f6527a's, so the chapters it reads are
# the build's.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
B=/home/user/1221/docs/verification/editorial-2026-10-19; F=$B/final-follow; EX=$B/final-walk/exits.txt
cd $S/f15b-A || exit 2
node node_modules/vite/bin/vite.js preview --port 4242 --strictPort > "$S/follow15b-preview.log" 2>&1 & P=$!; sleep 6
curl -sf http://localhost:4242/ | cmp -s - dist/index.html || { echo "preview-4242 exit=1 secs=6 cmd: not lane A's build" >> "$EX"; kill $P; exit 4; }
echo "preview-4242 exit=0 secs=6 cmd: lane A's dist/index.html served, for the guide followed again" >> "$EX"
cd /home/user/1221
for w in 1440 390; do
  t0=$(date +%s); SLATE_BASE=http://localhost:4242 npx vite-node docs/verification/editorial-2026-10-19/tutorial/follow.mjs -- "$F/follow-$w" "$w" > "$F/follow-$w.log" 2>&1; e=$?
  line="follow-$w exit=$e secs=$(( $(date +%s) - t0 )) cmd: (in the branch, at $(git rev-parse --short HEAD) with follow.mjs's bank check moved) SLATE_BASE=<lane A's d6f6527a build> npx vite-node docs/verification/editorial-2026-10-19/tutorial/follow.mjs -- final-follow/follow-$w $w"
  echo "$line" >> "$EX"; echo "$line" > "$F/follow-$w-exit.txt"
done
kill $P
echo "FOLLOW DONE $(date -u +%T)"
