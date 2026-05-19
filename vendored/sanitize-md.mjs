#!/usr/bin/env node
// Thin CLI shim for the vendored sanitizer pipeline.
//
// Usage:
//   node vendored/sanitize-md.mjs <file1> [<file2> ...]
//
// Loads the vendored sanitizer surface (synced daily from
// `j0KZ/jkz_Multi-Agent_System:skills/wiki-generator/src/sanitizers/`)
// and runs `composeAll` against each file's content. Exits non-zero on
// the first file that triggers a secret hit, otherwise exits 0.
//
// Why a shim?
//   The sanitizer module is a library (ESM exports only, no CLI). The
//   shim lives OUTSIDE `vendored/sanitizers/` so that the daily sync
//   (`rsync -a --delete`) does not wipe it.
//
// Exit codes:
//   0 -- no files supplied OR all files clean
//   3 -- a file was unreadable / IO error
//   EXIT_SECRET_DETECTED (42) -- at least one file contained a secret hit
//                                 (value re-exported from secret_sanitizer.js)

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  composeAll,
  EXIT_SECRET_DETECTED,
} from './sanitizers/index.js';

async function main() {
  const args = process.argv.slice(2).filter((a) => a.length > 0);
  if (args.length === 0) {
    // No changed .md files -- treat as success. The workflow gates this
    // with `if [ -s changed.txt ]` already, but be defensive.
    console.log('sanitize-md: no files supplied, exiting clean');
    return 0;
  }

  let secretHit = false;
  let scanned = 0;
  const findings = [];

  for (const arg of args) {
    const absPath = resolve(arg);
    let content;
    try {
      content = await readFile(absPath, 'utf8');
    } catch (err) {
      // Narrow exception: ENOENT/EACCES/EISDIR all surface here. We log
      // and abort with code 3 so CI surfaces an actionable failure rather
      // than a silent skip.
      console.error(
        `sanitize-md: cannot read ${absPath}: ${err.code || 'IO_ERROR'} ${err.message}`,
      );
      return 3;
    }

    let result;
    try {
      result = composeAll(content, { path: absPath });
    } catch (err) {
      // TypeError from composeAll means the shim called the API wrong --
      // that is a bug, not a user-facing CI failure. Surface it loudly.
      console.error(
        `sanitize-md: composeAll threw for ${absPath}: ${err.message}`,
      );
      return 3;
    }

    scanned += 1;
    const secretStage = result.report.stages.find((s) => s.name === 'secret');
    if (secretStage && secretStage.found) {
      secretHit = true;
      findings.push({
        file: absPath,
        matchCount: secretStage.matchCount,
      });
    }
  }

  if (secretHit) {
    console.error(
      `sanitize-md: SECRET DETECTED in ${findings.length}/${scanned} file(s):`,
    );
    for (const f of findings) {
      console.error(`  - ${f.file} (${f.matchCount} match(es))`);
    }
    return EXIT_SECRET_DETECTED;
  }

  console.log(`sanitize-md: scanned ${scanned} file(s), all clean`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`sanitize-md: unexpected error: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
