#!/usr/bin/env bash
# Brief 15's gate and build (2026-10-20), in a clean clone of the commit that holds every record. The exits are written
# to files straight from the commands, never read through a pipe (CLAUDE.md, rules 6 and 7). Usage: gate15.sh <commit>
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
C=$S/g15; O=$S/g15-out
rm -rf "${C:?}" "${O:?}"; mkdir -p "$O"
git clone -q /home/user/1221 "$C" && git -C "$C" checkout -q "$1" && ln -s /home/user/1221/node_modules "$C/node_modules"
cd "$C" || exit 2
echo "at $(git rev-parse --short HEAD), $(git status --short --untracked-files=no | wc -l) files uncommitted, $(date -u +%FT%TZ)" > "$O/gate.txt"
npm run gate >> "$O/gate.txt" 2>&1
echo "exit=$?" > "$O/gate-exit.txt"
cat "$O/gate-exit.txt" >> "$O/gate.txt"
npm run build > "$O/build.txt" 2>&1
echo "exit=$?" > "$O/build-exit.txt"
echo "GATE DONE $(date -u +%T)" > "$O/done.txt"
