#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  collectBaseline,
  createComparison,
  validateComparisonArtifacts,
  writeComparisonArtifacts,
} from '../bundle-baseline/measure.mjs';
import {
  collectRuntimeEvidence,
  validateRuntimeArtifacts,
  validateRuntimeEvidence,
  writeRuntimeArtifacts,
} from './measure.mjs';

const TOOL_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY = resolve(TOOL_DIRECTORY, '..', '..');
const BASELINE_ROOT = join(REPOSITORY, 'docs', 'superpowers', 'baselines', 'lyra-v1');
const COMPARISON_DIRECTORY = join(BASELINE_ROOT, 'comparisons', 'file-upload');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: REPOSITORY, encoding: 'utf8' });
  if (result.error) throw new Error(`could not run ${command}: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited ${result.status}\n${result.stdout}\n${result.stderr}`.trim(),
    );
  }
  return result.stdout.trim();
}

function ensureClean() {
  const dirty = run('git', ['status', '--porcelain']);
  if (dirty) throw new Error(`refusing evidence collection from a dirty worktree:\n${dirty}`);
}

function artifactPaths(revision) {
  return {
    comparisonJson: join(COMPARISON_DIRECTORY, `${revision}.json`),
    comparisonMarkdown: join(COMPARISON_DIRECTORY, `${revision}.md`),
    runtimeJson: join(COMPARISON_DIRECTORY, `${revision}-runtime.json`),
    runtimeMarkdown: join(COMPARISON_DIRECTORY, `${revision}-runtime.md`),
  };
}

function assertTargetsAbsent(paths) {
  const existing = Object.values(paths).filter(existsSync);
  if (existing.length > 0) {
    throw new Error(`refusing to overwrite immutable FileUpload evidence: ${existing.join(', ')}`);
  }
}

export function validateEvidencePair({ headRevision, bundle, runtime }) {
  if (bundle.revision !== headRevision || runtime.revision !== headRevision) {
    throw new Error(
      `evidence revision mismatch: bundle=${bundle.revision}, runtime=${runtime.revision}, HEAD=${headRevision}`,
    );
  }
  const bundleReactSha = bundle.environment.packages['@lyra-ds/react']?.sha256;
  if (bundleReactSha !== runtime.environment.reactArtifact.sha256) {
    throw new Error(
      `packed React artifact mismatch: bundle=${bundleReactSha}, runtime=${runtime.environment.reactArtifact.sha256}`,
    );
  }
  const bundleStylesSha = bundle.environment.packages['@lyra-ds/styles']?.sha256;
  if (bundleStylesSha !== runtime.environment.stylesArtifact.sha256) {
    throw new Error(
      `packed Styles artifact mismatch: bundle=${bundleStylesSha}, runtime=${runtime.environment.stylesArtifact.sha256}`,
    );
  }
}

export async function collectFileUploadEvidence({
  collectBundles = collectBaseline,
  collectRuntime = collectRuntimeEvidence,
  clean = ensureClean,
  headRevision = run('git', ['rev-parse', 'HEAD']),
  before = JSON.parse(readFileSync(join(BASELINE_ROOT, 'bundles.json'), 'utf8')),
  paths = artifactPaths(headRevision),
} = {}) {
  clean();
  assertTargetsAbsent(paths);
  const after = await collectBundles({ exactCommand: 'pnpm evidence:file-upload' });
  const comparison = createComparison('file-upload', before, after);
  if (after.revision !== headRevision) {
    throw new Error(`bundle revision mismatch: expected ${headRevision}, actual ${after.revision}`);
  }
  if (comparison.result !== 'pass') {
    throw new Error(
      `bundle budgets failed: React ${comparison.budgets.reactFileUploadAbsolute.actualBytes}/8000 B; affected deltas ${comparison.budgets.complexDelta.entries.map((entry) => `${entry.name}=${entry.deltaBytes}`).join(', ')}`,
    );
  }

  clean();
  const runtime = validateRuntimeEvidence(
    await collectRuntime({ exactCommand: 'pnpm evidence:file-upload' }),
  );
  validateEvidencePair({ headRevision, bundle: after, runtime });
  clean();
  assertTargetsAbsent(paths);

  await writeComparisonArtifacts(comparison, paths);
  await writeRuntimeArtifacts(runtime, paths);
  await validateComparisonArtifacts(paths);
  await validateRuntimeArtifacts(paths);
  return { comparison, paths, runtime };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 2) {
    console.error('usage: node tools/file-upload-performance/evidence.mjs');
    process.exitCode = 1;
  } else {
    collectFileUploadEvidence()
      .then(({ comparison }) => {
        console.log(
          `Wrote four immutable FileUpload evidence peers for ${comparison.after.revision}.`,
        );
      })
      .catch((error) => {
        console.error(`file-upload-evidence FAILED: ${error.message}`);
        process.exitCode = 1;
      });
  }
}
