import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { readDirectoryIdentity } from './results.mjs';

test('captures evidence directory device and inode as bigint values', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'lyra-overlay-evidence-identity-'));
  t.after(() => rm(directory, { force: true, recursive: true }));

  const identity = await readDirectoryIdentity(directory);

  assert.equal(typeof identity.device, 'bigint');
  assert.equal(typeof identity.inode, 'bigint');
});
