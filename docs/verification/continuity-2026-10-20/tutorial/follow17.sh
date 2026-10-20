#!/usr/bin/env bash
# Brief 17, section 9, the tutorial area (2026-10-20): the guide followed on this clone's own build, before and after
# the area's changes, as brief 15's follow15b.sh did, and every label a tutorial names looked for on the built app
# (tools/tutorial-routes.mjs). PHASE is before or after. The screenshots stay in the scratchpad; the logs, the results
# and the chapters' text as read are kept here.
# The text walk (tools/text-walk.mjs) of the coordinator's 15 scenario saves at 1440 and 390 is this build's too, for
# tutorial-routes to read; its screens stay in the scratchpad.
#   bash docs/verification/continuity-2026-10-20/tutorial/follow17.sh before|after
# (The before run had no help-follow step: it was run beside it, by hand, on the same frozen build; exits.txt says so.
# entries-read.mjs was written after the before run, and runs in the after run only.)
set -u
PHASE=${1:?before or after}
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/b17
# The build and the code it's read against: the clone, or a copy of it (RUN_IN) frozen at the start so the clone's
# src can change while a run reads the build it was made from.
C=${RUN_IN:-$S/e-tutorial}
D=$S/e-tutorial/docs/verification/continuity-2026-10-20/tutorial/$PHASE
W=$S/e-tutorial-work/$PHASE
EX=$D/exits.txt
mkdir -p "$D" "$W"
cd "$C" || exit 2
node node_modules/vite/bin/vite.js preview --port 4301 --strictPort > "$W/preview.log" 2>&1 & P=$!; sleep 8
curl -sf http://localhost:4301/ | cmp -s - dist/index.html || { echo "preview-4301 exit=1 cmd: not this clone's build" >> "$EX"; kill $P; exit 4; }
echo "preview-4301 exit=0 cmd: the dist/index.html of $C served ($( [ -f FROZEN-FROM.txt ] && echo "a copy of $(cut -c1-8 FROZEN-FROM.txt)" || echo "$(git rev-parse --short HEAD)$(git diff --quiet HEAD -- src || echo ', with src changed in the working tree')" ))" >> "$EX"
for w in 1440 390; do
  t0=$(date +%s)
  SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/editorial-2026-10-19/tutorial/follow.mjs -- "$W/follow-$w" "$w" > "$D/follow-$w.log" 2>&1; e=$?
  echo "follow-$w exit=$e secs=$(( $(date +%s) - t0 )) cmd: SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/editorial-2026-10-19/tutorial/follow.mjs -- <scratchpad>/follow-$w $w" >> "$EX"
  mkdir -p "$D/follow-$w"; cp "$W/follow-$w"/*.txt "$W/follow-$w"/*.json "$D/follow-$w/" 2>/dev/null
done
for w in 1440 390; do
  t0=$(date +%s)
  SLATE_BASE=http://localhost:4301 node tools/text-walk.mjs "$W/walk-$w" "$w" "$S/saves-before" > "$D/walk-$w.log" 2>&1; e=$?
  echo "walk-$w exit=$e secs=$(( $(date +%s) - t0 )) cmd: SLATE_BASE=http://localhost:4301 node tools/text-walk.mjs <scratchpad>/walk-$w $w <b17>/saves-before" >> "$EX"
done
# What follow.mjs doesn't press (help-follow.mjs): the clock while help and the guide are open, every entry's Show Me
# Where and the ways back, an entry's links and sections, the keys and the breadcrumbs.
for w in 1440 390; do
  t0=$(date +%s)
  SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/continuity-2026-10-20/tutorial/help-follow.mjs -- "$W/help-follow-$w" "$w" "$S/saves-before" > "$D/help-follow-$w.log" 2>&1; e=$?
  echo "help-follow-$w exit=$e secs=$(( $(date +%s) - t0 )) cmd: SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/continuity-2026-10-20/tutorial/help-follow.mjs -- <scratchpad>/help-follow-$w $w <b17>/saves-before" >> "$EX"
  mkdir -p "$D/help-follow-$w"; cp "$W/help-follow-$w"/* "$D/help-follow-$w/" 2>/dev/null
done
# Every How This Works entry read word for word with Show Everything pressed (entries-read.mjs, added for the after run):
# its log and results are kept, each entry's text as the dialog showed it stays in the scratchpad.
if [ "$PHASE" = after ]; then
  for w in 1440 390; do
    t0=$(date +%s)
    SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/continuity-2026-10-20/tutorial/entries-read.mjs -- "$W/entries-read-$w" "$S/saves-before" "$w" > "$D/entries-read-$w.log" 2>&1; e=$?
    echo "entries-read-$w exit=$e secs=$(( $(date +%s) - t0 )) cmd: SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/continuity-2026-10-20/tutorial/entries-read.mjs -- <scratchpad>/entries-read-$w <b17>/saves-before $w" >> "$EX"
    mkdir -p "$D/entries-read-$w"; cp "$W/entries-read-$w/log.txt" "$W/entries-read-$w/results.json" "$D/entries-read-$w/" 2>/dev/null
  done
fi
t0=$(date +%s)
SLATE_BASE=http://localhost:4301 npx vite-node tools/tutorial-routes.mjs -- --capture "$W/capture" "$S/saves-before" > "$D/capture.log" 2>&1; e=$?
echo "capture exit=$e secs=$(( $(date +%s) - t0 )) cmd: SLATE_BASE=http://localhost:4301 npx vite-node tools/tutorial-routes.mjs -- --capture <scratchpad>/capture <b17>/saves-before" >> "$EX"
kill $P
t0=$(date +%s)
npx vite-node tools/tutorial-routes.mjs -- "$W/walk-1440" "$W/walk-390" "$W/capture" --out "$D/routes.md" --json "$D/routes.json" --check > "$D/routes.log" 2>&1; e=$?
echo "routes exit=$e secs=$(( $(date +%s) - t0 )) cmd: npx vite-node tools/tutorial-routes.mjs -- <scratchpad>/walk-1440 <scratchpad>/walk-390 <scratchpad>/capture --out routes.md --json routes.json --check" >> "$EX"
echo "FOLLOW17 $PHASE DONE $(date -u +%T)" >> "$EX"
