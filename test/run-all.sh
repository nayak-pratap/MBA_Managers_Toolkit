#!/usr/bin/env bash
# Runs every suite. Exits non-zero if anything fails.
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
echo "== worked-example verification =="
node test/verify.mjs || fail=1
echo
echo "== DOM render and bad-input handling =="
if node -e 'require("jsdom")' 2>/dev/null; then
  node test/render.mjs || fail=1
else
  echo "   skipped: jsdom not installed (npm i jsdom)"
fi
echo
[ "$fail" -eq 0 ] && echo "ALL SUITES PASSED" || echo "SOME SUITES FAILED"
exit $fail
