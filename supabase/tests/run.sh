#!/usr/bin/env bash
# Runs the database rule tests on a throwaway local PostgreSQL. Usage: supabase/tests/run.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PORT="${PGTEST_PORT:-5544}"; HOST="${PGTEST_HOST:-/tmp}"; DB="lt_test"
psql() { command psql -h "$HOST" -p "$PORT" -v ON_ERROR_STOP=1 -q "$@"; }
psql -d postgres -c "drop database if exists $DB" -c "create database $DB"
psql -d $DB -f "$HERE/stubs.sql"
psql -d $DB -f "$HERE/../migrations/001_init.sql"
psql -d $DB -f "$HERE/../migrations/003_grants.sql" 2>&1 | grep -v "does not exist" || true
psql -d $DB -f "$HERE/../migrations/004_light_none.sql"
psql -d $DB -f "$HERE/../migrations/005_security_fixes.sql"
psql -d $DB -f "$HERE/rules_test.sql" 2>&1 | grep -E "PASS|FAIL|ERROR|ALL DATABASE" | sed -E "s/^psql:[^ ]+ NOTICE:\s+//"
