#!/usr/bin/env bash
# Runs the server-function tests with Deno (npm i deno). Usage: supabase/tests/functions/run.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; TMP="$(mktemp -d)"
cp -r "$HERE/../../functions" "$TMP/functions"; mkdir -p "$TMP/tests"; cp "$HERE"/*.ts "$HERE/import_map.json" "$TMP/tests/"
cd "$TMP/tests" && mkdir -p ../supabase && ln -sfn "$TMP/functions" ../supabase/functions
sed -i "s#../../functions/#../functions/#" functions_test.ts
deno test --allow-all --import-map import_map.json functions_test.ts
