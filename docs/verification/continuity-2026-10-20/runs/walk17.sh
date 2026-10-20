#!/usr/bin/env bash
# Brief 17's after walk (section 11: "inspect representative desktop and mobile screens", "Verify expandable details,
# keyboard navigation, accessibility labels, overflow, and mobile readability"), on a clone at the tested commit: its
# build, served by vite itself; the fifteen scenario saves written on `bbb82253` (the before walk's, `saves-before/`), so
# both walks open the same lives; every screen's text at 1440 and 390 (`tools/text-walk.mjs`), read for what a sentence
# built from parts can get wrong (`tools/text-render-check.mjs`); and every folded detail on Coursework and the Profile
# from the keyboard (`tools/details-check.mjs`). Each step's exit is written straight to a file.
# Usage: walk17.sh <clone> <saves dir> <out dir>
set -u
C="$1"; SAVES="$2"; O="$3"
mkdir -p "$O"
cd "$C" || exit 2
EX="$O/exits.txt"
echo "at $(git rev-parse --short HEAD), $(git status --short --untracked-files=no | wc -l) tracked files uncommitted, $(date -u +%FT%TZ)" > "$EX"
log() { echo "$1 exit=$2 secs=$3" >> "$EX"; }
step() { local name="$1"; shift; local t0=$(date +%s); "$@" > "$O/$name.log" 2>&1; log "$name" $? $(( $(date +%s) - t0 )); }
[ -f dist/index.html ] || step build npm run build
node node_modules/vite/bin/vite.js preview --port 4311 --strictPort > "$O/preview.log" 2>&1 &
P=$!; sleep 6
if ! curl -sf http://localhost:4311/ | cmp -s - dist/index.html; then echo "preview exit=1 not this clone's build" >> "$EX"; kill "$P"; exit 4; fi
for w in 1440 390; do
  step "walk-$w" env SLATE_BASE=http://localhost:4311 node tools/text-walk.mjs "$O/walk-$w" "$w" "$SAVES"
  step "render-$w" node tools/text-render-check.mjs --json "$O/render-$w.json" "$O/walk-$w"
  step "details-$w" env SLATE_BASE=http://localhost:4311 node tools/details-check.mjs "$O/details" "$w" "$SAVES" $(cd "$SAVES" && ls *.json | sort)
done
kill "$P"
echo "DONE $(date -u +%FT%TZ)" >> "$EX"
