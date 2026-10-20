#!/usr/bin/env bash
# The second trial (not a record): d6f6527a's tree, the forecast back to a tenth; the runs that read it.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
T=$S/try15; W=$S/try15-work; V=$S/try15b-work; mkdir -p $V; cd $T
npm run build > $V/build.log 2>&1; echo "build exit=$?"
node node_modules/vite/bin/vite.js preview --port 4232 --strictPort > $V/preview.log 2>&1 & P=$!; sleep 6
curl -sf http://localhost:4232/ | cmp -s - dist/index.html && echo "preview is this build" || { echo "preview not this build"; kill $P; exit 4; }
( SLATE_BASE=http://localhost:4232 node tools/acceptance-ui.mjs $V/acc-390 390 $W/saves > $V/acc-390.log 2>&1; echo "acceptance-390 exit=$?" ) & A1=$!
( for p in normal setback; do for w in 390 1440; do SLATE_BASE=http://localhost:4232 node tools/playthroughs-ui.mjs $p $w $W/ui-saves $V/ui > $V/ui-$p-$w.log 2>&1; echo "ui-$p-$w exit=$?"; done; done ) & U=$!
wait $A1 $U
kill $P
echo "TRY DONE"
