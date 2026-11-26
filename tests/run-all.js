// VALENCY — Unified Automated Test Runner
// Runs all standalone Node/Stage suites in tests/ and optionally triggers Playwright E2E tests.
// Usage:
//   node tests/run-all.js            (Node unit/integration suites)
//   node tests/run-all.js --e2e      (Node suites + Playwright E2E suite)
//   node tests/run-all.js --verbose  (Stream full output from every suite)
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TESTS_DIR = __dirname;
const args = new Set(process.argv.slice(2));
const runE2E = args.has('--e2e') || args.has('--all');
const verbose = args.has('--verbose') || args.has('-v');

function discoverNodeSuites() {
  return fs
    .readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith('_test.js') || f.endsWith('.test.js'))
    .sort();
}

function runCommand(label, cmd, cmdArgs, options = {}) {
  const started = Date.now();
  const res = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: Boolean(options.shell),
    stdio: verbose ? 'inherit' : 'pipe',
  });
  const ms = Date.now() - started;
  const ok = res.status === 0 && !res.error;
  return {
    label,
    ok,
    status: res.status,
    ms,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    error: res.error ? res.error.message : null,
  };
}

function main() {
  const suites = discoverNodeSuites();
  console.log(`\n=== VALENCY Unified Test Runner (${suites.length} Node suites${runE2E ? ' + Playwright E2E' : ''}) ===\n`);

  const results = [];
  for (const file of suites) {
    const absPath = path.join(TESTS_DIR, file);
    if (verbose) console.log(`\n--- Running ${file} ---`);
    const r = runCommand(file, process.execPath, [absPath]);
    results.push(r);
    const badge = r.ok ? 'PASS' : 'FAIL';
    console.log(`  [${badge}] ${file} (${r.ms}ms)`);
    if (!r.ok && !verbose) {
      if (r.error) console.error(`    Error: ${r.error}`);
      const combined = `${r.stdout}\n${r.stderr}`.trim();
      const tail = combined.split(/\r?\n/).slice(-25).join('\n');
      if (tail) console.error(tail.replace(/^/gm, '    '));
    }
  }

  if (runE2E) {
    console.log('\n--- Running Playwright E2E Suite ---');
    const pwCli = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
    const e2e = runCommand('Playwright E2E (tests/e2e)', process.execPath, [pwCli, 'test']);
    results.push(e2e);
    const badge = e2e.ok ? 'PASS' : 'FAIL';
    console.log(`  [${badge}] ${e2e.label} (${e2e.ms}ms)`);
    if (!verbose) {
      if (e2e.stdout.trim()) console.log(e2e.stdout.trim());
      if (!e2e.ok && e2e.stderr.trim()) console.error(e2e.stderr.trim());
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  const totalMs = results.reduce((sum, r) => sum + r.ms, 0);

  console.log('\n=======================================================');
  console.log(`  TOTAL: ${passed} passed, ${failed} failed (${(totalMs / 1000).toFixed(2)}s)`);
  console.log('=======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main();
