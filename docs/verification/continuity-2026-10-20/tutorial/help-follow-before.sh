#!/usr/bin/env bash
# The before build's help-follow, run again on its own (2026-10-20): the first run beside follow17.sh's before had two
# faults of the follow's own, and the second crashed its page when the machine ran out of memory, so this runs alone,
# serving the frozen copy of b84a82cf again on 4301.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/b17
F=$S/e-tutorial-frozen-before
D=$S/e-tutorial/docs/verification/continuity-2026-10-20/tutorial/before
cp "$S/e-tutorial/docs/verification/continuity-2026-10-20/tutorial/help-follow.mjs" "$F/docs/verification/continuity-2026-10-20/tutorial/"
cd "$F" || exit 2
node node_modules/vite/bin/vite.js preview --port 4301 --strictPort > "$S/e-tutorial-work/before/preview3.log" 2>&1 & P=$!; sleep 8
curl -sf http://localhost:4301/ | cmp -s - dist/index.html || { echo "preview-4301 exit=1: not the frozen build" >> "$D/exits.txt"; kill $P; exit 4; }
for w in 1440 390; do
  t0=$(date +%s)
  SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/continuity-2026-10-20/tutorial/help-follow.mjs -- "$S/e-tutorial-work/before/help-follow-$w" "$w" "$S/saves-before" > "$D/help-follow-$w.log" 2>&1; e=$?
  echo "help-follow-$w exit=$e secs=$(( $(date +%s) - t0 )) cmd: (help-follow-before.sh, the frozen copy served alone) SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/continuity-2026-10-20/tutorial/help-follow.mjs -- <scratchpad>/help-follow-$w $w <b17>/saves-before" >> "$D/exits.txt"
  mkdir -p "$D/help-follow-$w"; cp "$S/e-tutorial-work/before/help-follow-$w"/* "$D/help-follow-$w/" 2>/dev/null
done
kill $P
echo "HELP-FOLLOW BEFORE DONE $(date -u +%T)" >> "$D/exits.txt"
