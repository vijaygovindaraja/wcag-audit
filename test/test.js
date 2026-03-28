/**
 * Test runner — executes all test files.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testDir = __dirname;
const testFiles = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.js'))
  .sort();

let totalPassed = 0;
let totalFailed = 0;

for (const file of testFiles) {
  console.log(`\n══ ${file} ══`);
  try {
    execSync(`node ${path.join(testDir, file)}`, { stdio: 'inherit' });
    totalPassed++;
  } catch (e) {
    totalFailed++;
  }
}

console.log(`\n════════════════════════════`);
console.log(`Test suites: ${totalPassed} passed, ${totalFailed} failed`);
process.exit(totalFailed > 0 ? 1 : 0);
