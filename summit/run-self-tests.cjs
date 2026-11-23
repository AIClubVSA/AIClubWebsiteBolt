#!/usr/bin/env node
/**
 * Runs the Apps Script self-tests (apps-script/Tests.gs) on your computer, with fake data.
 * No dependencies: `node summit/run-self-tests.cjs`
 *
 * Only the pure files are loaded (Config, Logic, Tests), so nothing touches Google.
 * The same tests run inside the Sheet from AI Summit → Run self-tests.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, 'apps-script');
const context = vm.createContext({ console });

// Every .gs file must parse, and they must load together (Apps Script shares one global scope).
const all = vm.createContext({ console });
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.gs')).sort()) {
  vm.runInContext(fs.readFileSync(path.join(dir, file), 'utf8'), all, { filename: file });
}

for (const file of ['Config.gs', 'Logic.gs', 'Tests.gs']) {
  vm.runInContext(fs.readFileSync(path.join(dir, file), 'utf8'), context, { filename: file });
}
const results = vm.runInContext('runSelfTestsCore_()', context);
let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  if (!r.ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} self-tests passed`);
process.exit(failed ? 1 : 0);
