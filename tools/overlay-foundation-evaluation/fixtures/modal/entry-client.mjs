import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import axe from 'axe-core';

import { createModalCandidate } from '../../candidates/modal/adapter.mjs';
import { installModalResourceTracker, mountModalFixtureClient } from './runtime.mjs';

const request = globalThis.__LYRA_MODAL_FIXTURE_REQUEST__;
const tracker = installModalResourceTracker(globalThis);
try {
  globalThis.__LYRA_MODAL_FIXTURE__ = await mountModalFixtureClient({
    React,
    axe,
    createModalCandidate,
    createRoot,
    document,
    hydrateRoot,
    request,
  });
} catch (error) {
  globalThis.__LYRA_MODAL_FIXTURE__ = {
    readyStatus: 'failed',
    mountError: error instanceof Error ? error.message : String(error),
    async cleanup() {
      tracker.restore();
      return { status: 'destroyed' };
    },
  };
  throw error;
}
