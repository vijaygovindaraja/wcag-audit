/**
 * Tests for CLI argument parsing and command routing.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLI_PATH = path.join(__dirname, '..', 'src', 'cli.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function runCli(args) {
  try {
    const output = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf-8',
      timeout: 10000,
      env: { ...process.env, NODE_ENV: 'test' },
    });
    return { code: 0, output };
  } catch (e) {
    return { code: e.status, output: e.stdout || '', stderr: e.stderr || '' };
  }
}

// Version flag
console.log('\nCLI version:');

const version = runCli('--version');
assert(version.code === 0, '--version exits with code 0');
assert(version.output.trim().match(/^\d+\.\d+\.\d+$/), '--version outputs semver');

// Help flag
console.log('\nCLI help:');

const help = runCli('--help');
assert(help.code === 0, '--help exits with code 0');
assert(help.output.includes('scan'), 'help includes scan command');
assert(help.output.includes('crawl'), 'help includes crawl command');

// Scan help
const scanHelp = runCli('scan --help');
assert(scanHelp.code === 0, 'scan --help exits with code 0');
assert(scanHelp.output.includes('--level'), 'scan help includes --level option');
assert(scanHelp.output.includes('--format'), 'scan help includes --format option');
assert(scanHelp.output.includes('--output'), 'scan help includes --output option');
assert(scanHelp.output.includes('--viewport'), 'scan help includes --viewport option');

// Crawl help
const crawlHelp = runCli('crawl --help');
assert(crawlHelp.code === 0, 'crawl --help exits with code 0');
assert(crawlHelp.output.includes('--max-pages'), 'crawl help includes --max-pages option');

// Missing URL argument
console.log('\nCLI error handling:');

const noUrl = runCli('scan');
assert(noUrl.code !== 0, 'scan without URL exits with non-zero code');

// Invalid command
const invalid = runCli('invalid-command');
assert(invalid.code !== 0 || invalid.stderr.length > 0 || invalid.output.includes('help'), 'invalid command shows error or help');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
