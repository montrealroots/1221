#!/usr/bin/env bash
# A trial of lanes A and UI on the working tree (not a record): the build, the saves, the acceptance walk and the playthroughs.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
T=$S/try15; W=$S/try15-work; mkdir -p $W/ui-saves; cd $T
npm run build > $W/build.log 2>&1; echo "build exit=$?"
node tools/scenario-saves.mjs $W/saves > $W/saves.log 2>&1; echo "saves exit=$?"
for sc in workload specialist roundups brief health; do npx vite-node tools/scenarios.ts -- --scenario $sc --seed sc-0 --save "$W/ui-saves/$sc.json" > $W/ui-save-$sc.log 2>&1; echo "ui-save-$sc exit=$?"; done
node node_modules/vite/bin/vite.js preview --port 4231 --strictPort > $W/preview.log 2>&1 & P=$!; sleep 6
curl -sf http://localhost:4231/ | cmp -s - dist/index.html && echo "preview is this build" || { echo "preview not this build"; kill $P; exit 4; }
( SLATE_BASE=http://localhost:4231 node tools/acceptance-ui.mjs $W/acc-1440 1440 $W/saves > $W/acc-1440.log 2>&1; echo "acceptance-1440 exit=$?" ) & A1=$!
( SLATE_BASE=http://localhost:4231 node tools/acceptance-ui.mjs $W/acc-390 390 $W/saves > $W/acc-390.log 2>&1; echo "acceptance-390 exit=$?" ) & A2=$!
( for p in normal setback specialist banking document health; do for w in 1440 390; do SLATE_BASE=http://localhost:4231 node tools/playthroughs-ui.mjs $p $w $W/ui-saves $W/ui > $W/ui-$p-$w.log 2>&1; echo "ui-$p-$w exit=$?"; done; done ) & U=$!
wait $A1 $A2 $U
kill $P
echo "TRY DONE"
